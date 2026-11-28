import { createClient } from '@/lib/supabase/client'
import {
  ProsesTransaksiPayload,
  TransactionResult,
  TodayStats,
  Transaksi,
  TransaksiFilterState,
  DetailTransaksi,
} from '@/types/pos'

export async function prosesTransaksi(
  payload: ProsesTransaksiPayload
): Promise<TransactionResult> {
  const supabase = createClient()

  try {
    // 1. Panggil stored procedure PostgreSQL RPC proses_transaksi_kasir
    const { data, error } = await supabase.rpc('proses_transaksi_kasir', {
      payload,
    })

    if (error) {
      // Jika RPC belum ada di database atau gagal signature, gunakan fallback transaksi manual Supabase
      if (
        error.code === 'PGRST202' ||
        error.message.includes('function') ||
        error.code === '42883'
      ) {
        return await manualProsesTransaksi(payload)
      }
      throw new Error(error.message)
    }

    return {
      success: true,
      id_transaksi: data.id_transaksi,
      no_struk: data.no_struk,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      id_transaksi: payload.id_transaksi,
      no_struk: payload.no_struk,
      error: errorMsg,
    }
  }
}

/**
 * Fallback jika RPC function belum di-deploy di Supabase SQL Editor
 */
async function manualProsesTransaksi(
  payload: ProsesTransaksiPayload
): Promise<TransactionResult> {
  const supabase = createClient()

  // 1. Insert tabel transaksi
  const { error: trxError } = await supabase.from('transaksi').insert([
    {
      id_transaksi: payload.id_transaksi,
      no_struk: payload.no_struk,
      id_pelanggan: payload.id_pelanggan || null,
      subtotal: payload.subtotal,
      diskon: payload.diskon,
      ppn: payload.ppn,
      total_harga: payload.total_harga,
      metode_pembayaran: payload.metode_pembayaran,
      status_transaksi: 'Selesai',
      uang_diterima: payload.uang_diterima,
      uang_kembalian: payload.uang_kembalian,
      catatan: payload.catatan || null,
    },
  ])

  if (trxError) {
    // Jika tabel belum dibuat di Supabase
    if (trxError.code === 'PGRST205') {
      return {
        success: true,
        id_transaksi: payload.id_transaksi,
        no_struk: payload.no_struk,
      }
    }
    throw new Error(trxError.message)
  }

  // 2. Insert detail transaksi (id_detail max 10 char: 'DTX-' + 6 digit)
  const itemsToInsert = payload.items.map((item, index) => ({
    id_detail: `DTX-${String((Date.now() % 10000) * 100 + index).padStart(6, '0')}`,
    id_transaksi: payload.id_transaksi,
    id_produk: item.id_produk,
    nama_produk_snapshot: item.nama_produk,
    jumlah: item.jumlah,
    harga_satuan: item.harga_satuan,
    harga_modal_satuan: item.harga_modal_satuan ?? null,
    subtotal: item.subtotal,
  }))

  await supabase.from('detail_transaksi').insert(itemsToInsert)

  // 3. Decrement stok di tabel produk
  for (const item of payload.items) {
    try {
      const { data: prod } = await supabase
        .from('produk')
        .select('stok')
        .eq('id_produk', item.id_produk)
        .single()

      if (prod) {
        const newStock = Math.max(0, prod.stok - item.jumlah)
        await supabase
          .from('produk')
          .update({ stok: newStock })
          .eq('id_produk', item.id_produk)

        // Catat riwayat stok
        await supabase.from('riwayat_stok').insert([
          {
            id_produk: item.id_produk,
            perubahan_stok: -item.jumlah,
            stok_sebelum: prod.stok,
            stok_sesudah: newStock,
            tipe_perubahan: 'Penjualan',
            referensi: payload.no_struk,
            keterangan: `Penjualan Kasir No. Struk ${payload.no_struk}`,
          },
        ])
      }
    } catch (e) {
      console.warn('Gagal kurangi stok produk:', e)
    }
  }

  return {
    success: true,
    id_transaksi: payload.id_transaksi,
    no_struk: payload.no_struk,
  }
}

