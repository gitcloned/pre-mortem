# Pre-Mortem Tool — Design Spec

**Date:** 2026-05-04
**Status:** Approved

---

## Overview

A publicly hosted web app that helps teams run structured pre-mortems for their projects. Teams are organised into organisations, projects live inside organisations, and each project can have multiple pre-mortem sessions. Sessions have a shareable link so external participants (non-org members) can join and contribute without being added to the organisation.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite), React Router v6 |
| Database | Firestore |
| Auth | Firebase Auth (email/password + Google sign-in) |
| Hosting | Firebase Hosting |
| Styling | Tailwind CSS |

No backend server. All logic runs client-side against Firestore with security rules enforcing access control.

---

## User Types

| Type | How they join | What they can access |
|---|---|---|
| **Owner** | Created the org | Full org control, all projects, all sessions |
| **Admin** | Invited by owner | Manage members, all projects, all sessions |
| **Member** | Invited to org | Create and manage projects/sessions within org |
| **External participant** | Joined via shareable session link | Only the specific session they were linked to |

---

## Pages

### 1. `/` — Landing
Marketing page. Explains the tool. Primary CTA: "Get started free" → `/auth`.

### 2. `/auth` — Auth
Single page with toggle between Sign up and Log in. Supports email/password and Google sign-in. After auth:
- New user with no org → redirect to `/dashboard` (prompted to create an org)
- Existing user → redirect to `/dashboard`
- User who arrived via `/join/:token` → redirect back to that session after auth

### 3. `/dashboard` — Dashboard
Lists the user's organisations and a feed of their recent session activity. Entry point to create a new org.

### 4. `/org/:orgId` — Organisation Dashboard
Lists all active projects in the org. Archived projects accessible via a toggle. Button to create a new project. Org invite link visible to admins/owners (copy to clipboard). Navigation to org settings.

### 5. `/org/:orgId/settings` — Org Settings
Visible to owner and admins only. Lists members with their roles. Owner can promote/demote admins. Admins can remove members. Displays the org invite link (anyone who opens it and creates an account joins as Member).

### 6. `/project/:projectId` — Project Page
Lists all pre-mortem sessions for the project (newest first). Session cards show name, date, status badge, and participant count. Button to create a new session. Owner/admin can archive/unarchive the project.

### 7. `/session/:sessionId` — Session Page
The core of the app. A single URL for all participants. The view adapts based on session state and the viewer's role (facilitator vs participant).

### 8. `/join/:shareToken` — Join via Link
Entry point for external participants. If unauthenticated, redirects to `/auth` preserving the token. After auth, looks up the session by `shareToken`, records the user as a participant, and redirects to `/session/:sessionId`.

---

## Session State Machine

Facilitator controls all transitions. Transitions are one-way.

```
open → revealed → voting → closed
```

| State | What participants see | What facilitator sees |
|---|---|---|
| **open** | Form to add/edit their own risks. Cannot see others' risks. Participant count shown. | All of the above + "Reveal risks" button |
| **revealed** | All risks visible, grouped by category. No new input. | All risks + "Open voting" button |
| **voting** | All risks + vote buttons. Each participant gets 3 votes total, distributable across risks. Live vote counts visible. | All of the above + "Close voting" button |
| **closed** | Risks ranked by votes. Any participant can add action items (assignee name + remarks). Export button. | Same as participants |

---

## Risk Input Form

Shown to participants during the `open` state. Each risk is a separate entry.

| Field | Type | Notes |
|---|---|---|
| Title | Text (required) | Short label for the risk |
| Description | Textarea (optional) | "Imagine the project failed — describe what went wrong" |
| Category | Select (required) | Timeline · Technical · Team · External · Scope · Communication |
| Likelihood | 1–5 scale | How probable is this failure? |
| Impact | 1–5 scale | How severe if it happens? |

Participants can add multiple risks. They can edit or delete their own risks while the session is `open`. Risks are stored in Firestore immediately on save (no draft state needed).

---

## Voting

