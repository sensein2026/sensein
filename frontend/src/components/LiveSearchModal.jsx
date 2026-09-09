import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  X,
  Sparkles,
  Star,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  ChevronLeft,
  Tag,
  SlidersHorizontal,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { useGetProductsQuery } from '@/features/productsApi'
import { addToCart } from '@/store/cartSlice'
import { setCartDrawerOpen } from '@/store/uiSlice'

const POPULAR_SEARCHES = [
  'Hair Care',
  'Hair Serum',
  'Rosemary Hair Oil',
  'Anti-Frizz',
  'Skin Care',
  'Botanical Cleanser',
]

const CATEGORY_OPTIONS = [
  { slug: '', label: 'All Products' },
  { slug: 'hair-care', label: 'Hair Care' },
  { slug: 'skin-care', label: 'Skin Care' },
  { slug: 'combos', label: 'Luxury Combos' },
  { slug: 'fragrance', label: 'Fragrances' },
]

export default function LiveSearchModal({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [sliderIndex, setSliderIndex] = useState(0)
  const inputRef = useRef(null)
  const searchBarRef = useRef(null)

  // Query products based on category and search string
  const { data: productsData, isLoading } = useGetProductsQuery({
    category: selectedCategory,
    search: searchTerm,
  })

  const rawProducts = productsData?.data || []

  // Client-side Price Filtering
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((p) => {
      if (selectedPrice === 'under-1000' && p.price >= 1000) return false
      if (selectedPrice === '1000-2000' && (p.price < 1000 || p.price > 2000)) return false
      if (selectedPrice === 'above-2000' && p.price <= 2000) return false
      return true
    })
  }, [rawProducts, selectedPrice])

  // Automatic Product Carousel Slider
  useEffect(() => {
    if (!isOpen || filteredProducts.length === 0) return
    const timer = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % filteredProducts.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isOpen, filteredProducts.length])

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleDocumentClick = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleDocumentClick)
      document.addEventListener('touchstart', handleDocumentClick)
    }, 50)

    window.addEventListener('keydown', handleKeyDown)
    setTimeout(() => inputRef.current?.focus(), 80)

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('touchstart', handleDocumentClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setSelectedCategory('')
      setSelectedPrice('all')
      setSliderIndex(0)
    }
  }, [isOpen])

  const handleSelectProduct = (slug) => {
    onClose()
    navigate(`/product/${slug}`)
  }

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    onClose()
    const params = new URLSearchParams()
    if (searchTerm.trim()) params.set('search', searchTerm.trim())
    if (selectedCategory) params.set('category', selectedCategory)
    navigate(`/shop?${params.toString()}`)
  }

  const handlePopularClick = (keyword) => {
    setSearchTerm(keyword)
  }

  if (!isOpen) return null

  const activeSliderProduct = filteredProducts[sliderIndex] || filteredProducts[0]

  return (
    <AnimatePresence>
      {/* Search Overlay Screen (Pure Seamless White Full Screen) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-white text-stone-900 flex flex-col overflow-hidden font-sans"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Clean Seamless Top Search Bar (No Lines, Borders or Shadows) */}
        <div
          ref={searchBarRef}
          onClick={(e) => e.stopPropagation()}
          className="sticky top-0 z-50 bg-white border-none shadow-none py-2.5 sm:py-3.5 px-3 sm:px-6 w-full"
        >
          <div className="max-w-3xl mx-auto w-full">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full gap-1.5 sm:gap-3 bg-transparent border-none outline-none shadow-none"
            >
              {/* Back / Close Arrow */}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-stone-700 hover:text-[#5A3859] active:text-[#5A3859] rounded-full hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
                aria-label="Close search"
                title="Close Search (Esc)"
              >
                <ArrowLeft className="h-5 w-5 sm:h-5.5 sm:w-5.5 stroke-[2]" />
              </button>

              {/* Responsive Borderless Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="flex-1 w-full min-w-0 bg-transparent text-sm sm:text-base text-[#111111] placeholder:text-stone-400 font-normal border-0 outline-none focus:outline-none focus:ring-0 shadow-none px-1 py-1"
                style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
              />

              {/* Clear 'X' Button */}
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 active:text-stone-900 rounded-full hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
                  aria-label="Clear search input"
                >
                  <X className="h-4 w-4 stroke-[2]" />
                </button>
              )}

              {/* Search Submit Button */}
              <button
                type="submit"
                className="w-9 h-9 sm:w-auto sm:h-9 sm:px-3.5 flex items-center justify-center text-[#5A3859] hover:text-[#3d253c] hover:bg-stone-100 sm:hover:bg-[#5A3859]/10 rounded-full sm:rounded-lg font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer select-none"
                aria-label="Submit search"
              >
                <Search className="h-4.5 w-4.5 stroke-[2.2]" />
                <span className="hidden sm:inline sm:ml-1.5">Search</span>
              </button>
            </form>
          </div>
        </div>

        {/* Search Results & Recommendations Body */}
        <div className="flex-1 max-w-5xl mx-auto w-full py-6 px-4 sm:px-6 space-y-6 overflow-y-auto overscroll-contain">
          {/* Featured Carousel Banner (When results exist) */}
          {activeSliderProduct && (
            <div className="relative bg-gradient-to-r from-stone-900 via-[#372336] to-[#5A3859] text-white rounded-none p-6 md:p-8 shadow-xl overflow-hidden border border-stone-800">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-white/10 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> Sensein Featured Formulation
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white line-clamp-1">
                    {activeSliderProduct.name}
                  </h2>
                  <p className="text-stone-300 text-xs md:text-sm line-clamp-2 font-light leading-relaxed">
                    {activeSliderProduct.shortDescription || activeSliderProduct.description}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-xl font-extrabold text-[#D4AF37]">
                      ₹{activeSliderProduct.price.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectProduct(activeSliderProduct.slug)}
                      className="bg-white text-[#5A3859] hover:bg-stone-100 py-2.5 px-5 rounded-none text-xs uppercase font-bold tracking-wider shadow-md transition-all"
                    >
                      View Formulation
                    </button>
                  </div>
                </div>

                {/* Slider Image */}
                <div className="md:col-span-4 flex justify-center">
                  <div className="aspect-square h-36 md:h-44 rounded-none overflow-hidden border border-white/20 shadow-2xl bg-white/10 backdrop-blur">
                    <img
                      src={activeSliderProduct.mainImage}
                      alt={activeSliderProduct.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&auto=format&fit=crop&q=80'
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Slider Controls */}
              {filteredProducts.length > 1 && (
                <div className="absolute bottom-3 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSliderIndex((prev) => (prev === 0 ? filteredProducts.length - 1 : prev - 1))}
                    className="h-7 w-7 rounded-none bg-white/15 hover:bg-white/25 flex items-center justify-center text-white backdrop-blur transition-all border border-white/20"
                    aria-label="Previous product"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] font-bold text-stone-300">
                    {sliderIndex + 1}/{filteredProducts.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSliderIndex((prev) => (prev + 1) % filteredProducts.length)}
                    className="h-7 w-7 rounded-none bg-white/15 hover:bg-white/25 flex items-center justify-center text-white backdrop-blur transition-all border border-white/20"
                    aria-label="Next product"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Popular Trending Keywords */}
          {!searchTerm.trim() && (
            <div className="bg-white p-5 rounded-none border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5A3859]">
                <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
                <span>Trending Botanicals</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => handlePopularClick(keyword)}
                    className="px-3.5 py-1.5 rounded-none text-xs font-medium bg-stone-50 hover:bg-[#5A3859] hover:text-white text-stone-700 border border-stone-200 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                    <span>{keyword}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Autocomplete Predictive List */}
          {searchTerm.trim() && (
            <div className="bg-white p-4 sm:p-6 rounded-none border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-3">
                <span>Matching Formulations ({filteredProducts.length})</span>
                {selectedCategory && <span className="text-[#5A3859]">Category: {selectedCategory}</span>}
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-[#5A3859] border-t-transparent rounded-full animate-spin" />
                  <span>Searching Formulations...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-stone-900">No formulations match &quot;{searchTerm}&quot;</p>
                  <p className="text-xs text-stone-500">Try changing your search terms or category filter</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredProducts.slice(0, 6).map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleSelectProduct(item.slug || item._id)}
                      className="flex items-center justify-between py-3 px-2 rounded-none hover:bg-stone-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={item.mainImage}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=100&auto=format&fit=crop&q=80'
                          }}
                          className="h-12 w-12 rounded-none object-cover border border-stone-200 shrink-0 bg-stone-50"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#5A3859] transition-colors truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                            <span className="bg-[#5A3859]/10 text-[#5A3859] px-2 py-0.5 rounded-none font-bold uppercase text-[9px]">
                              {item.category?.name || 'Botanical'}
                            </span>
                            <span className="font-bold text-stone-900">
                              ₹{item.price.toLocaleString('en-IN')}
                            </span>
                            <span className="flex items-center text-amber-600 font-bold text-[10px]">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-0.5" />
                              {item.rating || '4.9'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-[#5A3859] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Catalog Grid */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {searchTerm.trim() ? `Search Results (${filteredProducts.length})` : 'Popular Botanical Formulations'}
                </h3>
                <p className="text-xs text-stone-500">Handcrafted clinical luxury for radiant skin & hair</p>
              </div>

              <button
                type="button"
                onClick={handleSearchSubmit}
                className="text-xs font-bold text-[#5A3859] hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                <span>View All In Shop</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Product Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => handleSelectProduct(product.slug || product._id)}
                  className="group bg-white rounded-none overflow-hidden border border-stone-200 shadow-sm hover:border-[#5A3859]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer p-4 space-y-3"
                >
                  <div className="space-y-3">
                    <div className="aspect-square rounded-none overflow-hidden bg-stone-50 relative border border-stone-100">
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&auto=format&fit=crop&q=80'
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 bg-[#5A3859] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none">
                        {product.category?.name || 'Care'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#5A3859] transition-colors line-clamp-1">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-stone-900">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.compareAtPrice > product.price && (
                          <span className="text-xs text-stone-400 line-through">
                            ₹{product.compareAtPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="ml-auto text-amber-600 font-bold text-xs flex items-center">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-0.5" />
                          {product.rating || '4.9'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      dispatch(addToCart({ product, quantity: 1 }))
                      onClose()
                    }}
                    className="w-full bg-[#5A3859] hover:bg-[#4B2F4A] text-white text-xs py-2.5 rounded-none font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to Bag
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

