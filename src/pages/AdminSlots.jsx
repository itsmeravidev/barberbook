import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const dates = Array.from({ length: 30 }, (_, i) => {
  const d = addDays(new Date(), i)
  return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE d'), sublabel: format(d, 'MMM') }
})

const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function AdminSlots() {
  const [selectedDate, setSelectedDate] = useState(dates[0].value)
  const [slots, setSlots]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [form, setForm]                 = useState({ open_from: '', open_to: '' })
  const [adding, setAdding]             = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => { fetchSlots() }, [selectedDate])

  const fetchSlots = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('slots')
      .select('*')
      .eq('date', selectedDate)
      .order('open_from')
    setSlots(data || [])
    setLoading(false)
  }

  const addSlot = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.open_from || !form.open_to) {
      setError('Both open from and open to times are required.')
      return
    }
    if (form.open_from >= form.open_to) {
      setError('Open to must be after open from.')
      return
    }

    setAdding(true)
    const { error: err } = await supabase.from('slots').insert({
      date:      selectedDate,
      open_from: form.open_from,
      open_to:   form.open_to,
    })

    if (err) {
      setError(
        err.message.includes('unique')
          ? 'An availability window starting at that time already exists.'
          : err.message
      )
    } else {
      setForm({ open_from: '', open_to: '' })
      fetchSlots()
    }
    setAdding(false)
  }

  const deleteSlot = async (id) => {
    await supabase.from('slots').delete().eq('id', id)
    fetchSlots()
  }

  return (
    <Layout isAdmin>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Availability</h1>
          <p className="text-gray-400 text-sm mt-1">
            Set the hours you're open. Clients can book any service within these windows.
          </p>
        </div>

        {/* Date strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {dates.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDate(d.value)}
              className={`flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-xl text-sm border transition-colors ${
                selectedDate === d.value
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              <span className="text-xs opacity-70">{d.sublabel}</span>
              <span className="font-semibold">{d.label.split(' ')[1]}</span>
              <span className="text-xs">{d.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Add window form */}
        <form onSubmit={addSlot} className="border border-gray-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-sm mb-3">
            Open availability on {selectedDate}
          </h2>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-gray-400 mb-1">Open from</label>
              <input
                type="time"
                value={form.open_from}
                onChange={(e) => setForm((p) => ({ ...p, open_from: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-gray-400 mb-1">Open to</label>
              <input
                type="time"
                value={form.open_to}
                onChange={(e) => setForm((p) => ({ ...p, open_to: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {adding ? 'Adding…' : '+ Add Window'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </form>

        {/* Window list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-center py-12 text-gray-300 text-sm">
            No availability set for {selectedDate}
          </p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between px-4 py-3.5 border border-gray-200 rounded-xl"
              >
                <div>
                  <p className="font-medium text-sm">
                    {fmt12(slot.open_from)} – {fmt12(slot.open_to)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Math.round(
                      (slot.open_to.split(':').reduce((a, b, i) => a + Number(b) * (i === 0 ? 60 : 1), 0) -
                       slot.open_from.split(':').reduce((a, b, i) => a + Number(b) * (i === 0 ? 60 : 1), 0))
                    )} min window — clients can book any service within this time
                  </p>
                </div>
                <button
                  onClick={() => deleteSlot(slot.id)}
                  className="text-xs text-gray-300 hover:text-red-500 transition-colors ml-4"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
