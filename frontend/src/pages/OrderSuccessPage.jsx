import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  Package,
  ShoppingBag,
  Truck,
  MapPin,
  CreditCard,
  Download,
  Calendar,
  Mail,
  ChevronRight,
} from 'lucide-react'
import { useGetOrderByIdQuery, useGetPublicInvoiceConfigQuery } from '@/features/ordersApi'
import SenseinLoader from '@/components/SenseinLoader'
import { trackPurchase } from '@/utils/analytics'
import { DelhiveryTaxInvoice } from '@/components/PrintableDocuments'

export default function OrderSuccessPage() {
  const { orderId } = useParams()
  const { data: response, isLoading } = useGetOrderByIdQuery(orderId)
  const { data: invoiceConfigData } = useGetPublicInvoiceConfigQuery()
  const sellerConfig = invoiceConfigData?.sellerDetails
  const order = response?.data

  useEffect(() => {
    if (order) {
      trackPurchase(order)
    }
  }, [order])

  const handleDirectDownloadInvoice = () => {
    if (!order) return
    const prevTitle = document.title
    const orderNum = order.orderNumber || order.invoiceNumber || 'ORD'
    document.title = `Sensein_Tax_Invoice_${orderNum}`
    window.print()
    setTimeout(() => {
      document.title = prevTitle
    }, 1500)
  }

  if (isLoading) {
    return <SenseinLoader text="GENERATING ORDER CONFIRMATION" />
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] py-20 text-center font-sans px-4 bg-[#FAF8F5]">
        <div className="max-w-md mx-auto bg-white p-8 border border-stone-200 shadow-sm space-y-4 rounded-2xl">
          <Package className="h-12 w-12 text-stone-300 mx-auto" />
          <h2 className="text-xl font-bold text-stone-900">Order Confirmation Unavailable</h2>
          <p className="text-xs text-stone-500">
            We could not locate this order confirmation record.
          </p>
          <Link
            to="/shop"
            className="inline-flex bg-[#5A3859] hover:bg-[#4B2F4A] text-white py-3 px-6 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  const isPaid = order.paymentStatus === 'PAID'
  const isCod = order.paymentMethod === 'COD'
  
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Estimated delivery calculation (3 to 5 business days)
  const orderCreatedAt = order.createdAt ? new Date(order.createdAt) : new Date()
  const expStart = new Date(orderCreatedAt.getTime() + 3 * 24 * 60 * 60 * 1000)
  const expEnd = new Date(orderCreatedAt.getTime() + 5 * 24 * 60 * 60 * 1000)
  const startDay = expStart.getDate()
  const endFormatted = expEnd.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const expectedDeliveryStr = `${startDay} – ${endFormatted}`

  const subtotal = Number(order.subtotal || order.totalAmount || 0)
  const shippingFee = Number(order.shippingFee || 0)
  const discount = Number(order.discount || 0)
  const totalAmount = Number(order.totalAmount || 0)

  return (
    <div className="min-h-screen py-6 sm:py-10 font-sans bg-[#F9F8F6] text-stone-800 print:min-h-0 print:py-0 print:m-0 print:bg-white print:p-0">
      {/* Hidden Official A4 Tax Invoice (Used purely for Print & PDF Save) */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        <DelhiveryTaxInvoice order={order} sellerConfig={sellerConfig} />
        <div className="print:fixed print:bottom-0 print:left-0 print:w-full flex justify-start items-center text-[10px] text-neutral-500 font-mono px-1">
          <span>Printed on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4 print:hidden">

        {/* 1. Top Confirmation Hero Banner */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Check className="h-6 w-6 stroke-[3] text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                Order Confirmed!
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Thank you for your order.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDirectDownloadInvoice}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-stone-800 bg-white hover:bg-stone-50 active:scale-[0.98] px-3 sm:px-3.5 py-1.5 sm:py-2 border border-stone-300 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 mt-1"
            title="Download Tax Invoice as PDF"
          >
            <Download className="h-3.5 w-3.5 text-stone-600" />
            <span>Download Invoice</span>
          </button>
        </div>

        {/* 2. Order Reference Line */}
        <div className="space-y-0.5 pt-1">
          <div className="text-sm font-bold text-stone-900 font-mono">
            Order #{order.orderNumber}
          </div>
          <div className="text-[11px] text-stone-500 font-medium">
            {orderDate}
          </div>
        </div>

        {/* 3. Delivery & Payment Details Card (Compact & Balanced) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 grid grid-cols-2 gap-3 sm:gap-4 divide-x divide-stone-100">
            {/* Delivery Details */}
            <div className="space-y-1.5 pr-2">
              <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                <span>DELIVERY ADDRESS</span>
              </div>
              
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-stone-900 leading-snug">
                  {order.customerName || order.shippingAddress?.fullName || 'Valued Customer'}
                </div>
                {order.shippingAddress?.addressLine && (
                  <div className="text-stone-600 leading-tight text-[11px]">
                    {order.shippingAddress.addressLine}
                  </div>
                )}
                <div className="text-stone-600 leading-tight text-[11px]">
                  {[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ')} - {order.shippingAddress?.postalCode}
                </div>
                {order.customerPhone && (
                  <div className="text-stone-400 font-mono text-[10px] pt-0.5">
                    Ph: {order.customerPhone}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-1.5 pl-3 sm:pl-4">
              <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-stone-400 shrink-0" />
                <span>PAYMENT METHOD</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-stone-900 uppercase">
                    {order.paymentMethod || 'ONLINE'}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isPaid && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />}
                    <span>{isPaid ? 'PAID' : isCod ? 'COD' : order.paymentStatus}</span>
                  </span>
                </div>

                <div className="text-[11px] text-stone-500 font-medium">
                  {isPaid ? 'Payment Received' : isCod ? 'Pay on Delivery' : order.paymentStatus}
                </div>

                {order.trackingNumber && (
                  <div className="pt-0.5">
                    <span className="text-[9px] uppercase font-bold text-stone-400 block">AWB</span>
                    <span className="text-[11px] font-mono font-bold text-[#5A3859]">
                      {order.trackingNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Integrated Expected Delivery Bottom Bar */}
          <div className="border-t border-stone-100 px-4 sm:px-5 py-2.5 bg-[#FAF9F7] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-stone-500 font-medium text-[11px]">
              <Calendar className="h-3.5 w-3.5 text-[#5A3859] shrink-0" />
              <span>Estimated Delivery:</span>
            </div>
            <span className="font-bold text-stone-900 text-xs font-mono">
              {expectedDeliveryStr}
            </span>
          </div>
        </div>

        {/* 4. "Your Order" Section */}
        <div className="space-y-2 pt-1">
          <h2 className="text-sm font-bold text-stone-900 tracking-tight">
            Your Order
          </h2>

          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs divide-y divide-stone-100 overflow-hidden">
            {order.items?.map((item, idx) => (
              <div key={idx} className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-14 w-14 object-cover rounded-xl border border-stone-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                      {item.name}
                    </div>
                    <div className="text-xs text-stone-500">
                      Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-stone-900 text-sm shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Pricing Breakdown & Email Confirmation Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-4 sm:p-5 space-y-3">
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount</span>
                <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-stone-600">
              <span>Shipping</span>
              <span className="font-bold text-emerald-600 uppercase text-xs">
                {shippingFee > 0 ? `₹${shippingFee}` : 'FREE'}
              </span>
            </div>
          </div>

          {/* Highlighted Total Paid Box */}
          <div className="bg-[#5A3859]/5 border border-[#5A3859]/15 rounded-xl p-3.5 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-wider text-stone-900">
              TOTAL PAID
            </span>
            <span className="font-mono text-base sm:text-lg font-black text-stone-900">
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Email Confirmation Notice */}
          <div className="pt-1 flex items-start gap-2 text-xs text-stone-500">
            <Mail className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span>Confirmation sent to your email</span>
              <div className="font-semibold text-stone-700 break-all">{order.customerEmail || order.user?.email}</div>
            </div>
          </div>
        </div>

        {/* 6. Bottom Master Action CTAs */}
        <div className="grid grid-cols-2 gap-3 pt-2 pb-6">
          <Link
            to={`/track-order?number=${encodeURIComponent(order.orderNumber)}`}
            className="bg-[#5A3859] hover:bg-[#482b47] active:scale-[0.99] text-white p-3 sm:p-3.5 rounded-xl shadow-sm transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Truck className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold uppercase tracking-wider leading-none">
                  Track Order
                </div>
                <div className="text-[10px] text-white/70 font-medium leading-none mt-1">
                  View Order Status
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 opacity-80 shrink-0" />
          </Link>

          <Link
            to="/shop"
            className="bg-white hover:bg-stone-50 active:scale-[0.99] text-stone-900 border border-stone-300 p-3 sm:p-3.5 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4 text-stone-700 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Shop More
            </span>
          </Link>
        </div>

      </div>
    </div>
  )
}

