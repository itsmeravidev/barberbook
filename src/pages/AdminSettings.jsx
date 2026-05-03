import { useState } from 'react'
import AdminSlots    from './AdminSlots'
import AdminServices from './AdminServices'
import AdminLayout   from '../components/AdminLayout'

export default function AdminSettings() {
  const [tab, setTab] = useState('availability')

  return (
    <AdminLayout>
      <h1 className="font-headline-xl text-headline-xl uppercase mb-5">Settings</h1>

      {/* Sub-tabs */}
      <div className="flex border-b-2 border-black mb-6">
        {['availability', 'services'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 font-label-caps text-label-caps uppercase tracking-widest transition-all ${
              tab === t ? 'bg-black text-white' : 'text-on-surface-variant hover:text-black'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Render the chosen sub-page content without their outer Layout */}
      {tab === 'availability' ? <SlotContent /> : <ServiceContent />}
    </AdminLayout>
  )
}

// ── Inline slot management (no outer layout) ──────────────────────────────
import { useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { supabase } from '../lib/supabase'

const dates = Array.from({ length: 30 }, (_, i) => {
  const d = addDays(new Date(), i)
  return { value: format(d, 'yyyy-MM-dd'), day: format(d, 'EEE').toUpperCase(), date: format(d, 'd'), month: format(d, 'MMM').toUpperCase() }
})

const fmt12s = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` }

function SlotContent() {
  const [selectedDate, setSelectedDate] = useState(dates[0].value)
  const [slots, setSlots]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [form, setForm]                 = useState({ open_from: '', open_to: '' })
  const [adding, setAdding]             = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => { fetchSlots() }, [selectedDate])

  const fetchSlots = async () => {
    setLoading(true)
    const { data } = await supabase.from('slots').select('*').eq('date', selectedDate).order('open_from')
    setSlots(data || [])
    setLoading(false)
  }

  const addSlot = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.open_from || !form.open_to) { setError('Both times required.'); return }
    if (form.open_from >= form.open_to)   { setError('End must be after start.'); return }
    setAdding(true)
    const { error: err } = await supabase.from('slots').insert({ date: selectedDate, open_from: form.open_from, open_to: form.open_to })
    if (err) setError(err.message.includes('unique') ? 'Window at that time already exists.' : err.message)
    else { setForm({ open_from: '', open_to: '' }); fetchSlots() }
    setAdding(false)
  }

  return (
    <div>
      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {dates.map((d) => (
          <button key={d.value} onClick={() => setSelectedDate(d.value)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 border-2 transition-all ${selectedDate === d.value ? 'bg-black text-white border-black' : 'border-black bg-white hover:bg-black hover:text-white'}`}>
            <span className="font-label-caps text-[9px]">{d.month}</span>
            <span className="font-black text-lg">{d.date}</span>
            <span className="font-label-caps text-[9px]">{d.day}</span>
          </button>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={addSlot} className="border-2 border-black p-4 mb-5 space-y-4">
        <p className="font-label-caps text-label-caps uppercase">Add Window — {selectedDate}</p>
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="font-label-caps text-[10px] uppercase text-on-surface-variant">From</label>
            <input type="time" value={form.open_from} onChange={(e) => setForm((p) => ({ ...p, open_from: e.target.value }))}
              className="border-0 border-b border-black bg-transparent py-2 focus:outline-none focus:border-b-2 font-body-md transition-all" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="font-label-caps text-[10px] uppercase text-on-surface-variant">Until</label>
            <input type="time" value={form.open_to} onChange={(e) => setForm((p) => ({ ...p, open_to: e.target.value }))}
              className="border-0 border-b border-black bg-transparent py-2 focus:outline-none focus:border-b-2 font-body-md transition-all" />
          </div>
        </div>
        {error && <p className="font-body-md text-sm text-error">{error}</p>}
        <button type="submit" disabled={adding}
          className="w-full bg-black text-white py-3 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-50">
          {adding ? 'Adding…' : '+ Add'}
        </button>
      </form>

      {/* Slot list */}
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>
        : slots.length === 0 ? <p className="text-center py-8 font-body-md text-on-surface-variant">No windows for {selectedDate}</p>
        : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <div key={slot.id} className="border-2 border-black p-4 flex justify-between items-center">
                <p className="font-headline-md text-base tabular-nums">{fmt12s(slot.open_from)} – {fmt12s(slot.open_to)}</p>
                <button onClick={() => { supabase.from('slots').delete().eq('id', slot.id).then(fetchSlots) }}
                  className="font-label-caps text-[10px] uppercase text-on-surface-variant hover:text-black transition-colors">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

// ── Inline service management ─────────────────────────────────────────────
function ServiceContent() {
  const [services, setServices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    supabase.from('services').select('*').order('duration_minutes')
      .then(({ data }) => { setServices(data || []); setLoading(false) })
  }, [])

  const save = async (svc) => {
    const d = parseInt(editValue, 10)
    if (isNaN(d) || d < 1) return
    setSaving(true)
    await supabase.from('services').update({ duration_minutes: d }).eq('id', svc.id)
    setEditing(null)
    supabase.from('services').select('*').order('duration_minutes').then(({ data }) => setServices(data || []))
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-3">
      {services.map((svc) => (
        <div key={svc.id} className="border-2 border-black bg-white p-4 flex items-center justify-between">
          <p className="font-headline-md text-base uppercase">{svc.name}</p>
          {editing === svc.id ? (
            <div className="flex items-center gap-2">
              <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save(svc)} autoFocus
                className="w-14 border-0 border-b-2 border-black bg-transparent text-center py-1 focus:outline-none font-black text-lg tabular-nums" min="1" />
              <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">min</span>
              <button onClick={() => save(svc)} disabled={saving}
                className="bg-black text-white px-3 py-1.5 font-label-caps text-[10px] uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-50">
                {saving ? '…' : 'Save'}
              </button>
              <button onClick={() => setEditing(null)} className="text-on-surface-variant hover:text-black transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-black text-xl tabular-nums">{svc.duration_minutes}<span className="font-body-md text-xs text-on-surface-variant ml-1">min</span></span>
              <button onClick={() => { setEditing(svc.id); setEditValue(String(svc.duration_minutes)) }}
                className="font-label-caps text-[10px] uppercase border-2 border-black px-3 py-1.5 hover:bg-black hover:text-white transition-all">
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
