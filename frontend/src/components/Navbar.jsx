import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const linksByRole = {
  SUPER_ADMIN: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/societies', label: 'Societies' },
  ],
  SOCIETY_ADMIN: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/visitors', label: 'Visitors' },
    { to: '/deliveries', label: 'Deliveries' },
    { to: '/flats', label: 'Flats' },
    { to: '/users', label: 'Staff & Residents' },
  ],
  GUARD: [
    { to: '/gate-entry', label: 'Visitor Entry' },
    { to: '/delivery-entry', label: 'Delivery Entry' },
    { to: '/visitors', label: 'Visitor Log' },
    { to: '/deliveries', label: 'Delivery Log' },
  ],
  RESIDENT: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/visitors', label: 'My Visitors' },
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
    <nav className="bg-brand-700 text-white shadow">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-semibold tracking-wide">🏢 Society Manager</span>
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
  )
}
