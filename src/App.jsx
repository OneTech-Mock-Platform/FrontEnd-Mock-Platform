import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.tsx'
import SpecificationPage from './pages/SpecificationPage.tsx'
import SpecificationViewPage from './pages/SpecificationDetailsPage.tsx'
import SpecificationEditPage from './pages/UpdateSpecificationPage.tsx'
import EndpointsPage from './pages/EndpointsPage.tsx'
/*import SignInPage from './pages/SignInPage.tsx'
import SignUpPage from './pages/SignUpPage.tsx'*/
import ForgetPasswordPage from './pages/ForgetPasswordPage.tsx'
import ProfilPage from './pages/ProfilPage.tsx'
import ScenariosPage from './pages/ScenarioPage.tsx'
import ApiReferencePage from './pages/ApiReferencePage.tsx'
import PublicMockPage from './pages/PublicMockPage.tsx'
import { useAuth } from './context/AuthContext'
import keycloak from './keycloak'
import './App.css'

// Garde-fou pour toutes les routes privées : Keycloak n'est plus initialisé
// en 'login-required' (voir main.jsx), donc c'est ici, route par route, que
// l'utilisateur non connecté est renvoyé vers la page de connexion Keycloak.
// /public/:specId reste volontairement en dehors de ce wrapper.
function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    keycloak.login({ redirectUri: window.location.href })
    return null
  }
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route publique, sans authentification — lien partageable (voir PublicMockController côté backend) */}
        <Route path="/public/:specId" element={<PublicMockPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/specifications" element={<SpecificationPage />} />
          <Route path="/specifications/:id" element={<SpecificationViewPage />} />
          <Route path="/specifications/:id/edit" element={<SpecificationEditPage />} />
          <Route path="/specifications/:specId/endpoints" element={<EndpointsPage />} />
          {/* <Route path="/signIn" element={<SignInPage />} />
          <Route path="/signUp" element={<SignUpPage />} /> */}
          <Route path="/forgot-password" element={<ForgetPasswordPage />} />
          <Route path="/forget-password" element={<ForgetPasswordPage />} />
          <Route path="/profile" element={<ProfilPage />} />
          <Route path="/endpoints/:endpointId/scenarios" element={<ScenariosPage />} />
          <Route path="/specifications/:specId/reference/:endpointId?" element={<ApiReferencePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
