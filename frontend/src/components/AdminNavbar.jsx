import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectCurrentUser, logout } from '@/store/authSlice'
import {
  LogOut,
  ShieldCheck,
  Menu,
} from 'lucide-react'

export default function AdminNavbar({ onToggleMobile }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/admin')
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-emerald-800 font-semibold">
            System Live <span className="text-emerald-400">|</span> Backend Connected
          </span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Card */}
        <div className="flex items-center gap-2.5 bg-slate-50 pl-2 pr-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
            {user?.name?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
              <span>{user?.name || 'Super Admin'}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
