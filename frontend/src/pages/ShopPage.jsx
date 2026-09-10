import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ShoppingBag,
  Star,
  Search,
  SlidersHorizontal,
  Filter,
  X,
  Heart,
  Grid,
  List,
  Sparkles,
  Plus,
  Minus,
  ChevronDown,
  Check,
  ArrowUpDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGetProductsQuery, useGetCategoriesQuery } from '@/features/productsApi'
import { addToCart, updateQuantity, removeFromCart, selectCartItems } from '@/store/cartSlice'
import { setCartDrawerOpen } from '@/store/uiSlice'
import { toggleWishlistItem, selectWishlistItems } from '@/store/wishlistSlice'
import { triggerFlyToCart } from '@/utils/flyToCart'
import { trackAddToCart as trackAddToCartEvent } from '@/utils/analytics'

export default function ShopPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const savedWishlist = useSelector(selectWishlistItems)

  const activeCategory = searchParams.get('category') || ''
  const activeFilter = searchParams.get('filter') || ''
  const urlSearch = searchParams.get('search') || ''
  const [searchQuery, setSearchQuery] = useState(urlSearch)
  const [sortBy, setSortBy] = useState('featured')

  // Sync searchQuery whenever URL searchParams change (from Header / Live Search Modal / External link)
  useEffect(() => {
    const currentUrlSearch = searchParams.get('search') || ''
    setSearchQuery(currentUrlSearch)
  }, [searchParams])

  // Additional Flipkart-style Filters
  const [priceRange, setPriceRange] = useState('all')
  const [ratingFilter, setRatingFilter] = useState(0)
  const [viewMode, setViewMode] = useState('grid')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Lock body scroll when filter or sort sheet is open on mobile
  useEffect(() => {
    if (isMobileFilterOpen || isMobileSortOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isMobileFilterOpen, isMobileSortOpen])

  const { data: categoriesData } = useGetCategoriesQuery()
  const { data: productsData, isLoading } = useGetProductsQuery({
    category: activeCategory,
    filter: activeFilter,
    sort: sortBy,
    search: searchQuery,
  })


  const categories = categoriesData?.data || []

  // Client-side Price, Rating & Bestseller Filtering
  const filteredProducts = useMemo(() => {
    const rawProducts = productsData?.data || []
    return rawProducts.filter((p) => {
      if (activeFilter === 'bestseller' || activeFilter === 'bestsellers') {
        const isBs =
          p.isBestseller === true ||
          p.isFeatured === true ||
          (p.rating >= 4.7) ||
          (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes('bestseller')))
        if (!isBs) return false
      }

      if (priceRange === 'under-500' && p.price >= 500) return false
      if (priceRange === '500-1000' && (p.price < 500 || p.price > 1000)) return false
      if (priceRange === '1000-2000' && (p.price < 1000 || p.price > 2000)) return false
      if (priceRange === 'above-2000' && p.price <= 2000) return false

      if (ratingFilter > 0 && (p.rating || 0) < ratingFilter) return false

      return true
    })
  }, [productsData, activeFilter, priceRange, ratingFilter])

  const cartItems = useSelector(selectCartItems)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2500)
  }

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
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const imgSrc = product.mainImage || product.image || (product.images && product.images[0])
    triggerFlyToCart(imgSrc, e)
    dispatch(addToCart({ product, quantity: 1 }))
    trackAddToCartEvent(product, 1)
  }

  const handleIncrease = (product, e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const pId = String(product._id || product.id || product.slug || '')
    const currentQty = getProductCartQty(product)
    dispatch(updateQuantity({ productId: pId, quantity: currentQty + 1 }))
  }

  const handleDecrease = (product, e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const pId = String(product._id || product.id || product.slug || '')
    const currentQty = getProductCartQty(product)
    if (currentQty <= 1) {
      dispatch(removeFromCart(pId))
    } else {
      dispatch(updateQuantity({ productId: pId, quantity: currentQty - 1 }))
    }
  }

  const handleToggleWishlist = (product, e) => {
    if (e) e.preventDefault()
    const pId = product._id || product.id
    const isSaved = savedWishlist.some((item) => (item._id || item.id) === pId)
    dispatch(toggleWishlistItem(product))
    showToast(isSaved ? 'Item removed from Wishlist' : 'Item added to Wishlist! ❤️')
  }


  const handleCategoryChange = (slug) => {
    if (slug) {
      setSearchParams({ category: slug })
    } else {
      setSearchParams({})
    }
  }

  const clearAllFilters = () => {
    setSearchParams({})
    setSearchQuery('')
    setSortBy('featured')
    setPriceRange('all')
    setRatingFilter(0)
  }

  return (
    <div className="bg-ivory relative pb-16 lg:pb-10">
      {/* Premium Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-4 sm:top-6 right-4 left-4 sm:left-auto sm:max-w-md z-[100] bg-white/95 backdrop-blur-md text-stone-900 px-4 py-3 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.15)] border border-stone-200/90 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  toastMsg.includes('Wishlist')
                    ? 'bg-rose-50 border border-rose-200 text-rose-500'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                }`}
              >
                {toastMsg.includes('Wishlist') ? (
                  <Heart className="h-4 w-4 fill-current" />
                ) : (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                )}
              </div>
              <p className="text-xs sm:text-[13px] font-semibold text-stone-800 leading-snug line-clamp-2">
                {toastMsg}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {toastMsg.toLowerCase().includes('bag') && (
                <button
                  type="button"
                  onClick={() => {
                    setToastMsg('')
                    dispatch(setCartDrawerOpen(true))
                  }}
                  className="bg-[#5A3859] hover:bg-[#4a2e49] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                  View Bag
                </button>
              )}
              <button
                type="button"
                onClick={() => setToastMsg('')}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>




      {/* Main Catalog Container (Left Sidebar + Right Product Grid) */}
      <div className="container-page max-w-7xl mt-4 sm:mt-6 space-y-6">
        {/* Top Control Bar (Desktop Only) */}
        <div className="hidden lg:flex bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {(activeCategory || priceRange !== 'all' || ratingFilter > 0 || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-[#5A3859] hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Desktop Sort & Grid View Toggles */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative min-w-[175px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs sm:text-sm bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-800 font-bold focus:outline-none focus:border-[#5A3859] cursor-pointer transition-colors appearance-none pr-8"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500 pointer-events-none" />
            </div>

            {/* Grid/List View Toggles */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#5A3859] shadow-xs font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-[#5A3859] shadow-xs font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Flipkart-Style Main Layout: Sidebar + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Filter Column (Desktop) */}
          <div className="hidden lg:block lg:col-span-3 bg-white p-6 rounded-3xl border border-charcoal/10 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-charcoal/10">
              <h3 className="font-display text-base font-bold text-charcoal flex items-center gap-2">
                <Filter className="h-4 w-4 text-rosegold-dark" /> Store Filters
              </h3>
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-rosegold-dark hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Curated Collections (Bestsellers) */}
            <div className="space-y-2 pb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                Curated Collections
              </label>
              <button
                type="button"
                onClick={() => {
                  if (activeFilter === 'bestseller') {
                    setSearchParams(activeCategory ? { category: activeCategory } : {})
                  } else {
                    setSearchParams({
                      ...(activeCategory ? { category: activeCategory } : {}),
                      filter: 'bestseller',
                    })
                  }
                }}
                className={`w-full text-left text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer border ${
                  activeFilter === 'bestseller'
                    ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-xs'
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>★ Bestsellers Collection</span>
                </div>
                {activeFilter === 'bestseller' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </button>
            </div>

            {/* Categories Filter */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                Category
              </label>
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`w-full text-left text-xs py-2 px-3 rounded-xl transition-colors font-medium ${
                    !activeCategory ? 'bg-[#5A3859] text-white font-bold' : 'text-gray-600 hover:bg-[#FAF7F9]'
                  }`}
                >
                  All Categories
                </button>
                {(categoriesData?.data?.length ? categoriesData.data : [
                  { slug: 'shampoo', name: 'Shampoo' },
                  { slug: 'mask', name: 'Mask' },
                  { slug: 'serum', name: 'Serum' },
                  { slug: 'perfume', name: 'Perfume' },
                  { slug: 'cream', name: 'Cream' },
                  { slug: 'facewash', name: 'Facewash' },
                  { slug: 'wax', name: 'Wax (All)' },
                  { slug: 'wax-clay', name: '  • Clay Wax' },
                  { slug: 'wax-gel', name: '  • Gel Wax' },
                  { slug: 'wax-cream', name: '  • Cream Wax' },
                  { slug: 'travelling-kit', name: 'Travelling Kit' },
                  { slug: 'oil', name: 'Oil' },
                  { slug: 'powder', name: 'Powder' },
                ]).map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`w-full text-left text-xs py-2 px-3 rounded-xl transition-colors font-medium ${
                      activeCategory === cat.slug
                        ? 'bg-[#5A3859] text-white font-bold'
                        : 'text-gray-600 hover:bg-[#FAF7F9]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-2 pt-4 border-t border-charcoal/10">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                Price Range
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { key: 'all', label: 'All Prices' },
                  { key: 'under-500', label: 'Under ₹500' },
                  { key: '500-1000', label: '₹500 - ₹1,000' },
                  { key: '1000-2000', label: '₹1,000 - ₹2,000' },
                  { key: 'above-2000', label: 'Above ₹2,000' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer text-charcoal-light hover:text-charcoal">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={priceRange === item.key}
                      onChange={() => setPriceRange(item.key)}
                      className="accent-rosegold-dark cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 pt-4 border-t border-charcoal/10">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                Customer Rating
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { rating: 0, label: 'All Ratings' },
                  { rating: 4.5, label: '4.5 ★ & Above' },
                  { rating: 4.0, label: '4.0 ★ & Above' },
                ].map((item) => (
                  <label key={item.rating} className="flex items-center gap-2 cursor-pointer text-charcoal-light hover:text-charcoal">
                    <input
                      type="radio"
                      name="ratingFilter"
                      checked={ratingFilter === item.rating}
                      onChange={() => setRatingFilter(item.rating)}
                      className="accent-rosegold-dark cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Product Grid Area */}
          <div className="lg:col-span-9 space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-80 bg-charcoal/5 animate-pulse rounded-3xl" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl p-8 border border-charcoal/10 space-y-4">
                <Sparkles className="h-12 w-12 text-charcoal/20 mx-auto" />
                <h3 className="font-display text-xl font-semibold text-charcoal">No Products Found</h3>
                <p className="text-xs text-charcoal-light max-w-sm mx-auto">
                  We couldn&apos;t find any botanical products matching your filter criteria. Try clearing filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="btn-primary text-xs py-3 px-6 rounded-2xl inline-block"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {filteredProducts.map((product) => {
                  const pId = product._id || product.id
                  const isWishlisted = savedWishlist.some((item) => (item._id || item.id) === pId)
                  const discountPct = product.compareAtPrice > product.price
                    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                    : 15
                  return (
                    <div
                      key={product._id}
                      className="group bg-white rounded-xl border border-stone-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-[#5A3859]/30 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        {/* Image Canvas */}
                        <Link
                          to={`/product/${product.slug}`}
                          className="block relative overflow-hidden bg-[#FAF7F9] aspect-square p-2 cursor-pointer"
                        >
                          <img
                            src={product.mainImage}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />

                          {/* Discount Tag */}
                          <div className="absolute top-2 left-2 bg-[#5A3859] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                            {discountPct}% OFF
                          </div>

                          {/* Rating Pill */}
                          <div className="absolute bottom-2 left-2 bg-white/95 text-[#5A3859] px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-xs border border-[#5A3859]/15 flex items-center gap-1 backdrop-blur-md rounded">
                            <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                            <span>{product.rating || '4.9'}</span>
                          </div>
                        </Link>

                        {/* Product Info (Compact & Clean) */}
                        <div className="p-2.5 sm:p-3 space-y-1">
                          <span className="text-[9px] font-bold tracking-wider text-[#5A3859] uppercase block">
                            {product.category?.name || 'Care'}
                          </span>
                          <Link
                            to={`/product/${product.slug}`}
                            className="block cursor-pointer group/info"
                          >
                            <h3 className="font-bold text-xs sm:text-[13px] text-[#111111] group-hover/info:text-[#5A3859] transition-colors line-clamp-2 leading-snug">
                              {product.name}
                            </h3>
                          </Link>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-2.5 sm:p-3 pt-0 flex flex-col space-y-2 mt-auto">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs sm:text-[13px] font-extrabold text-[#111111] font-mono">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {product.compareAtPrice > product.price && (
                            <span className="text-[10px] line-through text-gray-400 font-normal font-mono">
                              ₹{product.compareAtPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {(() => {
                          const qtyInCart = getProductCartQty(product)
                          return qtyInCart > 0 ? (
                            <div className="w-full bg-[#5A3859] text-white font-bold text-xs py-1 px-2 rounded-lg shadow-xs flex items-center justify-between h-8">
                              <button
                                type="button"
                                onClick={(e) => handleDecrease(product, e)}
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
                                onClick={(e) => handleIncrease(product, e)}
                                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white rounded transition-colors cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(product, e)}
                              className="w-full bg-[#5A3859] hover:bg-[#4b2f4a] active:scale-95 text-white font-bold text-[10px] sm:text-[11px] uppercase rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 h-8 cursor-pointer tracking-wider"
                            >
                              <ShoppingBag className="h-3 w-3" /> ADD TO CART
                            </button>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* List View Layout */
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-3xl p-4 border border-charcoal/10 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-6"
                  >
                    <Link to={`/product/${product.slug}`} className="shrink-0 cursor-pointer block">
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="h-32 w-32 rounded-2xl object-cover bg-ivory"
                      />
                    </Link>

                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <span className="text-[10px] font-bold tracking-wider text-rosegold-dark uppercase">
                        {product.category?.name || 'Care'}
                      </span>
                      <Link
                        to={`/product/${product.slug}`}
                        className="block space-y-1 cursor-pointer group/info"
                      >
                        <h3 className="font-display text-lg font-semibold text-charcoal group-hover/info:text-rosegold-dark transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-charcoal-light line-clamp-2 group-hover/info:text-charcoal transition-colors">
                          {product.description}
                        </p>
                      </Link>
                    </div>

                    <div className="text-center sm:text-right shrink-0 space-y-3">
                      <div>
                        <div className="font-display text-xl font-bold text-charcoal font-mono">
                          ₹{product.price.toLocaleString('en-IN')}
                        </div>
                        {product.compareAtPrice > product.price && (
                          <div className="text-xs text-charcoal/40 line-through font-mono">
                            ₹{product.compareAtPrice.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      {(() => {
                        const qtyInCart = getProductCartQty(product)
                        return qtyInCart > 0 ? (
                          <div className="bg-[#5A3859] text-white font-bold text-xs py-1.5 px-3 rounded-2xl flex items-center justify-between gap-3 shadow-sm mx-auto sm:ml-auto w-32 min-h-[38px]">
                            <button
                              type="button"
                              onClick={(e) => handleDecrease(product, e)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className="font-extrabold text-xs text-white">{qtyInCart}</span>
                            <button
                              type="button"
                              onClick={(e) => handleIncrease(product, e)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(product, e)}
                            className="btn-primary text-xs px-5 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-sm mx-auto sm:ml-auto cursor-pointer min-h-[38px]"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" /> Add to Bag
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Slide-in Drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end overflow-hidden"
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-xs"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-h-[88dvh] sm:max-h-[85vh] bg-white rounded-t-3xl p-4 sm:p-5 flex flex-col shadow-2xl z-10 space-y-3.5 overflow-hidden overscroll-contain self-end"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-stone-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#5A3859]" />
                  <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider">Filters</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[11px] font-bold text-[#5A3859] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Filter Options */}
              <div className="overflow-y-auto space-y-4 flex-1 pr-1">
                {/* Curated Collection */}
                <div className="space-y-1.5 pb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 font-mono">
                    Special Collections
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFilter === 'bestseller') {
                          setSearchParams(activeCategory ? { category: activeCategory } : {})
                        } else {
                          setSearchParams({
                            ...(activeCategory ? { category: activeCategory } : {}),
                            filter: 'bestseller',
                          })
                        }
                      }}
                      className={`text-[11px] px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer flex items-center gap-1.5 border ${
                        activeFilter === 'bestseller'
                          ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70 border-stone-200'
                      }`}
                    >
                      <Sparkles className="h-3 w-3 text-amber-600" />
                      <span>★ Bestsellers</span>
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 font-mono">
                    Category
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('')}
                      className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                        !activeCategory ? 'bg-[#5A3859] text-white font-bold shadow-xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
                      }`}
                    >
                      All
                    </button>
                    {(categoriesData?.data?.length ? categoriesData.data : [
                      { slug: 'shampoo', name: 'Shampoo' },
                      { slug: 'mask', name: 'Mask' },
                      { slug: 'serum', name: 'Serum' },
                      { slug: 'perfume', name: 'Perfume' },
                      { slug: 'cream', name: 'Cream' },
                      { slug: 'facewash', name: 'Facewash' },
                      { slug: 'wax', name: 'Wax' },
                      { slug: 'travelling-kit', name: 'Travelling Kit' },
                      { slug: 'oil', name: 'Oil' },
                      { slug: 'powder', name: 'Powder' },
                    ]).map((cat) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => handleCategoryChange(cat.slug)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                          activeCategory === cat.slug ? 'bg-[#5A3859] text-white font-bold shadow-xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-1.5 pt-2.5 border-t border-stone-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 font-mono">
                    Price Range
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'all', label: 'All Prices' },
                      { key: 'under-500', label: 'Under ₹500' },
                      { key: '500-1000', label: '₹500 - ₹1k' },
                      { key: '1000-2000', label: '₹1k - ₹2k' },
                      { key: 'above-2000', label: 'Above ₹2k' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPriceRange(item.key)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                          priceRange === item.key ? 'bg-[#5A3859] text-white font-bold shadow-xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Rating */}
                <div className="space-y-1.5 pt-2.5 border-t border-stone-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 font-mono">
                    Customer Rating
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { rating: 0, label: 'All Ratings' },
                      { rating: 4.5, label: '4.5 ★ & Above' },
                      { rating: 4.0, label: '4.0 ★ & Above' },
                    ].map((item) => (
                      <button
                        key={item.rating}
                        type="button"
                        onClick={() => setRatingFilter(item.rating)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                          ratingFilter === item.rating ? 'bg-[#5A3859] text-white font-bold shadow-xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Results Button */}
              <div className="pt-2.5 border-t border-stone-100 shrink-0 pb-safe">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-[#5A3859] hover:bg-[#4a2e49] active:scale-[0.98] text-white py-3 rounded-xl text-xs uppercase font-bold tracking-wider shadow-md transition-all cursor-pointer"
                >
                  View ({filteredProducts.length}) Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Flipkart-Style Mobile Fixed Bottom Bar (50/50 Sort & Filter) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] flex items-stretch h-12">
        {/* Sort By Button */}
        <button
          type="button"
          onClick={() => setIsMobileSortOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 text-stone-800 active:bg-stone-50 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowUpDown className="h-4 w-4 text-[#5A3859]" />
          <span>Sort By</span>
        </button>

        {/* Vertical Divider */}
        <div className="w-px bg-stone-200 my-2 self-stretch" />

        {/* Filters Button */}
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 text-stone-800 active:bg-stone-50 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer relative"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#5A3859]" />
          <span>Filters</span>
          {(activeCategory || priceRange !== 'all' || ratingFilter > 0) && (
            <span className="w-2 h-2 rounded-full bg-[#5A3859] ring-2 ring-white"></span>
          )}
        </button>
      </div>

      {/* Mobile Sort Bottom Sheet */}
      <AnimatePresence>
        {isMobileSortOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end overflow-hidden"
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSortOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="relative w-full max-h-[85dvh] bg-white rounded-t-2xl p-5 shadow-2xl z-10 space-y-4 overscroll-contain pb-safe self-end"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-[#5A3859]" />
                  <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider">Sort Products By</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSortOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1">
                {[
                  { value: 'featured', label: 'Featured' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                  { value: 'rating', label: 'Customer Rating' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.value)
                      setIsMobileSortOpen(false)
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      sortBy === opt.value
                        ? 'bg-[#5A3859]/10 text-[#5A3859]'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <Check className="h-4 w-4 text-[#5A3859] stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
