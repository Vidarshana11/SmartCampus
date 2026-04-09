import { Navigate, Route, BrowserRouter, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import OAuthSuccess from './pages/OAuthSuccess'
import RoleSelection from './pages/RoleSelection'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import RoleManagement from './pages/RoleManagement'
import AccountManagement from './pages/AccountManagement'
import NotFound from './pages/NotFound'
import ResourceList from './pages/ResourceList'
import TicketList from './pages/TicketList'
import TicketCreate from './pages/TicketCreate'
import TicketDetails from './pages/TicketDetails'

function RequireAuth({ children, roles }) {
  const { token, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 font-extrabold text-gray-900">
          Loading...
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles?.length && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function ProtectedShell({ roles, children }) {
  return (
    <RequireAuth roles={roles}>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  )
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/success" element={<OAuthSuccess />} />
          <Route path="/role-selection" element={<RoleSelection />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedShell>
                <Dashboard />
              </ProtectedShell>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedShell>
                <AccountManagement />
              </ProtectedShell>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth roles={['ADMIN']}>
                <AdminPanel />
              </RequireAuth>
            }
          />

          <Route
            path="/admin-panel"
            element={
              <RequireAuth roles={['ADMIN']}>
                <AdminPanel />
              </RequireAuth>
            }
          />

          {/* Member 4: Role Management Route */}
          <Route
            path="/role-management"
            element={
              <ProtectedShell roles={['ADMIN']}>
                <RoleManagement />
              </ProtectedShell>
            }
          />

          <Route
            path="/resources"
            element={
              <ProtectedShell>
                <ResourceList />
              </ProtectedShell>
            }
          />

          <Route
            path="/tickets"
            element={
              <ProtectedShell>
                <TicketList />
              </ProtectedShell>
            }
          />
          <Route
            path="/tickets/create"
            element={
              <ProtectedShell>
                <TicketCreate />
              </ProtectedShell>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedShell>
                <TicketDetails />
              </ProtectedShell>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
