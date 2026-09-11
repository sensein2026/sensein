import { useState, useEffect, useRef } from 'react'
import {
  useGetAdminOrdersQuery,
  useSimulateDelhiveryEventMutation,
} from '@/features/adminApi'
import {
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Pause,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Lock,
  Unlock,
  CreditCard,
  Banknote,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Code2,
  Laptop,
  Smartphone,
  Eye,
  Info,
} from 'lucide-react'

export default function CourierSimulatorPage() {
  const { data: ordersData, isLoading: isLoadingOrders, refetch: refetchOrders } = useGetAdminOrdersQuery({ limit: 50 })
  const [simulateEvent, { isLoading: isSimulating }] = useSimulateDelhiveryEventMutation()

  const orders = ordersData?.orders || []
  const [selectedOrderId, setSelectedOrderId] = useState('')

  // Current simulation state
  const [currentOrder, setCurrentOrder] = useState(null)
  const [delhiveryPayload, setDelhiveryPayload] = useState(null)
  const [impactData, setImpactData] = useState(null)
  const [logs, setLogs] = useState([])
  const [feedback, setFeedback] = useState('')

  // Custom simulation inputs
  const [scanLocation, setScanLocation] = useState('Surat Central Logistics Hub, Gujarat')
  const [remarks, setRemarks] = useState('')
  const [riderName, setRiderName] = useState('Ramesh Patel')
  const [riderPhone, setRiderPhone] = useState('+91 9876543210')

  // Auto-play state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const autoPlayTimerRef = useRef(null)

  const LIFECYCLE_STEPS = [
    {
      id: 'MANIFEST',
      title: '1. Manifest & Generate AWB',
      icon: Package,
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      description: 'Delhivery B2C generates 13-14 digit numeric Waybill and shipping label.',
      defaultLocation: 'Surat Central Logistics Hub (MindNext / Sensein)',
      defaultRemarks: 'Shipment manifested. Delhivery AWB generated and ready for handover.',
    },
    {
      id: 'PICKED_UP',
      title: '2. Courier Pickup Scan',
      icon: Truck,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      description: 'Delhivery courier rider physically scans and collects parcel from Surat warehouse.',
      defaultLocation: 'Surat Warehouse Gate #2, Gujarat',
      defaultRemarks: 'Picked up by Delhivery Logistics. Handover manifest verified.',
    },
    {
      id: 'IN_TRANSIT',
      title: '3. In-Transit Hub Scan',
      icon: MapPin,
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      description: 'Shipment is sorted at intermediate gateway hub and moving towards destination.',
      defaultLocation: 'Ahmedabad Mega Gateway Hub, Gujarat',
      defaultRemarks: 'Bag scanned and processed at intermediate sorting facility.',
    },
    {
      id: 'OUT_FOR_DELIVERY',
      title: '4. Out for Doorstep Delivery',
      icon: Smartphone,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      description: 'Assigned to local delivery associate for doorstep delivery today.',
      defaultLocation: 'Local Delivery Center, Destination City',
      defaultRemarks: 'Out for delivery today with assigned delivery rider.',
    },
    {
      id: 'NDR',
      title: '5. Delivery Failed (NDR)',
      icon: AlertTriangle,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      description: 'Customer unavailable / Door locked. Delhivery schedules re-attempt tomorrow.',
      defaultLocation: 'Destination Delivery Hub',
      defaultRemarks: 'Delivery attempt failed: Customer premises closed. Rescheduled.',
    },
    {
      id: 'DELIVERED',
      title: '6. Delivered (COD Cash Collected)',
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description: 'Package handed over safely. If COD, cash collected & confirmed.',
      defaultLocation: 'Customer Doorstep Address',
      defaultRemarks: 'Delivered successfully. Handover OTP/Signature verified.',
    },
    {
      id: 'RTO',
      title: '7. RTO (Return to Origin)',
      icon: RotateCcw,
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      description: 'Customer rejected or 3x failed attempts. Returning back to Surat warehouse.',
      defaultLocation: 'RTO Return Center',
      defaultRemarks: 'Customer refused delivery. Return to origin in progress.',
    },
  ]

  // Default sample order fallback if no orders in DB
  const defaultSampleOrder = {
    _id: 'sample_66a123456789abcdef012345',
    orderNumber: 'ORD-2026-99214',
    customerName: 'Raj Donga',
    customerPhone: '+91 9265259954',
    customerEmail: 'work.rajdonga@gmail.com',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    fulfillmentStatus: 'CONFIRMED',
    orderStatus: 'ACTIVE',
    totalAmount: 998,
    shippingFee: 0,
    trackingNumber: '7855207565109',
    courierPartner: 'Delhivery Surface & Express B2C',
    shippingAddress: {
      fullName: 'Raj Donga',
      addressLine: '104, Vijay Nagar 2, Puna-Simada Road, Yogi Chowk',
      city: 'Surat',
      state: 'Gujarat',
      postalCode: '395010',
      phone: '9265259954',
    },
    items: [
      {
        product: { name: 'Sensein® Matte Finish Clay Wax', price: 499 },
        name: 'Sensein® Matte Finish Clay Wax',
        quantity: 2,
        price: 499,
      },
    ],
    timeline: [
      {
        orderId: 'ORD-2026-99214',
        previousStatus: 'NEW',
        newStatus: 'CONFIRMED',
        timestamp: new Date().toISOString(),
        actor: 'Customer / Sensein Storefront',
        actorType: 'CUSTOMER',
        reason: 'Order placed via Cash on Delivery',
        source: 'CHECKOUT',
      },
    ],
    trackingHistory: [
      {
        status: 'CONFIRMED',
        title: 'Order Confirmed',
        location: 'Sensein Operations, Surat',
        timestamp: new Date().toISOString(),
        description: 'Your order has been confirmed and verified for packaging.',
      },
    ],
  }

  // Set initial order on load
  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0]._id)
      setCurrentOrder(orders[0])
    } else if (!selectedOrderId) {
      setCurrentOrder(defaultSampleOrder)
    }
  }, [orders])

  // When selected order changes
  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId)
    const found = orders.find((o) => o._id === orderId || o.orderNumber === orderId)
    if (found) {
      setCurrentOrder(found)
      setDelhiveryPayload(null)
      setImpactData(null)
    } else {
      setCurrentOrder(defaultSampleOrder)
    }
  }

  // Execute single simulation step
  const handleTriggerEvent = async (stepId, customLoc, customRem) => {
    if (!currentOrder) return

    const stepObj = LIFECYCLE_STEPS.find((s) => s.id === stepId)
    const loc = customLoc || scanLocation || stepObj?.defaultLocation || 'Surat Logistics Hub'
    const rem = customRem || remarks || stepObj?.defaultRemarks || `Milestone: ${stepId}`

    try {
      const res = await simulateEvent({
        orderId: currentOrder._id || currentOrder.orderNumber,
        event: stepId,
        location: loc,
        remarks: rem,
        riderName,
        riderPhone,
      }).unwrap()

      if (res.success) {
        setCurrentOrder(res.data.order)
        setDelhiveryPayload(res.data.delhiveryPayload)
        setImpactData(res.data.impact)

        const newLog = {
          time: new Date().toLocaleTimeString(),
          event: stepId,
          title: stepObj?.title || stepId,
          location: loc,
          remarks: rem,
        }
        setLogs((prev) => [newLog, ...prev.slice(0, 19)])
        setFeedback(`✅ Event '${stepId}' applied! Live state synced across Admin & User Dashboard.`)
        setTimeout(() => setFeedback(''), 4000)
      }
    } catch (err) {
      console.error('Simulator error:', err)
      // Fallback local simulation for preview
      const simulatedAwb = currentOrder.trackingNumber || '7855207565109'
      const fallbackOrder = {
        ...currentOrder,
        fulfillmentStatus: stepId === 'MANIFEST' ? 'READY_FOR_PICKUP' : stepId,
        trackingNumber: simulatedAwb,
        courierPartner: 'Delhivery Surface & Express B2C',
        trackingHistory: [
          {
            status: stepId,
            title: stepObj?.title || stepId,
            location: loc,
            timestamp: new Date().toISOString(),
            description: rem,
          },
          ...(currentOrder.trackingHistory || []),
        ],
      }
      setCurrentOrder(fallbackOrder)
      setDelhiveryPayload({
        Shipment: {
          AWB: simulatedAwb,
          Status: { Status: stepId, StatusLocation: loc, Instructions: rem },
          Scans: [{ ScanDetail: { ScanType: stepId, ScannedLocation: loc, Scan: rem } }],
        },
      })
      setImpactData({
        fulfillmentStatus: stepId,
        isAddressEditAllowed: !['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(stepId),
        isPrePickupCancellationAllowed: !['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(stepId),
        customerStatusBadge: { text: stepObj?.title, color: stepObj?.badgeColor },
      })
    }
  }

  // Auto-refresh timer for 5-second live background sync
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [countdown, setCountdown] = useState(5)

  // Determine current step index based on order fulfillmentStatus
  const getStepIndexFromStatus = (status) => {
    const autoSteps = ['MANIFEST', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']
    if (status === 'READY_FOR_PICKUP') return 0
    const idx = autoSteps.indexOf(status)
    return idx !== -1 ? idx : 0
  }

  // Auto-refresh interval (every 5s)
  useEffect(() => {
    if (!autoRefreshEnabled) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refetchOrders()
          return 5
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [autoRefreshEnabled, refetchOrders])

  // Smart Resume / Playback logic (Does NOT reset to beginning on resume!)
  useEffect(() => {
    if (isPlaying) {
      const autoSteps = ['MANIFEST', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']
      
      // If completed or out of bounds, stop playing
      if (currentStepIndex >= autoSteps.length) {
        setIsPlaying(false)
        setFeedback('🎉 Journey completed! Order is delivered.')
        setTimeout(() => setFeedback(''), 4000)
        return
      }

      autoPlayTimerRef.current = setTimeout(() => {
        const nextStep = autoSteps[currentStepIndex]
        handleTriggerEvent(nextStep)
        setCurrentStepIndex((prev) => prev + 1)
      }, 3500)
    }

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current)
    }
  }, [isPlaying, currentStepIndex])

  // Play button resumes from current step
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      setFeedback('⏸️ Journey paused. You can resume anytime from this step.')
      setTimeout(() => setFeedback(''), 3000)
    } else {
      // Determine where to resume from
      const autoSteps = ['MANIFEST', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']
      let nextIndex = currentStepIndex
      
      // If already at end or not started, start from current fulfillment or 0
      if (currentOrder?.fulfillmentStatus === 'DELIVERED') {
        nextIndex = 0
        setCurrentStepIndex(0)
      } else if (nextIndex >= autoSteps.length) {
        nextIndex = 0
        setCurrentStepIndex(0)
      } else {
        const detected = getStepIndexFromStatus(currentOrder?.fulfillmentStatus)
        if (detected > nextIndex) {
          nextIndex = detected
          setCurrentStepIndex(detected)
        }
      }

      setIsPlaying(true)
      setFeedback(`▶️ Resuming journey from Step ${nextIndex + 1} (${autoSteps[nextIndex] || 'Start'})...`)
      setTimeout(() => setFeedback(''), 3000)
    }
  }

  // Next single step
  const handleNextStep = () => {
    const autoSteps = ['MANIFEST', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']
    const nextIdx = Math.min(autoSteps.length - 1, currentStepIndex + 1)
    setCurrentStepIndex(nextIdx)
    handleTriggerEvent(autoSteps[nextIdx])
  }

  // Prev single step
  const handlePrevStep = () => {
    const autoSteps = ['MANIFEST', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']
    const prevIdx = Math.max(0, currentStepIndex - 1)
    setCurrentStepIndex(prevIdx)
    handleTriggerEvent(autoSteps[prevIdx])
  }

  // Explicit Reset
  const handleResetFlow = () => {
    setIsPlaying(false)
    setCurrentStepIndex(0)
    handleTriggerEvent('MANIFEST', 'Surat Central Logistics Warehouse', 'Flow reset by Admin. Shipment manifested for pickup.')
    setFeedback('🔄 Flow reset to Step 1 (Manifest & Generate AWB).')
    setTimeout(() => setFeedback(''), 3000)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text)
    setFeedback('📋 Copied to clipboard!')
    setTimeout(() => setFeedback(''), 2500)
  }

  const currentFulfillment = currentOrder?.fulfillmentStatus || 'NEW'
  const isAddressLocked = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentFulfillment)
  const isCancelLocked = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentFulfillment)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-12 w-48 h-48 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold rounded-full">
              <Truck className="h-3.5 w-3.5" />
              <span>Delhivery B2C MCP Logistics Automation Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Courier Smart Simulator & Live Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Manually trigger and test every automated courier milestone (Manifest, Pickup, In-Transit, Out for Delivery, NDR, Delivered, RTO) and observe the real-time cross-platform impact across Courier APIs, Admin Systems, and Customer Dashboards.
            </p>
          </div>

          {/* Quick Play/Pause/Step/Reset Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Step Back */}
            <button
              onClick={handlePrevStep}
              disabled={isSimulating || isPlaying}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Previous Step"
            >
              <span>⏮️ Step Back</span>
            </button>

            {/* Play / Pause Toggle */}
            <button
              onClick={handleTogglePlay}
              disabled={isSimulating}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-4 ring-amber-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 ring-4 ring-emerald-500/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>▶ Play Journey</span>
                </>
              )}
            </button>

            {/* Step Forward */}
            <button
              onClick={handleNextStep}
              disabled={isSimulating || isPlaying}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Next Step"
            >
              <span>Step Next ⏭️</span>
            </button>

            {/* Reset Flow */}
            <button
              onClick={handleResetFlow}
              disabled={isSimulating}
              className="px-3 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset to Step 1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            {/* 5s Auto Sync Ticker */}
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                autoRefreshEnabled
                  ? 'bg-blue-950/80 border-blue-600/60 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle 5-Second Live Background Sync"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${autoRefreshEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              <span>{autoRefreshEnabled ? `Auto-Sync: ${countdown}s` : 'Sync Paused'}</span>
            </button>
          </div>
        </div>

        {/* Visual Linear Flow Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {['1. Manifest (AWB)', '2. Pickup Scan', '3. In-Transit Hub', '4. Out for Delivery', '5. Delivered (COD)'].map((stepName, i) => {
              const currentStepId = ['MANIFEST', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'][i]
              const isPassed = (getStepIndexFromStatus(currentFulfillment) >= i) || (currentFulfillment === 'DELIVERED')
              const isCurrent = (getStepIndexFromStatus(currentFulfillment) === i && currentFulfillment !== 'DELIVERED') || (i === 4 && currentFulfillment === 'DELIVERED')
              return (
                <div key={i} className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                  <div className={`px-3 py-1.5 rounded-lg font-bold text-[11px] w-full flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/50'
                      : isPassed
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-800'
                  }`}>
                    <span>{stepName}</span>
                    {isPassed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                  {i < 4 && <ArrowRight className="h-3 w-3 text-slate-600 hidden lg:block shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Status Toast */}
        {feedback && (
          <div className="mt-4 p-3 bg-blue-900/60 border border-blue-500/40 text-blue-200 text-xs font-semibold rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          </div>
        )}
      </div>

      {/* Target Order Selection Deck */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Select Order to Simulate</h2>
              <p className="text-xs text-slate-500">Pick any live order or enter a tracking number</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedOrderId}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[240px]"
            >
              {orders.length === 0 && (
                <option value="sample">Demo Order (ORD-2026-99214 - Surat COD)</option>
              )}
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber} - {o.customerName || 'Customer'} (₹{o.totalAmount} • {o.paymentMethod})
                </option>
              ))}
            </select>

            {currentOrder && (
              <a
                href={`http://localhost:5173/track?number=${currentOrder.orderNumber || currentOrder.trackingNumber}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Open live customer tracking page in new window"
              >
                <span>🔗 Open Live Customer Track</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Active Order Summary Strip */}
        {currentOrder && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Order Number</span>
              <span className="font-bold text-slate-800">{currentOrder.orderNumber}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
              <span className="font-semibold text-slate-800 truncate block">{currentOrder.customerName || currentOrder.shippingAddress?.fullName}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Method</span>
              <span className={`inline-flex items-center gap-1 font-bold ${currentOrder.paymentMethod === 'COD' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {currentOrder.paymentMethod === 'COD' ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                {currentOrder.paymentMethod} (₹{currentOrder.totalAmount})
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Delhivery AWB</span>
              <span className="font-mono font-bold text-blue-600 truncate block">
                {currentOrder.trackingNumber || currentOrder.delhivery?.waybill || 'Pending Manifest'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Fulfillment Status</span>
              <span className="font-bold text-slate-900 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md inline-block mt-0.5">
                {currentOrder.fulfillmentStatus || currentOrder.orderStatus}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Destination</span>
              <span className="font-semibold text-slate-800 truncate block">
                {currentOrder.shippingAddress?.city || 'Surat'}, {currentOrder.shippingAddress?.postalCode || '395010'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Step-by-Step Action Deck */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span>Manual Courier Action Triggers (Simulate What Delhivery Does)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any milestone button to simulate the courier partner scanning the parcel.
            </p>
          </div>
        </div>

        {/* Step Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {LIFECYCLE_STEPS.slice(0, 4).map((step, idx) => {
            const Icon = step.icon
            const isCurrent = currentFulfillment === step.id
            return (
              <button
                key={step.id}
                disabled={isSimulating}
                onClick={() => handleTriggerEvent(step.id)}
                className={`p-4 rounded-xl border text-left transition-all relative group cursor-pointer ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Step {idx + 1}</span>
                </div>
                <div className="font-bold text-xs text-slate-900">{step.title}</div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{step.description}</div>
              </button>
            )
          })}
        </div>

        {/* Exception & Completion Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {LIFECYCLE_STEPS.slice(4).map((step, idx) => {
            const Icon = step.icon
            const isCurrent = currentFulfillment === step.id
            return (
              <button
                key={step.id}
                disabled={isSimulating}
                onClick={() => handleTriggerEvent(step.id)}
                className={`p-3.5 rounded-xl border text-left transition-all group cursor-pointer ${
                  step.id === 'DELIVERED'
                    ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400'
                    : step.id === 'NDR'
                    ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-400'
                    : 'border-purple-200 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-400'
                } ${isCurrent ? 'ring-2 ring-current shadow-md' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`p-1.5 rounded-md ${
                    step.id === 'DELIVERED' ? 'bg-emerald-600 text-white' : step.id === 'NDR' ? 'bg-rose-600 text-white' : 'bg-purple-600 text-white'
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-900">{step.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{step.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3-COLUMN CROSS-PLATFORM COMPARATIVE VISUALIZER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMN 1: COURIER API & WEBHOOK PAYLOAD (RAW DATA FROM DELHIVERY) */}
        <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-lg p-5 flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Delhivery API / Webhook Payload</span>
            </div>
            <button
              onClick={() => copyToClipboard(delhiveryPayload || { status: 'Sample Payload' })}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Copy JSON Payload"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <p>This is the exact JSON structure generated and transmitted by Delhivery MCP Webhooks:</p>
          </div>

          <div className="flex-1 bg-slate-900 p-3.5 rounded-xl border border-slate-800 overflow-x-auto font-mono text-[11px] text-emerald-300 leading-relaxed max-h-[380px] overflow-y-auto">
            <pre>{JSON.stringify(delhiveryPayload || {
              Shipment: {
                AWB: currentOrder?.trackingNumber || '7855207565109',
                Status: {
                  Status: currentFulfillment,
                  StatusCode: currentFulfillment === 'DELIVERED' ? 'DL' : 'PU',
                  StatusDateTime: new Date().toISOString(),
                  StatusLocation: 'Surat Central Logistics Hub, Gujarat',
                  Instructions: 'Manifested via Delhivery Express B2C',
                },
                Destination: currentOrder?.shippingAddress?.city || 'Surat',
                CODAmount: currentOrder?.paymentMethod === 'COD' ? currentOrder?.totalAmount : 0,
                CollectedAmount: currentFulfillment === 'DELIVERED' && currentOrder?.paymentMethod === 'COD' ? currentOrder?.totalAmount : 0,
              },
              EventSource: 'DELHIVERY_B2C_MCP_WEBHOOK_V2',
              SimulatorStatus: 'ONLINE_ACTIVE',
            }, null, 2)}</pre>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span>Webhook Endpoint: <code className="text-blue-300">POST /api/webhooks/delhivery</code></span>
          </div>
        </div>

        {/* COLUMN 2: ADMIN PANEL IMPACT VIEW */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Admin System Impact</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full">
              Real-time DB State
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {/* Fulfillment Pill */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Order Fulfillment Status</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900">{currentFulfillment}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  Active
                </span>
              </div>
            </div>

            {/* System Locks Matrix */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Security & Business Locks</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Customer Address Editing:</span>
                  <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                    isAddressLocked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isAddressLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    {isAddressLocked ? 'LOCKED (Post-Pickup)' : 'ALLOWED (Pre-Pickup)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Pre-Pickup Order Cancellation:</span>
                  <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                    isCancelLocked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isCancelLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    {isCancelLocked ? 'LOCKED (Courier Active)' : 'ALLOWED (Pre-Pickup)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Status */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Financial & Cash Accounting</span>
              <div className="text-xs text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span>Payment Gateway:</span>
                  <span className="font-bold text-slate-900">{currentOrder?.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay (Prepaid)'}</span>
                </div>
                <div className="flex justify-between">
                  <span>COD Collection Status:</span>
                  <span className={`font-bold ${currentOrder?.codCollectionStatus === 'COLLECTED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {currentOrder?.codCollectionStatus || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 text-[11px] leading-relaxed">
            <strong>Admin Action Needed:</strong> {
              currentFulfillment === 'READY_FOR_PICKUP' ? 'Handover parcel to courier rider upon arrival.' :
              currentFulfillment === 'DELIVERED' && currentOrder?.paymentMethod === 'COD' ? 'Reconcile cash collected with Delhivery COD Remittance.' :
              'Monitor tracking milestones and address any delivery exceptions.'
            }
          </div>
        </div>

        {/* COLUMN 3: USER / CUSTOMER DASHBOARD LIVE SIMULATION */}
        <div className="bg-[#FAF8F5] rounded-2xl border border-amber-100 shadow-sm p-5 flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-amber-700" />
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">User Dashboard Live Preview</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-amber-200/60 text-amber-900 font-bold rounded-full">
              Customer View
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {/* Customer Order Card Mockup */}
            <div className="bg-white rounded-xl p-4 border border-amber-200/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">ORDER NUMBER</span>
                  <span className="text-xs font-bold text-slate-900">{currentOrder?.orderNumber}</span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 font-bold rounded-full bg-blue-100 text-blue-800">
                  {currentFulfillment === 'DELIVERED' ? 'Delivered' : currentFulfillment === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'In Transit'}
                </span>
              </div>

              {/* Live Tracking Progress Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                  <span className="text-blue-600">Placed</span>
                  <span className={['READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentFulfillment) ? 'text-blue-600' : ''}>Packed</span>
                  <span className={['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentFulfillment) ? 'text-blue-600' : ''}>Shipped</span>
                  <span className={currentFulfillment === 'DELIVERED' ? 'text-emerald-600' : ''}>Delivered</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className={`h-full bg-blue-600 transition-all duration-500 ${
                    currentFulfillment === 'DELIVERED' ? 'w-full bg-emerald-500' :
                    currentFulfillment === 'OUT_FOR_DELIVERY' ? 'w-4/5 bg-amber-500' :
                    currentFulfillment === 'IN_TRANSIT' ? 'w-3/5' :
                    currentFulfillment === 'PICKED_UP' ? 'w-2/5' :
                    currentFulfillment === 'READY_FOR_PICKUP' ? 'w-1/5' : 'w-1/12'
                  }`} />
                </div>
              </div>

              {/* Customer Milestone Message */}
              <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <span>Delhivery Express (AWB: {currentOrder?.trackingNumber || 'Pending'})</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {currentFulfillment === 'DELIVERED'
                    ? '🎉 Your package was delivered safely to your doorstep.'
                    : currentFulfillment === 'OUT_FOR_DELIVERY'
                    ? '🛵 Rider is out for delivery today. Keep cash ready if COD.'
                    : currentFulfillment === 'PICKED_UP'
                    ? '📦 Courier partner picked up package from Surat warehouse.'
                    : 'Shipment is being prepared and processed for transit.'}
                </p>
              </div>

              {/* Customer Action Buttons Status */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Edit Address:</span>
                <span className={isAddressLocked ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {isAddressLocked ? '🔒 Locked (After Courier Pickup)' : '✏️ Editable'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-amber-100/50 text-amber-950 rounded-xl border border-amber-200/80 text-[11px] leading-relaxed">
            <strong>Customer Assurance:</strong> All status updates, SMS notifications, and delivery estimates update automatically without manual intervention.
          </div>
        </div>

      </div>

      {/* Activity Log Vault for this Simulation Session */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Simulation Event History (Current Session)</span>
          </h3>

          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 text-[10px]">{log.time}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md text-[10px]">
                    {log.event}
                  </span>
                  <span className="font-bold text-slate-800">{log.title}</span>
                  <span className="text-slate-500 hidden sm:inline">({log.location})</span>
                </div>
                <span className="text-slate-600 text-[11px] truncate max-w-xs">{log.remarks}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
