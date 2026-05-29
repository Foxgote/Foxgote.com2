const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails"
const FALLBACK_TO_EMAIL = "hello@foxgote.com"
const DEFAULT_SUBJECT = "Booking inquiry"
const MAX_EMAIL_LENGTH = 254
const MAX_SUBJECT_LENGTH = 160
const MAX_CONTENT_LENGTH = 6000

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}

function cleanString(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength)
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request)
  if (!body) {
    return jsonResponse({ ok: false, error: "Invalid form payload." }, 400)
  }

  const website = cleanString(body.website, 100)
  if (website) {
    return jsonResponse({ ok: true })
  }

  const email = cleanString(body.email, MAX_EMAIL_LENGTH)
  const cc = cleanString(body.cc, MAX_EMAIL_LENGTH)
  const subject = cleanString(body.subject, MAX_SUBJECT_LENGTH) || DEFAULT_SUBJECT
  const content = cleanString(body.content, MAX_CONTENT_LENGTH)
  const toEmail = cleanString(env.CONTACT_TO_EMAIL, MAX_EMAIL_LENGTH) || FALLBACK_TO_EMAIL
  const fromEmail = cleanString(env.CONTACT_FROM_EMAIL, 320)

  if (!email || !isEmail(email)) {
    return jsonResponse({ ok: false, error: "Please enter a valid email address." }, 400)
  }

  if (cc && !isEmail(cc)) {
    return jsonResponse({ ok: false, error: "Please enter a valid CC email address." }, 400)
  }

  if (!env.RESEND_API_KEY || !fromEmail) {
    return jsonResponse(
      {
        ok: false,
        error: "Email is not configured yet.",
      },
      500,
    )
  }

  const text = [
    `Reply to: ${email}`,
    cc ? `CC requested: ${cc}` : "",
    "",
    content || "(No message content.)",
  ].filter(Boolean).join("\n")

  const resendPayload = {
    from: fromEmail,
    to: [toEmail],
    reply_to: email,
    subject,
    text,
  }

  const resendResponse = await fetch(RESEND_EMAILS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resendPayload),
  })

  if (!resendResponse.ok) {
    return jsonResponse({ ok: false, error: "Email could not be sent." }, 502)
  }

  return jsonResponse({ ok: true })
}

export async function onRequestGet() {
  return jsonResponse({ ok: false, error: "Method not allowed." }, 405)
}
