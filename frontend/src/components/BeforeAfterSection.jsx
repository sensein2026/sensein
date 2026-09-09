import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'

const defaultStats = [
  {
    value: '97%',
    label: 'wave or curl hold all day long',
  },
  {
    value: '92%',
    label: 'better hair definition',
  },
  {
    value: '48%',
    label: 'reduction in hair dryness',
  },
]

const defaultTransformations = [
  {
    id: 1,
    title: 'Frizz & Wavy to Mirror-Smooth Glass Hair',
    productName: 'SENSEIN® Keratin Bond Silk Smoothing Serum',
    productPrice: '₹1,299',
    productLink: '/shop?category=haircare',
    tag: 'Frizz Defense',
    beforeImage: '/images/before-after/smooth_before.jpg',
    afterImage: '/images/before-after/smooth_after.jpg',
  },
  {
    id: 2,
    title: 'Dry Strands to Defined Bouncy Curls',
    productName: 'SENSEIN® Botanical Hydra-Curl Defining Cream',
    productPrice: '₹1,199',
    productLink: '/shop?category=hair-concern&concern=curly',
    tag: 'Curl Definition',
    beforeImage: '/images/before-after/curl_before.jpg',
    afterImage: '/images/before-after/curl_after.jpg',
  },
  {
    id: 3,
    title: 'Messy Bedhead to Matte Textured Wax Styling',
    productName: 'SENSEIN® Matte Texture Sculpting Hair Wax',
    productPrice: '₹999',
    productLink: '/shop?category=styling',
    tag: 'All-Day Hold',
    beforeImage: '/images/before-after/wax_before.jpg',
    afterImage: '/images/before-after/wax_after.jpg',
  },
]

function BeforeAfterCard({ item }) {
  const [sliderPos, setSliderPos] = useState(50)
  const [isInteracting, setIsInteracting] = useState(false)

  const updatePosition = (clientX, rect) => {
    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPos(percent)
  }

  const handlePointerDown = (e) => {
    setIsInteracting(true)
    const rect = e.currentTarget.getBoundingClientRect()
    updatePosition(e.clientX, rect)
  }

  const handlePointerMove = (e) => {
    if (!isInteracting && e.buttons !== 1) return
    const rect = e.currentTarget.getBoundingClientRect()
    updatePosition(e.clientX, rect)
  }

  const handlePointerUp = () => {
    setIsInteracting(false)
  }

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      const rect = e.currentTarget.getBoundingClientRect()
      updatePosition(e.touches[0].clientX, rect)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col group select-none transition-all hover:shadow-lg w-[240px] sm:w-auto shrink-0 snap-center">
      {/* Top Static Labels */}
      <div className="flex justify-between items-center px-3 py-1.5 bg-stone-50 border-b border-stone-100 text-[9px] font-black uppercase tracking-wider text-stone-700 select-none">
        <span>BEFORE</span>
        <span>AFTER</span>
      </div>

      {/* Interactive Slider Canvas - Compact Aspect Ratio */}
      <div
        className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden select-none cursor-ew-resize bg-stone-100 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={() => setIsInteracting(true)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Fixed Background: AFTER image */}
        <img
          src={item.afterImage || '/images/before-after/smooth_after.jpg'}
          alt="After"
          onError={(e) => {
            e.currentTarget.src = '/images/before-after/wax_after.jpg'
          }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          draggable="false"
        />

        {/* Fixed Foreground: BEFORE image (Revealed via Clip-Path Mask) */}
        <img
          src={item.beforeImage || '/images/before-after/smooth_before.jpg'}
          alt="Before"
          onError={(e) => {
            e.currentTarget.src = '/images/before-after/wax_before.jpg'
          }}
          style={{
            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
            WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-10"
          draggable="false"
        />

        {/* Divider Line & Square Choras Handle */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none shadow-[0_0_8px_rgba(0,0,0,0.5)] z-20"
          style={{ left: `${sliderPos}%` }}
        >
          {/* < > Center Handle Button */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-stone-900 border border-black/10 shadow-md flex items-center justify-center text-[8px] font-black tracking-tight pointer-events-none">
            &lt;&gt;
          </div>
        </div>
      </div>

      {/* Product Transformation Footer & Shop Now CTA */}
      <div className="p-3 sm:p-4 bg-white border-t border-stone-100 flex flex-col justify-between flex-1 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#5A3859] bg-[#5A3859]/10 px-2 py-0.2 rounded">
              {item.tag || 'Powered by Sensein'}
            </span>
            {item.productPrice && (
              <span className="text-xs font-mono font-extrabold text-stone-900">
                {item.productPrice}
              </span>
            )}
          </div>
          <h3 className="font-bold text-xs text-stone-900 line-clamp-1 leading-snug pt-0.5">
            {item.title}
          </h3>
          <p className="text-[10px] text-stone-500 line-clamp-1 font-medium">
            Used: <span className="text-stone-800 font-semibold">{item.productName || 'SENSEIN® Formulation'}</span>
          </p>
        </div>

        <Link
          to={item.productLink || '/shop'}
          className="w-full py-2 px-3 bg-stone-900 hover:bg-[#5A3859] active:scale-95 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ShoppingBag className="h-3 w-3" />
          <span>Shop Solution</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

export default function BeforeAfterSection({ config }) {
  const titlePrefix = config?.titlePrefix || 'DIGITS'
  const titleHighlight = config?.titleHighlight || "DON'T LIE"
  const footnote = config?.footnote || '*based on Independent Clinical Studies, 2026'
  const stats =
    config?.stats && config.stats.length > 0 ? config.stats : defaultStats
  const transformations =
    config?.transformations && config.transformations.length > 0
      ? config.transformations
      : defaultTransformations

  return (
    <section className="py-10 sm:py-20 bg-transparent relative">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 relative z-10 space-y-6 sm:space-y-10">
        
        {/* Section Header: DIGITS DON'T LIE */}
        <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
          <h2 className="font-sans text-xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight uppercase">
            {titlePrefix} <span className="italic font-black text-[#5A3859]">{titleHighlight}</span>
          </h2>

          {/* Stats Bar (Compact 3-Column Strip on Mobile & Desktop) */}
          <div className="grid grid-cols-3 gap-1 sm:gap-4 p-2.5 sm:p-4 bg-white rounded-xl border border-stone-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.05)] max-w-3xl mx-auto">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2.5 text-center sm:text-left px-1 sm:px-3 ${
                  idx !== 0 ? 'border-l border-stone-200' : ''
                }`}
              >
                <span className="font-sans text-xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight font-mono">
                  {stat.value}
                </span>
                <span className="text-[8px] sm:text-xs text-stone-600 font-semibold leading-tight max-w-[120px]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[9px] sm:text-[10px] text-stone-400 font-medium tracking-wide">
            {footnote}
          </p>
        </div>

        {/* 3 Interactive Split Slider Cards - Compact Swipeable on Mobile */}
        <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-5 overflow-x-auto sm:overflow-visible pb-2 snap-x scrollbar-none max-w-4xl mx-auto px-1">
          {transformations.map((item) => (
            <BeforeAfterCard key={item.id} item={item} />
          ))}
        </div>

      </div>
    </section>
  )
}
