import React from 'react'
import { Package, Truck, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

/**
 * Format timestamp like: "Tue, 08 Sep, 4:55 PM" (Flipkart Official Style)
 */
export function formatFlipkartDate(dateInput) {
  if (!dateInput) return null
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return null

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const dayName = days[d.getDay()]
  const dayNum = String(d.getDate()).padStart(2, '0')
  const monthName = months[d.getMonth()]

  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12

  return `${dayName}, ${dayNum} ${monthName}, ${hours}:${minutes} ${ampm}`
}

/**
 * Flipkart-Style Vertical Order Tracking Timeline Component
 */
export default function FlipkartOrderTimeline({ order, compact = false }) {
  if (!order) return null

  const isCancelled = order.orderStatus === 'CANCELLED' || order.orderStatus === 'PAYMENT_FAILED'
  const isDelivered = order.orderStatus === 'DELIVERED'
  const isShipped = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)
  const isOutForDelivery = ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)
  const isInTransit = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)
  const isPacked = ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)

  const courierName = order.courierPartner || order.delhivery?.courierName || 'Delhivery Express'
  const awbNumber = order.trackingNumber || order.delhivery?.waybill || ''

  // Build timeline events based on order status
  let steps = []

  if (isCancelled) {
    steps = [
      {
        title: 'Order Placed',
        time: formatFlipkartDate(order.createdAt),
        desc: null,
        isDone: true,
        isCurrent: false,
      },
      {
        title: 'Not Picked',
        time: null,
        desc: order.cancellationReason || 'Order cancelled by the seller',
        isDone: true,
        isCurrent: true,
      },
    ]
  } else {
    steps = [
      {
        title: 'Order Placed',
        time: formatFlipkartDate(order.createdAt),
        desc: null,
        isDone: true,
        isCurrent: !isPacked,
      },
      {
        title: 'Packed',
        time: isPacked
          ? formatFlipkartDate(order.updatedAt && order.updatedAt !== order.createdAt ? order.updatedAt : new Date(new Date(order.createdAt).getTime() + 2 * 3600000))
          : null,
        desc: isPacked ? 'Item packed and ready for courier pickup' : null,
        isDone: isPacked,
        isCurrent: isPacked && !isShipped,
      },
      {
        title: 'Shipped',
        time: isShipped
          ? formatFlipkartDate(order.shippedAt || order.updatedAt)
          : null,
        desc: isShipped
          ? `Item handed over to ${courierName}${awbNumber ? ` (AWB: ${awbNumber})` : ''}`
          : null,
        isDone: isShipped,
        isCurrent: isShipped && !isInTransit,
      },
      {
        title: 'In Transit',
        time: isInTransit ? formatFlipkartDate(order.updatedAt) : null,
        desc: isInTransit ? 'Item in transit to nearest logistics delivery facility' : null,
        isDone: isInTransit,
        isCurrent: isInTransit && !isOutForDelivery,
      },
      {
        title: 'Out for Delivery',
        time: isOutForDelivery ? formatFlipkartDate(order.updatedAt) : null,
        desc: isOutForDelivery
          ? (order.deliveryRider?.name ? `With delivery executive: ${order.deliveryRider.name}` : 'Package out for delivery to your doorstep')
          : null,
        isDone: isOutForDelivery,
        isCurrent: isOutForDelivery && !isDelivered,
      },
      {
        title: 'Delivered',
        time: isDelivered ? formatFlipkartDate(order.deliveredAt || order.updatedAt) : null,
        desc: isDelivered
          ? (order.deliveryOtp ? `Package verified & delivered successfully. (OTP: ${order.deliveryOtp})` : 'Item delivered successfully')
          : `Expected by ${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '2-3 business days'}`,
        isDone: isDelivered,
        isCurrent: isDelivered,
      },
    ]
  }

  return (
    <div className={`${compact ? '' : 'p-5 sm:p-6 bg-white rounded-xl border border-stone-200/90 shadow-2xs'}`}>
      {!compact && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#26a541]/10 text-[#26a541]">
              <Truck className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-stone-900">
              Order Status
            </span>
          </div>
          {awbNumber && (
            <span className="text-[11px] font-mono font-semibold text-[#26a541] bg-[#26a541]/10 px-2.5 py-0.5 rounded-full">
              AWB: {awbNumber}
            </span>
          )}
        </div>
      )}

      {/* Flipkart-Style Connected Vertical Timeline */}
      <div className="relative pl-7 py-1 space-y-7">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1
          const nextStep = !isLast ? steps[idx + 1] : null
          const isLineActive = step.isDone && (nextStep?.isDone || false)

          return (
            <div key={idx} className="relative">
              {/* Connecting Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute -left-[20px] top-[14px] w-[3.5px] h-[calc(100%+16px)] rounded-full transition-colors ${
                    isLineActive ? 'bg-[#26a541]' : 'bg-stone-200'
                  }`}
                />
              )}

              {/* Connected Circle / Dot Indicator */}
              <div className="absolute -left-[26px] top-[3px] flex items-center justify-center">
                {step.isCurrent ? (
                  /* Concentric Halo dot for current state */
                  <div className="h-4.5 w-4.5 rounded-full bg-[#26a541]/30 flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#26a541]" />
                  </div>
                ) : step.isDone ? (
                  /* Solid compact dot for completed state */
                  <div className="h-3 w-3 rounded-full bg-[#26a541] ml-[3px]" />
                ) : (
                  /* Inactive grey dot */
                  <div className="h-3 w-3 rounded-full bg-stone-300 ml-[3px]" />
                )}
              </div>

              {/* Event Content (Title | Date Time on single line, subtitle below) */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                  <span
                    className={`text-[13.5px] font-bold tracking-tight ${
                      step.isDone ? 'text-[#282c3f]' : 'text-stone-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.time && (
                    <>
                      <span className="text-stone-300 text-xs font-light select-none">|</span>
                      <span className="text-xs text-[#535665] font-normal italic">
                        {step.time}
                      </span>
                    </>
                  )}
                </div>

                {step.desc && (
                  <p
                    className={`text-xs ${
                      step.isDone ? 'text-[#686b78]' : 'text-stone-400'
                    } leading-relaxed`}
                  >
                    {step.desc}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
