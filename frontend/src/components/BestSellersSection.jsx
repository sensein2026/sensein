import { useState, useRef, useEffect } from 'react'
import { Check, Sparkles, ChevronLeft, ChevronRight, Plus, Minus, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useGetFeaturedProductsQuery } from '@/features/productsApi'
import { addToCart, updateQuantity, removeFromCart, selectCartItems } from '@/store/cartSlice'
import { setCartDrawerOpen } from '@/store/uiSlice'
import { triggerFlyToCart } from '@/utils/flyToCart'

// Default backup products if backend products are loading
const defaultProducts = [
  {
    _id: 'sensein-1',
    name: 'SENSEIN® Damage Repair Shampoo',
    shortDescription: 'Sulphate-free gentle cleansing & bond restoration for Indian hair.',
    badge: 'MOST RE-ORDERED',
    bannerTag: '21k+ UNITS SOLD',
    price: 1299,
    compareAtPrice: 1599,
    rating: 5.0,
    reviewsCount: 320,
    mainImage: '/images/sensein-shampoo.jpg',
    slug: 'sensein-damage-repair-shampoo',
  },
  {
    _id: 'sensein-2',
    name: 'SENSEIN® Intense Bond Repair Mask',
    shortDescription: 'Deep bond repair & cuticle sealing mask.',
    badge: 'SALON CARE',
    bannerTag: 'REPAIR & SMOOTH',
    price: 1499,
    compareAtPrice: 1899,
    rating: 4.9,
    reviewsCount: 210,
    mainImage: '/images/sensein-mask.jpg',
    slug: 'sensein-intense-bond-repair-mask',
  },
  {
    _id: 'sensein-3',
    name: 'SENSEIN® Anti-Frizz Gloss Hair Serum',
    shortDescription: 'Silky glass-shine serum & heat protectant.',
    badge: 'HOT DROP',
    bannerTag: 'NEW LAUNCH',
    price: 999,
    compareAtPrice: 1299,
    rating: 5.0,
    reviewsCount: 410,
    mainImage: '/images/sensein-serum.jpg',
    slug: 'sensein-anti-frizz-gloss-serum',
  },
  {
    _id: 'sensein-4',
    name: 'SENSEIN® Royal Amber Hair & Body Perfume',
    shortDescription: 'Long-lasting alcohol-free luxury hair mist.',
    badge: 'LUXURY ESSENCE',
    bannerTag: 'ROYAL ACCORD',
    price: 1850,
    compareAtPrice: 2200,
    rating: 4.9,
    reviewsCount: 145,
    mainImage: '/images/sensein-perfume.jpg',
    slug: 'sensein-royal-amber-perfume',
  },
  {
    _id: 'sensein-5',
    name: 'SENSEIN® Scalp Shield & Mineral Detox',
    shortDescription: 'Hard water protection & deep scalp clarity.',
    badge: 'BESTSELLER',
    bannerTag: 'SCALP SOS',
    price: 1199,
    compareAtPrice: 1399,
    rating: 4.8,
    reviewsCount: 180,
    mainImage: '/images/sensein-serum.jpg',
    slug: 'sensein-scalp-shield-serum',
  },
]

