import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Save, X, Loader2, Calendar, Image } from 'lucide-react';

interface PastEvent {
    id?: number;
    name: string;
    date: string;
    year: string;
    description: string;
    winner_info: string;
    photos: string[];
    highlights: string;
    participants_count: number | null;
    display_order: number;
    is_active: boolean;
}

const emptyEvent: PastEvent = {
    name: '', date: '', year: new Date().getFullYear().toString(), description: '', winner_info: '',
    photos: [], highlights: '', participants_count: null, display_order: 0, is_active: true,
};

export default function PastEventsManager() {
    const [items, setItems] = useState<PastEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<PastEvent | null>(null);
    const [saving, setSaving] = useState(false);
    const [photoInput, setPhotoInput] = useState('');
    const [toast, setToast] = useState('');
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/past-events', { credentials: 'include' });
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch { showToast('Failed to load past events'); }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSave = async () => {
        if (!editing || !editing.name.trim() || !editing.date.trim()) return;
        setSaving(true);
        try {
            const isNew = !editing.id;
            const url = isNew ? '/api/admin/past-events' : `/api/admin/past-events/${editing.id}`;
            await fetch(url, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editing),
            });
            setEditing(null);
            await fetchAll();
        } catch { showToast('Failed to save past event'); }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this past event?')) return;
        try {
            await fetch(`/api/admin/past-events/${id}`, { method: 'DELETE', credentials: 'include' });
            await fetchAll();
            showToast('Past event deleted');
        } catch { showToast('Failed to delete past event'); }
    };

    const addPhoto = () => {
        if (!photoInput.trim() || !editing) return;
        setEditing({ ...editing, photos: [...(editing.photos || []), photoInput.trim()] });
        setPhotoInput('');
    };

    const removePhoto = (i: number) => {
        if (!editing) return;
        setEditing({ ...editing, photos: editing.photos.filter((_, idx) => idx !== i) });
    };

    const inputCls = 'w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm';

    const grouped: Record<string, PastEvent[]> = items.reduce((acc, item) => {
        if (!acc[item.year]) acc[item.year] = [];
        acc[item.year].push(item);
        return acc;
    }, {} as Record<string, PastEvent[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Past Events</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage past events with descriptions, photos, and winners</p>
                </div>
                <button onClick={() => setEditing({ ...emptyEvent })} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> Add Past Event
                </button>
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">{editing.id ? 'Edit' : 'New'} Past Event</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputCls} placeholder="Event name" />
                        <input value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} className={inputCls} placeholder="12 September 2025" />
                        <input value={editing.year} onChange={e => setEditing({ ...editing, year: e.target.value })} className={inputCls} placeholder="2025" />
                    </div>
                    <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} className={inputCls + ' min-h-[80px]'} placeholder="Description — tell the story of this event..." />
                    <textarea value={editing.winner_info} onChange={e => setEditing({ ...editing, winner_info: e.target.value })} className={inputCls + ' min-h-[60px]'} placeholder="Winners (one per line)&#10;1st Place — John Doe&#10;2nd Place — Jane Doe" />
                    <textarea value={editing.highlights} onChange={e => setEditing({ ...editing, highlights: e.target.value })} className={inputCls + ' min-h-[60px]'} placeholder="Highlights (one per line)&#10;Over 100 participants&#10;Special judges from IIT" />

                    {/* Photos */}
                    <div>
                        <label className="block text-xs text-slate-400 mb-2 flex items-center gap-1"><Image className="w-3 h-3" /> Photos (paste URLs)</label>
                        <div className="flex gap-2 mb-2">
                            <input value={photoInput} onChange={e => setPhotoInput(e.target.value)} className={inputCls} placeholder="https://example.com/photo.jpg" onKeyDown={e => e.key === 'Enter' && addPhoto()} />
                            <button onClick={addPhoto} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg whitespace-nowrap">+ Add</button>
                        </div>
                        {editing.photos && editing.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {editing.photos.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
                                        <button onClick={() => removePhoto(i)} className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <input type="number" value={editing.participants_count ?? ''} onChange={e => setEditing({ ...editing, participants_count: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} placeholder="Participants count" />
                        <input type="number" value={editing.display_order} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="Order" />
                        <label className="flex items-center gap-2 text-sm text-slate-300 self-center">
                            <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} className="rounded border-slate-600" />
                            Active
                        </label>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                        </button>
                        <button onClick={() => setEditing(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg">
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* List grouped by year */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-amber-500 animate-spin" /></div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No past events yet. Add events to build the journey!</div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([year, yearItems]) => (
                        <div key={year}>
                            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {year}</h3>
                            <div className="space-y-2">
                                {yearItems.map(item => (
                                    <div key={item.id} className={`flex items-center gap-4 p-3 rounded-xl border ${item.is_active ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-950 border-slate-800/50 opacity-60'}`}>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-white text-sm font-medium">{item.name}</span>
                                            <span className="text-slate-500 text-sm ml-2">— {item.date}</span>
                                        </div>
                                        {item.photos && item.photos.length > 0 && (
                                            <span className="text-xs text-slate-500 flex items-center gap-1"><Image className="w-3 h-3" /> {item.photos.length}</span>
                                        )}
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button onClick={() => setEditing({ ...item, photos: item.photos || [] })} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => item.id && handleDelete(item.id)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm shadow-2xl z-50">{toast}</motion.div>)}</AnimatePresence>
        </div>
    );
}

