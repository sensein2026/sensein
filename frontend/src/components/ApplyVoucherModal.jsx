import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag,
  X,
  Check,
  Percent,
  Sparkles,
  AlertCircle,
  Copy,
  ChevronRight,
  ShieldCheck,
  Crown,
  Gift,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import {
  applyCoupon,
  removeCoupon,
  selectAppliedCoupon,
  selectCartSubtotal,
} from '@/store/cartSlice'

export const AVAILABLE_COUPONS = [
  {
    code: 'SENSEIN10',
    aliases: ['SENSEIN10', 'SENSE10', 'SENSEIN', 'FLAT10', 'SAVE10', 'DISCOUNT10', 'SENSE'],
    title: 'Flat 10% OFF',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 300,
    description: '10% instant discount (up to ₹300) on all botanical haircare formulations.',
    minSpend: 499,
    badge: '',
    firstOrderOnly: false,
  },
  {
    code: 'LUXE15',
    aliases: ['LUXE15', 'LUX15', 'LUXE', 'LUX', 'LUXURY15', 'LUXURY', 'FLAT15'],
    title: '15% OFF LUXURY',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 500,
    description: '15% instant discount (up to ₹500) on luxury orders above ₹1,499.',
    minSpend: 1499,
    badge: '',
    firstOrderOnly: false,
  },
  {
    code: 'GLOW200',
    aliases: ['GLOW200', 'GLOW', 'FLAT200', 'SAVE200', 'GLOW20', 'FLAT20'],
    title: '₹200 FLAT OFF',
    discountType: 'fixed',
    discountValue: 200,
    maxDiscount: 200,
    description: 'Flat ₹200 instant cash discount on premium orders above ₹1,199.',
    minSpend: 1199,
    badge: '',
    firstOrderOnly: false,
  },
  {
    code: 'FIRST50',
    aliases: ['FIRST50', 'FIRST', 'WELCOME', 'WELCOME50', 'NEWUSER', 'WELCOME10'],
    title: '₹50 WELCOME (1st ORDER)',
    discountType: 'fixed',
    discountValue: 50,
    maxDiscount: 50,
    description: 'Flat ₹50 welcome discount for new Sensein connoisseurs on their 1st order.',
    minSpend: 399,
    badge: '★ 1ST ORDER ONLY',
    firstOrderOnly: true,
  },
  {
    code: 'FREESHIP',
    aliases: ['FREESHIP', 'FREESHIPPING', 'FREE', 'DELIVERY', 'SHIPFREE'],
    title: 'FREE EXPRESS SHIPPING',
    discountType: 'fixed',
    discountValue: 79,
    maxDiscount: 79,
    description: 'Free priority doorstep shipping across all India pin codes.',
    minSpend: 699,
    badge: '',
    firstOrderOnly: false,
  },
]

