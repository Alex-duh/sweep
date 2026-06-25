import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ContactPage } from './pages/ContactPage'
import { PasswordGatePage } from './pages/PasswordGatePage'
import { ConnectPage } from './pages/ConnectPage'
import { PreviewPage } from './pages/PreviewPage'
import { DonePage } from './pages/DonePage'
import { Nav } from './components/Nav'

const MOCK_COUNT = 247

type AppScreen = 'connect' | 'preview' | 'done'

function AppFlow() {
  const [screen, setScreen] = useState<AppScreen>('connect')
  return (
    <div className="min-h-screen bg-stone-100">
      <Nav />
      {screen === 'connect' && (
        <ConnectPage onConnect={() => setScreen('preview')} />
      )}
      {screen === 'preview' && (
        <PreviewPage
          onArchive={() => setScreen('done')}
          onCancel={() => setScreen('connect')}
        />
      )}
      {screen === 'done' && (
        <DonePage count={MOCK_COUNT} onReset={() => setScreen('connect')} />
      )}
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/gate"
          element={
            <PasswordGatePage
              onAuth={() => setAuthed(true)}
              authed={authed}
            />
          }
        />
        <Route
          path="/app"
          element={authed ? <AppFlow /> : <Navigate to="/gate" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
