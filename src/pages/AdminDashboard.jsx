import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { sendApprovalEmail, sendRejectionEmail } from '../lib/email'
import { sendApprovalSMS, sendRejectionSMS }     from '../lib/sms'
import AdminLayout from '../components/AdminLayout'

const today = format(new Date(), 'yyyy-MM-dd')

const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null)
  const [comment, setComment]           = useState('')
  const [processing, setProcessing]     = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('*, service:services(*)')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    setAppointments(data || [])
    setLoading(false)
  }

  const openModal = (appt, action) => { setModal({ appt, action }); setComment('') }

  const confirmAction = async () => {
    const { appt, action } = modal
    setProcessing(true)
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      await supabase
        .from('appointments')
        .update({ status: newStatus, admin_comment: comment || null })
        .eq('id', appt.id)

      const payload = {
        clientName:   appt.client_name,
        clientEmail:  appt.client_email,
        clientPhone:  appt.client_phone ?? '',
        serviceName:  appt.service?.name ?? '',
        date:         appt.date ?? '',
        time:         appt.start_time?.slice(0, 5) ?? '',
        adminComment: comment,
      }
      try {
        if (action === 'approve') await sendApprovalEmail(payload)
        else await sendRejectionEmail(payload)
      } catch (e) { console.error('Email failed', e) }
      try {
        if (action === 'approve') await sendApprovalSMS(payload)
        else await sendRejectionSMS(payload)
      } catch (e) { console.error('SMS failed', e) }

      setModal(null)
      fetchAll()
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const nowTime        = format(new Date(), 'HH:mm')
  const pending        = appointments.filter((a) => a.status === 'pending')
  const todayConfirmed = appointments.filter((a) => a.date === today && a.status === 'approved')
  const totalApproved  = appointments.filter((a) => a.status === 'approved')

  // Only approved, and only future: future dates OR today with start_time still ahead
  const upcomingToday = appointments.filter((a) => {
    if (a.status !== 'approved') return false
    if (a.date > today) return true
    if (a.date === today && a.start_time.slice(0, 5) >= nowTime) return true
    return false
  })

  const STATS = [
    { label: 'Pending Requests', value: pending.length,        icon: 'pending_actions', dark: false },
    { label: "Today's Bookings", value: todayConfirmed.length, icon: 'today',           dark: true  },
    { label: 'Total Approved',   value: totalApproved.length,  icon: 'check_circle',    dark: false },
  ]

  return (
    <AdminLayout>
      {/* ── Overview ───────────────────────────────── */}
      <h1 className="font-headline-xl text-headline-xl uppercase mb-5">Overview</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-10">
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
                  <p className={`text-[48px] font-black tabular-nums leading-none ${s.dark ? 'text-white' : 'text-black'}`}>
                    {String(s.value).padStart(2, '0')}
                  </p>
                </div>
                <span
                  className={`material-symbols-outlined text-4xl ${s.dark ? 'opacity-30' : 'text-surface-container-highest'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {s.icon}
                </span>
              </div>
            ))}
          </div>

          {/* ── Pending Requests ───────────────────────── */}
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-headline-lg text-headline-lg uppercase leading-tight">
              Pending{'\n'}Requests
            </h2>
            <Link
              to="/admin/bookings"
              className="font-label-caps text-label-caps text-on-surface-variant uppercase hover:text-black transition-colors pb-1"
            >
              View All
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="border-2 border-black p-8 text-center mb-10">
              <p className="font-body-md text-on-surface-variant">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3 mb-10">
              {pending.slice(0, 3).map((appt) => (
                <div key={appt.id} className="border-2 border-black bg-white p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-headline-md text-lg leading-tight">{appt.client_name}</h3>
                      <p className="font-body-md text-sm text-on-surface-variant">{appt.client_email}</p>
                      {appt.client_phone && (
                        <p className="font-body-md text-sm text-on-surface-variant">{appt.client_phone}</p>
                      )}
                    </div>
                    <span className="font-label-caps text-[10px] uppercase tracking-widest px-2 py-1 flex-shrink-0 bg-black text-white">
                      pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-3 border-t border-b border-surface-container-highest my-3">
                    <div>
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Service</p>
                      <p className="font-body-md text-sm font-semibold">{appt.service?.name}</p>
                    </div>
                    <div>
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Date</p>
                      <p className="font-body-md text-sm font-semibold">{appt.date}</p>
                    </div>
                    <div>
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Time</p>
                      <p className="font-body-md text-sm font-semibold tabular-nums">
                        {fmt12(appt.start_time)} – {fmt12(appt.end_time)}
                      </p>
                    </div>
                    {appt.notes && (
                      <div>
                        <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Notes</p>
                        <p className="font-body-md text-sm">{appt.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(appt, 'approve')}
                      className="flex-1 bg-black text-white py-3 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openModal(appt, 'reject')}
                      className="flex-1 bg-white text-black py-3 font-label-caps text-label-caps uppercase tracking-widest hover:bg-black hover:text-white border-2 border-black transition-all text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Upcoming today ─────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-lg text-headline-lg uppercase">Upcoming</h2>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Approved Only</span>
          </div>

          {upcomingToday.length === 0 ? (
            <div className="border-2 border-black p-8 text-center">
              <p className="font-body-md text-on-surface-variant">No upcoming appointments</p>
            </div>
          ) : (
            <div className="relative pl-8 space-y-8">
              {/* Vertical line */}
              <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-black" />

              {upcomingToday.map((appt) => (
                <div key={appt.id} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-[37px] top-1.5 w-4 h-4 bg-black rounded-full border-4 border-white z-10" />

                  <div className="flex flex-col">
                    {/* Time label — bold, above the card */}
                    <span className="font-label-caps text-label-caps text-black">
                      {fmt12(appt.start_time)}
                      {appt.date !== today && (
                        <span className="ml-2 text-on-surface-variant font-normal">· {appt.date}</span>
                      )}
                    </span>

                    {/* Card */}
                    <div className="bg-white border-2 border-black p-4 mt-2">
                      <h4 className="font-headline-md text-black">{appt.client_name}</h4>
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                        Confirmed · {appt.service?.name}
                      </p>
                      <div className="border-t border-surface-container-highest mt-3 pt-2 space-y-1">
                        <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">mail</span>
                          {appt.client_email}
                        </p>
                        {appt.client_phone && (
                          <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">phone</span>
                            {appt.client_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Approve / Reject modal (bottom sheet) ──── */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white border-2 border-black p-6 w-full max-w-lg">
            <h3 className="font-headline-md uppercase mb-1 capitalize">
              {modal.action === 'approve' ? 'Approve' : 'Decline'} Appointment
            </h3>
            <p className="font-body-md text-sm text-on-surface-variant mb-5">
              {modal.appt.client_name} · {modal.appt.date} at {fmt12(modal.appt.start_time)}
            </p>

            <label className="font-label-caps text-label-caps text-black uppercase block mb-2">
              Message to client <span className="text-on-surface-variant normal-case font-body-md tracking-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={modal.action === 'approve' ? 'See you then!' : "Sorry, we can't accommodate this."}
              rows={3}
              className="w-full border-0 border-b border-black bg-transparent py-2 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md placeholder:text-surface-container-highest resize-none mb-5"
            />

            <div className="flex gap-2">
              <button
                onClick={confirmAction}
                disabled={processing}
                className="flex-1 bg-black text-white py-4 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-50"
              >
                {processing ? '…' : 'Confirm'}
              </button>
              <button
                onClick={() => setModal(null)}
                disabled={processing}
                className="flex-1 border-2 border-black py-4 font-label-caps text-label-caps uppercase tracking-widest hover:bg-black hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
