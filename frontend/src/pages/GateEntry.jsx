import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import PhotoCapture from '../components/PhotoCapture.jsx'
import Alert from '../components/Alert.jsx'

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

const PHONE_PATTERN = /^[0-9+\-\s()]{7,15}$/
const VEHICLE_PATTERN = /^[A-Za-z0-9\- ]{4,15}$/

function validate(form) {
  const errors = {}

  if (!form.visitorName.trim()) {
    errors.visitorName = 'Visitor name is required'
  } else if (form.visitorName.trim().length < 2) {
    errors.visitorName = 'Visitor name is too short'
  }

  if (form.visitorPhone && !PHONE_PATTERN.test(form.visitorPhone.trim())) {
    errors.visitorPhone = 'Enter a valid phone number'
  }

  if (form.vehicleNumber && !VEHICLE_PATTERN.test(form.vehicleNumber.trim())) {
    errors.vehicleNumber = 'Enter a valid vehicle number'
  }

  if (!form.blockToVisit.trim()) {
    errors.blockToVisit = 'Block is required'
  }

  if (!form.flatToVisit.trim()) {
    errors.flatToVisit = 'Flat number is required'
  }

  return errors
}

export default function GateEntry() {
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
      await axiosClient.post('/visitors', { ...form, photoUrl })
      setSuccess('Visitor entry recorded. Waiting for approval.')
      setForm(emptyForm)
      setPhotoUrl(null)
      setFieldErrors({})
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record visitor entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-xl font-semibold mb-4">Visitor Gate Entry</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Visitor Name"
            required
            value={form.visitorName}
            onChange={set('visitorName')}
            error={fieldErrors.visitorName}
          />
          <Field
            label="Visitor Phone"
            value={form.visitorPhone}
            onChange={set('visitorPhone')}
            error={fieldErrors.visitorPhone}
            placeholder="e.g. 9876543210"
          />
          <Field label="Purpose of Visit" value={form.purpose} onChange={set('purpose')} />
          <Field
            label="Vehicle Number"
            value={form.vehicleNumber}
            onChange={set('vehicleNumber')}
            error={fieldErrors.vehicleNumber}
          />
          <Field
            label="Block"
            required
            value={form.blockToVisit}
            onChange={set('blockToVisit')}
            error={fieldErrors.blockToVisit}
          />
          <Field
            label="Flat Number"
            required
            value={form.flatToVisit}
            onChange={set('flatToVisit')}
            error={fieldErrors.flatToVisit}
          />
          <Field label="Host / Resident Name" value={form.hostName} onChange={set('hostName')} />
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
