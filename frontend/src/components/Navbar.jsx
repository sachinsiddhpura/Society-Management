import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const linksByRole = {
  SUPER_ADMIN: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/societies', label: 'Societies', icon: '🏙️' },
  ],
  SOCIETY_ADMIN: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/visitors', label: 'Visitors', icon: '🧑‍🤝‍🧑' },
    { to: '/deliveries', label: 'Deliveries', icon: '📦' },
    { to: '/flats', label: 'Flats', icon: '🏢' },
    { to: '/users', label: 'Staff', icon: '👥' },
  ],
  GUARD: [
    { to: '/gate-entry', label: 'Visitor Entry', icon: '🚪' },
    { to: '/delivery-entry', label: 'Delivery Entry', icon: '📮' },
    { to: '/visitors', label: 'Visitor Log', icon: '🧑‍🤝‍🧑' },
    { to: '/deliveries', label: 'Delivery Log', icon: '📦' },
  ],
  RESIDENT: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/visitors', label: 'My Visitors', icon: '🧑‍🤝‍🧑' },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const links = linksByRole[user.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <nav className="bg-brand-700 text-white shadow sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="font-semibold tracking-wide">
              🏢 Society Manager
            </Link>
            <div className="hidden sm:flex gap-4">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `text-sm px-2 py-1 rounded hover:bg-brand-600 ${isActive ? 'bg-brand-600' : ''}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline opacity-90">
              {user.name} · {user.role.replace('_', ' ')}
              {user.societyName ? ` · ${user.societyName}` : ''}
            </span>
            <button
              onClick={handleLogout}
              className="bg-brand-900 hover:bg-black/40 px-3 py-1.5 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar - stands in for a native app's nav since we're
          not shipping a separate mobile app. Hidden on sm+ where the top nav
          already covers navigation. */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 text-[11px] gap-0.5 ${
                  isActive ? 'text-brand-700 font-medium' : 'text-slate-500'
                }`
              }
            >
              <span className="text-lg leading-none">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  )
}
