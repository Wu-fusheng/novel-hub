import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { AuthProvider } from '@/lib/auth-context'
import GuestPrompt from '@/components/guest-prompt'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Novel Hub - 小说阅读平台',
  description: '一个优雅的小说阅读平台，沉浸式阅读体验',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <GuestPrompt />
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-gray-100 py-6 mt-12">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
              <p>© 2025 Novel Hub. All rights reserved.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
