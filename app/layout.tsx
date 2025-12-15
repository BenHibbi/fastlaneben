import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fastlane — Your Website, Live in 7 Days',
  description: 'Professional websites for local businesses. From $29/month. Hosting included. $0 upfront. Live in 7 days.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans-body antialiased">{children}</body>
    </html>
  )
}
