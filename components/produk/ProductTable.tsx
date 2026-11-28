'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  Wrench,
  Minus,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Produk } from '@/types/pos'
import { formatRupiah, getProductImageUrl, cn } from '@/lib/utils'

interface ProductTableProps {
  products: Produk[]
  onQuickAdjustStock: (id_produk: string, delta: number) => Promise<void>
  onEditProduct: (product: Produk) => void
  onDeleteProduct: (product: Produk) => void
  isAdjustingId: string | null
}

const ITEMS_PER_PAGE = 10

export function ProductTable({
  products,
  onQuickAdjustStock,
  onEditProduct,
  onDeleteProduct,
  isAdjustingId,
}: ProductTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedProducts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE
    return products.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [products, safeCurrentPage])

  const startRecord = products.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1
  const endRecord = Math.min(safeCurrentPage * ITEMS_PER_PAGE, products.length)

  return (
    <div className="bg-white border border-[#E8E1D9] rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Table Scroll Area */}
      <div className="overflow-x-auto flex-1 min-h-[360px]">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8E1D9] text-xs font-semibold text-stone-600">
              <th className="py-3 px-4 sm:px-6 min-w-[240px] text-left whitespace-nowrap">Produk</th>
              <th className="py-3 px-4 sm:px-6 min-w-[120px] text-left whitespace-nowrap">Kategori</th>
              <th className="py-3 px-4 sm:px-6 min-w-[110px] text-right whitespace-nowrap">Harga Modal</th>
              <th className="py-3 px-4 sm:px-6 min-w-[110px] text-right whitespace-nowrap">Harga Jual</th>
              <th className="py-3 px-4 sm:px-6 min-w-[90px] text-right whitespace-nowrap">Margin</th>
              <th className="py-3 px-4 sm:px-6 min-w-[120px] text-center whitespace-nowrap">Stok</th>
              <th className="py-3 px-4 sm:px-6 min-w-[100px] text-center whitespace-nowrap">Status</th>
              <th className="py-3 px-4 sm:px-6 min-w-[140px] text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-stone-400">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-2">
                    <Wrench className="w-5 h-5 text-stone-300" />
                  </div>
                  <p className="font-semibold text-stone-700 text-sm">Produk tidak ditemukan</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Coba sesuaikan kata kunci pencarian atau filter kategori/stok Anda.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const imageUrl = getProductImageUrl(p.foto_produk)
                const isNonaktif = p.status === 'Nonaktif'
                const isOutOfStock = p.stok <= 0
                const isLowStock = !isOutOfStock && p.stok <= p.stok_minimum
                const isUpdatingThis = isAdjustingId === p.id_produk

                // Calculated margin percentage
                const marginRp = p.margin_rp ?? (p.harga_jual - p.harga_modal)
                const marginPct =
                  p.margin_persen ??
                  (p.harga_modal > 0
                    ? Math.round((marginRp / p.harga_modal) * 100)
                    : 0)

                return (
                  <tr
                    key={p.id_produk}
                    className={cn(
                      'hover:bg-[#FAF8F5]/80 transition-colors',
                      isNonaktif && 'opacity-60 bg-stone-50/40'
                    )}
                  >
                    {/* 1. Produk info */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-stone-100 border border-stone-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                          {imageUrl && !imageUrl.endsWith('.svg') ? (
                            <Image
                              src={imageUrl}
                              alt={p.nama_produk}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <Wrench className="w-4 h-4 text-stone-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4
                            className="font-bold text-stone-900 text-xs sm:text-sm leading-snug truncate max-w-[230px]"
                            title={p.nama_produk}
                          >
                            {p.nama_produk}
                          </h4>
                          <span className="text-[11px] sm:text-xs text-stone-400 font-mono font-normal block mt-0.5 tracking-wide">
                            {p.id_produk}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Kategori */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs sm:text-sm font-normal text-stone-600 whitespace-nowrap">
                      {p.nama_kategori || 'Perkakas'}
                    </td>

                    {/* 3. Harga Modal */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs sm:text-sm font-normal text-stone-500 text-right whitespace-nowrap">
                      {formatRupiah(p.harga_modal)}
                    </td>

                    {/* 4. Harga Jual */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs sm:text-sm font-bold text-stone-900 text-right whitespace-nowrap">
                      {formatRupiah(p.harga_jual)}
                    </td>

                    {/* 5. Margin */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs sm:text-sm font-medium text-emerald-700 text-right whitespace-nowrap">
                      {Math.round(marginPct)}%
                    </td>

                    {/* 6. Stok Controls */}
                    <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          disabled={p.stok <= 0 || isUpdatingThis || isNonaktif}
                          onClick={() => onQuickAdjustStock(p.id_produk, -1)}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Kurangi stok 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 sm:w-7 text-center font-bold text-stone-800 text-xs sm:text-sm">
                          {isUpdatingThis ? '...' : p.stok}
                        </span>
                        <button
                          type="button"
                          disabled={isUpdatingThis || isNonaktif}
                          onClick={() => onQuickAdjustStock(p.id_produk, 1)}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Tambah stok 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* 7. Status */}
                    <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                      {isNonaktif ? (
                        <span className="text-stone-400 font-medium text-xs sm:text-sm">
                          Nonaktif
                        </span>
                      ) : isOutOfStock ? (
                        <span className="text-rose-600 font-medium text-xs sm:text-sm">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[#C96B1E] font-medium text-xs sm:text-sm">
                          Menipis
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium text-xs sm:text-sm">
                          Tersedia
                        </span>
                      )}
                    </td>

                    {/* 8. Aksi */}
                    <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p)}
                          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                          title="Edit Produk"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(p)}
                          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {products.length > 0 && (
        <div className="px-5 py-3 bg-[#FAF7F2] border-t border-[#E8E1D9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div>
            Menampilkan <span className="font-bold text-stone-800">{startRecord}</span> -{' '}
            <span className="font-bold text-stone-800">{endRecord}</span> dari{' '}
            <span className="font-bold text-stone-800">{products.length}</span> total barang
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-[#E8E1D9] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === safeCurrentPage
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        isActive
                          ? 'bg-[#2A1810] text-white shadow-2xs font-bold'
                          : 'bg-white border border-[#E8E1D9] text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                }

                if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
                  return (
                    <span key={pageNum} className="px-1 text-stone-400">
                      ...
                    </span>
                  )
                }

                return null
              })}
            </div>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-[#E8E1D9] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
