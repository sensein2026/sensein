import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag, Star, Volume2, VolumeX } from 'lucide-react'

const defaultVideoCards = [
  {
    id: 1,
    title: 'Color Pro Combo',
    subtitle: 'Repair & protection for color-treated hair',
    productName: 'SENSEIN® Damage Repair Shampoo',
    price: '₹1,299',
    videoSrc: '/hero-video.mp4',
    poster: '/images/hero1.jpg',
    productLink: '/product/sensein-damage-repair-shampoo',
    rating: '4.9 ★',
    tag: 'BESTSELLER',
  },
  {
    id: 2,
    title: 'Argan Combo',
    subtitle: 'Smoothness, shine & frizz control',
    productName: 'SENSEIN® Anti-Frizz Gloss Serum',
    price: '₹999',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-woman-touching-her-long-hair-41551-large.mp4',
    poster: '/images/hero2.jpg',
    productLink: '/product/sensein-anti-frizz-gloss-serum',
    rating: '5.0 ★',
    tag: 'HOT DROP',
  },
  {
    id: 3,
    title: 'Hydro-Repair Mask',
    subtitle: 'Deep hydration & cuticle seal',
    productName: 'SENSEIN® Intense Repair Mask',
    price: '₹1,499',
    videoSrc: '/hero-video.mp4',
    poster: '/images/sensein-mask.jpg',
    productLink: '/product/sensein-intense-bond-repair-mask',
    rating: '4.9 ★',
    tag: 'SALON CARE',
  },
  {
    id: 4,
    title: 'Scalp SOS & Detox',
    subtitle: 'Hard water mineral shield & scalp clarity',
    productName: 'SENSEIN® Scalp Shield Serum',
    price: '₹1,199',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-woman-touching-her-long-hair-41551-large.mp4',
    poster: '/images/sensein-serum.jpg',
    productLink: '/product/sensein-scalp-shield-serum',
    rating: '4.8 ★',
    tag: 'NEW LAUNCH',
  },
  {
    id: 5,
    title: 'Royal Amber Mist',
    subtitle: 'Luxury alcohol-free hair mist & glass shine',
    productName: 'SENSEIN® Royal Amber Hair Perfume',
    price: '₹1,850',
    videoSrc: '/hero-video.mp4',
    poster: '/images/sensein-perfume.jpg',
    productLink: '/product/sensein-royal-amber-perfume',
    rating: '4.9 ★',
    tag: 'LUXURY ESSENCE',
  },
]

