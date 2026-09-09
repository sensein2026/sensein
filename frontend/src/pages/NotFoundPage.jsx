import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, ShoppingBag, Sparkles, Compass, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="relative min-h-[75vh] flex items-center justify-center overflow-hidden py-16 px-4 select-none">
      {/* Ambient Animated Glow Rings & Particles in Background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Pulsing Aura Rings */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#5A3859]/20 via-[#D4AF37]/15 to-transparent blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1.2, 0.95, 1.2],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute w-[650px] h-[650px] rounded-full border border-[#5A3859]/10 border-dashed"
        />

        {/* Floating Botanical Sparks */}
        {[
          { top: '15%', left: '20%', delay: 0, size: 'w-3 h-3' },
          { top: '25%', right: '22%', delay: 1.5, size: 'w-2 h-2' },
          { bottom: '20%', left: '25%', delay: 0.8, size: 'w-2.5 h-2.5' },
          { bottom: '25%', right: '18%', delay: 2.2, size: 'w-3 h-3' },
        ].map((spark, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-12, 12, -12],
              x: [-6, 6, -6],
              opacity: [0.3, 0.9, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: spark.delay,
              ease: 'easeInOut',
            }}
            style={{ top: spark.top, left: spark.left, right: spark.right, bottom: spark.bottom }}
            className={`absolute ${spark.size} rounded-full bg-[#D4AF37]/60 shadow-[0_0_12px_#D4AF37]`}
          />
        ))}
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-6">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5A3859]/10 border border-[#5A3859]/20 text-[#5A3859] text-[11px] font-bold uppercase tracking-[0.2em]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF37] animate-spin" style={{ animationDuration: '6s' }} />
          <span>Error 404 • Page Not Found</span>
        </motion.div>

        {/* 3D Animated Floating 404 Number with Compass Centerpiece */}
        <div className="relative flex items-center justify-center my-2 select-none">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, type: 'spring' }}
            className="flex items-center justify-center gap-2 sm:gap-4"
          >
            {/* First "4" */}
            <motion.span
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="font-serif font-black text-7xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-br from-[#4B2F4A] via-[#5A3859] to-[#7B4E7A] drop-shadow-sm"
            >
              4
            </motion.span>

            {/* Middle Animated Orb / Compass */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.08, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="h-20 w-20 sm:h-28 sm:w-28 rounded-full bg-gradient-to-tr from-[#5A3859] to-[#2B1B2A] border-2 border-[#D4AF37]/50 shadow-2xl flex items-center justify-center text-amber-200"
            >
              <Compass className="h-10 w-10 sm:h-14 sm:w-14 stroke-[1.5] text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
            </motion.div>

            {/* Second "4" */}
            <motion.span
              animate={{ y: [4, -4, 4] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="font-serif font-black text-7xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-br from-[#4B2F4A] via-[#5A3859] to-[#7B4E7A] drop-shadow-sm"
            >
              4
            </motion.span>
          </motion.div>
        </div>

        {/* Text Description */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-2.5"
        >
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Lost in the Botanical Realm?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            The formulation or page you are looking for has blossomed elsewhere or does not exist. Let us guide you back to pure botanical luxury.
          </p>
        </motion.div>

        {/* Quick Action Navigation CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/"
            className="w-full sm:w-auto px-7 py-3.5 bg-[#5A3859] hover:bg-[#4B2F4A] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Link>

          <Link
            to="/shop"
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-stone-50 border-2 border-stone-300 text-stone-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm hover:border-[#5A3859]"
          >
            <ShoppingBag className="h-4 w-4 text-[#5A3859]" />
            <span>Explore Catalog</span>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
