import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginUser, verifyLoginCode } from '../services/api';

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
    <main className="min-h-screen flex items-center justify-center p-4 md:p-12 relative overflow-hidden bg-surface" style={{ color: '#ffffff' }}>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden shadow-2xl glass-panel border border-white/5 z-10">
        <section
          className="hidden md:flex flex-col items-center justify-center p-12 bg-surface-container relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f1023 0%, #1a1b3a 100%)' }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(247,148,29,0.08)_1px,transparent_0)] bg-[size:32px_32px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-xs">
          {/*   <div className="w-16 h-16 rounded-2xl bg-[#f7941d]/15 border border-[#f7941d]/20 flex items-center justify-center text-[#f7941d]">
              <ShieldCheck className="h-7 w-7" />
            </div> */}
          {/*   <h1 className="font-sans text-3xl font-bold text-white tracking-tight">Connexion sécurisée</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Après saisie de votre e-mail et de votre mot de passe, un code de vérification est envoyé à votre boîte mail.
            </p> */}
          </div>
        </section>

        <section className="p-8 md:p-12 flex flex-col justify-center bg-[#0f1023]">
          <div className="w-full max-w-sm mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <h3 className="font-sans text-2xl font-bold text-orange">
                  {verificationStep ? 'Vérification du compte' : 'Se connecter'}
                </h3>
                <p className="text-white-400 text-sm">
                  {verificationStep
                    ? 'Saisissez le code reçu par e-mail pour finaliser la connexion.'
                    : 'Connectez-vous pour accéder à votre espace de travail.'}
                </p>
              </div>

              {verificationStep && (
                <button
                  type="button"
                  onClick={goBackToCredentials}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-[#f7941d] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <p className="text-emerald-300 text-sm text-center">{successMessage}</p>
              </div>
            )}

            {!verificationStep ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase block" htmlFor="email">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-[#1a1b3a] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#f7941d]/50 focus:border-[#f7941d] transition-all outline-none placeholder:text-gray-500"
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="exemple@email.com"
                      autoComplete="email"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase block" htmlFor="password">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-[#1a1b3a] border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#f7941d]/50 focus:border-[#f7941d] transition-all outline-none placeholder:text-gray-500"
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs text-gray-400 hover:text-[#f7941d] transition-colors"
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
              <form onSubmit={handleVerifySubmit} className="space-y-6" noValidate>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-1">
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
                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-slate-50/50 dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f7941d]/30 focus:border-[#f7941d] transition-all outline-none ${
                          digit ? 'border-[#f7941d]/40 dark:border-[#f7941d]/40' : 'border-slate-200 dark:border-slate-800'
                        } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                        aria-label={`Chiffre ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otp.join('').length < 6}
                  className={`w-full py-4 rounded-xl font-bold text-white bg-[#f7941d] transition-all shadow-lg shadow-[#f7941d]/20 flex items-center justify-center gap-2 ${
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
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'text-[#f7941d] hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
                  </button>

              {/*     <button
                    type="button"
                    onClick={goBackToCredentials}
                    className="font-bold text-[#f7941d] hover:underline text-sm"
                  >
                    Modifier l’adresse e-mail
                  </button> */}
                </div>
              </form>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-400 font-sans">
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
        </section>
      </div>
    </main>
  );
}