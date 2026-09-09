import mongoose from 'mongoose'
import dns from 'dns'
import { env } from '../config/env.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'

try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch {}

const categories = [
  {
    name: 'Shampoo',
    slug: 'shampoo',
    description: 'Sulphate-free gentle cleansers engineered for scalp nourishment & hair strength.',
    image: '/images/hero3.jpg',
  },
  {
    name: 'Mask',
    slug: 'mask',
    description: 'Deep conditioning & bond-repair treatment masks for intense moisture.',
    image: '/images/product1.jpg',
  },
  {
    name: 'Serum',
    slug: 'serum',
    description: 'Lightweight gloss elixirs for 72hr anti-frizz and cuticle repair.',
    image: '/images/product2.jpg',
  },
  {
    name: 'Perfume',
    slug: 'perfume',
    description: 'Artisanal hair & body mists infused with luxurious botanical notes.',
    image: '/images/hero2.jpg',
  },
  {
    name: 'Cream',
    slug: 'cream',
    description: 'Nourishing leave-in creams that define waves and soften dry ends.',
    image: '/images/hero1.jpg',
  },
  {
    name: 'Facewash',
    slug: 'facewash',
    description: 'Gentle bio-active facewashes for refreshed, balanced pores.',
    image: '/images/product1.jpg',
  },
  {
    name: 'Styling Wax',
    slug: 'wax',
    description: 'Professional hair styling waxes (Clay, Gel & Cream).',
    image: '/images/product2.jpg',
  },
  {
    name: 'Clay Wax',
    slug: 'wax-clay',
    description: 'Ultra matte finish, strong moldable hold for natural textured styles.',
    image: '/images/product2.jpg',
  },
  {
    name: 'Gel Wax',
    slug: 'wax-gel',
    description: 'High gloss shine with firm, flake-free hold for sleek styling.',
    image: '/images/product1.jpg',
  },
  {
    name: 'Cream Wax',
    slug: 'wax-cream',
    description: 'Light touchable hold with natural shine for soft, flexible control.',
    image: '/images/hero1.jpg',
  },
  {
    name: 'Travelling Kit',
    slug: 'travelling-kit',
    description: 'TSA-approved complete haircare & grooming ritual kits in mini pouches.',
    image: '/images/hero3.jpg',
  },
  {
    name: 'Oil',
    slug: 'oil',
    description: 'Botanical champi oils & cold-pressed scalp boosters for density.',
    image: '/images/hero1.jpg',
  },
  {
    name: 'Powder',
    slug: 'powder',
    description: 'Instant root lift, matte texture, and oil-absorbing styling powders.',
    image: '/images/hero2.jpg',
  },
]

