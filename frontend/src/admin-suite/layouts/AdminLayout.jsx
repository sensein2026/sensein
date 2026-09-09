import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import AdminNavbar from '../components/AdminNavbar'
import { ToastProvider } from '../context/ToastContext'

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
        {/* Desktop Sidebar (Fixed Sticky Left: Deep Navy Blue) */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-0 h-screen w-72 overflow-y-auto">
            <AdminSidebar />
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 h-full">
              <AdminSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area (Right: Pure Crisp White / Slate) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#F8FAFC]">
          <AdminNavbar onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
