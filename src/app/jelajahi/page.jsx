'use client'

export const dynamic = 'force-dynamic'


import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Search, X, ChevronDown, ChevronLeft, ChevronRight, Stethoscope, Users, CreditCard, MessageCircle, Heart, MapPin } from 'lucide-react'
import { JENIS_LAYANAN, KELOMPOK, PENJAMINAN } from '@/lib/constants'
import LayananCard from '@/components/LayananCard'

const PER_PAGE = 12

const EMPTY_FILTERS = {
  jenis:      null,
  keluhan:    null,
  kondisi:    null,
  kelompok:   null,
  penjaminan: null,
  wilayah:    null,
}

function DropdownPortal({ triggerRef, children, open }) {
  const [style, setStyle] = useState({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open || !triggerRef.current) return

    const calc = () => {
      const rect        = triggerRef.current.getBoundingClientRect()
      const PANEL_W     = 224
      const PANEL_H     = 260
      const spaceBelow  = window.innerHeight - rect.bottom
      const spaceRight  = window.innerWidth  - rect.left

      const top = spaceBelow >= PANEL_H
        ? rect.bottom + window.scrollY + 6
        : rect.top    + window.scrollY - PANEL_H - 6

      const left = spaceRight >= PANEL_W
        ? rect.left   + window.scrollX
        : rect.right  + window.scrollX - PANEL_W

      setStyle({
        position: 'absolute',
        top,
        left,
        width: Math.max(rect.width, PANEL_W),
        zIndex: 99999,
      })
    }

    calc()
    window.addEventListener('scroll', calc, true)
    window.addEventListener('resize', calc)
    return () => {
      window.removeEventListener('scroll', calc, true)
      window.removeEventListener('resize', calc)
    }
  }, [open, triggerRef])

  if (!mounted || !open) return null

  return createPortal(
    <div style={style}>{children}</div>,
    document.body
  )
}

