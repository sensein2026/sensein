import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { X, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, RotateCw, AlertTriangle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { selectIsAuthenticated, setCredentials } from '@/store/authSlice'
import { closeAuthModal } from '@/store/uiSlice'
import { useQuickEmailLoginMutation, useVerifyOtpMutation, useResendOtpMutation } from '@/features/authApi'
import CloudflareTurnstile from './CloudflareTurnstile'

export default function WelcomeAuthModal() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isAuthModalOpen = useSelector((state) => state.ui.isAuthModalOpen)
  const authRedirectUrl = useSelector((state) => state.ui.authRedirectUrl)

  const [step, setStep] = useState('email') // 'email' | 'turnstile' | 'otp'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [notifyOffers, setNotifyOffers] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const otpInputRef = useRef(null)

  const [quickEmailLogin] = useQuickEmailLoginMutation()
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation()
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation()

  // Lock body scroll whenever modal is open
  useEffect(() => {
    if (isAuthModalOpen && !isAuthenticated) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isAuthModalOpen, isAuthenticated])

  // Focus OTP input whenever entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [step])

  // Lock body scroll when auth modal is active
  useEffect(() => {
    if (isAuthModalOpen && !isAuthenticated) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAuthModalOpen, isAuthenticated])

  const handleClose = () => {
    dispatch(closeAuthModal())
    setErrorMsg('')
    setStep('email')
    setOtp('')
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Step 1: User submits email -> trigger Cloudflare Turnstile & start OTP dispatch in parallel
  const handleEmailSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    setOtp('')
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    setStep('turnstile')
    // Pre-dispatch OTP immediately in parallel so the user gets the OTP screen without waiting
    quickEmailLogin({ email })
      .unwrap()
      .catch((err) => {
        setErrorMsg(err?.data?.message || 'Unable to send sign-in code. Please try again.')
        setStep('email')
      })
  }

  // Step 2: Cloudflare Turnstile completed -> instantly move to OTP input
  const handleTurnstileVerified = () => {
    setOtp('')
    setStep('otp')
    setResendCooldown(30)
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (otp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.')
      return
    }

    try {
      const response = await verifyOtp({ email, otp }).unwrap()
      if (response.success && response.token) {
        dispatch(setCredentials({ user: response.user, token: response.token }))
        const targetUrl = authRedirectUrl
        handleClose()
        if (targetUrl) {
          navigate(targetUrl)
        }
      }
    } catch (err) {
      setErrorMsg(err?.data?.message || 'OTP verification failed.')
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return
    setErrorMsg('')
    try {
      await resendOtp({ email }).unwrap()
      setResendCooldown(45)
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to resend code.')
    }
  }

  if (!isAuthModalOpen || isAuthenticated) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Modal Card — Sensein Signature Plum & Gold Luxury Style */}
      <div
        className="relative w-full max-w-lg md:max-w-2xl bg-[#3B1C3A] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row items-stretch animate-in fade-in zoom-in-95 duration-200 border border-[#5A3859]/40 my-auto max-h-[94dvh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-stone-700 hover:text-stone-900 transition-all z-30 cursor-pointer shadow-md"
          aria-label="Close modal"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />
        </button>

        {/* LEFT PANE: Sensein Signature Plum Luxury Card */}
        <div className="relative p-5 sm:p-6 md:p-8 md:w-5/12 bg-gradient-to-br from-[#4A2649] via-[#5A3859] to-[#2D162C] flex flex-col justify-between space-y-4 md:space-y-6 text-white select-none overflow-hidden shrink-0">
          {/* Subtle luxury glow effect */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative space-y-2 md:space-y-4 pr-6 md:pr-0">
            <div className="flex items-center">
              <img
                src="/images/sensein-logo-white.png"
                alt="SENSEIN PROFESSIONAL"
                className="h-6 sm:h-8 md:h-9 w-auto object-contain brightness-110 drop-shadow"
              />
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight leading-tight text-white">
              Login now to avail <span className="text-[#D4AF37]">best offers!</span>
            </h2>
          </div>

          <div className="relative space-y-2 md:space-y-2.5 text-[11px] sm:text-xs font-bold text-stone-100 hidden sm:block">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#D4AF37]" />
              <span>Instant 1-Click Secure Login</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#D4AF37]" />
              <span>Unlock Secret Member Discounts</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#D4AF37]" />
              <span>Track Orders in Real-Time</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Pure White Clean Form Box */}
        <div className="bg-white p-5 sm:p-7 md:p-8 flex-1 flex flex-col justify-center space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-2.5 px-3 bg-red-50/90 border border-red-200/80 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 stroke-[2.2]" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {step === 'email' ? (
            /* STEP 1: Instant Email Entry */
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email Address"
                  className="w-full px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-stone-900 bg-stone-50 border border-stone-300 rounded-xl focus:border-[#5A3859] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A3859]/20 transition-all placeholder:text-stone-400"
                  autoFocus
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-stone-700 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyOffers}
                  onChange={(e) => setNotifyOffers(e.target.checked)}
                  className="accent-[#5A3859] h-4 w-4 rounded cursor-pointer"
                />
                <span>Notify me with offers & updates</span>
              </label>

              <button
                type="submit"
                className="w-full py-3 sm:py-3.5 bg-[#5A3859] hover:bg-[#482b47] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Submit</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-[10px] text-stone-400 text-center leading-relaxed pt-1">
                I accept that I have read & understood your{' '}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#5A3859] hover:text-[#482b47] font-semibold"
                >
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link
                  to="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#5A3859] hover:text-[#482b47] font-semibold"
                >
                  T&Cs
                </Link>
                .
              </p>
            </form>
          ) : step === 'turnstile' ? (
            /* STEP 2: Cloudflare Security Verification Box */
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Security Check
                </span>
                <h3 className="text-sm font-bold text-stone-900">
                  Verifying you are human...
                </h3>
              </div>

              <CloudflareTurnstile onVerified={handleTurnstileVerified} delay={1300} />

              <p className="text-[11px] text-stone-400 text-center">
                Sending one-time security code to <strong className="text-stone-700">{email}</strong>
              </p>
            </div>
          ) : (
            /* STEP 3: 6-Digit OTP Verification */
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
                  Enter 6-Digit Code
                </h3>
                <p className="text-xs text-stone-500">
                  Code sent to <strong className="text-stone-800">{email}</strong>
                </p>
              </div>

              <div
                className="relative flex items-center justify-between gap-1 sm:gap-2 pt-1 cursor-text"
                onClick={() => otpInputRef.current?.focus()}
              >
                {/* Transparent Master Input */}
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(clean)
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text text-transparent bg-transparent select-all"
                  autoFocus
                />

                {/* 6 Visual Luxury OTP Boxes */}
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const digit = otp[idx] || ''
                  const isCurrent = otp.length === idx || (otp.length === 6 && idx === 5)
                  return (
                    <div
                      key={idx}
                      className={`w-9 sm:w-11 h-10 sm:h-11 flex items-center justify-center text-center text-base sm:text-lg font-semibold font-mono rounded-lg transition-all border select-none ${
                        isCurrent
                          ? 'border-[#5A3859] ring-2 ring-[#5A3859]/25 bg-white shadow-xs'
                          : digit
                          ? 'border-stone-400 bg-white text-stone-900 shadow-2xs'
                          : 'border-stone-300 bg-stone-50 text-stone-900'
                      }`}
                    >
                      {digit}
                    </div>
                  )
                })}
              </div>

              <button
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="w-full py-3 sm:py-3.5 bg-[#5A3859] hover:bg-[#482b47] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isVerifying ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                  }}
                  className="text-stone-500 hover:text-[#5A3859] font-semibold underline cursor-pointer"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                  className={`font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    resendCooldown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-[#5A3859] hover:underline'
                  }`}
                >
                  {resendCooldown > 0 ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 text-slate-400 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>Resend in {resendCooldown}s</span>
                    </>
                  ) : (
                    <>
                      <RotateCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                      <span>Resend OTP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
