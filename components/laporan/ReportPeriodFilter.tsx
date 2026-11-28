'use client'

import React from 'react'
import { Download } from 'lucide-react'
import { ReportPeriodType } from '@/types/pos'
import { cn } from '@/lib/utils'

interface ReportPeriodFilterProps {
  selectedPeriod: ReportPeriodType
  onPeriodChange: (period: ReportPeriodType) => void
  onExportCSV: () => void
  isExporting?: boolean
}

const PERIOD_OPTIONS: { id: ReportPeriodType; label: string }[] = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7days', label: '7 Hari' },
  { id: '30days', label: '30 Hari' },
  { id: 'all', label: 'Semua' },
]

export function ReportPeriodFilter({
  selectedPeriod,
  onPeriodChange,
  onExportCSV,
  isExporting = false,
}: ReportPeriodFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 shrink-0">
      {/* Left: Segmented Control Periode Laporan */}
      <div className="inline-flex items-center bg-[#EFEAE2] p-1 rounded-xl gap-1 border border-[#E4DDD3] text-xs font-semibold shrink-0 self-start sm:self-auto">
        {PERIOD_OPTIONS.map((opt) => {
          const isActive = selectedPeriod === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPeriodChange(opt.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                isActive
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Right: Unduh Laporan CSV Button */}
      <button
        type="button"
        disabled={isExporting}
        onClick={onExportCSV}
        className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-white border border-[#E8E1D9] hover:bg-stone-50 active:scale-[0.98] text-stone-700 text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
        title="Unduh laporan transaksi dalam format file CSV"
      >
        <Download className="w-4 h-4 text-stone-500" />
        <span>Unduh Laporan CSV</span>
      </button>
    </div>
  )
}