export default function ApplyVoucherModal({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const subtotal = useSelector(selectCartSubtotal)
  const appliedCoupon = useSelector(selectAppliedCoupon)
  const user = useSelector((state) => state.auth?.user)
  const token = useSelector((state) => state.auth?.token || state.auth?.accessToken)

  const [availableCoupons, setAvailableCoupons] = useState(AVAILABLE_COUPONS)
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false)
  const [inputCode, setInputCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  // Fetch active coupons from server with user-specific eligibility
  const fetchCoupons = async () => {
    setIsLoadingCoupons(true)
    try {
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (user?.email) headers['x-user-email'] = user.email

      const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : ''
      const res = await fetch(`/api/coupons${emailParam}`, { headers }).then((r) => r.json())
      if (res.success && Array.isArray(res.data)) {
        setAvailableCoupons(res.data)
      }
    } catch (e) {
      console.warn('Could not fetch latest coupons, using defaults:', e)
    } finally {
      setIsLoadingCoupons(false)
    }
  }

  // Clean messages and lock body scroll every time modal is opened
  useEffect(() => {
    if (isOpen) {
      fetchCoupons()
      setInputCode('')
      setErrorMessage('')
      setSuccessMessage('')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, user?.email])

  // Split into 1st Order Exclusive vs Regular Store Coupons
  const firstOrderCoupons = useMemo(() => {
    return availableCoupons.filter((c) => c.firstOrderOnly || c.code === 'FIRST50')
  }, [availableCoupons])

  const regularCoupons = useMemo(() => {
    return availableCoupons.filter((c) => !c.firstOrderOnly && c.code !== 'FIRST50')
  }, [availableCoupons])

  if (!isOpen) return null

  const handleApply = async (couponToApply) => {
    setErrorMessage('')
    setSuccessMessage('')

    const code = (couponToApply?.code || inputCode).trim().toUpperCase()
    if (!code) {
      setErrorMessage('Please enter a voucher code')
      return
    }

    // Match exact code or any alias from availableCoupons or check backend
    let matched =
      couponToApply ||
      availableCoupons.find(
        (c) =>
          c.code.toUpperCase() === code ||
          (c.aliases && c.aliases.map((a) => a.toUpperCase()).includes(code))
      )

    // Validate with server endpoint to ensure first-order and minimum spend constraints
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (user?.email) headers['x-user-email'] = user.email

      const valRes = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code,
          email: user?.email,
          subtotal,
        }),
      }).then((r) => r.json())

      if (!valRes.success) {
        setErrorMessage(valRes.message || `Code '${code}' is invalid or cannot be applied.`)
        return
      }

      if (valRes.data) {
        matched = valRes.data
      }
    } catch (err) {
      // Fallback to client-side validation if network check fails
      if (!matched) {
        setErrorMessage(`Code '${code}' is invalid or expired.`)
        return
      }
    }

    if (!matched) {
      setErrorMessage(`Code '${code}' is invalid or expired.`)
      return
    }

    if (matched.minSpend && subtotal < matched.minSpend) {
      const diff = matched.minSpend - subtotal
      setErrorMessage(
        `Code '${matched.code}' requires a minimum order of ₹${matched.minSpend.toLocaleString(
          'en-IN'
        )}. Add ₹${diff.toLocaleString('en-IN')} more to your cart.`
      )
      return
    }

    dispatch(applyCoupon(matched))
    setSuccessMessage(`Voucher '${matched.code}' applied successfully! 🎉`)
    setInputCode('')
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  const handleRemove = () => {
    dispatch(removeCoupon())
    setSuccessMessage('')
    setErrorMessage('')
  }

  const handleCopy = (code, e) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const modalContent = (
    <AnimatePresence>
      {/* Premium Frosted Backdrop Blur Overlay */}
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-hidden"
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      >
        {/* Backdrop click */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Window (Clean, Elegant & Sharp) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90dvh] sm:max-h-[88vh] overscroll-contain my-auto"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-stone-200 bg-[#FAF7F9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-[#5A3859] text-white flex items-center justify-center rounded-lg shadow-2xs">
                <Tag className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900 leading-tight">
                  Apply Coupons & Offers
                </h3>
                <p className="text-[11px] text-stone-500 font-medium">
                  Select an offer or enter your promo code
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 rounded-md transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4 flex-1">
            {/* Compact Input Form */}
            <div className="space-y-1.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleApply()
                }}
                className="flex gap-1.5"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase())
                      setErrorMessage('')
                    }}
                    placeholder="ENTER COUPON CODE"
                    className="w-full text-xs font-mono font-bold h-9 px-3 bg-stone-50 border border-stone-300 focus:bg-white focus:border-[#5A3859] focus:outline-none rounded-lg uppercase tracking-wider placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-stone-400"
                  />
                  {inputCode && (
                    <button
                      type="button"
                      onClick={() => setInputCode('')}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!inputCode.trim()}
                  className="h-9 px-4 bg-[#5A3859] hover:bg-[#4B2F4A] disabled:bg-stone-200 disabled:text-stone-400 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </form>

              {/* Feedback messages */}
              {errorMessage && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 rounded-lg">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 stroke-[3]" />
                  <span>{successMessage}</span>
                </div>
              )}
            </div>

            {/* SECTION 1: EXCLUSIVE 1ST ORDER ONLY SECTION (Shown ONLY to 1st Order eligible customers) */}
            {firstOrderCoupons.length > 0 && (
              <div className="space-y-2 p-3 rounded-xl bg-gradient-to-br from-amber-50/90 via-amber-100/30 to-amber-50/50 border-2 border-amber-300/80 shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <span className="text-amber-600 text-sm font-bold">★</span>
                    1st Order Exclusive Offer
                  </span>
                  <span className="text-[9px] font-extrabold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                    New Customers
                  </span>
                </div>

                {firstOrderCoupons.map((coupon) => {
                  const isCurrent = appliedCoupon?.code === coupon.code
                  const isEligible = subtotal >= (coupon.minSpend || 0)
                  const diff = (coupon.minSpend || 0) - subtotal
                  const progressPct = Math.min(100, Math.round((subtotal / (coupon.minSpend || 1)) * 100))

                  return (
                    <div
                      key={coupon.code}
                      className={`relative p-3 rounded-lg border transition-all duration-200 ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50 shadow-xs ring-1 ring-emerald-500'
                          : isEligible
                          ? 'border-amber-300 bg-white hover:border-amber-500 hover:shadow-xs'
                          : 'border-amber-200 bg-white/70 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Left Info */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-amber-950 text-amber-300 rounded tracking-wider shadow-2xs">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(coupon.code, e)}
                              className="text-[10px] text-amber-800 hover:text-amber-950 flex items-center gap-0.5 font-bold transition-colors"
                              title="Copy code"
                            >
                              <Copy className="h-2.5 w-2.5" />
                              {copiedCode === coupon.code ? 'Copied' : 'Copy'}
                            </button>
                            <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded uppercase tracking-wider">
                              ★ 1st Order Only
                            </span>
                          </div>

                          <div className="text-xs font-bold text-stone-900 truncate">
                            {coupon.title}
                          </div>

                          <p className="text-[11px] text-stone-600 leading-tight">
                            {coupon.description}
                          </p>
                        </div>

                        {/* Right Action Button */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {isCurrent ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                                <Check className="h-3 w-3 text-emerald-600 stroke-[3]" /> Applied
                              </span>
                              <button
                                type="button"
                                onClick={handleRemove}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline px-1 cursor-pointer whitespace-nowrap"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApply(coupon)}
                              disabled={!isEligible}
                              className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap ${
                                isEligible
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95 shadow-amber-600/20'
                                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              }`}
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Spend Progress Bar if below minimum */}
                      {!isEligible && (
                        <div className="mt-2 pt-1.5 border-t border-amber-200/60">
                          <div className="flex justify-between items-center text-[10px] text-amber-800 font-medium mb-1">
                            <span>Add ₹{diff.toLocaleString('en-IN')} more to unlock 1st order discount</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-600 h-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* SECTION 2: ALL OTHER STORE VOUCHERS */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between pb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#5A3859]" />
                  {firstOrderCoupons.length > 0 ? 'Other Available Offers' : 'Available Vouchers'}
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  Cart: ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="space-y-2">
                {(appliedCoupon &&
                !regularCoupons.some((c) => c.code === appliedCoupon.code) &&
                !firstOrderCoupons.some((c) => c.code === appliedCoupon.code)
                  ? [appliedCoupon, ...regularCoupons]
                  : regularCoupons
                ).map((coupon) => {
                  const isCurrent = appliedCoupon?.code === coupon.code
                  const isEligible = subtotal >= (coupon.minSpend || 0)
                  const diff = (coupon.minSpend || 0) - subtotal
                  const progressPct = Math.min(100, Math.round((subtotal / (coupon.minSpend || 1)) * 100))

                  return (
                    <div
                      key={coupon.code}
                      className={`relative p-3 rounded-lg border transition-all duration-200 ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                          : isEligible
                          ? 'border-stone-200 bg-white hover:border-[#5A3859] hover:shadow-xs'
                          : 'border-stone-200 bg-stone-50/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Left: Code, Badge & Title */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-black px-2 py-0.5 bg-stone-900 text-white rounded tracking-wider">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(coupon.code, e)}
                              className="text-[10px] text-stone-400 hover:text-stone-800 flex items-center gap-0.5 font-medium transition-colors"
                              title="Copy code"
                            >
                              <Copy className="h-2.5 w-2.5" />
                              {copiedCode === coupon.code ? 'Copied' : 'Copy'}
                            </button>
                            {coupon.badge && (
                              <span className="text-[8px] font-bold text-[#5A3859] bg-[#5A3859]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {coupon.badge}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-bold text-stone-900 truncate">
                            {coupon.title}
                          </div>

                          <p className="text-[11px] text-stone-500 leading-tight">
                            {coupon.description}
                          </p>
                        </div>

                        {/* Right: Action Button */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {isCurrent ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                                <Check className="h-3 w-3 text-emerald-600 stroke-[3]" /> Applied
                              </span>
                              <button
                                type="button"
                                onClick={handleRemove}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline px-1 cursor-pointer whitespace-nowrap"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApply(coupon)}
                              disabled={!isEligible}
                              className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap ${
                                isEligible
                                  ? 'bg-[#5A3859] hover:bg-[#4B2F4A] text-white active:scale-95'
                                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              }`}
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Spend Progress Bar if not eligible */}
                      {!isEligible && (
                        <div className="mt-2 pt-1.5 border-t border-stone-200/60">
                          <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium mb-1">
                            <span>Add ₹{diff.toLocaleString('en-IN')} more to unlock</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-[#5A3859] h-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Compact Footer */}
          <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1 text-[11px] font-medium text-stone-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Guaranteed Savings applied
            </span>
            <button
              type="button"
              onClick={onClose}
              className="bg-stone-900 hover:bg-[#5A3859] text-white font-bold text-xs uppercase px-3.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent
}
