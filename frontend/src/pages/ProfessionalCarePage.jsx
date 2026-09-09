import { useState, useEffect } from 'react'
import {
  Scissors,
  Building2,
  CheckCircle2,
  Send,
  Award,
  BookOpen,
  ShoppingBag,
} from 'lucide-react'

export default function ProfessionalCarePage() {
  const [formData, setFormData] = useState({
    salonName: '',
    ownerName: '',
    email: '',
    phone: '',
    gstNumber: '',
    city: '',
    estimatedVolume: '10k-50k',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      setFormData({
        salonName: '',
        ownerName: '',
        email: '',
        phone: '',
        gstNumber: '',
        city: '',
        estimatedVolume: '10k-50k',
        notes: '',
      })
    }, 1200)
  }

  return (
    <div className="bg-ivory min-h-screen pb-20">
      {/* Hero Banner */}
      <div className="bg-charcoal text-white py-16 px-4 border-b border-primary/20 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-rosegold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container-page max-w-4xl text-center relative z-10">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary-light">
            Exclusive Salon & Stylist Program
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-semibold mt-2 text-white">
            Sensein Professional Care
          </h1>
          <p className="mt-3 text-slate-300 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed">
            Elevate your salon&apos;s service menu with our backbar molecular repair treatments, trichology formulations, and wholesale retail pricing.
          </p>
        </div>
      </div>

      <div className="container-page max-w-5xl mt-12 space-y-16">
        {/* Partner Perks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-charcoal/10 shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-rosegold/10 text-rosegold-dark flex items-center justify-center mb-3">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="font-display font-semibold text-charcoal text-base">Wholesale Pricing</h3>
            <p className="text-xs text-charcoal-light mt-1">Up to 45% margin on retail resale products</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-charcoal/10 shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-rosegold/10 text-rosegold-dark flex items-center justify-center mb-3">
              <Scissors className="h-6 w-6" />
            </div>
            <h3 className="font-display font-semibold text-charcoal text-base">Backbar Sizes</h3>
            <p className="text-xs text-charcoal-light mt-1">1000ml professional salon pump dispensers</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-charcoal/10 shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-rosegold/10 text-rosegold-dark flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-display font-semibold text-charcoal text-base">Stylist Masterclass</h3>
            <p className="text-xs text-charcoal-light mt-1">Certified trichology training for salon staff</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-charcoal/10 shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-rosegold/10 text-rosegold-dark flex items-center justify-center mb-3">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-display font-semibold text-charcoal text-base">Authorized Partner</h3>
            <p className="text-xs text-charcoal-light mt-1">Listed on Sensein Salon Finder app</p>
          </div>
        </div>

        {/* Application Form & Starter Kit Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl border border-charcoal/10 shadow-md">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5 text-rosegold-dark" />
              <h2 className="font-display text-2xl font-semibold text-charcoal">
                Salon Partner Application
              </h2>
            </div>

            {isSubmitted ? (
              <div className="p-8 bg-emerald-50 rounded-2xl text-center border border-emerald-200">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-display text-xl font-semibold text-emerald-900">
                  Application Submitted!
                </h3>
                <p className="text-xs text-emerald-700 mt-2 max-w-sm mx-auto leading-relaxed">
                  Thank you for applying to the Sensein Professional Salon Program. Our B2B partnership manager will contact you within 24 hours.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-6 btn-primary text-xs px-6 py-2.5"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Salon / Spa Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Velvet Hair Studio"
                      value={formData.salonName}
                      onChange={(e) => setFormData({ ...formData, salonName: e.target.value })}
                      className="w-full text-xs p-3 bg-cream/30 border border-charcoal/15 rounded-xl text-charcoal focus:outline-none focus:border-rosegold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Owner / Manager Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Malhotra"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full text-xs p-3 bg-cream/30 border border-charcoal/15 rounded-xl text-charcoal focus:outline-none focus:border-rosegold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contact@salon.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs p-3 bg-cream/30 border border-charcoal/15 rounded-xl text-charcoal focus:outline-none focus:border-rosegold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs p-3 bg-cream/30 border border-charcoal/15 rounded-xl text-charcoal focus:outline-none focus:border-rosegold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      City / Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai, Bandra West"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full text-xs p-3 bg-cream/30 border border-charcoal/15 rounded-xl text-charcoal focus:outline-none focus:border-rosegold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      GST / Trade License (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      className="w-full text-xs p-3 bg-cream/30 border border-charcoal/15 rounded-xl text-charcoal focus:outline-none focus:border-rosegold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Estimated Monthly Haircare Order Volume *
                  </label>
                  <select
                    value={formData.estimatedVolume}
                    onChange={(e) => setFormData({ ...formData, estimatedVolume: e.target.value })}
                    className="w-full text-xs p-3 bg-cream/30 border border-charcoal/15 rounded-xl text-charcoal focus:outline-none focus:border-rosegold"
                  >
                    <option value="10k-50k">₹10,000 – ₹50,000 / month</option>
                    <option value="50k-1L">₹50,000 – ₹1,00,000 / month</option>
                    <option value="1L-5L">₹1,00,000 – ₹5,00,000 / month</option>
                    <option value="5L+">₹5,00,000+ (Multi-chain Salon)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Additional Notes or Requirements
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your salon chairs, number of stylists, or preferred starter kit..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs p-3 bg-cream/30 border border-charcoal/15 rounded-xl text-charcoal focus:outline-none focus:border-rosegold resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Apply For Salon Partnership
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Side Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-charcoal text-white p-8 rounded-3xl border border-primary/20 space-y-4 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary-light">
                Sensein Pro Starter Kit
              </span>
              <h3 className="font-display text-2xl font-semibold">Backbar & Retail Suite</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Includes 2x 1000ml Molecular Repair Shampoos, 2x 1000ml Scalp Detox Masks, 6x Retail Repair Serums, and salon branding banners.
              </p>
              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs">
                <span className="text-slate-400">Pro Kit Value:</span>
                <span className="font-bold text-rosegold-light text-base">₹14,999</span>
              </div>
            </div>

            <div className="bg-cream/50 p-6 rounded-3xl border border-charcoal/10 space-y-3 text-xs text-charcoal">
              <h4 className="font-display font-semibold text-sm">Direct Pro Hotline</h4>
              <p className="text-charcoal-light">
                Need immediate wholesale quotes or customized backbar sizing?
              </p>
              <div className="font-mono text-charcoal font-semibold text-sm">
                📞 +91 (800) 586-4373 (Ext 4)
              </div>
              <div className="text-charcoal-light font-medium">✉️ pro@sensein.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
