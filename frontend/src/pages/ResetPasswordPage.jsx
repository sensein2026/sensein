import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, KeyRound, Lock, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { useResetPasswordMutation } from '@/features/authApi'

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200', text: '', percent: '0%' }
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500', text: 'text-red-600', percent: '25%' }
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600', percent: '50%' }
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-emerald-500', text: 'text-emerald-600', percent: '75%' }
  return { score: 4, label: 'Strong 💪', color: 'bg-emerald-600', text: 'text-emerald-700', percent: '100%' }
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(1) // Step 1: Verify OTP code, Step 2: Set New Password
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    code: searchParams.get('code') || '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Step 1: Verify OTP format and proceed
  const handleVerifyStep1 = (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.email) {
      setErrorMsg('Please enter your email address.')
      return
    }

    if (!formData.code || formData.code.trim().length !== 6) {
      setErrorMsg('Please enter the valid 6-digit OTP code sent to your email.')
      return
    }

    setStep(2)
  }

  // Step 2: Submit new password reset to server
  const handleSubmitStep2 = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.newPassword || !formData.confirmPassword) {
      setErrorMsg('Please fill in both password fields.')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your confirm password field.')
      return
    }

    if (formData.newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    try {
      const response = await resetPassword({
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword,
      }).unwrap()

      if (response.success) {
        setIsSuccess(true)
      }
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Password reset failed. Invalid or expired OTP code.')
    }
  }

  const strength = getPasswordStrength(formData.newPassword)
  const isMatch = formData.confirmPassword.length > 0 && formData.confirmPassword === formData.newPassword
  const isMismatch = formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.newPassword

  return (
    <div className="bg-ivory min-h-[calc(100vh-200px)] py-8 sm:py-12 -mt-6 flex items-center justify-center">
      <div className="container-page max-w-md w-full">
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-charcoal/10 shadow-lg space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <span className="text-xs uppercase font-bold tracking-widest text-rosegold-dark">
              Account Security
            </span>
            <h1 className="font-display text-3xl font-semibold text-charcoal">
              {step === 1 ? 'Verify OTP Code' : 'Create New Password'}
            </h1>
            <p className="text-xs text-charcoal-light">
              {step === 1
                ? 'Enter the 6-digit OTP code sent to your email address.'
                : 'Choose a strong password to secure your account.'}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          {!isSuccess && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                step === 1 ? 'bg-charcoal text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <span>1. Verify OTP</span>
                {step > 1 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              </div>
              <div className="h-0.5 w-6 bg-charcoal/20" />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                step === 2 ? 'bg-charcoal text-white' : 'bg-charcoal/10 text-charcoal/40'
              }`}>
                <span>2. New Password</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-emerald-900">
                Password Reset Complete!
              </h3>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your account password has been updated successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full btn-primary bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Sign In Now
              </button>
            </div>
          ) : step === 1 ? (
            /* STEP 1: VERIFY OTP CODE */
            <form onSubmit={handleVerifyStep1} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-charcoal/20 focus:outline-none focus:border-rosegold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  6-Digit Email OTP Code *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
                  <input
                    type="text"
                    name="code"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit OTP code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-charcoal/20 font-mono text-center tracking-[0.4em] font-bold text-lg focus:outline-none focus:border-rosegold"
                  />
                </div>
                <p className="text-[11px] text-charcoal-light mt-1.5">
                  Check your email inbox for your 6-digit OTP code from SENSEIN PROFESSIONAL®.
                </p>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider shadow-md mt-2"
              >
                Verify OTP & Continue <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: CREATE NEW PASSWORD */
            <form onSubmit={handleSubmitStep2} className="space-y-4">
              {/* Confirmed Email & Code Summary Badge */}
              <div className="p-3 bg-cream/50 rounded-xl border border-charcoal/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-charcoal truncate">{formData.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-rosegold-dark hover:underline font-semibold shrink-0 ml-2"
                >
                  Change OTP
                </button>
              </div>

              {/* New Password Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-charcoal">New Password *</label>
                  {formData.newPassword && (
                    <span className={`text-[11px] font-bold ${strength.text}`}>
                      {strength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
                  <input
                    type="password"
                    name="newPassword"
                    required
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-charcoal/20 focus:outline-none focus:border-rosegold"
                  />
                </div>

                {/* Real-time Password Strength Meter Bar */}
                {formData.newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: strength.percent }}
                      />
                    </div>
                    <p className="text-[10px] text-charcoal-light">
                      Must be 6+ chars. Tip: combine uppercase, numbers & symbols for high security.
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm New Password Input */}
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full text-xs pl-10 pr-10 py-3 rounded-xl border transition-colors focus:outline-none ${
                      isMatch
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : isMismatch
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-charcoal/20 focus:border-rosegold'
                    }`}
                  />

                  {/* Real-time Match Tick / Mismatch Indicator Icon */}
                  {isMatch && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  )}
                  {isMismatch && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>

                {/* Match / Mismatch Live Badge */}
                {isMatch && (
                  <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match perfectly!
                  </p>
                )}
                {isMismatch && (
                  <p className="text-[11px] font-semibold text-red-500 mt-1 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Passwords do not match yet.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || isMismatch}
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider shadow-md mt-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Confirm & Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-charcoal/10 text-center text-xs">
            <Link to="/login" className="font-bold text-charcoal-light hover:text-charcoal">
              ← Cancel and Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
