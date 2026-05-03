import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const NAV = [
  { to: '/admin',          label: 'Home',     icon: 'grid_view'      },
  { to: '/admin/bookings', label: 'Bookings', icon: 'calendar_month' },
  { to: '/admin/clients',  label: 'Clients',  icon: 'group'          },
  { to: '/admin/stats',    label: 'Stats',    icon: 'bar_chart'      },
  { to: '/admin/settings', label: 'Settings', icon: 'settings'       },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore()
  const location         = useLocation()
  const navigate         = useNavigate()

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white border-b-2 border-black flex items-center justify-between h-16 px-5 z-50">
        <span className="text-xl font-black tracking-widest font-headline-lg">BarberBook</span>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 flex items-center justify-center text-black">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 bg-black flex items-center justify-center"
            title="Logout"
          >
            <span
              className="material-symbols-outlined text-white text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-grow pt-16 pb-20 overflow-y-auto">
        <div className="px-4 py-6 max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t-2 border-black z-50">
        <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
          {NAV.map(({ to, label, icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 py-2 px-3 flex-1"
              >
                <span
                  className={`material-symbols-outlined text-xl leading-none ${active ? 'text-black' : 'text-gray-400'}`}
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span className={`font-label-caps text-[9px] uppercase tracking-widest ${active ? 'text-black' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
