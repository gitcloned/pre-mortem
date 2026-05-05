# Pre-Mortem

A collaborative risk identification and voting platform for teams to discuss potential project failures before they happen.

**Live:** https://pre-mortem-7a324.web.app

## Features

### Risk Management
- **Add risks** — Identify what could go wrong in a project
- **Edit & delete** — Modify or remove your own risks
- **Categories** — Classify risks into three types:
  - "We are working on it"
  - "No one is talking about it"
  - "Seems big, but is not"
- **Likelihood & Impact** — Rate each risk on a 1-5 scale

### Voting System
- **Upvote (▲)** — Mark a risk as a major concern (+1)
- **Downvote (▼)** — Mark a risk as not a concern (-1)
- **One vote per risk** — Each participant votes once per risk (can switch between up/down or remove)
- **Net scoring** — Risks ranked by total upvotes minus downvotes

### Search & Navigation
- **Search risks** — Filter by title or description in real-time
- **Scrollable risks table** — Independent scrolling prevents page-level scrolling
- **Risk visibility** — All risks visible to all participants throughout the session

### Session Management
- **Facilitator controls** — Only session creator can close the session
- **Phase management** — Single phase: "Adding risks & voting" (no intermediate voting phase)
- **Results export** — Download results as Markdown or CSV when session closes

## Tech Stack

- **Frontend:** React 19 + Vite
- **Backend:** Firebase (Firestore, Auth, Hosting)
- **Authentication:** Google OAuth via Firebase Auth
- **Styling:** CSS (BEM-style naming)

## Setup

### Prerequisites
- Node.js 16+ and npm
- Firebase project
- Environment variables

### Installation

```bash
# Clone the repository
git clone https://github.com/gitcloned/pre-mortem.git
cd pre-mortem

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config:
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# VITE_FIREBASE_PROJECT_ID=...
# etc.

# Run dev server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

## Project Structure

```
src/
├── pages/           # Route pages (SessionPage, Dashboard, etc.)
├── session/         # Session-specific components (VotingTable, AddRiskForm, etc.)
├── components/      # Reusable components (Nav, ProtectedRoute, etc.)
├── hooks/           # Custom hooks (useAuth)
├── lib/             # Utility functions (firestore.js, export.js, tokens.js)
├── App.jsx          # Main app component with routing
├── main.jsx         # Entry point
└── firebase.js      # Firebase configuration
```

## Key Components

### SessionPage
Main session view. Handles:
- Real-time risk and vote subscriptions
- Search filtering
- Voting interface
- Session status management
- Export functionality

### VotingTable
Displays all risks with voting capability:
- View risk details (title, description, author, scores)
- Upvote/downvote risks
- Edit/delete own risks
- Search filter

### AddRiskForm
Sidebar form for adding new risks:
- Title and description input
- Category selection
- Likelihood and impact rating (1-5 scale)

## Firestore Rules

Security rules enforce:
- Only authenticated users can access
- Risk creation allowed during "open" or "voting" status
- Only risk authors can edit/delete their risks
- Votes must be cast by the voting user
- Voting allowed during "open" or "voting" status
- Action items can only be added after session closes

## Workflow

1. **Create organization** — Admin creates org and invites members
2. **Create project** — Within org, create a project
3. **Create session** — Project facilitator creates a pre-mortem session
4. **Share link** — Facilitator shares session URL with participants
5. **Add & vote** — All participants add risks and vote simultaneously
6. **Close session** — Facilitator closes session when ready
7. **Review results** — View ranked risks and export results

## Environment Variables

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Development

```bash
# Run linter
npm run lint

# Run dev server with HMR
npm run dev

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

## Deployment

Deployed on Firebase Hosting. Any push to `main` should be manually deployed:

```bash
npm run build
firebase deploy
```

## License

MIT
