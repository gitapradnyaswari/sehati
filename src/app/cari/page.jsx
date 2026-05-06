'use client'
// ─────────────────────────────────────────────────────────────
// app/cari/page.jsx — Halaman Pencarian Layanan Rumah Sakit
//
// 'use client' berarti komponen ini dirender di browser (bukan server).
// Diperlukan karena menggunakan useState, useEffect, dan interaksi pengguna.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Filter, X, ChevronDown, Loader2, Check } from 'lucide-react'
import { JENIS_LAYANAN, KELOMPOK, PENJAMINAN } from '@/lib/constants'
import LayananCard from '@/components/LayananCard'
import SparqlPanel from '@/components/SparqlPanel'

// ─────────────────────────────────────────────────────────────
// KUNCI SESSION STORAGE
// Dikumpulkan dalam satu objek SS agar tidak ada typo saat
// mengakses key yang sama di banyak tempat.
// Session storage bertahan selama tab browser terbuka,
// tapi hilang saat tab ditutup — cocok untuk menyimpan
// state pencarian sementara.
// ─────────────────────────────────────────────────────────────
const SS = {
  keyword:    'cari_keyword',
  jenis:      'cari_jenis',
  kelompok:   'cari_kelompok',
  penjaminan: 'cari_penjaminan',
  keluhan:    'cari_keluhan',
  kondisi:    'cari_kondisi',
  wilayah:    'cari_wilayah',
  dariDetail: 'cari_dari_detail',  // flag: apakah user baru kembali dari halaman detail
}

// ─────────────────────────────────────────────────────────────
// saveState()
// Menyimpan seluruh state pencarian ke sessionStorage.
// Array disimpan sebagai JSON string karena sessionStorage
// hanya mendukung string.
// Dipanggil setiap kali state berubah dan sebelum navigasi
// ke halaman detail.
// ─────────────────────────────────────────────────────────────
function saveState(keyword, jenis, kelompok, penjaminan, keluhan, kondisi, wilayah) {
  sessionStorage.setItem(SS.keyword,    keyword)
  sessionStorage.setItem(SS.jenis,      JSON.stringify(jenis))
  sessionStorage.setItem(SS.kelompok,   JSON.stringify(kelompok))
  sessionStorage.setItem(SS.penjaminan, JSON.stringify(penjaminan))
  sessionStorage.setItem(SS.keluhan,    JSON.stringify(keluhan))
  sessionStorage.setItem(SS.kondisi,    JSON.stringify(kondisi))
  sessionStorage.setItem(SS.wilayah,    JSON.stringify(wilayah))
}

// ─────────────────────────────────────────────────────────────
// loadState()
// Membaca kembali state dari sessionStorage dan mem-parse
// string JSON menjadi array.
// Dibungkus try/catch karena JSON.parse bisa melempar error
// jika isi storage rusak/korup.
// Mengembalikan null jika gagal — ditangani di pemanggil.
// ─────────────────────────────────────────────────────────────
function loadState() {
  try {
    return {
      keyword:    sessionStorage.getItem(SS.keyword)    || '',
      jenis:      JSON.parse(sessionStorage.getItem(SS.jenis)      || '[]'),
      kelompok:   JSON.parse(sessionStorage.getItem(SS.kelompok)   || '[]'),
      penjaminan: JSON.parse(sessionStorage.getItem(SS.penjaminan) || '[]'),
      keluhan:    JSON.parse(sessionStorage.getItem(SS.keluhan)    || '[]'),
      kondisi:    JSON.parse(sessionStorage.getItem(SS.kondisi)    || '[]'),
      wilayah:    JSON.parse(sessionStorage.getItem(SS.wilayah)    || '[]'),
    }
  } catch {
    // Jika storage korup atau tidak bisa di-parse, kembalikan null
    // agar pemanggil bisa melakukan fallback ke state default
    return null
  }
}

