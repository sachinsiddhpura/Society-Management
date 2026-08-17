import { useCallback, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import axiosClient from '../api/axiosClient'
import Alert from './Alert.jsx'

const videoConstraints = { width: 480, height: 360, facingMode: 'environment' }
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB - matches the backend's limit
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function PhotoCapture({ onUploaded, required = false }) {
  const webcamRef = useRef(null)
  const fileInputRef = useRef(null)
  const [mode, setMode] = useState(null) // 'camera' | null
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState('')

  const uploadBlob = async (blob, filename) => {
    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', blob, filename)
      const { data } = await axiosClient.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onUploaded(data.url)
    } catch (err) {
      setError(err.response?.data?.message || 'Photo upload failed. Please try again.')
      onUploaded(null)
    } finally {
      setUploading(false)
    }
  }

  const capture = useCallback(async () => {
    if (!webcamRef.current) return
    const screenshot = webcamRef.current.getScreenshot()
    if (!screenshot) {
      setError('Could not capture from the camera. Try again, or use "Upload Photo" instead.')
      return
    }
    setPreview(screenshot)
    const blob = await (await fetch(screenshot)).blob()
    await uploadBlob(blob, `capture-${Date.now()}.jpg`)
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG or WEBP images are allowed.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('That file is too large - maximum size is 5MB.')
      e.target.value = ''
      return
    }

    setMode('file')
    setPreview(URL.createObjectURL(file))
    uploadBlob(file, file.name)
  }

  const handleCameraError = (err) => {
    console.error('Camera error:', err)
    const insecureContext = typeof window !== 'undefined' && !window.isSecureContext
    setCameraError(
      insecureContext
        ? 'Could not access the camera because this page isn\'t loaded over HTTPS. Browsers block camera access on plain HTTP (except on localhost). Use "Upload Photo" instead for now.'
        : 'Could not access the camera - permission may have been denied, or no camera is available on this device. Use "Upload Photo" instead.'
    )
    setMode(null)
  }

  const reset = () => {
    setMode(null)
    setPreview(null)
    setError('')
    onUploaded(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="border rounded-lg p-3 bg-white">
      <p className="text-sm font-medium text-slate-700 mb-2">
        Visitor / Agent Photo
        {required ? (
          <span className="text-red-500"> *</span>
        ) : (
          <span className="text-slate-400 font-normal"> (optional)</span>
        )}
      </p>

      {!mode && !preview && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('camera')
              setCameraError('')
            }}
            className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded"
          >
            📷 Open Camera
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded"
          >
            📁 Upload Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {cameraError && <Alert type="warning" className="mt-2">{cameraError}</Alert>}

      {mode === 'camera' && !preview && (
        <div className="space-y-2 mt-2">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMediaError={handleCameraError}
            className="rounded w-full max-w-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={capture}
              disabled={uploading}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-2 rounded disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Capture'}
            </button>
            <button type="button" onClick={() => setMode(null)} className="text-sm px-3 py-2 rounded border">
              Cancel
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-2 mt-2">
          <img src={preview} alt="Selected" className="rounded w-full max-w-sm" />
          {uploading && <p className="text-sm text-slate-500">Uploading...</p>}
          <button type="button" onClick={reset} className="text-sm px-3 py-2 rounded border">
            {mode === 'camera' ? 'Retake' : 'Choose a different photo'}
          </button>
        </div>
      )}

      {error && <Alert type="error" className="mt-2">{error}</Alert>}
    </div>
  )
}
