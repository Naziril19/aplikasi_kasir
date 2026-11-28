'use client'

import React from 'react'
import { Plus, Menu } from 'lucide-react'
import { formatDateIndo, cn } from '@/lib/utils'

interface HeaderProps {
  onOpenAddProduct?: () => void
  title?: string
  breadcrumb?: string
  showAddButton?: boolean
  onToggleMobileSidebar?: () => void
  className?: string
}

export function Header({
  onOpenAddProduct,
  title = 'Kasir',
  breadcrumb = 'Karsa Kasir / Kasir',
  showAddButton = true,
  onToggleMobileSidebar,
  className,
}: HeaderProps) {
  const todayFormatted = formatDateIndo(new Date())

  return (
    <header
      className={cn(
        'h-[70px] sm:h-[74px] px-4 sm:px-6 lg:px-8 bg-[#FAF7F2] border-b border-[#E8E1D9] flex items-center justify-between shrink-0',
        className
      )}
    >
      {/* Left: Mobile Menu Toggle, Breadcrumbs & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 -ml-1 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 transition-colors cursor-pointer shrink-0"
            aria-label="Buka navigasi"
            title="Buka Navigasi"
          >
            <Menu className="w-5 h-5 text-stone-800" />
          </button>
        )}

        <div className="min-w-0">
          <div className="text-[11px] sm:text-xs font-normal text-stone-500 mb-0.5 tracking-tight truncate max-w-[170px] sm:max-w-none">
            {breadcrumb}
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight leading-none truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Date & Add Product Button */}
      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        <span className="text-xs sm:text-sm font-normal text-stone-500 hidden md:inline-block">
          {todayFormatted}
        </span>

        {showAddButton && onOpenAddProduct && (
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#2A1810] hover:bg-[#3D2314] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Produk</span>
          </button>
        )}
      </div>
    </header>
  )
}
