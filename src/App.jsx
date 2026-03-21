import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ContentList from './pages/ContentList'
import ContentEditor from './pages/ContentEditor'
import VoiceChunks from './pages/VoiceChunks'
import WritingSamples from './pages/WritingSamples'
import ContentLab from './pages/ContentLab'
import VoiceProfile from './pages/VoiceProfile'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<ContentList />} />
        <Route path="/content/:id" element={<ContentEditor />} />
        <Route path="/content/:id/lab" element={<ContentLab />} />
        <Route path="/chunks" element={<VoiceChunks />} />
        <Route path="/samples" element={<WritingSamples />} />
        <Route path="/profile" element={<VoiceProfile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
