import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { sendApprovalEmail, sendRejectionEmail } from '../lib/email'
import { sendApprovalSMS, sendRejectionSMS }     from '../lib/sms'
import AdminLayout from '../components/AdminLayout'

const fmt12 = (t) => {
  if (!t) return ''
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const STATUS_BADGE = {
  pending:  'bg-black text-white',
  approved: 'border border-black text-black',
  rejected: 'bg-surface-container-highest text-on-surface-variant',
}

export default function AdminBookings() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('pending')
  const [modal, setModal]               = useState(null)
  const [comment, setComment]           = useState('')
  const [processing, setProcessing]     = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('*, service:services(*)')
      .order('date', { ascending: false })
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
      try {
        const payload = { clientName: appt.client_name, clientEmail: appt.client_email, clientPhone: appt.client_phone ?? '', serviceName: appt.service?.name ?? '', date: appt.date ?? '', time: appt.start_time?.slice(0, 5) ?? '', adminComment: comment }
        if (action === 'approve') await sendApprovalEmail(payload)
        else await sendRejectionEmail(payload)
      } catch (e) { console.error('Email failed', e) }
      try {
        const payload = { clientName: appt.client_name, clientPhone: appt.client_phone ?? '', serviceName: appt.service?.name ?? '', date: appt.date ?? '', time: appt.start_time?.slice(0, 5) ?? '', adminComment: comment }
        if (action === 'approve') await sendApprovalSMS(payload)
        else await sendRejectionSMS(payload)
      } catch (e) { console.error('SMS failed', e) }
      setModal(null)
      fetchAll()
    } catch (err) { console.error(err) }
    finally { setProcessing(false) }
  }

  const counts = {
    pending:  appointments.filter((a) => a.status === 'pending').length,
    approved: appointments.filter((a) => a.status === 'approved').length,
    rejected: appointments.filter((a) => a.status === 'rejected').length,
  }
  const filtered = appointments.filter((a) => a.status === activeTab)

  return (
    <AdminLayout>
      <h1 className="font-headline-xl text-headline-xl uppercase mb-5">Bookings</h1>

      {/* Tabs */}
      <div className="flex border-b-2 border-black mb-6">
        {['pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-label-caps text-label-caps uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-black text-white' : 'text-on-surface-variant hover:text-black'
            }`}
          >
            {tab} {counts[tab] > 0 && <span className="opacity-60">({counts[tab]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-2 border-black p-12 text-center">
          <p className="font-body-md text-on-surface-variant">No {activeTab} appointments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <div key={appt.id} className="border-2 border-black bg-white p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h3 className="font-headline-md text-lg leading-tight">{appt.client_name}</h3>
                  <p className="font-body-md text-sm text-on-surface-variant">{appt.client_email}</p>
                  {appt.client_phone && <p className="font-body-md text-sm text-on-surface-variant">{appt.client_phone}</p>}
                </div>
                <span className={`font-label-caps text-[10px] uppercase tracking-widest px-2 py-1 flex-shrink-0 ${STATUS_BADGE[appt.status]}`}>
                  {appt.status}
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
                  <p className="font-body-md text-sm font-semibold tabular-nums">{fmt12(appt.start_time)} – {fmt12(appt.end_time)}</p>
                </div>
                {appt.notes && (
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Notes</p>
                    <p className="font-body-md text-sm">{appt.notes}</p>
                  </div>
                )}
              </div>

              {appt.admin_comment && (
                <p className="font-body-md text-sm text-on-surface-variant italic mb-3">"{appt.admin_comment}"</p>
              )}

              {appt.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => openModal(appt, 'approve')} className="flex-1 bg-black text-white py-3 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all text-sm">Approve</button>
                  <button onClick={() => openModal(appt, 'reject')}  className="flex-1 bg-white text-black py-3 font-label-caps text-label-caps uppercase tracking-widest hover:bg-black hover:text-white border-2 border-black transition-all text-sm">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white border-2 border-black p-6 w-full max-w-lg">
            <h3 className="font-headline-md uppercase mb-1">{modal.action === 'approve' ? 'Approve' : 'Decline'} Appointment</h3>
            <p className="font-body-md text-sm text-on-surface-variant mb-5">{modal.appt.client_name} · {modal.appt.date}</p>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={modal.action === 'approve' ? 'See you then!' : "Sorry, we can't accommodate this."} rows={3} className="w-full border-0 border-b border-black bg-transparent py-2 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md placeholder:text-surface-container-highest resize-none mb-5" />
            <div className="flex gap-2">
              <button onClick={confirmAction} disabled={processing} className="flex-1 bg-black text-white py-4 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-50">{processing ? '…' : 'Confirm'}</button>
              <button onClick={() => setModal(null)} className="flex-1 border-2 border-black py-4 font-label-caps text-label-caps uppercase tracking-widest hover:bg-black hover:text-white transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
