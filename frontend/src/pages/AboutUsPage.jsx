import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function AboutUsPage() {
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
            <span className="text-stone-900 font-medium">About Us</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            About SENSEIN®
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Professional Botanical Haircare Formulation
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              1. Our Mission
            </h2>
            <p>
              SENSEIN® was created with a clear purpose: to deliver high-performance, clean haircare specifically formulated for diverse Indian hair textures and climate conditions (humidity, hard water, and heat styling).
            </p>
            <p>
              We combine potent botanical actives with modern hair science to strengthen hair fibers, restore lost moisture, and protect the natural scalp barrier.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              2. Clean Formulation Standards
            </h2>
            <p>
              Every Sensein product is developed under rigorous dermatological quality standards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li><strong>100% Sulfate & Paraben Free:</strong> Gentle daily cleansing without stripping natural scalp oils.</li>
              <li><strong>Color & Treatment Safe:</strong> Protects keratin bonds and prolongs salon color vibrancy.</li>
              <li><strong>Cruelty-Free & Ethical:</strong> Never tested on animals, ethically sourced ingredients.</li>
              <li><strong>Hard Water Shield:</strong> Bio-chelating agents that neutralize hard water mineral deposits.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              3. Science & Botanical Synergy
            </h2>
            <p>
              Our formulas utilize micro-peptide repair complexes, cold-pressed plant extracts, and botanical bio-ferments that penetrate deeply into the cortex to rebuild damaged protein chains from root to tip.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              4. Get In Touch
            </h2>
            <p>
              Have questions or want to learn more about our formulations? Visit our{' '}
              <Link to="/contact" className="text-[#5A3859] font-bold hover:underline">
                Contact Us Page
              </Link>{' '}
              or email us at{' '}
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
