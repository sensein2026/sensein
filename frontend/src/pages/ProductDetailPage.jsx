import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  Star,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Plus,
  Minus,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Tag,
  CreditCard,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Share2,
  Check,
  Award,
  Flame,
  Zap,
  Copy,
  CheckSquare,
  Square,
  Headphones,
  Video,
  Play,
  Image as ImageIcon,
  ThumbsUp,
  Camera,
  Upload,
  Film,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useGetProductBySlugQuery,
  useGetFeaturedProductsQuery,
  useGetProductsQuery,
} from '@/features/productsApi'
import { useLazyCheckPincodeQuery } from '@/features/ordersApi'
import { addToCart } from '@/store/cartSlice'
import { setCartDrawerOpen } from '@/store/uiSlice'
import { triggerFlyToCart } from '@/utils/flyToCart'
import SenseinLoader from '@/components/SenseinLoader'
import { trackProductView, trackAddToCart as trackAddToCartEvent } from '@/utils/analytics'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { data: response, isLoading } = useGetProductBySlugQuery(slug)
  const { data: featuredResponse } = useGetFeaturedProductsQuery()
  const { data: allProductsResponse } = useGetProductsQuery()
  const [shuffleKey, setShuffleKey] = useState(0)

  // Full default product catalog fallback
  const fallbackCatalog = {
    'sensein-damage-repair-shampoo': {
      _id: 'sensein-1',
      name: 'SENSEIN® Damage Repair Shampoo',
      slug: 'sensein-damage-repair-shampoo',
      category: { name: 'Shampoo', slug: 'shampoo' },
      price: 1299,
      compareAtPrice: 1599,
      rating: 5.0,
      reviewsCount: 320,
      stock: 50,
      isFeatured: true,
      badge: 'MOST RE-ORDERED',
      mainImage: '/images/sensein-shampoo.jpg',
      gallery: ['/images/sensein-shampoo.jpg', '/images/hero1.jpg', '/images/hero3.jpg'],
      description: 'Repair Damage. Restore Life. Professional Solution for Damaged Hair featuring 4-in-1 Benefits: Gentle Cleansing, Scalp Nourishment, Split End Prevention, and Moisture Restoration. 100% clean formula engineered intentionally for real Indian hair textures and hard water challenges.',
      shortDescription: 'Sulphate-free gentle cleansing & bond restoration for Indian hair.',
    },
    'sensein-intense-bond-repair-mask': {
      _id: 'sensein-2',
      name: 'SENSEIN® Intense Bond Repair Mask',
      slug: 'sensein-intense-bond-repair-mask',
      category: { name: 'Mask', slug: 'mask' },
      price: 1499,
      compareAtPrice: 1899,
      rating: 4.9,
      reviewsCount: 210,
      stock: 45,
      isFeatured: true,
      badge: 'SALON CARE',
      mainImage: '/images/sensein-mask.jpg',
      gallery: ['/images/sensein-mask.jpg', '/images/hero2.jpg', '/images/hero1.jpg'],
      description: 'Deep bond repair & cuticle sealing treatment mask. Powered by biomimetic botanical keratin and fermented rice water to seal open cuticles, restore elasticity, and impart deep moisture for up to 72 hours.',
      shortDescription: 'Deep bond repair & cuticle sealing mask for salon silk hair.',
    },
    'sensein-anti-frizz-gloss-serum': {
      _id: 'sensein-3',
      name: 'SENSEIN® Anti-Frizz Gloss Hair Serum',
      slug: 'sensein-anti-frizz-gloss-serum',
      category: { name: 'Serum', slug: 'serum' },
      price: 999,
      compareAtPrice: 1299,
      rating: 5.0,
      reviewsCount: 410,
      stock: 80,
      isFeatured: true,
      badge: 'HOT DROP',
      mainImage: '/images/sensein-serum.jpg',
      gallery: ['/images/sensein-serum.jpg', '/images/hero3.jpg', '/images/hero2.jpg'],
      description: 'Silky glass-shine lightweight hair elixir and 230°C heat protectant. Controls humid frizz for 72 hours without weighing hair down or leaving greasy residues.',
      shortDescription: 'Silky glass-shine serum & heat protectant for Indian climate.',
    },
    'sensein-royal-amber-perfume': {
      _id: 'sensein-4',
      name: 'SENSEIN® Royal Amber Hair & Body Perfume',
      slug: 'sensein-royal-amber-perfume',
      category: { name: 'Perfume', slug: 'perfume' },
      price: 1850,
      compareAtPrice: 2200,
      rating: 4.9,
      reviewsCount: 145,
      stock: 35,
      isFeatured: true,
      badge: 'LUXURY ESSENCE',
      mainImage: '/images/sensein-perfume.jpg',
      gallery: ['/images/sensein-perfume.jpg', '/images/hero1.jpg', '/images/hero2.jpg'],
      description: 'Artisanal alcohol-free luxury hair mist infused with royal amber, bourbon vanilla, and golden cedar. Leaves hair enveloped in a mesmerizing scent trail that lasts all day while imparting glass-like shine.',
      shortDescription: 'Long-lasting alcohol-free luxury hair mist with glass shine.',
    },
    'sensein-scalp-shield-serum': {
      _id: 'sensein-5',
      name: 'SENSEIN® Scalp Shield & Mineral Detox',
      slug: 'sensein-scalp-shield-serum',
      category: { name: 'Serum', slug: 'serum' },
      price: 1199,
      compareAtPrice: 1399,
      rating: 4.8,
      reviewsCount: 180,
      stock: 60,
      isFeatured: true,
      badge: 'BESTSELLER',
      mainImage: '/images/sensein-serum.jpg',
      gallery: ['/images/sensein-serum.jpg', '/images/hero2.jpg', '/images/hero1.jpg'],
      description: 'Hard water mineral shield and deep scalp clarity serum. Neutralizes chlorine and heavy minerals from tap water, eliminating itchiness, flakes, and root buildup.',
      shortDescription: 'Hard water protection & deep scalp clarity for healthy roots.',
    },
  }

  // Use API product if available, else match by slug from fallback catalog or generate default
  const product = response?.data || fallbackCatalog[slug] || {
    _id: `sensein-${slug || 'default'}`,
    name: (slug || 'Sensein Product').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    slug: slug || 'sensein-product',
    category: { name: 'Hair Care', slug: 'haircare' },
    price: 1299,
    compareAtPrice: 1599,
    rating: 4.9,
    reviewsCount: 120,
    stock: 50,
    isFeatured: true,
    badge: 'BESTSELLER',
    mainImage: '/images/sensein-shampoo.jpg',
    gallery: ['/images/sensein-shampoo.jpg', '/images/hero1.jpg'],
    description: '100% clean, salon-quality botanical formula engineered intentionally for real Indian hair textures. Deeply restores moisture, strengthens hair bonds, and protects scalp health.',
    shortDescription: 'Clean salon-quality formula for Indian hair.',
  }

  // Dynamic randomized recommendations: changes on every view, refresh, or manual shuffle click
  const relatedProducts = useMemo(() => {
    const list = (
      allProductsResponse?.data ||
      featuredResponse?.data ||
      Object.values(fallbackCatalog)
    ).filter(
      (p) => p.slug !== slug && (p._id || p.id) !== (product._id || product.id)
    )
    if (!list.length) return []
    // Randomize array order
    const shuffled = [...list].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
  }, [allProductsResponse, featuredResponse, slug, product._id, product.id, shuffleKey])

  // Available Sizes for the current product
  const availableSizes = useMemo(() => {
    const list = []
    if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
      product.sizes.forEach((s) => {
        if (s && typeof s === 'string' && s.trim()) list.push(s.trim())
      })
    }
    if (product?.size && typeof product.size === 'string' && product.size.trim()) {
      if (!list.includes(product.size.trim())) {
        list.unshift(product.size.trim())
      }
    }
    if (list.length > 0) {
      return [...new Set(list)]
    }
    return ['100ml', '250ml', '500ml']
  }, [product?.sizes, product?.size])

  // Interactive States
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(product?.size || '250ml')
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, show: false })
  const [activeTab, setActiveTab] = useState('overview')
  const [showStickyHeader, setShowStickyHeader] = useState(false)

  useEffect(() => {
    if (availableSizes && availableSizes.length > 0) {
      if (!selectedSize || !availableSizes.includes(selectedSize)) {
        setSelectedSize(availableSizes[0])
      }
    }
  }, [availableSizes, selectedSize])

  // Touch & Drag Swipe Handlers for Manual Photo Rotation
  const [touchStartX, setTouchStartX] = useState(null)
  const [touchEndX, setTouchEndX] = useState(null)
  const [dragStartX, setDragStartX] = useState(null)
  const [isMouseDown, setIsMouseDown] = useState(false)

  // Initial Reviews List with Real Customer Photos & Video Reviews
  const [reviewsList, setReviewsList] = useState([
    {
      id: 'rev-1',
      name: 'Dr. Sophia Laurent',
      date: '18 Aug 2026',
      rating: 5,
      title: 'Transformed my hair texture within 3 days!',
      text: 'Absorbs so quickly without any greasy residue. My hair ends look healthy, hydrated and super shiny. Absolutely in love with this botanical formulation.',
      verified: true,
      helpfulCount: 24,
      images: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&auto=format&fit=crop&q=80',
      ],
      video: 'https://assets.mixkit.co/videos/preview/mixkit-woman-touching-her-long-hair-41551-large.mp4',
    },
    {
      id: 'rev-2',
      name: 'Ananya Patel',
      date: '12 Aug 2026',
      rating: 5,
      title: 'Best luxury botanical formulation for Indian hair!',
      text: 'Worth every rupee. The fragrance is natural and elegant. Highly recommended for daily scalp and hair care routines.',
      verified: true,
      helpfulCount: 19,
      images: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80',
      ],
      video: null,
    },
    {
      id: 'rev-3',
      name: 'Meera Sharma',
      date: '05 Aug 2026',
      rating: 5,
      title: 'Salon-grade results at home. Watch my live hair transformation video!',
      text: 'Noticeably reduced my split ends. I use it right after shampooing on damp hair and the gloss lasts for 48 hours straight.',
      verified: true,
      helpfulCount: 31,
      images: [
        'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&auto=format&fit=crop&q=80',
      ],
      video: 'https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-applying-facial-cream-42777-large.mp4',
    },
    {
      id: 'rev-4',
      name: 'Pooja Verma',
      date: '28 Jul 2026',
      rating: 5,
      title: 'Completely replaced my expensive imported serum!',
      text: 'My salon stylist recommended SENSEIN and I am blown away by how soft my hair feels after just one application. Must buy!',
      verified: true,
      helpfulCount: 15,
      images: [
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80',
      ],
      video: null,
    },
    {
      id: 'rev-5',
      name: 'Kavita Mehta',
      date: '20 Jul 2026',
      rating: 4,
      title: 'Super lightweight and smells like fresh rose botanical garden!',
      text: 'Non-sticky formula and gives exceptional natural shine. Very gentle on sensitive scalp.',
      verified: true,
      helpfulCount: 8,
      images: [],
      video: null,
    },
    {
      id: 'rev-6',
      name: 'Rahul Dave',
      date: '14 Jul 2026',
      rating: 5,
      title: 'Flawless styling hold without any stickiness or crunch',
      text: 'The natural matte finish is unmatched. Keeps flyaways under control through humid weather.',
      verified: true,
      helpfulCount: 12,
      images: [
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80',
      ],
      video: null,
    },
  ])

  // Dynamic Rating and Star Breakdown calculation based strictly on actual reviewsList
  const { calculatedRating, ratingBreakdown, totalReviewsCount } = useMemo(() => {
    const total = reviewsList.length
    if (total === 0) {
      return {
        calculatedRating: Number(product.rating || 5.0).toFixed(1),
        ratingBreakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars, percent: 0, count: 0 })),
        totalReviewsCount: 0,
      }
    }
    const sum = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0)
    const avg = (sum / total).toFixed(1)
    const breakdown = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviewsList.filter((r) => Math.round(Number(r.rating) || 5) === stars).length
      const percent = Math.round((count / total) * 100)
      return { stars, percent, count }
    })
    return {
      calculatedRating: avg,
      ratingBreakdown: breakdown,
      totalReviewsCount: total,
    }
  }, [reviewsList, product.rating])

  // Review Form & UGC Media States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewFilter, setReviewFilter] = useState('all') // 'all', 'media', '5star', '4star'
  const [currentReviewPage, setCurrentReviewPage] = useState(1)
  const [selectedReviewMedia, setSelectedReviewMedia] = useState(null) // { type: 'video'|'image', url: string, title?: string }
  const [helpfulReviews, setHelpfulReviews] = useState({})

  const handleHelpfulClick = (id) => {
    setHelpfulReviews((prev) => {
      const isCurrentlyHelpful = !!prev[id]
      const updated = { ...prev, [id]: !isCurrentlyHelpful }
      setReviewsList((rList) =>
        rList.map((r) =>
          r.id === id
            ? { ...r, helpfulCount: Math.max(0, (r.helpfulCount || 0) + (isCurrentlyHelpful ? -1 : 1)) }
            : r
        )
      )
      if (!isCurrentlyHelpful) {
        showToast('Marked review as helpful!')
      }
      return updated
    })
  }

  const [newReviewForm, setNewReviewForm] = useState({
    name: '',
    email: '',
    rating: 5,
    title: '',
    text: '',
    images: [],
    video: '',
  })

  const handleReviewMediaUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newImages = []
    let newVideo = newReviewForm.video

    files.forEach((file) => {
      const url = URL.createObjectURL(file)
      if (file.type.startsWith('video')) {
        newVideo = url
      } else {
        newImages.push(url)
      }
    })

    setNewReviewForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
      video: newVideo,
    }))
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!newReviewForm.name.trim() || !newReviewForm.text.trim()) {
      showToast('Please fill in your name and review details.')
      return
    }

    const createdReview = {
      id: `rev-${Date.now()}`,
      name: newReviewForm.name.trim(),
      date: 'Just now',
      rating: Number(newReviewForm.rating) || 5,
      title: newReviewForm.title.trim() || 'Verified Customer Experience',
      text: newReviewForm.text.trim(),
      verified: true,
      helpfulCount: 0,
      images: newReviewForm.images,
      video: newReviewForm.video || null,
    }

    setReviewsList([createdReview, ...reviewsList])
    setIsReviewModalOpen(false)
    setNewReviewForm({
      name: '',
      email: '',
      rating: 5,
      title: '',
      text: '',
      images: [],
      video: '',
    })
    showToast('Your verified review with photos/videos was published successfully!')
  }

  // Toast / Copy Feedback
  const [toastMsg, setToastMsg] = useState('')
  const [copiedCoupon, setCopiedCoupon] = useState('')

  // Pincode Checker State
  const [pincodeInput, setPincodeInput] = useState('')
  const [pincodeResult, setPincodeResult] = useState(null)
  const [triggerPincodeCheck, { isLoading: isPincodeLoading }] = useLazyCheckPincodeQuery()

  // Expert Consultation Modal
  const [showExpertModal, setShowExpertModal] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setSelectedImage(0)
    setPincodeResult(null)
    if (availableSizes && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0])
    }
    if (product) {
      trackProductView(product)
    }
  }, [slug, product, availableSizes])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  if (isLoading) {
    return <SenseinLoader text="EXPERIENCE BOTANICAL LUXURY" />
  }

  if (!product) {
    return (
      <div className="bg-ivory min-h-screen py-20 flex justify-center items-center">
        <div className="container-page max-w-md text-center bg-white p-10 rounded-3xl border border-charcoal/10 shadow-lg space-y-4">
          <Sparkles className="h-12 w-12 text-rosegold-dark mx-auto" />
          <h2 className="font-display text-2xl font-semibold text-charcoal">Product Not Found</h2>
          <p className="text-xs text-charcoal-light">
            The requested product could not be located in our luxury botanical catalog.
          </p>
          <button onClick={() => navigate('/shop')} className="btn-primary w-full py-3 text-xs uppercase font-bold tracking-wider">
            Return to Shop Catalog
          </button>
        </div>
      </div>
    )
  }

  // Dynamic Volume Pricing Calculation
  const sizeMultiplier = selectedSize === '50ml' ? 0.65 : selectedSize === '250ml' ? 1.85 : 1.0
  const currentPrice = Math.round(product.price * sizeMultiplier)
  const currentComparePrice = product.compareAtPrice ? Math.round(product.compareAtPrice * sizeMultiplier) : Math.round(currentPrice * 1.25)
  const discountPercent = Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)

  // Gallery fallback
  const fallbackGallery = [
    product.mainImage,
    'https://images.unsplash.com/photo-1608248597260-65219e81070f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
  ]
  const rawGallery = [product.mainImage, ...(product.gallery || [])]
  const galleryImages = rawGallery.length >= 2 ? rawGallery : fallbackGallery

  const handleAddToCart = (e) => {
    const itemToCart = {
      ...product,
      price: currentPrice,
      selectedSize,
      name: `${product.name} (${selectedSize})`,
    }
    triggerFlyToCart(product?.mainImage || galleryImages[0], e)
    dispatch(addToCart({ product: itemToCart, quantity }))
    trackAddToCartEvent(itemToCart, quantity)
  }

  const handleBuyNow = () => {
    const itemToCart = {
      ...product,
      price: currentPrice,
      selectedSize,
      name: `${product.name} (${selectedSize})`,
    }
    dispatch(addToCart({ product: itemToCart, quantity }))
    navigate('/checkout')
  }

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y, show: true })
  }

  const handleMouseLeave = () => {
    setZoomPos({ x: 50, y: 50, show: false })
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % galleryImages.length)
  }

  // Touch & Drag Swipe Handlers for Manual Photo Rotation

  const handleTouchStart = (e) => {
    setTouchEndX(null)
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return
    const diff = touchStartX - touchEndX
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        nextImage()
      } else {
        prevImage()
      }
    }
    setTouchStartX(null)
    setTouchEndX(null)
  }

  const handleMouseDown = (e) => {
    setDragStartX(e.clientX)
    setIsMouseDown(true)
  }

  const handleMouseUp = (e) => {
    if (!isMouseDown || dragStartX === null) return
    const diff = dragStartX - e.clientX
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        nextImage()
      } else {
        prevImage()
      }
    }
    setIsMouseDown(false)
    setDragStartX(null)
  }

  const handlePincodeCheck = async (e) => {
    e.preventDefault()
    if (!pincodeInput || pincodeInput.length !== 6) return
    try {
      const res = await triggerPincodeCheck(pincodeInput).unwrap()
      if (res.success && res.data) {
        setPincodeResult(res.data)
      }
    } catch {
      setPincodeResult({ serviceable: false })
    }
  }

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCoupon(code)
    showToast(`Coupon code ${code} copied to clipboard!`)
    setTimeout(() => setCopiedCoupon(''), 3000)
  }

  return (
    <div className="bg-ivory min-h-screen pt-1 sm:pt-2.5 pb-28 md:pb-20 relative">
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
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
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

      <div className="container-page max-w-7xl space-y-3 sm:space-y-4">
        {/* Minimalist Back Arrow Above Image (Tight, Zero Gap Spacing) */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-stone-700 hover:text-[#5A3859] active:text-[#5A3859] transition-all py-1 px-1.5 rounded-md hover:bg-stone-100 cursor-pointer group"
            title="Go Back"
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-semibold text-stone-600 group-hover:text-[#5A3859]">Back</span>
          </button>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Product Image Gallery */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Thumbnail Strip */}
            <div className="sm:col-span-2 order-2 sm:order-1 flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[480px] py-0.5 scrollbar-none">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`h-16 w-16 sm:h-20 sm:w-full rounded-none overflow-hidden border-2 transition-all shrink-0 bg-white shadow-xs relative ${
                    selectedImage === idx
                      ? 'border-[#5A3859] ring-2 ring-[#5A3859]/20'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = '/images/product1.jpg'
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Main Stage Image */}
            <div className="sm:col-span-10 order-1 sm:order-2 relative group rounded-none overflow-hidden bg-white border border-stone-200 shadow-xs h-full flex flex-col justify-center">
              {/* Badges (Delicate Micro-Pill Badges) */}
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                <span className="bg-[#5A3859] text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" />
                  {discountPercent}% OFF
                </span>
                <span className="bg-stone-900/90 backdrop-blur-xs text-[#D4AF37] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                  ★ Bestseller
                </span>
              </div>

              {/* Share Button (Delicate Micro Circle) */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  showToast('Product link copied to clipboard!')
                }}
                className="absolute top-2.5 right-2.5 z-10 h-7 w-7 rounded-full bg-white/85 text-stone-600 hover:text-stone-950 hover:bg-white border border-stone-200/80 backdrop-blur-md flex items-center justify-center shadow-xs hover:shadow-sm transition-all active:scale-90 cursor-pointer"
                title="Share product link"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>

              <div
                className="relative aspect-square overflow-hidden bg-stone-50 cursor-grab active:cursor-grabbing select-none touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                  setIsMouseDown(false)
                  setDragStartX(null)
                }}
              >
                <img
                  src={galleryImages[selectedImage] || product.mainImage}
                  alt={product.name}
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = '/images/product1.jpg'
                  }}
                  className="w-full h-full object-cover select-none pointer-events-none transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Title, Size Selector, Offers & Actions (Spanned top to bottom of photo) */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-4 lg:space-y-0 lg:py-1">
            {/* 1. Header Info (Category, Title, Rating) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#5A3859] font-bold bg-[#5A3859]/10 px-2.5 py-0.5 rounded-full">
                  {product.category?.name || 'SENSEIN Professional'}
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="flex text-amber-400 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-bold text-stone-800 text-xs font-mono">{calculatedRating}</span>
                  <span className="text-[11px] text-stone-400 font-medium">({totalReviewsCount})</span>
                </div>
              </div>

              <h1 className="font-sans text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-stone-900 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* 2. Direct Elegant Price Row */}
            <div className="flex items-baseline gap-3 pt-2 border-t border-stone-100">
              <span className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {currentComparePrice > currentPrice && (
                <>
                  <span className="text-sm sm:text-base line-through text-stone-400 font-mono">
                    ₹{currentComparePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 font-mono">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
              <span className="text-[11px] text-stone-400 ml-auto hidden sm:inline">Inclusive of all taxes</span>
            </div>

            {/* 3. Size / Volume Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Select Size / Volume
                </span>
                <span className="text-xs font-bold text-[#5A3859] bg-[#5A3859]/10 px-2.5 py-0.5 rounded-md font-mono">
                  {selectedSize}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((sz) => {
                  const isSelected = selectedSize === sz
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer border ${
                        isSelected
                          ? 'bg-[#5A3859] text-white border-[#5A3859] shadow-sm ring-2 ring-[#5A3859]/20'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-[#5A3859]/50 hover:bg-white'
                      }`}
                    >
                      <span>{sz}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 4. Unified Purchase Actions (50/50 Equal Full Width - Never Cut Off) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Quantity
                </span>
                <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 p-0.5 h-8">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-full flex items-center justify-center hover:bg-white rounded-lg text-stone-600 transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-xs text-stone-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="w-7 h-full flex items-center justify-center hover:bg-white rounded-lg text-stone-600 transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full bg-white hover:bg-stone-50 text-[#5A3859] border-2 border-[#5A3859] h-10 px-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98 whitespace-nowrap"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span>Add to Bag</span>
                </button>

                {/* Buy Now Button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full bg-[#5A3859] hover:bg-[#4a2e49] text-white h-10 px-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98 whitespace-nowrap"
                >
                  <Zap className="h-4 w-4 shrink-0" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>

            {/* 5. Minimal Sleek Single-Line Trust Bar (Anchored to bottom edge of photo) */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>100% Authentic Formulation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>30 Days Free Return</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-[#5A3859]" />
                <span>Cruelty-Free Clean Lab</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Specifications & Customer Reviews Section (Compact) */}
        <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-stone-200 shadow-xs space-y-5">
          {/* Tab Headers (100% Visible Segmented Control on Mobile & Desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-stone-100 rounded-xl border border-stone-200/80">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'ingredients', label: 'Ingredients' },
              { key: 'ritual', label: 'How to Use' },
              { key: 'reviews', label: `Reviews (${totalReviewsCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-2 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center cursor-pointer select-none ${
                  activeTab === tab.key
                    ? 'bg-white text-[#5A3859] shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50 border border-transparent'
                }`}
              >
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="prose max-w-none text-xs sm:text-sm text-stone-600 leading-relaxed space-y-2">
                <p className="text-sm sm:text-base text-stone-900 font-bold uppercase tracking-tight">
                  {product.description}
                </p>
                <p>
                  Crafted in our specialized botanical lab, SENSEIN Professional formulations combine bio-active peptides, cold-pressed oils, and floral extracts to restore structural integrity at a cellular level.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4 animate-in fade-in text-xs text-stone-600">
              <h4 className="font-sans text-base font-bold uppercase tracking-tight text-stone-900">Bio-Active Botanical Complex</h4>
              <p className="leading-relaxed">
                Clean beauty certified. Free from parabens, sulfates, phthalates, mineral oil, and synthetic dyes.
              </p>
              <div className="bg-[#FAF7F9] p-5 rounded-none border border-stone-200 font-mono text-[11px] text-stone-800 leading-relaxed">
                Rosa Damascena Flower Water, French Rose Extract, Squalane, Hyaluronic Acid, Argania Spinosa Kernel Oil, Camellia Sinensis Leaf Extract, Niacinamide, Tocopherol (Vitamin E), Botanical Collagen Peptides.
              </div>
            </div>
          )}

          {activeTab === 'ritual' && (
            <div className="space-y-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:space-y-0 animate-in fade-in">
              {[
                { step: '1', title: 'Cleanse & Prep', desc: 'Apply to freshly cleansed hair or scalp. Towel dry gently until damp.' },
                { step: '2', title: 'Massage & Infuse', desc: 'Dispense 3-4 drops and warm between palms. Press gently into lengths.' },
                { step: '3', title: 'Seal & Style', desc: 'Allow 60 seconds to absorb completely. Style as desired for lasting shine.' },
              ].map((item) => (
                <div key={item.step} className="p-3 bg-[#FAF7F9] rounded-xl border border-stone-200/80 flex items-start gap-3">
                  <span className="h-6 w-6 rounded-md bg-[#5A3859] text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-stone-900 uppercase">{item.title}</h4>
                    <p className="text-[11px] text-stone-500 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-5 animate-in fade-in font-sans">
              {/* Rating Summary Card & Action (Compact & Space-Efficient) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-[#FAF9F6] p-3.5 sm:p-5 rounded-xl border border-stone-200">
                <div className="md:col-span-4 flex md:flex-col items-center justify-between md:justify-center border-b md:border-b-0 md:border-r border-stone-200 pb-3 md:pb-0 md:pr-4 gap-3">
                  <div className="flex items-center md:flex-col gap-3 md:gap-1 text-left md:text-center">
                    <span className="text-3xl sm:text-4xl font-black text-stone-900 font-mono">{calculatedRating}</span>
                    <div>
                      <div className="flex items-center text-amber-500 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-500 block mt-0.5 font-medium">
                        {totalReviewsCount} Verified Reviews
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="bg-[#5A3859] hover:bg-[#4B2F4A] active:scale-95 text-white py-2 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer select-none"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Write Review</span>
                  </button>
                </div>

                <div className="md:col-span-8 space-y-1.5 text-xs flex flex-col justify-center">
                  {ratingBreakdown.map((row) => (
                    <div key={row.stars} className="flex items-center gap-2.5">
                      <span className="w-9 font-bold text-stone-900 flex items-center gap-1 text-[11px]">
                        {row.stars} <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                      </span>
                      <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-[11px] font-bold text-stone-500">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Photos & Videos Showcase Gallery (UGC Reel Bar) */}
              <div className="bg-white p-5 rounded-none border border-stone-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-[#5A3859]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      Customer Photos & Video Reviews (12)
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#5A3859] font-bold">100% Real Customer UGC</span>
                </div>

                {/* UGC Media Strip */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {/* Sample Video UGC Card */}
                  <div
                    onClick={() =>
                      setSelectedReviewMedia({
                        type: 'video',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-touching-her-long-hair-41551-large.mp4',
                        title: 'Live Hair Gloss Results by Dr. Sophia Laurent',
                      })
                    }
                    className="relative h-28 w-28 rounded-none overflow-hidden border-2 border-[#5A3859] cursor-pointer group shrink-0 bg-stone-900 shadow-sm"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80"
                      alt="Customer video review"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="h-9 w-9 rounded-full bg-[#5A3859] text-white flex items-center justify-center shadow-lg">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-none flex items-center gap-1">
                      <Film className="h-2.5 w-2.5" /> Video
                    </span>
                  </div>

                  {/* Sample Video UGC Card 2 */}
                  <div
                    onClick={() =>
                      setSelectedReviewMedia({
                        type: 'video',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-applying-facial-cream-42777-large.mp4',
                        title: 'Hydration Routine by Meera Sharma',
                      })
                    }
                    className="relative h-28 w-28 rounded-none overflow-hidden border-2 border-[#5A3859] cursor-pointer group shrink-0 bg-stone-900 shadow-sm"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&auto=format&fit=crop&q=80"
                      alt="Customer video review"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="h-9 w-9 rounded-full bg-[#5A3859] text-white flex items-center justify-center shadow-lg">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-none flex items-center gap-1">
                      <Film className="h-2.5 w-2.5" /> Video
                    </span>
                  </div>

                  {/* Customer Photo Thumbnails */}
                  {[
                    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&auto=format&fit=crop&q=80',
                  ].map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() =>
                        setSelectedReviewMedia({
                          type: 'image',
                          url: imgUrl,
                          title: 'Customer Product Result',
                        })
                      }
                      className="relative h-28 w-28 rounded-none overflow-hidden border border-stone-200 cursor-pointer group shrink-0 bg-stone-100 shadow-sm"
                    >
                      <img
                        src={imgUrl}
                        alt="Customer UGC photo"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-none flex items-center gap-1">
                        <ImageIcon className="h-2.5 w-2.5" /> Photo
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews List with 3 Items per page + Numbered Pagination (1, 2, 3...) */}
              {(() => {
                const REVIEWS_PER_PAGE = 3
                const totalPages = Math.ceil(reviewsList.length / REVIEWS_PER_PAGE)
                const startIndex = (currentReviewPage - 1) * REVIEWS_PER_PAGE
                const displayed = reviewsList.slice(startIndex, startIndex + REVIEWS_PER_PAGE)

                return (
                  <div className="space-y-4">
                    {displayed.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 sm:p-5 bg-white rounded-xl border border-stone-200/90 space-y-3 shadow-xs hover:border-[#5A3859]/30 transition-all"
                      >
                        {/* Review Top Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-full shrink-0">
                              <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                              <span className="text-xs font-extrabold font-mono text-emerald-800">{rev.rating}.0</span>
                            </div>
                            <h5 className="font-bold text-sm text-stone-900 leading-snug">{rev.title}</h5>
                          </div>
                          <span className="text-[11px] text-stone-400 font-mono">{rev.date}</span>
                        </div>

                        {/* Review Text */}
                        <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed">{rev.text}</p>

                        {/* Customer Attached Photos & Videos */}
                        {((rev.images && rev.images.length > 0) || rev.video) && (
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {/* Attached Video */}
                            {rev.video && (
                              <div
                                onClick={() =>
                                  setSelectedReviewMedia({
                                    type: 'video',
                                    url: rev.video,
                                    title: `Customer Video Review by ${rev.name}`,
                                  })
                                }
                                className="relative h-16 w-16 rounded-lg overflow-hidden border-2 border-[#5A3859] cursor-pointer group bg-black shrink-0"
                              >
                                <video src={rev.video} className="h-full w-full object-cover" muted />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                  <Play className="h-4 w-4 text-white fill-white" />
                                </div>
                                <span className="absolute bottom-1 right-1 bg-[#5A3859] text-white text-[7px] font-bold px-1 rounded">
                                  VIDEO
                                </span>
                              </div>
                            )}

                            {/* Attached Photos */}
                            {rev.images?.map((imgUrl, i) => (
                              <img
                                key={i}
                                src={imgUrl}
                                alt="Review attachment"
                                onClick={() =>
                                  setSelectedReviewMedia({
                                    type: 'image',
                                    url: imgUrl,
                                    title: `Photo by ${rev.name}`,
                                  })
                                }
                                className="h-16 w-16 rounded-lg object-cover border border-stone-200 cursor-pointer hover:opacity-90 hover:scale-105 transition-all bg-stone-50"
                              />
                            ))}
                          </div>
                        )}

                        {/* Bottom Details & Helpful Counter */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-stone-100 pt-2.5 text-xs">
                          <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{rev.name}</span>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500 font-normal">Verified Botanical Purchase</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleHelpfulClick(rev.id)}
                            className={`self-start sm:self-auto text-[11px] font-semibold flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-lg border cursor-pointer select-none ${
                              helpfulReviews[rev.id]
                                ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-xs'
                                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80 hover:text-stone-900'
                            }`}
                          >
                            <ThumbsUp className={`h-3.5 w-3.5 ${helpfulReviews[rev.id] ? 'fill-blue-600 text-blue-600' : ''}`} />
                            <span>Helpful ({rev.helpfulCount || 0})</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Numbered Pagination (1, 2, 3...) */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-stone-100">
                        {/* Prev Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentReviewPage((p) => Math.max(1, p - 1))
                          }}
                          disabled={currentReviewPage === 1}
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Prev</span>
                        </button>

                        {/* Numbered Page Buttons */}
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => {
                              setCurrentReviewPage(pageNum)
                            }}
                            className={`h-8 w-8 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer border ${
                              currentReviewPage === pageNum
                                ? 'bg-[#5A3859] text-white border-[#5A3859] shadow-xs scale-105'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        {/* Next Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentReviewPage((p) => Math.min(totalPages, p + 1))
                          }}
                          disabled={currentReviewPage === totalPages}
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Short & Fast Write a Review Modal Form */}
        <AnimatePresence>
          {isReviewModalOpen && (
            <div
              className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsReviewModalOpen(false)
              }}
            >
              <div className="bg-white max-w-md w-full shadow-2xl relative flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 border border-stone-200 rounded-2xl mx-auto">
                {/* Header with Close button */}
                <div className="p-4 sm:p-5 pb-3 border-b border-stone-100 flex items-start justify-between gap-3 bg-white">
                  <div className="space-y-1 pr-2 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#5A3859] uppercase tracking-wider">
                      <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                      <span>Sensein Verified Review</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-snug line-clamp-2">
                      Review for {product.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="text-stone-400 hover:text-stone-800 text-sm font-bold p-1 rounded-full hover:bg-stone-100 transition-all cursor-pointer shrink-0"
                    aria-label="Close review modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleReviewSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs font-sans">
                  {/* 1. Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-900">
                      Your Rating *
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#FAF9F6] rounded-xl border border-stone-200/80">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() =>
                              setNewReviewForm((p) => ({ ...p, rating: starVal }))
                            }
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                starVal <= newReviewForm.rating
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="font-bold text-[11px] text-[#5A3859] bg-[#5A3859]/10 px-2 py-0.5 rounded-md">
                        {newReviewForm.rating === 5
                          ? '5★ - Excellent'
                          : newReviewForm.rating === 4
                          ? '4★ - Very Good'
                          : newReviewForm.rating === 3
                          ? '3★ - Average'
                          : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Customer Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-900">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newReviewForm.name}
                      onChange={(e) =>
                        setNewReviewForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Enter your name (e.g. Priya Shah)"
                      className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859]/20 outline-none transition-all"
                    />
                  </div>

                  {/* 3. Review Comments */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-900">
                      Your Review *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={newReviewForm.text}
                      onChange={(e) =>
                        setNewReviewForm((p) => ({ ...p, text: e.target.value }))
                      }
                      placeholder="Write your honest review... (How did it help your hair/skin? Texture & fragrance)"
                      className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859]/20 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* 4. Compact Photo / Video Upload */}
                  <div className="space-y-2 pt-0.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-dashed border-stone-300 rounded-lg text-stone-700 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all w-full justify-center">
                      <Camera className="h-4 w-4 text-[#5A3859]" />
                      <span>+ Add Photo / Video (Optional)</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleReviewMediaUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Previews if uploaded */}
                    {(newReviewForm.images.length > 0 || newReviewForm.video) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {newReviewForm.images.map((img, idx) => (
                          <div key={idx} className="relative h-12 w-12 rounded-md overflow-hidden border border-stone-300 bg-white">
                            <img src={img} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setNewReviewForm((p) => ({
                                  ...p,
                                  images: p.images.filter((_, i) => i !== idx),
                                }))
                              }
                              className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] shadow"
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {newReviewForm.video && (
                          <div className="relative h-12 w-12 rounded-md overflow-hidden bg-black border-2 border-[#5A3859] flex items-center justify-center">
                            <Film className="h-4 w-4 text-white" />
                            <button
                              type="button"
                              onClick={() => setNewReviewForm((p) => ({ ...p, video: '' }))}
                              className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] shadow"
                              title="Remove video"
                            >
                              ✕
                            </button>
                            <span className="absolute bottom-0 inset-x-0 bg-[#5A3859] text-white text-[7px] font-bold text-center">
                              VIDEO
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions (50-50 Equal Balanced Layout) */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="h-10 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center cursor-pointer select-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-10 px-4 bg-[#5A3859] hover:bg-[#4B2F4A] active:scale-95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none"
                    >
                      <span>Submit</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Media Lightbox & Video Player Modal */}
        <AnimatePresence>
          {selectedReviewMedia && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setSelectedReviewMedia(null)}
            >
              <div
                className="bg-stone-900 border border-stone-700 max-w-2xl w-full p-4 rounded-none space-y-3 relative text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    {selectedReviewMedia.title || 'Customer Review Media'}
                  </h4>
                  <button
                    onClick={() => setSelectedReviewMedia(null)}
                    className="p-1 text-stone-400 hover:text-white text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                  {selectedReviewMedia.type === 'video' ? (
                    <video
                      src={selectedReviewMedia.url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={selectedReviewMedia.url}
                      alt="Customer review"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Related Products Grid (Dynamic Rotating Recommendations) */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-stone-200/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-stone-200 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#5A3859]">
                  Complete Your Botanical Ritual
                </span>
                <h3 className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-tight text-stone-900">
                  More Recommended Formulations
                </h3>
              </div>

              <Link
                to="/shop"
                className="text-xs font-bold text-stone-700 hover:text-[#5A3859] flex items-center gap-1 uppercase tracking-wider transition-colors self-start sm:self-auto"
              >
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              {relatedProducts.map((relProd) => (
                <div
                  key={relProd._id || relProd.id}
                  className="bg-white rounded-xl p-2.5 sm:p-3 border border-stone-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-[#5A3859]/30 transition-all duration-300 group flex flex-col justify-between overflow-hidden"
                >
                  <div className="space-y-2">
                    <Link
                      to={`/product/${relProd.slug}`}
                      className="block aspect-square rounded-lg overflow-hidden bg-[#FAF7F9] relative cursor-pointer"
                    >
                      <img
                        src={relProd.mainImage}
                        alt={relProd.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 bg-white/95 text-[#5A3859] text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#5A3859]/15 shadow-xs">
                        {relProd.category?.name || 'Care'}
                      </span>
                    </Link>

                    <div className="space-y-1">
                      <Link
                        to={`/product/${relProd.slug}`}
                        className="block font-bold text-xs sm:text-[13px] text-stone-900 hover:text-[#5A3859] transition-colors line-clamp-1 leading-snug"
                      >
                        {relProd.name}
                      </Link>
                      <div className="flex items-baseline gap-1.5 font-bold">
                        <span className="text-xs sm:text-[13px] text-stone-900 font-extrabold font-mono">
                          ₹{relProd.price.toLocaleString('en-IN')}
                        </span>
                        {relProd.compareAtPrice > relProd.price && (
                          <span className="text-[10px] text-stone-400 line-through font-normal font-mono">
                            ₹{relProd.compareAtPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      dispatch(addToCart({ product: relProd, quantity: 1 }))
                      showToast(`Added ${relProd.name} to Bag!`)
                    }}
                    className="mt-2.5 w-full bg-[#5A3859] hover:bg-[#4b2f4a] active:scale-95 text-white py-2 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none h-8"
                  >
                    <ShoppingBag className="h-3 w-3" />
                    <span>Add to Bag</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bar (Optimized for 360px-430px Smartphone Viewports) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2.5 flex items-center justify-between sm:hidden shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[9px] text-charcoal-light uppercase font-bold tracking-wider">Total ({selectedSize})</span>
          <span className="font-display text-base font-bold text-charcoal font-mono leading-tight">
            ₹{(currentPrice * quantity).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddToCart}
            className="px-3.5 py-2.5 rounded-xl text-[11px] uppercase font-bold tracking-wider bg-amber-500 hover:bg-amber-600 text-charcoal shadow-sm transition-all"
          >
            Add to Bag
          </button>
          <button
            onClick={handleBuyNow}
            className="px-3.5 py-2.5 rounded-xl text-[11px] uppercase font-bold tracking-wider bg-rosegold-dark hover:bg-charcoal text-white shadow-md transition-all"
          >
            Buy Now
          </button>
        </div>
      </div>


      {/* Expert Consultation Modal Overlay */}
      {showExpertModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowExpertModal(false)}
              className="absolute top-4 right-4 text-charcoal-light hover:text-charcoal text-xs font-bold"
            >
              ✕
            </button>
            <div className="h-14 w-14 rounded-full bg-rosegold/20 text-rosegold-dark flex items-center justify-center mx-auto">
              <Headphones className="h-7 w-7" />
            </div>
            <h3 className="font-display text-xl font-bold text-charcoal">
              Free Botanical Hair & Scalp Consultation
            </h3>
            <p className="text-xs text-charcoal-light">
              Connect with our certified trichologists for personalized routine advice tailored to your scalp & hair goals.
            </p>
            <div className="bg-ivory p-4 rounded-2xl border border-charcoal/10 text-xs font-bold text-charcoal space-y-2">
              <div>📞 Toll-Free Helpline: 1800-891-0710</div>
              <div>✉️ Expert Email: info@sensein.in</div>
              <div className="text-[10px] text-emerald-700">Available Mon - Sat (9 AM - 7 PM)</div>
            </div>
            <button
              onClick={() => {
                setShowExpertModal(false)
                showToast('Consultation request registered! An expert will call you shortly.')
              }}
              className="btn-primary w-full py-3 text-xs uppercase font-bold tracking-wider"
            >
              Request Call Back
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isZoomModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col justify-between p-4 md:p-8"
            onClick={() => setIsZoomModalOpen(false)}
          >
            <div className="flex items-center justify-between text-white z-10">
              <div className="text-xs font-mono">
                Image {selectedImage + 1} of {galleryImages.length}
              </div>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="relative flex-1 flex items-center justify-center my-4 overflow-hidden select-none cursor-grab active:cursor-grabbing touch-pan-y"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              <img
                src={galleryImages[selectedImage] || product.mainImage}
                alt={product.name}
                draggable={false}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl pointer-events-none"
              />

              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-charcoal transition cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-charcoal transition cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            <div
              className="flex justify-center gap-3 overflow-x-auto py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === idx
                      ? 'border-rosegold ring-2 ring-rosegold-light scale-105'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Add to Cart Bar (Sleek, Compact & Responsive) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 py-2.5 px-3.5 sm:py-3 sm:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src={product.mainImage}
            alt=""
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-md object-cover bg-[#FAF7F9] border border-stone-200/80 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate leading-tight">{product.name}</h4>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-xs sm:text-sm font-extrabold text-[#5A3859]">₹{currentPrice.toLocaleString('en-IN')}</span>
              {product.compareAtPrice > currentPrice && (
                <span className="text-[10px] text-stone-400 line-through">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <button
            onClick={handleAddToCart}
            className="bg-[#5A3859] hover:bg-[#4b2f4a] active:scale-95 text-white text-xs uppercase font-bold px-4 sm:px-6 py-2.5 rounded-none shadow-md transition-all flex items-center gap-1.5 tracking-wider cursor-pointer select-none"
          >
            <ShoppingBag className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  )
}
