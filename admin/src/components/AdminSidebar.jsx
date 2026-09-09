import SenseinLogo from './SenseinLogo'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  FolderTree,
  ShoppingBag,
  Tag,
  Gift,
  Boxes,
  Users,
  LayoutTemplate,
  History,
  ExternalLink,
  FileCheck,
  Truck,
  X,
} from 'lucide-react'

export default function AdminSidebar({ onCloseMobile }) {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Analytics & Funnel', icon: TrendingUp, path: '/analytics' },
    { label: 'Products & Stock', icon: Package, path: '/products' },
    { label: 'Categories', icon: FolderTree, path: '/categories' },
    { label: 'Orders & Tracking', icon: ShoppingBag, path: '/orders' },
    { label: 'Coupons & Discounts', icon: Tag, path: '/coupons' },
    { label: 'Toggle for Gifts', icon: Gift, path: '/gifts' },
    { label: 'Tax Invoice & Logistics', icon: FileCheck, path: '/delhivery' },
    { label: 'Bulk Orders (B2B)', icon: Boxes, path: '/bulk-orders' },
    { label: 'Registered Customers', icon: Users, path: '/users' },
    { label: 'Front Page CMS', icon: LayoutTemplate, path: '/homepage-cms' },
    { label: 'Activity & Recovery', icon: History, path: '/activity-vault' },
  ]

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col justify-between px-3.5 py-3 shrink-0 min-h-full h-full relative z-20 text-slate-200">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
          <div className="flex flex-col">
            <SenseinLogo isWhite={true} showSubtitle={true} className="h-6" />
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="mb-1.5 px-2">
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold">
            Main Management
          </span>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium text-[11px] tracking-wide transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1 rounded-md transition-all ${
                          isActive
                            ? 'bg-white/20 text-white font-bold'
                            : 'bg-slate-800 text-blue-400 group-hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* End of Nav */}
    </aside>
  )
}
