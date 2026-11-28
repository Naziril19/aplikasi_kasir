-- ==============================================================================
-- TOKO PERKAKAS - DATABASE SETUP & MIGRATION (SUPABASE POSTGRESQL)
-- Disesuaikan dengan Rancangan Database & Dataset 60 Produk Barang
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL: kategori
CREATE TABLE IF NOT EXISTS public.kategori (
    id_kategori VARCHAR(10) PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABEL: produk
CREATE TABLE IF NOT EXISTS public.produk (
    id_produk VARCHAR(10) PRIMARY KEY, -- Kode Barang (contoh: BRG-0001)
    barcode VARCHAR(13) UNIQUE,         -- Barcode EAN-13 unik
    nama_produk VARCHAR(150) NOT NULL,
    id_kategori VARCHAR(10) NOT NULL REFERENCES public.kategori(id_kategori) ON UPDATE CASCADE,
    satuan VARCHAR(30) NOT NULL,        -- Pcs, Pouch, Bks, Kaleng, dll.
    harga_modal NUMERIC(12,2) NOT NULL CHECK (harga_modal >= 0),
    harga_jual NUMERIC(12,2) NOT NULL CHECK (harga_jual >= 0),
    stok INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
    stok_minimum INTEGER NOT NULL DEFAULT 0 CHECK (stok_minimum >= 0),
    foto_produk TEXT,                   -- Nama file (contoh: BRG-0001.jpg)
    status VARCHAR(20) NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    
    -- Generated Columns Otomatis (Sesuai Spesifikasi Dataset)
    margin_rp NUMERIC(12,2) GENERATED ALWAYS AS (harga_jual - harga_modal) STORED,
    margin_persen NUMERIC(8,2) GENERATED ALWAYS AS (
        CASE 
            WHEN harga_modal > 0 THEN ROUND(((harga_jual - harga_modal) / harga_modal) * 100, 2)
            ELSE 0 
        END
    ) STORED,
    total_nilai_aset NUMERIC(15,2) GENERATED ALWAYS AS (harga_modal * stok) STORED,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger auto-update timestamp updated_at pada tabel produk
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_produk_timestamp ON public.produk;
CREATE TRIGGER trg_update_produk_timestamp
BEFORE UPDATE ON public.produk
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VIEW: v_produk (Katalog lengkap dengan status stok dinamis)
CREATE OR REPLACE VIEW public.v_produk AS
SELECT 
    p.id_produk,
    p.barcode,
    p.nama_produk,
    p.id_kategori,
    k.nama_kategori,
    p.satuan,
    p.harga_modal,
    p.harga_jual,
    p.stok,
    p.stok_minimum,
    p.foto_produk,
    p.status,
    p.margin_rp,
    p.margin_persen,
    p.total_nilai_aset,
    CASE 
        WHEN p.stok = 0 THEN 'Habis'
        WHEN p.stok <= p.stok_minimum THEN 'Stok Menipis'
        ELSE 'Tersedia'
    END AS status_stok,
    p.created_at,
    p.updated_at
FROM public.produk p
LEFT JOIN public.kategori k ON p.id_kategori = k.id_kategori;

-- 4. TABEL: pemasok
CREATE TABLE IF NOT EXISTS public.pemasok (
    id_pemasok VARCHAR(10) PRIMARY KEY,
    nama_pemasok VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20),
    alamat TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABEL: pelanggan
CREATE TABLE IF NOT EXISTS public.pelanggan (
    id_pelanggan VARCHAR(10) PRIMARY KEY,
    nama_pelanggan VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20),
    alamat TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABEL: transaksi
CREATE TABLE IF NOT EXISTS public.transaksi (
    id_transaksi VARCHAR(10) PRIMARY KEY,
    no_struk VARCHAR(50) UNIQUE NOT NULL,
    id_pelanggan VARCHAR(10) REFERENCES public.pelanggan(id_pelanggan) ON DELETE SET NULL,
    tanggal TIMESTAMPTZ NOT NULL DEFAULT now(),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    diskon NUMERIC(12,2) DEFAULT 0 CHECK (diskon >= 0),
    ppn NUMERIC(12,2) DEFAULT 0 CHECK (ppn >= 0),
    total_harga NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_harga >= 0),
    metode_pembayaran VARCHAR(30) NOT NULL, -- Tunai, QRIS, Transfer, Kartu
    status_transaksi VARCHAR(20) NOT NULL DEFAULT 'Selesai' CHECK (status_transaksi IN ('Selesai', 'Dibatalkan', 'Batal')),
    uang_diterima NUMERIC(12,2) DEFAULT 0 CHECK (uang_diterima >= 0),
    uang_kembalian NUMERIC(12,2) DEFAULT 0 CHECK (uang_kembalian >= 0),
    tipe_layanan VARCHAR(30) DEFAULT 'Makan di Tempat',
    alasan_pembatalan TEXT,
    dibatalkan_pada TIMESTAMPTZ,
    nama_kasir VARCHAR(100) DEFAULT 'Kasir Toko',
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABEL: detail_transaksi
CREATE TABLE IF NOT EXISTS public.detail_transaksi (
    id_detail VARCHAR(10) PRIMARY KEY,
    id_transaksi VARCHAR(10) NOT NULL REFERENCES public.transaksi(id_transaksi) ON DELETE CASCADE,
    id_produk VARCHAR(10) NOT NULL REFERENCES public.produk(id_produk) ON UPDATE CASCADE,
    nama_produk_snapshot VARCHAR(150),
    jumlah INTEGER NOT NULL CHECK (jumlah > 0),
    harga_satuan NUMERIC(12,2) NOT NULL CHECK (harga_satuan >= 0),
    harga_modal_satuan NUMERIC(12,2) DEFAULT NULL,
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABEL: pembelian
CREATE TABLE IF NOT EXISTS public.pembelian (
    id_pembelian VARCHAR(10) PRIMARY KEY,
    no_faktur VARCHAR(50) UNIQUE,
    id_pemasok VARCHAR(10) NOT NULL REFERENCES public.pemasok(id_pemasok) ON UPDATE CASCADE,
    tanggal_pembelian TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_pembelian NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_pembelian >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Selesai' CHECK (status IN ('Selesai', 'Batal', 'Draft')),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TABEL PENDUKUNG: detail_pembelian
-- Kebutuhan: Mencatat item barang, volume, dan harga beli satuan saat pengadaan stok dari pemasok
CREATE TABLE IF NOT EXISTS public.detail_pembelian (
    id_detail_beli VARCHAR(10) PRIMARY KEY,
    id_pembelian VARCHAR(10) NOT NULL REFERENCES public.pembelian(id_pembelian) ON DELETE CASCADE,
    id_produk VARCHAR(10) NOT NULL REFERENCES public.produk(id_produk) ON UPDATE CASCADE,
    jumlah INTEGER NOT NULL CHECK (jumlah > 0),
    harga_beli NUMERIC(12,2) NOT NULL CHECK (harga_beli >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABEL PENDUKUNG: riwayat_stok (Audit trail keluar-masuk barang)
CREATE TABLE IF NOT EXISTS public.riwayat_stok (
    id_riwayat UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produk VARCHAR(10) NOT NULL REFERENCES public.produk(id_produk) ON UPDATE CASCADE ON DELETE CASCADE,
    perubahan_stok INTEGER NOT NULL,
    stok_sebelum INTEGER NOT NULL,
    stok_sesudah INTEGER NOT NULL,
    tipe_perubahan VARCHAR(50) NOT NULL, -- 'Penjualan', 'Pembelian', 'Pembatalan', 'Penyesuaian'
    referensi VARCHAR(50),               -- No Struk / No Faktur
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 11. ATOMIC STORED PROCEDURES (RPC)
-- ==============================================================================

-- A. Transaksi Kasir POS (Atomic stock decrement + row lock FOR UPDATE)
CREATE OR REPLACE FUNCTION public.proses_transaksi_kasir(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id_transaksi VARCHAR(10);
    v_no_struk VARCHAR(50);
    v_item JSONB;
    v_id_produk VARCHAR(10);
    v_qty INT;
    v_current_stock INT;
    v_min_stock INT;
    v_status VARCHAR(20);
    v_product_name TEXT;
    v_counter INT := 1;
    v_id_detail VARCHAR(10);
BEGIN
    v_id_transaksi := payload->>'id_transaksi';
    v_no_struk := payload->>'no_struk';

    -- 1. Validasi & Lock Baris Produk
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        v_id_produk := v_item->>'id_produk';
        v_qty := (v_item->>'jumlah')::INT;

        SELECT stok, stok_minimum, status, nama_produk 
        INTO v_current_stock, v_min_stock, v_status, v_product_name
        FROM public.produk
        WHERE id_produk = v_id_produk
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan kode % tidak ditemukan!', v_id_produk;
        END IF;

        IF v_status <> 'Aktif' THEN
            RAISE EXCEPTION 'Produk "%" sedang Nonaktif dan tidak dapat dijual!', v_product_name;
        END IF;

        IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Stok untuk "%" tidak mencukupi! Sisa %, diminta %', v_product_name, v_current_stock, v_qty;
        END IF;
    END LOOP;

    -- 2. Insert Transaksi Header
    INSERT INTO public.transaksi (
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
        catatan
    ) VALUES (
        v_id_transaksi,
        v_no_struk,
        payload->>'id_pelanggan',
        COALESCE((payload->>'tanggal')::TIMESTAMPTZ, now()),
        (payload->>'subtotal')::NUMERIC,
        COALESCE((payload->>'diskon')::NUMERIC, 0),
        COALESCE((payload->>'ppn')::NUMERIC, 0),
        (payload->>'total_harga')::NUMERIC,
        payload->>'metode_pembayaran',
        'Selesai',
        COALESCE((payload->>'uang_diterima')::NUMERIC, 0),
        COALESCE((payload->>'uang_kembalian')::NUMERIC, 0),
        payload->>'catatan'
    );

    -- 3. Insert Detail Transaksi & Kurangi Stok
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        v_id_produk := v_item->>'id_produk';
        v_qty := (v_item->>'jumlah')::INT;
        v_id_detail := 'DTX-' || LPAD((EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT % 10000000::BIGINT + v_counter, 6, '0');
        v_counter := v_counter + 1;

        SELECT stok INTO v_current_stock FROM public.produk WHERE id_produk = v_id_produk;

        INSERT INTO public.detail_transaksi (
            id_detail,
            id_transaksi,
            id_produk,
            jumlah,
            harga_satuan,
            subtotal
        ) VALUES (
            v_id_detail,
            v_id_transaksi,
            v_id_produk,
            v_qty,
            (v_item->>'harga_satuan')::NUMERIC,
            (v_item->>'subtotal')::NUMERIC
        );

        -- Update Stok
        UPDATE public.produk
        SET stok = stok - v_qty
        WHERE id_produk = v_id_produk;

        -- Catat Riwayat Stok
        INSERT INTO public.riwayat_stok (
            id_produk,
            perubahan_stok,
            stok_sebelum,
            stok_sesudah,
            tipe_perubahan,
            referensi,
            keterangan
        ) VALUES (
            v_id_produk,
            -v_qty,
            v_current_stock,
            v_current_stock - v_qty,
            'Penjualan',
            v_no_struk,
            'Penjualan Kasir No. Struk ' || v_no_struk
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'id_transaksi', v_id_transaksi,
        'no_struk', v_no_struk
    );
END;
$$;

-- B. Pembatalan Transaksi (Restore stok otomatis & audit trail)
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

    -- Kembalikan stok untuk setiap item
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

-- C. Pembelian Barang dari Pemasok (Penambahan stok otomatis)
CREATE OR REPLACE FUNCTION public.proses_pembelian_barang(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id_pembelian VARCHAR(10);
    v_no_faktur VARCHAR(50);
    v_item JSONB;
    v_id_produk VARCHAR(10);
    v_qty INT;
    v_harga_beli NUMERIC(12,2);
    v_current_stock INT;
    v_counter INT := 1;
    v_id_detail VARCHAR(10);
BEGIN
    v_id_pembelian := payload->>'id_pembelian';
    v_no_faktur := payload->>'no_faktur';

    -- 1. Insert Pembelian Header
    INSERT INTO public.pembelian (
        id_pembelian,
        no_faktur,
        id_pemasok,
        tanggal_pembelian,
        total_pembelian,
        status,
        catatan
    ) VALUES (
        v_id_pembelian,
        v_no_faktur,
        payload->>'id_pemasok',
        COALESCE((payload->>'tanggal_pembelian')::TIMESTAMPTZ, now()),
        (payload->>'total_pembelian')::NUMERIC,
        'Selesai',
        payload->>'catatan'
    );

    -- 2. Insert Detail Pembelian & Tambah Stok
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        v_id_produk := v_item->>'id_produk';
        v_qty := (v_item->>'jumlah')::INT;
        v_harga_beli := (v_item->>'harga_beli')::NUMERIC;
        v_id_detail := 'DBL-' || LPAD((EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT % 10000000::BIGINT + v_counter, 6, '0');
        v_counter := v_counter + 1;

        SELECT stok INTO v_current_stock FROM public.produk WHERE id_produk = v_id_produk FOR UPDATE;

        INSERT INTO public.detail_pembelian (
            id_detail_beli,
            id_pembelian,
            id_produk,
            jumlah,
            harga_beli,
            subtotal
        ) VALUES (
            v_id_detail,
            v_id_pembelian,
            v_id_produk,
            v_qty,
            v_harga_beli,
            (v_qty * v_harga_beli)
        );

        -- Tambah stok & update harga modal jika diisi
        UPDATE public.produk
        SET stok = stok + v_qty,
            harga_modal = v_harga_beli
        WHERE id_produk = v_id_produk;

        -- Catat Riwayat Stok
        INSERT INTO public.riwayat_stok (
            id_produk,
            perubahan_stok,
            stok_sebelum,
            stok_sesudah,
            tipe_perubahan,
            referensi,
            keterangan
        ) VALUES (
            v_id_produk,
            v_qty,
            v_current_stock,
            v_current_stock + v_qty,
            'Pembelian',
            v_no_faktur,
            'Pembelian Barang No. Faktur ' || COALESCE(v_no_faktur, '-')
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'id_pembelian', v_id_pembelian
    );
END;
$$;

-- ==============================================================================
-- 12. STORAGE BUCKET: produk
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'produk',
    'produk',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Read produk storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'produk');

CREATE POLICY "Public Upload produk storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produk');

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pemasok ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembelian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_pembelian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_stok ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses publik baca kategori" ON public.kategori FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola kategori" ON public.kategori FOR ALL USING (true);

CREATE POLICY "Akses publik baca produk" ON public.produk FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola produk" ON public.produk FOR ALL USING (true);

CREATE POLICY "Akses publik baca pemasok" ON public.pemasok FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola pemasok" ON public.pemasok FOR ALL USING (true);

CREATE POLICY "Akses publik baca pelanggan" ON public.pelanggan FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola pelanggan" ON public.pelanggan FOR ALL USING (true);

CREATE POLICY "Akses publik baca transaksi" ON public.transaksi FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola transaksi" ON public.transaksi FOR ALL USING (true);

CREATE POLICY "Akses publik baca detail_transaksi" ON public.detail_transaksi FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola detail_transaksi" ON public.detail_transaksi FOR ALL USING (true);

CREATE POLICY "Akses publik baca pembelian" ON public.pembelian FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola pembelian" ON public.pembelian FOR ALL USING (true);

CREATE POLICY "Akses publik baca detail_pembelian" ON public.detail_pembelian FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola detail_pembelian" ON public.detail_pembelian FOR ALL USING (true);

CREATE POLICY "Akses publik baca riwayat_stok" ON public.riwayat_stok FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola riwayat_stok" ON public.riwayat_stok FOR ALL USING (true);

-- ==============================================================================
-- 14. SEED DATA KATEGORI (UPSERT)
-- ==============================================================================
INSERT INTO public.kategori (id_kategori, nama_kategori) VALUES
    ('KAT-001', 'Peralatan Listrik'),
    ('KAT-002', 'Peralatan Tangan'),
    ('KAT-003', 'Perkakas Bangunan'),
    ('KAT-004', 'Baut dan Mur')
ON CONFLICT (id_kategori) DO UPDATE 
SET nama_kategori = EXCLUDED.nama_kategori;

-- Contoh Pemasok Awal
INSERT INTO public.pemasok (id_pemasok, nama_pemasok, no_telepon, alamat) VALUES
    ('PMS-001', 'PT Sumber Listrik Abadi', '021-5551234', 'Jakarta Pusat'),
    ('PMS-002', 'CV Perkakas Jaya Teknik', '021-5555678', 'Tangerang')
ON CONFLICT (id_pemasok) DO NOTHING;

-- Contoh Pelanggan Umum
INSERT INTO public.pelanggan (id_pelanggan, nama_pelanggan, no_telepon, alamat) VALUES
    ('PLG-001', 'Pelanggan Umum', '-', '-')
ON CONFLICT (id_pelanggan) DO NOTHING;

-- ==============================================================================
-- 15. SEED DATA 60 PRODUK (UPSERT BERDASARKAN DATASET RESMI)
-- Catatan: margin_rp, margin_persen, dan total_nilai_aset dihitung otomatis oleh PostgreSQL
-- ==============================================================================
INSERT INTO public.produk (
    id_produk, barcode, nama_produk, id_kategori, satuan, 
    harga_modal, harga_jual, stok, stok_minimum, foto_produk, status
) VALUES
('BRG-0001', '8992745120015', 'Lampu Phillip ungu (4 watt)', 'KAT-001', 'Pcs', 35000, 45000, 3, 1, 'BRG-0001.jpg', 'Aktif'),
('BRG-0002', '8992745120022', 'Lampu Phillip ungu (6 watt)', 'KAT-001', 'Pcs', 40000, 50000, 3, 1, 'BRG-0002.jpg', 'Aktif'),
('BRG-0003', '8992745120039', 'Lampu Phillip ungu (8 watt)', 'KAT-001', 'Pcs', 43000, 55000, 3, 1, 'BRG-0003.jpg', 'Aktif'),
('BRG-0004', '8993175110014', 'Lampu Phillip ungu (10 watt)', 'KAT-001', 'Pcs', 48000, 60000, 3, 1, 'BRG-0004.jpg', 'Aktif'),
('BRG-0005', '8998866100018', 'Lampu Phillip ungu (12 watt)', 'KAT-001', 'Pcs', 53000, 67000, 3, 1, 'BRG-0005.jpg', 'Aktif'),
('BRG-0006', '8998866100025', 'Lampu Phillip ungu (19 watt)', 'KAT-001', 'Pcs', 88000, 110000, 3, 1, 'BRG-0006.jpg', 'Aktif'),
('BRG-0007', '8992772000114', 'Lampu Phillip ungu (18 watt)', 'KAT-001', 'Pcs', 86000, 106000, 3, 1, 'BRG-0007.jpg', 'Aktif'),
('BRG-0008', '8991001100052', 'Lampu Phillip ungu (22 watt) capsul', 'KAT-001', 'Pcs', 86000, 106000, 3, 1, 'BRG-0008.jpg', 'Aktif'),
('BRG-0009', '8998866200114', 'Lampu Phillip ungu (30 watt) capsul', 'KAT-001', 'Pcs', 88000, 110000, 3, 1, 'BRG-0009.jpg', 'Aktif'),
('BRG-0010', '8998866200121', 'Lampu Phillip hijau (7 watt)', 'KAT-001', 'Pcs', 35000, 45000, 3, 1, 'BRG-0001.jpg', 'Aktif'),
('BRG-0011', '8998866200138', 'Lampu Phillip hijau (9 watt)', 'KAT-001', 'Pcs', 40000, 50000, 3, 1, 'BRG-0002.jpg', 'Aktif'),
('BRG-0012', '8992388110012', 'Lampu Phillip hijau (11 watt)', 'KAT-001', 'Pcs', 43000, 55000, 3, 1, 'BRG-0003.jpg', 'Aktif'),
('BRG-0013', '8992388110029', 'Lampu Phillip hijau (15 watt)', 'KAT-001', 'Pcs', 53000, 67000, 3, 1, 'BRG-0004.jpg', 'Aktif'),
('BRG-0014', '8991002101010', 'Lampu Phillip hijau (13 watt)', 'KAT-001', 'Pcs', 51000, 65000, 3, 1, 'BRG-0005.jpg', 'Aktif'),
('BRG-0015', '8996001301015', 'Lampu Luby Sumo (12 watt)', 'KAT-001', 'Pcs', 15000, 22000, 3, 1, 'BRG-0006.jpg', 'Aktif'),
('BRG-0016', '8991002102024', 'Lampu Luby Sumo (16 watt)', 'KAT-001', 'Pcs', 19000, 25000, 3, 1, 'BRG-0007.jpg', 'Aktif'),
('BRG-0017', '8992775101016', 'Lampu Luby Sumo (22 watt)', 'KAT-001', 'Pcs', 24000, 35000, 3, 1, 'BRG-0008.jpg', 'Aktif'),
('BRG-0018', '8992775102020', 'Lampu Luby Sumo (30 watt)', 'KAT-001', 'Pcs', 34000, 50000, 3, 1, 'BRG-0009.jpg', 'Aktif'),
('BRG-0019', '8992771001013', 'Lampu Luby Sumo (40 watt)', 'KAT-001', 'Pcs', 47000, 65000, 3, 1, 'BRG-0019.jpg', 'Aktif'),
('BRG-0020', '8992771001020', 'Lampu Aoki Saphire (5 watt)', 'KAT-001', 'Pcs', 7000, 12000, 3, 1, 'BRG-0020.jpg', 'Aktif'),
('BRG-0021', '8996001410014', 'Lampu Aoki Saphire (7 watt)', 'KAT-001', 'Pcs', 10000, 15000, 3, 1, 'BRG-0021.jpg', 'Aktif'),
('BRG-0022', '8992753101013', 'Lampu Aoki Saphire (9 watt)', 'KAT-001', 'Pcs', 11000, 17000, 3, 1, 'BRG-0022.jpg', 'Aktif'),
('BRG-0023', '8992753102027', 'Lampu Aoki Saphire (12 watt)', 'KAT-001', 'Pcs', 12500, 20000, 3, 1, 'BRG-0023.jpg', 'Aktif'),
('BRG-0024', '8992741981014', 'Lampu Aoki Saphire (15 watt)', 'KAT-001', 'Pcs', 14500, 25000, 3, 1, 'BRG-0024.jpg', 'Aktif'),
('BRG-0025', '8992741981021', 'Lampu Aoki Saphire (18 watt)', 'KAT-001', 'Pcs', 18000, 28000, 3, 1, 'BRG-0025.jpg', 'Aktif'),
('BRG-0026', '8992787110013', 'Lampu Panaled (10 watt)', 'KAT-001', 'Pcs', 3700, 8000, 3, 1, 'BRG-0026.jpg', 'Aktif'),
('BRG-0027', '8991001410106', 'Lampu Panaled (15 watt)', 'KAT-001', 'Pcs', 4400, 12000, 3, 1, 'BRG-0027.jpg', 'Aktif'),
('BRG-0028', '8992753103031', 'Lampu Panaled (20 watt)', 'KAT-001', 'Pcs', 5400, 15000, 3, 1, 'BRG-0028.jpg', 'Aktif'),
('BRG-0029', '8998866300012', 'Lampu Cyoda Super', 'KAT-001', 'Pcs', 6500, 9000, 3, 1, 'BRG-0029.jpg', 'Aktif'),
('BRG-0030', '8992753201010', 'Saklar Broko Satu Tanam', 'KAT-001', 'Pcs', 13200, 18000, 3, 1, 'BRG-0030.jpg', 'Aktif'),
('BRG-0031', '8992753202024', 'Saklar Broko Dua Tanam', 'KAT-001', 'Pcs', 15000, 20000, 3, 1, 'BRG-0031.jpg', 'Aktif'),
('BRG-0032', '8992743110018', 'Stop Kontak', 'KAT-001', 'Pcs', 14000, 18000, 3, 1, 'BRG-0032.jpg', 'Aktif'),
('BRG-0033', '8992761100015', 'Steker Bulat Broco', 'KAT-001', 'Pcs', 11000, 14000, 3, 1, 'BRG-0033.jpg', 'Aktif'),
('BRG-0034', '8992745300011', 'T arde Broco', 'KAT-001', 'Pcs', 23000, 28000, 3, 1, 'BRG-0034.jpg', 'Aktif'),
('BRG-0035', '8992753203038', 'Staker Gepeng Broco Hitam', 'KAT-001', 'Pcs', 3200, 5000, 3, 1, 'BRG-0035.jpg', 'Aktif'),
('BRG-0036', '8991002201017', 'Minyak Zippo', 'KAT-002', 'Pouch', 31500, 40000, 3, 1, 'BRG-0036.jpg', 'Aktif'),
('BRG-0037', '8991002202021', 'Robinson', 'KAT-002', 'Pouch', 21000, 32000, 3, 1, 'BRG-0037.jpg', 'Aktif'),
('BRG-0038', '8992388201018', 'Batu Zippo', 'KAT-002', 'Bks', 10000, 20000, 3, 1, 'BRG-0038.jpg', 'Aktif'),
('BRG-0039', '8992770101011', 'Sumbu Zippo', 'KAT-002', 'Pcs', 10000, 15000, 3, 1, 'BRG-0039.jpg', 'Aktif'),
('BRG-0040', '8991002203035', 'Gas Portabel', 'KAT-002', 'Pouch', 15000, 20000, 3, 1, 'BRG-0040.jpg', 'Aktif'),
('BRG-0041', '8991002204049', 'Kompor Portabel', 'KAT-001', 'Kaleng', 90000, 110000, 3, 1, 'BRG-0041.jpg', 'Aktif'),
('BRG-0042', '8992770201018', 'Anti Karat XD', 'KAT-003', 'Bks', 28000, 35000, 3, 1, 'BRG-0042.jpg', 'Aktif'),
('BRG-0043', '8991002301014', 'Pelumas Rantai', 'KAT-002', 'Pouch', 22500, 30000, 3, 1, 'BRG-0043.jpg', 'Aktif'),
('BRG-0044', '8991002302028', 'Vacoom Cleaner', 'KAT-001', 'Kotak', 23500, 35000, 3, 1, 'BRG-0044.jpg', 'Aktif'),
('BRG-0045', '8991002303032', 'Gembok 30 Pendek', 'KAT-004', 'Btl', 6000, 13000, 3, 1, 'BRG-0045.jpg', 'Aktif'),
('BRG-0046', '8992770301015', 'Gembok 30 Panjang', 'KAT-004', 'Btl', 6500, 14000, 3, 1, 'BRG-0046.jpg', 'Aktif'),
('BRG-0047', '8991002304046', 'Gembok 40 Pendek', 'KAT-004', 'Btl', 8000, 15000, 3, 1, 'BRG-0047.jpg', 'Aktif'),
('BRG-0048', '8992770401012', 'Gembok 40 Panjang', 'KAT-004', 'Pack', 8500, 17000, 3, 1, 'BRG-0048.jpg', 'Aktif'),
('BRG-0049', '8992770501019', 'Gembok 50 Pendek', 'KAT-004', 'Pack', 10000, 20000, 3, 1, 'BRG-0049.jpg', 'Aktif'),
('BRG-0050', '8993175301016', 'Gembok 50 Panjang', 'KAT-004', 'Tube', 12000, 25000, 3, 1, 'BRG-0050.jpg', 'Aktif'),
('BRG-0051', '8992787201018', 'Gergazi Besi Sunflex', 'KAT-003', 'Box', 12500, 15000, 3, 1, 'BRG-0051.jpg', 'Aktif'),
('BRG-0052', '8992745401015', 'Nodrop', 'KAT-003', 'Btl', 65000, 70000, 3, 1, 'BRG-0052.jpg', 'Aktif'),
('BRG-0053', '8992755101011', 'Petakan Hamplas tempel', 'KAT-003', 'Strip', 4000, 10000, 3, 1, 'BRG-0053.jpg', 'Aktif'),
('BRG-0054', '8992787301015', 'Tusla Kuningan', 'KAT-003', 'Strip', 30000, 38000, 3, 1, 'BRG-0054.jpg', 'Aktif'),
('BRG-0055', '8992787401012', 'Pilox', 'KAT-003', 'Btl', 24000, 30000, 3, 1, 'BRG-0055.jpg', 'Aktif'),
('BRG-0056', '8992787501019', 'Kunci Silinder Besar', 'KAT-004', 'Kotak', 27500, 40000, 3, 1, 'BRG-0056.jpg', 'Aktif'),
('BRG-0057', '8992791101014', 'Role Cat Gagang Kecil', 'KAT-003', 'Lusin', 10000, 12000, 3, 1, 'BRG-0057.jpg', 'Aktif'),
('BRG-0058', '8992791201011', 'Meteran 3m', 'KAT-003', 'Pack', 8000, 15000, 3, 1, 'BRG-0058.jpg', 'Aktif'),
('BRG-0059', '8992791301018', 'Meteran 5m', 'KAT-003', 'Pcs', 8500, 20000, 3, 1, 'BRG-0059.jpg', 'Aktif'),
('BRG-0060', '8992791401015', 'Meteran 7,5m transparan', 'KAT-003', 'Rim', 16500, 35000, 3, 1, 'BRG-0060.jpg', 'Aktif')
ON CONFLICT (id_produk) DO UPDATE SET
    barcode = EXCLUDED.barcode,
    nama_produk = EXCLUDED.nama_produk,
    id_kategori = EXCLUDED.id_kategori,
    satuan = EXCLUDED.satuan,
    harga_modal = EXCLUDED.harga_modal,
    harga_jual = EXCLUDED.harga_jual,
    stok = EXCLUDED.stok,
    stok_minimum = EXCLUDED.stok_minimum,
    foto_produk = EXCLUDED.foto_produk,
    status = EXCLUDED.status;
