import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import keycloak from './keycloak'

keycloak
  .init({ onLoad: 'login-required', pkceMethod: 'S256' })
  .then((authenticated) => {
    if (authenticated) {
      createRoot(document.getElementById('root')).render(
        <StrictMode>
          <AuthProvider>
            <App />
          </AuthProvider>
        </StrictMode>,
      )
    }
  })
  .catch((err) => {
    console.error("Échec d'initialisation Keycloak", err)
  })
