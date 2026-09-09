import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Sparkles,
  ChevronRight,
  MessageCircle,
  Package,
  User,
  Truck,
  LogOut,
  ShoppingBag,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { closeMobileMenu, openAuthModal } from '@/store/uiSlice'
import { selectIsAuthenticated, selectCurrentUser, logout } from '@/store/authSlice'
import SenseinLogo from '@/components/SenseinLogo'
import { SECTIONS } from '@/components/CategoryStrip'

export default function MobileMenu() {
  const isOpen = useSelector((state) => state.ui.isMobileMenuOpen)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isOpen])

  const handleLogout = () => {
    dispatch(logout())
    dispatch(closeMobileMenu())
    navigate('/')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeMobileMenu())}
          />

          {/* Slide-out Navigation Drawer */}
          <motion.aside
            className="fixed inset-y-0 left-0 top-0 bottom-0 z-50 flex w-80 max-w-[85vw] h-full h-[100dvh] max-h-[100dvh] flex-col bg-white p-5 sm:p-6 shadow-2xl justify-between overflow-hidden overscroll-contain"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
                <SenseinLogo />
                <button
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                  aria-label="Close menu"
                  onClick={() => dispatch(closeMobileMenu())}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links - Scrollable */}
              <nav className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1 py-1 scrollbar-none">
                {/* 1. Primary Highlight: Shop All */}
                <Link
                  to="/shop"
                  onClick={() => dispatch(closeMobileMenu())}
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-all font-sans font-extrabold text-xs uppercase tracking-wider bg-[#5A3859] text-white shadow-sm hover:bg-[#4b2f4a] shrink-0 mb-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-[#E1F830]" />
                    <span>Explore All Products</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/70" />
                </Link>

                {/* 2. Category Heading */}
                <div className="px-3 pt-1 pb-1.5">
                  <span className="text-[10px] font-extrabold tracking-widest text-stone-400 uppercase font-mono">
                    Product Categories
                  </span>
                </div>

                {/* 3. Category Items With Sleek Chevron Arrows */}
                <div className="space-y-0.5">
                  {SECTIONS.filter(
                    (link) => link.to !== '/shop' && link.to !== '/bulk-order'
                  ).map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      onClick={() => dispatch(closeMobileMenu())}
                      className="group flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all font-sans font-semibold text-xs tracking-wide text-stone-700 hover:text-[#5A3859] hover:bg-[#5A3859]/5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-[#5A3859] transition-colors" />
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-[#5A3859] transition-colors" />
                    </Link>
                  ))}
                </div>
              </nav>
            </div>

            {/* Bottom Section: Bulk Order & WhatsApp Support */}
            <div className="pt-3 pb-1 shrink-0 space-y-2 border-t border-stone-100">
              {/* Bulk Order Button (Replaced Old Account Pill) */}
              <Link
                to="/bulk-order"
                onClick={() => dispatch(closeMobileMenu())}
                className="group flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-[#FAF7F9] hover:bg-[#5A3859] text-stone-900 hover:text-white font-bold text-xs uppercase tracking-wider transition-all border border-[#5A3859]/20 shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#5A3859] group-hover:text-white transition-colors" />
                  <span>Bulk Order</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-stone-500 group-hover:text-white/80 font-bold uppercase">
                  <span>Wholesale</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>

              {/* WhatsApp Support Button */}
              <a
                href="https://wa.me/9118008910710"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-[#5A3859] hover:bg-[#4b2f4a] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
