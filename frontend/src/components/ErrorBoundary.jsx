import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, RefreshCw, AlertTriangle, Sparkles, Compass } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function ErrorBoundary() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="relative z-10 max-w-xl w-full text-center space-y-6">
          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5A3859]/10 border border-[#5A3859]/20 text-[#5A3859] text-[11px] font-bold uppercase tracking-[0.2em]"
          >
            {is404 ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-[#D4AF37] animate-spin" style={{ animationDuration: '6s' }} />
                <span>Error 404 • Page Not Found</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span>Application Notice</span>
              </>
            )}
          </motion.div>

          {/* 3D Animated Floating Number or Icon */}
          <div className="relative flex items-center justify-center my-2 select-none">
            {is404 ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, type: 'spring' }}
                className="flex items-center justify-center gap-2 sm:gap-4"
              >
                <span className="font-serif font-black text-7xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-br from-[#4B2F4A] via-[#5A3859] to-[#7B4E7A]">
                  4
                </span>
                <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-full bg-gradient-to-tr from-[#5A3859] to-[#2B1B2A] border-2 border-[#D4AF37]/50 shadow-2xl flex items-center justify-center text-amber-200">
                  <Compass className="h-10 w-10 sm:h-14 sm:w-14 stroke-[1.5] text-[#D4AF37]" />
                </div>
                <span className="font-serif font-black text-7xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-br from-[#4B2F4A] via-[#5A3859] to-[#7B4E7A]">
                  4
                </span>
              </motion.div>
            ) : (
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-600 border border-rose-200 shadow-sm">
                <AlertTriangle className="h-10 w-10" />
              </div>
            )}
          </div>

          {/* Text Description */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-2.5"
          >
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {is404 ? 'Lost in the Botanical Realm?' : 'Something unexpected occurred'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              {is404
                ? 'The formulation or page you are looking for has blossomed elsewhere or does not exist.'
                : error?.message || 'We encountered a momentary glitch. Please refresh or return to the homepage.'}
            </p>
          </motion.div>

          {/* Quick Action Navigation CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#5A3859] hover:bg-[#4B2F4A] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Home className="h-4 w-4" />
              <span>Return to Home</span>
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-stone-50 border-2 border-stone-300 text-stone-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm hover:border-[#5A3859] cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 text-[#5A3859]" />
              <span>Refresh Page</span>
            </button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
