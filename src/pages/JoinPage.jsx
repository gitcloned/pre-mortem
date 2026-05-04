import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { getSessionByToken, joinSession } from '../lib/firestore'

export function JoinPage() {
  const { shareToken } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/auth', { state: { from: { pathname: `/join/${shareToken}` } } })
      return
    }
    getSessionByToken(shareToken).then(async (session) => {
      if (!session) { setError('Invalid or expired link.'); return }
      if (!session.participantIds.includes(user.uid)) {
        await joinSession(session.id, user.uid)
      }
      navigate(`/session/${session.id}`, { replace: true })
    }).catch(() => setError('Something went wrong.'))
  }, [user, loading, shareToken])

  return (
    <>
      <Nav />
      <div className="page-wrap">
        {error ? <div className="error-msg">{error}</div> : <div className="muted">Joining session…</div>}
      </div>
    </>
  )
}
