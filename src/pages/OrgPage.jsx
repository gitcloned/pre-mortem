import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { getOrg, getOrgProjects, createProject, getOrgMembership } from '../lib/firestore'

export function OrgPage() {
  const { orgId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [org, setOrg] = useState(null)
  const [projects, setProjects] = useState([])
  const [membership, setMembership] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    if (!user) return
    Promise.all([getOrg(orgId), getOrgProjects(orgId), getOrgMembership(orgId, user.uid)])
      .then(([o, ps, m]) => { setOrg(o); setProjects(ps); setMembership(m) })
  }, [orgId, user])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const id = await createProject(orgId, user.uid, form.name.trim(), form.description.trim())
    navigate(`/project/${id}`)
  }

  const inviteLink = org ? `${window.location.origin}/join-org/${org.inviteToken}` : ''
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'
  const active = projects.filter(p => p.status === 'active')
  const archived = projects.filter(p => p.status === 'archived')

  if (!org) return <><Nav /><div className="muted" style={{padding:20}}>Loading…</div></>

  return (
    <>
      <Nav crumbs={[{ label: org.name }]} />
      <div className="page-wrap">
        <div className="page-header">
          <h1>{org.name}</h1>
          <div style={{display:'flex',gap:8}}>
            {isAdmin && <Link to={`/org/${orgId}/settings`}><button className="btn btn-sm btn-ghost">Settings</button></Link>}
            <button className="btn btn-sm" onClick={() => setCreating(c => !c)}>+ New project</button>
          </div>
        </div>

        {isAdmin && (
          <div style={{marginBottom:12,fontSize:11,color:'#666'}}>
            Org invite link: <span className="code-box">{inviteLink}</span>{' '}
            <a href="#" onClick={e=>{e.preventDefault();navigator.clipboard.writeText(inviteLink)}}>copy</a>
          </div>
        )}

        {creating && (
          <form onSubmit={handleCreate} style={{marginBottom:16,background:'#fffff0',border:'1px solid #d8d8d0',padding:12}}>
            <div className="form-row"><label>Project name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
            </div>
            <div className="form-row"><label>Description</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
            </div>
            <button className="btn btn-sm" type="submit">Create project</button>{' '}
            <button className="btn btn-sm btn-ghost" type="button" onClick={() => setCreating(false)}>Cancel</button>
          </form>
        )}

        <div className="section-sep" style={{marginBottom:0}}>Active projects ({active.length})</div>
        <table className="list-table">
          <tbody>
            {active.map(p => (
              <tr key={p.id} onClick={() => navigate(`/project/${p.id}`)}>
                <td style={{fontWeight:'bold'}}>{p.name}</td>
                <td className="muted">{p.description}</td>
                <td><span className="badge badge-active">active</span></td>
              </tr>
            ))}
            {active.length === 0 && <tr><td colSpan={3} className="muted" style={{padding:'8px 6px'}}>No active projects.</td></tr>}
          </tbody>
        </table>

        {archived.length > 0 && (
          <>
            <div style={{marginTop:12}}>
              <a href="#" onClick={e=>{e.preventDefault();setShowArchived(s=>!s)}} style={{fontSize:11}}>
                {showArchived ? '▲' : '▼'} Archived projects ({archived.length})
              </a>
            </div>
            {showArchived && (
              <table className="list-table" style={{marginTop:4}}>
                <tbody>
                  {archived.map(p => (
                    <tr key={p.id} onClick={() => navigate(`/project/${p.id}`)}>
                      <td style={{color:'#999'}}>{p.name}</td>
                      <td><span className="badge badge-archived">archived</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </>
  )
}
