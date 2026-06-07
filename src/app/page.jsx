// ============================================================
// app/page.jsx — Halaman Beranda SEHATi
// ============================================================
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import {
  Search, Compass, MapPin, ExternalLink,
  AlertTriangle, ChevronRight,
} from 'lucide-react'
import { sparql, val } from '@/lib/sparql'

const DISCLAIMER =
  'Data bersifat informatif. Keputusan pemilihan fasilitas kesehatan dan layanan rumah sakit ' +
  'tetap harus berdasarkan kebutuhan medis serta rekomendasi tenaga kesehatan dan tidak ' +
  'menggantikan konsultasi langsung dengan tenaga kesehatan.'

const FEATURES = [
  {
    icon: Search,
    title: 'Cari Layanan Rumah Sakit',
    desc: 'Masukkan kata kunci keluhan, kondisi medis, atau nama layanan dengan kombinasi kriteria untuk menemukan informasi layanan rumah sakit yang ingin dipahami.',
    href: '/cari',
    cta: 'Cari Layanan',
  },
  {
    icon: Compass,
    title: 'Jelajahi Layanan Rumah Sakit',
    desc: 'Belum tahu nama layanannya? Jelajahi berdasarkan satu kriteria awal yang tersedia untuk menemukan informasi layanan rumah sakit yang ingin dipahami.',
    href: '/jelajahi',
    cta: 'Jelajahi Layanan',
  },
]

const INFO_CATEGORIES = [
  {
    label: 'Informasi Medis',
    labelClass: 'text-[#9f1239]',
    barColor: 'bg-[#9f1239]',
    dotColor: 'bg-[#9f1239]',
    desc: 'Penjelasan tentang tujuan layanan, kondisi dan keluhan yang ditangani, hingga risiko dan pertanyaan umum.',
    items: [
      'Tujuan layanan',
      'Kondisi & keluhan yang ditangani',
      'Rekomendasi & kontraindikasi',
      'Rasa tidak nyaman yang mungkin terjadi',
      'Risiko umum & risiko jarang terjadi',
      'Pertanyaan umum (FAQ)',
      'Miskonsepsi yang sering terjadi',
    ],
  },
  {
    label: 'Info Rumah Sakit',
    labelClass: 'text-[#0f766e]',
    barColor: 'bg-[#0f766e]',
    dotColor: 'bg-[#0f766e]',
    desc: 'Informasi operasional layanan: jadwal, durasi, cara pembayaran, dan tenaga kesehatan.',
    items: [
      'Instalasi / unit pelayanan',
      'Jadwal operasional',
      'Waktu kedatangan yang disarankan',
      'Estimasi durasi tindakan',
      'Jadwal kontrol & informasi rujukan',
      'Jenis penjaminan yang diterima',
      'Tenaga kesehatan yang terlibat',
      'Tahapan layanan langkah per langkah',
    ],
  },
  {
    label: 'Persiapan Kunjungan',
    labelClass: 'text-[#b45309]',
    barColor: 'bg-[#b45309]',
    dotColor: 'bg-[#b45309]',
    desc: 'Dokumen dan hal yang perlu disiapkan sebelum datang ke rumah sakit.',
    items: [
      'Dokumen administrasi yang diperlukan',
      'Dokumen penunjang (lab, EKG, rekam medis)',
      'Persiapan prosedural (puasa, pakaian, dll.)',
      'Informasi yang perlu disampaikan ke dokter',
    ],
  },
  {
    label: 'Pascalayanan',
    labelClass: 'text-[#0369a1]',
    barColor: 'bg-[#0369a1]',
    dotColor: 'bg-[#0369a1]',
    desc: 'Panduan setelah menjalani layanan: instruksi, pembatasan, dan jalur perawatan lanjutan.',
    items: [
      'Instruksi setelah tindakan',
      'Pembatasan aktivitas',
      'Kondisi yang harus segera kembali ke RS',
      'Jalur perawatan lanjutan (Smart Care Path)',
    ],
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Pilih Cara Mencari Informasi',
    desc: 'Gunakan Cari Layanan jika sudah tahu nama layanan atau kondisi medis yang ingin dipahami. Gunakan Jelajahi Layanan jika ingin menelusuri berdasarkan satu kriteria yang dipilih.',
  },
  {
    num: '02',
    title: 'Terapkan Filter yang Sesuai',
    desc: 'Saring hasil menggunakan filter: keluhan, kondisi medis, jenis layanan, kelompok pasien, cara pembayaran (BPJS atau umum), hingga wilayah rumah sakit.',
  },
  {
    num: '03',
    title: 'Buka Halaman Detail Layanan',
    desc: 'Klik detail layanan untuk membaca informasi lengkap dari layanan rumah sakit yang dipilih.',
  },
  {
    num: '04',
    title: 'Tinjau Informasi Lintas Rumah Sakit',
    desc: 'Gunakan fitur Tinjau Lintas RS untuk melihat informasi layanan yang sama dari lebih dari satu rumah sakit dalam satu tampilan, sehingga pasien dan calon pasien dapat memahami informasi masing-masing rumah sakit secara menyeluruh.',
  },
  {
    num: '05',
    title: 'Unduh Panduan Kunjungan',
    desc: 'Setiap layanan tersedia panduan kunjungan dalam format PDF yang dapat diunduh berisikan ringkasan informasi penting tentang layanan untuk dibawa saat berkunjung ke rumah sakit.',
  },
]

