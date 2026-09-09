import { useState } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayCheckoutButton({
  amount, // in paise (>= 100) or rupees if isRupees is true
  isRupees = false,
  currency = 'INR',
  receipt,
  orderId,
  notes,
  prefill = {},
  title = 'Sensein Professional',
  description = 'Order Payment',
  themeColor = '#5A3859',
  onSuccess,
  onFailure,
  onDismiss,
  children,
  className = '',
  disabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handlePayment = async () => {
    setErrorMessage('')
    setIsLoading(true)

    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.')
      }

      // Calculate amount in paise (minimum 100 paise)
      const calculatedAmountInPaise = isRupees
        ? Math.round(Number(amount) * 100)
        : Math.round(Number(amount))

      if (!calculatedAmountInPaise || calculatedAmountInPaise < 100) {
        throw new Error('Amount must be at least 100 paise (₹1.00).')
      }

      // 2. Step 1: Create order on backend
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: calculatedAmountInPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          orderId,
          notes,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create payment order')
      }

      const razorpayOrderId = data.order_id || data.id || data.data?.id
      const razorpayKey = data.key || data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID

      if (!razorpayOrderId) {
        throw new Error('Invalid order ID received from backend')
      }

      // 3. Step 2: Open Razorpay Payment Modal
      const options = {
        key: razorpayKey,
        amount: data.amount || calculatedAmountInPaise,
        currency: data.currency || currency,
        name: title,
        description: description,
        image: `${window.location.origin}/favicon.png`,
        order_id: razorpayOrderId,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || prefill.phone || '',
        },
        theme: {
          color: themeColor,
        },
        handler: async function (paymentRes) {
          try {
            // 4. Step 3: Verify signature on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: paymentRes.razorpay_order_id,
                payment_id: paymentRes.razorpay_payment_id,
                signature: paymentRes.razorpay_signature,
                razorpay_order_id: paymentRes.razorpay_order_id,
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_signature: paymentRes.razorpay_signature,
                orderId,
              }),
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment signature verification failed')
            }

            if (onSuccess) {
              onSuccess({
                ...paymentRes,
                verificationData: verifyData,
              })
            }
          } catch (err) {
            setErrorMessage(err.message)
            if (onFailure) onFailure(err)
          } finally {
            setIsLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false)
            if (onDismiss) onDismiss()
          },
        },
      }

      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', function (resp) {
        setIsLoading(false)
        const desc = resp.error?.description || 'Payment failed or was declined'
        setErrorMessage(desc)
        if (onFailure) onFailure(resp.error || new Error(desc))
      })

      rzp.open()
    } catch (err) {
      setIsLoading(false)
      setErrorMessage(err.message || 'An error occurred during payment processing')
      if (onFailure) onFailure(err)
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <button
        type="button"
        onClick={handlePayment}
        disabled={disabled || isLoading}
        className={
          className ||
          'inline-flex items-center justify-center gap-2 bg-[#5A3859] hover:bg-[#482c47] text-white px-6 py-3 rounded text-sm font-semibold tracking-wide transition-all shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          children || (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Pay with Razorpay</span>
            </>
          )
        )}
      </button>

      {errorMessage && (
        <p className="text-xs text-rose-600 font-medium mt-1">{errorMessage}</p>
      )}
    </div>
  )
}
