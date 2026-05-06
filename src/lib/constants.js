// src/lib/constants.js

export const JENIS_LAYANAN = [
  { value: 'LayananEmergensi',    label: 'Layanan Emergensi' },
  { value: 'LayananDiagnostik',   label: 'Layanan Diagnostik' },
  { value: 'LayananBedah',        label: 'Layanan Bedah' },
  { value: 'LayananTerapetik',    label: 'Layanan Terapetik' },
  { value: 'LayananIntensif',     label: 'Layanan Intensif' },
  { value: 'LayananRawatInap',    label: 'Layanan Rawat Inap' },
  { value: 'LayananRehabilitasi', label: 'Layanan Rehabilitasi' },
  { value: 'LayananKonsultasi',   label: 'Layanan Konsultasi' },
  { value: 'LayananSkrining',     label: 'Layanan Skrining' },
]

export const KELOMPOK = [
  { value: 'PasienDewasa',          label: 'Dewasa' },
  { value: 'PasienLansia',          label: 'Lansia' },
  { value: 'PasienBayiDanAnakAnak', label: 'Bayi & Anak' },
]

export const PENJAMINAN = [
  { value: 'BPJSJKNKIS',    label: 'BPJS / JKN-KIS' },
  { value: 'UmumMandiri',   label: 'Umum / Mandiri' },
  { value: 'AsuransiSwasta', label: 'Asuransi Swasta' },
]

// Warna badge jenis layanan — sengaja dibedakan dari:
//   Pemerintah : bg #e5f3ed  text #186848  border #aad4bf  (hijau)
//   Swasta     : bg #e5eef8  text #174d8a  border #aac0e4  (biru)
export const JENIS_WARNA = {
  LayananEmergensi:    { bg: '#fde8e8', text: '#b91c1c', label: 'Emergensi'    }, // merah
  LayananDiagnostik:   { bg: '#f0e9fb', text: '#6b21a8', label: 'Diagnostik'   }, // ungu — was biru (bentrok Swasta)
  LayananBedah:        { bg: '#ede9f8', text: '#5b21b6', label: 'Bedah'        }, // ungu tua
  LayananTerapetik:    { bg: '#fef3e2', text: '#92400e', label: 'Terapetik'    }, // amber — was hijau (bentrok Pemerintah)
  LayananIntensif:     { bg: '#fde8f4', text: '#9d174d', label: 'Intensif'     }, // pink/rose
  LayananRawatInap:    { bg: '#e0f4f1', text: '#0f6b5a', label: 'Rawat Inap'   }, // teal
  LayananRehabilitasi: { bg: '#fef9e2', text: '#854d0e', label: 'Rehabilitasi' }, // kuning tua — was biru tua (mirip Swasta)
  LayananKonsultasi:   { bg: '#e0f1fa', text: '#075985', label: 'Konsultasi'   }, // biru muda (cukup beda dari Swasta)
  LayananSkrining:     { bg: '#ecfdf5', text: '#065f46', label: 'Skrining'     }, // — was hijau sama Pemerintah, diganti hijau lebih terang
}