const RS_FALLBACK = [
  {
    namaRS: 'RS Bali Mandara', type: 'Pemerintah', isPemerintah: true,
    alamat: 'Jl. By Pass Ngurah Rai No. 548, Denpasar',
    nomorIGD: '(0361) 466-393', nomorReservasi: '', maps: null,
  },
  {
    namaRS: 'RS Puri Raharja', type: 'Swasta', isPemerintah: false,
    alamat: 'Jl. WR Supratman No. 14, Denpasar',
    nomorIGD: '(0361) 222-386', nomorReservasi: '', maps: null,
  },
]

async function getStats() {
  try {
    const [rowsLayanan, rowsRS, rowsIndividuals] = await Promise.all([
      sparql(`SELECT (COUNT(DISTINCT ?layanan) AS ?n) WHERE {
        ?layanan a ?jenis . ?jenis rdfs:subClassOf* ont:LayananMedis .
        FILTER(!REGEX(STR(?layanan), "_UNIV")) }`),
      sparql(`SELECT (COUNT(DISTINCT ?rs) AS ?n) WHERE {
        ?rs a ?type . ?type rdfs:subClassOf* ont:RumahSakit . }`),
      sparql(`SELECT (COUNT(DISTINCT ?s) AS ?n) WHERE {
        ?s a ?type . FILTER(!isBlank(?s))
        FILTER(STRSTARTS(STR(?type), "http://www.semanticweb.org")) }`),
    ])

    const layanan     = parseInt(rowsLayanan[0]?.n?.value     || '0', 10)
    const rs          = parseInt(rowsRS[0]?.n?.value          || '0', 10)
    const individuals = parseInt(rowsIndividuals[0]?.n?.value || '0', 10)

    return [
      { value: layanan > 0     ? `${layanan}`                        : '—', label: 'Layanan Rumah Sakit' },
      { value: rs > 0          ? String(rs)                          : '—', label: 'Rumah Sakit' },
      { value: individuals > 0 ? individuals.toLocaleString('id-ID') : '—', label: 'Data Terstruktur' },
      { value: 'Bali', label: 'Cakupan Wilayah' },
    ]
  } catch {
    return [
      { value: '42+',  label: 'Layanan Rumah Sakit' },
      { value: '2',    label: 'Rumah Sakit' },
      { value: '528',  label: 'Data Terstruktur' },
      { value: 'Bali', label: 'Cakupan Wilayah' },
    ]
  }
}

