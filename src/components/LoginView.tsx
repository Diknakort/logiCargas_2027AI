import React, { useState } from 'react';
import { AppUser } from '../types/logistics';
import { apiClient } from '../services/apiClient';
import { Lock, User, Truck, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor introduce usuario y contraseña');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const user = await apiClient.login(username.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Comprueba tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Logo and Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-xl shadow-amber-500/5 mb-1">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              LogiRuta <span className="text-amber-400">Pro</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Control de Acceso Logístico & Gestión de Muelles
            </p>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Iniciar Sesión en el Sistema</span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Acceso Seguro
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Introduce tu nombre de usuario"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm cursor-pointer mt-2"
            >
              {loading ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Entrar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Note */}
        <p className="text-center text-[11px] text-slate-500">
          Terminal interno para operarios de almacén y logística de muelles.
        </p>

      </div>
    </div>
  );
};
