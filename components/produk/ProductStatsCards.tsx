'use client'

import React from 'react'
import { ProductStats } from '@/types/pos'
import { formatRupiah, formatNumber } from '@/lib/utils'

interface ProductStatsCardsProps {
  stats: ProductStats
}

export function ProductStatsCards({ stats }: ProductStatsCardsProps) {
  return (
    <div className="bg-white border border-[#E8E1D9] rounded-2xl p-5 sm:p-6 shadow-xs mb-6 shrink-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80">
        {/* 1. Total Produk */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 pb-4 sm:pb-0">
          <span className="text-xs text-stone-500 font-normal block mb-1.5">
            Total Produk
          </span>
          <div className="text-3xl lg:text-[34px] font-extrabold text-stone-900 leading-tight mb-1.5 tracking-tight">
            {formatNumber(stats.total_produk)}
          </div>
          <span className="text-xs text-stone-400 font-normal">
            {formatNumber(stats.total_unit_stok)} total unit stok
          </span>
        </div>

        {/* 2. Nilai Persediaan (HPP) */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0">
          <span className="text-xs text-stone-500 font-normal block mb-1.5">
            Nilai Persediaan (HPP)
          </span>
          <div className="text-2xl sm:text-[28px] lg:text-[30px] font-extrabold text-stone-900 leading-tight mb-1.5 tracking-tight whitespace-nowrap">
            {formatRupiah(stats.nilai_persediaan_hpp)}
          </div>
          <span className="text-xs text-stone-400 font-normal">
            Berdasarkan harga modal aktif
          </span>
        </div>

        {/* 3. Stok Menipis */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0">
          <span className="text-xs text-stone-500 font-normal block mb-1.5">
            Stok Menipis
          </span>
          <div className="text-3xl lg:text-[34px] font-extrabold text-[#C96B1E] leading-tight mb-1.5 tracking-tight">
            {stats.stok_menipis}
          </div>
          <span className="text-xs text-stone-400 font-normal">
            Produk dengan stok 1–8 unit
          </span>
        </div>

        {/* 4. Stok Habis */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 pt-4 sm:pt-0">
          <span className="text-xs text-stone-500 font-normal block mb-1.5">
            Stok Habis
          </span>
          <div className="text-3xl lg:text-[34px] font-extrabold text-rose-600 leading-tight mb-1.5 tracking-tight">
            {stats.stok_habis}
          </div>
          <span className="text-xs text-stone-400 font-normal">
            Perlu pengisian ulang segera
          </span>
        </div>
      </div>
    </div>
  )
}
