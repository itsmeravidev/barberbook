import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
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
        p_client_phone: form.client_phone || null,
        p_notes:        form.notes        || null,
      })

      if (result.error) throw result.error

      navigate('/confirm', {
        state: { appointment: result.data, availWindow, service, startTime, endTime },
      })
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-black mb-5 flex items-center gap-1 transition-colors"
        >
          ← Back to slots
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Request Appointment</h1>

          {/* Summary pill */}
          <div className="mt-3 inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <span className="font-semibold text-sm">{service.name}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500 tabular-nums">
              {fmt12(startTime)} – {fmt12(endTime)}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{availWindow.date}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name *</label>
            <input
              name="client_name"
              type="text"
              value={form.client_name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email *</label>
            <input
              name="client_email"
              type="email"
              value={form.client_email}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              name="client_phone"
              type="tel"
              value={form.client_phone}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Anything the barber should know…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting…' : 'Request Appointment'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
