import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const TIME_SECTIONS = [
  { label: 'Morning',   icon: 'wb_sunny',  test: (m) => m < 720  },
  { label: 'Afternoon', icon: 'wb_cloudy', test: (m) => m >= 720 && m < 1020 },
  { label: 'Evening',   icon: 'dark_mode', test: (m) => m >= 1020 },
]

const toMins = (t) => { const [h, m] = t.slice(0, 5).split(':').map(Number); return h * 60 + m }
const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const fmt12  = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` }

// Build dates fresh each render so past dates never appear after midnight or a cached load
function buildDates() {
  const today = format(new Date(), 'yyyy-MM-dd')
  return Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i)
    return {
      value: format(d, 'yyyy-MM-dd'),
      day:   format(d, 'EEE').toUpperCase(),
      date:  format(d, 'd'),
      month: format(d, 'MMM').toUpperCase(),
      full:  format(d, 'EEEE, MMM d'),
    }
  }).filter((d) => d.value >= today) // safety: never show past dates
}

function calcAvailableTimes(windows, appointments, duration, selectedDate) {
  if (!windows.length || !duration) return []

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  // For today, block any slot whose start time has already passed (add 15min buffer)
  const nowMins = selectedDate === todayStr
    ? toMins(format(new Date(), 'HH:mm')) + 15
    : 0

  const blocked = appointments.filter((a) => ['pending', 'approved'].includes(a.status))
  const results = []

  for (const win of windows) {
    let t = toMins(win.open_from)
    const end = toMins(win.open_to)
    while (t + duration <= end) {
      const tEnd = t + duration

      // Skip times that have already passed today
      if (t < nowMins) { t += 15; continue }

      const overlaps = blocked.some((a) => {
        const aStart = toMins(a.start_time)
        const aEnd   = toMins(a.end_time)
        return t < aEnd && tEnd > aStart
      })

      if (!overlaps) results.push({ startTime: toTime(t), endTime: toTime(tEnd), windowId: win.id })
      t += 15
    }
  }
  return results
}

export default function ClientSlots() {
  const dates = useMemo(() => buildDates(), [])
  const [selectedDate, setSelectedDate]       = useState(() => buildDates()[0].value)
  const [services, setServices]               = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [windows, setWindows]                 = useState([])
  const [appointments, setAppointments]       = useState([])
  const [loading, setLoading]                 = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('services').select('*').order('duration_minutes').then(({ data }) => {
      const svcs = data || []
      setServices(svcs)
      if (svcs.length) setSelectedService(svcs[0])
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('slots').select('*').eq('date', selectedDate).order('open_from'),
      supabase.from('appointments').select('*').eq('date', selectedDate),
    ]).then(([{ data: wins }, { data: appts }]) => {
      setWindows(wins || [])
      setAppointments(appts || [])
      setLoading(false)
    })
  }, [selectedDate])

  const availableTimes = useMemo(
    () => calcAvailableTimes(windows, appointments, selectedService?.duration_minutes, selectedDate),
    [windows, appointments, selectedService, selectedDate]
  )

  const handlePick = (time) => {
    const win = windows.find((w) => w.id === time.windowId)
    navigate('/book', { state: { availWindow: win, service: selectedService, startTime: time.startTime, endTime: time.endTime, services } })
  }

  const selectedDateObj = dates.find((d) => d.value === selectedDate)

  return (
    <Layout>
      {/* Page header */}
      <div className="border-b-2 border-black pb-8 mb-10">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Online Booking</p>
        <h1 className="font-headline-xl text-headline-xl uppercase">Book Your Visit</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
        {/* Left column */}
        <div>
          {/* Date strip */}
          <div className="mb-10">
            <p className="font-label-caps text-label-caps text-black uppercase mb-4">Select Date</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {dates.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDate(d.value)}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-3 border-2 transition-all ${
                    selectedDate === d.value
                      ? 'bg-black text-white border-black'
                      : 'border-black bg-white text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <span className="font-label-caps text-[10px]">{d.month}</span>
                  <span className="font-headline-md text-xl font-black">{d.date}</span>
                  <span className="font-label-caps text-[10px]">{d.day}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Service selector */}
          {services.length > 0 && (
            <div className="mb-10">
              <p className="font-label-caps text-label-caps text-black uppercase mb-4">Select Service</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {services.map((s) => {
                  const active = selectedService?.id === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className={`group relative text-left border-2 border-black p-5 transition-all overflow-hidden ${
                        active ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'
                      }`}
                    >
                      <div className="flex justify-between items-start relative z-10">
                        <h3 className="font-headline-md text-lg uppercase">{s.name}</h3>
                        {active && (
                          <span className="material-symbols-filled text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 relative z-10">
                        <span className={`material-symbols-outlined text-sm ${active ? 'text-white' : 'text-black group-hover:text-white'}`}>
                          schedule
                        </span>
                        <span className={`font-label-caps text-[10px] uppercase ${active ? 'text-white' : 'text-on-surface-variant group-hover:text-white'}`}>
                          {s.duration_minutes} mins
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Time grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : windows.length === 0 ? (
            <div className="border-2 border-black p-12 text-center bg-white">
              <span className="material-symbols-outlined text-4xl text-surface-container-highest mb-4 block">event_busy</span>
              <p className="font-headline-md uppercase mb-2">No Availability</p>
              <p className="font-body-md text-on-surface-variant">No slots set for this date. Try another day.</p>
            </div>
          ) : availableTimes.length === 0 ? (
            <div className="border-2 border-black p-12 text-center bg-white">
              <span className="material-symbols-outlined text-4xl text-surface-container-highest mb-4 block">schedule</span>
              <p className="font-headline-md uppercase mb-2">Fully Booked</p>
              <p className="font-body-md text-on-surface-variant">
                No open times for {selectedService?.name}. Try a different date or service.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {TIME_SECTIONS.map((section) => {
                const sectionTimes = availableTimes.filter((t) => section.test(toMins(t.startTime)))
                if (!sectionTimes.length) return null
                return (
                  <div key={section.label}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-sm">{section.icon}</span>
                      <p className="font-label-caps text-label-caps text-black uppercase">{section.label}</p>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {sectionTimes.map((t) => (
                        <button
                          key={t.startTime}
                          onClick={() => handlePick(t)}
                          className="border-2 border-black py-4 font-body-md text-sm font-semibold hover:bg-black hover:text-white transition-all active:scale-[0.98] tabular-nums"
                        >
                          {fmt12(t.startTime)}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column — summary panel */}
        <div className="hidden lg:block">
          <div className="border-2 border-black p-6 bg-white sticky top-28">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6">Your Selection</p>

            <div className="space-y-5">
              <div>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-1">Date</p>
                <p className="font-headline-md text-lg uppercase">{selectedDateObj?.full}</p>
              </div>
              <div className="border-t border-surface-container-highest pt-5">
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-1">Service</p>
                <p className="font-headline-md text-lg uppercase">{selectedService?.name ?? '—'}</p>
                {selectedService && (
                  <p className="font-body-md text-sm text-on-surface-variant mt-1">
                    {selectedService.duration_minutes} min session
                  </p>
                )}
              </div>
              <div className="border-t border-surface-container-highest pt-5">
                <p className="font-body-md text-sm text-on-surface-variant">
                  {availableTimes.length > 0
                    ? `${availableTimes.length} time${availableTimes.length !== 1 ? 's' : ''} available`
                    : 'No times available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
