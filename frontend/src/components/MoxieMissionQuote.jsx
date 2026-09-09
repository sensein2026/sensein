import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function MoxieMissionQuote({ config }) {
  const badgeText = config?.badgeText || 'CLEAN BEAUTY PHILOSOPHY'
  const prefix = config?.mainHeadingPrefix || '100% clean, salon-quality formulas'
  const highlight = config?.highlightText || 'intentionally engineered'
  const suffix = config?.mainHeadingSuffix || 'for real Indian hair textures.'

  return (
    <section className="py-16 sm:py-24 bg-transparent text-center px-4 relative">
      <div className="max-w-4xl mx-auto relative z-10 space-y-4">
        
        {/* Animated Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5A3859]/10 text-[#5A3859] text-[11px] font-extrabold tracking-[0.2em] uppercase shadow-sm border border-[#5A3859]/15"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#5A3859] animate-pulse" />
          {badgeText}
        </motion.div>

        {/* Headline with Staggered Entrance */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-sans text-2xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 leading-tight tracking-tight max-w-3xl mx-auto"
        >
          {prefix}{' '}
          <span className="text-[#5A3859] italic bg-clip-text text-transparent bg-gradient-to-r from-[#5A3859] via-[#7B4D7A] to-[#5A3859]">
            {highlight}
          </span>{' '}
          {suffix}
        </motion.h2>

      </div>
    </section>
  )
}
