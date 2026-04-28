import React, { useState, useEffect, useMemo } from 'react';
import api from './services/api';
import Auth from './components/Auth';
import { FileMetadata } from './types';
import { 
  Shield, Upload, Download, LogOut, File as FileIcon, 
  Lock, RefreshCw, Plus, Search, Terminal, Database, X, CheckCircle2, AlertCircle,
  Users, ShieldAlert, Cpu, Trash2, History
} from 'lucide-react';
import { User, AuditLog } from './types';

type Tab = 'dashboard' | 'archives' | 'admin' | 'logs';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [userLogs, setUserLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allFiles, setAllFiles] = useState<FileMetadata[]>([]);
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile();
      fetchFiles();
      fetchUserLogs();
    } else {
      localStorage.removeItem('token');
      setCurrentUser(null);
    }
  }, [token]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setCurrentUser(response.data);
    } catch (err) {
      setToken(null);
    }
  };

  const fetchUserLogs = async () => {
    try {
      const response = await api.get('/auth/me/logs');
      setUserLogs(response.data);
    } catch (err) {
      console.error("Erreur logs utilisateur");
    }
  };

  const fetchAdminData = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      const [usersRes, filesRes, logsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/files'),
        api.get('/admin/logs')
      ]);
      setAllUsers(usersRes.data);
      setAllFiles(filesRes.data);
      setAllLogs(logsRes.data);
    } catch (err) {
      console.error("Erreur données admin");
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminData();
    }
    if (activeTab === 'logs') {
      fetchUserLogs();
    }
  }, [activeTab, currentUser]);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files/list');
      setFiles(response.data);
    } catch (err) {
      console.error('Erreur fichiers');
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter(file => 
      file.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [files, searchTerm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/files/upload', formData);
      fetchFiles();
      fetchUserLogs();
      setNotification({ text: 'Fichier chiffré et archivé.', type: 'success' });
    } catch (err) {
      setNotification({ text: "Erreur lors de l'upload.", type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (file: FileMetadata) => {
    setDownloadingId(file.id);
    try {
      const response = await api.get(`/files/download/${file.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      fetchUserLogs();
      setNotification({ text: 'Téléchargement réussi.', type: 'success' });
    } catch (err) {
      setNotification({ text: 'Erreur de déchiffrement.', type: 'error' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (file: FileMetadata) => {
    if (!window.confirm(`Supprimer définitivement "${file.filename}" ?`)) return;

    try {
      await api.delete(`/files/${file.id}`);
      fetchFiles();
      fetchUserLogs();
      setNotification({ text: "Fichier supprimé.", type: 'success' });
    } catch (err) {
      setNotification({ text: "Erreur lors de la suppression.", type: 'error' });
    }
  };

  const handleToggleUser = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/toggle-active`);
      fetchAdminData();
      setNotification({ text: "Statut utilisateur mis à jour.", type: 'success' });
    } catch (err) {
      setNotification({ text: "Erreur modification utilisateur.", type: 'error' });
    }
  };

  if (!token) {
    return <Auth onLogin={setToken} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-300 flex">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-8 right-8 z-50 flex items-center space-x-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-8 duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold uppercase tracking-wide">{notification.text}</p>
          <button onClick={() => setNotification(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="w-20 lg:w-64 bg-[#0a0b0d] border-r border-white/5 flex flex-col items-center lg:items-stretch py-8 sticky top-0 h-screen transition-all">
        <div className="px-6 mb-12 flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
          <div className="bg-blue-600 p-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:scale-110 transition-transform">
            <Shield className="text-white" size={24} />
          </div>
          <span className="hidden lg:block text-xl font-black text-white tracking-tighter uppercase">SECURE<span className="text-blue-500">VAULT</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'dashboard', icon: Terminal, label: 'Tableau de bord' },
            { id: 'archives', icon: Database, label: 'Archives' },
            { id: 'logs', icon: History, label: 'Historique' },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <item.icon size={24} />
              <span className="hidden lg:block ml-4 font-bold text-sm tracking-wide uppercase">{item.label}</span>
            </button>
          ))}
          
          {currentUser?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center p-4 rounded-2xl transition-all ${activeTab === 'admin' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-emerald-400 hover:bg-white/5'}`}
            >
              <ShieldAlert size={24} />
              <span className="hidden lg:block ml-4 font-bold text-sm tracking-wide uppercase">Administration</span>
            </button>
          )}
        </nav>

        {/* User Badge in Sidebar */}
        <div className="px-4 mb-4">
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hidden lg:block">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Identité</p>
            <p className="text-xs font-bold text-white truncate">{currentUser?.username}</p>
            <p className="text-[9px] font-black text-blue-500 uppercase mt-1 px-1.5 py-0.5 bg-blue-500/10 rounded-full inline-block">
              {currentUser?.role}
            </p>
          </div>
        </div>

        <div className="px-4 mt-auto">
          <button
            onClick={() => setToken(null)}
            className="w-full flex items-center p-4 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
          >
            <LogOut size={24} />
            <span className="hidden lg:block ml-4 font-bold text-sm tracking-wide uppercase">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">
              {activeTab === 'dashboard' && 'Poste de Contrôle'}
              {activeTab === 'archives' && 'Archives de Données'}
              {activeTab === 'admin' && 'Console Administration'}
              {activeTab === 'logs' && 'Journal d\'Activité'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {activeTab === 'dashboard' && 'Gestionnaire de données chiffrées au repos.'}
              {activeTab === 'archives' && 'Historique complet des fichiers sécurisés.'}
              {activeTab === 'admin' && 'Gestion globale des utilisateurs et supervision.'}
              {activeTab === 'logs' && 'Trace complète de vos actions sur le coffre-fort.'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all w-64"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button 
              className="bg-white/[0.03] p-3 rounded-2xl border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group"
              onClick={() => {
                fetchFiles();
                fetchUserLogs();
                if (activeTab === 'admin') fetchAdminData();
              }}
              title="Rafraîchir"
            >
              <RefreshCw size={20} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <section className="xl:col-span-4 space-y-8">
              <div className="glass-dark p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-blue-600/10 rounded-full blur-[60px] group-hover:bg-blue-600/20 transition-all"></div>
                <h2 className="text-xl font-black text-white mb-6 flex items-center uppercase tracking-tighter">
                  <Plus className="mr-3 text-blue-500" size={24} /> Ingestion
                </h2>
                <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                <label htmlFor="file-upload" className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-[1.5rem] transition-all ${uploading ? 'bg-blue-500/5 border-blue-500/30 cursor-wait' : 'hover:bg-blue-500/5 hover:border-blue-500/40 cursor-pointer group'}`}>
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all ${uploading ? 'bg-blue-600 animate-pulse ring-8 ring-blue-600/20' : 'bg-gradient-to-br from-blue-500 to-blue-700 group-hover:scale-110 shadow-blue-600/30 group-hover:shadow-blue-600/50'}`}>
                    {uploading ? <RefreshCw className="text-white animate-spin" size={32} /> : <Upload className="text-white" size={32} />}
                  </div>
                  <p className="text-white font-black text-lg mb-2 uppercase tracking-wide text-center px-2">{uploading ? 'Chiffrement...' : 'Sélectionner'}</p>
                  <p className="text-slate-500 text-[10px] text-center uppercase tracking-[0.2em] font-black">Stockage AES-256-GCM</p>
                </label>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                <div className="flex items-center space-x-4 mb-4 text-blue-400"><Lock size={20} /><h3 className="font-black uppercase tracking-widest text-sm text-white">Terminal Status</h3></div>
                <ul className="space-y-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <li className="flex justify-between border-b border-white/5 pb-2"><span>Moteur Vault</span><span className="text-emerald-500">Transit ON</span></li>
                  <li className="flex justify-between border-b border-white/5 pb-2"><span>Chiffrement</span><span className="text-blue-500">AES-256-GCM</span></li>
                  <li className="flex justify-between"><span>Session</span><span className="text-white">Sécurisée</span></li>
                </ul>
              </div>
            </section>

            <section className="xl:col-span-8">
              <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-xl font-black text-white flex items-center uppercase tracking-tighter"><Database className="mr-3 text-emerald-500" size={24} /> Archives</h2>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{filteredFiles.length} Éléments</span>
              </div>
              <div className="grid gap-4">
                {filteredFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem]"><Shield className="text-slate-700 mb-6" size={40} /><p className="text-slate-600 font-bold tracking-widest uppercase text-sm">{searchTerm ? 'Aucun résultat' : 'Coffre-fort vide'}</p></div>
                ) : (
                  filteredFiles.map((file) => (
                    <div key={file.id} className="group relative glass rounded-[1.5rem] p-5 flex items-center justify-between transition-all hover:bg-white/[0.06] hover:border-white/20 hover:shadow-2xl border-white/5">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><FileIcon size={28} /></div>
                        <div className="max-w-[150px] sm:max-w-xs md:max-w-md">
                          <p className="text-lg font-black text-white mb-1 group-hover:text-blue-400 transition-colors truncate">{file.filename}</p>
                          <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span className="font-jetbrains">{new Date(file.created_at).toLocaleDateString()}</span>
                            <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Archivé</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleDelete(file)} className="p-3 rounded-xl bg-white/[0.03] text-slate-500 hover:text-red-400 hover:bg-red-400/10 border border-white/5 transition-all"><Trash2 size={18} /></button>
                        <button onClick={() => handleDownload(file)} disabled={downloadingId === file.id} className={`relative w-14 h-14 flex items-center justify-center rounded-2xl transition-all ${downloadingId === file.id ? 'bg-white/10' : 'bg-white/[0.03] text-blue-500 border border-white/5 hover:bg-blue-600 hover:text-white shadow-xl'}`}>
                          {downloadingId === file.id ? <RefreshCw className="animate-spin" size={24} /> : <Download size={24} />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'archives' && (
          <div className="glass-dark p-12 rounded-[2.5rem] border border-white/5 text-center">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.1)]"><Database className="text-emerald-500" size={48} /></div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Archives Centralisées</h2>
            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed uppercase text-[10px] font-bold tracking-[0.1em]">Gestion immuable des données chiffrées par enveloppe.</p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5"><span className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Capacité</span><span className="text-xl font-black text-white font-jetbrains">{(files.length * 0.42).toFixed(1)} MB</span></div>
              <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5"><span className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Clés DEK</span><span className="text-xl font-black text-white font-jetbrains">{files.length}</span></div>
              <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5"><span className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Latence</span><span className="text-xl font-black text-white font-jetbrains">142ms</span></div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="glass-dark rounded-[2.5rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]"><h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center"><History className="mr-4 text-blue-400" size={24} /> Historique Personnel</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/[0.02]">
                    <th className="px-8 py-4">Événement</th><th className="px-8 py-4">Cible</th><th className="px-8 py-4">Horodatage</th><th className="px-8 py-4">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {userLogs.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-600 font-black uppercase text-xs tracking-[0.2em]">Aucun log trouvé</td></tr>
                  ) : (
                    userLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.01] transition-colors font-jetbrains text-[11px]">
                        <td className="px-8 py-5 text-blue-400 font-bold uppercase">{log.action}</td>
                        <td className="px-8 py-5 text-white">{log.resource}</td>
                        <td className="px-8 py-5 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-8 py-5 text-slate-600 uppercase tracking-tighter">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Utilisateurs', value: allUsers.length, icon: Users, color: 'text-blue-500' },
                { label: 'Total Archives', value: allFiles.length, icon: Database, color: 'text-emerald-500' },
                { label: 'Status Console', value: 'Root', icon: ShieldAlert, color: 'text-amber-500' },
                { label: 'Espace Serveur', value: `${(allFiles.length * 0.42).toFixed(1)} MB`, icon: Cpu, color: 'text-purple-500' },
              ].map((stat, i) => (
                <div key={i} className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center space-x-4"><div className={`p-3 rounded-2xl bg-white/[0.02] ${stat.color}`}><stat.icon size={24} /></div><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p><p className="text-xl font-black text-white uppercase">{stat.value}</p></div></div>
              ))}
            </div>

            <div className="glass-dark rounded-[2.5rem] border border-white/5 overflow-hidden">
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex justify-between items-center"><h2 className="text-xl font-black text-white uppercase tracking-tighter">Terminal Utilisateurs</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/[0.02]"><th className="px-8 py-4">Identité</th><th className="px-8 py-4">Email</th><th className="px-8 py-4">Privilèges</th><th className="px-8 py-4">Status</th><th className="px-8 py-4 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.01] transition-colors text-[11px] font-jetbrains uppercase">
                        <td className="px-8 py-5 flex items-center space-x-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${u.gender === 'F' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>{u.username.substring(0, 2)}</div><span className="font-bold text-white">{u.username}</span></td>
                        <td className="px-8 py-5 text-slate-400 lowercase font-sans">{u.email || 'N/A'}</td>
                        <td className="px-8 py-5"><span className={`px-2 py-0.5 rounded-full border ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-800 text-slate-500 border-white/5'}`}>{u.role}</span></td>
                        <td className="px-8 py-5"><div className="flex items-center space-x-2"><div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div><span className={u.is_active ? 'text-emerald-500' : 'text-red-500'}>{u.is_active ? 'Actif' : 'Bloqué'}</span></div></td>
                        <td className="px-8 py-5 text-right"><button disabled={u.id === currentUser.id} onClick={() => handleToggleUser(u.id)} className={`p-2 rounded-lg transition-all ${u.is_active ? 'text-red-400 hover:bg-red-400/20' : 'text-emerald-400 hover:bg-emerald-400/20'} disabled:opacity-10`}><ShieldAlert size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-dark rounded-[2.5rem] border border-white/5 overflow-hidden">
              <div className="p-8 border-b border-white/5 bg-white/[0.01]"><h2 className="text-xl font-black text-white uppercase tracking-tighter">Journaux Systèmes</h2></div>
              <div className="overflow-x-auto max-h-[400px]"><table className="w-full text-left"><thead className="sticky top-0 z-20 bg-[#14171c]"><tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/[0.02]"><th className="px-8 py-4">User</th><th className="px-8 py-4">Action</th><th className="px-8 py-4">Resource</th><th className="px-8 py-4">Horodatage</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {allLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors text-[10px] font-jetbrains uppercase tracking-tighter">
                      <td className="px-8 py-4 text-blue-400 font-bold">{log.username}</td>
                      <td className="px-8 py-4 text-slate-300">{log.action}</td>
                      <td className="px-8 py-4 text-slate-500 truncate max-w-[150px] font-sans lowercase">{log.resource}</td>
                      <td className="px-8 py-4 text-slate-600 font-sans lowercase">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
