'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Upload, Plus, Image as ImageIcon, Check, Barcode as BarcodeIcon, Lock } from 'lucide-react'
import { Kategori, Produk, StatusProduk } from '@/types/pos'
import { formatRupiah, getProductImageUrl } from '@/lib/utils'
import { updateProduk, uploadProductImage } from '@/services/productService'
import { createKategori } from '@/services/categoryService'
import { toast } from 'sonner'

const editProductSchema = z.object({
  barcode: z.string().length(13, 'Barcode harus berupa 13 digit EAN-13'),
  nama_produk: z.string().min(2, 'Nama barang minimal 2 karakter'),
  id_kategori: z.string().min(1, 'Pilih salah satu kategori'),
  satuan: z.string().min(1, 'Satuan barang wajib diisi'),
  harga_modal: z.number().min(0, 'Harga modal tidak boleh negatif'),
  harga_jual: z.number().min(0, 'Harga jual tidak boleh negatif'),
  stok: z.number().int().min(0, 'Stok tidak boleh negatif'),
  stok_minimum: z.number().int().min(0, 'Stok minimum tidak boleh negatif'),
  status: z.enum(['Aktif', 'Nonaktif']),
})

type EditProductFormData = z.infer<typeof editProductSchema>

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Produk | null
  kategori: Kategori[]
  onKategoriCreated: (kategori: Kategori) => void
  onProductUpdated: (produk: Produk) => void
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
  kategori,
  onKategoriCreated,
  onProductUpdated,
}: EditProductModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Inline new category state
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isSubmittingCat, setIsSubmittingCat] = useState(false)

  const previewUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile)
    }
    return product?.foto_produk ? getProductImageUrl(product.foto_produk) : null
  }, [selectedFile, product])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    values: product
      ? {
          barcode: product.barcode || '',
          nama_produk: product.nama_produk || '',
          id_kategori: product.id_kategori || '',
          satuan: product.satuan || 'Pcs',
          harga_modal: Number(product.harga_modal) || 0,
          harga_jual: Number(product.harga_jual) || 0,
          stok: Number(product.stok) || 0,
          stok_minimum: Number(product.stok_minimum) || 0,
          status: product.status || 'Aktif',
        }
      : undefined,
  })

  const watchedCostPrice = useWatch({ control, name: 'harga_modal' }) || 0
  const watchedSellingPrice = useWatch({ control, name: 'harga_jual' }) || 0
  const watchedStock = useWatch({ control, name: 'stok' }) || 0

  // Perhitungan Otomatis Sesuai Spesifikasi Dataset
  const marginRp = useMemo(() => {
    return watchedSellingPrice - watchedCostPrice
  }, [watchedSellingPrice, watchedCostPrice])

  const marginPersen = useMemo(() => {
    if (watchedCostPrice <= 0) return 0
    return Math.round(((marginRp / watchedCostPrice) * 100) * 100) / 100
  }, [marginRp, watchedCostPrice])

  const totalNilaiAset = useMemo(() => {
    return watchedCostPrice * watchedStock
  }, [watchedCostPrice, watchedStock])

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      toast.error('Format gambar harus JPG, PNG, atau WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB.')
      return
    }

    setSelectedFile(file)
  }

  // Handle inline category creation
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('Nama kategori tidak boleh kosong')
      return
    }
    setIsSubmittingCat(true)
    try {
      const nextId = `KAT-${String(kategori.length + 1).padStart(3, '0')}`
      const created = await createKategori(nextId, newCatName.trim())
      onKategoriCreated(created)
      setValue('id_kategori', created.id_kategori)
      setNewCatName('')
      setShowAddCat(false)
      toast.success(`Kategori "${created.nama_kategori}" berhasil ditambahkan!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Gagal membuat kategori: ${msg}`)
    } finally {
      setIsSubmittingCat(false)
    }
  }

  // Form submit
  const onSubmit = async (data: EditProductFormData) => {
    if (!product) return
    setIsUploading(true)

    try {
      let fotoPath = product.foto_produk

      // Jika ada file gambar baru yang diunggah
      if (selectedFile) {
        try {
          fotoPath = await uploadProductImage(selectedFile, product.id_produk)
        } catch (uploadErr) {
          console.warn('Storage upload error:', uploadErr)
          fotoPath = selectedFile.name
        }
      }

      const updated = await updateProduk(product.id_produk, {
        barcode: data.barcode.trim(),
        nama_produk: data.nama_produk.trim(),
        id_kategori: data.id_kategori,
        satuan: data.satuan.trim(),
        harga_modal: data.harga_modal,
        harga_jual: data.harga_jual,
        stok: data.stok,
        stok_minimum: data.stok_minimum,
        foto_produk: fotoPath,
        status: data.status as StatusProduk,
      })

      const catObj = kategori.find((c) => c.id_kategori === data.id_kategori)
      if (catObj) {
        updated.kategori = catObj
        updated.nama_kategori = catObj.nama_kategori
      }

      toast.success(`Perubahan barang "${updated.nama_produk}" berhasil disimpan!`)
      onProductUpdated(updated)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Gagal memperbarui produk: ${msg}`)
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="font-bold text-lg text-stone-900 tracking-tight">
              Edit Data Barang Perkakas
            </h3>
            <p className="text-xs text-stone-500">
              Perbarui rincian harga, stok, atau kategori produk.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200/60 flex items-center justify-center text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Baris 1: Kode Barang (Locked) & Barcode EAN-13 */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 mb-1">
                <span>Kode Barang (SKU)</span>
                <Lock className="w-3 h-3 text-stone-400" />
              </label>
              <div className="px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm font-mono font-bold text-stone-600 select-all cursor-not-allowed">
                {product.id_produk}
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Kode barang bersifat permanen.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Barcode (EAN-13) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <BarcodeIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={13}
                  {...register('barcode')}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-mono text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20"
                />
              </div>
              {errors.barcode && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.barcode.message}</p>
              )}
            </div>
          </div>

          {/* Nama Barang */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Nama Barang Perkakas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('nama_produk')}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20 focus:border-[#3D2314]"
            />
            {errors.nama_produk && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.nama_produk.message}</p>
            )}
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="text-[11px] font-semibold text-[#3D2314] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Kategori Baru</span>
                </button>
              </div>

              {showAddCat && (
                <div className="mb-2 p-2 bg-[#F6F1EC] rounded-xl flex items-center gap-2 border border-[#E5DACF]">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nama kategori..."
                    className="flex-1 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    disabled={isSubmittingCat}
                    onClick={handleCreateCategory}
                    className="px-2.5 py-1 bg-[#3D2314] text-white rounded-lg text-xs font-semibold hover:bg-[#2C190E] cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              )}

              <select
                {...register('id_kategori')}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20"
              >
                {kategori.map((cat) => (
                  <option key={cat.id_kategori} value={cat.id_kategori}>
                    {cat.nama_kategori}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Satuan <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('satuan')}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20"
              >
                <option value="Pcs">Pcs</option>
                <option value="Pouch">Pouch</option>
                <option value="Bks">Bks</option>
                <option value="Kaleng">Kaleng</option>
                <option value="Kotak">Kotak</option>
                <option value="Btl">Btl</option>
                <option value="Pack">Pack</option>
                <option value="Tube">Tube</option>
                <option value="Box">Box</option>
                <option value="Strip">Strip</option>
                <option value="Lusin">Lusin</option>
                <option value="Rim">Rim</option>
              </select>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Harga Beli (Modal) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  Rp
                </span>
                <input
                  type="number"
                  {...register('harga_modal', { valueAsNumber: true })}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Harga Jual <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  Rp
                </span>
                <input
                  type="number"
                  {...register('harga_jual', { valueAsNumber: true })}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20"
                />
              </div>
            </div>
          </div>

          {/* Info Card: Margin Otomatis & Total Nilai Aset */}
          <div className="p-3 bg-stone-50 border border-stone-200/90 rounded-xl grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-stone-500 block">Margin (Rp)</span>
              <span className="font-bold text-stone-900 text-sm">
                {formatRupiah(marginRp)}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block">Margin (%)</span>
              <span className="font-bold text-emerald-700 text-sm">
                {marginPersen}%
              </span>
            </div>
            <div>
              <span className="text-stone-500 block">Nilai Aset</span>
              <span className="font-bold text-stone-900 text-sm">
                {formatRupiah(totalNilaiAset)}
              </span>
            </div>
          </div>

          {/* Stok & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Stok Saat Ini <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                {...register('stok', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Stok Minimum <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                {...register('stok_minimum', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#3D2314]/20"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Foto Produk */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Foto Produk (Upload ke Storage Bucket &apos;produk&apos;)
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-stone-300" />
                )}
              </div>

              <label className="flex-1 border border-dashed border-stone-300 hover:border-[#3D2314] rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer bg-stone-50/50 hover:bg-stone-50 transition-colors">
                <Upload className="w-4 h-4 text-stone-500" />
                <span className="text-xs font-medium text-stone-700 truncate max-w-[280px]">
                  {selectedFile ? selectedFile.name : 'Ganti foto gambar perkakas'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-[#3D2314] hover:bg-[#2C190E] active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
