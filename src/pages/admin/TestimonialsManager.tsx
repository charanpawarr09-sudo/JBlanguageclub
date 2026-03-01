import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';

interface Testimonial {
    id?: number;
    quote: string;
    name: string;
    college: string;
    emoji: string;
    display_order: number;
    is_active: boolean;
}

const emptyTestimonial: Testimonial = { quote: '', name: '', college: '', emoji: '⭐', display_order: 0, is_active: true };

export default function TestimonialsManager() {
    const [items, setItems] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Testimonial | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/testimonials', { credentials: 'include' });
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch { showToast('Failed to load testimonials'); }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSave = async () => {
        if (!editing || !editing.quote.trim() || !editing.name.trim()) return;
        setSaving(true);
        try {
            const isNew = !editing.id;
            const url = isNew ? '/api/admin/testimonials' : `/api/admin/testimonials/${editing.id}`;
            const method = isNew ? 'POST' : 'PUT';
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editing),
            });
            setEditing(null);
            await fetchAll();
        } catch { showToast('Failed to save testimonial'); }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this testimonial?')) return;
        try {
            await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE', credentials: 'include' });
            await fetchAll();
            showToast('Testimonial deleted');
        } catch { showToast('Failed to delete testimonial'); }
    };

    const inputCls = 'w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Testimonials</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage what people say about VOXERA</p>
                </div>
                <button onClick={() => setEditing({ ...emptyTestimonial })} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> Add Testimonial
                </button>
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">{editing.id ? 'Edit' : 'New'} Testimonial</h3>
                    <textarea value={editing.quote} onChange={e => setEditing({ ...editing, quote: e.target.value })} className={inputCls + ' min-h-[80px]'} placeholder="Quote text..." />
                    <div className="grid grid-cols-3 gap-4">
                        <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputCls} placeholder="Name" />
                        <input value={editing.college} onChange={e => setEditing({ ...editing, college: e.target.value })} className={inputCls} placeholder="College, Dept Year" />
                        <input value={editing.emoji} onChange={e => setEditing({ ...editing, emoji: e.target.value })} className={inputCls} placeholder="Emoji (e.g. ✨)" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" value={editing.display_order} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="Display order" />
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} className="rounded border-slate-600" />
                            Active
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                        </button>
                        <button onClick={() => setEditing(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg">
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No testimonials yet. Add one to get started!</div>
            ) : (
                <div className="space-y-3">
                    {items.map(t => (
                        <div key={t.id} className={`flex items-start gap-4 p-4 rounded-xl border ${t.is_active ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-950 border-slate-800/50 opacity-60'}`}>
                            <div className="text-2xl">{t.emoji || '⭐'}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-slate-300 text-sm italic line-clamp-2">"{t.quote}"</p>
                                <p className="text-white text-sm font-medium mt-1">{t.name} <span className="text-slate-500 font-normal">· {t.college}</span></p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => setEditing({ ...t })} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-teal-400"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => t.id && handleDelete(t.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm shadow-2xl z-50">{toast}</motion.div>)}</AnimatePresence>
        </div>
    );
}
