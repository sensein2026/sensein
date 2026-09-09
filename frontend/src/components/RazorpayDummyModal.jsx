import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
} from 'lucide-react'

export default function RazorpayDummyModal({
  isOpen,
  onClose,
  amount = 0,
  customerName = 'Customer',
  customerEmail = '',
  customerPhone = '',
  onPaymentSuccess,
  onPaymentFailure,
}) {
  const [activeTab, setActiveTab] = useState('upi') // 'upi', 'card', 'netbanking'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay')
  const [customUpiId, setCustomUpiId] = useState('success@razorpay')
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('123')
  const [selectedBank, setSelectedBank] = useState('HDFC')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processState, setProcessState] = useState(null) // 'success' | 'failed' | null
  const [qrTimer, setQrTimer] = useState(480) // 8 mins

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false)
      setProcessState(null)
      return
    }
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 480))
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const handleSimulatePayment = (willSucceed = true) => {
    setIsProcessing(true)
    setProcessState(null)

    setTimeout(() => {
      if (willSucceed) {
        setProcessState('success')
        const fakePaymentId = 'pay_' + Math.random().toString(36).substring(2, 14)
        const fakeOrderId = 'order_' + Math.random().toString(36).substring(2, 14)
        const fakeSignature = 'sig_' + Math.random().toString(36).substring(2, 20)

        setTimeout(() => {
          setIsProcessing(false)
          onPaymentSuccess?.({
            razorpay_payment_id: fakePaymentId,
            razorpay_order_id: fakeOrderId,
            razorpay_signature: fakeSignature,
            method: activeTab.toUpperCase(),
            bank: activeTab === 'netbanking' ? selectedBank : undefined,
            upiId: activeTab === 'upi' ? customUpiId : undefined,
            cardLast4: activeTab === 'card' ? cardNumber.replace(/\s+/g, '').slice(-4) : undefined,
          })
        }, 1000)
      } else {
        setProcessState('failed')
        setTimeout(() => {
          setIsProcessing(false)
          onPaymentFailure?.({
            code: 'BAD_REQUEST_ERROR',
            description: 'Test payment was declined by user / simulator.',
          })
        }, 1200)
      }
    }, 1000)
  }

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: '⚡', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'phonepe', name: 'PhonePe', icon: '🟣', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'paytm', name: 'Paytm UPI', icon: '🔷', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { id: 'cred', name: 'CRED UPI', icon: '💎', color: 'bg-stone-100 text-stone-800 border-stone-300' },
    { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ]

  const banks = [
    { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC' },
    { id: 'SBI', name: 'State Bank of India', code: 'SBIN' },
    { id: 'ICICI', name: 'ICICI Bank', code: 'ICIC' },
    { id: 'AXIS', name: 'Axis Bank', code: 'UTIB' },
    { id: 'KOTAK', name: 'Kotak Mahindra', code: 'KKBK' },
    { id: 'PNB', name: 'Punjab National Bank', code: 'PUNB' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden relative my-auto">
        {/* Processing / Result Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            {processState === 'success' ? (
              <div className="space-y-3">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Payment Authorized!</h3>
                <p className="text-xs text-stone-500 font-medium">
                  ₹{amount?.toLocaleString('en-IN')} paid successfully via Razorpay Dummy Gateway.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> 100% Encrypted Sandbox
                </div>
              </div>
            ) : processState === 'failed' ? (
              <div className="space-y-3">
                <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <XCircle className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Payment Declined (Simulated)</h3>
                <p className="text-xs text-stone-500 font-medium">
                  The test transaction was rejected as requested for test validation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative mx-auto h-16 w-16">
                  <div className="h-16 w-16 border-4 border-[#5A3859]/20 border-t-[#5A3859] rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#5A3859]">
                    RZP
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Communicating with Razorpay Sandbox</h3>
                  <p className="text-xs text-stone-500 mt-1">Verifying 3D Secure & test credentials...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Header Bar */}
        <div className="bg-[#1e2749] text-white px-5 py-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white/10 p-2 rounded-lg border border-white/20">
              <span className="font-mono font-black text-xs tracking-wider text-sky-400">RAZORPAY</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white">SENSEIN® Professional</h2>
                <span className="bg-amber-400 text-stone-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                  TEST GATEWAY
                </span>
              </div>
              <p className="text-[11px] text-white/70">order_test_{Math.floor(100000 + Math.random() * 900000)}</p>
            </div>
          </div>

          <div className="text-right relative z-10">
            <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Payable Amount</div>
            <div className="text-xl font-black text-emerald-400">₹{amount?.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Test Notice Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-[11px] font-medium">
              <strong>Dummy Sandbox Mode:</strong> Real money will <u>NOT</u> be charged.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-800 hover:text-stone-900 text-xs font-bold px-2 py-0.5 rounded hover:bg-amber-100"
          >
            Cancel
          </button>
        </div>

        {/* Main Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[340px]">
          {/* Left Navigation Sidebar */}
          <div className="md:col-span-4 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200 p-3 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400 px-2 py-1">
              Payment Options
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('upi')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                activeTab === 'upi'
                  ? 'bg-white text-[#5A3859] shadow-sm border border-stone-200 font-bold'
                  : 'text-stone-600 hover:bg-stone-100/80'
              }`}
            >
              <Smartphone className={`h-4 w-4 ${activeTab === 'upi' ? 'text-[#5A3859]' : 'text-stone-400'}`} />
              <div className="flex-1">
                <div>UPI & QR</div>
                <div className="text-[10px] text-stone-400 font-normal">GPay, PhonePe, Paytm</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                activeTab === 'card'
                  ? 'bg-white text-[#5A3859] shadow-sm border border-stone-200 font-bold'
                  : 'text-stone-600 hover:bg-stone-100/80'
              }`}
            >
              <CreditCard className={`h-4 w-4 ${activeTab === 'card' ? 'text-[#5A3859]' : 'text-stone-400'}`} />
              <div className="flex-1">
                <div>Cards</div>
                <div className="text-[10px] text-stone-400 font-normal">Credit & Debit Cards</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('netbanking')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                activeTab === 'netbanking'
                  ? 'bg-white text-[#5A3859] shadow-sm border border-stone-200 font-bold'
                  : 'text-stone-600 hover:bg-stone-100/80'
              }`}
            >
              <Building2 className={`h-4 w-4 ${activeTab === 'netbanking' ? 'text-[#5A3859]' : 'text-stone-400'}`} />
              <div className="flex-1">
                <div>Netbanking</div>
                <div className="text-[10px] text-stone-400 font-normal">All Major Indian Banks</div>
              </div>
            </button>

            <div className="pt-4 px-2">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Razorpay Verified
                </div>
                <p className="text-[10px] text-emerald-700 leading-tight">
                  Pre-configured with Razorpay Sandbox API signature simulation.
                </p>
              </div>
            </div>
          </div>

          {/* Right Tab Content Panel */}
          <div className="md:col-span-8 p-5 flex flex-col justify-between space-y-4">
            {activeTab === 'upi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Instant UPI Payment</h3>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Expires in <strong className="text-stone-900">{formatTimer(qrTimer)}</strong>
                  </span>
                </div>

                {/* Simulated QR Code */}
                <div className="bg-gradient-to-br from-stone-50 to-stone-100/80 p-3.5 rounded-xl border border-stone-200 flex items-center gap-4">
                  <div className="h-24 w-24 bg-white rounded-lg border-2 border-stone-300 p-1.5 flex items-center justify-center shrink-0 shadow-sm relative group">
                    <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-stone-50 rounded">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-[2px] ${
                            (i * 3) % 2 === 0 ? 'bg-[#1e2749]' : i % 5 === 0 ? 'bg-[#5A3859]' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white text-[9px] font-black px-1 rounded shadow border border-stone-200">
                        ₹{amount}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-[#5A3859]" /> Scan with Any UPI App
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Open GPay, PhonePe, Paytm, or BHIM on your mobile to scan.
                    </p>
                    <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Auto-Verifying Stream
                    </span>
                  </div>
                </div>

                {/* Popular App Simulators */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-stone-600">Or Select Test UPI App:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {upiApps.slice(0, 3).map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedUpiApp(app.id)}
                        className={`p-2 rounded-lg border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                          selectedUpiApp === app.id
                            ? `${app.color} ring-2 ring-[#5A3859] shadow-sm`
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-base">{app.icon}</span>
                        <span className="text-[11px]">{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* UPI ID Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-600">Enter Virtual Payment Address (VPA)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customUpiId}
                      onChange={(e) => setCustomUpiId(e.target.value)}
                      placeholder="e.g. success@razorpay"
                      className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5A3859] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomUpiId('success@razorpay')}
                      className="px-2.5 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg border border-stone-300"
                    >
                      Fill Test VPA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'card' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Test Card Details</h3>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Test Mode Active
                  </span>
                </div>

                {/* Visual Card Mock */}
                <div className="bg-gradient-to-r from-[#1e2749] to-[#2d3a6e] text-white p-4 rounded-xl shadow-md space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="text-[10px] uppercase tracking-widest text-white/70 font-mono">
                      RAZORPAY TEST CARD
                    </div>
                    <div className="text-xs font-black text-amber-400 italic">VISA / MASTERCARD</div>
                  </div>
                  <div className="font-mono text-sm sm:text-base tracking-widest font-bold pt-1">
                    {cardNumber || '4111 1111 1111 1111'}
                  </div>
                  <div className="flex justify-between items-end pt-1 text-xs">
                    <div>
                      <div className="text-[9px] text-white/60 uppercase">Card Holder</div>
                      <div className="font-semibold">{customerName || 'Test Customer'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/60 uppercase">Expires</div>
                      <div className="font-mono">{cardExpiry || '12/28'}</div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 1111 1111 1111"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#5A3859]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#5A3859]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#5A3859]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'netbanking' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Select Test Bank</h3>
                  <span className="text-[10px] text-stone-500">Retail & Corporate</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {banks.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        selectedBank === bank.id
                          ? 'border-[#5A3859] bg-[#5A3859]/5 font-bold text-[#5A3859] ring-1 ring-[#5A3859]'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-stone-500" />
                        <span>{bank.name}</span>
                      </div>
                      {selectedBank === bank.id && <Check className="h-4 w-4 text-[#5A3859]" />}
                    </button>
                  ))}
                </div>

                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-[11px] text-stone-600 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-stone-500" />
                  <span>Simulates redirect to <strong>{selectedBank}</strong> NetBanking login screen.</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-200 space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulatePayment(true)}
                  className="flex-1 bg-[#1e2749] hover:bg-[#151c36] active:scale-[0.99] text-white py-3 px-4 rounded-xl text-xs font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Pay ₹{amount?.toLocaleString('en-IN')} (Simulate Success)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment(false)}
                  title="Simulate a declined test payment to verify error handling"
                  className="bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-600 px-3 py-3 rounded-xl text-xs font-bold border border-stone-300 hover:border-red-300 transition-all flex items-center gap-1"
                >
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="hidden sm:inline">Fail Test</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-400 px-1 font-medium">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> PCI-DSS Compliant Test Simulation
                </span>
                <span>Razorpay Sandbox</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
