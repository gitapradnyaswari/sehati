import Link from 'next/link'
import Image from 'next/image'
import { AlertTriangle } from 'lucide-react'

const NAV_LINKS = [
  { href: '/',         label: 'Beranda' },
  { href: '/cari',     label: 'Cari Layanan' },
  { href: '/jelajahi', label: 'Jelajahi Layanan' },
  { href: '/darurat',  label: 'Darurat' },
]

const RS_CONTACTS = [
  {
    nama: 'RS Bali Mandara',
    alamat: 'Jl. By Pass Ngurah Rai No. 548, Denpasar',
    igd: '(0361) 466-393',
  },
  {
    nama: 'RS Puri Raharja',
    alamat: 'Jl. WR Supratman No. 14, Denpasar',
    igd: '(0361) 222-386',
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#081420] border-t border-white/6">

      <div className="max-w-300 mx-auto px-12 pt-16 pb-13 grid grid-cols-1 sm:grid-cols-[1.6fr_1fr_1fr] gap-16">

        <div>
          <Image
            src="/bnwlogo.png"
            alt="SEHATi"
            width={0}
            height={0}
            sizes="130px"
            className="h-12 w-auto object-contain mb-4 opacity-85"
          />
          <p className="text-[13px] leading-[1.72] text-[rgba(238,247,244,0.42)] font-light max-w-75 mb-7">
            SEHATi membantu pasien dan calon pasien memahami informasi layanan rumah sakit sebelum berkunjung.
          </p>
          <div className="flex items-start gap-2.5 bg-[rgba(245,215,110,0.08)] border border-[rgba(245,215,110,0.18)] rounded-[10px] p-3 max-w-72.5">
            <AlertTriangle size={14} className="text-[#f5c842] shrink-0 mt-px" />
            <p className="text-xs leading-[1.8] text-[rgba(238,247,244,0.42)] font-light">
              SEHATi bukan sistem diagnosis dan tidak menentukan layanan yang harus dijalani. Keputusan mengenai layanan rumah sakit yang perlu dijalani tetap berada di tangan tenaga kesehatan yang berwenang.            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[rgba(238,247,244,0.28)] mb-5">
            Navigasi
          </p>
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-[rgba(238,247,244,0.52)] font-light hover:text-[#7de8c2] transition-colors duration-200"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[rgba(238,247,244,0.28)] mb-5">
            Kontak Darurat
          </p>
          <div className="flex flex-col gap-5">
            {RS_CONTACTS.map((rs, i) => (
              <div
                key={i}
                className={i < RS_CONTACTS.length - 1 ? 'pb-5 border-b border-white/6' : ''}
              >
                <p className="text-[13px] font-medium text-[rgba(238,247,244,0.65)] mb-1.25">{rs.nama}</p>
                <p className="text-xs text-[rgba(238,247,244,0.32)] font-light leading-[1.65]">{rs.alamat}</p>
                <p className="text-xs text-[rgba(238,247,244,0.32)] font-light">IGD: {rs.igd}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/6">
        <div className="max-w-300 mx-auto px-12 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-[rgba(238,247,244,0.22)] font-light">
            &copy; {new Date().getFullYear()}{' '}
            <span className="text-[rgba(238,247,244,0.38)]">SEHATi</span>
            . Sistem Pencarian Layanan Rumah Sakit Provinsi Bali.
          </p>
          <p className="text-[11px] text-[rgba(238,247,244,0.18)] font-light">
            Data bersumber dari RS Bali Mandara &amp; RS Puri Raharja
          </p>
        </div>
      </div>

    </footer>
  )
}