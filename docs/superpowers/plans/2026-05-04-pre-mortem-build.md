# Pre-Mortem App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + Firebase pre-mortem web app with org management, project management, and session flow (open → revealed → voting → closed).

**Architecture:** Vite + React SPA, React Router v6, Firestore for all data, Firebase Auth (email + Google), Firebase Hosting. No backend server — all logic client-side with Firestore security rules.

**Tech Stack:** React 18, Vite, React Router v6, Firebase 10, plain CSS (HN-style, no Tailwind — simpler given the design)

---

## File Map

```
src/
  main.jsx                        # entry point
  App.jsx                         # router + auth provider
  firebase.js                     # Firebase init, auth, db exports
  index.css                       # global HN-style CSS vars + resets

  hooks/
    useAuth.js                    # current user + loading state
    useOrgMembership.js           # is user member/admin/owner of org

  lib/
    firestore.js                  # all Firestore read/write functions
    export.js                     # CSV + Markdown export (pure)
    tokens.js                     # nanoid shareToken generator

  components/
    Nav.jsx                       # top nav bar
    ProtectedRoute.jsx            # redirect to /auth if not logged in

  pages/
    Landing.jsx                   # /
    Auth.jsx                      # /auth
    Dashboard.jsx                 # /dashboard
    OrgPage.jsx                   # /org/:orgId
    OrgSettings.jsx               # /org/:orgId/settings
    ProjectPage.jsx               # /project/:projectId
    JoinPage.jsx                  # /join/:shareToken
    SessionPage.jsx               # /session/:sessionId (all states)

  session/
    SessionSidebar.jsx            # right sidebar: stats + add form + share link
    RiskTable.jsx                 # open state: my risks table
    RevealedTable.jsx             # revealed state: all risks by category
    VotingTable.jsx               # voting state: risks + vote buttons
    ClosedTable.jsx               # closed state: ranked + action items
    AddRiskForm.jsx               # sidebar form

firestore.rules                   # Firestore security rules
.env                              # Firebase config vars
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/index.css`, `.env`, `.gitignore`

- [ ] **Step 1: Scaffold Vite + React project**

```bash
cd /Users/ashishjain/Documents/Code/pre-mortem
npm create vite@latest . -- --template react
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install firebase react-router-dom nanoid
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
  },
})
```

- [ ] **Step 4: Create src/test-setup.js**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create .env**

```
VITE_FIREBASE_API_KEY=AIzaSyCNjqXss9NFudpcgNNE4uWnp1dqbqmuqCU
VITE_FIREBASE_AUTH_DOMAIN=pre-mortem-7a324.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pre-mortem-7a324
VITE_FIREBASE_STORAGE_BUCKET=pre-mortem-7a324.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=681472464870
VITE_FIREBASE_APP_ID=1:681472464870:web:50769612045198cdd66827
VITE_FIREBASE_MEASUREMENT_ID=G-PPV5BS7WPP
```

- [ ] **Step 6: Create src/index.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: Verdana, Geneva, sans-serif;
  font-size: 13px;
  background: #f6f6ef;
  color: #222;
}

