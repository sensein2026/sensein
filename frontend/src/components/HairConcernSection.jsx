import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

const categories = [
  { id: 'all', label: 'ALL ROUTINES' },
  { id: 'repair', label: 'HYDRO-REPAIR & SHINE' },
  { id: 'texture', label: 'WAVY & CURL DEFINITION' },
  { id: 'scalp', label: 'SCALP DETOX & DENSITY' },
]

const playbooks = [
  {
    id: 'hydrorepair',
    category: 'repair',
    title: 'THE HYDROREPAIR ROUTINE',
    subtitle: 'Hydrate, Repair & Restore',
    badge: '★ MOST RE-ORDERED',
    badgeColor: 'bg-[#e2ff3d] text-black',
    stepsCount: '3-STEP SYSTEM',
    steps: ['1. Cleanse', '2. Deep Mask', '3. Seal Serum'],
    highlights: 'Hyaluronic Acid + Botanical Silk Oils',
    resultMetric: '98% Saw Reduced Frizz',
    desc: 'Scientifically rebuilds damaged hair bonds from root to cuticle, sealing moisture for 72hr smooth, silky bounce.',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80',
    link: '/shop?category=haircare',
  },
  {
    id: 'wavy',
    category: 'texture',
    title: 'THE MOXIE WAVY ROUTINE',
    subtitle: 'Define Waves & Anti-Frizz',
    badge: '✦ MADE FOR WAVES',
    badgeColor: 'bg-[#80c6b9] text-black',
    stepsCount: '4-STEP SYSTEM',
    steps: ['1. Shampoo', '2. Hydrate', '3. Wave Cream', '4. Gel'],
    highlights: 'Crunch-Free Hold • 72Hr Anti-Frizz',
    resultMetric: 'Soft, Touch-Proof Waves',
    desc: 'Enhances natural S-wave patterns without heavy buildup or stiffness. Delivers touchable, soft, glossy waves.',
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80',
    link: '/shop?category=haircare',
  },
  {
    id: 'curly',
    category: 'texture',
    title: 'THE MOXIE CURLY ROUTINE',
    subtitle: 'Hydrate, Define & Hold',
    badge: '✦ CURL APPROVED',
    badgeColor: 'bg-[#e8cded] text-black',
    stepsCount: '4-STEP SYSTEM',
    steps: ['1. Co-Wash', '2. Leave-In', '3. Curl Cream', '4. Gel'],
    highlights: 'Shea Butter + Amino Acid Science',
    resultMetric: 'Springy 24Hr Bounce',
    desc: 'Provides intense moisture, springy bounce, and humidity-proof curl definition for coarse, unruly curls.',
    image: 'https://images.unsplash.com/photo-1608248597263-00079e960333?auto=format&fit=crop&w=800&q=80',
    link: '/shop?category=haircare',
  },
  {
    id: 'scalp-sos',
    category: 'scalp',
    title: 'SCALP SOS & DETOX ROUTINE',
    subtitle: 'Exfoliate & Soothe Scalp',
    badge: '✦ CLINICALLY PROVEN',
    badgeColor: 'bg-black text-[#e2ff3d]',
    stepsCount: '3-STEP SYSTEM',
    steps: ['1. Scalp Scrub', '2. Clarify', '3. Soothe Tonic'],
    highlights: 'Salicylic Acid + Tea Tree Exfoliator',
    resultMetric: '100% Cleared Mineral Buildup',
    desc: 'Removes hard water mineral buildup, excess sebum, and flakes for a clean, refreshed, balanced scalp.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    link: '/shop?category=haircare',
  },
  {
    id: 'champi',
    category: 'scalp',
    title: 'POWER CHAMPI & ROOT BOOSTER',
    subtitle: 'Nourish, Strengthen & Grow',
    badge: '✦ ROOT DENSITY',
    badgeColor: 'bg-[#e2ff3d] text-black',
    stepsCount: '2-STEP SYSTEM',
    steps: ['1. Champi Oil', '2. Scalp Serum'],
    highlights: 'Bhringraj + Rosemary Scalp Oil',
    resultMetric: 'Reduced Hair Breakage by 89%',
    desc: 'Stimulates scalp micro-circulation to nourish hair follicles, reduce shedding, and promote thick hair density.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    link: '/shop?category=haircare',
  },
]

