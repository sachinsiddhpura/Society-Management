import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import PhotoCapture from '../components/PhotoCapture.jsx'
import Alert from '../components/Alert.jsx'

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

const PHONE_PATTERN = /^[0-9+\-\s()]{7,15}$/

function validate(form) {
  const errors = {}

  if (form.deliveryPartner === 'OTHER' && !form.otherPartnerName.trim()) {
    errors.otherPartnerName = 'Enter the delivery partner\'s name'
  }

  if (form.agentPhone && !PHONE_PATTERN.test(form.agentPhone.trim())) {
    errors.agentPhone = 'Enter a valid phone number'
  }

  if (!form.flatNumber.trim()) {
    errors.flatNumber = 'Flat number is required'
  }

  return errors
}

export default function DeliveryEntry() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    if (fieldErrors[key]) {
      setFieldErrors({ ...fieldErrors, [key]: undefined })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const errors = validate(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError('Please fix the highlighted fields before submitting.')
      return
    }

    setSubmitting(true)
    try {
      await axiosClient.post('/deliveries', { ...form, photoUrl })
      setSuccess('Delivery entry recorded.')
      setForm(emptyForm)
      setPhotoUrl(null)
      setFieldErrors({})
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record delivery entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-xl font-semibold mb-4">Delivery / Courier Entry</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600">Delivery Partner</label>
            <select
              value={form.deliveryPartner}
              onChange={set('deliveryPartner')}
              className="w-full border rounded px-3 py-2 text-sm mt-1 border-slate-300"
            >
              {PARTNERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          {form.deliveryPartner === 'OTHER' && (
            <Field
              label="Partner Name"
              required
              value={form.otherPartnerName}
              onChange={set('otherPartnerName')}
              error={fieldErrors.otherPartnerName}
            />
          )}
          <Field label="Agent Name" value={form.agentName} onChange={set('agentName')} />
          <Field
            label="Agent Phone"
            value={form.agentPhone}
            onChange={set('agentPhone')}
            error={fieldErrors.agentPhone}
            placeholder="e.g. 9876543210"
          />
          <Field label="Order ID" value={form.orderId} onChange={set('orderId')} />
          <Field label="Block" value={form.blockName} onChange={set('blockName')} />
          <Field
            label="Flat Number"
            required
            value={form.flatNumber}
            onChange={set('flatNumber')}
            error={fieldErrors.flatNumber}
          />
          <Field label="Gate Number" value={form.gateNumber} onChange={set('gateNumber')} />
        </div>

        <PhotoCapture onUploaded={setPhotoUrl} />

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success" onDismiss={() => setSuccess('')}>{success}</Alert>}

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

function Field({ label, required, error, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="text-sm text-slate-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        {...props}
        aria-invalid={!!error}
        className={`w-full border rounded px-3 py-2 text-sm mt-1 ${
          error ? 'border-red-400 focus:outline-red-500' : 'border-slate-300'
        }`}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
