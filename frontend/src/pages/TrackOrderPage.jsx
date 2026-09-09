import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Package,
  MapPin,
  Truck,
  Phone,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Boxes,
  User,
  Edit2,
  Save,
  X,
} from 'lucide-react'
import {
  useLazyTrackOrdersQuery,
  useUpdateOrderAddressMutation,
} from '@/features/ordersApi'
import FlipkartOrderTimeline from '@/components/FlipkartOrderTimeline'
import SenseinLoader from '@/components/SenseinLoader'

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('number') || ''

  const [queryInput, setQueryInput] = useState(initialQuery)
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery))
  const [triggerTrack, { data: response, isLoading }] = useLazyTrackOrdersQuery()
  const [updateOrderAddress, { isLoading: isUpdatingAddress }] = useUpdateOrderAddressMutation()

  const [copiedAwb, setCopiedAwb] = useState(false)

  // Accordion state (All closed by default)
  const [openSections, setOpenSections] = useState({})

  // Address edit modal state
  const [editingOrder, setEditingOrder] = useState(null)
  const [addressForm, setAddressForm] = useState({
    customerName: '',
    customerPhone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    if (initialQuery) {
      setHasSearched(true)
      triggerTrack(initialQuery)
    }
  }, [initialQuery, triggerTrack])

  const handleSearch = (e) => {
    if (e) e.preventDefault()
    const clean = queryInput.trim()
    if (clean) {
      setHasSearched(true)
      triggerTrack(clean)
    }
  }

  const handleQuickSearch = (val) => {
    setQueryInput(val)
    setHasSearched(true)
    triggerTrack(val)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedAwb(true)
    setTimeout(() => setCopiedAwb(false), 3000)
  }

  const isSectionOpen = (orderId, sectionKey, defaultOpen = false) => {
    const key = `${orderId}_${sectionKey}`
    return openSections[key] !== undefined ? openSections[key] : defaultOpen
  }

  const toggleSection = (orderId, sectionKey, defaultOpen = false) => {
    const key = `${orderId}_${sectionKey}`
    setOpenSections((prev) => ({
      ...prev,
      [key]: !(prev[key] !== undefined ? prev[key] : defaultOpen),
    }))
  }

  const openAddressEditModal = (order) => {
    setEditingOrder(order)
    setAddressForm({
      customerName: order.customerName || order.shippingAddress?.fullName || '',
      customerPhone: order.customerPhone || order.shippingAddress?.phone || '',
      addressLine: order.shippingAddress?.addressLine || '',
      city: order.shippingAddress?.city || '',
      state: order.shippingAddress?.state || '',
      postalCode: order.shippingAddress?.postalCode || '',
    })
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!editingOrder) return

    if (
      !addressForm.customerName.trim() ||
      !addressForm.customerPhone.trim() ||
      !addressForm.addressLine.trim() ||
      !addressForm.postalCode.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim()
    ) {
      alert('કૃપા કરીને બધા ડિલિવરી એડ્રેસ ફિલ્ડ ભરો.')
      return
    }

    try {
      const res = await updateOrderAddress({
        id: editingOrder._id,
        ...addressForm,
      }).unwrap()

      alert(res?.message || 'ડિલિવરી એડ્રેસ સફળતાપૂર્વક અપડેટ થઈ ગયું છે!')
      setEditingOrder(null)
      triggerTrack(queryInput || editingOrder.orderNumber)
    } catch (err) {
      alert(err?.data?.message || 'Failed to update delivery address. Please try again.')
    }
  }

  const orders = response?.data || []

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-8 md:py-12">
      <div className="container-page max-w-3xl space-y-6">
        {/* Luxury Hero Header */}
        <div className="text-center max-w-xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 bg-[#5A3859]/5 border border-[#5A3859]/15 px-3.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5A3859] animate-ping" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#5A3859] font-extrabold">
              Live Logistics Portal
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
            Track Your Delivery
          </h1>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Real-time telemetry and order dispatch updates direct from the fulfillment network.
          </p>

          {/* Sleek Floating Search Bar */}
          <form
            onSubmit={handleSearch}
            className="pt-1 flex flex-col items-center justify-center max-w-lg mx-auto gap-2"
          >
            <div className="w-full bg-white p-1.5 rounded-2xl sm:rounded-full shadow-[0_6px_25px_rgba(0,0,0,0.05)] border border-stone-200/80 flex items-center gap-2 transition-all focus-within:shadow-[0_8px_30px_rgba(90,56,89,0.1)] focus-within:border-[#5A3859]/40">
              <div className="flex items-center gap-2.5 w-full pl-3.5">
                <Search className="h-4 w-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Enter Order #, Delhivery AWB, or Phone..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                  className="w-full text-xs sm:text-sm py-1.5 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none focus:shadow-none text-stone-900 font-medium placeholder:text-stone-400 font-sans"
                />
              </div>
              <button
                type="submit"
                className="bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-bold px-5 py-2.5 rounded-xl sm:rounded-full shrink-0 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Track</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Quick Helper Chips */}
            <div className="flex items-center flex-wrap justify-center gap-1.5 pt-0.5 text-[10.5px] text-stone-500">
              <span className="font-semibold text-stone-400">Quick Test:</span>
              <button
                type="button"
                onClick={() => handleQuickSearch('1284512369845')}
                className="px-2 py-0.5 bg-stone-100 hover:bg-[#5A3859]/10 hover:text-[#5A3859] rounded-md font-mono font-medium transition-colors cursor-pointer border border-stone-200/60"
              >
                Delhivery: 1284512369845
              </button>
              <button
                type="button"
                onClick={() => handleQuickSearch('ORD-20260908-10001')}
                className="px-2 py-0.5 bg-stone-100 hover:bg-[#5A3859]/10 hover:text-[#5A3859] rounded-md font-mono font-medium transition-colors cursor-pointer border border-stone-200/60"
              >
                Order #10001
              </button>
              <button
                type="button"
                onClick={() => handleQuickSearch('7984919956')}
                className="px-2 py-0.5 bg-stone-100 hover:bg-[#5A3859]/10 hover:text-[#5A3859] rounded-md font-mono font-medium transition-colors cursor-pointer border border-stone-200/60"
              >
                Phone: 7984919956
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200/70 shadow-sm text-center max-w-sm mx-auto">
            <SenseinLoader text="CONNECTING TO DELHIVERY NETWORK" fullScreen={false} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && orders.length === 0 && hasSearched && (
          <div className="bg-white rounded-2xl p-8 border border-stone-200/70 text-center max-w-md mx-auto shadow-sm space-y-3">
            <div className="w-12 h-12 bg-[#5A3859]/5 rounded-xl flex items-center justify-center mx-auto text-[#5A3859]">
              <Package className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-sm font-bold text-stone-900">Shipment Not Found</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                &ldquo;<span className="font-mono text-stone-800 font-bold">{queryInput}</span>&rdquo; માટે કોઈ ઓર્ડર કે ટ્રેકિંગ મળ્યું નથી.
              </p>
              <p className="text-[11px] text-stone-400">
                સાચો Delhivery Waybill નંબર અથવા રજિસ્ટર્ડ મોબાઈલ નંબર નાખી ફરી ટ્રાય કરો.
              </p>
            </div>
            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={() => handleQuickSearch('1284512369845')}
                className="inline-flex items-center gap-1.5 bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <span>Track Delhivery 1284512369845</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Order Details Display */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-3.5">
            {orders.map((order) => {
              const awbNumber = order.trackingNumber || order.delhivery?.waybill || ''
              const courier =
                order.courierPartner ||
                order.delhivery?.courierName ||
                (['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)
                  ? 'Delhivery Express'
                  : 'Awaiting Dispatch')
              const isCancelled = order.orderStatus === 'CANCELLED' || order.orderStatus === 'PAYMENT_FAILED'
              const isDelivered = order.orderStatus === 'DELIVERED'
              const isDispatched = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)
              const canEditAddress = !isDispatched && !isCancelled

              const estDateStr = order.estimatedDeliveryDate
                ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })
                : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })

              // Accordion states (All closed by default)
              const isTimelineOpen = isSectionOpen(order._id, 'timeline', false)
              const isProductsOpen = isSectionOpen(order._id, 'products', false)
              const isAddressOpen = isSectionOpen(order._id, 'address', false)
              const isHistoryOpen = isSectionOpen(order._id, 'history', false)

              return (
                <div key={order._id} className="space-y-3">
                  {/* Simplified Clean Delivery & AWB Card */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-3">
                    {/* Top Row: Order ID & Status Badge with Date and Time */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base sm:text-lg font-black text-stone-900 tracking-tight">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isCancelled
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isDelivered
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-[#5A3859]/10 text-[#5A3859] border-[#5A3859]/20'
                          }`}
                        >
                          ● {order.orderStatus}
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-stone-500 font-medium leading-tight">
                        <div>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Simple Estimated Delivery & Courier Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5 text-xs">
                      <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-100 space-y-0.5">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400 block">
                          Estimated Delivery
                        </span>
                        <div className="font-bold text-stone-900 text-sm">
                          {isDelivered ? 'Delivered Successfully' : estDateStr}
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-100 space-y-0.5">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400 block">
                          Courier Partner
                        </span>
                        <div className="font-bold text-stone-900 text-sm font-mono flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-[#5A3859]" />
                          <span>{courier}</span>
                        </div>
                      </div>
                    </div>

                    {/* AWB Number (Placed directly under Delivery Info) */}
                    <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-100 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400 block">
                          Airway Bill (AWB) Reference
                        </span>
                        <div className="font-mono text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2 flex-wrap">
                          <span>{awbNumber || 'Will be assigned upon dispatch'}</span>
                          {awbNumber ? (
                            <span className="text-[9px] font-extrabold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Verified
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold uppercase text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              ⏳ Pending Dispatch
                            </span>
                          )}
                        </div>
                      </div>

                      {Boolean(awbNumber) && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(awbNumber)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#5A3859] text-stone-700 hover:text-white border border-stone-200 transition-all text-xs font-semibold cursor-pointer shadow-2xs shrink-0"
                          title="Copy AWB Number"
                        >
                          {copiedAwb ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Rider or OTP info (if applicable) */}
                    {(order.deliveryOtp || order.deliveryRider?.name) && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                        {order.deliveryOtp && isDelivered && (
                          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                            <span className="text-[10px] text-emerald-800 font-bold">
                              OTP: <strong className="font-mono">{order.deliveryOtp}</strong>
                            </span>
                          </div>
                        )}
                        {order.deliveryRider?.name &&
                          (order.orderStatus === 'OUT_FOR_DELIVERY' || order.orderStatus === 'IN_TRANSIT') && (
                            <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                              <User className="h-3.5 w-3.5 text-blue-700" />
                              <span className="text-[10px] text-blue-900 font-bold">
                                Rider:{' '}
                                <a
                                  href={`tel:${order.deliveryRider.phone || ''}`}
                                  className="hover:underline font-mono"
                                >
                                  {order.deliveryRider.name}
                                </a>
                              </span>
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* 1. ORDER STATUS TIMELINE (Collapsible Accordion - Closed by default) */}
                  <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => toggleSection(order._id, 'timeline', false)}
                      className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between bg-stone-50/60 hover:bg-stone-50 transition-colors text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1 rounded-md bg-[#26a541]/10 text-[#26a541] shrink-0">
                          <Truck className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          Order Status & Tracking Timeline
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <ChevronDown
                          className={`h-4 w-4 text-stone-500 transition-transform duration-200 ${
                            isTimelineOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isTimelineOpen && (
                      <div className="p-4 sm:p-5 border-t border-stone-100">
                        <FlipkartOrderTimeline order={order} compact={true} />
                      </div>
                    )}
                  </div>

                  {/* 2. PRODUCT DETAILS / PACKAGE CONTENTS (Collapsible Accordion - Closed by default) */}
                  <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => toggleSection(order._id, 'products', false)}
                      className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between bg-stone-50/60 hover:bg-stone-50 transition-colors text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1 rounded-md bg-[#5A3859]/10 text-[#5A3859] shrink-0">
                          <Boxes className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          Package Contents & Product Details
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <ChevronDown
                          className={`h-4 w-4 text-stone-500 transition-transform duration-200 ${
                            isProductsOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isProductsOpen && (
                      <div className="p-4 sm:p-5 border-t border-stone-100 space-y-3">
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center gap-3 py-1">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={item.image || '/placeholder.png'}
                                  alt=""
                                  className="h-9 w-9 rounded-lg object-cover bg-stone-50 border border-stone-200/80 shrink-0"
                                />
                                <span className="font-semibold text-stone-900 truncate text-xs">
                                  {item.name}
                                </span>
                              </div>
                              <span className="font-mono text-stone-900 font-bold shrink-0 text-xs">
                                {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center border-t border-stone-100 pt-2.5 text-xs">
                          <span className="font-semibold text-stone-500">
                            Total Paid ({order.paymentMethod || 'Online'})
                          </span>
                          <span className="font-display text-sm sm:text-base text-[#5A3859] font-black">
                            ₹{order.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. DELIVERY ADDRESS (Collapsible Accordion - Closed by default + Editable before Pickup) */}
                  <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => toggleSection(order._id, 'address', false)}
                      className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between bg-stone-50/60 hover:bg-stone-50 transition-colors text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1 rounded-md bg-[#5A3859]/10 text-[#5A3859] shrink-0">
                          <MapPin className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          Delivery Address
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Edit Address Button - ONLY before pickup/dispatch */}
                        {canEditAddress && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              openAddressEditModal(order)
                            }}
                            className="bg-white hover:bg-[#5A3859] text-stone-700 hover:text-white border border-stone-200 hover:border-[#5A3859] text-[11px] px-2.5 py-1 rounded-lg inline-flex items-center gap-1 font-bold transition-all shadow-2xs cursor-pointer select-none"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit Address</span>
                          </span>
                        )}

                        <ChevronDown
                          className={`h-4 w-4 text-stone-500 transition-transform duration-200 ${
                            isAddressOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isAddressOpen && (
                      <div className="p-4 sm:p-5 border-t border-stone-100 space-y-2 text-xs">
                        <div className="flex items-baseline justify-between">
                          <div className="font-bold text-stone-900 text-sm">{order.customerName}</div>
                          {canEditAddress && (
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Editable before pickup
                            </span>
                          )}
                        </div>
                        <div className="text-stone-600 leading-relaxed max-w-md">
                          {order.shippingAddress?.addressLine}
                        </div>
                        <div className="text-stone-600">
                          {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                          <strong className="font-mono text-stone-900 font-bold">
                            {order.shippingAddress?.postalCode}
                          </strong>
                        </div>
                        <div className="text-stone-700 font-mono pt-1 text-[11.5px] flex items-center gap-1">
                          <Phone className="h-3 w-3 text-stone-400" />
                          <span>{order.customerPhone}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. SCAN HISTORY & CHECKPOINTS (Placed at the bottom - Closed by default) */}
                  <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => toggleSection(order._id, 'history', false)}
                      className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between bg-stone-50/60 hover:bg-stone-50 transition-colors text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1 rounded-md bg-[#5A3859]/10 text-[#5A3859] shrink-0">
                          <Clock className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          Scan History & Checkpoints
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden sm:inline">
                          LIVE SYNC
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-stone-500 transition-transform duration-200 ${
                            isHistoryOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isHistoryOpen && (
                      <div className="p-4 sm:p-5 border-t border-stone-100">
                        <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                          {order.trackingHistory && order.trackingHistory.length > 0 ? (
                            order.trackingHistory.map((evt, i) => (
                              <div key={i} className="relative space-y-0.5">
                                <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-[#5A3859] ring-4 ring-[#5A3859]/15" />
                                <div className="flex justify-between items-baseline gap-2">
                                  <span className="text-xs font-bold text-stone-900">{evt.title}</span>
                                  <span className="text-[10px] text-stone-400 font-mono shrink-0">
                                    {new Date(evt.timestamp).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <div className="text-[11.5px] text-stone-500 leading-relaxed">
                                  {evt.description}
                                </div>
                                <div className="text-[10.5px] text-[#5A3859] font-medium flex items-center gap-1 pt-0.5">
                                  <MapPin className="h-2.5 w-2.5" />
                                  <span>{evt.location}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-stone-500 italic py-1">
                              Package registered. Electronic manifest created with carrier partner.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* EDIT ADDRESS MODAL */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl relative my-8 border border-stone-200">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
                    <Edit2 className="h-4 w-4 text-[#5A3859]" />
                    <span>Edit Delivery Address</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Order #{editingOrder.orderNumber} (Before pickup update)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={addressForm.customerName}
                      onChange={(e) => setAddressForm({ ...addressForm, customerName: e.target.value })}
                      placeholder="e.g. Raj Patel"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={addressForm.customerPhone}
                      onChange={(e) => setAddressForm({ ...addressForm, customerPhone: e.target.value })}
                      placeholder="10-digit Mobile"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">Street Address / Flat / Building</label>
                  <textarea
                    rows={2}
                    required
                    value={addressForm.addressLine}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                    placeholder="House/Flat No, Apartment, Street name, Landmark"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      placeholder="395010"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">City</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="Surat"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">State</label>
                    <input
                      type="text"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="Gujarat"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-3.5 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingAddress}
                    className="bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isUpdatingAddress ? 'Saving...' : 'Save & Update Address'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
