import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { isAdminEmail, verifyAdmin } from '@/lib/auth/admin'
import { sanitizeReactCode } from '@/lib/groq'
import { sendFirstPreviewEmail, sendSecondPreviewEmail } from '@/lib/email'
import { reactPreviewPostSchema, validateRequest } from '@/lib/validation'
import { previewLogger } from '@/lib/logger'
import type { ReactPreview, Client } from '@/types/database'

export const runtime = 'nodejs'

async function getAuthenticatedUser() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// Compile sanitized TSX/JSX into a self-contained IIFE that exposes Preview on window
async function compilePreviewCode(code: string): Promise<string> {
  const { transform } = await import('esbuild')

  const wrappedCode = `// Preview bundle (React provided as global)
${code}

// Expose component for renderer - try multiple patterns
const __previewExport =
  typeof Preview !== 'undefined' ? Preview :
  typeof App !== 'undefined' ? App :
  typeof Main !== 'undefined' ? Main :
  typeof HomePage !== 'undefined' ? HomePage :
  typeof Home !== 'undefined' ? Home :
  typeof Page !== 'undefined' ? Page :
  typeof LandingPage !== 'undefined' ? LandingPage :
  typeof Website !== 'undefined' ? Website :
  null;
window.__FASTLANE_PREVIEW__ = __previewExport;`

  const result = await transform(wrappedCode, {
    loader: 'tsx',
    format: 'iife',
    globalName: 'PreviewBundle',
    target: 'es2018',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    banner: `const React = window.React;
const ReactDOM = window.ReactDOM;
// Lucide icons shim - returns empty span components
const LucideShim = new Proxy({}, {
  get: function(target, prop) {
    if (typeof prop === 'string' && prop !== 'then') {
      return function LucideIcon(props) {
        return React.createElement('span', {
          className: props?.className || '',
          style: { display: 'inline-block', width: props?.size || 24, height: props?.size || 24 }
        });
      };
    }
    return undefined;
  }
});
const require = function(mod) {
  if (mod === 'react') return window.React;
  if (mod === 'react-dom') return window.ReactDOM;
  if (mod === 'lucide-react') return LucideShim;
  console.warn('Module not available:', mod);
  return {};
};
const exports = {};
const module = { exports: exports };
`,
    footer: 'window.__FASTLANE_PREVIEW__ = typeof window.__FASTLANE_PREVIEW__ !== "undefined" ? window.__FASTLANE_PREVIEW__ : (typeof PreviewBundle !== "undefined" ? (PreviewBundle.default || PreviewBundle.Preview || null) : null);',
    minify: true,
  })

  return result.code
}

// POST - Admin posts React code (sanitizes with LLM)
export async function POST(request: NextRequest) {
  try {
    // Only admins can publish previews
    let adminUser
    try {
      adminUser = await verifyAdmin()
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateRequest(reactPreviewPostSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { clientId, rawCode } = validation.data
    const supabase = createAdminClient()

    // Verify client exists and is in FINAL_ONBOARDING - include email/business_name to avoid N+1
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, state, email, business_name')
      .eq('id', clientId)
      .single()

    if (clientError || !clientData) {
      previewLogger.warn('Client not found', { clientId })
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const client = clientData as Pick<Client, 'id' | 'state' | 'email' | 'business_name'>

    if (client.state !== 'FINAL_ONBOARDING') {
      return NextResponse.json(
        { error: 'Client is not in final onboarding state' },
        { status: 400 }
      )
    }

    // Get current version number
    const { data: existingPreviews } = await supabase
      .from('react_previews')
      .select('version')
      .eq('client_id', clientId)
      .order('version', { ascending: false })
      .limit(1)

    const previews = existingPreviews as Pick<ReactPreview, 'version'>[] | null
    const nextVersion = previews?.[0]?.version ? previews[0].version + 1 : 1

    // Deactivate all previous previews
    await supabase
      .from('react_previews')
      .update({ is_active: false } as never)
      .eq('client_id', clientId)

    // Sanitize code with LLM
    const sanitizedCode = await sanitizeReactCode(rawCode)

    // Compile sanitized code server-side (no Babel in client)
    let compiledCode: string
    try {
      compiledCode = await compilePreviewCode(sanitizedCode)
    } catch (err) {
      previewLogger.error('Failed to compile preview code', {
        clientId,
        error: err instanceof Error ? err.message : String(err)
      })
      return NextResponse.json(
        { error: 'Preview code could not be compiled. Please check the component syntax.' },
        { status: 400 }
      )
    }

    // Save new preview
    const { data: previewData, error: insertError } = await supabase
      .from('react_previews')
      .insert({
        client_id: clientId,
        raw_code: rawCode,
        sanitized_code: compiledCode,
        version: nextVersion,
        is_active: true,
        created_by: adminUser.id || null
      } as never)
      .select()
      .single()

    if (insertError) {
      previewLogger.error('Failed to insert preview', {
        clientId,
        error: insertError.message
      })
      return NextResponse.json(
        { error: 'Failed to save preview' },
        { status: 500 }
      )
    }

    const preview = previewData as ReactPreview

    // Update client with preview reference and phase
    const updateData: Record<string, unknown> = {
      current_react_preview_id: preview.id,
      onboarding_phase: 'react_preview',
      revision_modifications_used: 0,
      updated_at: new Date().toISOString()
    }

    if (nextVersion === 1) {
      updateData.revision_round = 1
    } else if (nextVersion === 2) {
      updateData.revision_round = 2
    }

    await supabase
      .from('clients')
      .update(updateData as never)
      .eq('id', clientId)

    // Send email notification based on version (using data from initial query)
    if (nextVersion === 1) {
      await sendFirstPreviewEmail(client.email, client.business_name || 'your business')
      previewLogger.info('First preview email sent', { clientId })
    } else if (nextVersion === 2) {
      await sendSecondPreviewEmail(client.email, client.business_name || 'your business')
      previewLogger.info('Second preview email sent', { clientId })
    }

    previewLogger.info('Preview created', {
      clientId,
      previewId: preview.id,
      version: nextVersion
    })

    return NextResponse.json({
      success: true,
      preview: {
        id: preview.id,
        version: preview.version,
        sanitizedCode: preview.sanitized_code
      }
    })
  } catch (error) {
    previewLogger.error('React preview error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Failed to create preview' },
      { status: 500 }
    )
  }
}

// GET - Fetch active preview for client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Verify client ownership or admin
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id, user_id')
      .eq('id', clientId)
      .single()

    if (!clientRecord) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const record = clientRecord as { id: string; user_id: string | null }
    const isAdmin = isAdminEmail(user.email)
    if (!isAdmin && record.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: previewData, error } = await supabase
      .from('react_previews')
      .select('id, version, sanitized_code, created_at')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (error || !previewData) {
      return NextResponse.json({ preview: null })
    }

    const preview = previewData as Pick<ReactPreview, 'id' | 'version' | 'sanitized_code' | 'created_at'>

    return NextResponse.json({
      preview: {
        id: preview.id,
        version: preview.version,
        sanitizedCode: preview.sanitized_code,
        createdAt: preview.created_at
      }
    })
  } catch (error) {
    previewLogger.error('Get preview error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    )
  }
}
