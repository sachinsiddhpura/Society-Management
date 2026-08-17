import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import PhotoCapture from '../components/PhotoCapture.jsx'

const PARTNERS = ['ZOMATO', 'SWIGGY', 'AMAZON', 'FLIPKART', 'BIGBASKET', 'BLINKIT', 'POSTAL', 'COURIER', 'OTHER']

const emptyForm = {
  deliveryPartner: 'ZOMATO',
  otherPartnerName: '',
  agentName: '',
  agentPhone: '',
  orderId: '',
  flatNumber: '',
  blockName: '',
  gateNumber: '',
}

export default function DeliveryEntry() {
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
      await axiosClient.post('/deliveries', { ...form, photoUrl })
      setSuccess('Delivery entry recorded.')
      setForm(emptyForm)
      setPhotoUrl(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record delivery entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-xl font-semibold mb-4">Delivery / Courier Entry</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600">Delivery Partner</label>
            <select
              value={form.deliveryPartner}
              onChange={set('deliveryPartner')}
              className="w-full border rounded px-3 py-2 text-sm mt-1"
            >
              {PARTNERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          {form.deliveryPartner === 'OTHER' && (
            <Field label="Partner Name" value={form.otherPartnerName} onChange={set('otherPartnerName')} />
          )}
          <Field label="Agent Name" value={form.agentName} onChange={set('agentName')} />
          <Field label="Agent Phone" value={form.agentPhone} onChange={set('agentPhone')} />
          <Field label="Order ID" value={form.orderId} onChange={set('orderId')} />
          <Field label="Block" value={form.blockName} onChange={set('blockName')} />
          <Field label="Flat Number" required value={form.flatNumber} onChange={set('flatNumber')} />
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
            onClick={() => navigate('/deliveries')}
            className="px-4 py-2 rounded text-sm border"
          >
            View Delivery Log
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
