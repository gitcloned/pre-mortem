import { useState } from 'react'
import { updateRisk, deleteRisk } from '../lib/firestore'

export function RiskTable({ risks, onChanged }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})

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

  if (risks.length === 0) return <p className="muted" style={{padding:'8px 6px'}}>No risks added yet. Use the form on the right.</p>

  return (
    <table className="risk-table">
      <thead>
        <tr><th style={{width:20}}></th><th>Risk</th><th>Category</th><th>L / I</th></tr>
      </thead>
      <tbody>
        {risks.map((r, i) => (
          <tr key={r.id}>
            <td className="row-num">{i+1}.</td>
            <td>
              {editing === r.id ? (
                <div>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                    style={{width:'100%',border:'1px solid #ccc',padding:'2px 4px',fontSize:12,marginBottom:4}} />
                  <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    style={{width:'100%',border:'1px solid #ccc',padding:'2px 4px',fontSize:11,height:48,resize:'vertical'}} />
                  <button className="btn btn-sm" onClick={() => handleSave(r.id)} style={{marginRight:4}}>Save</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div className="risk-title-cell">{r.title}</div>
                  {r.description && <div className="risk-desc-cell">{r.description}</div>}
                  <div className="risk-meta-links">
                    <a href="#" onClick={e=>{e.preventDefault();startEdit(r)}}>edit</a>
                    <a href="#" className="del" onClick={e=>{e.preventDefault();handleDelete(r.id)}}>delete</a>
                  </div>
                </>
              )}
            </td>
            <td className="cat-col">{r.category}</td>
            <td className="li-col">{r.likelihood} / {r.impact}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
