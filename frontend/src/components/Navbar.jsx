import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  ShoppingCart,
  User,
  Zap,
  LogOut,
  Package,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  MapPin,
  Truck,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleMobileMenu, toggleCartDrawer, openAuthModal } from '@/store/uiSlice'
import { selectCartCount } from '@/store/cartSlice'
import { selectCurrentUser, selectIsAuthenticated, logout } from '@/store/authSlice'
import SenseinLogo from '@/components/SenseinLogo'
import CategoryStrip from '@/components/CategoryStrip'
import LiveSearchModal from '@/components/LiveSearchModal'

function WavyMenuIcon({ className = 'h-7 w-7 text-[#1c1c1c]' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M 3 6 C 6 4, 9 8, 12 6 C 15 4, 18 8, 21 6" />
      <path d="M 3 12 C 6 10, 9 14, 12 12 C 15 10, 18 14, 21 12" />
      <path d="M 3 18 C 6 16, 9 20, 12 18 C 15 16, 18 20, 21 18" />
    </svg>
  )
}

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isMobileMenuOpen = useSelector((state) => state.ui.isMobileMenuOpen)
  const cartCount = useSelector(selectCartCount)
  const user = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const userMenuRef = useRef(null)
  const mobileUserMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
      if (mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(e.target)) {
        setIsMobileUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setIsUserMenuOpen(false)
    setIsMobileUserMenuOpen(false)
    dispatch(logout())
    navigate('/')
  }

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all">
      {/* MOBILE HEADER (Viewport < 640px) */}
      <div className="flex sm:hidden h-16 items-center justify-between px-3 w-full max-w-full relative">
        {/* Left: Mobile Menu Trigger */}
        <button
          className="p-1 text-charcoal shrink-0 cursor-pointer"
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => dispatch(toggleMobileMenu())}
        >
          <WavyMenuIcon className="h-6 w-6 text-charcoal" />
        </button>

        {/* Center: MOXIE / Sensein Logo */}
        <div className="py-1 shrink-0 flex items-center justify-center">
          <SenseinLogo />
        </div>

        {/* Right: Search, Account, Cart */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-charcoal hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Live Search"
          >
            <Search className="h-5 w-5 stroke-[1.8]" />
          </button>

          {isAuthenticated ? (
            <div className="relative" ref={mobileUserMenuRef}>
              <button
                type="button"
                onClick={() => setIsMobileUserMenuOpen((prev) => !prev)}
                className="relative inline-flex items-center justify-center gap-0.5 px-1.5 h-9 rounded-full text-charcoal hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="User Account Menu"
              >
                <User className="h-5 w-5 stroke-[1.8]" />
                <ChevronDown className="h-3.5 w-3.5 text-charcoal/60" />
              </button>

              {isMobileUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-stone-200/90 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100 bg-[#fcf8f2]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 truncate">{user?.name}</span>
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    </div>
                    <div className="text-[11px] text-stone-500 truncate mt-0.5">{user?.email}</div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/account?tab=orders"
                      onClick={() => setIsMobileUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-800 hover:bg-[#fcf8f2] hover:text-[#5A3859] transition-colors font-medium cursor-pointer"
                    >
                      <Package className="h-4 w-4 text-[#5A3859]" />
                      <span>My Orders & History</span>
                    </Link>

                    <Link
                      to="/track-order"
                      onClick={() => setIsMobileUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-800 hover:bg-[#fcf8f2] hover:text-[#5A3859] transition-colors font-medium cursor-pointer"
                    >
                      <Truck className="h-4 w-4 text-stone-500" />
                      <span>Track Package</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span>SIGN OUT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => dispatch(openAuthModal('/account'))}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-charcoal hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Sign In"
            >
              <User className="h-5 w-5 stroke-[1.8]" />
            </button>
          )}

          <button
            id="mobile-nav-cart-btn"
            data-nav-cart-btn="true"
            onClick={() => dispatch(toggleCartDrawer())}
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-charcoal hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#5A3859] text-[9px] font-bold text-white flex items-center justify-center border-2 border-white shadow-sm leading-none pointer-events-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* DESKTOP HEADER (Viewport >= 640px) — Exact Moxie Layout */}
      <div className="hidden sm:grid container-page h-20 grid-cols-3 items-center px-6">
        {/* Left: Menu Trigger Icon */}
        <div className="flex items-center justify-self-start">
          <button
            onClick={() => dispatch(toggleMobileMenu())}
            className="p-2.5 text-charcoal hover:bg-black/5 rounded-full transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            aria-label="Toggle Navigation Menu"
          >
            <WavyMenuIcon className="h-7 w-7 text-charcoal" />
          </button>
        </div>

        {/* Center: Centered MOXIE BEAUTY Logo */}
        <div className="justify-self-center py-1 flex items-center justify-center">
          <SenseinLogo />
        </div>

        {/* Right: Search, Account, Shopping Cart */}
        <div className="flex items-center gap-3 justify-self-end">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-charcoal hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Search Catalog"
          >
            <Search className="h-5 w-5 stroke-[1.8]" />
          </button>

          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="relative inline-flex items-center justify-center gap-0.5 px-2.5 h-10 rounded-full hover:bg-black/5 transition-colors text-charcoal cursor-pointer"
                aria-label="User Account Menu"
              >
                <User className="h-5 w-5 stroke-[1.8]" />
                <ChevronDown className="h-3.5 w-3.5 text-charcoal/60" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-charcoal/10 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-charcoal/10 bg-[#fcf8f2]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-charcoal truncate">{user?.name}</span>
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    </div>
                    <div className="text-[11px] text-charcoal-light truncate mt-0.5">{user?.email}</div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/account?tab=orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-charcoal hover:bg-[#fcf8f2] hover:text-[#5A3859] transition-colors font-medium"
                    >
                      <Package className="h-4 w-4 text-[#5A3859]" />
                      <span>My Orders & History</span>
                    </Link>

                    <Link
                      to="/track-order"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-charcoal hover:bg-[#fcf8f2] hover:text-[#5A3859] transition-colors font-medium"
                    >
                      <Truck className="h-4 w-4 text-stone-500" />
                      <span>Track Package</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-charcoal/10">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => dispatch(openAuthModal('/account'))}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-charcoal hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Sign In"
            >
              <User className="h-5 w-5 stroke-[1.8]" />
            </button>
          )}

          <button
            id="desktop-nav-cart-btn"
            data-nav-cart-btn="true"
            onClick={() => dispatch(toggleCartDrawer())}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-charcoal hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#5A3859] text-[10px] font-bold text-white flex items-center justify-center border-2 border-white shadow-sm leading-none pointer-events-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>


      {/* Flipkart Style Live Predictive Search Autocomplete Modal */}
      <LiveSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  )
}

