'use client'

import React from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

export type StatusFilterOption = 'all' | 'Selesai' | 'Dibatalkan'

interface TransactionFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  paymentMethod: string
  onPaymentMethodChange: (value: string) => void
  statusFilter: StatusFilterOption
  onStatusFilterChange: (value: StatusFilterOption) => void
  totalCount: number
  filteredCount: number
}

const PAYMENT_METHODS = [
  { value: 'all', label: 'Semua Metode' },
  { value: 'Tunai', label: 'Tunai' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Kartu', label: 'Kartu' },
]

export function TransactionFilterBar({
  searchQuery,
  onSearchChange,
  paymentMethod,
  onPaymentMethodChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  filteredCount,
}: TransactionFilterBarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      {/* Kiri: Search Input, Metode Dropdown, & Segmented Status Control */}
      <div className="flex flex-wrap items-center gap-3 flex-1 max-w-4xl">
        {/* 1. Search Bar */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[260px] max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari no. struk, nama pelanggan, atau produk..."
            style={{ color: '#1c1917' }}
            className="w-full pl-9 pr-9 py-2 bg-white border border-[#E8E1D9] rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2A1810]/20 focus:border-[#2A1810] shadow-2xs transition-all select-text"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Dropdown Filter Metode Pembayaran */}
        <div className="relative">
          <select
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2 bg-white border border-[#E8E1D9] rounded-xl text-xs font-medium text-stone-700 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2A1810]/20 focus:border-[#2A1810] cursor-pointer shadow-2xs transition-all"
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        </div>

        {/* 3. Segmented Control Status Transaksi */}
        <div className="inline-flex items-center bg-[#EFEAE2] p-1 rounded-xl gap-1 border border-[#E4DDD3]">
          {(
            [
              { key: 'all', label: 'Semua' },
              { key: 'Selesai', label: 'Selesai' },
              { key: 'Dibatalkan', label: 'Dibatalkan' },
            ] as const
          ).map((item) => {
            const isActive = statusFilter === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onStatusFilterChange(item.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Kanan: Informasi Jumlah Transaksi */}
      <div className="text-xs text-stone-500 font-medium shrink-0 self-center lg:self-auto">
        Menampilkan <span className="font-bold text-stone-800">{filteredCount}</span> dari{' '}
        <span className="font-bold text-stone-800">{totalCount}</span> transaksi
      </div>
    </div>
  )
}
