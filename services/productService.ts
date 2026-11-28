import { createClient } from '@/lib/supabase/client'
import { Produk, CreateProdukInput, UpdateProdukInput, ProductStats } from '@/types/pos'
import { INITIAL_PRODUK } from '@/lib/mockData'

/**
 * Mengambil daftar produk dari database Supabase (view v_produk atau tabel produk)
 */
export async function getProduk(): Promise<{ produk: Produk[]; isFallback: boolean }> {
  try {
    const supabase = createClient()

    // 1. Coba ambil dari database view v_produk terlebih dahulu
    const { data: viewData, error: viewError } = await supabase
      .from('v_produk')
      .select('*')
      .order('id_produk', { ascending: true })

    if (!viewError && viewData && viewData.length > 0) {
      return { produk: viewData as Produk[], isFallback: false }
    }

    // 2. Fallback query tabel produk langsung dengan join kategori
    const { data, error } = await supabase
      .from('produk')
      .select(`
        *,
        kategori:kategori(*)
      `)
      .order('id_produk', { ascending: true })

    if (error || !data || data.length === 0) {
      return { produk: INITIAL_PRODUK, isFallback: true }
    }

    const mappedProduk: Produk[] = data.map((item) => {
      const hModal = Number(item.harga_modal)
      const hJual = Number(item.harga_jual)
      const sQty = Number(item.stok)
      const sMin = Number(item.stok_minimum)

      let sKetersediaan: 'Habis' | 'Stok Menipis' | 'Tersedia' = 'Tersedia'
      if (sQty === 0) sKetersediaan = 'Habis'
      else if (sQty <= sMin) sKetersediaan = 'Stok Menipis'

      return {
        ...item,
        harga_modal: hModal,
        harga_jual: hJual,
        stok: sQty,
        stok_minimum: sMin,
        nama_kategori: item.kategori?.nama_kategori,
        margin_rp: hJual - hModal,
        margin_persen: hModal > 0 ? Math.round(((hJual - hModal) / hModal) * 100 * 100) / 100 : 0,
        total_nilai_aset: hModal * sQty,
        status_stok: sKetersediaan,
      }
    })

    return { produk: mappedProduk, isFallback: false }
  } catch (err) {
    console.warn('Menggunakan data produk awal perkakas:', err)
    return { produk: INITIAL_PRODUK, isFallback: true }
  }
}

/**
 * Menambahkan produk baru ke database Supabase
 */
export async function createProduk(input: CreateProdukInput): Promise<Produk> {
  const supabase = createClient()

  const payload = {
    id_produk: input.id_produk.trim(),
    barcode: input.barcode.trim(),
    nama_produk: input.nama_produk.trim(),
    id_kategori: input.id_kategori,
    satuan: input.satuan.trim(),
    harga_modal: Number(input.harga_modal),
    harga_jual: Number(input.harga_jual),
    stok: Number(input.stok),
    stok_minimum: Number(input.stok_minimum),
    foto_produk: input.foto_produk || `${input.id_produk}.jpg`,
    status: input.status,
  }

  const { data, error } = await supabase
    .from('produk')
    .insert([payload])
    .select(`
      *,
      kategori:kategori(*)
    `)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const hModal = Number(data.harga_modal)
  const hJual = Number(data.harga_jual)
  const sQty = Number(data.stok)
  const sMin = Number(data.stok_minimum)

  let sKetersediaan: 'Habis' | 'Stok Menipis' | 'Tersedia' = 'Tersedia'
  if (sQty === 0) sKetersediaan = 'Habis'
  else if (sQty <= sMin) sKetersediaan = 'Stok Menipis'

  return {
    ...data,
    nama_kategori: data.kategori?.nama_kategori,
    margin_rp: hJual - hModal,
    margin_persen: hModal > 0 ? Math.round(((hJual - hModal) / hModal) * 100 * 100) / 100 : 0,
    total_nilai_aset: hModal * sQty,
    status_stok: sKetersediaan,
  } as Produk
}

/**
 * Memperbarui data produk yang sudah ada di Supabase
 */
export async function updateProduk(
  id_produk: string,
  input: UpdateProdukInput
): Promise<Produk> {
  const supabase = createClient()

  const payload: Record<string, unknown> = {}
  if (input.nama_produk !== undefined) payload.nama_produk = input.nama_produk.trim()
  if (input.barcode !== undefined) payload.barcode = input.barcode.trim()
  if (input.id_kategori !== undefined) payload.id_kategori = input.id_kategori
  if (input.satuan !== undefined) payload.satuan = input.satuan.trim()
  if (input.harga_modal !== undefined) payload.harga_modal = Number(input.harga_modal)
  if (input.harga_jual !== undefined) payload.harga_jual = Number(input.harga_jual)
  if (input.stok !== undefined) payload.stok = Number(input.stok)
  if (input.stok_minimum !== undefined) payload.stok_minimum = Number(input.stok_minimum)
  if (input.foto_produk !== undefined) payload.foto_produk = input.foto_produk
  if (input.status !== undefined) payload.status = input.status

  const { data, error } = await supabase
    .from('produk')
    .update(payload)
    .eq('id_produk', id_produk)
    .select(`
      *,
      kategori:kategori(*)
    `)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const hModal = Number(data.harga_modal)
  const hJual = Number(data.harga_jual)
  const sQty = Number(data.stok)
  const sMin = Number(data.stok_minimum)

  let sKetersediaan: 'Habis' | 'Stok Menipis' | 'Tersedia' = 'Tersedia'
  if (sQty === 0) sKetersediaan = 'Habis'
  else if (sQty <= sMin) sKetersediaan = 'Stok Menipis'

  return {
    ...data,
    nama_kategori: data.kategori?.nama_kategori,
    margin_rp: hJual - hModal,
    margin_persen: hModal > 0 ? Math.round(((hJual - hModal) / hModal) * 100 * 100) / 100 : 0,
    total_nilai_aset: hModal * sQty,
    status_stok: sKetersediaan,
  } as Produk
}

