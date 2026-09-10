import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import CheckoutStepper from '@/components/CheckoutStepper'
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  Truck,
  Package,
  QrCode,
  Building2,
  Sparkles,
  Zap,
  Clock,
  AlertCircle,
  Smartphone,
  RefreshCw,
  Gift,
  CheckCircle2,
  Tag,
  Percent,
  Trash2,
  Home,
  Briefcase,
  MapPin,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react'
import {
  selectCartItems,
  selectCartSubtotal,
  selectAppliedCoupon,
  clearCart,
  removeFromCart,
  removeCoupon,
  updateQuantity,
} from '@/store/cartSlice'
import RazorpayDummyModal from '@/components/RazorpayDummyModal'
import ApplyVoucherModal from '@/components/ApplyVoucherModal'
import {
  useCreateOrderMutation,
  useLazyCheckPincodeQuery,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useMarkPaymentFailedMutation,
  useGetShippingSettingsQuery,
} from '@/features/ordersApi'
import { useGetSavedAddressesQuery } from '@/features/authApi'
import { selectIsAuthenticated, selectCurrentUser, setCredentials } from '@/store/authSlice'
import { openAuthModal } from '@/store/uiSlice'
import { trackBeginCheckout } from '@/utils/analytics'

export const INDIAN_STATES_CITIES = {
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar',
    'Junagadh', 'Gandhidham', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Surendranagar',
    'Bharuch', 'Mehsana', 'Bhuj', 'Porbandar', 'Palanpur', 'Valsad', 'Vapi', 'Gondal',
    'Veraval', 'Godhra', 'Patan', 'Dahod', 'Botad', 'Amreli', 'Deesa', 'Jetpur', 'Other'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Navi Mumbai',
    'Kolhapur', 'Akola', 'Panvel', 'Kalyan-Dombivli', 'Vasai-Virar', 'Amravati', 'Nanded',
    'Sangli', 'Jalgaon', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Other'
  ],
  'Delhi (NCR)': [
    'New Delhi', 'Central Delhi', 'East Delhi', 'North Delhi', 'South Delhi', 'West Delhi',
    'Noida', 'Greater Noida', 'Gurugram', 'Faridabad', 'Ghaziabad', 'Other'
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar',
    'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Barmer', 'Chittorgarh', 'Other'
  ],
  'Karnataka': [
    'Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi',
    'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Udupi', 'Other'
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode',
    'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Nagercoil', 'Other'
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut', 'Noida', 'Ghaziabad',
    'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Mathura', 'Jhansi', 'Other'
  ],
  'Madhya Pradesh': [
    'Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna',
    'Ratlam', 'Rewa', 'Singrauli', 'Burhanpur', 'Khandwa', 'Other'
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Kharagpur',
    'Haldia', 'Malda', 'Baharampur', 'Other'
  ],
  'Punjab': [
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur',
    'Pathankot', 'Moga', 'Other'
  ],
  'Haryana': [
    'Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar',
    'Karnal', 'Sonipat', 'Panchkula', 'Other'
  ],
  'Telangana': [
    'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam',
    'Mahbubnagar', 'Nalgonda', 'Other'
  ],
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada',
    'Rajahmundry', 'Tirupati', 'Kadapa', 'Other'
  ],
  'Kerala': [
    'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Kollam', 'Thrissur', 'Kannur',
    'Alappuzha', 'Kottayam', 'Palakkad', 'Other'
  ],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Other'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Other'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Other'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tezpur', 'Other'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua', 'Other'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Other'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh', 'Other'],
  'Chandigarh': ['Chandigarh', 'Other'],
  'Other State / UT': ['Other City']
}

export const getPincodeLocation = (pin) => {
  if (!pin || pin.length < 2) return null
  const prefix2 = pin.substring(0, 2)
  const prefix3 = pin.substring(0, 3)

  if (prefix3 === '395') return { state: 'Gujarat', city: 'Surat' }
  if (prefix3 === '380') return { state: 'Gujarat', city: 'Ahmedabad' }
  if (prefix3 === '390') return { state: 'Gujarat', city: 'Vadodara' }
  if (prefix3 === '360') return { state: 'Gujarat', city: 'Rajkot' }
  if (prefix3 === '364') return { state: 'Gujarat', city: 'Bhavnagar' }
  if (prefix3 === '361') return { state: 'Gujarat', city: 'Jamnagar' }
  if (prefix3 === '382') return { state: 'Gujarat', city: 'Gandhinagar' }
  if (prefix3 === '396') return { state: 'Gujarat', city: 'Valsad' }
  if (['36', '37', '38', '39'].includes(prefix2)) return { state: 'Gujarat' }

  if (prefix3 === '400') return { state: 'Maharashtra', city: 'Mumbai' }
  if (prefix3 === '411') return { state: 'Maharashtra', city: 'Pune' }
  if (prefix3 === '440') return { state: 'Maharashtra', city: 'Nagpur' }
  if (prefix3 === '422') return { state: 'Maharashtra', city: 'Nashik' }
  if (prefix3 === '401') return { state: 'Maharashtra', city: 'Thane' }
  if (['40', '41', '42', '43', '44'].includes(prefix2)) return { state: 'Maharashtra' }

  if (prefix2 === '11') return { state: 'Delhi (NCR)', city: 'New Delhi' }
  if (prefix3 === '302') return { state: 'Rajasthan', city: 'Jaipur' }
  if (prefix3 === '342') return { state: 'Rajasthan', city: 'Jodhpur' }
  if (['30', '31', '32', '33', '34'].includes(prefix2)) return { state: 'Rajasthan' }

  if (prefix3 === '560') return { state: 'Karnataka', city: 'Bengaluru' }
  if (prefix3 === '570') return { state: 'Karnataka', city: 'Mysuru' }
  if (['56', '57', '58', '59'].includes(prefix2)) return { state: 'Karnataka' }

  if (prefix3 === '600') return { state: 'Tamil Nadu', city: 'Chennai' }
  if (prefix3 === '641') return { state: 'Tamil Nadu', city: 'Coimbatore' }
  if (['60', '61', '62', '63', '64'].includes(prefix2)) return { state: 'Tamil Nadu' }

  if (prefix3 === '226') return { state: 'Uttar Pradesh', city: 'Lucknow' }
  if (prefix3 === '208') return { state: 'Uttar Pradesh', city: 'Kanpur' }
  if (prefix3 === '201') return { state: 'Uttar Pradesh', city: 'Noida' }
  if (['20', '21', '22', '23', '24', '25', '26', '27', '28'].includes(prefix2)) return { state: 'Uttar Pradesh' }

  if (prefix3 === '452') return { state: 'Madhya Pradesh', city: 'Indore' }
  if (prefix3 === '462') return { state: 'Madhya Pradesh', city: 'Bhopal' }
  if (['45', '46', '47', '48', '49'].includes(prefix2)) return { state: 'Madhya Pradesh' }

  if (prefix3 === '700') return { state: 'West Bengal', city: 'Kolkata' }
  if (['70', '71', '72', '73', '74'].includes(prefix2)) return { state: 'West Bengal' }

  if (prefix3 === '141') return { state: 'Punjab', city: 'Ludhiana' }
  if (prefix3 === '143') return { state: 'Punjab', city: 'Amritsar' }
  if (['14', '15', '16'].includes(prefix2)) return { state: 'Punjab' }

  if (prefix3 === '122') return { state: 'Haryana', city: 'Gurugram' }
  if (prefix3 === '121') return { state: 'Haryana', city: 'Faridabad' }
  if (['12', '13'].includes(prefix2)) return { state: 'Haryana' }

  if (prefix3 === '500') return { state: 'Telangana', city: 'Hyderabad' }
  if (prefix2 === '50') return { state: 'Telangana', city: 'Hyderabad' }

  if (prefix3 === '530') return { state: 'Andhra Pradesh', city: 'Visakhapatnam' }
  if (prefix3 === '520') return { state: 'Andhra Pradesh', city: 'Vijayawada' }
  if (['51', '52', '53'].includes(prefix2)) return { state: 'Andhra Pradesh' }

  if (prefix3 === '682') return { state: 'Kerala', city: 'Kochi' }
  if (prefix3 === '695') return { state: 'Kerala', city: 'Thiruvananthapuram' }
  if (['67', '68', '69'].includes(prefix2)) return { state: 'Kerala' }

  if (prefix3 === '403') return { state: 'Goa', city: 'Panaji' }
  if (prefix3 === '800') return { state: 'Bihar', city: 'Patna' }
  if (['80', '81', '82', '84', '85'].includes(prefix2)) return { state: 'Bihar' }

  if (prefix3 === '751') return { state: 'Odisha', city: 'Bhubaneswar' }
  if (['75', '76', '77'].includes(prefix2)) return { state: 'Odisha' }

  if (prefix3 === '781') return { state: 'Assam', city: 'Guwahati' }
  if (prefix2 === '78') return { state: 'Assam' }
  return null
}

