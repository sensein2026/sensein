import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Check, ArrowRight, RefreshCw, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

const steps = [
  {
    title: 'What is your natural hair texture?',
    subtitle: 'Step 1 of 3 · Select the type that best describes your hair',
    options: [
      { id: 'straight', label: 'Straight / Fine Hair', icon: '✨' },
      { id: 'wavy', label: 'Wavy (Type 2A - 2C)', icon: '🌊' },
      { id: 'curly', label: 'Curly / Coily (Type 3A - 4C)', icon: '🌀' },
      { id: 'treated', label: 'Color / Chemically Treated', icon: '🎨' },
    ],
  },
  {
    title: 'What is your primary hair concern?',
    subtitle: 'Step 2 of 3 · Choose what you want to fix first',
    options: [
      { id: 'frizz', label: 'Frizz & Unmanageability', icon: '⚡' },
      { id: 'dryness', label: 'Extreme Dryness & Roughness', icon: '🌵' },
      { id: 'scalp', label: 'Scalp Flakes & Hard Water Buildup', icon: '💧' },
      { id: 'damage', label: 'Split Ends & Heat Breakage', icon: '✂️' },
    ],
  },
  {
    title: 'How often do you wash your hair?',
    subtitle: 'Step 3 of 3 · Helps determine formula weight',
    options: [
      { id: 'daily', label: 'Everyday or alternate days', icon: '🚿' },
      { id: 'twice', label: '2 - 3 times a week', icon: '📅' },
      { id: 'weekly', label: 'Once a week', icon: '💆‍♀️' },
    ],
  },
]

const routineRecommendations = {
  curly: {
    title: 'Ultimate Curl Definition Routine',
    products: [
      { name: 'Moxie Leave-In Conditioner', price: 699, desc: 'Hydrates curls without weigh-down' },
      { name: 'Moxie Defining Hair Jelly', price: 799, desc: 'Holds curl clumps with 72hr crunch-free bounce' },
    ],
  },
  default: {
    title: 'Clean Hair Detox & Moisture Restore Set',
    products: [
      { name: 'Moxie Clarifying Scalp Shampoo', price: 649, desc: 'Removes hard water minerals & oil' },
      { name: 'Moxie Intense Repair Hair Mask', price: 899, desc: 'Restores split ends and locks in silkiness' },
    ],
  },
}

export default function HairQuizModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelect = (optionId) => {
    const updated = { ...answers, [currentStep]: optionId }
    setAnswers(updated)

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setIsCompleted(true)
    }
  }

  const resetQuiz = () => {
    setCurrentStep(0)
    setAnswers({})
    setIsCompleted(false)
  }

  const rec = answers[0] === 'curly' ? routineRecommendations.curly : routineRecommendations.default

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#fcf8f2] rounded-3xl p-5 sm:p-8 shadow-2xl border border-black/10 overflow-y-auto max-h-[92dvh] sm:max-h-[90vh] my-auto overscroll-contain">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white text-black hover:bg-[#e2ff3d] transition-colors border border-black/10"
        >
          <X className="h-5 w-5" />
        </button>

        {!isCompleted ? (
          <div>
            {/* Header */}
            <div className="mb-6 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1c] text-[#e2ff3d] text-[10px] font-bold tracking-widest uppercase mb-2">
                <Sparkles className="h-3 w-3" />
                Moxie Hair Diagnostic Tool
              </div>
              <h3 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#1c1c1c] tracking-tight uppercase">
                {steps[currentStep].title}
              </h3>
              <p className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider mt-1">
                {steps[currentStep].subtitle}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-black/10 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[#1c1c1c] transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              {steps[currentStep].options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-black/10 hover:border-black hover:bg-[#e2ff3d]/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-sans font-bold text-sm text-[#1c1c1c]">{opt.label}</span>
                  </div>
                  <div className="h-6 w-6 rounded-full border border-black/20 group-hover:border-black group-hover:bg-[#1c1c1c] group-hover:text-[#e2ff3d] flex items-center justify-center transition-colors">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex h-12 w-12 rounded-full bg-[#e2ff3d] text-black items-center justify-center mb-3">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>
            <h3 className="font-sans text-2xl font-black text-[#1c1c1c] uppercase tracking-tight">
              YOUR PERSONALIZED ROUTINE
            </h3>
            <p className="text-xs text-charcoal/70 mt-1 max-w-sm mx-auto">
              Based on your answers, here is the clean formula combo recommended for your hair.
            </p>

            <div className="mt-6 space-y-3 text-left">
              {rec.products.map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-black/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-black">{p.name}</h4>
                    <p className="text-xs text-charcoal/60 mt-0.5">{p.desc}</p>
                  </div>
                  <span className="font-extrabold text-sm text-black">₹{p.price}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={resetQuiz}
                className="flex-1 py-3.5 rounded-full border border-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black/5"
              >
                <RefreshCw className="h-4 w-4" />
                Retake Quiz
              </button>
              <Link
                to="/shop"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-full bg-[#1c1c1c] text-[#e2ff3d] text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black shadow-lg"
              >
                <ShoppingBag className="h-4 w-4" />
                Shop My Routine
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
