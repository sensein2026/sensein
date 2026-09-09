import { Link } from 'react-router-dom'
import { Instagram, Mail, Phone, Clock, ShieldCheck } from 'lucide-react'
import SenseinLogo from '@/components/SenseinLogo'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/shop' },
      { label: 'Bestsellers', to: '/shop?filter=bestseller' },
      { label: 'Shampoos', to: '/shop?category=shampoo' },
      { label: 'Hair Serums', to: '/shop?category=serum' },
      { label: 'Hair Masks', to: '/shop?category=mask' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Track Order', to: '/track-order' },
      { label: 'Bulk Order / Wholesale', to: '/bulk-order' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'My Account', to: '/account' },
      { label: 'About Us', to: '/about' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Shipping Policy', to: '/shipping-policy' },
      { label: 'Return Policy', to: '/return-policy' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms & Conditions', to: '/terms-of-service' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-[#5A3859]/30 bg-[#140A13] text-white relative overflow-hidden font-sans">
      {/* Background Soft Ambient */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#5A3859]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container-page relative z-10 grid gap-10 py-12 sm:py-16 text-center sm:text-left sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand & Direct Contact */}
        <div className="space-y-4 flex flex-col items-center sm:items-start">
          <div className="flex justify-center sm:justify-start">
            <SenseinLogo isWhite={true} />
          </div>
          <p className="text-xs text-white/70 leading-relaxed font-normal max-w-sm mx-auto sm:mx-0">
            Clean, high-performance botanical haircare specifically formulated for diverse Indian hair textures and climatic conditions.
          </p>

          <div className="space-y-2 pt-2 text-xs text-white/70 flex flex-col items-center sm:items-start">
            <a
              href="mailto:info@sensein.in"
              className="flex items-center justify-center sm:justify-start gap-2.5 hover:text-[#E8D5C4] transition-colors"
            >
              <Mail className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span>info@sensein.in</span>
            </a>
            <div className="flex items-center justify-center sm:justify-start gap-2.5 text-white/70">
              <Clock className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span>Mon - Sat (9:00 AM - 7:00 PM)</span>
            </div>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col items-center sm:items-start">
            <h3 className="font-sans text-xs font-extrabold uppercase tracking-[0.2em] text-[#E8D5C4]">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5 flex flex-col items-center sm:items-start">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-xs text-white/70 transition-colors hover:text-[#E8D5C4] font-normal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-white/10 py-6 text-xs text-white/50 flex flex-col sm:flex-row items-center justify-between container-page gap-4 text-center sm:text-left relative z-10">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>© {new Date().getFullYear()} SENSEIN®. All rights reserved.</span>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-6 text-xs text-white/60">
          <a
            href="https://www.instagram.com/sensein.india"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-[#E8D5C4] transition-colors font-bold"
          >
            <Instagram className="h-4 w-4" />
            <span>@sensein.india</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
