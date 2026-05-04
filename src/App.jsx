import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { OrgPage } from './pages/OrgPage'
import { OrgSettings } from './pages/OrgSettings'
import { ProjectPage } from './pages/ProjectPage'
import { SessionPage } from './pages/SessionPage'
import { JoinPage } from './pages/JoinPage'
import { JoinOrgPage } from './pages/JoinOrgPage'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/join/:shareToken" element={<JoinPage />} />
        <Route path="/join-org/:token" element={<JoinOrgPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/org/:orgId" element={<ProtectedRoute><OrgPage /></ProtectedRoute>} />
        <Route path="/org/:orgId/settings" element={<ProtectedRoute><OrgSettings /></ProtectedRoute>} />
        <Route path="/project/:projectId" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
        <Route path="/session/:sessionId" element={<ProtectedRoute><SessionPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
