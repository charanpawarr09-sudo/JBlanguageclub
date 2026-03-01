import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Plus, Edit, Trash2, X, ChevronDown, GripVertical, MessageSquare, Bell, FileText } from 'lucide-react';

export default function ContentEditor() {
    const [activeSection, setActiveSection] = useState<'hero' | 'faqs' | 'banners' | 'contacts'>('hero');
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [faqs, setFaqs] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');
    const [faqModal, setFaqModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState<any>(null);
    const [faqForm, setFaqForm] = useState<any>({});
    const [bannerModal, setBannerModal] = useState(false);
    const [bannerForm, setBannerForm] = useState<any>({});

    useEffect(() => { fetchAll(); }, []);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [setRes, faqRes, annRes, conRes] = await Promise.all([
                fetch('/api/settings', { credentials: 'include' }),
                fetch('/api/admin/faqs', { credentials: 'include' }),
                fetch('/api/admin/announcements', { credentials: 'include' }),
                fetch('/api/admin/contacts', { credentials: 'include' }),
            ]);
            setSettings(await setRes.json());
            setFaqs(await faqRes.json());
            setAnnouncements(await annRes.json());
            setContacts(await conRes.json());
        } catch { showToast('Failed to load data'); }
        finally { setLoading(false); }
    };

    const saveSettings = async (e: FormEvent) => {
        e.preventDefault();
        await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(settings) });
        showToast('Settings saved!');
    };

    const saveFaq = async (e: FormEvent) => {
        e.preventDefault();
        const method = editingFaq ? 'PUT' : 'POST';
        const url = editingFaq ? `/api/admin/faqs/${editingFaq.id}` : '/api/admin/faqs';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(faqForm) });
        setFaqModal(false); fetchAll(); showToast(editingFaq ? 'FAQ updated' : 'FAQ created');
    };

    const deleteFaq = async (id: number) => {
        if (!confirm('Delete this FAQ?')) return;
        await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE', credentials: 'include' });
        fetchAll(); showToast('FAQ deleted');
    };

    const saveBanner = async (e: FormEvent) => {
        e.preventDefault();
        const method = bannerForm.id ? 'PUT' : 'POST';
        const url = bannerForm.id ? `/api/admin/announcements/${bannerForm.id}` : '/api/admin/announcements';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(bannerForm) });
        setBannerModal(false); fetchAll(); showToast('Banner saved');
    };

    const inputCls = 'w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none transition-all';
    const tabs = [
        { id: 'hero' as const, label: 'Homepage', icon: FileText },
        { id: 'faqs' as const, label: 'FAQs', icon: MessageSquare },
        { id: 'banners' as const, label: 'Banners', icon: Bell },
        { id: 'contacts' as const, label: 'Contact Submissions', icon: MessageSquare },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Content Management</h2>

            <div className="flex gap-2 mb-6 flex-wrap">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveSection(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeSection === t.id ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* HERO / HOMEPAGE */}
            {activeSection === 'hero' && (
                <form onSubmit={saveSettings} className="space-y-5 max-w-2xl">
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Hero Title</label><input value={settings.hero_title || ''} onChange={e => setSettings({ ...settings, hero_title: e.target.value })} className={inputCls} /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Hero Tagline</label><input value={settings.hero_tagline || ''} onChange={e => setSettings({ ...settings, hero_tagline: e.target.value })} className={inputCls} /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Hero Background Image/Video URL</label><input value={settings.hero_image || ''} onChange={e => setSettings({ ...settings, hero_image: e.target.value })} className={inputCls} /></div>
                    <h3 className="text-lg font-semibold text-white pt-4 border-t border-slate-800">Event Dates & Venue</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Event Start Date (countdown)</label><input type="datetime-local" value={settings.event_start_date ? settings.event_start_date.slice(0, 16) : ''} onChange={e => setSettings({ ...settings, event_start_date: e.target.value ? new Date(e.target.value).toISOString() : '' })} className={inputCls} /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Venue Name</label><input value={settings.venue || ''} onChange={e => setSettings({ ...settings, venue: e.target.value })} className={inputCls} placeholder="JBIET Campus, Moinabad, Hyderabad" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Google Maps Embed URL</label><input value={settings.map_embed_url || ''} onChange={e => setSettings({ ...settings, map_embed_url: e.target.value })} className={inputCls} placeholder="https://www.google.com/maps/embed?pb=..." /></div>
                    <h3 className="text-lg font-semibold text-white pt-4 border-t border-slate-800">Stats Strip</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Events Count</label><input value={settings.stats_events || ''} onChange={e => setSettings({ ...settings, stats_events: e.target.value })} className={inputCls} placeholder="15+" /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Participants Text</label><input value={settings.stats_participants || ''} onChange={e => setSettings({ ...settings, stats_participants: e.target.value })} className={inputCls} placeholder="500+" /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Days Count</label><input value={settings.stats_days || ''} onChange={e => setSettings({ ...settings, stats_days: e.target.value })} className={inputCls} placeholder="3" /></div>
                    </div>
                    <h3 className="text-lg font-semibold text-white pt-4 border-t border-slate-800">About Section</h3>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">About Text</label><textarea rows={4} value={settings.about_text || ''} onChange={e => setSettings({ ...settings, about_text: e.target.value })} className={inputCls} /></div>
                    <h3 className="text-lg font-semibold text-white pt-4 border-t border-slate-800">Contact Info</h3>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Contact Page Subtitle</label><input value={settings.contact_page_subtitle || ''} onChange={e => setSettings({ ...settings, contact_page_subtitle: e.target.value })} className={inputCls} placeholder="Have questions? We're here to help..." /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label><input type="email" value={settings.contact_email || ''} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Email 2</label><input type="email" value={settings.contact_email_2 || ''} onChange={e => setSettings({ ...settings, contact_email_2: e.target.value })} className={inputCls} placeholder="Secondary email (optional)" /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label><input value={settings.contact_phone || ''} onChange={e => setSettings({ ...settings, contact_phone: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Phone 2</label><input value={settings.contact_phone_2 || ''} onChange={e => setSettings({ ...settings, contact_phone_2: e.target.value })} className={inputCls} placeholder="Secondary phone (optional)" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Chat / WhatsApp URL</label><input value={settings.contact_chat_url || ''} onChange={e => setSettings({ ...settings, contact_chat_url: e.target.value })} className={inputCls} placeholder="https://wa.me/91XXXXXXXXXX" /></div>
                    <h3 className="text-lg font-semibold text-white pt-4 border-t border-slate-800">Social Media</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Instagram</label><input value={settings.social_instagram || ''} onChange={e => setSettings({ ...settings, social_instagram: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Twitter/X</label><input value={settings.social_twitter || ''} onChange={e => setSettings({ ...settings, social_twitter: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">LinkedIn</label><input value={settings.social_linkedin || ''} onChange={e => setSettings({ ...settings, social_linkedin: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">YouTube</label><input value={settings.social_youtube || ''} onChange={e => setSettings({ ...settings, social_youtube: e.target.value })} className={inputCls} /></div>
                    </div>
                    <h3 className="text-lg font-semibold text-white pt-4 border-t border-slate-800">Address</h3>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Address Line 1</label><input value={settings.contact_address_line1 || ''} onChange={e => setSettings({ ...settings, contact_address_line1: e.target.value })} className={inputCls} placeholder="JB Institute of Engineering & Technology" /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Address Line 2</label><input value={settings.contact_address_line2 || ''} onChange={e => setSettings({ ...settings, contact_address_line2: e.target.value })} className={inputCls} placeholder="Moinabad, Hyderabad, Telangana 500075" /></div>
                    <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
                </form>
            )}

            {/* FAQS */}
            {activeSection === 'faqs' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-slate-400 text-sm">{faqs.length} FAQs</p>
                        <button onClick={() => { setEditingFaq(null); setFaqForm({ category: 'General', display_order: 0, is_active: true }); setFaqModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium"><Plus className="w-4 h-4" /> Add FAQ</button>
                    </div>
                    <div className="space-y-3">
                        {faqs.map(faq => (
                            <div key={faq.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400 mr-2">{faq.category}</span>
                                        <h4 className="font-medium text-white mt-2">{faq.question}</h4>
                                        <p className="text-slate-400 text-sm mt-1">{faq.answer}</p>
                                    </div>
                                    <div className="flex gap-1 ml-4">
                                        <button onClick={() => { setEditingFaq(faq); setFaqForm(faq); setFaqModal(true); }} className="p-1.5 hover:bg-slate-800 rounded text-blue-400"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => deleteFaq(faq.id)} className="p-1.5 hover:bg-slate-800 rounded text-red-400"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BANNERS */}
            {activeSection === 'banners' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-slate-400 text-sm">{announcements.length} announcements</p>
                        <button onClick={() => { setBannerForm({ color: '#7c3aed', is_active: true }); setBannerModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium"><Plus className="w-4 h-4" /> Add Banner</button>
                    </div>
                    <div className="space-y-3">
                        {announcements.map(ann => (
                            <div key={ann.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ann.color }} />
                                    <div>
                                        <p className="text-white font-medium">{ann.text}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-xs ${ann.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>{ann.is_active ? 'Active' : 'Hidden'}</span>
                                            {ann.link_url && <span className="text-xs text-slate-500">{ann.link_url}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setBannerForm(ann); setBannerModal(true); }} className="p-2 hover:bg-slate-800 rounded text-blue-400"><Edit className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONTACTS */}
            {activeSection === 'contacts' && (
                <div className="space-y-3">
                    <p className="text-slate-400 text-sm mb-4">{contacts.length} submissions</p>
                    {contacts.map((c: any) => (
                        <div key={c.id} className={`bg-slate-900/50 border rounded-xl p-4 ${c.is_read ? 'border-slate-800' : 'border-teal-800'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-white">{c.name}</h4>
                                        {!c.is_read && <span className="px-2 py-0.5 bg-teal-900/40 text-teal-400 rounded text-xs">New</span>}
                                    </div>
                                    <p className="text-slate-500 text-xs mt-0.5">{c.email} · {new Date(c.created_at).toLocaleDateString()}</p>
                                    {c.subject && <p className="text-slate-300 text-sm mt-2 font-medium">{c.subject}</p>}
                                    <p className="text-slate-400 text-sm mt-1">{c.message}</p>
                                </div>
                                {!c.is_read && (
                                    <button onClick={async () => { await fetch(`/api/admin/contacts/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ is_read: true, status: 'read' }) }); fetchAll(); }}
                                        className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs hover:text-white">Mark Read</button>
                                )}
                            </div>
                        </div>
                    ))}
                    {contacts.length === 0 && <p className="text-center text-slate-500 py-12">No contact submissions yet</p>}
                </div>
            )}

            {/* FAQ Modal */}
            <AnimatePresence>
                {faqModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h3>
                                <button onClick={() => setFaqModal(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={saveFaq} className="space-y-4">
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                                    <select value={faqForm.category || 'General'} onChange={e => setFaqForm({ ...faqForm, category: e.target.value })} className={inputCls}>
                                        {['General', 'Registration', 'Events', 'Payment', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Question</label><input required value={faqForm.question || ''} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Answer</label><textarea required rows={3} value={faqForm.answer || ''} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} className={inputCls} /></div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setFaqModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                                    <button type="submit" className="px-5 py-2 bg-teal-600 text-white rounded-xl font-medium">Save FAQ</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Banner Modal */}
            <AnimatePresence>
                {bannerModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">{bannerForm.id ? 'Edit Banner' : 'Add Banner'}</h3>
                                <button onClick={() => setBannerModal(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={saveBanner} className="space-y-4">
                                <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Banner Text</label><input required value={bannerForm.text || ''} onChange={e => setBannerForm({ ...bannerForm, text: e.target.value })} className={inputCls} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Color</label><input type="color" value={bannerForm.color || '#7c3aed'} onChange={e => setBannerForm({ ...bannerForm, color: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer" /></div>
                                    <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Link URL</label><input value={bannerForm.link_url || ''} onChange={e => setBannerForm({ ...bannerForm, link_url: e.target.value })} className={inputCls} /></div>
                                </div>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={bannerForm.is_active ?? true} onChange={e => setBannerForm({ ...bannerForm, is_active: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-slate-300">Active</span></label>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setBannerModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
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
