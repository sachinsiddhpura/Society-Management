import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: '🧑‍🤝‍🧑',
    title: 'Visitor Gate Entry',
    desc: 'Guards log every visitor with a photo at the gate. Residents approve or reject from their phone before anyone comes up.',
  },
  {
    icon: '📦',
    title: 'Delivery & Courier Tracking',
    desc: 'Zomato, Swiggy, Amazon and courier drop-offs logged with agent photo, order ID, and check-out status.',
  },
  {
    icon: '🏙️',
    title: 'Multi-Society Ready',
    desc: 'Every society registers independently. Its staff, residents, and records stay fully separate from every other society.',
  },
  {
    icon: '🔐',
    title: 'Role-Based Access',
    desc: 'Admins, guards, and residents each see exactly what they need — nothing more, nothing less.',
  },
  {
    icon: '🏢',
    title: 'Flats & Residents',
    desc: 'Track blocks, flats, ownership, and who lives where, all in one place.',
  },
  {
    icon: '🛡️',
    title: 'Secure by Design',
    desc: 'JWT authentication and society-scoped data isolation are built in from day one, not bolted on later.',
  },
]

export default function LandingPage() {
  return (
    <div>
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg text-brand-800">🏢 Society Manager</span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a href="#features" className="hidden sm:inline text-sm text-slate-600 hover:text-brand-700 px-2">
              Features
            </a>
            <Link to="/login" className="text-sm px-3 py-2 rounded border border-slate-300 hover:bg-slate-50">
              Log in
            </Link>
            <Link
              to="/register-society"
              className="text-sm px-3 py-2 rounded bg-brand-600 hover:bg-brand-700 text-white font-medium"
            >
              Register Society
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Run your society's gate, deliveries, and residents from one place
            </h1>
            <p className="mt-4 text-slate-600">
              Society Manager replaces the paper visitor register with photo-verified gate
              entries, tracks every Zomato/Swiggy/courier drop-off, and gives every resident,
              guard, and admin exactly the view they need.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/register-society"
                className="px-5 py-3 rounded bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm"
              >
                Register your Society
              </Link>
              <Link
                to="/login"
                className="px-5 py-3 rounded border border-slate-300 hover:bg-white font-medium text-sm"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-center text-slate-900">Everything the gate needs</h2>
        <p className="text-center text-slate-500 mt-2">No separate app to install — works right in the browser.</p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-xl">
                {f.icon}
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-700">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-semibold text-white">Ready to digitize your society?</h2>
          <p className="text-brand-100 mt-2">Set up your society and its admin account in under a minute.</p>
          <Link
            to="/register-society"
            className="inline-block mt-6 px-6 py-3 rounded bg-white text-brand-700 font-medium text-sm hover:bg-brand-50"
          >
            Register your Society
          </Link>
        </div>
      </section>

      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>🏢 Society Manager</span>
          <span>Built for modern housing societies.</span>
        </div>
      </footer>
    </div>
  )
}

function PhoneMockup() {
  const tiles = [
    { icon: '🧑‍🤝‍🧑', label: 'Visitors' },
    { icon: '📦', label: 'Deliveries' },
    { icon: '🏢', label: 'Flats' },
    { icon: '👥', label: 'Residents' },
  ]

  return (
    <div className="w-64 rounded-[2rem] border-8 border-slate-900 bg-slate-900 shadow-xl">
      <div className="rounded-[1.4rem] overflow-hidden bg-white">
        <div className="bg-brand-600 text-white px-4 pt-6 pb-8">
          <p className="text-xs opacity-80">Hi, Guard</p>
          <p className="font-semibold">Green Valley Apartments</p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 -mt-4">
          {tiles.map((t) => (
            <div key={t.label} className="bg-slate-50 rounded-lg p-3 text-center shadow-sm">
              <div className="text-xl">{t.icon}</div>
              <div className="text-xs text-slate-600 mt-1">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
