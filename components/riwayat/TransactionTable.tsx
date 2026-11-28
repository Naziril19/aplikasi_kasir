'use client'

import React, { useState } from 'react'
import {
  FileText,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Info,
} from 'lucide-react'
import { Transaksi } from '@/types/pos'
import { formatRupiah } from '@/lib/utils'

interface TransactionTableProps {
  transactions: Transaksi[]
  onOpenReceipt: (trx: Transaksi) => void
  onOpenCancel: (trx: Transaksi) => void
  isLoading?: boolean
}

const ITEMS_PER_PAGE = 10

export function TransactionTable({
  transactions,
  onOpenReceipt,
  onOpenCancel,
  isLoading = false,
}: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredTrxId, setHoveredTrxId] = useState<string | null>(null)

  // Pagination calculation
  const totalItems = transactions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const currentItems = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Format date & time into Indonesian format: "20 Nov 2026, 18.57"
  const formatDateTime = (dateString: string) => {
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

  // Format Item Summary: "Produk A (+X produk lain) · Y item"
  const getItemSummary = (trx: Transaksi) => {
    const items = trx.items || []
    if (items.length === 0) return { mainText: '0 item', totalItems: 0 }

    const firstItem = items[0]
    const firstName = firstItem.nama_produk_snapshot || firstItem.produk?.nama_produk || 'Produk Perkakas'
    const totalQty = items.reduce((sum, it) => sum + (it.jumlah || 1), 0)
    const otherProductsCount = items.length - 1

    let mainText = firstName
    if (otherProductsCount > 0) {
      mainText = `${firstName} +${otherProductsCount} produk lain`
    }

    return {
      mainText,
      totalItems: totalQty,
      items,
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E1D9] p-12 text-center shadow-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2A1810] border-t-transparent mb-3" />
        <p className="text-xs text-stone-500 font-medium">Memuat data riwayat transaksi...</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E1D9] p-12 text-center shadow-xs">
        <Receipt className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="font-semibold text-stone-800 text-sm mb-1">Transaksi tidak ditemukan</h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Coba sesuaikan kata kunci pencarian atau ganti filter metode dan status transaksi.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8E1D9] shadow-xs overflow-hidden flex flex-col flex-1">
      {/* Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8E1D9] text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              <th className="py-3 px-4">No. Struk</th>
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-4">Pelanggan</th>
              <th className="py-3 px-4">Ringkasan Item</th>
              <th className="py-3 px-4">Metode</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2ECE4] text-xs text-stone-700 font-medium">
            {currentItems.map((trx) => {
              const summary = getItemSummary(trx)
              const isCancelled =
                trx.status_transaksi === 'Dibatalkan' || trx.status_transaksi === 'Batal'
              const isHovered = hoveredTrxId === trx.id_transaksi

              return (
                <tr
                  key={trx.id_transaksi}
                  className="hover:bg-[#FCFBF9] transition-colors group"
                >
                  {/* 1. No. Struk */}
                  <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                    {trx.no_struk}
                  </td>

                  {/* 2. Waktu */}
                  <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                    {formatDateTime(trx.tanggal)}
                  </td>

                  {/* 3. Pelanggan & Tipe Layanan */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-stone-900">
                      {trx.nama_pelanggan || 'Pelanggan Umum'}
                    </div>
                    <div className="text-[11px] text-stone-500 font-normal mt-0.5">
                      {trx.tipe_layanan || 'Makan di Tempat'}
                    </div>
                  </td>

                  {/* 4. Ringkasan Item dengan Popover Tooltip */}
                  <td className="py-3.5 px-4 relative">
                    <div
                      className="cursor-pointer inline-flex items-center gap-1.5 group/item"
                      onMouseEnter={() => setHoveredTrxId(trx.id_transaksi)}
                      onMouseLeave={() => setHoveredTrxId(null)}
                      onClick={() => onOpenReceipt(trx)}
                    >
                      <span className="text-stone-800 hover:text-stone-950 transition-colors">
                        {summary.mainText} ·{' '}
                        <span className="font-bold text-stone-900">
                          {summary.totalItems} item
                        </span>
                      </span>
                      <Info className="w-3 h-3 text-stone-400 group-hover/item:text-stone-600 shrink-0" />
                    </div>

                    {/* Hover Detail Card Popover */}
                    {isHovered && summary.items && summary.items.length > 0 && (
                      <div className="absolute left-4 top-12 z-40 bg-white border border-stone-200 shadow-xl rounded-xl p-3 min-w-[240px] max-w-xs text-xs animate-in fade-in-50 zoom-in-95 pointer-events-none">
                        <div className="font-bold text-stone-900 border-b border-stone-100 pb-1.5 mb-2 flex justify-between items-center">
                          <span>Detail Barang ({summary.totalItems} item)</span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {summary.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-[11px]">
                              <span className="text-stone-700 font-medium truncate max-w-[150px]">
                                {item.nama_produk_snapshot || item.produk?.nama_produk}
                              </span>
                              <span className="text-stone-500 ml-2 whitespace-nowrap">
                                {item.jumlah}x · {formatRupiah(item.subtotal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* 5. Metode Pembayaran */}
                  <td className="py-3.5 px-4 text-stone-700 whitespace-nowrap">
                    {trx.metode_pembayaran}
                  </td>

                  {/* 6. Total */}
                  <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                    {formatRupiah(trx.total_harga)}
                  </td>

                  {/* 7. Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isCancelled ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Dibatalkan
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Selesai
                      </span>
                    )}
                  </td>

                  {/* 8. Tombol Aksi */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Tombol Struk */}
                      <button
                        type="button"
                        onClick={() => onOpenReceipt(trx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        title="Lihat & Cetak Struk"
                      >
                        <FileText className="w-3.5 h-3.5 text-stone-500" />
                        <span>Struk</span>
                      </button>

                      {/* Tombol Batalkan */}
                      {!isCancelled ? (
                        <button
                          type="button"
                          onClick={() => onOpenCancel(trx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Batalkan Transaksi"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Batalkan</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-stone-300 font-normal cursor-not-allowed">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Batalkan</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="bg-[#FAF7F2] border-t border-[#E8E1D9] px-4 py-3 flex items-center justify-between text-xs text-stone-600">
          <div>
            Menampilkan{' '}
            <span className="font-bold text-stone-900">{startIndex + 1}</span> -{' '}
            <span className="font-bold text-stone-900">
              {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}
            </span>{' '}
            dari <span className="font-bold text-stone-900">{totalItems}</span> transaksi
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#E8E1D9] bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
              const isActive = num === safePage
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2A1810] text-white shadow-2xs'
                      : 'bg-white border border-[#E8E1D9] text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {num}
                </button>
              )
            })}

            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#E8E1D9] bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
