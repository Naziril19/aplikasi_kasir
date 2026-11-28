'use client'

import React from 'react'
import { Search, X, Plus, ChevronDown } from 'lucide-react'
import { Kategori } from '@/types/pos'
import { cn } from '@/lib/utils'

export type StockFilterType = 'all' | 'low' | 'empty'

interface ProductFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  kategoriList: Kategori[]
  selectedKategoriId: string | null
  onSelectKategori: (id: string | null) => void
  stockFilter: StockFilterType
  onStockFilterChange: (filter: StockFilterType) => void
  onOpenAddModal: () => void
}

export function ProductFilterBar({
  searchQuery,
  onSearchChange,
  kategoriList,
  selectedKategoriId,
  onSelectKategori,
  stockFilter,
  onStockFilterChange,
  onOpenAddModal,
}: ProductFilterBarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 mb-6 shrink-0">
      {/* Left side: Search Bar + Category Dropdown + Stock Segmented Control */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 max-w-4xl">
        {/* 1. Search Bar */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[260px] max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari produk atau SKU..."
            style={{ color: '#1c1917' }}
            className="w-full pl-9 pr-8 py-2 bg-white border border-[#E8E1D9] rounded-xl text-xs sm:text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2A1810]/20 focus:border-[#2A1810] shadow-2xs transition-all select-text"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded-full cursor-pointer transition-colors"
              title="Hapus kata pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Category Dropdown */}
        <div className="relative min-w-[160px]">
          <select
            value={selectedKategoriId || ''}
            onChange={(e) => onSelectKategori(e.target.value ? e.target.value : null)}
            className="appearance-none w-full pl-3.5 pr-8 py-2 bg-white border border-[#E8E1D9] rounded-xl text-xs sm:text-sm font-medium text-stone-700 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2A1810]/20 focus:border-[#2A1810] cursor-pointer shadow-2xs transition-all"
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map((cat) => (
              <option key={cat.id_kategori} value={cat.id_kategori}>
                {cat.nama_kategori}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        </div>

        {/* 3. Stock Status Segmented Control */}
        <div className="inline-flex items-center bg-[#EFEAE2] p-1 rounded-xl gap-1 border border-[#E4DDD3] text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => onStockFilterChange('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              stockFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            )}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => onStockFilterChange('low')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              stockFilter === 'low'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            )}
          >
            Menipis
          </button>
          <button
            type="button"
            onClick={() => onStockFilterChange('empty')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              stockFilter === 'empty'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            )}
          >
            Habis
          </button>
        </div>
      </div>

      {/* Right side: + Tambah Produk Button */}
      <button
        type="button"
        onClick={onOpenAddModal}
        className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-[#2A1810] hover:bg-[#3D2314] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Tambah Produk</span>
      </button>
    </div>
  )
}
