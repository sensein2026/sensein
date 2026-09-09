import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const categories = [
  {
    id: 'shampoo',
    slug: 'shampoo',
    title: 'Sulphate-Free Shampoos',
    subtitle: 'Gentle cleansing & scalp health',
    image: '/images/hero3.jpg',
    itemCount: '2 Products',
  },
  {
    id: 'serum-mask',
    slug: 'serum',
    title: 'Serums & Treatment Masks',
    subtitle: '72-hr anti-frizz & bond repair',
    image: '/images/product1.jpg',
    itemCount: '2 Products',
  },
  {
    id: 'wax',
    slug: 'wax',
    title: 'Styling Waxes (Clay, Gel & Cream)',
    subtitle: 'Matte clay, sleek gel & cream wax',
    image: '/images/product2.jpg',
    itemCount: '3 Varieties',
  },
  {
    id: 'travel-kit',
    slug: 'travelling-kit',
    title: 'Travelling Kits & Bundles',
    subtitle: '5-piece complete luxury pouches',
    image: '/images/hero1.jpg',
    itemCount: '2 Kits',
  },
]

export default function FeaturedCategories() {
  return (
    <section className="py-20 bg-ivory">
      <div className="container-page">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-charcoal/10 pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-rosegold-dark font-semibold">
              Curated Collections
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-charcoal mt-1">
              Explore Skincare Rituals
            </h2>
          </div>
          <Link
            to="/shop"
            className="mt-4 sm:mt-0 text-xs font-semibold uppercase tracking-wider text-charcoal hover:text-rosegold-dark flex items-center gap-1 group"
          >
            View All Categories{' '}
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Link
                to={`/shop?category=${cat.slug}`}
                className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer shadow-soft bg-charcoal block"
              >
                {/* Card Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/95" />

                {/* Top Tag */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="rounded-full bg-white/25 backdrop-blur-md px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-white border border-white/20">
                    {cat.itemCount}
                  </span>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-6 z-10 flex flex-col justify-end text-white">
                  <span className="text-xs uppercase tracking-widest text-nude-200 font-medium">
                    {cat.subtitle}
                  </span>
                  <h3 className="font-display text-2xl font-medium mt-1 leading-snug">
                    {cat.title}
                  </h3>

                  <div className="mt-4 flex items-center text-xs font-semibold uppercase tracking-wider text-rosegold-light opacity-90 group-hover:opacity-100 group-hover:text-white transition-colors">
                    <span>Shop Collection</span>
                    <ArrowUpRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
