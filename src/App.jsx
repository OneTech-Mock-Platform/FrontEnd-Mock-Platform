import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.tsx'
import SpecificationPage from './pages/SpecificationPage.tsx'
import SpecificationViewPage from './pages/SpecificationDetailsPage.tsx'
import SpecificationEditPage from './pages/UpdateSpecificationPage.tsx'
import EndpointsPage from './pages/EndpointsPage.tsx'
import SignInPage from './pages/SignInPage.tsx'
import SignUpPage from './pages/SignUpPage.tsx'
import ForgetPasswordPage from './pages/ForgetPasswordPage.tsx'
import ProfilPage from './pages/ProfilPage.tsx'
import ScenariosPage from './pages/ScenarioPage.tsx'
import ApiReferencePage from './pages/ApiReferencePage.tsx'
import PublicMockPage from './pages/PublicMockPage.tsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/specifications" element={<SpecificationPage />} />
       <Route path="/specifications/:id" element={<SpecificationViewPage />} />
       <Route path="/specifications/:id/edit" element={<SpecificationEditPage />} />
       <Route path="/specifications/:specId/endpoints" element={<EndpointsPage />} />
        <Route path="/signIn" element={<SignInPage />} />
        <Route path="/signUp" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgetPasswordPage />} />
        <Route path="/forget-password" element={<ForgetPasswordPage />} />
        <Route path="/profile" element={<ProfilPage />} />
        <Route path="/endpoints/:endpointId/scenarios" element={<ScenariosPage />} />
        <Route path="/specifications/:specId/reference/:endpointId?" element={<ApiReferencePage />} />
        {/* Route publique, sans authentification — lien partageable (voir PublicMockController côté backend) */}
        <Route path="/public/:specId" element={<PublicMockPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

