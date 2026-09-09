import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 border border-stone-200 shadow-sm space-y-8">
        
        {/* Header */}
        <div className="border-b border-stone-200 pb-6">
          <div className="text-xs text-stone-500 mb-2">
            <Link to="/" className="hover:text-[#5A3859] transition-colors">Home</Link>
            <span className="mx-2 text-stone-300">/</span>
            <span className="text-stone-900 font-medium">Privacy Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Last Updated: August 2026
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              1. Overview
            </h2>
            <p>
              Sensein is committed to safeguarding your personal data and privacy. This policy outlines how we collect, handle, use, and protect your information when you browse our website, create an account, or purchase our botanical haircare formulations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li><strong>Contact & Identity Data:</strong> Full name, email address, phone number, shipping and billing addresses provided during checkout or account registration.</li>
              <li><strong>Payment Information:</strong> Transaction identifiers and payment confirmation status. Note: We never store your full credit/debit card numbers, UPI PINs, or net banking passwords. All transactions are securely processed through encrypted PCI-DSS certified payment gateways (Razorpay).</li>
              <li><strong>Browsing & Technical Data:</strong> IP address, device type, browser information, pages viewed, and session timestamps used strictly to optimize site performance and security.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li>To fulfill, ship, and deliver your orders accurately.</li>
              <li>To provide order tracking updates, delivery SMS notifications, and customer support.</li>
              <li>To enhance website responsiveness, diagnostic hair quiz recommendations, and store experience.</li>
              <li>To prevent fraudulent transactions and maintain site integrity.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              4. Cookies & Analytics
            </h2>
            <p>
              We use essential cookies and lightweight analytics to maintain your cart contents, remember your login session, and understand how visitors interact with our catalog. You can configure your browser to reject cookies, though some interactive features may not function optimally.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              5. Data Security & Third Parties
            </h2>
            <p>
              We never sell, rent, or trade your personal data with third-party advertisers. Information is shared only with verified service partners strictly required for order fulfillment (such as shipping couriers and payment gateways).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              6. Your Rights & Grievance Officer
            </h2>
            <p>
              You have the right to review, update, or request the deletion of your account and personal information at any time. For any data inquiries or privacy concerns, please contact our Privacy Team at{' '}
              <a href="mailto:info@sensein.in" className="text-[#5A3859] font-bold hover:underline">
                info@sensein.in
              </a>.
            </p>
          </section>

        </div>

      </div>
    </div>
  )
}
