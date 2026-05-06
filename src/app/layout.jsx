import '@/styles/globals.css'
import { DM_Sans } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata = {
  title: 'SEHATi — Sistem Pencarian Layanan Rumah Sakit Provinsi Bali',
  description: 'SEHATi — Sistem Pencarian Layanan Medis berbasis ontologi untuk pasien dan calon pasien di Rumah Sakit Provinsi Bali',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={dmSans.variable}>
      <body className="font-sans min-h-screen antialiased bg-[#f7fafa] text-[#0e2233]">
        <Navbar />
        <main className="pt-18">{children}</main>
        <Footer />
      </body>
    </html>
  )
}