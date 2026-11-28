'use client'

import React, { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/pos/Sidebar'
import { Header } from '@/components/pos/Header'
import { ReportPeriodFilter } from '@/components/laporan/ReportPeriodFilter'
import { ReportStatsCards } from '@/components/laporan/ReportStatsCards'
import { SalesTrendChart } from '@/components/laporan/SalesTrendChart'
import { TopProductsCard } from '@/components/laporan/TopProductsCard'
import { PaymentMethodsCard } from '@/components/laporan/PaymentMethodsCard'
import { ReportPeriodType, SalesReportData, TodayStats } from '@/types/pos'
import { getSalesReport, exportSalesReportToCSV } from '@/services/reportService'
import { getTodayStats } from '@/services/transactionService'
import { getProduk, calculateProductStats } from '@/services/productService'
import { toast } from 'sonner'

export default function LaporanPenjualanPage() {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // State Filter Periode Laporan (Default 7 Hari Terakhir)
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriodType>('7days')
  const [reportData, setReportData] = useState<SalesReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Sidebar info: stok menipis & omzet hari ini
  const [lowStockCount, setLowStockCount] = useState(0)
  const [todayStats, setTodayStats] = useState<TodayStats>({
    total_omzet: 0,
    total_transactions: 0,
  })

  // Load sidebar initial metadata
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
      } catch (err) {
        console.warn('Gagal memuat data sidebar:', err)
      }
    }

    void fetchSidebarInfo()

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch data laporan penjualan saat periode berubah
  const fetchReport = useCallback(async (period: ReportPeriodType) => {
    setIsLoading(true)
    try {
      const data = await getSalesReport(period)
      setReportData(data)
    } catch (err) {
      console.warn('Gagal memuat data laporan:', err)
      toast.error('Gagal memuat data laporan penjualan')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    startTransition(() => {
      void fetchReport(selectedPeriod)
    })
  }, [selectedPeriod, fetchReport])

  // Handle Export CSV
  const handleExportCSV = () => {
    if (!reportData || reportData.transactions.length === 0) {
      toast.info('Tidak ada data transaksi selesai untuk diekspor pada periode ini.')
      return
    }

    try {
      setIsExporting(true)
      exportSalesReportToCSV(reportData)
      toast.success(
        `Laporan periode ${reportData.periodLabel} (${reportData.transactions.length} transaksi) berhasil diunduh!`
      )
    } catch {
      toast.error('Gagal mengekspor laporan CSV')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF7F2]">
      {/* 1. Left Sidebar (Responsive Desktop & Mobile Drawer) */}
      <Sidebar
        lowStockCount={lowStockCount}
        todayStats={todayStats}
        activeMenu="laporan"
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <Header
          breadcrumb="Karsa Kasir / Laporan"
          title="Laporan Penjualan"
          showAddButton={true}
          onOpenAddProduct={() => router.push('/produk')}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Page Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          {/* Filter Periode Laporan & Tombol Unduh CSV */}
          <ReportPeriodFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            onExportCSV={handleExportCSV}
            isExporting={isExporting}
          />

          {isLoading || !reportData ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-400">
              <div className="w-10 h-10 border-4 border-[#2A1810] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-medium text-stone-500">
                Memuat data performa penjualan...
              </p>
            </div>
          ) : (
            <>
              {/* Ringkasan Statistik (4 Kartu KPI) */}
              <ReportStatsCards
                kpi={reportData.kpi}
                periodLabel={reportData.periodLabel}
              />

              {/* Grafik Tren Penjualan Interaktif (Recharts AreaChart) */}
              <SalesTrendChart
                trendData={reportData.trend}
                periodLabel={reportData.periodLabel}
              />

              {/* Bagian Bawah: Produk Terlaris & Distribusi Metode Pembayaran */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                {/* Kartu Produk Terlaris */}
                <TopProductsCard products={reportData.topProducts} />

                {/* Kartu Metode Pembayaran (Donut Chart) */}
                <PaymentMethodsCard
                  paymentMethods={reportData.paymentMethods}
                  totalTransactions={reportData.kpi.transaksi_berhasil}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
