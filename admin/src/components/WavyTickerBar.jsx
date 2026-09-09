export default function WavyTickerBar() {
  return (
    <div className="w-full relative z-30 select-none overflow-hidden pointer-events-none">
      <svg
        className="w-full h-10 sm:h-14 md:h-18 block"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
      >
        <path
          d="M 0,20 Q 720,60 1440,20 L 1440,60 L 0,60 Z"
          fill="#FAF5F7"
        />
      </svg>
    </div>
  )
}
