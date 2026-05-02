import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function AdminServices() {
  const [services, setServices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null) // service id
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => { fetchServices() }, [])

  const fetchServices = async () => {
    setLoading(true)
    const { data } = await supabase.from('services').select('*').order('name')
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
    if (isNaN(duration) || duration < 1) {
      setError('Duration must be a positive whole number.')
      return
    }

    setSaving(true)
    const { error: err } = await supabase
      .from('services')
      .update({ duration_minutes: duration })
      .eq('id', svc.id)

    if (err) {
      setError(err.message)
    } else {
      setEditing(null)
      fetchServices()
    }
    setSaving(false)
  }

  const cancelEdit = () => {
    setEditing(null)
    setError('')
  }

  return (
    <Layout isAdmin>
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-gray-400 text-sm mt-1">
            Duration changes apply to all future bookings.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((svc) => (
              <div key={svc.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{svc.name}</p>

                  {editing === svc.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(svc)}
                        className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-black tabular-nums"
                        min="1"
                        autoFocus
                      />
                      <span className="text-xs text-gray-400">min</span>
                      <button
                        onClick={() => saveEdit(svc)}
                        disabled={saving}
                        className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        {saving ? '…' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-sm text-gray-400 hover:text-black transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 tabular-nums">
                        {svc.duration_minutes} min
                      </span>
                      <button
                        onClick={() => startEdit(svc)}
                        className="text-xs text-gray-400 hover:text-black underline transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {editing === svc.id && error && (
                  <p className="text-xs text-red-600 mt-2">{error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
