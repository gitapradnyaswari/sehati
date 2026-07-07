'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'
import { JENIS_LAYANAN, KELOMPOK, PENJAMINAN } from '@/lib/constants'
import LayananCard from '@/components/LayananCard'

const PER_PAGE = 12

const SS = {
  keyword:    'cari_keyword',
  jenis:      'cari_jenis',
  kelompok:   'cari_kelompok',
  penjaminan: 'cari_penjaminan',
  keluhan:    'cari_keluhan',
  kondisi:    'cari_kondisi',
  wilayah:    'cari_wilayah',
  dariDetail: 'cari_dari_detail',
}

function saveState(keyword, jenis, kelompok, penjaminan, keluhan, kondisi, wilayah) {
  sessionStorage.setItem(SS.keyword,    keyword)
  sessionStorage.setItem(SS.jenis,      JSON.stringify(jenis))
  sessionStorage.setItem(SS.kelompok,   JSON.stringify(kelompok))
  sessionStorage.setItem(SS.penjaminan, JSON.stringify(penjaminan))
  sessionStorage.setItem(SS.keluhan,    JSON.stringify(keluhan))
  sessionStorage.setItem(SS.kondisi,    JSON.stringify(kondisi))
  sessionStorage.setItem(SS.wilayah,    JSON.stringify(wilayah))
}

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
    return null
  }
}

