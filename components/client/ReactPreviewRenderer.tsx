'use client'

import { useState, useEffect, useRef } from 'react'
import { Monitor, Smartphone, Loader2 } from 'lucide-react'
import { PREVIEW_CONFIG, REVISION_CONFIG } from '@/lib/config'
import type { Client } from '@/types/database'

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
        setContainerWidth(containerRef.current.offsetWidth - 32)
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

      if (data.preview) {
        setPreview(data.preview)
      }
    } catch (err) {
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

  const viewportWidth = viewport === 'desktop' ? containerWidth || 1440 : PREVIEW_CONFIG.MOBILE_WIDTH
  const previewScript = preview.sanitizedCode

  // Create the HTML content for the iframe with Babel standalone for client-side compilation
  // This is more tolerant of syntax variations than server-side esbuild
  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=${viewportWidth}, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="
          default-src 'none';
          script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com;
          style-src 'unsafe-inline' https://fonts.googleapis.com;
          style-src-elem 'unsafe-inline' https://fonts.googleapis.com;
          img-src data: https:;
          font-src https://fonts.gstatic.com https:;
          connect-src 'none';
          frame-src 'none';
          object-src 'none';
          base-uri 'none';
          form-action 'none';
        ">
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
        <script src="https://unpkg.com/tailwindcss-cdn@3.4.14/tailwindcss-with-preflight.js"></script>
        <style>
          body { margin: 0; font-family: system-ui, sans-serif; }
          #root { min-height: 100vh; }
          .error-display { padding: 20px; color: #dc2626; font-family: monospace; background: #fef2f2; border: 1px solid #fecaca; margin: 10px; border-radius: 8px; }
          .error-display strong { display: block; margin-bottom: 8px; }
          .error-display pre { white-space: pre-wrap; word-break: break-word; margin: 0; font-size: 12px; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          (function() {
            const rootEl = document.getElementById('root');

            // The sanitized JSX code from server
            const jsxCode = ${JSON.stringify(previewScript)};

            // Wrap code to expose Preview component
            const wrappedCode = jsxCode + \`

              // Expose component for renderer
              window.__FASTLANE_PREVIEW__ =
                typeof Preview !== 'undefined' ? Preview :
                typeof Design !== 'undefined' ? Design :
                typeof App !== 'undefined' ? App :
                typeof Main !== 'undefined' ? Main :
                typeof HomePage !== 'undefined' ? HomePage :
                typeof Home !== 'undefined' ? Home :
                typeof Page !== 'undefined' ? Page :
                typeof Component !== 'undefined' ? Component :
                null;
            \`;

            try {
              // Compile JSX to JS using Babel standalone
              const compiled = Babel.transform(wrappedCode, {
                presets: ['react'],
                filename: 'preview.jsx'
              }).code;

              // Execute the compiled code
              const execFunc = new Function('React', 'ReactDOM', compiled);
              execFunc(window.React, window.ReactDOM);

              // Render the component
              const PreviewComponent = window.__FASTLANE_PREVIEW__;
              if (!PreviewComponent) {
                rootEl.innerHTML = '<div class="error-display"><strong>Error:</strong><pre>Preview component not found. Make sure the component is named Preview.</pre></div>';
                return;
              }

              const root = ReactDOM.createRoot(rootEl);
              root.render(React.createElement(PreviewComponent));

            } catch (e) {
              console.error('Preview error:', e);
              const message = e && e.message ? e.message : String(e);
              rootEl.innerHTML = '<div class="error-display"><strong>Error rendering preview:</strong><pre>' + message.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre></div>';
            }
          })();
        </script>
      </body>
    </html>
  `

  const modificationsRemaining = REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND - (client.revision_modifications_used || 0)

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
            aria-label="Desktop view"
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
            aria-label="Mobile view"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview iframe with strict sandbox */}
      <div ref={containerRef} className="bg-slate-100 p-4 overflow-hidden">
        {viewport === 'desktop' ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <iframe
              srcDoc={iframeContent}
              className="w-full border-0"
              style={{ height: PREVIEW_CONFIG.DESKTOP_HEIGHT }}
              sandbox="allow-scripts"
              title="Website Preview"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="bg-white shadow-lg rounded-lg overflow-hidden"
              style={{ width: PREVIEW_CONFIG.MOBILE_WIDTH }}
            >
              <iframe
                srcDoc={iframeContent}
                className="w-full border-0"
                style={{ height: PREVIEW_CONFIG.MOBILE_HEIGHT }}
                sandbox="allow-scripts"
                title="Website Preview"
                referrerPolicy="no-referrer"
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
              {client.revision_round || 1} of {REVISION_CONFIG.MAX_ROUNDS}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">Changes remaining</span>
            <span className="ml-1 font-medium text-slate-900">
              {modificationsRemaining} of {REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND}
            </span>
          </div>
        </div>

        <button
          onClick={onRequestRevision}
          disabled={modificationsRemaining <= 0}
          className="w-full py-3 px-4 bg-[#C3F53C] text-slate-900 rounded-xl font-medium hover:bg-[#b5e636] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Request Changes
        </button>
      </div>
    </div>
  )
}
