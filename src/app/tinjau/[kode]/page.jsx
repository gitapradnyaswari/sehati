'use client'
// ─────────────────────────────────────────────────────────────
// app/tinjau/[kode]/page.jsx — Halaman Tinjau Lintas RS
//
// Halaman ini menampilkan perbandingan satu layanan dari
// dua rumah sakit secara berdampingan (side-by-side).
//
// Alur dua langkah:
//   Step 1 (mulai=false): Pilih RS yang ingin dibandingkan
//   Step 2 (mulai=true) : Tampilkan tabel perbandingan
//
// 'use client' diperlukan karena menggunakan useState,
// useEffect, dan interaksi pengguna.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, Check, AlertTriangle } from 'lucide-react'
import { sortTahapan } from '@/lib/sparql'
import SparqlPanel from '@/components/SparqlPanel'

// ─────────────────────────────────────────────────────────────
// PROP_LABELS
// Pemetaan key properti dari respons API ke label tampilan.
// Digunakan untuk merender baris tabel Informasi Operasional
// secara dinamis — jika properti baru ditambahkan di API,
// cukup tambahkan entri di sini tanpa mengubah JSX.
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// HELPER: stripNomorTahapan()
// Menghapus awalan nomor dari string tahapan yang datang
// dari ontologi. Contoh: "1. Pendaftaran" → "Pendaftaran"
// regex ^\d+\.\s* mencocokkan: satu angka atau lebih,
// diikuti titik, diikuti spasi opsional — di awal string.
// ─────────────────────────────────────────────────────────────
function stripNomorTahapan(s) {
  return s.replace(/^\d+\.\s*/, '').trim()
}

