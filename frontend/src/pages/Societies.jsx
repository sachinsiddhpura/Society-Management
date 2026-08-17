import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

export default function Societies() {
  const [societies, setSocieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/societies')
      setSocieties(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load societies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleActive = async (s) => {
    try {
      await axiosClient.put(`/societies/${s.id}`, { active: !s.active })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update society')
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Registered Societies</h1>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">City</th>
                <th className="p-3">Contact Email</th>
                <th className="p-3">Contact Phone</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {societies.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3">{s.city || '—'}</td>
                  <td className="p-3">{s.contactEmail}</td>
                  <td className="p-3">{s.contactPhone || '—'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        s.active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {s.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => toggleActive(s)} className="text-brand-700 hover:underline text-xs">
                      {s.active ? 'Suspend' : 'Activate'}
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