const products = [
  // 1. SHAMPOO
  {
    name: 'SENSEIN® Damage Repair Shampoo',
    slug: 'sensein-damage-repair-shampoo',
    categorySlug: 'shampoo',
    price: 1299,
    compareAtPrice: 1599,
    description: 'Repair Damage. Restore Life. Professional Solution for Damaged Hair featuring 4-in-1 Benefits: Gentle Cleansing, Scalp Nourishment, Split End Prevention, and Moisture Restoration.',
    shortDescription: 'Sulphate-free gentle cleansing & bond restoration for Indian hair.',
    mainImage: '/images/sensein-shampoo.jpg',
    gallery: ['/images/sensein-shampoo.jpg', '/images/product1.jpg'],
    stock: 50,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 320,
  },
  {
    name: 'SENSEIN® Moisture Lock Shampoo',
    slug: 'sensein-moisture-lock-shampoo',
    categorySlug: 'shampoo',
    price: 1199,
    compareAtPrice: 1450,
    description: 'Hydrates dry, coarse hair without stripping natural oils. Formulated with Hyaluronic Acid and Rice Keratin.',
    shortDescription: '72hr hydration & frizz control for coarse hair.',
    mainImage: '/images/sensein-shampoo.jpg',
    gallery: ['/images/sensein-shampoo.jpg', '/images/hero3.jpg'],
    stock: 40,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 190,
  },

  // 2. MASK
  {
    name: 'SENSEIN® Intense Bond Repair Mask',
    slug: 'sensein-intense-bond-repair-mask',
    categorySlug: 'mask',
    price: 1499,
    compareAtPrice: 1899,
    description: 'Deep conditioning treatment that penetrates damaged cuticles to rebuild broken disulfide bonds.',
    shortDescription: 'Deep bond repair & cuticle sealing mask.',
    mainImage: '/images/sensein-mask.jpg',
    gallery: ['/images/sensein-mask.jpg', '/images/product2.jpg'],
    stock: 35,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 210,
  },

  // 3. SERUM
  {
    name: 'SENSEIN® Anti-Frizz Gloss Hair Serum',
    slug: 'sensein-anti-frizz-gloss-serum',
    categorySlug: 'serum',
    price: 999,
    compareAtPrice: 1299,
    description: 'Lightweight gloss serum that tames stubborn flyaways and shields against hard water mineral buildup.',
    shortDescription: 'Silky glass-shine serum & heat protectant.',
    mainImage: '/images/sensein-serum.jpg',
    gallery: ['/images/sensein-serum.jpg', '/images/hero1.jpg'],
    stock: 60,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 410,
  },

  // 4. PERFUME
  {
    name: 'SENSEIN® Royal Amber Hair & Body Perfume',
    slug: 'sensein-royal-amber-perfume',
    categorySlug: 'perfume',
    price: 1850,
    compareAtPrice: 2200,
    description: 'Alcohol-free hair and body perfume mist with delicate notes of Damask Rose, Amber, and Cedarwood.',
    shortDescription: 'Long-lasting alcohol-free luxury hair mist.',
    mainImage: '/images/sensein-perfume.jpg',
    gallery: ['/images/sensein-perfume.jpg', '/images/hero3.jpg'],
    stock: 25,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 145,
  },

  // 5. CREAM
  {
    name: 'SENSEIN® Hydrating Leave-In Hair Cream',
    slug: 'sensein-hydrating-leave-in-cream',
    categorySlug: 'cream',
    price: 899,
    compareAtPrice: 1100,
    description: 'Weightless leave-in cream for soft waves, curls, and smooth blowouts without stiffness or crunch.',
    shortDescription: 'Crunch-free leave-in hydration cream.',
    mainImage: '/images/hero1.jpg',
    gallery: ['/images/hero1.jpg', '/images/product2.jpg'],
    stock: 45,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 180,
  },

  // 6. FACEWASH
  {
    name: 'SENSEIN® Botanical Clarifying Facewash',
    slug: 'sensein-botanical-clarifying-facewash',
    categorySlug: 'facewash',
    price: 699,
    compareAtPrice: 899,
    description: 'Gentle bio-active facewash with Tea Tree and Salicylic Acid to clear impurities and soothe pores.',
    shortDescription: 'Sulphate-free deep pore clarifying facewash.',
    mainImage: '/images/product1.jpg',
    gallery: ['/images/product1.jpg', '/images/hero2.jpg'],
    stock: 50,
    isFeatured: false,
    rating: 4.7,
    reviewsCount: 130,
  },

  // 7. WAX CATEGORY (CLAY, GEL, CREAM)
  {
    name: 'SENSEIN® Matte Finish Clay Wax',
    slug: 'sensein-matte-finish-clay-wax',
    categorySlug: 'wax-clay',
    price: 799,
    compareAtPrice: 999,
    description: 'Strong moldable hold with zero shine. Ideal for textured modern cuts and natural look styles.',
    shortDescription: 'Kaolin clay matte wax for high texture & strong hold.',
    mainImage: '/images/product2.jpg',
    gallery: ['/images/product2.jpg', '/images/hero1.jpg'],
    stock: 40,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 260,
  },
  {
    name: 'SENSEIN® High Gloss Gel Wax',
    slug: 'sensein-high-gloss-gel-wax',
    categorySlug: 'wax-gel',
    price: 799,
    compareAtPrice: 999,
    description: 'Combines the shine of a gel with the pliable control of a wax. Non-flaking and easy to rinse out.',
    shortDescription: 'High shine sleek gel wax with firm hold.',
    mainImage: '/images/product1.jpg',
    gallery: ['/images/product1.jpg', '/images/product2.jpg'],
    stock: 35,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 175,
  },
  {
    name: 'SENSEIN® Soft Touch Cream Wax',
    slug: 'sensein-soft-touch-cream-wax',
    categorySlug: 'wax-cream',
    price: 749,
    compareAtPrice: 950,
    description: 'Lightweight cream wax for natural flexibility, frizz control, and touchable softness.',
    shortDescription: 'Natural shine cream wax for light flexible styling.',
    mainImage: '/images/hero1.jpg',
    gallery: ['/images/hero1.jpg', '/images/hero3.jpg'],
    stock: 30,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 110,
  },

  // 8. TRAVELLING KIT
  {
    name: 'SENSEIN® Complete Hair & Care Travel Kit',
    slug: 'sensein-complete-travel-kit',
    categorySlug: 'travelling-kit',
    price: 1999,
    compareAtPrice: 2499,
    description: 'TSA-approved 5-piece travel kit containing Mini Shampoo, Mask, Serum, Oil, and Styling Wax in a waterproof pouch.',
    shortDescription: '5-piece luxury travel kit in waterproof pouch.',
    mainImage: '/images/hero3.jpg',
    gallery: ['/images/hero3.jpg', '/images/product1.jpg'],
    stock: 20,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 310,
  },

  // 9. OIL
  {
    name: 'SENSEIN® Power Champi Scalp Oil',
    slug: 'sensein-power-champi-scalp-oil',
    categorySlug: 'oil',
    price: 899,
    compareAtPrice: 1199,
    description: 'Nourishing hot oil blend with Bhringraj, Rosemary, and Cold-Pressed Coconut for root density and growth.',
    shortDescription: 'Traditional ayurvedic scalp oil with Rosemary & Bhringraj.',
    mainImage: '/images/hero1.jpg',
    gallery: ['/images/hero1.jpg', '/images/product2.jpg'],
    stock: 50,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 290,
  },

  // 10. POWDER
  {
    name: 'SENSEIN® Instant Volume Styling Powder',
    slug: 'sensein-instant-volume-powder',
    categorySlug: 'powder',
    price: 699,
    compareAtPrice: 899,
    description: 'Dusting styling powder that instantly absorbs scalp oil and creates gravity-defying root volume.',
    shortDescription: 'Instant root lift & matte volume dusting powder.',
    mainImage: '/images/hero2.jpg',
    gallery: ['/images/hero2.jpg', '/images/product1.jpg'],
    stock: 45,
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 220,
  },
]

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.log('🌱 Connected to MongoDB for seeding...')

    await Category.deleteMany({})
    await Product.deleteMany({})

    const createdCategories = await Category.insertMany(categories)
    console.log(`✅ Seeded ${createdCategories.length} categories`)

    const categoryMap = {}
    createdCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id
    })

    const productsToInsert = products.map((p) => {
      const { categorySlug, ...rest } = p
      return {
        ...rest,
        category: categoryMap[categorySlug],
      }
    })

    const createdProducts = await Product.insertMany(productsToInsert)
    console.log(`✅ Seeded ${createdProducts.length} products with reliable high quality images`)

    console.log('🎉 Database seeding complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  }
}

seed()
