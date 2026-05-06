'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Loader2, Building2,
  Download, ArrowLeftRight, ArrowRight,
  Info, ClipboardCheck, HeartPulse,
  CheckCircle2, XCircle, AlertTriangle, HelpCircle,
} from 'lucide-react'
import { JENIS_WARNA } from '@/lib/constants'
import SparqlPanel from '@/components/SparqlPanel'

const TABS = [
  { id: 'info',      label: 'Informasi Medis', icon: Info },
  { id: 'rs',        label: 'Info RS',          icon: Building2 },
  { id: 'persiapan', label: 'Persiapan',        icon: ClipboardCheck },
  { id: 'pasca',     label: 'Pascalayanan',     icon: HeartPulse },
]

const JENIS_LABEL = {
  LayananEmergensi:    'Darurat',
  LayananDiagnostik:   'Diagnostik',
  LayananBedah:        'Bedah',
  LayananTerapetik:    'Terapetik',
  LayananIntensif:     'Intensif',
  LayananRawatInap:    'Rawat Inap',
  LayananRehabilitasi: 'Rehabilitasi',
  LayananKonsultasi:   'Poliklinik',
  LayananSkrining:     'Skrining',
}

function ekstrakKode(iri) {
  return iri.replace(/_RSBM$|_RSPR$/, '')
}

function Section({ title, icon, variant, children }) {
  const base = 'rounded-xl border px-4 py-3.5'
  const variants = {
    warning: 'bg-[#fef9ec] border-[#f6d860]',
    danger:  'bg-[#fff0f0] border-[#fca5a5]',
    default: 'bg-white border-[#dde8ec]',
  }
  return (
    <div className={`${base} ${variants[variant] || variants.default}`}>
      {title && (
        <p className="text-[13px] font-semibold text-[#0e2233] mb-2.5 flex items-center gap-1.5">
          {icon}{title}
        </p>
      )}
      {children}
    </div>
  )
}

function InfoItem({ label, value }) {
  if (!value) return null
  return (
    <div className="bg-[#f7fafa] border border-[#dde8ec] rounded-lg px-3 py-2.5 flex items-start gap-3">
      <p className="text-[11px] font-semibold text-[#8fa3b0] uppercase tracking-[0.08em] whitespace-nowrap shrink-0 w-36 m-0 pt-px">
        {label}
      </p>
      <p className="text-[12px] font-normal text-[#0e2233] m-0 leading-relaxed">{value}</p>
    </div>
  )
}

