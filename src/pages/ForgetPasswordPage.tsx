import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Lock, Mail } from 'lucide-react';
import {
  requestPasswordResetCode,
  resetPasswordWithToken,
  verifyPasswordResetCode,
} from '../services/api';
import logo from '../assets/images/onetech_Logo.png';

export default function ForgotPasswordFlow() {
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [resendTimer, setResendTimer] = useState(30);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentStep === 3 && !resetToken) {
      setCurrentStep(1);
    }
  }, [currentStep, resetToken]);

  useEffect(() => {
    if (currentStep !== 2) {
      return;
    }

    const interval = setInterval(() => {
      setResendTimer((previous) => (previous <= 1 ? 0 : previous - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep]);

  useEffect(() => {
    const isFull = otp.every((digit) => digit !== '');
    if (currentStep !== 2 || !isFull || loading) {
      return;
    }

    const timeout = setTimeout(() => {
      handleVerifyOTP();
    }, 75);

    return () => clearTimeout(timeout);
  }, [otp, currentStep, loading]);

  const focusInput = (index: number) => {
    otpRefs.current[index]?.focus();
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await requestPasswordResetCode(email);
      setSuccessMsg('Si un compte existe, un code de réinitialisation a été envoyé.');
      setOtp(Array(6).fill(''));
      setResendTimer(30);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Impossible d’envoyer le code de réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  async function handleVerifyOTP() {
    const code = otp.join('');
    if (code.length !== 6 || loading) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await verifyPasswordResetCode(email, code);
      if (!response?.resetToken) {
        throw new Error('Le serveur n’a pas renvoyé de jeton de réinitialisation.');
      }

      setResetToken(response.resetToken);
      setSuccessMsg('Code vérifié avec succès.');
      setCurrentStep(3);
    } catch {
      setError('Code invalide ou expiré.');
      setOtp(Array(6).fill(''));
      focusInput(0);
    } finally {
      setLoading(false);
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading) {
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await requestPasswordResetCode(email);
      setResendTimer(30);
      setSuccessMsg('Un nouveau code a été envoyé.');
      setOtp(Array(6).fill(''));
      focusInput(0);
    } catch {
      setError('Impossible de renvoyer le code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    setError(null);

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (value && index < 5) {
      focusInput(index + 1);
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') {
      return;
    }

    if (!otp[index] && index > 0) {
      focusInput(index - 1);
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = '';
    setOtp(nextOtp);
    setError(null);
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) {
      return;
    }

    const nextOtp = [...otp];
    for (let index = 0; index < pastedData.length; index += 1) {
      nextOtp[index] = pastedData[index];
    }

    setOtp(nextOtp);
    setError(null);

    if (pastedData.length < 6) {
      focusInput(pastedData.length);
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!resetToken || loading) {
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await resetPasswordWithToken(resetToken, newPassword);
      setSuccessMsg('Mot de passe réinitialisé avec succès.');
      setTimeout(() => navigate('/signIn'), 1400);
    } catch (err: any) {
      setError(err.message || 'Impossible de réinitialiser le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0b0c20 0%, #12132e 45%, #1c1c3c 100%)' }}
    >
      <div className="absolute -top-24 -left-16 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-16 w-96 h-96 bg-[#f7941d]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="flex flex-col items-center gap-3 pb-1">
            <img src={logo} alt="OneTech" className="h-9 w-auto" />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/signIn')}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-[#f7941d] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>

            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= step ? 'w-8 bg-[#f7941d]' : 'w-3 bg-slate-200'}`}
                />
              ))}
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-[0.7rem] font-bold uppercase tracking-wider text-[#f7941d]">Espace de travail</p>
                <h2 className="font-sans text-xl font-bold text-[#1c1c3c]">Mot de passe oublié</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Saisissez l’adresse e-mail associée à votre compte pour recevoir un code de réinitialisation.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center mt-0.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-red-700 text-sm leading-snug">{error}</p>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-emerald-700 text-sm leading-snug">{successMsg}</p>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase block" htmlFor="email">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                      placeholder="exemple@email.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-[#f7941d]/30 focus:border-[#f7941d] transition-all outline-none placeholder:text-slate-400"
                      required
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full font-semibold text-sm tracking-wider uppercase py-3 rounded-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'bg-[#f7941d]/75 text-white cursor-not-allowed' : 'bg-[#f7941d] text-white hover:shadow-[0_0_20px_rgba(247,148,29,0.35)] cursor-pointer'}`}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le code'}
                </button>
              </form>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-[0.7rem] font-bold uppercase tracking-wider text-[#f7941d]">Espace de travail</p>
                <h2 className="font-sans text-xl font-bold text-[#1c1c3c]">Vérifier le code</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Un code à 6 chiffres a été envoyé à <span className="text-[#1c1c3c] font-semibold">{email}</span>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={loading}
                    onChange={(event) => handleOtpChange(index, event)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-11 h-12 text-center text-xl font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f7941d]/30 focus:border-[#f7941d] transition-all bg-slate-50 disabled:opacity-50 text-slate-900"
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center mt-0.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-red-700 text-sm leading-snug">{error}</p>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-emerald-700 text-sm leading-snug">{successMsg}</p>
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-3 pt-1">
                {resendTimer > 0 ? (
                  <span className="text-[13px] font-medium text-slate-500">
                    Renvoyer le code dans 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleResendOTP}
                    className="text-[13px] font-semibold text-[#1c1c3c] hover:text-[#f7941d] transition-colors disabled:text-slate-400"
                  >
                    Renvoyer le code
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setOtp(Array(6).fill(''));
                    setResetToken(null);
                    setResendTimer(30);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Changer l’adresse e-mail
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-[0.7rem] font-bold uppercase tracking-wider text-[#f7941d]">Espace de travail</p>
                <h2 className="font-sans text-xl font-bold text-[#1c1c3c]">Nouveau mot de passe</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Choisissez un mot de passe fort que vous n’utilisez pas ailleurs.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center mt-0.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-red-700 text-sm leading-snug">{error}</p>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-emerald-700 text-sm leading-snug">{successMsg}</p>
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                      placeholder="Nouveau mot de passe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-[#f7941d]/30 focus:border-[#f7941d] transition-all outline-none placeholder:text-slate-400"
                      required
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                      placeholder="Confirmer le mot de passe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-[#f7941d]/30 focus:border-[#f7941d] transition-all outline-none placeholder:text-slate-400"
                      required
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                  className={`w-full font-semibold text-sm tracking-wider uppercase py-3 rounded-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'bg-[#f7941d]/75 text-white cursor-not-allowed' : 'bg-[#f7941d] text-white hover:shadow-[0_0_20px_rgba(247,148,29,0.35)] cursor-pointer'}`}
                >
                  {loading ? 'Mise à jour en cours...' : 'Réinitialiser le mot de passe'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}