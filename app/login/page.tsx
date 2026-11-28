'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wrench,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  RotateCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import {
  normalizeIndonesianPhone,
  formatPhoneDisplay,
  isValidEmail,
  isValidPhone,
  sendOtp,
  verifyOtp,
} from '@/services/authService'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type LoginMethod = 'email' | 'phone'
type LoginStep = 'identifier' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const { user } = useAuth()

  // State method & step
  const [method, setMethod] = useState<LoginMethod>('email')
  const [step, setStep] = useState<LoginStep>('identifier')

  // Input states
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])

  // UI state
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  // Ref untuk input 6 kotak OTP
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Jika user sudah memiliki sesi login aktif, redirect langsung ke halaman utama kasir
  useEffect(() => {
    if (user) {
      router.replace('/')
    }
  }, [user, router])

  // Timer countdown untuk kirim ulang kode OTP
  useEffect(() => {
    let timerId: NodeJS.Timeout
    if (step === 'otp' && countdown > 0) {
      timerId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [step, countdown])

  // Target yang sedang diproses
  const currentTarget =
    method === 'email'
      ? emailInput.trim().toLowerCase()
      : normalizeIndonesianPhone(phoneInput.trim())

  // Kirim Kode Verifikasi (Step 1 -> Step 2)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (method === 'email') {
      if (!isValidEmail(emailInput)) {
        toast.error('Format alamat email tidak valid!')
        return
      }
    } else {
      if (!isValidPhone(phoneInput)) {
        toast.error('Nomor telepon harus terdiri dari 9 hingga 14 digit angka!')
        return
      }
    }

    setIsSending(true)
    setDemoCode(null)

    try {
      const res = await sendOtp(method, currentTarget)

      if (!res.success) {
        toast.error(res.message || res.error || 'Gagal mengirim kode verifikasi.')
        return
      }

      toast.success(res.message, { duration: 4000 })

      if (res.isDemo && res.demoOtp) {
        setDemoCode(res.demoOtp)
      }

      // Masuk ke Step 2
      setStep('otp')
      setCountdown(60)
      setCanResend(false)
      setOtpDigits(['', '', '', '', '', ''])

      // Auto focus ke kotak pertama
      setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 150)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Terjadi kesalahan: ${msg}`)
    } finally {
      setIsSending(false)
    }
  }

  // Kirim Ulang Kode
  const handleResendOtp = async () => {
    if (!canResend || isSending) return
    await handleSendOtp()
  }

  // Handle input perubahan pada kotak OTP
  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '')

    // Handle jika user paste seluruh kode 6 digit
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('')
      const newDigits = [...otpDigits]
      pasted.forEach((char, idx) => {
        newDigits[idx] = char
      })
      setOtpDigits(newDigits)
      const nextIdx = Math.min(pasted.length, 5)
      otpInputRefs.current[nextIdx]?.focus()
      return
    }

    const newDigits = [...otpDigits]
    newDigits[index] = cleanVal

    setOtpDigits(newDigits)

    // Jika digit terisi, pindah fokus ke kotak berikutnya
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle tombol Backspace & Arrow keys pada kotak OTP
  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  // Gunakan kode demo otomatis jika ada
  const handleUseDemoCode = () => {
    if (!demoCode) return
    const split = demoCode.slice(0, 6).split('')
    setOtpDigits(split)
    otpInputRefs.current[5]?.focus()
    toast.info('Kode verifikasi demo telah dimasukkan!')
  }

  // Verifikasi OTP Code (Step 2 Submit)
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const token = otpDigits.join('').trim()
    if (token.length !== 6) {
      toast.error('Masukkan 6 digit kode verifikasi lengkap!')
      return
    }

    setIsVerifying(true)
    try {
      const res = await verifyOtp(method, currentTarget, token)

      if (!res.success) {
        toast.error(res.error || 'Kode verifikasi tidak valid.')
        return
      }

      toast.success('Verifikasi berhasil! Mengalihkan ke sistem kasir...', {
        duration: 2000,
      })

      setTimeout(() => {
        router.replace('/')
      }, 500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Gagal verifikasi: ${msg}`)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#FAF7F2] select-none">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#2A1810] flex items-center justify-center text-amber-100 shadow-md border border-[#3D2314] mb-3">
            <Wrench className="w-7 h-7 text-amber-300" />
          </div>
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-stone-900 tracking-tight leading-none">
            Karsa Kasir
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
            Sistem Kasir &amp; Inventaris Toko Perkakas
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-white border border-[#E8E1D9] rounded-2xl p-6 sm:p-8 shadow-xs">
          {step === 'identifier' ? (
            /* STEP 1: PILIH METODE & MASUKKAN IDENTIFIER */
            <div>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                  Masuk ke Aplikasi
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pilih masuk menggunakan alamat email atau nomor telepon Anda.
                </p>
              </div>

              {/* Segmented Control: Email vs No. Telepon */}
              <div className="grid grid-cols-2 p-1 bg-[#EFEAE2] rounded-xl border border-[#E4DDD3] gap-1 mb-5">
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    method === 'email'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                  )}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('phone')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    method === 'phone'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                  )}
                >
                  <Phone className="w-4 h-4" />
                  <span>No. Telepon</span>
                </button>
              </div>

              {/* Form Input Identifier */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                {method === 'email' ? (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="contoh: kasir@karsakasir.id"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/50 border border-[#E8E1D9] rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A1810]/20 focus:border-[#2A1810] transition-all select-text"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                      Kode verifikasi 6 digit akan dikirimkan ke kotak masuk email Anda.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Nomor Telepon / WhatsApp
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-stone-500 font-semibold text-xs border-r border-stone-200 pr-2">
                        <span>🇮🇩</span>
                        <span>+62</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="812-3456-7890"
                        className="w-full pl-20 pr-3.5 py-2.5 bg-stone-50/50 border border-[#E8E1D9] rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A1810]/20 focus:border-[#2A1810] transition-all select-text"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                      Kode verifikasi 6 digit akan dikirimkan via SMS / WhatsApp.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2A1810] hover:bg-[#3D2314] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim Kode...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Kode Verifikasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* STEP 2: MASUKKAN 6 DIGIT KODE VERIFIKASI (OTP) */
            <div>
              {/* Back button */}
              <button
                type="button"
                onClick={() => setStep('identifier')}
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 font-medium mb-4 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Ganti {method === 'email' ? 'Email' : 'No. Telepon'}</span>
              </button>

              <div className="mb-5 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF3EC] border border-[#EBDCCF] flex items-center justify-center text-[#603B26] mx-auto mb-2.5 shadow-2xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                  Masukkan Kode Verifikasi
                </h2>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Kode 6-digit telah dikirimkan ke:
                </p>
                <p className="text-xs sm:text-sm font-bold text-stone-800 font-mono mt-0.5">
                  {method === 'email' ? emailInput : formatPhoneDisplay(currentTarget)}
                </p>
              </div>

              {/* Demo / Simulation Code Banner jika SMS provider Supabase belum aktif */}
              {demoCode && (
                <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-300 rounded-xl text-xs text-amber-950 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Mode Simulasi OTP</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Provider SMS Supabase belum dihubungkan. Gunakan kode verifikasi simulasi di bawah:
                  </p>
                  <div className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-amber-200">
                    <span className="font-mono font-black text-sm tracking-widest text-amber-950">
                      {demoCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleUseDemoCode}
                      className="px-2.5 py-1 bg-[#2A1810] text-white hover:bg-[#3D2314] rounded-md font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
                    >
                      Gunakan Kode
                    </button>
                  </div>
                </div>
              )}

              {/* 6 Digit Input Boxes */}
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black text-stone-900 bg-stone-50/70 border border-[#E8E1D9] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A1810]/20 focus:border-[#2A1810] transition-all shadow-2xs select-text"
                    />
                  ))}
                </div>

                {/* Submit Verification */}
                <button
                  type="submit"
                  disabled={isVerifying || otpDigits.join('').length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2A1810] hover:bg-[#3D2314] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi Kode...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verifikasi &amp; Masuk</span>
                    </>
                  )}
                </button>

                {/* Resend Countdown */}
                <div className="text-center pt-1">
                  {canResend ? (
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={handleResendOtp}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#603B26] hover:text-[#3D2314] hover:underline transition-colors cursor-pointer"
                    >
                      <RotateCw className={cn('w-3.5 h-3.5', isSending && 'animate-spin')} />
                      <span>Kirim Ulang Kode Verifikasi</span>
                    </button>
                  ) : (
                    <p className="text-xs text-stone-400">
                      Kirim ulang kode dalam{' '}
                      <span className="font-bold text-stone-700 font-mono">
                        {countdown} detik
                      </span>
                    </p>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-stone-400 text-center mt-6">
          Karsa Kasir · Autentikasi Terenkripsi Supabase Auth
        </p>
      </div>
    </div>
  )
}