async function getRumahSakit() {
  try {
    const rows = await sparql(`
      SELECT ?rs ?namaRS ?alamat ?nomorIGD ?nomorReservasi ?maps ?type WHERE {
        ?rs a ?type . ?type rdfs:subClassOf* ont:RumahSakit .
        OPTIONAL { ?rs ont:namaRS ?namaRS }
        OPTIONAL { ?rs ont:alamatRS ?alamat }
        OPTIONAL { ?rs ont:nomorIGD ?nomorIGD }
        OPTIONAL { ?rs ont:nomorReservasi ?nomorReservasi }
        OPTIONAL { ?rs ont:linkGoogleMaps ?maps }
      } ORDER BY ?namaRS
    `)

    if (!rows || rows.length === 0) return RS_FALLBACK

    return rows.map((r) => {
      const typeIri      = val(r, 'type').split('#').pop() || ''
      const isPemerintah = typeIri === 'RumahSakitPemerintah'
      return {
        namaRS        : val(r, 'namaRS'),
        type          : isPemerintah ? 'Pemerintah' : 'Swasta',
        isPemerintah,
        alamat        : val(r, 'alamat'),
        nomorIGD      : val(r, 'nomorIGD'),
        nomorReservasi: val(r, 'nomorReservasi'),
        maps          : val(r, 'maps'),
      }
    })
  } catch {
    return RS_FALLBACK
  }
}