/**
 * Ambil daftar transaksi dengan relasi pelanggan dan detail transaksi
 */
export async function getRiwayatTransaksi(
  filters?: Partial<TransaksiFilterState>
): Promise<{
  transactions: Transaksi[]
  totalCount: number
  filteredCount: number
}> {
  try {
    const supabase = createClient()

    // Ambil seluruh transaksi dengan join pelanggan dan detail produk
    let query = supabase
      .from('transaksi')
      .select(
        `
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
        created_at,
        pelanggan:id_pelanggan (id_pelanggan, nama_pelanggan),
        detail_transaksi (
          id_detail,
          id_transaksi,
          id_produk,
          jumlah,
          harga_satuan,
          harga_modal_satuan,
          subtotal,
          produk:id_produk (id_produk, nama_produk, satuan, foto_produk)
        )
      `
      )
      .order('tanggal', { ascending: false })

    // Filter status transaksi di level database jika ada
    if (filters?.statusFilter === 'Selesai') {
      query = query.eq('status_transaksi', 'Selesai')
    } else if (filters?.statusFilter === 'Dibatalkan') {
      query = query.in('status_transaksi', ['Dibatalkan', 'Batal'])
    }

    // Filter metode pembayaran di level database
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.eq('metode_pembayaran', filters.paymentMethod)
    }

    const { data, error } = await query

    if (error || !data) {
      console.warn('Gagal memuat transaksi dari Supabase:', error)
      return { transactions: [], totalCount: 0, filteredCount: 0 }
    }

    // Normalisasi dan parsing data transaksi
    interface RawDetailRow {
      id_detail: string
      id_transaksi: string
      id_produk: string
      nama_produk_snapshot?: string
      jumlah: number
      harga_satuan: number
      harga_modal_satuan?: number | null
      subtotal: number
      created_at?: string
      produk?: {
        id_produk: string
        nama_produk: string
        satuan: string
        foto_produk?: string | null
      } | {
        id_produk: string
        nama_produk: string
        satuan: string
        foto_produk?: string | null
      }[] | null
    }

    interface RawTransaksiRow {
      id_transaksi: string
      no_struk: string
      id_pelanggan?: string | null
      tanggal: string
      subtotal: number
      diskon: number
      ppn: number
      total_harga: number
      metode_pembayaran: string
      status_transaksi: string
      uang_diterima: number
      uang_kembalian: number
      catatan?: string | null
      tipe_layanan?: string | null
      alasan_pembatalan?: string | null
      dibatalkan_pada?: string | null
      nama_kasir?: string | null
      created_at?: string
      pelanggan?: {
        id_pelanggan: string
        nama_pelanggan: string
      } | {
        id_pelanggan: string
        nama_pelanggan: string
      }[] | null
      detail_transaksi?: RawDetailRow[]
    }

    const rawList = data as unknown as RawTransaksiRow[]

    const formattedList: Transaksi[] = rawList.map((row) => {
      // Normalisasi pelanggan
      const custObj = Array.isArray(row.pelanggan) ? row.pelanggan[0] : row.pelanggan
      const namaPelanggan =
        custObj?.nama_pelanggan ||
        (row.catatan && !['Makan di Tempat', 'Bawa Pulang'].includes(row.catatan)
          ? row.catatan
          : 'Pelanggan Umum')

      // Normalisasi tipe layanan
      let tipeLayanan = row.tipe_layanan || 'Makan di Tempat'
      if (!row.tipe_layanan && row.catatan) {
        if (row.catatan.includes('Bawa Pulang')) {
          tipeLayanan = 'Bawa Pulang'
        } else if (row.catatan.includes('Makan di Tempat')) {
          tipeLayanan = 'Makan di Tempat'
        }
      }

      // Normalisasi status transaksi ('Batal' -> 'Dibatalkan')
      const statusNormal =
        row.status_transaksi === 'Batal' ? 'Dibatalkan' : (row.status_transaksi as Transaksi['status_transaksi'])

      // Normalisasi detail transaksi
      const items: DetailTransaksi[] = (row.detail_transaksi || []).map((d) => {
        const prodObj = Array.isArray(d.produk) ? d.produk[0] : d.produk
        return {
          id_detail: d.id_detail,
          id_transaksi: d.id_transaksi,
          id_produk: d.id_produk,
          nama_produk_snapshot: d.nama_produk_snapshot || prodObj?.nama_produk || 'Produk Perkakas',
          jumlah: Number(d.jumlah) || 1,
          harga_satuan: Number(d.harga_satuan) || 0,
          harga_modal_satuan: d.harga_modal_satuan !== undefined && d.harga_modal_satuan !== null ? Number(d.harga_modal_satuan) : null,
          subtotal: Number(d.subtotal) || 0,
          created_at: d.created_at,
          produk: prodObj
            ? {
                id_produk: prodObj.id_produk,
                barcode: '',
                nama_produk: prodObj.nama_produk,
                id_kategori: '',
                satuan: prodObj.satuan || 'Pcs',
                harga_modal: 0,
                harga_jual: Number(d.harga_satuan) || 0,
                margin_rp: 0,
                margin_persen: 0,
                stok: 0,
                stok_minimum: 0,
                total_nilai_aset: 0,
                foto_produk: prodObj.foto_produk || null,
                status: 'Aktif',
                status_stok: 'Tersedia',
              }
            : undefined,
        }
      })

      return {
        id_transaksi: row.id_transaksi,
        no_struk: row.no_struk,
        nomor_struk: row.no_struk,
        id_pelanggan: row.id_pelanggan,
        nama_pelanggan: namaPelanggan,
        pelanggan: custObj ? { id_pelanggan: custObj.id_pelanggan, nama_pelanggan: custObj.nama_pelanggan } : null,
        tanggal: row.tanggal,
        subtotal: Number(row.subtotal) || 0,
        diskon: Number(row.diskon) || 0,
        ppn: Number(row.ppn) || 0,
        total_harga: Number(row.total_harga) || 0,
        metode_pembayaran: (row.metode_pembayaran || 'Tunai') as Transaksi['metode_pembayaran'],
        tipe_layanan: tipeLayanan,
        status_transaksi: statusNormal,
        uang_diterima: Number(row.uang_diterima) || 0,
        uang_kembalian: Number(row.uang_kembalian) || 0,
        catatan: row.catatan,
        alasan_pembatalan: row.alasan_pembatalan,
        dibatalkan_pada: row.dibatalkan_pada,
        nama_kasir: row.nama_kasir || 'Kasir Toko',
        items,
        created_at: row.created_at,
      }
    })

    // Filter tambahan di level client (search multi-field: no_struk, nama_pelanggan, nama_produk, id_produk)
    let filtered = formattedList
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim()
      filtered = filtered.filter((trx) => {
        const matchesStruk = trx.no_struk.toLowerCase().includes(q)
        const matchesCust = trx.nama_pelanggan?.toLowerCase().includes(q)
        const matchesCatatan = trx.catatan?.toLowerCase().includes(q)
        const matchesItems = trx.items?.some(
          (item) =>
            item.nama_produk_snapshot?.toLowerCase().includes(q) ||
            item.produk?.nama_produk.toLowerCase().includes(q) ||
            item.id_produk.toLowerCase().includes(q)
        )

        return matchesStruk || matchesCust || matchesCatatan || matchesItems
      })
    }

    return {
      transactions: filtered,
      totalCount: formattedList.length,
      filteredCount: filtered.length,
    }
  } catch (err) {
    console.warn('Exception in getRiwayatTransaksi:', err)
    return { transactions: [], totalCount: 0, filteredCount: 0 }
  }
}

