// Photo URLs are absolute S3 URLs returned by the backend. This only
// exists as a safety net for any old records saved back when photos were
// relative `/uploads/...` paths served by the backend itself.
export function resolvePhotoUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const apiHost = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080'
  return `${apiHost}${url}`
}
