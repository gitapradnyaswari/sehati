'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, Check, AlertTriangle } from 'lucide-react'
import { sortTahapan } from '@/lib/sparql'

const PROP_LABELS = {
  jadwalOperasional:   'Jadwal Operasional',
  waktuKedatangan:     'Waktu Kedatangan',
  durasiTindakan:      'Durasi Tindakan',
  durasiObservasi:     'Durasi Observasi',
  durasiPersiapan:     'Durasi Persiapan',
  persetujuanTindakan: 'Persetujuan Tindakan',
  keteranganRujukan:   'Keterangan Rujukan',
  jadwalKontrol:       'Jadwal Kontrol Lanjutan',
}

function stripNomorTahapan(s) {
  return s.replace(/^\d+\.\s*/, '').trim()
}

const tdBase  = 'align-top px-3 py-2.5 text-[12px] leading-relaxed border-b border-[#eaf1f4]'
const tdLabel = `${tdBase} font-medium text-[#4f6370] w-[28%] wrap-break-word`
const tdVal   = `${tdBase} text-[#0e2233] wrap-break-word`
const tdLabelAmber = `${tdBase} font-semibold text-[#d97706] w-[28%] wrap-break-word`

// ─── th header: border-b saja dari border-[#dde8ec], border-l pakai style inline ───
const thBase   = 'px-3 py-2.5 text-[11px] border-b border-[#dde8ec]'
const thLabel  = `${thBase} text-left font-medium text-[#8fa3b0]`
const thRS     = `${thBase} text-center font-semibold text-[#2aab7e] wrap-break-word`

function TableCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#dde8ec] overflow-hidden">
      <div className="px-4 py-3 bg-[#f7fafa] border-b border-[#dde8ec]">
        <p className="text-[13px] font-semibold text-[#0e2233] m-0">{title}</p>
      </div>
      <div className="overflow-x-hidden">
        <table className="w-full table-fixed border-collapse">
          {children}
        </table>
      </div>
    </div>
  )
}

