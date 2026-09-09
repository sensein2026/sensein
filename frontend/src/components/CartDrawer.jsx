import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Percent,
  ChevronDown,
  Gift,
  ExternalLink,
  Copy,
} from 'lucide-react'
import { setCartDrawerOpen, openAuthModal } from '@/store/uiSlice'
import {
  selectCartItems,
  selectCartSubtotal,
  selectAppliedCoupon,
  updateQuantity,
  removeFromCart,
  removeCoupon,
  applyCoupon,
} from '@/store/cartSlice'
import { selectIsAuthenticated } from '@/store/authSlice'
import ApplyVoucherModal from '@/components/ApplyVoucherModal'
import { useGetShippingSettingsQuery } from '@/features/ordersApi'

export default function CartDrawer() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isOpen = useSelector((state) => state.ui.isCartDrawerOpen)
  const cartItems = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartSubtotal)
  const appliedCoupon = useSelector(selectAppliedCoupon)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
  const itemsContainerRef = useRef(null)
  const [hasMoreBelow, setHasMoreBelow] = useState(false)

  const checkScrollPosition = () => {
    const el = itemsContainerRef.current
    if (!el) return
    const isScrollable = el.scrollHeight > el.clientHeight + 10
    const isNotAtBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 20
    setHasMoreBelow(isScrollable && isNotAtBottom)
  }

  useEffect(() => {
    if (isOpen) {
      // Check scroll after layout render
      const timer = setTimeout(() => {
        checkScrollPosition()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [cartItems, isOpen])

  const scrollToMoreItems = () => {
    if (itemsContainerRef.current) {
      itemsContainerRef.current.scrollBy({ top: 180, behavior: 'smooth' })
    }
  }

  const handleClose = () => dispatch(setCartDrawerOpen(false))

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const hasOutOfStockItems = cartItems.some(
    (item) =>
      (item.product?.stock !== undefined && item.product.stock <= 0) ||
      item.product?.inStock === false ||
      item.product?.isDeleted === true
  )

  const handleCheckout = () => {
    if (hasOutOfStockItems) return
    handleClose()
    if (!isAuthenticated) {
      dispatch(openAuthModal('/checkout'))
    } else {
      navigate('/checkout')
    }
  }

  // Calculate discount based on active coupon
  let discountAmount = 0
  if (appliedCoupon && subtotal >= (appliedCoupon.minSpend || 0)) {
    if (appliedCoupon.discountType === 'percentage') {
      const calculated = Math.round(subtotal * (appliedCoupon.discountValue / 100))
      discountAmount = appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated
    } else if (appliedCoupon.discountType === 'fixed') {
      discountAmount = Math.min(subtotal, appliedCoupon.discountValue)
    }
  }

  // Dynamic Shipping & 3-Tier Milestone Settings from Store Configuration
  const { data: shippingData } = useGetShippingSettingsQuery()
  const shippingSettings = shippingData?.settings || {}

  const standardFee = Number(shippingSettings.standardShippingFee ?? 79)
  const isFreeEnabled = shippingSettings.isFreeShippingEnabled !== false

  const isSimpleMode = shippingSettings.cartProgressMode === 'simple'

  // 3-Tier Milestones
  const tier1Threshold = Number(shippingSettings.tier1Threshold ?? shippingSettings.freeShippingThreshold ?? 999)
  const tier1Enabled = shippingSettings.tier1Enabled !== false && isFreeEnabled

  const tier2Threshold = Number(shippingSettings.tier2Threshold ?? 1999)
  const tier2Enabled = !isSimpleMode && shippingSettings.tier2Enabled !== false
  const tier2CouponCode = shippingSettings.tier2CouponCode || 'EXTRA10'
  const tier2DiscountText = shippingSettings.tier2DiscountText || '10% Instant Off'

  const tier3Threshold = Number(shippingSettings.tier3Threshold ?? shippingSettings.giftMinSpend ?? 2999)
  const tier3Enabled = !isSimpleMode && ((shippingSettings.tier3Enabled !== false) || (shippingSettings.isGiftPromoEnabled !== false))
  const tier3ItemName = shippingSettings.tier3ItemName || shippingSettings.giftItemName || 'Sensein Luxury Botanical Mini Elixir (30ml)'
  const tier3ProductLink = shippingSettings.tier3ProductLink || '/shop'
  const tier3Badge = shippingSettings.tier3Badge || shippingSettings.giftBadge || 'FREE GIFT'

  // Calculate actual shipping fee
  let shippingFee = standardFee
  if (subtotal === 0 || standardFee === 0) {
    shippingFee = 0
  } else if (tier1Enabled && tier1Threshold > 0 && subtotal >= tier1Threshold) {
    shippingFee = 0
  }

  const totalPayable = Math.max(0, subtotal - discountAmount + shippingFee)

  // Auto-apply Tier 2 Coupon when subtotal reaches threshold, auto-remove if subtotal drops
  useEffect(() => {
    if (!tier2Enabled || !tier2CouponCode) return

    if (subtotal >= tier2Threshold) {
      if (!appliedCoupon) {
        dispatch(
          applyCoupon({
            code: tier2CouponCode.toUpperCase(),
            title: `${tier2CouponCode.toUpperCase()} (${tier2DiscountText || '10% OFF'})`,
            discountType: 'percentage',
            discountValue: 10,
            maxDiscount: 500,
            description: tier2DiscountText || 'Milestone Reward: Instant Voucher Applied!',
            minSpend: tier2Threshold,
            isMilestoneReward: true,
          })
        )
      }
    } else {
      if (appliedCoupon?.isMilestoneReward || appliedCoupon?.code === tier2CouponCode.toUpperCase()) {
        dispatch(removeCoupon())
      }
    }
  }, [subtotal, tier2Enabled, tier2Threshold, tier2CouponCode, tier2DiscountText, appliedCoupon, dispatch])

  // 3-Tier Unlock states
  const isT1Unlocked = tier1Enabled && subtotal >= tier1Threshold
  const isT2Unlocked = tier2Enabled && subtotal >= tier2Threshold
  const isT3Unlocked = tier3Enabled && subtotal >= tier3Threshold

  // Accurate Milestone Progress Fill: Starts from Node 1 (0%) -> Node 2 (50%) -> Node 3 (100%)
  let progressPercent = 0
  if (subtotal >= tier1Threshold) {
    if (subtotal < tier2Threshold) {
      // Filling from Node 1 (0%) to Node 2 (50%)
      const range = Math.max(1, tier2Threshold - tier1Threshold)
      progressPercent = ((subtotal - tier1Threshold) / range) * 50
    } else if (subtotal < tier3Threshold) {
      // Filling from Node 2 (50%) to Node 3 (100%)
      const range = Math.max(1, tier3Threshold - tier2Threshold)
      progressPercent = 50 + ((subtotal - tier2Threshold) / range) * 50
    } else {
      progressPercent = 100
    }
  }
  progressPercent = Math.min(100, Math.max(0, Math.round(progressPercent * 10) / 10))

  const totalItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)

  // Dynamic Announcement Banner Text
  let announcementText = ''
  if (!isT1Unlocked && tier1Enabled) {
    const diff = tier1Threshold - subtotal
    announcementText = `Add ₹${diff.toLocaleString('en-IN')} more to unlock FREE Delivery!`
  } else if (!isT2Unlocked && tier2Enabled) {
    const diff = tier2Threshold - subtotal
    announcementText = `🎉 Free Delivery Unlocked! Add ₹${diff.toLocaleString('en-IN')} for Special Coupon (${tier2CouponCode})`
  } else if (!isT3Unlocked && tier3Enabled) {
    const diff = tier3Threshold - subtotal
    announcementText = `🎉 Coupon & Delivery Unlocked! Add ₹${diff.toLocaleString('en-IN')} to claim Free Gift!`
  } else {
    announcementText = `🔥 Awesome! You've unlocked All 3 Milestone Rewards!`
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans">
            {/* Backdrop with Clean Solid Fade */}
            <motion.div
              className="fixed inset-0 bg-stone-900/60 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              aria-label="Close background overlay"
            />

            {/* Slide-out Cart Drawer (Side bar style matching MobileMenu) */}
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 flex w-[85vw] sm:w-[420px] max-w-md flex-col bg-[#FAF9F6] shadow-2xl border-l border-stone-200 overflow-hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            >
              {/* Header Section */}
              <div className="px-4 sm:px-5 py-4 bg-white border-b border-stone-200">
                <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-none bg-[#5A3859]/10 flex items-center justify-center text-[#5A3859] border border-[#5A3859]/20">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    Shopping Bag
                    {totalItemCount > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#5A3859] text-white">
                        {totalItemCount}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {cartItems.length > 0
                      ? `${cartItems.length} unique ${cartItems.length === 1 ? 'product' : 'products'}`
                      : 'Your bag is empty'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 rounded-none text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all duration-200 cursor-pointer"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Progress Bar (Simple 1-Tier vs 3-Tier Gamified Milestones) */}
            {cartItems.length > 0 && (
              shippingSettings.cartProgressMode === 'simple' ? (
                /* Classic Simple Free Shipping Progress Bar (સાદી વાળી) */
                <div className="mt-3 pt-2.5 border-t border-stone-100">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 mb-2.5 transition-colors ${
                    isT1Unlocked
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-[#5A3859]/5 text-[#5A3859] border border-[#5A3859]/15'
                  }`}>
                    <Truck className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                    <span className="text-[11px] sm:text-xs font-bold leading-tight text-center">
                      {isT1Unlocked
                        ? '🎉 Free Express Delivery Unlocked!'
                        : `Add ₹${(tier1Threshold - subtotal).toLocaleString('en-IN')} more to unlock FREE Delivery!`}
                    </span>
                  </div>

                  <div className="space-y-1 px-1">
                    <div className="relative h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-[#5A3859] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((subtotal / tier1Threshold) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium font-mono">
                      <span>₹0</span>
                      <span className="font-bold text-[#5A3859]">
                        {isT1Unlocked ? '100% Free Shipping ✓' : `Goal: ₹${tier1Threshold}`}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* 3-Tier Gamified Milestone Progress Bar (આ 3-Tier વાળી) */
                <div className="mt-3 pt-2.5 border-t border-stone-100">
                  {/* Announcement Strip */}
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 mb-3 transition-colors ${
                    isT3Unlocked
                      ? 'bg-amber-100/80 text-amber-950 border border-amber-300'
                      : isT1Unlocked
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-[#5A3859]/5 text-[#5A3859] border border-[#5A3859]/15'
                  }`}>
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span className="text-[11px] sm:text-xs font-bold leading-tight text-center">{announcementText}</span>
                  </div>

                  {/* Multi-step Milestone Track (Node 1 @ 0%, Node 2 @ 50%, Node 3 @ 100%) */}
                  <div className="relative pt-2 pb-8 px-7 sm:px-8">
                    {/* Background Track Line */}
                    <div className="relative h-2 w-full bg-stone-200/90 rounded-full overflow-visible">
                      {/* Active Progress Fill using Brand Gradient */}
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-[#5A3859] to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />

                      {/* Node 1: Free Shipping (at 0% Start) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-default z-10"
                        style={{ left: '0%' }}
                        title={`₹${tier1Threshold} - Free Delivery`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs ${
                            isT1Unlocked
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-100'
                              : 'bg-white border-stone-300 text-stone-400'
                          }`}
                        >
                          {isT1Unlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                        </div>
                        <div className="absolute top-7 flex flex-col items-center text-center whitespace-nowrap">
                          <span className="text-[10px] font-bold text-stone-800 font-mono">₹{tier1Threshold}</span>
                          <span className={`text-[8px] font-medium -mt-0.5 ${isT1Unlocked ? 'text-emerald-700 font-bold' : 'text-stone-500'}`}>
                            {isT1Unlocked ? 'Free Ship ✓' : 'Free Ship'}
                          </span>
                        </div>
                      </div>

                      {/* Node 2: Special Coupon (at 50% Middle) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-default z-10"
                        style={{ left: '50%' }}
                        title={`₹${tier2Threshold} - Special Coupon (${tier2CouponCode})`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs ${
                            isT2Unlocked
                              ? 'bg-[#5A3859] border-[#5A3859] text-white shadow-purple-900/30 ring-2 ring-purple-100'
                              : 'bg-white border-stone-300 text-stone-400'
                          }`}
                        >
                          {isT2Unlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
                        </div>
                        <div className="absolute top-7 flex flex-col items-center text-center whitespace-nowrap">
                          <span className="text-[10px] font-bold text-stone-800 font-mono">₹{tier2Threshold}</span>
                          <span className={`text-[8px] font-medium -mt-0.5 ${isT2Unlocked ? 'text-[#5A3859] font-bold' : 'text-stone-500'}`}>
                            {isT2Unlocked ? `${tier2CouponCode} ✓` : tier2CouponCode}
                          </span>
                        </div>
                      </div>

                      {/* Node 3: Free Gift with Clickable Underline Link (at 100% Right) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-default z-10"
                        style={{ left: '100%' }}
                        title={`₹${tier3Threshold} - Free Luxury Gift`}
                      >
                        <div className="relative flex items-center justify-center">
                          {isT3Unlocked && (
                            <span className="absolute -inset-0.5 rounded-full bg-amber-400/25 ring-2 ring-amber-300/40 animate-pulse pointer-events-none" />
                          )}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs relative z-10 ${
                              isT3Unlocked
                                ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_8px_rgba(245,158,11,0.35)] ring-2 ring-amber-100'
                                : 'bg-white border-stone-300 text-stone-400'
                            }`}
                          >
                            <Gift className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <div className="absolute top-7 flex flex-col items-center text-center whitespace-nowrap">
                          <span className="text-[10px] font-bold text-stone-800 font-mono">₹{tier3Threshold}</span>
                          {tier3ProductLink ? (
                            <Link
                              to={tier3ProductLink}
                              onClick={handleClose}
                              className={`text-[8.5px] font-bold underline transition-colors cursor-pointer ${
                                isT3Unlocked ? 'text-amber-800 font-extrabold hover:text-amber-950' : 'text-stone-500 hover:text-stone-800'
                              }`}
                              title="Click to view free gift product"
                            >
                              Free Gift 🎁
                            </Link>
                          ) : (
                            <span className={`text-[8.5px] font-bold ${isT3Unlocked ? 'text-amber-800' : 'text-stone-500'}`}>
                              Free Gift 🎁
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Drawer Body */}
          {cartItems.length === 0 ? (
            /* Empty Cart View */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#5A3859]/10 border border-[#5A3859]/20 flex items-center justify-center text-[#5A3859] shadow-inner">
                <ShoppingBag className="h-8 w-8 text-[#5A3859]" />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                  Your bag is empty
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Discover our clean, salon-grade hair & skincare formulations designed for radiant results.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleClose()
                  navigate('/shop')
                }}
                className="w-full max-w-xs bg-[#5A3859] hover:bg-[#4A2E49] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Products</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Quick Categories */}
              <div className="pt-3 border-t border-stone-200 w-full max-w-xs">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Popular Categories
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['Hair Care', 'Skin Care', 'Combos', 'Best Sellers'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        handleClose()
                        navigate('/shop')
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 hover:border-[#5A3859] hover:text-[#5A3859] transition-all font-medium cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {!isAuthenticated && (
                <div className="pt-1">
                  <p className="text-xs text-stone-500">
                    Have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        handleClose()
                        dispatch(openAuthModal())
                      }}
                      className="font-semibold text-[#5A3859] hover:underline cursor-pointer"
                    >
                      Log in
                    </button>{' '}
                    to access your saved items.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Cart With Items View */
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {/* Items List Container */}
              <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
                <div
                  ref={itemsContainerRef}
                  onScroll={checkScrollPosition}
                  className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5"
                >
                  {cartItems.map((item) => {
                    const product = item.product || {}
                    const price = product.price || item.price || 0
                    const imageSrc =
                      product.mainImage ||
                      product.image ||
                      (product.images && product.images[0]) ||
                      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=200&auto=format&fit=crop&q=80'

                    const isOutOfStock =
                      (product.stock !== undefined && product.stock <= 0) ||
                      product.inStock === false ||
                      product.isDeleted === true

                    return (
                      <div
                        key={product._id || product.id || item._id}
                        className={`group relative flex gap-3.5 p-3.5 rounded-lg border transition-all duration-200 ${isOutOfStock
                          ? 'border-rose-300 bg-rose-50/20 opacity-90'
                          : 'border-stone-200 bg-white hover:border-[#5A3859]/60 hover:shadow-xs'
                          }`}
                      >
                        <Link
                          to={`/product/${product.slug || product._id || product.id}`}
                          onClick={handleClose}
                          className="h-20 w-20 rounded-md overflow-hidden bg-stone-100 shrink-0 border border-stone-200 relative block group/img cursor-pointer"
                        >
                          <img
                            src={imageSrc}
                            alt={product.name || 'Product'}
                            className={`h-full w-full object-cover group-hover/img:scale-105 transition-transform duration-300 ${isOutOfStock ? 'grayscale-[0.5]' : ''
                              }`}
                          />
                        </Link>

                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <Link
                              to={`/product/${product.slug || product._id || product.id}`}
                              onClick={handleClose}
                              className="flex-1 min-w-0 cursor-pointer group/title block"
                            >
                              <h3 className="text-xs font-semibold text-stone-900 group-hover/title:text-[#5A3859] leading-snug line-clamp-2 transition-colors">
                                {product.name}
                              </h3>
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                dispatch(removeFromCart(product._id || product.id || product.slug || item._id || item.id))
                              }}
                              className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition-colors shrink-0 cursor-pointer"
                              title="Remove item"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-100">
                            <div className="flex items-center bg-stone-50 rounded-md border border-stone-300 px-1 py-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dispatch(
                                    updateQuantity({
                                      productId: product._id || product.id || product.slug || item._id || item.id,
                                      quantity: item.quantity - 1,
                                    })
                                  )
                                }}
                                className="h-6 w-6 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition-colors cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-bold text-stone-800 px-2.5 min-w-[20px] text-center select-none">
                                {item.quantity}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dispatch(
                                    updateQuantity({
                                      productId: product._id || product.id || product.slug || item._id || item.id,
                                      quantity: item.quantity + 1,
                                    })
                                  )
                                }}
                                className="h-6 w-6 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition-colors cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-xs font-bold text-[#5A3859]">
                              ₹{(price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Visual Scroll Hint / Floating More Items Indicator */}
                {hasMoreBelow && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6]/90 to-transparent pt-6 pb-2 px-4 flex items-center justify-center pointer-events-none z-10 transition-all duration-300">
                    <button
                      type="button"
                      onClick={scrollToMoreItems}
                      className="pointer-events-auto bg-[#5A3859] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 hover:bg-[#4A2E49] transition-transform hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
                    >
                      <span>More items below</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Footer & Checkout */}
              <div className="border-t border-stone-200 bg-white p-4 sm:p-5 space-y-3.5 shadow-xl">
                {hasOutOfStockItems && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Please remove out of stock items to proceed.</span>
                  </div>
                )}

                {/* Apply Voucher / Coupon Interactive Section (Clean 1-line layout) */}
                {appliedCoupon && discountAmount > 0 ? (
                  <div className="bg-[#F0FDF4] border border-emerald-300/90 px-3.5 py-2.5 rounded-lg flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-900 truncate">
                        Offer Applied
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsVoucherModalOpen(true)}
                        className="text-[#5A3859] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={() => dispatch(removeCoupon())}
                        className="text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsVoucherModalOpen(true)}
                    className="w-full flex items-center justify-between bg-[#FAF7F9] hover:bg-[#F3EDF1] border border-stone-200 hover:border-[#5A3859] px-3.5 py-2.5 transition-colors text-left cursor-pointer group rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="h-3.5 w-3.5 text-[#5A3859] shrink-0" />
                      <span className="text-xs font-bold text-stone-900 truncate">
                        Apply Coupon / Offers
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-[#5A3859] flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                      Offers <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                )}

                {/* Subtotal breakdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-stone-500 font-medium">
                    <span>Subtotal</span>
                    <span className="text-sm font-bold text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs text-stone-500 font-medium">
                    <span>Shipping</span>
                    <span className={shippingFee === 0 ? "text-emerald-700 font-bold" : "text-stone-800"}>
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </div>
                </div>

                {/* Total amount bar */}
                <div className="pt-2.5 border-t border-stone-100 flex justify-between items-center gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Total Payable</span>
                    <span className="text-lg sm:text-xl font-black text-[#5A3859]">₹{totalPayable.toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={hasOutOfStockItems}
                    className={`px-5 sm:px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${hasOutOfStockItems
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      : 'bg-[#5A3859] hover:bg-[#4B2F4A] text-white active:scale-95'
                      }`}
                  >
                    <span>Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.aside>
      </div>
    )}
  </AnimatePresence>

  {/* Dedicated Voucher / Coupon Modal */}
  <ApplyVoucherModal
    isOpen={isVoucherModalOpen}
    onClose={() => setIsVoucherModalOpen(false)}
  />
</>
)
}
