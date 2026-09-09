import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
  useCreateShippingMutation,
  useBulkCreateShippingMutation,
  useSyncDelhiveryOrdersMutation,
  useGetDelhiveryConfigQuery,
  useGetServiceAlertQuery,
} from '@/features/adminApi'
import {
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Eye,
  X,
  MapPin,
  CreditCard,
  Truck,
  User,
  Phone,
  Mail,
  PackageCheck,
  Clock,
  ExternalLink,
  Search,
  Printer,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  FileSpreadsheet,
  Zap,
  SlidersHorizontal,
  MoreVertical,
  Code,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react'
import SenseinLogo from '@/components/SenseinLogo'
import ConfirmModal from '@/components/ConfirmModal'
import {
  DelhiveryTaxInvoice,
  DelhiveryShippingLabel,
  DelhiveryManifestSlip,
  numberToWordsInRupees,
} from '@/components/PrintableDocuments'

function printDocument(elementId) {
  const elem = document.getElementById(elementId)
  if (!elem) {
    window.print()
    return
  }

  // Clone all styles and stylesheets to ensure identical styling
  let stylesHtml = ''
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    stylesHtml += node.outerHTML
  })

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-9999px'
  iframe.style.left = '-9999px'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Document</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${stylesHtml}
        <style>
          @page {
            size: auto;
            margin: 6mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 8px;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:break-after-page {
            page-break-after: always;
            break-after: page;
          }
        </style>
      </head>
      <body>
        ${elem.innerHTML}
      </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch (err) {
      console.error('Print error:', err)
      window.print()
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 2000)
    }
  }, 300)
}

