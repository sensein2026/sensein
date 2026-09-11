import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  User,
  ShoppingBag,
  Package,
  Truck,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Mail,
  MapPin,
  Plus,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  CreditCard,
  ArrowRight,
  Edit2,
  Save,
  Download,
  Upload,
  Video,
  Sparkles,
  Eye,
  ExternalLink,
  HelpCircle,
} from 'lucide-react'
import {
  useGetMyOrdersQuery,
  useLazyCheckPincodeQuery,
  useCancelUserOrderMutation,
  useUpdateOrderAddressMutation,
  useGetPublicInvoiceConfigQuery,
  useCreateReturnRequestMutation,
} from '@/features/ordersApi'
import { useGetProductsQuery } from '@/features/productsApi'
import {
  useGetSavedAddressesQuery,
  useAddSavedAddressMutation,
  useUpdateSavedAddressMutation,
  useDeleteSavedAddressMutation,
  useUpdateProfileMutation,
} from '@/features/authApi'
import { selectIsAuthenticated, selectCurrentUser, setCredentials } from '@/store/authSlice'
import { openAuthModal } from '@/store/uiSlice'
import { DelhiveryTaxInvoice } from '@/components/PrintableDocuments'
import FlipkartOrderTimeline from '@/components/FlipkartOrderTimeline'
import ConfirmModal from '@/components/ConfirmModal'
import CancelOrderModal from '@/components/CancelOrderModal'

