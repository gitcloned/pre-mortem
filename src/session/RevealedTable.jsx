const CATEGORY_ORDER = ['timeline','technical','team','external','scope','communication']

export function RevealedTable({ risks, currentUserId }) {
  const grouped = {}
  for (const cat of CATEGORY_ORDER) {
    const catRisks = risks.filter(r => r.category === cat)
    if (catRisks.length) grouped[cat] = catRisks
  }

  if (Object.keys(grouped).length === 0) return <p className="muted" style={{padding:'8px 6px'}}>No risks identified yet.</p>

  return (
    <>
      {Object.entries(grouped).map(([cat, catRisks]) => (
        <div key={cat}>
          <div className="section-sep" style={{marginBottom:0,textTransform:'capitalize'}}>{cat} ({catRisks.length})</div>
          <table className="risk-table" style={{marginBottom:8}}>
            <thead><tr><th style={{width:20}}></th><th>Risk</th><th>Author</th><th>L / I</th></tr></thead>
            <tbody>
              {catRisks.map((r, i) => (
                <tr key={r.id}>
                  <td className="row-num">{i+1}.</td>
                  <td>
                    <div className="risk-title-cell">
                      {r.title}
                      {r.authorId === currentUserId && <span className="my-badge">mine</span>}
                    </div>
                    {r.description && <div className="risk-desc-cell">{r.description}</div>}
                  </td>
                  <td className="muted" style={{fontSize:11,width:100}}>{r.authorName}</td>
                  <td className="li-col">{r.likelihood} / {r.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  )
}
