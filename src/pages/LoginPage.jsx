import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Logo from '../components/Logo'

export default function LoginPage() {
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPass]   = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const { login }                     = useAuthStore()
  const navigate                      = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 font-body-md">
      {/* Background watermark */}
      <div className="hidden lg:block fixed left-12 top-1/2 -translate-y-1/2 -z-10 opacity-[0.03] pointer-events-none select-none">
        <p className="font-headline-xl text-[160px] leading-none font-black tracking-tight">PRECISION</p>
      </div>

      {/* Top brand bar */}
      <div className="w-full max-w-[400px] mb-8">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <Logo />
          <span className="font-label-caps text-label-caps text-on-surface-variant">Admin Portal</span>
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-[400px] border-2 border-black bg-white p-8 md:p-10">
        <div className="mb-8 space-y-2">
          <h1 className="font-headline-lg text-headline-lg text-black uppercase">Admin Login</h1>
          <p className="font-body-md text-on-surface-variant">
            Enter your credentials to access the shop manager.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-label-caps text-black uppercase">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ADMIN@BARBERBOOK.COM"
              className="w-full border-0 border-b border-black bg-transparent py-3 px-1 focus:outline-none focus:border-b-2 transition-all font-body-md placeholder:text-surface-container-highest"
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-label-caps text-black uppercase">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-0 border-b border-black bg-transparent py-3 px-1 pr-10 focus:outline-none focus:border-b-2 transition-all font-body-md"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-black"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-error-container border border-error px-4 py-3">
              <p className="font-body-md text-error text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-5 font-label-caps text-label-caps uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all active:translate-y-0.5 disabled:opacity-50 mt-4"
          >
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Return link */}
      <div className="mt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-label-caps text-label-caps text-black uppercase tracking-widest group"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          Return to Booking
        </Link>
      </div>
    </div>
  )
}
