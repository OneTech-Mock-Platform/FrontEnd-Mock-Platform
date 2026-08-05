import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import keycloak from '../keycloak';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


function userFromKeycloakToken(): User | null {
  const claims = keycloak.tokenParsed as { email?: string; preferred_username?: string } | undefined;
  if (!claims?.email) return null;
  return { id: 0, name: claims.preferred_username ?? claims.email, email: claims.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => userFromKeycloakToken());

  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  // Relit le token Keycloak déjà en mémoire (keycloak.tokenParsed) pour
  // repeupler `user` — utile juste après un keycloak.updateToken(-1) forcé
  // (ex: après une modification de profil), pour que la Sidebar/Navbar/
  // page Profil affichent tout de suite le nouveau username/nom, sans que
  // l'utilisateur ait besoin de se déconnecter/reconnecter manuellement.
  const refreshUser = useCallback(() => {
    setUser(userFromKeycloakToken());
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}