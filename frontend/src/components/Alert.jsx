const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const ICONS = {
  success: '✅',
  error: '⛔',
  warning: '⚠️',
  info: 'ℹ️',
}

export default function Alert({ type = 'info', children, onDismiss, className = '' }) {
  if (!children) return null

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`border rounded-md px-3 py-2 text-sm flex items-start gap-2 ${STYLES[type]} ${className}`}
    >
      <span className="shrink-0">{ICONS[type]}</span>
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-current opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  )
}
