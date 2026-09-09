import mongoose from 'mongoose'

const slideSchema = new mongoose.Schema({
  id: { type: String, default: () => `slide-${Date.now()}` },
  type: { type: String, enum: ['video', 'image'], default: 'image' },
  videoSrc: { type: String, default: '' },
  poster: { type: String, default: '' },
  image: { type: String, default: '' },
  showLogo: { type: Boolean, default: true },
  logoImage: { type: String, default: '/images/sensein-logo-white.png' },
  logoSubtitle: { type: String, default: 'PROFESSIONAL MEN' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  showBtn: { type: Boolean, default: true },
  btnText: { type: String, default: 'Shop Now' },
  btnLink: { type: String, default: '/shop' },
  btnBgColor: { type: String, default: '#5A3859' },
  btnTextColor: { type: String, default: '#ffffff' },
})

const concernCardSchema = new mongoose.Schema({
  id: { type: String, default: () => `concern-${Date.now()}` },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  link: { type: String, default: '/shop' },
  badge: { type: String, default: 'RECOMMENDED' },
})

const videoReelSchema = new mongoose.Schema({
  id: { type: String, default: () => `reel-${Date.now()}` },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  productName: { type: String, default: '' },
  price: { type: String, default: '₹999' },
  videoSrc: { type: String, default: '' },
  poster: { type: String, default: '' },
  productLink: { type: String, default: '/shop' },
  rating: { type: String, default: '5.0 ★' },
  tag: { type: String, default: 'BESTSELLER' },
})

const statSchema = new mongoose.Schema({
  value: { type: String, default: '' },
  label: { type: String, default: '' },
})

const transformationSchema = new mongoose.Schema({
  id: { type: String, default: () => `trans-${Date.now()}` },
  title: { type: String, default: '' },
  productName: { type: String, default: 'SENSEIN® Botanical Formulation' },
  productPrice: { type: String, default: '₹1,199' },
  productLink: { type: String, default: '/shop' },
  tag: { type: String, default: 'CLINICAL TRANSFORMATION' },
  beforeImage: { type: String, default: '' },
  afterImage: { type: String, default: '' },
})

const brandValueSchema = new mongoose.Schema({
  iconName: { type: String, default: 'ShieldCheck' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
})

const instagramPostSchema = new mongoose.Schema({
  id: { type: String, default: () => `insta-${Date.now()}` },
  image: { type: String, default: '' },
  handle: { type: String, default: '@sensein.india' },
})

const reviewSchema = new mongoose.Schema({
  id: { type: String, default: () => `rev-${Date.now()}` },
  name: { type: String, default: '' },
  role: { type: String, default: 'Verified Customer' },
  location: { type: String, default: 'India' },
  rating: { type: Number, default: 5 },
  title: { type: String, default: '' },
  text: { type: String, default: '' },
  product: { type: String, default: '' },
  avatar: { type: String, default: '' },
  verified: { type: Boolean, default: true },
})

const homepageConfigSchema = new mongoose.Schema(
  {
    configKey: { type: String, default: 'default_homepage', unique: true },

    // Section Visibility Toggles
    visibility: {
      announcementBar: { type: Boolean, default: true },
      heroSlider: { type: Boolean, default: true },
      missionQuote: { type: Boolean, default: true },
      bestSellers: { type: Boolean, default: true },
      shopByConcern: { type: Boolean, default: true },
      realResults: { type: Boolean, default: true },
      beforeAfter: { type: Boolean, default: true },
      brandValues: { type: Boolean, default: true },
      instagramFeed: { type: Boolean, default: true },
      customerReviews: { type: Boolean, default: true },
    },

    // 1. Announcement Bar
    announcementBar: {
      enabled: { type: Boolean, default: true },
      messages: {
        type: [String],
        default: [
          '✨ FREE EXPRESS SHIPPING ON ALL PREPAID ORDERS OVER ₹999 ✨',
          '🌿 100% CLEAN, SULPHATE-FREE FORMULAS TESTED FOR INDIAN HAIR 🌿',
          '🔥 USE CODE SENSEIN10 FOR FLAT 10% OFF YOUR FIRST ORDER 🔥',
        ],
      },
    },

    // 2. Hero Slider
    heroSlider: {
      slides: {
        type: [slideSchema],
        default: [
          {
            id: 'slide-1',
            type: 'video',
            videoSrc: '/hero-video.mp4',
            poster: '/images/hero1.jpg',
            showLogo: true,
            logoImage: '/images/sensein-logo-white.png',
            logoSubtitle: 'PROFESSIONAL MEN',
            title: 'REPAIR DAMAGE. RESTORE LIFE.',
            description:
              'For Stronger, Healthier, Shinier Hair. Gentle Cleansing, Nourishing the Scalp, Split End Prevention & Moisture Restoration.',
            showBtn: true,
            btnText: 'EXPLORE COLLECTION',
            btnLink: '/shop?category=haircare',
            btnBgColor: '#5A3859',
            btnTextColor: '#ffffff',
          },
          {
            id: 'slide-2',
            type: 'image',
            image: '/images/hero2.jpg',
            showLogo: true,
            logoImage: '/images/sensein-logo-white.png',
            logoSubtitle: 'PROFESSIONAL MEN',
            title: 'Professional Solution for Damaged Hair',
            description:
              'Enriched with botanical extracts for deep moisture restoration, softness, and complete hair life restoration.',
            showBtn: true,
            btnText: 'EXPLORE COLLECTION',
            btnLink: '/shop?category=haircare',
            btnBgColor: '#5A3859',
            btnTextColor: '#ffffff',
          },
          {
            id: 'slide-3',
            type: 'image',
            image: '/images/hero3.jpg',
            showLogo: true,
            logoImage: '/images/sensein-logo-white.png',
            logoSubtitle: 'PROFESSIONAL MEN',
            title: 'Restores Lost Moisture & Softness',
            description:
              'Gentle cleansing without stripping natural moisture. Cleanses without stripping natural scalp barrier.',
            showBtn: true,
            btnText: 'SHOP ALL PRODUCTS',
            btnLink: '/shop',
            btnBgColor: '#5A3859',
            btnTextColor: '#ffffff',
          },
        ],
      },
    },

    // 3. Mission Quote
    missionQuote: {
      badgeText: { type: String, default: 'CLEAN BEAUTY PHILOSOPHY' },
      mainHeadingPrefix: { type: String, default: '100% clean, salon-quality formulas' },
      highlightText: { type: String, default: 'intentionally engineered' },
      mainHeadingSuffix: { type: String, default: 'for real Indian hair textures.' },
    },

    // 4. Shop By Concern
    shopByConcern: {
      tag: { type: String, default: 'TARGETED FORMULATION' },
      title: { type: String, default: 'Shop by Hair Concern' },
      description: {
        type: String,
        default: 'Customized routines engineered for Indian hair textures and climate challenges.',
      },
      concerns: {
        type: [concernCardSchema],
        default: [
          {
            id: 'frizz',
            title: 'Frizz & Dryness Control',
            description:
              'Nourishes dry, porous hair strands with botanical silk oils to seal humidity out.',
            image:
              'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
            link: '/shop?category=hair-concern&concern=frizz',
            badge: 'MOST POPULAR',
          },
          {
            id: 'damage',
            title: 'Damage & Bond Repair',
            description:
              'Rebuilds broken disulfide bonds from core to cuticle for resilient, healthy hair.',
            image:
              'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80',
            link: '/shop?category=hair-concern&concern=damage',
            badge: 'CLINICALLY PROVEN',
          },
          {
            id: 'scalp',
            title: 'Scalp Detox & Density',
            description:
              'Gently clarifies mineral residue, excess sebum, and flakes for a refreshed scalp environment.',
            image:
              'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
            link: '/shop?category=hair-concern&concern=scalp',
            badge: 'HARD WATER SHIELD',
          },
          {
            id: 'color',
            title: 'Color Protect & Shine',
            description:
              'Shields color pigment from fading and oxidation while restoring high-shine reflectivity.',
            image:
              'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
            link: '/shop?category=hair-concern&concern=color',
            badge: 'SALON CARE',
          },
        ],
      },
    },

    // 5. Real Results 3D Video Showcase
    realResults: {
      tag: { type: String, default: 'REAL PEOPLE. REAL RESULTS.' },
      title: { type: String, default: 'See Sensein In Action' },
      description: {
        type: String,
        default: 'Watch real routine transformations powered by clean botanical science.',
      },
      buttonText: { type: String, default: 'Shop All Bestsellers' },
      buttonLink: { type: String, default: '/shop?filter=bestseller' },
      videoCards: {
        type: [videoReelSchema],
        default: [
          {
            id: 'reel-1',
            title: 'Color Pro Combo',
            subtitle: 'Repair & protection for color-treated hair',
            productName: 'SENSEIN® Damage Repair Shampoo',
            price: '₹1,299',
            videoSrc: '/hero-video.mp4',
            poster: '/images/hero1.jpg',
            productLink: '/product/sensein-damage-repair-shampoo',
            rating: '4.9 ★',
            tag: 'BESTSELLER',
          },
          {
            id: 'reel-2',
            title: 'Argan Combo',
            subtitle: 'Smoothness, shine & frizz control',
            productName: 'SENSEIN® Anti-Frizz Gloss Serum',
            price: '₹999',
            videoSrc:
              'https://assets.mixkit.co/videos/preview/mixkit-woman-touching-her-long-hair-41551-large.mp4',
            poster: '/images/hero2.jpg',
            productLink: '/product/sensein-anti-frizz-gloss-serum',
            rating: '5.0 ★',
            tag: 'HOT DROP',
          },
          {
            id: 'reel-3',
            title: 'Hydro-Repair Mask',
            subtitle: 'Deep hydration & cuticle seal',
            productName: 'SENSEIN® Intense Repair Mask',
            price: '₹1,499',
            videoSrc: '/hero-video.mp4',
            poster: '/images/sensein-mask.jpg',
            productLink: '/product/sensein-intense-bond-repair-mask',
            rating: '4.9 ★',
            tag: 'SALON CARE',
          },
          {
            id: 'reel-4',
            title: 'Scalp SOS & Detox',
            subtitle: 'Hard water mineral shield & scalp clarity',
            productName: 'SENSEIN® Scalp Shield Serum',
            price: '₹1,199',
            videoSrc:
              'https://assets.mixkit.co/videos/preview/mixkit-woman-touching-her-long-hair-41551-large.mp4',
            poster: '/images/sensein-serum.jpg',
            productLink: '/product/sensein-scalp-shield-serum',
            rating: '4.8 ★',
            tag: 'NEW LAUNCH',
          },
          {
            id: 'reel-5',
            title: 'Royal Amber Mist',
            subtitle: 'Luxury alcohol-free hair mist & glass shine',
            productName: 'SENSEIN® Royal Amber Hair Perfume',
            price: '₹1,850',
            videoSrc: '/hero-video.mp4',
            poster: '/images/sensein-perfume.jpg',
            productLink: '/product/sensein-royal-amber-perfume',
            rating: '4.9 ★',
            tag: 'LUXURY ESSENCE',
          },
        ],
      },
    },

    // 6. Digits Don't Lie & Clinical Before/After
    beforeAfter: {
      titlePrefix: { type: String, default: 'DIGITS' },
      titleHighlight: { type: String, default: "DON'T LIE" },
      footnote: { type: String, default: '*based on Independent Clinical Studies, 2026' },
      stats: {
        type: [statSchema],
        default: [
          { value: '97%', label: 'wave or curl hold all day long' },
          { value: '92%', label: 'better hair definition' },
          { value: '48%', label: 'reduction in hair dryness' },
        ],
      },
      transformations: {
        type: [transformationSchema],
        default: [
          {
            id: 'trans-1',
            title: 'Frizz & Wavy to Mirror-Smooth Glass Hair',
            beforeImage: '/images/before-after/smooth_before.jpg',
            afterImage: '/images/before-after/smooth_after.jpg',
          },
          {
            id: 'trans-2',
            title: 'Dry Strands to Defined Bouncy Curls',
            beforeImage: '/images/before-after/curl_before.jpg',
            afterImage: '/images/before-after/curl_after.jpg',
          },
          {
            id: 'trans-3',
            title: 'Messy Bedhead to Matte Textured Wax Styling',
            beforeImage: '/images/before-after/wax_before.jpg',
            afterImage: '/images/before-after/wax_after.jpg',
          },
        ],
      },
    },

    // 7. Trust & Brand Values Bar
    brandValues: {
      tag: { type: String, default: 'OUR TRUST GUARANTEE' },
      title: { type: String, default: 'Why Choose Sensein?' },
      values: {
        type: [brandValueSchema],
        default: [
          {
            iconName: 'ShieldCheck',
            title: 'Dermatologically Tested',
            desc: 'Gentle and clinically safe for regular hair care routines',
          },
          {
            iconName: 'Droplets',
            title: 'No Sulphates • No Parabens',
            desc: 'Clean formulas that protect scalp health and moisture barrier',
          },
          {
            iconName: 'Sparkles',
            title: 'Made for Indian Hair',
            desc: 'Engineered for heat, humidity, hard water & urban pollution',
          },
          {
            iconName: 'Lock',
            title: 'Secure Shiprocket Logistics',
            desc: 'Fast express delivery, live tracking & reliable COD option',
          },
        ],
      },
    },

    // 8. Instagram Feed
    instagramFeed: {
      handle: { type: String, default: '@SENSEIN.INDIA' },
      profileUrl: { type: String, default: 'https://www.instagram.com/sensein.india' },
      title: { type: String, default: '#SenseinHairCare Routine Spotlights' },
      posts: {
        type: [instagramPostSchema],
        default: [
          {
            id: 'insta-1',
            image:
              'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80',
            handle: '@sensein.india',
          },
          {
            id: 'insta-2',
            image:
              'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=500&q=80',
            handle: '@sensein.india',
          },
          {
            id: 'insta-3',
            image:
              'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=500&q=80',
            handle: '@sensein.india',
          },
          {
            id: 'insta-4',
            image:
              'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=500&q=80',
            handle: '@sensein.india',
          },
        ],
      },
    },

    // 9. Customer Reviews
    customerReviews: {
      tag: { type: String, default: 'PROVEN RESULTS & LOVE' },
      title: { type: String, default: 'Loved by 25,000+ Indian Hair Routines' },
      ratingSummary: {
        type: String,
        default: '4.95 / 5.0 Average Rating (1,400+ Reviews)',
      },
      reviews: {
        type: [reviewSchema],
        default: [
          {
            id: 'rev-1',
            name: 'Ananya Deshmukh',
            role: 'Verified Customer',
            location: 'Mumbai, Maharashtra',
            rating: 5,
            title: 'Completely transformed my frizz & hard water damage!',
            text: 'Living in Mumbai with hard tap water made my hair rough and dry. After 2 weeks of using Sensein Damage Repair shampoo and mask, my hair feels like salon silk. Worth every single rupee.',
            product: 'Damage Repair Shampoo + Bond Mask',
            avatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            verified: true,
          },
          {
            id: 'rev-2',
            name: 'Dr. Priya Mehta',
            role: 'Trichologist & Verified Buyer',
            location: 'Bengaluru, Karnataka',
            rating: 5,
            title: 'Clean botanical chemistry with genuine results.',
            text: 'As a hair specialist, I analyze ingredient ratios strictly. Sensein uses biomimetic botanical keratins and lipid barrier restorers that genuinely protect hair without heavy chemical build-up.',
            product: 'Intense Bond Repair Mask',
            avatar:
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
            verified: true,
          },
          {
            id: 'rev-3',
            name: 'Rhea Sengupta',
            role: 'Verified Customer',
            location: 'Kolkata, West Bengal',
            rating: 5,
            title: 'The Anti-Frizz Gloss Serum gives glass-like shine.',
            text: 'I have naturally wavy, humid-sensitive hair. Just 2 pumps of this serum on damp hair locks in shine and keeps frizz away for 3 whole days. Smells heavenly!',
            product: 'Anti-Frizz Gloss Serum',
            avatar:
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
            verified: true,
          },
        ],
      },
    },
  },
  { timestamps: true }
)

const HomepageConfig = mongoose.model('HomepageConfig', homepageConfigSchema)
export default HomepageConfig
