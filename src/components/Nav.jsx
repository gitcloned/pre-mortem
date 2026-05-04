import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../hooks/useAuth'

export function Nav({ crumbs = [] }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => { await signOut(auth); navigate('/') }

  return (
    <div className="nav">
      <Link to={user ? '/dashboard' : '/'} className="nav-logo">PM</Link>
      {crumbs.map((c, i) => (
        <span key={i}>
          <span className="nav-crumb-sep">›</span>
          {c.to ? <Link to={c.to} className="nav-crumb">{c.label}</Link>
                : <span className="nav-crumb">{c.label}</span>}
        </span>
      ))}
      {user && (
        <div className="nav-right">
          <span>{user.displayName || user.email}</span>
          <button onClick={handleLogout}>logout</button>
        </div>
      )}
    </div>
  )
}