function TinjauList({ title, a, b, namaA, namaB }) {
  if (!a.length && !b.length) return null
  const allItems = Array.from(new Set([...a, ...b]))

  return (
    <TableCard title={title}>
      <colgroup>
        <col className="w-[50%]" />
        <col className="w-[25%]" />
        <col className="w-[25%]" />
      </colgroup>
      <thead>
        <tr className="bg-[#fafbfc]">
          <th className={thLabel}>Item</th>
          {/* border-l pakai style inline agar tidak bentrok dengan border-b dari thRS */}
          <th className={thRS} style={{ borderLeftWidth: '1px', borderLeftColor: '#dde8ec', borderLeftStyle: 'solid' }}>{namaA}</th>
          <th className={thRS} style={{ borderLeftWidth: '1px', borderLeftColor: '#dde8ec', borderLeftStyle: 'solid' }}>{namaB}</th>
        </tr>
      </thead>
      <tbody>
        {allItems.map((item, i) => {
          const adaA = a.includes(item), adaB = b.includes(item)
          const berbeda = adaA !== adaB
          return (
            <tr key={i} className={berbeda ? 'bg-amber-50' : 'bg-white'}>
              <td className={`${tdBase} wrap-break-word ${berbeda ? 'font-semibold text-[#d97706]' : 'text-[#0e2233]'}`}>{item}</td>
              <td className={`${tdBase} text-center ${adaA ? 'text-[#2aab7e]' : 'text-[#d1d5db]'}`} style={{ borderLeftWidth: '1px', borderLeftColor: '#eaf1f4', borderLeftStyle: 'solid' }}>
                {adaA ? <Check size={14} strokeWidth={2.5} className="mx-auto" /> : <span className="font-light">—</span>}
              </td>
              <td className={`${tdBase} text-center ${adaB ? 'text-[#2aab7e]' : 'text-[#d1d5db]'}`} style={{ borderLeftWidth: '1px', borderLeftColor: '#eaf1f4', borderLeftStyle: 'solid' }}>
                {adaB ? <Check size={14} strokeWidth={2.5} className="mx-auto" /> : <span className="font-light">—</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </TableCard>
  )
}

function TinjauTahapan({ namaA, namaB, itemsA, itemsB }) {
  if (!itemsA.length && !itemsB.length) return null
  const maxLen = Math.max(itemsA.length, itemsB.length)

  return (
    <TableCard title="Tahapan Layanan">
      <colgroup>
        <col style={{ width: '32px' }} />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr className="bg-[#fafbfc]">
          <th className={`${thBase} font-semibold text-[#8fa3b0] text-center`}>No</th>
          <th className={thRS} style={{ borderLeftWidth: '1px', borderLeftColor: '#dde8ec', borderLeftStyle: 'solid' }}>{namaA}</th>
          <th className={thRS} style={{ borderLeftWidth: '1px', borderLeftColor: '#dde8ec', borderLeftStyle: 'solid' }}>{namaB}</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: maxLen }, (_, i) => {
          const a = itemsA[i]?.trim() || '', b = itemsB[i]?.trim() || ''
          const berbeda = a && b && a !== b
          return (
            <tr key={i} className={berbeda ? 'bg-amber-50' : 'bg-white'}>
              <td className={`${tdBase} text-center ${berbeda ? 'font-bold text-[#d97706]' : 'font-semibold text-[#8fa3b0]'}`}>{i + 1}</td>
              <td className={tdVal} style={{ borderLeftWidth: '1px', borderLeftColor: '#eaf1f4', borderLeftStyle: 'solid' }}>
                {a || <span className="text-[#d1d5db]">—</span>}
              </td>
              <td className={tdVal} style={{ borderLeftWidth: '1px', borderLeftColor: '#eaf1f4', borderLeftStyle: 'solid' }}>
                {b || <span className="text-[#d1d5db]">—</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </TableCard>
  )
}

function InfoOperasional({ aspekOp, perbandingan, keyA, keyB, namaA, namaB }) {
  if (!aspekOp.length) return null
  return (
    <TableCard title="Informasi Operasional">
      <colgroup>
        <col className="w-[28%]" />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr className="bg-[#fafbfc]">
          <th className={thLabel}>Aspek</th>
          <th className={thRS} style={{ borderLeftWidth: '1px', borderLeftColor: '#dde8ec', borderLeftStyle: 'solid' }}>{namaA}</th>
          <th className={thRS} style={{ borderLeftWidth: '1px', borderLeftColor: '#dde8ec', borderLeftStyle: 'solid' }}>{namaB}</th>
        </tr>
      </thead>
      <tbody>
        {aspekOp.map(([prop, label]) => {
          const v = perbandingan?.[prop] || {}
          const berbeda = v[keyA] && v[keyB] && v[keyA] !== v[keyB]
          return (
            <tr key={prop} className={berbeda ? 'bg-amber-50' : 'bg-white'}>
              <td className={berbeda ? tdLabelAmber : tdLabel}>{label}</td>
              <td className={tdVal} style={{ borderLeftWidth: '1px', borderLeftColor: '#eaf1f4', borderLeftStyle: 'solid' }}>
                {v[keyA] || <span className="text-[#d1d5db]">—</span>}
              </td>
              <td className={tdVal} style={{ borderLeftWidth: '1px', borderLeftColor: '#eaf1f4', borderLeftStyle: 'solid' }}>
                {v[keyB] || <span className="text-[#d1d5db]">—</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </TableCard>
  )
}

export default function TinjauPage() {
  const params = useParams()
  const kode   = params.kode

  const [daftarRS, setDaftarRS]       = useState([])
  const [loadingRS, setLoadingRS]     = useState(true)
  const [dipilih, setDipilih]         = useState([])
  const [mulai, setMulai]             = useState(false)
  const [data, setData]               = useState(null)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!kode) return
    fetch(`/api/sparql?action=rs-layanan&kode=${kode}`)
      .then(r => r.json())
      .then(d => { setDaftarRS(d); setLoadingRS(false) })
      .catch(() => setLoadingRS(false))
  }, [kode])

  useEffect(() => {
    if (!mulai || !kode) return
    setLoadingData(true)
    fetch(`/api/sparql?action=bandingkan&kode=${kode}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoadingData(false) })
      .catch(() => setLoadingData(false))
  }, [mulai, kode])

  const togglePilih = (suffix) =>
    setDipilih(prev =>
      prev.includes(suffix) ? prev.filter(s => s !== suffix) : [...prev, suffix]
    )

  if (!mulai) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-5 py-8">
        <div className="flex items-center gap-2 text-[12px] text-[#8fa3b0] mb-6">
          <Link href={`/layanan/${kode}`} className="flex items-center gap-1 hover:text-[#4f6370] transition-colors">
            <ChevronLeft size={13} /> Kembali ke Detail
          </Link>
        </div>
        <div className="mb-6">
          <h1 className="text-[18px] font-semibold text-[#0e2233] mb-1.5">Tinjau Lintas RS</h1>
          <p className="text-[12px] text-[#8fa3b0] leading-relaxed">Pilih minimal 2 rumah sakit untuk ditinjau.</p>
        </div>
        {loadingRS ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-[#2aab7e]" />
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold text-[#8fa3b0] uppercase tracking-wide mb-2.5">Rumah Sakit Tersedia</p>
            {daftarRS.map(rs => {
              const dipilihIni = dipilih.includes(rs.suffix)
              return (
                <button key={rs.suffix} onClick={() => togglePilih(rs.suffix)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    dipilihIni ? 'border-[#2aab7e] bg-[rgba(42,171,126,0.06)]' : 'border-[#dde8ec] bg-white hover:border-[#b0c8d4]'
                  }`}>
                  <span className={`font-medium text-[12px] ${dipilihIni ? 'text-[#186848]' : 'text-[#0e2233]'}`}>{rs.namaRS}</span>
                  {dipilihIni && <span className="text-[11px] font-semibold text-[#2aab7e] shrink-0">Dipilih</span>}
                </button>
              )
            })}
            <div className="pt-3">
              <button onClick={() => setMulai(true)} disabled={dipilih.length < 2}
                className={`w-full py-3 rounded-xl text-[12px] font-semibold transition-all ${
                  dipilih.length >= 2 ? 'bg-[#2aab7e] hover:bg-[#229068] text-white' : 'bg-[#f7fafa] text-[#b0c8d4] cursor-not-allowed border border-[#dde8ec]'
                }`}>
                {dipilih.length < 2 ? `Pilih ${2 - dipilih.length} RS lagi` : 'Tampilkan Hasil Tinjauan'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loadingData || !data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={24} className="animate-spin text-[#2aab7e]" />
    </div>
  )

  const { namaLayanan, perbandingan, tenaga, tahapan, dokumenRSBM, dokumenRSPR, persiapanRSBM, persiapanRSPR } = data
  const rsA  = daftarRS.find(r => r.suffix === dipilih[0])
  const rsB  = daftarRS.find(r => r.suffix === dipilih[1])
  const keyA = dipilih[0].toLowerCase()
  const keyB = dipilih[1].toLowerCase()

  const aspekOp = Object.entries(PROP_LABELS).filter(([prop]) => {
    const v = perbandingan?.[prop]; return v?.[keyA] || v?.[keyB]
  })

  const tenagaA = tenaga?.[keyA] || []
  const tenagaB = tenaga?.[keyB] || []
  const dokA = [...(keyA === 'rsbm' ? dokumenRSBM?.administrasi : dokumenRSPR?.administrasi) || [], ...(keyA === 'rsbm' ? dokumenRSBM?.penunjang : dokumenRSPR?.penunjang) || []]
  const dokB = [...(keyB === 'rsbm' ? dokumenRSBM?.administrasi : dokumenRSPR?.administrasi) || [], ...(keyB === 'rsbm' ? dokumenRSBM?.penunjang : dokumenRSPR?.penunjang) || []]
  const perA = [...(keyA === 'rsbm' ? persiapanRSBM?.prosedural : persiapanRSPR?.prosedural) || [], ...(keyA === 'rsbm' ? persiapanRSBM?.perlengkapan : persiapanRSPR?.perlengkapan) || []]
  const perB = [...(keyB === 'rsbm' ? persiapanRSBM?.prosedural : persiapanRSPR?.prosedural) || [], ...(keyB === 'rsbm' ? persiapanRSBM?.perlengkapan : persiapanRSPR?.perlengkapan) || []]
  const tahA = Array.from(new Set(sortTahapan(tahapan?.[keyA] || []).map(s => stripNomorTahapan(s)).filter(Boolean)))
  const tahB = Array.from(new Set(sortTahapan(tahapan?.[keyB] || []).map(s => stripNomorTahapan(s)).filter(Boolean)))

  return (
    <div className="max-w-280 mx-auto px-3 sm:px-5 lg:px-7 py-5">
      <div className="flex items-center gap-2 text-[12px] text-[#8fa3b0] mb-4">
        <button onClick={() => { setMulai(false); setData(null) }} className="flex items-center gap-1 hover:text-[#4f6370] transition-colors">
          <ChevronLeft size={13} /> Ganti Pilihan RS
        </button>
        <span className="text-[#dde8ec]">/</span>
        <span className="text-[#0e2233] font-medium">Tinjau Lintas RS</span>
      </div>

      <div className="bg-white rounded-xl border border-[#dde8ec] px-4 py-3.5 mb-4">
        <h1 className="text-[16px] font-semibold text-[#0e2233] mb-3">
          Tinjau Lintas RS — <span className="text-[#2aab7e]">{namaLayanan}</span>
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-300 shrink-0" />
          <span className="text-[11px] text-[#8fa3b0]">Informasi berbeda antar RS</span>
        </div>
      </div>

      <div className="space-y-3">
        <InfoOperasional aspekOp={aspekOp} perbandingan={perbandingan} keyA={keyA} keyB={keyB} namaA={rsA?.namaRS} namaB={rsB?.namaRS} />
        <TinjauList title="Tenaga Kesehatan"        a={tenagaA} b={tenagaB} namaA={rsA?.namaRS} namaB={rsB?.namaRS} />
        <TinjauList title="Dokumen yang Dibutuhkan" a={dokA}    b={dokB}    namaA={rsA?.namaRS} namaB={rsB?.namaRS} />
        <TinjauList title="Persiapan"               a={perA}    b={perB}    namaA={rsA?.namaRS} namaB={rsB?.namaRS} />
        <TinjauTahapan namaA={rsA?.namaRS || dipilih[0]} namaB={rsB?.namaRS || dipilih[1]} itemsA={tahA} itemsB={tahB} />
      </div>

      <div className="bg-[#fffbf0] border border-[#e8d48a] rounded-xl px-4 py-3.5 mt-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-[#f5d76e] rounded-full flex items-center justify-center text-[#7a5800]">
            <AlertTriangle size={13} />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#7a5800] mb-1.5">Catatan Penting</p>
            <p className="text-[11px] leading-[1.72] text-[#5a4200] font-light m-0">
              Perbedaan prosedur yang ditampilkan tidak mencerminkan perbedaan kualitas layanan rumah sakit.{' '}
              Data bersifat informatif. Keputusan pemilihan fasilitas kesehatan dan layanan rumah sakit tetap
              harus berdasarkan kebutuhan medis serta rekomendasi tenaga kesehatan dan tidak menggantikan
              konsultasi langsung dengan tenaga kesehatan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}