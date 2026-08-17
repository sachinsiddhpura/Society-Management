import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'

import LandingPage from './pages/LandingPage.jsx'
import Login from './pages/Login.jsx'
import RegisterSociety from './pages/RegisterSociety.jsx'
import Dashboard from './pages/Dashboard.jsx'
import GateEntry from './pages/GateEntry.jsx'
import DeliveryEntry from './pages/DeliveryEntry.jsx'
import VisitorList from './pages/VisitorList.jsx'
import DeliveryList from './pages/DeliveryList.jsx'
import Users from './pages/Users.jsx'
import Flats from './pages/Flats.jsx'
import Societies from './pages/Societies.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  const { user } = useAuth()

  // Guests get the marketing landing page, login, and register-society
  // screens full-bleed - none of these should be squeezed into the
  // app shell's max-w-6xl container, which only makes sense once signed in.
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-society" element={<RegisterSociety />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 pb-20 sm:pb-4">
        <Routes>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register-society" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gate-entry"
            element={
              <ProtectedRoute allowedRoles={['GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                <GateEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-entry"
            element={
              <ProtectedRoute allowedRoles={['GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                <DeliveryEntry />
              </ProtectedRoute>
            }
          />

          <Route
            path="/visitors"
            element={
              <ProtectedRoute>
                <VisitorList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliveries"
            element={
              <ProtectedRoute allowedRoles={['GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                <DeliveryList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/flats"
            element={
              <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                <Flats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['SOCIETY_ADMIN', 'SUPER_ADMIN']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/societies"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <Societies />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