export default function AccountPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)

  const tabQuery = searchParams.get('tab')
  const validTabs = ['orders', 'addresses', 'profile']
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(tabQuery) ? tabQuery : 'orders'
  )

  // Sync activeTab whenever URL ?tab= changes
  useEffect(() => {
    if (tabQuery && validTabs.includes(tabQuery)) {
      setActiveTab(tabQuery)
    }
  }, [tabQuery])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const displayName = user?.name || 'Customer'
  const [editName, setEditName] = useState(displayName)
  const [isEditingName, setIsEditingName] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr))
    }, 4500)
  }

  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [deleteAddrModal, setDeleteAddrModal] = useState(null)

  const [unavailableModal, setUnavailableModal] = useState(null)
  const [selectedOrderModal, setSelectedOrderModal] = useState(null)
  const [editingOrderAddress, setEditingOrderAddress] = useState(null)
  const [orderAddressForm, setOrderAddressForm] = useState({
    customerName: '',
    customerPhone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  })

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation()
  const [updateOrderAddress, { isLoading: isUpdatingOrderAddress }] = useUpdateOrderAddressMutation()
  const [createReturnRequest, { isLoading: isSubmittingReturn }] = useCreateReturnRequestMutation()

  const isWithin7DaysReplacement = (order) => {
    if (!order) return false
    const status = (order.fulfillmentStatus || order.orderStatus || '').toUpperCase()
    if (status !== 'DELIVERED') return false
    if (order.returnStatus && order.returnStatus !== 'NONE') return false
    const delDate = order.deliveredAt || order.deliveryDate || order.updatedAt
    if (!delDate) return true
    const diffMs = Date.now() - new Date(delDate).getTime()
    return diffMs <= 7 * 24 * 60 * 60 * 1000
  }

  const [returnModalOrder, setReturnModalOrder] = useState(null)
  const [viewingReturnData, setViewingReturnData] = useState(null)
  const [previewMediaUrl, setPreviewMediaUrl] = useState(null)
  const [returnForm, setReturnForm] = useState({
    selectedItems: {}, // prodId -> { selected, quantity, reason, customerComment, customReason }
    requestType: 'RETURN_REPLACEMENT',
    evidenceMedia: [], // array of { url, fileName, mimeType }
    generalComment: '',
    selectedReason: 'Damaged Product', // 'Damaged Product' | 'Wrong Product' | 'Other'
    otherReasonText: '',
  })

  const handleOpenViewReturnModal = (order) => {
    const returnReq =
      Array.isArray(order.returnRequests) && order.returnRequests.length > 0
        ? order.returnRequests[order.returnRequests.length - 1]
        : null

    setViewingReturnData({
      order,
      returnReq: returnReq || {
        returnNumber: `RET-${order.orderNumber}`,
        status: order.replacementStatus || order.returnStatus || 'REQUESTED',
        requestType: order.replacementStatus ? 'RETURN_REPLACEMENT' : 'RETURN_REFUND',
        rejectionReason: order.rejectionReason || '',
        reverseWaybill: order.reverseWaybill || order.activeShipment?.waybill || '',
        customerComment: order.customerComment || '',
        evidenceMedia: [],
        items: order.items || [],
      },
    })
  }

  const handleOpenReturnModal = (order) => {
    const initialSelected = {}
    ;(order.items || []).forEach((item) => {
      const pId = item.product?._id || item.product || item._id
      initialSelected[pId] = {
        selected: true,
        product: item.product,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        maxQuantity: item.quantity || 1,
        image: item.image,
      }
    })

    setReturnForm({
      selectedItems: initialSelected,
      requestType: 'RETURN_REPLACEMENT',
      evidenceMedia: [],
      generalComment: '',
      selectedReason: 'Damaged Product',
      otherReasonText: '',
    })
    setReturnModalOrder(order)
  }

  const handleEvidenceFileUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        showToast(`File ${file.name} is too large. Max size is 25MB.`, 'error')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setReturnForm((prev) => ({
          ...prev,
          evidenceMedia: [
            ...prev.evidenceMedia,
            {
              url: event.target.result,
              fileName: file.name,
              mimeType: file.type,
              size: file.size,
            },
          ],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveEvidence = (index) => {
    setReturnForm((prev) => ({
      ...prev,
      evidenceMedia: prev.evidenceMedia.filter((_, idx) => idx !== index),
    }))
  }

  const handleSubmitReturnRequest = async (e) => {
    e.preventDefault()
    if (!returnModalOrder) return

    const itemsToReturn = Object.values(returnForm.selectedItems).filter((it) => it.selected)
    if (itemsToReturn.length === 0) {
      showToast('Please select at least one item for replacement / return.', 'error')
      return
    }

    const finalReason =
      returnForm.selectedReason === 'Other'
        ? returnForm.otherReasonText.trim() || 'Other reason specified by customer'
        : returnForm.selectedReason

    const formattedItems = itemsToReturn.map((it) => ({
      ...it,
      reason: finalReason,
      customerComment: returnForm.generalComment || it.customerComment,
    }))

    try {
      const res = await createReturnRequest({
        orderId: returnModalOrder._id,
        items: formattedItems,
        requestType: returnForm.requestType,
        evidenceMedia: returnForm.evidenceMedia,
        customerComment: `${finalReason}: ${returnForm.generalComment || ''}`.trim(),
      }).unwrap()

      showToast(res?.message || 'Replacement request submitted successfully! We will arrange reverse pickup.', 'success')
      setReturnModalOrder(null)
      refetchOrders()
    } catch (err) {
      showToast(err?.data?.message || 'Failed to submit replacement request. Please contact support.', 'error')
    }
  }

  const handleSaveOrderAddress = async (e) => {
    e.preventDefault()
    if (!editingOrderAddress) return
    if (
      !orderAddressForm.customerName.trim() ||
      !orderAddressForm.customerPhone.trim() ||
      !orderAddressForm.addressLine.trim() ||
      !orderAddressForm.postalCode.trim() ||
      !orderAddressForm.city.trim() ||
      !orderAddressForm.state.trim()
    ) {
      showToast('કૃપા કરીને બધા ડિલિવરી એડ્રેસ ફિલ્ડ ભરો.', 'error')
      return
    }

    try {
      const res = await updateOrderAddress({
        id: editingOrderAddress._id,
        ...orderAddressForm,
      }).unwrap()

      showToast(res?.message || 'ડિલિવરી એડ્રેસ સફળતાપૂર્વક અપડેટ થઈ ગયું છે!', 'success')

      if (selectedOrderModal && selectedOrderModal._id === editingOrderAddress._id) {
        setSelectedOrderModal((prev) => ({
          ...prev,
          customerName: orderAddressForm.customerName.trim(),
          customerPhone: orderAddressForm.customerPhone.trim(),
          shippingAddress: {
            ...prev.shippingAddress,
            fullName: orderAddressForm.customerName.trim(),
            phone: orderAddressForm.customerPhone.trim(),
            addressLine: orderAddressForm.addressLine.trim(),
            city: orderAddressForm.city.trim(),
            state: orderAddressForm.state.trim(),
            postalCode: orderAddressForm.postalCode.trim(),
          },
        }))
      }
      setEditingOrderAddress(null)
      refetchOrders()
    } catch (err) {
      showToast(err?.data?.message || 'Failed to update delivery address', 'error')
    }
  }

  // Reset editName to the verified saved user.name whenever tab switches or user profile changes
  useEffect(() => {
    setEditName(user?.name || '')
  }, [user?.name, activeTab])

  const handleSaveName = async (e) => {
    e?.preventDefault()
    if (!editName.trim()) return
    try {
      const res = await updateProfile({ name: editName.trim() }).unwrap()
      if (res.success && res.user) {
        dispatch(
          setCredentials({
            user: res.user,
          })
        )
        setIsEditingName(false)
        setSaveSuccessMsg('Name updated successfully!')
        setTimeout(() => setSaveSuccessMsg(''), 3000)
        showToast('Name updated successfully!', 'success')
      }
    } catch (err) {
      showToast(err?.data?.message || 'Failed to update name', 'error')
    }
  }

  const { data: ordersResponse, isLoading, refetch: refetchOrders } = useGetMyOrdersQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 5000,
  })
  const orders = ordersResponse?.data || []
  const [cancelUserOrder, { isLoading: isCancellingOrder }] = useCancelUserOrderMutation()

  const { data: invoiceConfigData } = useGetPublicInvoiceConfigQuery()
  const sellerConfig = invoiceConfigData?.sellerDetails
  const [printingOrder, setPrintingOrder] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handleDownloadInvoice = async (order) => {
    setPrintingOrder(order)
    setIsGeneratingPdf(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 350))
      const orderNum = order.orderNumber || 'Invoice'
      const prevTitle = document.title
      document.title = `Sensein_Tax_Invoice_${orderNum}`
      window.print()
      setTimeout(() => { document.title = prevTitle }, 1500)
    } finally {
      setIsGeneratingPdf(false)
      setTimeout(() => setPrintingOrder(null), 800)
    }
  }

  const handleConfirmCancelOrder = async (orderId, orderNum, reason) => {
    try {
      const res = await cancelUserOrder({ id: orderId, reason }).unwrap()
      showToast(res?.message || `Order #${orderNum} cancelled successfully.`, 'success')
      if (selectedOrderModal && (selectedOrderModal._id === orderId || selectedOrderModal.orderNumber === orderNum)) {
        setSelectedOrderModal((prev) => (prev ? { ...prev, orderStatus: 'CANCELLED', fulfillmentStatus: 'CANCELLED' } : null))
      }
      setCancelModalOrder(null)
      refetchOrders()
    } catch (err) {
      throw err
    }
  }

  // Fetch all active products to check availability
  const { data: catalogResponse } = useGetProductsQuery({ limit: 100 })
  const activeProducts = catalogResponse?.data || []

  // Address Book APIs
  const { data: addressRes } = useGetSavedAddressesQuery(undefined, { skip: !isAuthenticated })
  const savedAddresses = addressRes?.data || []
  const [addAddress, { isLoading: isAddingAddr }] = useAddSavedAddressMutation()
  const [updateAddress, { isLoading: isUpdatingAddr }] = useUpdateSavedAddressMutation()
  const [deleteAddress, { isLoading: isDeletingAddr }] = useDeleteSavedAddressMutation()

  const [editingAddr, setEditingAddr] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    title: 'Home',
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  })
  const [addErrors, setAddErrors] = useState({})

  const [checkPincode] = useLazyCheckPincodeQuery()

  const handleSetDefaultAddress = async (addr) => {
    try {
      await updateAddress({
        addressId: addr._id,
        title: addr.title || 'Home',
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine: addr.addressLine,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        isDefault: true,
      }).unwrap()
      showToast('Default delivery address updated!', 'success')
    } catch (err) {
      showToast(err?.data?.message || 'Failed to set default address', 'error')
    }
  }

  // Universal Modal Scroll Lock (Locks background body scroll whenever any dialog/modal is open)
  const isAnyModalOpen = Boolean(
    cancelModalOrder ||
    deleteAddrModal ||
    unavailableModal ||
    selectedOrderModal ||
    editingOrderAddress ||
    returnModalOrder ||
    viewingReturnData ||
    previewMediaUrl ||
    editingAddr ||
    showAddForm
  )

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAnyModalOpen])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!isAuthenticated) {
      dispatch(openAuthModal('/account'))
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate, dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  // Handle clicking on an ordered product
  const handleItemClick = (item) => {
    const matched = activeProducts.find(
      (p) => p._id === item.product || p._id === item.product?._id || p.name === item.name
    )
    if (matched && matched.slug) {
      navigate(`/product/${matched.slug}`)
    } else {
      navigate('/shop')
    }
  }

  const handlePincodeChange = async (val, isEdit = true) => {
    const clean = val.replace(/\D/g, '').slice(0, 6)
    if (isEdit) {
      setEditingAddr((p) => (p ? { ...p, postalCode: clean } : null))
      setEditErrors((p) => ({ ...p, postalCode: '' }))
    } else {
      setNewAddr((p) => ({ ...p, postalCode: clean }))
      setAddErrors((p) => ({ ...p, postalCode: '' }))
    }

    if (clean.length === 6) {
      setPincodeStatus({
        isChecking: true,
        valid: null,
        deliverable: null,
        message: 'Verifying with Delhivery Express...',
        courier: '',
      })
      try {
        const res = await triggerCheckPincode(clean).unwrap()
        const data = res?.data || res
        if (data?.valid) {
          if (data?.deliverable) {
            setPincodeStatus({
              isChecking: false,
              valid: true,
              deliverable: true,
              message: data.message || `Delivery available via ${data.courier || 'Delhivery Express'}`,
              courier: data.courier || 'Delhivery Express',
            })
            // Auto update city and state if returned
            if (data.city) {
              if (isEdit) {
                setEditingAddr((p) => (p ? { ...p, city: data.city, state: data.state || p.state } : null))
                setEditErrors((p) => ({ ...p, city: '' }))
              } else {
                setNewAddr((p) => ({ ...p, city: data.city, state: data.state || p.state }))
                setAddErrors((p) => ({ ...p, city: '' }))
              }
            }
          } else {
            setPincodeStatus({
              isChecking: false,
              valid: true,
              deliverable: false,
              message: data.message || 'Delivery service is not available for this PIN code',
              courier: '',
            })
          }
        } else {
          setPincodeStatus({
            isChecking: false,
            valid: false,
            deliverable: false,
            message: 'Please enter a valid PIN code',
            courier: '',
          })
        }
      } catch (err) {
        setPincodeStatus({
          isChecking: false,
          valid: false,
          deliverable: false,
          message: 'Please enter a valid PIN code',
          courier: '',
        })
      }
    } else {
      setPincodeStatus({ isChecking: false, valid: null, deliverable: null, message: '', courier: '' })
    }
  }

  const handlePhoneChange = (val, isEdit = true) => {
    const clean = val.replace(/\D/g, '').slice(0, 10)
    if (isEdit) {
      setEditingAddr((p) => (p ? { ...p, phone: clean } : null))
      setEditErrors((p) => ({ ...p, phone: '' }))
    } else {
      setNewAddr((p) => ({ ...p, phone: clean }))
      setAddErrors((p) => ({ ...p, phone: '' }))
    }
  }

  const handleStartEdit = (addr) => {
    setShowAddForm(false)
    setEditErrors({})
    const pin = addr.postalCode || ''
    const cleanPhone = String(addr.phone || '').replace(/\D/g, '').slice(-10)
    setEditingAddr({
      addressId: addr._id,
      title: addr.title || 'Home',
      fullName: addr.fullName || '',
      phone: cleanPhone,
      addressLine: addr.addressLine || '',
      city: addr.city || '',
      state: addr.state || 'Gujarat',
      postalCode: pin,
      isDefault: !!addr.isDefault,
    })

    if (pin.length === 6) {
      handlePincodeChange(pin, true)
    } else {
      setPincodeStatus({ isChecking: false, valid: null, deliverable: null, message: '', courier: '' })
    }
  }

  const handleUpdateAddressSubmit = async (e) => {
    e.preventDefault()
    if (!editingAddr) return

    const errors = {}
    const cleanPhone = String(editingAddr.phone || '').replace(/\D/g, '')

    if (!editingAddr.fullName?.trim()) {
      errors.fullName = 'Full recipient name is required'
    }

    if (!cleanPhone) {
      errors.phone = 'Mobile number is required'
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9'
    }

    if (!editingAddr.postalCode || editingAddr.postalCode.length !== 6) {
      errors.postalCode = 'Please enter a valid 6-digit PIN code'
    } else if (pincodeStatus.valid === false) {
      errors.postalCode = pincodeStatus.message || 'Please enter a valid PIN code'
    } else if (pincodeStatus.deliverable === false) {
      errors.postalCode = 'Delivery service is not available for this PIN code'
    }

    if (!editingAddr.addressLine?.trim()) {
      errors.addressLine = 'Street / House address is required'
    }

    if (!editingAddr.city?.trim()) {
      errors.city = 'City is required'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    setEditErrors({})
    try {
      await updateAddress({ ...editingAddr, phone: cleanPhone }).unwrap()
      setEditingAddr(null)
      setPincodeStatus({ isChecking: false, valid: null, deliverable: null, message: '', courier: '' })
    } catch (err) {
      setEditErrors({ general: err?.data?.message || 'Failed to update address' })
    }
  }

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault()

    const errors = {}
    const cleanPhone = String(newAddr.phone || '').replace(/\D/g, '')

    if (!newAddr.fullName?.trim()) {
      errors.fullName = 'Full recipient name is required'
    }

    if (!cleanPhone) {
      errors.phone = 'Mobile number is required'
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9'
    }

    if (!newAddr.postalCode || newAddr.postalCode.length !== 6) {
      errors.postalCode = 'Please enter a valid 6-digit PIN code'
    } else if (pincodeStatus.valid === false) {
      errors.postalCode = pincodeStatus.message || 'Please enter a valid PIN code'
    } else if (pincodeStatus.deliverable === false) {
      errors.postalCode = 'Delivery service is not available for this PIN code'
    }

    if (!newAddr.addressLine?.trim()) {
      errors.addressLine = 'Street / House address is required'
    }

    if (!newAddr.city?.trim()) {
      errors.city = 'City is required'
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors)
      return
    }

    setAddErrors({})
    try {
      await addAddress({ ...newAddr, phone: cleanPhone }).unwrap()
      setShowAddForm(false)
      setPincodeStatus({ isChecking: false, valid: null, deliverable: null, message: '', courier: '' })
      setNewAddr({
        title: 'Home',
        fullName: user?.name || '',
        phone: '',
        addressLine: '',
        city: '',
        state: 'Gujarat',
        postalCode: '',
        isDefault: false,
      })
    } catch (err) {
      setAddErrors({ general: err?.data?.message || 'Failed to save address' })
    }
  }

  const handleDeleteAddr = (addrId) => {
    setDeleteAddrModal(addrId)
  }

  const handleConfirmDeleteAddr = async () => {
    if (!deleteAddrModal) return
    try {
      await deleteAddress(deleteAddrModal).unwrap()
      if (editingAddr?.addressId === deleteAddrModal) {
        setEditingAddr(null)
      }
      showToast('Address removed successfully', 'success')
    } catch (err) {
      showToast(err?.data?.message || 'Failed to delete address', 'error')
    } finally {
      setDeleteAddrModal(null)
    }
  }

  return (
    <>
      {/* Official A4 Tax Invoice (Rendered with pure styles for 100% crisp html2pdf capture) */}
      {printingOrder && (
        <div
          id="sensein-invoice-print-area"
          className="print:block print:w-full print:m-0 print:p-0"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '794px',
            minHeight: '1123px',
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <DelhiveryTaxInvoice order={printingOrder} sellerConfig={sellerConfig} />
          <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono pt-3 border-t border-neutral-200 mt-3">
            <span>Sensein Botanical Luxury Pvt Ltd • Authorized Tax Invoice</span>
            <span>
              Generated on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </div>
      )}

      <div className="bg-[#FAF9F6] min-h-screen py-10 print:hidden">
      {/* Product Unavailable Modal */}
      {unavailableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-5 text-center relative animate-in zoom-in-95">
            <button
              onClick={() => setUnavailableModal(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200 shadow-xs">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
                Currently Unavailable
              </span>
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-stone-900 pt-1">
                {unavailableModal.name}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                This item is currently out of stock or no longer available in the store. Explore our active collection to find similar products.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setUnavailableModal(null)}
                className="w-full py-3 px-4 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <Link
                to="/shop"
                onClick={() => setUnavailableModal(null)}
                className="w-full py-3 px-4 rounded-xl bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Browse Products</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Invoice Modal */}
      {selectedOrderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
          onClick={() => setSelectedOrderModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 text-left relative animate-in zoom-in-95 max-h-[90dvh] overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400">Order Invoice & Summary</span>
                <h3 className="font-mono text-base font-black text-stone-900">
                  #{selectedOrderModal.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Order Date, Status, Payment & Courier Grid */}
            <div className="grid grid-cols-2 gap-3 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200 text-xs">
              <div className="space-y-0.5">
                <span className="text-[9.5px] uppercase font-bold text-stone-400 block">Placed On:</span>
                <div className="font-bold text-stone-900">
                  {new Date(selectedOrderModal.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-[10.5px] text-stone-500 font-mono">
                  {new Date(selectedOrderModal.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9.5px] uppercase font-bold text-stone-400 block">Order Status:</span>
                <div className="inline-block mt-0.5 font-black text-xs uppercase px-2 py-0.5 rounded bg-[#5A3859]/10 text-[#5A3859] border border-[#5A3859]/20">
                  ● {selectedOrderModal.orderStatus}
                </div>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-stone-200/60">
                <span className="text-[9.5px] uppercase font-bold text-stone-400 block">Payment:</span>
                <div className="font-bold text-stone-900">{selectedOrderModal.paymentMethod || 'Online'}</div>
                <div className="text-[10px] text-emerald-700 font-bold uppercase">{selectedOrderModal.paymentStatus}</div>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-stone-200/60">
                <span className="text-[9.5px] uppercase font-bold text-stone-400 block">Courier Partner:</span>
                <div className="font-bold text-stone-900 truncate">
                  {selectedOrderModal.courierPartner || selectedOrderModal.delhivery?.courierName || 'Delhivery Express'}
                </div>
                <div className="font-mono text-[10.5px] text-stone-500 font-bold truncate">
                  AWB: {selectedOrderModal.trackingNumber || selectedOrderModal.delhivery?.waybill || 'Pending'}
                </div>
              </div>
            </div>

            {/* Delivery Address (With Pre-Pickup Edit Option) */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-stone-400">Delivery Address</span>
                {!['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'RTO'].includes(
                  selectedOrderModal.orderStatus
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOrderAddress(selectedOrderModal)
                      setOrderAddressForm({
                        customerName: selectedOrderModal.customerName || selectedOrderModal.shippingAddress?.fullName || '',
                        customerPhone: selectedOrderModal.customerPhone || selectedOrderModal.shippingAddress?.phone || '',
                        addressLine: selectedOrderModal.shippingAddress?.addressLine || '',
                        city: selectedOrderModal.shippingAddress?.city || '',
                        state: selectedOrderModal.shippingAddress?.state || '',
                        postalCode: selectedOrderModal.shippingAddress?.postalCode || '',
                      })
                    }}
                    className="bg-white hover:bg-[#5A3859] text-stone-700 hover:text-white border border-stone-200 hover:border-[#5A3859] text-[11px] px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit Address</span>
                  </button>
                )}
              </div>
              <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 text-stone-700 space-y-0.5">
                <div className="font-bold text-stone-900 text-sm">{selectedOrderModal.customerName}</div>
                <div className="leading-relaxed">{selectedOrderModal.shippingAddress?.addressLine}</div>
                <div>
                  {selectedOrderModal.shippingAddress?.city}, {selectedOrderModal.shippingAddress?.state} -{' '}
                  <strong className="font-mono font-bold text-stone-900">{selectedOrderModal.shippingAddress?.postalCode}</strong>
                </div>
                <div className="font-mono text-stone-700 pt-1 flex items-center gap-1">
                  <span className="text-[#5A3859]">📞</span> {selectedOrderModal.customerPhone}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-stone-400">
                Purchased Items ({selectedOrderModal.items?.length || 0})
              </span>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {selectedOrderModal.items?.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-10 w-10 object-cover bg-stone-50 border border-stone-200 rounded-lg shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-stone-900 truncate">{item.name}</div>
                        <div className="text-[10px] text-stone-500">
                          Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-stone-900 shrink-0 font-display">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm">
              <span className="font-bold text-stone-700">Total Order Amount:</span>
              <span className="font-display font-black text-lg text-[#5A3859]">
                ₹{selectedOrderModal.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Action Buttons Inside Modal (Cancel Order + Return/Replace + Track Order) */}
            <div className="pt-3 border-t border-stone-200/80 flex items-center gap-2.5 flex-wrap">
              {!['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'RTO', 'PAYMENT_FAILED'].includes(
                (selectedOrderModal.fulfillmentStatus || selectedOrderModal.orderStatus || '').toUpperCase()
              ) && (
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(selectedOrderModal)}
                  disabled={isCancellingOrder}
                  className="flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold uppercase rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Cancel Order</span>
                </button>
              )}

              {((selectedOrderModal.returnStatus && selectedOrderModal.returnStatus !== 'NONE') ||
                (selectedOrderModal.replacementStatus && selectedOrderModal.replacementStatus !== 'NONE') ||
                (Array.isArray(selectedOrderModal.returnRequests) && selectedOrderModal.returnRequests.length > 0)) && (
                <button
                  type="button"
                  onClick={() => {
                    const o = selectedOrderModal
                    setSelectedOrderModal(null)
                    handleOpenViewReturnModal(o)
                  }}
                  className="flex-1 py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold uppercase rounded-xl border border-purple-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <Eye className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>View Replacement</span>
                </button>
              )}

              {isWithin7DaysReplacement(selectedOrderModal) && (
                <button
                  type="button"
                  onClick={() => {
                    const o = selectedOrderModal
                    setSelectedOrderModal(null)
                    handleOpenReturnModal(o)
                  }}
                  className="flex-1 py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold uppercase rounded-xl border border-purple-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <Package className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>Return / Replace</span>
                </button>
              )}

              <Link
                to={`/track-order?number=${encodeURIComponent(selectedOrderModal.orderNumber)}`}
                onClick={() => setSelectedOrderModal(null)}
                className="flex-1 py-2.5 px-4 bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-extrabold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 rounded-xl cursor-pointer shadow-sm transition-all whitespace-nowrap"
              >
                <Truck className="h-4 w-4 shrink-0" />
                <span>Track Order</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Delivery Address Modal (Before Dispatch) */}
      {editingOrderAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl relative my-8 border border-stone-200">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-[#5A3859]" />
                  <span>Edit Order Delivery Address</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Order #{editingOrderAddress.orderNumber} (Editable before Delhivery pickup)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrderAddress(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderAddress} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={orderAddressForm.customerName}
                    onChange={(e) => setOrderAddressForm({ ...orderAddressForm, customerName: e.target.value })}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={orderAddressForm.customerPhone}
                    onChange={(e) => setOrderAddressForm({ ...orderAddressForm, customerPhone: e.target.value })}
                    placeholder="10-digit Mobile"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">Street Address / Flat / Society</label>
                <textarea
                  rows={2}
                  required
                  value={orderAddressForm.addressLine}
                  onChange={(e) => setOrderAddressForm({ ...orderAddressForm, addressLine: e.target.value })}
                  placeholder="House/Flat No, Apartment, Street name"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900 resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={orderAddressForm.postalCode}
                    onChange={(e) => setOrderAddressForm({ ...orderAddressForm, postalCode: e.target.value })}
                    placeholder="395010"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">City</label>
                  <input
                    type="text"
                    required
                    value={orderAddressForm.city}
                    onChange={(e) => setOrderAddressForm({ ...orderAddressForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">State</label>
                  <input
                    type="text"
                    required
                    value={orderAddressForm.state}
                    onChange={(e) => setOrderAddressForm({ ...orderAddressForm, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-stone-900 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingOrderAddress(null)}
                  className="px-3.5 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingOrderAddress}
                  className="bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isUpdatingOrderAddress ? 'Saving...' : 'Save & Update Address'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Return / Replacement Request & Reverse Logistics Live Tracker Modal */}
      {viewingReturnData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-hidden">
          <div className="bg-white rounded-2xl p-5 sm:p-7 max-w-xl w-full space-y-4 shadow-2xl relative my-8 border border-stone-200 max-h-[90dvh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#5A3859]/10 text-[#5A3859] rounded-xl">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-stone-900">
                    Replacement Request Details
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    Order #{viewingReturnData.order.orderNumber} • Request #{viewingReturnData.returnReq.returnNumber || 'RET-' + viewingReturnData.order.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReturnData(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status Alert Banner */}
            {(() => {
              const st = (viewingReturnData.returnReq.status || viewingReturnData.order.replacementStatus || viewingReturnData.order.returnStatus || 'REQUESTED').toUpperCase()
              if (st === 'REJECTED' || st === 'QC_REJECTED') {
                return (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-900 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-rose-700">
                      <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>Replacement Request Rejected</span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200 font-medium text-[11.5px] leading-relaxed">
                      <span className="font-bold text-rose-800">Reason from Admin: </span>
                      <span className="text-stone-800">{viewingReturnData.returnReq.rejectionReason || 'Item does not meet replacement or return policy terms.'}</span>
                    </div>
                    <p className="text-[10.5px] text-rose-700 font-medium pt-0.5">
                      Need assistance? Please contact our customer care team at <strong className="font-semibold">care@sensein.com</strong> or call <strong className="font-semibold">+91 79849 19956</strong>.
                    </p>
                  </div>
                )
              }

              if (st === 'COMPLETED' || st === 'QC_APPROVED' || st === 'CREATED') {
                const repOrderNum = viewingReturnData.returnReq.replacementOrderNumber || `${viewingReturnData.order.orderNumber}-R1`
                return (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>QC Inspection Passed • Replacement Order Dispatched!</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Your return parcel has passed quality verification. A brand new replacement item has been dispatched to your address free of charge.
                    </p>
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Replacement Order Reference:</span>
                        <span className="font-mono font-black text-stone-900 text-xs sm:text-sm">#{repOrderNum}</span>
                      </div>
                      <Link
                        to={`/track-order?number=${encodeURIComponent(repOrderNum)}`}
                        onClick={() => setViewingReturnData(null)}
                        className="bg-[#5A3859] hover:bg-[#482b47] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Track Shipment</span>
                      </Link>
                    </div>
                  </div>
                )
              }

              if (['APPROVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'PICKED_UP'].includes(st)) {
                return (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-xs text-purple-900 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-purple-800">
                      <Truck className="h-4 w-4 shrink-0 text-purple-600" />
                      <span>Request Approved • Delhivery Reverse Pickup Scheduled</span>
                    </div>
                    <p className="text-[11px] text-purple-800">
                      A Delhivery courier agent will visit your address to pick up the item. Please keep the product securely packaged with all accessories.
                    </p>
                    {viewingReturnData.returnReq.reverseWaybill && (
                      <div className="bg-white p-2.5 rounded-lg border border-purple-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Delhivery Reverse Waybill:</span>
                          <span className="font-mono font-bold text-purple-900 text-xs">{viewingReturnData.returnReq.reverseWaybill}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          {st === 'IN_TRANSIT' || st === 'PICKED_UP' ? 'In Reverse Transit' : 'Pickup Assigned'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Request Submitted • Under Admin & QC Review</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Our team is reviewing your uploaded photos/videos. You will receive an SMS and reverse pickup schedule notification once verified.
                  </p>
                </div>
              )
            })()}

            {/* 5-Step Progress Timeline */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-2.5">
                Replacement Lifecycle
              </span>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {(() => {
                  const st = (viewingReturnData.returnReq.status || viewingReturnData.order.replacementStatus || 'REQUESTED').toUpperCase()
                  const isRejected = st === 'REJECTED' || st === 'QC_REJECTED'
                  const isApproved = ['APPROVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'PICKED_UP', 'QC_APPROVED', 'COMPLETED'].includes(st)
                  const isPickedUp = ['IN_TRANSIT', 'PICKED_UP', 'QC_APPROVED', 'COMPLETED'].includes(st)
                  const isQcPassed = ['QC_APPROVED', 'COMPLETED'].includes(st)
                  const isDispatched = st === 'COMPLETED' || Boolean(viewingReturnData.returnReq.replacementOrderNumber)

                  const steps = [
                    { label: 'Submitted', done: true, current: st === 'REQUESTED' },
                    { label: isRejected ? 'Rejected' : 'Reviewed', done: isApproved || isRejected, current: st === 'UNDER_REVIEW', failed: isRejected },
                    { label: 'Reverse Pickup', done: isPickedUp, current: st === 'APPROVED' || st === 'PICKUP_SCHEDULED' },
                    { label: 'QC Check', done: isQcPassed, current: isPickedUp && !isQcPassed },
                    { label: 'Replacement Sent', done: isDispatched, current: isQcPassed && !isDispatched },
                  ]

                  return steps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          step.failed
                            ? 'bg-rose-600 text-white'
                            : step.done
                            ? 'bg-emerald-600 text-white'
                            : step.current
                            ? 'bg-[#5A3859] text-white ring-2 ring-[#5A3859]/30'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {step.failed ? '✕' : step.done ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[9.5px] leading-tight font-semibold ${
                        step.failed ? 'text-rose-600' : step.done || step.current ? 'text-stone-900' : 'text-stone-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Submitted Reason & Notes */}
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-stone-50/80 p-3 rounded-xl border border-stone-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Resolution Type:</span>
                  <div className="font-bold text-stone-900">
                    {viewingReturnData.returnReq.requestType === 'RETURN_REPLACEMENT' || viewingReturnData.order.replacementStatus
                      ? 'Free Product Replacement'
                      : 'Return & Refund'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Reported Reason:</span>
                  <div className="font-bold text-stone-900">
                    {viewingReturnData.returnReq.items?.[0]?.reason || viewingReturnData.returnReq.reason || 'Damaged Product'}
                  </div>
                </div>
              </div>

              {viewingReturnData.returnReq.customerComment && (
                <div className="p-3 bg-stone-50/60 rounded-xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Your Note / Description:</span>
                  <p className="text-stone-700 font-medium leading-relaxed">{viewingReturnData.returnReq.customerComment}</p>
                </div>
              )}
            </div>

            {/* Uploaded Evidence Photos & Videos */}
            {viewingReturnData.returnReq.evidenceMedia && viewingReturnData.returnReq.evidenceMedia.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Uploaded Proof Media ({viewingReturnData.returnReq.evidenceMedia.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {viewingReturnData.returnReq.evidenceMedia.map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewMediaUrl(m)}
                      className="relative w-16 h-16 rounded-xl border border-stone-200 overflow-hidden shrink-0 bg-stone-100 group cursor-pointer hover:ring-2 hover:ring-[#5A3859] transition-all"
                    >
                      {m.mimeType?.startsWith('video/') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-white p-1">
                          <Video className="h-5 w-5 text-purple-400" />
                          <span className="text-[8px] font-mono">Video</span>
                        </div>
                      ) : (
                        <img src={m.url} alt={m.fileName || 'Proof'} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingReturnData(null)}
                className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Media Preview Modal (Image / Video) */}
      {previewMediaUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 animate-in fade-in"
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div className="bg-stone-900 rounded-2xl p-3 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col items-center relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute top-2 right-2 p-1.5 text-white/70 hover:text-white bg-black/50 hover:bg-black rounded-full cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>
            {previewMediaUrl.mimeType?.startsWith('video/') ? (
              <video src={previewMediaUrl.url} controls autoPlay className="max-h-[75vh] w-auto rounded-lg" />
            ) : (
              <img src={previewMediaUrl.url} alt="Proof" className="max-h-[75vh] w-auto object-contain rounded-lg" />
            )}
          </div>
        </div>
      )}

      {/* Return / Replacement Request Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-hidden">
          <div className="bg-white rounded-2xl p-5 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl relative my-8 border border-stone-200 max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#5A3859]" />
                  <span>Request Return or Replacement</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Order #{returnModalOrder.orderNumber} • Delivered
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturnRequest} className="space-y-4 text-xs">
              {/* Type Selection: Refund vs Replacement */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700 block uppercase tracking-wider">
                  Select Resolution Type:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReturnForm({ ...returnForm, requestType: 'RETURN_REPLACEMENT' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      returnForm.requestType === 'RETURN_REPLACEMENT'
                        ? 'border-[#5A3859] bg-[#5A3859]/5 ring-1 ring-[#5A3859]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#5A3859]" />
                      <span>Free Replacement</span>
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">Receive a brand new replacement product</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnForm({ ...returnForm, requestType: 'RETURN_REFUND' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      returnForm.requestType === 'RETURN_REFUND'
                        ? 'border-[#5A3859] bg-[#5A3859]/5 ring-1 ring-[#5A3859]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-bold text-stone-900">Return & Refund</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">Refund back to your bank/payment source</div>
                  </button>
                </div>
              </div>

              {/* 3 Main Return/Replacement Reason Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700 block uppercase tracking-wider">
                  Primary Reason for Request:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'Damaged Product', label: 'Damaged Product', icon: AlertTriangle, color: 'text-amber-600' },
                    { key: 'Wrong Product', label: 'Wrong Product', icon: XCircle, color: 'text-rose-600' },
                    { key: 'Other', label: 'Other', icon: Edit2, color: 'text-blue-600' },
                  ].map((r) => {
                    const IconComponent = r.icon
                    const isSelected = returnForm.selectedReason === r.key
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setReturnForm({ ...returnForm, selectedReason: r.key })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#5A3859] bg-[#5A3859]/10 ring-1 ring-[#5A3859] font-bold text-stone-900'
                            : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/50'
                        }`}
                      >
                        <IconComponent className={`h-4 w-4 ${r.color}`} />
                        <span className="text-[11px] font-bold">{r.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* If Other is selected, show custom reason text input */}
                {returnForm.selectedReason === 'Other' && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="text-[10.5px] font-bold text-stone-600 block mb-1">
                      Specify Custom Reason:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Please specify why you want a replacement"
                      value={returnForm.otherReasonText}
                      onChange={(e) => setReturnForm({ ...returnForm, otherReasonText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none text-xs font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Items to return selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700 block uppercase tracking-wider">
                  Select Products to Replace:
                </label>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-stone-50/40">
                  {(returnModalOrder.items || []).map((it) => {
                    const pId = it.product?._id || it.product || it._id
                    const currentItemState = returnForm.selectedItems[pId] || {}
                    return (
                      <div key={pId} className="p-2.5 flex items-center justify-between gap-2.5">
                        <label className="flex items-center gap-2 cursor-pointer min-w-0">
                          <input
                            type="checkbox"
                            checked={Boolean(currentItemState.selected)}
                            onChange={(e) => {
                              setReturnForm({
                                ...returnForm,
                                selectedItems: {
                                  ...returnForm.selectedItems,
                                  [pId]: {
                                    ...currentItemState,
                                    selected: e.target.checked,
                                  },
                                },
                              })
                            }}
                            className="rounded border-stone-300 text-[#5A3859] focus:ring-[#5A3859]"
                          />
                          <span className="font-bold text-stone-900 truncate text-[11.5px]">{it.name}</span>
                        </label>
                        <span className="text-[10.5px] font-mono text-stone-500 shrink-0">
                          Qty: {it.quantity} (₹{it.price})
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Upload Proof (Photos or Videos) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 block uppercase tracking-wider">
                    Upload Photo / Video Proof:
                  </label>
                  <span className="text-[10px] text-stone-400">Max 25MB • Images & Videos</span>
                </div>

                <div className="border-2 border-dashed border-stone-200 hover:border-[#5A3859]/50 rounded-xl p-3 bg-stone-50/60 text-center transition-colors">
                  <input
                    type="file"
                    id="return-evidence-file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleEvidenceFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="return-evidence-file"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="h-5 w-5 text-[#5A3859]" />
                    <div className="text-[11px] font-bold text-stone-700">
                      Click to upload photos or unboxing videos
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Clear visual proof helps our QC team approve your request faster
                    </div>
                  </label>
                </div>

                {/* Proof Thumbnails Preview */}
                {returnForm.evidenceMedia.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                    {returnForm.evidenceMedia.map((m, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg border border-stone-200 overflow-hidden shrink-0 bg-stone-100 group">
                        {m.mimeType?.startsWith('video/') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-white p-1">
                            <Video className="h-5 w-5 text-purple-400" />
                            <span className="text-[8px] truncate max-w-full font-mono">Video</span>
                          </div>
                        ) : (
                          <img src={m.url} alt={m.fileName} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(idx)}
                          className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-rose-600 text-white p-0.5 rounded-full transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700 block uppercase tracking-wider">
                  Detailed Issue Description:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain the defect, missing parts, or why you need a replacement..."
                  value={returnForm.generalComment}
                  onChange={(e) => setReturnForm({ ...returnForm, generalComment: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#5A3859] focus:ring-1 focus:ring-[#5A3859] outline-none bg-white text-xs resize-none font-medium"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isSubmittingReturn ? 'Submitting Request...' : 'Submit Replacement Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Delivery Address Modal */}
      {editingAddr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5 text-left relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#5A3859]/10 text-[#5A3859] rounded-xl">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">Address Book</span>
                  <h3 className="font-display text-base font-extrabold text-stone-900">
                    Edit Delivery Address
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAddr(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAddressSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Address Type
                  </label>
                  <div className="flex items-center gap-2">
                    {['Home', 'Work', 'Other'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditingAddr((p) => ({ ...p, title: type }))}
                        className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          (editingAddr.title || 'Home').toLowerCase() === type.toLowerCase()
                            ? 'bg-[#5A3859] text-white border-[#5A3859] shadow-2xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    Full Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={editingAddr.fullName}
                    onChange={(e) => {
                      setEditingAddr((p) => ({ ...p, fullName: e.target.value }))
                      setEditErrors((p) => ({ ...p, fullName: '' }))
                    }}
                    className={`w-full p-2.5 rounded-xl border transition-all font-medium ${
                      editErrors.fullName
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white'
                    }`}
                  />
                  {editErrors.fullName && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {editErrors.fullName}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    Phone Number *
                  </label>
                  <div
                    className={`flex items-center rounded-xl border transition-all overflow-hidden ${
                      editErrors.phone
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-stone-300 bg-stone-50/50 focus-within:border-[#5A3859] focus-within:bg-white'
                    }`}
                  >
                    <span className="px-3 py-2.5 bg-stone-100/90 text-stone-600 font-bold border-r border-stone-200 text-xs select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={editingAddr.phone}
                      onChange={(e) => handlePhoneChange(e.target.value, true)}
                      className="w-full p-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 transition-all font-medium font-mono text-xs"
                    />
                  </div>
                  {editErrors.phone && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {editErrors.phone}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="395010"
                    value={editingAddr.postalCode}
                    onChange={(e) => handlePincodeChange(e.target.value, true)}
                    className={`w-full p-2.5 rounded-xl border font-mono transition-all font-medium ${
                      editErrors.postalCode || pincodeStatus.valid === false || pincodeStatus.deliverable === false
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white'
                    }`}
                  />
                  {pincodeStatus.isChecking && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5A3859] mt-1.5 animate-in fade-in">
                      <div className="h-3.5 w-3.5 border-2 border-[#5A3859] border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Checking PIN code...</span>
                    </div>
                  )}
                  {!pincodeStatus.isChecking && (editErrors.postalCode || pincodeStatus.valid === false) && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {editErrors.postalCode || 'Please enter a valid PIN code'}
                    </div>
                  )}
                  {!pincodeStatus.isChecking && !editErrors.postalCode && pincodeStatus.valid === true && pincodeStatus.deliverable === false && (
                    <div className="text-[11px] text-amber-700 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ Delivery service is not available for this PIN code
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    Street Address (Flat / House No / Society) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Society / Flat / Building / Street"
                    value={editingAddr.addressLine}
                    onChange={(e) => {
                      setEditingAddr((p) => ({ ...p, addressLine: e.target.value }))
                      setEditErrors((p) => ({ ...p, addressLine: '' }))
                    }}
                    className={`w-full p-2.5 rounded-xl border transition-all font-medium ${
                      editErrors.addressLine
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white'
                    }`}
                  />
                  {editErrors.addressLine && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {editErrors.addressLine}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Surat"
                    value={editingAddr.city}
                    onChange={(e) => {
                      setEditingAddr((p) => ({ ...p, city: e.target.value }))
                      setEditErrors((p) => ({ ...p, city: '' }))
                    }}
                    className={`w-full p-2.5 rounded-xl border transition-all font-medium ${
                      editErrors.city
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white'
                    }`}
                  />
                  {editErrors.city && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {editErrors.city}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    State *
                  </label>
                  <input
                    type="text"
                    value={editingAddr.state}
                    onChange={(e) => setEditingAddr((p) => ({ ...p, state: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5A3859] transition-all font-medium"
                  />
                </div>
              </div>

              {/* Set as Default Address Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-is-default"
                  checked={!!editingAddr.isDefault}
                  onChange={(e) => setEditingAddr((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded text-[#5A3859] focus:ring-[#5A3859] border-stone-300 cursor-pointer"
                />
                <label htmlFor="edit-is-default" className="text-xs font-semibold text-stone-700 cursor-pointer select-none">
                  Set as default delivery address (Pre-selected at checkout)
                </label>
              </div>

              {editErrors.general && (
                <div className="text-xs text-rose-600 font-bold p-2.5 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in">
                  ⚠️ {editErrors.general}
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingAddr(null)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:text-stone-900 border border-stone-300 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingAddr}
                  className="bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-extrabold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  {isUpdatingAddr ? (
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Address Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5 text-left relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#5A3859]/10 text-[#5A3859] rounded-xl">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">Address Book</span>
                  <h3 className="font-display text-base font-extrabold text-stone-900">
                    Add New Address
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddAddressSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Address Type
                  </label>
                  <div className="flex items-center gap-2">
                    {['Home', 'Work', 'Other'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewAddr((p) => ({ ...p, title: type }))}
                        className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          (newAddr.title || 'Other').toLowerCase() === type.toLowerCase()
                            ? 'bg-[#5A3859] text-white border-[#5A3859] shadow-2xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {type === 'Home' ? '🏠 Home' : type === 'Work' ? '🏢 Work' : '📍 Other'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    Full Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newAddr.fullName}
                    onChange={(e) => {
                      setNewAddr((p) => ({ ...p, fullName: e.target.value }))
                      setAddErrors((p) => ({ ...p, fullName: '' }))
                    }}
                    className={`w-full p-2.5 rounded-xl border transition-all ${
                      addErrors.fullName
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white'
                    }`}
                  />
                  {addErrors.fullName && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {addErrors.fullName}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    Phone Number *
                  </label>
                  <div
                    className={`flex items-center rounded-xl border transition-all overflow-hidden ${
                      addErrors.phone
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-stone-300 bg-stone-50/50 focus-within:border-[#5A3859] focus-within:bg-white'
                    }`}
                  >
                    <span className="px-3 py-2.5 bg-stone-100/90 text-stone-600 font-bold border-r border-stone-200 text-xs select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={newAddr.phone}
                      onChange={(e) => handlePhoneChange(e.target.value, false)}
                      className="w-full p-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 transition-all font-medium font-mono text-xs"
                    />
                  </div>
                  {addErrors.phone && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {addErrors.phone}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="395010"
                    value={newAddr.postalCode}
                    onChange={(e) => handlePincodeChange(e.target.value, false)}
                    className={`w-full p-2.5 rounded-xl border font-mono transition-all ${
                      addErrors.postalCode || pincodeStatus.valid === false || pincodeStatus.deliverable === false
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white'
                    }`}
                  />
                  {pincodeStatus.isChecking && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5A3859] mt-1.5 animate-in fade-in">
                      <div className="h-3.5 w-3.5 border-2 border-[#5A3859] border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Checking PIN code...</span>
                    </div>
                  )}
                  {!pincodeStatus.isChecking && (addErrors.postalCode || pincodeStatus.valid === false) && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {addErrors.postalCode || 'Please enter a valid PIN code'}
                    </div>
                  )}
                  {!pincodeStatus.isChecking && !addErrors.postalCode && pincodeStatus.valid === true && pincodeStatus.deliverable === false && (
                    <div className="text-[11px] text-amber-700 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ Delivery service is not available for this PIN code
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    Street Address (Flat / House No / Society) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Society / Flat / Building / Street"
                    value={newAddr.addressLine}
                    onChange={(e) => {
                      setNewAddr((p) => ({ ...p, addressLine: e.target.value }))
                      setAddErrors((p) => ({ ...p, addressLine: '' }))
                    }}
                    className={`w-full p-2.5 rounded-xl border transition-all ${
                      addErrors.addressLine
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white'
                    }`}
                  />
                  {addErrors.addressLine && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {addErrors.addressLine}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Surat"
                    value={newAddr.city}
                    onChange={(e) => {
                      setNewAddr((p) => ({ ...p, city: e.target.value }))
                      setAddErrors((p) => ({ ...p, city: '' }))
                    }}
                    className={`w-full p-2.5 rounded-xl border transition-all ${
                      addErrors.city
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white'
                    }`}
                  />
                  {addErrors.city && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 animate-in fade-in flex items-center gap-1">
                      ⚠️ {addErrors.city}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                    State *
                  </label>
                  <input
                    type="text"
                    value={newAddr.state}
                    onChange={(e) => setNewAddr((p) => ({ ...p, state: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50/50 focus:border-[#5A3859] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5A3859] transition-all font-medium"
                  />
                </div>
              </div>

              {/* Set as Default Address Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="add-is-default"
                  checked={!!newAddr.isDefault}
                  onChange={(e) => setNewAddr((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded text-[#5A3859] focus:ring-[#5A3859] border-stone-300 cursor-pointer"
                />
                <label htmlFor="add-is-default" className="text-xs font-semibold text-stone-700 cursor-pointer select-none">
                  Set as default delivery address (Pre-selected at checkout)
                </label>
              </div>

              {addErrors.general && (
                <div className="text-xs text-rose-600 font-bold p-2.5 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in">
                  ⚠️ {addErrors.general}
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:text-stone-900 border border-stone-300 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingAddr}
                  className="bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-extrabold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  {isAddingAddr ? (
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Save Address</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="container-page max-w-5xl space-y-8">
        {/* Clean Header Bar */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">My Account</h1>
          </div>
        </div>

        {/* Clean Luxury Underline Tab Bar with Ample Breathing Room */}
        <div className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-semibold border-b border-stone-200/90 pb-0 overflow-x-auto scrollbar-none select-none">
          {/* Tab 1: Orders */}
          <button
            onClick={() => handleTabChange('orders')}
            className={`pb-3 flex items-center gap-2 transition-all relative cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'text-[#5A3859] font-extrabold border-b-2 border-[#5A3859]'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Package className="h-4 w-4 shrink-0 text-[#5A3859]" />
            <span className="sm:hidden font-bold">Orders</span>
            <span className="hidden sm:inline">My Orders & History</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'orders' ? 'bg-[#5A3859]/10 text-[#5A3859]' : 'bg-stone-100 text-stone-600'
            }`}>
              {orders.length}
            </span>
          </button>

          {/* Tab 2: Addresses */}
          <button
            onClick={() => handleTabChange('addresses')}
            className={`pb-3 flex items-center gap-2 transition-all relative cursor-pointer whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'text-[#5A3859] font-extrabold border-b-2 border-[#5A3859]'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <MapPin className="h-4 w-4 shrink-0 text-[#5A3859]" />
            <span className="sm:hidden font-bold">Addresses</span>
            <span className="hidden sm:inline">Saved Addresses</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'addresses' ? 'bg-[#5A3859]/10 text-[#5A3859]' : 'bg-stone-100 text-stone-600'
            }`}>
              {savedAddresses.length}
            </span>
          </button>

          {/* Tab 3: Profile */}
          <button
            onClick={() => handleTabChange('profile')}
            className={`pb-3 flex items-center gap-2 transition-all relative cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'text-[#5A3859] font-extrabold border-b-2 border-[#5A3859]'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <User className="h-4 w-4 shrink-0 text-[#5A3859]" />
            <span className="sm:hidden font-bold">Profile</span>
            <span className="hidden sm:inline">Profile Details</span>
          </button>
        </div>

        {/* Orders Tab Content */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="h-8 w-8 border-3 border-[#5A3859] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-stone-500 font-medium">Loading your order history...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-sm space-y-4 max-w-md mx-auto">
                <ShoppingBag className="h-12 w-12 text-stone-300 mx-auto" />
                <h3 className="font-display text-xl font-bold text-stone-900">No Orders Placed Yet</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Explore our luxury Sensein professional haircare formulations and enjoy express nationwide delivery.
                </p>
                <Link to="/shop" className="inline-block bg-[#5A3859] hover:bg-[#482b47] text-white py-3 px-6 rounded-xl text-xs uppercase tracking-wider font-bold shadow-md hover:shadow-lg transition-all">
                  Start Shopping
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Structured Card Header Bar */}
                  <div className="bg-stone-50/90 p-3 sm:p-4 border-b border-stone-200 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    {/* Top Meta Info */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Order</span>
                        <span className="font-mono font-black text-xs sm:text-sm text-stone-900">#{order.orderNumber}</span>
                        
                        {/* Payment Badge */}
                        <span
                          className={`text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : order.paymentStatus === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {order.paymentStatus === 'PAID' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                          {order.paymentStatus === 'FAILED' && <XCircle className="h-3 w-3 text-rose-600" />}
                          {order.paymentStatus === 'PENDING' && <Clock className="h-3 w-3 text-amber-600" />}
                          <span>{order.paymentStatus === 'PAID' ? 'Paid' : order.paymentStatus === 'FAILED' ? 'Failed' : 'Payment Pending'}</span>
                        </span>

                        {/* Fulfillment Status Badge */}
                        <span
                          className={`text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${
                            (order.fulfillmentStatus || order.orderStatus) === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(order.fulfillmentStatus || order.orderStatus)
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : (order.fulfillmentStatus || order.orderStatus) === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-stone-100 text-stone-700 border-stone-300'
                          }`}
                        >
                          {(order.fulfillmentStatus || order.orderStatus) === 'DELIVERED' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                          {['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(order.fulfillmentStatus || order.orderStatus) && <Truck className="h-3 w-3 text-blue-600" />}
                          {(order.fulfillmentStatus || order.orderStatus) === 'CANCELLED' && <XCircle className="h-3 w-3 text-rose-600" />}
                          <span>{order.fulfillmentStatus || order.orderStatus}</span>
                        </span>

                        {/* Return / Replacement Status Badge (if active) */}
                        {order.returnStatus && order.returnStatus !== 'NONE' && (
                          <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Return: {order.returnStatus}
                          </span>
                        )}

                        {order.replacementStatus && order.replacementStatus !== 'NONE' && (
                          <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Replacement: {order.replacementStatus}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-stone-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-[#5A3859]" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })},{' '}
                          <span className="font-mono text-[10.5px] text-stone-400 font-semibold">
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons (Clean, Contextual & Responsive) */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                      {order.paymentStatus === 'FAILED' || order.orderStatus === 'PAYMENT_FAILED' ? (
                        <button
                          type="button"
                          onClick={() => navigate('/checkout')}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold uppercase px-3 py-1.5 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>RETRY PAYMENT</span>
                        </button>
                      ) : null}

                      {/* Track Order Button */}
                      {order.orderStatus !== 'CANCELLED' && (
                        <Link
                          to={`/track-order?number=${encodeURIComponent(order.orderNumber)}`}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase px-3 py-1.5 rounded-lg border border-stone-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Truck className="h-3.5 w-3.5 text-blue-600" />
                          <span>Track Order</span>
                        </Link>
                      )}

                      {/* Edit Address (Before Physical Courier Pickup) */}
                      {!['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'RTO'].includes(
                        order.fulfillmentStatus || order.orderStatus
                      ) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOrderAddress(order)
                            setOrderAddressForm({
                              customerName: order.customerName || order.shippingAddress?.fullName || '',
                              customerPhone: order.customerPhone || order.shippingAddress?.phone || '',
                              addressLine: order.shippingAddress?.addressLine || '',
                              city: order.shippingAddress?.city || '',
                              state: order.shippingAddress?.state || '',
                              postalCode: order.shippingAddress?.postalCode || '',
                            })
                          }}
                          className="bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold uppercase px-3 py-1.5 rounded-lg border border-stone-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[#5A3859]" />
                          <span>Edit Address</span>
                        </button>
                      )}

                      {/* Pre-Pickup Cancellation Button */}
                      {!['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'RTO', 'PAYMENT_FAILED'].includes(
                        order.fulfillmentStatus || order.orderStatus
                      ) && (
                        <button
                          type="button"
                          onClick={() => setCancelModalOrder(order)}
                          disabled={isCancellingOrder}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold uppercase px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Cancel Order</span>
                        </button>
                      )}

                      {/* View Replacement Request Button if customer requested return/replacement */}
                      {((order.returnStatus && order.returnStatus !== 'NONE') ||
                        (order.replacementStatus && order.replacementStatus !== 'NONE') ||
                        (Array.isArray(order.returnRequests) && order.returnRequests.length > 0)) && (
                        <button
                          type="button"
                          onClick={() => handleOpenViewReturnModal(order)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold uppercase px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-purple-600" />
                          <span>View Replacement</span>
                        </button>
                      )}

                      {/* Return / Replacement Button on Delivered Orders (Within 7 Days of Delivery) */}
                      {isWithin7DaysReplacement(order) && (
                        <button
                          type="button"
                          onClick={() => handleOpenReturnModal(order)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold uppercase px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Package className="h-3.5 w-3.5 text-purple-600" />
                          <span>Return / Replace</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrderModal(order)}
                        className="bg-white hover:bg-[#5A3859]/5 text-stone-800 hover:text-[#5A3859] text-xs font-bold uppercase px-3 py-1.5 rounded-lg border border-stone-300 hover:border-[#5A3859] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#5A3859]" />
                        <span>View Order</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(order)}
                        className="bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-extrabold uppercase px-3.5 py-1.5 rounded-lg shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Body: Items List & Courier Details */}
                  <div className="p-3.5 sm:p-5 space-y-3.5">
                    <div className="divide-y divide-stone-100">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleItemClick(item)}
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 cursor-pointer group"
                          title="Click to view product details"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden shrink-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#5A3859] transition-colors truncate">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-stone-500 font-medium flex items-center gap-2">
                                <span>Qty: {item.quantity}</span>
                                <span>•</span>
                                <span>₹{item.price?.toLocaleString('en-IN')} each</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-bold text-xs sm:text-sm text-stone-900 font-display">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Row: Total, Address & Delhivery Tracking Snapshot */}
                    <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-stone-50/50 p-3 rounded-xl">
                      <div className="space-y-1">
                        <div className="text-[11px] text-stone-500">
                          <strong className="text-stone-700 font-bold">Delivery to:</strong>{' '}
                          {order.customerName || order.shippingAddress?.fullName},{' '}
                          {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                          <span className="font-mono font-bold text-stone-800">{order.shippingAddress?.postalCode}</span>
                        </div>
                        {order.trackingNumber && (
                          <div className="text-[11px] text-stone-600 flex items-center gap-1 font-mono">
                            <Truck className="h-3 w-3 text-[#5A3859]" />
                            <span>AWB: <strong className="text-[#5A3859]">{order.trackingNumber}</strong></span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-stone-500">Total Order Amount: </span>
                        <span className="font-display font-black text-sm sm:text-base text-[#5A3859]">
                          ₹{order.totalAmount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Addresses Tab Content */}
        {activeTab === 'addresses' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-stone-900">Saved Delivery Addresses</h3>
                <p className="text-xs text-stone-500 mt-0.5">Manage your saved addresses for 1-click express checkout</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAddr(null)
                  setShowAddForm(true)
                  setNewAddr({
                    title: 'Home',
                    fullName: user?.name || '',
                    phone: '',
                    addressLine: '',
                    city: '',
                    state: 'Gujarat',
                    postalCode: '',
                    isDefault: savedAddresses.length === 0,
                  })
                }}
                className="bg-[#5A3859] hover:bg-[#482b47] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Add New Address</span>
              </button>
            </div>

            {/* Saved Address Cards */}
            {savedAddresses.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 shadow-2xs space-y-3">
                <MapPin className="h-10 w-10 text-stone-300 mx-auto" />
                <h4 className="font-display text-base font-bold text-stone-900">No Saved Addresses Yet</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Add your primary shipping address for instant express checkout on all future orders.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-block bg-[#5A3859] hover:bg-[#482b47] text-white py-2 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Address Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2.5 border-b border-stone-100">
                        <span
                          className={`text-[10.5px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider border ${
                            (addr.title || '').toUpperCase() === 'HOME'
                              ? 'bg-[#5A3859]/10 text-[#5A3859] border-[#5A3859]/20'
                              : (addr.title || '').toUpperCase() === 'WORK'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {addr.title || 'Other'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(addr)}
                            className="text-xs font-bold text-[#5A3859] hover:text-white bg-[#5A3859]/10 hover:bg-[#5A3859] px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Edit Address"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddr(addr._id)}
                            disabled={isDeletingAddr}
                            className="text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 p-1.5 rounded-lg border border-rose-200 hover:border-rose-600 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Delete Address"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-sm font-bold text-stone-900 pt-0.5">{addr.fullName}</div>
                      <div className="text-xs text-stone-600 leading-relaxed">{addr.addressLine}</div>
                      <div className="text-xs text-stone-500 font-medium">
                        {addr.city}, {addr.state} - <strong className="font-mono font-bold text-stone-800">{addr.postalCode}</strong>
                      </div>
                      <div className="text-xs text-stone-700 font-mono font-semibold pt-1 flex items-center gap-1">
                        <span className="text-[#5A3859]">📞</span> {addr.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-5 sm:p-8 border border-stone-200 shadow-sm max-w-2xl space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900 pb-1">
                Personal Information
              </h2>
              <p className="text-xs text-stone-500">Manage your basic account profile and details</p>
            </div>

            <form onSubmit={handleSaveName} className="space-y-5 pt-2 border-t border-stone-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full p-3 bg-stone-50/60 border border-stone-300 rounded-xl font-bold text-stone-900 focus:bg-white focus:border-[#5A3859] focus:outline-none focus:ring-1 focus:ring-[#5A3859] transition-all text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                    Email Address
                  </label>
                  <div className="p-3 bg-stone-100/70 rounded-xl font-semibold text-stone-600 border border-stone-200 flex items-center justify-between text-xs sm:text-sm">
                    <span className="truncate">{user?.email}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0 ml-2">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile || !editName.trim() || editName.trim() === (user?.name || '')}
                    className="bg-[#5A3859] hover:bg-[#482b47] disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isUpdatingProfile ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>SAVE PROFILE</span>
                      </>
                    )}
                  </button>

                  {/* Cancel unsaved edit */}
                  {editName.trim() !== (user?.name || '') && (
                    <button
                      type="button"
                      onClick={() => setEditName(user?.name || '')}
                      className="text-stone-500 hover:text-stone-800 text-xs font-semibold underline px-2 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  {saveSuccessMsg && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {saveSuccessMsg}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>

    {/* Cancel Order Custom Modal */}
    <CancelOrderModal
      isOpen={Boolean(cancelModalOrder)}
      onClose={() => setCancelModalOrder(null)}
      order={cancelModalOrder}
      onConfirmCancel={handleConfirmCancelOrder}
      isLoading={isCancellingOrder}
    />

    {/* Delete Address Custom Confirmation Modal */}
    <ConfirmModal
      isOpen={Boolean(deleteAddrModal)}
      onClose={() => setDeleteAddrModal(null)}
      onConfirm={handleConfirmDeleteAddr}
      title="Delete Address"
      message="Are you sure you want to remove this delivery address from your address book?"
      confirmText="Delete Address"
      variant="danger"
      isLoading={isDeletingAddr}
    />

    {/* Floating Toast Notification */}
    {toast && (
      <div
        className={`fixed bottom-5 right-5 max-w-sm p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 z-[9999999] ${
          toast.type === 'error'
            ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-950/30'
            : toast.type === 'info'
            ? 'bg-stone-900/95 text-white border-stone-700 shadow-stone-950/30'
            : 'bg-[#3A2239]/95 text-white border-[#5A3859] shadow-purple-950/30'
        }`}
      >
        {toast.type === 'error' ? (
          <AlertTriangle className="h-5 w-5 text-rose-300 shrink-0 mt-0.5" />
        ) : toast.type === 'info' ? (
          <HelpCircle className="h-5 w-5 text-blue-300 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 text-xs font-semibold leading-relaxed">
          {toast.message}
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="text-stone-300 hover:text-white p-0.5 rounded cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )}
    </>
  )
}
