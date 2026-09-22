import type { Metadata } from 'next'
import { Fraunces } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'TLC Soluções',
  description: 'Automação para negócio pequeno.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={fraunces.variable}>
      <body className="bg-[#12110F] font-sans text-[#F2EFE9] antialiased">
        {children}
      </body>
    </html>
  )
}
