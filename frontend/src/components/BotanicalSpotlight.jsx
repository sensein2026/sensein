import { motion } from 'framer-motion'
import { Sparkles, Shield, Droplets } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BotanicalSpotlight() {
  return (
    <section className="py-20 sm:py-28 bg-white relative overflow-hidden border-t border-black/5">
      <div className="container-page max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Image Showcase */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative rounded-none overflow-hidden shadow-2xl aspect-[4/5] bg-black border border-black/10">
              <img
                src="/images/hero1.jpg"
                alt="Clean Hair Science"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Overlay Glass Card */}
              <div className="absolute bottom-6 left-6 right-6 p-6 rounded-none bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl">
                <span className="inline-block px-3 py-1 rounded-none bg-[#5A3859] text-white text-[10px] font-black tracking-widest uppercase mb-2">
                  CLEAN BEAUTY GUARANTEE
                </span>
                <h3 className="font-sans text-xl sm:text-2xl font-bold mt-1 uppercase text-white tracking-tight">
                  Zero Harsh Sulfates · Zero Parabens · Zero Silicones
                </h3>
                <p className="text-xs text-white/80 mt-1.5 font-normal leading-relaxed">
                  Formulated to nourish scalp pores and restore diverse Indian hair textures without heavy chemical build-up.
                </p>
              </div>
            </div>

            {/* Small Floating Accent Card */}
            <div className="hidden sm:flex absolute -bottom-6 -right-6 bg-white p-5 rounded-none shadow-2xl border border-black/10 max-w-xs items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-none bg-[#FAF7F9] text-[#5A3859] shrink-0 font-bold border border-[#5A3859]/20">
                <Sparkles className="w-6 h-6 text-[#5A3859]" />
              </div>
              <div>
                <p className="text-xs font-black text-[#111111] uppercase tracking-wide">100% Bio-Active Formulas</p>
                <p className="text-[11px] text-gray-500 font-medium">Engineered for Indian weather & hard water</p>
              </div>
            </div>
          </motion.div>

          {/* Editorial Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-none bg-[#FAF7F9] text-[#5A3859] text-[10px] font-black tracking-widest uppercase w-fit border border-[#5A3859]/15">
              <Sparkles className="w-3 h-3 text-[#5A3859]" />
              Clean Haircare Science
            </div>

            <h2 className="font-sans text-3xl sm:text-5xl font-black text-[#111111] leading-[1.08] uppercase tracking-tight">
              FORMULATED FOR <br />
              INDIAN HAIR DRAMA.
            </h2>

            <p className="text-gray-600 leading-relaxed font-normal text-sm sm:text-base">
              We eliminate harsh sulfates, heavy mineral oils, and drying alcohols. Every Sensein formula is packed with nutrient-dense botanical actives that repair damaged cuticles and lock in 72-hour moisture.
            </p>

            {/* Feature Bullet Points */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 rounded-none bg-[#FAF7F9] border border-black/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-none bg-white text-[#5A3859] shrink-0 font-bold border border-[#5A3859]/20 shadow-sm">
                  <Droplets className="w-5 h-5 text-[#5A3859]" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#111111] uppercase tracking-tight">
                    Fermented Rice Water &amp; Botanical Keratin
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed font-normal">
                    Rebuilds broken hair bonds from heat styling while improving elasticity and natural shine.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-none bg-[#FAF7F9] border border-black/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-none bg-white text-[#5A3859] shrink-0 font-bold border border-[#5A3859]/20 shadow-sm">
                  <Shield className="w-5 h-5 text-[#5A3859]" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#111111] uppercase tracking-tight">
                    Hard Water Scalp Shield
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed font-normal">
                    Neutralizes mineral deposits from tap water, eliminating itchiness and root buildup.
                  </p>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-block bg-[#5A3859] hover:bg-[#4b2f4a] text-white font-black text-xs sm:text-sm uppercase px-10 py-4 tracking-widest rounded-none shadow-xl transition-all hover:scale-105"
              >
                EXPLORE BOTANICAL FORMULAS
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