function FilterDropdown({ label, icon: Icon, opsi, value, onChange, opsiLoading }) {
  const [open, setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef(null)
  const panelRef   = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current  && !panelRef.current.contains(e.target)
      ) {
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

  const filtered = opsi.filter(o =>
    o.nama.toLowerCase().includes(search.toLowerCase())
  )

  const selectedNama = value ? opsi.find(o => o.iri === value)?.nama : null
  const isActive     = !!value

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={[
          'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12px] transition-all text-left',
          isActive
            ? 'border-[#2aab7e] bg-[rgba(42,171,126,0.06)] text-[#186848]'
            : open
            ? 'border-[#2aab7e] bg-white ring-2 ring-[#2aab7e]/20 text-[#0e2233]'
            : 'border-[#dde8ec] bg-[#f7fafa] text-[#4f6370] hover:border-[#b0c8d4] hover:bg-white',
        ].join(' ')}
      >
        <Icon size={14} className={isActive || open ? 'text-[#2aab7e] shrink-0' : 'text-[#c4d2da] shrink-0'} />
        <span className="flex-1 min-w-0 overflow-hidden">
          {selectedNama
            ? <span className="block truncate font-medium text-[#186848]">{selectedNama}</span>
            : <span className="block truncate text-[#8fa3b0]">{label}</span>
          }
        </span>
        {isActive
          ? <X size={13} className="shrink-0 text-[#8fa3b0] hover:text-red-500 transition-colors"
              onClick={e => { e.stopPropagation(); onChange(null) }} />
          : <ChevronDown size={13} className={`shrink-0 text-[#c4d2da] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      <DropdownPortal triggerRef={triggerRef} open={open}>
        <div
          ref={panelRef}
          className="bg-white border border-[#dde8ec] rounded-xl shadow-[0_8px_32px_rgba(13,31,45,0.18)] overflow-hidden"
        >
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
                  onClick={() => { onChange(isSelected ? null : o.iri); setOpen(false); setSearch('') }}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-left transition-colors',
                    isSelected
                      ? 'bg-[rgba(42,171,126,0.08)] text-[#186848] font-medium'
                      : 'text-[#4f6370] hover:bg-[#f7fafa]',
                  ].join(' ')}
                >
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
      </DropdownPortal>
    </div>
  )
}

export default function JelajahiPage() {
  const [filters, setFilters]         = useState(EMPTY_FILTERS)
  const [opsiDynamic, setOpsiDynamic] = useState({ keluhan: [], kondisi: [], wilayah: [] })
  const [results, setResults]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [searched, setSearched]       = useState(false)
  const [page, setPage]               = useState(1)

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
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const kriteria = sessionStorage.getItem('jelajahi_kriteria')
    const filter   = sessionStorage.getItem('jelajahi_filter')
    sessionStorage.removeItem('jelajahi_dari_detail')

    if (kriteria && filter) {
      try {
        const p = JSON.parse(filter)
        if (p?.[0]) {
          const restored = { ...EMPTY_FILTERS, [kriteria]: p[0] }
          setFilters(restored)
          fetchResults(restored)
          return
        }
      } catch {
      }
    }
    fetchResults(EMPTY_FILTERS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setPage(1) }, [results])

  const handleChange = (key, nilai) => {
    const next = { ...EMPTY_FILTERS, [key]: nilai }
    setFilters(next)
    if (nilai) {
      sessionStorage.setItem('jelajahi_kriteria', key)
      sessionStorage.setItem('jelajahi_filter', JSON.stringify([nilai]))
    } else {
      sessionStorage.removeItem('jelajahi_kriteria')
      sessionStorage.removeItem('jelajahi_filter')
    }
    fetchResults(next)
  }

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE))
  const paginated  = results.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const goToPage = (p) => {
    setPage(Math.min(Math.max(1, p), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const DROPDOWNS = [
    { key: 'jenis',      label: 'Jenis Layanan',  icon: Stethoscope,   opsi: JENIS_LAYANAN.map(o => ({ iri: o.value, nama: o.label })), opsiLoading: false },
    { key: 'keluhan',    label: 'Keluhan',         icon: MessageCircle, opsi: opsiDynamic.keluhan, opsiLoading: opsiDynamic.keluhan.length === 0 },
    { key: 'kondisi',    label: 'Kondisi Medis',   icon: Heart,         opsi: opsiDynamic.kondisi, opsiLoading: opsiDynamic.kondisi.length === 0 },
    { key: 'kelompok',   label: 'Kelompok Pasien', icon: Users,         opsi: KELOMPOK.map(o => ({ iri: o.value, nama: o.label })), opsiLoading: false },
    { key: 'penjaminan', label: 'Cara Pembayaran', icon: CreditCard,    opsi: PENJAMINAN.map(o => ({ iri: o.value, nama: o.label })), opsiLoading: false },
    { key: 'wilayah',    label: 'Wilayah RS',      icon: MapPin,        opsi: opsiDynamic.wilayah, opsiLoading: opsiDynamic.wilayah.length === 0 },
  ]

  return (
    <div>
      <div className="bg-[#0e2233] relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12">
        <div className="absolute top-[-20%] left-[-5%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(42,171,126,0.14) 0%, transparent 65%)' }} />
        <div className="absolute top-[-20%] right-[-5%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(42,171,126,0.14) 0%, transparent 65%)' }} />
        <div className="max-w-300 mx-auto relative z-10">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#7de8c2] mb-2.5">Fitur Penjelajahan</p>
          <h1 className="font-normal text-[#eef7f4] leading-[1.15] mb-2"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(20px, 2.8vw, 30px)' }}>
            Jelajahi Layanan Rumah Sakit
          </h1>
          <p className="text-[12px] text-[rgba(238,247,244,0.50)] font-light">
            Pilih salah satu kriteria untuk menemukan layanan yang sesuai
          </p>
        </div>
      </div>

      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10">
        <div className="bg-white border border-[#dde8ec] rounded-xl p-3 sm:p-4 shadow-[0_8px_40px_rgba(13,31,45,0.10)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {DROPDOWNS.map(d => (
              <FilterDropdown
                key={d.key}
                label={d.label}
                icon={d.icon}
                opsi={d.opsi}
                value={filters[d.key]}
                onChange={(val) => handleChange(d.key, val)}
                opsiLoading={d.opsiLoading}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-[#8fa3b0]">
            <Loader2 size={22} className="animate-spin text-[#2aab7e]" />
            <p className="text-[12px] font-light">Memuat data dari ontologi…</p>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-14 h-14 bg-[rgba(42,171,126,0.08)] rounded-full flex items-center justify-center">
              <Search size={20} className="text-[#2aab7e]" />
            </div>
            <h2 className="text-[16px] font-normal text-[#0e2233]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Tidak ada hasil
            </h2>
            <p className="text-[12px] text-[#8fa3b0] font-light">Coba pilih kategori lain</p>
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
                  onClick={() => sessionStorage.setItem('jelajahi_dari_detail', 'true')}
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
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-[#8fa3b0]">
            <Loader2 size={22} className="animate-spin text-[#2aab7e]" />
            <p className="text-[12px] font-light">Memuat layanan…</p>
          </div>
        )}
      </div>
    </div>
  )
}