import { useCallback, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import axiosClient from '../api/axiosClient'

const videoConstraints = { width: 480, height: 360, facingMode: 'environment' }

export default function PhotoCapture({ onUploaded }) {
  const webcamRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [cameraOn, setCameraOn] = useState(false)

  const capture = useCallback(async () => {
    if (!webcamRef.current) return
    const screenshot = webcamRef.current.getScreenshot()
    if (!screenshot) return
    setPreview(screenshot)
    setError('')
    setUploading(true)
    try {
      const blob = await (await fetch(screenshot)).blob()
      const formData = new FormData()
      formData.append('file', blob, `capture-${Date.now()}.jpg`)
      const { data } = await axiosClient.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onUploaded(data.url)
    } catch (err) {
      setError(err.response?.data?.message || 'Photo upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUploaded])

  const retake = () => {
    setPreview(null)
    onUploaded(null)
  }

  return (
    <div className="border rounded-lg p-3 bg-white">
      <p className="text-sm font-medium text-slate-700 mb-2">Visitor / Agent Photo</p>

      {!cameraOn && !preview && (
        <button
          type="button"
          onClick={() => setCameraOn(true)}
          className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded"
        >
          📷 Open Camera
        </button>
      )}

      {cameraOn && !preview && (
        <div className="space-y-2">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
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
            <button
              type="button"
              onClick={() => setCameraOn(false)}
              className="text-sm px-3 py-2 rounded border"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-2">
          <img src={preview} alt="Captured" className="rounded w-full max-w-sm" />
          <button type="button" onClick={retake} className="text-sm px-3 py-2 rounded border">
            Retake
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
