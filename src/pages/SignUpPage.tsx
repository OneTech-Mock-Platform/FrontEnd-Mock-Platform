import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/api";
import logo from "../assets/images/onetech_Logo.png";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = "Le nom est requis.";
    } else if (name.trim().length < 2) {
      errors.name = "Le nom doit contenir au moins 2 caractères.";
    }

    if (!email.trim()) {
      errors.email = "L'adresse e-mail est requise.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Adresse e-mail invalide.";
    }

    if (!password) {
      errors.password = "Le mot de passe est requis.";
    } else if (password.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "La confirmation du mot de passe est requise.";
    } else if (confirmPassword.length < 6) {
      errors.confirmPassword = "La confirmation doit contenir au moins 6 caractères.";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser(name, email, password, confirmPassword);
      login(result.user);
      navigate("/specifications");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
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

          <div className="text-center space-y-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-[#f7941d]">Espace de travail</p>
            <h3 className="font-sans text-xl font-bold text-[#1c1c3c]">Créer un compte</h3>
            <p className="text-slate-500 text-sm">Rejoignez notre plateforme.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center mt-0.5">
                <AlertCircle className="h-3.5 w-3.5" />
              </span>
              <p className="text-red-700 text-sm leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase block" htmlFor="name">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <input
                  className={`w-full bg-slate-50 border rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 transition-all outline-none placeholder:text-slate-400 ${
                    fieldErrors.name
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-200 focus:ring-[#f7941d]/30 focus:border-[#f7941d]'
                  }`}
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Entrez votre nom d'utilisateur"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              </div>
              {fieldErrors.name && (
                <p className="flex items-center gap-1 text-red-600 text-xs mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase block" htmlFor="email">
                Adresse e-mail
              </label>
              <div className="relative">
                <input
                  className={`w-full bg-slate-50 border rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 transition-all outline-none placeholder:text-slate-400 ${
                    fieldErrors.email
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-200 focus:ring-[#f7941d]/30 focus:border-[#f7941d]'
                  }`}
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="exemple@email.com"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              </div>
              {fieldErrors.email && (
                <p className="flex items-center gap-1 text-red-600 text-xs mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase block" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  className={`w-full bg-slate-50 border rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:ring-2 transition-all outline-none placeholder:text-slate-400 ${
                    fieldErrors.password
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-200 focus:ring-[#f7941d]/30 focus:border-[#f7941d]'
                  }`}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Entrez votre mot de passe"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="flex items-center gap-1 text-red-600 text-xs mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase block" htmlFor="confirmPassword">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  className={`w-full bg-slate-50 border rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:ring-2 transition-all outline-none placeholder:text-slate-400 ${
                    fieldErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-200 focus:ring-[#f7941d]/30 focus:border-[#f7941d]'
                  }`}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="Confirmez votre mot de passe"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="flex items-center gap-1 text-red-600 text-xs mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-semibold text-sm tracking-wider uppercase py-3 rounded-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${
                isLoading
                  ? "bg-[#f7941d]/75 text-white cursor-not-allowed"
                  : "bg-[#f7941d] text-white hover:shadow-[0_0_20px_rgba(247,148,29,0.35)] cursor-pointer"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Inscription en cours...
                </>
              ) : "S'inscrire"}
            </button>
          </form>

          <div className="text-center pt-1 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-sans pt-4">
              Déjà un compte ?{" "}
              <button onClick={() => navigate("/signIn")} className="text-[#f7941d] font-bold hover:underline cursor-pointer">
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
