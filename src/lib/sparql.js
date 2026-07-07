const FUSEKI_URL = process.env.NEXT_PUBLIC_FUSEKI_URL || 'http://localhost:3030'
const DATASET    = process.env.NEXT_PUBLIC_DATASET    || 'tugasakhir'
const ENDPOINT   = `${FUSEKI_URL.replace(/\/$/, '')}/${DATASET}/query`

const PREFIX = `
PREFIX ont: <http://www.semanticweb.org/gunggita/ontologies/2026/2/tugasakhir#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
`

export async function sparql(query) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
      },
      body: new URLSearchParams({ query: PREFIX + query }).toString(),
    })
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const json = await res.json()
    return json.results.bindings
  } catch (error) {
    console.error('Koneksi Fuseki Gagal:', error)
    return []
  }
}

export async function sparqlWithDebug(query) {
  const fullQuery = PREFIX + query
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
      },
      body: new URLSearchParams({ query: fullQuery }).toString(),
    })
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const json = await res.json()
    return { rows: json.results.bindings, fullQuery }
  } catch (error) {
    console.error('Koneksi Fuseki Gagal:', error)
    return { rows: [], fullQuery }
  }
}

export function val(binding, key) {
  return (binding?.[key]?.value || '').replace(/;/g, ',')
}

function localIri(binding, key) {
  const v = val(binding, key)
  return v.split('#').pop() || v
}

export function sortTahapan(arr) {
  return [...arr].sort((a, b) => {
    const numA = parseInt(a.match(/^(\d+)\./)?.[1] || '0', 10)
    const numB = parseInt(b.match(/^(\d+)\./)?.[1] || '0', 10)
    return numA - numB
  })
}

function formatNamaWilayah(nama) {
  return nama.replace(/([A-Z])/g, ' $1').trim()
}

function buildQueryRS(suffix, keyword, filters) {
  const parts = []

  if (filters.keluhan?.length) {
    const iris = filters.keluhan.map(k => `ont:${k}`).join(', ')
    parts.push(`
  {
    SELECT DISTINCT ?univ WHERE {
      ?univ ont:terkaitDenganKeluhan ?fk .
      FILTER(?fk IN (${iris}))
    }
  }`)
  }

  if (filters.kondisi?.length) {
    const iris = filters.kondisi.map(k => `ont:${k}`).join(', ')
    parts.push(`
  {
    SELECT DISTINCT ?univ WHERE {
      ?univ ont:memilikiBatasanKondisi ?fkond .
      FILTER(?fkond IN (${iris}))
    }
  }`)
  }

  if (filters.jenisLayanan?.length) {
    const iris = filters.jenisLayanan.map(j => `ont:${j}`).join(', ')
    parts.push(`  FILTER EXISTS {
    ?univ a ?jenisFlt .
    FILTER(?jenisFlt IN (${iris}))
  }`)
  }

  if (filters.kelompok?.length) {
    const vals = filters.kelompok.map(k => `ont:${k}`).join(', ')
    parts.push(`  FILTER EXISTS {
    ?rs ont:ditujukanUntukKelompok ?kf .
    FILTER(?kf IN (${vals}))
  }`)
  }

  if (filters.penjaminan?.length) {
    const vals = filters.penjaminan.map(p => `ont:${p}`).join(', ')
    parts.push(`  FILTER EXISTS {
    ?rs ont:tersediaUntukPenjaminan ?pf .
    FILTER(?pf IN (${vals}))
  }`)
  }

  if (filters.wilayah?.length) {
    const iris = filters.wilayah.map(w => `ont:${w}`).join(' ')
    parts.push(`  FILTER(?wilayahIri IN (${iris}))`)
  }

  const kwFilter = keyword.trim() ? `
  FILTER(
    REGEX(STR(?namaLayanan), "${keyword.trim().replace(/"/g, '')}", "i") ||
    REGEX(STR(?optNamaLain), "${keyword.trim().replace(/"/g, '')}", "i") ||
    REGEX(STR(?optNamaKeluhan), "${keyword.trim().replace(/"/g, '')}", "i") ||
    REGEX(STR(?optNamaKondisi), "${keyword.trim().replace(/"/g, '')}", "i")
  )` : ''

  const needsWilayah = !!filters.wilayah?.length

  return `
SELECT DISTINCT
  ?univ ?namaLayanan ?optDeskripsi ?jenisLayanan
  ?optNamaLain ?optNamaKeluhan ?optNamaKondisi
  ?namaRS ?jenisRSClass
  ?kelompokVal ?penjaminanVal
WHERE {
  ?univ a ?jenis .
  ?jenis rdfs:subClassOf* ont:LayananMedis .
  ?univ ont:namaLayanan ?namaLayanan .
  BIND(REPLACE(STR(?jenis), ".*#", "") AS ?jenisLayanan)
  FILTER(?jenis != owl:NamedIndividual)
  FILTER(REGEX(STR(?univ), "_UNIV"))

  OPTIONAL { ?univ ont:deskripsiSingkat ?optDeskripsi }
  OPTIONAL { ?univ ont:namaLain ?optNamaLain }
  OPTIONAL {
    ?univ ont:terkaitDenganKeluhan ?klu .
    ?klu ont:namaKeluhan ?optNamaKeluhan
  }
  OPTIONAL {
    ?univ ont:memilikiBatasanKondisi ?kond .
    ?kond ont:namaKondisi ?optNamaKondisi
  }

  ?rs a owl:NamedIndividual .
  FILTER(STR(?rs) = REPLACE(STR(?univ), "_UNIV", "_${suffix}"))

  ?rs ont:tersediaDiRS ?rsInd .
  ?rsInd a ?jenisRSClass .
  ?rsInd ont:namaRS ?namaRS .
  ${needsWilayah ? '?rsInd ont:beradaDiWilayah ?wilayahIri .' : ''}

  OPTIONAL {
    ?rs ont:ditujukanUntukKelompok ?kelompokIri .
    BIND(REPLACE(STR(?kelompokIri), ".*#", "") AS ?kelompokVal)
  }
  OPTIONAL {
    ?rs ont:tersediaUntukPenjaminan ?penjaminanIri .
    BIND(REPLACE(STR(?penjaminanIri), ".*#", "") AS ?penjaminanVal)
  }

  ${parts.join('\n')}
  ${kwFilter}
}
ORDER BY ?namaLayanan
`
}

