import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth } from 'date-fns'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout'

export default function AdminStats() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    supabase
      .from('appointments')
      .select('*, service:services(*)')
      .then(({ data }) => { setAppointments(data || []); setLoading(false) })
  }, [])

  const today     = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(new Date(),   { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const monStart  = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  const approved = appointments.filter((a) => a.status === 'approved')

  const thisWeek  = approved.filter((a) => a.date >= weekStart && a.date <= weekEnd).length
  const thisMonth = approved.filter((a) => a.date >= monStart).length
  const todayApts = approved.filter((a) => a.date === today).length
  const total     = approved.length

  // Most popular service
  const svcCount = {}
  for (const a of approved) {
    const name = a.service?.name || 'Unknown'
    svcCount[name] = (svcCount[name] || 0) + 1
  }
  const topService = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0]

  // Approval rate
  const totalRequests = appointments.length
  const approvalRate  = totalRequests ? Math.round((approved.length / totalRequests) * 100) : 0

  const STATS = [
    { label: 'Today',        value: String(todayApts).padStart(2, '0'), sub: 'confirmed' },
    { label: 'This Week',    value: String(thisWeek).padStart(2, '0'),  sub: 'confirmed', dark: true },
    { label: 'This Month',   value: String(thisMonth).padStart(2, '0'), sub: 'confirmed' },
    { label: 'All Time',     value: String(total).padStart(2, '0'),     sub: 'confirmed' },
    { label: 'Approval Rate',value: `${approvalRate}%`,                 sub: 'of all requests' },
    { label: 'Top Service',  value: topService?.[0] ?? '—',            sub: topService ? `${topService[1]} bookings` : '' },
  ]

  return (
    <AdminLayout>
      <h1 className="font-headline-xl text-headline-xl uppercase mb-5">Stats</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className={`border-2 border-black p-5 flex items-center justify-between ${
                s.dark ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              <div>
                <p className={`font-label-caps text-label-caps uppercase mb-2 ${s.dark ? 'opacity-60' : 'text-on-surface-variant'}`}>
                  {s.label}
                </p>
                <p className={`font-black text-4xl leading-none tabular-nums ${s.dark ? 'text-white' : 'text-black'}`}>
                  {s.value}
                </p>
                {s.sub && (
                  <p className={`font-body-md text-xs mt-1 ${s.dark ? 'opacity-50' : 'text-on-surface-variant'}`}>
                    {s.sub}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
