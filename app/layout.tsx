import type { Metadata } from 'next'
import { Fraunces, Public_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-display',
})

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
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
    <html lang="pt-BR" className={`${fraunces.variable} ${publicSans.variable}`}>
      <body className="bg-[#12110F] text-[#F2EFE9] font-[family-name:var(--font-body)] antialiased">
        {children}
      </body>
    </html>
  )
}
