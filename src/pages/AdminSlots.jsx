import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const dates = Array.from({ length: 30 }, (_, i) => {
  const d = addDays(new Date(), i)
  return {
    value:  format(d, 'yyyy-MM-dd'),
    day:    format(d, 'EEE').toUpperCase(),
    date:   format(d, 'd'),
    month:  format(d, 'MMM').toUpperCase(),
  }
})

const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
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
      .from('slots').select('*').eq('date', selectedDate).order('open_from')
    setSlots(data || [])
    setLoading(false)
  }

  const addSlot = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.open_from || !form.open_to) { setError('Both times are required.'); return }
    if (form.open_from >= form.open_to)   { setError('End time must be after start time.'); return }
    setAdding(true)
    const { error: err } = await supabase.from('slots').insert({
      date: selectedDate, open_from: form.open_from, open_to: form.open_to,
    })
    if (err) setError(err.message.includes('unique') ? 'A window starting at that time already exists.' : err.message)
    else { setForm({ open_from: '', open_to: '' }); fetchSlots() }
    setAdding(false)
  }

  const deleteSlot = async (id) => {
    await supabase.from('slots').delete().eq('id', id)
    fetchSlots()
  }

  const windowMins = (slot) => {
    const [fh, fm] = slot.open_from.split(':').map(Number)
    const [th, tm] = slot.open_to.split(':').map(Number)
    return (th * 60 + tm) - (fh * 60 + fm)
  }

  return (
    <Layout isAdmin>
      {/* Page header */}
      <div className="border-b-2 border-black pb-8 mb-10">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Admin</p>
        <h1 className="font-headline-xl text-headline-xl uppercase">Availability</h1>
        <p className="font-body-md text-on-surface-variant mt-2">
          Set your working hours. Clients can book any service within these windows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        {/* Left — date + slots */}
        <div>
          {/* Date strip */}
          <div className="mb-8">
            <p className="font-label-caps text-label-caps text-black uppercase mb-4">Select Date</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {dates.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDate(d.value)}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-3 border-2 transition-all ${
                    selectedDate === d.value
                      ? 'bg-black text-white border-black'
                      : 'border-black bg-white hover:bg-black hover:text-white'
                  }`}
                >
                  <span className="font-label-caps text-[10px]">{d.month}</span>
                  <span className="font-headline-md text-xl font-black">{d.date}</span>
                  <span className="font-label-caps text-[10px]">{d.day}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slot list */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="border-2 border-black p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-surface-container-highest mb-4 block">
                calendar_today
              </span>
              <p className="font-headline-md uppercase text-on-surface-variant">No windows set</p>
              <p className="font-body-md text-sm text-on-surface-variant mt-1">
                Add an availability window using the form →
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div key={slot.id} className="border-2 border-black p-5 bg-white flex items-center justify-between">
                  <div>
                    <p className="font-headline-md text-lg uppercase tabular-nums">
                      {fmt12(slot.open_from)} – {fmt12(slot.open_to)}
                    </p>
                    <p className="font-body-md text-sm text-on-surface-variant mt-1">
                      {windowMins(slot)} min window · clients can book any service
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSlot(slot.id)}
                    className="flex items-center gap-1 font-label-caps text-label-caps uppercase text-on-surface-variant hover:text-black transition-colors ml-4 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — add form */}
        <div>
          <div className="border-2 border-black p-6 bg-white sticky top-28">
            <p className="font-label-caps text-label-caps text-black uppercase mb-6">
              Add Window for {selectedDate}
            </p>

            <form onSubmit={addSlot} className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-black uppercase">Open From</label>
                <input
                  type="time"
                  value={form.open_from}
                  onChange={(e) => setForm((p) => ({ ...p, open_from: e.target.value }))}
                  className="w-full border-0 border-b border-black bg-transparent py-3 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-black uppercase">Open Until</label>
                <input
                  type="time"
                  value={form.open_to}
                  onChange={(e) => setForm((p) => ({ ...p, open_to: e.target.value }))}
                  className="w-full border-0 border-b border-black bg-transparent py-3 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md"
                />
              </div>

              {error && (
                <p className="font-body-md text-sm text-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={adding}
                className="w-full bg-black text-white py-4 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-50 mt-2"
              >
                {adding ? 'Adding…' : '+ Add Window'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
