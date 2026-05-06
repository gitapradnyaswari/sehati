'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AlertTriangle, Menu, X } from 'lucide-react'
import { useState } from 'react'

const LINKS = [
  { href: '/',         label: 'Beranda' },
  { href: '/cari',     label: 'Cari Layanan' },
  { href: '/jelajahi', label: 'Jelajahi Layanan' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#dde8ec] shadow-[0_1px_12px_rgba(13,31,45,0.06)]">
      <div className="max-w-300 mx-auto px-10">
        <div className="flex items-center justify-between h-18 gap-6">

          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="SEHATi"
              width={0}
              height={0}
              sizes="130px"
              priority
              className="h-11.25 w-auto object-contain"
            />
          </Link>

          <div className="hidden md:flex items-end gap-6">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`pb-1.5 pt-2 text-sm whitespace-nowrap border-b-2 transition-colors duration-150 ${
                  isActive(l.href)
                    ? 'text-[#0e2233] font-medium border-[#2aab7e]'
                    : 'text-[#4f6370] font-normal border-transparent hover:text-[#0e2233]'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/darurat"
              className="hidden sm:inline-flex items-center gap-1.75 px-4.5 py-2.25 bg-[#dc2626] text-white text-sm font-medium rounded-lg hover:bg-[#b91c1c] hover:-translate-y-px transition-all duration-150 tracking-[0.01em]"
            >
              <AlertTriangle size={15} className="shrink-0" />
              <span>Darurat</span>
            </Link>
            <button
              className="md:hidden flex items-center justify-center w-9.5 h-9.5 border border-[#dde8ec] rounded-lg text-[#4f6370] hover:bg-[#f7fafa] hover:text-[#0e2233] transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#dde8ec] bg-white px-4 py-3 flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2.75 rounded-lg text-sm transition-colors ${
                isActive(l.href)
                  ? 'bg-[#e5f3ed] text-[#186848] font-medium'
                  : 'text-[#4f6370] hover:bg-[#f7fafa] hover:text-[#0e2233]'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/darurat"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 px-4 py-2.75 rounded-lg text-sm font-medium bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors"
          >
            <AlertTriangle size={15} />
            Panduan Darurat
          </Link>
        </div>
      )}
    </nav>
  )
}