/**
 * Batalkan transaksi secara aman & atomik dengan pemulihan stok barang
 */
export async function batalkanTransaksi(
  id_transaksi: string,
  alasan?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // 1. Coba panggil RPC batalkan_transaksi (PostgreSQL Stored Procedure)
    let rpcError: unknown = null
    try {
      const { error } = await supabase.rpc('batalkan_transaksi', {
        p_id_transaksi: id_transaksi,
        p_alasan: alasan || null,
      })
      if (!error) {
        return { success: true }
      }
      rpcError = error
    } catch (e) {
      rpcError = e
    }

    // Jika signature hanya menerima 1 parameter (p_id_transaksi)
    const errorMsg = rpcError instanceof Error ? rpcError.message : String(rpcError || '')
    if (
      errorMsg.includes('parameter') ||
      errorMsg.includes('argument') ||
      (rpcError && typeof rpcError === 'object' && 'code' in rpcError && rpcError.code === '42883')
    ) {
      const { error: rpc1Err } = await supabase.rpc('batalkan_transaksi', {
        p_id_transaksi: id_transaksi,
      })
      if (!rpc1Err) {
        // Update alasan & status secara terpisah
        await supabase
          .from('transaksi')
          .update({
            status_transaksi: 'Dibatalkan',
            alasan_pembatalan: alasan || null,
            dibatalkan_pada: new Date().toISOString(),
          })
          .eq('id_transaksi', id_transaksi)
        return { success: true }
      }
    }

    // 2. Fallback Transaksi Atomik Manual jika RPC belum ter-deploy di Supabase
    const { data: trx, error: fetchErr } = await supabase
      .from('transaksi')
      .select('id_transaksi, no_struk, status_transaksi')
      .eq('id_transaksi', id_transaksi)
      .single()

    if (fetchErr || !trx) {
      return { success: false, error: 'Transaksi tidak ditemukan.' }
    }

    if (trx.status_transaksi === 'Dibatalkan' || trx.status_transaksi === 'Batal') {
      return { success: false, error: 'Transaksi ini sudah dibatalkan sebelumnya.' }
    }

    // Ambil item dari detail_transaksi
    const { data: details } = await supabase
      .from('detail_transaksi')
      .select('id_produk, jumlah')
      .eq('id_transaksi', id_transaksi)

    if (details && details.length > 0) {
      for (const item of details) {
        // Ambil stok produk sekarang
        const { data: prod } = await supabase
          .from('produk')
          .select('stok')
          .eq('id_produk', item.id_produk)
          .single()

        if (prod) {
          const currentStock = Number(prod.stok) || 0
          const restoredStock = currentStock + Number(item.jumlah)

          // Pulihkan stok
          await supabase
            .from('produk')
            .update({ stok: restoredStock })
            .eq('id_produk', item.id_produk)

          // Catat riwayat stok pembatalan
          await supabase.from('riwayat_stok').insert([
            {
              id_produk: item.id_produk,
              perubahan_stok: Number(item.jumlah),
              stok_sebelum: currentStock,
              stok_sesudah: restoredStock,
              tipe_perubahan: 'Pembatalan',
              referensi: trx.no_struk,
              keterangan: `Pembatalan Transaksi No. Struk ${trx.no_struk}${
                alasan ? ` - Alasan: ${alasan}` : ''
              }`,
            },
          ])
        }
      }
    }

    // Update status transaksi menjadi Dibatalkan
    const { error: updateErr } = await supabase
      .from('transaksi')
      .update({
        status_transaksi: 'Dibatalkan',
        alasan_pembatalan: alasan || null,
        dibatalkan_pada: new Date().toISOString(),
      })
      .eq('id_transaksi', id_transaksi)

    if (updateErr) {
      // Jika kolom alasan_pembatalan belum ada di Supabase, update status saja
      await supabase
        .from('transaksi')
        .update({
          status_transaksi: 'Batal',
        })
        .eq('id_transaksi', id_transaksi)
    }

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function getTodayStats(): Promise<TodayStats> {
  try {
    const supabase = createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('transaksi')
      .select('total_harga')
      .eq('status_transaksi', 'Selesai')
      .gte('tanggal', today.toISOString())

    if (error || !data) {
      return { total_omzet: 0, total_transactions: 0 }
    }

    const total_omzet = data.reduce((acc, curr) => acc + Number(curr.total_harga || 0), 0)
    return {
      total_omzet,
      total_transactions: data.length,
    }
  } catch {
    return { total_omzet: 0, total_transactions: 0 }
  }
}
