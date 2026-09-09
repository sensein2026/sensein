import { useState, useEffect } from 'react'
import { Star, CheckCircle2, Sparkles, Quote } from 'lucide-react'

const defaultReviews = [
  {
    id: 'rev-1',
    name: 'Ananya Deshmukh',
    role: 'Verified Customer',
    location: 'Mumbai, Maharashtra',
    rating: 5,
    title: 'Completely transformed my frizz & hard water damage!',
    text: 'Living in Mumbai with hard tap water made my hair rough and dry. After 2 weeks of using Sensein Damage Repair shampoo and mask, my hair feels like salon silk. Worth every single rupee.',
    product: 'Damage Repair Shampoo + Bond Mask',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
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
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
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
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    verified: true,
  },
  {
    id: 'rev-4',
    name: 'Sneha Kapoor',
    role: 'Verified Buyer',
    location: 'Delhi, India',
    rating: 5,
    title: 'My curl pattern came back with zero crunchiness!',
    text: 'Most curl products weigh down Indian wavy hair or leave it sticky. Sensein Hydra-Curl cream keeps my ringlets bouncy, hydrated and soft all day even in hot summers.',
    product: 'Botanical Hydra-Curl Defining Cream',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    verified: true,
  },
  {
    id: 'rev-5',
    name: 'Vikram Singhania',
    role: 'Verified Customer',
    location: 'Pune, Maharashtra',
    rating: 5,
    title: 'Matte hair wax with incredible hold and no flakes.',
    text: 'Best styling product I have tried. Gives natural texture and hold that lasts 12+ hours without making hair greasy or stiff. Highly recommended!',
    product: 'Matte Texture Sculpting Hair Wax',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    verified: true,
  },
]

export default function CustomerReviewsSection({ config }) {
  const tag = config?.tag || 'PROVEN RESULTS & LOVE'
  const title = config?.title || 'Loved by 25,000+ Indian Hair Routines'
  const ratingSummary =
    config?.ratingSummary || '4.95 / 5.0 Average Rating (1,400+ Reviews)'
  const reviews =
    config?.reviews && config.reviews.length > 0 ? config.reviews : defaultReviews

  // Ensure baseSet has at least 6-8 items so it spans wider than any screen resolution
  let baseSet = [...reviews]
  while (baseSet.length < 6) {
    baseSet = [...baseSet, ...reviews]
  }

  // Duplicate Set 1 + Set 2 for 100% seamless, continuous infinite looping without any blank space
  const marqueeReviews = [...baseSet, ...baseSet]

  return (
    <section className="py-10 sm:py-20 bg-transparent relative overflow-hidden select-none">
      <div className="container-page relative z-10 max-w-7xl mx-auto px-3 sm:px-6 mb-6 sm:mb-10">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5A3859]/10 text-[#5A3859] text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase border border-[#5A3859]/15">
            <Sparkles className="w-3 h-3 text-[#5A3859]" />
            {tag}
          </div>

          <h2 className="font-sans text-xl sm:text-3xl lg:text-4xl font-black text-[#111111] uppercase tracking-tight">
            {title}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-stone-700 font-mono">
              {ratingSummary}
            </span>
          </div>
        </div>
      </div>

      {/* Seamless Continuous Infinite Loop Track */}
      <div className="relative w-full overflow-hidden">
        {/* Left & Right Soft Fade Gradients */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-r from-[#FAF9F6] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-l from-[#FAF9F6] to-transparent z-10" />

        <div className="flex w-max animate-marquee-reviews py-2 sm:py-4">
          {marqueeReviews.map((rev, idx) => (
            <div
              key={`${rev.id || 'rev'}-${idx}`}
              className="w-[260px] sm:w-[320px] md:w-[360px] flex-shrink-0 px-2 sm:px-3"
            >
              {/* Luxury Review Card */}
              <div className="bg-white border border-stone-200/90 p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-[#5A3859]/30 transition-all duration-300 flex flex-col justify-between h-full min-h-[220px] sm:min-h-[250px] relative rounded-2xl group cursor-default">
                {/* Quote Mark Accent */}
                <Quote className="absolute top-3.5 right-3.5 w-5 h-5 text-[#5A3859]/10 pointer-events-none group-hover:text-[#5A3859]/25 transition-colors" />

                <div className="space-y-2">
                  {/* 5 Stars Rating */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-[#111111] leading-snug line-clamp-1">
                    &ldquo;{rev.title}&rdquo;
                  </h3>

                  <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed font-normal line-clamp-3">
                    {rev.text}
                  </p>

                  {/* Tagged Product */}
                  {rev.product && (
                    <div className="inline-block px-2.5 py-0.5 bg-[#FAF7F9] text-[#5A3859] border border-[#5A3859]/15 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded-md">
                      {rev.product}
                    </div>
                  )}
                </div>

                {/* Reviewer Details Footer */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={
                          rev.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={rev.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#5A3859]/20 shadow-xs"
                      />
                      {rev.verified !== false && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5 text-white">
                          <CheckCircle2 className="w-2 h-2" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-bold text-stone-900 line-clamp-1">
                        {rev.name}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-stone-400 font-medium font-mono">
                        {rev.location || 'India'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-[#5A3859] bg-[#5A3859]/10 px-2 py-0.5 rounded-full border border-[#5A3859]/15">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
