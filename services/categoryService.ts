import { createClient } from '@/lib/supabase/client'
import { Kategori } from '@/types/pos'
import { INITIAL_KATEGORI } from '@/lib/mockData'

export async function getKategori(): Promise<Kategori[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('kategori')
      .select('*')
      .order('id_kategori', { ascending: true })

    if (error || !data || data.length === 0) {
      return INITIAL_KATEGORI
    }

    return data as Kategori[]
  } catch (err) {
    console.warn('Menggunakan data kategori awal:', err)
    return INITIAL_KATEGORI
  }
}

export async function createKategori(
  id_kategori: string,
  nama_kategori: string
): Promise<Kategori> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('kategori')
    .insert([{ id_kategori, nama_kategori }])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Kategori
}
