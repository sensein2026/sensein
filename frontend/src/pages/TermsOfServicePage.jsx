import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function TermsOfServicePage() {
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
            <span className="text-stone-900 font-medium">Terms & Conditions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Last Updated: August 2026
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing, browsing, or making a purchase on the Sensein website, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              2. Products, Pricing & Accuracy
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li>All prices listed on our store are in <strong>Indian National Rupees (INR ₹)</strong> and are inclusive of applicable GST taxes.</li>
              <li>We make every effort to display the colors, volume sizes, and formulations of our haircare products as accurately as possible.</li>
              <li>We reserve the right to modify prices, discontinue products, or update specifications at any time without prior notice.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              3. Orders & Payment
            </h2>
            <p>
              We reserve the right to refuse or cancel any order for reasons including stock unavailability, pricing errors, or suspected fraudulent activity. In the event an order is canceled after payment has been completed, a full refund will be credited to the original payment source.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              4. Intellectual Property
            </h2>
            <p>
              All trademarks, logos, brand names, product formulations, imagery, descriptions, and site code are the exclusive intellectual property of <strong>SENSEIN®</strong>. Any unauthorized copying, reproduction, or commercial distribution is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              5. Limitation of Liability
            </h2>
            <p>
              Our products are dermatologically formulated for external cosmetic use on hair and scalp. We recommend performing a 24-hour patch test prior to first use. Sensein shall not be held liable for personal adverse reactions resulting from non-compliance with product instructions or unknown individual allergies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              6. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of the use of this website shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              7. Contact Information
            </h2>
            <p>
              Questions regarding these Terms and Conditions should be sent to us at{' '}
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
