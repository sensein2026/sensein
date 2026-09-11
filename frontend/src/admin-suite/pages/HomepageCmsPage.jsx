import { useState, useEffect } from 'react'
import {
  useGetHomepageContentQuery,
  useUpdateHomepageContentMutation,
  useResetHomepageContentMutation,
  useGetAuditLogsQuery,
  useGetProductsQuery,
} from '@/features/adminApi'
import MediaUploadPicker from '@/components/MediaUploadPicker'
import ConfirmModal from '@/components/ConfirmModal'
import WavyTickerBar from '@/components/WavyTickerBar'
import SenseinLogo from '@/components/SenseinLogo'
import { useToast } from '@/context/ToastContext'
import {
  LayoutTemplate,
  Megaphone,
  Sliders,
  Sparkles,
  Target,
  Video,
  SplitSquareVertical,
  ShieldCheck,
  Instagram,
  Star,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoveUp,
  MoveDown,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  History,
  Download,
  Search,
  ArrowRight,
  Eye,
  X,
  Package,
} from 'lucide-react'

const DEFAULT_HOMEPAGE_CONFIG = {
  visibility: {
    announcementBar: true,
    heroSlider: true,
    missionQuote: true,
    bestSellers: true,
    shopByConcern: true,
    realResults: true,
    beforeAfter: true,
    brandValues: true,
    instagramFeed: true,
    customerReviews: true,
  },
  announcementBar: {
    enabled: true,
    messages: [
      '✨ COMPLIMENTARY LUXURY TRAVEL SERUM ON ORDERS ABOVE ₹1,999',
      '🌿 100% CLEAN FORMULATION • DERMATOLOGICALLY TESTED • FREE PAN-INDIA SHIPPING',
      '⚡ USE CODE: LUXE10 FOR EXTRA 10% OFF YOUR FIRST ORDER',
    ],
  },
  heroSlider: {
    slides: [
      {
        id: 'slide-1',
        type: 'video',
        videoSrc: '/hero-video.mp4',
        poster: '/images/hero1.jpg',
        image: '/images/hero1.jpg',
        showLogo: true,
        logoImage: '/images/sensein-logo-white.png',
        logoSubtitle: 'PROFESSIONAL MEN',
        title: 'SALON LUXURY RE-ENGINEERED',
        description:
          'High-performance botanical hair science crafted with clean ingredients for Indian hair textures.',
        showBtn: true,
        btnText: 'EXPLORE COLLECTION',
        btnLink: '/shop',
        btnBgColor: '#5A3859',
        btnTextColor: '#ffffff',
      },
      {
        id: 'slide-2',
        type: 'image',
        videoSrc: '',
        poster: '/images/hero1.jpg',
        image: '/images/hero1.jpg',
        showLogo: true,
        logoImage: '/images/sensein-logo-white.png',
        logoSubtitle: 'PROFESSIONAL MEN',
        title: 'INTENSE BOND RESTORATION',
        description:
          'Transform dry, chemically-treated and frizz-prone hair into mirror-like luminous gloss.',
        showBtn: true,
        btnText: 'EXPLORE COLLECTION',
        btnLink: '/shop?category=haircare',
        btnBgColor: '#5A3859',
        btnTextColor: '#ffffff',
      },
    ],
  },
  missionQuote: {
    badgeText: 'CLEAN BOTANICAL LUXURY',
    mainHeadingPrefix: 'Formulated without compromise for',
    highlightText: 'unmatched hair transformation',
    mainHeadingSuffix: 'powered by active botanicals.',
  },
  shopByConcern: {
    tag: 'TARGETED FORMULATION',
    title: 'Shop by Hair Concern',
    description: 'Custom-tailored solutions for all hair types & textures.',
    concerns: [
      {
        id: 'concern-1',
        title: 'Frizz Control & Humidity Defense',
        badge: 'MOST POPULAR',
        description: 'Smooths unruly flyaways while sealing cuticles with nourishing argan silk.',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
        link: '/shop?category=hair-concern&concern=frizz',
      },
      {
        id: 'concern-2',
        title: 'Damaged & Colour-Treated Hair',
        badge: 'CLINICAL GRADE',
        description: 'Rebuilds broken keratin polypeptide bonds from root to tip.',
        image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
        link: '/shop?category=hair-concern&concern=damage',
      },
    ],
  },
  realResults: {
    tag: 'REAL PEOPLE REAL RESULTS',
    title: 'Real People. Real Results.',
    description: 'Experience salon-grade transformations verified by clinical hair specialists.',
    videoCards: [
      {
        id: 'reel-1',
        title: 'Silk Press & Shine Routine',
        subtitle: 'Watch the high-gloss revival',
        productName: 'Sensein Damage Repair Shampoo',
        price: '₹1,299',
        videoSrc: '/hero-video.mp4',
        poster: '/images/hero1.jpg',
        productLink: '/shop',
        rating: '5.0 ★',
        tag: 'BESTSELLER',
      },
    ],
  },
  beforeAfter: {
    titlePrefix: 'DIGITS',
    titleHighlight: "DON'T LIE",
    footnote: '*based on Independent Clinical Studies, 2026',
    stats: [
      { value: '97%', label: 'wave or curl hold all day long' },
      { value: '92%', label: 'better hair definition' },
      { value: '48%', label: 'reduction in hair dryness' },
    ],
    transformations: [
      {
        id: 'trans-1',
        title: 'Frizz & Wavy to Mirror-Smooth Glass Hair',
        beforeImage: '/images/before-after/smooth_before.jpg',
        afterImage: '/images/before-after/smooth_after.jpg',
        tag: 'Frizz Defense',
        productName: 'Sensein Damage Repair Conditioner',
        productPrice: '₹1,299',
        productLink: '/shop',
      },
      {
        id: 'trans-2',
        title: 'Dry Strands to Defined Bouncy Curls',
        beforeImage: '/images/before-after/curl_before.jpg',
        afterImage: '/images/before-after/curl_after.jpg',
        tag: 'Curl Moisture',
        productName: 'Sensein Intense Hydration Mask',
        productPrice: '₹1,499',
        productLink: '/shop',
      },
      {
        id: 'trans-3',
        title: 'Chemically Treated Hair to Deep Rebuilt Core',
        beforeImage: '/images/before-after/repair_before.jpg',
        afterImage: '/images/before-after/repair_after.jpg',
        tag: 'Bond Repair',
        productName: 'Sensein Bond Repair Shampoo',
        productPrice: '₹1,299',
        productLink: '/shop',
      },
    ],
  },
  brandValues: {
    tag: 'OUR TRUST GUARANTEE',
    title: 'Why Choose Sensein?',
    values: [
      {
        id: 'val-1',
        iconName: 'ShieldCheck',
        title: 'Dermatologically Tested',
        desc: 'Gentle and clinically safe for regular hair care routines',
      },
      {
        id: 'val-2',
        iconName: 'Droplets',
        title: 'No Sulphates • No Parabens',
        desc: 'Clean formulas that protect scalp health and moisture barrier',
      },
      {
        id: 'val-3',
        iconName: 'Sparkles',
        title: 'Made for Indian Hair',
        desc: 'Engineered for heat, humidity, hard water & urban pollution',
      },
      {
        id: 'val-4',
        iconName: 'Lock',
        title: 'Express Courier Delivery',
        desc: 'Fast doorstep delivery, live tracking & reliable COD option',
      },
    ],
  },
  instagramFeed: {
    handle: '@sensein.official',
    profileUrl: 'https://instagram.com',
    posts: [
      {
        id: 'post-1',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
        caption: 'Luxury ritual redefined ✨',
      },
      {
        id: 'post-2',
        image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
        caption: 'Gloss that speaks for itself 💫',
      },
      {
        id: 'post-3',
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
        caption: 'Botanical repair science 🌿',
      },
      {
        id: 'post-4',
        image: 'https://images.unsplash.com/photo-1512290900672-1f02e69007f7?auto=format&fit=crop&w=600&q=80',
        caption: 'Indian hair texture perfected 💎',
      },
    ],
  },
  customerReviews: {
    tag: 'PROVEN RESULTS & LOVE',
    title: 'Loved by 25,000+ Indian Hair Routines',
    ratingSummary: '4.95 / 5.0 Average Rating (1,400+ Reviews)',
    reviews: [
      {
        id: 'rev-1',
        name: 'Aanya Sharma',
        role: 'Verified Buyer',
        location: 'Mumbai, India',
        rating: 5,
        title: 'Completely transformed my frizzy hair!',
        text: 'After just 2 washes with the Repair Shampoo, my hair has never felt so silky and manageable.',
        product: 'Sensein Damage Repair Shampoo',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        verified: true,
      },
      {
        id: 'rev-2',
        name: 'Pooja Mehta',
        role: 'Verified Buyer',
        location: 'Bangalore, India',
        rating: 5,
        title: 'Salon blowout finish right at home!',
        text: 'The hydration mask is pure luxury in a bottle. The shine is unreal and lasts for days.',
        product: 'Sensein Intense Hydration Mask',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
        verified: true,
      },
    ],
  },
}

