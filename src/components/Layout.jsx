import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const ADMIN_LINKS = [
  { to: '/admin',          label: 'Dashboard'   },
  { to: '/admin/slots',    label: 'Availability' },
  { to: '/admin/services', label: 'Services'    },
]

export default function Layout({ children, isAdmin = false }) {
  const { user, logout } = useAuthStore()
  const location         = useLocation()
  const navigate         = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (to) => location.pathname === to

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white border-b-2 border-black flex justify-center items-center h-20 px-6 z-50">
        <div className="w-full max-w-[1200px] flex justify-between items-center">
          <Link
            to={isAdmin ? '/admin' : '/'}
            className="text-2xl font-black text-black tracking-widest font-headline-lg select-none"
          >
            BARBERBOOK
          </Link>

          {isAdmin && user ? (
            <nav className="flex items-center gap-8">
              {ADMIN_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`font-label-caps text-label-caps uppercase tracking-widest transition-colors pb-1 ${
                    isActive(to)
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-400 hover:text-black'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="font-label-caps text-label-caps uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-white hover:text-black border border-black transition-all"
              >
                Logout
              </button>
            </nav>
          ) : (
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className={`font-label-caps text-label-caps uppercase tracking-widest transition-colors pb-1 ${
                  isActive('/') ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                Book
              </Link>
              {user && (
                <Link
                  to="/admin"
                  className="font-label-caps text-label-caps uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-white hover:text-black border border-black transition-all"
                >
                  Admin
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-grow pt-20">
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-8 max-w-[1200px] mx-auto">
          <span className="font-label-caps text-label-caps text-gray-400">
            © {new Date().getFullYear()} BarberBook. Precision in every cut.
          </span>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="font-label-caps text-label-caps text-gray-400">Privacy Policy</span>
            <span className="font-label-caps text-label-caps text-gray-400">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
