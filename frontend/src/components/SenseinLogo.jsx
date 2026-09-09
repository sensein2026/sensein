import { Link } from 'react-router-dom'

export default function SenseinLogo({ className = '', isWhite = false, href = '/', onClick }) {
  const logoSrc = isWhite ? '/images/sensein-logo-white.png' : '/images/sensein-logo.png'

  return (
    <Link
      to={href}
      onClick={onClick}
      className="inline-flex items-center shrink-0 cursor-pointer transition-opacity hover:opacity-90 select-none"
      aria-label="Sensein Home"
    >
      <img
        src={logoSrc}
        alt="SENSEIN PROFESSIONAL HAIRCARE"
        className={`h-6 sm:h-8 md:h-10 w-auto object-contain ${className}`}
      />
    </Link>
  )
}