export default function HomepageCmsPage() {
  const { data: cmsData, isLoading, refetch } = useGetHomepageContentQuery()
  const { data: productsData } = useGetProductsQuery()
  const { data: auditData, refetch: refetchAudit } = useGetAuditLogsQuery({ entityType: 'HomepageConfig' })
  const [updateHomepage, { isLoading: isSaving }] = useUpdateHomepageContentMutation()
  const [resetHomepage, { isLoading: isResetting }] = useResetHomepageContentMutation()

  const rawProducts = Array.isArray(productsData?.data)
    ? productsData.data
    : Array.isArray(productsData?.products)
    ? productsData.products
    : Array.isArray(productsData)
    ? productsData
    : []
  const storeProducts = rawProducts

  const [activeTab, setActiveTab] = useState('visibility')
  const [formData, setFormData] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyViewMode, setHistoryViewMode] = useState('all_sections') // 'all_sections' | 'changes'
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  })
  const [previewOpen, setPreviewOpen] = useState({})

  const historyLogs = auditData?.data || []

  const extractAllCmsItems = (config = {}) => {
    const items = []
    const add = (section, categoryOrItem, property, value) => {
      const valStr = value === undefined || value === null ? '' : String(value).trim()
      items.push({
        section,
        categoryOrItem,
        property,
        value: valStr || '(Not Set / Empty)',
      })
    }

    // 1. Sections Overview (Visibility Toggles)
    const vis = config.visibility || {}
    add('1. Sections Overview', 'Announcement Bar', 'Display Toggle', vis.announcementBar ? 'Visible (ON)' : 'Hidden (OFF)')
    add('1. Sections Overview', 'Hero Carousel', 'Display Toggle', vis.heroSlider ? 'Visible (ON)' : 'Hidden (OFF)')
    add('1. Sections Overview', 'Brand Mission', 'Display Toggle', vis.missionQuote ? 'Visible (ON)' : 'Hidden (OFF)')
    add('1. Sections Overview', 'Shop By Concern', 'Display Toggle', vis.shopByConcern ? 'Visible (ON)' : 'Hidden (OFF)')
    add('1. Sections Overview', 'Video Reels (3D)', 'Display Toggle', vis.realResults ? 'Visible (ON)' : 'Hidden (OFF)')
    add('1. Sections Overview', 'Before & After', 'Display Toggle', vis.beforeAfter ? 'Visible (ON)' : 'Hidden (OFF)')
    add('1. Sections Overview', 'Trust & Values', 'Display Toggle', vis.brandValues ? 'Visible (ON)' : 'Hidden (OFF)')
    add('1. Sections Overview', 'Instagram Feed', 'Display Toggle', vis.instagramFeed ? 'Visible (ON)' : 'Hidden (OFF)')
    add('1. Sections Overview', 'Reviews & Proof', 'Display Toggle', vis.customerReviews ? 'Visible (ON)' : 'Hidden (OFF)')

    // 2. Announcement Bar
    const ann = config.announcementBar || {}
    add('2. Announcement Bar', 'Bar Settings', 'Enabled Status', ann.enabled ? 'Enabled (ON)' : 'Disabled (OFF)')
    ;(ann.messages || []).forEach((m, idx) => {
      add('2. Announcement Bar', `Announcement Message #${idx + 1}`, 'Message Text', m)
    })

    // 3. Hero Carousel Slides
    ;(config.heroSlider?.slides || []).forEach((s, idx) => {
      const slideName = s.title ? `Slide #${idx + 1}: ${s.title}` : `Slide #${idx + 1}`
      add('3. Hero Carousel', slideName, 'Media Type', s.type || 'image')
      add('3. Hero Carousel', slideName, 'Video Source URL Link', s.videoSrc)
      add('3. Hero Carousel', slideName, 'Poster Thumbnail Image Link', s.poster)
      add('3. Hero Carousel', slideName, 'Slide Image Photo Link', s.image)
      add('3. Hero Carousel', slideName, 'Show Logo Status', s.showLogo !== false ? 'Enabled (ON)' : 'Disabled (OFF)')
      add('3. Hero Carousel', slideName, 'Custom Logo Image Link', s.logoImage)
      add('3. Hero Carousel', slideName, 'Logo Subtitle / Tagline', s.logoSubtitle)
      add('3. Hero Carousel', slideName, 'Headline Title Text', s.title)
      add('3. Hero Carousel', slideName, 'Button Display Status', s.showBtn !== false ? 'Enabled (ON)' : 'Disabled (OFF)')
      add('3. Hero Carousel', slideName, 'Button CTA Text', s.btnText || 'Explore Collection')
      add('3. Hero Carousel', slideName, 'Button Target Destination Link', s.btnLink || '/shop')
      add('3. Hero Carousel', slideName, 'Button Background Color', s.btnBgColor || '#5A3859')
      add('3. Hero Carousel', slideName, 'Button Text Color', s.btnTextColor || '#ffffff')
    })

    // 4. Brand Mission
    const mq = config.missionQuote || {}
    add('4. Brand Mission', 'Mission Header', 'Badge Tag Text', mq.badgeText)
    add('4. Brand Mission', 'Mission Header', 'Main Heading Prefix', mq.mainHeadingPrefix)
    add('4. Brand Mission', 'Mission Header', 'Highlighted Brand Text', mq.highlightText)
    add('4. Brand Mission', 'Mission Header', 'Main Heading Suffix', mq.mainHeadingSuffix)

    // 5. Shop By Concern (Categories)
    const sbc = config.shopByConcern || {}
    add('5. Shop By Concern', 'Section Settings', 'Section Eyebrow Tag', sbc.tag || 'TARGETED FORMULATION')
    add('5. Shop By Concern', 'Section Settings', 'Section Headline Title', sbc.title || 'Shop by Hair Concern')
    add('5. Shop By Concern', 'Section Settings', 'Section Description Subtitle', sbc.description)
    ;(sbc.concerns || []).forEach((c, idx) => {
      const catName = c.title ? `Category #${idx + 1}: ${c.title}` : `Category #${idx + 1}`
      add('5. Shop By Concern', catName, 'Category Title Name', c.title)
      add('5. Shop By Concern', catName, 'Category Badge Tag', c.badge)
      add('5. Shop By Concern', catName, 'Full Description Text', c.description)
      add('5. Shop By Concern', catName, 'Banner Photo Image Link', c.image)
      add('5. Shop By Concern', catName, 'Target Shop URL Link', c.link)
    })

    // 6. Video Reels (3D)
    const rr = config.realResults || {}
    add('6. Video Reels (3D)', 'Section Settings', 'Section Eyebrow Tag', rr.tag || 'REAL PEOPLE. REAL RESULTS.')
    add('6. Video Reels (3D)', 'Section Settings', 'Section Headline Title', rr.title || 'See Sensein In Action')
    add('6. Video Reels (3D)', 'Section Settings', 'Section Description', rr.description)
    add('6. Video Reels (3D)', 'Section Settings', 'Button CTA Text', rr.buttonText || 'Shop All Bestsellers')
    add('6. Video Reels (3D)', 'Section Settings', 'Button Target Link', rr.buttonLink || '/shop')
    ;(rr.videoCards || []).forEach((r, idx) => {
      const reelName = r.title ? `Reel #${idx + 1}: ${r.title}` : `Reel #${idx + 1}`
      add('6. Video Reels (3D)', reelName, 'Reel Headline Title', r.title)
      add('6. Video Reels (3D)', reelName, 'Reel Subtitle Description', r.subtitle)
      add('6. Video Reels (3D)', reelName, 'Tagged Product Name', r.productName)
      add('6. Video Reels (3D)', reelName, 'Product Price', r.price)
      add('6. Video Reels (3D)', reelName, 'Video Media URL Link', r.videoSrc)
      add('6. Video Reels (3D)', reelName, 'Video Poster Thumbnail Link', r.poster)
      add('6. Video Reels (3D)', reelName, 'Product Target Link', r.productLink)
      add('6. Video Reels (3D)', reelName, 'Customer Rating Score', r.rating)
      add('6. Video Reels (3D)', reelName, 'Badge Tag', r.tag)
    })

    // 7. Before & After
    const ba = config.beforeAfter || {}
    add('7. Before & After', 'Section Settings', 'Title Prefix', ba.titlePrefix || 'DIGITS')
    add('7. Before & After', 'Section Settings', 'Title Highlight', ba.titleHighlight || "DON'T LIE")
    add('7. Before & After', 'Section Settings', 'Clinical Footnote Reference', ba.footnote)
    ;(ba.stats || []).forEach((st, idx) => {
      add('7. Before & After', `Clinical Stat #${idx + 1}`, 'Metric Percentage / Value', st.value)
      add('7. Before & After', `Clinical Stat #${idx + 1}`, 'Metric Description Label', st.label)
    })
    ;(ba.transformations || []).forEach((t, idx) => {
      const transName = t.title ? `Transformation #${idx + 1}: ${t.title}` : `Transformation #${idx + 1}`
      add('7. Before & After', transName, 'Transformation Title', t.title)
      add('7. Before & After', transName, 'Before Photo Image Link', t.beforeImage)
      add('7. Before & After', transName, 'After Photo Image Link', t.afterImage)
      add('7. Before & After', transName, 'Product Name', t.productName)
      add('7. Before & After', transName, 'Product Price', t.productPrice)
      add('7. Before & After', transName, 'Product Target Link', t.productLink)
      add('7. Before & After', transName, 'Badge Tag', t.tag)
    })

    // 8. Trust & Values
    const bv = config.brandValues || {}
    add('8. Trust & Values', 'Section Settings', 'Section Eyebrow Tag', bv.tag || 'OUR TRUST GUARANTEE')
    add('8. Trust & Values', 'Section Settings', 'Section Headline Title', bv.title || 'Why Choose Sensein?')
    ;(bv.values || []).forEach((v, idx) => {
      const valName = v.title ? `Value #${idx + 1}: ${v.title}` : `Value #${idx + 1}`
      add('8. Trust & Values', valName, 'Lucide Icon Name', v.iconName || 'ShieldCheck')
      add('8. Trust & Values', valName, 'Value Title Heading', v.title)
      add('8. Trust & Values', valName, 'Full Description Text', v.desc)
    })

    // 9. Instagram Feed
    const insta = config.instagramFeed || {}
    add('9. Instagram Feed', 'Profile Settings', 'Instagram Handle Tag', insta.handle || '@SENSEIN.INDIA')
    add('9. Instagram Feed', 'Profile Settings', 'Instagram Profile URL Link', insta.profileUrl)
    add('9. Instagram Feed', 'Profile Settings', 'Section Headline Title', insta.title)
    ;(insta.posts || []).forEach((p, idx) => {
      const postName = `Instagram Post #${idx + 1}`
      add('9. Instagram Feed', postName, 'Post Photo URL Link', p.image)
      add('9. Instagram Feed', postName, 'Handle Tag', p.handle)
    })

    // 10. Reviews & Proof
    const cr = config.customerReviews || {}
    add('10. Reviews & Proof', 'Section Settings', 'Section Eyebrow Tag', cr.tag || 'PROVEN RESULTS & LOVE')
    add('10. Reviews & Proof', 'Section Settings', 'Section Headline Title', cr.title || 'Loved by 25,000+ Indian Hair Routines')
    add('10. Reviews & Proof', 'Section Settings', 'Rating Summary Text', cr.ratingSummary)
    ;(cr.reviews || []).forEach((rv, idx) => {
      const revName = rv.name ? `Review #${idx + 1}: ${rv.name}` : `Review #${idx + 1}`
      add('10. Reviews & Proof', revName, 'Customer Reviewer Name', rv.name)
      add('10. Reviews & Proof', revName, 'Customer Role', rv.role)
      add('10. Reviews & Proof', revName, 'Location / City', rv.location)
      add('10. Reviews & Proof', revName, 'Rating Stars Score', `${rv.rating || 5} Stars`)
      add('10. Reviews & Proof', revName, 'Review Headline Title', rv.title)
      add('10. Reviews & Proof', revName, 'Full Story / Feedback Text', rv.text)
      add('10. Reviews & Proof', revName, 'Product Mentioned', rv.product)
      add('10. Reviews & Proof', revName, 'Customer Avatar Photo Link', rv.avatar)
      add('10. Reviews & Proof', revName, 'Verified Buyer Status', rv.verified ? 'Verified Buyer' : 'General')
    })

    return items
  }

  const handleDownloadExcelCsv = () => {
    const headers = [
      'Homepage Section (વિભાગ)',
      'Category / Item Name (કેટેગરી / આઇટમ)',
      'Property / Link Type (પ્રોપર્ટી / લિંક પ્રકાર)',
      'Value Before Update (🔴 પહેલાં શું હતું - Previous Data)',
      'After Update / Current Live (🟢 હાલ ત્યાં શું પડ્યું છે - New Active Data)',
      'Status / Change Type (સ્થિતિ)',
      'Last Modified Date & Time',
      'Modified By',
      'Log Reference ID',
    ]

    const rows = []
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const changeKeysAdded = new Set()

    if (historyLogs && historyLogs.length > 0) {
      historyLogs.forEach((log) => {
        const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : 'N/A'
        const adminEmail = log.performerEmail || 'admin@sensein.in'
        const changesList = log.details?.changes || []

        changesList.forEach((c) => {
          const key = `${c.section}:::${c.categoryOrItem || c.field}:::${c.property || ''}`
          changeKeysAdded.add(key)
          rows.push([
            escapeCsv(c.section || 'Front Page CMS'),
            escapeCsv(c.categoryOrItem || c.field || 'Item'),
            escapeCsv(c.property || 'General Property'),
            escapeCsv(c.beforeValue || '(None)'),
            escapeCsv(c.afterValue || '(None)'),
            escapeCsv(c.status === 'NEWLY_ADDED' ? '✨ NEWLY ADDED' : '✏️ MODIFIED'),
            escapeCsv(dateStr),
            escapeCsv(adminEmail),
            escapeCsv(log._id),
          ])
        })
      })
    }

    // Include ALL sections from active live store
    if (formData) {
      const allActiveItems = extractAllCmsItems(formData)
      const today = new Date().toLocaleString('en-IN')

      allActiveItems.forEach((item) => {
        const key = `${item.section}:::${item.categoryOrItem}:::${item.property}`
        if (!changeKeysAdded.has(key)) {
          rows.push([
            escapeCsv(item.section),
            escapeCsv(item.categoryOrItem),
            escapeCsv(item.property),
            escapeCsv('Original Initial Baseline'),
            escapeCsv(item.value),
            escapeCsv('🟢 LIVE ACTIVE'),
            escapeCsv(today),
            escapeCsv('System Master'),
            escapeCsv('LIVE_ACTIVE_SNAPSHOT'),
          ])
        }
      })
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Front_Page_CMS_Sectionwise_Master_Sheet_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showNotification('📥 Downloaded Front Page CMS Section-wise Excel/CSV Sheet!')
    if (window.__adminToast) {
      window.__adminToast.success('Downloaded complete comparison CSV file for all sections.', 'Excel Exported')
    }
  }

  useEffect(() => {
    if (cmsData?.data) {
      setFormData(cmsData.data)
    } else if (!isLoading && !formData) {
      setFormData(DEFAULT_HOMEPAGE_CONFIG)
    }
  }, [cmsData, isLoading])

  const { addToast } = useToast()

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      addToast({ type: 'error', title: 'Action Failed', message: msg })
    } else {
      addToast({ type: 'update', title: 'Live Synced Successfully', message: msg })
    }
  }

  const promptDelete = (title, message, onConfirm) => {
    setDeleteModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setDeleteModal({ isOpen: false, title: '', message: '', onConfirm: null })
      },
    })
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setSaveSuccess('')
    setSaveError('')
    try {
      await updateHomepage(formData).unwrap()
      showNotification('Homepage content saved & live synced successfully!')
      refetch()
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to save changes.', true)
    }
  }

  const handleReset = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset all homepage contents back to default? Any custom edits will be reverted.'
      )
    ) {
      return
    }
    try {
      const res = await resetHomepage().unwrap()
      if (res?.data) {
        setFormData(res.data)
      }
      showNotification('Reset to default contents successfully!')
    } catch (err) {
      showNotification('Failed to reset defaults.', true)
    }
  }

  if (!formData && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="font-mono text-xs font-bold">Loading Homepage CMS Engine...</span>
      </div>
    )
  }

  const tabs = [
    { id: 'visibility', label: 'Sections Overview', icon: LayoutTemplate },
    { id: 'announcementBar', label: 'Announcement Bar', icon: Megaphone },
    { id: 'heroSlider', label: 'Hero Carousel', icon: Sliders },
    { id: 'missionQuote', label: 'Brand Mission', icon: Sparkles },
    { id: 'shopByConcern', label: 'Shop By Concern', icon: Target },
    { id: 'realResults', label: 'Video Reels (3D)', icon: Video },
    { id: 'beforeAfter', label: 'Before & After', icon: SplitSquareVertical },
    { id: 'brandValues', label: 'Trust & Values', icon: ShieldCheck },
    { id: 'instagramFeed', label: 'Instagram Feed', icon: Instagram },
    { id: 'customerReviews', label: 'Reviews & Proof', icon: Star },
  ]

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-6 sm:p-7 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-mono text-[11px] uppercase tracking-widest font-bold">
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span>Store Customizer &amp; Content Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display mt-1">
            Front Page Content &amp; CMS
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Direct photo &amp; video upload picker, instant live sync &amp; visual section controls.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Download Before vs After Excel / CSV Button */}
          <button
            type="button"
            onClick={handleDownloadExcelCsv}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            title="Download full Before vs After comparison spreadsheet in Excel/CSV"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Download Change Sheet (CSV)</span>
          </button>

          {/* View History Modal Button */}
          <button
            type="button"
            onClick={() => {
              refetchAudit()
              setShowHistoryModal(true)
            }}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Inspect historical changes Before and After"
          >
            <History className="h-3.5 w-3.5 text-blue-600" />
            <span>Change History ({historyLogs.length})</span>
          </button>

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span>Preview Store</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save &amp; Publish Live</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tabs + Right Content Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Tabs */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-3 space-y-1 shadow-xs">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            Homepage Sections
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right Active Editor Area */}
        <div className="lg:col-span-9 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          {/* TAB 1: Front Page Sections Overview */}
          {activeTab === 'visibility' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <LayoutTemplate className="h-5 w-5 text-blue-600" />
                  Front Page Structure &amp; Sections (10 Active Sections)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Complete sequence of all content blocks and components appearing on the store front page.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    num: '01',
                    id: 'announcementBar',
                    title: 'Top Announcement Ticker',
                    desc: 'Sliding promotional banner, discounts & shipping alerts at top of page.',
                    icon: Megaphone,
                  },
                  {
                    num: '02',
                    id: 'heroSlider',
                    title: 'Hero Carousel & Video Slides',
                    desc: 'Full-screen luxury carousel with HD video background, titles & shop CTAs.',
                    icon: Sliders,
                  },
                  {
                    num: '03',
                    id: 'missionQuote',
                    title: 'Clean Beauty Mission Headline',
                    desc: 'Signature statement highlighting 100% clean botanical formulation.',
                    icon: Sparkles,
                  },
                  {
                    num: '04',
                    id: 'shopByConcern',
                    title: 'Targeted Hair Concerns',
                    desc: 'Interactive cards for Frizz, Damage, Scalp Care & Hair Density.',
                    icon: Target,
                  },
                  {
                    num: '05',
                    id: 'realResults',
                    title: 'Real People Real Results (3D Reels)',
                    desc: 'Dynamic video reel cards showcasing real transformations with price tags.',
                    icon: Video,
                  },
                  {
                    num: '06',
                    id: 'beforeAfter',
                    title: 'Clinical Transformations & Stats',
                    desc: 'Interactive split image slider and percentage trial proof metrics.',
                    icon: SplitSquareVertical,
                  },
                  {
                    num: '07',
                    id: 'brandValues',
                    title: 'Brand Pillars & Guarantee',
                    desc: '4 trust assurances: clean formulation, cruelty-free, salon grade, derm-tested.',
                    icon: ShieldCheck,
                  },
                  {
                    num: '08',
                    id: 'instagramFeed',
                    title: 'Instagram Community Gallery',
                    desc: 'Curated social grid with live profile links and high-res imagery.',
                    icon: Instagram,
                  },
                  {
                    num: '09',
                    id: 'customerReviews',
                    title: 'Verified Customer Testimonials',
                    desc: 'Customer quotes, 5-star ratings, buyer locations & avatar photos.',
                    icon: Star,
                  },
                ].map((sec) => {
                  const Icon = sec.icon
                  return (
                    <div
                      key={sec.id}
                      className="p-5 bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 hover:shadow-sm rounded-2xl flex flex-col justify-between transition-all group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                              #{sec.num}
                            </span>
                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                              <Icon className="h-4 w-4" />
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                            ACTIVE
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {sec.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {sec.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab(sec.id)}
                        className="mt-4 w-full py-2 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <span>Configure Section</span>
                        <ChevronRight className="h-3.5 w-3.5 text-blue-600" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Announcement Bar */}
          {activeTab === 'announcementBar' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                  Top Announcement Ticker
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage the top sliding promotional banner, discount coupons &amp; shipping alerts.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.announcementBar?.enabled ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        announcementBar: {
                          ...formData.announcementBar,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    Enable Top Announcement Bar
                  </span>
                </label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ticker Messages</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          announcementBar: {
                            ...formData.announcementBar,
                            messages: [
                              ...(formData.announcementBar?.messages || []),
                              '✨ NEW ANNOUNCEMENT BANNER TEXT ✨',
                            ],
                          },
                        })
                      }
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Message
                    </button>
                  </div>

                  {(formData.announcementBar?.messages || []).map((msg, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 w-6">#{index + 1}</span>
                      <input
                        type="text"
                        value={msg}
                        onChange={(e) => {
                          const updated = [...formData.announcementBar.messages]
                          updated[index] = e.target.value
                          setFormData({
                            ...formData,
                            announcementBar: {
                              ...formData.announcementBar,
                              messages: updated,
                            },
                          })
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-medium transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          promptDelete(
                            'Delete Announcement Message',
                            `Are you sure you want to delete message #${index + 1}: "${msg}"?`,
                            () => {
                              const updated = formData.announcementBar.messages.filter(
                                (_, i) => i !== index
                              )
                              setFormData({
                                ...formData,
                                announcementBar: {
                                  ...formData.announcementBar,
                                  messages: updated,
                                },
                              })
                            }
                          )
                        }}
                        className="p-2.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Hero Carousel */}
          {activeTab === 'heroSlider' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                    <Sliders className="h-5 w-5 text-blue-600" />
                    Hero Carousel &amp; Video Slides
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload photos/videos, configure logo &amp; subtitle, edit titles, subtext and custom button colors.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSlide = {
                      id: `slide-${Date.now()}`,
                      type: 'image',
                      image: '',
                      poster: '',
                      videoSrc: '',
                      showLogo: true,
                      logoImage: '',
                      logoSubtitle: '',
                      title: '',
                      description: '',
                      showBtn: false,
                      btnText: '',
                      btnLink: '/shop',
                      btnBgColor: '#5A3859',
                      btnTextColor: '#ffffff',
                    }
                    setFormData((prev) => ({
                      ...prev,
                      heroSlider: {
                        ...(prev.heroSlider || {}),
                        slides: [...(prev.heroSlider?.slides || []), newSlide],
                      },
                    }))
                  }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  Add New Slide
                </button>
              </div>

              {/* Global Carousel Slide Duration Settings */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                    <Sliders className="h-4 w-4 text-blue-600" />
                    <span>Auto Slide Switch Timer / Duration (સ્લાઇડ બદલાવાનો સમય)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    સ્લાઇડ કે વિડીયો કેટલી સેકન્ડ પછી આપમેળે આગળ વધશે તે નક્કી કરો (ગ્રાહક એરો કે ડોટ્સથી જાતે પણ ફેરવી શકે છે).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {[3, 5, 6, 8, 10].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          heroSlider: {
                            ...(prev.heroSlider || {}),
                            slideDuration: sec,
                          },
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        (formData.heroSlider?.slideDuration || 6) === sec
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={formData.heroSlider?.slideDuration || 6}
                      onChange={(e) => {
                        const val = Math.max(2, Math.min(30, Number(e.target.value) || 6))
                        setFormData((prev) => ({
                          ...prev,
                          heroSlider: {
                            ...(prev.heroSlider || {}),
                            slideDuration: val,
                          },
                        }))
                      }}
                      className="w-12 text-xs font-mono font-bold text-slate-900 text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">sec</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {(formData.heroSlider?.slides || []).map((slide, index) => {
                  const updateSlideField = (field, val) => {
                    setFormData((prev) => {
                      const currentSlides = [...(prev.heroSlider?.slides || [])]
                      currentSlides[index] = {
                        ...currentSlides[index],
                        [field]: val,
                      }
                      return {
                        ...prev,
                        heroSlider: {
                          ...(prev.heroSlider || {}),
                          slides: currentSlides,
                        },
                      }
                    })
                  }

                  const removeSlide = () => {
                    setFormData((prev) => {
                      const currentSlides = [...(prev.heroSlider?.slides || [])]
                      currentSlides.splice(index, 1)
                      return {
                        ...prev,
                        heroSlider: {
                          ...(prev.heroSlider || {}),
                          slides: currentSlides,
                        },
                      }
                    })
                  }

                  const moveSlide = (direction) => {
                    setFormData((prev) => {
                      const currentSlides = [...(prev.heroSlider?.slides || [])]
                      const targetIndex = index + direction
                      if (targetIndex < 0 || targetIndex >= currentSlides.length) return prev
                      const temp = currentSlides[index]
                      currentSlides[index] = currentSlides[targetIndex]
                      currentSlides[targetIndex] = temp
                      return {
                        ...prev,
                        heroSlider: {
                          ...(prev.heroSlider || {}),
                          slides: currentSlides,
                        },
                      }
                    })
                  }

                  return (
                    <div
                      key={slide.id || index}
                      className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative group space-y-6"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-lg font-mono">
                            Slide #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700 truncate max-w-xs">
                            {slide.title || 'Untitled Banner Slide'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSlide(-1)}
                            disabled={index === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Up"
                          >
                            <MoveUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSlide(1)}
                            disabled={index === (formData.heroSlider?.slides || []).length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Down"
                          >
                            <MoveDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={removeSlide}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Slide"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-5">
                        {/* 1. Logo & Branding Customization */}
                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                                Logo &amp; Brand Tagline Controls (લોગો અને નીચેનું લખાણ)
                              </span>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                લોગો બાય ડિફોલ્ટ SENSEIN લોગો રહેશે. તમે જો નવો ફોટો અપલોડ કરશો તો જ બદલાશે.
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={slide.showLogo !== false}
                                onChange={(e) => updateSlideField('showLogo', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                              <span className="ml-2 text-xs font-semibold text-slate-700">
                                {slide.showLogo !== false ? 'Logo ON' : 'Logo OFF'}
                              </span>
                            </label>
                          </div>

                          {slide.showLogo !== false && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                              <div>
                                <MediaUploadPicker
                                  label="Custom Logo Image (Default: SENSEIN Logo)"
                                  mediaType="image"
                                  category="brand"
                                  value={slide.logoImage || ''}
                                  onChange={(url) => updateSlideField('logoImage', url)}
                                  placeholder="Select or upload custom logo (Default: SENSEIN Logo)..."
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                  જો ખાલી રાખશો તો ડિફોલ્ટ SENSEIN લોગો દેખાશે. નવો લોગો રાખવો હોય તો જ અપલોડ કરો.
                                </p>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                  Logo Subtitle / Tagline (નીચેનું લખાણ)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. PROFESSIONAL MEN"
                                  value={slide.logoSubtitle || ''}
                                  onChange={(e) => updateSlideField('logoSubtitle', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-semibold tracking-wider uppercase"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Text displayed right below the logo (e.g., PROFESSIONAL MEN, PROFESSIONAL, LUXURY CARE).
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Media Type & Upload */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Media Type
                            </label>
                            <select
                              value={slide.type || 'image'}
                              onChange={(e) => updateSlideField('type', e.target.value)}
                              className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:outline-none font-semibold"
                            >
                              <option value="image">Still Image</option>
                              <option value="video">Background Video (MP4)</option>
                            </select>
                          </div>

                          {slide.type === 'video' ? (
                            <MediaUploadPicker
                              label="Slide Video (MP4 / WebM)"
                              mediaType="video"
                              category="hero"
                              value={slide.videoSrc || ''}
                              onChange={(url) => updateSlideField('videoSrc', url)}
                            />
                          ) : (
                            <MediaUploadPicker
                              label="Slide Photo / Image"
                              mediaType="image"
                              category="hero"
                              value={slide.image || ''}
                              onChange={(url) => updateSlideField('image', url)}
                            />
                          )}
                        </div>

                        {slide.type === 'video' && (
                          <MediaUploadPicker
                            label="Poster / Fallback Image"
                            mediaType="image"
                            category="hero"
                            value={slide.poster || ''}
                            onChange={(url) => updateSlideField('poster', url)}
                          />
                        )}

                        {/* 3. Text Headlines & Description */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Headline Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. REPAIR DAMAGE. RESTORE LIFE."
                            value={slide.title || ''}
                            onChange={(e) => updateSlideField('title', e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:outline-none font-bold tracking-tight uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Subtext / Description
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. For Stronger, Healthier, Shinier Hair..."
                            value={slide.description || ''}
                            onChange={(e) => updateSlideField('description', e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        {/* Top-Level Slide Click Link */}
                        <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              Banner Click Destination Link (ફોટો / વિડીયો / આખા સ્લાઇડ ક્લિક લિંક)
                            </label>
                            <span className="text-[10px] text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              Direct Slide Link
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. /shop or /product/repair-shampoo or https://..."
                            value={slide.btnLink || ''}
                            onChange={(e) => updateSlideField('btnLink', e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:outline-none font-mono"
                          />
                          <p className="text-[10px] text-slate-500">
                            ગ્રાહક જ્યારે આખા બેનર/ફોટો/વિડીયો પર ક્લિક કરશે ત્યારે સીધો આ લિંક પર જશે.
                          </p>
                        </div>

                        {/* 4. CTA Button Controls */}
                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                                Button (CTA) Settings &amp; Colors (બટન લખાણ અને કલર)
                              </span>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Set button title, destination URL, button toggle and choose custom colors.
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={slide.showBtn !== false}
                                onChange={(e) => updateSlideField('showBtn', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                              <span className="ml-2 text-xs font-semibold text-slate-700">
                                {slide.showBtn !== false ? 'Button ON' : 'Button OFF'}
                              </span>
                            </label>
                          </div>

                          {slide.showBtn !== false && (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Button CTA Text
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. EXPLORE COLLECTION"
                                    value={slide.btnText || ''}
                                    onChange={(e) => updateSlideField('btnText', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-bold uppercase tracking-wider"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Button Destination Link (ક્લિક લિંક)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. /shop or /products/shampoo"
                                    value={slide.btnLink || ''}
                                    onChange={(e) => updateSlideField('btnLink', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-mono"
                                  />
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    ગ્રાહક જ્યારે આ બટન પર ક્લિક કરશે ત્યારે આ લિંક પર જશે.
                                  </p>
                                </div>
                              </div>

                              {/* Custom Color Pickers */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Button Background Color
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={slide.btnBgColor || '#5A3859'}
                                      onChange={(e) => updateSlideField('btnBgColor', e.target.value)}
                                      className="h-9 w-9 rounded-lg border border-slate-200 p-0.5 cursor-pointer bg-white"
                                    />
                                    <input
                                      type="text"
                                      value={slide.btnBgColor || '#5A3859'}
                                      onChange={(e) => updateSlideField('btnBgColor', e.target.value)}
                                      className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-mono font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    {['#5A3859', '#000000', '#D4AF37', '#1E293B', '#ffffff'].map((color) => (
                                      <button
                                        key={color}
                                        type="button"
                                        onClick={() => updateSlideField('btnBgColor', color)}
                                        className="text-[10px] px-2 py-0.5 rounded border border-slate-200 bg-slate-100 hover:bg-slate-200 font-medium cursor-pointer"
                                      >
                                        {color === '#5A3859' ? 'Purple' : color === '#000000' ? 'Black' : color === '#D4AF37' ? 'Gold' : color === '#1E293B' ? 'Slate' : 'White'}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Button Text Color
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={slide.btnTextColor || '#ffffff'}
                                      onChange={(e) => updateSlideField('btnTextColor', e.target.value)}
                                      className="h-9 w-9 rounded-lg border border-slate-200 p-0.5 cursor-pointer bg-white"
                                    />
                                    <input
                                      type="text"
                                      value={slide.btnTextColor || '#ffffff'}
                                      onChange={(e) => updateSlideField('btnTextColor', e.target.value)}
                                      className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-mono font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    {['#ffffff', '#000000', '#D4AF37'].map((color) => (
                                      <button
                                        key={color}
                                        type="button"
                                        onClick={() => updateSlideField('btnTextColor', color)}
                                        className="text-[10px] px-2 py-0.5 rounded border border-slate-200 bg-slate-100 hover:bg-slate-200 font-medium cursor-pointer"
                                      >
                                        {color === '#ffffff' ? 'White' : color === '#000000' ? 'Black' : 'Gold'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* 5. FULL BANNER LIVE REAL-TIME PREVIEW WITH TOGGLE & STORE PERSPECTIVE */}
                        <div className="mt-8 border border-slate-800 bg-slate-900 rounded-2xl p-4 sm:p-5 text-white space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                      <Eye className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <span className="text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2">
                                        FULL BANNER LIVE PREVIEW (આખી સ્લાઇડનો લાઇવ પ્રિવ્યૂ)
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-semibold">
                                          REAL-TIME SYNC
                                        </span>
                                      </span>
                                      <p className="text-[11px] text-slate-400">
                                        This is exactly how this banner will appear to visitors on your live store.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={previewOpen[slide.id] ?? true}
                                        onChange={(e) =>
                                          setPreviewOpen((prev) => ({
                                            ...prev,
                                            [slide.id]: e.target.checked,
                                          }))
                                        }
                                        className="sr-only peer"
                                      />
                                      <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
                                      <span className="ml-1.5 text-[11px] font-semibold text-slate-300">
                                        {(previewOpen[slide.id] ?? true) ? 'Preview ON' : 'Preview OFF'}
                                      </span>
                                    </label>
                                  </div>
                                </div>

                                {(previewOpen[slide.id] ?? true) && (
                                  <div className="space-y-0 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                                    {/* Simulated Storefront Header Bar */}
                                    <div className="w-full bg-white text-slate-900 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs z-30 select-none">
                                      <div className="flex items-center gap-1.5 opacity-60">
                                        <div className="w-3.5 h-0.5 bg-slate-800 rounded"></div>
                                        <div className="w-3.5 h-0.5 bg-slate-800 rounded"></div>
                                      </div>
                                      <div className="flex flex-col items-center">
                                        <span className="font-display font-black text-xs tracking-widest text-slate-900 uppercase">SENSEIN®</span>
                                        <span className="text-[8px] font-semibold tracking-wider text-slate-400 -mt-0.5">PROFESSIONAL</span>
                                      </div>
                                      <div className="w-3.5 h-3.5 rounded-full border border-slate-400 opacity-60" />
                                    </div>

                                    {/* Interactive Banner Canvas Frame */}
                                    <div className="relative w-full overflow-hidden bg-black text-white h-[360px] sm:h-[480px] shadow-inner select-none flex flex-col justify-end">
                                      
                                      {/* Background Media (100% clean black if no media uploaded) */}
                                      {slide.type === 'video' && slide.videoSrc ? (
                                        <video
                                          key={slide.videoSrc}
                                          autoPlay
                                          muted
                                          loop
                                          playsInline
                                          poster={slide.poster || slide.image}
                                          className="absolute inset-0 w-full h-full object-cover object-center"
                                        >
                                          <source src={slide.videoSrc} type="video/mp4" />
                                        </video>
                                      ) : slide.image ? (
                                        <img
                                          src={slide.image}
                                          alt={slide.title || 'Slide Banner'}
                                          className="absolute inset-0 w-full h-full object-cover object-center"
                                        />
                                      ) : (
                                        <div className="absolute inset-0 bg-black" />
                                      )}

                                      {/* Luxury Dark Gradient Overlay (only if media exists) */}
                                      {(slide.videoSrc || slide.image) && (
                                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/40 to-black/25 pointer-events-none" />
                                      )}

                                      {/* Content Overlay */}
                                      <div className="relative z-20 flex flex-col items-center justify-end pb-12 sm:pb-16 text-center px-4 sm:px-8 space-y-2.5 sm:space-y-3">
                                        
                                        {/* Logo + Tagline */}
                                        {slide.showLogo !== false && (
                                          <div className="flex flex-col items-center justify-center mb-0.5">
                                            {slide.logoImage ? (
                                              <img
                                                src={slide.logoImage}
                                                alt="Brand Logo"
                                                className="max-h-9 sm:max-h-12 w-auto object-contain drop-shadow-lg"
                                              />
                                            ) : (
                                              <SenseinLogo isWhite={true} className="drop-shadow-lg scale-90 sm:scale-100" />
                                            )}
                                            {slide.logoSubtitle && (
                                              <span className="text-[9px] sm:text-xs font-semibold tracking-[0.25em] sm:tracking-[0.35em] text-white/90 uppercase mt-1 drop-shadow-sm font-sans">
                                                {slide.logoSubtitle}
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {/* Headline Title */}
                                        {slide.title && (
                                          <h2 className="font-display text-base sm:text-2xl md:text-3xl font-bold uppercase tracking-tight text-white drop-shadow-md leading-tight max-w-xl">
                                            {slide.title}
                                          </h2>
                                        )}

                                        {/* Subtext Description */}
                                        {slide.description && (
                                          <p className="text-[11px] sm:text-xs text-white/85 font-normal max-w-md leading-relaxed drop-shadow-sm px-2 line-clamp-2 sm:line-clamp-3">
                                            {slide.description}
                                          </p>
                                        )}

                                        {/* Button (Only visible if Button is ON and has text) */}
                                        {slide.showBtn !== false && slide.btnText && (
                                          <div className="pt-1">
                                            <div
                                              style={{
                                                backgroundColor: slide.btnBgColor || '#5A3859',
                                                color: slide.btnTextColor || '#ffffff',
                                              }}
                                              className="inline-block font-bold text-[11px] sm:text-xs uppercase px-7 py-2.5 sm:px-8 sm:py-3 tracking-wider shadow-xl transition-all"
                                            >
                                              {slide.btnText}
                                            </div>
                                          </div>
                                        )}

                                      </div>

                                      {/* Bottom Wave Curve (Matches Live Storefront exact curve boundary) */}
                                      <div className="absolute -bottom-1 left-0 right-0 z-35 pointer-events-none">
                                        <WavyTickerBar />
                                      </div>

                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                    )
                  })}
                </div>
              </div>
            )}

          {/* TAB 4: Clean Beauty Mission */}
          {activeTab === 'missionQuote' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Clean Beauty Mission Headline
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage the clean beauty pill badge and emphasized philosophy statement.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Pill Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.missionQuote?.badgeText || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        missionQuote: { ...formData.missionQuote, badgeText: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Headline Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.missionQuote?.mainHeadingPrefix || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        missionQuote: {
                          ...formData.missionQuote,
                          mainHeadingPrefix: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1.5 uppercase tracking-wider">
                    Highlighted / Italic Text
                  </label>
                  <input
                    type="text"
                    value={formData.missionQuote?.highlightText || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        missionQuote: {
                          ...formData.missionQuote,
                          highlightText: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-blue-50/50 border border-blue-200 text-blue-900 text-xs rounded-xl px-4 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none italic font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Headline Suffix
                  </label>
                  <input
                    type="text"
                    value={formData.missionQuote?.mainHeadingSuffix || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        missionQuote: {
                          ...formData.missionQuote,
                          mainHeadingSuffix: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Shop By Concern */}
          {activeTab === 'shopByConcern' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                    <Target className="h-5 w-5 text-blue-600" />
                    Targeted Formulation (Shop By Concern)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Customizable concern categories with tags, photos, and descriptions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newCard = {
                      id: `concern-${Date.now()}`,
                      title: 'Hair Thinning & Density',
                      description: 'Boosts follicle strength and density with peptide complexes.',
                      image:
                        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
                      link: '/shop?category=hair-concern&concern=density',
                      badge: 'NEW LAUNCH',
                    }
                    setFormData({
                      ...formData,
                      shopByConcern: {
                        ...formData.shopByConcern,
                        concerns: [...(formData.shopByConcern?.concerns || []), newCard],
                      },
                    })
                  }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  Add Concern Card
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Section Tag
                  </label>
                  <input
                    type="text"
                    value={formData.shopByConcern?.tag || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shopByConcern: { ...formData.shopByConcern, tag: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Main Title
                  </label>
                  <input
                    type="text"
                    value={formData.shopByConcern?.title || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shopByConcern: { ...formData.shopByConcern, title: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subtext
                  </label>
                  <input
                    type="text"
                    value={formData.shopByConcern?.description || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shopByConcern: { ...formData.shopByConcern, description: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {(formData.shopByConcern?.concerns || []).map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-900">
                        #{index + 1} {item.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          promptDelete(
                            'Delete Concern Card',
                            `Are you sure you want to delete "${item.title || 'Concern Card'}"?`,
                            () => {
                              const updated = formData.shopByConcern.concerns.filter(
                                (_, i) => i !== index
                              )
                              setFormData({
                                ...formData,
                                shopByConcern: { ...formData.shopByConcern, concerns: updated },
                              })
                            }
                          )
                        }}
                        className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Card Title
                        </label>
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => {
                            const updated = [...formData.shopByConcern.concerns]
                            updated[index].title = e.target.value
                            setFormData({
                              ...formData,
                              shopByConcern: { ...formData.shopByConcern, concerns: updated },
                            })
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-bold focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Badge Tag
                        </label>
                        <input
                          type="text"
                          value={item.badge || ''}
                          onChange={(e) => {
                            const updated = [...formData.shopByConcern.concerns]
                            updated[index].badge = e.target.value
                            setFormData({
                              ...formData,
                              shopByConcern: { ...formData.shopByConcern, concerns: updated },
                            })
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-mono focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => {
                            const updated = [...formData.shopByConcern.concerns]
                            updated[index].description = e.target.value
                            setFormData({
                              ...formData,
                              shopByConcern: { ...formData.shopByConcern, concerns: updated },
                            })
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 focus:border-blue-600 focus:outline-none font-medium"
                        />
                      </div>

                      <MediaUploadPicker
                        label="Concern Photo"
                        category="concern"
                        mediaType="image"
                        value={item.image || ''}
                        onChange={(url) => {
                          const updated = [...formData.shopByConcern.concerns]
                          updated[index].image = url
                          setFormData({
                            ...formData,
                            shopByConcern: { ...formData.shopByConcern, concerns: updated },
                          })
                        }}
                      />

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Destination Link
                        </label>
                        <input
                          type="text"
                          value={item.link || ''}
                          onChange={(e) => {
                            const updated = [...formData.shopByConcern.concerns]
                            updated[index].link = e.target.value
                            setFormData({
                              ...formData,
                              shopByConcern: { ...formData.shopByConcern, concerns: updated },
                            })
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-mono focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Real Results 3D Video Showcase */}
          {activeTab === 'realResults' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                    <Video className="h-5 w-5 text-blue-600" />
                    Real People Real Results (3D Video Reels)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    નિયત 5 ઇન્ટરેક્ટિવ 3D રીલ્સ સ્લોટ્સ (Select Product, Video File, અને Poster Cover).
                  </p>
                </div>
                <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start shadow-xs">
                  <Video className="h-3.5 w-3.5 text-blue-600" />
                  Fixed 5 Video Reel Slots (ફિક્સ 5 સ્લોટ)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Section Tag
                  </label>
                  <input
                    type="text"
                    value={formData.realResults?.tag || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        realResults: { ...formData.realResults, tag: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={formData.realResults?.title || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        realResults: { ...formData.realResults, title: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.realResults?.description || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        realResults: { ...formData.realResults, description: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Section Bottom CTA Button Settings */}
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      Section Bottom CTA Button (રીલ્સ નીચેનું બટન &amp; બેસ્ટસેલર ફિલ્ટર)
                    </span>
                    <p className="text-[11px] text-purple-700/80 mt-0.5">
                      આ બટન પર ક્લિક કરવાથી ગ્રાહક સીધા શોપ પેજ પર બેસ્ટસેલર ફિલ્ટર થયેલા પ્રોડક્ટ્સ પર પહોંચશે.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Button Text (બટન લખાણ)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shop All Bestsellers"
                      value={formData.realResults?.buttonText || 'Shop All Bestsellers'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          realResults: { ...formData.realResults, buttonText: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-bold focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Button Target Link (લિંક - By default: /shop?filter=bestseller)
                    </label>
                    <input
                      type="text"
                      placeholder="/shop?filter=bestseller"
                      value={formData.realResults?.buttonLink || '/shop?filter=bestseller'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          realResults: { ...formData.realResults, buttonLink: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-mono focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const existingCards = [...(formData.realResults?.videoCards || [])]
                  // Ensure exactly 5 cards
                  while (existingCards.length < 5) {
                    const idx = existingCards.length + 1
                    existingCards.push({
                      id: `reel-${idx}`,
                      productName: `Video Reel #${idx}`,
                      price: '₹999',
                      videoSrc: '/hero-video.mp4',
                      poster: `/images/hero${idx > 2 ? 1 : idx}.jpg`,
                      productLink: '/shop',
                      rating: '5.0 ★',
                      category: 'Haircare',
                      subtitle: 'Experience salon-grade transformations',
                      tag: 'BESTSELLER',
                    })
                  }
                  const fixedCards = existingCards.slice(0, 5)

                  return fixedCards.map((card, index) => {
                    const updateReelCardField = (field, val) => {
                      setFormData((prev) => {
                        const updatedCards = [...(prev.realResults?.videoCards || [])]
                        while (updatedCards.length < 5) {
                          const idx = updatedCards.length + 1
                          updatedCards.push({
                            id: `reel-${idx}`,
                            productName: `Video Reel #${idx}`,
                            price: '₹999',
                            videoSrc: '/hero-video.mp4',
                            poster: `/images/hero${idx > 2 ? 1 : idx}.jpg`,
                            productLink: '/shop',
                            rating: '5.0 ★',
                            category: 'Haircare',
                            subtitle: 'Experience salon-grade transformations',
                            tag: 'BESTSELLER',
                          })
                        }
                        const normalizedCards = updatedCards.slice(0, 5)
                        normalizedCards[index] = {
                          ...normalizedCards[index],
                          [field]: val,
                        }
                        return {
                          ...prev,
                          realResults: {
                            ...(prev.realResults || {}),
                            videoCards: normalizedCards,
                          },
                        }
                      })
                    }

                    return (
                      <div
                        key={card.id || index}
                        className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-4 shadow-sm"
                      >
                        {/* Reel Card Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                              {index + 1}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {card.productName || `Video Reel Slot #${index + 1}`}
                            </span>
                            {card.price && (
                              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                                {card.price}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            Reel Slot #{index + 1} of 5
                          </span>
                        </div>

                        {/* 1. SELECT PRODUCT DROPDOWN */}
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Package className="h-4 w-4 text-blue-600" />
                              1. Select Store Product (લાઈવ પ્રોડક્ટ પસંદ કરો)
                            </label>
                            <span className="text-[11px] text-slate-500 font-medium">
                              *પ્રોડક્ટ પસંદ કરતાં જ નામ, કેટેગરી, પ્રાઇસ અને શોપ લિંક આપોઆપ સેટ થઈ જશે
                            </span>
                          </div>

                          <select
                            value={
                              storeProducts.find(
                                (p) =>
                                  p.name === card.productName ||
                                  `/product/${p.slug || p._id}` === card.productLink
                              )?._id || ''
                            }
                            onChange={(e) => {
                              const selectedId = e.target.value
                              if (!selectedId) return
                              const prod = storeProducts.find((p) => p._id === selectedId)
                              if (prod) {
                                const catName =
                                  (typeof prod.category === 'object' ? prod.category?.name : prod.category) ||
                                  (prod.name?.toLowerCase().includes('shampoo')
                                    ? 'Hair Shampoo'
                                    : prod.name?.toLowerCase().includes('serum') && prod.name?.toLowerCase().includes('scalp')
                                    ? 'Scalp Serum'
                                    : prod.name?.toLowerCase().includes('serum')
                                    ? 'Hair Serum'
                                    : prod.name?.toLowerCase().includes('mask')
                                    ? 'Hair Mask'
                                    : prod.name?.toLowerCase().includes('perfume')
                                    ? 'Hair Perfume'
                                    : 'Haircare')

                                const prodPrice = `₹${prod.salePrice || prod.price || 999}`
                                const prodLink = `/product/${prod.slug || prod._id}`
                                const prodRating = `${prod.rating || 5.0} ★`
                                const prodImage = (prod.images && prod.images[0]) || prod.image || ''

                                setFormData((prev) => {
                                  const updatedCards = [...(prev.realResults?.videoCards || [])]
                                  while (updatedCards.length < 5) {
                                    const idx = updatedCards.length + 1
                                    updatedCards.push({
                                      id: `reel-${idx}`,
                                      productName: `Video Reel #${idx}`,
                                      price: '₹999',
                                      videoSrc: '/hero-video.mp4',
                                      poster: `/images/hero${idx > 2 ? 1 : idx}.jpg`,
                                      productLink: '/shop',
                                      rating: '5.0 ★',
                                      category: 'Haircare',
                                      subtitle: 'Experience salon-grade transformations',
                                      tag: 'BESTSELLER',
                                    })
                                  }
                                  const normalizedCards = updatedCards.slice(0, 5)
                                  normalizedCards[index] = {
                                    ...normalizedCards[index],
                                    productName: prod.name,
                                    category: catName,
                                    price: prodPrice,
                                    productLink: prodLink,
                                    rating: prodRating,
                                    poster: normalizedCards[index].poster || prodImage,
                                    subtitle:
                                      prod.subtitle ||
                                      prod.shortDescription ||
                                      normalizedCards[index].subtitle ||
                                      'Experience salon-grade transformations',
                                    tag: prod.badge || normalizedCards[index].tag || 'BESTSELLER',
                                  }
                                  return {
                                    ...prev,
                                    realResults: {
                                      ...(prev.realResults || {}),
                                      videoCards: normalizedCards,
                                    },
                                  }
                                })
                                showNotification(`Auto-filled details from "${prod.name}"!`)
                              }
                            }}
                            className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl px-3.5 py-2.5 shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Choose Live Store Product --</option>
                            {storeProducts.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} — ₹{p.salePrice || p.price}
                              </option>
                            ))}
                          </select>

                          {/* Live detected product details pills */}
                          {card.productName && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                              <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-md border border-blue-200/60">
                                Category: {card.category || 'Haircare'}
                              </span>
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                                Price: {card.price || '₹999'}
                              </span>
                              <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-md border border-amber-200/60">
                                Rating: {card.rating || '5.0 ★'}
                              </span>
                              <span className="bg-slate-100 text-slate-600 font-mono px-2.5 py-0.5 rounded-md border border-slate-200">
                                Link: {card.productLink || '/shop'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 2 & 3. VIDEO FILE & VIDEO COVER */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <MediaUploadPicker
                              label="2. Video Stream File (વીડિયો ફાઇલ - .mp4)"
                              category="reels"
                              mediaType="video"
                              value={card.videoSrc || ''}
                              onChange={(url) => updateReelCardField('videoSrc', url)}
                            />
                          </div>

                          <div>
                            <MediaUploadPicker
                              label="3. Video Cover / Poster (વીડિયોનું કવર ફોટો)"
                              category="reels"
                              mediaType="image"
                              value={card.poster || ''}
                              onChange={(url) => updateReelCardField('poster', url)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* TAB 7: Digits Don't Lie & Clinical Before/After */}
          {activeTab === 'beforeAfter' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <SplitSquareVertical className="h-5 w-5 text-blue-600" />
                  Clinical Before &amp; After &amp; Digits Don't Lie
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure section header titles, clinical study stats, and interactive split comparison sliders.
                </p>
              </div>

              {/* Section Header Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Title Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.beforeAfter?.titlePrefix || ''}
                    placeholder="e.g. DIGITS"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        beforeAfter: { ...prev.beforeAfter, titlePrefix: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Title Highlight
                  </label>
                  <input
                    type="text"
                    value={formData.beforeAfter?.titleHighlight || ''}
                    placeholder="e.g. DON'T LIE"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        beforeAfter: { ...prev.beforeAfter, titleHighlight: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-[#5A3859] text-xs rounded-xl px-4 py-2.5 font-black italic focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Footnote Citation
                  </label>
                  <input
                    type="text"
                    value={formData.beforeAfter?.footnote || ''}
                    placeholder="e.g. *based on Independent Clinical Studies, 2026"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        beforeAfter: { ...prev.beforeAfter, footnote: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-4 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Stats Counters */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Clinical Study Stats
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        beforeAfter: {
                          ...prev.beforeAfter,
                          stats: [
                            ...(prev.beforeAfter?.stats || []),
                            { value: '95%', label: 'Noticed visible hair improvement' },
                          ],
                        },
                      }))
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Stat
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(formData.beforeAfter?.stats || []).map((stat, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 shadow-xs relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Stat #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              beforeAfter: {
                                ...prev.beforeAfter,
                                stats: (prev.beforeAfter?.stats || []).filter((_, i) => i !== index),
                              },
                            }))
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={stat.value || ''}
                        placeholder="e.g. 97%"
                        onChange={(e) => {
                          const val = e.target.value
                          setFormData((prev) => ({
                            ...prev,
                            beforeAfter: {
                              ...prev.beforeAfter,
                              stats: (prev.beforeAfter?.stats || []).map((st, i) =>
                                i === index ? { ...st, value: val } : st
                              ),
                            },
                          }))
                        }}
                        className="w-full bg-white border border-slate-200 text-[#5A3859] text-base font-extrabold rounded-xl px-3 py-1.5 focus:border-blue-600 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={stat.label || ''}
                        placeholder="Description label"
                        onChange={(e) => {
                          const lbl = e.target.value
                          setFormData((prev) => ({
                            ...prev,
                            beforeAfter: {
                              ...prev.beforeAfter,
                              stats: (prev.beforeAfter?.stats || []).map((st, i) =>
                                i === index ? { ...st, label: lbl } : st
                              ),
                            },
                          }))
                        }}
                        className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3.5 py-1.5 focus:border-blue-600 focus:outline-none font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Transformations List */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Interactive Comparison Sliders
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newTrans = {
                        id: `trans-${Date.now()}`,
                        title: 'Hydration & Damage Reversal',
                        beforeImage: '/images/before-after/smooth_before.jpg',
                        afterImage: '/images/before-after/smooth_after.jpg',
                        tag: 'Hydration',
                        productName: 'Sensein Damage Repair Conditioner',
                        productPrice: '₹1,299',
                        productLink: '/shop',
                      }
                      setFormData((prev) => ({
                        ...prev,
                        beforeAfter: {
                          ...prev.beforeAfter,
                          transformations: [
                            ...(prev.beforeAfter?.transformations || []),
                            newTrans,
                          ],
                        },
                      }))
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Comparison
                  </button>
                </div>

                <div className="space-y-4">
                  {(formData.beforeAfter?.transformations || []).map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-bold text-slate-900">
                          #{index + 1} {item.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            promptDelete(
                              'Delete Comparison Slider',
                              `Are you sure you want to delete comparison "${item.title || 'Comparison'}"?`,
                              () => {
                                setFormData((prev) => ({
                                  ...prev,
                                  beforeAfter: {
                                    ...prev.beforeAfter,
                                    transformations: (prev.beforeAfter?.transformations || []).filter(
                                      (_, i) => i !== index
                                    ),
                                  },
                                }))
                              }
                            )
                          }}
                          className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-700 mb-1 font-bold">
                            Transformation Title
                          </label>
                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setFormData((prev) => ({
                                ...prev,
                                beforeAfter: {
                                  ...prev.beforeAfter,
                                  transformations: (prev.beforeAfter?.transformations || []).map((t, i) =>
                                    i === index ? { ...t, title: val } : t
                                  ),
                                },
                              }))
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-bold focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-700 mb-1 font-bold">
                            Badge Tag
                          </label>
                          <input
                            type="text"
                            value={item.tag || ''}
                            placeholder="e.g. Frizz Defense"
                            onChange={(e) => {
                              const val = e.target.value
                              setFormData((prev) => ({
                                ...prev,
                                beforeAfter: {
                                  ...prev.beforeAfter,
                                  transformations: (prev.beforeAfter?.transformations || []).map((t, i) =>
                                    i === index ? { ...t, tag: val } : t
                                  ),
                                },
                              }))
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-mono focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-700 mb-1 font-bold">
                            Product Name Used
                          </label>
                          <input
                            type="text"
                            value={item.productName || ''}
                            placeholder="e.g. SENSEIN® Keratin Smoothing Serum"
                            onChange={(e) => {
                              const val = e.target.value
                              setFormData((prev) => ({
                                ...prev,
                                beforeAfter: {
                                  ...prev.beforeAfter,
                                  transformations: (prev.beforeAfter?.transformations || []).map((t, i) =>
                                    i === index ? { ...t, productName: val } : t
                                  ),
                                },
                              }))
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 focus:border-blue-600 focus:outline-none font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-700 mb-1 font-bold">
                            Product Price
                          </label>
                          <input
                            type="text"
                            value={item.productPrice || ''}
                            placeholder="e.g. ₹1,299"
                            onChange={(e) => {
                              const val = e.target.value
                              setFormData((prev) => ({
                                ...prev,
                                beforeAfter: {
                                  ...prev.beforeAfter,
                                  transformations: (prev.beforeAfter?.transformations || []).map((t, i) =>
                                    i === index ? { ...t, productPrice: val } : t
                                  ),
                                },
                              }))
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-mono focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-700 mb-1 font-bold">
                            Shop Now Destination Link
                          </label>
                          <input
                            type="text"
                            value={item.productLink || ''}
                            placeholder="e.g. /shop?category=haircare"
                            onChange={(e) => {
                              const val = e.target.value
                              setFormData((prev) => ({
                                ...prev,
                                beforeAfter: {
                                  ...prev.beforeAfter,
                                  transformations: (prev.beforeAfter?.transformations || []).map((t, i) =>
                                    i === index ? { ...t, productLink: val } : t
                                  ),
                                },
                              }))
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-mono focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <MediaUploadPicker
                            label="Before Photo"
                            category="before_after"
                            mediaType="image"
                            value={item.beforeImage || ''}
                            onChange={(url) => {
                              setFormData((prev) => ({
                                ...prev,
                                beforeAfter: {
                                  ...prev.beforeAfter,
                                  transformations: (prev.beforeAfter?.transformations || []).map((t, i) =>
                                    i === index ? { ...t, beforeImage: url } : t
                                  ),
                                },
                              }))
                            }}
                          />

                          <MediaUploadPicker
                            label="After Photo"
                            category="before_after"
                            mediaType="image"
                            value={item.afterImage || ''}
                            onChange={(url) => {
                              setFormData((prev) => ({
                                ...prev,
                                beforeAfter: {
                                  ...prev.beforeAfter,
                                  transformations: (prev.beforeAfter?.transformations || []).map((t, i) =>
                                    i === index ? { ...t, afterImage: url } : t
                                  ),
                                },
                              }))
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Trust & Brand Values */}
          {activeTab === 'brandValues' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Trust Guarantee &amp; Brand Values
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage the trust badges, icons, headings, and guarantee descriptions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newVal = {
                      id: `val-${Date.now()}`,
                      iconName: 'ShieldCheck',
                      title: 'Quality Guaranteed',
                      desc: 'Clinically tested and safe formulation.',
                    }
                    setFormData((prev) => ({
                      ...prev,
                      brandValues: {
                        ...prev.brandValues,
                        values: [...(prev.brandValues?.values || []), newVal],
                      },
                    }))
                  }}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Trust Feature
                </button>
              </div>

              {/* Section Tag & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Eyebrow Tag
                  </label>
                  <input
                    type="text"
                    value={formData.brandValues?.tag || ''}
                    placeholder="e.g. OUR TRUST GUARANTEE"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        brandValues: { ...prev.brandValues, tag: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={formData.brandValues?.title || ''}
                    placeholder="e.g. Why Choose Sensein?"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        brandValues: { ...prev.brandValues, title: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(formData.brandValues?.values || []).map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-blue-700">Feature #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            brandValues: {
                              ...prev.brandValues,
                              values: (prev.brandValues?.values || []).filter((_, i) => i !== index),
                            },
                          }))
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Icon
                      </label>
                      <select
                        value={item.iconName || 'ShieldCheck'}
                        onChange={(e) => {
                          const val = e.target.value
                          setFormData((prev) => ({
                            ...prev,
                            brandValues: {
                              ...prev.brandValues,
                              values: (prev.brandValues?.values || []).map((v, i) =>
                                i === index ? { ...v, iconName: val } : v
                              ),
                            },
                          }))
                        }}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-medium focus:border-blue-600 focus:outline-none"
                      >
                        <option value="ShieldCheck">ShieldCheck (Dermatologist Tested)</option>
                        <option value="Droplets">Droplets (Clean Formula / No Sulphates)</option>
                        <option value="Sparkles">Sparkles (Indian Hair / Gloss)</option>
                        <option value="Lock">Lock (Secure Logistics)</option>
                        <option value="Leaf">Leaf (Vegan / Cruelty Free)</option>
                        <option value="Award">Award (Salon Grade)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Heading</label>
                      <input
                        type="text"
                        value={item.title || ''}
                        placeholder="e.g. Dermatologically Tested"
                        onChange={(e) => {
                          const val = e.target.value
                          setFormData((prev) => ({
                            ...prev,
                            brandValues: {
                              ...prev.brandValues,
                              values: (prev.brandValues?.values || []).map((v, i) =>
                                i === index ? { ...v, title: val } : v
                              ),
                            },
                          }))
                        }}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-bold focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={item.desc || ''}
                        placeholder="Describe the trust value"
                        onChange={(e) => {
                          const val = e.target.value
                          setFormData((prev) => ({
                            ...prev,
                            brandValues: {
                              ...prev.brandValues,
                              values: (prev.brandValues?.values || []).map((v, i) =>
                                i === index ? { ...v, desc: val } : v
                              ),
                            },
                          }))
                        }}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 focus:border-blue-600 focus:outline-none font-medium leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: Instagram Feed */}
          {activeTab === 'instagramFeed' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Instagram className="h-5 w-5 text-blue-600" />
                  Social Proof &amp; Instagram Feed
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage Instagram handle, profile link, and spotlight photo gallery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={formData.instagramFeed?.handle || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instagramFeed: { ...formData.instagramFeed, handle: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 focus:border-blue-600 focus:bg-white focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Profile URL
                  </label>
                  <input
                    type="text"
                    value={formData.instagramFeed?.profileUrl || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instagramFeed: { ...formData.instagramFeed, profileUrl: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 font-mono focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Photo Grid Items</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(formData.instagramFeed?.posts || []).map((post, index) => (
                    <div
                      key={post.id || index}
                      className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2 shadow-xs"
                    >
                      <MediaUploadPicker
                        label={`Instagram Photo #${index + 1}`}
                        category="instagram"
                        mediaType="image"
                        value={post.image || ''}
                        onChange={(url) => {
                          const updated = [...formData.instagramFeed.posts]
                          updated[index].image = url
                          setFormData({
                            ...formData,
                            instagramFeed: { ...formData.instagramFeed, posts: updated },
                          })
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: Customer Reviews & Ratings */}
          {activeTab === 'customerReviews' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                    <Star className="h-5 w-5 text-blue-600" />
                    Customer Reviews &amp; Testimonials
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage featured customer testimonials, star ratings, avatar photos, and verified badges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newRev = {
                      id: `rev-${Date.now()}`,
                      name: 'Sneha Kapoor',
                      role: 'Verified Buyer',
                      location: 'Delhi, India',
                      rating: 5,
                      title: 'My hair feels exceptionally soft & lustrous!',
                      text: 'Best haircare product I have ever purchased. Highly recommended for daily routine.',
                      product: 'Sensein Damage Repair Shampoo',
                      avatar:
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                      verified: true,
                    }
                    setFormData((prev) => ({
                      ...prev,
                      customerReviews: {
                        ...prev.customerReviews,
                        reviews: [...(prev.customerReviews?.reviews || []), newRev],
                      },
                    }))
                  }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  Add Review
                </button>
              </div>

              {/* Section Header Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Eyebrow Tag
                  </label>
                  <input
                    type="text"
                    value={formData.customerReviews?.tag || ''}
                    placeholder="e.g. PROVEN RESULTS & LOVE"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerReviews: { ...prev.customerReviews, tag: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Header Title
                  </label>
                  <input
                    type="text"
                    value={formData.customerReviews?.title || ''}
                    placeholder="e.g. Loved by 25,000+ Indian Hair Routines"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerReviews: { ...prev.customerReviews, title: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Rating Summary Text
                  </label>
                  <input
                    type="text"
                    value={formData.customerReviews?.ratingSummary || ''}
                    placeholder="e.g. 4.95 / 5.0 Average Rating (1,400+ Reviews)"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerReviews: {
                          ...prev.customerReviews,
                          ratingSummary: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 font-mono focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {(formData.customerReviews?.reviews || []).map((rev, index) => (
                  <div
                    key={rev.id || index}
                    className="p-5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-900">
                        #{index + 1} {rev.name || 'Customer'} ({rev.rating || 5}★)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          promptDelete(
                            'Delete Customer Review',
                            `Are you sure you want to delete review by "${rev.name || 'Customer'}"?`,
                            () => {
                              setFormData((prev) => ({
                                ...prev,
                                customerReviews: {
                                  ...prev.customerReviews,
                                  reviews: (prev.customerReviews?.reviews || []).filter(
                                    (_, i) => i !== index
                                  ),
                                },
                              }))
                            }
                          )
                        }}
                        className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={rev.name || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              customerReviews: {
                                ...prev.customerReviews,
                                reviews: (prev.customerReviews?.reviews || []).map((r, i) =>
                                  i === index ? { ...r, name: val } : r
                                ),
                              },
                            }))
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-bold focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Location / City
                        </label>
                        <input
                          type="text"
                          value={rev.location || ''}
                          placeholder="e.g. Mumbai, Maharashtra"
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              customerReviews: {
                                ...prev.customerReviews,
                                reviews: (prev.customerReviews?.reviews || []).map((r, i) =>
                                  i === index ? { ...r, location: val } : r
                                ),
                              },
                            }))
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 focus:border-blue-600 focus:outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Role / Title
                        </label>
                        <input
                          type="text"
                          value={rev.role || ''}
                          placeholder="e.g. Verified Customer"
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              customerReviews: {
                                ...prev.customerReviews,
                                reviews: (prev.customerReviews?.reviews || []).map((r, i) =>
                                  i === index ? { ...r, role: val } : r
                                ),
                              },
                            }))
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 focus:border-blue-600 focus:outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Star Rating
                        </label>
                        <select
                          value={rev.rating || 5}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setFormData((prev) => ({
                              ...prev,
                              customerReviews: {
                                ...prev.customerReviews,
                                reviews: (prev.customerReviews?.reviews || []).map((r, i) =>
                                  i === index ? { ...r, rating: val } : r
                                ),
                              },
                            }))
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-bold focus:border-blue-600 focus:outline-none"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                          <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                          <option value={3}>⭐⭐⭐ (3 Stars)</option>
                          <option value={2}>⭐⭐ (2 Stars)</option>
                          <option value={1}>⭐ (1 Star)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Review Headline
                        </label>
                        <input
                          type="text"
                          value={rev.title || ''}
                          placeholder="Headline summarizing the review"
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              customerReviews: {
                                ...prev.customerReviews,
                                reviews: (prev.customerReviews?.reviews || []).map((r, i) =>
                                  i === index ? { ...r, title: val } : r
                                ),
                              },
                            }))
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-semibold focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Product Tag / Mentioned Product
                        </label>
                        <input
                          type="text"
                          value={rev.product || ''}
                          placeholder="e.g. Damage Repair Shampoo + Bond Mask"
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              customerReviews: {
                                ...prev.customerReviews,
                                reviews: (prev.customerReviews?.reviews || []).map((r, i) =>
                                  i === index ? { ...r, product: val } : r
                                ),
                              },
                            }))
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 font-mono focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <MediaUploadPicker
                          label="Customer Avatar Photo"
                          category="reviews"
                          mediaType="image"
                          value={rev.avatar || ''}
                          onChange={(url) => {
                            setFormData((prev) => ({
                              ...prev,
                              customerReviews: {
                                ...prev.customerReviews,
                                reviews: (prev.customerReviews?.reviews || []).map((r, i) =>
                                  i === index ? { ...r, avatar: url } : r
                                ),
                              },
                            }))
                          }}
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Full Review Feedback
                        </label>
                        <textarea
                          rows={3}
                          value={rev.text || ''}
                          placeholder="Full detailed review text from customer"
                          onChange={(e) => {
                            const val = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              customerReviews: {
                                ...prev.customerReviews,
                                reviews: (prev.customerReviews?.reviews || []).map((r, i) =>
                                  i === index ? { ...r, text: val } : r
                                ),
                              },
                            }))
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2 focus:border-blue-600 focus:outline-none font-medium leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={() => {
          if (deleteModal.onConfirm) deleteModal.onConfirm()
        }}
        title={deleteModal.title}
        message={deleteModal.message}
        confirmText="Yes, Delete"
      />

      {/* Before vs After Update History & Excel Export Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    Front Page CMS Change Log &amp; Sheet Comparison
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track all modifications: what was there <strong className="text-rose-600">Before Update</strong> vs what is active <strong className="text-emerald-600">After Update</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadExcelCsv}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Search Bar & View Mode Toggle */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by section name, field, or URL..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none font-medium transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setHistoryViewMode('all_sections')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    historyViewMode === 'all_sections'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All 11 Sections Master
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryViewMode('changes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    historyViewMode === 'changes'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Recent Changes ({historyLogs.length})
                </button>
              </div>
            </div>

            {/* Modal Body: Comparison Table */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {historyViewMode === 'all_sections' ? (
                /* Tab 1: Comprehensive Master Sheet for ALL 11 SECTIONS */
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      All 11 Homepage CMS Sections (Full Itemized Master Sheet)
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      Live Status: ACTIVE
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="py-2.5 px-4 w-1/5">Section (વિભાગ)</th>
                          <th className="py-2.5 px-4 w-1/5">Category / Item (કેટેગરી / આઇટમ)</th>
                          <th className="py-2.5 px-4 w-1/5">Property / Link</th>
                          <th className="py-2.5 px-4 w-2/5 text-emerald-700 bg-emerald-50/40">
                            🟢 Current Live Active Data (હાલ ત્યાં શું પડ્યું છે)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData ? (
                          extractAllCmsItems(formData)
                            .filter((item) => {
                              if (!historySearch) return true
                              const q = historySearch.toLowerCase()
                              return (
                                item.section.toLowerCase().includes(q) ||
                                item.categoryOrItem.toLowerCase().includes(q) ||
                                item.property.toLowerCase().includes(q) ||
                                item.value.toLowerCase().includes(q)
                              )
                            })
                            .map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-2.5 px-4 font-bold text-slate-800">
                                  {item.section}
                                </td>
                                <td className="py-2.5 px-4 font-semibold text-blue-700">
                                  {item.categoryOrItem}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                                  {item.property}
                                </td>
                                <td className="py-2.5 px-4 bg-emerald-50/20 text-emerald-950 font-mono text-[11px] font-semibold break-all">
                                  {item.value}
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="p-4 text-center text-slate-400">
                              Loading sections data...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Tab 2: Recent Before vs After Changes Logs */
                historyLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <History className="h-10 w-10 mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No previous change logs recorded yet.</p>
                    <p className="text-xs text-slate-400">
                      Whenever you edit and save any content in Front Page CMS, all Before vs After comparisons and newly added categories will automatically appear here and in the Excel export.
                    </p>
                  </div>
                ) : (
                  historyLogs.map((log) => {
                    const changes = log.details?.changes || []
                    const filteredChanges = changes.filter((c) => {
                      if (!historySearch) return true
                      const q = historySearch.toLowerCase()
                      return (
                        (c.section && c.section.toLowerCase().includes(q)) ||
                        (c.categoryOrItem && c.categoryOrItem.toLowerCase().includes(q)) ||
                        (c.property && c.property.toLowerCase().includes(q)) ||
                        (c.beforeValue && c.beforeValue.toLowerCase().includes(q)) ||
                        (c.afterValue && c.afterValue.toLowerCase().includes(q))
                      )
                    })

                    if (historySearch && filteredChanges.length === 0) return null

                    return (
                      <div
                        key={log._id}
                        className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white"
                      >
                        {/* Log Card Header */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold text-[11px]">
                              {log.action}
                            </span>
                            <span className="font-bold text-slate-900">{log.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                            <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                            <span>•</span>
                            <span className="text-slate-700 font-semibold">{log.performerEmail}</span>
                          </div>
                        </div>

                        {/* Detailed Changes Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <tr>
                                <th className="py-2.5 px-4 w-1/4">Section &amp; Category/Item</th>
                                <th className="py-2.5 px-4 w-1/3 text-rose-700 bg-rose-50/40">
                                  🔴 Before Update (પહેલાં શું હતું)
                                </th>
                                <th className="py-2.5 px-4 w-1/3 text-emerald-700 bg-emerald-50/40">
                                  🟢 After Update (હાલ ત્યાં શું છે)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredChanges.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="p-4 text-center text-slate-400">
                                    Full homepage snapshot recorded.
                                  </td>
                                </tr>
                              ) : (
                                filteredChanges.map((c, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-2.5 px-4">
                                      <div className="font-bold text-slate-800">{c.section}</div>
                                      <div className="text-xs font-semibold text-blue-700">{c.categoryOrItem || c.field}</div>
                                      {c.property && <div className="text-[10px] font-mono text-slate-400">{c.property}</div>}
                                    </td>
                                    <td className="py-2.5 px-4 bg-rose-50/20 text-rose-950 font-mono text-[11px] break-all">
                                      {c.beforeValue || '(Empty)'}
                                    </td>
                                    <td className="py-2.5 px-4 bg-emerald-50/20 text-emerald-950 font-mono text-[11px] font-semibold break-all">
                                      {c.afterValue || '(Empty)'}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>All CMS edits are permanently archived for recovery &amp; telemetry audits.</span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
