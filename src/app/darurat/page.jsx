// app/darurat/page.jsx

import { getDataDaruratWithDebug } from '@/lib/sparql'
import Link from 'next/link'
import { Phone, AlertTriangle, MapPin, ChevronRight, Activity, ExternalLink } from 'lucide-react'

const PERLU_IGD = [
  'Nyeri dada hebat atau sesak napas berat',
  'Tidak sadarkan diri atau sulit dibangunkan',
  'Kejang yang baru pertama kali atau berulang',
  'Perdarahan banyak yang tidak berhenti',
  'Kecelakaan dengan cedera parah',
  'Stroke: bicara pelo, wajah mencong, lengan lemah tiba-tiba',
  'Reaksi alergi berat (anafilaksis)',
  'Serangan jantung: nyeri dada menjalar ke lengan kiri',
]

const TIDAK_IGD = [
  'Demam ringan tanpa gangguan kesadaran',
  'Flu, batuk, pilek biasa',
  'Nyeri ringan yang sudah berlangsung lama',
  'Kontrol rutin obat kronis',
  'Luka kecil yang tidak berdarah banyak',
]

const SEBELUM_TIBA = [
  'Tetap tenang dan hubungi ambulans 119 jika perlu',
  'Jangan pindahkan korban kecelakaan kecuali dalam bahaya',
  'Posisikan korban tidak sadar dalam posisi miring (pemulihan)',
  'Hentikan perdarahan dengan menekan luka menggunakan kain bersih',
  'Jangan berikan makan atau minum pada korban tidak sadar',
  'Siapkan obat-obatan rutin yang sedang dikonsumsi',
  'Catat waktu mulainya gejala',
]