function groupPerRS(rows, suffix) {
  const map = new Map()
  for (const row of rows) {
    const univIri      = val(row, 'univ')
    const kodeUniv     = univIri.split('#').pop()?.replace('_UNIV', '') || ''
    const jenisRSClass = val(row, 'jenisRSClass').split('#').pop() || ''

    if (!map.has(kodeUniv)) {
      map.set(kodeUniv, {
        kodeUniv,
        namaLayanan: val(row, 'namaLayanan'),
        deskripsiSingkat: val(row, 'optDeskripsi'),
        jenisLayanan: val(row, 'jenisLayanan'),
        namaLain: [],
        suffix,
        namaRS: val(row, 'namaRS'),
        jenisRS: jenisRSClass === 'RumahSakitPemerintah' ? 'Pemerintah' : 'Swasta',
        kelompok: [],
        penjaminan: [],
      })
    }

    const card = map.get(kodeUniv)
    const nl = val(row, 'optNamaLain')
    if (nl && !card.namaLain.includes(nl)) card.namaLain.push(nl)
    const kl = val(row, 'kelompokVal')
    if (kl && !card.kelompok.includes(kl)) card.kelompok.push(kl)
    const pj = val(row, 'penjaminanVal')
    if (pj && !card.penjaminan.includes(pj)) card.penjaminan.push(pj)
  }
  return Array.from(map.values())
}

export async function cariLayananPerRSWithDebug(keyword, filters = {}) {
  const queryRSBM = buildQueryRS('RSBM', keyword, filters)
  const queryRSPR = buildQueryRS('RSPR', keyword, filters)
  const t0 = Date.now()
  const [debugRSBM, debugRSPR] = await Promise.all([
    sparqlWithDebug(queryRSBM),
    sparqlWithDebug(queryRSPR),
  ])
  const elapsed = Date.now() - t0
  const all = [
    ...groupPerRS(debugRSBM.rows, 'RSBM'),
    ...groupPerRS(debugRSPR.rows, 'RSPR'),
  ].sort((a, b) => a.namaLayanan.localeCompare(b.namaLayanan, 'id') || a.suffix.localeCompare(b.suffix))
  return {
    results: all,
    debug: [
      { label: 'Pencarian RS Bali Mandara (RSBM)', query: debugRSBM.fullQuery, rawResults: debugRSBM.rows, executedAt: `${elapsed}ms` },
      { label: 'Pencarian RS Puri Raharja (RSPR)',  query: debugRSPR.fullQuery, rawResults: debugRSPR.rows, executedAt: `${elapsed}ms` },
    ],
  }
}

export async function getAllLayananPerRSWithDebug() {
  return cariLayananPerRSWithDebug('', {})
}

