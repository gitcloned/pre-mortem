import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import {
  subscribeSession, getProject, getOrg,
  getMyRisks, getSessionRisks, subscribeVotes,
  getSessionActionItems, advanceSessionStatus,
} from '../lib/firestore'
import { SessionSidebar } from '../session/SessionSidebar'
import { RiskTable } from '../session/RiskTable'
import { RevealedTable } from '../session/RevealedTable'
import { VotingTable } from '../session/VotingTable'
import { ClosedTable } from '../session/ClosedTable'
import { toMarkdown, toCSV } from '../lib/export'

const STATUS_NEXT = { open: 'revealed', revealed: 'voting', voting: 'closed' }
const STATUS_LABEL = { open: 'Reveal all risks →', revealed: 'Open voting →', voting: 'Close voting →' }

export function SessionPage() {
  const { sessionId } = useParams()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [project, setProject] = useState(null)
  const [org, setOrg] = useState(null)
  const [myRisks, setMyRisks] = useState([])
  const [allRisks, setAllRisks] = useState([])
  const [votes, setVotes] = useState([])
  const [actionItems, setActionItems] = useState([])

  useEffect(() => {
    if (!sessionId) return
    const unsubSession = subscribeSession(sessionId, setSession)
    const unsubVotes = subscribeVotes(sessionId, setVotes)
    return () => { unsubSession(); unsubVotes() }
  }, [sessionId])

  useEffect(() => {
    if (!session) return
    Promise.all([getProject(session.projectId), getOrg(session.orgId)])
      .then(([p, o]) => { setProject(p); setOrg(o) })
  }, [session?.projectId, session?.orgId])

  const loadRisks = useCallback(async () => {
    if (!session || !user) return
    if (session.status === 'open') {
      const mine = await getMyRisks(sessionId, user.uid)
      setMyRisks(mine)
    } else {
      const all = await getSessionRisks(sessionId)
      setAllRisks(all)
      setMyRisks(all.filter(r => r.authorId === user.uid))
    }
  }, [session?.status, sessionId, user])

  const loadActionItems = useCallback(async () => {
    if (session?.status === 'closed') {
      setActionItems(await getSessionActionItems(sessionId))
    }
  }, [session?.status, sessionId])

  useEffect(() => { loadRisks() }, [loadRisks])
  useEffect(() => { loadActionItems() }, [loadActionItems])

  const handleAdvance = async () => {
    const next = STATUS_NEXT[session.status]
    if (!next) return
    await advanceSessionStatus(sessionId, next)
  }

  const handleExportMarkdown = () => {
    const md = toMarkdown(session, project?.name ?? '', allRisks, actionItems)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${session.name}.md`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const csv = toCSV(session, project?.name ?? '', allRisks, actionItems)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${session.name}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!session || !user) return <><Nav /><div className="muted" style={{padding:20}}>Loading…</div></>

  const isFacilitator = session.facilitatorId === user.uid
  const userVotes = votes.filter(v => v.userId === user.uid)
  const crumbs = [
    ...(org ? [{ label: org.name, to: `/org/${org.id}` }] : []),
    ...(project ? [{ label: project.name, to: `/project/${project.id}` }] : []),
    { label: session.name },
  ]

  return (
    <>
      <Nav crumbs={crumbs} />

      {isFacilitator && session.status !== 'closed' && (
        <div className="subheader">
          <span style={{fontSize:11,color:'#888',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.05em'}}>
            Facilitator
          </span>
          <span className="muted">{session.participantIds?.length ?? 0} participants joined</span>
          <span className="spacer" />
          <button className="action-link" onClick={handleAdvance}>
            {STATUS_LABEL[session.status]}
          </button>
        </div>
      )}

      <div className="subheader">
        <span className={`status-${session.status}`}>
          {session.status === 'open' && '● Session open'}
          {session.status === 'revealed' && '● Risks revealed'}
          {session.status === 'voting' && '● Voting open'}
          {session.status === 'closed' && '■ Session closed'}
        </span>
        {session.status === 'open' && <span className="muted">Your risks are private until revealed</span>}
        {session.status === 'voting' && <span className="muted">{session.participantIds?.length ?? 0} participants · {allRisks.length} risks</span>}
        {session.status === 'closed' && (
          <>
            <span className="muted">{allRisks.length} risks · {session.participantIds?.length ?? 0} participants · {votes.length} votes</span>
            <span className="spacer" />
            <button className="action-link" onClick={handleExportMarkdown} style={{marginRight:4}}>↓ Markdown</button>
            <button className="action-link" onClick={handleExportCSV}>↓ CSV</button>
          </>
        )}
      </div>

      <div className="page-layout">
        <div className="page-main">
          <div className="session-info">
            <h1>{session.name}</h1>
            <div className="meta">
              {org?.name} · {project?.name} · {session.participantIds?.length ?? 0} participants
            </div>
            {session.description && <div className="session-prompt">{session.description}</div>}
          </div>

          {session.status === 'open' && (
            <><div className="section-sep">My risks ({myRisks.length})</div><RiskTable risks={myRisks} onChanged={loadRisks} /></>
          )}
          {session.status === 'revealed' && (
            <><div className="section-sep">All risks ({allRisks.length}) — grouped by category</div><RevealedTable risks={allRisks} currentUserId={user.uid} /></>
          )}
          {session.status === 'voting' && (
            <><div className="section-sep">All risks ({allRisks.length}) — vote on what concerns you most</div>
              <VotingTable risks={allRisks} votes={votes} currentUserId={user.uid} sessionId={sessionId}
                votesPerParticipant={session.votesPerParticipant ?? 3} />
            </>
          )}
          {session.status === 'closed' && (
            <><div className="section-sep">Results — ranked by votes</div>
              <ClosedTable risks={allRisks} votes={votes} actionItems={actionItems} sessionId={sessionId}
                onActionAdded={loadActionItems} />
            </>
          )}
        </div>

        <SessionSidebar session={session} user={user} myRiskCount={myRisks.length} userVotes={userVotes} onRiskAdded={loadRisks} />
      </div>
    </>
  )
}