- Each participant gets **3 votes** per session
- Votes can be distributed freely (all 3 on one risk, or spread across risks)
- A participant can vote multiple times on the same risk (up to their remaining vote count)
- Vote counts are visible to everyone during the `voting` state
- Votes are stored as individual documents: `{sessionId, userId, riskId, timestamp}`
- Total votes per risk = count of vote documents matching `sessionId + riskId`
- Remaining votes per user = 3 minus count of vote documents matching `sessionId + userId`

---

## Action Items

Available in the `closed` state. For each risk, any authenticated session participant (org member or external) can add:

| Field | Type |
|---|---|
| Assignee name | Text (free text, not linked to a user account) |
| Remarks | Textarea |

Action items are lightweight — no due dates, no status tracking. They are meant to be copied into the team's actual task management tool.

---

## Export

In the `closed` state, an "Export" button generates a structured summary as a downloadable CSV or copied Markdown. Export includes:

- Session name, project, date
- All risks ranked by vote count, with category, likelihood, impact
- Action items per risk (assignee + remarks)

---

## Firestore Data Model

### `users/{userId}`
```
displayName: string
email: string
createdAt: timestamp
```

### `organizations/{orgId}`
```
name: string
ownerId: string
inviteToken: string        // used for org join link
createdAt: timestamp
```

### `organizations/{orgId}/members/{userId}`
```
role: 'owner' | 'admin' | 'member'
joinedAt: timestamp
```
Stored as a subcollection so Firestore security rules can check membership via `exists()`.

### `projects/{projectId}`
```
orgId: string
name: string
description: string
status: 'active' | 'archived'
createdBy: string          // userId
createdAt: timestamp
```

### `sessions/{sessionId}`
```
projectId: string
orgId: string
name: string
description: string
facilitatorId: string      // userId
status: 'open' | 'revealed' | 'voting' | 'closed'
shareToken: string         // random token for /join/:shareToken
participantIds: string[]   // userIds who have joined
votesPerParticipant: 3     // fixed
createdAt: timestamp
closedAt: timestamp | null
```

### `risks/{riskId}`
```
sessionId: string
authorId: string
authorName: string
title: string
description: string
category: 'timeline' | 'technical' | 'team' | 'external' | 'scope' | 'communication'
likelihood: 1 | 2 | 3 | 4 | 5
impact: 1 | 2 | 3 | 4 | 5
createdAt: timestamp
```

### `votes/{voteId}`
```
sessionId: string
riskId: string
userId: string
timestamp: timestamp
```

### `actionItems/{actionItemId}`
```
sessionId: string
riskId: string
assigneeName: string
remarks: string
createdAt: timestamp
```

---

## Firestore Security Rules (summary)

- `users`: readable/writable by the owner only
- `organizations`: readable by members, writable by owner/admin only (for member management). Members array membership checked via custom claim or client-side rule.
- `projects`: readable by org members, writable by org members (create), archived by owner/admin
- `sessions`: readable by org members + anyone in `participantIds`. Status transitions writable only by `facilitatorId`. `participantIds` writable by authenticated users (self-join).
- `risks`: readable when session is `revealed`/`voting`/`closed`, OR by the author when `open`. Writable by authenticated users for their own risks when session is `open`.
- `votes`: readable by anyone in the session. Writable by authenticated users for their own votes when session is `voting`. Max 3 votes per user enforced client-side (Firestore rule enforces count server-side via a Cloud Function or transaction).
- `actionItems`: readable by anyone in the session. Writable by any authenticated session participant when session is `closed`.

---

## UI Principles

- Dead simple. No sidebar. Top nav with org name + user avatar only.
- Session page is the centrepiece — optimised for mobile-readable, desktop-usable.
- Status badge on session always visible so participants know what phase they're in.
- Facilitator controls (reveal, open voting, close voting) shown only to the facilitator, as prominent buttons at the top of the session page.
- No modals for main flows — inline forms where possible.

---

## Out of Scope

- Email notifications (invites are link-based only)
- Real-time risk editing (save-on-submit is sufficient)
- Comments/threads on risks
- Due dates on action items
- Analytics or reporting across sessions
- Mobile native app
