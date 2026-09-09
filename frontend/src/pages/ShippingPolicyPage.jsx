import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function ShippingPolicyPage() {
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
            <span className="text-stone-900 font-medium">Shipping Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Last Updated: August 2026
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              1. Processing & Dispatch Time
            </h2>
            <p>
              All orders are processed and dispatched from our certified fulfillment center within <strong>24 to 48 hours</strong> (excluding Sundays and national holidays).
            </p>
            <p>
              Orders placed before 2:00 PM IST on business days are prioritized for same-day dispatch. Once your order has shipped, you will receive an SMS and email notification containing your live courier tracking link.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              2. Shipping Charges
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li>
                <strong>Free Standard Shipping:</strong> Applicable on all prepaid and Cash on Delivery (COD) orders of <strong>₹999 and above</strong> across India.
              </li>
              <li>
                <strong>Standard Shipping Fee:</strong> A nominal flat fee of <strong>₹99</strong> is charged on orders below ₹999.
              </li>
              <li>
                <strong>Cash on Delivery (COD):</strong> Available across 19,000+ Indian pincodes without any hidden surcharges.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              3. Estimated Delivery Timelines
            </h2>
            <p>
              Our trusted courier partners (Blue Dart, Delhivery, Xpressbees, and DTDC) typically deliver within:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li><strong>Metro Cities (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata):</strong> 2 to 4 business days.</li>
              <li><strong>Tier 2 & Tier 3 Cities:</strong> 3 to 6 business days.</li>
              <li><strong>North-East, J&K, and Remote Locations:</strong> 5 to 8 business days.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              4. Order Tracking
            </h2>
            <p>
              You can track the real-time location of your package at any time by visiting our{' '}
              <Link to="/track-order" className="text-[#5A3859] font-bold hover:underline">
                Track Order Page
              </Link>{' '}
              using your Order ID or tracking AWB number.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              5. Damaged or Tampered Packaging
            </h2>
            <p>
              Every Sensein package is shipped in tamper-evident sealed packaging. If you notice the outer box is open, severely damaged, or tampered with at the time of delivery, please refuse the delivery and contact our customer support team immediately with photos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              6. Contact Us
            </h2>
            <p>
              For any questions or assistance regarding your shipment, please reach out to us at{' '}
              <a href="mailto:info@sensein.in" className="text-[#5A3859] font-bold hover:underline">
                info@sensein.in
              </a>{' '}
              (Monday to Saturday, 9:00 AM – 7:00 PM IST).
            </p>
          </section>

        </div>

      </div>
    </div>
  )
}