export async function getOpsiFilterWithDebug() {
  const qKeluhan = `
SELECT DISTINCT ?iri ?nama WHERE {
  ?iri a ?sub .
  ?sub rdfs:subClassOf* ont:Keluhan .
  ?iri ont:namaKeluhan ?nama .
  FILTER(?sub != owl:Class)
}
ORDER BY ?nama`

  const qKondisi = `
SELECT DISTINCT ?iri ?nama WHERE {
  ?iri a ?sub .
  ?sub rdfs:subClassOf* ont:KondisiMedis .
  ?iri ont:namaKondisi ?nama .
  FILTER(?sub != owl:Class)
}
ORDER BY ?nama`

  const qWilayah = `
SELECT DISTINCT ?iri ?nama WHERE {
  ?rs ont:beradaDiWilayah ?iri .
  BIND(REPLACE(STR(?iri), ".*#", "") AS ?nama)
}
ORDER BY ?nama`

  const t0 = Date.now()
  const [dKeluhan, dKondisi, dWilayah] = await Promise.all([
    sparqlWithDebug(qKeluhan),
    sparqlWithDebug(qKondisi),
    sparqlWithDebug(qWilayah),
  ])
  const elapsed = Date.now() - t0

  return {
    keluhan: dKeluhan.rows.map(r => ({ iri: val(r, 'iri').split('#').pop() || '', nama: val(r, 'nama') })),
    kondisi: dKondisi.rows.map(r => ({ iri: val(r, 'iri').split('#').pop() || '', nama: val(r, 'nama') })),
    wilayah: dWilayah.rows.map(r => ({
      iri:  val(r, 'iri').split('#').pop() || '',
      nama: formatNamaWilayah(val(r, 'nama')),
    })),
    debug: [
      { label: 'Opsi Filter: Keluhan',       query: dKeluhan.fullQuery, rawResults: dKeluhan.rows, executedAt: `${elapsed}ms` },
      { label: 'Opsi Filter: Kondisi Medis', query: dKondisi.fullQuery, rawResults: dKondisi.rows, executedAt: `${elapsed}ms` },
      { label: 'Opsi Filter: Wilayah RS',    query: dWilayah.fullQuery, rawResults: dWilayah.rows, executedAt: `${elapsed}ms` },
    ],
  }
}

