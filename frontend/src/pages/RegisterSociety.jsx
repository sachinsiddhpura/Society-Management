import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Alert from '../components/Alert.jsx'

const emptyForm = {
  societyName: '',
  registrationNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  societyContactPhone: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  adminPhone: '',
}

export default function RegisterSociety() {
  const { registerSociety, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await registerSociety(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 via-white to-brand-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <Link to="/" className="text-sm font-semibold text-brand-800">
          🏢 Society Manager
        </Link>
        <h1 className="text-xl font-semibold mt-4 mb-1">Register your Society</h1>
        <p className="text-sm text-slate-500 mb-4">
          This creates your society and its first Society Admin account.
        </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Society Name" required value={form.societyName} onChange={set('societyName')} />
        <Field label="Registration Number" value={form.registrationNumber} onChange={set('registrationNumber')} />
        <Field label="Address" value={form.address} onChange={set('address')} className="sm:col-span-2" />
        <Field label="City" value={form.city} onChange={set('city')} />
        <Field label="State" value={form.state} onChange={set('state')} />
        <Field label="Pincode" value={form.pincode} onChange={set('pincode')} />
        <Field
          label="Society Contact Phone"
          required
          value={form.societyContactPhone}
          onChange={set('societyContactPhone')}
        />

        <div className="sm:col-span-2 border-t pt-3 mt-1">
          <p className="text-sm font-medium text-slate-700 mb-2">Admin Account</p>
        </div>

        <Field label="Admin Name" required value={form.adminName} onChange={set('adminName')} />
        <Field label="Admin Phone" value={form.adminPhone} onChange={set('adminPhone')} />
        <Field
          label="Admin Email"
          type="email"
          required
          value={form.adminEmail}
          onChange={set('adminEmail')}
        />
        <Field
          label="Admin Password"
          type="password"
          required
          value={form.adminPassword}
          onChange={set('adminPassword')}
        />

        {error && (
          <div className="sm:col-span-2">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Society'}
        </button>
      </form>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Already registered?{' '}
          <Link to="/login" className="text-brand-600 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="text-sm text-slate-600">{label}</label>
      <input {...props} className="w-full border rounded px-3 py-2 text-sm mt-1" />
    </div>
  )
}