export default function HairConcernSection() {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredPlaybooks = activeCategory === 'all'
    ? playbooks
    : playbooks.filter((p) => p.category === activeCategory)

  return (
    <section className="py-16 sm:py-24 bg-white relative z-10 border-t border-black/5">
      <div className="container-page">
        {/* Section Header: OUR PRODUCT PLAYBOOK */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f2edf1] text-[#5A3859] text-[10px] font-extrabold tracking-widest uppercase mb-4 shadow-sm border border-[#5A3859]/10">
              <Sparkles className="h-3.5 w-3.5 text-[#5A3859]" />
              Scientifically Crafted Haircare Routines
            </div>
            <h2 className="font-sans text-3xl sm:text-5xl font-bold text-[#111111] tracking-tight uppercase">
              OUR PRODUCT <span className="underline decoration-[#5A3859] decoration-4">PLAYBOOK</span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-2xl font-medium">
              Tailored 2, 3 & 4-step routines engineered for Indian hair types, climates, and hard water.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-[#5A3859] hover:text-[#4b2f4a] transition-colors border-b-2 border-[#5A3859] pb-1 w-fit"
          >
            <span>Explore All Routines</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category Pills Filter Bar */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-4 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 whitespace-nowrap border shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-[#5A3859] text-white border-[#5A3859] shadow-md scale-[1.02]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#5A3859] hover:bg-[#FAF7F9]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Playbook Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPlaybooks.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-[20px] border border-black/8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Image Banner Header */}
                <div className="relative aspect-[4/3] w-full bg-[#FAF7F9] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Top Badge Overlay */}
                  <span className="absolute top-4 right-4 rounded-full bg-[#f2edf1] text-[#5A3859] px-3.5 py-1 text-[10px] font-bold tracking-widest uppercase shadow-md border border-[#5A3859]/20">
                    {item.badge.replace(/^[★✦]\s*/, '')}
                  </span>

                  {/* System Pill Bottom Left */}
                  <span className="absolute bottom-4 left-4 rounded-full bg-[#111111]/85 backdrop-blur-md text-white px-3.5 py-1 text-[10px] font-extrabold tracking-widest uppercase border border-white/20 shadow-md">
                    {item.stepsCount}
                  </span>

                  {/* Result Metric Floating Badge Bottom Right */}
                  <span className="absolute bottom-4 right-4 rounded-full bg-white/90 backdrop-blur-md text-emerald-800 px-3.5 py-1 text-[10px] font-extrabold tracking-wider border border-emerald-500/30 shadow-md flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    {item.resultMetric}
                  </span>
                </div>

                {/* Card Main Body */}
                <div className="p-6 sm:p-7 space-y-4">
                  <div>
                    <div className="text-xs font-bold text-[#5A3859] uppercase tracking-widest mb-1">
                      {item.subtitle}
                    </div>

                    <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#111111] tracking-tight group-hover:text-[#5A3859] transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  {/* Routine Step Pills Flow */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {item.steps.map((st, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold bg-[#FAF7F9] text-[#5A3859] px-2.5 py-1 rounded-md border border-[#5A3859]/10"
                      >
                        {st}
                      </span>
                    ))}
                  </div>

                  {/* Highlights Science Badge */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 bg-[#FAF7F9] px-3.5 py-2 rounded-xl border border-gray-200">
                    <CheckCircle2 className="h-4 w-4 text-[#5A3859] shrink-0" />
                    <span>{item.highlights}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 leading-relaxed font-normal pt-1">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 sm:p-7 pt-0">
                <Link
                  to={item.link}
                  className="w-full bg-[#5A3859] hover:bg-[#4b2f4a] text-white py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>EXPLORE ROUTINE</span>
                  <ArrowRight className="h-4 w-4 text-current transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
