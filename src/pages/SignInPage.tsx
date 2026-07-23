import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginUser, verifyLoginCode } from '../services/api';
import logo from '../assets/images/onetech_Logo.png';

export default function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [verificationStep, setVerificationStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!verificationStep) {
      return;
    }

    otpRefs.current[0]?.focus();
  }, [verificationStep]);

  useEffect(() => {
    if (!verificationStep || resendCooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [verificationStep, resendCooldown]);

  const resetOtp = () => {
    setOtp(Array(6).fill(''));
    otpRefs.current[0]?.focus();
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await loginUser(email, password);
      setVerificationStep(true);
      setResendCooldown(30);
      resetOtp();
      setSuccessMessage(response.message || 'Un code de vérification a été envoyé à votre adresse e-mail.');
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (otp.join('').length !== 6) {
      setError('Veuillez saisir le code à 6 chiffres.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await verifyLoginCode(email, otp.join(''));
      login(response.user);
      navigate('/specifications');
    } catch (err: any) {
      setError(err.message || 'Code invalide ou expiré');
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await loginUser(email, password);
      setResendCooldown(30);
      resetOtp();
      setSuccessMessage(response.message || 'Un nouveau code vient d’être envoyé.');
    } catch (err: any) {
      setError(err.message || 'Impossible de renvoyer le code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);
    setError('');

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') {
      return;
    }

    if (!otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = '';
    setOtp(nextOtp);
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) {
      return;
    }

    const nextOtp = Array(6).fill('');
    for (let index = 0; index < pastedData.length; index += 1) {
      nextOtp[index] = pastedData[index];
    }

    setOtp(nextOtp);
    setError('');

    if (pastedData.length < 6) {
      otpRefs.current[pastedData.length]?.focus();
    }
  };

  const goBackToCredentials = () => {
    setVerificationStep(false);
    setOtp(Array(6).fill(''));
    setError('');
    setSuccessMessage('');
    setResendCooldown(0);
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

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-[#f7941d]">Espace de travail</p>
              <h3 className="font-sans text-xl font-bold text-[#1c1c3c]">
                {verificationStep ? 'Vérification du compte' : 'Se connecter'}
              </h3>
              <p className="text-slate-500 text-sm">
                {verificationStep
                  ? 'Saisissez le code reçu par e-mail pour finaliser la connexion.'
                  : 'Connectez-vous pour accéder à votre espace de travail.'}
              </p>
            </div>

            {verificationStep && (
              <button
                type="button"
                onClick={goBackToCredentials}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-[#f7941d] transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center mt-0.5">
                <AlertCircle className="h-3.5 w-3.5" />
              </span>
              <p className="text-red-700 text-sm leading-snug">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <p className="text-emerald-700 text-sm leading-snug">{successMessage}</p>
            </div>
          )}

          {!verificationStep ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase block" htmlFor="email">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-[#f7941d]/30 focus:border-[#f7941d] transition-all outline-none placeholder:text-slate-400"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="exemple@email.com"
                    autoComplete="email"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase block" htmlFor="password">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-[#f7941d]/30 focus:border-[#f7941d] transition-all outline-none placeholder:text-slate-400"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-slate-500 hover:text-[#f7941d] transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full font-semibold text-sm tracking-wider uppercase py-3 rounded-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${
                  isLoading
                    ? 'bg-[#f7941d]/75 text-white cursor-not-allowed'
                    : 'bg-[#f7941d] text-white hover:shadow-[0_0_20px_rgba(247,148,29,0.35)] cursor-pointer'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                  Code de vérification à 6 chiffres
                </label>
                <div className="flex justify-center gap-2.5">
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
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      disabled={isSubmitting}
                      className={`w-11 h-12 text-center text-xl font-bold rounded-xl border bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#f7941d]/30 focus:border-[#f7941d] transition-all outline-none ${
                        digit ? 'border-[#f7941d]/40' : 'border-slate-200'
                      } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                      aria-label={`Chiffre ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.join('').length < 6}
                className={`w-full py-3.5 rounded-xl font-bold text-white bg-[#f7941d] transition-all shadow-lg shadow-[#f7941d]/20 flex items-center justify-center gap-2 ${
                  isSubmitting || otp.join('').length < 6
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_0_20px_rgba(247,148,29,0.35)]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Valider le code'
                )}
              </button>

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className={`text-sm font-bold transition-colors ${
                    resendCooldown > 0 || isSubmitting
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-[#f7941d] hover:underline'
                  }`}
                >
                  {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-1 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-sans pt-4">
              Pas encore de compte ?{' '}
              <button
                onClick={() => navigate('/signUp')}
                className="text-[#f7941d] font-bold hover:underline cursor-pointer"
              >
                S'inscrire
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}