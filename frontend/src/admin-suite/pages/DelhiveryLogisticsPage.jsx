import { useState, useEffect } from 'react'
import {
  useGetDelhiveryConfigQuery,
  useUpdateDelhiveryConfigMutation,
  useGetInvoiceConfigQuery,
  useUpdateInvoiceConfigMutation,
} from '@/features/adminApi'
import {
  KeyRound,
  ShieldCheck,
  Building,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  FileText,
  FileCheck,
  Sparkles,
  Printer,
  Hash,
} from 'lucide-react'
import { DelhiveryTaxInvoice } from '@/components/PrintableDocuments'

export default function DelhiveryLogisticsPage() {
  const [activeTab, setActiveTab] = useState('invoice') // 'invoice' | 'delhivery'

  // Delhivery API Config
  const { data: configData, isLoading: isLoadingDelhivery, refetch: refetchDelhivery } = useGetDelhiveryConfigQuery()
  const [updateDelhiveryConfig, { isLoading: isUpdatingDelhivery }] = useUpdateDelhiveryConfigMutation()

  // Tax Invoice & Seller Config
  const { data: invoiceData, isLoading: isLoadingInvoice, refetch: refetchInvoice } = useGetInvoiceConfigQuery()
  const [updateInvoiceConfig, { isLoading: isUpdatingInvoice }] = useUpdateInvoiceConfigMutation()

  const [feedback, setFeedback] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)

  // Delhivery Settings Form
  const [settingsForm, setSettingsForm] = useState({
    apiToken: '49b6d9192734e12502837220d02b3ed72475b036',
    pickupLocation: 'MINDNEXT B2C',
    originPincode: '395010',
    originAddress: '104, Vijaynagar 2, Yogichowk, Surat, Gujarat',
    originCity: 'Surat',
    originState: 'Gujarat',
    originPhone: '7984919956',
    isAutoShipEnabled: true,
    isLiveMode: true,
  })

  // Tax Invoice Seller Form
  const [invoiceForm, setInvoiceForm] = useState({
    companyName: 'Sensein Botanical Luxury Pvt Ltd',
    dispatchAddress: '104, Vijay Nagar 2, Yogi Chowk, Puna-Simada Road',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395010',
    stateCode: '24 (Gujarat)',
    gstin: '24AAACR1234F1Z5',
    pan: 'AAACR1234F',
    registeredAddress: 'Sensein Botanical Luxury Private Limited, Plot 104, Yogi Chowk, Puna-Simada Road, Surat, Gujarat - 395010.',
    authorizedSignatory: 'Sensein Botanical Luxury Pvt Ltd',
    hsnCode: '33059040',
    supportPhone: '+91 7984919956',
    supportEmail: 'support@sensein.com',
  })

  // Sync settings form when configData loads
  useEffect(() => {
    if (configData?.config) {
      setSettingsForm((prev) => ({
        ...prev,
        apiToken: configData.config.delhiveryToken || configData.config.apiToken || prev.apiToken,
        pickupLocation: configData.config.warehouseName || configData.config.pickupLocation || prev.pickupLocation,
        originPincode: configData.config.originPincode || prev.originPincode,
        originAddress: configData.config.originAddress || prev.originAddress,
        originCity: configData.config.originCity || prev.originCity,
        originState: configData.config.originState || prev.originState,
        originPhone: configData.config.originPhone || prev.originPhone,
        isAutoShipEnabled: configData.config.isAutoShipEnabled ?? prev.isAutoShipEnabled,
        isLiveMode: configData.config.isLiveMode ?? prev.isLiveMode,
      }))
    }
  }, [configData])

  // Sync invoice form when invoiceData loads
  useEffect(() => {
    if (invoiceData?.sellerDetails) {
      setInvoiceForm((prev) => ({
        ...prev,
        ...invoiceData.sellerDetails,
      }))
    }
  }, [invoiceData])

  // Save Delhivery Settings
  const handleSaveDelhivery = async (e) => {
    e.preventDefault()
    try {
      await updateDelhiveryConfig(settingsForm).unwrap()
      setFeedback('✅ Delhivery API credentials and warehouse details saved successfully!')
      refetchDelhivery()
      setTimeout(() => setFeedback(''), 4000)
    } catch {
      alert('Failed to save Delhivery configuration.')
    }
  }

  // Save Tax Invoice Seller Settings
  const handleSaveInvoice = async (e) => {
    e.preventDefault()
    try {
      await updateInvoiceConfig({ sellerDetails: invoiceForm }).unwrap()
      setFeedback('✅ Tax Invoice & Seller Details updated successfully! Changes are live on customer invoices.')
      refetchInvoice()
      setTimeout(() => setFeedback(''), 4000)
    } catch {
      alert('Failed to save Tax Invoice configuration.')
    }
  }

  // Sample order for live preview
  const sampleOrder = {
    orderNumber: 'ORD-20260908-40881',
    invoiceNumber: 'INV-2026-6655',
    createdAt: new Date().toISOString(),
    customerName: 'Raj Donga',
    customerEmail: 'work.rajdonga@gmail.com',
    customerPhone: '9265259954',
    shippingAddress: {
      fullName: 'Raj Donga',
      addressLine: '104, Vijay Nagar 2, Puna-Simada Road, Bhavnapark Society',
      city: 'Surat',
      state: 'Gujarat',
      postalCode: '395011',
      phone: '9265259954',
    },
    items: [
      {
        name: 'SENSEIN® Matte Finish Clay Wax',
        quantity: 1,
        price: 499,
        sku: 'SKU-001',
        size: '100g',
      },
    ],
    totalAmount: 499,
    discount: 0,
    shippingFee: 0,
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileCheck className="h-6 w-6 text-blue-600" />
            <span>Tax Invoice & Seller Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your GST Tax Invoice Seller details, Company Information, and Tax registration.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl shadow-xs animate-in fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TAB 1: TAX INVOICE & SELLER DETAILS EDITOR */}
      {activeTab === 'invoice' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span>Tax Invoice Seller & Company Details</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  These details will be dynamically printed on all Customer & Admin GST Tax Invoices.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInvoicePreview(!showInvoicePreview)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Eye className="h-3.5 w-3.5 text-blue-600" />
                <span>{showInvoicePreview ? 'Hide Live Preview' : 'Live Invoice Preview'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-5">
              {/* Row 1: Company Name & Authorized Signatory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Seller / Company Trade Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.companyName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, companyName: e.target.value })}
                    placeholder="e.g. Sensein Botanical Luxury Pvt Ltd"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[11px] text-slate-400">Appears under "SOLD BY" on the Tax Invoice</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Authorized Signatory Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.authorizedSignatory}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, authorizedSignatory: e.target.value })}
                    placeholder="e.g. Sensein Botanical Luxury Pvt Ltd"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[11px] text-slate-400">Printed at the bottom right corner above "Authorized Signatory"</span>
                </div>
              </div>

              {/* Row 2: GSTIN, PAN, State Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    GSTIN Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.gstin}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g. 24AAACR1234F1Z5"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Company PAN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.pan}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, pan: e.target.value.toUpperCase() })}
                    placeholder="e.g. AAACR1234F"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    State & Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.stateCode}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, stateCode: e.target.value })}
                    placeholder="e.g. 24 (Gujarat)"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Dispatch Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Dispatch / Warehouse Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceForm.dispatchAddress}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dispatchAddress: e.target.value })}
                  placeholder="e.g. 104, Vijay Nagar 2, Yogi Chowk, Puna-Simada Road"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Row 4: City, State, Pincode, Default HSN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">City</label>
                  <input
                    type="text"
                    value={invoiceForm.city}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">State</label>
                  <input
                    type="text"
                    value={invoiceForm.state}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Pincode</label>
                  <input
                    type="text"
                    value={invoiceForm.pincode}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono font-bold outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Default HSN Code</label>
                  <input
                    type="text"
                    value={invoiceForm.hsnCode}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Registered Legal Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Seller Registered Legal Address (Bottom of Invoice) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={invoiceForm.registeredAddress}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, registeredAddress: e.target.value })}
                  placeholder="e.g. Sensein Botanical Luxury Private Limited, Plot 104, Yogi Chowk, Puna-Simada Road, Surat, Gujarat - 395010."
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {/* Row 6: Support Phone & Support Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Customer Support Phone</label>
                  <input
                    type="text"
                    value={invoiceForm.supportPhone}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, supportPhone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Customer Support Email</label>
                  <input
                    type="email"
                    value={invoiceForm.supportEmail}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, supportEmail: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingInvoice}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isUpdatingInvoice ? 'Updating...' : 'Save Tax Invoice Details'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Section */}
          {showInvoicePreview && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-6 sm:p-8 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Real-time Tax Invoice Live Preview</span>
                </div>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                  Sample Order #ORD-20260908-40881
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                <DelhiveryTaxInvoice order={sampleOrder} sellerConfig={invoiceForm} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DELHIVERY API CREDENTIALS */}
      {activeTab === 'delhivery' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-red-600" />
              <span>Delhivery API Credentials & Pickup Hub</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure your official Delhivery Production Token and origin warehouse details.
            </p>
          </div>

          <form onSubmit={handleSaveDelhivery} className="space-y-5">
            {/* API Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Delhivery Production API Token <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={settingsForm.apiToken}
                  onChange={(e) => setSettingsForm({ ...settingsForm, apiToken: e.target.value })}
                  placeholder="Enter 40-character Delhivery API Token"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-red-500 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Found under Delhivery One → Settings → API Credentials
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client / Warehouse Identifier */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Client / Warehouse Identifier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settingsForm.pickupLocation}
                  onChange={(e) => setSettingsForm({ ...settingsForm, pickupLocation: e.target.value })}
                  placeholder="e.g. MINDNEXT B2C"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              {/* Origin PIN Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Origin Pickup Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={settingsForm.originPincode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, originPincode: e.target.value })}
                  placeholder="e.g. 395010"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            {/* Pickup Warehouse Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Pickup Warehouse Address
              </label>
              <input
                type="text"
                value={settingsForm.originAddress}
                onChange={(e) => setSettingsForm({ ...settingsForm, originAddress: e.target.value })}
                placeholder="e.g. 104, Vijaynagar 2, Yogichowk"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">City</label>
                <input
                  type="text"
                  value={settingsForm.originCity}
                  onChange={(e) => setSettingsForm({ ...settingsForm, originCity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">State</label>
                <input
                  type="text"
                  value={settingsForm.originState}
                  onChange={(e) => setSettingsForm({ ...settingsForm, originState: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Contact Phone</label>
                <input
                  type="text"
                  value={settingsForm.originPhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, originPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono outline-none"
                />
              </div>
            </div>

            {/* Mode Toggles */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isLiveMode"
                  checked={settingsForm.isLiveMode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, isLiveMode: e.target.checked })}
                  className="h-4 w-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="isLiveMode" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Enable Production Mode (Direct API Manifestation on track.delhivery.com)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAutoShipEnabled"
                  checked={settingsForm.isAutoShipEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, isAutoShipEnabled: e.target.checked })}
                  className="h-4 w-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="isAutoShipEnabled" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Auto-generate Delhivery Waybill when customer places order
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isUpdatingDelhivery}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isUpdatingDelhivery ? 'Saving Settings...' : 'Save API Credentials'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
