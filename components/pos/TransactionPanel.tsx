'use client'

import React, { useState, useMemo } from 'react'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  QrCode,
  CreditCard,
  Building2,
  Banknote,
  X,
} from 'lucide-react'
import { CartItem, MetodePembayaran } from '@/types/pos'
import { formatRupiah, formatNumber, cn } from '@/lib/utils'

interface TransactionPanelProps {
  cart: CartItem[]
  onUpdateQuantity: (id_produk: string, delta: number) => void
  onRemoveItem: (id_produk: string) => void
  onClearCart: () => void
  customerNameOrTable: string
  onCustomerNameChange: (val: string) => void
  serviceType?: 'Makan di Tempat' | 'Bawa Pulang'
  onServiceTypeChange?: (val: 'Makan di Tempat' | 'Bawa Pulang') => void
  discountType: 'fixed' | 'percentage'
  onDiscountTypeChange: (val: 'fixed' | 'percentage') => void
  discountValue: number
  onDiscountValueChange: (val: number) => void
  taxEnabled: boolean
  onTaxEnabledChange: (val: boolean) => void
  paymentMethod: MetodePembayaran
  onPaymentMethodChange: (val: MetodePembayaran) => void
  cashReceived: number
  onCashReceivedChange: (val: number) => void
  paymentReference: string
  onPaymentReferenceChange: (val: string) => void
  onProceedPayment: () => void
  isProcessing: boolean
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function TransactionPanel({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  customerNameOrTable,
  onCustomerNameChange,
  serviceType = 'Makan di Tempat',
  onServiceTypeChange,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  taxEnabled,
  onTaxEnabledChange,
  paymentMethod,
  onPaymentMethodChange,
  cashReceived,
  onCashReceivedChange,
  paymentReference,
  onPaymentReferenceChange,
  onProceedPayment,
  isProcessing,
  isMobileOpen = false,
  onCloseMobile,
}: TransactionPanelProps) {
  const [discountInput, setDiscountInput] = useState<string>(
    discountValue > 0 ? String(discountValue) : ''
  )
  const [cashInput, setCashInput] = useState<string>(
    cashReceived > 0 ? String(cashReceived) : ''
  )

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }, [cart])

  // Discount calculation
  const discountAmount = useMemo(() => {
    if (subtotal <= 0 || discountValue <= 0) return 0
    if (discountType === 'percentage') {
      const pct = Math.min(100, Math.max(0, discountValue))
      return (subtotal * pct) / 100
    }
    return Math.min(subtotal, discountValue)
  }, [subtotal, discountValue, discountType])

  const taxableAmount = Math.max(0, subtotal - discountAmount)

  // Tax 11% calculation
  const taxAmount = useMemo(() => {
    if (!taxEnabled || taxableAmount <= 0) return 0
    return taxableAmount * 0.11
  }, [taxEnabled, taxableAmount])

  // Total final amount
  const totalAmount = useMemo(() => {
    return taxableAmount + taxAmount
  }, [taxableAmount, taxAmount])

  // Change amount
  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'Tunai') return 0
    return Math.max(0, cashReceived - totalAmount)
  }, [paymentMethod, cashReceived, totalAmount])

  const isCashInsufficient =
    paymentMethod === 'Tunai' && cart.length > 0 && cashReceived < totalAmount

  const isCartEmpty = cart.length === 0
  const canPay = !isCartEmpty && !isCashInsufficient && !isProcessing

  // Handle Quick Cash Buttons
  const handleQuickCash = (amount: number) => {
    onCashReceivedChange(amount)
    setCashInput(String(amount))
  }

  const handleExactCash = () => {
    onCashReceivedChange(totalAmount)
    setCashInput(String(totalAmount))
  }

  // Handle Discount change
  const handleDiscountChange = (valStr: string) => {
    const cleanDigits = valStr.replace(/\D/g, '')
    if (!cleanDigits) {
      setDiscountInput('')
      onDiscountValueChange(0)
      return
    }
    const parsed = parseInt(cleanDigits, 10) || 0
    if (discountType === 'percentage') {
      const clamped = Math.min(100, parsed)
      setDiscountInput(String(clamped))
      onDiscountValueChange(clamped)
    } else {
      const MAX_DISCOUNT = 1_000_000_000
      const clamped = Math.min(MAX_DISCOUNT, parsed)
      setDiscountInput(String(clamped))
      onDiscountValueChange(clamped)
    }
  }

  // Handle Cash Input change (Mendukung pengisian nominal hingga Rp 1.000.000.000 / 1 Miliar)
  const handleCashChange = (valStr: string) => {
    // 1. Ambil karakter angka murni (buang pemisah titik atau karakter non-digit)
    const cleanDigits = valStr.replace(/\D/g, '')

    if (!cleanDigits) {
      setCashInput('')
      onCashReceivedChange(0)
      return
    }

    // 2. Parse sebagai integer murni dan batasi hingga 1 Miliar (Rp 1.000.000.000)
    const parsed = parseInt(cleanDigits, 10) || 0
    const MAX_CASH = 1_000_000_000
    const finalAmount = Math.min(parsed, MAX_CASH)

    // 3. Simpan nilai angka bersih tanpa titik
    setCashInput(String(finalAmount))
    onCashReceivedChange(finalAmount)
  }

  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.jumlah, 0)

  const renderPanelContent = (isMobile = false) => (
    <>
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Header Pesanan */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              Pesanan Saat Ini
            </h2>
            <p className="text-xs text-stone-400">
              {isCartEmpty
                ? 'Belum ada item perkakas'
                : `${totalItemsCount} item (${cart.length} jenis barang)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isCartEmpty && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-stone-400 hover:text-rose-600 font-medium transition-colors cursor-pointer flex items-center gap-1 p-1"
                title="Kosongkan Keranjang"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kosongkan</span>
              </button>
            )}

            {isMobile && onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors xl:hidden cursor-pointer"
                title="Tutup Panel"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Pelanggan & Tipe Layanan */}
        <div className="space-y-2">
          <input
            type="text"
            value={customerNameOrTable}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Nama pelanggan atau nomor meja (opsional)"
            style={{ color: '#1c1917' }}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs md:text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20 focus:border-[#3D2314] transition-all select-text"
          />

          <div className="grid grid-cols-2 gap-1 p-1 bg-[#EFEAE2] rounded-xl border border-[#E4DDD3]">
            <button
              type="button"
              onClick={() => onServiceTypeChange?.('Makan di Tempat')}
              className={cn(
                'py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center',
                serviceType === 'Makan di Tempat'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              )}
            >
              Makan di Tempat
            </button>
            <button
              type="button"
              onClick={() => onServiceTypeChange?.('Bawa Pulang')}
              className={cn(
                'py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center',
                serviceType === 'Bawa Pulang'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              )}
            >
              Bawa Pulang
            </button>
          </div>
        </div>

        {/* Cart Items List or Empty State */}
        <div className="min-h-[160px]">
          {isCartEmpty ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F6F1EC] text-[#9A7B69] flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="font-semibold text-stone-800 text-sm mb-1">
                Keranjang masih kosong
              </h3>
              <p className="text-xs text-stone-400 max-w-[260px] leading-relaxed">
                Pilih perkakas di sebelah kiri untuk mulai mencatat transaksi penjualan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                const maxStock = item.produk.stok
                return (
                  <div
                    key={item.produk.id_produk}
                    className="p-3 bg-stone-50/70 border border-stone-200/80 rounded-xl flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono font-bold bg-stone-200 text-stone-700 px-1 rounded">
                          {item.produk.id_produk}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {item.produk.satuan}
                        </span>
                      </div>
                      <h4 className="font-semibold text-stone-900 text-sm truncate">
                        {item.produk.nama_produk}
                      </h4>
                      <p className="text-xs text-stone-400">
                        {formatRupiah(item.produk.harga_jual)} / {item.produk.satuan}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.produk.id_produk, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-sm text-stone-900">
                        {item.jumlah}
                      </span>
                      <button
                        type="button"
                        disabled={item.jumlah >= maxStock}
                        onClick={() => onUpdateQuantity(item.produk.id_produk, 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title={item.jumlah >= maxStock ? `Maksimal stok: ${maxStock}` : ''}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.produk.id_produk)}
                        className="w-7 h-7 ml-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right shrink-0 w-22">
                      <span className="font-bold text-sm text-stone-900">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Diskon & PPN */}
        <div className="pt-3 border-t border-stone-100 space-y-3">
          <div className="flex items-center gap-3">
            {/* Diskon control */}
            <div className="flex-1 flex items-center bg-stone-50 border border-stone-200/90 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#3D2314]/20 focus-within:border-[#3D2314]">
              <button
                type="button"
                onClick={() =>
                  onDiscountTypeChange(
                    discountType === 'fixed' ? 'percentage' : 'fixed'
                  )
                }
                className="px-3 py-2 bg-stone-100 text-stone-600 hover:bg-stone-200 text-xs font-bold border-r border-stone-200 transition-colors cursor-pointer"
                title="Beralih antara Rp dan %"
              >
                {discountType === 'fixed' ? 'Rp' : '%'}
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={
                  discountType === 'percentage'
                    ? (discountValue > 0 ? String(discountValue) : discountInput)
                    : (discountValue > 0
                        ? formatNumber(discountValue)
                        : discountInput
                        ? formatNumber(parseInt(discountInput.replace(/\D/g, ''), 10) || 0)
                        : '')
                }
                onChange={(e) => handleDiscountChange(e.target.value)}
                placeholder="Diskon"
                style={{ color: '#1c1917' }}
                className="w-full px-3 py-2 bg-transparent text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-hidden select-text"
              />
            </div>

            {/* Checkbox PPN 11% */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-stone-700 shrink-0">
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(e) => onTaxEnabledChange(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-[#3D2314] focus:ring-[#3D2314] cursor-pointer"
              />
              <span>PPN 11%</span>
            </label>
          </div>

          {/* Subtotal & Breakdown */}
          <div className="space-y-1.5 text-xs text-stone-500 pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-stone-800">
                {formatRupiah(subtotal)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>
                  Diskon ({discountType === 'percentage' ? `${discountValue}%` : 'Nominal'})
                </span>
                <span className="font-medium">
                  - {formatRupiah(discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>PPN (11%)</span>
              <span className="font-medium text-stone-800">
                {formatRupiah(taxAmount)}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-stone-100">
              <span className="text-base font-bold text-stone-900">Total</span>
              <span className="text-2xl font-extrabold text-stone-900 tracking-tight">
                {formatRupiah(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Metode Pembayaran */}
        <div className="pt-3 border-t border-stone-100 space-y-3">
          <label className="text-xs font-semibold text-stone-500 block">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { id: 'Tunai', label: 'Tunai', icon: Banknote },
                { id: 'QRIS', label: 'QRIS', icon: QrCode },
                { id: 'Transfer', label: 'Transfer', icon: Building2 },
                { id: 'Kartu', label: 'Kartu', icon: CreditCard },
              ] as const
            ).map((m) => {
              const isSelected = paymentMethod === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onPaymentMethodChange(m.id)}
                  className={cn(
                    'py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer',
                    isSelected
                      ? 'bg-[#3D2314] text-white shadow-xs'
                      : 'bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-50'
                  )}
                >
                  <m.icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>

          {/* Cash Payment Specifics */}
          {paymentMethod === 'Tunai' ? (
            <div className="space-y-2 pt-1">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    cashReceived > 0
                      ? formatNumber(cashReceived)
                      : cashInput
                      ? formatNumber(parseInt(cashInput.replace(/\D/g, ''), 10) || 0)
                      : ''
                  }
                  onChange={(e) => handleCashChange(e.target.value)}
                  placeholder="Nominal Uang Diterima"
                  style={{ color: '#1c1917' }}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200/90 rounded-xl text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20 focus:border-[#3D2314] select-text"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-semibold text-stone-700">
                <button
                  type="button"
                  onClick={() => handleQuickCash(50000)}
                  className="py-1.5 px-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-center transition-colors cursor-pointer"
                >
                  50.000
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(100000)}
                  className="py-1.5 px-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-center transition-colors cursor-pointer"
                >
                  100.000
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(150000)}
                  className="py-1.5 px-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-center transition-colors cursor-pointer"
                >
                  150.000
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(200000)}
                  className="py-1.5 px-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-center transition-colors cursor-pointer"
                >
                  200.000
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleExactCash}
                  className="text-xs font-medium text-[#3D2314] hover:underline cursor-pointer"
                >
                  Gunakan Uang Pas ({formatRupiah(totalAmount)})
                </button>

                <div className="text-right">
                  <span className="text-xs text-stone-400 mr-2">Kembalian:</span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      changeAmount > 0
                        ? 'text-emerald-600'
                        : isCashInsufficient
                        ? 'text-rose-500'
                        : 'text-stone-700'
                    )}
                  >
                    {isCashInsufficient
                      ? `Kurang ${formatRupiah(totalAmount - cashReceived)}`
                      : formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => onPaymentReferenceChange(e.target.value)}
                placeholder={`Nomor referensi / approval code ${paymentMethod} (opsional)`}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200/90 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Payment Button */}
      <div className="p-6 border-t border-stone-200/80 bg-white">
        <button
          type="button"
          disabled={!canPay}
          onClick={onProceedPayment}
          className={cn(
            'w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-sm flex items-center justify-center gap-2',
            isCartEmpty
              ? 'bg-[#E3DAD0] text-[#9A8B7E] cursor-not-allowed'
              : isCashInsufficient
              ? 'bg-rose-100 text-rose-600 cursor-not-allowed'
              : 'bg-[#3D2314] hover:bg-[#2C190E] active:scale-[0.99] text-white shadow-md cursor-pointer'
          )}
        >
          {isProcessing ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Memproses Penjualan...
            </span>
          ) : isCartEmpty ? (
            'Pilih Perkakas Terlebih Dahulu'
          ) : isCashInsufficient ? (
            'Uang Pembayaran Masih Kurang'
          ) : (
            `Selesaikan Pembayaran · ${formatRupiah(totalAmount)}`
          )}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* 1. Desktop Fixed Right Panel (Visible on xl and above) */}
      <aside className="hidden xl:flex w-[380px] 2xl:w-[460px] h-screen bg-white border-l border-stone-200/90 flex-col justify-between shrink-0 overflow-hidden shadow-xs">
        {renderPanelContent(false)}
      </aside>

      {/* 2. Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs xl:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* 3. Mobile Slide-Over Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] max-w-full h-full bg-white flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out xl:hidden',
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {renderPanelContent(true)}
      </aside>
    </>
  )
}
