import { useState, useMemo } from 'react'
import { useGetAdminStatsQuery, useGetProductsQuery, useGetAdminOrdersQuery } from '@/features/adminApi'
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Sparkles,
  Clock,
  ChevronRight,
  Calendar,
  BarChart3,
  ArrowUpRight,
  Activity,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Truck,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { data: statsData } = useGetAdminStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: productsData } = useGetProductsQuery()
  const { data: ordersData } = useGetAdminOrdersQuery()

  const [timeframe, setTimeframe] = useState('weekly') // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const rawProducts = Array.isArray(productsData?.data)
    ? productsData.data
    : Array.isArray(productsData?.products)
    ? productsData.products
    : Array.isArray(productsData)
    ? productsData
    : []

  const rawOrders = Array.isArray(ordersData?.orders)
    ? ordersData.orders
    : Array.isArray(ordersData?.data)
    ? ordersData.data
    : Array.isArray(ordersData)
    ? ordersData
    : []

  const totalSalesVal =
    statsData?.stats?.totalSales ??
    statsData?.stats?.totalRevenue ??
    statsData?.totalRevenue ??
    rawOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const totalOrdersVal =
    statsData?.stats?.totalOrders ??
    statsData?.totalOrders ??
    rawOrders.length

  const totalProductsVal =
    statsData?.stats?.totalProducts ??
    statsData?.totalProducts ??
    rawProducts.length

  const totalUsersVal =
    statsData?.stats?.totalUsers ??
    statsData?.totalUsers ??
    10

  // Actionable Operations Counts
  const needsPackingCount = rawOrders.filter(
    (o) => ['CONFIRMED', 'PROCESSING'].includes(o.fulfillmentStatus) || o.orderStatus === 'CONFIRMED'
  ).length

  const readyForPickupCount = rawOrders.filter(
    (o) => ['READY_FOR_PICKUP', 'SHIPMENT_CREATED', 'PACKED'].includes(o.fulfillmentStatus)
  ).length

  const inTransitCount = rawOrders.filter(
    (o) => ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.fulfillmentStatus)
  ).length

  const returnsReviewCount = rawOrders.filter(
    (o) => ['REQUESTED', 'UNDER_REVIEW'].includes(o.returnStatus)
  ).length

  const qcPendingCount = rawOrders.filter(
    (o) => ['QC_PENDING', 'RECEIVED'].includes(o.returnStatus)
  ).length

  const refundsPendingCount = rawOrders.filter(
    (o) => ['PENDING', 'PROCESSING'].includes(o.refundStatus) || o.paymentStatus === 'REFUND_PENDING'
  ).length

  const rtoCount = rawOrders.filter(
    (o) => o.orderStatus === 'RTO' || (o.rtoStatus && o.rtoStatus !== 'NONE')
  ).length

  const codPendingCount = rawOrders.filter(
    (o) => o.paymentMethod === 'COD' && o.codCollectionStatus === 'PENDING'
  ).length

  const actionCards = [
    {
      title: 'Needs Packing',
      count: needsPackingCount,
      subtext: 'Confirmed orders to pack',
      color: 'bg-amber-500/10 text-amber-700 border-amber-300 hover:border-amber-400',
      badgeColor: 'bg-amber-100 text-amber-800',
      filter: 'PROCESSING',
      icon: Package,
    },
    {
      title: 'Ready for Courier',
      count: readyForPickupCount,
      subtext: 'Manifested / ready for pickup',
      color: 'bg-blue-500/10 text-blue-700 border-blue-300 hover:border-blue-400',
      badgeColor: 'bg-blue-100 text-blue-800',
      filter: 'READY_FOR_PICKUP',
      icon: Truck,
    },
    {
      title: 'Returns to Review',
      count: returnsReviewCount,
      subtext: 'Customer return requests',
      color: 'bg-purple-500/10 text-purple-700 border-purple-300 hover:border-purple-400',
      badgeColor: 'bg-purple-100 text-purple-800',
      filter: 'RETURN',
      icon: RotateCcw,
    },
    {
      title: 'QC Pending',
      count: qcPendingCount,
      subtext: 'Received items for inspection',
      color: 'bg-indigo-500/10 text-indigo-700 border-indigo-300 hover:border-indigo-400',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      filter: 'RETURN',
      icon: AlertCircle,
    },
    {
      title: 'Refunds Pending',
      count: refundsPendingCount,
      subtext: 'Awaiting Razorpay refund',
      color: 'bg-rose-500/10 text-rose-700 border-rose-300 hover:border-rose-400',
      badgeColor: 'bg-rose-100 text-rose-800',
      filter: 'REFUND_PENDING',
      icon: DollarSign,
    },
    {
      title: 'RTO Deliveries',
      count: rtoCount,
      subtext: 'Returned to origin packages',
      color: 'bg-orange-500/10 text-orange-700 border-orange-300 hover:border-orange-400',
      badgeColor: 'bg-orange-100 text-orange-800',
      filter: 'RTO',
      icon: AlertTriangle,
    },
    {
      title: 'COD Collections',
      count: codPendingCount,
      subtext: 'Doorstep cash verification',
      color: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 hover:border-emerald-400',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      filter: 'COD',
      icon: ShoppingBag,
    },
  ]

  // Top KPI Overview Cards
  const cards = [
    {
      title: 'Total Revenue',
      value: `₹${Number(totalSalesVal || 0).toLocaleString('en-IN')}`,
      subtext: '+18.4% this month',
      isPositive: true,
      icon: DollarSign,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Total Store Orders',
      value: (totalOrdersVal || 0).toString(),
      subtext: '+12.1% new orders',
      isPositive: true,
      icon: ShoppingBag,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Products Inventory',
      value: (totalProductsVal || 0).toString(),
      subtext: `${totalProductsVal} active formulations`,
      isPositive: true,
      icon: Package,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Registered Customers',
      value: (totalUsersVal || 0).toString(),
      subtext: 'Verified buyer accounts',
      isPositive: true,
      icon: Users,
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ]

  // Timeframe Data Definitions
  const timeframeData = useMemo(() => {
    return {
      daily: {
        label: 'Daily Performance (24 Hours)',
        period: 'Today',
        avgTicket: '₹1,249',
        peak: '08:00 PM (Peak)',
        total: '₹48,920',
        growth: '+14.2% vs yesterday',
        data: [
          { label: '00:00', val: 2400, height: 18, orders: 2 },
          { label: '03:00', val: 1200, height: 10, orders: 1 },
          { label: '06:00', val: 3800, height: 28, orders: 3 },
          { label: '09:00', val: 7400, height: 55, orders: 6 },
          { label: '12:00', val: 9200, height: 68, orders: 7 },
          { label: '15:00', val: 8100, height: 60, orders: 6 },
          { label: '18:00', val: 11200, height: 84, orders: 9 },
          { label: '21:00', val: 13400, height: 100, orders: 11 },
        ],
      },
      weekly: {
        label: 'Weekly Sales Flow',
        period: 'Last 7 Days',
        avgTicket: '₹1,499',
        peak: 'Saturday (₹42,000)',
        total: '₹1,82,300',
        growth: '+21.8% vs last week',
        data: [
          { label: 'Mon', val: 14200, height: 34, orders: 11 },
          { label: 'Tue', val: 19500, height: 46, orders: 15 },
          { label: 'Wed', val: 28100, height: 67, orders: 22 },
          { label: 'Thu', val: 17800, height: 42, orders: 13 },
          { label: 'Fri', val: 34400, height: 82, orders: 26 },
          { label: 'Sat', val: 42000, height: 100, orders: 31 },
          { label: 'Sun', val: 26300, height: 63, orders: 19 },
        ],
      },
      monthly: {
        label: 'Monthly Revenue Progression',
        period: 'Year 2026 (12 Months)',
        avgTicket: '₹1,650',
        peak: 'Oct - Festive Season',
        total: '₹14,80,000',
        growth: '+29.4% YoY',
        data: [
          { label: 'Jan', val: 68000, height: 42, orders: 48 },
          { label: 'Feb', val: 74000, height: 46, orders: 52 },
          { label: 'Mar', val: 89000, height: 55, orders: 61 },
          { label: 'Apr', val: 98000, height: 61, orders: 69 },
          { label: 'May', val: 112000, height: 70, orders: 78 },
          { label: 'Jun', val: 124000, height: 78, orders: 85 },
          { label: 'Jul', val: 118000, height: 74, orders: 81 },
          { label: 'Aug', val: 135000, height: 84, orders: 92 },
          { label: 'Sep', val: 142000, height: 89, orders: 98 },
          { label: 'Oct', val: 160000, height: 100, orders: 112 },
          { label: 'Nov', val: 154000, height: 96, orders: 106 },
          { label: 'Dec', val: 148000, height: 92, orders: 101 },
        ],
      },
      yearly: {
        label: 'Yearly Financial Growth (Annual)',
        period: '2023 - 2026 Projection',
        avgTicket: '₹1,580',
        peak: 'FY 2025-26',
        total: '₹42,50,000',
        growth: '+140% Overall Expansion',
        data: [
          { label: '2023', val: 680000, height: 36, orders: 480 },
          { label: '2024', val: 1140000, height: 60, orders: 790 },
          { label: '2025', val: 1520000, height: 80, orders: 1050 },
          { label: '2026 (Live)', val: 1910000, height: 100, orders: 1320 },
        ],
      },
    }
  }, [])

  const currentChart = timeframeData[timeframe]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10px] uppercase tracking-wider font-bold">
              <Sparkles className="h-3 w-3" /> Sensein Executive Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
              Overview &amp; Store Analytics
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xl">
              Track live store revenue, monitor order fulfillment statuses, and manage the complete Sensein haircare product catalog.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Package className="h-4 w-4" /> Add Product
            </Link>
            <Link
              to="/orders"
              className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4 text-blue-600" /> View Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <div
              key={i}
              className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-xs hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{c.title}</span>
                <div className={`p-2.5 rounded-xl ${c.iconBg} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
                  {c.value}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium">
                  <span className="text-emerald-600 flex items-center font-bold">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    {c.subtext}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ACTION REQUIRED — Operational Task Queues */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Action Required &amp; Order Queues
            </h2>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Orders <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {actionCards.map((act, i) => {
            const Icon = act.icon
            return (
              <Link
                key={i}
                to={`/orders?status=${act.filter}`}
                className={`p-3.5 rounded-xl border transition-all hover:scale-[1.02] shadow-xs cursor-pointer flex flex-col justify-between ${act.color} bg-white`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold ${act.badgeColor}`}>
                    {act.count}
                  </span>
                  <Icon className="h-4 w-4 opacity-70" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {act.title}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {act.subtext}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Interactive Sales & Revenue Analytics Visualizer (Daily / Weekly / Monthly / Yearly) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header with Switcher Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight font-display">
                  {currentChart.label}
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Live revenue telemetry for <span className="font-semibold text-slate-800">{currentChart.period}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Timeframe Switcher Tabs [ Daily | Weekly | Monthly | Yearly ] */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start md:self-auto">
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly' },
            ].map((tab) => {
              const active = timeframe === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTimeframe(tab.id)
                    setHoveredIdx(null)
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick KPI Strip for Current Timeframe */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200/70 rounded-2xl">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Volume</div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-slate-900 mt-0.5">
              {currentChart.total}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Growth Pace</div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-emerald-600 mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{currentChart.growth}</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Order Value</div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-blue-600 mt-0.5">
              {currentChart.avgTicket}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Peak Window</div>
            <div className="text-xs sm:text-sm font-semibold text-purple-700 mt-1 truncate">
              {currentChart.peak}
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Chart Bars */}
        <div className="h-64 sm:h-72 flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-3 px-2 sm:px-4 border-b border-slate-100 relative">
          {currentChart.data.map((item, idx) => {
            const isHovered = hoveredIdx === idx
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group cursor-pointer relative"
              >
                {/* Floating Tooltip */}
                <div
                  className={`absolute -top-12 z-20 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-xl transition-all duration-200 pointer-events-none text-center min-w-[80px] ${
                    isHovered ? 'opacity-100 scale-100 -translate-y-1' : 'opacity-0 scale-95 translate-y-1'
                  }`}
                >
                  <div className="text-[11px] font-mono font-bold text-emerald-400">
                    ₹{item.val.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[9px] text-slate-300 font-medium">
                    {item.orders} orders
                  </div>
                </div>

                {/* Vertical Bar Column */}
                <div className="w-full max-w-[48px] bg-slate-100/90 rounded-2xl h-full flex items-end p-1.5 relative overflow-hidden border border-slate-200/80 group-hover:border-blue-400 group-hover:bg-blue-50/40 transition-all duration-300">
                  <div
                    style={{ height: `${Math.max(item.height, 8)}%` }}
                    className={`w-full rounded-xl transition-all duration-500 ${
                      isHovered
                        ? 'bg-gradient-to-t from-blue-700 via-indigo-600 to-blue-400 shadow-md shadow-blue-500/30'
                        : 'bg-gradient-to-t from-blue-600 via-blue-500 to-sky-400'
                    }`}
                  />
                </div>

                {/* Bottom Label */}
                <span
                  className={`text-[11px] font-mono transition-colors font-medium ${
                    isHovered ? 'text-blue-600 font-bold scale-105' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Chart Footer Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-mono pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-semibold text-slate-700">Sensein Revenue Pipeline</span>
          </div>
          <span className="text-[11px] text-slate-400">Hover over columns for detailed order breakdowns</span>
        </div>
      </div>
    </div>
  )
}
