import { castVote } from '../lib/firestore'

export function VotingTable({ risks, votes, currentUserId, sessionId, votesPerParticipant = 3 }) {
  const userVotes = votes.filter(v => v.userId === currentUserId)
  const votesLeft = votesPerParticipant - userVotes.length
  const voteCountFor = (riskId) => votes.filter(v => v.riskId === riskId).length
  const myVoteCountFor = (riskId) => userVotes.filter(v => v.riskId === riskId).length

  const handleVote = async (riskId) => {
    if (votesLeft <= 0) return
    await castVote(sessionId, riskId, currentUserId)
  }

  const sorted = [...risks].sort((a, b) => voteCountFor(b.id) - voteCountFor(a.id))

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
          const total = voteCountFor(r.id)
          const mine = myVoteCountFor(r.id)
          const iVoted = mine > 0
          return (
            <tr key={r.id}>
              <td className="vote-cell">
                <div className={total > 0 ? 'vote-num' : 'vote-num-dim'}>{total}</div>
                <button
                  className={`vote-lnk${iVoted ? ' active' : ''}`}
                  onClick={() => handleVote(r.id)}
                  disabled={votesLeft <= 0 && !iVoted}
                >
                  ▲ {iVoted ? `voted (${mine})` : 'vote'}
                </button>
              </td>
              <td className="row-num">{i+1}.</td>
              <td>
                <div className="risk-title-cell">
                  {r.title}
                  {r.authorId === currentUserId && <span className="my-badge">mine</span>}
                </div>
                {r.description && <div className="risk-desc-cell">{r.description}</div>}
              </td>
              <td className="cat-col">{r.category}</td>
              <td className="li-col">{r.likelihood} / {r.impact}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
