import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Trash2, RefreshCw, X, Sparkles, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (param1, param2 = 'success', param3 = '', param4 = 3500) => {
      let type = 'success'
      let title = ''
      let message = ''
      let duration = 3500

      if (typeof param1 === 'object' && param1 !== null) {
        type = param1.type || 'success'
        title = param1.title || ''
        message = param1.message || ''
        duration = param1.duration !== undefined ? param1.duration : 3500
      } else {
        message = String(param1 || '')
        type = typeof param2 === 'string' ? param2 : 'success'
        title = typeof param3 === 'string' ? param3 : ''
        duration = typeof param4 === 'number' ? param4 : 3500
      }

      // Default titles if not provided
      if (!title) {
        if (type === 'success' || type === 'create') title = 'Success'
        else if (type === 'update') title = 'Updated'
        else if (type === 'delete') title = 'Removed'
        else if (type === 'error' || type === 'danger') title = 'Action Failed'
        else if (type === 'warning') title = 'Warning'
        else title = 'Notification'
      }

      const id = Date.now().toString() + Math.random().toString(36).substring(2, 6)
      const newToast = { id, type, title, message, duration }

      setToasts((prev) => [...prev.slice(-4), newToast]) // keep at most 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const toast = {
    addToast,
    show: (msg, type = 'info', title = '') => addToast(msg, type, title),
    success: (message, title = 'Successfully Completed') =>
      addToast({ type: 'success', title, message }),
    create: (message, title = 'Added Successfully') =>
      addToast({ type: 'create', title, message }),
    update: (message, title = 'Updated Successfully') =>
      addToast({ type: 'update', title, message }),
    delete: (message, title = 'Removed Successfully') =>
      addToast({ type: 'delete', title, message }),
    error: (message, title = 'Action Failed') =>
      addToast({ type: 'error', title, message }),
    info: (message, title = 'Notification') =>
      addToast({ type: 'info', title, message }),
    warning: (message, title = 'Warning') =>
      addToast({ type: 'warning', title, message }),
  }

  // Set global window toast helper for automatic RTK query hooks
  if (typeof window !== 'undefined') {
    window.__adminToast = toast
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Toast Notification Container (Top-Right) */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success' || t.type === 'create'
          const isUpdate = t.type === 'update'
          const isDelete = t.type === 'delete'
          const isError = t.type === 'error' || t.type === 'danger'
          const isWarning = t.type === 'warning'
          const isInfo = !isSuccess && !isUpdate && !isDelete && !isError && !isWarning

          // Color palette mapping
          const accentColor = isSuccess
            ? '#10B981' // Emerald
            : isUpdate || isInfo
            ? '#3B82F6' // Sky Blue
            : isWarning
            ? '#F59E0B' // Amber
            : '#EF4444' // Rose Red

          const iconBg = isSuccess
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            : isUpdate || isInfo
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
            : isWarning
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'

          return (
            <div
              key={t.id}
              style={{
                backgroundColor: '#0F172A',
                boxShadow: '0 20px 35px -8px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12)',
              }}
              className="pointer-events-auto relative overflow-hidden flex items-start gap-3.5 p-4 rounded-2xl border border-slate-700/80 transition-all duration-300 animate-in slide-in-from-top-4"
            >
              {/* Left Accent Color Stripe */}
              <div
                style={{ backgroundColor: accentColor }}
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl shadow-sm"
              />

              {/* Icon Container */}
              <div className="shrink-0 pl-1 mt-0.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs ${iconBg}`}>
                  {isSuccess && <CheckCircle2 className="h-5 w-5" />}
                  {isUpdate && <RefreshCw className="h-4.5 w-4.5 animate-spin" style={{ animationDuration: '3s' }} />}
                  {isInfo && <Info className="h-5 w-5" />}
                  {isWarning && <AlertTriangle className="h-5 w-5" />}
                  {isDelete && <Trash2 className="h-5 w-5" />}
                  {isError && <AlertCircle className="h-5 w-5" />}
                </div>
              </div>

              {/* Title & Message */}
              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <h4 className="text-[13px] font-bold tracking-tight text-white leading-tight">
                    {t.title}
                  </h4>
                )}
                <p className="text-[12px] text-slate-200 mt-1 leading-snug break-words font-medium">
                  {t.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Fallback if accessed outside provider
    return {
      addToast: (msg, type, title) => window.__adminToast?.addToast?.(msg, type, title),
      show: (msg, type, title) => window.__adminToast?.show?.(msg, type, title),
      success: (msg, title) => window.__adminToast?.success?.(msg, title),
      create: (msg, title) => window.__adminToast?.create?.(msg, title),
      update: (msg, title) => window.__adminToast?.update?.(msg, title),
      delete: (msg, title) => window.__adminToast?.delete?.(msg, title),
      error: (msg, title) => window.__adminToast?.error?.(msg, title),
      info: (msg, title) => window.__adminToast?.info?.(msg, title),
      warning: (msg, title) => window.__adminToast?.warning?.(msg, title),
    }
  }
  return context
}
