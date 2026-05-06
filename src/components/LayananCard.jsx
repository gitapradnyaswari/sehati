'use client'
// ─────────────────────────────────────────────────────────────
// components/LayananCard.jsx — Kartu Layanan Rumah Sakit
//
// Kartu ini dirender di halaman Cari dan Jelajahi sebagai
// item dalam grid hasil pencarian.
//
// Props:
//   item      : objek data layanan dari API SPARQL
//   href      : override URL tujuan (opsional, default dari kode+RS)
//   onClick   : callback saat tombol "Lihat Detail" diklik
//               (dipakai untuk set flag sessionStorage sebelum navigasi)
//   className : kelas tambahan dari luar (opsional)
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'
import { JENIS_WARNA } from '@/lib/constants'

export default function LayananCard({ item, href, onClick, className = '' }) {
  // JENIS_WARNA: objek { bg, text, label } berdasarkan jenis layanan
  // Optional chaining ?.[] karena item.jenisLayanan mungkin undefined
  const warna = JENIS_WARNA?.[item.jenisLayanan]

  // isGov menentukan warna badge tipe RS (hijau vs biru)
  const isGov = item.jenisRS === 'Pemerintah'

  // href override memungkinkan kartu dipakai di konteks lain
  // (misal halaman perbandingan), default ke URL detail layanan
  const target = href ?? `/layanan/${item.kodeUniv}?rs=${item.suffix}`

  return (
    <div
      className={[
        'bg-white rounded-xl border border-[#dde8ec] flex flex-col',
        'hover:border-[rgba(42,171,126,0.35)] hover:shadow-[0_6px_24px_rgba(13,31,45,0.07)] hover:-translate-y-0.5',
        'transition-all duration-150',
        className,
      ].join(' ')}
    >
      <div className="px-4 pt-4 pb-3 flex-1 flex flex-col">

        {/* Badge jenis layanan — hanya tampil jika ada data warna */}
        {warna && (
          <span
            className="self-start inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mb-2.5"
            style={{ background: warna.bg, color: warna.text }}
          >
            {warna.label}
          </span>
        )}

        {/* Nama layanan — font serif untuk kesan editorial/medis */}
        <h3
          className="text-[15px] font-normal text-[#0e2233] mb-1 leading-snug"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {item.namaLayanan}
        </h3>

        {/* Nama alias — maksimal 3 ditampilkan, dipisah titik tengah */}
        {item.namaLain?.length > 0 && (
          <p className="text-[11px] text-[#8fa3b0] mb-2 font-light leading-relaxed">
            {item.namaLain.slice(0, 3).join(' · ')}
          </p>
        )}

        {/* Deskripsi singkat — dibatasi 3 baris dengan line-clamp */}
        <p className="text-[12px] text-[#4f6370] line-clamp-3 mb-3 font-light leading-relaxed flex-1">
          {item.deskripsiSingkat || 'Klik untuk melihat informasi lengkap layanan ini.'}
        </p>

        {/* Info RS + badge tipe */}
        <div className="flex items-center gap-2">
          <Building2 size={12} className="shrink-0 text-[#8fa3b0]" />
          <span className="truncate text-[12px] font-medium text-[#0e2233]">{item.namaRS}</span>
          <span
            className={[
              'shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border',
              isGov
                ? 'bg-[#e5f3ed] text-[#186848] border-[#aad4bf]'
                : 'bg-[#e5eef8] text-[#174d8a] border-[#aac0e4]',
            ].join(' ')}
          >
            {isGov ? 'Pemerintah' : 'Swasta'}
          </span>
        </div>
      </div>

      {/* Tombol Lihat Detail — full width di bagian bawah kartu */}
      <div className="px-4 pb-4 pt-2.5 border-t border-[#eaf1f4]">
        <Link
          href={target}
          onClick={onClick}
          className="flex items-center justify-center gap-1.5 w-full bg-[#2aab7e] hover:bg-[#229068] active:bg-[#1a7a5a] text-white font-medium text-[12px] py-2 rounded-lg transition-colors"
        >
          Lihat Detail
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  )
}