import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { GalleryProvider } from './gallery/GalleryContext'
import { Gallery } from './pages/Gallery'
import { Upload } from './pages/Upload'
import { Viewer } from './pages/Viewer'
import { Welcome } from './pages/Welcome'
import { useSession } from './session/session'
import { SessionProvider } from './session/SessionContext'
import { UploadProvider } from './upload/UploadContext'

function RequireGuest({ children }: { children: ReactNode }) {
  const { guest } = useSession()
  if (guest === undefined) return <main aria-busy="true" />
  if (guest === null) return <Navigate to="/bienvenue" replace />

  return children
}

function App() {
  return (
    <SessionProvider>
      <UploadProvider>
        <GalleryProvider>
          <Routes>
            <Route path="/bienvenue" element={<Welcome />} />
            <Route path="/" element={<RequireGuest><Gallery /></RequireGuest>}>
              <Route path="photo/:id" element={<Viewer />} />
            </Route>
            <Route path="/envoi" element={<RequireGuest><Upload /></RequireGuest>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GalleryProvider>
      </UploadProvider>
    </SessionProvider>
  )
}

export default App
