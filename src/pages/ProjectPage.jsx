import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import {
  getProject, getProjectSessions, createSession, setProjectStatus,
  getOrg, getOrgMembership,
} from '../lib/firestore'

export function ProjectPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [org, setOrg] = useState(null)
  const [sessions, setSessions] = useState([])
  const [membership, setMembership] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const load = async () => {
    const p = await getProject(projectId)
    setProject(p)
    const [o, ss, m] = await Promise.all([
      getOrg(p.orgId), getProjectSessions(projectId), getOrgMembership(p.orgId, user.uid),
    ])
    setOrg(o); setSessions(ss); setMembership(m)
  }

  useEffect(() => { if (user) load() }, [projectId, user])

  const handleCreate = async (e) => {
    e.preventDefault()
    const { id } = await createSession(project.orgId, projectId, user.uid,
      form.name.trim(), form.description.trim())
    navigate(`/session/${id}`)
  }

  const handleArchive = async () => {
    const next = project.status === 'active' ? 'archived' : 'active'
    await setProjectStatus(projectId, next)
    await load()
  }

  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'

  if (!project || !org) return <><Nav /><div className="muted" style={{padding:20}}>Loading…</div></>

  return (
    <>
      <Nav crumbs={[
        { label: org.name, to: `/org/${project.orgId}` },
        { label: project.name },
      ]} />
      <div className="page-wrap">
        <div className="page-header">
          <h1>{project.name} <span className={`badge badge-${project.status}`}>{project.status}</span></h1>
          <div style={{display:'flex',gap:8}}>
            {isAdmin && (
              <button className="btn btn-sm btn-ghost" onClick={handleArchive}>
                {project.status === 'active' ? 'Archive' : 'Unarchive'}
              </button>
            )}
            <button className="btn btn-sm" onClick={() => setCreating(c=>!c)}>+ New session</button>
          </div>
        </div>

        {project.description && <p style={{fontSize:12,color:'#666',marginBottom:12}}>{project.description}</p>}

        {creating && (
          <form onSubmit={handleCreate} style={{marginBottom:16,background:'#fffff0',border:'1px solid #d8d8d0',padding:12}}>
            <div className="form-row"><label>Session name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required
                placeholder="e.g. Launch risk review v1" />
            </div>
            <div className="form-row"><label>Prompt (shown to participants)</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                placeholder={`"It's [date]. The project failed. What went wrong?"`} />
            </div>
            <button className="btn btn-sm" type="submit">Create session</button>{' '}
            <button className="btn btn-sm btn-ghost" type="button" onClick={() => setCreating(false)}>Cancel</button>
          </form>
        )}

        <div className="section-sep" style={{marginBottom:0}}>Sessions ({sessions.length})</div>
        <table className="list-table">
          <thead><tr><th>Name</th><th>Status</th><th>Participants</th><th>Created</th></tr></thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} onClick={() => navigate(`/session/${s.id}`)}>
                <td style={{fontWeight:'bold'}}>{s.name}</td>
                <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                <td className="muted">{s.participantIds?.length ?? 0}</td>
                <td className="muted">{s.createdAt?.toDate?.().toLocaleDateString() ?? '—'}</td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan={4} className="muted" style={{padding:'8px 6px'}}>No sessions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
