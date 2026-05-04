import {
  doc, collection, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, arrayUnion, onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import { generateToken } from './tokens'

export async function upsertUser(uid, displayName, email) {
  await setDoc(doc(db, 'users', uid), { displayName, email, createdAt: serverTimestamp() }, { merge: true })
}

export async function createOrg(uid, name) {
  const inviteToken = generateToken()
  const orgRef = await addDoc(collection(db, 'organizations'), {
    name, ownerId: uid, inviteToken, createdAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'organizations', orgRef.id, 'members', uid), {
    role: 'owner', joinedAt: serverTimestamp(),
  })
  return orgRef.id
}

export async function getOrg(orgId) {
  const snap = await getDoc(doc(db, 'organizations', orgId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getOrgByInviteToken(token) {
  const q = query(collection(db, 'organizations'), where('inviteToken', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export async function getUserOrgs(uid) {
  const snap = await getDocs(collection(db, 'organizations'))
  const orgs = []
  for (const orgDoc of snap.docs) {
    const memberSnap = await getDoc(doc(db, 'organizations', orgDoc.id, 'members', uid))
    if (memberSnap.exists()) orgs.push({ id: orgDoc.id, ...orgDoc.data() })
  }
  return orgs
}

export async function getOrgMembers(orgId) {
  const snap = await getDocs(collection(db, 'organizations', orgId, 'members'))
  const members = []
  for (const m of snap.docs) {
    const userSnap = await getDoc(doc(db, 'users', m.id))
    members.push({ uid: m.id, ...m.data(), ...(userSnap.exists() ? userSnap.data() : {}) })
  }
  return members
}

export async function getOrgMembership(orgId, uid) {
  const snap = await getDoc(doc(db, 'organizations', orgId, 'members', uid))
  return snap.exists() ? snap.data() : null
}

export async function joinOrgByToken(token, uid) {
  const org = await getOrgByInviteToken(token)
  if (!org) throw new Error('Invalid invite token')
  await setDoc(doc(db, 'organizations', org.id, 'members', uid), {
    role: 'member', joinedAt: serverTimestamp(),
  })
  return org.id
}

export async function updateMemberRole(orgId, uid, role) {
  await updateDoc(doc(db, 'organizations', orgId, 'members', uid), { role })
}

export async function removeMember(orgId, uid) {
  await deleteDoc(doc(db, 'organizations', orgId, 'members', uid))
}

export async function createProject(orgId, uid, name, description) {
  const ref = await addDoc(collection(db, 'projects'), {
    orgId, name, description, status: 'active', createdBy: uid, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getOrgProjects(orgId) {
  const snap = await getDocs(query(
    collection(db, 'projects'), where('orgId', '==', orgId), orderBy('createdAt', 'desc'),
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getProject(projectId) {
  const snap = await getDoc(doc(db, 'projects', projectId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function setProjectStatus(projectId, status) {
  await updateDoc(doc(db, 'projects', projectId), { status })
}

export async function createSession(orgId, projectId, facilitatorId, name, description) {
  const shareToken = generateToken()
  const ref = await addDoc(collection(db, 'sessions'), {
    orgId, projectId, facilitatorId, name, description,
    status: 'open', shareToken, participantIds: [facilitatorId],
    votesPerParticipant: 3, createdAt: serverTimestamp(), closedAt: null,
  })
  return { id: ref.id, shareToken }
}

export async function getSession(sessionId) {
  const snap = await getDoc(doc(db, 'sessions', sessionId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getSessionByToken(shareToken) {
  const q = query(collection(db, 'sessions'), where('shareToken', '==', shareToken))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export async function getProjectSessions(projectId) {
  const snap = await getDocs(query(
    collection(db, 'sessions'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'),
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getRecentSessions(orgId) {
  const snap = await getDocs(query(
    collection(db, 'sessions'), where('orgId', '==', orgId), orderBy('createdAt', 'desc'),
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function advanceSessionStatus(sessionId, nextStatus) {
  const update = { status: nextStatus }
  if (nextStatus === 'closed') update.closedAt = serverTimestamp()
  await updateDoc(doc(db, 'sessions', sessionId), update)
}

export async function joinSession(sessionId, uid) {
  await updateDoc(doc(db, 'sessions', sessionId), { participantIds: arrayUnion(uid) })
}

export function subscribeSession(sessionId, cb) {
  return onSnapshot(doc(db, 'sessions', sessionId), snap => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function addRisk(sessionId, authorId, authorName, { title, description, category, likelihood, impact }) {
  const ref = await addDoc(collection(db, 'risks'), {
    sessionId, authorId, authorName, title, description,
    category, likelihood, impact, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateRisk(riskId, data) {
  await updateDoc(doc(db, 'risks', riskId), data)
}

export async function deleteRisk(riskId) {
  await deleteDoc(doc(db, 'risks', riskId))
}

export async function getMyRisks(sessionId, authorId) {
  const snap = await getDocs(query(
    collection(db, 'risks'), where('sessionId', '==', sessionId),
    where('authorId', '==', authorId), orderBy('createdAt', 'asc'),
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getSessionRisks(sessionId) {
  const snap = await getDocs(query(
    collection(db, 'risks'), where('sessionId', '==', sessionId), orderBy('createdAt', 'asc'),
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function castVote(sessionId, riskId, userId) {
  await addDoc(collection(db, 'votes'), { sessionId, riskId, userId, timestamp: serverTimestamp() })
}

export function subscribeVotes(sessionId, cb) {
  return onSnapshot(
    query(collection(db, 'votes'), where('sessionId', '==', sessionId)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
  )
}

export async function addActionItem(sessionId, riskId, assigneeName, remarks) {
  await addDoc(collection(db, 'actionItems'), {
    sessionId, riskId, assigneeName, remarks, createdAt: serverTimestamp(),
  })
}

export async function getSessionActionItems(sessionId) {
  const snap = await getDocs(query(collection(db, 'actionItems'), where('sessionId', '==', sessionId)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