a { color: #4f46e5; text-decoration: none; }
a:hover { text-decoration: underline; }

input, select, textarea, button {
  font-family: Verdana, Geneva, sans-serif;
  font-size: 12px;
}

/* NAV */
.nav { background: #4f46e5; padding: 4px 12px; display: flex; align-items: center; gap: 12px; }
.nav-logo { color: white; font-weight: bold; font-size: 13px; border: 1px solid rgba(255,255,255,0.4); padding: 1px 5px; text-decoration: none; }
.nav-crumb { color: white; font-size: 12px; }
.nav-crumb-sep { color: rgba(255,255,255,0.3); margin: 0 6px; }
.nav-right { margin-left: auto; color: rgba(255,255,255,0.85); font-size: 12px; display: flex; gap: 10px; align-items: center; }
.nav-right a { color: white; }

/* SUBHEADER */
.subheader { background: #e8e8e0; padding: 3px 12px; font-size: 11px; color: #555; border-bottom: 1px solid #d8d8d0; display: flex; align-items: center; gap: 14px; }
.subheader .spacer { flex: 1; }
.action-link { background: #4f46e5; color: white !important; padding: 2px 10px; font-size: 11px; font-weight: bold; text-decoration: none !important; cursor: pointer; border: none; }
.action-link:hover { background: #3730a3; }
.action-link-danger { background: #dc2626; }
.action-link-danger:hover { background: #b91c1c; }

/* STATUS */
.status-open   { color: #1a7f37; font-weight: bold; }
.status-voting { color: #9a6700; font-weight: bold; }
.status-closed { color: #555;    font-weight: bold; }
.status-revealed { color: #1d4ed8; font-weight: bold; }

/* LAYOUT */
.page-layout { display: flex; width: 100%; min-height: calc(100vh - 32px); }
.page-main { flex: 1; padding: 10px 14px; min-width: 0; }
.page-sidebar { width: 230px; flex-shrink: 0; border-left: 1px solid #d8d8d0; background: #efefea; padding: 10px 12px; display: flex; flex-direction: column; gap: 16px; }

/* SIDEBAR BLOCKS */
.sidebar-block h3 { font-size: 10px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px; border-bottom: 1px solid #d8d8d0; margin-bottom: 7px; }
.stat-row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
.stat-label { color: #777; }
.stat-val { font-weight: bold; color: #222; }
.stat-val-hi { font-weight: bold; color: #4f46e5; }

/* FORMS (sidebar) */
.form-field { margin-bottom: 7px; }
.form-field label { display: block; font-size: 10px; font-weight: bold; color: #666; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.03em; }
.form-field input, .form-field select, .form-field textarea {
  width: 100%; border: 1px solid #d0d0c8; padding: 3px 5px; background: white; font-family: Verdana; font-size: 11px;
}
.form-field textarea { height: 54px; resize: vertical; }
.scale-row { display: flex; gap: 2px; }
.scale-btn { flex: 1; border: 1px solid #d0d0c8; background: white; font-size: 11px; cursor: pointer; padding: 2px 0; }
.scale-btn.sel { background: #4f46e5; color: white; border-color: #4f46e5; }
.sidebar-submit { width: 100%; background: #4f46e5; color: white; border: none; padding: 5px 0; font-size: 12px; font-weight: bold; cursor: pointer; margin-top: 2px; }
.sidebar-submit:hover { background: #3730a3; }

/* TABLES */
.risk-table { width: 100%; border-collapse: collapse; }
.risk-table thead tr { background: #e8e8e0; }
.risk-table thead th { text-align: left; font-size: 10px; font-weight: bold; padding: 3px 6px; color: #666; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #d8d8d0; }
.risk-table tbody tr { border-bottom: 1px solid #eeeee6; vertical-align: top; }
.risk-table tbody tr:last-child { border-bottom: none; }
.risk-table tbody tr:hover { background: #fffef0; }
.risk-table tbody td { padding: 5px 6px; font-size: 12px; line-height: 1.4; }
.row-num { color: #bbb; font-size: 11px; width: 20px; text-align: right; }
.risk-title-cell { font-weight: bold; font-size: 12px; }
.risk-desc-cell { font-size: 11px; color: #777; margin-top: 2px; }
.risk-meta-links { font-size: 10px; color: #bbb; margin-top: 2px; }
.risk-meta-links a { color: #bbb; margin-right: 6px; }
.risk-meta-links a.del:hover { color: #dc2626; text-decoration: underline; }
.cat-col { font-size: 10px; color: #4f46e5; font-weight: bold; width: 80px; }
.li-col { font-size: 11px; color: #999; text-align: center; width: 44px; }

/* VOTE CELL */
.vote-cell { text-align: center; width: 44px; }
.vote-num { font-size: 17px; font-weight: bold; color: #4f46e5; line-height: 1.1; }
.vote-num-dim { font-size: 17px; font-weight: bold; color: #ccc; line-height: 1.1; }
.vote-lnk { font-size: 10px; color: #aaa; cursor: pointer; display: block; background: none; border: none; padding: 0; }
.vote-lnk:hover { color: #4f46e5; }
.vote-lnk.active { color: #4f46e5; font-weight: bold; }

/* VOTE PIPS */
.vote-pips { display: flex; gap: 5px; }
.pip { width: 13px; height: 13px; border-radius: 50%; border: 1.5px solid #4f46e5; display: inline-block; }
.pip.used { background: #4f46e5; }
.pip.open { background: white; }

/* SESSION INFO */
.session-info { padding-bottom: 8px; border-bottom: 1px solid #d8d8d0; margin-bottom: 8px; }
.session-info h1 { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
.session-info .meta { font-size: 11px; color: #777; }
.session-prompt { margin-top: 5px; font-size: 12px; color: #555; background: #fffff0; border-left: 3px solid #c8a000; padding: 3px 8px; }

/* SECTION SEP */
.section-sep { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 6px; background: #eaeae2; margin-bottom: 0; }

/* ACTION ITEMS */
.action-col { font-size: 11px; color: #444; width: 200px; }
.assignee-name { font-weight: bold; color: #222; }
.no-action { color: #ccc; font-style: italic; font-size: 10px; }
.inline-action { display: flex; flex-direction: column; gap: 3px; margin-top: 3px; }
.inline-action input { font-size: 10px; border: 1px solid #d8d8d0; padding: 2px 4px; width: 100%; }
.inline-action button { font-size: 10px; background: #4f46e5; color: white; border: none; padding: 2px 7px; cursor: pointer; align-self: flex-start; }

/* MY-BADGE */
.my-badge { font-size: 9px; background: #ede9fe; color: #4f46e5; padding: 0 4px; font-weight: bold; margin-left: 5px; }

/* GENERIC PAGE */
.page-wrap { max-width: 860px; margin: 0 auto; padding: 16px 14px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #d8d8d0; padding-bottom: 8px; }
.page-header h1 { font-size: 15px; font-weight: bold; }

/* CARDS / LISTS */
.list-table { width: 100%; border-collapse: collapse; }
.list-table tbody tr { border-bottom: 1px solid #eeeee6; }
.list-table tbody tr:last-child { border-bottom: none; }
.list-table tbody tr:hover { background: #fffef0; cursor: pointer; }
.list-table td { padding: 6px 6px; font-size: 12px; }
.list-table th { text-align: left; font-size: 10px; font-weight: bold; padding: 3px 6px; color: #666; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #d8d8d0; background: #e8e8e0; }

/* BADGE */
.badge { font-size: 10px; font-weight: bold; padding: 1px 6px; }
.badge-open    { color: #1a7f37; background: #dcfce7; }
.badge-revealed { color: #1d4ed8; background: #dbeafe; }
.badge-voting  { color: #9a6700; background: #fef3c7; }
.badge-closed  { color: #555;    background: #e5e7eb; }
.badge-active  { color: #222;    background: #e5e7eb; }
.badge-archived { color: #999;   background: #f3f4f6; }

/* FORMS (page level) */
.form-row { margin-bottom: 10px; }
.form-row label { display: block; font-size: 11px; font-weight: bold; color: #555; margin-bottom: 3px; }
.form-row input, .form-row select, .form-row textarea {
  width: 100%; border: 1px solid #ccc; padding: 5px 8px; font-family: Verdana; font-size: 12px;
}
.form-row textarea { height: 70px; resize: vertical; }
.btn { background: #4f46e5; color: white; border: none; padding: 5px 14px; font-size: 12px; font-weight: bold; cursor: pointer; }
.btn:hover { background: #3730a3; }
.btn-sm { padding: 3px 10px; font-size: 11px; }
.btn-danger { background: #dc2626; }
.btn-danger:hover { background: #b91c1c; }
.btn-ghost { background: none; color: #4f46e5; border: 1px solid #d0d0c8; }
.btn-ghost:hover { background: #ededf5; }

/* LANDING */
.landing-hero { max-width: 600px; margin: 80px auto; padding: 0 20px; text-align: center; }
.landing-hero h1 { font-size: 28px; font-weight: bold; margin-bottom: 10px; letter-spacing: -0.5px; }
.landing-hero p { font-size: 13px; color: #555; line-height: 1.6; margin-bottom: 20px; }
.landing-steps { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; max-width: 800px; margin: 40px auto 0; padding: 0 20px; }
.landing-step { background: white; border: 1px solid #d8d8d0; padding: 14px; }
.landing-step h3 { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
.landing-step p { font-size: 11px; color: #666; line-height: 1.5; }
.step-num { font-size: 18px; font-weight: bold; color: #4f46e5; margin-bottom: 6px; }

/* AUTH */
.auth-wrap { max-width: 340px; margin: 60px auto; padding: 0 20px; }
.auth-wrap h1 { font-size: 16px; font-weight: bold; margin-bottom: 16px; }
.auth-toggle { font-size: 11px; color: #777; margin-top: 12px; }
.divider { text-align: center; font-size: 11px; color: #aaa; margin: 10px 0; }
.google-btn { width: 100%; background: white; border: 1px solid #ccc; padding: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.google-btn:hover { background: #f5f5f5; }

/* MISC */
.error-msg { color: #dc2626; font-size: 11px; margin-top: 6px; }
.muted { color: #999; font-size: 11px; }
.code-box { background: #e8e8e0; font-family: monospace; font-size: 11px; padding: 4px 8px; word-break: break-all; }
```

- [ ] **Step 7: Update .gitignore to exclude .env**

```
node_modules/
dist/
.env
.superpowers/
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite dev server running at http://localhost:5173

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite+React project with global CSS"
```

---

### Task 2: Firebase init + auth hook

**Files:**
- Create: `src/firebase.js`, `src/hooks/useAuth.js`

- [ ] **Step 1: Create src/firebase.js**

```js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
```

- [ ] **Step 2: Create src/hooks/useAuth.js**

```js
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u ?? null))
  }, [])
  return { user, loading: user === undefined }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/firebase.js src/hooks/useAuth.js
git commit -m "feat: firebase init and useAuth hook"
```

---

### Task 3: Firestore library + tokens

**Files:**
- Create: `src/lib/firestore.js`, `src/lib/tokens.js`, `src/lib/export.js`

- [ ] **Step 1: Create src/lib/tokens.js**

```js
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)
export const generateToken = () => nanoid()
```

- [ ] **Step 2: Write token test**

Create `src/lib/tokens.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { generateToken } from './tokens'

describe('generateToken', () => {
  it('returns a 10-char alphanumeric string', () => {
    const t = generateToken()
    expect(t).toMatch(/^[a-z0-9]{10}$/)
  })
  it('returns unique values', () => {
    expect(generateToken()).not.toBe(generateToken())
  })
})
```

- [ ] **Step 3: Run test**

```bash
npx vitest run src/lib/tokens.test.js
```
Expected: 2 tests pass

- [ ] **Step 4: Create src/lib/export.js**

```js
// Pure functions — no Firebase dependency

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
        rows.push([ai === 0 ? i+1 : '', ai === 0 ? r.title : '', ai === 0 ? r.category : '',
          ai === 0 ? r.likelihood : '', ai === 0 ? r.impact : '', ai === 0 ? r.voteCount ?? 0 : '',
          a.assigneeName, a.remarks])
      })
    }
  })
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
}
```

- [ ] **Step 5: Write export test**

Create `src/lib/export.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { toMarkdown, toCSV } from './export'

const session = { name: 'Test Session', createdAt: null, participantIds: ['u1'] }
const risks = [
  { id: 'r1', title: 'Risk A', category: 'timeline', likelihood: 4, impact: 5, voteCount: 3, description: 'desc' },
  { id: 'r2', title: 'Risk B', category: 'technical', likelihood: 2, impact: 3, voteCount: 1 },
]
const actionItems = [{ riskId: 'r1', assigneeName: 'Alice', remarks: 'Fix it' }]

describe('toMarkdown', () => {
  it('ranks by voteCount descending', () => {
    const md = toMarkdown(session, 'Proj', risks, actionItems)
    const idx1 = md.indexOf('Risk A')
    const idx2 = md.indexOf('Risk B')
    expect(idx1).toBeLessThan(idx2)
  })
  it('includes action item', () => {
    expect(toMarkdown(session, 'Proj', risks, actionItems)).toContain('Alice: Fix it')
  })
})

describe('toCSV', () => {
  it('starts with header row', () => {
    expect(toCSV(session, 'Proj', risks, actionItems)).toMatch(/^"Rank"/)
  })
  it('contains risk title', () => {
    expect(toCSV(session, 'Proj', risks, actionItems)).toContain('Risk A')
  })
})
```

- [ ] **Step 6: Run export tests**

```bash
npx vitest run src/lib/export.test.js
```
Expected: 4 tests pass

- [ ] **Step 7: Create src/lib/firestore.js**

```js
import {
  doc, collection, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, arrayUnion, onSnapshot, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { generateToken } from './tokens'

// ── USERS ──────────────────────────────────────────────────────────────────
export async function upsertUser(uid, displayName, email) {
  await setDoc(doc(db, 'users', uid), { displayName, email, createdAt: serverTimestamp() }, { merge: true })
}

// ── ORGANIZATIONS ──────────────────────────────────────────────────────────
export async function createOrg(uid, name, displayName) {
  const inviteToken = generateToken()
  const orgRef = await addDoc(collection(db, 'organizations'), {
    name, ownerId: uid, inviteToken, createdAt: serverTimestamp()
  })
  await setDoc(doc(db, 'organizations', orgRef.id, 'members', uid), {
    role: 'owner', joinedAt: serverTimestamp()
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
  // Get all orgs where user is a member via subcollection group query
  // We query member docs across all orgs
  const snap = await getDocs(query(
    collection(db, 'organizations'),
  ))
  // Filter client-side by checking membership (simpler than collectionGroup for now)
  // In production use collectionGroup('members') with index
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
    role: 'member', joinedAt: serverTimestamp()
  })
  return org.id
}

export async function updateMemberRole(orgId, uid, role) {
  await updateDoc(doc(db, 'organizations', orgId, 'members', uid), { role })
}

export async function removeMember(orgId, uid) {
  await deleteDoc(doc(db, 'organizations', orgId, 'members', uid))
}

// ── PROJECTS ───────────────────────────────────────────────────────────────
export async function createProject(orgId, uid, name, description) {
  const ref = await addDoc(collection(db, 'projects'), {
    orgId, name, description, status: 'active', createdBy: uid, createdAt: serverTimestamp()
  })
  return ref.id
}

export async function getOrgProjects(orgId) {
  const snap = await getDocs(query(
    collection(db, 'projects'),
    where('orgId', '==', orgId),
    orderBy('createdAt', 'desc')
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

// ── SESSIONS ───────────────────────────────────────────────────────────────
export async function createSession(orgId, projectId, facilitatorId, name, description) {
  const shareToken = generateToken()
  const ref = await addDoc(collection(db, 'sessions'), {
    orgId, projectId, facilitatorId, name, description,
    status: 'open', shareToken,
    participantIds: [facilitatorId],
    votesPerParticipant: 3,
    createdAt: serverTimestamp(), closedAt: null
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
    collection(db, 'sessions'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getRecentSessions(orgId) {
  const snap = await getDocs(query(
    collection(db, 'sessions'),
    where('orgId', '==', orgId),
    orderBy('createdAt', 'desc')
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function advanceSessionStatus(sessionId, nextStatus) {
  const update = { status: nextStatus }
  if (nextStatus === 'closed') update.closedAt = serverTimestamp()
  await updateDoc(doc(db, 'sessions', sessionId), update)
}

export async function joinSession(sessionId, uid) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    participantIds: arrayUnion(uid)
  })
}

export function subscribeSession(sessionId, cb) {
  return onSnapshot(doc(db, 'sessions', sessionId), snap => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

// ── RISKS ──────────────────────────────────────────────────────────────────
export async function addRisk(sessionId, authorId, authorName, { title, description, category, likelihood, impact }) {
  const ref = await addDoc(collection(db, 'risks'), {
    sessionId, authorId, authorName, title, description,
    category, likelihood, impact, createdAt: serverTimestamp()
  })
  return ref.id
}

export async function updateRisk(riskId, { title, description, category, likelihood, impact }) {
  await updateDoc(doc(db, 'risks', riskId), { title, description, category, likelihood, impact })
}

export async function deleteRisk(riskId) {
  await deleteDoc(doc(db, 'risks', riskId))
}

export async function getMyRisks(sessionId, authorId) {
  const snap = await getDocs(query(
    collection(db, 'risks'),
    where('sessionId', '==', sessionId),
    where('authorId', '==', authorId),
    orderBy('createdAt', 'asc')
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getSessionRisks(sessionId) {
  const snap = await getDocs(query(
    collection(db, 'risks'),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'asc')
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── VOTES ──────────────────────────────────────────────────────────────────
export async function castVote(sessionId, riskId, userId) {
  await addDoc(collection(db, 'votes'), { sessionId, riskId, userId, timestamp: serverTimestamp() })
}

export async function getSessionVotes(sessionId) {
  const snap = await getDocs(query(collection(db, 'votes'), where('sessionId', '==', sessionId)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function subscribeVotes(sessionId, cb) {
  return onSnapshot(
    query(collection(db, 'votes'), where('sessionId', '==', sessionId)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ── ACTION ITEMS ───────────────────────────────────────────────────────────
export async function addActionItem(sessionId, riskId, assigneeName, remarks) {
  await addDoc(collection(db, 'actionItems'), {
    sessionId, riskId, assigneeName, remarks, createdAt: serverTimestamp()
  })
}

export async function getSessionActionItems(sessionId) {
  const snap = await getDocs(query(collection(db, 'actionItems'), where('sessionId', '==', sessionId)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/
git commit -m "feat: firestore library, token generator, export utils"
```

---

### Task 4: App shell — router + Nav + ProtectedRoute

**Files:**
- Create: `src/components/Nav.jsx`, `src/components/ProtectedRoute.jsx`
- Modify: `src/App.jsx`, `src/main.jsx`

- [ ] **Step 1: Create src/components/ProtectedRoute.jsx**

```jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="muted" style={{padding:20}}>Loading…</div>
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />
  return children
}
```

- [ ] **Step 2: Create src/components/Nav.jsx**

```jsx
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../hooks/useAuth'

export function Nav({ crumbs = [] }) {
  // crumbs: [{ label, to }, ...]
  const { user } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => { await signOut(auth); navigate('/') }

  return (
    <div className="nav">
      <Link to={user ? '/dashboard' : '/'} className="nav-logo">PM</Link>
      {crumbs.map((c, i) => (
        <span key={i}>
          <span className="nav-crumb-sep">›</span>
          {c.to ? <Link to={c.to} className="nav-crumb">{c.label}</Link>
                : <span className="nav-crumb">{c.label}</span>}
        </span>
      ))}
      {user && (
        <div className="nav-right">
          <span>{user.displayName || user.email}</span>
          <button onClick={handleLogout} style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:12}}>logout</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Rewrite src/App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { OrgPage } from './pages/OrgPage'
import { OrgSettings } from './pages/OrgSettings'
import { ProjectPage } from './pages/ProjectPage'
import { SessionPage } from './pages/SessionPage'
import { JoinPage } from './pages/JoinPage'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/join/:shareToken" element={<JoinPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/org/:orgId" element={<ProtectedRoute><OrgPage /></ProtectedRoute>} />
        <Route path="/org/:orgId/settings" element={<ProtectedRoute><OrgSettings /></ProtectedRoute>} />
        <Route path="/project/:projectId" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
        <Route path="/session/:sessionId" element={<ProtectedRoute><SessionPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Rewrite src/main.jsx**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)
```

- [ ] **Step 5: Create stub pages so app compiles**

Create each of these files with a minimal stub:

`src/pages/Landing.jsx`:
```jsx
export function Landing() { return <div>Landing</div> }
```

`src/pages/Auth.jsx`:
```jsx
export function Auth() { return <div>Auth</div> }
```

`src/pages/Dashboard.jsx`:
```jsx
export function Dashboard() { return <div>Dashboard</div> }
```

`src/pages/OrgPage.jsx`:
```jsx
export function OrgPage() { return <div>OrgPage</div> }
```

`src/pages/OrgSettings.jsx`:
```jsx
export function OrgSettings() { return <div>OrgSettings</div> }
```

`src/pages/ProjectPage.jsx`:
```jsx
export function ProjectPage() { return <div>ProjectPage</div> }
```

`src/pages/SessionPage.jsx`:
```jsx
export function SessionPage() { return <div>SessionPage</div> }
```

`src/pages/JoinPage.jsx`:
```jsx
export function JoinPage() { return <div>JoinPage</div> }
```

- [ ] **Step 6: Verify app compiles**

```bash
npm run dev
```
Expected: app loads at http://localhost:5173, / shows "Landing"

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: app shell, router, Nav, ProtectedRoute, page stubs"
```

---

### Task 5: Landing + Auth pages

**Files:**
- Modify: `src/pages/Landing.jsx`, `src/pages/Auth.jsx`

- [ ] **Step 1: Implement Landing.jsx**

```jsx
import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav'

export function Landing() {
  return (
    <>
      <Nav />
      <div className="landing-hero">
        <h1>What if your project failed?</h1>
        <p>Pre-mortem helps teams surface risks before they happen — async input, team voting, clear action items.</p>
        <Link to="/auth"><button className="btn">Get started free</button></Link>
      </div>
      <div className="landing-steps">
        {[
          ['1', 'Create a session', 'Facilitator creates a pre-mortem session and shares the link.'],
          ['2', 'Team adds risks', 'Everyone submits what could go wrong — privately, at their own pace.'],
          ['3', 'Reveal & vote', 'Facilitator reveals all risks. Team votes on what matters most.'],
          ['4', 'Assign & export', 'Top risks get owners and remarks. Export to your task tool.'],
        ].map(([n, title, desc]) => (
          <div className="landing-step" key={n}>
            <div className="step-num">{n}</div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Implement Auth.jsx**

```jsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, updateProfile
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { upsertUser } from '../lib/firestore'
import { Nav } from '../components/Nav'

export function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const redirect = location.state?.from?.pathname || '/dashboard'

  const afterAuth = async (user) => {
    await upsertUser(user.uid, user.displayName || name, user.email)
    navigate(redirect, { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(user, { displayName: name })
        await afterAuth(user)
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        await afterAuth(user)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      const { user } = await signInWithPopup(auth, googleProvider)
      await afterAuth(user)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <Nav />
      <div className="auth-wrap">
        <h1>{mode === 'login' ? 'Log in' : 'Create account'}</h1>
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-row">
              <label>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button className="btn" style={{width:'100%',marginTop:8}} type="submit">
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>
        <div className="divider">or</div>
        <button className="google-btn" onClick={handleGoogle}>
          <span>G</span> Continue with Google
        </button>
        <div className="auth-toggle">
          {mode === 'login'
            ? <>Don't have an account? <a href="#" onClick={e=>{e.preventDefault();setMode('signup')}}>Sign up</a></>
            : <>Already have an account? <a href="#" onClick={e=>{e.preventDefault();setMode('login')}}>Log in</a></>}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Landing.jsx src/pages/Auth.jsx
git commit -m "feat: landing and auth pages"
```

---

### Task 6: Dashboard page

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Implement Dashboard.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { getUserOrgs, createOrg, getRecentSessions } from '../lib/firestore'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [recentSessions, setRecentSessions] = useState([])
  const [creating, setCreating] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getUserOrgs(user.uid).then(async (os) => {
      setOrgs(os)
      // Fetch recent sessions across all orgs
      const allSessions = []
      for (const org of os) {
        const sessions = await getRecentSessions(org.id)
        allSessions.push(...sessions.map(s => ({ ...s, orgName: org.name })))
      }
      allSessions.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      setRecentSessions(allSessions.slice(0, 10))
      setLoading(false)
    })
  }, [user])

  const handleCreateOrg = async (e) => {
    e.preventDefault()
    if (!orgName.trim()) return
    const orgId = await createOrg(user.uid, orgName.trim(), user.displayName)
    navigate(`/org/${orgId}`)
  }

  if (loading) return <><Nav /><div className="muted" style={{padding:20}}>Loading…</div></>

  return (
    <>
      <Nav />
      <div className="page-wrap">
        <div className="page-header">
          <h1>My Organisations</h1>
          <button className="btn btn-sm" onClick={() => setCreating(c => !c)}>+ New organisation</button>
        </div>

        {creating && (
          <form onSubmit={handleCreateOrg} style={{marginBottom:16,display:'flex',gap:8}}>
            <input value={orgName} onChange={e=>setOrgName(e.target.value)}
              placeholder="Organisation name" style={{flex:1,border:'1px solid #ccc',padding:'4px 8px',fontSize:12}} />
            <button className="btn btn-sm" type="submit">Create</button>
            <button className="btn btn-sm btn-ghost" type="button" onClick={() => setCreating(false)}>Cancel</button>
          </form>
        )}

        {orgs.length === 0 && (
          <p className="muted">No organisations yet. Create one to get started.</p>
        )}

        <table className="list-table" style={{marginBottom:24}}>
          <tbody>
            {orgs.map(org => (
              <tr key={org.id} onClick={() => navigate(`/org/${org.id}`)}>
                <td style={{fontWeight:'bold'}}>{org.name}</td>
                <td style={{color:'#999',fontSize:11}}>click to open</td>
              </tr>
            ))}
          </tbody>
        </table>

        {recentSessions.length > 0 && (
          <>
            <div className="section-sep" style={{marginBottom:8}}>Recent sessions</div>
            <table className="list-table">
              <thead>
                <tr><th>Session</th><th>Org</th><th>Status</th><th>Participants</th></tr>
              </thead>
              <tbody>
                {recentSessions.map(s => (
                  <tr key={s.id} onClick={() => navigate(`/session/${s.id}`)}>
                    <td style={{fontWeight:'bold'}}>{s.name}</td>
                    <td className="muted">{s.orgName}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td className="muted">{s.participantIds?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: dashboard page with orgs list and recent sessions"
```

---

### Task 7: Org page + Org settings

**Files:**
- Modify: `src/pages/OrgPage.jsx`, `src/pages/OrgSettings.jsx`

- [ ] **Step 1: Implement OrgPage.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { getOrg, getOrgProjects, createProject, getOrgMembership } from '../lib/firestore'

export function OrgPage() {
  const { orgId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [org, setOrg] = useState(null)
  const [projects, setProjects] = useState([])
  const [membership, setMembership] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    if (!user) return
    Promise.all([getOrg(orgId), getOrgProjects(orgId), getOrgMembership(orgId, user.uid)])
      .then(([o, ps, m]) => { setOrg(o); setProjects(ps); setMembership(m) })
  }, [orgId, user])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const id = await createProject(orgId, user.uid, form.name.trim(), form.description.trim())
    navigate(`/project/${id}`)
  }

  const inviteLink = org ? `${window.location.origin}/join-org/${org.inviteToken}` : ''
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'
  const active = projects.filter(p => p.status === 'active')
  const archived = projects.filter(p => p.status === 'archived')

  if (!org) return <><Nav /><div className="muted" style={{padding:20}}>Loading…</div></>

  return (
    <>
      <Nav crumbs={[{ label: org.name }]} />
      <div className="page-wrap">
        <div className="page-header">
          <h1>{org.name}</h1>
          <div style={{display:'flex',gap:8}}>
            {isAdmin && <Link to={`/org/${orgId}/settings`}><button className="btn btn-sm btn-ghost">Settings</button></Link>}
            <button className="btn btn-sm" onClick={() => setCreating(c => !c)}>+ New project</button>
          </div>
        </div>

        {isAdmin && (
          <div style={{marginBottom:12,fontSize:11,color:'#666'}}>
            Org invite link: <span className="code-box">{inviteLink}</span>{' '}
            <a href="#" onClick={e=>{e.preventDefault();navigator.clipboard.writeText(inviteLink)}}>copy</a>
          </div>
        )}

        {creating && (
          <form onSubmit={handleCreate} style={{marginBottom:16,background:'#fffff0',border:'1px solid #d8d8d0',padding:12}}>
            <div className="form-row"><label>Project name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
            </div>
            <div className="form-row"><label>Description</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
            </div>
            <button className="btn btn-sm" type="submit">Create project</button>{' '}
            <button className="btn btn-sm btn-ghost" type="button" onClick={() => setCreating(false)}>Cancel</button>
          </form>
        )}

        <div className="section-sep" style={{marginBottom:0}}>Active projects ({active.length})</div>
        <table className="list-table">
          <tbody>
            {active.map(p => (
              <tr key={p.id} onClick={() => navigate(`/project/${p.id}`)}>
                <td style={{fontWeight:'bold'}}>{p.name}</td>
                <td className="muted">{p.description}</td>
                <td><span className="badge badge-active">active</span></td>
              </tr>
            ))}
            {active.length === 0 && <tr><td colSpan={3} className="muted" style={{padding:'8px 6px'}}>No active projects.</td></tr>}
          </tbody>
        </table>

        {archived.length > 0 && (
          <>
            <div style={{marginTop:12}}>
              <a href="#" onClick={e=>{e.preventDefault();setShowArchived(s=>!s)}} style={{fontSize:11}}>
                {showArchived ? '▲' : '▼'} Archived projects ({archived.length})
              </a>
            </div>
            {showArchived && (
              <table className="list-table" style={{marginTop:4}}>
                <tbody>
                  {archived.map(p => (
                    <tr key={p.id} onClick={() => navigate(`/project/${p.id}`)}>
                      <td style={{color:'#999'}}>{p.name}</td>
                      <td><span className="badge badge-archived">archived</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Implement OrgSettings.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { getOrg, getOrgMembers, getOrgMembership, updateMemberRole, removeMember } from '../lib/firestore'

export function OrgSettings() {
  const { orgId } = useParams()
  const { user } = useAuth()
  const [org, setOrg] = useState(null)
  const [members, setMembers] = useState([])
  const [myRole, setMyRole] = useState(null)

  const load = async () => {
    const [o, ms, m] = await Promise.all([getOrg(orgId), getOrgMembers(orgId), getOrgMembership(orgId, user.uid)])
    setOrg(o); setMembers(ms); setMyRole(m?.role)
  }

  useEffect(() => { if (user) load() }, [orgId, user])

  const handleRoleChange = async (uid, role) => {
    await updateMemberRole(orgId, uid, role)
    await load()
  }

  const handleRemove = async (uid) => {
    if (!confirm('Remove this member?')) return
    await removeMember(orgId, uid)
    await load()
  }

  if (!org) return <><Nav /><div className="muted" style={{padding:20}}>Loading…</div></>

  const inviteLink = `${window.location.origin}/join-org/${org.inviteToken}`

  return (
    <>
      <Nav crumbs={[{ label: org.name, to: `/org/${orgId}` }, { label: 'Settings' }]} />
      <div className="page-wrap">
        <div className="page-header">
          <h1>Organisation settings — {org.name}</h1>
          <Link to={`/org/${orgId}`}><button className="btn btn-sm btn-ghost">← Back</button></Link>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:'bold',color:'#666',marginBottom:4}}>INVITE LINK</div>
          <div style={{fontSize:11,color:'#555',marginBottom:4}}>Anyone who opens this link and creates an account joins as Member.</div>
          <span className="code-box">{inviteLink}</span>{' '}
          <a href="#" onClick={e=>{e.preventDefault();navigator.clipboard.writeText(inviteLink)}} style={{fontSize:11}}>copy</a>
        </div>

        <div className="section-sep" style={{marginBottom:0}}>Members ({members.length})</div>
        <table className="list-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.uid}>
                <td style={{fontWeight:'bold'}}>{m.displayName || '—'}</td>
                <td className="muted">{m.email}</td>
                <td>
                  {myRole === 'owner' && m.uid !== user.uid ? (
                    <select value={m.role} onChange={e => handleRoleChange(m.uid, e.target.value)}
                      style={{fontSize:11,border:'1px solid #ccc',padding:'2px 4px'}}>
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                    </select>
                  ) : <span>{m.role}</span>}
                </td>
                <td>
                  {m.uid !== user.uid && myRole !== 'member' && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleRemove(m.uid)}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/OrgPage.jsx src/pages/OrgSettings.jsx
git commit -m "feat: org page and org settings page"
```

---

### Task 8: Project page + Join page

**Files:**
- Modify: `src/pages/ProjectPage.jsx`, `src/pages/JoinPage.jsx`

- [ ] **Step 1: Implement ProjectPage.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { getProject, getProjectSessions, createSession, setProjectStatus, getOrg, getOrgMembership } from '../lib/firestore'

export function ProjectPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [org, setOrg] = useState(null)
  const [sessions, setSessions] = useState([])
  const [membership, setMembership] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const load = async () => {
    const p = await getProject(projectId)
    setProject(p)
    const [o, ss, m] = await Promise.all([
      getOrg(p.orgId),
      getProjectSessions(projectId),
      getOrgMembership(p.orgId, user.uid)
    ])
    setOrg(o); setSessions(ss); setMembership(m)
  }

  useEffect(() => { if (user) load() }, [projectId, user])

  const handleCreate = async (e) => {
    e.preventDefault()
    const { id } = await createSession(project.orgId, projectId, user.uid, form.name.trim(), form.description.trim())
    navigate(`/session/${id}`)
  }

  const handleArchive = async () => {
    const next = project.status === 'active' ? 'archived' : 'active'
    await setProjectStatus(projectId, next)
    await load()
  }

  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'

  if (!project || !org) return <><Nav /><div className="muted" style={{padding:20}}>Loading…</div></>

  return (
    <>
      <Nav crumbs={[{ label: org.name, to: `/org/${project.orgId}` }, { label: project.name }]} />
      <div className="page-wrap">
        <div className="page-header">
          <h1>{project.name} <span className={`badge badge-${project.status}`}>{project.status}</span></h1>
          <div style={{display:'flex',gap:8}}>
            {isAdmin && (
              <button className="btn btn-sm btn-ghost" onClick={handleArchive}>
                {project.status === 'active' ? 'Archive' : 'Unarchive'}
              </button>
            )}
            <button className="btn btn-sm" onClick={() => setCreating(c=>!c)}>+ New session</button>
          </div>
        </div>

        {project.description && <p style={{fontSize:12,color:'#666',marginBottom:12}}>{project.description}</p>}

        {creating && (
          <form onSubmit={handleCreate} style={{marginBottom:16,background:'#fffff0',border:'1px solid #d8d8d0',padding:12}}>
            <div className="form-row"><label>Session name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required placeholder="e.g. Launch risk review v1" />
            </div>
            <div className="form-row"><label>Prompt (shown to participants)</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                placeholder={`"It's [date]. The project failed. What went wrong?"`} />
            </div>
            <button className="btn btn-sm" type="submit">Create session</button>{' '}
            <button className="btn btn-sm btn-ghost" type="button" onClick={() => setCreating(false)}>Cancel</button>
          </form>
        )}

        <div className="section-sep" style={{marginBottom:0}}>Sessions ({sessions.length})</div>
        <table className="list-table">
          <thead><tr><th>Name</th><th>Status</th><th>Participants</th><th>Created</th></tr></thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} onClick={() => navigate(`/session/${s.id}`)}>
                <td style={{fontWeight:'bold'}}>{s.name}</td>
                <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                <td className="muted">{s.participantIds?.length ?? 0}</td>
                <td className="muted">{s.createdAt?.toDate?.().toLocaleDateString() ?? '—'}</td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan={4} className="muted" style={{padding:'8px 6px'}}>No sessions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Implement JoinPage.jsx**

```jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { getSessionByToken, joinSession } from '../lib/firestore'

export function JoinPage() {
  const { shareToken } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/auth', { state: { from: { pathname: `/join/${shareToken}` } } })
      return
    }
    getSessionByToken(shareToken).then(async (session) => {
      if (!session) { setError('Invalid or expired link.'); return }
      if (!session.participantIds.includes(user.uid)) {
        await joinSession(session.id, user.uid)
      }
      navigate(`/session/${session.id}`, { replace: true })
    }).catch(() => setError('Something went wrong.'))
  }, [user, loading, shareToken])

  return (
    <>
      <Nav />
      <div className="page-wrap">
        {error ? <div className="error-msg">{error}</div> : <div className="muted">Joining session…</div>}
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProjectPage.jsx src/pages/JoinPage.jsx
git commit -m "feat: project page and join page"
```

---

### Task 9: Session sidebar components

**Files:**
- Create: `src/session/AddRiskForm.jsx`, `src/session/SessionSidebar.jsx`

- [ ] **Step 1: Create src/session/AddRiskForm.jsx**

```jsx
import { useState } from 'react'
import { addRisk } from '../lib/firestore'

const CATEGORIES = ['Timeline', 'Technical', 'Team', 'External', 'Scope', 'Communication']

export function AddRiskForm({ sessionId, user, onAdded }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Timeline', likelihood: 3, impact: 3
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await addRisk(sessionId, user.uid, user.displayName || user.email, {
      ...form, category: form.category.toLowerCase()
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
```

- [ ] **Step 2: Create src/session/SessionSidebar.jsx**

```jsx
import { AddRiskForm } from './AddRiskForm'

export function SessionSidebar({ session, user, myRiskCount, userVotes, onRiskAdded }) {
  const shareLink = `${window.location.origin}/join/${session.shareToken}`
  const votesUsed = userVotes?.length ?? 0
  const votesLeft = (session.votesPerParticipant ?? 3) - votesUsed

  return (
    <div className="page-sidebar">
      {/* Stats */}
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

      {/* Vote budget — only during voting */}
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

      {/* Add risk form — only when open */}
      {session.status === 'open' && (
        <div className="sidebar-block">
          <h3>Add a risk</h3>
          <AddRiskForm sessionId={session.id} user={user} onAdded={onRiskAdded} />
        </div>
      )}

      {/* Share link */}
      <div className="sidebar-block">
        <h3>Share session</h3>
        <div style={{fontSize:11,color:'#888',marginBottom:5}}>Anyone with this link can join</div>
        <input readOnly value={shareLink}
          style={{width:'100%',fontSize:10,border:'1px solid #d0d0c8',padding:'3px 5px',background:'#fff'}} />
        <div style={{marginTop:4}}>
          <a href="#" onClick={e=>{e.preventDefault();navigator.clipboard.writeText(shareLink)}}
            style={{fontSize:11}}>copy link</a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/session/
git commit -m "feat: session sidebar with add risk form, stats, vote budget"
```

---

### Task 10: Session risk tables

**Files:**
- Create: `src/session/RiskTable.jsx`, `src/session/RevealedTable.jsx`, `src/session/VotingTable.jsx`, `src/session/ClosedTable.jsx`

- [ ] **Step 1: Create src/session/RiskTable.jsx** (open state — my risks only)

```jsx
import { useState } from 'react'
import { updateRisk, deleteRisk } from '../lib/firestore'

const CATEGORIES = ['Timeline','Technical','Team','External','Scope','Communication']

export function RiskTable({ risks, onChanged }) {
  const [editing, setEditing] = useState(null) // riskId being edited
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
```

- [ ] **Step 2: Create src/session/RevealedTable.jsx** (all risks grouped by category)

```jsx
const CATEGORY_ORDER = ['timeline','technical','team','external','scope','communication']

export function RevealedTable({ risks, currentUserId }) {
  const grouped = {}
  for (const cat of CATEGORY_ORDER) {
    const catRisks = risks.filter(r => r.category === cat)
    if (catRisks.length) grouped[cat] = catRisks
  }

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
```

- [ ] **Step 3: Create src/session/VotingTable.jsx**

```jsx
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
                  title={votesLeft <= 0 ? 'No votes left' : `Vote (${mine} of mine)`}
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
```

- [ ] **Step 4: Create src/session/ClosedTable.jsx**

```jsx
import { useState } from 'react'
import { addActionItem } from '../lib/firestore'

export function ClosedTable({ risks, votes, actionItems, sessionId, onActionAdded }) {
  const [forms, setForms] = useState({}) // riskId -> {assigneeName, remarks}

  const voteCountFor = (riskId) => votes.filter(v => v.riskId === riskId).length
  const sorted = [...risks].sort((a, b) => voteCountFor(b.id) - voteCountFor(a.id))
  const itemsFor = (riskId) => actionItems.filter(a => a.riskId === riskId)

  const getForm = (riskId) => forms[riskId] ?? { assigneeName: '', remarks: '' }
  const setForm = (riskId, patch) => setForms(f => ({ ...f, [riskId]: { ...getForm(riskId), ...patch } }))

  const handleAdd = async (riskId) => {
    const f = getForm(riskId)
    if (!f.assigneeName.trim()) return
    await addActionItem(sessionId, riskId, f.assigneeName.trim(), f.remarks.trim())
    setForms(f => ({ ...f, [riskId]: { assigneeName: '', remarks: '' } }))
    onActionAdded?.()
  }

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
```

- [ ] **Step 5: Commit**

```bash
git add src/session/
git commit -m "feat: session risk tables for all four states"
```

---

### Task 11: Session page (main orchestrator)

**Files:**
- Modify: `src/pages/SessionPage.jsx`

- [ ] **Step 1: Implement SessionPage.jsx**

```jsx
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import {
  subscribeSession, getProject, getOrg,
  getMyRisks, getSessionRisks, subscribeVotes,
  getSessionActionItems, advanceSessionStatus
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

  // Subscribe to live session + votes
  useEffect(() => {
    if (!sessionId) return
    const unsubSession = subscribeSession(sessionId, setSession)
    const unsubVotes = subscribeVotes(sessionId, setVotes)
    return () => { unsubSession(); unsubVotes() }
  }, [sessionId])

  // Load project + org once session is known
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
      const mine = all.filter(r => r.authorId === user.uid)
      setMyRisks(mine)
    }
  }, [session?.status, sessionId, user])

  const loadActionItems = useCallback(async () => {
    if (session?.status === 'closed') {
      const items = await getSessionActionItems(sessionId)
      setActionItems(items)
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

      {/* Facilitator bar */}
      {isFacilitator && session.status !== 'closed' && (
        <div className="subheader">
          <span style={{fontSize:11,color:'#888',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.05em'}}>Facilitator</span>
          <span className="muted">{session.participantIds?.length ?? 0} participants joined</span>
          <span className="spacer" />
          <button className="action-link" onClick={handleAdvance}>
            {STATUS_LABEL[session.status]}
          </button>
        </div>
      )}

      {/* Status bar */}
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
          {/* Session header */}
          <div className="session-info">
            <h1>{session.name}</h1>
            <div className="meta">
              {org?.name} · {project?.name} · {session.participantIds?.length ?? 0} participants
            </div>
            {session.description && <div className="session-prompt">{session.description}</div>}
          </div>

          {/* State-specific content */}
          {session.status === 'open' && (
            <>
              <div className="section-sep">My risks ({myRisks.length})</div>
              <RiskTable risks={myRisks} onChanged={loadRisks} />
            </>
          )}

          {session.status === 'revealed' && (
            <>
              <div className="section-sep">All risks ({allRisks.length}) — grouped by category</div>
              <RevealedTable risks={allRisks} currentUserId={user.uid} />
            </>
          )}

          {session.status === 'voting' && (
            <>
              <div className="section-sep">All risks ({allRisks.length}) — vote on what concerns you most</div>
              <VotingTable
                risks={allRisks} votes={votes}
                currentUserId={user.uid} sessionId={sessionId}
                votesPerParticipant={session.votesPerParticipant ?? 3}
              />
            </>
          )}

          {session.status === 'closed' && (
            <>
              <div className="section-sep">Results — ranked by votes</div>
              <ClosedTable
                risks={allRisks} votes={votes}
                actionItems={actionItems} sessionId={sessionId}
                onActionAdded={loadActionItems}
              />
            </>
          )}
        </div>

        <SessionSidebar
          session={session} user={user}
          myRiskCount={myRisks.length}
          userVotes={userVotes}
          onRiskAdded={loadRisks}
        />
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/SessionPage.jsx
git commit -m "feat: session page orchestrator — all four states"
```

---

### Task 12: Firestore security rules

**Files:**
- Create: `firestore.rules`

- [ ] **Step 1: Create firestore.rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() { return request.auth != null; }
    function isOwner(uid) { return request.auth.uid == uid; }
    function isMember(orgId) {
      return exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
    }
    function memberRole(orgId) {
      return get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role;
    }
    function isOrgAdmin(orgId) {
      return isMember(orgId) && (memberRole(orgId) == 'owner' || memberRole(orgId) == 'admin');
    }
    function isSessionParticipant(sessionData) {
      return request.auth.uid in sessionData.participantIds;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /organizations/{orgId} {
      allow read: if isAuth() && isMember(orgId);
      allow create: if isAuth();
      allow update: if isAuth() && isOrgAdmin(orgId);
    }

    match /organizations/{orgId}/members/{userId} {
      allow read: if isAuth() && isMember(orgId);
      allow create: if isAuth() && (
        // Owner creating first member record, or admin adding member
        request.auth.uid == userId || isOrgAdmin(orgId)
      );
      allow update: if isAuth() && isOrgAdmin(orgId);
      allow delete: if isAuth() && isOrgAdmin(orgId);
    }

    match /projects/{projectId} {
      allow read: if isAuth() && isMember(resource.data.orgId);
      allow create: if isAuth() && isMember(request.resource.data.orgId);
      allow update: if isAuth() && (
        isMember(resource.data.orgId) &&
        (request.resource.data.status == resource.data.status || isOrgAdmin(resource.data.orgId))
      );
    }

    match /sessions/{sessionId} {
      allow read: if isAuth() && (
        isMember(resource.data.orgId) ||
        isSessionParticipant(resource.data)
      );
      allow create: if isAuth() && isMember(request.resource.data.orgId);
      allow update: if isAuth() && (
        // Facilitator can advance status
        (request.auth.uid == resource.data.facilitatorId) ||
        // Anyone authenticated can join (add themselves to participantIds)
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['participantIds']))
      );
    }

    match /risks/{riskId} {
      allow read: if isAuth() && (
        resource.data.authorId == request.auth.uid ||
        get(/databases/$(database)/documents/sessions/$(resource.data.sessionId)).data.status in ['revealed','voting','closed']
      );
      allow create: if isAuth() &&
        get(/databases/$(database)/documents/sessions/$(request.resource.data.sessionId)).data.status == 'open';
      allow update, delete: if isAuth() &&
        resource.data.authorId == request.auth.uid &&
        get(/databases/$(database)/documents/sessions/$(resource.data.sessionId)).data.status == 'open';
    }

    match /votes/{voteId} {
      allow read: if isAuth();
      allow create: if isAuth() &&
        request.resource.data.userId == request.auth.uid &&
        get(/databases/$(database)/documents/sessions/$(request.resource.data.sessionId)).data.status == 'voting';
    }

    match /actionItems/{itemId} {
      allow read: if isAuth();
      allow create: if isAuth() &&
        get(/databases/$(database)/documents/sessions/$(request.resource.data.sessionId)).data.status == 'closed';
    }
  }
}
```

- [ ] **Step 2: Install Firebase CLI and deploy rules**

```bash
npm install -g firebase-tools
firebase login
firebase init firestore --project pre-mortem-7a324
# When prompted: use existing rules file -> firestore.rules
firebase deploy --only firestore:rules
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: firestore security rules"
```

---

### Task 13: Firebase Hosting deploy

**Files:**
- Create: `firebase.json`, `.firebaserc`

- [ ] **Step 1: Init Firebase Hosting**

```bash
firebase init hosting --project pre-mortem-7a324
# Public directory: dist
# Single-page app: Yes
# Overwrite dist/index.html: No
```

- [ ] **Step 2: Build and deploy**

```bash
npm run build
firebase deploy --only hosting
```
Expected: app live at `https://pre-mortem-7a324.web.app`

- [ ] **Step 3: Commit**

```bash
git add firebase.json .firebaserc
git commit -m "feat: firebase hosting config"
```

---

## Self-Review

**Spec coverage:**
- ✅ Landing `/`
- ✅ Auth `/auth` — email + Google
- ✅ Dashboard `/dashboard` — orgs + recent sessions
- ✅ Org page `/org/:orgId` — projects, invite link
- ✅ Org settings `/org/:orgId/settings` — members, roles
- ✅ Project page `/project/:projectId` — sessions list, create, archive
- ✅ Session page `/session/:sessionId` — all 4 states
- ✅ Join page `/join/:shareToken` — external participant entry
- ✅ Risk input form — title, description, category, likelihood, impact
- ✅ Voting — 3 votes per user, stackable
- ✅ Action items — assignee + remarks
- ✅ Export — CSV + Markdown
- ✅ Firestore security rules
- ✅ Firebase Hosting

**Missing:** Org join-by-invite-token page (`/join-org/:token`). The OrgPage links to it but no route/page exists. Add to App.jsx:

Add `src/pages/JoinOrgPage.jsx`:
```jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../hooks/useAuth'
import { joinOrgByToken } from '../lib/firestore'

export function JoinOrgPage() {
  const { token } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/auth', { state: { from: { pathname: `/join-org/${token}` } } }); return }
    joinOrgByToken(token, user.uid)
      .then(orgId => navigate(`/org/${orgId}`, { replace: true }))
      .catch(() => setError('Invalid or expired invite link.'))
  }, [user, loading, token])

  return <><Nav /><div className="page-wrap">{error ? <div className="error-msg">{error}</div> : <div className="muted">Joining organisation…</div>}</div></>
}
```

Add to `App.jsx` routes:
```jsx
import { JoinOrgPage } from './pages/JoinOrgPage'
// ...
<Route path="/join-org/:token" element={<JoinOrgPage />} />
```
