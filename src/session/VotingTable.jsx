import { useState } from 'react'
import { castVote, deleteVote, updateRisk, deleteRisk } from '../lib/firestore'

export function VotingTable({ risks, votes, currentUserId, sessionId, votesPerParticipant = 3, onChanged }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const userVotes = votes.filter(v => v.userId === currentUserId)
  const votesLeft = votesPerParticipant - userVotes.length

  const getNetVotes = (riskId) => {
    const riskVotes = votes.filter(v => v.riskId === riskId)
    return riskVotes.reduce((sum, v) => sum + (v.direction || 1), 0)
  }

  const getUserVoteFor = (riskId) => {
    return userVotes.find(v => v.riskId === riskId) || null
  }

  const handleVote = async (riskId, direction) => {
    const existing = getUserVoteFor(riskId)
    if (existing && existing.direction === direction) {
      // Same direction: remove vote
      await deleteVote(existing.id)
    } else if (existing) {
      // Different direction: replace vote
      await deleteVote(existing.id)
      await castVote(sessionId, riskId, currentUserId, direction)
    } else if (votesLeft > 0) {
      // No vote: add new vote
      await castVote(sessionId, riskId, currentUserId, direction)
    }
  }

  const startEdit = (r) => {
    setEditing(r.id)
    setForm({ title: r.title, description: r.description, category: r.category, likelihood: r.likelihood, impact: r.impact })
  }

  const handleSave = async (riskId) => {
    await updateRisk(riskId, form)
    setEditing(null)
    onChanged?.()
  }

  const handleDelete = async (riskId) => {
    if (!confirm('Delete this risk?')) return
    await deleteRisk(riskId)
    onChanged?.()
  }

  const sorted = [...risks].sort((a, b) => getNetVotes(b.id) - getNetVotes(a.id))

  if (risks.length === 0) return <p className="muted" style={{padding:'8px 6px'}}>No risks to vote on. Wait until the facilitator reveals them.</p>

  return (
    <table className="risk-table">
      <thead>
        <tr>
          <th style={{width:44,textAlign:'center'}}>Votes</th>
          <th style={{width:20}}></th>
          <th>Risk</th>
          <th>Category</th>
          <th>L / I</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r, i) => {
          const netVotes = getNetVotes(r.id)
          const myVote = getUserVoteFor(r.id)
          return (
            <tr key={r.id}>
              <td className="vote-cell">
                <div style={{textAlign:'center',marginBottom:4,fontWeight:'bold',fontSize:14,color: netVotes > 0 ? '#4a90e2' : netVotes < 0 ? '#e24a4a' : '#999'}}>
                  {netVotes > 0 ? '+' : ''}{netVotes}
                </div>
                <div style={{display:'flex',gap:2,fontSize:10}}>
                  <button
                    onClick={() => handleVote(r.id, 1)}
                    disabled={votesLeft <= 0 && !myVote}
                    style={{flex:1,padding:'2px 4px',cursor:'pointer',backgroundColor: myVote?.direction === 1 ? '#4a90e2' : '#eee',color: myVote?.direction === 1 ? '#fff' : '#000',border:'none',borderRadius:3}}
                    title="Upvote"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleVote(r.id, -1)}
                    disabled={votesLeft <= 0 && !myVote}
                    style={{flex:1,padding:'2px 4px',cursor:'pointer',backgroundColor: myVote?.direction === -1 ? '#e24a4a' : '#eee',color: myVote?.direction === -1 ? '#fff' : '#000',border:'none',borderRadius:3}}
                    title="Downvote"
                  >
                    ▼
                  </button>
                </div>
              </td>
              <td className="row-num">{i+1}.</td>
              <td>
                <div className="risk-title-cell">
                  {editing === r.id ? (
                    <div>
                      <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                        style={{width:'100%',border:'1px solid #ccc',padding:'2px 4px',fontSize:12,marginBottom:4}} />
                      <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                        style={{width:'100%',border:'1px solid #ccc',padding:'2px 4px',fontSize:12,marginBottom:4,minHeight:40}} />
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>handleSave(r.id)} style={{flex:1,padding:'4px 8px',fontSize:11,backgroundColor:'#4a90e2',color:'#fff',border:'none',cursor:'pointer'}}>Save</button>
                        <button onClick={()=>setEditing(null)} style={{flex:1,padding:'4px 8px',fontSize:11,backgroundColor:'#ccc',border:'none',cursor:'pointer'}}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <span>{r.title}</span>
                        {r.authorId === currentUserId && (
                          <div style={{display:'flex',gap:4}}>
                            <button onClick={()=>startEdit(r)} style={{padding:'0 4px',fontSize:10,cursor:'pointer',backgroundColor:'transparent',border:'none',color:'#4a90e2'}}>edit</button>
                            <button onClick={()=>handleDelete(r.id)} style={{padding:'0 4px',fontSize:10,cursor:'pointer',backgroundColor:'transparent',border:'none',color:'#e24a4a'}}>delete</button>
                          </div>
                        )}
                      </div>
                      {r.description && <div className="risk-desc-cell">{r.description}</div>}
                      {r.authorId === currentUserId && <span className="my-badge">mine</span>}
                    </>
                  )}
                </div>
              </td>
              <td className="cat-col">{editing === r.id ? (
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                  style={{width:'100%',padding:'2px 4px',fontSize:12}}>
                  <option>We are working on it</option>
                  <option>No one is talking about it</option>
                  <option>Seems big, but is not</option>
                </select>
              ) : r.category}</td>
              <td className="li-col">{editing === r.id ? (
                <div style={{display:'flex',gap:4}}>
                  <select value={form.likelihood} onChange={e=>setForm(f=>({...f,likelihood:parseInt(e.target.value)}))}
                    style={{width:40,padding:'2px 4px',fontSize:12}}>
                    {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
                  </select>
                  <span>/</span>
                  <select value={form.impact} onChange={e=>setForm(f=>({...f,impact:parseInt(e.target.value)}))}
                    style={{width:40,padding:'2px 4px',fontSize:12}}>
                    {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              ) : `${r.likelihood} / ${r.impact}`}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
