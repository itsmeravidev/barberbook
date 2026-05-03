import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout'

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    supabase
      .from('appointments')
      .select('client_name, client_email, client_phone, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        // Deduplicate by email, keeping most recent + booking count
        const map = new Map()
        for (const a of data || []) {
          if (!map.has(a.client_email)) {
            map.set(a.client_email, { ...a, count: 1 })
          } else {
            map.get(a.client_email).count++
          }
        }
        setClients([...map.values()])
        setLoading(false)
      })
  }, [])

  const filtered = clients.filter((c) =>
    c.client_name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <h1 className="font-headline-xl text-headline-xl uppercase mb-5">Clients</h1>

      {/* Search */}
      <div className="flex flex-col gap-1 mb-6">
        <label className="font-label-caps text-label-caps text-black uppercase">Search</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or email…"
          className="w-full border-0 border-b border-black bg-transparent py-3 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md placeholder:text-surface-container-highest"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-2 border-black p-12 text-center">
          <p className="font-body-md text-on-surface-variant">No clients found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.client_email} className="border-2 border-black bg-white p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-headline-md text-base leading-tight truncate">{c.client_name}</p>
                <p className="font-body-md text-sm text-on-surface-variant truncate">{c.client_email}</p>
                {c.client_phone && (
                  <p className="font-body-md text-sm text-on-surface-variant">{c.client_phone}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-2xl tabular-nums">{c.count}</p>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">booking{c.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
