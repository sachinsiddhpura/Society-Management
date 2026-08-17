import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const cardsByRole = {
  SUPER_ADMIN: [
    { to: '/societies', title: 'Societies', desc: 'View and manage all registered societies' },
  ],
  SOCIETY_ADMIN: [
    { to: '/visitors', title: 'Visitor Log', desc: 'Review and approve visitor entries' },
    { to: '/deliveries', title: 'Delivery Log', desc: 'Track Zomato, Swiggy & courier entries' },
    { to: '/flats', title: 'Flats', desc: 'Manage blocks, flats and residents' },
    { to: '/users', title: 'Staff & Residents', desc: 'Manage guards, admins and residents' },
  ],
  GUARD: [
    { to: '/gate-entry', title: 'New Visitor Entry', desc: 'Capture a visitor at the gate' },
    { to: '/delivery-entry', title: 'New Delivery Entry', desc: 'Log a Zomato/Swiggy/courier delivery' },
    { to: '/visitors', title: 'Visitor Log', desc: 'View today’s visitor activity' },
    { to: '/deliveries', title: 'Delivery Log', desc: 'View today’s delivery activity' },
  ],
  RESIDENT: [
    { to: '/visitors', title: 'My Visitors', desc: 'Approve or reject visitors headed to your flat' },
  ],
}

export default function Dashboard() {
  const { user } = useAuth()
  const cards = cardsByRole[user.role] || []

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Welcome, {user.name}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {user.role.replace('_', ' ')}
        {user.societyName ? ` at ${user.societyName}` : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-transparent hover:border-brand-200"
          >
            <h2 className="font-medium text-slate-800">{c.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
