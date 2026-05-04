import { useState } from 'react'
import { addRisk } from '../lib/firestore'

const CATEGORIES = ['Timeline', 'Technical', 'Team', 'External', 'Scope', 'Communication']

export function AddRiskForm({ sessionId, user, onAdded }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Timeline', likelihood: 3, impact: 3,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await addRisk(sessionId, user.uid, user.displayName || user.email, {
      ...form, category: form.category.toLowerCase(),
    })
    setForm({ title: '', description: '', category: 'Timeline', likelihood: 3, impact: 3 })
    setSaving(false)
    onAdded?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-field">
        <label>Title *</label>
        <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
          placeholder="What could go wrong?" required />
      </div>
      <div className="form-field">
        <label>Description</label>
        <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
          placeholder="What happened and why did it fail?" />
      </div>
      <div className="form-field">
        <label>Category *</label>
        <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-field">
        <label>Likelihood</label>
        <div className="scale-row">
          {[1,2,3,4,5].map(n => (
            <button type="button" key={n} className={`scale-btn${form.likelihood===n?' sel':''}`}
              onClick={()=>setForm(f=>({...f,likelihood:n}))}>{n}</button>
          ))}
        </div>
      </div>
      <div className="form-field">
        <label>Impact</label>
        <div className="scale-row">
          {[1,2,3,4,5].map(n => (
            <button type="button" key={n} className={`scale-btn${form.impact===n?' sel':''}`}
              onClick={()=>setForm(f=>({...f,impact:n}))}>{n}</button>
          ))}
        </div>
      </div>
      <button className="sidebar-submit" type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save risk'}
      </button>
    </form>
  )
}
