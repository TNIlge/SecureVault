import React, { useState } from 'react';
import api from '../services/api';
import { Shield, Lock, User, Key, ArrowRight, RefreshCw, Cpu, Mail } from 'lucide-react';

interface AuthProps {
  onLogin: (token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('M');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!isLogin && password !== confirmPassword) {
      setMessage({ text: 'Les mots de passe ne correspondent pas.', type: 'error' });
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await api.post('/auth/login', formData);
        onLogin(response.data.access_token);
      } else {
        await api.post('/auth/register', { username, email, gender, password });
        setIsLogin(true);
        setMessage({ text: 'Inscription réussie ! Vous pouvez maintenant vous connecter.', type: 'success' });
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let errorText = 'Une erreur est survenue lors de l\'authentification';
      if (typeof detail === 'string') {
        errorText = detail;
      } else if (Array.isArray(detail)) {
        errorText = detail.map((e: any) => e.msg).join(', ');
      }
      setMessage({ text: errorText, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0d] px-4 relative overflow-hidden">
      {/* Background Animated Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-md w-full relative z-10">
        {/* In-app Notification */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
            <p className="text-xs font-bold uppercase tracking-wider">{message.text}</p>
          </div>
        )}

        <div className="glass-dark rounded-[2.5rem] p-1 shadow-2xl overflow-hidden border border-white/10">
          <div className="bg-[#14171c]/80 backdrop-blur-3xl rounded-[2.3rem] overflow-hidden">
            {/* Form Header */}
            <div className="pt-10 pb-6 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_30px_rgba(59,130,246,0.3)] mb-6 animate-float">
                <Shield className="text-white" size={36} />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
                Secure<span className="text-blue-500">Vault</span>
              </h1>
              <div className="flex justify-center items-center space-x-2 text-slate-500 text-xs font-bold tracking-[0.2em] uppercase">
                <Cpu size={12} />
                <span>Encrypted Storage Terminal</span>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-10 pb-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="group">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-blue-500 transition-colors">Identification</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:bg-white/[0.05] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium"
                        placeholder={isLogin ? "Utilisateur ou Email" : "Nom d'utilisateur"}
                        required
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <>
                      <div className="group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-blue-500 transition-colors">Email de secours</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail size={18} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:bg-white/[0.05] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium"
                            placeholder="votre@email.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-blue-500 transition-colors">Sexe</label>
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={() => setGender('M')}
                            className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${gender === 'M' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-white/[0.03] border-white/5 text-slate-500'}`}
                          >
                            Masculin
                          </button>
                          <button
                            type="button"
                            onClick={() => setGender('F')}
                            className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${gender === 'F' ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-white/[0.03] border-white/5 text-slate-500'}`}
                          >
                            Féminin
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="group">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-blue-500 transition-colors">Clé d'accès</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Key size={18} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:bg-white/[0.05] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="group">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-blue-500 transition-colors">Confirmation</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock size={18} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:bg-white/[0.05] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-4 flex items-center justify-center space-x-3 group shadow-lg shadow-blue-600/20"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span className="tracking-widest uppercase text-sm font-black">{isLogin ? 'Connexion' : 'Créer Compte'}</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
              
              <div className="mt-10 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage(null);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors tracking-widest uppercase"
                >
                  {isLogin ? "Nouveau ici ? Créer un accès" : 'Déjà un accès ? S\'identifier'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badges */}
        <div className="mt-10 flex items-center justify-center space-x-6 opacity-40">
          <div className="flex items-center space-x-2">
            <Lock size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">AES-256-GCM</span>
          </div>
          <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
          <div className="flex items-center space-x-2">
            <Shield size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vault Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
