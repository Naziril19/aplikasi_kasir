'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Sidebar } from '@/components/pos/Sidebar'
import { Header } from '@/components/pos/Header'
import { ProductStatsCards } from '@/components/produk/ProductStatsCards'
import { ProductFilterBar, StockFilterType } from '@/components/produk/ProductFilterBar'
import { ProductTable } from '@/components/produk/ProductTable'
import { AddProductModal } from '@/components/pos/AddProductModal'
import { EditProductModal } from '@/components/produk/EditProductModal'
import { DeleteProductDialog } from '@/components/produk/DeleteProductDialog'
import { Produk, Kategori, TodayStats } from '@/types/pos'
import {
  getProduk,
  quickAdjustStok,
  calculateProductStats,
} from '@/services/productService'
import { getKategori } from '@/services/categoryService'
import { getTodayStats } from '@/services/transactionService'
import { toast } from 'sonner'
import { Database, Copy, Check } from 'lucide-react'

export default function ProductManagementPage() {
  // State data dari Supabase
  const [products, setProducts] = useState<Produk[]>([])
  const [categories, setCategories] = useState<Kategori[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats>({
    total_omzet: 0,
    total_transactions: 0,
  })
  const [isDbFallback, setIsDbFallback] = useState(false)
  const [hasCopiedSql, setHasCopiedSql] = useState(false)

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKategoriId, setSelectedKategoriId] = useState<string | null>(null)
  const [stockFilter, setStockFilter] = useState<StockFilterType>('all')

  // Modals & Dialog State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Produk | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Produk | null>(null)
  const [adjustingStockId, setAdjustingStockId] = useState<string | null>(null)

  // Load Initial Data
  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        const [cats, prodResult, stats] = await Promise.all([
          getKategori(),
          getProduk(),
          getTodayStats(),
        ])
        if (isMounted) {
          setCategories(cats)
          setProducts(prodResult.produk)
          setIsDbFallback(prodResult.isFallback)
          setTodayStats(stats)
        }
      } catch (err) {
        console.warn('Gagal memuat data produk:', err)
      }
    }

    void fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  // Calculate live statistics
  const stats = useMemo(() => {
    return calculateProductStats(products)
  }, [products])

  // Count low stock for sidebar
  const lowStockCount = stats.stok_menipis

  // Filter products by search, category, and stock status
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search filter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.nama_produk.toLowerCase().includes(q) ||
        p.id_produk.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))

      // 2. Category filter
      const matchesCategory =
        !selectedKategoriId || p.id_kategori === selectedKategoriId

      // 3. Stock status filter
      let matchesStock = true
      if (stockFilter === 'low') {
        matchesStock = p.stok > 0 && p.stok <= p.stok_minimum
      } else if (stockFilter === 'empty') {
        matchesStock = p.stok === 0
      }

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [products, searchQuery, selectedKategoriId, stockFilter])

  // Quick adjust stock handler (+1 / -1)
  const handleQuickAdjustStock = async (id_produk: string, delta: number) => {
    setAdjustingStockId(id_produk)
    try {
      const result = await quickAdjustStok(id_produk, delta)
      setProducts((prev) =>
        prev.map((item) =>
          item.id_produk === id_produk
            ? {
                ...item,
                stok: result.newStock,
                status_stok: result.status_stok,
                total_nilai_aset: item.harga_modal * result.newStock,
              }
            : item
        )
      )
      toast.success(
        `Stok ${id_produk} berhasil ${delta > 0 ? 'ditambah' : 'dikurangi'} (Stok: ${result.newStock})`,
        { duration: 1500 }
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Gagal menyesuaikan stok: ${msg}`)
    } finally {
      setAdjustingStockId(null)
    }
  }

  // Handle product created
  const handleProductCreated = (newProd: Produk) => {
    setProducts((prev) => [newProd, ...prev])
  }

  // Handle category created
  const handleCategoryCreated = (newCat: Kategori) => {
    setCategories((prev) => [...prev, newCat])
  }

  // Handle product updated
  const handleProductUpdated = (updatedProd: Produk) => {
    setProducts((prev) =>
      prev.map((p) => (p.id_produk === updatedProd.id_produk ? updatedProd : p))
    )
  }

  // Handle product deleted
  const handleProductDeleted = (id_produk: string, softDeleted: boolean) => {
    if (softDeleted) {
      setProducts((prev) =>
        prev.map((p) => (p.id_produk === id_produk ? { ...p, status: 'Nonaktif' } : p))
      )
    } else {
      setProducts((prev) => prev.filter((p) => p.id_produk !== id_produk))
    }
  }

  // Copy SQL file info
  const handleCopySqlInfo = () => {
    navigator.clipboard.writeText('supabase_setup.sql')
    setHasCopiedSql(true)
    setTimeout(() => setHasCopiedSql(false), 2000)
    toast.info('Nama file "supabase_setup.sql" disalin! Jalankan di SQL Editor Supabase.')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF7F2]">
      {/* 1. Left Sidebar (Responsive Desktop & Mobile Drawer) */}
      <Sidebar
        lowStockCount={lowStockCount}
        todayStats={todayStats}
        activeMenu="produk"
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <Header
          breadcrumb="Karsa Kasir / Produk"
          title="Manajemen Produk"
          showAddButton={false}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Database setup notification banner if tables not yet created in Supabase */}
        {isDbFallback && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Mode Dataset 60 Barang Aktif:</strong> Data dimuat dari dataset perkakas. Jalankan script{' '}
                <code className="bg-amber-200/60 px-1.5 py-0.5 rounded font-mono font-bold">
                  supabase_setup.sql
                </code>{' '}
                di Supabase SQL Editor untuk sinkronisasi live ke PostgreSQL.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopySqlInfo}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-amber-50 border border-amber-300 rounded-lg font-semibold text-[11px] text-amber-800 transition-colors cursor-pointer shrink-0 ml-0 sm:ml-4 shadow-2xs"
            >
              {hasCopiedSql ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Nama File</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Page Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          {/* Ringkasan Informasi Produk (4 Statistik Card) */}
          <ProductStatsCards stats={stats} />

          {/* Search Bar, Filter Kategori, Segmented Control Stok, & Tambah Produk */}
          <ProductFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            kategoriList={categories}
            selectedKategoriId={selectedKategoriId}
            onSelectKategori={setSelectedKategoriId}
            stockFilter={stockFilter}
            onStockFilterChange={setStockFilter}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />

          {/* Tabel Manajemen Produk */}
          <ProductTable
            products={filteredProducts}
            onQuickAdjustStock={handleQuickAdjustStock}
            onEditProduct={(p) => setEditingProduct(p)}
            onDeleteProduct={(p) => setDeletingProduct(p)}
            isAdjustingId={adjustingStockId}
          />
        </div>
      </div>

      {/* 3. Modal Form Tambah Produk */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        kategori={categories}
        existingProductCount={products.length}
        onKategoriCreated={handleCategoryCreated}
        onProductCreated={handleProductCreated}
      />

      {/* 4. Modal Form Edit Produk */}
      <EditProductModal
        key={editingProduct?.id_produk ?? 'none'}
        isOpen={editingProduct !== null}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        kategori={categories}
        onKategoriCreated={handleCategoryCreated}
        onProductUpdated={handleProductUpdated}
      />

      {/* 5. Dialog Konfirmasi Hapus Produk */}
      <DeleteProductDialog
        isOpen={deletingProduct !== null}
        onClose={() => setDeletingProduct(null)}
        product={deletingProduct}
        onProductDeleted={handleProductDeleted}
      />
    </div>
  )
}
