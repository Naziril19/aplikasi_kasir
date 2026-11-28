'use client'

import React from 'react'
import { Printer, X, AlertTriangle } from 'lucide-react'
import { Transaksi } from '@/types/pos'
import { formatRupiah } from '@/lib/utils'

interface TransactionReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaksi | null
}

export function TransactionReceiptModal({
  isOpen,
  onClose,
  transaction,
}: TransactionReceiptModalProps) {
  if (!isOpen || !transaction) return null

  const isCancelled =
    transaction.status_transaksi === 'Dibatalkan' || transaction.status_transaksi === 'Batal'

  const handlePrint = () => {
    window.print()
  }

  // Format Date & Time for Receipt
  const formatReceiptDate = (dateString: string) => {
    try {
      const d = new Date(dateString)
      const day = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const time = d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }).replace(':', '.')
      return `${day}, ${time}`
    } catch {
      return dateString
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="px-5 py-3.5 bg-[#FAF7F2] border-b border-stone-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-stone-900">Detail Struk Transaksi</h3>
            {isCancelled && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                Dibatalkan
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Struk Paper Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100/60 print:p-0 print:bg-white flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-sm bg-white p-6 rounded-xl shadow-xs border border-stone-200 print:border-none print:shadow-none print:p-2 text-stone-800 font-mono text-xs space-y-4"
          >
            {/* Watermark / Warning jika Transaksi Dibatalkan */}
            {isCancelled && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded-lg text-center font-sans space-y-1">
                <div className="flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>TRANSAKSI DIBATALKAN</span>
                </div>
                {transaction.dibatalkan_pada && (
                  <p className="text-[10px] text-rose-600">
                    Pada: {formatReceiptDate(transaction.dibatalkan_pada)}
                  </p>
                )}
                {transaction.alasan_pembatalan && (
                  <p className="text-[10px] text-rose-700 font-medium italic">
                    &quot;{transaction.alasan_pembatalan}&quot;
                  </p>
                )}
              </div>
            )}

            {/* A. Header Struk */}
            <div className="text-center space-y-1 border-b border-dashed border-stone-300 pb-3">
              <h4 className="font-bold text-base tracking-wider text-stone-900 font-sans">
                KARSA KASIR
              </h4>
              <p className="text-[11px] text-stone-600 font-sans font-semibold">
                Toko Perkakas &amp; Bangunan
              </p>
              <p className="text-[10px] text-stone-500">Jl. Raya Teknik Utama No. 42</p>
              <p className="text-[10px] text-stone-500">Telp: (021) 555-8921</p>
              <div className="pt-1.5 text-[11px] font-bold text-stone-800 tracking-widest font-sans uppercase">
                STRUK PEMBAYARAN
              </div>
            </div>

            {/* B. Informasi Transaksi */}
            <div className="space-y-1 text-[11px] text-stone-600 border-b border-dashed border-stone-300 pb-3">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold text-stone-900">{transaction.no_struk}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatReceiptDate(transaction.tanggal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.nama_kasir || 'Kasir Toko'}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-semibold text-stone-900">
                  {transaction.nama_pelanggan || 'Pelanggan Umum'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tipe Layanan:</span>
                <span>{transaction.tipe_layanan || 'Makan di Tempat'}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="font-medium text-stone-800">{transaction.metode_pembayaran}</span>
              </div>
            </div>

            {/* C. Detail Barang */}
            <div className="space-y-2.5 border-b border-dashed border-stone-300 pb-3">
              {(transaction.items || []).map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold text-stone-900">
                    <span className="truncate max-w-[210px]">
                      {item.nama_produk_snapshot || item.produk?.nama_produk || 'Produk Perkakas'}
                    </span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>
                      {item.jumlah} x {formatRupiah(item.harga_satuan)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* D. Ringkasan Pembayaran */}
            <div className="space-y-1.5 text-[11px] text-stone-700 border-b border-dashed border-stone-300 pb-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>

              {transaction.diskon > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Diskon</span>
                  <span>- {formatRupiah(transaction.diskon)}</span>
                </div>
              )}

              {transaction.ppn > 0 && (
                <div className="flex justify-between">
                  <span>PPN (11%)</span>
                  <span>{formatRupiah(transaction.ppn)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-sm text-stone-950 pt-1 border-t border-stone-200">
                <span>Total Pembayaran</span>
                <span>{formatRupiah(transaction.total_harga)}</span>
              </div>

              {transaction.metode_pembayaran === 'Tunai' && (
                <>
                  <div className="flex justify-between pt-1 text-[11px] text-stone-600">
                    <span>Tunai</span>
                    <span>{formatRupiah(transaction.uang_diterima || transaction.total_harga)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-600">
                    <span>Kembalian</span>
                    <span>{formatRupiah(transaction.uang_kembalian || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* E. Footer Struk */}
            <div className="text-center text-[10px] text-stone-500 space-y-1 pt-1">
              <p className="font-semibold text-stone-700">Terima kasih telah berbelanja.</p>
              <p>Barang yang sudah dibeli dapat ditukar sesuai kebijakan toko.</p>
              <p className="text-[9px] text-stone-400">--- Simpan struk ini sebagai bukti pembayaran sah ---</p>
            </div>
          </div>
        </div>

        {/* F. Tombol Modal Struk (Tutup & Cetak Struk) */}
        <div className="p-4 bg-[#FAF7F2] border-t border-stone-200 flex items-center justify-end gap-2.5 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A1810] hover:bg-[#3D2318] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  )
}
