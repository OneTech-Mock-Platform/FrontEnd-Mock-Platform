import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

interface FormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    // Validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    // Préparer les données à envoyer
    const data: any = {};
    if (formData.name !== user?.name) {
      data.name = formData.name;
    }
    if (formData.newPassword) {
      //data.currentPassword = formData.currentPassword;
      data.newPassword = formData.newPassword;
    }

    if (Object.keys(data).length === 0) {
      setError('Aucune modification à enregistrer');
      setLoading(false);
      return;
    }

    try {
      const updatedUser = await updateProfile(data);
      // Mettre à jour le contexte utilisateur
      login(updatedUser);
      setSuccess('Profil mis à jour avec succès !');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
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
              <h1 className="spec-page__title">Mon Profil</h1>
            </div>

            <div className="spec-card">
              {error && (
                <div style={{
                  padding: '12px 16px',
                  marginBottom: '16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{
                  padding: '12px 16px',
                  marginBottom: '16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  color: '#15803d',
                  fontSize: '0.9rem',
                }}>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <span>Nom</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e6e8f0',
                      fontSize: '0.95rem',
                      backgroundColor: '#ffffff',
                      color: '#1c1c3c',
                    }}
                    placeholder="Votre nom"
                  />
                </div>

                <div className="form-group">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e6e8f0',
                      fontSize: '0.95rem',
                      backgroundColor: '#f1f3f8',
                      color: '#6b7280',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>

                <div style={{ borderTop: '1px solid #e6e8f0', paddingTop: '20px' }}>
                  <h3 style={{
                    color: '#f7941d',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    marginBottom: '16px',
                  }}>
                    Changer le mot de passe
                  </h3>

                  <div className="form-group">
                    {/* <span>Mot de passe actuel</span>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e6e8f0',
                        fontSize: '0.95rem',
                        backgroundColor: '#ffffff',
                        color: '#1c1c3c',
                      }}
                      placeholder="Votre mot de passe actuel"
                    /> */}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <span>Nouveau mot de passe</span>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e6e8f0',
                        fontSize: '0.95rem',
                        backgroundColor: '#ffffff',
                        color: '#1c1c3c',
                      }}
                      placeholder="Nouveau mot de passe (min. 6 caractères)"
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <span>Confirmer le nouveau mot de passe</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e6e8f0',
                        fontSize: '0.95rem',
                        backgroundColor: '#ffffff',
                        color: '#1c1c3c',
                      }}
                      placeholder="Confirmer le nouveau mot de passe"
                    />
                  </div>
                </div>

                <div className="spec-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-orange"
                    style={{
                      padding: '14px 28px',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: '700',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}