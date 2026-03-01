import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import EventCard from '../components/EventCard';
import { VoxeraEvent } from '../data/events';
import { useCountdown } from '../hooks/useCountdown';
import { PageSEO } from '../lib/seo';
import { ArrowRight, ChevronDown, Calendar, Users, Gift, Trophy, CheckCircle2, Sparkles, Zap, Star, MapPin, Award } from 'lucide-react';
import { ROUTES } from '../constants/routes';

/* ─── Premium Features (lazy-loaded for performance) ─── */
import FloatingRegisterBtn from '../components/FloatingRegisterBtn';
import ScrollProgress from '../components/ScrollProgress';
const CursorGlow = lazy(() => import('../components/CursorGlow'));
const ScrollRevealText = lazy(() => import('../components/ScrollRevealText'));
const EventTimeline = lazy(() => import('../components/EventTimeline'));
const Testimonials = lazy(() => import('../components/Testimonials'));

/* ─── Countdown Target: read from admin settings, fallback March 16, 2026 ─── */
const DEFAULT_EVENT_DATE = '2026-03-16T00:00:00+05:30';

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, label, suffix = '', prefix = '' }: { target: number; label: string; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target]);

  return (
    <motion.div
      ref={ref}
      className="text-center group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-display)' }}>
        {prefix}{count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-slate-500 mt-3 text-xs font-semibold uppercase tracking-[0.25em]">{label}</div>
    </motion.div>
  );
}

