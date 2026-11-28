import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'Karsa Kasir · Point of Sale Modern',
  description: 'Aplikasi Kasir Modern & Elegan untuk Karsa Perkakas & Toko',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-[#FAF7F2] text-stone-900 select-none">
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  )
}
