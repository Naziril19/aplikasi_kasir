'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import { Search, Plus, Wrench, Barcode as BarcodeIcon, X } from 'lucide-react'
import { Produk, Kategori } from '@/types/pos'
import { formatRupiah, getProductImageUrl, cn } from '@/lib/utils'

interface ProductCatalogProps {
  produk: Produk[]
  kategori: Kategori[]
  selectedKategoriId: string | null
  onSelectKategori: (kategoriId: string | null) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onAddToCart: (item: Produk) => void
}

export function ProductCatalog({
  produk,
  kategori,
  selectedKategoriId,
  onSelectKategori,
  searchQuery,
  onSearchChange,
  onAddToCart,
}: ProductCatalogProps) {
  // Filter produk by category, search by name, code, or barcode
  const filteredProduk = useMemo(() => {
    return produk.filter((item) => {
      const matchesKategori =
        !selectedKategoriId || item.id_kategori === selectedKategoriId

      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        item.nama_produk.toLowerCase().includes(query) ||
        item.id_produk.toLowerCase().includes(query) ||
        (item.barcode && item.barcode.toLowerCase().includes(query))

      return matchesKategori && matchesSearch
    })
  }, [produk, selectedKategoriId, searchQuery])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF7F2] p-4 sm:p-6 lg:p-7">
      {/* Top Bar: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 sm:mb-6 shrink-0">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm lg:max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama produk atau SKU..."
            style={{ color: '#1c1917' }}
            className="w-full pl-9 pr-9 py-2 bg-white border border-[#E8E1D9] rounded-xl text-xs md:text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2A1810]/20 focus:border-[#2A1810] shadow-2xs transition-all select-text"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded-full transition-colors cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="inline-flex items-center gap-1 bg-[#EFEAE2] p-1 rounded-xl border border-[#E4DDD3] overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => onSelectKategori(null)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
              selectedKategoriId === null
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            )}
          >
            Semua
          </button>

          {kategori.map((cat) => {
            const isSelected = selectedKategoriId === cat.id_kategori
            return (
              <button
                key={cat.id_kategori}
                type="button"
                onClick={() => onSelectKategori(cat.id_kategori)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                  isSelected
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                )}
              >
                {cat.nama_kategori}
              </button>
            )
          })}
        </div>
      </div>

      {/* Catalog Grid Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProduk.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-stone-800 text-sm mb-1">
              Barang Tidak Ditemukan
            </h3>
            <p className="text-xs text-stone-500 max-w-xs">
              Tidak ada produk yang cocok dengan pencarian &quot;{searchQuery}&quot;. Coba cari kode barang, nama perkakas, atau scan barcode lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 pb-24 xl:pb-8">
            {filteredProduk.map((item) => {
              const isNonaktif = item.status === 'Nonaktif'
              const isOutOfStock = item.stok <= 0
              const isLowStock = !isOutOfStock && item.stok <= item.stok_minimum
              const categoryName = item.nama_kategori || 'Perkakas'
              const imageUrl = getProductImageUrl(item.foto_produk)

              return (
                <div
                  key={item.id_produk}
                  className={cn(
                    'bg-white border rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 group',
                    isNonaktif
                      ? 'opacity-60 border-stone-200 bg-stone-50/80'
                      : 'border-stone-200/80 hover:border-stone-300 hover:shadow-md'
                  )}
                >
                  <div>
                    {/* Product Image / Illustration */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 mb-2.5 flex items-center justify-center border border-stone-100">
                      {imageUrl && !imageUrl.endsWith('.svg') ? (
                        <Image
                          src={imageUrl}
                          alt={item.nama_produk}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100/70 p-3 text-center">
                          <Wrench className="w-8 h-8 mb-1 text-stone-300" />
                          <span className="text-[10px] font-mono text-stone-400">
                            {item.id_produk}
                          </span>
                        </div>
                      )}

                      {/* Code Badge */}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold">
                        {item.id_produk}
                      </div>

                      {/* Status Nonaktif Badge */}
                      {isNonaktif && (
                        <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          Nonaktif
                        </div>
                      )}
                    </div>

                    {/* Category & Satuan */}
                    <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                      <span className="truncate max-w-[140px] font-medium">
                        {categoryName}
                      </span>
                      <span className="text-[11px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                        {item.satuan}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h2
                      className="font-semibold text-stone-900 text-sm leading-snug line-clamp-2 min-h-[38px] mb-1.5"
                      title={item.nama_produk}
                    >
                      {item.nama_produk}
                    </h2>

                    {/* Barcode & Stock Status info */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1 text-stone-400 font-mono">
                        <BarcodeIcon className="w-3 h-3" />
                        <span className="text-[10px]">{item.barcode}</span>
                      </div>

                      <span
                        className={cn(
                          'font-semibold text-xs',
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-[#D97706]'
                            : 'text-stone-500'
                        )}
                      >
                        {isOutOfStock
                          ? 'Habis'
                          : isLowStock
                          ? `Sisa ${item.stok}`
                          : `Stok ${item.stok}`}
                      </span>
                    </div>
                  </div>

                  {/* Price & Add Button */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-100">
                    <div>
                      <span className="font-bold text-stone-900 text-[15px] block leading-tight">
                        {formatRupiah(item.harga_jual)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock || isNonaktif}
                      onClick={() => onAddToCart(item)}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        isOutOfStock || isNonaktif
                          ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                          : 'bg-stone-50 hover:bg-[#3D2314] text-stone-700 hover:text-white border border-stone-200 hover:border-transparent active:scale-95 shadow-2xs'
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
