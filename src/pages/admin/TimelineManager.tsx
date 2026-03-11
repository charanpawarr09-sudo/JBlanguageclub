import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Save, X, Loader2, Link as LinkIcon } from 'lucide-react';

interface TimelineItem {
    id?: number;
    day_label: string;
    day_color: string;
    time: string;
    title: string;
    description: string;
    icon: string;
    event_link: string;
    display_order: number;
    is_active: boolean;
}

interface EventOption {
    id: string;
    title: string;
}

const emptyItem: TimelineItem = { day_label: 'March 16', day_color: 'teal', time: '', title: '', description: '', icon: 'Calendar', event_link: '', display_order: 0, is_active: true };

const colorOptions = ['teal', 'amber', 'violet'];
const iconOptions = ['Calendar', 'Mic', 'BookOpen', 'Trophy', 'Search', 'PenTool'];

export default function TimelineManager() {
    const [items, setItems] = useState<TimelineItem[]>([]);
    const [events, setEvents] = useState<EventOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<TimelineItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [timelineRes, eventsRes] = await Promise.all([
                fetch('/api/admin/timeline', { credentials: 'include' }),
                fetch('/api/events'),
            ]);
            const timelineData = await timelineRes.json();
            const eventsData = await eventsRes.json();
            setItems(Array.isArray(timelineData) ? timelineData : []);
            setEvents(Array.isArray(eventsData) ? eventsData.map((e: any) => ({ id: e.id, title: e.title })) : []);
        } catch { showToast('Failed to load timeline'); }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSave = async () => {
        if (!editing || !editing.title.trim() || !editing.time.trim()) return;
        setSaving(true);
        try {
            const isNew = !editing.id;
            const url = isNew ? '/api/admin/timeline' : `/api/admin/timeline/${editing.id}`;
            const method = isNew ? 'POST' : 'PUT';
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editing),
            });
            setEditing(null);
            await fetchAll();
        } catch { showToast('Failed to save timeline event'); }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this timeline event?')) return;
        try {
            await fetch(`/api/admin/timeline/${id}`, { method: 'DELETE', credentials: 'include' });
            await fetchAll();
            showToast('Timeline event deleted');
        } catch { showToast('Failed to delete timeline event'); }
    };

    const inputCls = 'w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm';
    const selectCls = inputCls + ' appearance-none';

    // Group by day for display
    const grouped: Record<string, TimelineItem[]> = items.reduce((acc, item) => {
        if (!acc[item.day_label]) acc[item.day_label] = [];
        acc[item.day_label].push(item);
        return acc;
    }, {} as Record<string, TimelineItem[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Timeline</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage the 3-day event schedule shown on the homepage</p>
                </div>
                <button onClick={() => setEditing({ ...emptyItem })} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> Add Timeline Event
                </button>
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">{editing.id ? 'Edit' : 'New'} Timeline Event</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Day (Date Label)</label>
                            <input value={editing.day_label} onChange={e => setEditing({ ...editing, day_label: e.target.value })} className={inputCls} placeholder="March 16" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Color</label>
                            <select value={editing.day_color} onChange={e => setEditing({ ...editing, day_color: e.target.value })} className={selectCls}>
                                {colorOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Time</label>
                            <input value={editing.time} onChange={e => setEditing({ ...editing, time: e.target.value })} className={inputCls} placeholder="10:00 AM" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className={inputCls} placeholder="Event title" />
                        <input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} className={inputCls} placeholder="Short description" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Icon</label>
                            <select value={editing.icon} onChange={e => setEditing({ ...editing, icon: e.target.value })} className={selectCls}>
                                {iconOptions.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Link to Event</label>
                            <select value={editing.event_link || ''} onChange={e => setEditing({ ...editing, event_link: e.target.value })} className={selectCls}>
                                <option value="">No link</option>
                                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Order</label>
                            <input type="number" value={editing.display_order} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="0" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-300 self-end pb-2">
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

            {/* List grouped by day */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No timeline events yet. Add events to build the schedule!</div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([dayLabel, dayItems]) => (
                        <div key={dayLabel}>
                            <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">{dayLabel}</h3>
                            <div className="space-y-2">
                                {dayItems.map(item => (
                                    <div key={item.id} className={`flex items-center gap-4 p-3 rounded-xl border ${item.is_active ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-950 border-slate-800/50 opacity-60'}`}>
                                        <div className={`px-2 py-1 rounded text-xs font-mono text-slate-400 bg-slate-800`}>{item.time}</div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-white text-sm font-medium">{item.title}</span>
                                            {item.description && <span className="text-slate-500 text-sm ml-2">— {item.description}</span>}
                                        </div>
                                        {item.event_link && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-teal-900/30 text-teal-400 text-xs">
                                                <LinkIcon className="w-3 h-3" /> {item.event_link}
                                            </div>
                                        )}
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button onClick={() => setEditing({ ...item })} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-teal-400"><Pencil className="w-3.5 h-3.5" /></button>
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
