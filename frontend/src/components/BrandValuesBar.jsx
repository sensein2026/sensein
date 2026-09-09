import { motion } from 'framer-motion'
import { ShieldCheck, Sparkles, Droplets, Lock } from 'lucide-react'

const iconMap = {
  ShieldCheck,
  Droplets,
  Sparkles,
  Lock,
}

const defaultValues = [
  {
    iconName: 'ShieldCheck',
    title: 'Dermatologically Tested',
    desc: 'Gentle and clinically safe for regular hair care routines',
  },
  {
    iconName: 'Droplets',
    title: 'No Sulphates • No Parabens',
    desc: 'Clean formulas that protect scalp health and moisture barrier',
  },
  {
    iconName: 'Sparkles',
    title: 'Made for Indian Hair',
    desc: 'Engineered for heat, humidity, hard water & urban pollution',
  },
  {
    iconName: 'Lock',
    title: 'Secure Shipway Logistics',
    desc: 'Fast express delivery, live tracking & reliable COD option',
  },
]

export default function BrandValuesBar({ config }) {
  const tag = config?.tag || 'OUR TRUST GUARANTEE'
  const title = config?.title || 'Why Choose Sensein?'
  const values =
    config?.values && config.values.length > 0 ? config.values : defaultValues

  return (
    <section className="bg-transparent py-10 sm:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">

        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl mx-auto mb-6 sm:mb-10 space-y-1.5"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5A3859]/10 text-[#5A3859] text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase">
            <Sparkles className="w-3 h-3 text-[#5A3859]" />
            {tag}
          </div>
          <h2 className="font-sans text-xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight uppercase">
            {title}
          </h2>
        </motion.div>

        {/* 4 Cards Grid (2-Columns Compact on Mobile, 4-Columns on Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {values.map((item, index) => {
            const Icon = item.icon || iconMap[item.iconName] || Sparkles
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 p-3 sm:p-5 bg-white border border-stone-200/90 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg bg-[#FAF7F9] text-[#5A3859] group-hover:bg-[#5A3859] group-hover:text-white transition-colors duration-300 border border-[#5A3859]/15">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 font-normal leading-snug sm:leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
