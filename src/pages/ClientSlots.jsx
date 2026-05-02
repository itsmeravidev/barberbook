import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const dates = Array.from({ length: 14 }, (_, i) => {
  const d = addDays(new Date(), i)
  return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE d'), sublabel: format(d, 'MMM') }
})

// "17:30" → minutes since midnight (1050)
const toMins = (t) => {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

// 1050 → "17:30"
const toTime = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// "17:30" → "5:30 PM"
const fmt12 = (t) => {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Build all available start times for the selected service across all windows,
// skipping any time that would overlap with an existing pending/approved appointment.
function calcAvailableTimes(windows, appointments, serviceDuration) {
  if (!windows.length || !serviceDuration) return []

  const blocked = appointments.filter((a) => ['pending', 'approved'].includes(a.status))
  const results = []

  for (const win of windows) {
    const winStart = toMins(win.open_from)
    const winEnd   = toMins(win.open_to)
    let t = winStart

    while (t + serviceDuration <= winEnd) {
      const tEnd = t + serviceDuration

      const overlaps = blocked.some((a) => {
        const aStart = toMins(a.start_time)
        const aEnd   = toMins(a.end_time)
        return t < aEnd && tEnd > aStart
      })

      if (!overlaps) {
        results.push({
          startTime: toTime(t),
          endTime:   toTime(tEnd),
          windowId:  win.id,
        })
      }

      t += 15 // offer start times every 15 minutes
    }
  }

  return results
}

export default function ClientSlots() {
  const [selectedDate, setSelectedDate]       = useState(dates[0].value)
  const [services, setServices]               = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [windows, setWindows]                 = useState([])
  const [appointments, setAppointments]       = useState([])
  const [loading, setLoading]                 = useState(true)
  const navigate = useNavigate()

  // Fetch services once
  useEffect(() => {
    supabase.from('services').select('*').order('duration_minutes').then(({ data }) => {
      const svcs = data || []
      setServices(svcs)
      if (svcs.length) setSelectedService(svcs[0])
    })
  }, [])

  // Fetch availability windows + existing appointments when date changes
  useEffect(() => {
    fetchForDate()
  }, [selectedDate])

  const fetchForDate = async () => {
    setLoading(true)
    const [{ data: wins }, { data: appts }] = await Promise.all([
      supabase.from('slots').select('*').eq('date', selectedDate).order('open_from'),
      supabase.from('appointments').select('*').eq('date', selectedDate),
    ])
    setWindows(wins || [])
    setAppointments(appts || [])
    setLoading(false)
  }

  const availableTimes = useMemo(
    () => calcAvailableTimes(windows, appointments, selectedService?.duration_minutes),
    [windows, appointments, selectedService]
  )

  const handlePick = (time) => {
    const win = windows.find((w) => w.id === time.windowId)
    navigate('/book', {
      state: {
        availWindow: win,
        service:     selectedService,
        startTime:   time.startTime,
        endTime:     time.endTime,
        services,
      },
    })
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Book an Appointment</h1>
          <p className="text-gray-400 text-sm mt-1">Pick a service, then choose your time</p>
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

        {/* Service selector */}
        {services.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Select service</p>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                    selectedService?.id === s.id
                      ? 'bg-black text-white border-black'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {s.name}
                  <span className={`ml-1.5 text-xs ${selectedService?.id === s.id ? 'opacity-60' : 'text-gray-400'}`}>
                    {s.duration_minutes} min
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time slots */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
          </div>
        ) : windows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-300 text-4xl mb-3">✂</p>
            <p className="text-gray-500 font-medium">No availability set for this date</p>
            <p className="text-gray-400 text-sm mt-1">Try selecting a different date</p>
          </div>
        ) : availableTimes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 font-medium">No open slots for {selectedService?.name}</p>
            <p className="text-gray-400 text-sm mt-1">
              All times are taken — try a different date or service
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Available times · {selectedService?.name} ({selectedService?.duration_minutes} min)
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableTimes.map((t) => (
                <button
                  key={t.startTime}
                  onClick={() => handlePick(t)}
                  className="group p-3 border border-gray-200 rounded-xl hover:border-black hover:shadow-md transition-all text-left"
                >
                  <p className="font-bold text-sm tabular-nums">{fmt12(t.startTime)}</p>
                  <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                    – {fmt12(t.endTime)}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
