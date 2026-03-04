import { useState, useEffect, FormEvent, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, X, Save, Archive, Users, Filter, Upload, ImageIcon } from 'lucide-react';

interface TeamMember {
    id: number; name: string; photo_url?: string; role?: string;
    designation?: string; dept_group?: string; display_order: number;
    linkedin_url?: string; instagram_url?: string; instagram_handle?: string;
    is_active: boolean; is_archived: boolean; edition_id?: number;
}

export default function TeamManager() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TeamMember | null>(null);
    const [form, setForm] = useState<Partial<TeamMember>>({});
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');
    const [toast, setToast] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const groups = ['Core Team', 'Technical', 'Creative', 'Outreach', 'Management', 'Other'];

    useEffect(() => { fetchMembers(); }, []);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const handlePhotoUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) { showToast('Please select an image file'); return; }
        if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB'); return; }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd });
            if (res.ok) {
                const data = await res.json();
                setForm(prev => ({ ...prev, photo_url: data.url }));
                showToast('Photo uploaded!');
            } else {
                const d = await res.json();
                showToast(d.error || 'Upload failed');
            }
        } catch { showToast('Upload failed'); }
        finally { setUploading(false); }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handlePhotoUpload(file);
    };

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/team', { credentials: 'include' });
            setMembers(await res.json());
        } catch { showToast('Failed to fetch team'); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const method = editing ? 'PUT' : 'POST';
            const url = editing ? `/api/admin/team/${editing.id}` : '/api/admin/team';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
            if (res.ok) { setIsModalOpen(false); fetchMembers(); showToast(editing ? 'Member updated!' : 'Member added!'); }
            else { const d = await res.json(); showToast(d.error || 'Failed to save member'); }
        } catch { showToast('Failed to save member'); }
    };

    const handleArchive = async (id: number) => {
        if (!confirm('Delete this member permanently?')) return;
        try {
            const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) { const d = await res.json(); showToast(d.error || 'Failed to delete member'); return; }
            fetchMembers(); showToast('Member deleted');
        } catch { showToast('Failed to delete member'); }
    };

    const filtered = members.filter(m => {
        if (m.is_archived) return false;
        const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
        const matchGroup = filterGroup === 'all' || m.dept_group === filterGroup;
        return matchSearch && matchGroup;
    });

    const inputCls = 'w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none transition-all';

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Team Management</h2>
                    <p className="text-slate-400 text-sm mt-1">{filtered.length} active members</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ is_active: true, display_order: 0 }); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-teal-500 hover:to-emerald-600 transition-all shadow-lg shadow-teal-900/30">
                    <Plus className="w-4 h-4" /> Add Member
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input type="text" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none" />
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setFilterGroup('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterGroup === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'}`}>All</button>
                    {groups.map(g => <button key={g} onClick={() => setFilterGroup(g)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterGroup === g ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{g}</button>)}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-500"><p className="text-lg font-medium">No team members found</p></div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map(member => (
                        <motion.div key={member.id} layout className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors group">
                            <div className="flex justify-center mb-3">
                                {member.photo_url ? (
                                    <img src={member.photo_url} alt={member.name} className="w-20 h-20 rounded-full object-cover border-2 border-slate-700" style={{ objectPosition: `center ${(member as any).photo_position || 'center'}` }} />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white text-2xl font-bold">{member.name.charAt(0)}</div>
                                )}
                            </div>
                            <h3 className="font-semibold text-white text-center truncate">{member.name}</h3>
                            <p className="text-teal-400 text-sm text-center truncate">{member.role || 'Member'}</p>
                            {member.designation && <p className="text-slate-500 text-xs text-center truncate mt-0.5">{member.designation}</p>}
                            {member.dept_group && <span className="block mx-auto mt-2 px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400 text-center w-fit">{member.dept_group}</span>}
                            <div className="flex justify-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditing(member); setForm(member); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-800 rounded-lg text-blue-400"><Edit className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleArchive(member.id)} className="p-1.5 hover:bg-slate-800 rounded-lg text-red-400"><Archive className="w-3.5 h-3.5" /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-end z-50">
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
                            className="bg-slate-900 w-full max-w-lg h-full overflow-y-auto border-l border-slate-800">
                            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-5 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-white">{editing ? 'Edit Member' : 'Add Member'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-5 space-y-4">
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label><input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Role / Title</label><input value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls} placeholder="e.g. President" /></div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Designation</label><input value={form.designation || ''} onChange={e => setForm({ ...form, designation: e.target.value })} className={inputCls} placeholder="e.g. B.Sc CS 3rd Year" /></div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Department Group</label>
                                    <select value={form.dept_group || ''} onChange={e => setForm({ ...form, dept_group: e.target.value })} className={inputCls}>
                                        <option value="">Select...</option>{groups.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Photo</label>
                                    {form.photo_url ? (
                                        <div className="flex items-start gap-4">
                                            <div className="relative group/photo flex-shrink-0">
                                                <img src={form.photo_url} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-slate-700"
                                                    style={{ objectPosition: `center ${(form as any).photo_position || 'center'}` }} />
                                                <button type="button" onClick={() => setForm({ ...form, photo_url: '' })}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white opacity-0 group-hover/photo:opacity-100 transition-opacity shadow-lg">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-500 mb-2">Adjust photo position</p>
                                                <div className="flex gap-1.5">
                                                    {([
                                                        { value: 'top', label: '⬆ Top' },
                                                        { value: 'center', label: '⬛ Center' },
                                                        { value: 'bottom', label: '⬇ Bottom' },
                                                    ] as const).map(opt => (
                                                        <button key={opt.value} type="button"
                                                            onClick={() => setForm({ ...form, photo_position: opt.value } as any)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${((form as any).photo_position || 'center') === opt.value
                                                                ? 'bg-teal-600 text-white shadow-md'
                                                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                                                }`}>
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                                    className="mt-2 text-xs text-teal-400 hover:text-teal-300 transition-colors">
                                                    Replace photo
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDrop={handleDrop}
                                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragOver ? 'border-teal-400 bg-teal-900/20' : 'border-slate-700 hover:border-slate-500 bg-slate-950'
                                                } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                                        >
                                            {uploading ? (
                                                <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-slate-500" />
                                            )}
                                            <p className="text-sm text-slate-400">{uploading ? 'Uploading...' : 'Click or drag image here'}</p>
                                            <p className="text-xs text-slate-600">PNG, JPG, WEBP — Max 5MB</p>
                                        </div>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ''; }} />
                                </div>

                                <div className="border-t border-slate-800 pt-4 mt-4">
                                    <h3 className="text-sm font-semibold text-teal-400 mb-3">📋 Profile Details</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label><input type="email" value={(form as any).email || ''} onChange={e => setForm({ ...form, email: e.target.value } as any)} className={inputCls} placeholder="member@email.com" /></div>
                                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label><input value={(form as any).phone || ''} onChange={e => setForm({ ...form, phone: e.target.value } as any)} className={inputCls} placeholder="+91 98765 43210" /></div>
                                </div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Year & Branch</label><input value={(form as any).year_branch || ''} onChange={e => setForm({ ...form, year_branch: e.target.value } as any)} className={inputCls} placeholder="3rd Year CSE" /></div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Joined JBLC</label><input value={(form as any).join_date || ''} onChange={e => setForm({ ...form, join_date: e.target.value } as any)} className={inputCls} placeholder="September 2024" /></div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Personal Motto / Quote</label><input value={(form as any).motto || ''} onChange={e => setForm({ ...form, motto: e.target.value } as any)} className={inputCls} placeholder="Words that define you..." /></div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label><textarea value={(form as any).bio || ''} onChange={e => setForm({ ...form, bio: e.target.value } as any)} className={inputCls + ' min-h-[80px]'} placeholder="Short bio about this member..." /></div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Skills & Interests (comma-separated)</label><input value={(form as any).skills || ''} onChange={e => setForm({ ...form, skills: e.target.value } as any)} className={inputCls} placeholder="Debate, Public Speaking, Content Writing" /></div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Contributions at JBLC (one per line)</label><textarea value={(form as any).contributions || ''} onChange={e => setForm({ ...form, contributions: e.target.value } as any)} className={inputCls + ' min-h-[80px]'} placeholder="Organized Wanna Be Tharoor 2025&#10;Led the social media campaign&#10;Mentored 10 new members" /></div>

                                <div className="border-t border-slate-800 pt-4 mt-4">
                                    <h3 className="text-sm font-semibold text-teal-400 mb-3">🔗 Social Links</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Instagram URL</label><input value={form.instagram_url || ''} onChange={e => setForm({ ...form, instagram_url: e.target.value })} className={inputCls} placeholder="https://instagram.com/username" /></div>
                                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Instagram Handle</label><input value={(form as any).instagram_handle || ''} onChange={e => setForm({ ...form, instagram_handle: e.target.value } as any)} className={inputCls} placeholder="@chiruu.rose" /></div>
                                </div>

                                <div className="border-t border-slate-800 pt-4 mt-4">
                                    <h3 className="text-sm font-semibold text-teal-400 mb-3">⚙️ Settings</h3>
                                </div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Display Order</label><input type="number" value={form.display_order ?? 0} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) })} className={inputCls} /></div>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-slate-300">Active</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={(form as any).is_founder ?? false} onChange={e => setForm({ ...form, is_founder: e.target.checked } as any)} className="w-4 h-4 rounded" /><span className="text-sm text-slate-300">⭐ Founder / Lead (special profile card on About page)</span></label>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:text-white">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm shadow-2xl z-50">{toast}</motion.div>)}</AnimatePresence>
        </div >
    );
}
