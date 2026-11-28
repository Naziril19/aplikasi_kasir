'use client'

import React, { useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Produk } from '@/types/pos'
import { deleteProduk } from '@/services/productService'
import { toast } from 'sonner'

interface DeleteProductDialogProps {
  isOpen: boolean
  onClose: () => void
  product: Produk | null
  onProductDeleted: (id_produk: string, softDeleted: boolean) => void
}

export function DeleteProductDialog({
  isOpen,
  onClose,
  product,
  onProductDeleted,
}: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen || !product) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteProduk(product.id_produk)
      if (result.softDeleted) {
        toast.info(result.message)
      } else {
        toast.success(result.message)
      }
      onProductDeleted(product.id_produk, result.softDeleted)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Gagal menghapus produk: ${msg}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900 tracking-tight">
              Hapus Barang Perkakas
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Tindakan ini akan menghapus produk dari inventaris toko.
            </p>
          </div>
        </div>

        {/* Content Details */}
        <div className="px-6 py-4 bg-stone-50/70 border-y border-stone-100 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-stone-500">Kode Barang:</span>
            <span className="font-mono font-bold text-stone-900">{product.id_produk}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Nama Barang:</span>
            <span className="font-semibold text-stone-900 text-right max-w-[240px] truncate">
              {product.nama_produk}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Kategori:</span>
            <span className="text-stone-700 font-medium">{product.nama_kategori || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Sisa Stok:</span>
            <span className="font-bold text-stone-800">
              {product.stok} {product.satuan}
            </span>
          </div>

          <div className="pt-2 text-[11px] text-stone-500 leading-relaxed bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-lg text-amber-900 mt-2">
            <strong>Catatan Keamanan:</strong> Jika produk sudah pernah memiliki transaksi penjualan, sistem akan otomatis mengubah statusnya menjadi <em>Nonaktif</em> agar riwayat transaksi kasir tetap utuh dan aman.
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Batal</span>
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Memproses...' : 'Hapus Produk'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