export default function BestSellersSection() {
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)
  const { data: response } = useGetFeaturedProductsQuery()
  const apiProducts = response?.data || []
  const products = apiProducts.length > 0 ? apiProducts : defaultProducts

  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    updateScrollButtons()
    const handleResize = () => updateScrollButtons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [products.length])

  const getProductCartQty = (product) => {
    if (!product) return 0
    const pId = String(product._id || product.id || product.slug || '')
    const item = cartItems.find((ci) => {
      const cId = String(ci.product?._id || ci.product?.id || ci.product?.slug || ci._id || ci.id || '')
      return cId === pId
    })
    return item ? (item.quantity || 1) : 0
  }

  const handleAddToCart = (product, e) => {
    const imgSrc = product.mainImage || product.image || (product.images && product.images[0])
    triggerFlyToCart(imgSrc, e)
    dispatch(addToCart({ product, quantity: 1 }))
  }

  const handleIncrease = (product) => {
    const pId = String(product._id || product.id || product.slug || '')
    const currentQty = getProductCartQty(product)
    dispatch(updateQuantity({ productId: pId, quantity: currentQty + 1 }))
  }

  const handleDecrease = (product) => {
    const pId = String(product._id || product.id || product.slug || '')
    const currentQty = getProductCartQty(product)
    if (currentQty <= 1) {
      dispatch(removeFromCart(pId))
    } else {
      dispatch(updateQuantity({ productId: pId, quantity: currentQty - 1 }))
    }
  }

  const getScrollAmount = () => {
    if (!scrollRef.current) return 300
    // Scroll roughly 1 or 2 card widths
    return Math.max(260, Math.floor(scrollRef.current.clientWidth * 0.75))
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' })
      setTimeout(updateScrollButtons, 350)
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: getScrollAmount(), behavior: 'smooth' })
      setTimeout(updateScrollButtons, 350)
    }
  }

  const handleScroll = () => {
    updateScrollButtons()
  }

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setHasMoved(false)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeftState(scrollRef.current.scrollLeft)
  }

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false)
    setTimeout(() => setHasMoved(false), 50)
    setTimeout(updateScrollButtons, 100)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // Multiplier for smooth swipe
    if (Math.abs(walk) > 5) {
      setHasMoved(true)
    }
    scrollRef.current.scrollLeft = scrollLeftState - walk
    updateScrollButtons()
  }

  return (
    <section className="py-16 sm:py-24 bg-transparent relative z-10 overflow-hidden select-none">
      <div className="container-page max-w-7xl relative">

        {/* Section Header: BESTSELLERS Headline */}
        <div className="mb-8 pb-4 border-b border-stone-100">
          <div className="space-y-1">
            <h2 className="font-sans text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#111111]">
              THE CROWD FAVOURITES
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Formulated & dermatologically tested for Indian hair textures
            </p>
          </div>
        </div>

        {/* Outer Carousel Container with Side Gradient Fade */}
        <div className="relative group/carousel">

          {/* Side-Scrollable Horizontal Track */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            className={`flex gap-2.5 sm:gap-3.5 overflow-x-auto scrollbar-none py-3 px-1 transition-all ${
              isDragging ? 'cursor-grabbing select-none scroll-auto' : 'cursor-grab'
            }`}
            style={{
              scrollBehavior: isDragging ? 'auto' : 'smooth',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {products.map((product, idx) => {
              const badgeText = product.badge || (idx === 0 ? 'MOST RE-ORDERED' : idx === 1 ? 'SALON CARE' : idx === 2 ? 'HOT DROP' : 'LUXURY ESSENCE')
              const qtyInCart = getProductCartQty(product)

              return (
                <div
                  key={product._id}
                  className="w-[215px] sm:w-[235px] md:w-[245px] shrink-0 snap-start flex flex-col justify-between bg-white border border-stone-200/90 rounded-none shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_32px_rgba(90,56,89,0.15)] transition-all duration-300 overflow-hidden group"
                >
                  {/* Top Image Container */}
                  <Link
                    to={`/product/${product.slug}`}
                    onClick={(e) => {
                      if (hasMoved) e.preventDefault()
                    }}
                    className="block relative aspect-square w-full bg-[#FAF7F9] overflow-hidden p-2.5 cursor-pointer"
                  >
                    <img
                      src={product.mainImage}
                      alt={product.name}
                      draggable="false"
                      className="h-full w-full object-cover rounded-none pointer-events-none"
                    />

                    {/* Sensein Rectangular Badge */}
                    <span className="absolute top-2.5 right-2.5 bg-[#f2edf1]/95 text-[#5A3859] px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-xs border border-[#5A3859]/15 flex items-center gap-1 backdrop-blur-md rounded-none">
                      <Sparkles className="w-2.5 h-2.5 text-[#5A3859] shrink-0" />
                      <span>{badgeText.replace(/^♡\s*/, '')}</span>
                    </span>
                  </Link>

                  {/* Card Content & Pricing (Compact & Proportional) */}
                  <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 space-y-2">
                    <Link
                      to={`/product/${product.slug}`}
                      onClick={(e) => {
                        if (hasMoved) e.preventDefault()
                      }}
                      className="block space-y-1 cursor-pointer group/info"
                    >
                      <h3 className="font-bold text-xs sm:text-[13px] text-[#111111] group-hover/info:text-[#5A3859] transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating & Price row */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-amber-500 font-bold">★ {product.rating || 5.0}</span>
                        <span className="text-gray-400 text-[9px]">({product.reviewsCount || 120})</span>
                      </div>

                      <div className="flex items-baseline gap-1 font-bold">
                        {product.compareAtPrice > product.price && (
                          <span className="text-[10px] line-through text-gray-400 font-normal font-mono">
                            ₹{product.compareAtPrice}
                          </span>
                        )}
                        <span className="text-xs sm:text-[13px] font-extrabold text-[#111111] font-mono">
                          ₹{product.price}
                        </span>
                      </div>
                    </div>

                    {/* Action Button / Quantity Controls */}
                    {qtyInCart > 0 ? (
                      <div className="w-full bg-[#5A3859] text-white font-bold text-xs py-1 px-2 rounded-lg shadow-xs flex items-center justify-between h-8">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleDecrease(product)
                          }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white rounded transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="font-extrabold text-xs select-none tracking-wider text-white">
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleIncrease(product)
                          }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white rounded transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          handleAddToCart(product, e)
                        }}
                        className="w-full bg-[#5A3859] hover:bg-[#4b2f4a] active:scale-95 text-white font-bold text-[10px] sm:text-[11px] uppercase rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 h-8 cursor-pointer tracking-wider"
                      >
                        <ShoppingBag className="h-3 w-3" /> ADD TO CART
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Left Floating Edge Arrow (Disabled at Start) */}
          <button
            type="button"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`flex absolute -left-2 sm:-left-4 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white text-stone-800 shadow-xl border border-stone-200 items-center justify-center transition-all duration-300 ${
              !canScrollLeft
                ? 'opacity-25 cursor-not-allowed pointer-events-none'
                : 'hover:bg-[#5A3859] hover:text-white cursor-pointer active:scale-95 shadow-md hover:scale-105'
            }`}
            aria-label="Previous products"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Right Floating Edge Arrow (Disabled at End) */}
          <button
            type="button"
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`flex absolute -right-2 sm:-right-4 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white text-stone-800 shadow-xl border border-stone-200 items-center justify-center transition-all duration-300 ${
              !canScrollRight
                ? 'opacity-25 cursor-not-allowed pointer-events-none'
                : 'hover:bg-[#5A3859] hover:text-white cursor-pointer active:scale-95 shadow-md hover:scale-105'
            }`}
            aria-label="Next products"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        </div>



        {/* SHOP ALL PRODUCTS Button */}
        <div className="mt-10 text-center">
          <Link
            to="/shop"
            className="inline-block bg-[#5A3859] hover:bg-[#4b2f4a] text-white font-bold text-xs sm:text-sm uppercase px-10 py-3.5 tracking-wider rounded-none shadow-lg transition-all hover:scale-105"
          >
            SHOP ALL PRODUCTS
          </Link>
        </div>
      </div>
    </section>
  )
}