export async function getDetailLayananWithDebug(kode, suffix) {
  const qUniv = `
SELECT ?namaLayanan ?namaLain ?tujuanLayanan ?deskripsiSingkat
       ?rekomendasiPadaKondisi ?tidakDirekomendasikanPada
       ?rasaTidakNyaman ?kondisiHarusKembaliRS
       ?pertanyaanUmum ?miskonsepsi ?jenisLayanan
WHERE {
  VALUES ?layanan { ont:${kode}_UNIV }
  ?layanan a ?jenis .
  BIND(REPLACE(STR(?jenis), ".*#", "") AS ?jenisLayanan)
  OPTIONAL { ?layanan ont:namaLayanan ?namaLayanan }
  OPTIONAL { ?layanan ont:namaLain ?namaLain }
  OPTIONAL { ?layanan ont:tujuanLayanan ?tujuanLayanan }
  OPTIONAL { ?layanan ont:deskripsiSingkat ?deskripsiSingkat }
  OPTIONAL { ?layanan ont:rekomendasiPadaKondisi ?rekomendasiPadaKondisi }
  OPTIONAL { ?layanan ont:tidakDirekomendasikanPada ?tidakDirekomendasikanPada }
  OPTIONAL { ?layanan ont:rasaTidakNyaman ?rasaTidakNyaman }
  OPTIONAL { ?layanan ont:kondisiHarusKembaliRS ?kondisiHarusKembaliRS }
  OPTIONAL { ?layanan ont:pertanyaanUmum ?pertanyaanUmum }
  OPTIONAL { ?layanan ont:miskonsepsi ?miskonsepsi }
}`

  const qSpesifik = `
SELECT ?namaUnit ?namaTenaga ?jadwalOperasional ?waktuKedatangan
       ?durasiTindakan ?durasiObservasi ?durasiPersiapan
       ?persetujuanTindakan ?perluRujukan ?keteranganRujukan
       ?tahapanLayanan ?jadwalKontrol
       ?kelompok ?penjaminan ?namaRS
WHERE {
  VALUES ?layanan { ont:${kode}_${suffix} }
  OPTIONAL { ?layanan ont:diselenggarakanOlehUnit ?unit . ?unit ont:namaUnit ?namaUnit }
  OPTIONAL { ?layanan ont:melibatkanTenagaKesehatan ?tenaga . ?tenaga ont:namaTenaga ?namaTenaga }
  OPTIONAL { ?layanan ont:jadwalOperasional ?jadwalOperasional }
  OPTIONAL { ?layanan ont:waktuKedatangan ?waktuKedatangan }
  OPTIONAL { ?layanan ont:durasiTindakan ?durasiTindakan }
  OPTIONAL { ?layanan ont:durasiObservasi ?durasiObservasi }
  OPTIONAL { ?layanan ont:durasiPersiapan ?durasiPersiapan }
  OPTIONAL { ?layanan ont:persetujuanTindakan ?persetujuanTindakan }
  OPTIONAL { ?layanan ont:perluRujukan ?perluRujukan }
  OPTIONAL { ?layanan ont:keteranganRujukan ?keteranganRujukan }
  OPTIONAL { ?layanan ont:tahapanLayanan ?tahapanLayanan }
  OPTIONAL { ?layanan ont:jadwalKontrol ?jadwalKontrol }
  OPTIONAL { ?layanan ont:ditujukanUntukKelompok ?kelompokInd .
             BIND(REPLACE(STR(?kelompokInd), ".*#", "") AS ?kelompok) }
  OPTIONAL { ?layanan ont:tersediaUntukPenjaminan ?penjaminanInd .
             BIND(REPLACE(STR(?penjaminanInd), ".*#", "") AS ?penjaminan) }
  OPTIONAL { ?layanan ont:tersediaDiRS ?rs . ?rs ont:namaRS ?namaRS }
}`

  const qRisiko = `
SELECT ?namaRisiko ?tipeRisiko
WHERE {
  VALUES ?layanan { ont:${kode}_UNIV }
  ?layanan ont:memilikiPotensiRisiko ?risiko .
  ?risiko a ?tipe .
  ?risiko ont:namaRisiko ?namaRisiko .
  BIND(REPLACE(STR(?tipe), ".*#", "") AS ?tipeRisiko)
  FILTER(?tipe != owl:NamedIndividual)
}`

  const qKondisi = `
SELECT ?namaKondisi WHERE {
  VALUES ?layanan { ont:${kode}_UNIV }
  ?layanan ont:memilikiBatasanKondisi ?kondisi .
  ?kondisi ont:namaKondisi ?namaKondisi .
}`

  const qKeluhan = `
SELECT ?namaKeluhan WHERE {
  VALUES ?layanan { ont:${kode}_UNIV }
  ?layanan ont:terkaitDenganKeluhan ?keluhan .
  ?keluhan ont:namaKeluhan ?namaKeluhan .
}`

  const qDokumen = `
SELECT ?namaDokumen ?tipe WHERE {
  VALUES ?layanan { ont:${kode}_${suffix} }
  ?layanan ont:membutuhkanDokumen ?dok .
  ?dok ont:namaDokumen ?namaDokumen .
  ?dok a ?tipeInd .
  BIND(REPLACE(STR(?tipeInd), ".*#", "") AS ?tipe)
  FILTER(?tipeInd != owl:NamedIndividual)
}`

  const qPersiapan = `
SELECT ?namaPersiapan ?tipe WHERE {
  VALUES ?layanan { ont:${kode}_${suffix} }
  ?layanan ont:membutuhkanPersiapan ?per .
  ?per ont:namaPersiapan ?namaPersiapan .
  ?per a ?tipeInd .
  BIND(REPLACE(STR(?tipeInd), ".*#", "") AS ?tipe)
  FILTER(?tipeInd != owl:NamedIndividual)
}`

  const qPoinKonsultasi = `
SELECT ?informasiKonsultasi WHERE {
  VALUES ?layanan { ont:${kode}_UNIV }
  ?layanan ont:membutuhkanInformasiKonsultasi ?poin .
  ?poin ont:informasiKonsultasi ?informasiKonsultasi .
}`

  const qInstruksi = `
SELECT ?instruksiPascaLayanan ?pembatasanAktivitas WHERE {
  VALUES ?layanan { ont:${kode}_UNIV }
  ?layanan ont:memilikiInstruksi ?ins .
  OPTIONAL { ?ins ont:instruksiPascaLayanan ?instruksiPascaLayanan }
  OPTIONAL { ?ins ont:pembatasanAktivitas ?pembatasanAktivitas }
}`

  const qCarePath = `
SELECT ?sebelum ?namaSebelum ?sesudah ?namaSesudah WHERE {
  VALUES ?layanan { ont:${kode}_${suffix} }
  OPTIONAL {
    ?layanan ont:merupakanLanjutanDari ?sebelumIri .
    BIND(REPLACE(STR(?sebelumIri), ".*#", "") AS ?sebelum)
    BIND(REPLACE(?sebelum, "_RSBM|_RSPR", "_UNIV") AS ?sebelumUniv)
    OPTIONAL { ?uIri ont:namaLayanan ?namaSebelum . FILTER(REPLACE(STR(?uIri), ".*#", "") = ?sebelumUniv) }
  }
  OPTIONAL {
    ?layanan ont:dilanjutkanDenganLayanan ?sesudahIri .
    BIND(REPLACE(STR(?sesudahIri), ".*#", "") AS ?sesudah)
    BIND(REPLACE(?sesudah, "_RSBM|_RSPR", "_UNIV") AS ?sesudahUniv)
    OPTIONAL { ?uIri2 ont:namaLayanan ?namaSesudah . FILTER(REPLACE(STR(?uIri2), ".*#", "") = ?sesudahUniv) }
  }
}`

  const t0 = Date.now()
  const [dUniv, dSpesifik, dRisiko, dKondisi, dKeluhan, dDokumen, dPersiapan, dPoinKons, dInstruksi, dCarePath] =
    await Promise.all([
      sparqlWithDebug(qUniv), sparqlWithDebug(qSpesifik), sparqlWithDebug(qRisiko),
      sparqlWithDebug(qKondisi), sparqlWithDebug(qKeluhan), sparqlWithDebug(qDokumen),
      sparqlWithDebug(qPersiapan), sparqlWithDebug(qPoinKonsultasi), sparqlWithDebug(qInstruksi),
      sparqlWithDebug(qCarePath),
    ])
  const elapsed = Date.now() - t0

  const collectUniv      = (key) => Array.from(new Set(dUniv.rows.map(r => val(r, key)).filter(Boolean)))
  const collectSpesifik  = (key) => Array.from(new Set(dSpesifik.rows.map(r => val(r, key)).filter(Boolean)))
  const collectInstruksi = (key) => Array.from(new Set(dInstruksi.rows.map(r => val(r, key)).filter(Boolean)))
  const firstUniv     = dUniv.rows[0]
  const firstSpesifik = dSpesifik.rows[0]

  const sebelumSet = new Map()
  const sesudahSet = new Map()
  for (const r of dCarePath.rows) {
    const sb = val(r, 'sebelum'); const ss = val(r, 'sesudah')
    if (sb) sebelumSet.set(sb, val(r, 'namaSebelum') || sb.replace('_RSBM', '').replace('_RSPR', ''))
    if (ss) sesudahSet.set(ss, val(r, 'namaSesudah') || ss.replace('_RSBM', '').replace('_RSPR', ''))
  }

  return {
    universal: firstUniv ? {
      namaLayanan: val(firstUniv, 'namaLayanan'),
      namaLain: collectUniv('namaLain'),
      tujuanLayanan: val(firstUniv, 'tujuanLayanan'),
      deskripsiSingkat: val(firstUniv, 'deskripsiSingkat'),
      jenisLayanan: val(firstUniv, 'jenisLayanan'),
      rekomendasiPadaKondisi: collectUniv('rekomendasiPadaKondisi'),
      tidakDirekomendasikanPada: collectUniv('tidakDirekomendasikanPada'),
      rasaTidakNyaman: collectUniv('rasaTidakNyaman'),
      kondisiHarusKembaliRS: collectUniv('kondisiHarusKembaliRS'),
      pertanyaanUmum: collectUniv('pertanyaanUmum'),
      miskonsepsi: collectUniv('miskonsepsi'),
    } : null,
    spesifik: firstSpesifik ? {
      namaUnit: val(firstSpesifik, 'namaUnit'),
      tenaga: collectSpesifik('namaTenaga'),
      jadwalOperasional: val(firstSpesifik, 'jadwalOperasional'),
      waktuKedatangan: val(firstSpesifik, 'waktuKedatangan'),
      durasiTindakan: val(firstSpesifik, 'durasiTindakan'),
      durasiObservasi: val(firstSpesifik, 'durasiObservasi'),
      durasiPersiapan: val(firstSpesifik, 'durasiPersiapan'),
      persetujuanTindakan: val(firstSpesifik, 'persetujuanTindakan'),
      perluRujukan: val(firstSpesifik, 'perluRujukan') === 'true',
      keteranganRujukan: val(firstSpesifik, 'keteranganRujukan'),
      tahapanLayanan: sortTahapan(collectSpesifik('tahapanLayanan')),
      jadwalKontrol: val(firstSpesifik, 'jadwalKontrol'),
      kelompok: collectSpesifik('kelompok'),
      penjaminan: collectSpesifik('penjaminan'),
      namaRS: val(firstSpesifik, 'namaRS'),
    } : null,
    risiko: {
      umum:   dRisiko.rows.filter(r => val(r, 'tipeRisiko') === 'RisikoUmum').map(r => ({ nama: val(r, 'namaRisiko') })),
      jarang: dRisiko.rows.filter(r => val(r, 'tipeRisiko') === 'RisikoJarang').map(r => ({ nama: val(r, 'namaRisiko') })),
    },
    kondisi:        dKondisi.rows.map(r => val(r, 'namaKondisi')),
    keluhan:        dKeluhan.rows.map(r => val(r, 'namaKeluhan')),
    dokumen: {
      administrasi: dDokumen.rows.filter(r => val(r, 'tipe') === 'DokumenAdministrasi').map(r => val(r, 'namaDokumen')),
      penunjang:    dDokumen.rows.filter(r => val(r, 'tipe') === 'DokumenPenunjang').map(r => val(r, 'namaDokumen')),
    },
    persiapan: {
      prosedural:   dPersiapan.rows.filter(r => val(r, 'tipe') === 'PersiapanProsedural').map(r => val(r, 'namaPersiapan')),
      perlengkapan: dPersiapan.rows.filter(r => val(r, 'tipe') === 'PersiapanPerlengkapan').map(r => val(r, 'namaPersiapan')),
    },
    instruksi: {
      instruksi:  collectInstruksi('instruksiPascaLayanan'),
      pembatasan: collectInstruksi('pembatasanAktivitas'),
    },
    poinKonsultasi: dPoinKons.rows.map(r => val(r, 'informasiKonsultasi')),
    carePath: {
      sebelum: Array.from(sebelumSet.entries()).map(([iri, nama]) => ({ iri, nama })),
      sesudah: Array.from(sesudahSet.entries()).map(([iri, nama]) => ({ iri, nama })),
    },
    debug: [
      { label: 'Data Universal Layanan',       query: dUniv.fullQuery,      rawResults: dUniv.rows,      executedAt: `${elapsed}ms` },
      { label: `Data Spesifik RS (${suffix})`, query: dSpesifik.fullQuery,  rawResults: dSpesifik.rows,  executedAt: `${elapsed}ms` },
      { label: 'Risiko Tindakan',              query: dRisiko.fullQuery,    rawResults: dRisiko.rows,    executedAt: `${elapsed}ms` },
      { label: 'Kondisi Medis Terkait',        query: dKondisi.fullQuery,   rawResults: dKondisi.rows,   executedAt: `${elapsed}ms` },
      { label: 'Keluhan Terkait',              query: dKeluhan.fullQuery,   rawResults: dKeluhan.rows,   executedAt: `${elapsed}ms` },
      { label: 'Dokumen yang Dibutuhkan',      query: dDokumen.fullQuery,   rawResults: dDokumen.rows,   executedAt: `${elapsed}ms` },
      { label: 'Persiapan Tindakan',           query: dPersiapan.fullQuery, rawResults: dPersiapan.rows, executedAt: `${elapsed}ms` },
      { label: 'Poin Konsultasi',              query: dPoinKons.fullQuery,  rawResults: dPoinKons.rows,  executedAt: `${elapsed}ms` },
      { label: 'Instruksi Pascalayanan',       query: dInstruksi.fullQuery, rawResults: dInstruksi.rows, executedAt: `${elapsed}ms` },
      { label: 'Smart Care Path',              query: dCarePath.fullQuery,  rawResults: dCarePath.rows,  executedAt: `${elapsed}ms` },
    ],
  }
}

