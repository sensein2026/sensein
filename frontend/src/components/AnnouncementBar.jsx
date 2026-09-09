import { useLocation } from 'react-router-dom'
import { useHomepageConfig } from '@/features/homepageApi'

export default function AnnouncementBar() {
  const { pathname } = useLocation()
  const { config } = useHomepageConfig()
  const announcement = config?.announcementBar
  const isEnabled = announcement?.enabled ?? true

  // Hide moving announcement marquee on checkout for a distraction-free checkout experience
  if (pathname === '/checkout' || !isEnabled) return null

  const defaultItems = [
    'FREE SHIPPING ON ORDERS ABOVE ₹999',
    'DERMATOLOGICALLY TESTED & SULPHATE-FREE HAIRCARE',
    'EXCLUSIVE BOTANICAL FORMULATIONS FOR RADIANT HAIR',
    'SECURE PREPAID CHECKOUT & COD AVAILABLE',
  ]

  const items =
    announcement?.messages && announcement.messages.length > 0
      ? announcement.messages
      : defaultItems

  // Clean items without extra emojis or clutter
  const cleanedItems = items.map((m) =>
    m.replace(/[✨+•]+/g, ' ').replace(/\s+/g, ' ').trim()
  )

  // Ensure the base sequence has at least 4 items so it easily exceeds screen width
  const repeatBase = Math.max(2, Math.ceil(4 / (cleanedItems.length || 1)))
  const baseList = Array(repeatBase).fill(cleanedItems).flat()

  // Double it for seamless -50% infinite translation loop
  const marqueeItems = [...baseList, ...baseList]

  return (
    <div className="bg-[#4B2F4A] text-white/95 py-2 overflow-hidden whitespace-nowrap select-none relative z-50 shadow-2xs w-full border-b border-[#5A3859]/40">
      <div className="flex w-max animate-marquee-announcement items-center font-sans font-semibold text-[10.5px] tracking-[0.18em] uppercase">
        {marqueeItems.map((item, idx) => (
          <div key={idx} className="flex items-center shrink-0">
            <span className="mx-6 text-[#D4AF37] text-[10px] select-none">✦</span>
            <span className="shrink-0">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
