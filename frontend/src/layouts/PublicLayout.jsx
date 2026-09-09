import { useEffect, useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser } from '@/store/authSlice'
import { useGetProductsQuery } from '@/features/productsApi'
import { syncCartWithActiveProducts } from '@/store/cartSlice'
import { syncWishlistWithActiveProducts } from '@/store/wishlistSlice'
import AnnouncementBar from '@/components/AnnouncementBar'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileMenu from '@/components/MobileMenu'
import CartDrawer from '@/components/CartDrawer'
import WelcomeAuthModal from '@/components/WelcomeAuthModal'
import MaintenanceScreen from '@/components/MaintenanceScreen'
import { initAnalytics, trackPageView } from '@/utils/analytics'
import { ShieldAlert, ExternalLink } from 'lucide-react'

export default function PublicLayout() {
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const user = useSelector(selectCurrentUser)
  const isAdmin = user?.role === 'admin'

  // Query live products and auto-sync active products with cart and wishlist
  const { data: productsResponse } = useGetProductsQuery(undefined, {
    pollingInterval: 10000,
  })

  useEffect(() => {
    const products = productsResponse?.data || (Array.isArray(productsResponse) ? productsResponse : null)
    if (products && Array.isArray(products)) {
      dispatch(syncCartWithActiveProducts(products))
      dispatch(syncWishlistWithActiveProducts(products))
    }
  }, [productsResponse, dispatch])

  // Initialize from cache immediately to prevent page flash on reload
  const [maintenance, setMaintenance] = useState(() => {
    try {
      const cached = localStorage.getItem('sensein_maintenance_state')
      if (cached) {
        return JSON.parse(cached)
      }
    } catch {}
    return {
      isMaintenanceMode: false,
      maintenanceTitle: '',
      maintenanceMessage: '',
      estimatedBackAt: '',
      allowAdminBypass: true,
    }
  })

  const checkMaintenanceStatus = async () => {
    try {
      const res = await fetch('/api/site-settings/maintenance-status')
      if (res.ok) {
        const data = await res.json()
        if (data && typeof data.isMaintenanceMode === 'boolean') {
          setMaintenance(data)
          localStorage.setItem('sensein_maintenance_state', JSON.stringify(data))
        }
      }
    } catch (err) {
      // Silently continue if network fails
    }
  }

  useEffect(() => {
    initAnalytics()
    trackPageView(pathname, document.title)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    checkMaintenanceStatus()

    // Periodically re-check maintenance mode every 15 seconds
    const interval = setInterval(checkMaintenanceStatus, 15000)
    return () => clearInterval(interval)
  }, [pathname])

  // Auth pages (login, register, forgot/reset password) remain accessible even in maintenance mode so admin can log in
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')

  // If maintenance mode is active and user is not an admin, display the maintenance screen
  if (maintenance.isMaintenanceMode && !isAdmin && !isAuthPage) {
    return <MaintenanceScreen settings={maintenance} onCheckStatus={checkMaintenanceStatus} />
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip max-w-full w-full">
      {/* Top Banner for Admin when Maintenance Mode is Active */}
      {maintenance.isMaintenanceMode && isAdmin && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold flex items-center justify-between z-50 sticky top-0 shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-stone-950 animate-bounce" />
            <span>
              <strong>MAINTENANCE MODE IS ON:</strong> Public visitors currently see the maintenance page. You are viewing live preview as Admin.
            </span>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 bg-stone-950 text-amber-400 hover:bg-stone-900 px-3 py-1 rounded text-[11px] font-extrabold uppercase tracking-wider transition-all"
          >
            <span>Admin Control</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Top Announcement Bar (Scrolls with page) */}
      <div className="w-full print:hidden">
        <AnnouncementBar />
      </div>

      {/* Fixed Sticky Header (Sticks to top when scrolled) */}
      <header className="sticky top-0 z-40 w-full print:hidden">
        <Navbar />
      </header>

      <div className="print:hidden">
        <MobileMenu />
        <CartDrawer />
        <WelcomeAuthModal />
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}
