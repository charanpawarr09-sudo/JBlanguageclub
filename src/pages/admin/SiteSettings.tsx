import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Plus, Edit, Trash2, X, Shield, UserPlus, Key, Users } from 'lucide-react';

export default function SiteSettings() {
    const [activeTab, setActiveTab] = useState<'users' | 'seo' | 'activation'>('users');
    const [users, setUsers] = useState<any[]>([]);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');
    const [userModal, setUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [userForm, setUserForm] = useState<any>({});

    useEffect(() => { fetchAll(); }, []);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [usersRes, settingsRes] = await Promise.all([
                fetch('/api/admin/users', { credentials: 'include' }).then(r => r.ok ? r.json() : [] as never[]),
                fetch('/api/settings', { credentials: 'include' }).then(r => r.json()),
            ]);
            setUsers(usersRes); setSettings(settingsRes);
        } catch { /* ignore fetch errors for restricted resources */ }
        finally { setLoading(false); }
    };

    const saveUser = async (e: FormEvent) => {
        e.preventDefault();
        const method = editingUser ? 'PUT' : 'POST';
        const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(userForm) });
        if (res.ok) { setUserModal(false); fetchAll(); showToast(editingUser ? 'User updated' : 'User created'); }
        else { const d = await res.json(); showToast(d.error || 'Failed to save'); }
    };

    const toggleUserActive = async (user: any) => {
        await fetch(`/api/admin/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ is_active: !user.is_active }) });
        fetchAll(); showToast(`User ${user.is_active ? 'deactivated' : 'activated'}`);
    };

    const saveSettings = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(settings) });
            if (res.ok) { showToast('Settings saved!'); }
            else { const d = await res.json(); showToast(d.error || 'Failed to save settings'); }
        } catch { showToast('Failed to save settings'); }
    };

    const inputCls = 'w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none transition-all';
    const roles = ['super_admin', 'event_manager', 'content_editor', 'technical_admin'];
    const roleBadge = (r: string) => {
        const colors: Record<string, string> = { super_admin: 'bg-red-900/30 text-red-400', technical_admin: 'bg-blue-900/30 text-blue-400', event_manager: 'bg-amber-900/30 text-amber-400', content_editor: 'bg-emerald-900/30 text-emerald-400' };
        return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[r] || 'bg-slate-800 text-slate-400'}`}>{r.replace('_', ' ')}</span>;
    };

    const tabs = [
        { id: 'users' as const, label: 'Admin Users', icon: Users },
        { id: 'seo' as const, label: 'SEO & Branding', icon: Shield },
        { id: 'activation' as const, label: 'Event Activation', icon: Key },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Site Settings</h2>

            <div className="flex gap-2 mb-6">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* Admin Users */}
            {activeTab === 'users' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-slate-400 text-sm">{users.length} admin users</p>
                        <button onClick={() => { setEditingUser(null); setUserForm({ role: 'event_manager' }); setUserModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium"><UserPlus className="w-4 h-4" /> Add User</button>
                    </div>
                    <div className="space-y-3">
                        {users.map(user => (
                            <div key={user.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-bold">{user.username.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-white">{user.username}</h4>
                                            {roleBadge(user.role)}
                                            {!user.is_active && <span className="px-2 py-0.5 bg-red-900/30 text-red-400 rounded text-xs">Deactivated</span>}
                                        </div>
                                        <p className="text-slate-500 text-xs">{user.email || 'No email'} · Last login: {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditingUser(user); setUserForm({ role: user.role, email: user.email, is_active: user.is_active }); setUserModal(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-blue-400"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => toggleUserActive(user)} className={`p-2 hover:bg-slate-800 rounded-lg ${user.is_active ? 'text-red-400' : 'text-emerald-400'}`}><Shield className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SEO */}
            {activeTab === 'seo' && (
                <form onSubmit={saveSettings} className="space-y-5 max-w-2xl">
                    <h3 className="text-lg font-semibold text-white">SEO Metadata</h3>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Site Title</label><input value={settings.seo_title || ''} onChange={e => setSettings({ ...settings, seo_title: e.target.value })} className={inputCls} /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Meta Description</label><textarea rows={2} value={settings.seo_description || ''} onChange={e => setSettings({ ...settings, seo_description: e.target.value })} className={inputCls} /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">OG Image URL</label><input value={settings.seo_og_image || ''} onChange={e => setSettings({ ...settings, seo_og_image: e.target.value })} className={inputCls} /></div>
                    <h3 className="text-lg font-semibold text-white pt-4 border-t border-slate-800">Branding</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Logo URL</label><input value={settings.brand_logo || ''} onChange={e => setSettings({ ...settings, brand_logo: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Accent Color</label><input type="color" value={settings.brand_accent || '#7c3aed'} onChange={e => setSettings({ ...settings, brand_accent: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Tagline</label><input value={settings.brand_tagline || ''} onChange={e => setSettings({ ...settings, brand_tagline: e.target.value })} className={inputCls} /></div>
                    <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                </form>
            )}

            {/* Event Activation */}
            {activeTab === 'activation' && (
                <form onSubmit={saveSettings} className="space-y-5 max-w-2xl">
                    <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-4">
                        <h3 className="text-white font-semibold flex items-center gap-2"><Key className="w-4 h-4 text-amber-400" /> Global Controls</h3>
                        <p className="text-slate-400 text-sm mt-1">These settings override individual event settings.</p>
                    </div>
                    <label className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-4 cursor-pointer">
                        <div><p className="text-white font-medium">Registration Kill Switch</p><p className="text-slate-500 text-xs">Disable all registrations site-wide</p></div>
                        <input type="checkbox" checked={settings.kill_registration === 'true'} onChange={e => setSettings({ ...settings, kill_registration: String(e.target.checked) })} className="w-5 h-5 rounded" />
                    </label>
                    <label className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-4 cursor-pointer">
                        <div><p className="text-white font-medium">Maintenance Mode</p><p className="text-slate-500 text-xs">Show maintenance page to all visitors</p></div>
                        <input type="checkbox" checked={settings.maintenance_mode === 'true'} onChange={e => setSettings({ ...settings, maintenance_mode: String(e.target.checked) })} className="w-5 h-5 rounded" />
                    </label>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Venue / Location</label><input value={settings.venue || ''} onChange={e => setSettings({ ...settings, venue: e.target.value })} className={inputCls} /></div>
                    <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                </form>
            )}

            {/* User Modal */}
            <AnimatePresence>
                {userModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">{editingUser ? 'Edit User' : 'Create Admin User'}</h3>
                                <button onClick={() => setUserModal(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={saveUser} className="space-y-4">
                                {!editingUser && <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Username *</label><input required value={userForm.username || ''} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className={inputCls} /></div>}
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label><input type="email" value={userForm.email || ''} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className={inputCls} /></div>
                                {!editingUser && <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Password *</label><input required type="password" value={userForm.password || ''} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className={inputCls} /></div>}
                                {editingUser && <div><label className="block text-sm font-medium text-slate-300 mb-1.5">New Password (leave blank to keep)</label><input type="password" value={userForm.password || ''} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className={inputCls} /></div>}
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                                    <select value={userForm.role || 'event_manager'} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className={inputCls}>
                                        {roles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setUserModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                                    <button type="submit" className="px-5 py-2 bg-teal-600 text-white rounded-xl font-medium">Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm shadow-2xl z-50">{toast}</motion.div>)}</AnimatePresence>
        </div>
    );
}
