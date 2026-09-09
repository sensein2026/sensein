import SenseinLogo from '@/components/SenseinLogo'

export default function SenseinLoader({ text = 'LOADING', fullScreen = true }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 select-none">
      {/* Centered SENSEIN Logo */}
      <div className="flex items-center justify-center">
        <SenseinLogo />
      </div>

      {/* Simple Clean Spinner */}
      <div className="h-6 w-6 border-2 border-stone-200 border-t-[#5A3859] rounded-full animate-spin" />

      {/* Clean Sub-label */}
      {text && (
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 font-mono">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] sm:min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 py-12">
        {content}
      </div>
    )
  }

  return content
}

