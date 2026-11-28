import { createClient } from '@/lib/supabase/client'

/**
 * Normalisasi nomor telepon Indonesia ke format E.164 (+62...)
 */
export function normalizeIndonesianPhone(phone: string): string {
  // Hapus semua karakter kecuali angka dan simbol plus
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Jika diawali 0, ganti dengan +62 (contoh: 08123456789 -> +628123456789)
  if (cleaned.startsWith('0')) {
    cleaned = '+62' + cleaned.slice(1)
  } else if (cleaned.startsWith('62') && !cleaned.startsWith('+62')) {
    cleaned = '+' + cleaned
  } else if (cleaned.startsWith('8')) {
    cleaned = '+62' + cleaned
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+62' + cleaned
  }

  return cleaned
}

/**
 * Format tampilan nomor telepon ramah pengguna (contoh: +62 812-3456-7890)
 */
export function formatPhoneDisplay(phone: string): string {
  const norm = normalizeIndonesianPhone(phone)
  if (norm.startsWith('+62')) {
    const rest = norm.slice(3)
    if (rest.length <= 3) return `+62 ${rest}`
    if (rest.length <= 7) return `+62 ${rest.slice(0, 3)}-${rest.slice(3)}`
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`
  }
  return norm
}

/**
 * Validasi alamat email dasar
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email.trim())
}

/**
 * Validasi nomor telepon Indonesia (minimal 9 digit, maksimal 15 digit)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 9 && cleaned.length <= 15
}

export interface SendOtpResult {
  success: boolean
  message: string
  isDemo?: boolean
  demoOtp?: string
  error?: string
}

export interface VerifyOtpResult {
  success: boolean
  message?: string
  error?: string
  user?: {
    id: string
    email?: string
    phone?: string
    user_metadata?: Record<string, unknown>
  }
}

/**
 * Request kirim kode verifikasi (OTP) via API endpoint
 */
export async function sendOtp(
  type: 'email' | 'phone',
  target: string
): Promise<SendOtpResult> {
  try {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, target }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Gagal mengirim kode verifikasi.',
        error: data.error || 'Server error',
      }
    }

    return {
      success: true,
      message: data.message,
      isDemo: data.isDemo,
      demoOtp: data.demoOtp,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      message: 'Terjadi kesalahan koneksi saat mengirim kode verifikasi.',
      error: msg,
    }
  }
}

/**
 * Verifikasi kode OTP via API endpoint
 */
export async function verifyOtp(
  type: 'email' | 'phone',
  target: string,
  token: string
): Promise<VerifyOtpResult> {
  try {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, target, token }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Kode verifikasi salah atau sudah kedaluwarsa.',
      }
    }

    return {
      success: true,
      message: data.message,
      user: data.user,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: msg || 'Gagal memverifikasi kode OTP.',
    }
  }
}

/**
 * Sign out user dari Supabase
 */
export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
