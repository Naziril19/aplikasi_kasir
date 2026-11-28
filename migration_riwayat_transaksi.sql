-- ==============================================================================
-- MIGRATION: RIWAYAT TRANSAKSI & PEMBATALAN ATOMIK
-- Aplikasi: Karsa Kasir (Toko Perkakas)
-- ==============================================================================

-- 1. Penyesuaian Kolom Tabel Transaksi
ALTER TABLE public.transaksi 
ADD COLUMN IF NOT EXISTS tipe_layanan VARCHAR(30) DEFAULT 'Makan di Tempat';

ALTER TABLE public.transaksi 
ADD COLUMN IF NOT EXISTS alasan_pembatalan TEXT;

ALTER TABLE public.transaksi 
ADD COLUMN IF NOT EXISTS dibatalkan_pada TIMESTAMPTZ;

ALTER TABLE public.transaksi 
ADD COLUMN IF NOT EXISTS nama_kasir VARCHAR(100) DEFAULT 'Kasir Toko';

-- Sesuaikan constraint status_transaksi agar mendukung 'Selesai', 'Dibatalkan', dan 'Batal'
ALTER TABLE public.transaksi 
DROP CONSTRAINT IF EXISTS transaksi_status_transaksi_check;

ALTER TABLE public.transaksi 
ADD CONSTRAINT transaksi_status_transaksi_check 
CHECK (status_transaksi IN ('Selesai', 'Dibatalkan', 'Batal'));

-- 2. Penyesuaian Kolom Tabel Detail Transaksi (Snapshot Nama Produk)
ALTER TABLE public.detail_transaksi 
ADD COLUMN IF NOT EXISTS nama_produk_snapshot VARCHAR(150);

-- Isi snapshot nama produk untuk transaksi yang sudah ada sebelumnya
UPDATE public.detail_transaksi dt
SET nama_produk_snapshot = p.nama_produk
FROM public.produk p
WHERE dt.id_produk = p.id_produk AND dt.nama_produk_snapshot IS NULL;

-- 3. Stored Procedure Atomik Pembatalan Transaksi dengan Pemulihan Stok
CREATE OR REPLACE FUNCTION public.batalkan_transaksi(p_id_transaksi VARCHAR, p_alasan TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_current_stock INT;
    v_no_struk VARCHAR(50);
    v_status VARCHAR(20);
BEGIN
    -- Kunci baris transaksi agar tidak terjadi race condition / double cancel
    SELECT no_struk, status_transaksi INTO v_no_struk, v_status 
    FROM public.transaksi 
    WHERE id_transaksi = p_id_transaksi
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaksi % tidak ditemukan!', p_id_transaksi;
    END IF;

    IF v_status <> 'Selesai' THEN
        RAISE EXCEPTION 'Hanya transaksi berstatus Selesai yang dapat dibatalkan! Status saat ini: %', v_status;
    END IF;

    -- Kembalikan seluruh stok untuk setiap item barang dalam transaksi
    FOR v_item IN 
        SELECT id_produk, jumlah 
        FROM public.detail_transaksi 
        WHERE id_transaksi = p_id_transaksi
    LOOP
        SELECT stok INTO v_current_stock 
        FROM public.produk 
        WHERE id_produk = v_item.id_produk 
        FOR UPDATE;

        UPDATE public.produk
        SET stok = stok + v_item.jumlah
        WHERE id_produk = v_item.id_produk;

        -- Catat pergerakan stok pembatalan ke tabel audit log riwayat_stok
        INSERT INTO public.riwayat_stok (
            id_produk,
            perubahan_stok,
            stok_sebelum,
            stok_sesudah,
            tipe_perubahan,
            referensi,
            keterangan
        ) VALUES (
            v_item.id_produk,
            v_item.jumlah,
            v_current_stock,
            v_current_stock + v_item.jumlah,
            'Pembatalan',
            v_no_struk,
            'Pembatalan Transaksi No. Struk ' || v_no_struk || COALESCE(' - Alasan: ' || p_alasan, '')
        );
    END LOOP;

    -- Update status transaksi menjadi Dibatalkan
    UPDATE public.transaksi
    SET status_transaksi = 'Dibatalkan',
        alasan_pembatalan = p_alasan,
        dibatalkan_pada = now()
    WHERE id_transaksi = p_id_transaksi;

    RETURN jsonb_build_object(
        'success', true,
        'id_transaksi', p_id_transaksi,
        'status', 'Dibatalkan'
    );
END;
$$;
