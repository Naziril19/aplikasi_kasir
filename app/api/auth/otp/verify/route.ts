import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeIndonesianPhone } from '@/services/authService'
import { checkAndConsumeOtp } from '@/lib/otpStore'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, target, token } = body

    if (!type || !target || !token) {
      return NextResponse.json(
        { success: false, error: 'Target dan kode verifikasi 6 digit wajib diisi.' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    })

    // 1. Verifikasi OTP Email
    if (type === 'email') {
      const email = target.trim().toLowerCase()

      // Coba verifikasi standar Supabase OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'email',
      })

      if (!error && data.session) {
        return NextResponse.json({
          success: true,
          message: 'Verifikasi email berhasil.',
          user: data.user,
        })
      }

      // Fallback jika menggunakan OTP simulasi
      if (checkAndConsumeOtp(email, token)) {
        const admin = createAdminClient()
        // Buat atau dapatkan user
        await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { role: 'kasir' },
        })

        const linkRes = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email,
        })

        if (linkRes.data?.properties?.hashed_token) {
          const verifySession = await supabase.auth.verifyOtp({
            token_hash: linkRes.data.properties.hashed_token,
            type: 'magiclink',
          })

          if (verifySession.data.user) {
            return NextResponse.json({
              success: true,
              message: 'Verifikasi email berhasil.',
              user: verifySession.data.user,
            })
          }
        }
      }

      return NextResponse.json(
        { success: false, error: 'Kode verifikasi email salah atau sudah kedaluwarsa.' },
        { status: 400 }
      )
    }

    // 2. Verifikasi OTP Nomor Telepon
    if (type === 'phone') {
      const formattedPhone = normalizeIndonesianPhone(target.trim())

      // Coba verifikasi SMS standar Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token.trim(),
        type: 'sms',
      })

      if (!error && data.session) {
        return NextResponse.json({
          success: true,
          message: 'Verifikasi nomor telepon berhasil.',
          user: data.user,
        })
      }

      // Verifikasi via kode OTP tersimpan (SMS fallback / demo OTP)
      if (checkAndConsumeOtp(formattedPhone, token)) {
        const admin = createAdminClient()
        const emailForPhone = `phone_${formattedPhone.replace(/\+/g, '')}@karsakasir.local`

        // Pastikan akun user terdaftar di Supabase Auth
        await admin.auth.admin.createUser({
          email: emailForPhone,
          email_confirm: true,
          user_metadata: {
            phone: formattedPhone,
            role: 'kasir',
            nama: `Kasir (${formattedPhone})`,
          },
        })

        // Generate magiclink session token
        const linkRes = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: emailForPhone,
        })

        if (linkRes.data?.properties?.hashed_token) {
          const verifySession = await supabase.auth.verifyOtp({
            token_hash: linkRes.data.properties.hashed_token,
            type: 'magiclink',
          })

          if (verifySession.data.user) {
            return NextResponse.json({
              success: true,
              message: 'Verifikasi nomor telepon berhasil.',
              user: verifySession.data.user,
            })
          }
        }
      }

      return NextResponse.json(
        { success: false, error: 'Kode verifikasi nomor telepon tidak valid atau kedaluwarsa.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Tipe verifikasi tidak valid.' },
      { status: 400 }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, error: `Gagal memverifikasi kode: ${msg}` },
      { status: 500 }
    )
  }
}