/**
 * Menghapus produk atau mengubah status menjadi Nonaktif jika ada riwayat transaksi
 */
export async function deleteProduk(
  id_produk: string
): Promise<{ success: boolean; softDeleted: boolean; message: string }> {
  const supabase = createClient()

  // Cek apakah produk memiliki riwayat transaksi di detail_transaksi
  const { data: trxHistory } = await supabase
    .from('detail_transaksi')
    .select('id_detail')
    .eq('id_produk', id_produk)
    .limit(1)

  if (trxHistory && trxHistory.length > 0) {
    // Soft delete: ubah status menjadi Nonaktif
    const { error: updateError } = await supabase
      .from('produk')
      .update({ status: 'Nonaktif' })
      .eq('id_produk', id_produk)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return {
      success: true,
      softDeleted: true,
      message: 'Produk memiliki riwayat transaksi, status diubah menjadi Nonaktif.',
    }
  }

  // Jika belum ada transaksi, hapus secara permanen
  const { error: deleteError } = await supabase
    .from('produk')
    .delete()
    .eq('id_produk', id_produk)

  if (deleteError) {
    // Jika ada foreign key restriction lain, fallback ke Nonaktif
    const { error: fallbackError } = await supabase
      .from('produk')
      .update({ status: 'Nonaktif' })
      .eq('id_produk', id_produk)

    if (fallbackError) {
      throw new Error(deleteError.message)
    }

    return {
      success: true,
      softDeleted: true,
      message: 'Produk memiliki keterkaitan data, status dinonaktifkan.',
    }
  }

  return {
    success: true,
    softDeleted: false,
    message: 'Produk berhasil dihapus secara permanen.',
  }
}

/**
 * Penyesuaian stok cepat (+1 atau -1) dengan pencatatan audit trail
 */
export async function quickAdjustStok(
  id_produk: string,
  delta: number
): Promise<{ newStock: number; status_stok: 'Habis' | 'Stok Menipis' | 'Tersedia' }> {
  const supabase = createClient()

  // Ambil stok dan stok minimum saat ini
  const { data: current, error: fetchError } = await supabase
    .from('produk')
    .select('stok, stok_minimum')
    .eq('id_produk', id_produk)
    .single()

  if (fetchError || !current) {
    throw new Error('Produk tidak ditemukan.')
  }

  const currentStock = Number(current.stok)
  const minStock = Number(current.stok_minimum)
  const nextStock = Math.max(0, currentStock + delta)

  const { error: updateError } = await supabase
    .from('produk')
    .update({ stok: nextStock })
    .eq('id_produk', id_produk)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Catat riwayat pergerakan stok jika tabel riwayat_stok ada
  try {
    await supabase.from('riwayat_stok').insert([
      {
        id_produk,
        perubahan_stok: delta,
        stok_sebelum: currentStock,
        stok_sesudah: nextStock,
        tipe_perubahan: 'Penyesuaian',
        referensi: 'Quick Adjust POS',
        keterangan: `Penyesuaian stok manual (${delta > 0 ? `+${delta}` : delta}) via Manajemen Produk`,
      },
    ])
  } catch (logErr) {
    console.warn('Gagal mencatat log riwayat stok:', logErr)
  }

  let sKetersediaan: 'Habis' | 'Stok Menipis' | 'Tersedia' = 'Tersedia'
  if (nextStock === 0) sKetersediaan = 'Habis'
  else if (nextStock <= minStock) sKetersediaan = 'Stok Menipis'

  return { newStock: nextStock, status_stok: sKetersediaan }
}

/**
 * Menghitung ringkasan statistik persediaan barang dari array produk
 * Hanya menghitung produk yang berstatus 'Aktif'
 */
export function calculateProductStats(products: Produk[]): ProductStats {
  const activeProducts = products.filter((p) => p.status === 'Aktif')

  const total_produk = activeProducts.length
  const total_unit_stok = activeProducts.reduce((sum, p) => sum + (Number(p.stok) || 0), 0)
  const nilai_persediaan_hpp = activeProducts.reduce(
    (sum, p) => sum + (Number(p.harga_modal) || 0) * (Number(p.stok) || 0),
    0
  )
  const stok_menipis = activeProducts.filter(
    (p) => Number(p.stok) > 0 && Number(p.stok) <= Number(p.stok_minimum)
  ).length
  const stok_habis = activeProducts.filter((p) => Number(p.stok) === 0).length

  return {
    total_produk,
    total_unit_stok,
    nilai_persediaan_hpp,
    stok_menipis,
    stok_habis,
  }
}

/**
 * Mengunggah gambar ke storage bucket Supabase 'produk'
 */
export async function uploadProductImage(file: File, id_produk: string): Promise<string> {
  const supabase = createClient()

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    throw new Error('Format file harus berupa JPG, PNG, atau WEBP.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran foto produk maksimal 5MB.')
  }

  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${id_produk}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('produk')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Gagal mengunggah foto ke storage produk: ${uploadError.message}`)
  }

  return fileName
}
