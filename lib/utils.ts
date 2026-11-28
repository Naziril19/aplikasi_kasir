import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format angka ke mata uang Rupiah (contoh: Rp 35.000)
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp\u00A00'
  const formatted = Math.round(amount).toLocaleString('id-ID')
  return `Rp\u00A0${formatted}`
}

/**
 * Format angka ribuan biasa (contoh: 35.000)
 */
export function formatNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0'
  return Math.round(amount).toLocaleString('id-ID')
}

/**
 * Generate Kode Barang berikutnya (contoh: BRG-0061)
 */
export function generateKodeBarang(count: number = 60): string {
  const nextNum = count + 1
  return `BRG-${String(nextNum).padStart(4, '0')}`
}

/**
 * Generate Barcode EAN-13 acak (13 digit)
 */
export function generateEAN13(): string {
  // Prefix standar 899 (GS1 Indonesia)
  const prefix = '899'
  let randomDigits = ''
  for (let i = 0; i < 9; i++) {
    randomDigits += Math.floor(Math.random() * 10)
  }
  const raw12 = prefix + randomDigits
  
  // Calculate check digit EAN-13
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(raw12[i], 10)
    sum += i % 2 === 0 ? digit : digit * 3
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return raw12 + checkDigit
}

/**
 * Format tanggal dalam bahasa Indonesia
 * Contoh: Kamis, 26 November 2026
 */
export function formatDateIndo(date: Date = new Date()): string {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  
  const dayName = hari[date.getDay()]
  const day = date.getDate()
  const monthName = bulan[date.getMonth()]
  const year = date.getFullYear()

  return `${dayName}, ${day} ${monthName} ${year}`
}

/**
 * Mendapatkan URL foto produk dari Supabase Storage atau fallback placeholder
 */
export function getProductImageUrl(
  fotoProduk: string | null | undefined,
  supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
): string {
  if (!fotoProduk) {
    return '/file.svg' // default placeholder
  }

  // Jika sudah merupakan URL penuh (http:// atau https://)
  if (fotoProduk.startsWith('http://') || fotoProduk.startsWith('https://')) {
    return fotoProduk
  }

  // Jika path/nama file di bucket storage Supabase 'produk'
  if (supabaseUrl) {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '')
    return `${cleanUrl}/storage/v1/object/public/produk/${fotoProduk}`
  }

  return '/file.svg'
}
