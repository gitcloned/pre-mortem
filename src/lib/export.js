export function toMarkdown(session, projectName, risks, actionItems) {
  const sorted = [...risks].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
  const lines = [
    `# Pre-Mortem: ${session.name}`,
    `Project: ${projectName}`,
    `Date: ${session.createdAt?.toDate?.().toLocaleDateString() ?? ''}`,
    `Participants: ${session.participantIds?.length ?? 0}`,
    '',
    '## Risks (ranked by votes)',
    '',
  ]
  sorted.forEach((r, i) => {
    lines.push(`### ${i + 1}. ${r.title} [${r.voteCount ?? 0} votes]`)
    lines.push(`Category: ${r.category} | Likelihood: ${r.likelihood} | Impact: ${r.impact}`)
    if (r.description) lines.push(r.description)
    const items = actionItems.filter(a => a.riskId === r.id)
    if (items.length) {
      lines.push('**Action items:**')
      items.forEach(a => lines.push(`- ${a.assigneeName}: ${a.remarks}`))
    }
    lines.push('')
  })
  return lines.join('\n')
}

export function toCSV(session, projectName, risks, actionItems) {
  const sorted = [...risks].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
  const rows = [['Rank','Title','Category','Likelihood','Impact','Votes','Assignee','Remarks']]
  sorted.forEach((r, i) => {
    const items = actionItems.filter(a => a.riskId === r.id)
    if (items.length === 0) {
      rows.push([i+1, r.title, r.category, r.likelihood, r.impact, r.voteCount ?? 0, '', ''])
    } else {
      items.forEach((a, ai) => {
        rows.push([
          ai === 0 ? i+1 : '', ai === 0 ? r.title : '', ai === 0 ? r.category : '',
          ai === 0 ? r.likelihood : '', ai === 0 ? r.impact : '', ai === 0 ? r.voteCount ?? 0 : '',
          a.assigneeName, a.remarks,
        ])
      })
    }
  })
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
}
