import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ChatPanel from '../ChatPanel'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const location = useLocation()

  // Extract content ID from /content/:id or /content/:id/lab paths
  const contentMatch = location.pathname.match(/\/content\/([^/]+)/)
  const contentId = contentMatch ? contentMatch[1] : null

  const handleNav = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen">
      {/* Mobile hamburger */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-3 left-3 z-40 sketch-btn sketch-btn-outline px-2.5 py-1.5 text-lg"
          aria-label="Open menu"
        >
          ☰
        </button>
      )}

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - always visible on desktop, slide-in on mobile */}
      <div className={`hidden md:block`}>
        <Sidebar onNavigate={handleNav} />
      </div>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-y-0 left-0 z-50">
          <Sidebar onNavigate={handleNav} />
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 pt-14 md:pt-6">
          <Outlet />
        </div>
      </main>

      {/* Floating Chat FAB */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-5 right-5 z-50 sketch-btn sketch-btn-primary w-12 h-12 flex items-center justify-center text-xl shadow-lg"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        aria-label={chatOpen ? 'Close chat' : 'Open chat'}
      >
        {chatOpen ? '×' : '💬'}
      </button>

      {/* Chat Panel */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} contentId={contentId} />
    </div>
  )
}