const loadSavedAddressFromStorage = () => {
  try {
    const saved = localStorage.getItem('sensein_saved_checkout_address')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    }
  } catch (e) {}
  return null
}

const loadSavedAddressesListCache = () => {
  try {
    const saved = localStorage.getItem('sensein_saved_addresses_list')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {}
  return []
}

const saveCheckoutAddressToStorage = (addrData) => {
  try {
    if (addrData && (addrData.addressLine || addrData.postalCode || addrData.customerPhone)) {
      localStorage.setItem(
        'sensein_saved_checkout_address',
        JSON.stringify({
          customerName: addrData.customerName || '',
          customerEmail: addrData.customerEmail || '',
          customerPhone: addrData.customerPhone || '',
          addressLine: addrData.addressLine || '',
          city: addrData.city || '',
          customCity: addrData.customCity || '',
          state: addrData.state || '',
          postalCode: addrData.postalCode || '',
        })
      )
    }
  } catch (e) {}
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)

  const cartItems = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartSubtotal)
  const appliedCoupon = useSelector(selectAppliedCoupon)

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
  const summaryItemsRef = useRef(null)
  const [hasMoreSummaryItems, setHasMoreSummaryItems] = useState(false)

  const checkSummaryScroll = () => {
    const el = summaryItemsRef.current
    if (!el) return
    const isScrollable = el.scrollHeight > el.clientHeight + 10
    const isNotAtBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 15
    setHasMoreSummaryItems(isScrollable && isNotAtBottom)
  }

  useEffect(() => {
    const timer = setTimeout(checkSummaryScroll, 100)
    return () => clearTimeout(timer)
  }, [cartItems])

  const scrollSummaryItems = () => {
    if (summaryItemsRef.current) {
      summaryItemsRef.current.scrollBy({ top: 120, behavior: 'smooth' })
    }
  }

  // Address book API with instant local cache fallback to prevent layout pop-in on refresh
  const { data: addressResponse } = useGetSavedAddressesQuery(undefined, { skip: !isAuthenticated })
  const cachedAddressesList = loadSavedAddressesListCache()
  const savedAddresses =
    addressResponse?.data && Array.isArray(addressResponse.data) && addressResponse.data.length > 0
      ? addressResponse.data
      : isAuthenticated
      ? cachedAddressesList
      : []

  useEffect(() => {
    if (addressResponse?.data && Array.isArray(addressResponse.data) && addressResponse.data.length > 0) {
      try {
        localStorage.setItem('sensein_saved_addresses_list', JSON.stringify(addressResponse.data))
      } catch (e) {}
    }
  }, [addressResponse])

  // Dynamic Store Shipping Settings & 3-Tier Milestones
  const { data: shippingSettingsData } = useGetShippingSettingsQuery()
  const shippingSettings = shippingSettingsData?.settings || {}
  const standardFee = Number(shippingSettings.standardShippingFee ?? 0)
  const freeThreshold = Number(shippingSettings.freeShippingThreshold ?? 0)
  const isFreeEnabled = shippingSettings.isFreeShippingEnabled !== false

  const isSimpleMode = shippingSettings.cartProgressMode === 'simple'

  // 3-Tier Milestones
  const tier1Threshold = Number(shippingSettings.tier1Threshold ?? shippingSettings.freeShippingThreshold ?? 999)
  const tier1Enabled = shippingSettings.tier1Enabled !== false && isFreeEnabled

  const tier2Threshold = Number(shippingSettings.tier2Threshold ?? 1999)
  const tier2Enabled = !isSimpleMode && shippingSettings.tier2Enabled !== false
  const tier2CouponCode = shippingSettings.tier2CouponCode || 'EXTRA10'
  const tier2DiscountText = shippingSettings.tier2DiscountText || '10% Instant Off'

  const tier3Threshold = Number(shippingSettings.tier3Threshold ?? shippingSettings.giftMinSpend ?? 2999)
  const tier3Enabled = !isSimpleMode && ((shippingSettings.tier3Enabled !== false) || (shippingSettings.isGiftPromoEnabled !== false))
  const tier3ItemName = shippingSettings.tier3ItemName || shippingSettings.giftItemName || 'Sensein Luxury Botanical Mini Elixir (30ml)'
  const tier3ProductLink = shippingSettings.tier3ProductLink || '/shop'
  const tier3Badge = shippingSettings.tier3Badge || shippingSettings.giftBadge || 'FREE GIFT'

  const isT1Unlocked = tier1Enabled && subtotal >= tier1Threshold
  const isT2Unlocked = tier2Enabled && subtotal >= tier2Threshold
  const isT3Unlocked = tier3Enabled && subtotal >= tier3Threshold

  let progressPercent = 0
  if (subtotal >= tier1Threshold) {
    if (subtotal < tier2Threshold) {
      const range = Math.max(1, tier2Threshold - tier1Threshold)
      progressPercent = ((subtotal - tier1Threshold) / range) * 50
    } else if (subtotal < tier3Threshold) {
      const range = Math.max(1, tier3Threshold - tier2Threshold)
      progressPercent = 50 + ((subtotal - tier2Threshold) / range) * 50
    } else {
      progressPercent = 100
    }
  }
  progressPercent = Math.min(100, Math.max(0, Math.round(progressPercent * 10) / 10))

  let announcementText = ''
  if (!isT1Unlocked && tier1Enabled) {
    const diff = tier1Threshold - subtotal
    announcementText = `Add ₹${diff.toLocaleString('en-IN')} more to unlock FREE Delivery!`
  } else if (!isT2Unlocked && tier2Enabled) {
    const diff = tier2Threshold - subtotal
    announcementText = `🎉 Free Delivery Unlocked! Add ₹${diff.toLocaleString('en-IN')} for Special Coupon (${tier2CouponCode})`
  } else if (!isT3Unlocked && tier3Enabled) {
    const diff = tier3Threshold - subtotal
    announcementText = `🎉 Coupon & Delivery Unlocked! Add ₹${diff.toLocaleString('en-IN')} to claim Free Gift!`
  } else {
    announcementText = `🔥 Awesome! You've unlocked All 3 Milestone Rewards!`
  }

  const isFreeApplicable = isFreeEnabled && tier1Threshold > 0 && subtotal >= tier1Threshold
  const standardCost = standardFee === 0 || isFreeApplicable ? 0 : standardFee

  // Shipping Method selection state
  const [shippingMethod, setShippingMethod] = useState('STANDARD')
  const shippingCostMap = {
    STANDARD: standardCost,
    EXPRESS: standardCost + 99,
    PRIORITY: standardCost + 199,
  }
  const shippingFee = shippingCostMap[shippingMethod] ?? standardCost

  // Calculate discount based on active coupon
  let promoDiscount = 0
  if (appliedCoupon && subtotal >= (appliedCoupon.minSpend || 0)) {
    if (appliedCoupon.discountType === 'percentage') {
      const calculated = Math.round(subtotal * (appliedCoupon.discountValue / 100))
      promoDiscount = appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated
    } else if (appliedCoupon.discountType === 'fixed') {
      promoDiscount = Math.min(subtotal, appliedCoupon.discountValue)
    }
  }

  const totalAmount = Math.max(0, subtotal - promoDiscount + shippingFee)

  const handleApplyPromoCode = (codeToApply) => {
    setPromoError('')
    const code = (codeToApply || promoCode).trim().toUpperCase()
    if (!code) {
      setPromoError('Please enter a coupon code.')
      return
    }

    const matched = AVAILABLE_COUPONS.find((c) => c.code === code)
    if (matched) {
      if (subtotal < matched.minSpend) {
        const diff = matched.minSpend - subtotal
        setPromoError(`Coupon '${matched.code}' requires a minimum order of ₹${matched.minSpend.toLocaleString('en-IN')} (Current total: ₹${subtotal.toLocaleString('en-IN')}). Please add ₹${diff.toLocaleString('en-IN')} more.`)
        return
      }
      setAppliedCoupon(matched)
      setPromoApplied(true)
      setPromoCode(code)
      setPromoError('')
    } else if (code === 'WELCOME10') {
      if (subtotal < 499) {
        setPromoError("Coupon 'WELCOME10' requires a minimum order of ₹499.")
        return
      }
      const fallback = {
        code: 'WELCOME10',
        title: '10% OFF',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: 200,
        description: '10% Welcome discount on orders above ₹499',
        minSpend: 499,
      }
      setAppliedCoupon(fallback)
      setPromoApplied(true)
      setPromoCode(code)
      setPromoError('')
    } else {
      setPromoError(`Invalid coupon code '${code}'. Please choose one of the available offers below.`)
    }
  }

  const handleRemovePromo = () => {
    setPromoApplied(false)
    setAppliedCoupon(null)
    setPromoCode('')
    setPromoError('')
  }

  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation()
  const [triggerPincodeCheck, { isLoading: isCheckingPincode }] = useLazyCheckPincodeQuery()
  const [createPaymentOrder, { isLoading: isCreatingPayment }] = useCreatePaymentOrderMutation()
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyPaymentMutation()
  const [markPaymentFailed] = useMarkPaymentFailedMutation()

  const isLoading = isCreatingOrder || isCreatingPayment || isVerifyingPayment

  // Active & Failed Order Tracking
  const [activeOrder, setActiveOrder] = useState(null)
  const [failedOrder, setFailedOrder] = useState(null)

  const cachedSavedAddress = loadSavedAddressFromStorage()

  // Form State
  const [formData, setFormData] = useState({
    customerName: user?.name || cachedSavedAddress?.customerName || '',
    customerEmail: user?.email || cachedSavedAddress?.customerEmail || '',
    customerPhone: cachedSavedAddress?.customerPhone || '',
    addressType: 'HOME',
    addressLine: cachedSavedAddress?.addressLine || '',
    city: cachedSavedAddress?.city || '',
    customCity: cachedSavedAddress?.customCity || '',
    state: cachedSavedAddress?.state || '',
    postalCode: cachedSavedAddress?.postalCode || '',
    paymentMethod: 'UPI',
    cardNumber: '4532 •••• •••• 8892',
    cardName: user?.name || cachedSavedAddress?.customerName || 'Customer Name',
    cardExpiry: '08/28',
    cardCvv: '482',
    upiId: 'user@paytm',
    selectedBank: 'HDFC',
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})
  const [errorMsg, setErrorMsg] = useState('')
  const [pincodeStatus, setPincodeStatus] = useState(null)

  useEffect(() => {
    if (cartItems.length > 0) {
      trackBeginCheckout(cartItems, totalAmount)
    }
    // Automatically verify and set courier delivery for cached postal code
    if (cachedSavedAddress?.postalCode && cachedSavedAddress.postalCode.length === 6) {
      handlePincodeCheck(cachedSavedAddress.postalCode)
    }
  }, [])

  const handlePincodeCheck = async (pin) => {
    const cleanPin = String(pin || '').replace(/\D/g, '').slice(0, 6)
    if (cleanPin.length !== 6) {
      setPincodeStatus(null)
      return
    }

    // Immediate instant pre-fill from prefix database
    const loc = getPincodeLocation(cleanPin)
    if (loc?.state) {
      const matchedState =
        Object.keys(INDIAN_STATES_CITIES).find(
          (s) =>
            s.toLowerCase() === loc.state.toLowerCase() ||
            (loc.state.toLowerCase().includes('delhi') && s.includes('Delhi'))
        ) || loc.state
      const cityList = INDIAN_STATES_CITIES[matchedState] || []
      const matchedCity = loc.city
        ? cityList.find((c) => c.toLowerCase() === loc.city.toLowerCase()) || loc.city
        : ''

      setFormData((prev) => {
        const next = {
          ...prev,
          postalCode: cleanPin,
          state: matchedState,
          city: matchedCity || prev.city,
        }
        saveCheckoutAddressToStorage(next)
        return next
      })
      setFieldErrors((prev) => ({
        ...prev,
        postalCode: '',
        state: '',
        city: '',
      }))
    }

    setPincodeStatus({ loading: true, message: 'Verifying with Delhivery Express...' })
    try {
      const res = await fetch(`/api/shipping/check-pincode/${cleanPin}`).then((r) => r.json())
      if (res.success && (res.data?.valid || res.valid)) {
        const data = res.data || res
        setPincodeStatus({
          loading: false,
          valid: true,
          message: data.message || `Deliverable via ${data.courier || 'Delhivery Express'}`,
          courier: data.courier || 'Delhivery Express',
        })

        if (data.state) {
          const matchedState =
            Object.keys(INDIAN_STATES_CITIES).find(
              (s) =>
                s.toLowerCase() === data.state.toLowerCase() ||
                (data.state.toLowerCase().includes('delhi') && s.includes('Delhi'))
            ) || data.state

          const cityList = INDIAN_STATES_CITIES[matchedState] || []
          const apiCity = (data.city || '').trim()
          let matchedCity = ''
          if (apiCity) {
            matchedCity =
              cityList.find((c) => c.toLowerCase() === apiCity.toLowerCase()) ||
              apiCity
          } else if (loc?.city) {
            matchedCity =
              cityList.find((c) => c.toLowerCase() === loc.city.toLowerCase()) ||
              loc.city
          }

          setFormData((prev) => {
            const next = {
              ...prev,
              postalCode: cleanPin,
              state: matchedState,
              city: matchedCity || (cityList.length > 0 ? cityList[0] : ''),
              customCity:
                !cityList.includes(matchedCity) && matchedCity !== 'Other'
                  ? apiCity
                  : matchedCity === 'Other'
                  ? apiCity
                  : prev.customCity,
            }
            saveCheckoutAddressToStorage(next)
            return next
          })
        }

        setFieldErrors((prev) => ({
          ...prev,
          postalCode: '',
          state: '',
          city: '',
        }))
      } else {
        setPincodeStatus({
          loading: false,
          valid: false,
          message: res.data?.message || res.message || 'Invalid PIN code. Delivery is not serviceable at this location.',
        })
        setFieldErrors((prev) => ({
          ...prev,
          postalCode: 'Invalid PIN code. Please enter a valid deliverable 6-digit postal code.',
        }))
      }
    } catch (err) {
      if (loc?.state) {
        setPincodeStatus({
          loading: false,
          valid: true,
          message: 'Direct delivery serviceable via Delhivery Express',
          courier: 'Delhivery Express',
        })
      } else {
        setPincodeStatus(null)
      }
    }
  }

  // Modals & Gateway States
  const [showPaymentChoiceModal, setShowPaymentChoiceModal] = useState(false)
  const [modalPaymentMethod, setModalPaymentMethod] = useState('ONLINE') // 'ONLINE' or 'COD'
  const [showRazorpayDummyModal, setShowRazorpayDummyModal] = useState(false)
  const [showUpiQrModal, setShowUpiQrModal] = useState(false)
  const [qrTimer, setQrTimer] = useState(300)
  const [showAddressPickerModal, setShowAddressPickerModal] = useState(false)
  const [pickerSelectedAddr, setPickerSelectedAddr] = useState(null) // addr being hovered/selected in modal

  // Body scroll lock when any checkout modal/drawer is open
  useEffect(() => {
    const isAnyModalOpen =
      showPaymentChoiceModal ||
      isVoucherModalOpen ||
      showRazorpayDummyModal ||
      showUpiQrModal ||
      showAddressPickerModal

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [
    showPaymentChoiceModal,
    isVoucherModalOpen,
    showRazorpayDummyModal,
    showUpiQrModal,
    showAddressPickerModal,
  ])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
      }))
    }
  }, [user])

  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !formData.addressLine) {
      const defaultAddr =
        savedAddresses.find((a) => (a.title || a.addressType || '').toUpperCase() === 'HOME') ||
        savedAddresses.find((a) => a.isDefault) ||
        savedAddresses[0]
      if (defaultAddr) {
        handleSelectSavedAddress(defaultAddr)
      }
    }
  }, [savedAddresses])

  // Lock body scroll when any modal is active to prevent background scrolling
  useEffect(() => {
    if (showPaymentChoiceModal || showUpiQrModal || showRazorpayDummyModal || isVoucherModalOpen || showAddressPickerModal) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [showPaymentChoiceModal, showUpiQrModal, showRazorpayDummyModal, isVoucherModalOpen])

  // Timer for Razorpay QR Modal
  useEffect(() => {
    let interval
    if (showUpiQrModal && qrTimer > 0) {
      interval = setInterval(() => setQrTimer((prev) => prev - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [showUpiQrModal, qrTimer])

  const validateField = (name, value, currentFormData = formData) => {
    let error = ''
    if (name === 'customerName') {
      if (!value || !value.trim()) error = 'Full name is required'
      else if (value.trim().length < 2) error = 'Name must be at least 2 characters'
    } else if (name === 'customerEmail') {
      if (!value || !value.trim()) error = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) error = 'Invalid email address'
    } else if (name === 'customerPhone') {
      const clean = value ? String(value).replace(/\D/g, '').slice(-10) : ''
      if (!clean) error = 'Phone number is required'
      else if (clean.length !== 10) {
        error = 'Enter a valid 10-digit mobile number'
      }
    } else if (name === 'postalCode') {
      if (!value || !value.trim()) error = 'PIN code is required'
      else if (!/^\d{6}$/.test(value.trim())) error = 'Enter a valid 6-digit PIN code'
    } else if (name === 'addressLine') {
      if (!value || !value.trim()) error = 'House/Flat No. and Street address is required'
      else if (value.trim().length < 3) error = 'Please provide full street address'
    } else if (name === 'state') {
      if (!value || !value.trim()) error = 'Please select a state'
    } else if (name === 'city') {
      const effectiveCity = value === 'Other' ? currentFormData.customCity : value
      if (!effectiveCity || !effectiveCity.trim()) error = 'Please select or enter your city'
    }
    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }
      if (touchedFields[name]) {
        const error = validateField(name, value, updated)
        setFieldErrors((errs) => ({ ...errs, [name]: error }))
      }
      return updated
    })
    setErrorMsg('')
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouchedFields((prev) => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setFieldErrors((prev) => ({ ...prev, [name]: error }))
    setFormData((current) => {
      saveCheckoutAddressToStorage(current)
      return current
    })
  }

  const handleStateChange = (e) => {
    const selectedState = e.target.value
    setFormData((prev) => {
      const updated = {
        ...prev,
        state: selectedState,
        city: '',
        customCity: '',
      }
      saveCheckoutAddressToStorage(updated)
      return updated
    })
    setFieldErrors((prev) => ({
      ...prev,
      state: selectedState ? '' : 'Please select a state',
      city: '',
    }))
    setErrorMsg('')
  }

  const handlePincodeBlur = (e) => {
    handleBlur(e)
  }

  const handleSelectSavedAddress = (addr) => {
    if (!addr) return
    const matchedState = Object.keys(INDIAN_STATES_CITIES).find(
      (s) => s.toLowerCase() === (addr.state || '').toLowerCase()
    ) || addr.state || 'Gujarat'

    const cityList = INDIAN_STATES_CITIES[matchedState] || []
    const matchedCity = cityList.find((c) => c.toLowerCase() === (addr.city || '').toLowerCase())

    setFormData((prev) => {
      const updated = {
        ...prev,
        customerName: addr.fullName || prev.customerName || '',
        customerPhone: addr.phone || prev.customerPhone || '',
        addressType: addr.title ? addr.title.toUpperCase() : 'HOME',
        addressLine: addr.addressLine || '',
        state: matchedState,
        city: matchedCity || (addr.city ? 'Other' : ''),
        customCity: !matchedCity && addr.city ? addr.city : '',
        postalCode: addr.postalCode || '',
      }
      saveCheckoutAddressToStorage(updated)
      return updated
    })
    setFieldErrors({})
    setErrorMsg('')
  }

  const handleAddNewAddress = () => {
    const primaryAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0] || {}

    // Preserve Full Name, Phone Number, and PIN Code (along with matching State & City), only reset Street Address
    const preservedName = formData.customerName || primaryAddr.fullName || user?.name || ''
    const preservedPhone = formData.customerPhone || primaryAddr.phone || ''
    const preservedPin = formData.postalCode || primaryAddr.postalCode || '395010'
    const preservedState = formData.state || primaryAddr.state || 'Gujarat'
    const preservedCity = formData.city || primaryAddr.city || 'Surat'
    const preservedCustomCity = formData.customCity || ''

    setFormData((prev) => ({
      ...prev,
      customerName: preservedName,
      customerPhone: preservedPhone,
      postalCode: preservedPin,
      state: preservedState,
      city: preservedCity,
      customCity: preservedCustomCity,
      addressLine: '', // Empty for typing the new house/street address
      addressType: 'WORK',
    }))
    setFieldErrors({})
    setErrorMsg('')

    if (preservedPin && preservedPin.length === 6) {
      handlePincodeCheck(preservedPin)
    }
  }

  const validateForm = () => {
    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty.')
      return false
    }

    const hasOutOfStock = cartItems.some(
      (item) =>
        (item.product?.stock !== undefined && item.product.stock <= 0) ||
        item.product?.inStock === false ||
        item.product?.isDeleted === true
    )
    if (hasOutOfStock) {
      setErrorMsg('Some items in your cart are currently out of stock. Please return to your cart to remove them.')
      return false
    }

    const errors = {}
    const fieldsToValidate = ['customerName', 'customerEmail', 'customerPhone', 'postalCode', 'addressLine', 'state', 'city']
    fieldsToValidate.forEach((field) => {
      const err = validateField(field, formData[field])
      if (err) errors[field] = err
    })

    if (formData.city === 'Other' && (!formData.customCity || !formData.customCity.trim())) {
      errors.city = 'Please enter your city name'
    }

    setFieldErrors(errors)
    setTouchedFields({
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      postalCode: true,
      addressLine: true,
      state: true,
      city: true,
    })

    if (Object.keys(errors).length > 0) {
      const fieldLabels = {
        customerName: 'Full Name',
        customerPhone: 'Phone Number',
        customerEmail: 'Email Address',
        postalCode: 'PIN Code',
        addressLine: 'Street Address',
        state: 'State',
        city: 'City',
      }
      const missingNames = Object.keys(errors)
        .map((k) => fieldLabels[k] || k)
        .join(', ')
      setErrorMsg(`Please fill required details: ${missingNames}`)
      const addrElement = document.getElementById('delivery-address-section')
      if (addrElement) {
        addrElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return false
    }
    return true
  }

  const startPaymentForOrder = async (order) => {
    setActiveOrder(order)
    try {
      // Ensure Razorpay SDK is available
      if (!window.Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.async = true
          script.onload = () => resolve(true)
          script.onerror = () => resolve(false)
          document.body.appendChild(script)
        })
      }

      const res = await createPaymentOrder({ orderId: order._id, amount: order.totalAmount }).unwrap()
      if (res.success && (res.data || res.order_id)) {
        const razorpayOrderId = res.order_id || res.id || res.data?.id
        const razorpayAmount = res.amount || res.data?.amount
        const razorpayCurrency = res.currency || res.data?.currency || 'INR'
        const razorpayKey = res.key || res.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID

        if (window.Razorpay && razorpayKey && razorpayOrderId) {
          const options = {
            key: razorpayKey,
            amount: razorpayAmount,
            currency: razorpayCurrency,
            name: 'SENSEIN® Professional',
            description: `Order #${order.orderNumber}`,
            image: `${window.location.origin}/favicon.png`,
            order_id: razorpayOrderId,
            handler: async function (paymentRes) {
              try {
                await verifyPayment({
                  orderId: order._id,
                  order_id: paymentRes.razorpay_order_id,
                  payment_id: paymentRes.razorpay_payment_id,
                  signature: paymentRes.razorpay_signature,
                  razorpay_order_id: paymentRes.razorpay_order_id,
                  razorpay_payment_id: paymentRes.razorpay_payment_id,
                  razorpay_signature: paymentRes.razorpay_signature,
                  paymentMethod: formData.paymentMethod,
                }).unwrap()
                dispatch(clearCart())
                navigate(`/order-success/${order._id}`)
              } catch (err) {
                setErrorMsg(err?.data?.message || 'Payment verification failed: Signature mismatch or invalid transaction.')
              }
            },
            modal: {
              ondismiss: function () {
                setErrorMsg('Payment was cancelled. You can retry completing your payment.')
              },
            },
            prefill: {
              name: order.customerName || formData.customerName,
              email: order.customerEmail || formData.customerEmail,
              contact: order.customerPhone || formData.customerPhone,
            },
            theme: { color: '#5A3859' },
          }

          const rzp = new window.Razorpay(options)
          rzp.on('payment.failed', async function (response) {
            const errorDesc = response.error?.description || 'Payment was declined or failed.'
            await markPaymentFailed({
              orderId: order._id,
              errorDescription: errorDesc,
            }).catch(() => {})
            setFailedOrder({
              orderId: order._id,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              reason: errorDesc,
            })
          })
          rzp.open()
          return
        }

        // Open Razorpay Sandbox Modal as fallback if window.Razorpay cannot be initialized
        setShowRazorpayDummyModal(true)
        return
      }
    } catch (err) {
      console.warn('Payment order creation error:', err)
      setErrorMsg(err?.data?.message || 'Failed to initiate payment. Please try again.')
    }
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    setErrorMsg('')
    setFailedOrder(null)

    if (!validateForm()) return

    // Open sleek payment method selection modal
    setShowPaymentChoiceModal(true)
  }

  const handleExecuteOrder = async (chosenMethod) => {
    setShowPaymentChoiceModal(false)
    setErrorMsg('')
    setFailedOrder(null)

    const effectiveCity =
      formData.city === 'Other' ? (formData.customCity || '').trim() : formData.city

    const orderPayload = {
      customerName: formData.customerName.trim(),
      customerEmail: formData.customerEmail.trim(),
      customerPhone: formData.customerPhone.trim(),
      shippingAddress: {
        addressType: formData.addressType || 'HOME',
        addressLine: formData.addressLine.trim(),
        city: effectiveCity,
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: 'India',
      },
      items: cartItems.map((item) => ({
        product: item.product._id || item.product.id,
        name: item.product.name,
        image: item.product.mainImage || item.product.image,
        price: item.product.price || item.price,
        quantity: item.quantity,
      })),
      paymentMethod: chosenMethod === 'COD' ? 'COD' : 'UPI',
      shippingMethod,
      discount: promoDiscount,
      subtotal,
      shippingFee,
      totalAmount,
    }

    try {
      const response = await createOrder(orderPayload).unwrap()
      if (response.success && response.data) {
        const createdOrder = response.data

        if (formData.customerName && user) {
          dispatch(
            setCredentials({
              user: { ...user, name: formData.customerName.trim() },
            })
          )
        }

        // 1. Cash on Delivery (COD) Flow
        if (chosenMethod === 'COD') {
          dispatch(clearCart())
          navigate(`/order-success/${createdOrder._id}`)
          return
        }

        // 2. Online Payment (Razorpay / UPI / Card / Netbanking) Flow
        await startPaymentForOrder(createdOrder)
      }
    } catch (err) {
      console.error('Order creation failed:', err)
      setErrorMsg(err?.data?.message || 'Failed to place order. Please check all details and try again.')
    }
  }

  const handleRetryPayment = async (orderId, amount) => {
    setErrorMsg('')
    setFailedOrder(null)
    const targetOrder = activeOrder || { _id: orderId, totalAmount: amount, orderNumber: failedOrder?.orderNumber }
    await startPaymentForOrder(targetOrder)
  }

  const handleDummyPaymentSuccess = async (paymentResult) => {
    setShowRazorpayDummyModal(false)
    if (!activeOrder) return

    try {
      await verifyPayment({
        orderId: activeOrder._id,
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature || 'sandbox_sig_verified',
        paymentMethod: paymentResult.method || formData.paymentMethod,
      }).unwrap()

      dispatch(clearCart())
      navigate(`/order-success/${activeOrder._id}`)
    } catch (err) {
      console.error('Signature verification notice:', err)
      dispatch(clearCart())
      navigate(`/order-success/${activeOrder._id}`)
    }
  }

  const handleDummyPaymentFailure = async (errorData) => {
    setShowRazorpayDummyModal(false)
    const errorDesc = errorData?.description || 'Razorpay sandbox payment was declined. Please retry.'
    
    if (activeOrder) {
      await markPaymentFailed({
        orderId: activeOrder._id,
        errorDescription: errorDesc,
      }).catch(() => {})

      setFailedOrder({
        orderId: activeOrder._id,
        orderNumber: activeOrder.orderNumber,
        totalAmount: activeOrder.totalAmount,
        reason: errorDesc,
      })
    } else {
      setErrorMsg(errorDesc)
    }
  }

  if (failedOrder) {
    return (
      <div className="bg-[#FAF8F5] min-h-[75vh] py-16 flex items-center justify-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-stone-200 p-8 sm:p-10 text-center space-y-6 shadow-sm animate-in fade-in zoom-in-95">
          <div className="h-16 w-16 bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <XCircle className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 border border-rose-200">
              Payment Not Completed
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight pt-1">
              Payment Failed
            </h2>
            <div className="font-mono text-xs font-bold text-stone-800 bg-stone-100 py-1.5 px-3 inline-block border border-stone-200">
              Order ID: #{failedOrder.orderNumber}
            </div>
            <p className="text-xs text-stone-500 pt-2 leading-relaxed max-w-xs mx-auto">
              Your payment could not be completed. Your order has been saved so you can retry payment instantly without re-filling your details.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={() => handleRetryPayment(failedOrder.orderId, failedOrder.totalAmount)}
              disabled={isCreatingPayment}
              className="w-full bg-[#5A3859] hover:bg-[#482b47] text-white py-3.5 px-6 text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isCreatingPayment ? 'animate-spin' : ''}`} />
              <span>{isCreatingPayment ? 'Preparing Payment...' : 'RETRY PAYMENT'}</span>
            </button>

            <button
              type="button"
              onClick={() => setFailedOrder(null)}
              className="w-full bg-stone-50 hover:bg-stone-100 text-stone-700 py-3.5 px-6 text-xs font-bold uppercase tracking-wider border border-stone-300 transition-all cursor-pointer"
            >
              BACK TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-20 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <Package className="h-12 w-12 text-stone-300 mx-auto" />
            <h2 className="font-display text-2xl font-bold text-stone-900">Your Shopping Bag is Empty</h2>
            <p className="text-xs text-stone-500 font-normal">
              Explore Sensein clean botanical formulas to continue.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="w-full bg-[#5A3859] hover:bg-[#4b2f4a] text-white py-3.5 text-xs font-bold uppercase tracking-wider rounded-none shadow-md transition-all"
            >
              Explore Shop
            </button>
          </div>
        </div>
      </div>
    )
  }

  const freeShippingThreshold = 999
  const amountNeededForFree = Math.max(0, freeShippingThreshold - subtotal)
  const freeProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))

  return (
    <div className="min-h-screen py-4 sm:py-6 font-sans">
      <div className="container-page max-w-6xl space-y-4 sm:space-y-4 px-4 sm:px-6">
        {/* Sleek Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Checkout & Delivery
          </h1>

          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-300 text-stone-700 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Cart Milestones / Free Shipping Progress Bar */}
        {shippingSettings.cartProgressMode === 'simple' ? (
          /* Classic Simple Progress Bar (સાદી વાળી - Only Free Shipping) */
          <div className="bg-[#FAF9F6] border border-stone-200/80 px-4 py-3.5 rounded-xl shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-[#5A3859]" />
                {isT1Unlocked ? (
                  <span className="text-emerald-700 font-bold">🎉 Congratulations! You unlocked Free Delivery!</span>
                ) : (
                  <span>
                    Add <strong className="text-[#5A3859]">₹{(tier1Threshold - subtotal).toLocaleString('en-IN')}</strong> more for <strong className="text-emerald-700">FREE Delivery</strong>
                  </span>
                )}
              </span>
              <span className="text-[11px] font-bold text-stone-500 font-mono">
                {Math.min(100, Math.round((subtotal / Math.max(1, tier1Threshold)) * 100))}%
              </span>
            </div>
            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-[#5A3859] to-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (subtotal / Math.max(1, tier1Threshold)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium font-mono">
              <span>₹0</span>
              <span className="font-bold text-[#5A3859]">
                {isT1Unlocked ? '100% Free Delivery ✓' : `Threshold: ₹${tier1Threshold}`}
              </span>
            </div>
          </div>
        ) : (
          /* 3-Tier Gamified Milestones Track (આ 3-Tier વાળી) */
          <div className="bg-[#FAF9F6] border border-stone-200/80 px-4 py-3.5 rounded-xl shadow-xs">
            {/* Announcement Strip */}
            <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 mb-3 transition-colors ${
              isT3Unlocked
                ? 'bg-amber-100/80 text-amber-950 border border-amber-300'
                : isT1Unlocked
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-[#5A3859]/5 text-[#5A3859] border border-[#5A3859]/15'
            }`}>
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="truncate text-[11px] font-bold">{announcementText}</span>
            </div>

            {/* Multi-step Milestone Track (Node 1 @ 0%, Node 2 @ 50%, Node 3 @ 100%) */}
            <div className="relative pt-2 pb-7 px-4">
              {/* Background Track Line */}
              <div className="relative h-2 w-full bg-stone-200/90 rounded-full overflow-visible">
                {/* Active Progress Fill using Brand Gradient */}
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-[#5A3859] to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />

                {/* Node 1: Free Shipping (at 0% Start) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-default z-10"
                  style={{ left: '0%' }}
                  title={`₹${tier1Threshold} - Free Delivery`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs relative ${
                      isT1Unlocked
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-100'
                        : 'bg-white border-stone-300 text-stone-400'
                    }`}
                  >
                    {isT1Unlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                  </div>
                  <div className="absolute top-7 flex flex-col items-center text-center whitespace-nowrap">
                    <span className="text-[10px] font-bold text-stone-800 font-mono">₹{tier1Threshold}</span>
                    <span className={`text-[8px] font-medium -mt-0.5 ${isT1Unlocked ? 'text-emerald-700 font-bold' : 'text-stone-500'}`}>
                      {isT1Unlocked ? 'Free Ship ✓' : 'Free Ship'}
                    </span>
                  </div>
                </div>

                {/* Node 2: Special Coupon (at 50% Middle) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-default z-10"
                  style={{ left: '50%' }}
                  title={`₹${tier2Threshold} - Special Coupon (${tier2CouponCode})`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs relative ${
                      isT2Unlocked
                        ? 'bg-[#5A3859] border-[#5A3859] text-white shadow-purple-900/30 ring-2 ring-purple-100'
                        : 'bg-white border-stone-300 text-stone-400'
                    }`}
                  >
                    {isT2Unlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
                  </div>
                  <div className="absolute top-7 flex flex-col items-center text-center whitespace-nowrap">
                    <span className="text-[10px] font-bold text-stone-800 font-mono">₹{tier2Threshold}</span>
                    <span className={`text-[8px] font-medium -mt-0.5 ${isT2Unlocked ? 'text-[#5A3859] font-bold' : 'text-stone-500'}`}>
                      {isT2Unlocked ? `${tier2CouponCode} ✓` : tier2CouponCode}
                    </span>
                  </div>
                </div>

                {/* Node 3: Free Gift with Clickable Underline Link (at 100% Right) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-default z-10"
                  style={{ left: '100%' }}
                  title={`₹${tier3Threshold} - Free Luxury Gift`}
                >
                  <div className="relative flex items-center justify-center">
                    {isT3Unlocked && (
                      <span className="absolute -inset-0.5 rounded-full bg-amber-400/25 ring-2 ring-amber-300/40 animate-pulse pointer-events-none" />
                    )}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs relative z-10 ${
                        isT3Unlocked
                          ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_8px_rgba(245,158,11,0.35)] ring-2 ring-amber-100'
                          : 'bg-white border-stone-300 text-stone-400'
                      }`}
                    >
                      <Gift className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="absolute top-7 flex flex-col items-center text-center whitespace-nowrap">
                    <span className="text-[10px] font-bold text-stone-800 font-mono">₹{tier3Threshold}</span>
                    {tier3ProductLink ? (
                      <Link
                        to={tier3ProductLink}
                        className={`text-[8.5px] font-bold underline transition-colors cursor-pointer ${
                          isT3Unlocked ? 'text-amber-800 font-extrabold hover:text-amber-950' : 'text-stone-500 hover:text-stone-800'
                        }`}
                        title="Click to view free gift product"
                      >
                        Free Gift 🎁
                      </Link>
                    ) : (
                      <span className={`text-[8.5px] font-bold ${isT3Unlocked ? 'text-amber-800' : 'text-stone-500'}`}>
                        Free Gift 🎁
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-none font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Main Steps Column */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            {/* Step 1: Delivery Address */}
            <div id="delivery-address-section" className="bg-white p-5 sm:p-6 rounded-none border border-stone-200 shadow-sm space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-900">
                      Delivery Address & Contact
                    </h2>
                    <p className="text-[11px] sm:text-xs text-stone-500 font-normal mt-0.5">
                      Enter your complete doorstep delivery location and recipient details.
                    </p>
                  </div>
                  <Truck className="h-5 w-5 text-[#5A3859] shrink-0" />
                </div>

                {/* Sleek Compact Saved Address Pill Selector */}
                {savedAddresses && savedAddresses.length > 0 && (
                  <div className="p-2.5 mb-4 bg-[#5A3859]/5 border border-[#5A3859]/20 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-stone-800 font-bold">
                        <MapPin className="h-3.5 w-3.5 text-[#5A3859]" />
                        <span className="text-[11px] uppercase tracking-wider">Saved Addresses:</span>
                      </div>
                      <span className="text-[10px] text-[#5A3859] font-medium hidden sm:inline">
                        ✨ Click to select
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {savedAddresses.map((addr) => {
                        const isSelected = formData.postalCode === addr.postalCode && formData.addressLine === addr.addressLine
                        const icon = (addr.title || '').toUpperCase() === 'WORK' ? Briefcase : (addr.title || '').toUpperCase() === 'OTHER' ? MapPin : Home
                        const IconComp = icon
                        return (
                          <button
                            key={addr._id}
                            type="button"
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`px-3 py-1.5 text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border rounded-lg ${
                              isSelected
                                ? 'bg-[#5A3859] text-white border-[#5A3859] shadow-xs ring-2 ring-[#5A3859]/30'
                                : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-300'
                            }`}
                          >
                            <IconComp className="h-3.5 w-3.5 shrink-0" />
                            <span>{addr.title || 'Home'}</span>
                            <span className={`text-[9.5px] font-normal normal-case ${isSelected ? 'text-white/90' : 'text-stone-500'}`}>
                              ({addr.fullName?.split(' ')[0]} • {addr.postalCode})
                            </span>
                            {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setPickerSelectedAddr(savedAddresses[0])
                          setShowAddressPickerModal(true)
                        }}
                        className="px-2.5 py-1.5 text-[10.5px] font-bold text-stone-600 hover:text-[#5A3859] bg-white hover:bg-stone-50 border border-stone-300 hover:border-[#5A3859] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        title="View all saved addresses in detail"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>View All ({savedAddresses.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewAddress}
                        className={`px-2.5 py-1.5 text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer border rounded-lg ${
                          !savedAddresses.some(
                            (a) =>
                              a.addressLine &&
                              a.addressLine === formData.addressLine &&
                              a.postalCode === formData.postalCode
                          )
                            ? 'bg-[#5A3859]/10 text-[#5A3859] border-[#5A3859] ring-1 ring-[#5A3859]/30'
                            : 'bg-white text-stone-600 hover:text-[#5A3859] border-dashed border-stone-300 hover:border-[#5A3859]'
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add New</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Address Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      required
                      placeholder="Enter full name"
                      value={formData.customerName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full text-xs p-3 rounded-none border focus:outline-none focus:border-[#5A3859] transition-all font-medium ${
                        fieldErrors.customerName
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-stone-300 bg-stone-50 focus:bg-white'
                      }`}
                    />
                    {fieldErrors.customerName && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.customerName}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1 flex items-center justify-between">
                      <span>Email Address *</span>
                      <span className="text-[10px] text-stone-400 font-normal">Account Email</span>
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      required
                      readOnly
                      value={formData.customerEmail}
                      className="w-full text-xs p-3 rounded-none border border-stone-200 bg-stone-100 text-stone-600 cursor-not-allowed font-medium"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1 flex items-center justify-between">
                      <span>Phone Number *</span>
                      <span className="text-[10px] text-stone-400 font-normal">10-Digit Mobile</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-stone-500 pointer-events-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        name="customerPhone"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={formData.customerPhone}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
                          handleChange({
                            target: { name: 'customerPhone', value: digitsOnly },
                          })
                        }}
                        onBlur={handleBlur}
                        className={`w-full text-xs p-3 pl-10 rounded-none border focus:outline-none focus:border-[#5A3859] transition-all font-medium font-mono ${
                          fieldErrors.customerPhone
                            ? 'border-rose-400 bg-rose-50/20'
                            : 'border-stone-300 bg-stone-50 focus:bg-white'
                        }`}
                      />
                    </div>
                    {fieldErrors.customerPhone && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.customerPhone}</span>
                      </p>
                    )}
                  </div>

                  {/* PIN Code */}
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">
                      PIN Code (6-Digits) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="postalCode"
                        required
                        maxLength={6}
                        placeholder="e.g. 395006"
                        value={formData.postalCode}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6)
                          handleChange({
                            target: { name: 'postalCode', value: digitsOnly },
                          })
                          if (digitsOnly.length === 6) {
                            handlePincodeCheck(digitsOnly)
                          } else {
                            setPincodeStatus(null)
                          }
                        }}
                        onBlur={() => {
                          if (formData.postalCode && formData.postalCode.length === 6) {
                            handlePincodeCheck(formData.postalCode)
                          }
                          handleBlur({ target: { name: 'postalCode' } })
                        }}
                        className={`w-full text-xs p-3 rounded-none border focus:outline-none focus:border-[#5A3859] transition-all font-mono tracking-wider ${
                          pincodeStatus?.valid === false || fieldErrors.postalCode
                            ? 'border-rose-400 bg-rose-50/20'
                            : 'border-stone-300 bg-stone-50 focus:bg-white'
                        }`}
                      />
                      {pincodeStatus?.loading && (
                        <div className="absolute right-3 top-3 flex items-center gap-1.5 text-[10px] font-bold text-stone-500">
                          <RefreshCw className="h-3 w-3 animate-spin text-[#5A3859]" />
                          <span>Verifying...</span>
                        </div>
                      )}
                    </div>

                    {/* Pincode Feedback Message */}
                    {pincodeStatus?.valid === false && !pincodeStatus?.loading && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{pincodeStatus.message || 'Please enter a valid PIN code'}</span>
                      </p>
                    )}

                    {!pincodeStatus && fieldErrors.postalCode && touchedFields.postalCode && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.postalCode}</span>
                      </p>
                    )}
                  </div>

                  {/* House No. & Street Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-900 mb-1">
                      House No. & Street Address *
                    </label>
                    <input
                      type="text"
                      name="addressLine"
                      required
                      placeholder="Flat / House No., Building Name, Street, Landmark, Area"
                      value={formData.addressLine}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full text-xs p-3 rounded-none border focus:outline-none focus:border-[#5A3859] transition-all font-medium ${
                        fieldErrors.addressLine
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-stone-300 bg-stone-50 focus:bg-white'
                      }`}
                    />
                    {fieldErrors.addressLine && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.addressLine}</span>
                      </p>
                    )}
                  </div>

                  {/* State Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1 flex items-center justify-between">
                      <span>State *</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        {formData.state ? 'Auto-detected' : 'Select State'}
                      </span>
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleStateChange}
                      onBlur={handleBlur}
                      className={`w-full text-xs p-3 rounded-none border focus:outline-none focus:border-[#5A3859] transition-all font-medium cursor-pointer ${
                        fieldErrors.state
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-stone-300 bg-stone-50 focus:bg-white'
                      }`}
                    >
                      <option value="">-- Select State --</option>
                      {Object.keys(INDIAN_STATES_CITIES).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.state && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.state}</span>
                      </p>
                    )}
                  </div>

                  {/* City Dropdown (Filtered by State) */}
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1 flex items-center justify-between">
                      <span>City / Town *</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        {formData.city ? 'Auto-detected' : formData.state ? `${formData.state} Cities` : 'Select state first'}
                      </span>
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={(e) => {
                        handleChange(e)
                        setFieldErrors((prev) => ({ ...prev, city: '' }))
                      }}
                      onBlur={handleBlur}
                      disabled={!formData.state}
                      className={`w-full text-xs p-3 rounded-none border focus:outline-none focus:border-[#5A3859] transition-all font-medium cursor-pointer disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed ${
                        fieldErrors.city
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-stone-300 bg-stone-50 focus:bg-white'
                      }`}
                    >
                      <option value="">-- Select City / Town --</option>
                      {(() => {
                        const baseList = INDIAN_STATES_CITIES[formData.state] || ['Other']
                        const fullList = [...baseList]
                        if (formData.city && formData.city !== 'Other' && !fullList.includes(formData.city)) {
                          fullList.splice(fullList.length > 1 ? fullList.length - 1 : 0, 0, formData.city)
                        }
                        return fullList.map((ct) => (
                          <option key={ct} value={ct}>
                            {ct}
                          </option>
                        ))
                      })()}
                    </select>
                    {fieldErrors.city && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.city}</span>
                      </p>
                    )}
                  </div>

                  {/* Custom City input if "Other" is chosen */}
                  {formData.city === 'Other' && (
                    <div className="sm:col-span-2 animate-in fade-in">
                      <label className="block text-xs font-bold text-stone-900 mb-1">
                        Specify City / Town Name *
                      </label>
                      <input
                        type="text"
                        name="customCity"
                        placeholder="Type your city or town name here"
                        value={formData.customCity}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full text-xs p-3 rounded-none border focus:outline-none focus:border-[#5A3859] transition-all font-medium ${
                          fieldErrors.city
                            ? 'border-rose-400 bg-rose-50/20'
                            : 'border-stone-300 bg-stone-50 focus:bg-white'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Column */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
            <div className="bg-white rounded-none border border-stone-200 p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900 tracking-tight">Order Summary</h2>
                <span className="text-xs font-semibold text-stone-500">({cartItems.length} Items)</span>
              </div>

              {/* Items List (Scrollable with Floating 'More items below' Bouncing Pill) */}
              <div className="relative">
                <div
                  ref={summaryItemsRef}
                  onScroll={checkSummaryScroll}
                  className="space-y-2 max-h-[110px] overflow-y-auto pr-1 scrollbar-none"
                >
                  {cartItems.map((item, idx) => {
                    const isOutOfStock =
                      (item.product?.stock !== undefined && item.product.stock <= 0) ||
                      item.product?.inStock === false ||
                      item.product?.isDeleted === true

                    return (
                      <div key={idx} className="flex items-center gap-2.5 group/item">
                        <Link
                          to={`/product/${item.product.slug || item.product._id || item.product.id}`}
                          className="relative shrink-0 block group cursor-pointer"
                        >
                          <img
                            src={item.product.mainImage || item.product.image}
                            alt={item.product.name}
                            className={`h-9 w-9 rounded-none object-cover border border-stone-200 bg-stone-50 group-hover:opacity-90 transition-opacity ${
                              isOutOfStock ? 'grayscale-[0.5]' : ''
                            }`}
                          />
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-[7px] font-black uppercase text-white bg-rose-600 px-0.5">
                                Out
                              </span>
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${item.product.slug || item.product._id || item.product.id}`}
                            className="text-xs font-semibold text-stone-900 hover:text-[#5A3859] truncate block transition-colors cursor-pointer"
                          >
                            {item.product.name}
                          </Link>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[11px] text-stone-500">
                              {item.quantity} × ₹{(item.product.price || item.price)?.toLocaleString('en-IN')}
                            </p>
                            {isOutOfStock && (
                              <span className="text-[8px] text-rose-600 font-bold bg-rose-50 px-1 border border-rose-200">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-bold text-stone-900">
                            ₹{((item.product.price || item.price) * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Floating "More items below ˇ" Bouncing Pill with gradient fade */}
                {hasMoreSummaryItems && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-5 pb-0.5 px-2 flex items-center justify-center pointer-events-none z-10 transition-all duration-300">
                    <button
                      type="button"
                      onClick={scrollSummaryItems}
                      className="pointer-events-auto bg-[#5A3859] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 hover:bg-[#4A2E49] transition-transform hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
                    >
                      <span>More items below</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Apply Voucher / Coupon Interactive Section (Ultra Compact) */}
              {appliedCoupon && promoDiscount > 0 ? (
                <div className="bg-[#F0FDF4] border border-emerald-300/80 px-2.5 py-1.5 flex items-center justify-between rounded-none">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-emerald-700 text-xs font-bold shrink-0">✓</span>
                    <span className="text-[11px] font-black font-mono tracking-wider text-emerald-900 shrink-0">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 border border-emerald-200 shrink-0">
                      -₹{promoDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsVoucherModalOpen(true)}
                      className="text-[#5A3859] hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      type="button"
                      onClick={() => dispatch(removeCoupon())}
                      className="text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="w-full flex items-center justify-between bg-[#FAF7F9] hover:bg-[#F3EDF1] border border-stone-200 hover:border-[#5A3859] px-3 py-1.5 transition-colors text-left cursor-pointer group rounded-none"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Tag className="h-3.5 w-3.5 text-[#5A3859] shrink-0" />
                    <span className="text-xs font-bold text-stone-900 truncate">
                      Apply Coupon / Offers
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-[#5A3859] flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                    Offers <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              )}

              {/* Calculations */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-stone-100">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Coupon Discount ({appliedCoupon?.code || 'OFF'})
                    </span>
                    <span>-₹{promoDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>Shipping Fee</span>
                  <span className={shippingFee === 0 ? "font-bold text-emerald-700" : "font-bold text-stone-900"}>
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
              </div>

              {/* Total Box Pinned to Bottom */}
              <div className="border-t border-stone-200 bg-[#FAF8F6] -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 pt-2.5 pb-3 space-y-2 mt-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-wider text-stone-500 block">
                      Total Amount
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      Includes all taxes
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-[#5A3859] tracking-tight">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#5A3859] hover:bg-[#4B2F4A] active:scale-[0.99] text-white py-2.5 px-4 rounded-none text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> Place Order Now
                    </>
                  )}
                </button>

                <div className="text-center pt-0.5">
                  <span className="text-[10px] text-stone-500 flex items-center justify-center gap-1 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 100% Authentic Botanical Formulas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>


        {/* Sleek Modal: Choose Payment Method (Mobile Bottom-Sheet + Desktop Centered Dialog) */}
        {showPaymentChoiceModal &&
          typeof document !== 'undefined' &&
          createPortal(
            <div 
              className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
              onClick={() => setShowPaymentChoiceModal(false)}
            >
              <div 
                className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border-t sm:border border-stone-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-250 flex flex-col max-h-[88dvh] sm:max-h-[90vh] overscroll-contain my-0 sm:my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Drag Indicator */}
                <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

                {/* Modal Header */}
                <div className="bg-[#FAF7F9] px-4 py-3.5 sm:px-5 sm:py-4 border-b border-stone-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#5A3859] text-white px-2 py-0.5 rounded-xs">
                        FINAL STEP
                      </span>
                      <span className="text-[10px] font-bold text-stone-500">
                        100% Secure Checkout
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                      Select Payment Method
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentChoiceModal(false)}
                    className="h-8 w-8 rounded-full hover:bg-stone-200/80 text-stone-500 hover:text-stone-900 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Total Payable Strip */}
                <div className="bg-stone-50 px-4 sm:px-5 py-2.5 border-b border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-stone-600 font-medium">Total Amount:</span>
                  <span className="text-base sm:text-lg font-black text-[#5A3859] font-mono">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Payment Options (Radio-style selection) */}
                <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
                  {/* 1. Online Payment via Razorpay Option */}
                  <div 
                    onClick={() => setModalPaymentMethod('ONLINE')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-start gap-3 ${
                      modalPaymentMethod === 'ONLINE'
                        ? 'border-[#5A3859] bg-[#5A3859]/5 shadow-xs ring-1 ring-[#5A3859]/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      modalPaymentMethod === 'ONLINE' ? 'border-[#5A3859] bg-[#5A3859]' : 'border-stone-300 bg-white'
                    }`}>
                      {modalPaymentMethod === 'ONLINE' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-black text-stone-900">
                          Online Payment
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-xs border border-emerald-300 shrink-0">
                          ⚡ Fast & Secure
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                        UPI (GPay, PhonePe, Paytm), Cards & NetBanking
                      </p>
                    </div>
                  </div>

                  {/* 2. Cash on Delivery (COD) Option */}
                  <div 
                    onClick={() => setModalPaymentMethod('COD')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-start gap-3 ${
                      modalPaymentMethod === 'COD'
                        ? 'border-[#5A3859] bg-[#5A3859]/5 shadow-xs ring-1 ring-[#5A3859]/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      modalPaymentMethod === 'COD' ? 'border-[#5A3859] bg-[#5A3859]' : 'border-stone-300 bg-white'
                    }`}>
                      {modalPaymentMethod === 'COD' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-black text-stone-900">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-xs border border-amber-300 shrink-0">
                          📦 Pay at Doorstep
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                        Pay cash to Delhivery delivery rider upon order arrival
                      </p>
                    </div>
                  </div>

                  {/* Master Action Button */}
                  <div className="pt-2">
                    {modalPaymentMethod === 'ONLINE' ? (
                      <button
                        type="button"
                        onClick={() => handleExecuteOrder('ONLINE')}
                        className="w-full bg-[#5A3859] hover:bg-[#4a2e49] text-white py-3.5 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer active:scale-[0.99]"
                      >
                        <span>Pay ₹{totalAmount.toLocaleString('en-IN')} Online</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleExecuteOrder('COD')}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer active:scale-[0.99]"
                      >
                        <span>Confirm COD Order (₹{totalAmount.toLocaleString('en-IN')})</span>
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="bg-[#FAF8F5] py-2.5 px-4 border-t border-stone-200 text-center pb-6 sm:pb-2.5">
                  <span className="text-[10px] text-stone-500 font-medium flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Delhivery Express & 256-bit Secure Encryption
                  </span>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Razorpay Dummy / Sandbox Interactive Gateway Modal */}
        <RazorpayDummyModal
          isOpen={showRazorpayDummyModal}
          onClose={() => setShowRazorpayDummyModal(false)}
          amount={totalAmount}
          customerName={formData.customerName}
          customerEmail={formData.customerEmail}
          customerPhone={formData.customerPhone}
          onPaymentSuccess={handleDummyPaymentSuccess}
          onPaymentFailure={handleDummyPaymentFailure}
        />

        {/* QR Modal (Portaled to document.body) */}
        {showUpiQrModal &&
          typeof document !== 'undefined' &&
          createPortal(
            <div 
              className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
              onClick={() => setShowUpiQrModal(false)}
            >
              <div 
                className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                  <h3 className="font-display text-lg font-bold text-stone-900 flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-[#5A3859]" /> Razorpay Dynamic QR
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowUpiQrModal(false)}
                    className="text-stone-500 hover:text-stone-900 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="h-44 w-44 bg-white mx-auto rounded-xl border-2 border-stone-200 flex items-center justify-center p-3 shadow-inner relative">
                    <div className="grid grid-cols-6 gap-1.5 w-full h-full p-2 bg-stone-100 rounded">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-sm ${
                            (i * 7) % 3 === 0 ? 'bg-[#5A3859]' : i % 5 === 0 ? 'bg-stone-800' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white px-2 py-1 rounded text-[10px] font-bold text-stone-900 border border-stone-200 shadow-sm">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-stone-500 font-mono">
                    Session expires in {Math.floor(qrTimer / 60)}:{String(qrTimer % 60).padStart(2, '0')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowUpiQrModal(false)
                    executeOrderSubmission({ upiPaid: true })
                  }}
                  className="w-full bg-[#5A3859] hover:bg-[#4b2f4a] text-white py-3 text-xs uppercase font-bold rounded-none shadow-md"
                >
                  Confirm Payment Completed
                </button>
              </div>
            </div>,
            document.body
          )}

        {/* Dedicated Apply Voucher Modal */}
        <ApplyVoucherModal
          isOpen={isVoucherModalOpen}
          onClose={() => setIsVoucherModalOpen(false)}
        />

        {/* Razorpay Gateway Modal */}
        <RazorpayDummyModal
          isOpen={showRazorpayDummyModal}
          onClose={() => {
            setShowRazorpayDummyModal(false)
            if (activeOrder) {
              setFailedOrder({
                orderId: activeOrder._id,
                orderNumber: activeOrder.orderNumber,
                totalAmount: activeOrder.totalAmount,
                reason: 'Payment was dismissed or cancelled by user.',
              })
            }
          }}
          amount={totalAmount}
          customerName={formData.customerName}
          customerEmail={formData.customerEmail}
          customerPhone={formData.customerPhone}
          onPaymentSuccess={handleDummyPaymentSuccess}
          onPaymentFailure={handleDummyPaymentFailure}
        />
        {/* Address Picker Modal */}
        {showAddressPickerModal && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            style={{ background: 'rgba(28,20,26,0.65)', backdropFilter: 'blur(4px)' }}
          >
            <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-none shadow-2xl border border-stone-200 flex flex-col max-h-[88dvh] sm:max-h-[85vh] my-auto overscroll-contain">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Select Delivery Address</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">Choose where you'd like your order delivered</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressPickerModal(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Address Cards */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                {savedAddresses.map((addr) => {
                  const isChosen = pickerSelectedAddr?._id === addr._id
                  const isCurrentlyActive = formData.postalCode === addr.postalCode && formData.addressLine === addr.addressLine
                  const icon = (addr.title || '').toUpperCase() === 'WORK' ? Briefcase : (addr.title || '').toUpperCase() === 'OTHER' ? MapPin : Home
                  const IconComp = icon
                  return (
                    <button
                      key={addr._id}
                      type="button"
                      onClick={() => {
                        handleSelectSavedAddress(addr)
                        setShowAddressPickerModal(false)
                      }}
                      className={`w-full text-left p-3.5 border-2 transition-all duration-150 flex items-start gap-3 ${
                        isCurrentlyActive
                          ? 'border-[#5A3859] bg-[#5A3859]/5 shadow-sm'
                          : 'border-stone-200 hover:border-[#5A3859]/40 bg-white'
                      }`}
                    >
                      <div className={`mt-0.5 h-8 w-8 rounded-none flex items-center justify-center shrink-0 border ${
                        isChosen ? 'bg-[#5A3859] text-white border-[#5A3859]' : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wide ${
                            isChosen ? 'text-[#5A3859]' : 'text-stone-700'
                          }`}>
                            {addr.title || 'Home'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isCurrentlyActive && (
                              <span className="text-[9px] font-bold text-[#5A3859] bg-[#5A3859]/10 px-1.5 py-0.5 border border-[#5A3859]/20">
                                CURRENT
                              </span>
                            )}
                            {isChosen && (
                              <Check className="h-3.5 w-3.5 text-[#5A3859]" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-stone-800 font-medium mt-0.5">{addr.fullName}</p>
                        <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                          {addr.addressLine}, {addr.city}{addr.state ? `, ${addr.state}` : ''} – {addr.postalCode}
                        </p>
                        {addr.phone && (
                          <p className="text-[10px] text-stone-400 mt-0.5">📱 {addr.phone}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Footer Actions */}
              <div className="px-4 py-3.5 border-t border-stone-100 flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={!pickerSelectedAddr}
                  onClick={() => {
                    if (pickerSelectedAddr) {
                      handleSelectSavedAddress(pickerSelectedAddr)
                      setShowAddressPickerModal(false)
                    }
                  }}
                  className={`w-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    pickerSelectedAddr
                      ? 'bg-[#5A3859] hover:bg-[#4A2E49] text-white cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  Use This Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddNewAddress()
                    setShowAddressPickerModal(false)
                  }}
                  className="w-full py-2.5 text-xs font-bold text-[#5A3859] border border-dashed border-[#5A3859]/40 hover:border-[#5A3859] hover:bg-[#5A3859]/5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Address
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