export default async function DaruratPage() {
  let rsData         = []
  let layananDarurat = []

  try {
    const result   = await getDataDaruratWithDebug()
    rsData         = result.rsData
    layananDarurat = result.layananDarurat
  } catch {
    // Gagal fetch tidak melempar error ke pengguna
  }

  return (
    <div className="max-w-200 mx-auto px-3 sm:px-5 py-6 flex flex-col gap-3">

      <div className="flex items-center gap-4 bg-[#dc2626] text-white rounded-xl px-4 py-4">
        <div className="shrink-0 w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h1 className="text-[13px] font-semibold m-0 mb-0.5">Kondisi Darurat Medis</h1>
          <p className="text-[11px] opacity-80 m-0">Hubungi ambulans atau segera ke IGD terdekat</p>
        </div>
      </div>

      <div className="bg-white border border-[#dde8ec] rounded-xl px-4 py-3.5">
        <h2 className="text-[13px] font-semibold text-[#0e2233] m-0 mb-3">Nomor Darurat</h2>
        <div className="flex flex-col gap-2">

          <a
            href="tel:119"
            className="flex items-center gap-4 bg-[#dc2626] text-white rounded-xl px-4.5 py-4 no-underline hover:bg-[#b91c1c] transition-colors"
          >
            <div className="text-[18px] font-extrabold tracking-tight shrink-0 leading-none">119</div>
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold">Ambulans Nasional</span>
              <span className="text-[11px] opacity-75">Gratis · 24 jam</span>
            </div>
            <div className="bg-white text-[#dc2626] text-[11px] font-bold px-3 py-1 rounded-md shrink-0">
              Hubungi
            </div>
          </a>

          {rsData.filter(rs => rs.nomorIGD).map(rs => (
            <a
              key={rs.iri}
              href={`tel:${rs.nomorIGD.replace(/\s/g, '')}`}
              className="flex items-center justify-between bg-[#fff5f5] border border-[#fca5a5] rounded-xl px-4.5 py-3.5 no-underline hover:bg-[#fee2e2] transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-medium text-[#0e2233]">{rs.namaRS}</span>
                <span className="text-[12px] text-[#dc2626] font-semibold">IGD {rs.nomorIGD}</span>
              </div>
              <Phone size={15} className="text-[#dc2626] shrink-0" />
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

        <div className="bg-[#fff5f5] border border-[#fca5a5] rounded-xl px-4 py-3.5">
          <h2 className="text-[13px] font-semibold text-[#b91c1c] m-0 mb-2.5">Segera ke IGD Jika…</h2>
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            {PERLU_IGD.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12px] text-[#4f6370] leading-normal">
                <span className="shrink-0 w-1.75 h-1.75 rounded-full bg-[#dc2626] mt-1.25" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl px-4 py-3.5">
          <h2 className="text-[13px] font-semibold text-[#15803d] m-0 mb-2.5">Tidak Perlu IGD Jika…</h2>
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            {TIDAK_IGD.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12px] text-[#4f6370] leading-normal">
                <span className="shrink-0 w-1.75 h-1.75 rounded-full bg-[#16a34a] mt-1.25" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[#15803d] mt-2.5 mb-0">
            Kunjungi poli umum atau klinik terdekat
          </p>
        </div>
      </div>

      <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl px-4 py-3.5">
        <h2 className="text-[13px] font-semibold text-[#1d4ed8] m-0 mb-3">
          Yang Perlu Dilakukan Sebelum Tiba di IGD
        </h2>
        <ol className="list-none m-0 p-0 flex flex-col gap-2.5">
          {SEBELUM_TIBA.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 bg-[#2563eb] text-white text-[10px] font-bold rounded-full flex items-center justify-center mt-px">
                {i + 1}
              </span>
              <span className="text-[13px] text-[#4f6370] leading-[1.6]">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {layananDarurat.length > 0 && (
        <div className="bg-white border border-[#dde8ec] rounded-xl px-4 py-3.5">
          <h2 className="text-[13px] font-semibold text-[#0e2233] m-0 mb-3">
            Layanan Darurat Tersedia
          </h2>
          <div className="flex flex-col gap-2">
            {layananDarurat.map(l => {
              const suffix = l.iri.endsWith('_RSBM') ? 'RSBM'
                : l.iri.endsWith('_RSPR') ? 'RSPR'
                : 'RSBM'
              const kode = l.iri.replace(/_RSBM$|_RSPR$/, '')
              return (
                <Link
                  key={l.iri}
                  href={`/layanan/${kode}?rs=${suffix}&from=darurat`}
                  className="flex items-center gap-3 px-4 py-3.5 bg-white border border-[#dde8ec] rounded-xl no-underline hover:border-[#fca5a5] hover:bg-[#fff5f5] transition-colors"
                >
                  <div className="shrink-0 w-8 h-8 bg-[#fff5f5] rounded-lg flex items-center justify-center">
                    <Activity size={15} className="text-[#dc2626]" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="text-[12px] font-medium text-[#0e2233]">{l.namaLayanan}</span>
                    <span className="text-[11px] text-[#8fa3b0] whitespace-nowrap overflow-hidden text-ellipsis">
                      {l.namaRS && <>{l.namaRS}{l.deskripsiSingkat ? ' · ' : ''}</>}
                      {l.deskripsiSingkat}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-[#8fa3b0] shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {rsData.filter(rs => rs.linkGoogleMaps).length > 0 && (
        <div className="bg-white border border-[#dde8ec] rounded-xl px-4 py-3.5">
          <h2 className="text-[13px] font-semibold text-[#0e2233] m-0 mb-3">
            Lokasi Rumah Sakit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rsData.filter(rs => rs.linkGoogleMaps).map(rs => (
              <a
                key={rs.iri}
                href={rs.linkGoogleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 bg-white border border-[#dde8ec] rounded-xl no-underline hover:border-[#bfdbfe] transition-colors"
              >
                <MapPin size={15} className="text-[#2563eb] shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-medium text-[#0e2233]">{rs.namaRS}</span>
                  <span className="text-[11px] text-[#2563eb] inline-flex items-center gap-1">
                    Buka di Google Maps <ExternalLink size={11} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}