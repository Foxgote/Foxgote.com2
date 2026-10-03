const TAG_ID = "AW-18457567069"
const CONVERSION_ID = `${TAG_ID}/FRBnCI_mtYAdEN2-oOFE`

export function initEnquiryTracking() {
  if (typeof window.gtag === "function") return
  window.dataLayer = window.dataLayer || []
  window.gtag = function () { window.dataLayer.push(arguments) }
  window.gtag("js", new Date())
  window.gtag("config", TAG_ID, {
    send_page_view: false,
    allow_ad_personalization_signals: false,
    allow_enhanced_conversions: false,
  })
  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${TAG_ID}`
  document.head.appendChild(script)
}

// This measures opening an enquiry draft, never a sent message or a booking.
// Do not pass form fields, message text, email addresses, or destination URLs.
export function openLessonEnquiry(url) {
  let navigated = false
  let timeout
  const navigate = () => {
    if (navigated) return
    navigated = true
    window.clearTimeout(timeout)
    window.location.assign(url)
  }
  if (typeof window.gtag !== "function") return navigate()
  timeout = window.setTimeout(navigate, 800)
  try {
    window.gtag("event", "conversion", {
      send_to: CONVERSION_ID,
      event_callback: navigate,
      event_timeout: 800,
    })
  } catch {
    navigate()
  }
}

export function onLessonEnquiryClick(event) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  openLessonEnquiry(event.currentTarget.href)
}
