import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { joinOrgByToken } from '../lib/firestore'

export function JoinOrgPage() {
  const { token } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/auth', { state: { from: { pathname: `/join-org/${token}` } } }); return }
    joinOrgByToken(token, user.uid)
      .then(orgId => navigate(`/org/${orgId}`, { replace: true }))
      .catch(() => setError('Invalid or expired invite link.'))
  }, [user, loading, token])

  return (
    <>
      <Nav />
      <div className="page-wrap">
        {error ? <div className="error-msg">{error}</div> : <div className="muted">Joining organisation…</div>}
      </div>
    </>
  )
}
