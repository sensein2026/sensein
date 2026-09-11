import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  AlertTriangle,
  XCircle,
  HelpCircle,
  CreditCard,
  CheckCircle2,
  Loader2,
  PackageX,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

const CANCELLATION_REASONS = [
  'Ordered by mistake / Need to modify items',
  'Found cheaper or better alternative elsewhere',
  'Delivery time is too long / Need it urgently',
  'Incorrect delivery address / phone number selected',
  'Payment issues / Change in payment method',
  'Other reason (please describe below)',
]

export default function CancelOrderModal({
  isOpen,
  onClose,
  order,
  onConfirmCancel,
  isLoading = false,
}) {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen || !order) return null

  const handleConfirm = async () => {
    setErrorMsg('')
    const isOther = selectedReason.startsWith('Other')
    if (isOther && !customReason.trim()) {
      setErrorMsg('Please enter a brief note explaining your cancellation reason.')
      return
    }

    const finalReason = isOther
      ? `Other: ${customReason.trim()}`
      : customReason.trim()
      ? `${selectedReason} - ${customReason.trim()}`
      : selectedReason

    try {
      await onConfirmCancel(order._id || order.id, order.orderNumber, finalReason)
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to cancel order. Please try again.')
    }
  }

  const isOnlinePaid =
    order?.paymentMethod === 'ONLINE' ||
    order?.paymentMethod === 'PREPAID' ||
    order?.paymentStatus === 'PAID'

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4"
      style={{ zIndex: 999999 }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 cursor-pointer"
        style={{ zIndex: 999999 }}
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Dialog Box */}
      <div
        className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden"
        style={{ zIndex: 1000000 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600">
              <PackageX className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-stone-900 tracking-tight font-display">
                  Cancel Order
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 font-mono">
                  #{order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Please let us know why you'd like to cancel this order
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Razorpay Refund Notice */}
          {isOnlinePaid ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3 text-emerald-900 text-xs">
              <CreditCard className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-800">
                  Instant Razorpay Refund
                </span>
                <span className="text-emerald-700/90 leading-relaxed text-[11.5px]">
                  Your ₹{(order.totalAmount || 0).toLocaleString('en-IN')} payment will be immediately refunded to your original payment method (Bank/UPI/Card).
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-800">
                  Cash on Delivery Order
                </span>
                <span className="text-amber-700/90 leading-relaxed text-[11.5px]">
                  No payment was collected. Your order will be cancelled with 0 charges.
                </span>
              </div>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Select Reason for Cancellation <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5">
              {CANCELLATION_REASONS.map((reason) => {
                const isSelected = selectedReason === reason
                return (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#5A3859] bg-[#5A3859]/5 text-[#5A3859] font-bold shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/70 text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={reason}
                      checked={isSelected}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-[#5A3859] h-4 w-4 shrink-0"
                    />
                    <span>{reason}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Additional details note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-600 block">
              Additional Details / Comments (Optional):
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Tell us how we can improve your shopping experience..."
              className="w-full text-xs p-3 rounded-2xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A3859]/30 focus:border-[#5A3859] transition-all resize-none text-stone-800"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 text-center"
          >
            Keep Order
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <span>Confirm Cancel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
