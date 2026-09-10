import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import WavyTickerBar from '@/components/WavyTickerBar'
import SenseinLogo from '@/components/SenseinLogo'

const defaultSlides = [
  {
    id: 1,
    type: 'video',
    videoSrc: '/hero-video.mp4',
    poster: '/images/hero1.jpg',
    showLogo: true,
    logoImage: '',
    logoSubtitle: 'PROFESSIONAL MEN',
    title: 'REPAIR DAMAGE. RESTORE LIFE.',
    description: 'For Stronger, Healthier, Shinier Hair. Gentle Cleansing, Nourishing the Scalp, Split End Prevention & Moisture Restoration.',
    showBtn: true,
    btnText: 'EXPLORE COLLECTION',
    btnLink: '/shop?category=haircare',
    btnBgColor: '#5A3859',
    btnTextColor: '#ffffff',
    duration: 6,
  },
  {
    id: 2,
    type: 'image',
    image: '/images/hero2.jpg',
    showLogo: true,
    logoImage: '',
    logoSubtitle: 'PROFESSIONAL MEN',
    title: 'Professional Solution for Damaged Hair',
    description: 'Enriched with botanical extracts for deep moisture restoration, softness, and complete hair life restoration.',
    showBtn: true,
    btnText: 'EXPLORE COLLECTION',
    btnLink: '/shop?category=haircare',
    btnBgColor: '#5A3859',
    btnTextColor: '#ffffff',
    duration: 6,
  },
  {
    id: 3,
    type: 'image',
    image: '/images/hero3.jpg',
    showLogo: true,
    logoImage: '',
    logoSubtitle: 'PROFESSIONAL MEN',
    title: 'Restores Lost Moisture & Softness',
    description: 'Gentle cleansing without stripping natural moisture. Cleanses without stripping natural scalp barrier.',
    showBtn: true,
    btnText: 'SHOP ALL PRODUCTS',
    btnLink: '/shop',
    btnBgColor: '#5A3859',
    btnTextColor: '#ffffff',
    duration: 6,
  },
]

