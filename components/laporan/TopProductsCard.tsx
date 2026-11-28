'use client'

import React from 'react'
import Image from 'next/image'
import { Package, Wrench } from 'lucide-react'
import { TopSellingProduct } from '@/types/pos'
import { formatRupiah, getProductImageUrl } from '@/lib/utils'

interface TopProductsCardProps {
  products: TopSellingProduct[]
}

export function TopProductsCard({ products }: TopProductsCardProps) {
  return (
    <div className="bg-white border border-[#E8E1D9] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
          Produk Terlaris
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Produk dengan jumlah penjualan tertinggi pada periode terpilih.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {products.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <div className="w-12 h-12 rounded-full bg-[#F5EFE9] flex items-center justify-center text-stone-400 mx-auto mb-2.5">
              <Package className="w-5 h-5 text-stone-400" />
            </div>
            <p className="font-semibold text-stone-700 text-sm">Belum ada produk terjual</p>
            <p className="text-xs text-stone-400 mt-0.5 max-w-xs mx-auto">
              Data produk terlaris akan otomatis terisi saat transaksi berstatus Selesai tercatat pada periode ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {products.map((item, idx) => {
              const imageUrl = getProductImageUrl(item.foto_produk)

              return (
                <div
                  key={item.id_produk}
                  className="py-3 sm:py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-lg bg-stone-100 border border-stone-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                      {imageUrl && !imageUrl.endsWith('.svg') ? (
                        <Image
                          src={imageUrl}
                          alt={item.nama_produk}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <Wrench className="w-4 h-4 text-stone-300" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-stone-400 font-mono">
                          #{idx + 1}
                        </span>
                        <h4
                          className="font-bold text-stone-900 text-xs sm:text-sm leading-snug truncate max-w-[200px] sm:max-w-[280px]"
                          title={item.nama_produk}
                        >
                          {item.nama_produk}
                        </h4>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                        Kategori: <span className="font-medium text-stone-700">{item.nama_kategori}</span> · SKU: <span className="font-mono text-stone-600">{item.id_produk}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Quantity Sold & Revenue */}
                  <div className="text-right shrink-0">
                    <div className="font-bold text-stone-900 text-xs sm:text-sm whitespace-nowrap">
                      {item.terjual} unit
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 whitespace-nowrap">
                      {formatRupiah(item.pendapatan)}
                    </div>
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
