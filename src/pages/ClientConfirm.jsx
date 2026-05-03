import { useLocation, Link } from 'react-router-dom'
import Layout from '../components/Layout'

const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function ClientConfirm() {
  const { state }                                          = useLocation()
  const { appointment, availWindow, service, startTime, endTime } = state || {}

  if (!appointment) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="font-body-md text-on-surface-variant mb-4">Nothing to show here.</p>
          <Link to="/" className="font-label-caps text-label-caps uppercase tracking-widest underline">
            Return to Booking
          </Link>
        </div>
      </Layout>
    )
  }

  const rows = [
    { label: 'Service', value: service?.name },
    { label: 'Date',    value: new Date(availWindow?.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) },
    { label: 'Time',    value: `${fmt12(startTime)} – ${fmt12(endTime)}` },
    { label: 'Name',    value: appointment.client_name },
    { label: 'Email',   value: appointment.client_email },
  ]

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-8">
        {/* Success icon */}
        <div className="text-center mb-10">
          <span
            className="material-symbols-outlined text-[96px] text-black block mb-6"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <h1 className="font-headline-xl text-headline-xl uppercase mb-4">Request Sent</h1>
          <p className="font-body-lg text-secondary max-w-xs mx-auto">
            Your booking request has been dispatched to the barber for final confirmation.
          </p>
        </div>

        {/* Summary card */}
        <div className="border-2 border-black p-6 bg-white mb-8">
          <div className="flex justify-between items-start mb-6 pb-5 border-b border-surface-container-highest">
            <div>
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-2">Service</p>
              <h2 className="font-headline-md text-headline-md uppercase">{service?.name}</h2>
            </div>
            <div className="flex flex-col items-center justify-center bg-black text-white w-14 h-14 flex-shrink-0">
              <span className="font-label-caps text-[10px]">
                {new Date(availWindow?.date).toLocaleString('default', { month: 'short', timeZone: 'UTC' }).toUpperCase()}
              </span>
              <span className="font-black text-xl leading-none">
                {new Date(availWindow?.date).getUTCDate()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {rows.slice(1).map(({ label, value }) => (
              <div key={label} className={label === 'Date' || label === 'Email' ? 'col-span-2' : ''}>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-1">{label}</p>
                <p className="font-body-md font-semibold">{value}</p>
              </div>
            ))}
            <div className="col-span-2 pt-4 border-t border-surface-container-highest">
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-2">Status</p>
              <span className="inline-block bg-black text-white font-label-caps text-label-caps uppercase tracking-widest px-4 py-2">
                Pending Review
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full text-center bg-black text-white py-5 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all"
          >
            Return to Booking
          </Link>
        </div>

        {/* Note */}
        <p className="text-center font-label-caps text-[10px] text-on-secondary-container uppercase tracking-widest mt-8">
          A confirmation email will be sent to {appointment.client_email}
        </p>
      </div>
    </Layout>
  )
}
