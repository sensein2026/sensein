import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

export const SECTIONS = [
  { label: 'Shop All', to: '/shop', isSpecial: 'shop-all' },
  { label: 'Shampoo', to: '/shop?category=shampoo' },
  { label: 'Mask', to: '/shop?category=mask' },
  { label: 'Serum', to: '/shop?category=serum' },
  { label: 'Perfume', to: '/shop?category=perfume' },
  { label: 'Cream', to: '/shop?category=cream' },
  { label: 'Facewash', to: '/shop?category=facewash' },
  { label: 'Wax', to: '/shop?category=wax' },
  { label: 'Travelling Kit', to: '/shop?category=travelling-kit' },
  { label: 'Oil', to: '/shop?category=oil' },
  { label: 'Powder', to: '/shop?category=powder' },
  { label: 'Bulk Order', to: '/bulk-order', isSpecial: 'bulk-order' },
]

export default function CategoryStrip() {
  const location = useLocation()
  const currentPath = location.pathname + location.search

  return (
    <div className="bg-[#FAF7F9] border-b border-stone-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="container-page">
        <nav
          className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center"
          aria-label="All sections"
        >
          {SECTIONS.map((section) => {
            const isActive = currentPath === section.to

            if (section.isSpecial === 'shop-all') {
              return (
                <Link
                  key={section.label}
                  to={section.to}
                  className={cn(
                    'shrink-0 whitespace-nowrap text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all duration-200 shadow-xs flex items-center gap-1.5 cursor-pointer',
                    isActive
                      ? 'bg-[#5A3859] text-white shadow-sm ring-2 ring-[#5A3859]/30 ring-offset-1'
                      : 'bg-stone-900 text-white hover:bg-[#5A3859] hover:shadow-md'
                  )}
                >
                  <Sparkles className="h-3 w-3 text-[#E1F830]" />
                  <span>{section.label}</span>
                </Link>
              )
            }

            if (section.isSpecial === 'bulk-order') {
              return (
                <Link
                  key={section.label}
                  to={section.to}
                  className={cn(
                    'shrink-0 whitespace-nowrap text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all duration-200 shadow-xs flex items-center gap-1.5 cursor-pointer border border-black/20',
                    isActive
                      ? 'bg-black text-[#E1F830] shadow-sm ring-2 ring-black/20 ring-offset-1'
                      : 'bg-[#E1F830] text-black hover:bg-black hover:text-[#E1F830] hover:shadow-md'
                  )}
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>{section.label}</span>
                </Link>
              )
            }

            return (
              <Link
                key={section.label}
                to={section.to}
                className={cn(
                  'group relative shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-colors duration-200 py-1 px-1',
                  isActive ? 'text-[#5A3859]' : 'text-stone-600 hover:text-[#5A3859]'
                )}
              >
                {section.label}
                <span
                  className={cn(
                    'pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#5A3859] transition-transform duration-300 group-hover:scale-x-100',
                    isActive && 'scale-x-100'
                  )}
                />
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