function ChecklistGroup({ title, items, color }) {
  if (!items?.length) return null
  const colorMap = {
    blue:   'bg-[#eff6ff] border-[#bfdbfe]',
    purple: 'bg-[#faf5ff] border-[#ddd6fe]',
    green:  'bg-[#f0fdf4] border-[#bbf7d0]',
    amber:  'bg-[#fffbeb] border-[#fde68a]',
  }
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${colorMap[color] || ''}`}>
      <p className="text-[13px] font-semibold text-[#0e2233] mb-2.5">{title}</p>
      <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2aab7e] shrink-0 mt-1.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LayananDetailPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const kode      = params.kode
  const rsDariURL = searchParams.get('rs') || 'RSBM'

  const [tab, setTab]             = useState('info')
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [debug, setDebug]         = useState(null)
  const [daftarRS, setDaftarRS]   = useState([])
  const [loadingRS, setLoadingRS] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!kode) return
    setLoading(true)
    fetch(`/api/sparql?action=layanan&kode=${kode}&rs=${rsDariURL}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setDebug(d.sparqlDebug || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [kode, rsDariURL])

  const handleBukaTinjauModal = () => {
    setShowModal(true)
    if (daftarRS.length === 0) {
      setLoadingRS(true)
      fetch(`/api/sparql?action=rs-layanan&kode=${kode}`)
        .then(r => r.json())
        .then(d => { setDaftarRS(d); setLoadingRS(false) })
        .catch(() => setLoadingRS(false))
    }
  }

  // ─────────────────────────────────────────────────────────
  // handleKlikCarePath()
  // Dipanggil saat pengguna klik node sebelum/sesudah di
  // care path. Menyimpan kode layanan SAAT INI ke sessionStorage
  // sebagai "asal", sehingga tombol Kembali di halaman berikutnya
  // bisa kembali ke layanan ini (bukan ke halaman pencarian).
  // ─────────────────────────────────────────────────────────
  const handleKlikCarePath = () => {
    sessionStorage.setItem('carepath_dari', kode)
    sessionStorage.setItem('carepath_rs', rsDariURL)
  }

  // ─────────────────────────────────────────────────────────
  // handleKembali()
  // Urutan prioritas:
  //   1. Jika datang dari care path → kembali ke layanan asal
  //   2. Jika datang dari halaman Cari → kembali ke /cari
  //   3. Jika datang dari halaman Jelajahi → kembali ke /jelajahi
  //   4. Fallback → browser history back
  // ─────────────────────────────────────────────────────────
  const handleKembali = () => {
    const dariCarePath   = sessionStorage.getItem('carepath_dari')
    const dariCarePathRS = sessionStorage.getItem('carepath_rs') || 'RSBM'
    const dariCari       = sessionStorage.getItem('cari_dari_detail')     === 'true'
    const dariJelajahi   = sessionStorage.getItem('jelajahi_dari_detail') === 'true'

    if (dariCarePath) {
      // Hapus flag agar tidak mempengaruhi navigasi berikutnya
      sessionStorage.removeItem('carepath_dari')
      sessionStorage.removeItem('carepath_rs')
      window.location.href = `/layanan/${dariCarePath}?rs=${dariCarePathRS}`
    } else if (dariCari) {
      window.location.href = '/cari'
    } else if (dariJelajahi) {
      window.location.href = '/jelajahi'
    } else {
      window.history.back()
    }
  }

  const handleUnduhPDF = async () => {
    if (!data) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const W = 210, margin = 16, maxW = W - margin * 2
    let y = 0

    const univ           = data.universal      || {}
    const spesifik       = data.spesifik       || {}
    const dokumen        = data.dokumen        || { administrasi: [], penunjang: [] }
    const persiapan      = data.persiapan      || { prosedural: [], perlengkapan: [] }
    const poinKonsultasi = data.poinKonsultasi || []
    const namaRSLabel    = spesifik.namaRS     || rsDariURL

    doc.setFillColor(14, 34, 51); doc.rect(0, 0, W, 34, 'F')
    doc.setFillColor(42, 171, 126); doc.rect(0, 34, W, 1.5, 'F')

    doc.setFontSize(7); doc.setFont('helvetica', 'normal')
    doc.setTextColor(125, 232, 194)
    doc.text('SEHATi — Panduan Kunjungan Pasien', margin, 9)
    doc.setTextColor(143, 163, 176)
    doc.text(namaRSLabel, W - margin, 9, { align: 'right' })

    doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.setTextColor(238, 247, 244)
    doc.text(univ.namaLayanan || '', margin, 20)

    let badgeEndX = margin
    if (univ.jenisLayanan && JENIS_LABEL[univ.jenisLayanan]) {
      const lb    = JENIS_LABEL[univ.jenisLayanan]
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold')
      const pillW = doc.getTextWidth(lb) + 5
      doc.setFillColor(42, 171, 126)
      doc.roundedRect(margin, 24, pillW, 5, 1.2, 1.2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.text(lb, margin + 2.5, 27.8)
      badgeEndX = margin + pillW + 4
    }

    if (univ.namaLain?.length > 0) {
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal')
      doc.setTextColor(143, 163, 176)
      doc.text(`Alias: ${univ.namaLain.join(', ')}`, badgeEndX, 27.8)
    }

    y = 43

    const secHeader = (title, r, g, b) => {
      y += 2
      doc.setFillColor(r, g, b); doc.rect(margin, y, 2, 6.5, 'F')
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold')
      doc.setTextColor(14, 34, 51)
      doc.text(title, margin + 4.5, y + 4.8)
      y += 9
    }

    const subHeader = (title) => {
      doc.setFontSize(7); doc.setFont('helvetica', 'bold')
      doc.setTextColor(79, 99, 112)
      doc.text(title, margin, y)
      y += 4.5
    }

    const listItem = (text, r, g, b) => {
      doc.setFillColor(r, g, b)
      doc.circle(margin + 1.5, y - 0.8, 0.9, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.setTextColor(79, 99, 112)
      const lines = doc.splitTextToSize(text, maxW - 6)
      doc.text(lines, margin + 4.5, y)
      y += lines.length * 4.5 + 0.8
    }

    const infoRow = (label, value) => {
      const vl = doc.splitTextToSize(value, maxW - 32)
      const rH = Math.max(vl.length * 4.2, 5) + 1
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold')
      doc.setTextColor(14, 34, 51)
      doc.text(label.toUpperCase(), margin, y + 3.5)
      doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.text(vl, margin + 38, y + 3.5)
      doc.setDrawColor(234, 241, 244)
      doc.line(margin, y + rH + 1, W - margin, y + rH + 1)
      y += rH + 2.5
    }

    const divider = () => {
      y += 2
      doc.setDrawColor(221, 232, 236)
      doc.line(margin, y, W - margin, y)
      y += 4
    }

    secHeader('Informasi Rumah Sakit', 42, 171, 126)
    if (spesifik.namaUnit)          infoRow('Instalasi / Unit',  spesifik.namaUnit)
    if (spesifik.jadwalOperasional) infoRow('Jadwal',            spesifik.jadwalOperasional)
    if (spesifik.waktuKedatangan)   infoRow('Waktu Kedatangan',  spesifik.waktuKedatangan)
    if (spesifik.durasiTindakan)    infoRow('Durasi Tindakan',   spesifik.durasiTindakan)
    if (spesifik.durasiObservasi)   infoRow('Durasi Observasi',  spesifik.durasiObservasi)
    if (spesifik.jadwalKontrol)     infoRow('Kontrol Lanjutan',  spesifik.jadwalKontrol + (spesifik.namaKontrolUnit ? ` — ${spesifik.namaKontrolUnit}` : ''))
    if (spesifik.penjaminan?.length > 0) {
      infoRow('Penjaminan', spesifik.penjaminan.map(p =>
        p === 'BPJSJKNKIS' ? 'BPJS/JKN-KIS' :
        p === 'UmumMandiri' ? 'Umum/Mandiri' : 'Asuransi Swasta'
      ).join(' · '))
    }
    divider()

    const adaPersiapan = dokumen.administrasi.length > 0 || dokumen.penunjang.length > 0
      || persiapan.prosedural.length > 0 || persiapan.perlengkapan.length > 0
      || poinKonsultasi.length > 0

    if (adaPersiapan) {
      secHeader('Persiapan Sebelum Kunjungan', 26, 111, 168); y += 2
      if (dokumen.administrasi.length > 0)  { subHeader('Dokumen Administrasi');            dokumen.administrasi.forEach(d => listItem(d, 26, 111, 168));   y += 2 }
      if (dokumen.penunjang.length > 0)      { subHeader('Dokumen Penunjang');                dokumen.penunjang.forEach(d => listItem(d, 26, 111, 168));       y += 2 }
      if (persiapan.prosedural.length > 0)   { subHeader('Persiapan Prosedural');             persiapan.prosedural.forEach(p => listItem(p, 26, 111, 168));   y += 2 }
      if (persiapan.perlengkapan.length > 0) { subHeader('Perlengkapan yang Dibawa');         persiapan.perlengkapan.forEach(p => listItem(p, 26, 111, 168)); y += 2 }
      if (poinKonsultasi.length > 0)         { subHeader('Yang Perlu Disampaikan ke Dokter'); poinKonsultasi.forEach(p => listItem(p, 26, 111, 168)) }
    }

    doc.setFillColor(247, 250, 250); doc.rect(0, 285, W, 12, 'F')
    doc.setDrawColor(221, 232, 236); doc.line(0, 285, W, 285)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal')
    doc.setTextColor(143, 163, 176)
    doc.text('Dokumen ini bersifat informatif. Selalu ikuti arahan dokter dan tenaga kesehatan.', margin, 291)
    doc.text('Halaman 1 / 1', W - margin, 291, { align: 'right' })

    doc.save(`Panduan-${(univ.namaLayanan || 'Layanan').replace(/\s+/g, '-')}-${namaRSLabel}.pdf`)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={28} className="animate-spin text-[#2aab7e]" />
    </div>
  )

  if (!data || !data.universal) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
      <p className="text-[#8fa3b0] text-sm">Data layanan tidak ditemukan.</p>
      <button
        onClick={handleKembali}
        className="text-sm text-[#2aab7e] border border-[#dde8ec] px-4 py-2 rounded-lg hover:bg-[#f7fafa] transition-colors"
      >
        Kembali
      </button>
    </div>
  )

  const univ           = data.universal      || {}
  const spesifik       = data.spesifik       || {}
  const risiko         = data.risiko         || { umum: [], jarang: [] }
  const kondisi        = data.kondisi        || []
  const keluhan        = data.keluhan        || []
  const dokumen        = data.dokumen        || { administrasi: [], penunjang: [] }
  const persiapan      = data.persiapan      || { prosedural: [], perlengkapan: [] }
  const instruksi      = data.instruksi      || { instruksi: [], pembatasan: [] }
  const carePath       = data.carePath       || { sebelum: [], sesudah: [] }
  const poinKonsultasi = data.poinKonsultasi || []
  const namaRS         = spesifik.namaRS     || rsDariURL
  const warna          = JENIS_WARNA[univ.jenisLayanan]

  return (
    <div className="max-w-210 mx-auto px-3 sm:px-5 py-6 pb-16">

      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-[#8fa3b0] mb-4">
        <button
          onClick={handleKembali}
          className="inline-flex items-center gap-1 text-[#4f6370] hover:text-[#2aab7e] transition-colors"
        >
          <ChevronLeft size={13} /> Kembali
        </button>
        <span className="text-[#dde8ec]">/</span>
        <span className="text-[#0e2233] font-medium truncate max-w-xs">{univ.namaLayanan}</span>
      </div>

      {/* HEADER CARD */}
      <div className="bg-white border border-[#dde8ec] rounded-xl p-4 sm:p-5 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex-1 min-w-0">
            {warna && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mb-2"
                style={{ background: warna.bg, color: warna.text }}
              >
                {warna.label}
              </span>
            )}
            <h1 className="text-[18px] sm:text-[20px] font-semibold text-[#0e2233] leading-snug mb-1">
              {univ.namaLayanan}
            </h1>
            {univ.namaLain?.length > 0 && (
              <p className="text-[12px] text-[#8fa3b0] m-0">
                Juga dikenal sebagai: {univ.namaLain.join(', ')}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap shrink-0">
            <button
              onClick={handleUnduhPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.75 border border-[#dde8ec] rounded-lg bg-white text-xs font-medium text-[#4f6370] hover:border-[#2aab7e] hover:text-[#2aab7e] transition-colors whitespace-nowrap"
            >
              <Download size={12} />
              <span className="hidden sm:inline">Unduh Panduan</span>
            </button>
            <button
              onClick={handleBukaTinjauModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.75 border border-[#dde8ec] rounded-lg bg-white text-xs font-medium text-[#4f6370] hover:border-[#2aab7e] hover:text-[#2aab7e] transition-colors whitespace-nowrap"
            >
              <ArrowLeftRight size={12} />
              <span className="hidden sm:inline">Tinjau di RS Lain</span>
            </button>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 text-[11px] text-[#4f6370] bg-white border-[1.5px] border-[#2aab7e] rounded-lg px-3 py-1.5">
          <Building2 size={11} className="text-[#8fa3b0]" />
          Menampilkan data untuk:
          <strong className="text-[#2aab7e] font-semibold text-xs">{namaRS}</strong>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-0.5 bg-[#f7fafa] border border-[#dde8ec] rounded-lg p-0.5 mb-4 overflow-x-auto">
        {TABS.map(t => {
          const Icon     = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.75 rounded-md border-none text-[12px] font-sans whitespace-nowrap transition-all min-w-0 ${
                isActive
                  ? 'bg-[#2aab7e] text-white font-medium shadow-sm'
                  : 'bg-transparent text-[#4f6370] hover:text-[#0e2233]'
              }`}
            >
              <Icon size={11} className="shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* KONTEN TAB */}
      <div className="flex flex-col gap-2.5">

        {/* TAB: INFORMASI MEDIS */}
        {tab === 'info' && (<>

          {univ.tujuanLayanan && (
            <Section title="Tujuan Layanan">
              <p className="text-[12px] text-[#4f6370] leading-[1.7] m-0 font-normal">{univ.tujuanLayanan}</p>
            </Section>
          )}

          {kondisi.length > 0 && (
            <Section title="Kondisi yang Ditangani">
              <div className="flex flex-wrap gap-2">
                {kondisi.map((k, i) => (
                  <span key={i} className="text-[12px] font-normal bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] px-2.5 py-0.5 rounded-full">{k}</span>
                ))}
              </div>
            </Section>
          )}

          {keluhan.length > 0 && (
            <Section title="Keluhan yang Ditangani">
              <div className="flex flex-wrap gap-2">
                {keluhan.map((k, i) => (
                  <span key={i} className="text-[12px] font-normal bg-[#faf5ff] text-[#7c3aed] border border-[#ddd6fe] px-2.5 py-0.5 rounded-full">{k}</span>
                ))}
              </div>
            </Section>
          )}

          {univ.rekomendasiPadaKondisi?.length > 0 && (
            <Section title="Direkomendasikan Pada">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {univ.rekomendasiPadaKondisi.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
                    <CheckCircle2 size={13} className="text-[#2aab7e] shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {univ.tidakDirekomendasikanPada?.length > 0 && (
            <Section title="Tidak Direkomendasikan Untuk" variant="danger">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {univ.tidakDirekomendasikanPada.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
                    <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {univ.rasaTidakNyaman?.length > 0 && (
            <Section title="Rasa Tidak Nyaman yang Mungkin Terjadi">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {univ.rasaTidakNyaman.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />{r}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(risiko.umum.length > 0 || risiko.jarang.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-2.5">
              {risiko.umum.length > 0 && (
                <Section title="Risiko Umum" variant="warning">
                  <ul className="m-0 p-0 list-none flex flex-col gap-2">
                    {risiko.umum.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
                        <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />{r.nama}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {risiko.jarang.length > 0 && (
                <Section title="Risiko Jarang Terjadi" variant="danger">
                  <ul className="m-0 p-0 list-none flex flex-col gap-2">
                    {risiko.jarang.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
                        <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />{r.nama}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          )}

          {univ.pertanyaanUmum?.length > 0 && (
            <Section title="Pertanyaan Umum (FAQ)" icon={<HelpCircle size={13} className="text-[#8fa3b0]" />}>
              <div className="flex flex-col gap-2.5">
                {univ.pertanyaanUmum.map((qa, i) => {
                  const parts = qa.split('→')
                  const q     = parts[0]?.trim()
                  const a     = parts[1]?.trim()
                  return (
                    <div key={i} className="border border-[#dde8ec] rounded-lg px-3 py-2.5">
                      <p className="text-[12px] font-medium text-[#0e2233] m-0">{q}</p>
                      {a && (
                        <p className="text-[12px] text-[#4f6370] mt-2 mb-0 pl-3 border-l-2 border-[#2aab7e] leading-[1.6]">{a}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {univ.miskonsepsi?.length > 0 && (
            <Section title="Miskonsepsi Umum">
              <div className="flex flex-col gap-3">
                {univ.miskonsepsi.map((m, i) => {
                  const parts   = m.split('→')
                  const klaim   = parts[0]?.trim()
                  const koreksi = parts[1]?.trim()
                  return (
                    <div key={i} className="border border-[#fda4af] rounded-[10px] overflow-hidden">
                      <div className="flex items-start gap-2.5 px-3 py-2 bg-[#fff1f2]">
                        <span className="shrink-0 mt-0.5 text-[11px] font-bold tracking-wider text-[#be123c] bg-[#fecdd3] border border-[#fda4af] rounded-[5px] px-1.75 py-0.5 whitespace-nowrap">
                          MITOS
                        </span>
                        <p className="text-[12px] text-[#881337] font-medium leading-normal m-0">{klaim}</p>
                      </div>
                      {koreksi && (
                        <div className="flex items-start gap-2.5 px-3 py-2 bg-[#f0fdf4] border-t border-[#bbf7d0]">
                          <span className="shrink-0 mt-0.5 text-[11px] font-bold tracking-wider text-[#15803d] bg-[#dcfce7] border border-[#86efac] rounded-[5px] px-1.75 py-0.5 whitespace-nowrap">
                            FAKTA
                          </span>
                          <p className="text-[12px] text-[#166534] leading-normal m-0">{koreksi}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>
          )}
        </>)}

        {/* TAB: INFO RS */}
        {tab === 'rs' && (<>
          <div className="grid sm:grid-cols-2 gap-2">
            <InfoItem label="Instalasi/Unit"     value={spesifik.namaUnit} />
            <InfoItem label="Jadwal Operasional" value={spesifik.jadwalOperasional} />
            <InfoItem label="Waktu Kedatangan"   value={spesifik.waktuKedatangan} />
            <InfoItem label="Durasi Tindakan"    value={spesifik.durasiTindakan} />
            <InfoItem label="Durasi Observasi"   value={spesifik.durasiObservasi} />
            <InfoItem label="Jadwal Kontrol"     value={spesifik.jadwalKontrol} />
          </div>

          {spesifik.keteranganRujukan && (
            <Section title="Informasi Rujukan" variant="warning">
              <p className="text-[12px] text-[#4f6370] font-normal leading-[1.7] m-0">{spesifik.keteranganRujukan}</p>
            </Section>
          )}

          {spesifik.persetujuanTindakan && (
            <Section title="Persetujuan Tindakan (Informed Consent)">
              <p className="text-[12px] text-[#4f6370] font-normal leading-[1.7] m-0">{spesifik.persetujuanTindakan}</p>
            </Section>
          )}

          {spesifik.penjaminan?.length > 0 && (
            <Section title="Jenis Penjaminan yang Diterima">
              <div className="flex flex-wrap gap-2">
                {spesifik.penjaminan.map((p, i) => (
                  <span key={i} className="text-[12px] font-normal bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] px-2.5 py-0.5 rounded-full">
                    {p === 'BPJSJKNKIS' ? 'BPJS / JKN-KIS' : p === 'UmumMandiri' ? 'Umum / Mandiri' : 'Asuransi Swasta'}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {spesifik.tenaga?.length > 0 && (
            <Section title="Tenaga Kesehatan yang Terlibat">
              <div className="grid sm:grid-cols-2 gap-2">
                {spesifik.tenaga.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#4f6370] bg-[#f7fafa] rounded-md px-2.5 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a6fa8] shrink-0" />{t}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {spesifik.tahapanLayanan?.length > 0 && (
            <Section title="Tahapan Layanan">
              <ol className="m-0 p-0 list-none flex flex-col gap-2.5">
                {spesifik.tahapanLayanan.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 shrink-0 rounded-full bg-[#e0f1fa] text-[#075985] text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[12px] text-[#4f6370] font-normal leading-[1.6] m-0 pt-0.5">
                      {step.replace(/^\d+\.\s*/, '')}
                    </p>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </>)}

        {/* TAB: PERSIAPAN */}
        {tab === 'persiapan' && (<>
          <ChecklistGroup title="Dokumen Administrasi"     items={dokumen.administrasi}  color="blue" />
          <ChecklistGroup title="Dokumen Penunjang"        items={dokumen.penunjang}      color="purple" />
          <ChecklistGroup title="Persiapan Prosedural"     items={persiapan.prosedural}   color="green" />
          <ChecklistGroup title="Perlengkapan yang Dibawa" items={persiapan.perlengkapan} color="amber" />
          {poinKonsultasi.length > 0 && (
            <Section title="Informasi yang Perlu Disampaikan ke Dokter">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {poinKonsultasi.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
                    <CheckCircle2 size={13} className="text-[#2aab7e] shrink-0 mt-0.5" />{p}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>)}

        {/* TAB: PASCALAYANAN */}
        {tab === 'pasca' && (<>
          {instruksi.instruksi?.length > 0 && (
            <Section title="Instruksi Setelah Tindakan">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {instruksi.instruksi.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
                    <CheckCircle2 size={13} className="text-[#2aab7e] shrink-0 mt-0.5" />{ins}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {instruksi.pembatasan?.length > 0 && (
            <Section title="Pembatasan Aktivitas" variant="warning">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {instruksi.pembatasan.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
                    <XCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />{p}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {univ.kondisiHarusKembaliRS?.length > 0 && (
            <Section title="Segera Kembali ke RS Jika" variant="danger">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {univ.kondisiHarusKembaliRS.map((k, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#4f6370] font-normal leading-relaxed">
                    <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />{k}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(carePath.sebelum.length > 0 || carePath.sesudah.length > 0) && (
            <Section title="Jalur Perawatan (Smart Care Path)">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">

                {/* Node SEBELUM — onClick menyimpan layanan saat ini sebagai asal */}
                {carePath.sebelum.map(s => {
                  const kodeS = ekstrakKode(s.iri)
                  return (
                    <Link
                      key={s.iri}
                      href={`/layanan/${kodeS}?rs=${rsDariURL}`}
                      onClick={handleKlikCarePath}
                      className="shrink-0 flex flex-col items-center gap-1 px-4 py-3 bg-[#f7fafa] border border-[#dde8ec] hover:bg-[#e5f3ed] rounded-xl min-w-27.5 text-center transition-colors no-underline"
                    >
                      <span className="text-[11px] text-[#8fa3b0] opacity-70">Sebelumnya</span>
                      <span className="text-[12px] font-medium text-[#4f6370]">{s.nama || kodeS}</span>
                    </Link>
                  )
                })}

                {carePath.sebelum.length > 0 && <ArrowRight size={16} className="text-[#8fa3b0] shrink-0" />}

                {/* Node layanan aktif saat ini */}
                <div className="shrink-0 flex flex-col items-center gap-1 px-4 py-3 bg-[#2aab7e] border border-[#2aab7e] rounded-xl min-w-27.5 text-center">
                  <span className="text-[11px] text-white opacity-70">Layanan Ini</span>
                  <span className="text-[12px] font-medium text-white">{univ.namaLayanan}</span>
                </div>

                {carePath.sesudah.length > 0 && <ArrowRight size={16} className="text-[#8fa3b0] shrink-0" />}

                {/* Node SESUDAH — onClick menyimpan layanan saat ini sebagai asal */}
                {carePath.sesudah.map(s => {
                  const kodeS = ekstrakKode(s.iri)
                  return (
                    <Link
                      key={s.iri}
                      href={`/layanan/${kodeS}?rs=${rsDariURL}`}
                      onClick={handleKlikCarePath}
                      className="shrink-0 flex flex-col items-center gap-1 px-4 py-3 bg-[#f0fdf4] border border-[#bbf7d0] hover:bg-[#dcfce7] rounded-xl min-w-27.5 text-center transition-colors no-underline"
                    >
                      <span className="text-[11px] text-[#8fa3b0] opacity-70">Selanjutnya</span>
                      <span className="text-[12px] font-medium text-[#4f6370]">{s.nama || kodeS}</span>
                    </Link>
                  )
                })}

              </div>
            </Section>
          )}
        </>)}

      </div>

      {/* CATATAN PENTING */}
      <div className="bg-[#fffbf0] border border-[#e8d48a] rounded-xl px-4 py-3.5 mt-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-7 h-7 bg-[#f5d76e] rounded-full flex items-center justify-center text-[#7a5800]">
            <AlertTriangle size={13} />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#7a5800] mb-1.5">
              Catatan Penting
            </p>
            <p className="text-[11px] leading-[1.7] text-[#5a4200] font-light m-0">
              Data bersifat informatif. Keputusan pemilihan fasilitas kesehatan dan layanan
              rumah sakit tetap harus berdasarkan kebutuhan medis serta rekomendasi tenaga
              kesehatan dan tidak menggantikan konsultasi langsung dengan tenaga kesehatan.
            </p>
          </div>
        </div>
      </div>

      <SparqlPanel debug={debug} />

      {/* MODAL: TINJAU DI RS LAIN */}
      {showModal && (
        <div
          className="fixed inset-0 bg-[rgba(13,31,45,0.5)] z-300 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-96 w-full shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-semibold text-[#0e2233] mb-1.5">Pilih Rumah Sakit</h3>
            <p className="text-xs text-[#4f6370] leading-[1.6] mb-4">
              Pilih rumah sakit untuk layanan{' '}
              <strong className="font-medium text-[#0e2233]">{univ.namaLayanan}</strong>.
            </p>

            <div className="flex flex-col gap-1.5 mb-4">
              {loadingRS ? (
                <div className="flex items-center gap-2 p-3 text-[#8fa3b0] text-xs">
                  <Loader2 size={13} className="animate-spin" /> Memuat daftar RS…
                </div>
              ) : daftarRS.map(rs => {
                const isAktif = rs.suffix === rsDariURL
                return isAktif ? (
                  <div key={rs.suffix} className="flex items-center justify-between px-3 py-2.5 bg-[#f7fafa] border border-[#dde8ec] rounded-lg opacity-60">
                    <span className="text-xs font-medium text-[#0e2233]">{rs.namaRS}</span>
                    <span className="text-[10px] text-[#8fa3b0]">Sedang ditampilkan</span>
                  </div>
                ) : (
                  <Link
                    key={rs.suffix}
                    href={`/layanan/${kode}?rs=${rs.suffix}`}
                    onClick={() => setShowModal(false)}
                    className="flex items-center justify-between px-3 py-2.5 bg-white border border-[#dde8ec] hover:border-[#2aab7e] hover:bg-[#f0fdf9] rounded-lg transition-colors no-underline"
                  >
                    <span className="text-xs font-medium text-[#0e2233]">{rs.namaRS}</span>
                    <ChevronRight size={12} className="text-[#8fa3b0]" />
                  </Link>
                )
              })}
            </div>

            {daftarRS.length > 1 && (
              <div className="pt-3 border-t border-[#eaf1f4]">
                <p className="text-[12px] text-[#8fa3b0] m-0">
                  Ingin melihat semua RS berdampingan?{' '}
                  <Link
                    href={`/tinjau/${kode}`}
                    onClick={() => setShowModal(false)}
                    className="text-[#2aab7e] font-medium hover:underline"
                  >
                    Buka Tinjauan Lintas RS →
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}