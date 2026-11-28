-- ==============================================================================
-- MIGRATION: LAPORAN PENJUALAN & HISTORIS HPP (HARGA MODAL SATUAN)
-- Aplikasi: Karsa Kasir (Toko Perkakas)
-- ==============================================================================

-- 1. Tambahkan kolom harga_modal_satuan pada tabel detail_transaksi jika belum ada
ALTER TABLE public.detail_transaksi 
ADD COLUMN IF NOT EXISTS harga_modal_satuan NUMERIC(12,2) DEFAULT NULL;

-- 2. Isi data harga_modal_satuan historis dari harga modal produk saat ini untuk transaksi lama
UPDATE public.detail_transaksi dt
SET harga_modal_satuan = p.harga_modal
FROM public.produk p
WHERE dt.id_produk = p.id_produk AND dt.harga_modal_satuan IS NULL;

-- 3. Pastikan kolom nama_produk_snapshot juga terisi jika sebelumnya belum terisi
UPDATE public.detail_transaksi dt
SET nama_produk_snapshot = p.nama_produk
FROM public.produk p
WHERE dt.id_produk = p.id_produk AND dt.nama_produk_snapshot IS NULL;

-- 4. Indeks performa untuk pelaporan penjualan berdasarkan tanggal dan status transaksi
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal_status 
ON public.transaksi (tanggal, status_transaksi);

CREATE INDEX IF NOT EXISTS idx_detail_transaksi_id_transaksi 
ON public.detail_transaksi (id_transaksi);

CREATE INDEX IF NOT EXISTS idx_detail_transaksi_id_produk 
ON public.detail_transaksi (id_produk);
