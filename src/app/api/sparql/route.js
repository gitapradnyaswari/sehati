// src/app/api/sparql/route.js
// ─────────────────────────────────────────────────────────────
// Route Handler Next.js App Router untuk semua kebutuhan SPARQL.
//
// Pola desain: SATU endpoint, banyak aksi ("action-based routing").
// Alih-alih membuat /api/cari, /api/filter-opsi, /api/layanan, dst.,
// semua digabung ke satu file dengan parameter ?action=...
//
// Keuntungan pendekatan ini:
//   - Satu tempat untuk error handling (try/catch di luar)
//   - Mudah ditambah aksi baru tanpa membuat file baru
// Kekurangan:
//   - File bisa panjang jika aksi terus bertambah
//   - Semua aksi berbagi satu try/catch — error satu aksi
//     tidak bisa ditangani berbeda dari aksi lain
//
// GET /api/sparql?action=cari|filter-opsi|layanan|rs-layanan|bandingkan|darurat
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import {
  cariLayananPerRSWithDebug,      // pencarian dengan keyword + filter
  getAllLayananPerRSWithDebug,     // ambil semua layanan (tanpa filter)
  getOpsiFilterWithDebug,         // ambil opsi dropdown filter
  getDetailLayananWithDebug,      // detail satu layanan di satu RS
  getBandingkanWithDebug,         // detail satu layanan di semua RS (untuk perbandingan)
  getDataDaruratWithDebug,        // data kontak darurat RS
} from '@/lib/sparql'

/**
 * GET /api/sparql
 *
 * Route Handler di Next.js App Router — hanya menangani HTTP GET.
 * Parameter `req` adalah objek Request Web API standar (bukan Node.js req).
 *
 * Semua aksi dibungkus satu try/catch di level luar:
 * jika fungsi SPARQL melempar error apapun, respons 500 dikembalikan
 * dengan pesan generik agar detail error tidak bocor ke klien.
 *
 * @param {Request} req - Web API Request object (dari Next.js App Router)
 * @returns {NextResponse} JSON response
 */
