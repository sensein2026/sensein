import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Boxes,
  Download,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Building2,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  FileSpreadsheet,
  Layers,
  Filter,
  AlertTriangle,
  Edit3,
  Save,
  X,
  SlidersHorizontal,
  Plus,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react'
import {
  useGetBulkInquiriesQuery,
  useUpdateBulkInquiryStatusMutation,
  useUpdateBulkInquiryMutation,
  useDeleteBulkInquiryMutation,
  useGetBulkConfigQuery,
  useUpdateBulkConfigMutation,
  useGetProductsQuery,
} from '@/features/adminApi'
import { INDIAN_STATES_CITIES, INDIAN_STATES } from '../data/indianStatesCities'

const DEFAULT_QUANTITIES = [
  '25 - 50 Units',
  '50 - 100 Units',
  '100 - 250 Units',
  '250 - 500 Units',
  '500 - 1000 Units',
  '1000+ Units',
]

const PURPOSES = [
  'Distribution (Retailer)',
  'Distribution (Wholesaler)',
  'Distribution (Global)',
  'Other',
]

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  contacted: {
    label: 'Contacted',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: Phone,
  },
  quoted: {
    label: 'Quoted',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    icon: Sparkles,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    icon: XCircle,
  },
}

export default function BulkOrdersPage() {
  const { data: response, isLoading, refetch, isFetching } = useGetBulkInquiriesQuery()
  const { data: configResponse, refetch: refetchConfig } = useGetBulkConfigQuery()
  const { data: productsResponse } = useGetProductsQuery()

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateBulkInquiryStatusMutation()
  const [updateInquiry, { isLoading: isUpdatingInquiry }] = useUpdateBulkInquiryMutation()
  const [deleteInquiry, { isLoading: isDeleting }] = useDeleteBulkInquiryMutation()
  const [updateBulkConfig, { isLoading: isUpdatingConfig }] = useUpdateBulkConfigMutation()

  const inquiries = useMemo(() => response?.data || [], [response])

  // Dynamic Quantities from config
  const quantities = useMemo(() => {
    if (configResponse?.data?.quantities && configResponse.data.quantities.length > 0) {
      return configResponse.data.quantities
    }
    return DEFAULT_QUANTITIES
  }, [configResponse])

  // Dynamic Products from live product inventory
  const productsList = useMemo(() => {
    const defaultList = ['All Products']
    if (productsResponse?.data && Array.isArray(productsResponse.data)) {
      const names = productsResponse.data.map((p) => p.name).filter(Boolean)
      const uniqueNames = Array.from(new Set(names))
      return [...defaultList, ...uniqueNames]
    }
    return [
      ...defaultList,
      'Sensein Volumizing Styling Hair Powder',
      'Sensein Keratin Damage Repair Hair Mask',
      'Sensein Smooth Silk Hair Serum',
      'Sensein Deep Cleansing Shampoo',
      'Sensein Luxury Signature Hair Perfume',
      'Sensein Complete Haircare Professional Kit',
    ]
  }, [productsResponse])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPurpose, setSelectedPurpose] = useState('all')

  // Selected Inquiry for Details & Edit Modal
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [hasEditChanges, setHasEditChanges] = useState(false)

  // Custom Delete Confirmation Modal State
  const [inquiryToDelete, setInquiryToDelete] = useState(null)

  // Quantity Management Modal State
  const [isManagingQuantities, setIsManagingQuantities] = useState(false)
  const [tempQuantities, setTempQuantities] = useState([])
  const [newQuantityInput, setNewQuantityInput] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)
  const [editingText, setEditingText] = useState('')

  // Check if quantity modal has changes
  const hasQuantityChanges = useMemo(() => {
    return JSON.stringify(tempQuantities) !== JSON.stringify(quantities)
  }, [tempQuantities, quantities])

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState('')
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Populate temp quantities when opening quantity manager
  useEffect(() => {
    if (isManagingQuantities) {
      setTempQuantities([...quantities])
      setNewQuantityInput('')
      setEditingIndex(null)
      setEditingText('')
    }
  }, [isManagingQuantities, quantities])

  // Populate edit form when an inquiry is selected
  useEffect(() => {
    if (selectedInquiry) {
      setEditFormData({
        product: selectedInquiry.product || '',
        quantity: selectedInquiry.quantity || '',
        state: selectedInquiry.state || '',
        city: selectedInquiry.city || '',
        purpose: selectedInquiry.purpose || '',
        expectedDeliveryDate: selectedInquiry.expectedDeliveryDate || '',
        remarks: selectedInquiry.remarks || '',
        status: selectedInquiry.status || 'pending',
        organizationName: selectedInquiry.organizationName || '',
      })
      setHasEditChanges(false)
    }
  }, [selectedInquiry])

  // Available cities for edit modal state
  const editAvailableCities = useMemo(() => {
    if (!editFormData.state) return []
    return INDIAN_STATES_CITIES[editFormData.state] || []
  }, [editFormData.state])

  // Track changes in edit form
  const handleEditChange = (field, value) => {
    setEditFormData((prev) => {
      let updated = { ...prev, [field]: value }
      if (field === 'state') {
        updated.city = ''
      }
      const changed =
        updated.product !== (selectedInquiry?.product || '') ||
        updated.quantity !== (selectedInquiry?.quantity || '') ||
        updated.state !== (selectedInquiry?.state || '') ||
        updated.city !== (selectedInquiry?.city || '') ||
        updated.purpose !== (selectedInquiry?.purpose || '') ||
        updated.expectedDeliveryDate !== (selectedInquiry?.expectedDeliveryDate || '') ||
        updated.remarks !== (selectedInquiry?.remarks || '') ||
        updated.status !== (selectedInquiry?.status || 'pending') ||
        updated.organizationName !== (selectedInquiry?.organizationName || '')
      setHasEditChanges(changed)
      return updated
    })
  }

  // Save Inquiry Edits
  const handleSaveInquiryEdits = async (e) => {
    e?.preventDefault?.()
    if (!selectedInquiry?._id) return

    try {
      await updateInquiry({
        id: selectedInquiry._id,
        ...editFormData,
      }).unwrap()

      setSelectedInquiry((prev) => ({
        ...prev,
        ...editFormData,
        updatedAt: new Date().toISOString(),
      }))
      setHasEditChanges(false)
      showToast('Bulk inquiry updated successfully!')
      if (window.__adminToast) {
        window.__adminToast.success('Inquiry details updated in system.', 'Changes Saved')
      }
    } catch (err) {
      showToast(err?.data?.message || 'Failed to update inquiry')
      if (window.__adminToast) {
        window.__adminToast.error(err?.data?.message || 'Failed to update inquiry', 'Update Error')
      }
    }
  }

  // Quantity Management Handlers
  const handleAddQuantity = (e) => {
    e?.preventDefault?.()
    const trimmed = newQuantityInput.trim()
    if (!trimmed) return
    if (tempQuantities.includes(trimmed)) {
      showToast('This quantity tier already exists')
      return
    }
    setTempQuantities((prev) => [...prev, trimmed])
    setNewQuantityInput('')
  }

  const handleDeleteQuantity = (indexToDelete) => {
    if (tempQuantities.length <= 1) {
      showToast('You must keep at least one quantity option')
      return
    }
    setTempQuantities((prev) => prev.filter((_, idx) => idx !== indexToDelete))
  }

  const handleStartEditQuantity = (index, currentText) => {
    setEditingIndex(index)
    setEditingText(currentText)
  }

  const handleSaveItemEdit = (index) => {
    const trimmed = editingText.trim()
    if (!trimmed) return
    setTempQuantities((prev) => {
      const updated = [...prev]
      updated[index] = trimmed
      return updated
    })
    setEditingIndex(null)
    setEditingText('')
  }

  const handleResetQuantityDefaults = () => {
    setTempQuantities([...DEFAULT_QUANTITIES])
    showToast('Reset to default quantity tiers')
  }

  const handleSaveAllQuantities = async () => {
    if (tempQuantities.length === 0) {
      showToast('Quantity tiers cannot be empty')
      return
    }

    try {
      await updateBulkConfig({ quantities: tempQuantities }).unwrap()
      setIsManagingQuantities(false)
      refetchConfig()
      showToast('Quantity tiers updated successfully across website!')
      if (window.__adminToast) {
        window.__adminToast.success(
          'Updated quantity options are now live on storefront form.',
          'Quantities Saved'
        )
      }
    } catch (err) {
      showToast(err?.data?.message || 'Failed to save quantity options')
      if (window.__adminToast) {
        window.__adminToast.error(err?.data?.message || 'Failed to save', 'Error')
      }
    }
  }

  // Filter inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.includes(searchQuery) ||
        item.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.city?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
      const matchesPurpose = selectedPurpose === 'all' || item.purpose === selectedPurpose

      return matchesSearch && matchesStatus && matchesPurpose
    })
  }, [inquiries, searchQuery, selectedStatus, selectedPurpose])

  // KPI Metrics
  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      pending: inquiries.filter((i) => i.status === 'pending').length,
      contacted: inquiries.filter((i) => i.status === 'contacted' || i.status === 'quoted').length,
      completed: inquiries.filter((i) => i.status === 'completed').length,
    }
  }, [inquiries])

  // Handle inline status dropdown change
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap()
      showToast(`Status updated to ${newStatus.toUpperCase()}`)
    } catch (err) {
      showToast('Failed to update status')
    }
  }

  // Confirm and execute delete from custom modal
  const handleConfirmDelete = async () => {
    if (!inquiryToDelete) return


    try {
      await deleteInquiry(inquiryToDelete._id).unwrap()
      if (selectedInquiry?._id === inquiryToDelete._id) setSelectedInquiry(null)
      setInquiryToDelete(null)
      showToast('Inquiry permanently deleted')
      if (window.__adminToast) {
        window.__adminToast.delete('Inquiry has been deleted.', 'Deleted')
      }
    } catch (err) {
      showToast(err?.data?.message || 'Failed to delete inquiry')
      if (window.__adminToast) {
        window.__adminToast.error(err?.data?.message || 'Failed to delete inquiry', 'Delete Error')
      }
    }
  }

  // Excel / CSV Export Function
  const handleExportExcel = () => {
    const listToExport = filteredInquiries.length > 0 ? filteredInquiries : inquiries
    if (listToExport.length === 0) {
      if (window.__adminToast) {
        window.__adminToast.error('No inquiries data available to export.', 'Export Empty')
      }
      return
    }

    const headers = [
      'Inquiry ID',
      'Received Date',
      'Last Updated',
      'Client Full Name',
      'Email Address',
      'Phone Number',
      'Organization / Company',
      'Product Requested',
      'Quantity Requested',
      'Purpose / Category',
      'Delivery State',
      'Delivery City',
      'Expected Delivery Date',
      'Current Status',
      'Remarks & Notes',
    ]

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = listToExport.map((inq) => [
      escapeCsv(inq._id),
      escapeCsv(inq.createdAt ? new Date(inq.createdAt).toLocaleString('en-IN') : 'N/A'),
      escapeCsv(inq.updatedAt ? new Date(inq.updatedAt).toLocaleString('en-IN') : 'N/A'),
      escapeCsv(inq.name),
      escapeCsv(inq.email),
      escapeCsv(inq.phone),
      escapeCsv(inq.organizationName || 'N/A'),
      escapeCsv(inq.product),
      escapeCsv(inq.quantity),
      escapeCsv(inq.purpose),
      escapeCsv(inq.state || 'N/A'),
      escapeCsv(inq.city),
      escapeCsv(inq.expectedDeliveryDate || 'Flexible'),
      escapeCsv((inq.status || 'pending').toUpperCase()),
      escapeCsv(inq.remarks || 'None'),
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Sensein_Bulk_Orders_Updated_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (window.__adminToast) {
      window.__adminToast.success(
        `Successfully exported ${listToExport.length} bulk order leads to Excel!`,
        'Excel Sheet Generated'
      )
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-mono text-[11px] uppercase tracking-widest font-bold">
            <Boxes className="h-3.5 w-3.5" />
            <span>B2B &amp; Wholesale Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display mt-1">
            Bulk Order Inquiries &amp; B2B Leads
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage wholesale leads, configure quantity tiers, and export reports to Excel.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto">
          {/* Manage Quantities Button */}
          <button
            type="button"
            onClick={() => setIsManagingQuantities(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            title="Configure Quantity Tiers"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Quantity Options ({quantities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (.csv)</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 bg-slate-900 text-white text-xs font-semibold rounded-2xl flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Inquiries
            </span>
            <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1">
              {stats.total}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pending Action
            </span>
            <div className="text-2xl font-mono font-extrabold text-amber-600 mt-1">
              {stats.pending}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Contacted / Quoted
            </span>
            <div className="text-2xl font-mono font-extrabold text-blue-600 mt-1">
              {stats.contacted}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
            <Phone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Completed Orders
            </span>
            <div className="text-2xl font-mono font-extrabold text-emerald-600 mt-1">
              {stats.completed}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name, organization, email, phone, state, city, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Purpose Categories</option>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All', count: inquiries.length },
            { id: 'pending', label: 'Pending', count: stats.pending },
            { id: 'contacted', label: 'Contacted', count: inquiries.filter((i) => i.status === 'contacted').length },
            { id: 'quoted', label: 'Quoted', count: inquiries.filter((i) => i.status === 'quoted').length },
            { id: 'completed', label: 'Completed', count: stats.completed },
            { id: 'cancelled', label: 'Cancelled', count: inquiries.filter((i) => i.status === 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedStatus === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Inquiries List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading wholesale inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No bulk order inquiries found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedStatus !== 'all' || selectedPurpose !== 'all'
                ? 'Try adjusting your search criteria or filter options.'
                : 'Customer inquiries submitted on the storefront will appear here instantly.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Client &amp; Company</th>
                  <th className="py-3 px-4">Product &amp; Quantity</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInquiries.map((inq) => {
                  const statusInfo = STATUS_CONFIG[inq.status] || STATUS_CONFIG.pending
                  const StatusIcon = statusInfo.icon

                  return (
                    <tr
                      key={inq._id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedInquiry(inq)}
                    >
                      {/* Client Info */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{inq.name}</span>
                        </div>
                        {inq.organizationName && (
                          <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{inq.organizationName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          <a
                            href={`tel:${inq.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-blue-600 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{inq.phone}</span>
                          </a>
                        </div>
                      </td>

                      {/* Product & Quantity */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="font-bold text-slate-900 truncate" title={inq.product}>
                          {inq.product}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md text-[10px] font-extrabold font-mono">
                            {inq.quantity}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium truncate">
                            {inq.purpose}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-800 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{inq.city}</span>
                        </div>
                        {inq.state && (
                          <div className="text-[10px] text-slate-500 pl-4 font-medium">
                            {inq.state}
                          </div>
                        )}
                      </td>

                      {/* Expected Delivery */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{inq.expectedDeliveryDate || 'Not specified'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Received: {new Date(inq.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={inq.status || 'pending'}
                            onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                            disabled={isUpdatingStatus}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border outline-none cursor-pointer uppercase tracking-wider transition-all appearance-none pr-6 ${statusInfo.bg}`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                              <option key={key} value={key}>
                                {val.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/91${inq.phone.replace(/\D/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(inq.name)},%20thank%20you%20for%20your%20inquiry%20regarding%20${encodeURIComponent(inq.product)}%20bulk%20order.`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => setSelectedInquiry(inq)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View & Edit Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setInquiryToDelete(inq)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* INQUIRY DETAILS & EDIT MODAL (Full Window Blur via createPortal) */}
      {selectedInquiry &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedInquiry(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      B2B Inquiry #{selectedInquiry._id.slice(-6)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(selectedInquiry.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight font-display mt-1">
                    {selectedInquiry.name}
                  </h2>
                  {selectedInquiry.organizationName && (
                    <p className="text-xs font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedInquiry.organizationName}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Phone Number
                  </span>
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="font-bold font-mono text-slate-900 hover:text-blue-600 flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3 text-blue-500" />
                    <span>{selectedInquiry.phone}</span>
                  </a>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 truncate block mt-0.5"
                  >
                    {selectedInquiry.email}
                  </a>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Direct WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/91${selectedInquiry.phone.replace(/\D/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(selectedInquiry.name)},%20thank%20you%20for%20your%20inquiry%20regarding%20${encodeURIComponent(selectedInquiry.product)}%20bulk%20order.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 mt-0.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Open Chat</span>
                  </a>
                </div>
              </div>

              {/* Editable Fields Form */}
              <form onSubmit={handleSaveInquiryEdits} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Order Details &amp; Customization
                  </h3>
                  {hasEditChanges && (
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Unsaved Changes
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Inquiry Status
                    </label>
                    <select
                      value={editFormData.status || 'pending'}
                      onChange={(e) => handleEditChange('status', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors cursor-pointer"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Tier */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Requested Quantity Tier
                    </label>
                    <select
                      value={editFormData.quantity || ''}
                      onChange={(e) => handleEditChange('quantity', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors cursor-pointer"
                    >
                      <option value="" disabled>Select Quantity</option>
                      {quantities.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                      {editFormData.quantity && !quantities.includes(editFormData.quantity) && (
                        <option value={editFormData.quantity}>{editFormData.quantity}</option>
                      )}
                    </select>
                  </div>

                  {/* Product Specification */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Product Specification
                    </label>
                    <select
                      value={editFormData.product || ''}
                      onChange={(e) => handleEditChange('product', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors cursor-pointer"
                    >
                      <option value="" disabled>Select Product</option>
                      {productsList.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      {editFormData.product && !productsList.includes(editFormData.product) && (
                        <option value={editFormData.product}>{editFormData.product}</option>
                      )}
                    </select>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Purchase Purpose
                    </label>
                    <select
                      value={editFormData.purpose || ''}
                      onChange={(e) => handleEditChange('purpose', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors cursor-pointer"
                    >
                      <option value="" disabled>Select Purpose</option>
                      {PURPOSES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery State */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Delivery State
                    </label>
                    <select
                      value={editFormData.state || ''}
                      onChange={(e) => handleEditChange('state', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors cursor-pointer"
                    >
                      <option value="" disabled>Select State / UT</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery City */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Delivery City
                    </label>
                    <select
                      value={editFormData.city || ''}
                      onChange={(e) => handleEditChange('city', e.target.value)}
                      disabled={!editFormData.state}
                      className={`w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors ${
                        !editFormData.state ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <option value="" disabled>
                        {editFormData.state ? 'Select City' : 'Select State First'}
                      </option>
                      {editAvailableCities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {editFormData.city && !editAvailableCities.includes(editFormData.city) && (
                        <option value={editFormData.city}>{editFormData.city}</option>
                      )}
                    </select>
                  </div>

                  {/* Expected Delivery Date */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={editFormData.expectedDeliveryDate || ''}
                      onChange={(e) => handleEditChange('expectedDeliveryDate', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors cursor-pointer"
                    />
                  </div>

                  {/* Remarks / Custom Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Client Remarks &amp; Admin Notes
                    </label>
                    <textarea
                      rows={3}
                      value={editFormData.remarks || ''}
                      onChange={(e) => handleEditChange('remarks', e.target.value)}
                      placeholder="Add special instructions, negotiated discount quotes, or packaging requests..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors resize-y leading-relaxed font-mono"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={!hasEditChanges || isUpdatingInquiry}
                    className={`w-full sm:flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      hasEditChanges
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUpdatingInquiry ? 'Saving Changes...' : 'Save Changes'}</span>
                  </button>

                  <a
                    href={`https://wa.me/91${selectedInquiry.phone.replace(/\D/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(selectedInquiry.name)},%20thank%20you%20for%20your%20inquiry%20regarding%20${encodeURIComponent(selectedInquiry.product)}%20bulk%20order.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Client</span>
                  </a>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* QUANTITY TIERS CONFIGURATION MODAL (Full Window Blur via createPortal) */}
      {isManagingQuantities &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsManagingQuantities(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight font-display">
                      Manage Quantity Tiers
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add, edit, or remove quantity ranges shown on the bulk order form.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsManagingQuantities(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Quantity Input */}
              <form onSubmit={handleAddQuantity} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newQuantityInput}
                  onChange={(e) => setNewQuantityInput(e.target.value)}
                  placeholder="e.g. 2000 - 5000 Units or 5000+ Units"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newQuantityInput.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Tier</span>
                </button>
              </form>

              {/* List of Current Quantity Tiers */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {tempQuantities.map((tier, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {editingIndex === idx ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 px-2.5 py-1 bg-white border border-blue-600 rounded-lg text-xs font-semibold text-slate-900 outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveItemEdit(idx)
                              if (e.key === 'Escape') setEditingIndex(null)
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveItemEdit(idx)}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                            title="Save Edit"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-800 truncate">{tier}</span>
                      )}
                    </div>

                    {editingIndex !== idx && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditQuantity(idx, tier)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                          title="Edit Tier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuantity(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                          title="Remove Tier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManagingQuantities(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllQuantities}
                    disabled={!hasQuantityChanges || isUpdatingConfig}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      hasQuantityChanges
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUpdatingConfig ? 'Saving...' : 'Save & Publish'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* CUSTOM DELETE CONFIRMATION MODAL (Full Window Blur via createPortal) */}
      {inquiryToDelete &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setInquiryToDelete(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in-95 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-display">
                  Delete Bulk Inquiry?
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Are you sure you want to permanently delete the inquiry from{' '}
                  <span className="font-bold text-slate-800">"{inquiryToDelete.name}"</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInquiryToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
