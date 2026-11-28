import { createClient } from '@/lib/supabase/client'
import {
  ReportPeriodType,
  SalesReportData,
  SalesReportKPI,
  DailyTrendPoint,
  TopSellingProduct,
  PaymentMethodDistribution,
  Transaksi,
  MetodePembayaran,
} from '@/types/pos'

/**
 * Format helper: Ubah Date ke format YYYY-MM-DD sesuai zona waktu Asia/Jakarta
 */
export function getJakartaDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const y = parts.find((p) => p.type === 'year')?.value || '2026'
  const m = parts.find((p) => p.type === 'month')?.value || '01'
  const d = parts.find((p) => p.type === 'day')?.value || '01'
  return `${y}-${m}-${d}`
}

/**
 * Format tampilan tanggal pendek (contoh: "21 Nov")
 */
function formatShortDate(date: Date): string {
  const bulan = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
  ]
  return `${date.getDate()} ${bulan[date.getMonth()]}`
}

/**
 * Format tampilan tanggal lengkap Indonesia (contoh: "21 November 2026")
 */
function formatFullDateIndo(date: Date): string {
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Hitung rentang tanggal awal dan akhir berdasarkan filter periode
 */
export function getPeriodDateRange(period: ReportPeriodType): {
  startDate: Date | null
  endDate: Date
  daysCount: number
  label: string
} {
  const now = new Date()
  const todayStr = getJakartaDateString(now)
  const todayDate = new Date(`${todayStr}T00:00:00+07:00`)
  const endOfDay = new Date(`${todayStr}T23:59:59.999+07:00`)

  switch (period) {
    case 'today':
      return {
        startDate: todayDate,
        endDate: endOfDay,
        daysCount: 1,
        label: 'Hari Ini',
      }
    case '7days': {
      const start = new Date(todayDate)
      start.setDate(start.getDate() - 6) // 7 hari termasuk hari ini
      return {
        startDate: start,
        endDate: endOfDay,
        daysCount: 7,
        label: 'Periode 7 hari',
      }
    }
    case '30days': {
      const start = new Date(todayDate)
      start.setDate(start.getDate() - 29) // 30 hari termasuk hari ini
      return {
        startDate: start,
        endDate: endOfDay,
        daysCount: 30,
        label: 'Periode 30 hari',
      }
    }
    case 'all':
    default:
      return {
        startDate: null,
        endDate: endOfDay,
        daysCount: 0,
        label: 'Semua Periode',
      }
  }
}

/**
 * Query data laporan penjualan dari Supabase PostgreSQL
 */
export async function getSalesReport(
  period: ReportPeriodType = '7days'
): Promise<SalesReportData> {
  const supabase = createClient()
  const { startDate, endDate, daysCount, label } = getPeriodDateRange(period)

  try {
    // 1. Query transaksi berstatus 'Selesai' dengan relasi detail & produk
    let query = supabase
      .from('transaksi')
      .select(`
        id_transaksi,
        no_struk,
        id_pelanggan,
        tanggal,
        subtotal,
        diskon,
        ppn,
        total_harga,
        metode_pembayaran,
        status_transaksi,
        uang_diterima,
        uang_kembalian,
        catatan,
        tipe_layanan,
        created_at,
        pelanggan:id_pelanggan (id_pelanggan, nama_pelanggan),
        detail_transaksi (
          id_detail,
          id_transaksi,
          id_produk,
          nama_produk_snapshot,
          jumlah,
          harga_satuan,
          harga_modal_satuan,
          subtotal,
          produk:id_produk (
            id_produk,
            nama_produk,
            harga_modal,
            foto_produk,
            id_kategori,
            kategori:id_kategori (nama_kategori)
          )
        )
      `)
      .eq('status_transaksi', 'Selesai')
      .order('tanggal', { ascending: true })

    if (startDate) {
      query = query.gte('tanggal', startDate.toISOString())
    }
    query = query.lte('tanggal', endDate.toISOString())

    const { data, error } = await query

    if (error) {
      console.warn('Gagal memuat data laporan dari Supabase:', error)
      return getEmptyReportData(period, label, daysCount, startDate, endDate)
    }

    interface RawDetailItem {
      id_detail: string
      id_transaksi: string
      id_produk: string
      nama_produk_snapshot?: string
      jumlah: number
      harga_satuan: number
      harga_modal_satuan?: number | null
      subtotal: number
      produk?: {
        id_produk: string
        nama_produk: string
        harga_modal?: number | null
        foto_produk?: string | null
        id_kategori?: string
        kategori?: { nama_kategori: string } | { nama_kategori: string }[] | null
      } | {
        id_produk: string
        nama_produk: string
        harga_modal?: number | null
        foto_produk?: string | null
        id_kategori?: string
        kategori?: { nama_kategori: string } | { nama_kategori: string }[] | null
      }[] | null
    }

    interface RawTrxRow {
      id_transaksi: string
      no_struk: string
      id_pelanggan?: string | null
      tanggal: string
      subtotal: number
      diskon: number
      ppn: number
      total_harga: number
      metode_pembayaran?: string
      status_transaksi: string
      uang_diterima: number
      uang_kembalian: number
      catatan?: string | null
      tipe_layanan?: string | null
      created_at?: string
      pelanggan?: { id_pelanggan: string; nama_pelanggan: string } | { id_pelanggan: string; nama_pelanggan: string }[] | null
      detail_transaksi?: RawDetailItem[]
    }

    const rawTransactions = (data || []) as unknown as RawTrxRow[]

    // 2. Normalisasi data transaksi
    const validTransactions: Transaksi[] = []
    let totalPendapatan = 0
    let totalProdukTerjual = 0
    let totalGrossRevenue = 0
    let totalHpp = 0
    let hasMissingHpp = false
    let hasAnyHpp = false

    // Map untuk agregasi produk terlaris
    const productSalesMap = new Map<
      string,
      {
        id_produk: string
        nama_produk: string
        nama_kategori: string
        foto_produk: string | null
        terjual: number
        pendapatan: number
      }
    >()

    // Map untuk metode pembayaran
    const paymentMap: Record<MetodePembayaran, { count: number; total: number }> = {
      Tunai: { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
      Transfer: { count: 0, total: 0 },
      Kartu: { count: 0, total: 0 },
    }

    // Map untuk grafik tren harian
    const dailyMap = new Map<string, { pendapatan: number; struk: number }>()

    for (const trx of rawTransactions) {
      // Pastikan transaksi benar-benar berstatus Selesai
      if (trx.status_transaksi !== 'Selesai') continue

      const finalTotal = Number(trx.total_harga) || 0
      totalPendapatan += finalTotal
      validTransactions.push(trx as Transaksi)

      // Metode pembayaran
      const m = (trx.metode_pembayaran || 'Tunai') as MetodePembayaran
      if (paymentMap[m]) {
        paymentMap[m].count += 1
        paymentMap[m].total += finalTotal
      } else {
        paymentMap['Tunai'].count += 1
        paymentMap['Tunai'].total += finalTotal
      }

      // Agregasi tren berdasarkan tanggal Asia/Jakarta
      const trxDate = new Date(trx.tanggal)
      const dateKey = getJakartaDateString(trxDate)
      const currDaily = dailyMap.get(dateKey) || { pendapatan: 0, struk: 0 }
      currDaily.pendapatan += finalTotal
      currDaily.struk += 1
      dailyMap.set(dateKey, currDaily)

      // Detail item
      const details = Array.isArray(trx.detail_transaksi) ? trx.detail_transaksi : []
      for (const d of details) {
        const qty = Number(d.jumlah) || 1
        const subtotal = Number(d.subtotal) || 0
        totalProdukTerjual += qty

        // Ambil produk dan kategori
        const prod = Array.isArray(d.produk) ? d.produk[0] : d.produk
        const cat = prod?.kategori
          ? Array.isArray(prod.kategori)
            ? prod.kategori[0]
            : prod.kategori
          : null

        const prodId = d.id_produk || prod?.id_produk || 'UNKNOWN'
        const prodName = d.nama_produk_snapshot || prod?.nama_produk || 'Produk Perkakas'
        const catName = cat?.nama_kategori || 'Perkakas'
        const photo = prod?.foto_produk || null

        // Agregasi produk terlaris
        const existingProd = productSalesMap.get(prodId) || {
          id_produk: prodId,
          nama_produk: prodName,
          nama_kategori: catName,
          foto_produk: photo,
          terjual: 0,
          pendapatan: 0,
        }
        existingProd.terjual += qty
        existingProd.pendapatan += subtotal
        productSalesMap.set(prodId, existingProd)

        // Perhitungan Estimasi Laba Kotor (HPP)
        // Utamakan harga_modal_satuan historis dari tabel detail_transaksi
        const historicalModal =
          d.harga_modal_satuan !== undefined && d.harga_modal_satuan !== null
            ? Number(d.harga_modal_satuan)
            : null

        if (historicalModal !== null) {
          hasAnyHpp = true
          totalGrossRevenue += subtotal
          totalHpp += historicalModal * qty
        } else if (prod?.harga_modal !== undefined && prod?.harga_modal !== null) {
          // Fallback ke modal produk saat ini jika historical belum ada
          totalGrossRevenue += subtotal
          totalHpp += Number(prod.harga_modal) * qty
          hasAnyHpp = true
        } else {
          hasMissingHpp = true
        }
      }
    }

    // 3. Bangun data tren harian lengkap (seluruh tanggal terisi, 0 jika kosong)
    const trendPoints: DailyTrendPoint[] = generateCompleteTrend(
      period,
      daysCount,
      startDate,
      endDate,
      dailyMap,
      validTransactions
    )

    // 4. Hitung KPI
    const transaksiBerhasil = validTransactions.length
    const rataRataPerStruk =
      transaksiBerhasil > 0 ? Math.round(totalPendapatan / transaksiBerhasil) : 0

    const labaKotor = Math.max(0, totalGrossRevenue - totalHpp)
    const marginKotorPersen =
      totalGrossRevenue > 0
        ? Math.round(((labaKotor / totalGrossRevenue) * 100) * 10) / 10
        : 0

    const kpi: SalesReportKPI = {
      total_pendapatan: totalPendapatan,
      estimasi_laba_kotor: labaKotor,
      margin_kotor_persen: marginKotorPersen,
      is_hpp_lengkap: hasAnyHpp && !hasMissingHpp,
      transaksi_berhasil: transaksiBerhasil,
      rata_rata_per_struk: rataRataPerStruk,
      total_produk_terjual: totalProdukTerjual,
    }

    // 5. Urutkan Produk Terlaris (Top 5)
    const topProducts: TopSellingProduct[] = Array.from(productSalesMap.values())
      .sort((a, b) => {
        if (b.terjual !== a.terjual) return b.terjual - a.terjual
        return b.pendapatan - a.pendapatan
      })
      .slice(0, 5)

    // 6. Distribusi Metode Pembayaran
    const paymentMethods: PaymentMethodDistribution[] = [
      {
        metode: 'Tunai',
        count: paymentMap['Tunai'].count,
        total_nominal: paymentMap['Tunai'].total,
        persentase:
          transaksiBerhasil > 0
            ? Math.round((paymentMap['Tunai'].count / transaksiBerhasil) * 100)
            : 0,
        color: '#603B26', // Cokelat kopi
      },
      {
        metode: 'QRIS',
        count: paymentMap['QRIS'].count,
        total_nominal: paymentMap['QRIS'].total,
        persentase:
          transaksiBerhasil > 0
            ? Math.round((paymentMap['QRIS'].count / transaksiBerhasil) * 100)
            : 0,
        color: '#15803D', // Hijau emerald
      },
      {
        metode: 'Transfer',
        count: paymentMap['Transfer'].count,
        total_nominal: paymentMap['Transfer'].total,
        persentase:
          transaksiBerhasil > 0
            ? Math.round((paymentMap['Transfer'].count / transaksiBerhasil) * 100)
            : 0,
        color: '#2563EB', // Biru
      },
      {
        metode: 'Kartu',
        count: paymentMap['Kartu'].count,
        total_nominal: paymentMap['Kartu'].total,
        persentase:
          transaksiBerhasil > 0
            ? Math.round((paymentMap['Kartu'].count / transaksiBerhasil) * 100)
            : 0,
        color: '#D97706', // Amber
      },
    ]

    return {
      period,
      periodLabel: label,
      kpi,
      trend: trendPoints,
      topProducts,
      paymentMethods,
      transactions: validTransactions,
    }
  } catch (err) {
    console.warn('Error in getSalesReport:', err)
    return getEmptyReportData(period, label, daysCount, startDate, endDate)
  }
}

/**
 * Bangun daftar tanggal lengkap tanpa ada hari yang bolong
 */
function generateCompleteTrend(
  period: ReportPeriodType,
  daysCount: number,
  startDate: Date | null,
  endDate: Date,
  dailyMap: Map<string, { pendapatan: number; struk: number }>,
  transactions: Transaksi[]
): DailyTrendPoint[] {
  const points: DailyTrendPoint[] = []

  if (period === 'all') {
    // Jika semua periode, buat rentang dari transaksi pertama atau 7 hari terakhir
    let earliest = new Date(endDate)
    earliest.setDate(earliest.getDate() - 6)

    if (transactions.length > 0) {
      const firstTrxDate = new Date(transactions[0].tanggal)
      if (firstTrxDate < earliest) {
        earliest = firstTrxDate
      }
    }

    const cur = new Date(earliest)
    while (cur <= endDate) {
      const dateKey = getJakartaDateString(cur)
      const data = dailyMap.get(dateKey) || { pendapatan: 0, struk: 0 }
      points.push({
        dateKey,
        displayDate: formatShortDate(cur),
        fullDateIndo: formatFullDateIndo(cur),
        pendapatan: data.pendapatan,
        jumlah_struk: data.struk,
      })
      cur.setDate(cur.getDate() + 1)
    }
    return points
  }

  if (period === 'today') {
    // Tampilkan data per jam atau rentang jam operasional
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
    const todayStr = getJakartaDateString(endDate)
    const todayData = dailyMap.get(todayStr) || { pendapatan: 0, struk: 0 }

    return hours.map((hour, idx) => ({
      dateKey: `${todayStr}-${hour}`,
      displayDate: hour,
      fullDateIndo: `${formatFullDateIndo(endDate)} ${hour}`,
      pendapatan: idx === hours.length - 1 ? todayData.pendapatan : 0,
      jumlah_struk: idx === hours.length - 1 ? todayData.struk : 0,
    }))
  }

  // Untuk '7days' atau '30days'
  const count = daysCount > 0 ? daysCount : 7
  const start = startDate ? new Date(startDate) : new Date(endDate)
  if (!startDate) {
    start.setDate(start.getDate() - (count - 1))
  }

  const cur = new Date(start)
  for (let i = 0; i < count; i++) {
    const dateKey = getJakartaDateString(cur)
    const data = dailyMap.get(dateKey) || { pendapatan: 0, struk: 0 }
    points.push({
      dateKey,
      displayDate: formatShortDate(cur),
      fullDateIndo: formatFullDateIndo(cur),
      pendapatan: data.pendapatan,
      jumlah_struk: data.struk,
    })
    cur.setDate(cur.getDate() + 1)
  }

  return points
}

/**
 * Fallback data kosong saat belum ada transaksi atau terjadi kesalahan
 */
function getEmptyReportData(
  period: ReportPeriodType,
  label: string,
  daysCount: number,
  startDate: Date | null,
  endDate: Date
): SalesReportData {
  const trend = generateCompleteTrend(
    period,
    daysCount || 7,
    startDate,
    endDate,
    new Map(),
    []
  )

  return {
    period,
    periodLabel: label,
    kpi: {
      total_pendapatan: 0,
      estimasi_laba_kotor: 0,
      margin_kotor_persen: 0,
      is_hpp_lengkap: true,
      transaksi_berhasil: 0,
      rata_rata_per_struk: 0,
      total_produk_terjual: 0,
    },
    trend,
    topProducts: [],
    paymentMethods: [
      { metode: 'Tunai', count: 0, total_nominal: 0, persentase: 0, color: '#603B26' },
      { metode: 'QRIS', count: 0, total_nominal: 0, persentase: 0, color: '#15803D' },
      { metode: 'Transfer', count: 0, total_nominal: 0, persentase: 0, color: '#2563EB' },
      { metode: 'Kartu', count: 0, total_nominal: 0, persentase: 0, color: '#D97706' },
    ],
    transactions: [],
  }
}

/**
 * Ekspor data laporan penjualan ke format file CSV
 */
export function exportSalesReportToCSV(
  reportData: SalesReportData
): void {
  const { transactions, periodLabel } = reportData

  const headers = [
    'No. Struk',
    'Tanggal & Waktu',
    'Nama Pelanggan',
    'Tipe Layanan',
    'Metode Pembayaran',
    'Subtotal',
    'Diskon',
    'PPN (11%)',
    'Total Pembayaran',
    'Status Transaksi',
  ]

  const rows = transactions.map((t) => [
    `"${t.no_struk}"`,
    `"${new Date(t.tanggal).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}"`,
    `"${t.nama_pelanggan || 'Pelanggan Umum'}"`,
    `"${t.tipe_layanan || 'Makan di Tempat'}"`,
    `"${t.metode_pembayaran || 'Tunai'}"`,
    t.subtotal || 0,
    t.diskon || 0,
    t.ppn || 0,
    t.total_harga || 0,
    `"${t.status_transaksi}"`,
  ])

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  const timestamp = new Date().toISOString().slice(0, 10)
  link.setAttribute(
    'download',
    `Laporan_Penjualan_KarsaKasir_${periodLabel.replace(/\s+/g, '_')}_${timestamp}.csv`
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
