import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.tsx'
import SpecificationPage from './pages/SpecificationPage.tsx'
import SpecificationViewPage from './pages/SpecificationDetailsPage.tsx'
import SpecificationEditPage from './pages/UpdateSpecificationPage.tsx'
import EndpointsPage from './pages/EndpointsPage.tsx'
import SignInPage from './pages/SignInPage.tsx'
import SignUpPage from './pages/SingUpPage.tsx'
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

