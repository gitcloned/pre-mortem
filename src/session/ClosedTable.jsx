import { useState } from 'react'
import { addActionItem } from '../lib/firestore'

export function ClosedTable({ risks, votes, actionItems, sessionId, onActionAdded }) {
  const [forms, setForms] = useState({})

  const voteCountFor = (riskId) => votes.filter(v => v.riskId === riskId).length
  const sorted = [...risks].sort((a, b) => voteCountFor(b.id) - voteCountFor(a.id))
  const itemsFor = (riskId) => actionItems.filter(a => a.riskId === riskId)

  const getForm = (riskId) => forms[riskId] ?? { assigneeName: '', remarks: '' }
  const setForm = (riskId, patch) => setForms(f => ({ ...f, [riskId]: { ...getForm(riskId), ...patch } }))

  const handleAdd = async (riskId) => {
    const f = getForm(riskId)
    if (!f.assigneeName.trim()) return
    await addActionItem(sessionId, riskId, f.assigneeName.trim(), f.remarks.trim())
    setForms(fs => ({ ...fs, [riskId]: { assigneeName: '', remarks: '' } }))
    onActionAdded?.()
  }

  if (risks.length === 0) return <p className="muted" style={{padding:'8px 6px'}}>No risks in this session.</p>

  return (
    <table className="risk-table">
      <thead>
        <tr>
          <th style={{width:44,textAlign:'center'}}>Votes</th>
          <th style={{width:20}}></th>
          <th>Risk</th>
          <th>Category</th>
          <th>L / I</th>
          <th>Action item</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r, i) => {
          const total = voteCountFor(r.id)
          const items = itemsFor(r.id)
          const f = getForm(r.id)
          return (
            <tr key={r.id}>
              <td className="vote-cell"><div className={total > 0 ? 'vote-num' : 'vote-num-dim'}>{total}</div></td>
              <td className="row-num">{i+1}.</td>
              <td>
                <div className="risk-title-cell">{r.title}</div>
                {r.description && <div className="risk-desc-cell">{r.description}</div>}
              </td>
              <td className="cat-col">{r.category}</td>
              <td className="li-col">{r.likelihood} / {r.impact}</td>
              <td className="action-col">
                {items.map((a, ai) => (
                  <div key={ai} style={{marginBottom:3}}>
                    <span className="assignee-name">{a.assigneeName}</span> — {a.remarks}
                  </div>
                ))}
                <div className="inline-action">
                  <input placeholder="Assignee" value={f.assigneeName}
                    onChange={e=>setForm(r.id,{assigneeName:e.target.value})} />
                  <input placeholder="Remarks" value={f.remarks}
                    onChange={e=>setForm(r.id,{remarks:e.target.value})} />
                  <button onClick={() => handleAdd(r.id)}>add</button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
