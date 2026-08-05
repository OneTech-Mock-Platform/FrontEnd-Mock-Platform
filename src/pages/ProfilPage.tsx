import { ExternalLink, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import keycloak from '../keycloak';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const KEYCLOAK_ACCOUNT_URL = 'http://localhost:9099/realms/mock-platform/account/';

export default function ProfilPage() {
  const { user } = useAuth();

  const claims = keycloak.tokenParsed as { email?: string; preferred_username?: string } | undefined;

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleEditProfile = () => {
    window.open(KEYCLOAK_ACCOUNT_URL, '_blank');
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <div className="app-stage">
          <div className="spec-page">
            <div className="spec-page__header">
              <div className="spec-page__header-text">
                <h1 className="spec-page__title">Mon profil</h1>
                <p className="spec-page__subtitle">
  Consultez et modifiez vos informations personnelles.
</p>
              </div>
            </div>

            <div className="profile-hero">
              <span className="profile-hero__avatar">{initials}</span>
              <div className="profile-hero__info">
                <strong className="profile-hero__name">{user?.name || 'Utilisateur'}</strong>
                <span className="profile-hero__email">
                  <Mail size={14} />
                  {user?.email || ''}
                </span>
              </div>
            </div>

            <div className="spec-card profile-section">
              <div className="profile-section__header">
                <span className="profile-section__icon">
                  <UserIcon size={18} />
                </span>
                <div>
                  <h3 className="profile-section__title">Informations personnelles</h3>
                 <p className="profile-section__desc">
  Ces informations sont associées à votre compte. Pour les modifier, utilisez le bouton ci-dessous.
</p>
                </div>
              </div>

              <div className="form-group">
                <span>Nom d'utilisateur</span>
                <div className="profile-field">
                  <UserIcon size={16} className="profile-field__icon" />
                  <input value={claims?.preferred_username ?? ''} disabled className="profile-input" />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <span>Email</span>
                <div className="profile-field">
                  <Mail size={16} className="profile-field__icon" />
                  <input value={claims?.email ?? ''} disabled className="profile-input" />
                </div>
              </div>
            </div>

            <div className="spec-actions">
              <button type="button" className="spec-save-btn" onClick={handleEditProfile}>
                <ExternalLink size={18} />
                Modifier mon profil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
