export default function SenseinLogo({ className = '', isWhite = true, showSubtitle = false }) {
  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="flex items-center gap-2">
        <img
          src={isWhite ? '/images/sensein-logo-white.png' : '/images/sensein-logo.png'}
          alt="Sensein Professional"
          className="h-8 w-auto object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex'
            }
          }}
        />
        <div style={{ display: 'none' }} className="items-center gap-1.5 font-luxury text-xl font-bold tracking-widest text-gold-400">
          <span>SENSEIN</span>
          <span className="text-[10px] tracking-normal font-sans font-medium px-1.5 py-0.5 rounded bg-gold-400/20 text-gold-300">PRO</span>
        </div>
      </div>
    </div>
  )
}
