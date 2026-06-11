// src/app/api/sparql/route.js
// Satu endpoint untuk semua aksi SPARQL, dibedakan lewat ?action=...

import { NextResponse } from 'next/server'
import {
  cariLayananPerRSWithDebug,
  getAllLayananPerRSWithDebug,
  getOpsiFilterWithDebug,
  getDetailLayananWithDebug,
  getBandingkanWithDebug,
  getDataDaruratWithDebug,
} from '@/lib/sparql'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  try {

    // cari: pencarian + filter (atau semua layanan kalau kosong)
    if (action === 'cari') {
      const q = searchParams.get('q') || ''

      const keluhan    = searchParams.getAll('keluhan').flatMap(v => v.split(',')).filter(Boolean)
      const kondisi    = searchParams.getAll('kondisi').flatMap(v => v.split(',')).filter(Boolean)
      const wilayah    = searchParams.getAll('wilayah').flatMap(v => v.split(',')).filter(Boolean)
      const jenis      = searchParams.getAll('jenis').flatMap(v => v.split(',')).filter(Boolean)
      const kelompok   = searchParams.getAll('kelompok').flatMap(v => v.split(',')).filter(Boolean)
      const penjaminan = searchParams.getAll('penjaminan').flatMap(v => v.split(',')).filter(Boolean)

      // kalau tidak ada filter sama sekali, ambil semua
      const noFilter = !q && !keluhan.length && !kondisi.length && !wilayah.length
        && !jenis.length && !kelompok.length && !penjaminan.length

      const { results, debug } = noFilter
        ? await getAllLayananPerRSWithDebug()
        : await cariLayananPerRSWithDebug(q, {
            // array kosong dikirim sebagai undefined
            keluhan:      keluhan.length      ? keluhan      : undefined,
            kondisi:      kondisi.length      ? kondisi      : undefined,
            wilayah:      wilayah.length      ? wilayah      : undefined,
            jenisLayanan: jenis.length        ? jenis        : undefined,
            kelompok:     kelompok.length     ? kelompok     : undefined,
            penjaminan:   penjaminan.length   ? penjaminan   : undefined,
          })

      return NextResponse.json({ results, count: results.length, sparqlDebug: { queries: debug } })
    }

    // filter-opsi: isi dropdown filter
    if (action === 'filter-opsi') {
      const { keluhan, kondisi, wilayah, debug } = await getOpsiFilterWithDebug()
      return NextResponse.json({ keluhan, kondisi, wilayah, sparqlDebug: { queries: debug } })
    }

    // layanan: detail satu layanan di satu RS
    if (action === 'layanan') {
      const kode   = searchParams.get('kode')
      const suffix = (searchParams.get('rs') || 'RSBM').toUpperCase()

      if (!kode) return NextResponse.json({ error: 'kode wajib diisi' }, { status: 400 })

      const data = await getDetailLayananWithDebug(kode, suffix)
      return NextResponse.json({ ...data, sparqlDebug: { queries: data.debug } })
    }

    // rs-layanan: cari RS mana saja yang punya layanan ini
    if (action === 'rs-layanan') {
      const kode = searchParams.get('kode')
      if (!kode) return NextResponse.json([], { status: 400 })

      const { results: semua } = await getAllLayananPerRSWithDebug()
      const result = semua
        .filter(item => item.kodeUniv === kode)
        .map(item => ({ suffix: item.suffix, namaRS: item.namaRS }))

      return NextResponse.json(result)
    }

    // bandingkan: detail satu layanan di semua RS
    if (action === 'bandingkan') {
      const kode = searchParams.get('kode')
      if (!kode) return NextResponse.json({ error: 'kode wajib diisi' }, { status: 400 })
      const data = await getBandingkanWithDebug(kode)
      return NextResponse.json({ ...data, sparqlDebug: { queries: data.debug } })
    }

    // darurat: data kontak IGD semua RS
    if (action === 'darurat') {
      const result = await getDataDaruratWithDebug()
      return NextResponse.json({ ...result, sparqlDebug: { queries: result.debug } })
    }

    // action tidak dikenal
    return NextResponse.json({ error: 'action tidak dikenal' }, { status: 400 })

  } catch (e) {
    console.error('API sparql error:', e)
    return NextResponse.json({ error: 'Gagal mengambil data dari ontologi' }, { status: 500 })
  }
}