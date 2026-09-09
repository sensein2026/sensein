import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Copy,
  Percent,
  Sparkles,
  RefreshCw,

  X,
  AlertCircle,
  TrendingUp,
  Gift,
  Coins,
  ArrowUpDown,
  Check,
  Truck,
  Save,
  Zap,
} from 'lucide-react'
import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useToggleCouponMutation,
  useGetShippingFeeSettingsQuery,
  useUpdateShippingFeeSettingsMutation,
} from '@/features/adminApi'
import { useToast } from '@/context/ToastContext'
import ConfirmModal from '@/components/ConfirmModal'

export default function CouponsPage() {
  const { addToast } = useToast()
  const { data: couponsData, isLoading, isError, refetch } = useGetCouponsQuery()

  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation()
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation()
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponMutation()
  const [toggleCoupon, { isLoading: isToggling }] = useToggleCouponMutation()

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, ACTIVE, INACTIVE
  const [typeFilter, setTypeFilter] = useState('ALL') // ALL, PERCENTAGE, FIXED

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [copiedCode, setCopiedCode] = useState('')

  // Shipping Fee Settings State & API
  const {
    data: shippingSettingsData,
    isLoading: isLoadingShipping,
    refetch: refetchShipping,
  } = useGetShippingFeeSettingsQuery()
  const [updateShippingFeeSettings, { isLoading: isSavingShipping }] =
    useUpdateShippingFeeSettingsMutation()

  const [shippingForm, setShippingForm] = useState({
    standardShippingFee: 0,
    freeShippingThreshold: 0,
    isFreeShippingEnabled: true,
    shippingNote: 'Free standard express shipping nationwide on all orders',
  })

  useEffect(() => {
    if (shippingSettingsData?.settings) {
      setShippingForm({
        standardShippingFee: shippingSettingsData.settings.standardShippingFee ?? 0,
        freeShippingThreshold: shippingSettingsData.settings.freeShippingThreshold ?? 0,
        isFreeShippingEnabled: shippingSettingsData.settings.isFreeShippingEnabled ?? true,
        shippingNote:
          shippingSettingsData.settings.shippingNote ||
          'Free standard express shipping nationwide on all orders',
      })
    }
  }, [shippingSettingsData])

  const handleSaveShippingSettings = async (e) => {
    e?.preventDefault()
    try {
      const res = await updateShippingFeeSettings({
        standardShippingFee: Math.max(0, Number(shippingForm.standardShippingFee) || 0),
        freeShippingThreshold: Math.max(0, Number(shippingForm.freeShippingThreshold) || 0),
        isFreeShippingEnabled: Boolean(shippingForm.isFreeShippingEnabled),
        shippingNote: shippingForm.shippingNote.trim(),
      }).unwrap()
      addToast(res.message || 'Shipping fee & delivery settings updated successfully!', 'success')
    } catch (err) {
      addToast(err?.data?.message || 'Failed to update shipping settings', 'error')
    }
  }

  const handleApplyPreset = (preset) => {
    if (preset === 'FREE') {
      setShippingForm((prev) => ({
        ...prev,
        standardShippingFee: 0,
        freeShippingThreshold: 0,
        isFreeShippingEnabled: true,
        shippingNote: 'Free standard express shipping nationwide on all orders',
      }))
    } else if (preset === '49_499') {
      setShippingForm((prev) => ({
        ...prev,
        standardShippingFee: 49,
        freeShippingThreshold: 499,
        isFreeShippingEnabled: true,
        shippingNote: 'Standard shipping ₹49 • Free express delivery on orders above ₹499',
      }))
    } else if (preset === '79_999') {
      setShippingForm((prev) => ({
        ...prev,
        standardShippingFee: 79,
        freeShippingThreshold: 999,
        isFreeShippingEnabled: true,
        shippingNote: 'Standard shipping ₹79 • Free express delivery on orders above ₹999',
      }))
    }
  }

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, code: '' })

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: '',
    minSpend: 499,
    description: '',
    badge: '',
    aliases: '',
    firstOrderOnly: false,
    isActive: true,
  })
  const [formError, setFormError] = useState('')

  const coupons = Array.isArray(couponsData?.data)
    ? couponsData.data
    : Array.isArray(couponsData)
      ? couponsData
      : []

  // Metrics
  const stats = useMemo(() => {
    const total = coupons.length
    const active = coupons.filter((c) => c.isActive).length
    const percentage = coupons.filter((c) => c.discountType === 'percentage').length
    const fixed = coupons.filter((c) => c.discountType === 'fixed').length
    return { total, active, percentage, fixed }
  }, [coupons])

  // Filtered list
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesSearch =
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && coupon.isActive) ||
        (statusFilter === 'INACTIVE' && !coupon.isActive)

      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'PERCENTAGE' && coupon.discountType === 'percentage') ||
        (typeFilter === 'FIXED' && coupon.discountType === 'fixed')

      return matchesSearch && matchesStatus && matchesType
    })
  }, [coupons, searchQuery, statusFilter, typeFilter])

  const handleOpenAddModal = () => {
    setEditingCoupon(null)
    setFormData({
      code: '',
      title: '',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscount: '',
      minSpend: 499,
      description: '',
      badge: '',
      aliases: '',
      firstOrderOnly: false,
      isActive: true,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code || '',
      title: coupon.title || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || 10,
      maxDiscount: coupon.maxDiscount !== null && coupon.maxDiscount !== undefined ? coupon.maxDiscount : '',
      minSpend: coupon.minSpend || 0,
      description: coupon.description || '',
      badge: coupon.badge || 'OFFER',
      aliases: Array.isArray(coupon.aliases) ? coupon.aliases.join(', ') : '',
      firstOrderOnly: Boolean(coupon.firstOrderOnly),
      isActive: coupon.isActive !== false,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleCopyCode = (code, e) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    addToast(`Coupon code '${code}' copied!`, 'success')
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const handleToggleStatus = async (coupon) => {
    try {
      const res = await toggleCoupon(coupon._id).unwrap()
      addToast(res.message || `Coupon status updated!`, 'success')
    } catch (err) {
      addToast(err?.data?.message || 'Failed to update coupon status', 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return
    try {
      await deleteCoupon(deleteConfirm.id).unwrap()
      addToast(`Coupon '${deleteConfirm.code}' deleted successfully!`, 'success')
      setDeleteConfirm({ isOpen: false, id: null, code: '' })
    } catch (err) {
      addToast(err?.data?.message || 'Failed to delete coupon', 'error')
    }
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setFormError('')

    const cleanCode = formData.code.trim().toUpperCase()
    if (!cleanCode) {
      setFormError('Coupon code is required')
      return
    }

    if (!formData.title.trim()) {
      setFormError('Coupon title is required')
      return
    }

    if (Number(formData.discountValue) <= 0) {
      setFormError('Discount value must be greater than 0')
      return
    }

    const payload = {
      code: cleanCode,
      title: formData.title.trim(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      minSpend: Number(formData.minSpend) || 0,
      description: formData.description.trim(),
      badge: formData.badge.trim().toUpperCase() || 'OFFER',
      aliases: formData.aliases
        .split(',')
        .map((a) => a.trim().toUpperCase())
        .filter(Boolean),
      firstOrderOnly: formData.firstOrderOnly,
      isActive: formData.isActive,
    }

    try {
      if (editingCoupon) {
        await updateCoupon({ id: editingCoupon._id, ...payload }).unwrap()
        addToast(`Coupon '${cleanCode}' updated successfully!`, 'success')
      } else {
        await createCoupon(payload).unwrap()
        addToast(`Coupon '${cleanCode}' created successfully!`, 'success')
      }
      setIsModalOpen(false)
    } catch (err) {
      setFormError(err?.data?.message || 'Failed to save coupon. Please check details.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Coupons & Discounts
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage promotional discount codes, welcome offers, and instant vouchers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
            title="Refresh coupons"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Coupons
            </span>
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Offers
            </span>
            <span className="text-2xl font-bold text-emerald-600">{stats.active}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Percentage %
            </span>
            <span className="text-2xl font-bold text-slate-900">{stats.percentage}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Flat Cash (₹)
            </span>
            <span className="text-2xl font-bold text-slate-900">{stats.fixed}</span>
          </div>
        </div>
      </div>

      {/* Store Shipping Fee & Free Delivery Policy Management Card */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-blue-200/60 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shadow-blue-500/20">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Store Shipping Fee & Free Delivery Threshold
                </h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600 text-white tracking-wider uppercase shadow-xs">
                  {Number(shippingForm.standardShippingFee) === 0
                    ? 'Free Shipping on All Orders'
                    : shippingForm.isFreeShippingEnabled && Number(shippingForm.freeShippingThreshold) > 0
                      ? `₹${shippingForm.standardShippingFee} (Free > ₹${shippingForm.freeShippingThreshold})`
                      : `₹${shippingForm.standardShippingFee} Flat Rate`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure standard customer shipping fees and free delivery order thresholds applied during cart checkout.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Presets:
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('FREE')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Zap className="h-3 w-3 text-emerald-500" />
              <span>Always Free (₹0)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('49_499')}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>₹49 (Free &gt; ₹499)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('79_999')}
              className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>₹79 (Free &gt; ₹999)</span>
            </button>
          </div>
        </div>

        {/* Shipping Form Controls */}
        <form onSubmit={handleSaveShippingSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Standard Shipping Fee */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standard Shipping Fee (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="0"
                  value={shippingForm.standardShippingFee}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      standardShippingFee: e.target.value,
                    }))
                  }
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Set to 0 to provide 100% Free Shipping on all orders nationwide.
              </p>
            </div>

            {/* Free Shipping Minimum Threshold */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Free Shipping Threshold (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 499"
                  value={shippingForm.freeShippingThreshold}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      freeShippingThreshold: e.target.value,
                    }))
                  }
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Orders with subtotal at or above this amount automatically receive Free Delivery.
              </p>
            </div>

            {/* Delivery Policy Note */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Checkout Delivery Policy Note
              </label>
              <input
                type="text"
                placeholder="e.g. Free express delivery nationwide"
                value={shippingForm.shippingNote}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    shippingNote: e.target.value,
                  }))
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Displayed in the cart &amp; checkout summary box for customer clarity.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shippingForm.isFreeShippingEnabled}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    isFreeShippingEnabled: e.target.checked,
                  }))
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-700">
                Enable Free Shipping condition (Orders above threshold get ₹0 delivery)
              </span>
            </label>

            <button
              type="submit"
              disabled={isSavingShipping}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isSavingShipping ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Shipping Rates...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Shipping Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, title or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Flat (₹)</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading promotional coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Tag className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No coupons found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first promotional discount coupon.'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <button
                onClick={handleOpenAddModal}
                className="mt-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
              >
                + Create First Coupon
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Coupon Code & Badge</th>
                  <th className="py-3.5 px-4">Title & Description</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min. Spend</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => {
                  return (
                    <tr
                      key={coupon._id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Code & Badge */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                            <span>{coupon.code}</span>
                          </div>
                          <button
                            onClick={(e) => handleCopyCode(coupon.code, e)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                            title="Copy code"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {coupon.badge && (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded uppercase tracking-wider">
                              {coupon.badge}
                            </span>
                          )}
                          {coupon.firstOrderOnly && (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
                              1st Order Only
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <div className="font-bold text-slate-900 text-xs">{coupon.title}</div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {coupon.description || 'No description provided.'}
                        </p>
                        {coupon.aliases && coupon.aliases.length > 1 && (
                          <div className="mt-1 text-[10px] text-slate-400">
                            Aliases: <span className="font-mono">{coupon.aliases.filter((a) => a !== coupon.code).join(', ')}</span>
                          </div>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          {coupon.discountType === 'percentage' ? (
                            <>
                              <span className="text-purple-600 font-extrabold">{coupon.discountValue}% OFF</span>
                              {coupon.maxDiscount && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  (Cap: ₹{coupon.maxDiscount})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-emerald-600 font-extrabold">
                              ₹{coupon.discountValue} FLAT
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        </span>
                      </td>

                      {/* Min Spend */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {coupon.minSpend > 0 ? `₹${coupon.minSpend.toLocaleString('en-IN')}` : 'No Minimum'}
                        </div>
                        <span className="text-[10px] text-slate-400">Minimum Order</span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${coupon.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${coupon.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                          />
                          <span>{coupon.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit coupon"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: coupon._id,
                                code: coupon.code,
                              })
                            }
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal - Portaled to document.body to blur and cover entire viewport including top header */}
      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in"
            style={{ zIndex: 999999 }}
          >
            {/* Full-Screen Backdrop Blur Overlay */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity cursor-pointer"
              style={{ zIndex: 999999 }}
              onClick={() => setIsModalOpen(false)}
            />

            <div
              className="relative bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
              style={{ zIndex: 1000000 }}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Tag className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Code & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SENSEIN20"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Offer Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 20% OFF Botanical Haircare"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({ ...formData, discountType: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none font-medium cursor-pointer"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Discount Value * {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formData.discountType === 'percentage' ? 100 : 100000}
                      placeholder="e.g. 15"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Max Discount & Min Spend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder={formData.discountType === 'percentage' ? 'e.g. 500 (Optional)' : 'N/A'}
                      value={formData.maxDiscount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDiscount: e.target.value })
                      }
                      disabled={formData.discountType === 'fixed'}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none font-medium disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Minimum Order Spend (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 499 (0 for no min)"
                      value={formData.minSpend}
                      onChange={(e) =>
                        setFormData({ ...formData, minSpend: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Badge & Aliases */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Badge Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. POPULAR, BEST VALUE"
                      value={formData.badge}
                      onChange={(e) =>
                        setFormData({ ...formData, badge: e.target.value.toUpperCase() })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none font-medium uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Aliases (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SAVE10, DISCOUNT10"
                      value={formData.aliases}
                      onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Terms
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Explain discount terms shown to customers..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
                  />
                </div>

                {/* 1st Order Exclusive Toggle */}
                <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      1st Order Exclusive (New Customers Only)
                    </span>
                    <span className="text-[11px] text-amber-700">
                      Visible & usable only on 1st purchase. Automatically hidden after an order is placed.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, firstOrderOnly: !formData.firstOrderOnly })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${formData.firstOrderOnly ? 'bg-amber-600' : 'bg-slate-300'
                      }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.firstOrderOnly ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* Active Toggle Switch */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Coupon Active Status
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Customers can immediately apply this coupon at checkout.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 ro
                        unded-full shadow-md transform transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* Modal Footer */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {(isCreating || isUpdating) && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    <span>{editingCoupon ? 'Save Changes' : 'Create Coupon'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, code: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon"
        message={`Are you sure you want to permanently delete coupon "${deleteConfirm.code}"? Customers will no longer be able to use this voucher.`}
        confirmText="Delete Coupon"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