export default function HeroSlider({ config }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const videoRef = useRef(null)
  const timerRef = useRef(null)
  const touchStartX = useRef(0)
  const navigate = useNavigate()

  // If CMS slides array exists (even if empty []), respect CMS instead of forcing defaultSlides
  const hasCustomSlidesArray = config && Array.isArray(config.slides)
  const activeSlides = hasCustomSlidesArray ? config.slides : defaultSlides

  const safeCurrentSlide =
    activeSlides && activeSlides.length > 0 ? currentSlide % activeSlides.length : 0
  const activeSlide =
    activeSlides && activeSlides.length > 0
      ? activeSlides[safeCurrentSlide] || activeSlides[0]
      : null

  // Configurable duration in seconds (default 6s)
  const slideDurationSeconds = Math.max(
    2,
    Number(activeSlide?.duration || config?.slideDuration || config?.duration || 6)
  )

  const nextSlide = (e) => {
    if (e) e.stopPropagation()
    if (timerRef.current) clearTimeout(timerRef.current)
    if (activeSlides && activeSlides.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
    }
  }

  const prevSlide = (e) => {
    if (e) e.stopPropagation()
    if (timerRef.current) clearTimeout(timerRef.current)
    if (activeSlides && activeSlides.length > 1) {
      setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)
    }
  }

  const goToSlide = (index, e) => {
    if (e) e.stopPropagation()
    if (timerRef.current) clearTimeout(timerRef.current)
    setCurrentSlide(index)
  }

  // Auto advance slides according to configured duration in seconds
  useEffect(() => {
    if (activeSlides && activeSlides.length > 1) {
      if (activeSlide?.type === 'image' || !activeSlide?.videoSrc) {
        timerRef.current = setTimeout(() => {
          setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
        }, slideDurationSeconds * 1000)
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [safeCurrentSlide, activeSlide?.type, activeSlides?.length, slideDurationSeconds])

  const handleVideoEnded = () => {
    if (activeSlides && activeSlides.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
    }
  }

  const handleSlideClick = (e) => {
    const link = activeSlide?.btnLink || activeSlide?.slideLink || activeSlide?.link || '/shop'
    if (!link) return
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.location.href = link
    } else {
      navigate(link)
    }
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX
    if (diff > 50) {
      nextSlide()
    } else if (diff < -50) {
      prevSlide()
    }
  }

  // If admin has 0 slides in CMS, render clean empty black banner with exact same full height
  if (!activeSlides || activeSlides.length === 0) {
    return (
      <div className="relative w-full overflow-hidden bg-black text-white h-[520px] sm:h-[650px] lg:h-[80vh] min-h-[480px] flex items-center justify-center select-none">
        <div className="absolute -bottom-1 left-0 right-0 z-35 pointer-events-none">
          <WavyTickerBar />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleSlideClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-hidden bg-black text-white h-[520px] sm:h-[650px] lg:h-[80vh] min-h-[480px] cursor-pointer select-none group"
    >

      {/* Background Media (100% Responsive Video & Image Canvas) */}
      {activeSlides.map((slide, index) => {
        const isActive = index === safeCurrentSlide
        return (
          <div
            key={slide.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {slide.type === 'video' && slide.videoSrc ? (
              <video
                ref={isActive ? videoRef : null}
                autoPlay
                muted
                loop={activeSlides.length === 1}
                playsInline
                onEnded={handleVideoEnded}
                poster={slide.poster || slide.image}
                className="w-full h-full object-cover object-center"
              >
                <source src={slide.videoSrc} type="video/mp4" />
              </video>
            ) : slide.image ? (
              <img
                src={slide.image}
                alt={slide.title || 'Sensein Luxury Haircare'}
                className="w-full h-full object-cover object-center"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ) : (
              <div className="w-full h-full bg-black" />
            )}
          </div>
        )
      })}

      {/* Luxury Dark Gradient Overlay for optimal readability */}
      <div className="absolute inset-0 z-15 bg-gradient-to-t from-black/90 via-black/35 to-black/20 pointer-events-none" />

      {/* Hero Content Overlay (Clean Bottom-Weighted Layout) */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-20 sm:pb-28 text-center px-4 sm:px-12 pointer-events-none">
        <div className="max-w-2xl space-y-2.5 sm:space-y-4 pointer-events-auto flex flex-col items-center text-center">

          {activeSlide.showLogo !== false && (
            <div className="flex flex-col items-center justify-center mb-0.5">
              {activeSlide.logoImage ? (
                <img
                  src={activeSlide.logoImage}
                  alt="Brand Logo"
                  className="max-h-12 sm:max-h-16 w-auto object-contain drop-shadow-lg scale-90 sm:scale-100"
                />
              ) : (
                <SenseinLogo isWhite={true} className="drop-shadow-lg scale-90 sm:scale-110" />
              )}
              {activeSlide.logoSubtitle && (
                <span className="text-[10px] sm:text-xs font-semibold tracking-[0.25em] sm:tracking-[0.35em] text-white/90 uppercase mt-1 drop-shadow-sm font-sans">
                  {activeSlide.logoSubtitle}
                </span>
              )}
            </div>
          )}

          {activeSlide.title && (
            <h1 className="font-display text-xl sm:text-3xl md:text-5xl font-bold uppercase tracking-tight text-white drop-shadow-md leading-tight">
              {activeSlide.title}
            </h1>
          )}

          {activeSlide.description && (
            <p className="text-xs sm:text-sm text-white/85 font-normal max-w-lg leading-relaxed drop-shadow-sm px-2 line-clamp-3 sm:line-clamp-none">
              {activeSlide.description}
            </p>
          )}

          {activeSlide.showBtn !== false && activeSlide.btnText && (
            <div className="pt-1.5 sm:pt-2">
              <Link
                to={activeSlide.btnLink || activeSlide.slideLink || '/shop'}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: activeSlide.btnBgColor || '#5A3859',
                  color: activeSlide.btnTextColor || '#ffffff',
                }}
                className="inline-block font-bold text-xs sm:text-sm uppercase px-8 py-3.5 tracking-wider rounded-none shadow-xl transition-all hover:scale-105 active:scale-95 hover:brightness-110 cursor-pointer"
              >
                {activeSlide.btnText}
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* Slide Indicator Pagination Dots (Positioned cleanly near the bottom above the wave curve) */}
      {activeSlides.length > 1 && (
        <div
          className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-2 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {activeSlides.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => goToSlide(dotIdx, e)}
              aria-label={`Go to slide ${dotIdx + 1}`}
              className={`h-2 transition-all rounded-full cursor-pointer ${
                dotIdx === safeCurrentSlide
                  ? 'w-8 bg-white shadow-md'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Bottom Wave Ticker Bar */}
      <div className="absolute -bottom-1 left-0 right-0 z-35 pointer-events-none">
        <WavyTickerBar />
      </div>

    </div>
  )
}