/* ─── Premium Countdown Display ─── */
function CountdownDisplay({ targetDate }: { targetDate: Date }) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate);

  const units = [
    { value: days, label: 'Days', color: 'from-teal-500 to-emerald-500' },
    { value: hours, label: 'Hours', color: 'from-cyan-500 to-teal-500' },
    { value: minutes, label: 'Min', color: 'from-violet-500 to-purple-500' },
    { value: seconds, label: 'Sec', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="flex gap-3 md:gap-4 justify-center">
      {units.map((unit, i) => (
        <motion.div
          key={unit.label}
          initial={{ opacity: 0, y: 30, rotateX: -60 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 1.0 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative group"
        >
          {/* Glow ring */}
          <div className={`absolute -inset-[2px] bg-gradient-to-b ${unit.color} rounded-2xl opacity-0 group-hover:opacity-30 blur-md transition-all duration-500`} />
          <div className="relative flex flex-col items-center bg-slate-900/80 border border-white/[0.06] rounded-2xl px-4 py-4 md:px-6 md:py-5 min-w-[72px] md:min-w-[96px] hover:border-white/15 transition-all duration-300 overflow-hidden">
            {/* Inner shimmer */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />
            <span className="relative text-3xl md:text-5xl font-bold text-white tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="relative text-[9px] md:text-[10px] text-white/40 uppercase tracking-[0.3em] mt-2 font-semibold">
              {unit.label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Floating Particle Enhanced ─── */
function FloatingParticle({ size, x, y, delay, duration, color }: { size: number; x: string; y: string; delay: number; duration: number; color: string }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none animate-float-particle"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: color,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

/* ─── Decorative Horizon Line ─── */
function HorizonLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[1px] pointer-events-none"
      style={{ top: '70%' }}
      animate={{ opacity: [0.03, 0.12, 0.03] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="w-full h-full bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
    </motion.div>
  );
}

/* ─── Light Beam Effect ─── */
function LightBeam() {
  return (
    <motion.div
      className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] pointer-events-none"
      style={{ height: '40%' }}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: [0, 0.4, 0], scaleY: [0, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 5 }}
    >
      <div className="w-full h-full bg-gradient-to-b from-teal-400/60 via-teal-400/20 to-transparent" />
    </motion.div>
  );
}

/* ─── Main Home Page ─── */
export default function Home() {
  const [events, setEvents] = useState<VoxeraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()).catch((): never[] => []),
      fetch('/api/settings').then(r => r.json()).catch(() => ({})),
    ]).then(([eventsData, settingsData]) => {
      setEvents((eventsData || [])
        .filter((e: Record<string, unknown>) => e.is_published)
        .map((e: Record<string, unknown>): VoxeraEvent => ({
          ...e,
          shortDescription: (e.short_description || e.shortDescription || '') as string,
          teamSize: (e.team_size || e.teamSize || '') as string,
        } as VoxeraEvent))
        .slice(0, 3));
      setSettings(settingsData || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <PageSEO title="Home" description="VOXERA 2026 — A Literary Fiesta by JB Language Club at JBIET. March 16–18, 2026." />

      {/* ─── Global Premium Features ─── */}
      <FloatingRegisterBtn />
      <ScrollProgress />
      <Suspense fallback={null}><CursorGlow /></Suspense>

      {/* ─── Section 1: ULTRA-PREMIUM Hero ─── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Deep layered background */}
        <div className="absolute inset-0 bg-[#040608]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a0f] via-[#050d0d] to-[#040608]" />

        {/* Radial aurora gradients */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,_rgba(20,184,166,0.08)_0%,_transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_90%,_rgba(245,158,11,0.04)_0%,_transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,_rgba(139,92,246,0.03)_0%,_transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(20,184,166,0.06)_0%,_transparent_35%)]" />
        </div>

        {/* Subtle horizon line */}
        <HorizonLine />

        {/* Light beam */}
        <LightBeam />

        {/* Floating particles — curated selection */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingParticle size={4} x="10%" y="20%" delay={0} duration={18} color="rgba(20,184,166,0.4)" />
          <FloatingParticle size={3} x="85%" y="30%" delay={3} duration={22} color="rgba(245,158,11,0.35)" />
          <FloatingParticle size={5} x="20%" y="70%" delay={5} duration={25} color="rgba(139,92,246,0.25)" />
          <FloatingParticle size={3} x="75%" y="65%" delay={7} duration={20} color="rgba(20,184,166,0.3)" />
          <FloatingParticle size={4} x="50%" y="15%" delay={2} duration={24} color="rgba(245,158,11,0.2)" />
        </div>

        {/* Large floating orbs — CSS animated for zero main-thread cost */}
        <div
          className="absolute top-[15%] left-[3%] w-80 h-80 bg-teal-500/[0.05] rounded-full blur-[100px] pointer-events-none animate-float-orb-1"
        />
        <div
          className="absolute bottom-[15%] right-[3%] w-[28rem] h-[28rem] bg-amber-500/[0.03] rounded-full blur-[120px] pointer-events-none animate-float-orb-2"
        />
        <div
          className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/[0.02] rounded-full blur-[140px] pointer-events-none animate-float-orb-3"
        />

        {/* Morphing gradient blobs — color-cycling organic shapes (#21) */}
        <div className="gradient-blob gradient-blob-1" />
        <div className="gradient-blob gradient-blob-2" />
        <div className="gradient-blob gradient-blob-3" />

        {/* Noise overlay - lightweight */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+)' }} />

        {/* Vignette edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(4,6,8,0.7)_100%)] pointer-events-none" />

        {/* Content with parallax */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="container mx-auto px-4 relative z-10 text-center py-32"
        >
          {/* Badge — refined with gold accent */}
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2.5 mb-10 px-6 py-2.5 rounded-full bg-white/[0.04] border border-amber-500/15 backdrop-blur-xl"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium text-white/60 tracking-wider" style={{ fontFamily: 'var(--font-accent)' }}>JB Language Club Presents</span>
          </motion.div>

          {/* VOXERA Title — dramatic serif letterforms */}
          <motion.h1
            className="text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[9rem] font-black tracking-[-0.02em] mb-5 leading-[0.85] relative"
            style={{ fontFamily: 'var(--font-display)' }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } },
            }}
          >
            {'VOXERA'.split('').map((char, i) => {
              // High contrast gradients — white dominant for readability, teal & gold accents
              const gradients = [
                'linear-gradient(180deg, #ffffff 0%, #e2e8f0 40%, #94a3b8 100%)',
                'linear-gradient(180deg, #ffffff 0%, #ccfbf1 30%, #14b8a6 100%)',
                'linear-gradient(180deg, #ffffff 0%, #ccfbf1 35%, #0d9488 100%)',
                'linear-gradient(180deg, #ffffff 0%, #fef3c7 30%, #f59e0b 100%)',
                'linear-gradient(180deg, #ffffff 0%, #fde68a 35%, #d97706 100%)',
                'linear-gradient(180deg, #ffffff 0%, #fef3c7 30%, #b45309 100%)',
              ];
              return (
                <motion.span
                  key={i}
                  className="inline-block"
                  style={{
                    backgroundImage: gradients[i],
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                  variants={{
                    hidden: { opacity: 0, y: 60, filter: 'blur(16px)', rotateX: -90, scale: 0.8 },
                    visible: {
                      opacity: 1, y: 0, filter: 'blur(0px)', rotateX: 0, scale: 1,
                      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                    },
                  }}
                  whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
                >
                  {char}
                </motion.span>
              );
            })}
            {/* Glow behind title — refined */}
            <div className="absolute inset-0 text-[7rem] md:text-[9rem] blur-[80px] opacity-25 pointer-events-none select-none" aria-hidden="true">
              <span className="text-teal-400">VOXERA</span>
            </div>
          </motion.h1>

          {/* Subtitle — elegant serif accent */}
          <motion.p
            className="text-base md:text-lg text-white/35 uppercase tracking-[0.35em] font-light mb-10 italic"
            style={{ fontFamily: 'var(--font-accent)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            A Literary Fiesta · 2026
          </motion.p>

          {/* Tagline */}
          <motion.p
            className="text-base md:text-lg text-slate-400/80 mb-14 max-w-lg mx-auto font-light leading-relaxed"
            style={{ fontFamily: 'var(--font-accent)', fontSize: '1.15rem' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            {settings.hero_tagline || 'Where voices rise, ideas collide, and creativity knows no bounds.'}
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mb-14"
          >
            <CountdownDisplay targetDate={new Date(settings.event_start_date || DEFAULT_EVENT_DATE)} />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <Link
              to={ROUTES.REGISTER}
              className="group relative min-h-[54px] px-10 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-2xl font-semibold hover:from-teal-500 hover:to-emerald-500 transition-all shadow-xl shadow-teal-950/50 flex items-center gap-2 overflow-hidden"
              aria-label="Register Now"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-white/15 to-teal-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative text-base">Register Now</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={ROUTES.EVENTS}
              className="min-h-[54px] px-10 py-4 border border-white/10 text-white/80 rounded-2xl font-semibold hover:bg-white/[0.04] hover:border-white/20 transition-all backdrop-blur-sm flex items-center gap-2"
              aria-label="Explore Events"
            >
              Explore Events
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 2.5 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-medium">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center p-1.5">
              <motion.div
                className="w-1 h-1.5 rounded-full bg-white/30"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Section 2: Stats Strip — Glassmorphism ─── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[#050808]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(20,184,166,0.04)_0%,_transparent_60%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/10 to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { target: 3, label: 'Days of Fun', suffix: '', prefix: '', icon: Gift },
              { target: parseInt(settings.stats_events || '6'), label: 'Events', suffix: '', prefix: '', icon: Calendar },
              { target: parseInt(settings.stats_participants || '200'), label: 'Participants', suffix: '+', prefix: '', icon: Users },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                {/* Hover glow */}
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500" />
                <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8 text-center hover:border-white/10 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/[0.08] border border-teal-500/10 mb-5">
                    <stat.icon className="w-5 h-5 text-teal-400" />
                  </div>
                  <AnimatedCounter target={stat.target} label={stat.label} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── Section 3: Featured Events ─── */}
      <section className="py-28 bg-[#040608] relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(20,184,166,0.03)_0%,_transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-semibold uppercase tracking-[0.2em] mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Star className="w-3 h-3 text-amber-400" /> Curated Selection
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-bold mb-5 text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Featured <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent italic">Events</span>
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-base">
              Explore our handpicked selection of events that promise unforgettable experiences.
            </p>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl border border-white/[0.06] bg-white/[0.02] h-[400px] overflow-hidden">
                  <div className="h-48 skeleton" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 skeleton w-3/4" />
                    <div className="h-4 skeleton w-full" />
                    <div className="h-4 skeleton w-2/3" />
                    <div className="h-10 skeleton w-1/3 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.15 } },
              }}
              className="grid md:grid-cols-3 gap-8"
            >
              {events.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </motion.div>
          )}

          <motion.div
            className="text-center mt-14"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link
              to={ROUTES.EVENTS}
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl border border-white/[0.08] text-white/60 font-semibold hover:bg-white/[0.03] hover:border-white/15 hover:text-white/80 transition-all min-h-[48px]"
              aria-label="View All Events"
            >
              View All Events <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Section 4: About VOXERA ─── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#040608] via-[#060a0a] to-[#040608]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,_rgba(245,158,11,0.03)_0%,_transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <motion.span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/[0.06] border border-amber-500/15 text-amber-400/80 text-xs font-semibold uppercase tracking-[0.2em] mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <Zap className="w-3 h-3" /> Our Story
              </motion.span>

              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white leading-[1.1]" style={{ fontFamily: 'var(--font-display)' }}>
                About{' '}
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent italic">
                  VOXERA
                </span>
              </h2>
              <div className="space-y-5 text-slate-400 leading-relaxed text-base">
                {(settings.about_text || 'VOXERA 2026 is the flagship Literary Fiesta organized by JB Language Club at JBIET. Spanning three electrifying days on March 16–18, 2026, VOXERA brings together the brightest minds and boldest performers under one roof.\n\nFrom fierce debate battles to soulful poetry recitals, from startup pitches to treasure hunts across campus — VOXERA is where passion meets competition.').split('\n').filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <Link
                to={ROUTES.ABOUT}
                className="group inline-flex items-center gap-2 mt-10 text-teal-400 font-semibold hover:text-teal-300 transition-colors text-sm"
              >
                Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Calendar, text: '3 Thrilling Days', desc: 'March 16–18, 2026', color: 'teal' },
                { icon: Trophy, text: '6 Competitions', desc: 'Across all domains', color: 'amber' },
                { icon: Gift, text: 'Exciting Gifts', desc: 'Surprises for winners', color: 'violet' },
                { icon: Users, text: 'Open to All', desc: 'Any college welcome', color: 'cyan' },
                { icon: MapPin, text: 'JBIET Campus', desc: 'Moinabad, Hyderabad', color: 'amber' },
                { icon: Sparkles, text: 'Certificates', desc: 'For all participants', color: 'teal' },
              ].map((item, i) => {
                const colorMap: Record<string, { bg: string; border: string; icon: string; hoverBg: string; hoverBorder: string }> = {
                  teal: { bg: 'bg-teal-500/[0.04]', border: 'border-teal-500/10', icon: 'text-teal-400', hoverBg: 'hover:bg-teal-500/[0.08]', hoverBorder: 'hover:border-teal-500/25' },
                  amber: { bg: 'bg-amber-500/[0.04]', border: 'border-amber-500/10', icon: 'text-amber-400', hoverBg: 'hover:bg-amber-500/[0.08]', hoverBorder: 'hover:border-amber-500/25' },
                  violet: { bg: 'bg-violet-500/[0.04]', border: 'border-violet-500/10', icon: 'text-violet-400', hoverBg: 'hover:bg-violet-500/[0.08]', hoverBorder: 'hover:border-violet-500/25' },
                  cyan: { bg: 'bg-cyan-500/[0.04]', border: 'border-cyan-500/10', icon: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500/[0.08]', hoverBorder: 'hover:border-cyan-500/25' },
                };
                const c = colorMap[item.color];
                return (
                  <motion.div
                    key={i}
                    className={`group p-5 rounded-2xl border ${c.bg} ${c.border} ${c.hoverBg} ${c.hoverBorder} transition-all duration-300 hover:scale-[1.02]`}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <div className={`p-2.5 rounded-xl w-fit mb-3 ${c.bg}`}>
                      <item.icon className={`w-5 h-5 ${c.icon}`} />
                    </div>
                    <span className="text-white font-medium text-sm block">{item.text}</span>
                    <span className="text-white/30 text-xs mt-1 block">{item.desc}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section 5: Event Timeline ─── */}
      <Suspense fallback={null}>
        <EventTimeline />
      </Suspense>

      {/* ─── Section 6: Testimonials ─── */}
      <Suspense fallback={null}>
        <Testimonials />
      </Suspense>

      {/* ─── Section 8: Final CTA — Cinematic ─── */}
      <section className="py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#040608]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Animated gradient orb */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-teal-500/10 via-violet-500/5 to-amber-500/5 rounded-full blur-[120px] pointer-events-none"
        />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Sparkles className="w-3 h-3 text-teal-400" /> Limited Spots
            </motion.span>

            <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
              Don't Miss Your
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent italic">
                Moment
              </span>
            </h2>
            <p className="text-slate-500 max-w-md mx-auto mb-14 text-base leading-relaxed">
              Registrations close soon. Secure your spot and be part of the biggest Literary Fiesta of the year.
            </p>
            <Link
              to={ROUTES.REGISTER}
              className="group relative inline-flex items-center gap-3 min-h-[56px] px-12 py-5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-2xl font-semibold text-lg hover:from-teal-500 hover:to-emerald-500 transition-all shadow-2xl shadow-teal-950/60 overflow-hidden"
              aria-label="Register Now"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-white/15 to-teal-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">Register Now</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
