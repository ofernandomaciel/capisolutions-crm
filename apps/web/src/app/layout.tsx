import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'CapiSolutions CRM',
    template: '%s | CapiSolutions CRM',
  },
  description: 'CRM SaaS para pequenas e médias empresas brasileiras',
  keywords:    ['CRM', 'SaaS', 'vendas', 'leads', 'clientes', 'financeiro'],
  authors:     [{ name: 'CapiSolutions' }],
  robots:      { index: false, follow: false }, // bloquear indexação por ser app privado
  icons: {
    icon:   '/favicon.ico',
    apple:  '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor:   '#2563EB',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              classNames: {
                toast:       'font-sans text-sm',
                description: 'text-xs',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
