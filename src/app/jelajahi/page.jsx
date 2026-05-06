'use client'
// ─────────────────────────────────────────────────────────────
// app/jelajahi/page.jsx — Halaman Jelajahi Layanan Rumah Sakit
//
// 'use client' diperlukan karena komponen ini menggunakan
// useState, useEffect, dan interaksi pengguna di browser.
//
// Perbedaan dengan halaman Cari:
//   - Hanya SATU filter aktif dalam satu waktu (single-select)
//   - Tidak ada input keyword teks bebas
//   - Setiap perubahan filter langsung memicu pencarian otomatis
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Search, X, ChevronDown, Stethoscope, Users, CreditCard, MessageCircle, Heart, MapPin } from 'lucide-react'
import { JENIS_LAYANAN, KELOMPOK, PENJAMINAN } from '@/lib/constants'
import LayananCard from '@/components/LayananCard'
import SparqlPanel from '@/components/SparqlPanel'

// ─────────────────────────────────────────────────────────────
// EMPTY_FILTERS
// Dipindah ke luar komponen agar:
//   1. Tidak dibuat ulang setiap render
//   2. Bisa dipakai sebagai referensi stabil di useEffect
//      dan handleChange tanpa memicu dependency warning
//
// Semua nilai null = tidak ada filter aktif.
// Prinsip halaman ini: hanya satu key boleh non-null sekaligus.
// ─────────────────────────────────────────────────────────────
const EMPTY_FILTERS = {
  jenis:      null,
  keluhan:    null,
  kondisi:    null,
  kelompok:   null,
  penjaminan: null,
  wilayah:    null,
}

