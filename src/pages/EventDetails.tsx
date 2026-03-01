import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import EventCard from '../components/EventCard';
import { Calendar, Clock, MapPin, Users, Trophy, IndianRupee, Tag, Share2, Copy, CheckCircle, ArrowLeft, Phone, Sparkles, Timer } from 'lucide-react';
import { VoxeraEvent } from '../data/events';
import { PageSEO } from '../lib/seo';
import { getDisplayFee } from '../constants/fees';
import { trackEventView } from '../lib/analytics';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState<VoxeraEvent | null>(null);
  const [allEvents, setAllEvents] = useState<VoxeraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    window.scrollTo(0, 0);

    const mapEvent = (e: Record<string, unknown>): VoxeraEvent => ({
      ...e,
      shortDescription: (e.short_description || e.shortDescription || '') as string,
      teamSize: (e.team_size || e.teamSize || '') as string,
    } as VoxeraEvent);

    Promise.all([
      fetch(`/api/events/${id}`).then(r => r.ok ? r.json() : null),
      fetch('/api/events').then(r => r.json()).catch((): never[] => []),
    ]).then(([single, all]) => {
      if (single) {
        const mapped = mapEvent(single);
        setEvent(mapped);
        trackEventView(mapped.id, mapped.title);
      }
      const allMapped = (Array.isArray(all) ? all : []).filter((e: Record<string, unknown>) => e.is_published).map(mapEvent);
      setAllEvents(allMapped);
      setLoading(false);
    }).catch(() => setLoading(false));

    fetch('/api/settings').then(r => r.json()).then(s => setSettings(s || {})).catch(() => { });
  }, [id]);

  // Per-event countdown
  useEffect(() => {
    if (!event?.date) return;
    const target = new Date(event.date);
    if (isNaN(target.getTime())) return;
    const tick = () => {
      const now = Date.now();
      const diff = target.getTime() - now;
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [event?.date]);

  const relatedEvents = allEvents
    .filter((e) => e.category === event?.category && e.id !== event?.id)
    .slice(0, 3);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = event
    ? `https://wa.me/?text=${encodeURIComponent(`Check out ${event.title} at VOXERA 2026! 🎉\n\n📅 ${event.date}\n📍 ${event.location}\n\nRegister now: ${window.location.href}`)}`
    : '';

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen relative">
          {/* Skeleton banner */}
          <div className="h-[50vh] skeleton" />
          <div className="container mx-auto px-4 py-12">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 skeleton w-1/2" />
                <div className="h-4 skeleton w-full" />
                <div className="h-4 skeleton w-5/6" />
                <div className="h-4 skeleton w-4/6" />
                <div className="grid grid-cols-3 gap-4 mt-8">
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
                </div>
              </div>
              <div className="h-72 skeleton rounded-2xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#061515] to-slate-950" />
          <div className="relative z-10 text-center">
            <div className="p-4 rounded-full bg-slate-800/50 w-fit mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-slate-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-white" style={{ fontFamily: 'var(--font-display)' }}>Event Not Found</h1>
            <p className="text-slate-400 mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <Link to="/events" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-semibold transition-colors min-h-[48px]" aria-label="Back to Events">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageSEO title={event.title} description={event.shortDescription} image={event.banner_image || event.image} />

      {/* ─── Premium Banner ─── */}
      <div className="relative h-[55vh] w-full overflow-hidden">
        {/* Multi-layer gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/20 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-10" />

        <img src={event.banner_image || event.image} alt={event.title} className="w-full h-full object-cover" />

        {/* Content over banner */}
        <div className="absolute inset-0 z-20 flex items-end pb-14">
          <div className="container mx-auto px-4">
            {/* Back nav */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
              <Link to="/events" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> All Events
              </Link>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white mb-5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {event.title}
            </motion.h1>

            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="px-4 py-1.5 bg-teal-500/20 border border-teal-500/40 rounded-full text-teal-200 text-sm font-medium backdrop-blur-md">
                {event.category}
              </span>
              <span className="px-4 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-200 text-sm font-medium backdrop-blur-md flex items-center gap-1">
                <IndianRupee className="w-3 h-3" /> {getDisplayFee(event.id).replace('₹', '')}
              </span>
              {event.date && (
                <span className="px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm font-medium backdrop-blur-md flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {event.date}
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="container mx-auto px-4 py-14 relative">
        <div className="grid lg:grid-cols-3 gap-14">
          <div className="lg:col-span-2 space-y-14">
            {/* About */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-2xl font-bold mb-5 text-white" style={{ fontFamily: 'var(--font-heading)' }}>About the Event</h2>
              <p className="text-slate-400 leading-relaxed text-lg">{event.description}</p>
            </motion.section>

            {/* Info Grid */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-2xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-heading)' }}>Event Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: Calendar, label: 'Date', value: event.date, color: 'teal' },
                  { icon: Clock, label: 'Time', value: event.time, color: 'amber' },
                  { icon: MapPin, label: 'Venue', value: event.location, color: 'teal' },
                  { icon: Tag, label: 'Category', value: event.category, color: 'amber' },
                  { icon: Users, label: 'Team Size', value: event.teamSize, color: 'teal' },
                  { icon: IndianRupee, label: 'Fee', value: getDisplayFee(event.id), color: 'amber' },
                  { icon: Trophy, label: 'Prize', value: event.prize, color: 'teal' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.03] ${item.color === 'teal'
                      ? 'bg-teal-500/[0.03] border-teal-500/10 hover:border-teal-500/25'
                      : 'bg-amber-500/[0.03] border-amber-500/10 hover:border-amber-500/25'
                      }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className={`w-4 h-4 ${item.color === 'teal' ? 'text-teal-400' : 'text-amber-400'}`} />
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{item.label}</span>
                    </div>
                    <p className="text-white font-semibold">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Rounds */}
            {event.rounds && event.rounds.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-heading)' }}>Competition Rounds</h2>
                <div className="space-y-4">
                  {event.rounds.map((round, index) => (
                    <motion.div
                      key={index}
                      className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-teal-500/20 transition-all"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-teal-300 mb-2">{round.title}</h3>
                          <p className="text-slate-400 leading-relaxed">{round.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Judging Criteria */}
            {event.judging_criteria && event.judging_criteria.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-heading)' }}>Judging Criteria</h2>
                <div className="grid grid-cols-2 gap-3">
                  {event.judging_criteria.map((criteria, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-teal-500/20 transition-all"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{criteria}</span>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Rules */}
            {event.rules && event.rules.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-heading)' }}>Rules & Guidelines</h2>
                <div className="space-y-3">
                  {event.rules.map((rule, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] transition-all"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="w-7 h-7 rounded-full bg-teal-900/50 flex items-center justify-center flex-shrink-0 text-sm text-teal-300 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                        {index + 1}
                      </div>
                      <span className="text-slate-300 leading-relaxed pt-0.5">{rule}</span>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Register via Website (secure flow — no direct Google Form link) */}
            {event.registration_enabled && (
              <motion.div
                className="p-10 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/[0.04] to-transparent text-center relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
                <Sparkles className="w-8 h-8 text-teal-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>Ready to Register?</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Register on our website, pay the fee via UPI, and complete your registration — all in one seamless flow.
                </p>
                <Link
                  to={`/register?event=${event.id}`}
                  className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-emerald-600 text-white font-semibold px-10 py-4 rounded-2xl text-lg transition-all shadow-xl shadow-teal-900/30 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-white/10 to-teal-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative">Register Now</span>
                  <ArrowLeft className="w-5 h-5 relative rotate-180 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-slate-500 text-sm mt-5">
                  Pay ₹{event.registration_fee_single} via UPI during registration
                </p>
              </motion.div>
            )}

            {/* Coordinators */}
            {event.coordinators && event.coordinators.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-5" style={{ fontFamily: 'var(--font-heading)' }}>Event Coordinators</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.coordinators.map((coord, i) => (
                    <motion.div
                      key={i}
                      className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-teal-500/20 transition-all"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <p className="font-semibold text-white text-lg">{coord.name}</p>
                      <p className="text-teal-400 text-sm font-medium">{coord.role}</p>
                      {coord.phone && (
                        <a href={`tel:${coord.phone}`} className="inline-flex items-center gap-1.5 text-slate-400 text-sm hover:text-white mt-2 transition-colors">
                          <Phone className="w-3 h-3" /> {coord.phone}
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Venue Detail */}
            <motion.div
              className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-teal-400" />
                <span className="text-slate-400 text-sm uppercase tracking-wider font-medium">Venue</span>
              </div>
              <p className="text-white font-semibold text-lg">{event.location}</p>
              <p className="text-slate-400 text-sm mt-1">{settings.venue || 'JBIET Campus, Moinabad, Hyderabad'}</p>
            </motion.div>
          </div>

          {/* ─── Sidebar ─── */}
          <div className="space-y-6">
            <motion.div
              className="rounded-2xl p-6 border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm shadow-2xl shadow-black/20 sticky top-24 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Per-Event Countdown */}
              {!countdown.expired && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Timer className="w-4 h-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">Event Starts In</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: countdown.days, label: 'Days' },
                      { val: countdown.hours, label: 'Hrs' },
                      { val: countdown.minutes, label: 'Min' },
                      { val: countdown.seconds, label: 'Sec' },
                    ].map((u) => (
                      <div key={u.label} className="text-center p-2.5 rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06]">
                        <div className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>{String(u.val).padStart(2, '0')}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{u.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {countdown.expired && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-amber-400 font-semibold text-sm">🎉 Event has started!</span>
                </div>
              )}

              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>Get Registered</h3>

              <div className="p-5 bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/15 rounded-xl text-center">
                <p className="text-xs text-teal-300 uppercase tracking-wider mb-1 font-medium">Registration Fee</p>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>{getDisplayFee(event.id)}</p>
              </div>

              <Link
                to={`/register?event=${event.id}`}
                className="group relative block w-full min-h-[52px] py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-center rounded-xl hover:from-teal-500 hover:to-emerald-600 transition-all shadow-lg shadow-teal-900/20 overflow-hidden"
                aria-label={`Register for ${event.title}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-white/10 to-teal-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">Register for this Event</span>
              </Link>

              {/* Share */}
              <div className="pt-5 border-t border-white/[0.06]">
                <p className="text-sm text-slate-400 mb-3 font-medium">Share this event</p>
                <div className="flex gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-h-[44px] py-2.5 bg-green-900/30 border border-green-500/20 text-green-300 rounded-xl font-medium hover:bg-green-900/50 transition-all flex items-center justify-center gap-2 text-sm"
                    aria-label="Share on WhatsApp"
                  >
                    <Share2 className="w-4 h-4" /> WhatsApp
                  </a>
                  <button
                    onClick={copyUrl}
                    className="flex-1 min-h-[44px] py-2.5 bg-slate-800/50 border border-white/[0.06] text-slate-300 rounded-xl font-medium hover:bg-slate-700/50 transition-all flex items-center justify-center gap-2 text-sm"
                    aria-label="Copy URL"
                  >
                    {copied ? <><CheckCircle className="w-4 h-4 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy URL</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── Related Events ─── */}
        {relatedEvents.length > 0 && (
          <motion.section
            className="mt-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Related <span className="gradient-title">Events</span>
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-teal-500/20 to-transparent" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedEvents.map((e, i) => (
                <EventCard key={e.id} event={e} index={i} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </Layout>
  );
}
