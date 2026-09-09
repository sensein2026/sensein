import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Lock,
  RotateCcw,
  Truck,
  CheckCircle2,
  Tag,
  ArrowLeft,
  Heart,
  CreditCard,
  AlertTriangle,
  Percent,
  Copy,
  Gift,
} from 'lucide-react'
import {
  selectCartItems,
  selectCartSubtotal,
  selectAppliedCoupon,
  updateQuantity,
  removeFromCart,
  removeCoupon,
  clearCart,
} from '@/store/cartSlice'
import { selectIsAuthenticated } from '@/store/authSlice'
import { openAuthModal } from '@/store/uiSlice'
import ApplyVoucherModal from '@/components/ApplyVoucherModal'
import { useGetShippingSettingsQuery } from '@/features/ordersApi'

export default function CartPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartItems = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartSubtotal)
  const appliedCoupon = useSelector(selectAppliedCoupon)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)

  // Dynamic Shipping Rates from Store Configuration
  const { data: shippingData } = useGetShippingSettingsQuery()
  const shippingSettings = shippingData?.settings || {}
  const standardFee = Number(shippingSettings.standardShippingFee ?? 79)
  const isFreeEnabled = shippingSettings.isFreeShippingEnabled !== false

  // Coupon/Promo Discount (from Redux appliedCoupon)
  let promoDiscount = 0
  if (appliedCoupon && subtotal >= (appliedCoupon.minSpend || 0)) {
    if (appliedCoupon.discountType === 'percentage') {
      const calculated = Math.round(subtotal * (appliedCoupon.discountValue / 100))
      promoDiscount = appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated
    } else if (appliedCoupon.discountType === 'fixed') {
      promoDiscount = Math.min(subtotal, appliedCoupon.discountValue)
    }
  }
  const promoApplied = !!appliedCoupon && promoDiscount > 0

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

  const isT1Unlocked = tier1Enabled && subtotal >= tier1Threshold
  const isT2Unlocked = tier2Enabled && subtotal >= tier2Threshold
  const isT3Unlocked = tier3Enabled && subtotal >= tier3Threshold

  // Shipping Fee calculation
  let shippingFee = standardFee
  if (subtotal === 0 || standardFee === 0) {
    shippingFee = 0
  } else if (tier1Enabled && tier1Threshold > 0 && subtotal >= tier1Threshold) {
    shippingFee = 0
  }

  let progressPercent = 0
  if (subtotal >= tier1Threshold) {
    if (subtotal < tier2Threshold) {
      const range = Math.max(1, tier2Threshold - tier1Threshold)
      progressPercent = ((subtotal - tier1Threshold) / range) * 50
    } else if (subtotal < tier3Threshold) {
      const range = Math.max(1, tier3Threshold - tier2Threshold)
      progressPercent = 50 + ((subtotal - tier2Threshold) / range) * 50
    } else {
      progressPercent = 100
    }
  }
  progressPercent = Math.min(100, Math.max(0, Math.round(progressPercent * 10) / 10))

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

  const totalAmount = Math.max(0, subtotal - promoDiscount + shippingFee)
  const totalQuantity = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)

  // Calculate total savings from compareAtPrice
  const totalMRP = cartItems.reduce((acc, item) => {
    const p = item.product || {}
    const mrp = p.compareAtPrice || p.mrp || p.price || item.price || 0
    return acc + mrp * (item.quantity || 1)
  }, 0)
  const productSavings = Math.max(0, totalMRP - subtotal)

  const hasOutOfStockItems = cartItems.some(
    (item) =>
      (item.product?.stock !== undefined && item.product.stock <= 0) ||
      item.product?.inStock === false ||
      item.product?.isDeleted === true
  )

  const handleRemoveOutOfStock = () => {
    cartItems.forEach((item) => {
      const p = item.product || {}
      if ((p.stock !== undefined && p.stock <= 0) || p.inStock === false || p.isDeleted === true) {
        dispatch(removeFromCart(p._id || p.id || item._id))
      }
    })
  }

  const handleCheckoutClick = () => {
    if (hasOutOfStockItems) return
    if (!isAuthenticated) {
      dispatch(openAuthModal('/checkout'))
    } else {
      navigate('/checkout')
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] py-16 flex items-center justify-center font-sans">
        <div className="container-page text-center max-w-lg mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-md p-10 sm:p-12 rounded-none border border-stone-200 shadow-xl flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-none bg-[#5A3859]/5 border border-[#5A3859]/20 text-[#5A3859] flex items-center justify-center shadow-inner">
                <ShoppingBag className="h-12 w-12 stroke-[1.5]" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-2 bg-[#D4AF37] rounded-none text-stone-900 shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                Your Shopping Bag is Empty
              </h1>
              <p className="text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
                Experience our clinical botanical formulations designed to nourish and transform your hair & skin.
              </p>
            </div>

            <Link
              to="/shop"
              className="w-full sm:w-auto min-w-[240px] bg-[#5A3859] hover:bg-[#4B2F4A] text-white py-4 px-8 rounded-none text-xs font-bold uppercase tracking-wider shadow-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Explore Best Sellers</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Quick Category Suggestions */}
            <div className="pt-6 border-t border-stone-100 w-full">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
                Explore Collections
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: 'Hair Care', path: '/shop?category=hair-care' },
                  { label: 'Skin Care', path: '/shop?category=skin-care' },
                  { label: 'Luxury Combos', path: '/shop?category=combos' },
                ].map((cat) => (
                  <Link
                    key={cat.label}
                    to={cat.path}
                    className="text-xs px-3.5 py-1.5 rounded-none bg-stone-50 border border-stone-200 text-stone-700 hover:border-[#5A3859] hover:text-[#5A3859] hover:bg-white transition-all font-medium"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 font-sans">
      <div className="container-page max-w-6xl space-y-8 px-4 sm:px-6">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#5A3859] uppercase tracking-widest mb-1">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Sensein Botanical Luxury</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
              Shopping Bag
              <span className="text-xs font-bold px-3 py-1 rounded-none bg-[#5A3859] text-white">
                {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Cart Progress Bar (Simple 1-Tier vs 3-Tier Gamified Milestones) */}
        {shippingSettings.cartProgressMode === 'simple' ? (
          /* Classic Simple Free Shipping Progress Bar (સાદી વાળી) */
          <div className="bg-[#FAF9F6] border border-stone-200/80 px-4 py-3.5 rounded-xl shadow-xs space-y-2.5">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors ${
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
              <div className="relative h-2.5 w-full bg-stone-200 rounded-full overflow-hidden">
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
          /* 3-Tier Gamified Milestones Track (આ 3-Tier વાળી) */
          <div className="bg-[#FAF9F6] border border-stone-200/80 px-4 py-3.5 rounded-xl shadow-xs">
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
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs relative ${
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
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs relative ${
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
        )}

        {/* Out of Stock Warning Banner */}
        {hasOutOfStockItems && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-none text-xs text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <strong className="font-bold block">Some products are currently Out of Stock</strong>
                <span className="text-[11px] text-rose-700">
                  Please remove out of stock items from your bag to proceed with checkout.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveOutOfStock}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold uppercase px-3 py-1.5 rounded-none shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Remove Unavailable
            </button>
          </div>
        )}

        {/* Main Grid: Items vs Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="space-y-4">
              {cartItems.map((item) => {
                const product = item.product || {}
                const price = product.price || item.price || 0
                const originalPrice = product.compareAtPrice || product.mrp || 0
                const hasDiscount = originalPrice > price
                const itemSavings = hasDiscount ? (originalPrice - price) * item.quantity : 0
                const isOutOfStock =
                  (product.stock !== undefined && product.stock <= 0) ||
                  product.inStock === false ||
                  product.isDeleted === true
                const imageSrc =
                  product.mainImage ||
                  product.image ||
                  (product.images && product.images[0]) ||
                  'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&auto=format&fit=crop&q=80'

                return (
                  <div
                    key={product._id || product.id || item._id}
                    className={`bg-white rounded-none border p-4 sm:p-5 shadow-sm transition-all duration-200 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center justify-between ${
                      isOutOfStock
                        ? 'border-rose-300 bg-rose-50/20 opacity-90'
                        : 'border-stone-200 hover:border-[#5A3859]/40'
                    }`}
                  >
                    {/* Left: Clickable Image & Details */}
                    <Link
                      to={`/product/${product.slug || product._id || product.id}`}
                      className="flex gap-4 items-center flex-1 min-w-0 group/item cursor-pointer block"
                    >
                      <div className="relative h-22 w-22 sm:h-24 sm:w-24 rounded-none overflow-hidden bg-stone-50 border border-stone-200 shrink-0">
                        <img
                          src={imageSrc}
                          alt={product.name || 'Product'}
                          className={`h-full w-full object-cover group-hover/item:scale-105 transition-transform duration-300 ${
                            isOutOfStock ? 'grayscale-[0.5]' : ''
                          }`}
                        />
                        {isOutOfStock ? (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-center">
                            <span className="text-[9px] font-black uppercase text-white bg-rose-600 px-1 py-0.5 tracking-wider">
                              Out of Stock
                            </span>
                          </div>
                        ) : hasDiscount ? (
                          <div className="absolute top-0 left-0 px-2 py-0.5 bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider">
                            Save ₹{(originalPrice - price).toLocaleString('en-IN')}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A3859] bg-[#5A3859]/10 px-2 py-0.5 rounded-none border border-[#5A3859]/20">
                            {product.category?.name || 'Hair Care'}
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[11px] text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2 py-0.5 border border-rose-200">
                              <AlertTriangle className="h-3 w-3 text-rose-600" />
                              Out of Stock
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-none bg-emerald-500 animate-pulse" />
                              In Stock
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-stone-900 group-hover/item:text-[#5A3859] transition-colors line-clamp-1 block">
                          {product.name}
                        </h3>

                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-stone-900 group-hover/item:text-[#5A3859]">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-stone-400 line-through">
                              ₹{originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-[11px] text-stone-500">/ unit</span>
                        </div>
                      </div>
                    </Link>

                    {/* Right: Quantity Stepper, Line Total, and Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-stone-100">
                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-stone-50 rounded-none border border-stone-300 p-0.5">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: product._id || product.id || product.slug || item._id || item.id,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          className="h-7 w-7 rounded-none flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition-all"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: product._id || product.id || product.slug || item._id || item.id,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          className="h-7 w-7 rounded-none flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition-all"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[90px]">
                        <span className="text-base font-extrabold text-stone-900 block">
                          ₹{(price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        {itemSavings > 0 && (
                          <span className="text-[10px] text-emerald-700 font-bold">
                            Saved ₹{itemSavings.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => dispatch(removeFromCart(product._id || product.id || product.slug || item._id || item.id))}
                        className="p-2 rounded-none text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 border border-transparent hover:border-rose-200"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 px-2 text-xs">
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 font-bold text-[#5A3859] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Continue Browsing Products
              </Link>

              <div className="flex items-center gap-4 text-stone-500">
                <button
                  onClick={() => dispatch(clearCart())}
                  className="hover:text-rose-600 underline font-medium transition-colors"
                >
                  Clear Bag
                </button>
                <span>•</span>
                <span>All prices inclusive of GST</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="bg-white rounded-none border border-stone-200 p-6 sm:p-7 shadow-sm space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                  Order Summary
                </h2>
                <span className="text-xs font-semibold text-stone-500">
                  {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Apply Voucher / Coupon Interactive Section (Ultra Compact) */}
              {appliedCoupon && promoDiscount > 0 ? (
                <div className="bg-[#F0FDF4] border border-emerald-300/80 px-3 py-2 flex items-center justify-between rounded-none">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-emerald-700 text-xs font-bold shrink-0">✓</span>
                    <span className="text-xs font-black font-mono tracking-wider text-emerald-900 shrink-0">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 border border-emerald-200 shrink-0">
                      -₹{promoDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-bold shrink-0">
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
                  className="w-full flex items-center justify-between bg-[#FAF7F9] hover:bg-[#F3EDF1] border border-stone-200 hover:border-[#5A3859] px-3 py-2 transition-colors text-left cursor-pointer group rounded-none"
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

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs border-t border-stone-100 pt-4">
                <div className="flex justify-between text-stone-600">
                  <span>Bag Subtotal</span>
                  <span className="font-bold text-stone-900">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {productSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Retail Discount</span>
                    <span>-₹{productSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {promoApplied && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Savings</span>
                    <span>-₹{promoDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span className="flex items-center gap-1">
                    Estimated Delivery
                    <span className="text-[10px] text-stone-400">(Express)</span>
                  </span>
                  <span
                    className={
                      shippingFee === 0
                        ? 'font-bold text-emerald-700'
                        : 'font-semibold text-stone-900'
                    }
                  >
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
              </div>

              {/* Total Payable Box */}
              <div className="border-t border-stone-200 pt-4 bg-[#FAF8F6] -mx-6 -mb-6 p-6 rounded-none space-y-4">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-stone-500 block">
                      Total Payable
                    </span>
                    <span className="text-[11px] text-stone-400 font-normal">
                      Includes ₹{Math.round(totalAmount * 0.18).toLocaleString('en-IN')} GST
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-[#5A3859] tracking-tight">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                    {(productSavings > 0 || promoDiscount > 0) && (
                      <p className="text-[11px] text-emerald-700 font-bold">
                        You save ₹{(productSavings + promoDiscount).toLocaleString('en-IN')} on this order
                      </p>
                    )}
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-none text-xs text-amber-900 font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>Quick 1-step sign in at next step for instant dispatch.</span>
                  </div>
                )}

                {/* Primary Checkout CTA */}
                <button
                  onClick={handleCheckoutClick}
                  disabled={hasOutOfStockItems}
                  className={`w-full py-4 px-6 rounded-none text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 ${
                    hasOutOfStockItems
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      : 'bg-[#5A3859] hover:bg-[#4B2F4A] active:scale-[0.99] text-white hover:shadow-lg cursor-pointer'
                  }`}
                >
                  {hasOutOfStockItems ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                      <span>Remove Out of Stock Items</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="space-y-2 pt-2 border-t border-stone-200 text-[11px] text-stone-500 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>256-Bit SSL Encrypted & Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-[#5A3859] shrink-0" />
                    <span>100% Botanical Guarantee & Easy Replacements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#D4AF37] shrink-0" />
                    <span>Supports UPI, Cards, NetBanking & Cash on Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Apply Voucher Modal */}
      <ApplyVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
      />
    </div>
  )
}

