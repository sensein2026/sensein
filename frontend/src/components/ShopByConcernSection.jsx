import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const defaultConcerns = [
  {
    id: 'frizz',
    title: 'Frizz & Dryness Control',
    description: 'Nourishes dry, porous hair strands with botanical silk oils to seal humidity out.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    link: '/shop?category=hair-concern&concern=frizz',
    badge: 'MOST POPULAR',
  },
  {
    id: 'damage',
    title: 'Damage & Bond Repair',
    description: 'Rebuilds broken disulfide bonds from core to cuticle for resilient, healthy hair.',
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80',
    link: '/shop?category=hair-concern&concern=damage',
    badge: 'CLINICALLY PROVEN',
  },
  {
    id: 'scalp',
    title: 'Scalp Detox & Density',
    description: 'Gently clarifies mineral residue, excess sebum, and flakes for a refreshed scalp environment.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    link: '/shop?category=hair-concern&concern=scalp',
    badge: 'HARD WATER SHIELD',
  },
  {
    id: 'color',
    title: 'Color Protect & Shine',
    description: 'Shields color pigment from fading and oxidation while restoring high-shine reflectivity.',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
    link: '/shop?category=hair-concern&concern=color',
    badge: 'SALON CARE',
  },
]

export default function ShopByConcernSection({ config }) {
  const tag = config?.tag || 'TARGETED FORMULATION'
  const title = config?.title || 'Shop by Hair Concern'
  const description =
    config?.description ||
    'Customized routines engineered for Indian hair textures and climate challenges.'
  const concerns =
    config?.concerns && config.concerns.length > 0
      ? config.concerns
      : defaultConcerns

  return (
    <section className="py-10 sm:py-20 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10 space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-[#5A3859]">
            {tag}
          </span>
          <h2 className="font-sans text-xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-stone-900">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-normal px-2">
            {description}
          </p>
        </div>

        {/* Concern Grid (2-Cols Compact on Mobile, 4-Cols on Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 items-stretch">
          {concerns.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="group bg-white rounded-none border border-stone-200/90 shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_32px_rgba(90,56,89,0.15)] transition-all duration-300 overflow-hidden flex flex-col justify-between h-full"
            >
              <div>
                {/* Card Image Banner */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'}
                    alt={item.title}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
                    }}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-[#5A3859] text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-none shadow-xs">
                    {item.badge}
                  </span>
                </div>

                {/* Card Info */}
                <div className="p-2.5 sm:p-4 flex flex-col gap-1 sm:gap-1.5">
                  {/* Title */}
                  <h3 className="font-sans font-bold text-xs sm:text-base text-stone-900 group-hover:text-[#5A3859] transition-colors leading-snug line-clamp-1 sm:line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[10px] sm:text-xs text-stone-500 leading-snug sm:leading-relaxed font-normal line-clamp-2 min-h-[28px] sm:min-h-[36px]">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Footer Link aligned at bottom */}
              <div className="p-2.5 sm:p-4 pt-0 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#5A3859] group-hover:translate-x-1 transition-transform">
                <span>Explore</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
