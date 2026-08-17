import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Alert from '../components/Alert.jsx'

const HIGHLIGHTS = [
  { icon: '🧑‍🤝‍🧑', title: 'Visitor Management', desc: 'Photo-verified gate entries, approved by residents in real time.' },
  { icon: '📦', title: 'Delivery Tracking', desc: 'Every Zomato, Swiggy, and courier drop-off logged and checked out.' },
  { icon: '📱', title: 'Works on Any Device', desc: 'No app install needed - runs right in your phone or desktop browser.' },
]

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="p-8 sm:p-10">
          <Link to="/" className="text-sm font-semibold text-brand-800">
            🏢 Society Manager
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mt-6">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm mt-1"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm mt-1"
                placeholder="••••••••"
              />
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            New society?{' '}
            <Link to="/register-society" className="text-brand-600 font-medium">
              Register here
            </Link>
          </p>
        </div>

        <div className="hidden lg:flex flex-col justify-center bg-brand-700 text-white p-10">
          <p className="text-xs uppercase tracking-wide text-brand-200 font-medium">Society Manager</p>
          <h2 className="text-xl font-semibold mt-2">Everything the gate needs, in one place</h2>
          <div className="mt-8 space-y-5">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">
                  {h.icon}
                </div>
                <div>
                  <p className="font-medium">{h.title}</p>
                  <p className="text-sm text-brand-100 mt-0.5">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
