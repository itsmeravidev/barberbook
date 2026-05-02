import { useLocation, Link } from 'react-router-dom'
import Layout from '../components/Layout'

const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function ClientConfirm() {
  const { state }                                 = useLocation()
  const { appointment, availWindow, service, startTime, endTime } = state || {}

  if (!appointment) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-400">Nothing to show here.</p>
          <Link to="/" className="text-sm underline mt-2 inline-block">Go home</Link>
        </div>
      </Layout>
    )
  }

  const rows = [
    ['Name',    appointment.client_name],
    ['Email',   appointment.client_email],
    ['Service', service?.name],
    ['Date',    availWindow?.date],
    ['Time',    `${fmt12(startTime)} – ${fmt12(endTime)}`],
  ]

  return (
    <Layout>
      <div className="max-w-md mx-auto py-4 text-center">
        <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Request Sent!</h1>
        <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
          Your appointment request is pending review. You'll receive an email once it's approved or declined.
        </p>

        <div className="bg-gray-50 rounded-xl p-5 text-left mb-8 space-y-3.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
            <span className="text-gray-400">Status</span>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Pending
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="inline-block bg-black text-white px-7 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </Layout>
  )
}
