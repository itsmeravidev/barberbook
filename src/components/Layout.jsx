import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Layout({ children, isAdmin = false }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm transition-colors ${
        location.pathname === to
          ? 'font-semibold text-black'
          : 'text-gray-400 hover:text-black'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to={isAdmin ? '/admin' : '/'}
            className="font-bold text-lg tracking-tight"
          >
            BarberBook
          </Link>

          <nav className="flex items-center gap-5">
            {isAdmin && user ? (
              <>
                {navLink('/admin', 'Dashboard')}
                {navLink('/admin/slots', 'Slots')}
                {navLink('/admin/services', 'Services')}
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-black transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {navLink('/', 'Book')}
                {user && navLink('/admin', 'Admin')}
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