export async function getBandingkanWithDebug(kode) {
  const props = ['jadwalOperasional', 'waktuKedatangan', 'durasiTindakan',
                 'durasiObservasi', 'durasiPersiapan', 'persetujuanTindakan',
                 'keteranganRujukan', 'jadwalKontrol']

  const qUniv        = `SELECT ?namaLayanan WHERE { VALUES ?layanan { ont:${kode}_UNIV } ?layanan ont:namaLayanan ?namaLayanan . }`
  const qTenaga      = `SELECT ?rsbm ?rspr WHERE { OPTIONAL { ont:${kode}_RSBM ont:melibatkanTenagaKesehatan ?t1 . ?t1 ont:namaTenaga ?rsbm } OPTIONAL { ont:${kode}_RSPR ont:melibatkanTenagaKesehatan ?t2 . ?t2 ont:namaTenaga ?rspr } }`
  const qTahapanRSBM = `SELECT ?tahapan WHERE { ont:${kode}_RSBM ont:tahapanLayanan ?tahapan }`
  const qTahapanRSPR = `SELECT ?tahapan WHERE { ont:${kode}_RSPR ont:tahapanLayanan ?tahapan }`
  const qDokRSBM     = `SELECT ?namaDokumen ?tipe WHERE { VALUES ?layanan { ont:${kode}_RSBM } ?layanan ont:membutuhkanDokumen ?dok . ?dok ont:namaDokumen ?namaDokumen . ?dok a ?tipeInd . BIND(REPLACE(STR(?tipeInd), ".*#", "") AS ?tipe) FILTER(?tipeInd != owl:NamedIndividual) }`
  const qDokRSPR     = `SELECT ?namaDokumen ?tipe WHERE { VALUES ?layanan { ont:${kode}_RSPR } ?layanan ont:membutuhkanDokumen ?dok . ?dok ont:namaDokumen ?namaDokumen . ?dok a ?tipeInd . BIND(REPLACE(STR(?tipeInd), ".*#", "") AS ?tipe) FILTER(?tipeInd != owl:NamedIndividual) }`
  const qPerRSBM     = `SELECT ?namaPersiapan ?tipe WHERE { VALUES ?layanan { ont:${kode}_RSBM } ?layanan ont:membutuhkanPersiapan ?per . ?per ont:namaPersiapan ?namaPersiapan . ?per a ?tipeInd . BIND(REPLACE(STR(?tipeInd), ".*#", "") AS ?tipe) FILTER(?tipeInd != owl:NamedIndividual) }`
  const qPerRSPR     = `SELECT ?namaPersiapan ?tipe WHERE { VALUES ?layanan { ont:${kode}_RSPR } ?layanan ont:membutuhkanPersiapan ?per . ?per ont:namaPersiapan ?namaPersiapan . ?per a ?tipeInd . BIND(REPLACE(STR(?tipeInd), ".*#", "") AS ?tipe) FILTER(?tipeInd != owl:NamedIndividual) }`
  const propQueries  = props.map(prop =>
    `SELECT ?nilaiRSBM ?nilaiRSPR WHERE { OPTIONAL { ont:${kode}_RSBM ont:${prop} ?nilaiRSBM } OPTIONAL { ont:${kode}_RSPR ont:${prop} ?nilaiRSPR } }`
  )

  const t0 = Date.now()
  const [dUniv, dTenaga, dTahapanRSBM, dTahapanRSPR, dDokRSBM, dDokRSPR, dPerRSBM, dPerRSPR, ...propResults] =
    await Promise.all([
      sparqlWithDebug(qUniv), sparqlWithDebug(qTenaga),
      sparqlWithDebug(qTahapanRSBM), sparqlWithDebug(qTahapanRSPR),
      sparqlWithDebug(qDokRSBM), sparqlWithDebug(qDokRSPR),
      sparqlWithDebug(qPerRSBM), sparqlWithDebug(qPerRSPR),
      ...propQueries.map(q => sparqlWithDebug(q)),
    ])
  const elapsed = Date.now() - t0

  const perbandingan = {}
  props.forEach((prop, i) => {
    const rows = propResults[i].rows
    if (rows.length > 0) perbandingan[prop] = { rsbm: val(rows[0], 'nilaiRSBM'), rspr: val(rows[0], 'nilaiRSPR') }
  })

  return {
    namaLayanan: dUniv.rows[0] ? val(dUniv.rows[0], 'namaLayanan') : kode,
    perbandingan,
    tenaga: {
      rsbm: dTenaga.rows.map(r => val(r, 'rsbm')).filter(Boolean),
      rspr: dTenaga.rows.map(r => val(r, 'rspr')).filter(Boolean),
    },
    tahapan: {
      rsbm: sortTahapan(dTahapanRSBM.rows.map(r => val(r, 'tahapan')).filter(Boolean)),
      rspr: sortTahapan(dTahapanRSPR.rows.map(r => val(r, 'tahapan')).filter(Boolean)),
    },
    dokumenRSBM: {
      administrasi: dDokRSBM.rows.filter(r => val(r, 'tipe') === 'DokumenAdministrasi').map(r => val(r, 'namaDokumen')),
      penunjang:    dDokRSBM.rows.filter(r => val(r, 'tipe') === 'DokumenPenunjang').map(r => val(r, 'namaDokumen')),
    },
    dokumenRSPR: {
      administrasi: dDokRSPR.rows.filter(r => val(r, 'tipe') === 'DokumenAdministrasi').map(r => val(r, 'namaDokumen')),
      penunjang:    dDokRSPR.rows.filter(r => val(r, 'tipe') === 'DokumenPenunjang').map(r => val(r, 'namaDokumen')),
    },
    persiapanRSBM: {
      prosedural:   dPerRSBM.rows.filter(r => val(r, 'tipe') === 'PersiapanProsedural').map(r => val(r, 'namaPersiapan')),
      perlengkapan: dPerRSBM.rows.filter(r => val(r, 'tipe') === 'PersiapanPerlengkapan').map(r => val(r, 'namaPersiapan')),
    },
    persiapanRSPR: {
      prosedural:   dPerRSPR.rows.filter(r => val(r, 'tipe') === 'PersiapanProsedural').map(r => val(r, 'namaPersiapan')),
      perlengkapan: dPerRSPR.rows.filter(r => val(r, 'tipe') === 'PersiapanPerlengkapan').map(r => val(r, 'namaPersiapan')),
    },
    debug: [
      { label: 'Nama Layanan (Universal)',      query: dUniv.fullQuery,       rawResults: dUniv.rows,       executedAt: `${elapsed}ms` },
      { label: 'Perbandingan Tenaga Kesehatan', query: dTenaga.fullQuery,      rawResults: dTenaga.rows,      executedAt: `${elapsed}ms` },
      { label: 'Tahapan Layanan RSBM',          query: dTahapanRSBM.fullQuery, rawResults: dTahapanRSBM.rows, executedAt: `${elapsed}ms` },
      { label: 'Tahapan Layanan RSPR',          query: dTahapanRSPR.fullQuery, rawResults: dTahapanRSPR.rows, executedAt: `${elapsed}ms` },
      { label: 'Dokumen RSBM',                  query: dDokRSBM.fullQuery,     rawResults: dDokRSBM.rows,     executedAt: `${elapsed}ms` },
      { label: 'Dokumen RSPR',                  query: dDokRSPR.fullQuery,     rawResults: dDokRSPR.rows,     executedAt: `${elapsed}ms` },
      { label: 'Persiapan RSBM',                query: dPerRSBM.fullQuery,     rawResults: dPerRSBM.rows,     executedAt: `${elapsed}ms` },
      { label: 'Persiapan RSPR',                query: dPerRSPR.fullQuery,     rawResults: dPerRSPR.rows,     executedAt: `${elapsed}ms` },
      ...props.map((prop, i) => ({
        label: `Perbandingan: ${prop}`,
        query: propResults[i].fullQuery,
        rawResults: propResults[i].rows,
        executedAt: `${elapsed}ms`,
      })),
    ],
  }
}

