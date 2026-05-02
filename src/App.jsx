import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage      from './pages/LoginPage'
import ClientSlots    from './pages/ClientSlots'
import ClientBook     from './pages/ClientBook'
import ClientConfirm  from './pages/ClientConfirm'
import AdminDashboard from './pages/AdminDashboard'
import AdminSlots     from './pages/AdminSlots'
import AdminServices  from './pages/AdminServices'

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

        {/* Admin – protected */}
        <Route path="/admin"          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/slots"    element={<ProtectedRoute><AdminSlots /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute><AdminServices /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
