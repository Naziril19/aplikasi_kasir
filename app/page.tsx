'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Sidebar } from '@/components/pos/Sidebar'
import { Header } from '@/components/pos/Header'
import { ProductCatalog } from '@/components/pos/ProductCatalog'
import { TransactionPanel } from '@/components/pos/TransactionPanel'
import { AddProductModal } from '@/components/pos/AddProductModal'
import { ConfirmPaymentDialog } from '@/components/pos/ConfirmPaymentDialog'
import { ReceiptModal } from '@/components/pos/ReceiptModal'
import {
  Produk,
  Kategori,
  CartItem,
  MetodePembayaran,
  ProsesTransaksiPayload,
  TodayStats,
} from '@/types/pos'
import { getKategori } from '@/services/categoryService'
import { getProduk } from '@/services/productService'
import { prosesTransaksi, getTodayStats } from '@/services/transactionService'
import { formatRupiah } from '@/lib/utils'
import { toast } from 'sonner'
import { Database, Copy, Check } from 'lucide-react'

export default function CashierPage() {
  // Database data
  const [produk, setProduk] = useState<Produk[]>([])
  const [kategori, setKategori] = useState<Kategori[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats>({
    total_omzet: 0,
    total_transactions: 0,
  })
  const [isDbFallback, setIsDbFallback] = useState(false)
  const [hasCopiedSql, setHasCopiedSql] = useState(false)

  // Catalog filters
  const [selectedKategoriId, setSelectedKategoriId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Transaction state
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerNameOrTable, setCustomerNameOrTable] = useState('')
  const [serviceType, setServiceType] = useState<'Makan di Tempat' | 'Bawa Pulang'>('Makan di Tempat')
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed')
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [taxEnabled, setTaxEnabled] = useState<boolean>(true)
  const [paymentMethod, setPaymentMethod] = useState<MetodePembayaran>('Tunai')
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [paymentReference, setPaymentReference] = useState('')

  // UI Modals & Responsive Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)
  const [completedTransaction, setCompletedTransaction] =
    useState<ProsesTransaksiPayload | null>(null)

  // Load initial data from Supabase on mount
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
          setKategori(cats)
          setProduk(prodResult.produk)
          setIsDbFallback(prodResult.isFallback)
          setTodayStats(stats)
        }
      } catch (err) {
        console.warn('Gagal memuat data awal toko perkakas:', err)
      }
    }

    void fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  // Count products with low stock (<= stok_minimum)
  const lowStockCount = useMemo(() => {
    return produk.filter((p) => p.stok > 0 && p.stok <= p.stok_minimum).length
  }, [produk])

  // Add Product to Cart
  const handleAddToCart = (item: Produk) => {
    if (item.status === 'Nonaktif') {
      toast.error(`Barang "${item.nama_produk}" berstatus Nonaktif dan tidak dapat dijual!`)
      return
    }

    if (item.stok <= 0) {
      toast.error(`Stok ${item.nama_produk} telah habis!`)
      return
    }

    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.produk.id_produk === item.id_produk)
      if (existing) {
        if (existing.jumlah >= item.stok) {
          toast.warning(
            `Kuantitas tidak dapat melebihi sisa stok (${item.stok} ${item.satuan})!`
          )
          return prevCart
        }
        return prevCart.map((ci) =>
          ci.produk.id_produk === item.id_produk
            ? {
                ...ci,
                jumlah: ci.jumlah + 1,
                subtotal: (ci.jumlah + 1) * ci.produk.harga_jual,
              }
            : ci
        )
      } else {
        return [
          ...prevCart,
          {
            produk: item,
            jumlah: 1,
            subtotal: item.harga_jual,
          },
        ]
      }
    })
    toast.success(`${item.nama_produk} dimasukkan ke keranjang`, {
      duration: 1500,
    })
  }

  // Update Item Quantity in Cart
  const handleUpdateQuantity = (id_produk: string, delta: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.produk.id_produk === id_produk)
      if (!existing) return prevCart

      const newQty = existing.jumlah + delta
      if (newQty <= 0) {
        return prevCart.filter((ci) => ci.produk.id_produk !== id_produk)
      }

      if (newQty > existing.produk.stok) {
        toast.warning(
          `Kuantitas tidak dapat melebihi sisa stok (${existing.produk.stok} ${existing.produk.satuan})!`
        )
        return prevCart
      }

      return prevCart.map((ci) =>
        ci.produk.id_produk === id_produk
          ? {
              ...ci,
              jumlah: newQty,
              subtotal: newQty * ci.produk.harga_jual,
            }
          : ci
      )
    })
  }

  // Remove Item from Cart
  const handleRemoveItem = (id_produk: string) => {
    setCart((prevCart) =>
      prevCart.filter((ci) => ci.produk.id_produk !== id_produk)
    )
  }

  // Clear Entire Cart
  const handleClearCart = () => {
    setCart([])
    setDiscountValue(0)
    setCashReceived(0)
    setPaymentReference('')
    setCustomerNameOrTable('')
  }

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    if (subtotal <= 0 || discountValue <= 0) return 0
    if (discountType === 'percentage') {
      const pct = Math.min(100, Math.max(0, discountValue))
      return (subtotal * pct) / 100
    }
    return Math.min(subtotal, discountValue)
  }, [subtotal, discountValue, discountType])

  const taxableAmount = Math.max(0, subtotal - discountAmount)

  const taxAmount = useMemo(() => {
    if (!taxEnabled || taxableAmount <= 0) return 0
    return taxableAmount * 0.11
  }, [taxEnabled, taxableAmount])

  const totalAmount = useMemo(() => {
    return taxableAmount + taxAmount
  }, [taxableAmount, taxAmount])

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'Tunai') return 0
    return Math.max(0, cashReceived - totalAmount)
  }, [paymentMethod, cashReceived, totalAmount])

  // Proceed Payment -> Open Confirmation Dialog
  const handleRequestPayment = () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong!')
      return
    }

    if (paymentMethod === 'Tunai' && cashReceived < totalAmount) {
      toast.error('Nominal uang tunai yang diterima kurang!')
      return
    }

    setIsConfirmDialogOpen(true)
  }

  // Confirm Payment and execute transaction
  const handleConfirmPayment = async () => {
    setIsConfirmDialogOpen(false)
    setIsProcessing(true)

    // Generate Transaction ID and Receipt Number
    const now = new Date()
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '')
    const rand4 = Math.floor(1000 + Math.random() * 9000)
    const idTransaksi = `TRX-${String(Date.now() % 1000000).padStart(6, '0')}`
    const noStruk = `KRS-${yymmdd}-${rand4}`

    const payload: ProsesTransaksiPayload = {
      id_transaksi: idTransaksi,
      no_struk: noStruk,
      subtotal,
      diskon: discountAmount,
      ppn: taxAmount,
      total_harga: totalAmount,
      metode_pembayaran: paymentMethod,
      uang_diterima: paymentMethod === 'Tunai' ? cashReceived : totalAmount,
      uang_kembalian: changeAmount,
      catatan: customerNameOrTable.trim() || undefined,
      items: cart.map((item) => ({
        id_produk: item.produk.id_produk,
        nama_produk: item.produk.nama_produk,
        harga_satuan: item.produk.harga_jual,
        harga_modal_satuan: item.produk.harga_modal,
        jumlah: item.jumlah,
        subtotal: item.subtotal,
      })),
    }

    try {
      const result = await prosesTransaksi(payload)
      if (!result.success) {
        throw new Error(result.error || 'Gagal memproses transaksi')
      }

      // Update local product stock
      setProduk((prev) =>
        prev.map((p) => {
          const item = cart.find((ci) => ci.produk.id_produk === p.id_produk)
          if (item) {
            const nextStock = Math.max(0, p.stok - item.jumlah)
            let sKetersediaan: 'Habis' | 'Stok Menipis' | 'Tersedia' = 'Tersedia'
            if (nextStock === 0) sKetersediaan = 'Habis'
            else if (nextStock <= p.stok_minimum) sKetersediaan = 'Stok Menipis'

            return {
              ...p,
              stok: nextStock,
              status_stok: sKetersediaan,
              total_nilai_aset: p.harga_modal * nextStock,
            }
          }
          return p
        })
      )

      // Update today stats
      setTodayStats((prev) => ({
        total_omzet: prev.total_omzet + totalAmount,
        total_transactions: prev.total_transactions + 1,
      }))

      // Prepare receipt
      setCompletedTransaction(payload)
      setIsReceiptModalOpen(true)
      handleClearCart()

      toast.success(`Transaksi #${noStruk} berhasil diselesaikan!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Transaksi gagal: ${msg}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle New Product Created
  const handleProductCreated = (newProd: Produk) => {
    setProduk((prev) => [newProd, ...prev])
  }

  // Handle New Category Created
  const handleCategoryCreated = (newCat: Kategori) => {
    setKategori((prev) => [...prev, newCat])
  }

  // Copy SQL script info
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
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Header */}
        <Header
          onOpenAddProduct={() => setIsAddModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Database setup notification banner if tables not yet created in Supabase */}
        {isDbFallback && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Mode Dataset 60 Barang Aktif:</strong> Skema toko perkakas siap di-deploy ke Supabase. Jalankan file{' '}
                <code className="bg-amber-200/60 px-1.5 py-0.5 rounded font-mono font-bold">
                  supabase_setup.sql
                </code>{' '}
                di Supabase SQL Editor agar 7 tabel, trigger, dan seluruh 60 barang tersimpan langsung di PostgreSQL.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopySqlInfo}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-amber-50 border border-amber-300 rounded-lg font-semibold text-[11px] text-amber-800 transition-colors cursor-pointer shrink-0 ml-4 shadow-2xs"
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

        {/* Product Catalog */}
        <ProductCatalog
          produk={produk}
          kategori={kategori}
          selectedKategoriId={selectedKategoriId}
          onSelectKategori={setSelectedKategoriId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={handleAddToCart}
        />

        {/* Floating Mobile Cart Bar (Hanya tampil di mobile/tablet < xl ketika keranjang ada isinya) */}
        {cart.length > 0 && !isMobileCartOpen && (
          <div className="xl:hidden fixed bottom-4 left-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full bg-[#2A1810] hover:bg-[#3D2314] active:scale-[0.99] text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between transition-all cursor-pointer border border-[#3D2314]/80"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs text-white">
                  {cart.reduce((a, b) => a + b.jumlah, 0)}
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs sm:text-sm">Lihat Pesanan</p>
                  <p className="text-[11px] text-stone-300">
                    {cart.length} jenis perkakas dipilih
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm sm:text-base">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 3. Right Transaction Panel (Desktop & Mobile Drawer) */}
      <TransactionPanel
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        customerNameOrTable={customerNameOrTable}
        onCustomerNameChange={setCustomerNameOrTable}
        serviceType={serviceType}
        onServiceTypeChange={setServiceType}
        discountType={discountType}
        onDiscountTypeChange={setDiscountType}
        discountValue={discountValue}
        onDiscountValueChange={setDiscountValue}
        taxEnabled={taxEnabled}
        onTaxEnabledChange={setTaxEnabled}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        cashReceived={cashReceived}
        onCashReceivedChange={setCashReceived}
        paymentReference={paymentReference}
        onPaymentReferenceChange={setPaymentReference}
        onProceedPayment={handleRequestPayment}
        isProcessing={isProcessing}
        isMobileOpen={isMobileCartOpen}
        onCloseMobile={() => setIsMobileCartOpen(false)}
      />

      {/* 4. Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        kategori={kategori}
        existingProductCount={produk.length}
        onKategoriCreated={handleCategoryCreated}
        onProductCreated={handleProductCreated}
      />

      <ConfirmPaymentDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmPayment}
        totalAmount={totalAmount}
        paymentMethod={paymentMethod}
        amountReceived={cashReceived}
        changeAmount={changeAmount}
        itemsCount={cart.reduce((a, b) => a + b.jumlah, 0)}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={completedTransaction}
      />
    </div>
  )
}
