import { AddRiskForm } from './AddRiskForm'

export function SessionSidebar({ session, user, myRiskCount, userVotes, onRiskAdded }) {
  const shareLink = `${window.location.origin}/join/${session.shareToken}`
  const votesUsed = userVotes?.length ?? 0
  const votesLeft = (session.votesPerParticipant ?? 3) - votesUsed

  return (
    <div className="page-sidebar">
      <div className="sidebar-block">
        <h3>Session stats</h3>
        <div className="stat-row"><span className="stat-label">Status</span>
          <span className={`stat-val-hi status-${session.status}`}>{session.status}</span></div>
        <div className="stat-row"><span className="stat-label">Participants</span>
          <span className="stat-val">{session.participantIds?.length ?? 0}</span></div>
        <div className="stat-row"><span className="stat-label">My risks</span>
          <span className="stat-val-hi">{myRiskCount}</span></div>
        <div className="stat-row"><span className="stat-label">Facilitator</span>
          <span className="stat-val">{session.facilitatorId === user.uid ? 'you' : '—'}</span></div>
        <div className="stat-row"><span className="stat-label">Created</span>
          <span className="stat-val">{session.createdAt?.toDate?.().toLocaleDateString() ?? '—'}</span></div>
      </div>

      {session.status === 'voting' && (
        <div className="sidebar-block">
          <h3>Your votes</h3>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12}}>
            <span><b>{votesLeft}</b> of {session.votesPerParticipant ?? 3} left</span>
            <div className="vote-pips">
              {Array.from({length: session.votesPerParticipant ?? 3}).map((_, i) => (
                <span key={i} className={`pip ${i < votesUsed ? 'used' : 'open'}`} />
              ))}
            </div>
          </div>
          <div style={{fontSize:10,color:'#999',marginTop:4}}>Stack votes on one risk if you want</div>
        </div>
      )}

      {session.status === 'open' && (
        <div className="sidebar-block">
          <h3>Add a risk</h3>
          <AddRiskForm sessionId={session.id} user={user} onAdded={onRiskAdded} />
        </div>
      )}

      <div className="sidebar-block">
        <h3>Share session</h3>
        <div style={{fontSize:11,color:'#888',marginBottom:5}}>Anyone with this link can join</div>
        <input readOnly value={shareLink}
          style={{width:'100%',fontSize:10,border:'1px solid #d0d0c8',padding:'3px 5px',background:'#fff'}} />
        <div style={{marginTop:4}}>
          <a href="#" onClick={e=>{e.preventDefault();navigator.clipboard.writeText(shareLink)}} style={{fontSize:11}}>copy link</a>
        </div>
      </div>
    </div>
  )
}
