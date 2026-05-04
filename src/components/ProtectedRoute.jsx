import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="muted" style={{padding:20}}>Loading…</div>
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />
  return children
}
