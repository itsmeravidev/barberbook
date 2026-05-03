import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function AdminServices() {
  const [services, setServices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => { fetchServices() }, [])

  const fetchServices = async () => {
    setLoading(true)
    const { data } = await supabase.from('services').select('*').order('duration_minutes')
    setServices(data || [])
    setLoading(false)
  }

  const startEdit = (svc) => {
    setEditing(svc.id)
    setEditValue(String(svc.duration_minutes))
    setError('')
  }

  const saveEdit = async (svc) => {
    const duration = parseInt(editValue, 10)
    if (isNaN(duration) || duration < 1) { setError('Must be a positive number.'); return }
    setSaving(true)
    const { error: err } = await supabase
      .from('services').update({ duration_minutes: duration }).eq('id', svc.id)
    if (err) setError(err.message)
    else { setEditing(null); fetchServices() }
    setSaving(false)
  }

  return (
    <Layout isAdmin>
      {/* Page header */}
      <div className="border-b-2 border-black pb-8 mb-10">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Admin</p>
        <h1 className="font-headline-xl text-headline-xl uppercase">Services</h1>
        <p className="font-body-md text-on-surface-variant mt-2">
          Duration changes apply to all future bookings.
        </p>
      </div>

      <div className="max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((svc) => (
              <div key={svc.id} className="border-2 border-black bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-md text-lg uppercase">{svc.name}</h3>
                  </div>

                  {editing === svc.id ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(svc)}
                          className="w-16 border-0 border-b-2 border-black bg-transparent py-1 text-center focus:outline-none font-headline-md text-lg tabular-nums"
                          min="1"
                          autoFocus
                        />
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">min</span>
                      </div>
                      <button
                        onClick={() => saveEdit(svc)}
                        disabled={saving}
                        className="bg-black text-white px-4 py-2 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-50"
                      >
                        {saving ? '…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="p-2 text-on-surface-variant hover:text-black transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p className="font-headline-md text-2xl font-black tabular-nums">{svc.duration_minutes}</p>
                        <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">minutes</p>
                      </div>
                      <button
                        onClick={() => startEdit(svc)}
                        className="bg-white text-black px-4 py-2 font-label-caps text-label-caps uppercase tracking-widest hover:bg-black hover:text-white border-2 border-black transition-all"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {editing === svc.id && error && (
                  <p className="font-body-md text-sm text-error mt-3">{error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border-2 border-surface-container-highest p-5 mt-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-sm text-on-surface-variant mt-0.5">info</span>
            <p className="font-body-md text-sm text-on-surface-variant">
              Service durations determine available booking windows. Shorter services unlock more available time slots for clients.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