export default function RealResultsSection({ config }) {
  const videoCards =
    config?.videoCards && config.videoCards.length > 0
      ? config.videoCards
      : defaultVideoCards
  const sectionTag = config?.tag || 'REAL PEOPLE. REAL RESULTS.'
  const sectionTitle = config?.title || 'See Sensein In Action'
  const sectionDescription =
    config?.description ||
    'Watch real routine transformations powered by clean botanical science.'
  const buttonText = config?.buttonText || 'Shop All Bestsellers'
  const buttonLink = config?.buttonLink || '/shop?filter=bestseller'

  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRefs = useRef([])
  const sectionRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Continuous distance-based dynamic volume fade on scroll
  useEffect(() => {
    let ticking = false

    const updateVolumeOnScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      const activeVideo = videoRefs.current[activeIndex]
      if (!activeVideo) return

      // Completely out of viewport
      if (rect.bottom <= 0 || rect.top >= windowHeight) {
        activeVideo.volume = 0
        activeVideo.muted = true
        return
      }

      if (isMuted) {
        activeVideo.muted = true
        activeVideo.volume = 0
        return
      }

      // Calculate distance from section center to viewport center
      const sectionCenter = rect.top + rect.height / 2
      const viewportCenter = windowHeight / 2
      const distFromCenter = Math.abs(sectionCenter - viewportCenter)
      const maxDist = (windowHeight + rect.height) / 2

      // Proximity score: 1.0 at perfect center, 0.0 at edges
      const rawProximity = Math.max(0, Math.min(1, 1 - distFromCenter / maxDist))
      // Smooth natural cubic ease curve for audio falloff
      const dynamicVolume = Math.min(1, Math.max(0, Math.pow(rawProximity, 1.4)))

      if (dynamicVolume < 0.02) {
        activeVideo.volume = 0
        activeVideo.muted = true
      } else {
        activeVideo.muted = false
        activeVideo.volume = Number(dynamicVolume.toFixed(2))
      }
    }

    const onScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateVolumeOnScroll()
          ticking = false
        })
        ticking = true
      }
    }

    // Initial calculation
    updateVolumeOnScroll()

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })

    // Also auto-mute if user switches browser tab
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const activeVideo = videoRefs.current[activeIndex]
        if (activeVideo) {
          activeVideo.muted = true
        }
      } else {
        updateVolumeOnScroll()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeIndex, isMuted])

  // Auto rotation for non-video fallback (video cards advance naturally onEnded)
  useEffect(() => {
    let interval = null
    const currentCard = videoCards[activeIndex]
    const isVideoCard = Boolean(currentCard?.videoSrc)

    // For non-video cards or fallback, auto-advance after 6s
    if (isAutoRotating && !isVideoCard && videoCards.length > 0) {
      interval = setInterval(() => {
        nextCard()
      }, 6000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAutoRotating, activeIndex, videoCards])

  // Handle video playback (only resets to 0 when active slide changes)
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === activeIndex) {
          video.currentTime = 0
          video.muted = isMuted
          if (!isMuted) {
            // Apply current scroll volume
            if (sectionRef.current) {
              const rect = sectionRef.current.getBoundingClientRect()
              const windowHeight = window.innerHeight
              const sectionCenter = rect.top + rect.height / 2
              const viewportCenter = windowHeight / 2
              const distFromCenter = Math.abs(sectionCenter - viewportCenter)
              const maxDist = (windowHeight + rect.height) / 2
              const rawProximity = Math.max(0, Math.min(1, 1 - distFromCenter / maxDist))
              const dynamicVolume = Math.min(1, Math.max(0, Math.pow(rawProximity, 1.4)))
              video.volume = Number(dynamicVolume.toFixed(2))
              video.muted = dynamicVolume < 0.02
            }
          }
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
    })
  }, [activeIndex, isMuted])

  const toggleVolume = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const newMuted = !isMuted
    setIsMuted(newMuted)
    const activeVideo = videoRefs.current[activeIndex]
    if (activeVideo) {
      if (newMuted) {
        activeVideo.muted = true
        activeVideo.volume = 0
      } else {
        if (sectionRef.current) {
          const rect = sectionRef.current.getBoundingClientRect()
          const windowHeight = window.innerHeight
          const sectionCenter = rect.top + rect.height / 2
          const viewportCenter = windowHeight / 2
          const distFromCenter = Math.abs(sectionCenter - viewportCenter)
          const maxDist = (windowHeight + rect.height) / 2
          const rawProximity = Math.max(0, Math.min(1, 1 - distFromCenter / maxDist))
          const dynamicVolume = Math.min(1, Math.max(0, Math.pow(rawProximity, 1.4)))
          activeVideo.volume = Number(dynamicVolume.toFixed(2))
          activeVideo.muted = dynamicVolume < 0.02
        } else {
          activeVideo.volume = 1
          activeVideo.muted = false
        }
        if (activeVideo.paused) {
          activeVideo.play().catch(() => {})
        }
      }
    }
  }

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % videoCards.length)
  }

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + videoCards.length) % videoCards.length)
  }

  const [touchStartX, setTouchStartX] = useState(null)

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    if (diff > 40) {
      nextCard()
    } else if (diff < -40) {
      prevCard()
    }
    setTouchStartX(null)
  }

  // 5-Card Symmetrical Progressive Tilted Fan Spread (2 Left + 1 Center + 2 Right - No Edge Clipping)
  const getCardStyle = (idx) => {
    const diff = (idx - activeIndex + videoCards.length) % videoCards.length

    let transform = ''
    let zIndex = 10
    let opacity = 1
    let filter = 'brightness(100%)'

    if (diff === 0) {
      // 1. Center Upright Card (Focus)
      transform = 'translate3d(0px, 0px, 0px) rotate(0deg) scale(1.04)'
      zIndex = 30
      opacity = 1
      filter = 'brightness(100%)'
    } else if (diff === 1) {
      // 2. Inner Right Tilted Card
      const tx = isMobile ? 36 : 120
      const ty = isMobile ? 5 : 14
      const rot = isMobile ? 5 : 7.5
      transform = `translate3d(${tx}px, ${ty}px, -20px) rotate(${rot}deg) scale(0.9)`
      zIndex = 20
      opacity = 0.92
      filter = 'brightness(90%)'
    } else if (diff === 2) {
      // 3. Far Right Tilted Card (Tighter offset so zero screen clipping)
      const tx = isMobile ? 70 : 225
      const ty = isMobile ? 12 : 28
      const rot = isMobile ? 9.5 : 14
      transform = `translate3d(${tx}px, ${ty}px, -45px) rotate(${rot}deg) scale(0.78)`
      zIndex = 10
      opacity = isMobile ? 0.75 : 0.75
      filter = 'brightness(78%)'
    } else if (diff === videoCards.length - 1) {
      // 4. Inner Left Tilted Card
      const tx = isMobile ? -36 : -120
      const ty = isMobile ? 5 : 14
      const rot = isMobile ? -5 : -7.5
      transform = `translate3d(${tx}px, ${ty}px, -20px) rotate(${rot}deg) scale(0.9)`
      zIndex = 20
      opacity = 0.92
      filter = 'brightness(90%)'
    } else if (diff === videoCards.length - 2) {
      // 5. Far Left Tilted Card (Tighter offset so zero screen clipping)
      const tx = isMobile ? -70 : -225
      const ty = isMobile ? 12 : 28
      const rot = isMobile ? -9.5 : -14
      transform = `translate3d(${tx}px, ${ty}px, -45px) rotate(${rot}deg) scale(0.78)`
      zIndex = 10
      opacity = isMobile ? 0.75 : 0.75
      filter = 'brightness(78%)'
    } else {
      // Any remaining cards smoothly hidden in background
      transform = 'translate3d(0px, 0px, -150px) scale(0.5)'
      zIndex = 0
      opacity = 0
    }

    return {
      transform,
      zIndex,
      opacity,
      filter,
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      willChange: 'transform, opacity, filter',
      pointerEvents: opacity === 0 ? 'none' : 'auto',
    }
  }

  return (
    <section ref={sectionRef} className="py-10 sm:py-24 bg-transparent relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-3 sm:px-6 text-center space-y-5 sm:space-y-12 relative z-10">
        
        {/* Section Header */}
        <div className="space-y-1.5 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#5A3859] text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] uppercase shadow-xs border border-[#5A3859]/15">
            <Sparkles className="w-3 h-3 text-[#5A3859]" />
            {sectionTag}
          </div>
          <h2 className="font-sans text-xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight uppercase">
            {sectionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-normal px-2">
            {sectionDescription}
          </p>
        </div>

        {/* 5-Card Tilted Fan Stage Container with Touch Swipe (Fits perfectly inside mobile screen) */}
        <div
          className="relative flex items-center justify-center min-h-[300px] sm:min-h-[480px] max-w-5xl mx-auto px-1 sm:px-2 select-none"
          onMouseEnter={() => setIsAutoRotating(false)}
          onMouseLeave={() => setIsAutoRotating(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Desktop Left Arrow Button */}
          <button
            onClick={prevCard}
            className="hidden sm:flex absolute -left-2 md:-left-4 lg:-left-8 z-40 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md hover:bg-[#5A3859] hover:text-white shadow-xl border border-stone-200 text-stone-800 items-center justify-center transition-all duration-300 transform hover:scale-110 cursor-pointer"
            aria-label="Previous Reel"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Perspective Container */}
          <div className="relative w-full max-w-3xl h-[290px] sm:h-[450px] flex items-center justify-center overflow-visible">
            {videoCards.map((card, idx) => {
              const diff = (idx - activeIndex + videoCards.length) % videoCards.length
              const isCenter = diff === 0
              const cardStyle = getCardStyle(idx)

              return (
                <div
                  key={card.id}
                  onClick={() => setActiveIndex(idx)}
                  style={cardStyle}
                  className={`absolute w-[160px] h-[265px] sm:w-[260px] sm:h-[430px] rounded-[22px] sm:rounded-[30px] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer bg-black ${
                    isCenter
                      ? 'border-2 border-[#5A3859] shadow-[0_14px_32px_rgba(0,0,0,0.25)]'
                      : 'border border-white/20 shadow-lg'
                  }`}
                >
                  {/* Outer Frame */}
                  <div className="w-full h-full relative overflow-hidden bg-black">
                    
                    {/* Audio Volume Control Button */}
                    {isCenter && (
                      <div className="absolute top-2.5 right-2.5 z-30 opacity-90">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleVolume()
                          }}
                          className="p-1.5 text-white hover:text-amber-300 transition-transform hover:scale-125 cursor-pointer focus:outline-none bg-black/30 backdrop-blur-xs rounded-full"
                          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Video Stream for Center Active Card, Lightweight Poster for Side Cards */}
                    {isCenter ? (
                      <video
                        ref={(el) => (videoRefs.current[idx] = el)}
                        muted={isMuted}
                        loop={false}
                        playsInline
                        autoPlay
                        preload="auto"
                        onEnded={nextCard}
                        poster={card.poster}
                        className="w-full h-full object-cover"
                      >
                        <source src={card.videoSrc} type="video/mp4" />
                      </video>
                    ) : (
                      <img
                        src={card.poster}
                        alt={card.title}
                        loading="lazy"
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                    )}

                    {/* Active Reel Live UI Overlay */}
                    {isCenter && (
                      <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-left space-y-1.5 sm:space-y-2 pt-8 sm:pt-12 pointer-events-auto">
                        <div className="flex items-center justify-between">
                          <span className="inline-block px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded bg-[#5A3859] text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                            {card.tag}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-300" />
                            {card.rating}
                          </span>
                        </div>

                        <h4 className="text-[11px] sm:text-sm font-bold text-white leading-tight line-clamp-1">
                          {card.productName}
                        </h4>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-xs sm:text-sm font-extrabold text-white">
                            {card.price}
                          </span>
                          <Link
                            to={card.productLink}
                            className="inline-flex items-center gap-1 bg-white text-[#5A3859] hover:bg-stone-100 text-[9px] sm:text-[10px] font-extrabold uppercase px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md shadow-md transition-all hover:scale-105"
                          >
                            <ShoppingBag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#5A3859]" />
                            <span>BUY NOW</span>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Subtle backdrop overlay for side cards */}
                    {!isCenter && (
                      <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Right Arrow Button */}
          <button
            onClick={nextCard}
            className="hidden sm:flex absolute -right-2 md:-right-4 lg:-right-8 z-40 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md hover:bg-[#5A3859] hover:text-white shadow-xl border border-stone-200 text-stone-800 items-center justify-center transition-all duration-300 transform hover:scale-110 cursor-pointer"
            aria-label="Next Reel"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* CTA Shop Button */}
        <div className="pt-2 sm:pt-4">
          <Link
            to={buttonLink}
            className="inline-block bg-[#5A3859] hover:bg-[#4b2f4a] active:scale-95 text-white font-bold text-xs sm:text-sm uppercase px-8 sm:px-10 py-3 sm:py-3.5 tracking-wider rounded-lg shadow-md transition-all cursor-pointer select-none"
          >
            {buttonText}
          </Link>
        </div>

      </div>
    </section>
  )
}
