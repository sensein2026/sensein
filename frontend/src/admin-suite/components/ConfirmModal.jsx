import { createPortal } from 'react-dom'
import { AlertTriangle, Trash2, X, Truck, Zap, CheckCircle2, Loader2 } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'ship' | 'success'
  isDanger = false,
  isLoading = false,
}) {
  if (!isOpen) return null

  const resolvedVariant = isDanger ? 'danger' : variant

  const getIcon = () => {
    switch (resolvedVariant) {
      case 'ship':
        return (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shadow-sm">
            <Truck className="h-7 w-7 animate-bounce" />
          </div>
        )
      case 'success':
        return (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-7 w-7" />
          </div>
        )
      case 'warning':
        return (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 shadow-sm">
            <AlertTriangle className="h-7 w-7" />
          </div>
        )
      case 'danger':
      default:
        return (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-sm">
            <Trash2 className="h-7 w-7" />
          </div>
        )
    }
  }

  const getConfirmBtnClass = () => {
    switch (resolvedVariant) {
      case 'ship':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
      case 'danger':
      default:
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20'
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 999999 }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
        style={{ zIndex: 999999 }}
        onClick={onClose}
      />

      {/* Dialog Box Modal */}
      <div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ zIndex: 1000000 }}
      >
        {/* Top Close Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          {getIcon()}

          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-display">
              {title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={async () => {
                if (onConfirm) {
                  await onConfirm()
                }
                onClose()
              }}
              disabled={isLoading}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${getConfirmBtnClass()}`}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : resolvedVariant === 'ship' ? (
                <Zap className="h-3.5 w-3.5 fill-current" />
              ) : resolvedVariant === 'danger' ? (
                <Trash2 className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
