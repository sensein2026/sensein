/**
 * Luxury Fly-to-Cart Animation Utility
 * Spawns a floating product thumbnail that curves and flies into the navbar cart bag icon with a bounce effect.
 */
export function triggerFlyToCart(imageSrc, startTarget) {
  if (typeof window === 'undefined' || !imageSrc) return

  // Find starting element / event rect
  let startRect = null
  if (startTarget) {
    if (startTarget instanceof HTMLElement) {
      startRect = startTarget.getBoundingClientRect()
    } else if (startTarget?.currentTarget instanceof HTMLElement) {
      startRect = startTarget.currentTarget.getBoundingClientRect()
    } else if (startTarget?.target instanceof HTMLElement) {
      startRect = startTarget.target.getBoundingClientRect()
    }
  }

  // Calculate starting center position
  const startX = startRect && startRect.width > 0
    ? startRect.left + startRect.width / 2
    : window.innerWidth / 2
  const startY = startRect && startRect.height > 0
    ? startRect.top + startRect.height / 2
    : window.innerHeight / 2

  // Find destination cart icon in navbar (Mobile or Desktop)
  const cartButtons = document.querySelectorAll('[data-nav-cart-btn]')
  let visibleCartBtn = null

  cartButtons.forEach((btn) => {
    const rect = btn.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      visibleCartBtn = btn
    }
  })

  if (!visibleCartBtn) {
    visibleCartBtn =
      document.getElementById('mobile-nav-cart-btn') ||
      document.getElementById('desktop-nav-cart-btn')
  }

  const endRect = visibleCartBtn ? visibleCartBtn.getBoundingClientRect() : null
  const endX = endRect && endRect.width > 0
    ? endRect.left + endRect.width / 2
    : window.innerWidth - 36
  const endY = endRect && endRect.height > 0
    ? endRect.top + endRect.height / 2
    : 36

  // Create flying particle container
  const flyer = document.createElement('div')
  flyer.className = 'fly-to-cart-particle'
  flyer.style.cssText = `
    position: fixed;
    z-index: 999999;
    left: ${startX}px;
    top: ${startY}px;
    width: 64px;
    height: 64px;
    margin-left: -32px;
    margin-top: -32px;
    border-radius: 14px;
    overflow: hidden;
    pointer-events: none;
    box-shadow: 0 12px 28px rgba(90, 56, 89, 0.45), 0 0 0 2.5px #5A3859;
    background: #FAF7F9;
    transform: translate3d(0,0,0) scale(1.1) rotate(0deg);
    opacity: 1;
    transition: transform 0.75s cubic-bezier(0.2, 0.8, 0.25, 1), opacity 0.75s cubic-bezier(0.5, 0, 1, 1);
  `

  const img = document.createElement('img')
  img.src = imageSrc
  img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;'
  flyer.appendChild(img)
  document.body.appendChild(flyer)

  // Force reflow
  void flyer.getBoundingClientRect()

  // Calculate translation deltas
  const deltaX = endX - startX
  const deltaY = endY - startY

  requestAnimationFrame(() => {
    flyer.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.18) rotate(20deg)`
    flyer.style.opacity = '0.3'
  })

  // Cleanup & trigger cart icon bounce
  setTimeout(() => {
    if (flyer.parentNode) {
      flyer.parentNode.removeChild(flyer)
    }

    if (visibleCartBtn) {
      visibleCartBtn.classList.remove('cart-bounce-animation')
      void visibleCartBtn.offsetWidth // trigger reflow
      visibleCartBtn.classList.add('cart-bounce-animation')
    }
  }, 750)
}
