'use client'

import React, { useState, useSyncExternalStore } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailyTrendPoint } from '@/types/pos'
import { formatRupiah, cn } from '@/lib/utils'

interface SalesTrendChartProps {
  trendData: DailyTrendPoint[]
  periodLabel: string
}

type ChartMetric = 'pendapatan' | 'struk'

const emptySubscribe = () => () => {}
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: readonly {
    value?: unknown
    payload?: unknown
  }[]
  metric: ChartMetric
}

function CustomTooltip({ active, payload, metric }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as DailyTrendPoint | undefined
    const val = Number(payload[0].value) || 0
    if (!data) return null

    return (
      <div className="bg-[#231710] border border-stone-800 text-white px-3.5 py-2.5 rounded-xl shadow-xl text-xs z-50 pointer-events-none">
        <p className="font-bold text-stone-100 text-[13px] mb-1">
          {data.fullDateIndo}
        </p>
        <p className="text-amber-200/95 font-medium">
          {metric === 'pendapatan' ? (
            <>
              <span className="text-stone-300">Pendapatan: </span>
              <span className="font-bold">{formatRupiah(val)}</span>
            </>
          ) : (
            <>
              <span className="text-stone-300">Jumlah Struk: </span>
              <span className="font-bold">{val} transaksi</span>
            </>
          )}
        </p>
      </div>
    )
  }
  return null
}

export function SalesTrendChart({ trendData, periodLabel }: SalesTrendChartProps) {
  const [metric, setMetric] = useState<ChartMetric>('pendapatan')
  const isMounted = useIsMounted()

  // Formatter sumbu Y untuk pendapatan
  const formatYAxis = (val: number) => {
    if (metric === 'struk') {
      return String(val)
    }
    if (val === 0) return 'Rp 0'
    if (val < 1000) return `Rp ${val}`
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toLocaleString('id-ID')}jt`
    }
    if (val >= 1000) {
      return `Rp ${(val / 1000).toLocaleString('id-ID')}rb`
    }
    return `Rp ${val}`
  }

  return (
    <div className="bg-white border border-[#E8E1D9] rounded-2xl p-5 sm:p-6 shadow-xs mb-6 shrink-0">
      {/* Header Grafik: Judul & Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
            Grafik Tren Penjualan
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Ringkasan performa {periodLabel.toLowerCase()} berdasarkan transaksi selesai.
          </p>
        </div>

        {/* Segmented Control: Pendapatan vs Jumlah Struk */}
        <div className="inline-flex items-center bg-[#EFEAE2] p-1 rounded-xl gap-1 border border-[#E4DDD3] text-xs font-semibold shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('pendapatan')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              metric === 'pendapatan'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            )}
          >
            Pendapatan
          </button>
          <button
            type="button"
            onClick={() => setMetric('struk')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              metric === 'struk'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            )}
          >
            Jumlah Struk
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-[280px] sm:h-[320px]">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSalesTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#603B26" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#603B26" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#EAE5DF"
              />

              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#78716c' }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#78716c' }}
                tickFormatter={formatYAxis}
                width={70}
                allowDecimals={false}
              />

              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    active={props.active}
                    payload={props.payload}
                    metric={metric}
                  />
                )}
                cursor={{
                  stroke: '#C4B5A5',
                  strokeWidth: 1.5,
                  strokeDasharray: '4 4',
                }}
              />

              <Area
                type="monotone"
                dataKey={metric === 'pendapatan' ? 'pendapatan' : 'jumlah_struk'}
                stroke="#603B26"
                strokeWidth={2.5}
                fill="url(#colorSalesTrend)"
                activeDot={{
                  r: 5,
                  fill: '#603B26',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-50/50 rounded-xl">
            <span className="text-xs text-stone-400">Memuat visualisasi grafik...</span>
          </div>
        )}
      </div>
    </div>
  )
}
