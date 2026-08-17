import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import { useAuth } from '../context/AuthContext.jsx'

const ROLES = ['GUARD', 'RESIDENT', 'SOCIETY_ADMIN']

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'GUARD',
  flatNumber: '',
  blockName: '',
}

export default function Users() {
  const { user: actor } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/users')
      setUsers(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await axiosClient.post('/auth/register-user', form)
      setSuccess('User created successfully')
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user')
    }
  }

  const toggleActive = async (u) => {
    try {
      await axiosClient.put(`/users/${u.id}`, { active: !u.active })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user')
    }
  }

  const removeUser = async (u) => {
    if (!window.confirm(`Remove ${u.name}?`)) return
    try {
      await axiosClient.delete(`/users/${u.id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Staff & Residents</h1>
        {actor.role === 'SOCIETY_ADMIN' && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded text-sm"
          >
            {showForm ? 'Cancel' : '+ Add User'}
          </button>
        )}
      </div>

      {showForm && actor.role === 'SOCIETY_ADMIN' && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" required value={form.name} onChange={set('name')} />
          <Field label="Email" type="email" required value={form.email} onChange={set('email')} />
          <Field label="Password" type="password" required value={form.password} onChange={set('password')} />
          <Field label="Phone" value={form.phone} onChange={set('phone')} />
          <div>
            <label className="text-sm text-slate-600">Role</label>
            <select value={form.role} onChange={set('role')} className="w-full border rounded px-3 py-2 text-sm mt-1">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          {form.role === 'RESIDENT' && (
            <>
              <Field label="Block" value={form.blockName} onChange={set('blockName')} />
              <Field label="Flat Number" value={form.flatNumber} onChange={set('flatNumber')} />
            </>
          )}
          {error && <p className="text-red-600 text-sm sm:col-span-2">{error}</p>}
          <button
            type="submit"
            className="sm:col-span-2 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded text-sm font-medium"
          >
            Create User
          </button>
        </form>
      )}

      {success && <p className="text-green-600 text-sm mb-2">{success}</p>}
      {error && !showForm && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Flat</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.blockName ? `${u.blockName}-${u.flatNumber}` : '—'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        u.active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => toggleActive(u)} className="text-brand-700 hover:underline text-xs">
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => removeUser(u)} className="text-red-700 hover:underline text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
