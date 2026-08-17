import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import PhotoCapture from '../components/PhotoCapture.jsx'

const emptyForm = {
  visitorName: '',
  visitorPhone: '',
  purpose: '',
  vehicleNumber: '',
  flatToVisit: '',
  blockToVisit: '',
  hostName: '',
  gateNumber: '',
}

export default function GateEntry() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await axiosClient.post('/visitors', { ...form, photoUrl })
      setSuccess('Visitor entry recorded. Waiting for approval.')
      setForm(emptyForm)
      setPhotoUrl(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record visitor entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-xl font-semibold mb-4">Visitor Gate Entry</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Visitor Name" required value={form.visitorName} onChange={set('visitorName')} />
          <Field label="Visitor Phone" value={form.visitorPhone} onChange={set('visitorPhone')} />
          <Field label="Purpose of Visit" value={form.purpose} onChange={set('purpose')} />
          <Field label="Vehicle Number" value={form.vehicleNumber} onChange={set('vehicleNumber')} />
          <Field label="Block" required value={form.blockToVisit} onChange={set('blockToVisit')} />
          <Field label="Flat Number" required value={form.flatToVisit} onChange={set('flatToVisit')} />
          <Field label="Host / Resident Name" value={form.hostName} onChange={set('hostName')} />
          <Field label="Gate Number" value={form.gateNumber} onChange={set('gateNumber')} />
        </div>

        <PhotoCapture onUploaded={setPhotoUrl} />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Record Entry'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/visitors')}
            className="px-4 py-2 rounded text-sm border"
          >
            View Visitor Log
          </button>
        </div>
      </form>
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
