export default function PressLogosBar() {
  const pressItems = [
    { name: 'VOGUE', text: '"The ultimate hard water defense for Indian hair."' },
    { name: 'ELLE', text: '"Revolutionary bond repair without harsh chemicals."' },
    { name: 'BAZAAR', text: '"Salon-grade softness in just one wash."' },
    { name: 'COSMOPOLITAN', text: '"The anti-frizz Holy Grail for tropical weather."' },
    { name: 'GRAZIA', text: '"Transformative botanical science for scalp health."' },
  ]

  return (
    <div className="bg-[#FAF8F5] border-y border-stone-200/80 py-8 px-4">
      <div className="max-w-6xl mx-auto text-center space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">
          AS SEEN IN
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 md:gap-20">
          {pressItems.map((item, idx) => (
            <div key={idx} className="group flex flex-col items-center">
              <span className="font-display font-bold text-lg sm:text-xl text-stone-700 tracking-wider group-hover:text-[#5A3859] transition-colors">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
