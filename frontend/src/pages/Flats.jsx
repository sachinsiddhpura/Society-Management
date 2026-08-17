import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

const emptyForm = { blockName: '', flatNumber: '', ownerName: '', ownerPhone: '', occupied: false }

export default function Flats() {
  const [flats, setFlats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/flats')
      setFlats(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load flats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await axiosClient.post('/flats', form)
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create flat')
    }
  }

  const removeFlat = async (f) => {
    if (!window.confirm(`Remove flat ${f.blockName}-${f.flatNumber}?`)) return
    try {
      await axiosClient.delete(`/flats/${f.id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete flat')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Flats</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded text-sm"
        >
          {showForm ? 'Cancel' : '+ Add Flat'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Block" required value={form.blockName} onChange={set('blockName')} />
          <Field label="Flat Number" required value={form.flatNumber} onChange={set('flatNumber')} />
          <Field label="Owner Name" value={form.ownerName} onChange={set('ownerName')} />
          <Field label="Owner Phone" value={form.ownerPhone} onChange={set('ownerPhone')} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.occupied} onChange={set('occupied')} />
            Currently occupied
          </label>
          {error && <p className="text-red-600 text-sm sm:col-span-2">{error}</p>}
          <button
            type="submit"
            className="sm:col-span-2 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded text-sm font-medium"
          >
            Create Flat
          </button>
        </form>
      )}

      {error && !showForm && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="p-3">Block</th>
                <th className="p-3">Flat</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Resident</th>
                <th className="p-3">Occupied</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flats.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="p-3">{f.blockName}</td>
                  <td className="p-3">{f.flatNumber}</td>
                  <td className="p-3">{f.ownerName || '—'}</td>
                  <td className="p-3">{f.residentName || '—'}</td>
                  <td className="p-3">{f.occupied ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    <button onClick={() => removeFlat(f)} className="text-red-700 hover:underline text-xs">
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
