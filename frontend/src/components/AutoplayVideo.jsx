import { useEffect, useRef } from 'react'

/**
 * Continuously-playing background video, same trick used by moxiebeauty.in
 * and most premium D2C sites:
 *   1. muted + autoPlay + loop + playsInline  -> browsers allow autoplay
 *      WITHOUT a user gesture only when the video is muted. playsInline
 *      stops iOS Safari from hijacking it into fullscreen.
 *   2. preload="auto" so the browser fetches enough of the file up front
 *      that there's no stall/flicker on load.
 *   3. An IntersectionObserver that calls .play() again whenever the
 *      video re-enters the viewport — mobile Chrome/Safari silently pause
 *      offscreen video to save battery, so without this the video would
 *      "freeze" the first time someone scrolls past it and back.
 *   4. onEnded is never needed because loop handles it, but we also
 *      re-trigger play() there as a safety net for browsers that stutter
 *      on the loop boundary.
 */
export default function AutoplayVideo({
  src,
  poster,
  className = '',
  overlayClassName = 'bg-black/30',
}) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const tryPlay = () => {
      video.play().catch(() => {
        /* Autoplay can still be blocked in rare cases (e.g. low-power
           mode) — poster image stays visible as a graceful fallback. */
      })
    }

    tryPlay()

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tryPlay()
        else video.pause()
      },
      { threshold: 0.25 }
    )
    observer.observe(video)

    return () => observer.disconnect()
  }, [])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={src}
        poster={poster}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        onEnded={(e) => e.currentTarget.play()}
      />
      {overlayClassName && <div className={`absolute inset-0 ${overlayClassName}`} />}
    </div>
  )
}
