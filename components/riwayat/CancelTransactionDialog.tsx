'use client'

import React, { useState } from 'react'
import { AlertCircle, RotateCcw, X, Loader2 } from 'lucide-react'
import { Transaksi } from '@/types/pos'
import { formatRupiah } from '@/lib/utils'

interface CancelTransactionDialogProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaksi | null
  onConfirmCancel: (id_transaksi: string, alasan?: string) => Promise<void>
}

export function CancelTransactionDialog({
  isOpen,
  onClose,
  transaction,
  onConfirmCancel,
}: CancelTransactionDialogProps) {
  const [alasan, setAlasan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !transaction) return null

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirmCancel(transaction.id_transaksi, alasan.trim() || undefined)
      setAlasan('')
      onClose()
    } catch {
      // Handled in caller with toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Batalkan Transaksi</h3>
              <p className="text-[11px] text-stone-500">
                Stok barang akan dikembalikan ke persediaan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Apakah Anda yakin ingin membatalkan transaksi ini? Tindakan ini akan{' '}
              <strong>mengembalikan stok seluruh barang</strong> yang dibeli dan mencatatnya ke
              riwayat stok.
            </p>
          </div>

          {/* Info Transaksi yang akan dibatalkan */}
          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8E1D9] text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-500">No. Struk:</span>
              <span className="font-bold text-stone-900">{transaction.no_struk}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Pelanggan:</span>
              <span className="font-semibold text-stone-800">
                {transaction.nama_pelanggan || 'Pelanggan Umum'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Total Transaksi:</span>
              <span className="font-bold text-rose-700 text-sm">
                {formatRupiah(transaction.total_harga)}
              </span>
            </div>
          </div>

          {/* Input Alasan Pembatalan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Alasan Pembatalan <span className="font-normal text-stone-400">(opsional)</span>
            </label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Pelanggan salah memilih ukuran barang, transaksi duplikat..."
              rows={2}
              className="w-full px-3 py-2 bg-white border border-[#E8E1D9] rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-3.5 bg-[#FAF7F2] border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membatalkan...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Batalkan Transaksi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
