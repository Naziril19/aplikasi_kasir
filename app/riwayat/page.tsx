'use client'

import React, { useState, useEffect, useCallback, useTransition } from 'react'
import { Sidebar } from '@/components/pos/Sidebar'
import { Header } from '@/components/pos/Header'
import {
  TransactionFilterBar,
  StatusFilterOption,
} from '@/components/riwayat/TransactionFilterBar'
import { TransactionTable } from '@/components/riwayat/TransactionTable'
import { TransactionReceiptModal } from '@/components/riwayat/TransactionReceiptModal'
import { CancelTransactionDialog } from '@/components/riwayat/CancelTransactionDialog'
import { Transaksi, TodayStats } from '@/types/pos'
import {
  getRiwayatTransaksi,
  batalkanTransaksi,
  getTodayStats,
} from '@/services/transactionService'
import { getProduk, calculateProductStats } from '@/services/productService'
import { toast } from 'sonner'

export default function RiwayatTransaksiPage() {
  // Transaksi Data State
  const [transactions, setTransactions] = useState<Transaksi[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all')

  // Modals & Dialog State
  const [selectedReceiptTrx, setSelectedReceiptTrx] = useState<Transaksi | null>(null)
  const [cancellingTrx, setCancellingTrx] = useState<Transaksi | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Sidebar Metadata State (Low stock & Today stats)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [todayStats, setTodayStats] = useState<TodayStats>({
    total_omzet: 0,
    total_transactions: 0,
  })

  // Load Transactions & Metadata from Supabase
  const loadTransactions = useCallback(async () => {
    try {
      const res = await getRiwayatTransaksi({
        searchQuery,
        paymentMethod,
        statusFilter,
      })

      setTransactions(res.transactions)
      setTotalCount(res.totalCount)
      setFilteredCount(res.filteredCount)
    } catch (err) {
      console.warn('Gagal memuat data riwayat transaksi:', err)
      toast.error('Gagal memuat data riwayat transaksi')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, paymentMethod, statusFilter])

  // Initial load of sidebar metadata
  useEffect(() => {
    let isMounted = true

    async function fetchSidebarInfo() {
      try {
        const [prodRes, stats] = await Promise.all([
          getProduk(),
          getTodayStats(),
        ])
        if (isMounted) {
          const statsCalc = calculateProductStats(prodRes.produk)
          setLowStockCount(statsCalc.stok_menipis)
          setTodayStats(stats)
        }
      } catch (e) {
        console.warn('Gagal memuat metadata sidebar:', e)
      }
    }

    void fetchSidebarInfo()

    return () => {
      isMounted = false
    }
  }, [])

  // Load transactions when filters change
  useEffect(() => {
    startTransition(() => {
      void loadTransactions()
    })
  }, [loadTransactions])

  // Handle Cancel Transaction
  const handleConfirmCancel = async (id_transaksi: string, alasan?: string) => {
    try {
      const result = await batalkanTransaksi(id_transaksi, alasan)
      if (!result.success) {
        toast.error(result.error || 'Gagal membatalkan transaksi')
        return
      }

      toast.success(
        `Transaksi ${cancellingTrx?.no_struk || id_transaksi} berhasil dibatalkan. Stok barang telah dikembalikan!`,
        { duration: 3000 }
      )

      // Refresh data
      await loadTransactions()
      const stats = await getTodayStats()
      setTodayStats(stats)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Terjadi kesalahan: ${msg}`)
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF7F2]">
      {/* 1. Left Sidebar (Responsive Desktop & Mobile Drawer) */}
      <Sidebar
        lowStockCount={lowStockCount}
        todayStats={todayStats}
        activeMenu="riwayat"
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <Header
          breadcrumb="Karsa Kasir / Riwayat"
          title="Riwayat Transaksi"
          showAddButton={false}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Page Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          {/* Search Bar, Filter Metode, & Status Segmented Control */}
          <TransactionFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />

          {/* Tabel Riwayat Transaksi */}
          <TransactionTable
            transactions={transactions}
            onOpenReceipt={(trx) => setSelectedReceiptTrx(trx)}
            onOpenCancel={(trx) => setCancellingTrx(trx)}
            isLoading={isLoading && !isPending && transactions.length === 0}
          />
        </div>
      </div>

      {/* 3. Modal Detail Struk Transaksi */}
      <TransactionReceiptModal
        isOpen={selectedReceiptTrx !== null}
        onClose={() => setSelectedReceiptTrx(null)}
        transaction={selectedReceiptTrx}
      />

      {/* 4. Dialog Konfirmasi Pembatalan Transaksi */}
      <CancelTransactionDialog
        isOpen={cancellingTrx !== null}
        onClose={() => setCancellingTrx(null)}
        transaction={cancellingTrx}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  )
}
