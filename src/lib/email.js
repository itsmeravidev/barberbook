import emailjs from '@emailjs/browser'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const TPL_APPROVED = import.meta.env.VITE_EMAILJS_TEMPLATE_APPROVED
const TPL_REJECTED = import.meta.env.VITE_EMAILJS_TEMPLATE_REJECTED

function buildParams({ clientName, clientEmail, serviceName, date, time, adminComment }) {
  return {
    to_name:          clientName,
    to_email:         clientEmail,
    service_name:     serviceName,
    appointment_date: date,
    appointment_time: time,
    admin_comment:    adminComment || '',
  }
}

export async function sendApprovalEmail(data) {
  return emailjs.send(SERVICE_ID, TPL_APPROVED, buildParams(data), PUBLIC_KEY)
}

export async function sendRejectionEmail(data) {
  return emailjs.send(SERVICE_ID, TPL_REJECTED, buildParams(data), PUBLIC_KEY)
}
