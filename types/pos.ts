export interface Kategori {
  id_kategori: string
  nama_kategori: string
  created_at?: string
}

export type StatusProduk = 'Aktif' | 'Nonaktif'
export type StatusKetersediaan = 'Habis' | 'Stok Menipis' | 'Tersedia'

export interface Produk {
  id_produk: string // Kode Barang, contoh: BRG-0001
  barcode: string // EAN-13, unik
  nama_produk: string
  id_kategori: string
  kategori?: Kategori | null
  nama_kategori?: string
  satuan: string // Pcs, Pouch, Bks, Kaleng, dll.
  harga_modal: number
  harga_jual: number
  stok: number
  stok_minimum: number
  foto_produk: string | null
  status: StatusProduk
  margin_rp?: number
  margin_persen?: number
  total_nilai_aset?: number
  status_stok?: StatusKetersediaan
  created_at?: string
  updated_at?: string
}

export interface ProductStats {
  total_produk: number
  total_unit_stok: number
  nilai_persediaan_hpp: number
  stok_menipis: number
  stok_habis: number
}

export interface Pemasok {
  id_pemasok: string
  nama_pemasok: string
  no_telepon?: string
  alamat?: string
  created_at?: string
}

export interface Pelanggan {
  id_pelanggan: string
  nama_pelanggan: string
  no_telepon?: string
  alamat?: string
  created_at?: string
}

export interface CartItem {
  produk: Produk
  jumlah: number
  subtotal: number
}

export type MetodePembayaran = 'Tunai' | 'QRIS' | 'Transfer' | 'Kartu'
export type StatusTransaksi = 'Selesai' | 'Dibatalkan' | 'Batal'
export type TipeLayanan = 'Makan di Tempat' | 'Bawa Pulang'

export interface Transaksi {
  id_transaksi: string
  no_struk: string
  nomor_struk?: string // Alias format
  id_pelanggan?: string | null
  nama_pelanggan?: string
  pelanggan?: Pelanggan | null
  tanggal: string
  subtotal: number
  diskon: number
  ppn: number
  total_harga: number
  metode_pembayaran: MetodePembayaran
  tipe_layanan?: TipeLayanan | string
  status_transaksi: StatusTransaksi
  uang_diterima: number
  uang_kembalian: number
  catatan?: string | null
  alasan_pembatalan?: string | null
  dibatalkan_pada?: string | null
  nama_kasir?: string | null
  items?: DetailTransaksi[]
  created_at?: string
}

export interface DetailTransaksi {
  id_detail: string
  id_transaksi: string
  id_produk: string
  nama_produk_snapshot?: string
  produk?: Produk
  jumlah: number
  harga_satuan: number
  harga_modal_satuan?: number | null
  subtotal: number
  created_at?: string
}

export interface TransaksiFilterState {
  searchQuery: string
  paymentMethod: string
  statusFilter: 'all' | 'Selesai' | 'Dibatalkan'
  page: number
  pageSize: number
}

export interface RiwayatResult {
  transactions: Transaksi[]
  totalCount: number
  isFallback?: boolean
}

export interface CreateProdukInput {
  id_produk: string // Kode Barang
  barcode: string
  nama_produk: string
  id_kategori: string
  satuan: string
  harga_modal: number
  harga_jual: number
  stok: number
  stok_minimum: number
  foto_produk?: string | null
  status: StatusProduk
}

export interface UpdateProdukInput {
  barcode?: string
  nama_produk?: string
  id_kategori?: string
  satuan?: string
  harga_modal?: number
  harga_jual?: number
  stok?: number
  stok_minimum?: number
  foto_produk?: string | null
  status?: StatusProduk
}

export interface ItemTransaksiPayload {
  id_produk: string
  nama_produk: string
  harga_satuan: number
  harga_modal_satuan?: number
  jumlah: number
  subtotal: number
}

export interface ProsesTransaksiPayload {
  id_transaksi: string
  no_struk: string
  id_pelanggan?: string
  subtotal: number
  diskon: number
  ppn: number
  total_harga: number
  metode_pembayaran: MetodePembayaran
  uang_diterima: number
  uang_kembalian: number
  catatan?: string
  items: ItemTransaksiPayload[]
}

export interface TransactionResult {
  success: boolean
  id_transaksi: string
  no_struk: string
  error?: string
}

export interface TodayStats {
  total_omzet: number
  total_transactions: number
}

// ============================================================================
// SALES REPORT (LAPORAN PENJUALAN) TYPES
// ============================================================================

export type ReportPeriodType = 'today' | '7days' | '30days' | 'all'

export interface SalesReportKPI {
  total_pendapatan: number
  estimasi_laba_kotor: number
  margin_kotor_persen: number
  is_hpp_lengkap: boolean
  transaksi_berhasil: number
  rata_rata_per_struk: number
  total_produk_terjual: number
}

export interface DailyTrendPoint {
  dateKey: string // YYYY-MM-DD
  displayDate: string // e.g. "21 Nov"
  fullDateIndo: string // e.g. "21 November 2026"
  pendapatan: number
  jumlah_struk: number
}

export interface TopSellingProduct {
  id_produk: string
  nama_produk: string
  nama_kategori: string
  foto_produk: string | null
  terjual: number
  pendapatan: number
}

export interface PaymentMethodDistribution {
  metode: MetodePembayaran
  count: number
  total_nominal: number
  persentase: number
  color: string
}

export interface SalesReportData {
  period: ReportPeriodType
  periodLabel: string
  kpi: SalesReportKPI
  trend: DailyTrendPoint[]
  topProducts: TopSellingProduct[]
  paymentMethods: PaymentMethodDistribution[]
  transactions: Transaksi[]
}

