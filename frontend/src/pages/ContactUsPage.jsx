import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Clock, CheckCircle2 } from 'lucide-react'

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
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
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    }, 1000)
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 border border-stone-200 shadow-sm space-y-8">
        
        {/* Header */}
        <div className="border-b border-stone-200 pb-6">
          <div className="text-xs text-stone-500 mb-2">
            <Link to="/" className="hover:text-[#5A3859] transition-colors">Home</Link>
            <span className="mx-2 text-stone-300">/</span>
            <span className="text-stone-900 font-medium">Contact Us</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Contact Us
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            We are here to help with your orders, consultations, and inquiries.
          </p>
        </div>

        {/* Contact Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-200 text-xs text-stone-700">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-[#5A3859] shrink-0" />
            <div>
              <div className="font-bold text-stone-900">Email Support</div>
              <a href="mailto:info@sensein.in" className="hover:text-[#5A3859] transition-colors">
                info@sensein.in
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-[#5A3859] shrink-0" />
            <div>
              <div className="font-bold text-stone-900">Support Hours</div>
              <span>Mon - Sat (9:00 AM - 7:00 PM IST)</span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-stone-900">
            Send us a Message
          </h2>

          {isSubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm">Thank You for Reaching Out!</h3>
              <p className="text-xs">
                Your message has been received. Our team will get back to you within 24 business hours.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="mt-3 px-4 py-2 bg-[#5A3859] text-white text-xs font-bold uppercase tracking-wider rounded-none"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full text-xs p-3 rounded-none border border-stone-300 bg-stone-50 focus:bg-white focus:border-[#5A3859] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="priya@example.com"
                    className="w-full text-xs p-3 rounded-none border border-stone-300 bg-stone-50 focus:bg-white focus:border-[#5A3859] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs p-3 rounded-none border border-stone-300 bg-stone-50 focus:bg-white focus:border-[#5A3859] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1">
                    Subject / Order ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Order Inquiry #12345"
                    className="w-full text-xs p-3 rounded-none border border-stone-300 bg-stone-50 focus:bg-white focus:border-[#5A3859] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can our support team assist you?"
                  className="w-full text-xs p-3 rounded-none border border-stone-300 bg-stone-50 focus:bg-white focus:border-[#5A3859] outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#5A3859] hover:bg-[#4B2F4A] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Sending Message...' : 'Submit Message'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
