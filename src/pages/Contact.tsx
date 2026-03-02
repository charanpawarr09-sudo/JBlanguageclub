import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { Mail, Phone, MapPin, Bell, HelpCircle, ChevronDown, ChevronUp, Instagram, MessageSquare, CheckCircle, Loader2, Send, Sparkles, Clock } from 'lucide-react';
import { PageSEO } from '../lib/seo';

interface FAQ { id?: number; question: string; answer: string; }
interface Update { id: string; text: string; created_at?: string; }

export default function Contact() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);

  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    // Fetch site settings, FAQs, and announcements from API
    Promise.all([
      fetch('/api/settings').then(r => r.json()).catch(() => ({})),
      fetch('/api/faqs').then(r => r.json()).catch((): never[] => []),
      fetch('/api/announcements').then(r => r.json()).catch((): never[] => []),
    ]).then(([s, f, a]) => {
      setSettings(s || {});
      setFaqs(Array.isArray(f) && f.length > 0 ? f : defaultFaqs);
      setUpdates(Array.isArray(a) && a.length > 0 ? a : []);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setFormError('All fields are required.');
      return;
    }
    setFormStatus('submitting');
    setFormError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }
      setFormStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setFormError(msg);
      setFormStatus('error');
    }
  };

  // Dynamically get contact info from settings, with sensible defaults
  const contactEmail1 = settings.contact_email || 'voxera2026@gmail.com';
  const contactEmail2 = settings.contact_email_2 || 'jblanguageclub@jbiet.edu.in';
  const contactPhone1 = settings.contact_phone || '';
  const contactPhone2 = settings.contact_phone_2 || '';
  const contactAddress = (settings.contact_address_line1 && settings.contact_address_line2)
    ? `${settings.contact_address_line1}\n${settings.contact_address_line2}`
    : settings.contact_address_line1 || settings.contact_address || 'JB Institute of Engineering & Technology\nYenkapally, Moinabad\nHyderabad, Telangana 500075';
  const instagramUrl = settings.social_instagram || '#';
  const chatUrl = settings.contact_chat_url || '#';
  const emailUrl = `mailto:${contactEmail1}`;
  const pageSubtitle = settings.contact_page_subtitle || 'Have questions? We\'re here to help. Reach out to us for any queries regarding events, registration, or sponsorship.';

  const inputClass =
    'w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all min-h-[48px]';

  return (
    <Layout>
      <PageSEO title="Contact" description="Get in touch with the VOXERA 2026 organizing team." />

      <div className="min-h-screen pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Premium background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0d0d15] to-[var(--bg-primary)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(20,184,166,0.06)_0%,_transparent_50%)]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Reach Out
            </motion.span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Get in <span className="gradient-title italic">Touch</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-4">
              {pageSubtitle}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Clock className="w-3 h-3" /> We typically respond within 24 hours
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column: Contact Info + Form */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-default)] shadow-lg"
              >
                <h2 className="text-2xl font-bold mb-6 text-white">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-teal-900/20 rounded-lg text-teal-400"><Mail className="w-6 h-6" /></div>
                    <div>
                      <h3 className="font-semibold text-white">Email Us</h3>
                      <p className="text-slate-400">{contactEmail1}</p>
                      {contactEmail2 && <p className="text-slate-400">{contactEmail2}</p>}
                    </div>
                  </div>
                  {(contactPhone1 || contactPhone2) && (
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-teal-900/20 rounded-lg text-teal-400"><Phone className="w-6 h-6" /></div>
                      <div>
                        <h3 className="font-semibold text-white">Call Us</h3>
                        {contactPhone1 && <p className="text-slate-400">{contactPhone1}</p>}
                        {contactPhone2 && <p className="text-slate-400">{contactPhone2}</p>}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-teal-900/20 rounded-lg text-teal-400"><MapPin className="w-6 h-6" /></div>
                    <div>
                      <h3 className="font-semibold text-white">Visit Us</h3>
                      <p className="text-slate-400 whitespace-pre-line">{contactAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800">
                  <h3 className="font-semibold text-white mb-4">Follow Us</h3>
                  <div className="flex gap-4">
                    {[
                      { icon: Instagram, label: 'Instagram', href: instagramUrl },
                      { icon: Mail, label: 'Email', href: emailUrl },
                      ...(chatUrl && chatUrl !== '#' ? [{ icon: MessageSquare, label: 'Chat', href: chatUrl }] : []),
                    ].filter(social => {
                      // Validate URL protocol to prevent javascript: injection
                      try {
                        const url = social.href;
                        return url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:') || url.startsWith('tel:');
                      } catch { return false; }
                    }).map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-slate-800 rounded-lg text-slate-400 hover:bg-teal-900/40 hover:text-teal-400 transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
                        aria-label={social.label}
                      >
                        <social.icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-default)] shadow-lg"
              >
                <h2 className="text-2xl font-bold mb-6 text-white">Send us a Message</h2>

                {formStatus === 'success' ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-white font-semibold mb-2">Message Sent!</p>
                    <p className="text-slate-400 text-sm">We'll get back to you as soon as possible.</p>
                    <button
                      onClick={() => setFormStatus('idle')}
                      className="mt-4 text-teal-400 hover:text-teal-300 text-sm font-medium min-h-[48px]"
                      aria-label="Send another message"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your Name" aria-label="Name" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="your@email.com" aria-label="Email" />
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} placeholder="Subject" aria-label="Subject" />
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={inputClass + ' min-h-[120px]'} placeholder="Your message..." aria-label="Message" />
                    {formError && <p className="text-red-400 text-sm">{formError}</p>}
                    <button
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="w-full min-h-[48px] py-3 bg-gradient-to-r from-teal-700 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      aria-label="Send Message"
                    >
                      {formStatus === 'submitting' ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>

            {/* Right Column: Updates + FAQ + Map */}
            <div className="lg:col-span-2 space-y-8">
              {/* Latest Updates (from announcements API) */}
              {updates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[var(--bg-elevated)] p-8 rounded-2xl text-white shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-6 h-6 text-amber-400" />
                    <h2 className="text-2xl font-bold">Latest Updates</h2>
                  </div>
                  <div className="space-y-6">
                    {updates.map((update) => (
                      <div key={update.id} className="border-l-2 border-amber-400 pl-4">
                        <p className="text-teal-200 text-sm mb-1">{update.created_at ? new Date(update.created_at).toLocaleDateString() : ''}</p>
                        <p className="font-medium text-teal-100">{update.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* FAQ */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-default)] shadow-lg"
              >
                <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
                  <HelpCircle className="w-8 h-8 text-teal-500" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border border-slate-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left bg-slate-950 hover:bg-slate-800 transition-colors min-h-[48px]"
                        aria-label={faq.question}
                        aria-expanded={openFaqIndex === index}
                      >
                        <span className="font-semibold text-white pr-4">{faq.question}</span>
                        {openFaqIndex === index ? <ChevronUp className="w-5 h-5 text-teal-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {openFaqIndex === index && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="p-4 bg-slate-900 text-slate-400 border-t border-slate-800 leading-relaxed">{faq.answer}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Google Maps Embed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="h-80 rounded-2xl overflow-hidden border border-[var(--border-default)]"
              >
                <iframe
                  src={settings.map_embed_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3808.5!2d78.2876!3d17.2987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcba1b3b3b3b3b3%3A0x3bcba1b3b3b3b3b3!2sJBIET!5e0!3m2!1sen!2sin!4v1234567890"}
                  width="100%"
                  height="100%"
                  className="border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={settings.venue || "JBIET Campus Location"}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Fallback FAQs when API returns empty
const defaultFaqs: FAQ[] = [
  {
    question: "How do I register for an event?",
    answer: "You can register by clicking the 'Register' button in the navigation bar or on any event details page. Fill out the form with your details and you're set!"
  },
  {
    question: "Is there a registration fee?",
    answer: "Yes, each event has a registration fee displayed on its event page. Pay via UPI and enter your transaction ID in the Google Form."
  },
  {
    question: "Can I participate in multiple events?",
    answer: "Yes! As long as the event schedules do not clash, you are welcome to participate in as many events as you like."
  },
  {
    question: "Will participation certificates be provided?",
    answer: "Yes, all registered participants who attend the event will receive a digital certificate of participation."
  },
];
