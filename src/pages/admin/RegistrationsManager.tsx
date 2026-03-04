import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Search, CheckCircle, XCircle, Clock, Filter, ChevronLeft, ChevronRight, Eye, UserCheck, Mail, Send, X } from 'lucide-react';

interface Registration {
    id: number; registration_code: string; event_id: string;
    primary_name: string; primary_email: string; primary_phone?: string;
    college_name?: string; department?: string; year_of_study?: string; roll_number?: string;
    team_size: number; team_members?: Array<{ name: string; email: string }>;
    fee_amount: number; status: string; payment_status: string;
    attended_at?: string; created_at: string;
}

export default function RegistrationsManager() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterEvent, setFilterEvent] = useState('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [selected, setSelected] = useState<number[]>([]);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [toast, setToast] = useState('');
    // Email blast state
    const [showEmailBlast, setShowEmailBlast] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [emailEventFilter, setEmailEventFilter] = useState('');
    const [emailStatusFilter, setEmailStatusFilter] = useState('');
    const [emailSending, setEmailSending] = useState(false);

    useEffect(() => { fetchData(); }, []);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [regRes, evtRes] = await Promise.all([
                fetch('/api/admin/registrations', { credentials: 'include' }),
                fetch('/api/events', { credentials: 'include' })
            ]);
            setRegistrations(await regRes.json());
            setEvents(await evtRes.json());
        } catch { showToast('Failed to fetch data'); }
        finally { setLoading(false); }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            const res = await fetch(`/api/admin/registrations/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status }) });
            if (!res.ok) { const d = await res.json(); showToast(d.error || 'Failed to update status'); return; }
            fetchData(); showToast(`Registration ${status}`);
        } catch { showToast('Failed to update status'); }
    };

    const bulkConfirm = async () => {
        if (!selected.length) return;
        try {
            const res = await fetch('/api/admin/registrations/bulk-confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ids: selected }) });
            if (!res.ok) { const d = await res.json(); showToast(d.error || 'Failed to bulk confirm'); return; }
            setSelected([]); fetchData(); showToast(`${selected.length} registrations confirmed`);
        } catch { showToast('Failed to bulk confirm'); }
    };

    const exportCSV = () => {
        const headers = ['VX Code', 'Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Roll No', 'Event', 'Team Size', 'Fee (₹)', 'Status', 'Date'];
        const rows = filtered.map(r => [
            r.registration_code, `"${r.primary_name}"`, r.primary_email, r.primary_phone || '',
            `"${r.college_name || ''}"`, r.department || '', r.year_of_study || '', r.roll_number || '',
            `"${events.find(e => e.id === r.event_id)?.title || r.event_id}"`,
            r.team_size, (r.fee_amount / 100).toFixed(2), r.status, new Date(r.created_at).toLocaleDateString()
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `voxera_registrations_${new Date().toISOString().split('T')[0]}.csv`; a.click();
        showToast('CSV exported');
    };

    const sendEmailBlast = async () => {
        if (!emailSubject.trim() || !emailBody.trim()) { showToast('Subject and body are required'); return; }
        setEmailSending(true);
        try {
            const res = await fetch('/api/admin/email-blast', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({
                    subject: emailSubject,
                    html_body: `<div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0F172A;color:#F8FAFC;padding:40px 30px;border-radius:16px;">${emailBody}</div>`,
                    event_id: emailEventFilter || undefined,
                    status_filter: emailStatusFilter || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showToast(`✅ ${data.message}`);
            setShowEmailBlast(false); setEmailSubject(''); setEmailBody('');
        } catch (err: any) {
            showToast(`❌ ${err.message || 'Failed to send emails'}`);
        } finally { setEmailSending(false); }
    };

    const filtered = registrations.filter(r => {
        const matchSearch = !search || [r.primary_name, r.primary_email, r.registration_code, r.college_name].some(f => f?.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchEvent = filterEvent === 'all' || r.event_id === filterEvent;
        return matchSearch && matchStatus && matchEvent;
    });

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    const total = registrations.length;
    const confirmed = registrations.filter(r => r.status === 'confirmed').length;
    const pending = registrations.filter(r => r.status === 'pending').length;
    const cancelled = registrations.filter(r => r.status === 'cancelled').length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = registrations.filter(r => r.created_at && new Date(r.created_at) >= today).length;

    const statusBadge = (s: string) => {
        const cls = s === 'confirmed' ? 'bg-emerald-900/40 text-emerald-400' : s === 'cancelled' ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400';
        return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{s}</span>;
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Registrations</h2>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                    { label: 'Total', value: total, sub: `${todayCount} today`, color: 'violet' },
                    { label: 'Confirmed', value: confirmed, color: 'emerald' },
                    { label: 'Pending', value: pending, color: 'amber' },
                    { label: 'Cancelled', value: cancelled, color: 'red' },
                    { label: 'Revenue', value: `₹${(registrations.filter(r => r.status === 'confirmed').reduce((s, r) => s + r.fee_amount, 0) / 100).toLocaleString()}`, color: 'blue' },
                ].map(stat => (
                    <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-xs font-medium uppercase">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        {'sub' in stat && stat.sub && <p className="text-slate-500 text-xs mt-0.5">{stat.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Search, Filters & Actions */}
            <div className="flex flex-col lg:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder="Search name, email, VX code, college..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
                        <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterStatus === s ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                    ))}
                </div>
                <select value={filterEvent} onChange={e => { setFilterEvent(e.target.value); setPage(1); }} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm">
                    <option value="all">All Events</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium whitespace-nowrap">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={() => setShowEmailBlast(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium whitespace-nowrap">
                    <Mail className="w-4 h-4" /> Email Blast
                </button>
            </div>

            {/* Bulk actions */}
            {selected.length > 0 && (
                <div className="mb-4 p-3 bg-teal-900/20 border border-teal-800 rounded-xl flex items-center gap-4">
                    <span className="text-sm text-teal-300">{selected.length} selected</span>
                    <button onClick={bulkConfirm} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm">Confirm All</button>
                    <button onClick={() => setSelected([])} className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm">Clear</button>
                </div>
            )}

            {/* Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 text-slate-500 uppercase text-xs border-b border-slate-800">
                            <tr>
                                <th className="px-3 py-3"><input type="checkbox" onChange={e => setSelected(e.target.checked ? paginated.map(r => r.id) : [])} checked={selected.length === paginated.length && paginated.length > 0} className="w-4 h-4 rounded" /></th>
                                <th className="px-3 py-3">VX Code</th><th className="px-3 py-3">Name</th><th className="px-3 py-3">Event</th>
                                <th className="px-3 py-3">Contact</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Fee</th>
                                <th className="px-3 py-3">Date</th><th className="px-3 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={9} className="px-3 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>)
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={9} className="px-3 py-12 text-center text-slate-500">No registrations found</td></tr>
                            ) : paginated.map(reg => (
                                <tr key={reg.id} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => setExpandedRow(expandedRow === reg.id ? null : reg.id)}>
                                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={selected.includes(reg.id)} onChange={e => setSelected(e.target.checked ? [...selected, reg.id] : selected.filter(id => id !== reg.id))} className="w-4 h-4 rounded" />
                                    </td>
                                    <td className="px-3 py-3 text-teal-400 font-mono text-xs">{reg.registration_code}</td>
                                    <td className="px-3 py-3 text-white font-medium">{reg.primary_name}</td>
                                    <td className="px-3 py-3 text-slate-300">{events.find(e => e.id === reg.event_id)?.title || reg.event_id}</td>
                                    <td className="px-3 py-3 text-slate-400 text-xs">{reg.primary_email}<br />{reg.primary_phone}</td>
                                    <td className="px-3 py-3">{statusBadge(reg.status)}</td>
                                    <td className="px-3 py-3 text-white">₹{(reg.fee_amount / 100).toFixed(0)}</td>
                                    <td className="px-3 py-3 text-slate-500 text-xs">{new Date(reg.created_at).toLocaleDateString()}</td>
                                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex gap-1">
                                            {reg.status === 'pending' && <button onClick={() => updateStatus(reg.id, 'confirmed')} className="p-1.5 hover:bg-emerald-900/30 rounded text-emerald-400" title="Confirm"><CheckCircle className="w-4 h-4" /></button>}
                                            {reg.status !== 'cancelled' && <button onClick={() => updateStatus(reg.id, 'cancelled')} className="p-1.5 hover:bg-red-900/30 rounded text-red-400" title="Cancel"><XCircle className="w-4 h-4" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>Show</span>
                        <select value={perPage} onChange={e => { setPerPage(parseInt(e.target.value)); setPage(1); }} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm">
                            {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span>of {filtered.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                        <span className="text-sm text-slate-400">Page {page} of {totalPages || 1}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                    </div>
                </div>
            </div>

            {/* Email Blast Modal */}
            <AnimatePresence>
                {showEmailBlast && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Mail className="w-5 h-5 text-violet-400" /> Email Blast</h3>
                                <button onClick={() => setShowEmailBlast(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Filter by Event</label>
                                        <select value={emailEventFilter} onChange={e => setEmailEventFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
                                            <option value="">All Events</option>
                                            {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Filter by Status</label>
                                        <select value={emailStatusFilter} onChange={e => setEmailStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
                                            <option value="">All Statuses</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Subject *</label>
                                    <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500 outline-none"
                                        placeholder="Important Update — VOXERA 2026" />
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Body (HTML supported) *</label>
                                    <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6}
                                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                        placeholder="<h2>Hello!</h2><p>We have an exciting update...</p>" />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-xs text-slate-500">
                                        Recipients: {(() => {
                                            let r = registrations;
                                            if (emailEventFilter) r = r.filter(x => x.event_id === emailEventFilter);
                                            if (emailStatusFilter) r = r.filter(x => x.status === emailStatusFilter);
                                            return new Set(r.map(x => x.primary_email)).size;
                                        })()} unique emails
                                    </p>
                                    <button onClick={sendEmailBlast} disabled={emailSending}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 text-sm font-semibold disabled:opacity-50">
                                        <Send className="w-4 h-4" /> {emailSending ? 'Sending...' : 'Send Blast'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm shadow-2xl z-50">{toast}</motion.div>)}</AnimatePresence>
        </div>
    );
}
