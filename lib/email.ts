import { Resend } from 'resend'

const FROM = 'Fastlane <hello@fastlanesites.com>'
const CLIENT_URL = 'https://fastlanesites.com/client'

// Lazy initialization to avoid build-time errors
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

interface EmailResult {
  success: boolean
  error?: string
}

// 1. Mockup ready (PREVIEW_READY)
export async function sendMockupReadyEmail(
  to: string,
  businessName: string
): Promise<EmailResult> {
  try {
    await getResendClient().emails.send({
      from: FROM,
      to,
      subject: 'Your website mockup is ready! - Fastlane',
      text: `Hi there!

Great news - your mockup for ${businessName || 'your business'} is ready for review.

Log in to see it: ${CLIENT_URL}

This is an example of what could be done. Feel free to tell us if you'd like something different.

— The Fastlane Team`
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send mockup ready email:', error)
    return { success: false, error: String(error) }
  }
}

// 2. Payment confirmed (FINAL_ONBOARDING)
export async function sendPaymentConfirmedEmail(
  to: string,
  businessName: string
): Promise<EmailResult> {
  try {
    await getResendClient().emails.send({
      from: FROM,
      to,
      subject: "Payment confirmed - Let's build your site! - Fastlane",
      text: `Hi there!

Thank you for your payment! We're excited to build ${businessName || 'your'} website.

Here's what happens next:
1. Record a voice brief describing your vision (2-3 min)
2. Upload reference sites you like
3. Provide your content (text, images)
4. We build your custom React site
5. You review and request up to 2 rounds of revisions (10 changes each)
6. Your site goes live!

Get started: ${CLIENT_URL}

— The Fastlane Team`
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send payment confirmed email:', error)
    return { success: false, error: String(error) }
  }
}

// 3. First preview posted (version 1)
export async function sendFirstPreviewEmail(
  to: string,
  businessName: string
): Promise<EmailResult> {
  try {
    await getResendClient().emails.send({
      from: FROM,
      to,
      subject: 'Your first website preview is ready! - Fastlane',
      text: `Hi there!

Your first preview for ${businessName || 'your business'} is ready!

Log in to check it out: ${CLIENT_URL}

You can request up to 10 changes in this first round of revisions.

— The Fastlane Team`
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send first preview email:', error)
    return { success: false, error: String(error) }
  }
}

// 4. Second preview posted (version 2, after revisions)
export async function sendSecondPreviewEmail(
  to: string,
  businessName: string
): Promise<EmailResult> {
  try {
    await getResendClient().emails.send({
      from: FROM,
      to,
      subject: 'Your updated website is ready! - Fastlane',
      text: `Hi there!

We've made your requested changes to ${businessName || 'your'} website.

Check out the updated preview: ${CLIENT_URL}

This is your final round - you can request up to 10 more changes before we go live.

— The Fastlane Team`
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send second preview email:', error)
    return { success: false, error: String(error) }
  }
}

// 5. Site live
export async function sendSiteLiveEmail(
  to: string,
  businessName: string,
  liveUrl: string
): Promise<EmailResult> {
  try {
    await getResendClient().emails.send({
      from: FROM,
      to,
      subject: 'Your website is live! - Fastlane',
      text: `Hi there!

Congratulations! ${businessName || 'Your'} website is now live at:

${liveUrl}

Share it with the world!

Need help? Just reply to this email.

— The Fastlane Team`
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send site live email:', error)
    return { success: false, error: String(error) }
  }
}
