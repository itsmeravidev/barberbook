import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute  from './components/ProtectedRoute'

import LoginPage       from './pages/LoginPage'
import ClientSlots     from './pages/ClientSlots'
import ClientBook      from './pages/ClientBook'
import ClientConfirm   from './pages/ClientConfirm'

import AdminDashboard  from './pages/AdminDashboard'
import AdminBookings   from './pages/AdminBookings'
import AdminClients    from './pages/AdminClients'
import AdminStats      from './pages/AdminStats'
import AdminSettings   from './pages/AdminSettings'

const A = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Routes>
        {/* Client */}
        <Route path="/"        element={<ClientSlots />} />
        <Route path="/book"    element={<ClientBook />} />
        <Route path="/confirm" element={<ClientConfirm />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin */}
        <Route path="/admin"          element={<A><AdminDashboard /></A>} />
        <Route path="/admin/bookings" element={<A><AdminBookings /></A>} />
        <Route path="/admin/clients"  element={<A><AdminClients /></A>} />
        <Route path="/admin/stats"    element={<A><AdminStats /></A>} />
        <Route path="/admin/settings" element={<A><AdminSettings /></A>} />

        {/* Legacy redirects so old links still work */}
        <Route path="/admin/slots"    element={<A><AdminSettings /></A>} />
        <Route path="/admin/services" element={<A><AdminSettings /></A>} />
      </Routes>
    </BrowserRouter>
  )
}
