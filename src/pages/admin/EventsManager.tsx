import { useState, useEffect, FormEvent, useRef, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save, Copy, GripVertical, Users, Upload, Link2, Loader2, ImageIcon } from 'lucide-react';

/** Parse int with NaN guard — returns fallback when input is empty/invalid */
const safeInt = (val: string, fallback: number): number => {
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? fallback : n;
};

interface EventData {
    id: string; title: string; description: string; short_description?: string;
    date: string; time?: string; location?: string; category?: string;
    image?: string; banner_image?: string; thumbnail_image?: string;
    rules?: string[]; team_size?: string; prize?: string;
    rounds?: Array<{ title: string; description: string }>;
    registration_fee_single: number; registration_fee_team?: number | null;
    team_size_min: number; team_size_max: number;
    registration_enabled: boolean; is_published: boolean; is_archived?: boolean;
    google_form_url?: string; slots_total?: number | null; slots_filled: number;
    judging_criteria?: string[]; coordinators?: Array<{ name: string; phone: string; role: string }>;
    display_order: number;
}

type ParticipationType = 'single' | 'team' | 'both';

function getParticipationType(form: Partial<EventData>): ParticipationType {
    const min = form.team_size_min ?? 1;
    const max = form.team_size_max ?? 1;
    if (min === 1 && max === 1) return 'single';
    if (min > 1) return 'team';
    return 'both';
}

/* ─── Image Upload Field ─── */
function ImageUploadField({ label, value, onChange, type }: { label: string; value: string; onChange: (url: string) => void; type: 'banner' | 'thumbnail' }) {
    const [mode, setMode] = useState<'upload' | 'url'>(value?.startsWith('/uploads') || !value ? 'upload' : 'url');
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const dimensions = type === 'banner' ? '1600 × 900' : '800 × 530';

    const doUpload = useCallback(async (file: File) => {
        setUploading(true);
        try {
            const form = new FormData();
            form.append('image', file);
            form.append('type', type);
            const res = await fetch('/api/admin/upload-event-image', { method: 'POST', credentials: 'include', body: form });
            if (!res.ok) { const d = await res.json(); alert(d.error || 'Upload failed'); return; }
            const data = await res.json();
            onChange(data.url);
        } catch { alert('Upload failed — check connection'); }
        finally { setUploading(false); }
    }, [type, onChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) doUpload(file);
    }, [doUpload]);

    return (
        <div className="col-span-2">
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-300">{label}</label>
                <div className="flex bg-slate-800 rounded-lg p-0.5">
                    <button type="button" onClick={() => setMode('upload')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'upload' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                        <Upload className="w-3 h-3" /> Upload
                    </button>
                    <button type="button" onClick={() => setMode('url')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'url' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                        <Link2 className="w-3 h-3" /> URL
                    </button>
                </div>
            </div>

            {mode === 'upload' ? (
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Upload ${type} image. Drop an image here or press Enter to browse.`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileRef.current?.click()}
                    onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) { e.preventDefault(); fileRef.current?.click(); } }}
                    className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${dragOver ? 'border-teal-400 bg-teal-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'}`}
                >
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); e.target.value = ''; }} />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                            <span className="text-sm text-teal-300">Resizing to {dimensions}...</span>
                        </div>
                    ) : value ? (
                        <div className="flex items-center gap-3">
                            <img src={value} alt="Preview" className="w-20 h-14 object-cover rounded-lg border border-slate-700" />
                            <div className="flex-1 text-left">
                                <p className="text-sm text-white font-medium truncate">{value.split('/').pop()}</p>
                                <p className="text-xs text-slate-500">Auto-resized to {dimensions}px · Click to replace</p>
                            </div>
                            <button type="button" aria-label="Remove image" onClick={e => { e.stopPropagation(); onChange(''); }} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-2">
                            <ImageIcon className="w-8 h-8 text-slate-600" />
                            <p className="text-sm text-slate-400">Drop an image here or <span className="text-teal-400 font-medium">click to browse</span></p>
                            <p className="text-xs text-slate-600">Auto-resized to {dimensions}px · WebP · Max 5MB</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex gap-2">
                    <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={`Paste ${type} image URL...`}
                        className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-sm" />
                    {value && <img src={value} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-700 flex-shrink-0" />}
                </div>
            )}
        </div>
    );
}