export async function GET(req) {
  // URL(req.url) mem-parse URL lengkap menjadi objek terstruktur.
  // searchParams adalah interface URLSearchParams untuk membaca query string.
  // Contoh URL: /api/sparql?action=cari&q=rontgen&keluhan=nyeri
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')  // null jika tidak ada parameter action

  try {

    // ══════════════════════════════════════════════════════
    // AKSI: cari
    // Menangani dua skenario:
    //   1. Ada keyword/filter → panggil cariLayananPerRSWithDebug()
    //   2. Tidak ada apapun  → panggil getAllLayananPerRSWithDebug()
    // ══════════════════════════════════════════════════════
    if (action === 'cari') {
      const q = searchParams.get('q') || ''  // keyword teks bebas, default string kosong

      // getAll() mengambil semua nilai dengan key yang sama.
      // Contoh: ?keluhan=nyeri&keluhan=pusing → ['nyeri', 'pusing']
      // flatMap + split(',') menghandle format alternatif: ?keluhan=nyeri,pusing
      // filter(Boolean) membuang string kosong hasil split
      const keluhan    = searchParams.getAll('keluhan').flatMap(v => v.split(',')).filter(Boolean)
      const kondisi    = searchParams.getAll('kondisi').flatMap(v => v.split(',')).filter(Boolean)
      const wilayah    = searchParams.getAll('wilayah').flatMap(v => v.split(',')).filter(Boolean)
      const jenis      = searchParams.getAll('jenis').flatMap(v => v.split(',')).filter(Boolean)
      const kelompok   = searchParams.getAll('kelompok').flatMap(v => v.split(',')).filter(Boolean)
      const penjaminan = searchParams.getAll('penjaminan').flatMap(v => v.split(',')).filter(Boolean)

      // Jika tidak ada satu pun parameter yang terisi, tampilkan semua layanan.
      // Ini menghindari query SPARQL kosong yang hasilnya tidak terdefinisi.
      const noFilter = !q && !keluhan.length && !kondisi.length && !wilayah.length
        && !jenis.length && !kelompok.length && !penjaminan.length

      const { results, debug } = noFilter
        ? await getAllLayananPerRSWithDebug()
        : await cariLayananPerRSWithDebug(q, {
            // Jika array kosong, kirim undefined (bukan []) ke fungsi SPARQL
            // agar fungsi tersebut bisa membedakan "tidak difilter" vs "filter kosong"
            keluhan:      keluhan.length      ? keluhan      : undefined,
            kondisi:      kondisi.length      ? kondisi      : undefined,
            wilayah:      wilayah.length      ? wilayah      : undefined,
            jenisLayanan: jenis.length        ? jenis        : undefined,
            kelompok:     kelompok.length     ? kelompok     : undefined,
            penjaminan:   penjaminan.length   ? penjaminan   : undefined,
          })

      // sparqlDebug dikirim ke klien untuk keperluan debugging di browser DevTools.
      // Di production, pertimbangkan untuk menghapus field ini.
      return NextResponse.json({ results, count: results.length, sparqlDebug: { queries: debug } })
    }

    // ══════════════════════════════════════════════════════
    // AKSI: filter-opsi
    // Mengambil seluruh nilai unik untuk dropdown filter:
    // keluhan, kondisi, dan wilayah.
    // Tidak memerlukan parameter tambahan.
    // ══════════════════════════════════════════════════════
    if (action === 'filter-opsi') {
      const { keluhan, kondisi, wilayah, debug } = await getOpsiFilterWithDebug()
      return NextResponse.json({ keluhan, kondisi, wilayah, sparqlDebug: { queries: debug } })
    }

    // ══════════════════════════════════════════════════════
    // AKSI: layanan
    // Mengambil detail lengkap satu layanan di satu RS.
    // Parameter wajib: kode (kode layanan universal)
    // Parameter opsional: rs (suffix RS, default 'RSBM')
    // ══════════════════════════════════════════════════════
    if (action === 'layanan') {
      const kode   = searchParams.get('kode')
      // toUpperCase() memastikan suffix konsisten meski user kirim huruf kecil
      // Contoh: ?rs=rsbm → 'RSBM'
      const suffix = (searchParams.get('rs') || 'RSBM').toUpperCase()

      // Validasi input: kode wajib ada sebelum memanggil SPARQL
      if (!kode) return NextResponse.json({ error: 'kode wajib diisi' }, { status: 400 })

      const data = await getDetailLayananWithDebug(kode, suffix)
      // Spread operator menyertakan semua field dari data,
      // lalu menimpa/menambahkan sparqlDebug dengan format yang konsisten
      return NextResponse.json({ ...data, sparqlDebug: { queries: data.debug } })
    }

    // ══════════════════════════════════════════════════════
    // AKSI: rs-layanan
    // Mencari RS mana saja yang menyediakan layanan tertentu.
    // Menggunakan getAllLayananPerRSWithDebug() lalu mem-filter
    // hasilnya di JavaScript — bukan query SPARQL terpisah.
    //
    // ⚠️ CATATAN PERFORMA: Pendekatan ini mengambil SEMUA data
    // lalu memfilter di memori. Jika data tumbuh besar,
    // pertimbangkan query SPARQL khusus yang lebih efisien.
    // ══════════════════════════════════════════════════════
    if (action === 'rs-layanan') {
      const kode = searchParams.get('kode')
      // Jika kode tidak ada, kembalikan array kosong dengan status 400
      // (bukan error 500, karena ini kesalahan input klien)
      if (!kode) return NextResponse.json([], { status: 400 })

      const { results: semua } = await getAllLayananPerRSWithDebug()
      // Filter semua layanan berdasarkan kodeUniv yang cocok,
      // lalu petakan hanya field yang dibutuhkan klien
      const result = semua
        .filter(item => item.kodeUniv === kode)
        .map(item => ({ suffix: item.suffix, namaRS: item.namaRS }))

      return NextResponse.json(result)
    }

    // ══════════════════════════════════════════════════════
    // AKSI: bandingkan
    // Mengambil detail satu layanan dari SEMUA RS sekaligus,
    // untuk ditampilkan dalam tampilan perbandingan lintas RS.
    // Parameter wajib: kode (kode layanan universal)
    // ══════════════════════════════════════════════════════
    if (action === 'bandingkan') {
      const kode = searchParams.get('kode')
      if (!kode) return NextResponse.json({ error: 'kode wajib diisi' }, { status: 400 })
      const data = await getBandingkanWithDebug(kode)
      return NextResponse.json({ ...data, sparqlDebug: { queries: data.debug } })
    }

    // ══════════════════════════════════════════════════════
    // AKSI: darurat
    // Mengambil data kontak darurat (nomor IGD, dll.) semua RS.
    // Tidak memerlukan parameter tambahan.
    // ══════════════════════════════════════════════════════
    if (action === 'darurat') {
      const result = await getDataDaruratWithDebug()
      return NextResponse.json({ ...result, sparqlDebug: { queries: result.debug } })
    }

    // ── Fallback: action tidak dikenal ───────────────────
    // Jika tidak ada if yang cocok di atas, kembalikan 400.
    // Ini mencegah request tanpa action (atau action salah ketik)
    // jatuh ke catch dan dikembalikan sebagai error 500.
    return NextResponse.json({ error: 'action tidak dikenal' }, { status: 400 })

  } catch (e) {
    // Catch-all untuk error tak terduga (koneksi Fuseki putus,
    // query malformed, timeout, dll.)
    // console.error mencatat detail error di server log (tidak terlihat klien)
    // Pesan ke klien dibuat generik agar tidak membocorkan detail internal
    console.error('API sparql error:', e)
    return NextResponse.json({ error: 'Gagal mengambil data dari ontologi' }, { status: 500 })
  }
}