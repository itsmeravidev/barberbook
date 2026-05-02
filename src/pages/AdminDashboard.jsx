import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { sendApprovalEmail, sendRejectionEmail } from '../lib/email'
import Layout from '../components/Layout'

const STATUS_STYLE = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100  text-green-700',
  rejected: 'bg-red-100    text-red-600',
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('pending')
  const [modal, setModal]               = useState(null) // { appt, action }
  const [comment, setComment]           = useState('')
  const [processing, setProcessing]     = useState(false)
  const [emailError, setEmailError]     = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('*, service:services(*)')
      .order('created_at', { ascending: false })
    setAppointments(data || [])
    setLoading(false)
  }

  const openModal = (appt, action) => {
    setModal({ appt, action })
    setComment('')
    setEmailError('')
  }

  const confirmAction = async () => {
    const { appt, action } = modal
    setProcessing(true)
    setEmailError('')

    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'

      await supabase
        .from('appointments')
        .update({ status: newStatus, admin_comment: comment || null })
        .eq('id', appt.id)

      const emailPayload = {
        clientName:   appt.client_name,
        clientEmail:  appt.client_email,
        serviceName:  appt.service?.name ?? '',
        date:         appt.date ?? '',
        time:         appt.start_time?.slice(0, 5) ?? '',
        adminComment: comment,
      }

      try {
        if (action === 'approve') {
          await sendApprovalEmail(emailPayload)
        } else {
          await sendRejectionEmail(emailPayload)
        }
      } catch (emailErr) {
        // Don't block the UI if email fails; show a soft warning
        setEmailError('Action saved, but email failed to send: ' + (emailErr?.text || emailErr?.message || 'unknown error'))
      }

      setModal(null)
      fetchAll()
    } catch (err) {
      setEmailError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const fmt = (t) => t?.slice(0, 5)

  const counts = {
    pending:  appointments.filter((a) => a.status === 'pending').length,
    approved: appointments.filter((a) => a.status === 'approved').length,
    rejected: appointments.filter((a) => a.status === 'rejected').length,
  }

  const filtered = appointments.filter((a) => a.status === activeTab)

  return (
    <Layout isAdmin>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['pending', 'approved', 'rejected'].map((s) => (
            <div key={s} className="border border-gray-100 rounded-xl p-4">
              <p className="text-3xl font-bold tabular-nums">{counts[s]}</p>
              <p className="text-xs text-gray-400 capitalize mt-1">{s}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-5 border-b border-gray-100 mb-6">
          {['pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {counts[tab] > 0 && (
                <span className="ml-1.5 text-xs opacity-60">({counts[tab]})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-gray-300 text-sm">No {activeTab} appointments</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((appt) => (
              <div key={appt.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{appt.client_name}</p>
                    <p className="text-sm text-gray-400">{appt.client_email}</p>
                    {appt.client_phone && (
                      <p className="text-sm text-gray-400">{appt.client_phone}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[appt.status]}`}>
                    {appt.status}
                  </span>
                </div>

                <div className="text-sm text-gray-500 space-y-1 mb-3">
                  <p>
                    <span className="text-gray-300">Service </span>
                    {appt.service?.name}
                  </p>
                  <p>
                    <span className="text-gray-300">When    </span>
                    {appt.date} · {fmt(appt.start_time)} – {fmt(appt.end_time)}
                  </p>
                  {appt.notes && (
                    <p>
                      <span className="text-gray-300">Notes   </span>
                      {appt.notes}
                    </p>
                  )}
                  {appt.admin_comment && (
                    <p>
                      <span className="text-gray-300">Comment </span>
                      {appt.admin_comment}
                    </p>
                  )}
                </div>

                {appt.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openModal(appt, 'approve')}
                      className="flex-1 bg-black text-white text-sm rounded-lg py-2 hover:bg-gray-800 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openModal(appt, 'reject')}
                      className="flex-1 border border-gray-200 text-sm rounded-lg py-2 hover:border-black transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve / Reject modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-1 capitalize">
              {modal.action} appointment
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {modal.appt.client_name} · {modal.appt.date} at {fmt(modal.appt.start_time)}
            </p>

            <label className="block text-sm font-medium mb-1.5">
              Message to client{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                modal.action === 'approve'
                  ? 'See you then!'
                  : 'Sorry, we can\'t accommodate this request.'
              }
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none mb-4"
            />

            {emailError && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-3">
                {emailError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={confirmAction}
                disabled={processing}
                className={`flex-1 text-sm rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50 ${
                  modal.action === 'approve'
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {processing ? 'Saving…' : `Confirm ${modal.action}`}
              </button>
              <button
                onClick={() => setModal(null)}
                disabled={processing}
                className="flex-1 border border-gray-200 text-sm rounded-lg py-2.5 hover:border-black transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
