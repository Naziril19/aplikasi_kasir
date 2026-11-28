'use client'

import React, { useSyncExternalStore } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CreditCard } from 'lucide-react'
import { PaymentMethodDistribution } from '@/types/pos'
import { formatRupiah } from '@/lib/utils'

interface PaymentMethodsCardProps {
  paymentMethods: PaymentMethodDistribution[]
  totalTransactions: number
}

const emptySubscribe = () => () => {}
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function PaymentMethodsCard({
  paymentMethods,
  totalTransactions,
}: PaymentMethodsCardProps) {
  const isMounted = useIsMounted()

  // Hanya ambil data yang memiliki transaksi > 0 untuk Donut Chart
  const activeMethods = paymentMethods.filter((p) => p.count > 0)

  return (
    <div className="bg-white border border-[#E8E1D9] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
          Metode Pembayaran
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Distribusi transaksi berdasarkan metode pembayaran.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {totalTransactions === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <div className="w-12 h-12 rounded-full bg-[#F5EFE9] flex items-center justify-center text-stone-400 mx-auto mb-2.5">
              <CreditCard className="w-5 h-5 text-stone-400" />
            </div>
            <p className="font-semibold text-stone-700 text-sm">Belum ada data pembayaran</p>
            <p className="text-xs text-stone-400 mt-0.5 max-w-xs mx-auto">
              Distribusi metode pembayaran akan terisi secara otomatis setelah transaksi selesai dicatat.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left: Donut Chart with Center Total */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        `${value} transaksi`,
                        String(name ?? ''),
                      ]}
                      contentStyle={{
                        backgroundColor: '#231710',
                        borderColor: '#442d20',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Pie
                      data={activeMethods}
                      dataKey="count"
                      nameKey="metode"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={75}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {activeMethods.map((entry) => (
                        <Cell key={`cell-${entry.metode}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}

              {/* Centered Transaction Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-2xl font-black text-stone-900 tracking-tight leading-none">
                  {totalTransactions}
                </span>
                <span className="text-[10px] text-stone-400 font-semibold tracking-wider uppercase mt-0.5">
                  Transaksi
                </span>
              </div>
            </div>

            {/* Right: Legend Breakdown List */}
            <div className="flex-1 w-full space-y-3">
              {paymentMethods.map((item) => (
                <div
                  key={item.metode}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF8F5] transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="font-bold text-stone-800 text-xs sm:text-sm">
                        {item.metode}
                      </div>
                      <div className="text-[11px] text-stone-400 font-medium">
                        {item.count} transaksi ({item.persentase}%)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-stone-900 text-xs sm:text-sm whitespace-nowrap">
                      {formatRupiah(item.total_nominal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
