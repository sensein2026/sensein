import { Link } from 'react-router-dom'
import { ShoppingBag, MapPin, CheckCircle2 } from 'lucide-react'

/**
 * Shared Luxury Checkout Stepper - Crisp Rectangular Aesthetic
 * @param {number} currentStep - 1: Bag, 2: Checkout/Delivery, 3: Payment/Success
 */
export default function CheckoutStepper({ currentStep = 1 }) {
  const steps = [
    {
      id: 1,
      label: 'Shopping Bag',
      shortLabel: 'Bag',
      icon: ShoppingBag,
      path: '/cart',
    },
    {
      id: 2,
      label: 'Checkout & Delivery',
      shortLabel: 'Checkout',
      icon: MapPin,
      path: '/checkout',
    },
    {
      id: 3,
      label: 'Payment & Confirm',
      shortLabel: 'Payment',
      icon: CheckCircle2,
      path: null,
    },
  ]

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 text-xs font-semibold select-none">
      {steps.map((step, idx) => {
        const isCompleted = step.id < currentStep
        const isCurrent = step.id === currentStep

        const StepContent = (
          <div
            className={`flex items-center gap-2 transition-all ${
              isCurrent
                ? 'text-[#5A3859]'
                : isCompleted
                ? 'text-emerald-700'
                : 'text-stone-400'
            }`}
          >
            <span
              className={`h-7 w-7 rounded-none flex items-center justify-center text-[11px] font-bold transition-all border ${
                isCurrent
                  ? 'bg-[#5A3859] text-white border-[#5A3859] shadow-sm'
                  : isCompleted
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-stone-100 text-stone-500 border-stone-300'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span>{step.id}</span>
              )}
            </span>
            <span
              className={`hidden sm:inline uppercase tracking-wider text-[11px] ${
                isCurrent
                  ? 'font-bold text-stone-900'
                  : isCompleted
                  ? 'font-semibold text-emerald-800'
                  : 'font-medium'
              }`}
            >
              {step.shortLabel}
            </span>
          </div>
        )

        return (
          <div key={step.id} className="flex items-center gap-1.5 sm:gap-3">
            {step.path && isCompleted ? (
              <Link
                to={step.path}
                className="hover:opacity-80 transition-opacity"
                title={`Go to ${step.label}`}
              >
                {StepContent}
              </Link>
            ) : (
              StepContent
            )}

            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-10 rounded-none transition-all ${
                  step.id < currentStep
                    ? 'bg-emerald-700'
                    : step.id === currentStep
                    ? 'bg-[#5A3859]'
                    : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

