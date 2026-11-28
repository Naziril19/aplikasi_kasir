'use client'

import React from 'react'
import { AlertCircle, Check, X } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { MetodePembayaran } from '@/types/pos'

interface ConfirmPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  totalAmount: number
  paymentMethod: MetodePembayaran
  amountReceived: number
  changeAmount: number
  itemsCount: number
}

export function ConfirmPaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  paymentMethod,
  amountReceived,
  changeAmount,
  itemsCount,
}: ConfirmPaymentDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900 tracking-tight">
              Konfirmasi Selesaikan Transaksi
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Pastikan pembayaran pelanggan telah diterima dengan benar.
            </p>
          </div>
        </div>

        {/* Content Details */}
        <div className="px-6 py-3 space-y-2.5 text-xs text-stone-600 bg-stone-50/70 border-y border-stone-100">
          <div className="flex justify-between">
            <span>Jumlah Item:</span>
            <span className="font-semibold text-stone-900">{itemsCount} item</span>
          </div>
          <div className="flex justify-between">
            <span>Metode Pembayaran:</span>
            <span className="font-bold text-stone-900">{paymentMethod}</span>
          </div>
          <div className="flex justify-between items-baseline pt-1 border-t border-stone-200">
            <span className="font-bold text-stone-800">Total Pembayaran:</span>
            <span className="text-lg font-extrabold text-[#3D2314]">
              {formatRupiah(totalAmount)}
            </span>
          </div>
          {paymentMethod === 'Tunai' && (
            <>
              <div className="flex justify-between text-stone-500">
                <span>Uang Diterima:</span>
                <span>{formatRupiah(amountReceived)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Kembalian:</span>
                <span>{formatRupiah(changeAmount)}</span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Periksa Lagi</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-[#3D2314] hover:bg-[#2C190E] active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Ya, Selesaikan Pembayaran</span>
          </button>
        </div>
      </div>
    </div>
  )
}
