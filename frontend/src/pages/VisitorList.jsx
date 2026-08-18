import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import { useAuth } from '../context/AuthContext.jsx'
import { resolvePhotoUrl } from '../utils/photoUrl.js'

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CHECKED_OUT: 'bg-slate-200 text-slate-700',
}

export default function VisitorList() {
  const { user } = useAuth()
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  const canModerate = ['RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN'].includes(user.role)
  const canCheckout = ['GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN'].includes(user.role)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosClient.get('/visitors', { params: filter ? { status: filter } : {} })
      setVisitors(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load visitors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const act = async (id, action) => {
    try {
      await axiosClient.put(`/visitors/${id}/${action}`)
      load()
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} visitor`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Visitor Log</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CHECKED_OUT">Checked Out</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : visitors.length === 0 ? (
        <p className="text-sm text-slate-500">No visitor entries found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="p-3">Photo</th>
                <th className="p-3">Visitor</th>
                <th className="p-3">Flat</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Entry Time</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="p-3">
                    {v.photoUrl ? (
                      <img
                        src={resolvePhotoUrl(v.photoUrl)}
                        alt={v.visitorName}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{v.visitorName}</div>
                    <div className="text-slate-500">{v.visitorPhone}</div>
                  </td>
                  <td className="p-3">
                    {v.blockToVisit ? `${v.blockToVisit}-` : ''}
                    {v.flatToVisit}
                  </td>
                  <td className="p-3">{v.purpose || '—'}</td>
                  <td className="p-3">{new Date(v.entryTime).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[v.status]}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    {canModerate && v.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => act(v.id, 'approve')}
                          className="text-green-700 hover:underline text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => act(v.id, 'reject')}
                          className="text-red-700 hover:underline text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {canCheckout && v.status === 'APPROVED' && (
                      <button
                        onClick={() => act(v.id, 'checkout')}
                        className="text-slate-700 hover:underline text-xs"
                      >
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