export async function getDataDaruratWithDebug() {
  const qRS = `
SELECT ?rs ?namaRS ?nomorIGD ?nomorReservasi ?linkGoogleMaps ?alamatRS
WHERE {
  ?rs a ?tipe .
  ?tipe rdfs:subClassOf* ont:RumahSakit .
  OPTIONAL { ?rs ont:namaRS ?namaRS }
  OPTIONAL { ?rs ont:nomorIGD ?nomorIGD }
  OPTIONAL { ?rs ont:nomorReservasi ?nomorReservasi }
  OPTIONAL { ?rs ont:linkGoogleMaps ?linkGoogleMaps }
  OPTIONAL { ?rs ont:alamatRS ?alamatRS }
}`

  const qLayanan = `
SELECT DISTINCT ?layanan ?namaLayanan ?deskripsiSingkat ?namaRS
WHERE {
  ?layanan a ont:LayananEmergensi .
  ?layanan ont:tersediaDiRS ?rsInd .
  ?rsInd ont:namaRS ?namaRS .
  FILTER(!REGEX(STR(?layanan), "_UNIV"))
  BIND(IRI(CONCAT(
    REPLACE(STR(?layanan), "#.*", ""),
    "#",
    REPLACE(REPLACE(STR(?layanan), ".*#", ""), "_[^_]+$", "_UNIV")
  )) AS ?univIri)
  ?univIri ont:namaLayanan ?namaLayanan .
  OPTIONAL { ?univIri ont:deskripsiSingkat ?deskripsiSingkat }
}
ORDER BY ?namaLayanan ?namaRS`

  const t0 = Date.now()
  const [dRS, dLayanan] = await Promise.all([sparqlWithDebug(qRS), sparqlWithDebug(qLayanan)])
  const elapsed = Date.now() - t0

  return {
    rsData: dRS.rows.map(r => ({
      iri: localIri(r, 'rs'),
      namaRS: val(r, 'namaRS'),
      nomorIGD: val(r, 'nomorIGD'),
      nomorReservasi: val(r, 'nomorReservasi'),
      linkGoogleMaps: val(r, 'linkGoogleMaps'),
      alamatRS: val(r, 'alamatRS'),
    })),
    layananDarurat: dLayanan.rows.map(r => ({
      iri: localIri(r, 'layanan'),
      namaLayanan: val(r, 'namaLayanan'),
      deskripsiSingkat: val(r, 'deskripsiSingkat'),
      namaRS: val(r, 'namaRS'),
      jenisLayanan: 'LayananEmergensi',
      namaLain: [],
    })),
    debug: [
      { label: 'Info Rumah Sakit', query: dRS.fullQuery,      rawResults: dRS.rows,      executedAt: `${elapsed}ms` },
      { label: 'Layanan Darurat',  query: dLayanan.fullQuery, rawResults: dLayanan.rows, executedAt: `${elapsed}ms` },
    ],
  }
}