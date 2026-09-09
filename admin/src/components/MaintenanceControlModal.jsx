import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react'
import {
  useGetMaintenanceSettingsQuery,
  useUpdateMaintenanceSettingsMutation,
} from '@/features/adminApi'

export default function MaintenanceControlModal({ isOpen, onClose }) {
  const { data, isLoading: isFetching, refetch } = useGetMaintenanceSettingsQuery()
  const [updateSettings, { isLoading: isSaving }] = useUpdateMaintenanceSettingsMutation()

  const [formData, setFormData] = useState({
    isMaintenanceMode: false,
    maintenanceTitle: 'Under Scheduled Maintenance',
    maintenanceMessage:
      'Sensein Luxury Haircare is currently undergoing scheduled platform updates to enhance your shopping experience. We will be back online shortly.',
    estimatedBackAt: '',
    allowAdminBypass: true,
  })

  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (data?.settings && !isInitialized) {
      setFormData({
        isMaintenanceMode: Boolean(data.settings.isMaintenanceMode),
        maintenanceTitle: data.settings.maintenanceTitle || 'Under Scheduled Maintenance',
        maintenanceMessage:
          data.settings.maintenanceMessage ||
          'Sensein Luxury Haircare is currently undergoing scheduled platform updates to enhance your shopping experience. We will be back online shortly.',
        estimatedBackAt: data.settings.estimatedBackAt || '',
        allowAdminBypass: data.settings.allowAdminBypass !== false,
      })
      setIsInitialized(true)
    }
  }, [data, isInitialized])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (isSaving) return

    try {
      const res = await updateSettings(formData).unwrap()
      if (res.success) {
        refetch()
        onClose()
      }
    } catch (err) {
      alert(err?.data?.message || err.message || 'Failed to update maintenance settings')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                formData.isMaintenanceMode
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {formData.isMaintenanceMode ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Website Maintenance Mode
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Control live public access to Sensein storefront
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Main ON / OFF Toggle Switch Box */}
          <div
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              formData.isMaintenanceMode
                ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    formData.isMaintenanceMode
                      ? 'bg-amber-500 text-stone-950 animate-pulse'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {formData.isMaintenanceMode ? 'MAINTENANCE ACTIVE' : 'WEBSITE IS LIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-600 pt-1 font-normal">
                {formData.isMaintenanceMode
                  ? 'Public visitors see the maintenance screen.'
                  : 'All customers can browse and purchase normally.'}
              </p>
            </div>

            {/* iOS style toggle */}
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  isMaintenanceMode: !prev.isMaintenanceMode,
                }))
              }
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.isMaintenanceMode ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  formData.isMaintenanceMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Maintenance Heading / Title
            </label>
            <input
              type="text"
              value={formData.maintenanceTitle}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, maintenanceTitle: e.target.value }))
              }
              placeholder="e.g. Under Scheduled Maintenance"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5A3859]/20 focus:border-[#5A3859]"
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Visitor Notification Message
            </label>
            <textarea
              rows={3}
              value={formData.maintenanceMessage}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, maintenanceMessage: e.target.value }))
              }
              placeholder="Message to display to customers..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5A3859]/20 focus:border-[#5A3859] resize-none"
            />
          </div>

          {/* Estimated time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Expected Completion Time (Optional)
            </label>
            <input
              type="text"
              value={formData.estimatedBackAt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, estimatedBackAt: e.target.value }))
              }
              placeholder="e.g. 15 Minutes / Today at 2:00 PM"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5A3859]/20 focus:border-[#5A3859]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md bg-[#5A3859] hover:bg-[#4a2e49] text-white cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save & Apply Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