// ─────────────────────────────────────────────────────────────
// KOMPONEN: MultiSelectDropdown
// Dropdown multi-pilih dengan fitur pencarian internal.
// Menerima props:
//   - label      : teks label di atas dropdown
//   - opsi       : array { iri, nama } — pilihan yang tersedia
//   - selected   : array IRI yang sedang dipilih
//   - onChange   : callback saat pilihan berubah
//   - placeholder: teks jika belum ada yang dipilih
// ─────────────────────────────────────────────────────────────
function MultiSelectDropdown({ label, opsi, selected, onChange, placeholder }) {
  const [open, setOpen]     = useState(false)   // apakah dropdown terbuka
  const [search, setSearch] = useState('')       // teks pencarian internal dropdown
  const ref      = useRef(null)   // ref ke container — untuk deteksi klik di luar
  const inputRef = useRef(null)   // ref ke input — untuk auto-focus saat dropdown buka

  // Deteksi klik di luar dropdown → tutup dropdown
  // useEffect dengan cleanup: removeEventListener dipanggil saat komponen unmount
  // agar tidak ada memory leak dari event listener yang menggantung
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-focus ke input pencarian saat dropdown terbuka
  // setTimeout(50ms) diperlukan karena elemen input baru dirender
  // setelah state open=true — perlu satu render cycle sebelum bisa di-focus
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setSearch('')  // reset pencarian saat dropdown ditutup
  }, [open])

  // Toggle satu item: jika sudah ada di selected → hapus, jika belum → tambah
  const toggle = (iri) =>
    onChange(selected.includes(iri)
      ? selected.filter(s => s !== iri)   // hapus dari array
      : [...selected, iri]                 // tambah ke array
    )

  // Filter opsi berdasarkan teks pencarian (case-insensitive),
  // lalu sort: item yang sudah dipilih muncul di atas
  const filtered = opsi
    .filter(o => o.nama.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aS = selected.includes(a.iri)
      const bS = selected.includes(b.iri)
      if (aS && !bS) return -1   // a dipilih, b tidak → a lebih atas
      if (!aS && bS) return 1    // b dipilih, a tidak → b lebih atas
      return 0                    // keduanya sama → urutan tetap
    })

  return (
    <div className="relative" ref={ref}>
      {/* Label dropdown */}
      <label className="block text-[10px] font-semibold text-[#8fa3b0] uppercase tracking-widest mb-1.5">
        {label}
      </label>

      {/* Tombol trigger dropdown — warna berubah jika ada item dipilih */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
          selected.length > 0
            ? 'border-[#2aab7e] bg-[rgba(42,171,126,0.06)] text-[#186848]'
            : 'border-[#dde8ec] bg-[#f7fafa] text-[#4f6370] hover:border-[#b0c8d4]'
        }`}
      >
        <span className="truncate text-[12px]">
          {selected.length === 0
            ? placeholder
            : selected.length === 1
              ? opsi.find(o => o.iri === selected[0])?.nama || selected[0]
              : `${selected.length} dipilih`}
        </span>
        {/* Jika ada pilihan: tampilkan X untuk clear; jika tidak: tampilkan chevron */}
        {selected.length > 0
          ? (
            <X
              size={13}
              // stopPropagation() mencegah klik X juga memicu onClick pada button parent
              onClick={e => { e.stopPropagation(); onChange([]) }}
              className="shrink-0 hover:text-red-500"
            />
          )
          : (
            <ChevronDown
              size={13}
              className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          )
        }
      </button>

      {/* Panel dropdown — hanya dirender saat open=true */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#dde8ec] rounded-xl shadow-[0_8px_32px_rgba(13,31,45,0.10)] overflow-hidden">

          {/* Input pencarian di dalam dropdown */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#eaf1f4]">
            <Search size={13} className="text-[#8fa3b0] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              // stopPropagation() mencegah klik input menutup dropdown
              onClick={e => e.stopPropagation()}
              placeholder="Ketik untuk mencari..."
              className="flex-1 text-xs outline-none bg-transparent text-[#0e2233] placeholder:text-[#8fa3b0]"
            />
            {/* Tombol clear pencarian — hanya muncul jika ada teks */}
            {search && (
              <button onClick={e => { e.stopPropagation(); setSearch('') }}>
                <X size={11} className="text-[#8fa3b0]" />
              </button>
            )}
          </div>

          {/* Daftar pilihan — dibatasi tingginya dengan scroll */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? (
                <p className="px-3 py-3 text-xs text-[#8fa3b0] text-center">
                  Tidak ada hasil untuk &ldquo;{search}&rdquo;
                </p>
              )
              : filtered.map(o => (
                <button
                  key={o.iri}
                  type="button"
                  onClick={() => toggle(o.iri)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors ${
                    selected.includes(o.iri)
                      ? 'bg-[rgba(42,171,126,0.06)] text-[#186848]'
                      : 'text-[#4f6370] hover:bg-[#f7fafa]'
                  }`}
                >
                  {/* Checkbox custom — kotak dengan centang jika dipilih */}
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    selected.includes(o.iri)
                      ? 'bg-[#2aab7e] border-[#2aab7e] text-white'
                      : 'border-[#dde8ec]'
                  }`}>
                    {selected.includes(o.iri) && <Check size={10} />}
                  </span>
                  {o.nama}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HALAMAN UTAMA: CariPage
// Client Component yang mengelola seluruh state pencarian.
// ─────────────────────────────────────────────────────────────
export default function CariPage() {
  // ── State filter & keyword ──────────────────────────────
  const [keyword, setKeyword]       = useState('')
  const [jenisLayanan, setJenis]    = useState([])
  const [kelompok, setKelompok]     = useState([])
  const [penjaminan, setPenjaminan] = useState([])
  const [keluhan, setKeluhan]       = useState([])
  const [kondisi, setKondisi]       = useState([])
  const [wilayah, setWilayah]       = useState([])

  // ── Opsi dropdown dari API (dinamis dari ontologi) ──────
  const [opsiKeluhan, setOpsiKeluhan] = useState([])
  const [opsiKondisi, setOpsiKondisi] = useState([])
  const [opsiWilayah, setOpsiWilayah] = useState([])

  // ── State UI ────────────────────────────────────────────
  const [results, setResults]     = useState([])   // hasil pencarian
  const [loading, setLoading]     = useState(false) // sedang loading?
  const [searched, setSearched]   = useState(false) // sudah pernah search? (untuk state kosong)
  const [showFilter, setShowFilter] = useState(false) // panel filter terbuka?
  const [debug, setDebug]         = useState(null)  // data debug SPARQL untuk SparqlPanel

  // ── Fetch opsi filter saat halaman pertama dimuat ───────
  // Dependency array kosong [] = hanya dijalankan sekali saat mount.
  // .catch(() => {}) sengaja kosong — jika fetch gagal, dropdown
  // hanya kosong, tidak perlu menampilkan error ke pengguna.
  useEffect(() => {
    fetch('/api/sparql?action=filter-opsi')
      .then(r => r.json())
      .then(d => {
        setOpsiKeluhan(d.keluhan || [])
        setOpsiKondisi(d.kondisi || [])
        setOpsiWilayah(d.wilayah || [])
      })
      .catch(() => {})
  }, [])

  // ─────────────────────────────────────────────────────────
  // buildParams()
  // Membangun URLSearchParams dari semua parameter pencarian.
  // Menggunakan useCallback agar fungsi ini tidak dibuat ulang
  // setiap render — penting karena dipakai sebagai dependency
  // di useCallback doSearch di bawah.
  // append() dipakai (bukan set()) agar satu key bisa punya
  // banyak nilai: ?keluhan=nyeri&keluhan=pusing
  // ─────────────────────────────────────────────────────────
  const buildParams = useCallback((kw, j, k, p, kl, ko, w) => {
    const params = new URLSearchParams()
    params.set('action', 'cari')
    if (kw) params.set('q', kw)
    j.forEach(v  => params.append('jenis', v))
    k.forEach(v  => params.append('kelompok', v))
    p.forEach(v  => params.append('penjaminan', v))
    kl.forEach(v => params.append('keluhan', v))
    ko.forEach(v => params.append('kondisi', v))
    w.forEach(v  => params.append('wilayah', v))
    return params
  }, [])

  // ─────────────────────────────────────────────────────────
  // doSearch()
  // Fungsi inti pencarian: fetch ke API SPARQL dan update state.
  // useCallback dengan dependency [buildParams] agar tidak
  // dibuat ulang kecuali buildParams berubah.
  // setSearched(true) diset di awal agar state "belum search"
  // tidak muncul saat loading berlangsung.
  // ─────────────────────────────────────────────────────────
  const doSearch = useCallback(async (kw, j, k, p, kl, ko, w) => {
    setLoading(true)
    setSearched(true)
    try {
      const res  = await fetch(`/api/sparql?${buildParams(kw, j, k, p, kl, ko, w)}`)
      const data = await res.json()
      setResults(data.results || [])
      setDebug(data.sparqlDebug || null)
    } catch {
      // Jika fetch gagal (network error, dll.), tampilkan hasil kosong
      setResults([])
    } finally {
      // finally selalu dijalankan — pastikan loading dimatikan
      // baik saat berhasil maupun gagal
      setLoading(false)
    }
  }, [buildParams])

  // ─────────────────────────────────────────────────────────
  // useEffect: restore state saat kembali dari halaman detail
  //
  // Skenario: pengguna klik kartu layanan → halaman detail →
  // klik tombol kembali → halaman ini dimuat ulang.
  // Flag SS.dariDetail di sessionStorage memberi tahu bahwa
  // state pencarian perlu dipulihkan.
  //
  // Dependency array sengaja dikosongkan [] karena hanya boleh
  // berjalan sekali saat mount. doSearch tidak dimasukkan ke
  // dependency untuk menghindari infinite loop — ini pola
  // yang umum dan aman karena doSearch dibungkus useCallback
  // dan tidak akan berubah referensi selama siklus hidup komponen.
  // eslint-disable-line di bawah menekan peringatan lint untuk ini.
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const dariDetail = sessionStorage.getItem(SS.dariDetail) === 'true'
    // Hapus flag segera agar tidak mempengaruhi navigasi berikutnya
    sessionStorage.removeItem(SS.dariDetail)

    if (dariDetail) {
      const s = loadState()
      if (s) {
        // Pulihkan semua state filter dari sessionStorage
        setKeyword(s.keyword)
        setJenis(s.jenis)
        setKelompok(s.kelompok)
        setPenjaminan(s.penjaminan)
        setKeluhan(s.keluhan)
        setKondisi(s.kondisi)
        setWilayah(s.wilayah)
        // Buka panel filter jika sebelumnya ada filter aktif
        const hasFilter = s.jenis.length || s.kelompok.length || s.penjaminan.length
          || s.keluhan.length || s.kondisi.length || s.wilayah.length
        if (hasFilter) setShowFilter(true)
        // Jalankan ulang pencarian dengan state yang dipulihkan
        doSearch(s.keyword, s.jenis, s.kelompok, s.penjaminan, s.keluhan, s.kondisi, s.wilayah)
        return
      }
    }
    // Jika bukan dari detail, load semua layanan tanpa filter
    doSearch('', [], [], [], [], [], [])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────
  // useEffect: auto-save state ke sessionStorage
  // Dijalankan setiap kali salah satu state filter berubah,
  // sehingga state selalu tersimpan tanpa perlu dipanggil manual.
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    saveState(keyword, jenisLayanan, kelompok, penjaminan, keluhan, kondisi, wilayah)
  }, [keyword, jenisLayanan, kelompok, penjaminan, keluhan, kondisi, wilayah])

  // ─────────────────────────────────────────────────────────
  // handleSearch()
  // Dipanggil saat tombol "Cari" atau "Terapkan Filter" diklik,
  // atau saat Enter ditekan di input keyword.
  // Menyimpan state lalu menjalankan pencarian.
  // ─────────────────────────────────────────────────────────
  const handleSearch = () => {
    saveState(keyword, jenisLayanan, kelompok, penjaminan, keluhan, kondisi, wilayah)
    doSearch(keyword, jenisLayanan, kelompok, penjaminan, keluhan, kondisi, wilayah)
  }

  // Hitung total filter aktif untuk ditampilkan di badge tombol Filter
  const activeCount = jenisLayanan.length + kelompok.length + penjaminan.length
    + keluhan.length + kondisi.length + wilayah.length

  // Reset semua filter sekaligus — keyword tidak ikut direset
  const clearAll = () => {
    setJenis([])
    setKelompok([])
    setPenjaminan([])
    setKeluhan([])
    setKondisi([])
    setWilayah([])
  }

  return (
    <div>

      {/* ══════════════════════════════════════════════════════
          HEADER HALAMAN
          Latar gelap dengan dua radial glow dekoratif di
          sudut kiri dan kanan atas.
          ══════════════════════════════════════════════════ */}
      <div className="bg-[#0e2233] relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12">        <div className="absolute top-[-20%] left-[-5%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(42,171,126,0.14) 0%, transparent 65%)' }} />
        {/* Dekorasi radial glow kanan */}
        <div className="absolute top-[-20%] right-[-5%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(42,171,126,0.14) 0%, transparent 65%)' }} />
        <div className="max-w-300 mx-auto relative z-10">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#7de8c2] mb-2.5">
            Fitur Pencarian
          </p>
          <h1
            className="font-normal text-[#eef7f4] leading-[1.15] mb-2"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(20px, 2.8vw, 30px)' }}
          >
            Cari Layanan Rumah Sakit
          </h1>
          <p className="text-[12px] text-[rgba(238,247,244,0.50)] font-light">
            Temukan layanan berdasarkan nama layanan, keluhan, atau kondisi medis dan kombinasi kriteria yang tersedia
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          KOTAK PENCARIAN
          Mengambang di atas konten dengan -mt-7 dan z-10,
          menciptakan efek overlap di atas header gelap.
          ══════════════════════════════════════════════════ */}
      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10">
        <div className="bg-white border border-[#dde8ec] rounded-xl p-3 sm:p-4 shadow-[0_8px_40px_rgba(13,31,45,0.10)]">
          <div className="flex flex-col sm:flex-row gap-2.5">

            {/* Input keyword */}
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2aab7e] pointer-events-none" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                // Jalankan pencarian saat Enter ditekan
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ketik nama layanan, keluhan, atau kondisi..."
                className="w-full pl-10 pr-9 py-2.5 border border-[#dde8ec] rounded-lg text-[12px] text-[#0e2233] bg-[#f7fafa] placeholder:text-[#8fa3b0] focus:outline-none focus:ring-2 focus:ring-[#2aab7e]/20 focus:border-[#2aab7e] focus:bg-white transition-all"
              />
              {/* Tombol clear keyword — hanya muncul jika ada teks */}
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa3b0] hover:text-[#4f6370]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Tombol Cari dan Filter */}
            <div className="flex gap-2.5 sm:shrink-0">
              {/* Tombol Cari — disabled saat loading, menampilkan spinner */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#2aab7e] hover:bg-[#229068] disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-lg text-[12px] transition-colors whitespace-nowrap"
              >
                {loading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Search size={15} />
                }
                <span>Cari</span>
              </button>

              {/* Tombol toggle panel filter — warna berubah jika ada filter aktif */}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 border px-3.5 py-2.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                  activeCount > 0 || showFilter
                    ? 'border-[#2aab7e] bg-[rgba(42,171,126,0.06)] text-[#186848]'
                    : 'border-[#dde8ec] text-[#4f6370] hover:border-[#b0c8d4]'
                }`}
              >
                <Filter size={15} />
                <span>Filter</span>
                {/* Badge jumlah filter aktif */}
                {activeCount > 0 && (
                  <span className="w-5 h-5 bg-[#2aab7e] text-white text-xs rounded-full flex items-center justify-center font-semibold leading-none">
                    {activeCount}
                  </span>
                )}
                <ChevronDown size={13} className={`transition-transform ${showFilter ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          BODY: PANEL FILTER + HASIL
          ══════════════════════════════════════════════════ */}
      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Panel Filter — hanya dirender saat showFilter=true */}
        {showFilter && (
          <div className="bg-white border border-[#dde8ec] rounded-xl p-4 sm:p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <p className="font-semibold text-[#0e2233] text-[13px]">Filter Pencarian</p>
              {/* Tombol hapus semua filter — hanya muncul jika ada yang aktif */}
              {activeCount > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  <X size={12} /> Hapus semua
                </button>
              )}
            </div>

            {/* Baris 1: Filter dinamis (dari ontologi via API) */}
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <MultiSelectDropdown
                label='Keluhan — "Saya merasakan..."'
                opsi={opsiKeluhan}
                selected={keluhan}
                onChange={setKeluhan}
                placeholder="Pilih keluhan"
              />
              <MultiSelectDropdown
                label='Kondisi Medis — "Saya sudah didiagnosis..."'
                opsi={opsiKondisi}
                selected={kondisi}
                onChange={setKondisi}
                placeholder="Pilih kondisi medis"
              />
            </div>

            {/* Baris 2: Filter statis (dari konstanta di /lib/constants) */}
            {/* JENIS_LAYANAN, KELOMPOK, PENJAMINAN dikonversi ke format { iri, nama }
                agar sesuai dengan interface yang diharapkan MultiSelectDropdown */}
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <MultiSelectDropdown
                label="Jenis Layanan"
                opsi={JENIS_LAYANAN.map(j => ({ iri: j.value, nama: j.label }))}
                selected={jenisLayanan}
                onChange={setJenis}
                placeholder="Semua jenis"
              />
              <MultiSelectDropdown
                label="Kelompok Pasien"
                opsi={KELOMPOK.map(k => ({ iri: k.value, nama: k.label }))}
                selected={kelompok}
                onChange={setKelompok}
                placeholder="Semua kelompok"
              />
              <MultiSelectDropdown
                label="Cara Pembayaran"
                opsi={PENJAMINAN.map(p => ({ iri: p.value, nama: p.label }))}
                selected={penjaminan}
                onChange={setPenjaminan}
                placeholder="Semua penjaminan"
              />
            </div>

            {/* Baris 3: Wilayah (dinamis dari API) */}
            <div className="mb-5">
              <MultiSelectDropdown
                label="Wilayah RS"
                opsi={opsiWilayah}
                selected={wilayah}
                onChange={setWilayah}
                placeholder="Semua wilayah Bali"
              />
            </div>

            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-[#2aab7e] hover:bg-[#229068] text-white font-medium px-4 py-2 rounded-lg text-[12px] transition-colors"
            >
              <Search size={14} /> Terapkan Filter
            </button>
          </div>
        )}

        {/* ── Kondisi render hasil: 4 kemungkinan state ─── */}

        {/* 1. Sedang loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[#8fa3b0]">
            <Loader2 size={22} className="animate-spin text-[#2aab7e]" />
            <p className="text-[12px] font-light">Memuat data dari ontologi…</p>
          </div>

        /* 2. Sudah search tapi tidak ada hasil */
        ) : results.length === 0 && searched ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-14 h-14 bg-[rgba(42,171,126,0.08)] rounded-full flex items-center justify-center">
              <Search size={22} className="text-[#2aab7e]" />
            </div>
            <h2
              className="text-[16px] font-normal text-[#0e2233]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Tidak ada hasil ditemukan
            </h2>
            <p className="text-[12px] text-[#8fa3b0] font-light">
              Coba kata kunci lain atau hapus beberapa filter
            </p>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-[12px] text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X size={13} /> Hapus Filter
              </button>
            )}
          </div>

        /* 3. Ada hasil — tampilkan grid kartu layanan */
        ) : results.length > 0 ? (
          <>
            <p className="text-[12px] text-[#8fa3b0] mb-4">
              {results.length} layanan ditemukan
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((item, i) => (
                <LayananCard
                  // Key gabungan kodeUniv + suffix + index untuk keunikan maksimal
                  key={`${item.kodeUniv}_${item.suffix}_${i}`}
                  item={item}
                  // Set flag sebelum navigasi ke detail agar state bisa dipulihkan saat kembali
                  onClick={() => sessionStorage.setItem(SS.dariDetail, 'true')}
                />
              ))}
            </div>
          </>

        /* 4. Belum search sama sekali (null state awal) */
        ) : null}

        {/* Panel debug SPARQL — hanya tampil jika ada data debug */}
        <SparqlPanel debug={debug} />
      </div>

    </div>
  )
}