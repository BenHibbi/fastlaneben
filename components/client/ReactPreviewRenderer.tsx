'use client'

import { useState, useEffect, useRef } from 'react'
import { Monitor, Smartphone, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import type { Client } from '@/types/database'

const DESKTOP_HEIGHT = 900

interface ReactPreviewRendererProps {
  client: Client
  onRequestRevision: () => void
}

interface PreviewData {
  id: string
  version: number
  sanitizedCode: string
  createdAt: string
}

export function ReactPreviewRenderer({
  client,
  onRequestRevision
}: ReactPreviewRendererProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPreview()
  }, [client.id])

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 32) // minus padding
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const fetchPreview = async () => {
    try {
      const res = await fetch(`/api/react-preview?clientId=${client.id}`)
      const data = await res.json()

      console.log('Preview API response:', data)

      if (data.preview) {
        console.log('Preview sanitizedCode length:', data.preview.sanitizedCode?.length || 0)
        setPreview(data.preview)
      }
    } catch (err) {
      console.error('Failed to fetch preview:', err)
      setError('Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          <p className="mt-4 text-slate-500">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (!preview) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Monitor className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Preview Coming Soon
          </h3>
          <p className="text-slate-500 text-center max-w-md">
            Our team is working on your website preview. You&apos;ll be notified when it&apos;s ready for review.
          </p>
        </div>
      </div>
    )
  }

  // Clean up code that might have slipped through sanitization
  const cleanCode = (code: string) => {
    return code
      // Remove any remaining import/export statements
      .replace(/^import\s+.*?;?\s*$/gm, '')
      .replace(/^export\s+(default\s+)?/gm, '')
      .replace(/exports\.\w+\s*=\s*/g, '')
      .replace(/module\.exports\s*=\s*/g, '')
      // Remove "use client" directive
      .replace(/['"]use client['"];?\s*/g, '')
      // Remove TypeScript type annotations that might remain
      .replace(/:\s*(React\.)?FC\s*(<[^>]*>)?/g, '')
      .replace(/:\s*\w+(\[\])?\s*(?=[,\)\=])/g, '')
      // Remove markdown code blocks if present
      .replace(/```(jsx?|tsx?|javascript|typescript)?\n?/g, '')
      .replace(/```\s*$/g, '')
      .trim()
  }

  const cleanedCode = cleanCode(preview.sanitizedCode)

  // Create the HTML content for the iframe
  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=${viewport === 'desktop' ? containerWidth || 1440 : 375}, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style>
          body { margin: 0; font-family: system-ui, sans-serif; }
          #root { min-height: 100vh; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          // React hooks shortcuts
          const { useState, useEffect, useRef, useCallback, useMemo } = React;

          ${cleanedCode}

          // Try to render the Preview component
          try {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<Preview />);
          } catch (e) {
            console.error('Preview render error:', e);
            document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red; font-family: monospace;"><strong>Error rendering preview:</strong><br/>' + e.message + '</div>';
          }
        </script>
      </body>
    </html>
  `

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-slate-900">
            Website Preview
            <span className="ml-2 text-xs text-slate-400">v{preview.version}</span>
          </h3>
          <p className="text-sm text-slate-500">
            Review your website and request changes if needed
          </p>
        </div>

        {/* Viewport toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-2 rounded-md transition-colors ${
              viewport === 'desktop'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-2 rounded-md transition-colors ${
              viewport === 'mobile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview iframe - full width for desktop, centered mobile */}
      <div ref={containerRef} className="bg-slate-100 p-4 overflow-hidden">
        {viewport === 'desktop' ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <iframe
              srcDoc={iframeContent}
              className="w-full border-0"
              style={{ height: DESKTOP_HEIGHT }}
              sandbox="allow-scripts"
              title="Website Preview"
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden w-[375px]">
              <iframe
                srcDoc={iframeContent}
                className="w-full border-0"
                style={{ height: '667px' }}
                sandbox="allow-scripts"
                title="Website Preview"
              />
            </div>
          </div>
        )}
      </div>

      {/* Revision stats */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="text-slate-500">Round</span>
            <span className="ml-1 font-medium text-slate-900">
              {client.revision_round || 1} of 2
            </span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">Changes remaining</span>
            <span className="ml-1 font-medium text-slate-900">
              {10 - (client.revision_modifications_used || 0)} of 10
            </span>
          </div>
        </div>

        <button
          onClick={onRequestRevision}
          className="w-full py-3 px-4 bg-[#C3F53C] text-slate-900 rounded-xl font-medium hover:bg-[#b5e636] transition-colors"
        >
          Request Changes
        </button>
      </div>
    </div>
  )
}