// ─────────────────────────────────────────────────────────────
// KOMPONEN: TinjauList
// Tabel perbandingan untuk data berbentuk daftar (array string):
// tenaga kesehatan, dokumen, persiapan.
//
// Logika tampilan:
//   - allItems = gabungan unik dari semua item di kedua RS
//     (Set menghilangkan duplikat, spread ke Array)
//   - Tiap baris: item | ✓/— RS A | ✓/— RS B
//   - Baris highlight amber jika satu RS punya tapi yang lain tidak
//
// Mengembalikan null jika kedua array kosong — tidak ada
// kartu kosong yang muncul di UI.
// ─────────────────────────────────────────────────────────────
function TinjauList({ title, a, b, namaA, namaB }) {
  if (!a.length && !b.length) return null

  // Gabungkan semua item unik dari kedua RS
  const allItems = Array.from(new Set([...a, ...b]))

  return (
    <div className="bg-white rounded-xl border border-[#dde8ec] overflow-hidden">
      {/* Header kartu */}
      <div className="px-4 py-3 bg-[#f7fafa] border-b border-[#dde8ec]">
        <p className="text-[13px] font-semibold text-[#0e2233]">{title}</p>
      </div>

      <div className="w-full">
        {/* Header tabel: Item | RS A | RS B */}
        <div className="grid grid-cols-[1fr_110px_110px] bg-[#fafbfc] border-b border-[#dde8ec]">
          <div className="px-4 py-2.5 text-[11px] font-semibold text-[#8fa3b0] border-r border-[#dde8ec]">Item</div>
          <div className="px-3 py-2.5 text-[11px] font-semibold text-[#2aab7e] text-center border-r border-[#dde8ec] leading-tight">{namaA}</div>
          <div className="px-3 py-2.5 text-[11px] font-semibold text-[#2aab7e] text-center leading-tight">{namaB}</div>
        </div>

        <div className="divide-y divide-[#eaf1f4]">
          {allItems.map((item, i) => {
            const adaA   = a.includes(item)
            const adaB   = b.includes(item)
            // berbeda = satu RS punya, yang lain tidak → highlight kuning
            const berbeda = adaA !== adaB
            return (
              <div key={i} className={`grid grid-cols-[1fr_110px_110px] ${berbeda ? 'bg-amber-50' : 'bg-white'}`}>
                <div className={`px-4 py-2 text-[12px] border-r border-[#eaf1f4] leading-relaxed ${berbeda ? 'font-semibold text-[#d97706]' : 'text-[#0e2233]'}`}>
                  {item}
                </div>
                {/* Centang hijau jika RS punya item, em-dash abu jika tidak */}
                <div className={`flex items-center justify-center py-2 border-r border-[#eaf1f4] ${adaA ? 'text-[#2aab7e]' : 'text-[#d1d5db]'}`}>
                  {adaA ? <Check size={14} strokeWidth={2.5} /> : <span className="text-base font-light">—</span>}
                </div>
                <div className={`flex items-center justify-center py-2 ${adaB ? 'text-[#2aab7e]' : 'text-[#d1d5db]'}`}>
                  {adaB ? <Check size={14} strokeWidth={2.5} /> : <span className="text-base font-light">—</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// KOMPONEN: TinjauTahapan
// Tabel perbandingan khusus tahapan layanan — berbeda dari
// TinjauList karena posisi (index) lebih penting dari
// kesamaan teks. Tahapan ke-N dibandingkan dengan tahapan ke-N.
//
// maxLen: ambil panjang terpanjang agar semua baris terisi,
// RS yang tahapannya lebih pendek akan menampilkan "—".
// ─────────────────────────────────────────────────────────────
function TinjauTahapan({ namaA, namaB, itemsA, itemsB }) {
  if (!itemsA.length && !itemsB.length) return null

  const maxLen = Math.max(itemsA.length, itemsB.length)

  return (
    <div className="bg-white rounded-xl border border-[#dde8ec] overflow-hidden">
      <div className="px-4 py-3 bg-[#f7fafa] border-b border-[#dde8ec]">
        <p className="text-[13px] font-semibold text-[#0e2233]">Tahapan Layanan</p>
      </div>

      <div className="w-full">
        {/* Header: No | RS A | RS B */}
        <div className="grid grid-cols-[44px_1fr_1fr] bg-[#fafbfc] border-b border-[#dde8ec]">
          <div className="px-3 py-2.5 text-[11px] font-semibold text-[#8fa3b0] border-r border-[#dde8ec]">No</div>
          <div className="px-4 py-2.5 text-[11px] font-semibold text-[#2aab7e] border-r border-[#dde8ec]">{namaA}</div>
          <div className="px-4 py-2.5 text-[11px] font-semibold text-[#2aab7e]">{namaB}</div>
        </div>

        <div className="divide-y divide-[#eaf1f4]">
          {Array.from({ length: maxLen }, (_, i) => {
            const a = itemsA[i]?.trim() || ''
            const b = itemsB[i]?.trim() || ''
            // berbeda hanya dianggap bermakna jika keduanya ada tapi isinya berbeda
            const berbeda = a && b && a !== b
            return (
              <div key={i} className={`grid grid-cols-[44px_1fr_1fr] ${berbeda ? 'bg-amber-50' : 'bg-white'}`}>
                {/* Nomor tahapan */}
                <div className="flex items-start justify-center pt-3 border-r border-[#eaf1f4]">
                  <span className={`text-[12px] font-semibold ${berbeda ? 'text-[#d97706]' : 'text-[#8fa3b0]'}`}>
                    {i + 1}
                  </span>
                </div>
                <div className="px-4 py-3 text-[12px] text-[#0e2233] border-r border-[#eaf1f4] leading-relaxed min-w-0 wrap-break-word">
                  {a || <span className="text-[#d1d5db]">—</span>}
                </div>
                <div className="px-4 py-3 text-[12px] text-[#0e2233] leading-relaxed min-w-0 wrap-break-word">
                  {b || <span className="text-[#d1d5db]">—</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HALAMAN UTAMA: TinjauPage
// ─────────────────────────────────────────────────────────────
export default function TinjauPage() {
  const params = useParams()
  const kode   = params.kode  // kode layanan universal dari URL /tinjau/[kode]

  const [daftarRS, setDaftarRS]       = useState([])     // RS yang punya layanan ini
  const [loadingRS, setLoadingRS]     = useState(true)   // loading daftar RS
  const [dipilih, setDipilih]         = useState([])     // array suffix RS yang dipilih (maks 2)
  const [mulai, setMulai]             = useState(false)  // true = step 2 (tampilkan perbandingan)
  const [data, setData]               = useState(null)   // data perbandingan dari API
  const [loadingData, setLoadingData] = useState(false)  // loading data perbandingan
  const [debug, setDebug]             = useState(null)   // data debug SPARQL

  // Fetch daftar RS yang menyediakan layanan ini saat mount
  useEffect(() => {
    if (!kode) return
    fetch(`/api/sparql?action=rs-layanan&kode=${kode}`)
      .then(r => r.json())
      .then(d => { setDaftarRS(d); setLoadingRS(false) })
      .catch(() => setLoadingRS(false))
  }, [kode])

  // ─────────────────────────────────────────────────────
  // Fetch data perbandingan saat pengguna klik "Tampilkan"
  // Dependency [mulai, kode]: hanya fetch saat mulai=true,
  // tidak fetch ulang jika kode tidak berubah.
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mulai || !kode) return
    setLoadingData(true)
    fetch(`/api/sparql?action=bandingkan&kode=${kode}`)
      .then(r => r.json())
      .then(d => { setData(d); setDebug(d.sparqlDebug || null); setLoadingData(false) })
      .catch(() => setLoadingData(false))
  }, [mulai, kode])

  // Toggle pilih/batal pilih satu RS
  // Batas maksimal 2 RS — tapi UI di bawah tidak membatasi toggle,
  // sehingga pengguna bisa memilih lebih dari 2. Tombol "Tampilkan"
  // dinonaktifkan jika dipilih.length < 2 saja (bukan tepat 2).
  const togglePilih = (suffix) =>
    setDipilih(prev =>
      prev.includes(suffix)
        ? prev.filter(s => s !== suffix)
        : [...prev, suffix]
    )

  // ══════════════════════════════════════════════════════
  // STEP 1: PILIH RS
  // Ditampilkan saat mulai=false.
  // ══════════════════════════════════════════════════════
  if (!mulai) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-5 py-8">

        {/* Breadcrumb kembali ke halaman detail */}
        <div className="flex items-center gap-2 text-[12px] text-[#8fa3b0] mb-6">
          <Link
            href={`/layanan/${kode}`}
            className="flex items-center gap-1 hover:text-[#4f6370] transition-colors"
          >
            <ChevronLeft size={13} /> Kembali ke Detail
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-[18px] font-semibold text-[#0e2233] mb-1.5">Tinjau Lintas RS</h1>
          <p className="text-[12px] text-[#8fa3b0] leading-relaxed">
            Pilih minimal 2 rumah sakit untuk ditinjau.
          </p>
        </div>

        {loadingRS ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-[#2aab7e]" />
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold text-[#8fa3b0] uppercase tracking-wide mt-1.5 mb-2.5">
              Rumah Sakit Tersedia
            </p>

            {daftarRS.map(rs => {
              const dipilihIni = dipilih.includes(rs.suffix)
              return (
                <button
                  key={rs.suffix}
                  onClick={() => togglePilih(rs.suffix)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    dipilihIni
                      ? 'border-[#2aab7e] bg-[rgba(42,171,126,0.06)] shadow-sm'
                      : 'border-[#dde8ec] bg-white hover:border-[#b0c8d4] hover:shadow-sm'
                  }`}
                >
                  <span className={`font-medium text-[12px] ${dipilihIni ? 'text-[#186848]' : 'text-[#0e2233]'}`}>
                    {rs.namaRS}
                  </span>
                  {dipilihIni && (
                    <span className="text-[11px] font-semibold text-[#2aab7e] shrink-0">Dipilih</span>
                  )}
                </button>
              )
            })}

            <div className="pt-3">
              <button
                onClick={() => setMulai(true)}
                disabled={dipilih.length < 2}
                className={`w-full py-3 rounded-xl text-[12px] font-semibold transition-all ${
                  dipilih.length >= 2
                    ? 'bg-[#2aab7e] hover:bg-[#229068] text-white shadow-sm hover:shadow'
                    : 'bg-[#f7fafa] text-[#b0c8d4] cursor-not-allowed border border-[#dde8ec]'
                }`}
              >
                {dipilih.length < 2
                  ? `Pilih ${2 - dipilih.length} RS lagi`
                  : 'Tampilkan Hasil Tinjauan'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Render: Loading perbandingan ───────────────────────
  if (loadingData || !data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={24} className="animate-spin text-[#2aab7e]" />
    </div>
  )

  // ── Destructure data perbandingan ──────────────────────
  const {
    namaLayanan, perbandingan, tenaga, tahapan,
    dokumenRSBM, dokumenRSPR, persiapanRSBM, persiapanRSPR,
  } = data

  // RS A dan B berdasarkan urutan pilihan pengguna
  const rsA  = daftarRS.find(r => r.suffix === dipilih[0])
  const rsB  = daftarRS.find(r => r.suffix === dipilih[1])
  // keyA/keyB: suffix lowercase dipakai sebagai key di objek perbandingan
  const keyA = dipilih[0].toLowerCase()
  const keyB = dipilih[1].toLowerCase()

  // Filter hanya aspek operasional yang ada nilainya di setidaknya satu RS
  const aspekOp = Object.entries(PROP_LABELS).filter(([prop]) => {
    const v = perbandingan?.[prop]
    return v?.[keyA] || v?.[keyB]
  })

  // Kumpulkan data masing-masing RS untuk komponen TinjauList
  const tenagaA = tenaga?.[keyA] || []
  const tenagaB = tenaga?.[keyB] || []

  // Gabungkan dokumen administrasi + penunjang menjadi satu array per RS
  // Spread + fallback [] agar tidak error jika properti undefined
  const dokA = [
    ...(keyA === 'rsbm' ? dokumenRSBM?.administrasi : dokumenRSPR?.administrasi) || [],
    ...(keyA === 'rsbm' ? dokumenRSBM?.penunjang     : dokumenRSPR?.penunjang)     || [],
  ]
  const dokB = [
    ...(keyB === 'rsbm' ? dokumenRSBM?.administrasi : dokumenRSPR?.administrasi) || [],
    ...(keyB === 'rsbm' ? dokumenRSBM?.penunjang     : dokumenRSPR?.penunjang)     || [],
  ]

  // Gabungkan persiapan prosedural + perlengkapan per RS
  const perA = [
    ...(keyA === 'rsbm' ? persiapanRSBM?.prosedural   : persiapanRSPR?.prosedural)   || [],
    ...(keyA === 'rsbm' ? persiapanRSBM?.perlengkapan : persiapanRSPR?.perlengkapan) || [],
  ]
  const perB = [
    ...(keyB === 'rsbm' ? persiapanRSBM?.prosedural   : persiapanRSPR?.prosedural)   || [],
    ...(keyB === 'rsbm' ? persiapanRSBM?.perlengkapan : persiapanRSPR?.perlengkapan) || [],
  ]

  // sortTahapan: mengurutkan tahapan berdasarkan nomor urut dari ontologi
  // stripNomorTahapan: hapus awalan "1. " dll setelah diurutkan
  // Set: hilangkan duplikat yang mungkin muncul dari ontologi
  const tahA = Array.from(new Set(
    sortTahapan(tahapan?.[keyA] || []).map(s => stripNomorTahapan(s)).filter(Boolean)
  ))
  const tahB = Array.from(new Set(
    sortTahapan(tahapan?.[keyB] || []).map(s => stripNomorTahapan(s)).filter(Boolean)
  ))

  // ══════════════════════════════════════════════════════
  // STEP 2: TAMPILKAN PERBANDINGAN
  // ══════════════════════════════════════════════════════
  return (
    <div className="max-w-280 mx-auto px-3 sm:px-5 lg:px-7 py-5">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-[12px] text-[#8fa3b0] mb-4">
        <button
          onClick={() => { setMulai(false); setData(null) }}
          className="flex items-center gap-1 hover:text-[#4f6370] transition-colors"
        >
          <ChevronLeft size={13} /> Ganti Pilihan RS
        </button>
        <span className="text-[#dde8ec]">/</span>
        <span className="text-[#0e2233] font-medium">Tinjau Lintas RS</span>
      </div>

      {/* ── Header card ── */}
      <div className="bg-white rounded-xl border border-[#dde8ec] px-4 py-3.5 mb-4">
        <h1 className="text-[16px] font-semibold text-[#0e2233] mb-3">
          Tinjau Lintas RS — <span className="text-[#2aab7e]">{namaLayanan}</span>
        </h1>
        {/* Legenda: indikator baris perbedaan */}
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-300 shrink-0" />
          <span className="text-[11px] text-[#8fa3b0]">Informasi berbeda antar RS</span>
        </div>
      </div>

      {/* ── Tabel Perbandingan ── */}
      <div className="space-y-3">

        {/* Informasi Operasional — hanya tampil jika ada data */}
        {aspekOp.length > 0 && (
          <div className="bg-white rounded-xl border border-[#dde8ec] overflow-hidden">
            <div className="px-4 py-3 bg-[#f7fafa] border-b border-[#dde8ec]">
              <p className="text-[13px] font-semibold text-[#0e2233]">Informasi Operasional</p>
            </div>

            {/* Header tabel: Aspek | RS A | RS B */}
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-[#fafbfc] border-b border-[#dde8ec]">
              <div className="px-4 py-2.5 text-[11px] font-medium text-[#8fa3b0] border-r border-[#dde8ec]">Aspek</div>
              <div className="px-4 py-2.5 text-[11px] font-semibold text-[#2aab7e] border-r border-[#dde8ec]">{rsA?.namaRS}</div>
              <div className="px-4 py-2.5 text-[11px] font-semibold text-[#2aab7e]">{rsB?.namaRS}</div>
            </div>

            <div className="divide-y divide-[#eaf1f4]">
              {aspekOp.map(([prop, label]) => {
                const v       = perbandingan?.[prop] || {}
                const berbeda = v[keyA] && v[keyB] && v[keyA] !== v[keyB]
                return (
                  <div key={prop} className={`grid grid-cols-[1fr_1fr_1fr] ${berbeda ? 'bg-amber-50' : 'bg-white'}`}>
                    {/* Label aspek — kuning jika berbeda */}
                    <div className={`px-4 py-3 text-[12px] border-r border-[#eaf1f4] flex items-start ${berbeda ? 'font-semibold text-[#d97706]' : 'font-medium text-[#4f6370]'}`}>
                      {label}
                    </div>
                    <div className="px-4 py-3 text-[12px] text-[#0e2233] border-r border-[#eaf1f4] leading-relaxed">
                      {v[keyA] || <span className="text-[#d1d5db]">—</span>}
                    </div>
                    <div className="px-4 py-3 text-[12px] text-[#0e2233] leading-relaxed">
                      {v[keyB] || <span className="text-[#d1d5db]">—</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tabel daftar: centang per item */}
        <TinjauList title="Tenaga Kesehatan"        a={tenagaA} b={tenagaB} namaA={rsA?.namaRS} namaB={rsB?.namaRS} />
        <TinjauList title="Dokumen yang Dibutuhkan" a={dokA}    b={dokB}    namaA={rsA?.namaRS} namaB={rsB?.namaRS} />
        <TinjauList title="Persiapan"               a={perA}    b={perB}    namaA={rsA?.namaRS} namaB={rsB?.namaRS} />

        {/* Tabel tahapan: dibandingkan per urutan */}
        <TinjauTahapan
          namaA={rsA?.namaRS || dipilih[0]}
          namaB={rsB?.namaRS || dipilih[1]}
          itemsA={tahA}
          itemsB={tahB}
        />

      </div>

      {/* ══════════════════════════════════════════════════════
          CATATAN PENTING
          Disclaimer khusus halaman perbandingan — dua kalimat:
          1. Kalimat baru: perbedaan prosedur ≠ perbedaan kualitas
          2. Kalimat standar informatif + rekomendasi tenaga kesehatan
          ══════════════════════════════════════════════════ */}
      <div className="bg-[#fffbf0] border border-[#e8d48a] rounded-xl px-4 py-3.5 mt-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-[#f5d76e] rounded-full flex items-center justify-center text-[#7a5800]">
            <AlertTriangle size={13} />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#7a5800] mb-1.5">
              Catatan Penting
            </p>
            <p className="text-[11px] leading-[1.72] text-[#5a4200] font-light m-0">
              Perbedaan prosedur yang ditampilkan tidak mencerminkan perbedaan kualitas layanan rumah sakit.
              {' '}Data bersifat informatif. Keputusan pemilihan fasilitas kesehatan dan layanan
              rumah sakit tetap harus berdasarkan kebutuhan medis serta rekomendasi tenaga
              kesehatan dan tidak menggantikan konsultasi langsung dengan tenaga kesehatan.
            </p>
          </div>
        </div>
      </div>

      {/* Panel debug SPARQL */}
      <SparqlPanel debug={debug} />
    </div>
  )
}