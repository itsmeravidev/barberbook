import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function ClientBook() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const { availWindow, service, startTime, endTime, services } = state || {}

  const [form, setForm]       = useState({ client_name: '', client_email: '', client_phone: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  if (!availWindow || !service || !startTime) {
    navigate('/')
    return null
  }

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.client_name.trim()) { setError('Full name is required.'); return }
    if (!form.client_email.trim()) { setError('Email address is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email)) { setError('Please enter a valid email address.'); return }
    if (!form.client_phone.trim()) { setError('Phone number is required.'); return }

    setLoading(true)
    try {
      const result = await supabase.rpc('book_slot', {
        p_slot_id:      availWindow.id,
        p_service_id:   service.id,
        p_date:         availWindow.date,
        p_start_time:   startTime,
        p_end_time:     endTime,
        p_client_name:  form.client_name,
        p_client_email: form.client_email,
        p_client_phone: form.client_phone,
        p_notes:        form.notes        || null,
      })
      if (result.error) throw result.error
      navigate('/confirm', { state: { appointment: result.data, availWindow, service, startTime, endTime } })
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      {/* Page header */}
      <div className="flex items-center gap-4 border-b-2 border-black pb-8 mb-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-10 h-10 border-2 border-black hover:bg-black hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </button>
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">Step 1 of 2</p>
          <h1 className="font-headline-lg text-headline-lg uppercase">Booking Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client info */}
          <section>
            <p className="font-label-caps text-label-caps text-black uppercase mb-6">Your Information</p>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-black uppercase">Full Name *</label>
                <input
                  name="client_name"
                  type="text"
                  value={form.client_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full border-0 border-b border-black bg-transparent py-3 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md placeholder:text-surface-container-highest"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-black uppercase">Email Address *</label>
                <input
                  name="client_email"
                  type="email"
                  value={form.client_email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full border-0 border-b border-black bg-transparent py-3 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md placeholder:text-surface-container-highest"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-black uppercase">Phone *</label>
                <input
                  name="client_phone"
                  type="tel"
                  value={form.client_phone}
                  onChange={handleChange}
                  placeholder="+1 (000) 000-0000"
                  className="w-full border-0 border-b border-black bg-transparent py-3 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md placeholder:text-surface-container-highest"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-black uppercase">
                  Notes <span className="text-on-surface-variant normal-case font-body-md tracking-normal">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Anything the barber should know…"
                  className="w-full border-0 border-b border-black bg-transparent py-3 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md placeholder:text-surface-container-highest resize-none"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-error-container border border-error px-4 py-3">
              <p className="font-body-md text-error text-sm">{error}</p>
            </div>
          )}

          {/* Submit — desktop */}
          <div className="hidden lg:block pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-5 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Request Appointment'}
            </button>
          </div>
        </form>

        {/* Summary panel */}
        <div>
          <div className="border-2 border-black p-6 bg-white sticky top-28">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6">Booking Summary</p>

            {/* Service */}
            <div className="bg-black text-white p-5 mb-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-headline-md text-lg uppercase">{service.name}</h3>
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-white">schedule</span>
                <span className="font-label-caps text-[10px] uppercase text-white opacity-70">
                  {service.duration_minutes} mins
                </span>
              </div>
            </div>

            {/* Date & time */}
            <div className="flex items-center gap-4 border-2 border-black p-4 mb-4">
              <div className="flex flex-col items-center justify-center bg-black text-white w-14 h-14 flex-shrink-0">
                <span className="font-label-caps text-[10px]">
                  {new Date(availWindow.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                </span>
                <span className="font-headline-md text-xl font-black">
                  {new Date(availWindow.date).getUTCDate()}
                </span>
              </div>
              <div>
                <p className="font-headline-md text-base uppercase">
                  {fmt12(startTime)} – {fmt12(endTime)}
                </p>
                <p className="font-body-md text-sm text-on-surface-variant mt-0.5">
                  {new Date(availWindow.date).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}
                </p>
              </div>
            </div>

            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">
              Your request will be reviewed and you'll receive a confirmation email.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black px-6 py-5 z-50">
        <button
          onClick={(e) => handleSubmit(e)}
          disabled={loading}
          className="w-full bg-black text-white py-5 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Request Appointment'}
        </button>
      </div>
    </Layout>
  )
}
