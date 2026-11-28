import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { normalizeIndonesianPhone, isValidEmail, isValidPhone } from '@/services/authService'
import { saveOtp } from '@/lib/otpStore'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, target } = body

    if (!type || !target) {
      return NextResponse.json(
        { success: false, error: 'Tipe dan target verifikasi wajib diisi.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 1. Kirim OTP ke Email
    if (type === 'email') {
      const email = target.trim().toLowerCase()
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Format alamat email tidak valid.' },
          { status: 400 }
        )
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        console.warn('Supabase signInWithOtp (email) error:', error.message)

        // Fallback jika kuota SMTP rate limit tercapai di development
        const simulatedCode = String(Math.floor(100000 + Math.random() * 900000))
        saveOtp(email, simulatedCode)

        return NextResponse.json({
          success: true,
          isDemo: true,
          demoOtp: simulatedCode,
          message: `Layanan email Supabase membatasi kuota. Gunakan kode verifikasi simulasi: ${simulatedCode}`,
        })
      }

      return NextResponse.json({
        success: true,
        message: `Kode verifikasi telah dikirim ke ${email}. Silakan periksa kotak masuk atau spam Anda.`,
      })
    }

    // 2. Kirim OTP ke Nomor Telepon
    if (type === 'phone') {
      const phoneInput = target.trim()
      if (!isValidPhone(phoneInput)) {
        return NextResponse.json(
          { success: false, error: 'Nomor telepon tidak valid. Masukkan minimal 9-13 digit angka.' },
          { status: 400 }
        )
      }

      const formattedPhone = normalizeIndonesianPhone(phoneInput)

      // Coba kirim via provider SMS Supabase jika sudah dikonfigurasi
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        // Jika SMS provider belum diaktifkan di Supabase Dashboard
        const simulatedCode = String(Math.floor(100000 + Math.random() * 900000))
        saveOtp(formattedPhone, simulatedCode)

        return NextResponse.json({
          success: true,
          isDemo: true,
          demoOtp: simulatedCode,
          message: `Provider SMS belum dihubungkan ke Supabase. Kode verifikasi demo Anda adalah: ${simulatedCode}`,
        })
      }

      return NextResponse.json({
        success: true,
        message: `Kode verifikasi SMS berhasil dikirim ke ${formattedPhone}.`,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Tipe verifikasi harus berupa email atau phone.' },
      { status: 400 }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, error: `Gagal memproses permintaan OTP: ${msg}` },
      { status: 500 }
    )
  }
}
