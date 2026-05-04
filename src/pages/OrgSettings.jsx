import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { getOrg, getOrgMembers, getOrgMembership, updateMemberRole, removeMember } from '../lib/firestore'

export function OrgSettings() {
  const { orgId } = useParams()
  const { user } = useAuth()
  const [org, setOrg] = useState(null)
  const [members, setMembers] = useState([])
  const [myRole, setMyRole] = useState(null)

  const load = async () => {
    const [o, ms, m] = await Promise.all([
      getOrg(orgId), getOrgMembers(orgId), getOrgMembership(orgId, user.uid),
    ])
    setOrg(o); setMembers(ms); setMyRole(m?.role)
  }

  useEffect(() => { if (user) load() }, [orgId, user])

  const handleRoleChange = async (uid, role) => {
    await updateMemberRole(orgId, uid, role)
    await load()
  }

  const handleRemove = async (uid) => {
    if (!confirm('Remove this member?')) return
    await removeMember(orgId, uid)
    await load()
  }

  if (!org) return <><Nav /><div className="muted" style={{padding:20}}>Loading…</div></>

  const inviteLink = `${window.location.origin}/join-org/${org.inviteToken}`

  return (
    <>
      <Nav crumbs={[{ label: org.name, to: `/org/${orgId}` }, { label: 'Settings' }]} />
      <div className="page-wrap">
        <div className="page-header">
          <h1>Organisation settings — {org.name}</h1>
          <Link to={`/org/${orgId}`}><button className="btn btn-sm btn-ghost">← Back</button></Link>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:'bold',color:'#666',marginBottom:4}}>INVITE LINK</div>
          <div style={{fontSize:11,color:'#555',marginBottom:4}}>Anyone who opens this link and creates an account joins as Member.</div>
          <span className="code-box">{inviteLink}</span>{' '}
          <a href="#" onClick={e=>{e.preventDefault();navigator.clipboard.writeText(inviteLink)}} style={{fontSize:11}}>copy</a>
        </div>

        <div className="section-sep" style={{marginBottom:0}}>Members ({members.length})</div>
        <table className="list-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.uid}>
                <td style={{fontWeight:'bold'}}>{m.displayName || '—'}</td>
                <td className="muted">{m.email}</td>
                <td>
                  {myRole === 'owner' && m.uid !== user.uid ? (
                    <select value={m.role} onChange={e => handleRoleChange(m.uid, e.target.value)}
                      style={{fontSize:11,border:'1px solid #ccc',padding:'2px 4px'}}>
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                    </select>
                  ) : <span>{m.role}</span>}
                </td>
                <td>
                  {m.uid !== user.uid && myRole !== 'member' && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleRemove(m.uid)}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