export default async function HomePage() {
  const [hospitals, stats] = await Promise.all([getRumahSakit(), getStats()])

  return (
    <div className="bg-[#f7fafa]">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0e2233] min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-rs.png"
            alt="Dokter dan perawat bersama pasien di rumah sakit"
            fill
            className="object-cover object-[center_28%]"
            priority
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(105deg, rgba(14,34,51,1) 0%, rgba(14,34,51,0.80) 50%, rgba(14,34,51,0.40) 100%)',
          }} />
        </div>

        <div className="absolute z-1 top-[-15%] left-[-8%] w-125 h-125 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(42,171,126,0.11) 0%, transparent 65%)' }} />

        <div className="relative z-10 w-full max-w-280 mx-auto px-5 md:px-8 py-14 md:py-20">
          <div className="max-w-150">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-8 h-px bg-[#eef7f4]" />
              <span className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#eef7f4]">
                Sistem Pencarian Layanan Rumah Sakit Provinsi Bali
              </span>
            </div>

            <h1
              className="text-[#eef7f4] font-medium leading-[1.2] tracking-[-0.02em] mb-5 max-w-200"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4.5vw, 50px)' }}
            >
              Kenali layanannya,<br />
              <em className="italic text-[#7de8c2]">jalani dengan lebih tenang.</em>
            </h1>

            <p className="text-[rgba(238,247,244,0.62)] font-light leading-[1.82] mb-8 text-[13px]">
              SEHATi membantu pasien dan calon pasien memahami informasi layanan
              rumah sakit sebelum berkunjung mulai dari prosedur, persiapan dokumen,
              hingga panduan setelah layanan. SEHATi adalah sumber informasi,{' '}
              <strong className="text-[rgba(238,247,244,0.62)] font-medium"><em>bukan sistem diagnosis dan tidak
                menentukan layanan yang harus dijalani</em>
              </strong>
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/cari"
                className="inline-flex items-center gap-2 bg-[#2aab7e] hover:bg-[#229068] text-white font-semibold px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(42,171,126,0.32)] text-[14px]">
                <Search size={16} /> Cari Layanan
              </Link>
              <Link href="/jelajahi"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/35 text-[#eef7f4] font-medium px-6 py-3.5 rounded-xl transition-all text-[14px]">
                <Compass size={16} /> Jelajahi Layanan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-b border-[#dde8ec]">
        <div className="max-w-280 mx-auto px-5 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i} className={[
                'py-7 flex flex-col items-center text-center gap-1.5',
                i < 3 ? 'border-r border-[#dde8ec]' : '',
                i < 2 ? 'max-md:border-b max-md:border-[#dde8ec]' : '',
                i % 2 === 1 ? 'max-md:border-r-0' : '',
              ].join(' ')}>
                <span className="font-medium text-[#0e2233] leading-none"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, letterSpacing: '-0.02em' }}>
                  {s.value}
                </span>
                <span className="text-[12px] text-[#8fa3b0] tracking-wide">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TENTANG SISTEM ── */}
      <section className="py-16 bg-[#f7fafa]">
        <div className="max-w-280 mx-auto px-5 md:px-8">

          <div className="mb-20">
            <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#2aab7e] mb-4">
              Tentang SEHATi
            </p>
            <h2 className="font-medium text-[#0e2233] leading-[1.18] tracking-tight mb-8"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(20px, 2.6vw, 28px)' }}>
              Apa itu SEHATi?
            </h2>
            <div className="grid md:grid-cols-2 gap-10 md:gap-16">
              <div>
                <div className="w-10 h-0.75 rounded-sm mb-6"
                  style={{ background: 'linear-gradient(90deg, #1a6fa8, #2aab7e)' }} />
                <p className="text-[14px] leading-[1.84] text-[#4f6370] font-light mb-5">
                  <strong className="text-[#0e2233] font-medium">SEHATi</strong> atau{' '}
                  <em>Sistem Pencarian Layanan Rumah Sakit Provinsi Bali</em> adalah
                  aplikasi website yang membantu pasien dan calon pasien mencari dan memahami
                  informasi tentang layanan rumah sakit yang akan dijalani.
                </p>
              </div>
              <div>
                <div className="w-10 h-0.75 rounded-sm mb-6"
                  style={{ background: 'linear-gradient(90deg, #1a6fa8, #2aab7e)' }} />
                <p className="text-[14px] leading-[1.84] text-[#4f6370] font-light mb-5">
                  SEHATi{' '}
                  <strong className="text-[#0e2233] font-medium">
                    <em>bukan sistem diagnosis dan tidak menentukan layanan yang harus dijalani</em>
                  </strong>
                  . Keputusan mengenai layanan rumah sakit yang perlu dijalani tetap berada di
                  tangan tenaga kesehatan yang berwenang.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#2aab7e] mb-4">
              Untuk Siapa
            </p>
            <h2 className="font-medium text-[#0e2233] leading-[1.18] tracking-tight mb-10"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(20px, 2.6vw, 28px)' }}>
              SEHATi dapat digunakan oleh:
            </h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  num: '01',
                  judul: 'Pasien Terjadwal',
                  desc: 'Pasien yang ingin memahami prosedur, risiko, dan persiapan teknis sebelum menjalani tindakan atau pemeriksaan sesuai jadwal dokter.',
                },
                {
                  num: '02',
                  judul: 'Calon Pasien',
                  desc: 'Masyarakat yang membutuhkan informasi mendalam mengenai suatu layanan rumah sakit sebagai bahan pertimbangan sebelum berkonsultasi dengan dokter.',
                },
                {
                  num: '03',
                  judul: 'Keluarga & Pendamping',
                  desc: 'Pihak keluarga yang memerlukan panduan lengkap mengenai layanan pasien agar dapat memberikan dukungan dan persiapan yang tepat.',
                },
              ].map((item, i) => (
                <div key={i}
                  className="bg-white border border-[#dde8ec] rounded-2xl p-6 hover:border-[#a8c8d8] hover:shadow-[0_4px_20px_rgba(14,34,51,0.06)] transition-all">
                  <span className="block text-[#2aab7e] mb-4"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, letterSpacing: '0.08em' }}>
                    {item.num}
                  </span>
                  <h3 className="text-[14px] font-semibold text-[#0e2233] mb-2.5 leading-snug">
                    {item.judul}
                  </h3>
                  <p className="text-[13px] leading-[1.72] text-[#8fa3b0] font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INFO TERSEDIA ── */}
      <section className="py-16 bg-white">
        <div className="max-w-280 mx-auto px-5 md:px-8">
          <div className="mb-14">
            <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#2aab7e] mb-4">
              Informasi Layanan
            </p>
            <h2 className="font-medium text-[#0e2233] leading-[1.16] tracking-tight mb-4"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(20px, 2.6vw, 28px)' }}>
              Apa yang tersedia di setiap halaman layanan?
            </h2>
            <p className="text-[14px] text-[#4f6370] font-light max-w-2xl">
              Setiap layanan rumah sakit di SEHATi dilengkapi dengan empat kelompok
              informasi yang disusun agar mudah dipahami oleh pasien dan calon pasien.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {INFO_CATEGORIES.map((cat, i) => (
              <div key={i}
                className="flex gap-0 bg-white border border-[#eaf1f4] rounded-2xl overflow-hidden hover:border-[#dde8ec] hover:shadow-[0_4px_20px_rgba(14,34,51,0.06)] transition-all">
                <div className={`w-1 shrink-0 ${cat.barColor}`} />
                <div className="flex-1 p-6">
                  <p className={`text-[12px] font-semibold tracking-[0.06em] uppercase mb-2 ${cat.labelClass}`}>
                    {cat.label}
                  </p>
                  <p className="text-[13px] text-[#4f6370] leading-[1.65] font-light mb-4">
                    {cat.desc}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {cat.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-[13px] text-[#4f6370] font-light leading-snug">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${cat.dotColor}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 bg-[#0e2233]">
        <div className="max-w-280 mx-auto px-5 md:px-8">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#7de8c2] mb-3">
            Fitur Utama
          </p>
          <h2 className="font-medium text-[#eef7f4] leading-[1.16] tracking-tight mb-3"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(20px, 2.6vw, 28px)' }}>
            Dua cara mencari informasi layanan
          </h2>
          <p className="text-[13px] text-[rgba(238,247,244,0.45)] font-light mb-14 max-w-xl">
            SEHATi membantu menemukan <em>informasi</em> tentang layanan rumah sakit, bukan menentukan
            layanan yang perlu dijalani seperti sistem diagnosis.
          </p>

          <div className="grid md:grid-cols-2 gap-0.5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <Link key={i} href={f.href}
                  className="group relative overflow-hidden p-7 md:p-8 transition-colors hover:bg-[rgba(125,232,194,0.05)]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(90deg, transparent, #7de8c2, transparent)' }} />
                  <div className="w-11 h-11 flex items-center justify-center rounded-xl mb-6 text-[#7de8c2]"
                    style={{ border: '1px solid rgba(125,232,194,0.26)' }}>
                    <Icon size={20} />
                  </div>
                  <h3 className="font-medium text-[#eef7f4] mb-3"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>
                    {f.title}
                  </h3>
                  <p className="text-[13px] leading-[1.74] font-light mb-6"
                    style={{ color: 'rgba(238,247,244,0.50)' }}>
                    {f.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[#7de8c2] font-medium text-[13px] tracking-[0.04em]">
                    {f.cta} <ChevronRight size={13} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="py-16 bg-white">
        <div className="max-w-280 mx-auto px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-start">

            <div className="md:sticky md:top-24">
              <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#2aab7e] mb-3">
                Cara Penggunaan
              </p>
              <h2 className="font-medium text-[#0e2233] leading-[1.16] tracking-tight mb-4"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(20px, 2.6vw, 28px)' }}>
                Bagaimana cara menggunakan SEHATi?
              </h2>
              <p className="text-[14px] leading-[1.78] text-[#4f6370] font-light">
                Lima langkah untuk mendapatkan informasi layanan rumah sakit yang dibutuhkan.
              </p>
            </div>

            <div className="flex flex-col">
              {STEPS.map((step, i) => (
                <div key={i} className={[
                  'flex gap-7 py-9 items-start',
                  i < STEPS.length - 1 ? 'border-b border-[#dde8ec]' : '',
                  i === 0 ? 'pt-0' : '',
                ].join(' ')}>
                  <span className="text-[#2aab7e] tracking-[0.08em] shrink-0 pt-0.5 min-w-7"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: 13 }}>
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-medium text-[#0e2233] mb-2 tracking-[-0.01em]">
                      {step.title}
                    </h3>
                    <p className="text-[13px] leading-[1.76] text-[#8fa3b0] font-light">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOSPITALS ── */}
      <section className="py-16 bg-[#f7fafa]">
        <div className="max-w-280 mx-auto px-5 md:px-8">
          <div className="mb-14">
            <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#2aab7e] mb-3">
              Fasilitas Kesehatan
            </p>
            <h2 className="font-medium text-[#0e2233] leading-[1.16] tracking-tight mb-3"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(20px, 2.6vw, 28px)' }}>
              Rumah sakit dalam sistem
            </h2>
            <p className="text-[14px] text-[#4f6370] font-light">
              Informasi layanan dalam SEHATi disusun berdasarkan data dari fasilitas
              kesehatan yang tersedia dan akan terus diperbarui seiring bertambahnya data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {hospitals.map((h, i) => (
              <div key={i}
                className="bg-white border border-[#dde8ec] rounded-2xl overflow-hidden transition-all hover:border-[#a8c8d8] hover:shadow-[0_8px_36px_rgba(14,34,51,0.07)]">
                <div className="p-5 border-b border-[#eaf1f4]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-[#0e2233] mb-1.5 tracking-[-0.01em]"
                        style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>
                        {h.namaRS}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[12px] text-[#8fa3b0] font-light">
                        <MapPin size={12} /><span>Denpasar, Bali</span>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full tracking-wide ${
                      h.isPemerintah
                        ? 'bg-[#e5f3ed] text-[#186848] border border-[#aad4bf]'
                        : 'bg-[#e5eef8] text-[#174d8a] border border-[#aac0e4]'
                    }`}>
                      {h.type}
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-2.5">
                  {h.alamat && (
                    <div className="flex gap-2.5 text-[13px] text-[#4f6370] font-light leading-snug">
                      <span className="text-[12px] text-[#8fa3b0] min-w-15 shrink-0 mt-0.5">Alamat</span>
                      <span>{h.alamat}</span>
                    </div>
                  )}
                  {h.nomorIGD && (
                    <div className="flex gap-2.5 text-[13px] font-light leading-snug">
                      <span className="text-[12px] text-[#8fa3b0] min-w-15 shrink-0 mt-0.5">IGD</span>
                      <a href={`tel:${h.nomorIGD.replace(/\D/g, '')}`}
                        className="text-[#1a6fa8] hover:text-[#2aab7e] font-normal transition-colors">
                        {h.nomorIGD}
                      </a>
                    </div>
                  )}
                  {h.nomorReservasi && h.nomorReservasi !== '-' && (
                    <div className="flex gap-2.5 text-[13px] text-[#4f6370] font-light leading-snug">
                      <span className="text-[12px] text-[#8fa3b0] min-w-15 shrink-0 mt-0.5">Reservasi</span>
                      <span>{h.nomorReservasi}</span>
                    </div>
                  )}
                  {h.maps && (
                    <a href={h.maps} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1a6fa8] hover:text-[#2aab7e] transition-colors mt-3 pt-1">
                      <ExternalLink size={13} /> Lihat di Google Maps
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <section className="bg-[#fffbf0] border-y border-[#e8d48a]">
        <div className="max-w-280 mx-auto px-5 md:px-8 py-8 flex items-start gap-5">
          <div className="shrink-0 w-10 h-10 bg-[#f5d76e] rounded-full flex items-center justify-center text-[#7a5800] mt-0.5">
            <AlertTriangle size={17} />
          </div>
          <div>
            <p className="text-[12px] font-semibold tracking-[0.12em] uppercase text-[#7a5800] mb-2">
              Catatan Penting
            </p>
            <p className="text-[13px] leading-[1.76] text-[#5a4200] font-light">
              {DISCLAIMER}
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA PENUTUP ── */}
      <section className="relative bg-[#0e2233] py-18 overflow-hidden text-center">
        <div className="absolute pointer-events-none"
          style={{
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 760, height: 380,
            background: 'radial-gradient(ellipse, rgba(42,171,126,0.12) 0%, transparent 65%)',
          }}
        />
        <div className="relative z-10 max-w-150 mx-auto px-5 md:px-8">
          <h2 className="font-medium text-[#eef7f4] leading-[1.15] tracking-tight mb-5 text-[clamp(26px,4.5vw,50px)]"
              style={{ fontFamily: "'Playfair Display', serif" }}>
            Kenali layanannya,<br />
            jalani dengan <em className="italic text-[#7de8c2]">lebih tenang.</em>
          </h2>
          <p className="text-[13px] leading-[1.78] font-light mb-10 mx-auto"
            style={{ color: 'rgba(238,247,244,0.50)' }}>
            Jangan datang ke rumah sakit tanpa tahu apa yang akan dijalani.
            Cari tahu prosedurnya, siapkan dokumennya, dan pahami risikonya.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/cari"
              className="inline-flex items-center gap-2 bg-[#2aab7e] hover:bg-[#229068] text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(42,171,126,0.28)] text-[14px]">
              <Search size={16} /> Cari Layanan
            </Link>
            <Link href="/jelajahi"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/35 text-[#eef7f4] font-medium px-7 py-3.5 rounded-xl transition-all text-[14px]">
              <Compass size={16} /> Jelajahi Layanan
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}