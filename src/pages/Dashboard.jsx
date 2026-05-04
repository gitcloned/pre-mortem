import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { getUserOrgs, createOrg, getRecentSessions } from '../lib/firestore'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [recentSessions, setRecentSessions] = useState([])
  const [creating, setCreating] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getUserOrgs(user.uid).then(async (os) => {
      setOrgs(os)
      const allSessions = []
      for (const org of os) {
        const sessions = await getRecentSessions(org.id)
        allSessions.push(...sessions.map(s => ({ ...s, orgName: org.name })))
      }
      allSessions.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      setRecentSessions(allSessions.slice(0, 10))
      setLoading(false)
    })
  }, [user])

  const handleCreateOrg = async (e) => {
    e.preventDefault()
    if (!orgName.trim()) return
    const orgId = await createOrg(user.uid, orgName.trim())
    navigate(`/org/${orgId}`)
  }

  if (loading) return <><Nav /><div className="muted" style={{padding:20}}>Loading…</div></>

  return (
    <>
      <Nav />
      <div className="page-wrap">
        <div className="page-header">
          <h1>My Organisations</h1>
          <button className="btn btn-sm" onClick={() => setCreating(c => !c)}>+ New organisation</button>
        </div>

        {creating && (
          <form onSubmit={handleCreateOrg} style={{marginBottom:16,display:'flex',gap:8}}>
            <input value={orgName} onChange={e=>setOrgName(e.target.value)}
              placeholder="Organisation name" style={{flex:1,border:'1px solid #ccc',padding:'4px 8px',fontSize:12}} />
            <button className="btn btn-sm" type="submit">Create</button>
            <button className="btn btn-sm btn-ghost" type="button" onClick={() => setCreating(false)}>Cancel</button>
          </form>
        )}

        {orgs.length === 0 && <p className="muted">No organisations yet. Create one to get started.</p>}

        <table className="list-table" style={{marginBottom:24}}>
          <tbody>
            {orgs.map(org => (
              <tr key={org.id} onClick={() => navigate(`/org/${org.id}`)}>
                <td style={{fontWeight:'bold'}}>{org.name}</td>
                <td style={{color:'#999',fontSize:11}}>click to open</td>
              </tr>
            ))}
          </tbody>
        </table>

        {recentSessions.length > 0 && (
          <>
            <div className="section-sep" style={{marginBottom:8}}>Recent sessions</div>
            <table className="list-table">
              <thead><tr><th>Session</th><th>Org</th><th>Status</th><th>Participants</th></tr></thead>
              <tbody>
                {recentSessions.map(s => (
                  <tr key={s.id} onClick={() => navigate(`/session/${s.id}`)}>
                    <td style={{fontWeight:'bold'}}>{s.name}</td>
                    <td className="muted">{s.orgName}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td className="muted">{s.participantIds?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  )
}
