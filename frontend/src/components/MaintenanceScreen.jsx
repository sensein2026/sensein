import { useState } from 'react'
import { ShieldCheck, RefreshCw, Clock, Instagram } from 'lucide-react'
import SenseinLogo from '@/components/SenseinLogo'

export default function MaintenanceScreen({ settings, onCheckStatus }) {
  const [isChecking, setIsChecking] = useState(false)

  const handleRefresh = async () => {
    setIsChecking(true)
    if (onCheckStatus) {
      await onCheckStatus()
    }
    setTimeout(() => {
      setIsChecking(false)
    }, 700)
  }

  const title = settings?.maintenanceTitle || 'Under Scheduled Maintenance'
  const message =
    settings?.maintenanceMessage ||
    'Sensein Luxury Haircare is currently undergoing planned system upgrades to improve your experience. We will be back online shortly.'
  const estimatedTime = settings?.estimatedBackAt

  return (
    <div className="min-h-screen w-full bg-[#fdfbf7] text-stone-900 flex flex-col justify-between select-none font-sans relative overflow-hidden">
      {/* Header with exact website Sensein Logo (Admin Login removed as requested) */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center z-10">
        <SenseinLogo className="h-7 sm:h-9 w-auto" />
      </header>

      {/* Center Maintenance Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-stone-200/80 text-center space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Site Under Maintenance</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
            {title}
          </h1>

          {/* Message */}
          <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto font-normal">
            {message}
          </p>

          {/* Estimated Completion Time Card if available */}
          {estimatedTime && (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 flex items-center justify-center gap-2.5 text-xs text-stone-700">
              <Clock className="w-4 h-4 text-[#5A3859]" />
              <span>
                <strong>Estimated Time:</strong> {estimatedTime}
              </span>
            </div>
          )}

          {/* Check Status Button */}
          <div className="pt-2">
            <button
              onClick={handleRefresh}
              disabled={isChecking}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 bg-[#5A3859] hover:bg-[#472c46] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking Live Status...' : 'Check If Live Now'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer matching the exact website copyright line */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 border-t border-stone-200/60 z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>© {new Date().getFullYear()} SENSEIN®. All rights reserved.</span>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-6 text-xs text-stone-600">
          <a
            href="https://www.instagram.com/sensein.india"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-stone-700 hover:text-[#5A3859] transition-colors font-bold"
          >
            <Instagram className="h-4 w-4" />
            <span>@sensein.india</span>
          </a>
        </div>
      </footer>
    </div>
  )
}
