import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Outlet, Link } from 'react-router-dom'
import { Shield, Lock, Mail, Loader2, KeyRound } from 'lucide-react'
import { selectCurrentUser, selectIsAuthenticated, setCredentials } from '@/store/authSlice'
import { useLoginMutation } from '@/features/authApi'
import SenseinLogo from '@/admin-suite/components/SenseinLogo'

export default function AdminRoute() {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [loginMutation, { isLoading }] = useLoginMutation()
  const [email, setEmail] = useState('mindnextarticle@gmail.com')
  const [password, setPassword] = useState('AdminPassword123!')
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    try {
      const res = await loginMutation({ email, password }).unwrap()
      const loggedUser = res.user || res.data?.user
      const token = res.token || res.data?.token
      if (loggedUser?.role !== 'admin') {
        setErrorMsg('Access denied. Administrator role required.')
        return
      }
      dispatch(setCredentials({ user: loggedUser, token }))
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Login failed. Please check credentials.')
    }
  }

  const fillDefaultCredentials = () => {
    setEmail('mindnextarticle@gmail.com')
    setPassword('AdminPassword123!')
  }

  // If not logged in OR not an admin, render the original clean white SENSEIN ADMIN SUITE Login
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl relative z-10">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="p-3 bg-slate-900 rounded-2xl mb-3 shadow-md">
              <SenseinLogo isWhite={true} className="h-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase mt-2 font-display">
              Admin Suite
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sensein Professional • Control Center
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-xs font-semibold text-center animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Email ID
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mindnextarticle@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Secret Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              <span>Sign In to Admin Dashboard</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Auto-fill Admin Credentials</span>
            </button>
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2"
            >
              ← Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // When logged in as admin, render full Admin Suite
  return <Outlet />
}
