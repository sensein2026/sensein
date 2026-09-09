import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2, Sparkles } from 'lucide-react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
    }
  }

  return (
    <section className="py-20 sm:py-24 bg-[#0f0a0e] text-white relative overflow-hidden border-t border-white/10">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5A3859]/30 rounded-full blur-[140px] pointer-events-none" />

      <div className="container-page max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-[#5A3859]/40 text-[#c49aff] text-[10px] font-black tracking-[0.22em] uppercase border border-[#5A3859]/50"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#c49aff]" /> SENSEIN® VIP CLUB
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-sans text-3xl sm:text-5xl font-black text-white uppercase tracking-tight"
        >
          UNLOCK 10% OFF YOUR FIRST ORDER
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-stone-300 text-xs sm:text-sm font-normal max-w-xl mx-auto leading-relaxed"
        >
          Subscribe to receive private hair care routines, trichologist tips, and instant discount code{' '}
          <span className="font-black text-white bg-white/10 px-2 py-0.5 border border-white/20">SENSEIN10</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 max-w-md mx-auto"
        >
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded-none bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Welcome! Use code SENSEIN10 at checkout for 10% off.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-none border border-white/20 bg-white/10 backdrop-blur-md px-11 py-3.5 text-xs text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#c49aff] font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto shrink-0 bg-[#5A3859] hover:bg-[#6d4569] text-white px-8 py-3.5 rounded-none text-xs font-black uppercase tracking-widest transition-all duration-300 border border-[#5A3859] shadow-xl hover:scale-105 cursor-pointer"
              >
                SUBSCRIBE
              </button>
            </form>
          )}

          <p className="text-[11px] text-stone-400 mt-3 font-normal">
            Zero spam. Unsubscribe at any time with 1 click.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
