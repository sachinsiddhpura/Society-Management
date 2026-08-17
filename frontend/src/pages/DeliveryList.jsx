import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import { useAuth } from '../context/AuthContext.jsx'

export default function DeliveryList() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  const canCheckout = ['GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN'].includes(user.role)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosClient.get('/deliveries', { params: filter ? { status: filter } : {} })
      setDeliveries(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const checkout = async (id) => {
    try {
      await axiosClient.put(`/deliveries/${id}/checkout`)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out delivery')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Delivery Log</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="IN">In (at gate)</option>
          <option value="OUT">Out (delivered/left)</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : deliveries.length === 0 ? (
        <p className="text-sm text-slate-500">No delivery entries found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="p-3">Photo</th>
                <th className="p-3">Partner</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Flat</th>
                <th className="p-3">Order ID</th>
                <th className="p-3">Entry Time</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3">
                    {d.photoUrl ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080'}${d.photoUrl}`}
                        alt={d.agentName}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3 font-medium">
                    {d.deliveryPartner === 'OTHER' ? d.otherPartnerName || 'Other' : d.deliveryPartner}
                  </td>
                  <td className="p-3">
                    <div>{d.agentName || '—'}</div>
                    <div className="text-slate-500">{d.agentPhone}</div>
                  </td>
                  <td className="p-3">
                    {d.blockName ? `${d.blockName}-` : ''}
                    {d.flatNumber}
                  </td>
                  <td className="p-3">{d.orderId || '—'}</td>
                  <td className="p-3">{new Date(d.entryTime).toLocaleString()}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        d.status === 'IN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {canCheckout && d.status === 'IN' && (
                      <button onClick={() => checkout(d.id)} className="text-slate-700 hover:underline text-xs">
                        Check Out
                      </button>
                    )}
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
