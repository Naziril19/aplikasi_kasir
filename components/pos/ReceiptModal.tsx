'use client'

import React from 'react'
import { Printer, CheckCircle2, RotateCcw } from 'lucide-react'
import { ProsesTransaksiPayload } from '@/types/pos'
import { formatRupiah, formatDateIndo } from '@/lib/utils'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: ProsesTransaksiPayload | null
}

export function ReceiptModal({ isOpen, onClose, transaction }: ReceiptModalProps) {
  if (!isOpen || !transaction) return null

  const handlePrint = () => {
    window.print()
  }

  const currentDate = formatDateIndo(new Date())
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Receipt Header Banner */}
        <div className="bg-emerald-600 text-white p-4 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-1 text-emerald-100" />
          <h3 className="font-bold text-base">Transaksi Berhasil!</h3>
          <p className="text-xs text-emerald-100">
            Penjualan tersimpan dan stok barang berkurang otomatis.
          </p>
        </div>

        {/* Printable Struk Paper Area */}
        <div
          id="printable-receipt"
          className="p-6 bg-[#FCFBF9] text-stone-800 font-mono text-xs space-y-4 border-b border-stone-200/80"
        >
          {/* Shop Title */}
          <div className="text-center space-y-0.5 border-b border-dashed border-stone-300 pb-3">
            <h4 className="font-bold text-sm tracking-widest text-stone-900 font-sans">
              KARSA KASIR
            </h4>
            <p className="text-[11px] text-stone-600 font-sans font-semibold">Toko Perkakas &amp; Bangunan</p>
            <p className="text-[10px] text-stone-400">Jl. Raya Teknik Utama No. 42</p>
          </div>

          {/* Meta Info */}
          <div className="space-y-1 text-[11px] text-stone-600 border-b border-dashed border-stone-300 pb-3">
            <div className="flex justify-between">
              <span>No. Struk:</span>
              <span className="font-bold">{transaction.no_struk}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{currentDate} {currentTime}</span>
            </div>
            {transaction.catatan && (
              <div className="flex justify-between">
                <span>Pelanggan/Ket:</span>
                <span>{transaction.catatan}</span>
              </div>
            )}
          </div>

          {/* Item List */}
          <div className="space-y-2 border-b border-dashed border-stone-300 pb-3">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold text-stone-800">
                  <span className="truncate max-w-[190px]">{item.nama_produk}</span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
                <div className="text-[10px] text-stone-500">
                  {item.jumlah} x {formatRupiah(item.harga_satuan)}
                </div>
              </div>
            ))}
          </div>

          {/* Calculation */}
          <div className="space-y-1.5 text-[11px] text-stone-600 border-b border-dashed border-stone-300 pb-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatRupiah(transaction.subtotal)}</span>
            </div>
            {transaction.diskon > 0 && (
              <div className="flex justify-between text-emerald-700">
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
            <div className="flex justify-between font-bold text-sm text-stone-900 pt-1">
              <span>Total Akhir</span>
              <span>{formatRupiah(transaction.total_harga)}</span>
            </div>
          </div>

          {/* Payment Detail */}
          <div className="space-y-1 text-[11px] text-stone-600">
            <div className="flex justify-between">
              <span>Metode:</span>
              <span className="font-bold">{transaction.metode_pembayaran}</span>
            </div>
            {transaction.metode_pembayaran === 'Tunai' ? (
              <>
                <div className="flex justify-between">
                  <span>Uang Diterima:</span>
                  <span>{formatRupiah(transaction.uang_diterima)}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(transaction.uang_kembalian)}</span>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 text-[10px] text-stone-400 font-sans">
            <p>Terima kasih atas belanja Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar</p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="p-4 bg-white flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#3D2314] hover:bg-[#2C190E] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  )
}
