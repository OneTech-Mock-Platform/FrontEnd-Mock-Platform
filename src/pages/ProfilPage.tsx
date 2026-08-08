import { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail, Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import keycloak from '../keycloak';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilPage() {
  const { user, refreshUser } = useAuth();

  const claims = keycloak.tokenParsed as
    | { email?: string; preferred_username?: string; given_name?: string; family_name?: string }
    | undefined;

  const [formData, setFormData] = useState<FormData>({
    firstName: claims?.given_name || '',
    lastName: claims?.family_name || '',
    email: claims?.email || '',
    username: claims?.preferred_username || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError('Password must contain at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const data: { firstName?: string; lastName?: string; username?: string; password?: string } = {};
    if (formData.firstName !== (claims?.given_name || '')) data.firstName = formData.firstName;
    if (formData.lastName !== (claims?.family_name || '')) data.lastName = formData.lastName;
    if (formData.username !== (claims?.preferred_username || '')) data.username = formData.username;
    if (formData.newPassword) data.password = formData.newPassword;

    if (Object.keys(data).length === 0) {
      setError('No changes to save');
      setLoading(false);
      return;
    }

    try {
      await updateProfile(data);

      try {
        await keycloak.updateToken(-1);
      } catch {
       
      }
      refreshUser();
      const refreshedClaims = keycloak.tokenParsed as
        | { email?: string; preferred_username?: string; given_name?: string; family_name?: string }
        | undefined;
      setFormData({
        firstName: refreshedClaims?.given_name || '',
        lastName: refreshedClaims?.family_name || '',
        email: refreshedClaims?.email || '',
        username: refreshedClaims?.preferred_username || '',
        newPassword: '',
        confirmPassword: '',
      });

      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
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
                <h1 className="spec-page__title">My profile</h1>
                <p className="spec-page__subtitle">Manage your personal information and security.</p>
              </div>
            </div>

            <div className="profile-hero">
              <span className="profile-hero__avatar">{initials}</span>
              <div className="profile-hero__info">
                <strong className="profile-hero__name">{user?.name || 'User'}</strong>
                <span className="profile-hero__email">
                  <Mail size={14} />
                  {user?.email || ''}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="spec-card profile-section">
                <div className="profile-section__header">
                  <span className="profile-section__icon">
                    <UserIcon size={18} />
                  </span>
                  <div>
                    <h3 className="profile-section__title">Personal information</h3>
                    <p className="profile-section__desc"> View and edit your personal information.</p>
                  </div>
                </div>

                <div className="form-group">
                  <span>Username</span>
                  <div className="profile-field">
                    <UserIcon size={16} className="profile-field__icon" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="profile-input"
                      placeholder="Your username"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <span>First name</span>
                  <div className="profile-field">
                    <UserIcon size={16} className="profile-field__icon" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="profile-input"
                      placeholder="Your first name"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <span>Last name</span>
                  <div className="profile-field">
                    <UserIcon size={16} className="profile-field__icon" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="profile-input"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <span>Email</span>
                  <div className="profile-field">
                    <Mail size={16} className="profile-field__icon" />
                    <input value={formData.email} disabled className="profile-input" />
                  </div>
                </div>
              </div>

              <div className="spec-card profile-section">
                <div className="profile-section__header">
                  <span className="profile-section__icon profile-section__icon--danger">
                    <Lock size={18} />
                  </span>
                  <div>
                    <h3 className="profile-section__title">Security</h3>
                    <p className="profile-section__desc">Leave empty if you do not want to change your password</p>
                  </div>
                </div>

                <div className="form-group">
                  <span>New password</span>
                  <div className="profile-field">
                    <KeyRound size={16} className="profile-field__icon" />
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="profile-input"
                      placeholder="New password"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <span>Confirm new password</span>
                  <div className="profile-field">
                    <KeyRound size={16} className="profile-field__icon" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="profile-input"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

           
              {error && (
                <div className="profile-alert profile-alert--error">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              {success && (
                <div className="profile-alert profile-alert--success">
                  <CheckCircle2 size={18} />
                  {success}
                </div>
              )}

              <div className="spec-actions">
                <button type="submit" disabled={loading} className="spec-save-btn">
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
