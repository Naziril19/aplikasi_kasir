'use client'

import React from 'react'
import Link from 'next/link'
import {
  Wrench,
  ShoppingBag,
  Package,
  Clock,
  BarChart3,
  X,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import { formatRupiah, cn } from '@/lib/utils'
import { TodayStats } from '@/types/pos'
import { useAuth } from '@/context/AuthContext'

interface SidebarProps {
  lowStockCount: number
  todayStats: TodayStats
  activeMenu?: 'kasir' | 'produk' | 'riwayat' | 'laporan'
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({
  lowStockCount,
  todayStats,
  activeMenu = 'kasir',
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { userDisplayName, signOut } = useAuth()
  const renderNavAndBrand = (isMobile = false) => (
    <>
      {/* Top Section */}
      <div className="p-6">
        {/* Brand / Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#43271A] flex items-center justify-center text-amber-100 shadow-inner border border-amber-900/30">
              <Wrench className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight leading-tight">
                Karsa Kasir
              </h1>
              <p className="text-[11px] text-stone-400 font-medium">Toko Perkakas</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors lg:hidden cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {/* Menu Kasir */}
          <Link
            href="/"
            onClick={isMobile ? onCloseMobile : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer',
              activeMenu === 'kasir'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5 font-medium'
            )}
          >
            <ShoppingBag
              className={cn(
                'w-5 h-5',
                activeMenu === 'kasir' ? 'text-stone-800' : 'text-stone-400'
              )}
            />
            <span className="text-[15px]">Kasir</span>
          </Link>

          {/* Menu Produk */}
          <Link
            href="/produk"
            onClick={isMobile ? onCloseMobile : undefined}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors font-medium text-[15px] cursor-pointer',
              activeMenu === 'produk'
                ? 'bg-white text-stone-900 font-semibold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            )}
          >
            <div className="flex items-center gap-3">
              <Package
                className={cn(
                  'w-5 h-5',
                  activeMenu === 'produk' ? 'text-stone-800' : 'text-stone-400'
                )}
              />
              <span>Produk</span>
            </div>
            {lowStockCount > 0 && (
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full border',
                  activeMenu === 'produk'
                    ? 'text-[#C96B1E] bg-amber-50 border-amber-200'
                    : 'text-[#E6953B] bg-amber-950/40 border-amber-800/30'
                )}
              >
                {lowStockCount} menipis
              </span>
            )}
          </Link>

          {/* Menu Riwayat */}
          <Link
            href="/riwayat"
            onClick={isMobile ? onCloseMobile : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-[15px] cursor-pointer',
              activeMenu === 'riwayat'
                ? 'bg-white text-stone-900 font-semibold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            )}
          >
            <Clock
              className={cn(
                'w-5 h-5',
                activeMenu === 'riwayat' ? 'text-stone-800' : 'text-stone-400'
              )}
            />
            <span>Riwayat</span>
          </Link>

          {/* Menu Laporan */}
          <Link
            href="/laporan"
            onClick={isMobile ? onCloseMobile : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-[15px] cursor-pointer',
              activeMenu === 'laporan'
                ? 'bg-white text-stone-900 font-semibold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            )}
          >
            <BarChart3
              className={cn(
                'w-5 h-5',
                activeMenu === 'laporan' ? 'text-stone-800' : 'text-stone-400'
              )}
            />
            <span>Laporan</span>
          </Link>
        </nav>
      </div>

        {/* Bottom Section: Omzet, User info & Logout */}
      <div className="p-6 border-t border-stone-800/60 bg-[#24140D]/50 space-y-4">
        <div>
          <span className="text-xs font-normal text-stone-400 block mb-0.5">
            Omzet Hari Ini
          </span>
          <div className="text-xl font-bold text-white tracking-tight">
            {formatRupiah(todayStats.total_omzet)}
          </div>
          <span className="text-xs text-stone-400 mt-0.5 block">
            {todayStats.total_transactions} transaksi selesai
          </span>
        </div>

        {/* User active shift & logout button */}
        <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#43271A] border border-amber-900/40 flex items-center justify-center text-amber-200 shrink-0">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-200 truncate max-w-[150px]" title={userDisplayName}>
                {userDisplayName}
              </p>
              <p className="text-[10px] text-stone-400 truncate">
                Shift Kasir Aktif
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            title="Keluar dari akun (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-[290px] min-w-[290px] h-screen bg-[#2A1810] text-stone-200 flex-col justify-between shrink-0 select-none border-r border-[#1F120B]">
        {renderNavAndBrand(false)}
      </aside>

      {/* 2. Mobile Off-Canvas Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* 3. Mobile Off-Canvas Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw] h-full bg-[#2A1810] text-stone-200 flex flex-col justify-between select-none border-r border-[#1F120B] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderNavAndBrand(true)}
      </aside>
    </>
  )
}