function MultiSelectDropdown({ label, opsi, selected, onChange, placeholder }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref      = useRef(null)
  const inputRef = useRef(null)

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

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setSearch('')
  }, [open])

  const toggle = (iri) =>
    onChange(selected.includes(iri)
      ? selected.filter(s => s !== iri)
      : [...selected, iri]
    )

  const filtered = opsi
    .filter(o => o.nama.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aS = selected.includes(a.iri)
      const bS = selected.includes(b.iri)
      if (aS && !bS) return -1
      if (!aS && bS) return 1
      return 0
    })

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[10px] font-semibold text-[#8fa3b0] uppercase tracking-widest mb-1.5">
        {label}
      </label>

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
        {selected.length > 0
          ? (
            <X
              size={13}
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

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#dde8ec] rounded-xl shadow-[0_8px_32px_rgba(13,31,45,0.10)] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#eaf1f4]">
            <Search size={13} className="text-[#8fa3b0] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Ketik untuk mencari..."
              className="flex-1 text-xs outline-none bg-transparent text-[#0e2233] placeholder:text-[#8fa3b0]"
            />
            {search && (
              <button onClick={e => { e.stopPropagation(); setSearch('') }}>
                <X size={11} className="text-[#8fa3b0]" />
              </button>
            )}
          </div>

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

export default function CariPage() {
  const [keyword, setKeyword]       = useState('')
  const [jenisLayanan, setJenis]    = useState([])
  const [kelompok, setKelompok]     = useState([])
  const [penjaminan, setPenjaminan] = useState([])
  const [keluhan, setKeluhan]       = useState([])
  const [kondisi, setKondisi]       = useState([])
  const [wilayah, setWilayah]       = useState([])

  const [opsiKeluhan, setOpsiKeluhan] = useState([])
  const [opsiKondisi, setOpsiKondisi] = useState([])
  const [opsiWilayah, setOpsiWilayah] = useState([])

  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [searched, setSearched]     = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [page, setPage]             = useState(1)

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

  const doSearch = useCallback(async (kw, j, k, p, kl, ko, w) => {
    setLoading(true)
    setSearched(true)
    try {
      const res  = await fetch(`/api/sparql?${buildParams(kw, j, k, p, kl, ko, w)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    const dariDetail = sessionStorage.getItem(SS.dariDetail) === 'true'
    sessionStorage.removeItem(SS.dariDetail)

    if (dariDetail) {
      const s = loadState()
      if (s) {
        setKeyword(s.keyword)
        setJenis(s.jenis)
        setKelompok(s.kelompok)
        setPenjaminan(s.penjaminan)
        setKeluhan(s.keluhan)
        setKondisi(s.kondisi)
        setWilayah(s.wilayah)
        const hasFilter = s.jenis.length || s.kelompok.length || s.penjaminan.length
          || s.keluhan.length || s.kondisi.length || s.wilayah.length
        if (hasFilter) setShowFilter(true)
        doSearch(s.keyword, s.jenis, s.kelompok, s.penjaminan, s.keluhan, s.kondisi, s.wilayah)
        return
      }
    }
    doSearch('', [], [], [], [], [], [])
  }, [])

  useEffect(() => {
    saveState(keyword, jenisLayanan, kelompok, penjaminan, keluhan, kondisi, wilayah)
  }, [keyword, jenisLayanan, kelompok, penjaminan, keluhan, kondisi, wilayah])

  useEffect(() => { setPage(1) }, [results])

  const handleSearch = () => {
    saveState(keyword, jenisLayanan, kelompok, penjaminan, keluhan, kondisi, wilayah)
    doSearch(keyword, jenisLayanan, kelompok, penjaminan, keluhan, kondisi, wilayah)
  }

  const activeCount = jenisLayanan.length + kelompok.length + penjaminan.length
    + keluhan.length + kondisi.length + wilayah.length

  const clearAll = () => {
    setJenis([])
    setKelompok([])
    setPenjaminan([])
    setKeluhan([])
    setKondisi([])
    setWilayah([])
  }

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE))
  const paginated  = results.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const goToPage = (p) => {
    setPage(Math.min(Math.max(1, p), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="bg-[#0e2233] relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12">
        <div className="absolute top-[-20%] left-[-5%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(42,171,126,0.14) 0%, transparent 65%)' }} />
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

      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10">
        <div className="bg-white border border-[#dde8ec] rounded-xl p-3 sm:p-4 shadow-[0_8px_40px_rgba(13,31,45,0.10)]">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2aab7e] pointer-events-none" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ketik nama layanan, keluhan, atau kondisi..."
                className="w-full pl-10 pr-9 py-2.5 border border-[#dde8ec] rounded-lg text-[12px] text-[#0e2233] bg-[#f7fafa] placeholder:text-[#8fa3b0] focus:outline-none focus:ring-2 focus:ring-[#2aab7e]/20 focus:border-[#2aab7e] focus:bg-white transition-all"
              />
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa3b0] hover:text-[#4f6370]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2.5 sm:shrink-0">
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

      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {showFilter && (
          <div className="bg-white border border-[#dde8ec] rounded-xl p-4 sm:p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <p className="font-semibold text-[#0e2233] text-[13px]">Filter Pencarian</p>
              {activeCount > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  <X size={12} /> Hapus semua
                </button>
              )}
            </div>

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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[#8fa3b0]">
            <Loader2 size={22} className="animate-spin text-[#2aab7e]" />
            <p className="text-[12px] font-light">Memuat data dari ontologi…</p>
          </div>

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

        ) : results.length > 0 ? (
          <>
            <p className="text-[12px] text-[#8fa3b0] mb-4">
              {results.length} layanan ditemukan
              <span className="text-[#b0c8d4]">
                {' '}· menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, results.length)}
              </span>
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginated.map((item, i) => (
                <LayananCard
                  key={`${item.kodeUniv}_${item.suffix}_${(page - 1) * PER_PAGE + i}`}
                  item={item}
                  onClick={() => sessionStorage.setItem(SS.dariDetail, 'true')}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#dde8ec] text-[12px] text-[#4f6370] hover:border-[#b0c8d4] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} /> Sebelumnya
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-9 h-9 rounded-lg text-[12px] font-medium transition-colors ${
                      p === page
                        ? 'bg-[#2aab7e] text-white'
                        : 'border border-[#dde8ec] text-[#4f6370] hover:border-[#b0c8d4] hover:bg-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#dde8ec] text-[12px] text-[#4f6370] hover:border-[#b0c8d4] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Berikutnya <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>

        ) : null}

      </div>
    </div>
  )
}