// ─────────────────────────────────────────────────────────────
// KOMPONEN: FilterDropdown
// Dropdown single-select dengan fitur pencarian internal.
// Berbeda dengan MultiSelectDropdown di halaman Cari:
//   - Hanya bisa memilih SATU item (bukan array)
//   - value adalah string IRI tunggal atau null
//   - Pilih item yang sama lagi → deselect (kembali null)
//   - Setelah pilih, dropdown langsung tertutup
//
// Props:
//   - label      : teks placeholder saat belum ada pilihan
//   - icon       : komponen icon dari lucide-react
//   - opsi       : array { iri, nama }
//   - value      : IRI yang sedang dipilih (string | null)
//   - onChange   : callback (iri | null) => void
//   - opsiLoading: true jika data opsi belum selesai dimuat
// ─────────────────────────────────────────────────────────────
function FilterDropdown({ label, icon: Icon, opsi, value, onChange, opsiLoading }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref      = useRef(null)   // ref ke container — untuk deteksi klik di luar
  const inputRef = useRef(null)   // ref ke input — untuk auto-focus

  // Tutup dropdown saat klik di luar area komponen
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    // Cleanup: hapus event listener saat komponen unmount
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-focus ke input pencarian saat dropdown terbuka
  // setTimeout(50ms) karena elemen input baru ada setelah
  // satu render cycle dari open=true
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setSearch('')
  }, [open])

  // Filter opsi berdasarkan teks pencarian (case-insensitive)
  const filtered = opsi.filter(o =>
    o.nama.toLowerCase().includes(search.toLowerCase())
  )

  // Cari nama tampilan dari IRI yang sedang dipilih
  const selectedNama = value ? opsi.find(o => o.iri === value)?.nama : null
  const isActive     = !!value   // true jika ada pilihan aktif

  return (
    <div className="relative" ref={ref}>
      {/* Tombol trigger — tiga state visual: aktif, fokus/buka, default */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={[
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] transition-all text-left',
          isActive
            ? 'border-[#2aab7e] bg-[rgba(42,171,126,0.06)] text-[#186848]'       // ada pilihan aktif
            : open
            ? 'border-[#2aab7e] bg-white ring-2 ring-[#2aab7e]/20 text-[#0e2233]' // dropdown terbuka
            : 'border-[#dde8ec] bg-[#f7fafa] text-[#4f6370] hover:border-[#b0c8d4] hover:bg-white', // default
        ].join(' ')}
      >
        {/* Icon berubah warna saat aktif atau terbuka */}
        <Icon size={14} className={isActive || open ? 'text-[#2aab7e] shrink-0' : 'text-[#c4d2da] shrink-0'} />

        <span className="flex-1 min-w-0 overflow-hidden">
          {selectedNama
            ? <span className="block truncate font-medium text-[#186848]">{selectedNama}</span>
            : <span className="block truncate text-[#8fa3b0]">{label}</span>
          }
        </span>

        {/* Jika aktif: tampilkan X untuk clear; jika tidak: tampilkan chevron */}
        {isActive
          ? (
            <X
              size={13}
              className="shrink-0 text-[#8fa3b0] hover:text-red-500 transition-colors"
              // stopPropagation mencegah klik X sekaligus memicu onClick button parent
              onClick={e => { e.stopPropagation(); onChange(null) }}
            />
          )
          : (
            <ChevronDown
              size={13}
              className={`shrink-0 text-[#c4d2da] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          )
        }
      </button>

      {/* Panel dropdown — hanya dirender saat open=true */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-56 bg-white border border-[#dde8ec] rounded-xl shadow-[0_8px_32px_rgba(13,31,45,0.12)] overflow-hidden">

          {/* Input pencarian di dalam dropdown */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#eaf1f4]">
            <Search size={13} className="text-[#8fa3b0] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Ketik untuk mencari…"
              className="flex-1 text-[12px] outline-none bg-transparent text-[#0e2233] placeholder:text-[#8fa3b0]"
            />
            {search && (
              <button onClick={e => { e.stopPropagation(); setSearch('') }}>
                <X size={11} className="text-[#8fa3b0]" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto">
            {/* State loading: data opsi belum selesai di-fetch dari API */}
            {opsiLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-[#8fa3b0] text-[12px]">
                <Loader2 size={14} className="animate-spin text-[#2aab7e]" /> Memuat…
              </div>

            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-[#8fa3b0] text-center">
                Tidak ada hasil untuk &ldquo;{search}&rdquo;
              </p>

            ) : filtered.map(o => {
              const isSelected = value === o.iri
              return (
                <button
                  key={o.iri}
                  type="button"
                  onClick={() => {
                    // Klik item yang sudah dipilih → deselect (null)
                    // Klik item baru → select, lalu tutup dropdown
                    onChange(isSelected ? null : o.iri)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2 text-[12px] text-left transition-colors',
                    isSelected
                      ? 'bg-[rgba(42,171,126,0.08)] text-[#186848] font-medium'
                      : 'text-[#4f6370] hover:bg-[#f7fafa]',
                  ].join(' ')}
                >
                  {/* Radio button custom — lingkaran dengan titik putih jika dipilih */}
                  <span className={[
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    isSelected ? 'border-[#2aab7e] bg-[#2aab7e]' : 'border-[#dde8ec]',
                  ].join(' ')}>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="leading-snug">{o.nama}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HALAMAN UTAMA: JelajahiPage
// ─────────────────────────────────────────────────────────────
export default function JelajahiPage() {
  // State filter — satu objek dengan semua key, hanya satu boleh non-null
  const [filters, setFilters]         = useState(EMPTY_FILTERS)
  // Opsi dropdown yang datanya dari API (dinamis dari ontologi)
  const [opsiDynamic, setOpsiDynamic] = useState({ keluhan: [], kondisi: [], wilayah: [] })
  const [results, setResults]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [searched, setSearched]       = useState(false)  // sudah pernah fetch? (untuk state kosong)
  const [debug, setDebug]             = useState(null)

  // Fetch opsi filter dinamis sekali saat mount
  useEffect(() => {
    fetch('/api/sparql?action=filter-opsi')
      .then(r => r.json())
      .then(d => {
        setOpsiDynamic({
          keluhan: d.keluhan || [],
          kondisi: d.kondisi || [],
          wilayah: d.wilayah || [],
        })
      })
      .catch(() => {})
  }, [])

  // ─────────────────────────────────────────────────────────
  // fetchResults()
  // Membangun URLSearchParams dari satu filter aktif,
  // lalu fetch ke API SPARQL.
  //
  // Object.entries().find() mengambil entry PERTAMA yang
  // nilainya tidak null — karena hanya boleh ada satu filter
  // aktif, ini selalu benar.
  //
  // Jika tidak ada filter aktif (semua null), request tetap
  // dikirim tanpa parameter filter → API mengembalikan semua layanan.
  // ─────────────────────────────────────────────────────────
  const fetchResults = useCallback(async (activeFilters) => {
    setLoading(true)
    setSearched(true)
    try {
      const p     = new URLSearchParams({ action: 'cari' })
      const entry = Object.entries(activeFilters).find(([, v]) => v !== null)
      if (entry) p.append(entry[0], entry[1])
      const res  = await fetch(`/api/sparql?${p}`)
      const data = await res.json()
      setResults(data.results || [])
      setDebug(data.sparqlDebug || null)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ─────────────────────────────────────────────────────────
  // useEffect: restore state saat kembali dari halaman detail
  //
  // sessionStorage menyimpan kriteria dan nilai filter terakhir
  // agar saat pengguna kembali dari halaman detail, halaman ini
  // langsung menampilkan hasil yang sama.
  //
  // 'jelajahi_dari_detail' di-remove di sini (bukan di-check)
  // karena key itu di-set oleh onClick kartu layanan di bawah,
  // dan cleanup-nya memang di sini saat halaman dimuat ulang.
  //
  // Dependency array [] + eslint-disable: sama dengan pola
  // di halaman Cari — hanya boleh jalan sekali saat mount.
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const kriteria = sessionStorage.getItem('jelajahi_kriteria')
    const filter   = sessionStorage.getItem('jelajahi_filter')
    // Bersihkan flag navigasi dari detail
    sessionStorage.removeItem('jelajahi_dari_detail')

    if (kriteria && filter) {
      try {
        const p = JSON.parse(filter)
        if (p?.[0]) {
          // Pulihkan state dengan satu filter yang tersimpan
          const restored = { ...EMPTY_FILTERS, [kriteria]: p[0] }
          setFilters(restored)
          fetchResults(restored)
          return
        }
      } catch {
        // Jika parse gagal, lanjut ke default di bawah
      }
    }
    // Default: tampilkan semua layanan tanpa filter
    fetchResults(EMPTY_FILTERS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────
  // handleChange()
  // Dipanggil setiap kali pengguna memilih/membatalkan filter.
  // Prinsip: spread EMPTY_FILTERS lalu set satu key — ini
  // memastikan filter lain selalu di-reset ke null, sehingga
  // tidak ada dua filter aktif sekaligus.
  // ─────────────────────────────────────────────────────────
  const handleChange = (key, nilai) => {
    const next = { ...EMPTY_FILTERS, [key]: nilai }
    setFilters(next)
    if (nilai) {
      // Simpan ke sessionStorage agar bisa dipulihkan saat kembali dari detail
      sessionStorage.setItem('jelajahi_kriteria', key)
      sessionStorage.setItem('jelajahi_filter', JSON.stringify([nilai]))
    } else {
      // Nilai null = filter dihapus, bersihkan sessionStorage
      sessionStorage.removeItem('jelajahi_kriteria')
      sessionStorage.removeItem('jelajahi_filter')
    }
    // Langsung fetch tanpa tombol submit — setiap pilihan memicu pencarian
    fetchResults(next)
  }

  // ─────────────────────────────────────────────────────────
  // DROPDOWNS
  // Konfigurasi semua dropdown dalam satu array agar JSX
  // di bawah cukup satu .map() tanpa mengulang markup.
  //
  // opsiLoading: true selama array masih kosong (belum di-fetch).
  // ⚠️ Ini ambigu jika ontologi memang tidak punya data —
  // spinner akan terus tampil. Untuk produksi, sebaiknya
  // tambahkan state terpisah seperti `opsiLoaded: boolean`.
  // ─────────────────────────────────────────────────────────
  const DROPDOWNS = [
    {
      key: 'jenis',
      label: 'Jenis Layanan',
      icon: Stethoscope,
      opsi: JENIS_LAYANAN.map(o => ({ iri: o.value, nama: o.label })),
      opsiLoading: false,  // data statis dari konstanta, selalu tersedia
    },
    {
      key: 'keluhan',
      label: 'Keluhan',
      icon: MessageCircle,
      opsi: opsiDynamic.keluhan,
      opsiLoading: opsiDynamic.keluhan.length === 0,  // loading selama belum ada data
    },
    {
      key: 'kondisi',
      label: 'Kondisi Medis',
      icon: Heart,
      opsi: opsiDynamic.kondisi,
      opsiLoading: opsiDynamic.kondisi.length === 0,
    },
    {
      key: 'kelompok',
      label: 'Kelompok Pasien',
      icon: Users,
      opsi: KELOMPOK.map(o => ({ iri: o.value, nama: o.label })),
      opsiLoading: false,
    },
    {
      key: 'penjaminan',
      label: 'Cara Pembayaran',
      icon: CreditCard,
      opsi: PENJAMINAN.map(o => ({ iri: o.value, nama: o.label })),
      opsiLoading: false,
    },
    {
      key: 'wilayah',
      label: 'Wilayah RS',
      icon: MapPin,
      opsi: opsiDynamic.wilayah,
      opsiLoading: opsiDynamic.wilayah.length === 0,
    },
  ]

  return (
    <div>

      {/* ══════════════════════════════════════════════════════
          HEADER HALAMAN
          Identik dengan header di halaman Cari — latar gelap
          dengan dua radial glow dekoratif.
          ══════════════════════════════════════════════════ */}
      <div className="bg-[#0e2233] relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12">        <div className="absolute top-[-20%] left-[-5%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(42,171,126,0.14) 0%, transparent 65%)' }} />
        <div className="absolute top-[-20%] right-[-5%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(42,171,126,0.14) 0%, transparent 65%)' }} />
        <div className="max-w-300 mx-auto relative z-10">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#7de8c2] mb-2.5">
            Fitur Penjelajahan
          </p>
          <h1
            className="font-normal text-[#eef7f4] leading-[1.15] mb-2"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(20px, 2.8vw, 30px)' }}
          >
            Jelajahi Layanan Rumah Sakit
          </h1>
          <p className="text-[12px] text-[rgba(238,247,244,0.50)] font-light">
            Pilih salah satu kriteria untuk menemukan layanan yang sesuai
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          KOTAK FILTER
          Mengambang di atas konten dengan -mt-7 dan z-10.
          Di mobile: scroll horizontal (overflow-x-auto, tiap
          item lebar tetap w-36).
          Di desktop (md ke atas): grid 6 kolom, lebar penuh.
          scrollbarWidth: none menyembunyikan scrollbar di Firefox.
          ══════════════════════════════════════════════════ */}
      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10">
        <div className="bg-white border border-[#dde8ec] rounded-xl p-3 sm:p-4 shadow-[0_8px_40px_rgba(13,31,45,0.10)]">
          <div
            className="flex gap-2 overflow-x-auto md:grid md:grid-cols-6 md:overflow-visible pb-0.5 md:pb-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {DROPDOWNS.map(d => (
              // Lebar tetap di mobile, otomatis di desktop
              <div key={d.key} className="shrink-0 w-36 md:w-auto">
                <FilterDropdown
                  label={d.label}
                  icon={d.icon}
                  opsi={d.opsi}
                  value={filters[d.key]}
                  onChange={(val) => handleChange(d.key, val)}
                  opsiLoading={d.opsiLoading}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          HASIL PENCARIAN — 4 kemungkinan state:
          1. Loading  : spinner saat fetch berlangsung
          2. Kosong   : sudah fetch tapi tidak ada hasil
          3. Ada hasil: grid kartu layanan
          4. Awal     : belum fetch sama sekali → spinner
                        (terjadi sebelum useEffect mount selesai)
          ══════════════════════════════════════════════════ */}
      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* State 1: Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[#8fa3b0]">
            <Loader2 size={22} className="animate-spin text-[#2aab7e]" />
            <p className="text-[12px] font-light">Memuat data dari ontologi…</p>
          </div>

        /* State 2: Sudah fetch, tidak ada hasil */
        ) : searched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-14 h-14 bg-[rgba(42,171,126,0.08)] rounded-full flex items-center justify-center">
              <Search size={20} className="text-[#2aab7e]" />
            </div>
            <h2
              className="text-[16px] font-normal text-[#0e2233]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Tidak ada hasil
            </h2>
            <p className="text-[12px] text-[#8fa3b0] font-light">Coba pilih kategori lain</p>
          </div>

        /* State 3: Ada hasil */
        ) : results.length > 0 ? (
          <>
            <p className="text-[12px] text-[#8fa3b0] mb-4">
              {results.length} layanan ditemukan
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((item, i) => (
                <LayananCard
                  key={`${item.kodeUniv}_${item.suffix}_${i}`}
                  item={item}
                  // Set flag agar saat kembali dari detail, state filter dipulihkan
                  onClick={() => sessionStorage.setItem('jelajahi_dari_detail', 'true')}
                />
              ))}
            </div>
          </>

        /* State 4: Belum ada fetch sama sekali (initial mount) */
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-[#8fa3b0]">
            <Loader2 size={22} className="animate-spin text-[#2aab7e]" />
            <p className="text-[12px] font-light">Memuat layanan…</p>
          </div>
        )}

        {/* Panel debug SPARQL — hanya tampil jika ada data debug */}
        <SparqlPanel debug={debug} />
      </div>
    </div>
  )
}