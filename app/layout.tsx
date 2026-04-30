import type { Metadata, Viewport } from 'next'
import { Prompt, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const prompt = Prompt({ subsets: ['thai', 'latin'], variable: '--font-thai', weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'สวนทุเรียน – ระบบจัดการสวน',
  description: 'ระบบบริหารจัดการสวนทุเรียนอัจฉริยะ Mobile-First & Field-Ready',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#1a3329',
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${inter.variable} ${prompt.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
