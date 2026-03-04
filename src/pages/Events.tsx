import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import EventCard from '../components/EventCard';
import { VoxeraEvent } from '../data/events';
import { normalizeEvent } from '../lib/normalizeEvent';
import { PageSEO } from '../lib/seo';
import { Search, Filter, Sparkles } from 'lucide-react';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="h-52 skeleton" />
      <div className="p-6 space-y-3">
        <div className="h-6 skeleton w-3/4" />
        <div className="h-4 skeleton w-full" />
        <div className="h-4 skeleton w-2/3" />
        <div className="flex gap-2 mt-4">
          <div className="h-7 skeleton w-16 rounded-full" />
          <div className="h-7 skeleton w-24 rounded-full" />
        </div>
        <div className="h-5 skeleton w-1/3 mt-4" />
      </div>
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState<VoxeraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        const mapped = data
          .filter((e: Record<string, unknown>) => e.is_published)
          .map(normalizeEvent);
        setEvents(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Derive categories dynamically from event data — auto-updates when admin changes categories
  const categories = useMemo(() => {
    const cats = [...new Set(events.map((e) => e.category))].sort();
    return ['All', ...cats];
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (activeCategory !== 'All') {
      filtered = filtered.filter((e) => e.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) => e.title.toLowerCase().includes(query) || e.shortDescription.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [events, activeCategory, searchQuery]);

  return (
    <Layout>
      <PageSEO
        title="Events"
        description="Explore all events at VOXERA 2026. Debates, poetry, open mic, pitch competitions, treasure hunts, and film screenings."
      />

      <section className="pt-32 pb-24 px-4 min-h-screen relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#061515] to-[var(--bg-primary)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(20,120,110,0.08)_0%,_transparent_50%)]" />

        <div className="container mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14"
          >
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Browse Events
            </motion.span>

            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              All <span className="gradient-title">Events</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-4">
              From literary challenges to cultural showcases, there's something for everyone.
            </p>
            {!loading && events.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs font-medium">
                Showing {filteredEvents.length} of {events.length} events
              </motion.div>
            )}
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md mx-auto mb-8"
          >
            <div className="relative group">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-teal-500/20 to-amber-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/80 backdrop-blur-sm border border-white/[0.08] rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/30 outline-none transition-all min-h-[48px]"
                  aria-label="Search events"
                />
              </div>
            </div>
          </motion.div>

          {/* Category Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mb-14"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] overflow-hidden ${activeCategory === cat
                  ? 'text-white shadow-lg shadow-teal-600/20'
                  : 'text-slate-400 border border-white/[0.06] hover:border-teal-500/30 hover:text-white bg-white/[0.02]'
                  }`}
                aria-label={`Filter by ${cat}`}
              >
                {activeCategory === cat && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-500 rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            ))}
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <div className="p-4 rounded-full bg-slate-800/50 w-fit mx-auto mb-6">
                <Filter className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Events Found</h3>
              <p className="text-slate-400 max-w-sm mx-auto mb-6">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
                className="px-6 py-2.5 text-teal-400 font-semibold border border-teal-500/20 rounded-full hover:bg-teal-500/5 transition-all min-h-[48px]"
                aria-label="Clear filters"
              >
                Clear All Filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.1 } },
              }}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}
