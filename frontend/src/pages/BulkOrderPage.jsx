import { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, AlertCircle, ChevronDown, Calendar, Mail, Building2, Package, Sparkles, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { INDIAN_STATES_CITIES, INDIAN_STATES } from '../data/indianStatesCities'
import { useToast } from '../context/ToastContext'

const DEFAULT_QUANTITIES = [
  '25 - 50 Units',
  '50 - 100 Units',
  '100 - 250 Units',
  '250 - 500 Units',
  '500 - 1000 Units',
  '1000+ Units',
]

const DEFAULT_PRODUCTS = [
  'All Products',
  'Sensein Volumizing Styling Hair Powder',
  'Sensein Keratin Damage Repair Hair Mask',
  'Sensein Smooth Silk Hair Serum',
  'Sensein Deep Cleansing Shampoo',
  'Sensein Luxury Signature Hair Perfume',
  'Sensein Complete Haircare Professional Kit',
]

// Exactly 4 options as per user request and screenshot
const PURPOSES = [
  'Distribution (Retailer)',
  'Distribution (Wholesaler)',
  'Distribution (Global)',
  'Other',
]

export default function BulkOrderPage() {
  const toast = useToast()
  const [quantities, setQuantities] = useState(DEFAULT_QUANTITIES)
  const [productList, setProductList] = useState(DEFAULT_PRODUCTS)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organizationName: '',
    quantity: '',
    product: '',
    state: '',
    city: '',
    remarks: '',
    purpose: 'Distribution (Retailer)',
    expectedDeliveryDate: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Dynamic available cities based on selected state
  const availableCities = useMemo(() => {
    if (!formData.state) return []
    return INDIAN_STATES_CITIES[formData.state] || []
  }, [formData.state])

  // Fetch dynamic quantity tiers from admin configuration
  useEffect(() => {
    let isMounted = true
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/bulk-orders/config')
        const data = await res.json()
        if (data?.success && Array.isArray(data?.data?.quantities) && data.data.quantities.length > 0) {
          if (isMounted) setQuantities(data.data.quantities)
        }
      } catch (e) {
        // Fallback to default quantities
      }
    }
    fetchConfig()
    return () => {
      isMounted = false
    }
  }, [])

  // Fetch live products currently on the website (including any newly added products)
  useEffect(() => {
    let isMounted = true
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=200')
        const data = await res.json()
        const items = data?.data || data?.products || []
        if (Array.isArray(items) && items.length > 0) {
          const names = items.map((p) => p.name).filter(Boolean)
          const uniqueNames = Array.from(new Set(names))
          const fullList = ['All Products', ...uniqueNames]
          if (isMounted) setProductList(fullList)
        }
      } catch (e) {
        // Fallback to default products
      }
    }
    fetchProducts()
    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      // Strictly digits only, max 10 characters
      const numericVal = value.replace(/\D/g, '').slice(0, 10)
      setFormData((prev) => ({ ...prev, [name]: numericVal }))
    } else if (name === 'state') {
      // When state changes, reset city
      setFormData((prev) => ({ ...prev, state: value, city: '' }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Clear specific field error
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Contact name is required'
    }

    // Strict Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com)'
    }

    // Strict Phone validation (Indian 10-digit mobile starting with 6-9)
    const cleanPhone = formData.phone.trim().replace(/\D/g, '')
    if (!cleanPhone) {
      errors.phone = 'Phone number is required'
    } else if (cleanPhone.length !== 10) {
      errors.phone = 'Mobile number must be exactly 10 digits'
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number (starts with 6-9)'
    }

    if (!formData.quantity) {
      errors.quantity = 'Please select requested quantity tier'
    }

    if (!formData.product) {
      errors.product = 'Please select product specification'
    }

    if (!formData.state) {
      errors.state = 'Please select delivery state'
    }

    if (!formData.city) {
      errors.city = 'Please select delivery city'
    }

    if (!formData.expectedDeliveryDate) {
      errors.expectedDeliveryDate = 'Please select expected delivery date'
    } else {
      const todayStr = new Date().toISOString().split('T')[0]
      if (formData.expectedDeliveryDate < todayStr) {
        errors.expectedDeliveryDate = 'Expected delivery date cannot be in the past'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please correct the errors in the highlighted fields.', 'Form Validation')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/bulk-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Your wholesale inquiry has been submitted!', 'Inquiry Received')
        setIsSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.error(result.message || 'Failed to submit inquiry. Please check your details.', 'Submission Error')
      }
    } catch (err) {
      toast.error('Network error. Please check your internet connection and try again.', 'Connection Error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`bg-[#FAF8F5] ${isSuccess ? 'py-4 sm:py-8' : 'min-h-screen py-10 sm:py-16'} text-stone-900 font-sans`}>
      <div className={`${isSuccess ? 'max-w-2xl' : 'max-w-4xl'} mx-auto px-4 sm:px-6 lg:px-8`}>
        {/* SUCCESS MESSAGE */}
        {isSuccess ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300 my-2 mx-auto">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200/60 shadow-xs">
              <CheckCircle2 className="h-7 w-7 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-900">
                Bulk Inquiry Received!
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Thank you for choosing <strong>SENSEIN PROFESSIONAL®</strong>. Our corporate sales team has received your details and will get in touch with a customized quote within 24 hours.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl max-w-md mx-auto text-left text-xs space-y-1.5 border border-stone-200/70">
              <p><strong className="text-stone-900">Contact Name:</strong> <span className="text-stone-700">{formData.name}</span></p>
              <p><strong className="text-stone-900">Phone No:</strong> <span className="text-stone-700">{formData.phone}</span></p>
              <p><strong className="text-stone-900">Email ID:</strong> <span className="text-stone-700">{formData.email}</span></p>
              <p><strong className="text-stone-900">Organization:</strong> <span className="text-stone-700">{formData.organizationName || 'Individual'}</span></p>
              <p><strong className="text-stone-900">Product:</strong> <span className="text-stone-700">{formData.product}</span></p>
              <p><strong className="text-stone-900">Quantity:</strong> <span className="text-stone-700">{formData.quantity}</span></p>
              <p><strong className="text-stone-900">State:</strong> <span className="text-stone-700">{formData.state}</span></p>
              <p><strong className="text-stone-900">City:</strong> <span className="text-stone-700">{formData.city}</span></p>
              <p><strong className="text-stone-900">Expected Delivery:</strong> <span className="text-stone-700">{formData.expectedDeliveryDate}</span></p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false)
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    organizationName: '',
                    quantity: '',
                    product: '',
                    state: '',
                    city: '',
                    remarks: '',
                    purpose: 'Distribution (Retailer)',
                    expectedDeliveryDate: '',
                  })
                  setFieldErrors({})
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-800 transition-all cursor-pointer shadow-xs"
              >
                Submit Another Inquiry
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-2.5 bg-stone-100 text-stone-800 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-200 transition-all border border-stone-200 text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-300 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#5A3859]">
                  Sensein Corporate &amp; Wholesale
                </span>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black mt-1">
                  FORM SUBMISSIONS
                </h1>
              </div>
              <span className="text-xs font-semibold text-stone-500 sm:text-right">
                (*) - Mandatory Field
              </span>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name*"
                    className={`w-full h-12 px-4 bg-[#FAF8F5] border ${fieldErrors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-800'
                      } rounded-none focus:outline-none focus:ring-1 focus:ring-black placeholder:text-stone-400 text-sm font-medium transition-all`}
                  />
                  {fieldErrors.name && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email ID*"
                    className={`w-full h-12 px-4 bg-[#FAF8F5] border ${fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-800'
                      } rounded-none focus:outline-none focus:ring-1 focus:ring-black placeholder:text-stone-400 text-sm font-medium transition-all`}
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Phone & Organization Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone No.* (10-Digit Mobile)"
                    maxLength={10}
                    inputMode="numeric"
                    className={`w-full h-12 px-4 bg-[#FAF8F5] border ${fieldErrors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-800'
                      } rounded-none focus:outline-none focus:ring-1 focus:ring-black placeholder:text-stone-400 text-sm font-medium transition-all`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="Organization Name"
                    className="w-full h-12 px-4 bg-[#FAF8F5] border border-stone-800 rounded-none focus:outline-none focus:ring-1 focus:ring-black placeholder:text-stone-400 text-sm font-medium transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Select Quantity & Select Product (Paired Together) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Select Quantity */}
                <div>
                  <div className="relative">
                    <select
                      required
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className={`w-full h-12 px-4 bg-[#FAF8F5] border ${fieldErrors.quantity ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-800'
                        } rounded-none focus:outline-none focus:ring-1 focus:ring-black text-sm font-medium appearance-none cursor-pointer text-stone-800 transition-all pr-10`}
                    >
                      <option value="" disabled>Select Quantity*</option>
                      {quantities.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-700 pointer-events-none" />
                  </div>
                  {fieldErrors.quantity && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.quantity}</p>
                  )}
                </div>

                {/* Select Product */}
                <div>
                  <div className="relative">
                    <select
                      required
                      name="product"
                      value={formData.product}
                      onChange={handleChange}
                      className={`w-full h-12 px-4 bg-[#FAF8F5] border ${fieldErrors.product ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-800'
                        } rounded-none focus:outline-none focus:ring-1 focus:ring-black text-sm font-medium appearance-none cursor-pointer text-stone-800 transition-all pr-10`}
                    >
                      <option value="" disabled>Select Product*</option>
                      {productList.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-700 pointer-events-none" />
                  </div>
                  {fieldErrors.product && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.product}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Select State & Select City (Side-by-Side Cascading) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Select State */}
                <div>
                  <div className="relative">
                    <select
                      required
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`w-full h-12 px-4 bg-[#FAF8F5] border ${fieldErrors.state ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-800'
                        } rounded-none focus:outline-none focus:ring-1 focus:ring-black text-sm font-medium appearance-none cursor-pointer text-stone-800 transition-all pr-10`}
                    >
                      <option value="" disabled>Select State / UT*</option>
                      {INDIAN_STATES.map((stateName) => (
                        <option key={stateName} value={stateName}>{stateName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-700 pointer-events-none" />
                  </div>
                  {fieldErrors.state && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.state}</p>
                  )}
                </div>

                {/* Select City (Enabled only after state is picked) */}
                <div>
                  <div className="relative">
                    <select
                      required
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!formData.state}
                      className={`w-full h-12 px-4 bg-[#FAF8F5] border ${fieldErrors.city ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-800'
                        } ${!formData.state ? 'opacity-60 cursor-not-allowed bg-stone-100' : 'cursor-pointer'} rounded-none focus:outline-none focus:ring-1 focus:ring-black text-sm font-medium appearance-none text-stone-800 transition-all pr-10`}
                    >
                      <option value="" disabled>
                        {formData.state ? 'Select City*' : 'Select State First*'}
                      </option>
                      {availableCities.map((cityName) => (
                        <option key={cityName} value={cityName}>{cityName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-700 pointer-events-none" />
                  </div>
                  {fieldErrors.city && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.city}</p>
                  )}
                </div>
              </div>

              {/* Row 5: Remarks / Additional Information */}
              <div>
                <textarea
                  rows={4}
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Remark for customer what exactly they want can have field with additional information"
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-stone-800 rounded-none focus:outline-none focus:ring-1 focus:ring-black placeholder:text-stone-400 text-sm font-medium transition-all resize-y"
                />
              </div>

              {/* Row 6: Purpose of Purchasing Radio Grid (Exactly 4 options in 3-column layout) */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-extrabold uppercase tracking-tight text-black">
                  Purpose of Purchasing*
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs sm:text-sm font-medium">
                  {PURPOSES.map((purpose) => (
                    <label key={purpose} className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="purpose"
                        value={purpose}
                        checked={formData.purpose === purpose}
                        onChange={handleChange}
                        className="accent-black h-4 w-4 cursor-pointer"
                      />
                      <span className="text-stone-800">{purpose}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Row 7: Expected Delivery Date & Submit Button (Aligned Cleanly) */}
              <div className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-sm font-extrabold uppercase tracking-tight text-black mb-2">
                      Expected Delivery Date*
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      name="expectedDeliveryDate"
                      value={formData.expectedDeliveryDate}
                      onChange={handleChange}
                      className={`w-full h-12 px-4 bg-[#FAF8F5] border ${fieldErrors.expectedDeliveryDate ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-800'
                        } rounded-none focus:outline-none focus:ring-1 focus:ring-black text-sm font-medium text-stone-800 cursor-pointer`}
                    />
                    {fieldErrors.expectedDeliveryDate && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">
                        {fieldErrors.expectedDeliveryDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="hidden sm:block text-sm font-extrabold uppercase tracking-tight text-transparent mb-2 select-none">
                      Submit Action
                    </label>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-black hover:bg-stone-900 disabled:opacity-50 text-white font-extrabold text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Submit</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="pt-4 space-y-1 text-sm">
                <h4 className="font-extrabold text-black uppercase tracking-tight">Contact Details</h4>
                <p className="text-stone-700">
                  Email:{' '}
                  <a
                    href="mailto:info@sensein.in"
                    className="underline text-black font-semibold hover:text-[#5A3859]"
                  >
                    info@sensein.in
                  </a>
                </p>
              </div>

              {/* ABOUT THE BULK ORDER Section */}
              <div className="pt-8 border-t border-stone-300 space-y-2">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                  ABOUT THE BULK ORDER:
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                  Claim your savings by buying in bulk with Sensein Professional. Create personalised collections for every occasion – festival hampers, corporate gifts, wedding tokens, salon &amp; spa wholesale, and more. With this bulk buying option, take your gifting skills up a notch.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