export default function EventsManager() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<EventData | null>(null);
    const [form, setForm] = useState<Partial<EventData>>({});
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [toast, setToast] = useState('');
    const [participationType, setParticipationType] = useState<ParticipationType>('single');

    const categories = ['Literary', 'Cultural', 'Informal', 'Management', 'Technical', 'Gaming', 'Workshop', 'Ceremony'];

    useEffect(() => { fetchEvents(); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/events?_t=${Date.now()}`, { credentials: 'include', headers: { 'Cache-Control': 'no-cache' } });
            const data = await res.json();
            setEvents(data.filter((e: EventData) => !e.is_archived));
        } catch { showToast('Failed to fetch events'); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const method = editing ? 'PUT' : 'POST';
            const url = editing ? `/api/admin/events/${editing.id}` : '/api/admin/events';
            // Strip non-editable fields that cause timestamp serialization errors
            const { created_at, updated_at, slots_filled, ...editableFields } = form as Record<string, unknown>;
            const body = {
                ...editableFields,
                id: editing ? editing.id : form.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                rules: typeof form.rules === 'string' ? (form.rules as unknown as string).split('\n').filter(Boolean) : form.rules,
                judging_criteria: typeof form.judging_criteria === 'string' ? (form.judging_criteria as unknown as string).split('\n').filter(Boolean) : form.judging_criteria,
            };
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            if (res.ok) { setIsModalOpen(false); fetchEvents(); showToast(editing ? 'Event updated!' : 'Event created!'); }
            else { const d = await res.json(); showToast(d.error || 'Failed to save'); }
        } catch { showToast('Failed to save event'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this event? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) { const d = await res.json(); showToast(d.error || 'Failed to archive event'); return; }
            fetchEvents(); showToast('Event deleted');
        } catch { showToast('Failed to delete event'); }
    };

    const toggleStatus = async (event: EventData, field: 'is_published' | 'registration_enabled') => {
        try {
            const res = await fetch(`/api/admin/events/${event.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({ [field]: !event[field] })
            });
            if (!res.ok) { const d = await res.json(); showToast(d.error || 'Failed to update'); return; }
            fetchEvents();
        } catch { showToast('Failed to update event'); }
    };

    const duplicateEvent = async (event: EventData) => {
        const newEvent: Record<string, unknown> = { ...event, id: undefined, title: `${event.title} (Copy)`, is_published: false };
        await fetch('/api/admin/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(newEvent) });
        fetchEvents(); showToast('Event duplicated as draft');
    };

    const filtered = events.filter(e => {
        const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'all' || e.category === filterCategory;
        return matchSearch && matchCat;
    });

    const openEdit = (event: EventData) => {
        setEditing(event);
        setForm(event);
        setParticipationType(getParticipationType(event));
        setIsModalOpen(true);
    };
    const openCreate = () => {
        setEditing(null);
        setForm({ registration_enabled: true, is_published: false, team_size_min: 1, team_size_max: 1, display_order: 0, registration_fee_single: 0 });
        setParticipationType('single');
        setIsModalOpen(true);
    };

    const handleParticipationChange = (type: ParticipationType) => {
        setParticipationType(type);
        if (type === 'single') {
            setForm(f => ({ ...f, team_size_min: 1, team_size_max: 1, registration_fee_team: null }));
        } else if (type === 'team') {
            setForm(f => ({ ...f, team_size_min: f.team_size_min && f.team_size_min > 1 ? f.team_size_min : 2, team_size_max: f.team_size_max && f.team_size_max > 1 ? f.team_size_max : 4 }));
        } else {
            // both
            setForm(f => ({ ...f, team_size_min: 1, team_size_max: f.team_size_max && f.team_size_max > 1 ? f.team_size_max : 4 }));
        }
    };

    const inputCls = 'w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all';
    const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5';

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Events Management</h2>
                    <p className="text-slate-400 text-sm mt-1">{events.length} events · {events.filter(e => e.is_published).length} published</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-teal-500 hover:to-emerald-600 transition-all shadow-lg shadow-teal-900/30">
                    <Plus className="w-4 h-4" /> Add Event
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none" />
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setFilterCategory('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>All</button>
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilterCategory(c)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === c ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{c}</button>
                    ))}
                </div>
            </div>

            {/* Events List */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <p className="text-lg font-medium">No events found</p>
                    <p className="text-sm mt-1">Create your first event to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(event => (
                        <motion.div key={event.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800/50 rounded-xl border border-slate-800 transition-colors group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <GripVertical className="w-4 h-4 text-slate-600 hidden lg:block" />
                                {(event.thumbnail_image || event.image) && <img src={event.thumbnail_image || event.image} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />}
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-white truncate">{event.title}</h3>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${event.is_published ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                                            {event.is_published ? 'Published' : 'Draft'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${event.registration_enabled ? 'bg-blue-900/30 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {event.registration_enabled ? 'Reg Open' : 'Reg Closed'}
                                        </span>
                                        {event.category && <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">{event.category}</span>}
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-900/30 text-purple-400">
                                            {event.team_size_min === 1 && event.team_size_max === 1 ? 'Solo' : event.team_size_min > 1 ? 'Team' : 'Solo/Team'}
                                        </span>
                                        {event.slots_total && (
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-900/30 text-amber-400">
                                                <Users className="w-3 h-3 inline mr-1" />{event.slots_filled}/{event.slots_total}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => toggleStatus(event, 'is_published')} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400" title="Toggle Publish">
                                    {event.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => duplicateEvent(event)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400" title="Duplicate"><Copy className="w-4 h-4" /></button>
                                <button onClick={() => openEdit(event)} className="p-2 hover:bg-slate-700 rounded-lg text-blue-400" title="Edit"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(event.id)} className="p-2 hover:bg-slate-700 rounded-lg text-red-400" title="Archive"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Event Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-end z-50">
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
                            className="bg-slate-900 w-full max-w-2xl h-full overflow-y-auto border-l border-slate-800 shadow-2xl">
                            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-5 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-white">{editing ? 'Edit Event' : 'Create Event'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-5 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2"><label className={labelCls}>Title *</label><input required type="text" maxLength={80} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} /></div>
                                    <div><label className={labelCls}>Category</label>
                                        <select value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                                            <option value="">Select...</option>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div><label className={labelCls}>Venue</label><input type="text" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls} /></div>
                                </div>
                                <div><label className={labelCls}>Short Description</label><input type="text" maxLength={160} value={form.short_description || ''} onChange={e => setForm({ ...form, short_description: e.target.value })} className={inputCls} /></div>
                                <div><label className={labelCls}>Full Description</label><textarea rows={4} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelCls}>Date</label><input type="text" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} placeholder="e.g. March 15, 2026" /></div>
                                    <div><label className={labelCls}>Time</label><input type="text" value={form.time || ''} onChange={e => setForm({ ...form, time: e.target.value })} className={inputCls} placeholder="e.g. 10:00 AM" /></div>
                                </div>

                                {/* ─── Image Upload Fields ─── */}
                                <div className="grid grid-cols-2 gap-4">
                                    <ImageUploadField label="Banner Image (Event Detail Hero)" value={form.banner_image || ''} onChange={url => setForm({ ...form, banner_image: url })} type="banner" />
                                    <ImageUploadField label="Thumbnail Image (Event Card)" value={form.thumbnail_image || ''} onChange={url => setForm({ ...form, thumbnail_image: url })} type="thumbnail" />
                                </div>

                                {/* ─── Participation Type ─── */}
                                <fieldset>
                                    <legend className={labelCls}>Participation Type</legend>
                                    <div className="flex gap-2" role="radiogroup" aria-label="Participation type">
                                        {([
                                            { value: 'single' as ParticipationType, label: 'Solo Only', desc: 'Individual participation' },
                                            { value: 'team' as ParticipationType, label: 'Team Only', desc: 'Team required' },
                                            { value: 'both' as ParticipationType, label: 'Solo + Team', desc: 'Either allowed' },
                                        ] as const).map(opt => (
                                            <button key={opt.value} type="button" role="radio" aria-checked={participationType === opt.value} onClick={() => handleParticipationChange(opt.value)}
                                                className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${participationType === opt.value
                                                    ? 'border-teal-500 bg-teal-500/10'
                                                    : 'border-slate-700 bg-slate-950 hover:border-slate-600'}`}>
                                                <p className={`text-sm font-semibold ${participationType === opt.value ? 'text-teal-300' : 'text-slate-300'}`}>{opt.label}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>

                                {/* Fees & Team config */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelCls}>Solo Fee (₹)</label><input type="number" min={0} value={form.registration_fee_single ?? 0} onChange={e => setForm({ ...form, registration_fee_single: safeInt(e.target.value, 0) })} className={inputCls} /></div>
                                    {participationType !== 'single' && (
                                        <div><label className={labelCls}>Team Fee (₹)</label><input type="number" min={0} value={form.registration_fee_team ?? ''} onChange={e => setForm({ ...form, registration_fee_team: e.target.value ? safeInt(e.target.value, 0) : null })} className={inputCls} placeholder="N/A" /></div>
                                    )}
                                    <div><label className={labelCls}>Total Slots</label><input type="number" min={0} value={form.slots_total ?? ''} onChange={e => setForm({ ...form, slots_total: e.target.value ? safeInt(e.target.value, 0) : null })} className={inputCls} placeholder="Unlimited" /></div>
                                </div>
                                {participationType !== 'single' && (
                                    <div className="grid grid-cols-3 gap-4">
                                        {participationType === 'team' && (
                                            <div><label className={labelCls}>Min Team Size</label><input type="number" min={2} value={form.team_size_min ?? 2} onChange={e => setForm({ ...form, team_size_min: safeInt(e.target.value, 2) })} className={inputCls} /></div>
                                        )}
                                        <div><label className={labelCls}>Max Team Size</label><input type="number" min={2} value={form.team_size_max ?? 4} onChange={e => setForm({ ...form, team_size_max: safeInt(e.target.value, 4) })} className={inputCls} /></div>
                                        <div><label className={labelCls}>Display Order</label><input type="number" value={form.display_order ?? 0} onChange={e => setForm({ ...form, display_order: safeInt(e.target.value, 0) })} className={inputCls} /></div>
                                    </div>
                                )}
                                {participationType === 'single' && (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div><label className={labelCls}>Display Order</label><input type="number" value={form.display_order ?? 0} onChange={e => setForm({ ...form, display_order: safeInt(e.target.value, 0) })} className={inputCls} /></div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelCls}>Prize</label><input type="text" maxLength={64} value={(form as Record<string, unknown>).prize as string || ''} onChange={e => setForm({ ...form, prize: e.target.value } as typeof form)} className={inputCls} placeholder="e.g. Exciting Gifts + Certificate" /></div>
                                    <div><label className={labelCls}>Google Form URL</label><input type="url" value={form.google_form_url || ''} onChange={e => setForm({ ...form, google_form_url: e.target.value })} className={inputCls} /></div>
                                </div>
                                <div><label className={labelCls}>Rules (one per line)</label><textarea rows={3} value={Array.isArray(form.rules) ? form.rules.join('\n') : (form.rules || '')} onChange={e => setForm({ ...form, rules: e.target.value.split('\n') })} className={inputCls} /></div>
                                <div><label className={labelCls}>Judging Criteria (one per line)</label><textarea rows={3} value={Array.isArray(form.judging_criteria) ? form.judging_criteria.join('\n') : (form.judging_criteria || '')} onChange={e => setForm({ ...form, judging_criteria: e.target.value.split('\n') })} className={inputCls} /></div>
                                <div><label className={labelCls}>Coordinators (JSON)</label><textarea rows={3} value={(() => { try { return JSON.stringify(form.coordinators || [], null, 2); } catch { return '[]'; } })()} onChange={e => { try { setForm({ ...form, coordinators: JSON.parse(e.target.value) }); } catch { } }} className={inputCls} placeholder={'[{"name":"Name","role":"Role","phone":"+91 XXXXX"}]'} /></div>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_published || false} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500" /><span className="text-sm text-slate-300">Published</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.registration_enabled ?? true} onChange={e => setForm({ ...form, registration_enabled: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500" /><span className="text-sm text-slate-300">Registration Open</span></label>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-teal-500 hover:to-emerald-600 transition-all flex items-center gap-2"><Save className="w-4 h-4" /> Save Event</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm shadow-2xl z-50">{toast}</motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

