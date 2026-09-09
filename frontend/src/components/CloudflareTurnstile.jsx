import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

export default function CloudflareTurnstile({ onVerified, autoVerify = true, delay = 400 }) {
  const [status, setStatus] = useState('verifying') // 'verifying' | 'success'
  const hasTriggeredRef = useRef(false)
  const onVerifiedRef = useRef(onVerified)

  useEffect(() => {
    onVerifiedRef.current = onVerified
  }, [onVerified])

  useEffect(() => {
    if (autoVerify && !hasTriggeredRef.current) {
      const timer = setTimeout(() => {
        setStatus('success')
        const completeTimer = setTimeout(() => {
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true
            if (onVerifiedRef.current) onVerifiedRef.current()
          }
        }, 200)
        return () => clearTimeout(completeTimer)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [autoVerify, delay])

  const handleClick = () => {
    if (status !== 'success' && !hasTriggeredRef.current) {
      setStatus('verifying')
      setTimeout(() => {
        setStatus('success')
        setTimeout(() => {
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true
            if (onVerifiedRef.current) onVerifiedRef.current()
          }
        }, 200)
      }, 300)
    }
  }

  return (
    <div
      onClick={handleClick}
      className="w-full bg-[#FAFAFA] border border-stone-300 rounded-lg p-3 sm:px-4 sm:py-3.5 flex items-center justify-between shadow-xs select-none transition-all cursor-pointer hover:border-stone-400"
    >
      {/* Left side: Turnstile State */}
      <div className="flex items-center gap-3">
        {status === 'verifying' ? (
          <>
            {/* Cloudflare Green Dot Spinner */}
            <div className="relative w-7 h-7 flex items-center justify-center">
              <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="3"
                  r="1.8"
                  fill="#059669"
                  opacity="1"
                />
                <circle
                  cx="18.3"
                  cy="5.7"
                  r="1.8"
                  fill="#059669"
                  opacity="0.85"
                />
                <circle
                  cx="21"
                  cy="12"
                  r="1.8"
                  fill="#059669"
                  opacity="0.7"
                />
                <circle
                  cx="18.3"
                  cy="18.3"
                  r="1.8"
                  fill="#059669"
                  opacity="0.55"
                />
                <circle
                  cx="12"
                  cy="21"
                  r="1.8"
                  fill="#059669"
                  opacity="0.4"
                />
                <circle
                  cx="5.7"
                  cy="18.3"
                  r="1.8"
                  fill="#059669"
                  opacity="0.3"
                />
                <circle
                  cx="3"
                  cy="12"
                  r="1.8"
                  fill="#059669"
                  opacity="0.2"
                />
                <circle
                  cx="5.7"
                  cy="5.7"
                  r="1.8"
                  fill="#059669"
                  opacity="0.1"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-stone-800 tracking-tight">
              Verifying...
            </span>
          </>
        ) : (
          <>
            {/* Cloudflare Green Checkmark */}
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs animate-in zoom-in-75 duration-200">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-sm font-bold text-emerald-700 tracking-tight">
              Success
            </span>
          </>
        )}
      </div>

      {/* Right side: Cloudflare Brand Logo */}
      <div className="flex flex-col items-end leading-none">
        <div className="flex items-center gap-1.5">
          {/* Cloudflare Cloud SVG */}
          <svg className="h-5 w-auto" viewBox="0 0 48 32" fill="none">
            <path
              d="M38.5 13.5C37.5 7.5 32 3 25.5 3C20.5 3 16.2 5.8 14 10C8.5 10.5 4 15.2 4 21C4 27.1 8.9 32 15 32H38.5C43.2 32 47 28.2 47 23.5C47 18.9 43.3 15.1 38.5 13.5Z"
              fill="#F6821F"
            />
            <path
              d="M34.5 15.5C34.2 14.5 33.6 13.6 32.8 13C31 11.5 28.5 11.2 26.5 12.2C25.5 12.7 24.8 13.5 24.2 14.5C23.8 14.2 23.2 14 22.5 14C21.1 14 20 15.1 20 16.5C20 16.8 20.1 17.1 20.2 17.4C18.4 17.8 17 19.5 17 21.5C17 23.9 19.1 26 21.5 26H35C38.3 26 41 23.3 41 20C41 17.4 39.3 15.3 37 14.7C36.2 14.8 35.3 15.1 34.5 15.5Z"
              fill="#FBAD41"
            />
          </svg>
          <span className="text-[11px] font-black tracking-wider text-black font-sans uppercase">
            CLOUDFLARE
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-stone-500 font-medium mt-1">
          <span className="hover:underline cursor-pointer">Privacy</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Help</span>
        </div>
      </div>
    </div>
  )
}