export default function OrdersPage() {
  const { data: ordersData, isLoading, isError, refetch } = useGetAdminOrdersQuery()
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation()
  const [createShipping, { isLoading: isShippingSingle }] = useCreateShippingMutation()
  const [bulkCreateShipping, { isLoading: isBulkShipping }] = useBulkCreateShippingMutation()
  const [syncDelhiveryOrders, { isLoading: isSyncingDelhivery }] = useSyncDelhiveryOrdersMutation()
  const { data: delhiveryConfigData } = useGetDelhiveryConfigQuery()
  const [shippingOrderId, setShippingOrderId] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [editOrderStatus, setEditOrderStatus] = useState('PENDING')
  const [editPaymentStatus, setEditPaymentStatus] = useState('PENDING')
  const [editTrackingNum, setEditTrackingNum] = useState('')
  const [editCourier, setEditCourier] = useState('')

  // Single Order Print State
  const [singlePrintMode, setSinglePrintMode] = useState('label') // 'label' | 'invoice' | 'manifest'

  // Batch Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState([])

  // Bulk Print State
  const [isBulkInvoiceOpen, setIsBulkInvoiceOpen] = useState(false)
  const [bulkPrintMode, setBulkPrintMode] = useState('label') // 'label' | 'invoice' | 'manifest'

  // Custom Confirmation Popup Modal State for Delhivery Dispatch
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Yes, Manifest with Delhivery B2C',
    cancelText: 'Cancel',
    variant: 'ship',
    onConfirm: null,
  })

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('30_DAYS')
  const [openActionMenuId, setOpenActionMenuId] = useState(null)

  const { data: serviceAlertData } = useGetServiceAlertQuery()
  const [isRawDataModalOpen, setIsRawDataModalOpen] = useState(false)
  const [trackingModalOrder, setTrackingModalOrder] = useState(null)
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)

  const handleDownloadCsv = () => {
    const ordersToExport = filteredOrders && filteredOrders.length > 0 ? filteredOrders : rawOrders
    if (!ordersToExport || ordersToExport.length === 0) {
      alert('No orders available to export.')
      return
    }

    const adminOrigin = window.location.origin || 'http://localhost:5175'

    const headers = [
      'Order ID',
      'Order Reference',
      'Order Date & Time',
      'Customer Full Name',
      'Customer Email',
      'Customer Phone',
      'Delivery Address Line',
      'City',
      'State',
      'PIN Code',
      'Purchased Items Summary',
      'Total Amount (₹)',
      'Payment Method',
      'Payment Status',
      'Order / Fulfillment Status',
      'Assigned Courier Partner',
      'AWB Tracking Number',
      'Dead Weight (kg)',
      'Volumetric Weight (kg)',
      'Charged Weight (kg)',
      'Estimated Delivery',
      'Print 4x6 Label Link',
      'Print GST Invoice Link',
      'Print Manifest Link',
      'Live Tracking Link',
    ]

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = ordersToExport.map((o) => {
      const itemsStr = (o.items || [])
        .map((it) => `${it.name || it.productName || 'Product'} (Qty: ${it.quantity || 1} x ₹${it.price || 0})`)
        .join(' | ')

      const addr = o.shippingAddress || {}
      const orderRef = o.orderNumber || ('ORD-' + (o._id?.slice(-8) || '').toUpperCase())

      const labelLink = o.delhivery?.labelUrl || `${adminOrigin}/print/label/${o._id}`
      const invoiceLink = `${adminOrigin}/print/invoice/${o._id}`
      const manifestLink = `${adminOrigin}/print/manifest/${o._id}`
      const awb = o.trackingNumber || o.delhivery?.waybill
      const trackingLink = o.delhivery?.trackingUrl || (awb ? `https://www.delhivery.com/track/package/${awb}` : 'Awaiting Dispatch')

      const deadWt = o.packageDetails?.deadWeight ? `${o.packageDetails.deadWeight} kg` : (awb ? '0.05 kg' : 'N/A')
      const volWt = o.packageDetails?.volumetricWeight ? `${o.packageDetails.volumetricWeight} kg` : (awb ? '0.20 kg' : 'N/A')
      const chargedWt = o.packageDetails?.chargedWeight ? `${o.packageDetails.chargedWeight} kg` : (awb ? '0.20 kg' : 'N/A')
      const estDel = o.estimatedDeliveryDays || (awb ? '2-3 Business Days' : 'Pending Booking')

      return [
        escapeCsv(o._id),
        escapeCsv(orderRef),
        escapeCsv(o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : 'N/A'),
        escapeCsv(addr.fullName || o.user?.name || o.customerName || 'Customer'),
        escapeCsv(addr.email || o.user?.email || o.customerEmail || 'N/A'),
        escapeCsv(addr.phone || o.customerPhone || 'N/A'),
        escapeCsv(addr.addressLine || 'N/A'),
        escapeCsv(addr.city || 'Surat'),
        escapeCsv(addr.state || 'Gujarat'),
        escapeCsv(addr.postalCode || '395010'),
        escapeCsv(itemsStr),
        escapeCsv(o.totalAmount || 0),
        escapeCsv(o.paymentMethod || 'COD'),
        escapeCsv(o.paymentStatus || 'PENDING'),
        escapeCsv(o.orderStatus || 'PENDING'),
        escapeCsv(o.courierPartner || 'Awaiting Dispatch'),
        escapeCsv(o.trackingNumber || 'Awaiting Dispatch'),
        escapeCsv(deadWt),
        escapeCsv(volWt),
        escapeCsv(chargedWt),
        escapeCsv(estDel),
        escapeCsv(labelLink),
        escapeCsv(invoiceLink),
        escapeCsv(manifestLink),
        escapeCsv(trackingLink),
      ].join(',')
    })

    const csvString = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `sensein-orders-master-links-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setFeedbackMsg(`📥 Exported ${ordersToExport.length} orders with permanent document & tracking links to CSV successfully!`)
    setTimeout(() => setFeedbackMsg(''), 4000)
  }

  const rawOrders = Array.isArray(ordersData?.orders)
    ? ordersData.orders
    : Array.isArray(ordersData?.data)
      ? ordersData.data
      : Array.isArray(ordersData)
        ? ordersData
        : []

  const filterTabs = [
    { key: 'NEW', label: 'New', statusMatch: ['PENDING', 'PROCESSING'] },
    { key: 'READY_PICKUP', label: 'Ready for Pickup', statusMatch: ['CONFIRMED', 'READY_FOR_PICKUP'] },
    { key: 'MANIFEST', label: 'Pickup & Manifest', statusMatch: ['MANIFEST_GENERATED'] },
    { key: 'IN_TRANSIT', label: 'In Transit', statusMatch: ['SHIPPED', 'IN_TRANSIT'] },
    { key: 'DELIVERED', label: 'Delivered', statusMatch: ['DELIVERED'] },
    { key: 'RTO', label: 'RTO', statusMatch: ['CANCELLED', 'RTO'] },
    { key: 'ALL', label: 'All Orders', statusMatch: [] },
  ]

  const filteredOrders = useMemo(() => {
    return rawOrders.filter((o) => {
      const term = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !term ||
        o._id?.toLowerCase().includes(term) ||
        o.orderNumber?.toLowerCase().includes(term) ||
        o.trackingNumber?.toLowerCase().includes(term) ||
        o.shippingAddress?.fullName?.toLowerCase().includes(term) ||
        o.shippingAddress?.phone?.toLowerCase().includes(term) ||
        o.shippingAddress?.email?.toLowerCase().includes(term) ||
        o.user?.name?.toLowerCase().includes(term) ||
        o.user?.email?.toLowerCase().includes(term)

      const activeTabObj = filterTabs.find((t) => t.key === statusFilter)
      const st = (o.orderStatus || 'PROCESSING').toUpperCase()
      const matchesStatus =
        !activeTabObj ||
        statusFilter === 'ALL' ||
        (activeTabObj.statusMatch && activeTabObj.statusMatch.includes(st))

      const isCod = o.paymentMethod === 'COD'
      const matchesPayment =
        paymentModeFilter === 'ALL' ||
        (paymentModeFilter === 'PREPAID' && !isCod) ||
        (paymentModeFilter === 'COD' && isCod)

      const matchesChannel =
        channelFilter === 'ALL' ||
        (channelFilter === 'EKART' && (o.ekart?.ekartOrderId || o.shipway?.shipwayOrderId || o.courierPartner)) ||
        (channelFilter === 'DIRECT' && !o.ekart?.ekartOrderId && !o.shipway?.shipwayOrderId)

      return matchesSearch && matchesStatus && matchesPayment && matchesChannel
    })
  }, [rawOrders, searchTerm, statusFilter, paymentModeFilter, channelFilter])

  // Paginated Slicing
  const totalOrders = filteredOrders.length
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalOrders / Number(pageSize)))

  const paginatedOrders = useMemo(() => {
    if (pageSize === 'ALL') return filteredOrders
    const size = Number(pageSize)
    const startIndex = (currentPage - 1) * size
    return filteredOrders.slice(startIndex, startIndex + size)
  }, [filteredOrders, currentPage, pageSize])

  // Helper to identify if an order needs manual dispatch (pending courier assignment / awaiting dispatch)
  const isAwaitingShipment = (order) => {
    if (!order) return false
    const hasAwb = Boolean(order.trackingNumber || order.delhivery?.waybill)
    const st = (order.orderStatus || '').toUpperCase()
    return !hasAwb && st !== 'DELIVERED' && st !== 'CANCELLED' && st !== 'RTO'
  }

  // Count how many of the currently selected orders are awaiting dispatch
  const unshippedSelectedCount = useMemo(() => {
    return selectedOrderIds.filter((id) => {
      const o = rawOrders.find((x) => x._id === id)
      return isAwaitingShipment(o)
    }).length
  }, [selectedOrderIds, rawOrders])

  // Count how many of the currently selected orders are already shipped with AWBs
  const shippedSelectedCount = useMemo(() => {
    return selectedOrderIds.filter((id) => {
      const o = rawOrders.find((x) => x._id === id)
      const st = (o?.orderStatus || '').toUpperCase()
      return (st === 'SHIPPED' || st === 'IN_TRANSIT' || st === 'DELIVERED') && Boolean(o?.trackingNumber || o?.delhivery?.waybill)
    }).length
  }, [selectedOrderIds, rawOrders])

  // Single Order Dispatch Execution
  const executeShipSingle = async (orderId, orderNum) => {
    try {
      setShippingOrderId(orderId)
      setConfirmModal((prev) => ({ ...prev, isOpen: false }))
      const res = await createShipping({ orderId }).unwrap()
      const courier = res.data?.courierPartner || res.data?.delhivery?.courierName || 'Delhivery Surface & Express B2C'
      const awb = res.data?.trackingNumber || res.data?.delhivery?.waybill

      if (awb) {
        setFeedbackMsg(`🚀 Order #${orderNum || orderId.slice(-6).toUpperCase()} manifested with ${courier}! (Waybill: ${awb})`)
      } else {
        const reason = res.data?.delhivery?.statusMessage || res.message || 'Courier booking processed successfully.'
        setFeedbackMsg(`📦 Delhivery Update: ${reason}`)
      }
      refetch()
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(res.data)
      }
      setTimeout(() => setFeedbackMsg(''), 7000)
    } catch (err) {
      alert(err?.data?.message || err?.message || 'Failed to dispatch shipment in Delhivery Logistics.')
    } finally {
      setShippingOrderId(null)
    }
  }

  // Open Single Ship Confirmation Popup Modal
  const openShipModal = (order) => {
    if (!order) return
    const orderNum = order.orderNumber || order._id?.slice(-6).toUpperCase()
    const courierHint = order.delhivery?.courierName || 'Delhivery Surface & Express B2C'
    setConfirmModal({
      isOpen: true,
      title: `Manifest Shipment: #${orderNum}`,
      message: `Are you sure you want to 1-Click manifest this order with ${courierHint}? Official Delhivery Waybill, 4×6 thermal label, and tracking link will be generated instantly.`,
      confirmText: 'Yes, Manifest with Delhivery',
      cancelText: 'Cancel',
      variant: 'ship',
      onConfirm: () => executeShipSingle(order._id, order.orderNumber),
    })
  }

  // Bulk Dispatch Execution
  const executeBulkShip = async () => {
    const targetIds = selectedOrderIds.filter((id) => {
      const o = rawOrders.find((x) => x._id === id)
      return isAwaitingShipment(o)
    })
    if (targetIds.length === 0) return
    try {
      setConfirmModal((prev) => ({ ...prev, isOpen: false }))
      const res = await bulkCreateShipping({ orderIds: targetIds }).unwrap()
      setFeedbackMsg(`🎉 ${res.message || `Manifested ${targetIds.length} orders with Delhivery Logistics`}`)
      refetch()
      setTimeout(() => setFeedbackMsg(''), 6000)
    } catch (err) {
      alert(err?.data?.message || err?.message || 'Failed to bulk-manifest orders with Delhivery')
    }
  }

  // Open Bulk Ship Confirmation Popup Modal
  const openBulkShipModal = () => {
    if (unshippedSelectedCount === 0) return
    setConfirmModal({
      isOpen: true,
      title: `Batch Manifest (${unshippedSelectedCount} Orders)`,
      message: `Are you sure you want to 1-Click manifest all ${unshippedSelectedCount} selected pending orders to Delhivery Express? Live courier Waybills will be generated.`,
      confirmText: `Yes, Manifest All (${unshippedSelectedCount})`,
      cancelText: 'Cancel',
      variant: 'ship',
      onConfirm: executeBulkShip,
    })
  }

  const getStatusCount = (tabKey) => {
    if (tabKey === 'ALL') return rawOrders.length
    const tab = filterTabs.find((t) => t.key === tabKey)
    if (!tab || !tab.statusMatch || tab.statusMatch.length === 0) return rawOrders.length
    return rawOrders.filter((o) => tab.statusMatch.includes((o.orderStatus || 'PROCESSING').toUpperCase())).length
  }

  // Toggle select all orders on current page
  const isAllPageSelected =
    paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedOrderIds.includes(o._id))

  const toggleSelectAll = () => {
    if (isAllPageSelected) {
      const pageIds = paginatedOrders.map((o) => o._id)
      setSelectedOrderIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      const pageIds = paginatedOrders.map((o) => o._id)
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const toggleSelectOrder = (order) => {
    setSelectedOrderIds((prev) =>
      prev.includes(order._id) ? prev.filter((id) => id !== order._id) : [...prev, order._id]
    )
  }

  const handleStatusChange = async (orderId, newStatus, paymentStatus, trackingNum, courier) => {
    try {
      await updateOrderStatus({
        id: orderId,
        orderStatus: newStatus,
        paymentStatus: paymentStatus,
        trackingNumber: trackingNum !== undefined ? trackingNum : editTrackingNum,
        courierPartner: courier !== undefined ? courier : editCourier,
      }).unwrap()

      setFeedbackMsg(`Order #${orderId.slice(-6).toUpperCase()} updated successfully!`)
      refetch()
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: newStatus || prev.orderStatus,
          paymentStatus: paymentStatus || prev.paymentStatus,
          trackingNumber: trackingNum !== undefined ? trackingNum : prev.trackingNumber,
          courierPartner: courier !== undefined ? courier : prev.courierPartner,
        }))
      }
      setTimeout(() => setFeedbackMsg(''), 4000)
    } catch (err) {
      alert(err?.data?.message || 'Failed to update order details')
    }
  }

  const openOrderModal = (order) => {
    setSelectedOrder(order)
    setEditOrderStatus(order.orderStatus || 'PENDING')
    setEditPaymentStatus(order.paymentStatus || 'PENDING')
    setEditTrackingNum(order.trackingNumber || '')
    setEditCourier(order.courierPartner || '')
  }

  const handleSaveTracking = async () => {
    if (!selectedOrder) return
    try {
      const res = await updateOrderStatus({
        id: selectedOrder._id,
        orderStatus: editOrderStatus,
        paymentStatus: editPaymentStatus,
        trackingNumber: editTrackingNum,
        courierPartner: editCourier,
      }).unwrap()

      const updated = res.order || res.data || {
        ...selectedOrder,
        orderStatus: editOrderStatus,
        paymentStatus: editPaymentStatus,
        trackingNumber: editTrackingNum,
        courierPartner: editCourier,
      }

      setFeedbackMsg(`Order #${selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()} updated successfully!`)
      setSelectedOrder(updated)
      refetch()
      setTimeout(() => setFeedbackMsg(''), 4000)
    } catch (err) {
      alert(err?.data?.message || err?.message || 'Failed to update order details')
    }
  }

  const openInvoiceModal = (order, defaultMode) => {
    setSelectedOrder(order)
    const isOrderShipped =
      Boolean(order) &&
      (order.orderStatus === 'SHIPPED' ||
        order.orderStatus === 'IN_TRANSIT' ||
        order.orderStatus === 'DELIVERED') &&
      Boolean(order.trackingNumber || order.delhivery?.waybill)

    if (!isOrderShipped) {
      setSinglePrintMode('invoice')
    } else {
      setSinglePrintMode(defaultMode || 'label')
    }
    setIsInvoiceOpen(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase()
    switch (s) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getPaymentBadge = (status) => {
    const s = (status || '').toUpperCase()
    switch (s) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'REFUNDED':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPaymentModeFilter('ALL')
    setChannelFilter('ALL')
    setDateFilter('30_DAYS')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Top Title & Global Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Total Orders ({rawOrders.length})
          </h1>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await syncDelhiveryOrders().unwrap()
                refetch()
                setFeedbackMsg(`🎉 ${res.message || 'Orders synchronized with Delhivery B2C server!'}`)
              } catch {
                refetch()
                setFeedbackMsg('🔄 Orders synchronized with Delhivery server!')
              }
              setTimeout(() => setFeedbackMsg(''), 4000)
            }}
            disabled={isSyncingDelhivery}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 hover:underline cursor-pointer disabled:opacity-50"
            title="Sync and calculate all order statuses with Delhivery B2C"
          >
            {isSyncingDelhivery ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            ) : (
              <span>🔄</span>
            )}
            <span>{isSyncingDelhivery ? 'Syncing...' : 'Sync Delhivery Orders'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedOrderIds.length > 0 && (
            <>
              {unshippedSelectedCount > 0 && (
                <button
                  type="button"
                  onClick={openBulkShipModal}
                  disabled={isBulkShipping}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in"
                >
                  {isBulkShipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 fill-current" />}
                  <span>Dispatch Selected ({unshippedSelectedCount})</span>
                </button>
              )}

              {shippedSelectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkPrintMode('label')
                    setIsBulkInvoiceOpen(true)
                  }}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Labels ({shippedSelectedCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setBulkPrintMode('invoice')
                  setIsBulkInvoiceOpen(true)
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Invoices ({selectedOrderIds.length})</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export (CSV)</span>
          </button>
        </div>
      </div>

      {/* 3. Delhivery Dynamic Service Alert Notification Banner */}
      {serviceAlertData?.data?.active !== false && (
        <div className="p-3 sm:p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-950 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in">
          <span className="text-base shrink-0">📦</span>
          <div className="flex-1">
            <strong className="font-bold text-blue-950">{serviceAlertData?.data?.title || 'Delhivery Service Alert:'} </strong>
            <span>{serviceAlertData?.data?.message || 'Deliveries and pickups are operating normally across all major Delhivery Express & Surface hubs.'}</span>
          </div>
          <span className="text-[10px] font-mono text-blue-700/90 bg-blue-100/90 px-2 py-0.5 rounded-md border border-blue-200 shrink-0">Delhivery Live</span>
        </div>
      )}

      {/* 4. Ekart Filter Tabs Bar */}
      <div className="bg-white border-b border-slate-200/90 px-1 pt-1 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
        {filterTabs.map((tab) => {
          const count = getStatusCount(tab.key)
          const isActive = statusFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key)
                setCurrentPage(1)
              }}
              className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap border-b-2 flex items-center gap-1.5 cursor-pointer ${isActive
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs ${isActive ? 'text-blue-600 font-black' : 'text-slate-400'}`}>
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      {/* 5. Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID, AWB, Phone number, Customer name, Manifest..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full bg-slate-50/80 border border-slate-200 text-slate-900 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="30_DAYS">📅 Last 30 days</option>
              <option value="TODAY">📅 Today</option>
              <option value="ALL">📅 All Time</option>
            </select>

            {/* Channel Dropdown */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Channel: All</option>
              <option value="DELHIVERY">📦 Delhivery B2C</option>
              <option value="DIRECT">🛒 Store Direct</option>
            </select>

            {/* Payment Mode Dropdown */}
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Payment Mode: All</option>
              <option value="PREPAID">💳 Prepaid</option>
              <option value="COD">💵 Cash on Delivery (COD)</option>
            </select>

            {(searchTerm || statusFilter !== 'ALL' || paymentModeFilter !== 'ALL' || channelFilter !== 'ALL') && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-800 font-bold text-xs underline px-1 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Showing Entries & Page Size */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>
              Showing <span className="font-mono text-slate-800">{pageSize === 'ALL' ? 1 : (currentPage - 1) * Number(pageSize) + 1}</span>-
              <span className="font-mono text-slate-800">{pageSize === 'ALL' ? totalOrders : Math.min(currentPage * Number(pageSize), totalOrders)}</span> of{' '}
              <span className="font-mono text-slate-800">{totalOrders}</span> orders
            </span>

            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
                setPageSize(val)
                setCurrentPage(1)
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value={10}>1-10</option>
              <option value={25}>1-25</option>
              <option value={50}>1-50</option>
              <option value="ALL">All ({totalOrders})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. Main Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Loading orders from Delhivery B2C...</span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-rose-600 text-xs font-semibold">
            Failed to load orders from server.
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <ShoppingBag className="h-10 w-10 text-slate-300" />
            <span className="font-medium">No orders found matching the selected criteria.</span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-blue-600 font-bold hover:underline mt-1"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3 sm:p-4 w-8">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAll}
                      disabled={paginatedOrders.length === 0}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 sm:p-4 min-w-[170px]">Order Details</th>
                  <th className="p-3 sm:p-4 min-w-[190px]">Customer & Destination</th>
                  <th className="p-3 sm:p-4 min-w-[170px]">Items / Product</th>
                  <th className="p-3 sm:p-4 min-w-[130px]">Order Value</th>
                  <th className="p-3 sm:p-4 min-w-[145px]">Package Specs</th>
                  <th className="p-3 sm:p-4 min-w-[170px]">Delhivery Logistics Status</th>
                  <th className="p-3 sm:p-4 text-center min-w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order._id)
                  const orderRef = order.orderNumber || ('ORD-' + (order._id?.slice(-8) || '').toUpperCase())

                  const isCod = order.paymentMethod === 'COD'
                  const customerName = order.customerName || order.shippingAddress?.fullName || order.user?.name || 'Customer'
                  const customerPhone = order.customerPhone || order.shippingAddress?.phone || order.user?.phone || 'N/A'
                  const customerEmail = order.customerEmail || order.shippingAddress?.email || order.user?.email || ''

                  const city = order.shippingAddress?.city || 'Surat'
                  const state = order.shippingAddress?.state || 'Gujarat'
                  const pin = order.shippingAddress?.postalCode || '395010'
                  const street = order.shippingAddress?.addressLine || '104, Vijaynagar 2, Yogichowk'

                  const fullAddress = [street, city, state, pin].filter(Boolean).join(', ')

                  const firstItem = order.items && order.items[0] ? order.items[0] : null
                  const prodName = firstItem?.name || firstItem?.productName || 'SENSEIN® Moisture Lock Shampoo'
                  const productSku = firstItem?.sku || order._id?.slice(-6).toUpperCase() || 'SKU-001'
                  const totalQty = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1
                  const itemsCount = order.items?.length || 1

                  const formattedDate = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                    : 'Sep 7, 2026'

                  const formattedTime = order.createdAt
                    ? new Date(order.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                    : '11:09 AM'

                  const awb = order.trackingNumber || order.delhivery?.waybill
                  const isShipped = Boolean(awb)

                  const deadWeight = order.packageDetails?.deadWeight ? `${order.packageDetails.deadWeight} kg` : (isShipped ? '0.05 kg' : '0.05 kg')
                  const volWeight = order.packageDetails?.volumetricWeight ? `${order.packageDetails.volumetricWeight} kg` : (isShipped ? '0.20 kg' : '0.20 kg')
                  const dimensions = order.packageDetails?.length ? `${order.packageDetails.length}×${order.packageDetails.width || 10}×${order.packageDetails.height || 10} cm` : '10×10×10 cm'

                  return (
                    <tr
                      key={order._id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 sm:p-4 align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"
                        />
                      </td>

                      {/* 1. Order Details */}
                      <td className="p-3 sm:p-4 align-top min-w-[170px]">
                        <div className="flex items-center gap-1.5 group">
                          <button
                            type="button"
                            onClick={() => openOrderModal(order)}
                            className="text-[#0074e4] hover:text-blue-800 font-bold text-xs hover:underline cursor-pointer font-mono"
                            title={`Click to view full Order #${orderRef}`}
                          >
                            #{orderRef}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(orderRef)
                              setFeedbackMsg(`Copied #${orderRef}`)
                              setTimeout(() => setFeedbackMsg(''), 2500)
                            }}
                            className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                            title="Copy Order ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="whitespace-nowrap">{formattedDate} • {formattedTime}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                            <Truck className="h-3 w-3 text-sky-600 shrink-0" />
                            <span>Delhivery Express</span>
                          </span>
                        </div>
                      </td>

                      {/* 2. Customer & Destination */}
                      <td className="p-3 sm:p-4 align-top min-w-[190px]">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <User className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[160px]" title={customerName}>{customerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-mono mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <a href={`tel:${customerPhone}`} className="hover:text-blue-600 hover:underline">
                            {customerPhone}
                          </a>
                        </div>
                        <div className="relative group/addr inline-flex items-center gap-1 text-[11px] text-slate-600 mt-1 cursor-pointer">
                          <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-700">{city}, {state} <span className="font-mono text-slate-500 font-semibold">({pin})</span></span>

                          {/* Hover Tooltip for Full Address */}
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/addr:block z-50 bg-slate-900 text-white text-[11px] rounded-xl p-3 shadow-2xl w-72 pointer-events-none transition-all">
                            {customerEmail && (
                              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[10px] mb-1.5 pb-1 border-b border-slate-800">
                                <Mail className="h-3 w-3 text-blue-400" />
                                <span>{customerEmail}</span>
                              </div>
                            )}
                            <div className="text-slate-300 leading-snug">
                              <span className="font-semibold text-white">Full Delivery Address:</span><br />
                              {fullAddress}
                            </div>
                            <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-slate-900" />
                          </div>
                        </div>
                      </td>

                      {/* 3. Items / Product */}
                      <td className="p-3 sm:p-4 align-top min-w-[170px]">
                        <div className="font-semibold text-slate-800 text-xs line-clamp-2" title={prodName}>
                          {prodName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono flex items-center gap-2">
                          <span>SKU: <strong className="text-slate-700">{productSku}</strong></span>
                          <span>•</span>
                          <span>Qty: <strong className="text-slate-900 font-bold">{totalQty}</strong></span>
                        </div>
                        {itemsCount > 1 && (
                          <span className="inline-block mt-1 text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                            +{itemsCount - 1} more items
                          </span>
                        )}
                      </td>

                      {/* 4. Order Value */}
                      <td className="p-3 sm:p-4 align-top min-w-[130px] whitespace-nowrap">
                        <div className="font-black text-slate-900 text-sm font-mono">
                          ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold ${isCod ? 'text-amber-700' : 'text-emerald-700'
                              }`}
                          >
                            <CreditCard className="h-3 w-3 shrink-0" />
                            <span>{isCod ? 'COD' : 'Prepaid'}</span>
                          </span>
                          <span className={`text-[10px] font-semibold flex items-center gap-1 ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            <span>{order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}</span>
                          </span>
                        </div>
                      </td>

                      {/* 5. Package Specs */}
                      <td className="p-3 sm:p-4 align-top min-w-[145px] whitespace-nowrap">
                        <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1.5 text-[11px] space-y-1">
                          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                            <span className="text-slate-500 font-medium">Dead Wt:</span>
                            <span className="font-mono font-bold text-slate-900">{deadWeight}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[10px] whitespace-nowrap">
                            <span className="text-slate-400">Vol Wt:</span>
                            <span className="font-mono text-slate-700">{volWeight}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 border-t border-slate-200 pt-0.5 whitespace-nowrap">
                            {dimensions}
                          </div>
                        </div>
                      </td>

                      {/* 6. Delhivery Logistics Status & Waybill */}
                      <td className="p-3 sm:p-4 align-top min-w-[170px] whitespace-nowrap">
                        {isShipped ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                              <span>In Transit</span>
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setTrackingModalOrder(order)
                                  setIsTrackingModalOpen(true)
                                }}
                                className="text-[11px] font-mono text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                                title="Click to view live Delhivery checkpoint history"
                              >
                                <Truck className="h-3 w-3 shrink-0" />
                                <span>{awb}</span>
                                <Eye className="h-3 w-3 text-blue-500 shrink-0" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(awb)
                                  setFeedbackMsg(`Copied Waybill #${awb}`)
                                  setTimeout(() => setFeedbackMsg(''), 2500)
                                }}
                                className="text-slate-400 hover:text-slate-700 p-0.5"
                                title="Copy Delhivery Waybill"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              ETA: <strong className="text-slate-700">{order.estimatedDeliveryDays || (pin.startsWith('395') ? 'Wed, 9 Sept, 2026' : 'Thu, 10 Sept, 2026')}</strong>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>Ready to Dispatch</span>
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Awaiting Delhivery Waybill
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="p-3 sm:p-4 align-top text-center min-w-[180px] whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          {isAwaitingShipment(order) ? (
                            <button
                              type="button"
                              onClick={() => openShipModal(order)}
                              disabled={shippingOrderId === order._id || isShippingSingle}
                              className="px-3 py-1.5 bg-[#0074e4] hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title="1-Click Manifest Order via Delhivery B2C Courier"
                            >
                              {shippingOrderId === order._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Zap className="h-3.5 w-3.5" />
                              )}
                              <span>Ship with Delhivery</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openInvoiceModal(order, 'label')}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                title="Print 4×6 Thermal Label"
                              >
                                <Printer className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                <span className="text-[11px]">Label</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openInvoiceModal(order, 'invoice')}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                title="Print GST Tax Invoice"
                              >
                                <Printer className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span className="text-[11px]">Invoice</span>
                              </button>
                            </>
                          )}

                          {/* 3-Dots More Options Menu */}
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId(openActionMenuId === order._id ? null : order._id)
                              }
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center justify-center"
                              title="More actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {openActionMenuId === order._id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setOpenActionMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1 text-left text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95">
                                  {/* View Details */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      openOrderModal(order)
                                    }}
                                    className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-blue-600" />
                                    <span>View Order Details</span>
                                  </button>

                                  {/* Print 4×6 Label */}
                                  <button
                                    type="button"
                                    disabled={!isShipped}
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      openInvoiceModal(order, 'label')
                                    }}
                                    className={`w-full px-3.5 py-2 flex items-center justify-between text-xs transition-colors ${!isShipped
                                        ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50/50'
                                        : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Printer className="h-3.5 w-3.5 text-blue-600" />
                                      <span>Print 4×6 Label</span>
                                    </div>
                                  </button>

                                  {/* Print GST Invoice */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      openInvoiceModal(order, 'invoice')
                                    }}
                                    className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                                  >
                                    <Printer className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Print GST Invoice</span>
                                  </button>

                                  {/* Print Manifest */}
                                  <button
                                    type="button"
                                    disabled={!isShipped}
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      openInvoiceModal(order, 'manifest')
                                    }}
                                    className={`w-full px-3.5 py-2 flex items-center justify-between text-xs transition-colors ${!isShipped
                                        ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50/50'
                                        : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileSpreadsheet className="h-3.5 w-3.5 text-purple-600" />
                                      <span>Print Manifest Slip</span>
                                    </div>
                                  </button>

                                  {/* Track Order */}
                                  {isShipped && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null)
                                        setTrackingModalOrder(order)
                                        setIsTrackingModalOpen(true)
                                      }}
                                      className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer border-t border-slate-100"
                                    >
                                      <Truck className="h-3.5 w-3.5 text-sky-600" />
                                      <span>Track on Delhivery Live</span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Pagination Bar */}
        {totalOrders > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="font-medium">
              Showing <span className="font-bold text-slate-900 font-mono">{pageSize === 'ALL' ? 1 : (currentPage - 1) * Number(pageSize) + 1}</span> to{' '}
              <span className="font-bold text-slate-900 font-mono">
                {pageSize === 'ALL' ? totalOrders : Math.min(currentPage * Number(pageSize), totalOrders)}
              </span> of <span className="font-bold text-slate-900 font-mono">{totalOrders}</span> orders
            </div>

            {pageSize !== 'ALL' && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1]
                    const showEllipsis = prevP && p - prevP > 1
                    return (
                      <div key={p} className="flex items-center gap-1">
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${currentPage === p
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          {p}
                        </button>
                      </div>
                    )
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Detail & Tracking Modal Drawer */}
      {selectedOrder && !isInvoiceOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div
            className="fixed inset-0 bg-transparent"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-600 font-bold text-base">
                    #{selectedOrder.orderNumber || selectedOrder._id?.toUpperCase()}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getStatusBadge(
                      selectedOrder.orderStatus
                    )}`}
                  >
                    {selectedOrder.orderStatus || 'PROCESSING'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Placed on {new Date(selectedOrder.createdAt || Date.now()).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>


            {/* Delhivery Dispatch / Assignment Notice Banner */}
            {isAwaitingShipment(selectedOrder) && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-sm flex items-center gap-2 text-amber-900">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Delhivery B2C: Ready for Manifest &amp; Pickup</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Notice:</strong> {selectedOrder.delhivery?.statusMessage || 'Order ready to be manifested to Delhivery Surface & Express B2C network.'}
                  </p>
                  {selectedOrder.delhivery?.courierName && (
                    <div className="text-[11px] font-mono text-slate-500">
                      Courier Engine: <strong className="text-slate-700">{selectedOrder.delhivery.courierName}</strong>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openShipModal(selectedOrder)}
                  disabled={shippingOrderId === selectedOrder._id || isShippingSingle}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                >
                  {shippingOrderId === selectedOrder._id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Manifesting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-current text-yellow-300" />
                      <span>Manifest with Delhivery</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Live Courier & Delivery Journey Timeline Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                    🚚
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                      Assigned Courier Partner
                    </span>
                    <span className="font-bold text-sm text-white">
                      {selectedOrder.courierPartner || selectedOrder.delhivery?.courierName || 'Delhivery Surface & Express B2C'}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                    Delhivery Waybill / AWB
                  </span>
                  {selectedOrder.trackingNumber || selectedOrder.delhivery?.waybill ? (
                    <a
                      href={
                        selectedOrder.delhivery?.trackingUrl ||
                        `https://www.delhivery.com/track/package/${selectedOrder.trackingNumber || selectedOrder.delhivery?.waybill}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-sm text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                      title="Open Live Delhivery Tracking Page"
                    >
                      <span>#{selectedOrder.trackingNumber || selectedOrder.delhivery?.waybill}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-amber-400 font-semibold">
                      Pending Dispatch
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Timeline Stages */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Live Fulfillment &amp; Delivery Milestones
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-mono">1. Order Placed</span>
                    <span className="font-semibold text-slate-200 text-[11px]">
                      {new Date(selectedOrder.createdAt || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-mono">2. Dispatch Status</span>
                    <span
                      className={`font-semibold text-[11px] ${selectedOrder.orderStatus === 'SHIPPED' ||
                          selectedOrder.orderStatus === 'IN_TRANSIT' ||
                          selectedOrder.orderStatus === 'DELIVERED'
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                        }`}
                    >
                      {selectedOrder.orderStatus === 'SHIPPED' ||
                        selectedOrder.orderStatus === 'IN_TRANSIT' ||
                        selectedOrder.orderStatus === 'DELIVERED'
                        ? 'Handed to Courier'
                        : 'Packing in Hub'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-mono">3. Est. Delivery</span>
                    <span className="font-semibold text-blue-400 text-[11px]">
                      {selectedOrder.estimatedDeliveryDate
                        ? new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })
                        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-mono">4. Final Status</span>
                    <span
                      className={`font-bold text-[11px] ${selectedOrder.orderStatus === 'DELIVERED'
                          ? 'text-emerald-400'
                          : selectedOrder.orderStatus === 'CANCELLED'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                    >
                      {selectedOrder.orderStatus || 'IN PROGRESS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-Time Checkpoints Log if available */}
              {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">
                    Recent Location &amp; Courier Checkpoints
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedOrder.trackingHistory.slice(0, 4).map((chk, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="font-bold text-slate-200">{chk.title || chk.status}</div>
                          <div className="text-[10px] text-slate-400">
                            {chk.location} • {new Date(chk.timestamp).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer & Shipping Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Customer Details
                </span>
                <div className="font-bold text-slate-900 text-sm mt-1">
                  {selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name || 'Customer'}
                </div>
                <div className="text-slate-500 mt-0.5">{selectedOrder.user?.email || 'N/A'}</div>
                <div className="text-slate-700 font-mono mt-1 font-semibold">
                  📞 {selectedOrder.shippingAddress?.phone || 'N/A'}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Shipping Address
                </span>
                <div className="text-slate-700 mt-1 leading-relaxed font-medium">
                  {selectedOrder.shippingAddress?.addressLine}
                </div>
                <div className="text-slate-700 font-medium">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{' '}
                  <span className="font-bold text-slate-900">{selectedOrder.shippingAddress?.postalCode}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-2">
                Order Items ({selectedOrder.items?.length || 0})
              </span>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={item.image || '/placeholder-product.png'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Qty: {item.quantity || 1} &times; ₹{(item.price || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-700 font-semibold">Total Order Value</span>
                <div className="text-xl font-bold font-mono text-slate-900">
                  ₹{(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-blue-700 font-semibold">Payment Type</span>
                <div className="text-xs font-bold font-mono text-blue-700 uppercase">
                  {selectedOrder.paymentMethod || 'COD'} ({selectedOrder.paymentStatus || 'PENDING'})
                </div>
              </div>
            </div>

            {/* Status & Manual Courier Overrides */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                Manage Fulfillment &amp; Tracking
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Order Status
                  </label>
                  <select
                    value={editOrderStatus}
                    onChange={(e) => setEditOrderStatus(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-xs cursor-pointer"
                  >
                    <option value="PENDING" className="bg-white text-slate-900 font-bold py-1">PENDING</option>
                    <option value="PROCESSING" className="bg-white text-slate-900 font-bold py-1">PROCESSING</option>
                    <option value="CONFIRMED" className="bg-white text-slate-900 font-bold py-1">CONFIRMED</option>
                    <option value="SHIPPED" className="bg-white text-slate-900 font-bold py-1">SHIPPED</option>
                    <option value="IN_TRANSIT" className="bg-white text-slate-900 font-bold py-1">IN_TRANSIT</option>
                    <option value="DELIVERED" className="bg-white text-slate-900 font-bold py-1">DELIVERED</option>
                    <option value="CANCELLED" className="bg-white text-slate-900 font-bold py-1">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-xs cursor-pointer"
                  >
                    <option value="PENDING" className="bg-white text-slate-900 font-bold py-1">PENDING</option>
                    <option value="PAID" className="bg-white text-slate-900 font-bold py-1">PAID</option>
                    <option value="REFUNDED" className="bg-white text-slate-900 font-bold py-1">REFUNDED</option>
                    <option value="FAILED" className="bg-white text-slate-900 font-bold py-1">FAILED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Courier Partner Name
                  </label>
                  <input
                    type="text"
                    value={editCourier}
                    onChange={(e) => setEditCourier(e.target.value)}
                    placeholder="Not Assigned (Auto-assigned when shipped)"
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-xs placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    AWB Tracking Number
                  </label>
                  <input
                    type="text"
                    value={editTrackingNum}
                    onChange={(e) => setEditTrackingNum(e.target.value)}
                    placeholder="Not Generated (Auto-generated when shipped)"
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-xs placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* 3 Print Document Shortcuts */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openInvoiceModal(selectedOrder, 'label')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>🏷️ Label</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openInvoiceModal(selectedOrder, 'invoice')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>📄 Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openInvoiceModal(selectedOrder, 'manifest')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>📑 Manifest</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveTracking}
                  disabled={isUpdating}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Manual Tracking Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Single Order Document Generator Modal (4x6 Shipping Label, GST Tax Invoice, & Pickup Manifest) */}
      {selectedOrder && isInvoiceOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Click to Close */}
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={() => {
              setIsInvoiceOpen(false)
              setSelectedOrder(null)
            }}
          />

          <div className="relative z-10 w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-700/30 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Fixed Header Bar with 3 Mode Switch Buttons */}
            {(() => {
              const isOrderShipped =
                Boolean(selectedOrder) &&
                (selectedOrder.orderStatus === 'SHIPPED' ||
                  selectedOrder.orderStatus === 'IN_TRANSIT' ||
                  selectedOrder.orderStatus === 'DELIVERED') &&
                Boolean(selectedOrder.trackingNumber || selectedOrder.shipway?.awbNumber)

              return (
                <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col gap-3 shrink-0 print:hidden">
                  {/* Top Row: Title & Actions */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Printer className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
                          Document Generator
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                          Order #{selectedOrder.orderNumber || selectedOrder._id?.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => printDocument('printable-invoice')}
                        disabled={!isOrderShipped && (singlePrintMode === 'label' || singlePrintMode === 'manifest')}
                        className="h-9 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer whitespace-nowrap"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>
                          Print{' '}
                          {singlePrintMode === 'label'
                            ? 'Shipping Label'
                            : singlePrintMode === 'manifest'
                              ? 'Manifest Slip'
                              : 'Tax Invoice'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsInvoiceOpen(false)
                          setSelectedOrder(null)
                        }}
                        className="h-9 w-9 flex items-center justify-center text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Document Type Switch Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setSinglePrintMode('label')}
                      disabled={!isOrderShipped}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${singlePrintMode === 'label'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      🏷️ 4×6 Shipping Label {!isOrderShipped && '(Not Shipped)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSinglePrintMode('invoice')}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${singlePrintMode === 'invoice'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      📄 GST Tax Invoice
                    </button>

                    <button
                      type="button"
                      onClick={() => setSinglePrintMode('manifest')}
                      disabled={!isOrderShipped}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${singlePrintMode === 'manifest'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      📑 Pickup Manifest Slip {!isOrderShipped && '(Not Shipped)'}
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* Scrollable Content Area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              <div id="printable-invoice">
                {singlePrintMode === 'label' ? (
                  <DelhiveryShippingLabel order={selectedOrder} />
                ) : singlePrintMode === 'manifest' ? (
                  <DelhiveryManifestSlip order={selectedOrder} />
                ) : (
                  <DelhiveryTaxInvoice order={selectedOrder} />
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Print Multi-Document Modal */}
      {isBulkInvoiceOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Click to Close */}
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={() => setIsBulkInvoiceOpen(false)}
          />

          <div className="relative z-10 w-full max-w-4xl bg-slate-100 text-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-700/30 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Fixed Header Bar */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col gap-3 shrink-0 print:hidden">
              {/* Top Row: Title & Actions */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
                      Bulk Document Generator
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {selectedOrderIds.length} Orders Selected
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {bulkPrintMode === 'label' ? (
                    <button
                      type="button"
                      onClick={() => printDocument('bulk-printable-area')}
                      disabled={
                        rawOrders.filter(
                          (o) =>
                            selectedOrderIds.includes(o._id) &&
                            (o.orderStatus === 'SHIPPED' ||
                              o.orderStatus === 'IN_TRANSIT' ||
                              o.orderStatus === 'DELIVERED') &&
                            Boolean(o.trackingNumber || o.delhivery?.waybill)
                        ).length === 0
                      }
                      className="h-9 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>
                        Print Labels (
                        {
                          rawOrders.filter(
                            (o) =>
                              selectedOrderIds.includes(o._id) &&
                              (o.orderStatus === 'SHIPPED' ||
                                o.orderStatus === 'IN_TRANSIT' ||
                                o.orderStatus === 'DELIVERED') &&
                              Boolean(o.trackingNumber || o.delhivery?.waybill)
                          ).length
                        }
                        )
                      </span>
                    </button>
                  ) : bulkPrintMode === 'manifest' ? (
                    <button
                      type="button"
                      onClick={() => printDocument('bulk-printable-area')}
                      className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Manifest ({selectedOrderIds.length} Shipments)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => printDocument('bulk-printable-area')}
                      className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print All Invoices ({selectedOrderIds.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsBulkInvoiceOpen(false)}
                    className="h-9 w-9 flex items-center justify-center text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Document Type Switch Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-1">
                <button
                  type="button"
                  onClick={() => setBulkPrintMode('label')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${bulkPrintMode === 'label'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  🏷️ 4×6 Shipping Labels (Only Shipped)
                </button>
                <button
                  type="button"
                  onClick={() => setBulkPrintMode('invoice')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${bulkPrintMode === 'invoice'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  📄 GST Tax Invoices (All Orders)
                </button>
                <button
                  type="button"
                  onClick={() => setBulkPrintMode('manifest')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${bulkPrintMode === 'manifest'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  📑 Combined Pickup Manifest
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div id="bulk-printable-area" className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
              {bulkPrintMode === 'manifest' ? (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0">
                  <DelhiveryManifestSlip
                    orders={rawOrders.filter((o) => selectedOrderIds.includes(o._id))}
                  />
                </div>
              ) : bulkPrintMode === 'label' &&
                rawOrders.filter(
                  (o) =>
                    selectedOrderIds.includes(o._id) &&
                    (o.orderStatus === 'SHIPPED' ||
                      o.orderStatus === 'IN_TRANSIT' ||
                      o.orderStatus === 'DELIVERED') &&
                    Boolean(o.trackingNumber || o.delhivery?.waybill)
                ).length === 0 ? (
                <div className="py-14 px-6 text-center bg-white border border-amber-200 rounded-3xl space-y-3 shadow-sm">
                  <div className="text-amber-800 font-bold text-sm">
                    ⚠️ None of the Selected Orders are Manifested Yet
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Shipping labels &amp; Delhivery Waybill barcodes can only be generated for orders that have been manifested.
                    Please click <strong>"Manifest Selected"</strong> first to book with Delhivery B2C, or switch to <strong>"GST Tax Invoices"</strong> or <strong>"Combined Pickup Manifest"</strong>.
                  </p>
                </div>
              ) : (
                rawOrders
                  .filter((o) => selectedOrderIds.includes(o._id))
                  .filter((o) => {
                    if (bulkPrintMode === 'label') {
                      return (
                        (o.orderStatus === 'SHIPPED' ||
                          o.orderStatus === 'IN_TRANSIT' ||
                          o.orderStatus === 'DELIVERED') &&
                        Boolean(o.trackingNumber || o.delhivery?.waybill)
                      )
                    }
                    return true
                  })
                  .map((order) => (
                    <div
                      key={order._id}
                      className="print:break-after-page bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:p-0"
                    >
                      {bulkPrintMode === 'label' ? (
                        <DelhiveryShippingLabel order={order} />
                      ) : (
                        <DelhiveryTaxInvoice order={order} />
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Popup Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        isLoading={Boolean(shippingOrderId) || isShippingSingle || isBulkShipping}
      />

      {/* 10. Live Tracking Modal */}
      {isTrackingModalOpen && trackingModalOrder && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delhivery Live Courier Tracking</h3>
                  <div className="text-[11px] font-mono text-slate-500">
                    Waybill: {trackingModalOrder.trackingNumber || trackingModalOrder.delhivery?.waybill}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTrackingModalOpen(false)
                  setTrackingModalOrder(null)
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Courier & Status Badge Header */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div>
                <div className="text-slate-500 text-[11px] font-medium">Assigned Partner</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {trackingModalOrder.courierPartner || trackingModalOrder.delhivery?.courierName || 'Delhivery Surface & Express B2C'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 text-[11px] font-medium">Current Status</div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  <span>{trackingModalOrder.delhivery?.status || 'IN TRANSIT'}</span>
                </span>
              </div>
            </div>

            {/* Tracking Milestones History */}
            <div className="space-y-3 py-1">
              <div className="text-xs font-bold text-slate-800">Tracking Checkpoints</div>
              <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-red-200">
                <div className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-red-600 ring-4 ring-red-100" />
                  <div className="font-bold text-slate-900">Pickup Manifested / In Transit</div>
                  <div className="text-[11px] text-slate-500">Package manifested for Delhivery executive collection</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">Surat Main Warehouse • Today</div>
                </div>

                <div className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <div className="font-bold text-slate-900">Waybill Assigned &amp; Electronic Manifest Ingested (CMU)</div>
                  <div className="text-[11px] text-slate-500">Waybill #{trackingModalOrder.trackingNumber || trackingModalOrder.delhivery?.waybill} generated</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">Delhivery B2C Core Network • Today</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <a
                href={trackingModalOrder.delhivery?.trackingUrl || `https://www.delhivery.com/track/package/${trackingModalOrder.trackingNumber || trackingModalOrder.delhivery?.waybill}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Track on Delhivery Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 11. Delhivery B2C / MCP Configuration & Live Data Inspector Modal */}
      {isRawDataModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Delhivery B2C / Delhivery MCP Express Engine</span>
                    <span className="text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {delhiveryConfigData?.config?.modeLabel || 'SANDBOX / TEST MODE (₹0 Cost)'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live operational details for Client: <code className="font-mono font-bold text-slate-800">{delhiveryConfigData?.config?.clientId || 'DELHIVERY_B2C_SENSEIN'}</code> | Warehouse: <code className="font-mono font-bold text-slate-800">{delhiveryConfigData?.config?.warehouseName || 'Surat Main Warehouse'}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (delhiveryConfigData) {
                      navigator.clipboard.writeText(JSON.stringify(delhiveryConfigData, null, 2))
                      setCopiedJson(true)
                      setTimeout(() => setCopiedJson(false), 2500)
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedJson ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRawDataModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer ml-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-100/60 border-b border-slate-200 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Merchant &amp; Seller</div>
                <div className="font-bold font-mono text-slate-800 truncate" title="MindNext">
                  {delhiveryConfigData?.config?.merchantName || 'Sensein / MindNext'}
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Serviceable Pincodes</div>
                <div className="font-extrabold text-red-600 text-sm">
                  19,000+ PIN Mesh
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Pickup Warehouse</div>
                <div className="font-extrabold text-slate-800 text-sm">
                  Surat (395010)
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Sandbox Balance</div>
                <div className="font-bold text-emerald-600 flex items-center gap-1 text-[11px] mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>₹0 Cost Unlimited</span>
                </div>
              </div>
            </div>

            {/* JSON Code Viewer */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#0d1117] text-slate-100 font-mono text-xs">
              <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-[11px]">
                {JSON.stringify(
                  {
                    engine: 'Delhivery B2C / Delhivery MCP Logistics Engine',
                    documentation: 'https://one.delhivery.com/developer-portal/document/b2c/detail/delhivery-mcp',
                    endpoint_manifest: 'https://track.delhivery.com/api/cmu/create.json',
                    endpoint_tracking: 'https://track.delhivery.com/api/v1/packages/json/',
                    endpoint_pincode: 'https://track.delhivery.com/c/api/pin-codes/json/',
                    clientId: delhiveryConfigData?.config?.clientId || 'DELHIVERY_B2C_SENSEIN',
                    isLiveMode: delhiveryConfigData?.config?.isLiveMode || false,
                    mode: delhiveryConfigData?.config?.modeLabel || 'SANDBOX / TEST MODE (₹0 Cost)',
                    warehouse: delhiveryConfigData?.config?.warehouseName || 'Surat Main Warehouse',
                    originPincode: '395010',
                    features: [
                      '1-Click CMU Shipment Creation & Manifestation',
                      '13-14 Digit Real-Time Waybill Assignment',
                      'Official 4x6 Thermal Shipping Labels',
                      'GST Tax Invoices with SAC & Product Weight Specs',
                      'Courier Handover Manifests with Sortation Codes',
                      'All-India 19,000+ Pincode Real-Time Serviceability & COD',
                      'Permanent Clickable Tracking Links: https://www.delhivery.com/track/package/${waybill}',
                      'Live Tracking Checkpoint Simulation & Updates'
                    ],
                    activeOrdersInSystem: rawOrders.length,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="text-[11px]">
                API Configuration: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">GET /api/v1/admin/delhivery/config</code>
              </span>
              <button
                type="button"
                onClick={() => setIsRawDataModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
