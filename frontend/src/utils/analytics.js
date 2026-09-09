/**
 * Sensein Multi-Channel Analytics Engine
 * Connects Google Analytics (GA4), Meta Pixel, Microsoft Clarity, and In-House Telemetry
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://sp-server-l17c.onrender.com/api'

let isInitialized = false
let trackingConfig = {
  googleAnalyticsId: '',
  clarityId: '',
  metaPixelId: '',
}

// Get or create anonymous session ID
export function getSessionId() {
  let sId = localStorage.getItem('sensein_analytics_session')
  if (!sId) {
    sId = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
    localStorage.setItem('sensein_analytics_session', sId)
  }
  return sId
}

// Extract UTM parameters from current URL
export function getUtmParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
  }
}

// Dynamically inject GA4
function injectGA4(measurementId) {
  if (!measurementId || document.getElementById('ga4-script')) return
  const script = document.createElement('script')
  script.id = 'ga4-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', measurementId, { send_page_view: false })
}

// Dynamically inject Microsoft Clarity
function injectClarity(clarityId) {
  if (!clarityId || window.clarity) return
  ;(function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        ;(c[a].q = c[a].q || []).push(arguments)
      }
    t = l.createElement(r)
    t.async = 1
    t.src = 'https://www.clarity.ms/tag/' + i
    y = l.getElementsByTagName(r)[0]
    y.parentNode.insertBefore(t, y)
  })(window, document, 'clarity', 'script', clarityId)
}

// Dynamically inject Meta Pixel
function injectMetaPixel(pixelId) {
  if (!pixelId || window.fbq) return
  ;(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  window.fbq('init', pixelId)
}

// Initialize and fetch active tracking IDs
export async function initAnalytics() {
  if (isInitialized || typeof window === 'undefined') return
  isInitialized = true

  try {
    const res = await fetch(`${API_URL}/analytics/config`)
    const json = await res.json()
    if (json.success && json.data) {
      trackingConfig = json.data
      if (trackingConfig.googleAnalyticsId) injectGA4(trackingConfig.googleAnalyticsId)
      if (trackingConfig.clarityId) injectClarity(trackingConfig.clarityId)
      if (trackingConfig.metaPixelId) injectMetaPixel(trackingConfig.metaPixelId)
    }
  } catch (err) {
    // Non-blocking fallback
  }
}

// Send event to backend & third party pixels
async function sendEvent(eventType, metadata = {}, pageOverride = '') {
  const page = pageOverride || (typeof window !== 'undefined' ? window.location.pathname : '/')
  const utm = getUtmParams()
  const referrer = typeof document !== 'undefined' ? document.referrer : 'direct'

  // 1. Send to GA4
  if (window.gtag) {
    window.gtag('event', eventType, { ...metadata, page_path: page })
  }

  // 2. Send to Meta Pixel
  if (window.fbq) {
    if (eventType === 'page_view') window.fbq('track', 'PageView')
    else if (eventType === 'view_item') window.fbq('track', 'ViewContent', metadata)
    else if (eventType === 'add_to_cart') window.fbq('track', 'AddToCart', metadata)
    else if (eventType === 'begin_checkout') window.fbq('track', 'InitiateCheckout', metadata)
    else if (eventType === 'purchase') window.fbq('track', 'Purchase', metadata)
  }

  // 3. Send to In-House Backend Telemetry
  try {
    fetch(`${API_URL}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        sessionId: getSessionId(),
        page,
        pageTitle: typeof document !== 'undefined' ? document.title : '',
        referrer,
        ...utm,
        metadata,
      }),
    }).catch(() => {})
  } catch (e) {
    // Ignore network drop
  }
}

// Public API
export function trackPageView(pagePath, title) {
  sendEvent('page_view', { page_title: title }, pagePath)
}

export function trackProductView(product) {
  if (!product) return
  sendEvent('view_item', {
    productId: product._id || product.id,
    productName: product.name,
    price: product.price,
    category: product.category?.name || product.category || 'General',
  })
}

export function trackAddToCart(product, quantity = 1) {
  if (!product) return
  sendEvent('add_to_cart', {
    productId: product._id || product.id,
    productName: product.name,
    price: product.price,
    quantity,
    value: (product.price || 0) * quantity,
    currency: 'INR',
  })
}

export function trackBeginCheckout(items = [], totalAmount = 0) {
  sendEvent('begin_checkout', {
    itemsCount: items.length,
    orderAmount: totalAmount,
    currency: 'INR',
  })
}

export function trackPurchase(order) {
  if (!order) return
  sendEvent('purchase', {
    orderId: order._id || order.orderId,
    orderAmount: order.totalAmount || order.amount,
    itemsCount: order.items?.length || 1,
    currency: 'INR',
  })
}
