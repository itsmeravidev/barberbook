// ─────────────────────────────────────────────────────────────────────────────
// SMS Helper — BarberBook
// Switch providers by setting VITE_SMS_PROVIDER=textbelt | twilio in .env
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER = import.meta.env.VITE_SMS_PROVIDER || 'textbelt'

// ── Textbelt ──────────────────────────────────────────────────────────────────
// Browser-safe. Free tier: key="textbelt" (1 SMS/day, any number).
// Paid: buy credits at textbelt.com — key looks like "a1b2c3d4e5..."
async function sendViaTextbelt(phone, message) {
  const res = await fetch('https://textbelt.com/text', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      phone,
      message,
      key: import.meta.env.VITE_TEXTBELT_KEY,
    }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Textbelt: SMS failed')
  return data
}

// ── Twilio ────────────────────────────────────────────────────────────────────
// Note: Auth Token lives in the browser bundle — acceptable for a private
// barber shop tool but rotate the token if the repo ever goes public.
// Twilio REST API does support browser CORS requests.
async function sendViaTwilio(phone, message) {
  const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID
  const authToken  = import.meta.env.VITE_TWILIO_AUTH_TOKEN
  const from       = import.meta.env.VITE_TWILIO_FROM_NUMBER

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method:  'POST',
      headers: {
        Authorization:  'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: from, Body: message }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Twilio: SMS failed')
  return data
}

// ── Core send ─────────────────────────────────────────────────────────────────
async function sendSMS(phone, message) {
  if (!phone?.trim()) return // silently skip — phone is optional on some bookings
  const cleaned = phone.replace(/\s/g, '')
  if (PROVIDER === 'twilio') return sendViaTwilio(cleaned, message)
  return sendViaTextbelt(cleaned, message)
}

// ── Public helpers ────────────────────────────────────────────────────────────
export async function sendApprovalSMS({ clientName, clientPhone, serviceName, date, time, adminComment }) {
  const lines = [
    `Hi ${clientName}! Your appointment is CONFIRMED ✓`,
    `Service: ${serviceName}`,
    `Date: ${date} at ${time}`,
  ]
  if (adminComment) lines.push(`Note from barber: ${adminComment}`)
  lines.push('See you then — BarberBook')
  return sendSMS(clientPhone, lines.join('\n'))
}

export async function sendRejectionSMS({ clientName, clientPhone, serviceName, date, time, adminComment }) {
  const lines = [
    `Hi ${clientName}, we couldn't confirm your appointment.`,
    `Service: ${serviceName}`,
    `Date: ${date} at ${time}`,
  ]
  if (adminComment) lines.push(`Reason: ${adminComment}`)
  lines.push('Please visit our site to choose another slot — BarberBook')
  return sendSMS(clientPhone, lines.join('\n'))
}
