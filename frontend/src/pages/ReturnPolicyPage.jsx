import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function ReturnPolicyPage() {
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
            <span className="text-stone-900 font-medium">Return Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Return & Refund Policy
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Last Updated: August 2026
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              1. 7-Day Return Window
            </h2>
            <p>
              We want you to love your Sensein haircare ritual. If you receive a damaged, defective, or incorrect product, you may request a return or replacement within <strong>7 days of delivery</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              2. Conditions for Return & Replacement
            </h2>
            <p>
              Due to the personal nature of hair and cosmetic formulations, returns are eligible strictly under the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li>Product delivered is damaged, leaking, or defective.</li>
              <li>Incorrect item or variant delivered compared to what was ordered.</li>
              <li>Product has expired upon delivery.</li>
              <li>Item is unused, unopened with original seal intact, and returned in original outer box.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              3. Non-Returnable Items
            </h2>
            <p>
              The following cannot be accepted for return or refund:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li>Items returned without original packaging, caps, or safety seals.</li>
              <li>Partially used, altered, or tested products.</li>
              <li>Requests made after the 7-day delivery window has lapsed.</li>
              <li>Free gifts, samples, or promotional bundle add-ons.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              4. How to Initiate a Return
            </h2>
            <ol className="list-decimal pl-5 space-y-1.5 text-stone-600">
              <li>Email our support team at <a href="mailto:info@sensein.in" className="text-[#5A3859] font-bold hover:underline">info@sensein.in</a> within 7 days of delivery.</li>
              <li>Include your <strong>Order ID</strong>, brief explanation of the issue, and clear photos/videos of the package and product.</li>
              <li>Our team will verify your request within 24 hours and arrange a free reverse pickup from your address.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              5. Refund Timeline
            </h2>
            <p>
              Once the returned product arrives at our lab warehouse and passes quality verification, your refund will be processed:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li><strong>Prepaid Orders (UPI, Netbanking, Cards):</strong> Refund credited to original payment method within 5 to 7 business days.</li>
              <li><strong>Cash on Delivery (COD) Orders:</strong> Refund credited directly to your bank account via secure NEFT/UPI transfer link within 3 to 5 business days.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              6. Contact Support
            </h2>
            <p>
              Need help with a return or refund? Contact us at{' '}
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
