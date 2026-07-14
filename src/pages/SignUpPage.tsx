import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/api";
//import logo from "../assets/images/logo.png";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
    <main className="min-h-screen flex items-center justify-center p-4 md:p-12 relative overflow-hidden bg-surface" style={{ color: '#ffffff' }} >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden shadow-2xl glass-panel border border-white/5 z-10">
        
        <section className="hidden md:flex flex-col items-center justify-center p-12 bg-surface-container relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f1023 0%, #1a1b3a 100%)' }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(247,148,29,0.08)_1px,transparent_0)] bg-[size:32px_32px]"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-6">
           {/*  <img src={logo} alt="OneTech Logo" className="w-28 h-28 object-contain" />
            <h1 className="font-sans text-3xl font-bold text-white tracking-tight">OneTech</h1>
            <p className="text-gray-400 text-sm text-center max-w-xs">
              Plateforme de gestion d'API et de spécifications techniques
            </p> */}
          </div>
        </section>

        <section className="p-8 md:p-12 flex flex-col justify-center bg-[#0f1023]">
          <div className="w-full max-w-sm mx-auto space-y-6">
            <div className="text-center md:text-left space-y-2">
              <h3 className="font-sans text-2xl font-bold text-orange">Créer un compte</h3>
              <p className="text-white-400 text-sm">Rejoignez notre plateforme.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase block" htmlFor="name">Username</label>
                <div className="relative">
                  <input className="w-full bg-[#1a1b3a] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#f7941d]/50 focus:border-[#f7941d] transition-all outline-none placeholder:text-gray-500"
                    id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Entrez votre nom d'utilisateur" />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase block" htmlFor="email">ADRESSE EMAIL</label>
                <div className="relative">
                  <input className="w-full bg-[#1a1b3a] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#f7941d]/50 focus:border-[#f7941d] transition-all outline-none placeholder:text-gray-500"
                    id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.com" />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase block" htmlFor="password">MOT DE PASSE</label>
                <div className="relative">
                  <input className="w-full bg-[#1a1b3a] border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#f7941d]/50 focus:border-[#f7941d] transition-all outline-none placeholder:text-gray-500"
                    id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Entrez votre mot de passe" />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase block" htmlFor="confirmPassword">CONFIRMER LE MOT DE PASSE</label>
                <div className="relative">
                  <input className="w-full bg-[#1a1b3a] border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#f7941d]/50 focus:border-[#f7941d] transition-all outline-none placeholder:text-gray-500"
                    id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmez votre mot de passe" />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className={`w-full font-semibold text-sm tracking-wider uppercase py-3 rounded-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${
                  isLoading ? "bg-[#f7941d]/75 text-white cursor-not-allowed" : "bg-[#f7941d] text-white hover:shadow-[0_0_20px_rgba(247,148,29,0.35)] cursor-pointer"
                }`}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    INSCRIPTION EN COURS...
                  </>
                ) : "S'INSCRIRE"}
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-400 font-sans">
                Déjà un compte ?{" "}
                <button onClick={() => navigate("/signIn")} className="text-[#f7941d] font-bold hover:underline cursor-pointer">Se connecter</button>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}