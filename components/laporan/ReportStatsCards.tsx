'use client'

import React from 'react'
import { SalesReportKPI } from '@/types/pos'
import { formatRupiah, formatNumber } from '@/lib/utils'

interface ReportStatsCardsProps {
  kpi: SalesReportKPI
  periodLabel: string
}

export function ReportStatsCards({ kpi, periodLabel }: ReportStatsCardsProps) {
  // Format subtitle periode yang natural
  const getSubtextPeriod = () => {
    if (periodLabel.toLowerCase().includes('hari ini')) {
      return 'Hari ini · termasuk PPN'
    }
    if (periodLabel.toLowerCase().includes('semua')) {
      return 'Semua periode · termasuk PPN'
    }
    return `${periodLabel.toLowerCase()} · termasuk PPN`
  }

  return (
    <div className="bg-white border border-[#E8E1D9] rounded-2xl p-5 sm:p-6 shadow-xs mb-6 shrink-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80">
        {/* 1. Total Pendapatan */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 pb-4 sm:pb-0">
          <span className="text-xs text-stone-500 font-normal block mb-1.5">
            Total Pendapatan
          </span>
          <div className="text-3xl lg:text-[34px] font-bold text-stone-900 leading-tight mb-1.5 tracking-tight whitespace-nowrap">
            {formatRupiah(kpi.total_pendapatan)}
          </div>
          <span className="text-xs text-stone-400 font-normal">
            {getSubtextPeriod()}
          </span>
        </div>

        {/* 2. Estimasi Laba Kotor */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0">
          <span className="text-xs text-stone-500 font-normal block mb-1.5">
            Estimasi Laba Kotor
          </span>
          <div className="text-3xl lg:text-[34px] font-bold text-emerald-700 leading-tight mb-1.5 tracking-tight whitespace-nowrap">
            {formatRupiah(kpi.estimasi_laba_kotor)}
          </div>
          <span className="text-xs text-stone-400 font-normal">
            {kpi.is_hpp_lengkap
              ? `Margin kotor rata-rata ${kpi.margin_kotor_persen}%`
              : `Margin kotor ~${kpi.margin_kotor_persen}% (HPP sebagian)`}
          </span>
        </div>

        {/* 3. Transaksi Berhasil */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0">
          <span className="text-xs text-stone-500 font-normal block mb-1.5">
            Transaksi Berhasil
          </span>
          <div className="text-3xl lg:text-[34px] font-bold text-stone-900 leading-tight mb-1.5 tracking-tight">
            {formatNumber(kpi.transaksi_berhasil)}
          </div>
          <span className="text-xs text-stone-400 font-normal">
            Rata-rata {formatRupiah(kpi.rata_rata_per_struk)} / struk
          </span>
        </div>

        {/* 4. Total Produk Terjual */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 pt-4 sm:pt-0">
          <span className="text-xs text-stone-500 font-normal block mb-1.5">
            Total Produk Terjual
          </span>
          <div className="text-3xl lg:text-[34px] font-bold text-stone-900 leading-tight mb-1.5 tracking-tight">
            {formatNumber(kpi.total_produk_terjual)} unit
          </div>
          <span className="text-xs text-stone-400 font-normal">
            Tidak ada pembatalan
          </span>
        </div>
      </div>
    </div>
  )
}
