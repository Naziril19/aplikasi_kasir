import { createClient } from '@/lib/supabase/server'

export default async function TestSupabasePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSecretKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  let connectionStatus: 'not_configured' | 'success' | 'error' = 'not_configured'
  let errorMessage: string | null = null

  if (url && anonKey) {
    try {
      const supabase = await createClient()
      // Ping Supabase auth service to check connectivity
      const { error } = await supabase.auth.getSession()
      if (error) {
        connectionStatus = 'error'
        errorMessage = error.message
      } else {
        connectionStatus = 'success'
      }
    } catch (err: unknown) {
      connectionStatus = 'error'
      errorMessage = err instanceof Error ? err.message : String(err)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          ⚡ Status Koneksi Supabase
        </h1>

        <div className="space-y-4">
          <div className="rounded-lg bg-zinc-800/60 p-4 border border-zinc-700/50">
            <h2 className="text-sm font-medium text-zinc-400 mb-2">Environment Variables:</h2>
            <ul className="space-y-1 text-sm font-mono">
              <li className="flex justify-between">
                <span className="text-zinc-400">NEXT_PUBLIC_SUPABASE_URL:</span>
                <span className={url ? 'text-emerald-400' : 'text-amber-400'}>
                  {url ? url : '(Belum diisi)'}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-zinc-400">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span className={anonKey ? 'text-emerald-400' : 'text-rose-400'}>
                  {anonKey ? '✓ Terpasang' : '✗ Belum ada'}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-zinc-400">SUPABASE_SERVICE_ROLE_KEY:</span>
                <span className={hasSecretKey ? 'text-emerald-400' : 'text-zinc-500'}>
                  {hasSecretKey ? '✓ Terpasang (Server)' : 'Tidak dipasang'}
                </span>
              </li>
            </ul>
          </div>

          <div
            className={`rounded-lg p-4 border ${
              connectionStatus === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : connectionStatus === 'error'
                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                : 'bg-amber-950/40 border-amber-800 text-amber-200'
            }`}
          >
            <div className="font-semibold text-base mb-1">
              {connectionStatus === 'success' && '✅ Supabase Terhubung Berhasil!'}
              {connectionStatus === 'error' && '❌ Gagal Menghubungi Supabase'}
              {connectionStatus === 'not_configured' && '⚠️ NEXT_PUBLIC_SUPABASE_URL Belum Diisi'}
            </div>
            <p className="text-sm opacity-90">
              {connectionStatus === 'success' &&
                'Koneksi client SSR ke Supabase berhasil diinisialisasi.'}
              {connectionStatus === 'error' &&
                `Error: ${errorMessage}`}
              {connectionStatus === 'not_configured' &&
                'Buka file .env.local dan isi NEXT_PUBLIC_SUPABASE_URL dengan URL project Supabase Anda (https://[project-ref].supabase.co).'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
