import { useState } from 'react'
import {
  TrendingUp,
  Users,
  Eye,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  MapPin,
  RefreshCw,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Share2,
  Compass,
  Activity,
  Zap,
} from 'lucide-react'
import {
  useGetAnalyticsSummaryQuery,
  useGetTrackingConfigQuery,
  useUpdateTrackingConfigMutation,
} from '@/features/adminApi'

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('30d')
  const [activeTab, setActiveTab] = useState('analytics') // 'analytics' | 'tracking_keys'

  const { data: response, isLoading, refetch, isFetching } = useGetAnalyticsSummaryQuery({ timeframe })
  const { data: configResponse, refetch: refetchConfig } = useGetTrackingConfigQuery()
  const [updateTrackingConfig, { isLoading: isSavingConfig }] = useUpdateTrackingConfigMutation()

  const summaryData = response?.data
  const summary = summaryData?.summary || {}
  const funnel = summaryData?.funnel || []
  const trafficSources = summaryData?.trafficSources || []
  const devices = summaryData?.devices || []
  const topCities = summaryData?.topCities || []
  const recentActivity = summaryData?.recentActivity || []

  // Tracking Keys Form State
  const [configForm, setConfigForm] = useState(null)

  // Initialize config form when data loads
  const currentConfig = configResponse?.data
  const formData = configForm || {
    googleAnalyticsId: currentConfig?.googleAnalyticsId || '',
    isGoogleAnalyticsEnabled: currentConfig?.isGoogleAnalyticsEnabled ?? true,
    clarityId: currentConfig?.clarityId || '',
    isClarityEnabled: currentConfig?.isClarityEnabled ?? true,
    metaPixelId: currentConfig?.metaPixelId || '',
    isMetaPixelEnabled: currentConfig?.isMetaPixelEnabled ?? false,
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    try {
      await updateTrackingConfig(formData).unwrap()
      addToast({
        type: 'update',
        title: 'Updated Successfully',
        message: 'Tracking Configuration Successfully Updated & Synced Live!',
      })
      refetchConfig()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err?.data?.message || 'Error updating tracking configuration',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Store Analytics & Customer Traffic
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time D2C visitor funnel, traffic acquisition sources, buyer demographics & pixel tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Toggle */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('tracking_keys')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'tracking_keys' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pixel & GA4 Settings
            </button>
          </div>

          {activeTab === 'analytics' && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 text-xs">
              {['24h', '7d', '30d', 'all'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[11px] transition-all ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW 1: PIXEL & TRACKING KEYS CONFIGURATION */}
      {activeTab === 'tracking_keys' && (
        <div className="max-w-3xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-600" />
                Third-Party Analytics & Tracking Pixels
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect your Google Analytics 4, Microsoft Clarity, and Meta Pixel IDs to automatically track every page and button click.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            {/* Google Analytics 4 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                    GA
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Google Analytics 4 (GA4)</h3>
                    <p className="text-[11px] text-slate-500">Tracks visitor demographics, traffic sources, age & gender</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGoogleAnalyticsEnabled}
                    onChange={(e) =>
                      setConfigForm({ ...formData, isGoogleAnalyticsEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Measurement ID (G-XXXXXXXXXX)
                </label>
                <input
                  type="text"
                  placeholder="e.g. G-SENSEIN800"
                  value={formData.googleAnalyticsId}
                  onChange={(e) =>
                    setConfigForm({ ...formData, googleAnalyticsId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Microsoft Clarity */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                    MC
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Microsoft Clarity (100% Free Live Screen Recording)</h3>
                    <p className="text-[11px] text-slate-500">Watch live user recordings, click heatmaps & scroll depth</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isClarityEnabled}
                    onChange={(e) =>
                      setConfigForm({ ...formData, isClarityEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clarity Project ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. clarity_sensein_live"
                  value={formData.clarityId}
                  onChange={(e) =>
                    setConfigForm({ ...formData, clarityId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Meta Pixel */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    FB
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Meta Pixel (Facebook & Instagram Ads)</h3>
                    <p className="text-[11px] text-slate-500">Retarget people who added to cart on Instagram & Facebook</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isMetaPixelEnabled}
                    onChange={(e) =>
                      setConfigForm({ ...formData, isMetaPixelEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Meta Pixel ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 192837465019283"
                  value={formData.metaPixelId}
                  onChange={(e) =>
                    setConfigForm({ ...formData, metaPixelId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSavingConfig ? 'Saving Settings...' : 'Save & Sync Live Tracking Pixels'}
            </button>
          </form>
        </div>
      )}

      {/* VIEW 2: MAIN DASHBOARD & VISUAL FUNNEL */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* 1. KPI Executive Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Total Visitors */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Visitors</span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {summary.totalVisitors?.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-[10px] text-slate-500">{summary.pageViews || 0} Page Views</p>
            </div>

            {/* Product Page Views */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Product Views</span>
                <Eye className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {summary.productViews?.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-[10px] text-indigo-600 font-semibold">Browsing Catalog</p>
            </div>

            {/* Add to Cart Count */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Add to Cart</span>
                <ShoppingBag className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {summary.addToCartCount?.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-[10px] text-amber-600 font-semibold">High Buying Intent</p>
            </div>

            {/* Initiated Checkout */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Checkouts</span>
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {summary.checkoutCount?.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-[10px] text-purple-600 font-semibold">Address Filled</p>
            </div>

            {/* Orders Placed */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Orders Paid</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                {summary.ordersCount?.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold">₹{summary.totalRevenue?.toLocaleString('en-IN') || 0}</p>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Conversion Rate</span>
                <TrendingUp className="h-4 w-4 text-blue-700" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
                {summary.conversionRate || '0.00%'}
              </p>
              <p className="text-[10px] text-slate-500">AOV: ₹{summary.avgOrderValue || 0}</p>
            </div>
          </div>

          {/* 2. Visual E-Commerce Conversion Funnel (Core Feature) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  E-Commerce Conversion Funnel (Where Users Drop Off)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Step-by-step visitor progression from store entrance to successful order placement.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {funnel.map((step, idx) => (
                <div key={step.step} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                        {step.step}
                      </span>
                      <span className="font-bold text-slate-800">{step.name}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold text-slate-900">{step.count?.toLocaleString('en-IN')} Users</span>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {step.percentage}%
                      </span>
                      {step.dropoff > 0 && (
                        <span className="text-[11px] text-rose-600 font-semibold">
                          ↓ {step.dropoff}% drop
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Funnel Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        idx === 0
                          ? 'bg-blue-600'
                          : idx === 1
                          ? 'bg-indigo-600'
                          : idx === 2
                          ? 'bg-amber-500'
                          : idx === 3
                          ? 'bg-purple-600'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.max(step.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Three-Column Grid: Traffic Sources, Top Cities, Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column A: Traffic Sources (Instagram, Google, Direct, WhatsApp) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-indigo-600" />
                  Traffic Acquisition Sources
                </h3>
              </div>

              <div className="space-y-3">
                {trafficSources.map((item) => {
                  const sourceLabels = {
                    instagram: { name: 'Instagram (Ads & Bio)', color: 'bg-pink-500', text: 'text-pink-600' },
                    facebook: { name: 'Facebook Ads', color: 'bg-blue-600', text: 'text-blue-600' },
                    google: { name: 'Google Organic / SEO', color: 'bg-amber-500', text: 'text-amber-600' },
                    whatsapp: { name: 'WhatsApp Sharing', color: 'bg-emerald-500', text: 'text-emerald-600' },
                    direct: { name: 'Direct URL / Bookmarks', color: 'bg-slate-700', text: 'text-slate-700' },
                    referral: { name: 'Other Referrals', color: 'bg-purple-500', text: 'text-purple-600' },
                  }
                  const meta = sourceLabels[item.source] || { name: item.source, color: 'bg-slate-500', text: 'text-slate-600' }
                  return (
                    <div key={item.source} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.color}`} />
                        <span className="font-semibold text-slate-700">{meta.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{item.count} hits</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Column B: Top Geographic Locations (Gujarat & India) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-600" />
                  Top Buyer Cities
                </h3>
              </div>

              <div className="space-y-3">
                {topCities.map((c) => (
                  <div key={c.city} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Compass className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{c.city}</span>
                      {c.state && <span className="text-[10px] text-slate-400">({c.state})</span>}
                    </div>
                    <span className="font-mono font-bold text-slate-700">
                      {c.percentage ? `${c.percentage}%` : `${c.count} visits`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column C: Devices & Browsers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  Devices & Platforms
                </h3>
              </div>

              <div className="space-y-3">
                {devices.map((d) => {
                  const icons = {
                    mobile: <Smartphone className="h-4 w-4 text-blue-600" />,
                    desktop: <Laptop className="h-4 w-4 text-indigo-600" />,
                    tablet: <Tablet className="h-4 w-4 text-amber-600" />,
                  }
                  return (
                    <div key={d.device} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {icons[d.device] || <Globe className="h-4 w-4 text-slate-400" />}
                        <span className="font-semibold capitalize text-slate-700">{d.device}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{d.count} users</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 4. Live Real-Time Activity Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Live Real-Time Activity Stream
            </h3>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No recent telemetry events captured yet.</p>
              ) : (
                recentActivity.map((evt) => (
                  <div key={evt._id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          evt.eventType === 'purchase'
                            ? 'bg-emerald-500'
                            : evt.eventType === 'begin_checkout'
                            ? 'bg-purple-500'
                            : evt.eventType === 'add_to_cart'
                            ? 'bg-amber-500'
                            : evt.eventType === 'view_item'
                            ? 'bg-indigo-500'
                            : 'bg-blue-400'
                        }`}
                      />
                      <span className="font-bold uppercase text-[11px] text-slate-700 font-mono">
                        {evt.eventType.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 truncate max-w-xs">
                        {evt.metadata?.productName || evt.page || '/'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                      <span>{evt.city || 'Gujarat'}</span>
                      <span>{new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
