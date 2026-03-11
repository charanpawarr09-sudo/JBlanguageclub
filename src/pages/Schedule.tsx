import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { Calendar, Clock, MapPin, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageSEO } from '../lib/seo';

interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  shortDescription?: string;
  date: string;
  time: string;
  location: string;
  category: string;
  is_published: boolean;
  registration_fee_single: number;
  registration_fee_team?: number | null;
  team_size_max: number;
}

/**
 * Parse any date string into a Date object.
 * Handles ISO "2026-03-16", "March 16, 2026", "16 March, 2026", etc.
 */
function parseDate(raw: string): Date {
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  return new Date(NaN);
}

/**
 * Format a date string into a consistent display format: "March 16, 2026"
 */
function formatDate(raw: string): string {
  const d = parseDate(raw);
  if (isNaN(d.getTime())) return raw; // fallback to original if unparseable
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Normalize a date string to a canonical ISO key (YYYY-MM-DD) for deduplication.
 */
function dateKey(raw: string): string {
  const d = parseDate(raw);
  if (isNaN(d.getTime())) return raw;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Schedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState('all');

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error(`Failed to fetch events (HTTP ${res.status})`);
        const data = await res.json();
        const published = data.filter((e: ScheduleEvent) => e.is_published);
        setEvents(published);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unable to load the schedule. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Dynamically extract unique dates (deduplicated by canonical ISO key) and build day tabs
  const uniqueDates = useMemo(() => {
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const e of events) {
      const key = dateKey(e.date);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
    // Sort chronologically by ISO key
    keys.sort();
    return keys;
  }, [events]);

  const dayTabs = useMemo(() => {
    const tabs = [{ key: 'all', label: 'All Days', sublabel: uniqueDates.length > 0 ? `${uniqueDates.length} days` : '' }];
    uniqueDates.forEach((isoKey, index) => {
      tabs.push({
        key: `day${index + 1}`,
        label: `Day ${index + 1}`,
        sublabel: formatDate(isoKey),
      });
    });
    return tabs;
  }, [uniqueDates]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const ka = dateKey(a.date);
      const kb = dateKey(b.date);
      if (ka !== kb) return ka.localeCompare(kb);
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeDay === 'all') return sortedEvents;
    const dayIndex = parseInt(activeDay.replace('day', '')) - 1;
    const targetKey = uniqueDates[dayIndex];
    if (!targetKey) return sortedEvents;
    return sortedEvents.filter(e => dateKey(e.date) === targetKey);
  }, [sortedEvents, activeDay, uniqueDates]);

  const getDescription = (e: ScheduleEvent) => e.short_description || e.shortDescription || '';

  return (
    <Layout>
      <PageSEO title="Schedule" description="Full event timeline for VOXERA 2026." />

      <div className="min-h-screen pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Premium background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a0d15] to-[var(--bg-primary)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(139,92,246,0.06)_0%,_transparent_50%)]" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Full Schedule
            </motion.span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Event <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent italic">Timeline</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Don't miss a moment. Check out the complete schedule for VOXERA 2026.
            </p>
          </motion.div>

          {/* Day Filter Tabs — dynamically generated */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center gap-3 mb-12 flex-wrap"
          >
            {dayTabs.map((df) => (
              <button
                key={df.key}
                onClick={() => setActiveDay(df.key)}
                className={`group relative px-6 py-3 rounded-xl font-medium transition-all duration-200 min-h-[48px] ${activeDay === df.key
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-teal-500/40 hover:text-white'
                  }`}
                aria-label={`Filter by ${df.label}`}
              >
                <span className="block text-sm font-semibold">{df.label}</span>
                <span
                  className={`block text-xs mt-0.5 ${activeDay === df.key ? 'text-teal-200' : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                >
                  {df.sublabel}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading schedule...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 bg-red-900/20 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-300 font-medium mb-2">Something went wrong</p>
              <p className="text-slate-400 text-sm mb-4 max-w-md">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors text-sm min-h-[48px]"
                aria-label="Try Again"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg font-medium">
                {activeDay !== 'all'
                  ? 'No events scheduled for this day.'
                  : 'No events found.'}
              </p>
              {activeDay !== 'all' && (
                <button
                  onClick={() => setActiveDay('all')}
                  className="mt-4 text-teal-400 hover:text-teal-300 text-sm font-medium min-h-[48px]"
                  aria-label="View All Days"
                >
                  View All Days →
                </button>
              )}
            </div>
          )}

          {/* Timeline */}
          {!loading && !error && filteredEvents.length > 0 && (
            <div className="relative">
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-800 transform md:-translate-x-1/2" />

              <div className="space-y-12">
                <AnimatePresence mode="wait">
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.08 }}
                      className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''
                        }`}
                    >
                      <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-teal-600 rounded-full border-4 border-slate-950 transform -translate-x-1/2 mt-6 z-10 shadow-md shadow-teal-900/50" />

                      <div className="ml-12 md:ml-0 md:w-1/2">
                        <div
                          className={`bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-default)] shadow-lg hover:shadow-xl hover:shadow-teal-900/10 hover:border-teal-500/30 transition-all duration-300 ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-3 py-1 bg-teal-900/50 text-teal-300 text-xs font-bold rounded-full uppercase tracking-wider">
                              {event.category}
                            </span>
                            <span className="text-slate-500 text-sm font-[var(--font-mono)]">{formatDate(event.date)}</span>
                          </div>

                          <h3 className="text-xl font-bold mb-2 text-white">{event.title}</h3>
                          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{getDescription(event)}</p>

                          <div className="space-y-2 text-sm text-slate-400 mb-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-teal-500" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-teal-500" />
                              <span>{event.location}</span>
                            </div>
                          </div>

                          {event.registration_fee_single > 0 && (
                            <div className="mb-4">
                              <span className="inline-block px-3 py-1 bg-amber-900/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">
                                ₹{event.registration_fee_single}
                                {event.registration_fee_team && event.registration_fee_team !== event.registration_fee_single
                                  ? ` – ₹${event.registration_fee_team}`
                                  : ''}{' '}
                                / {event.team_size_max > 1 ? 'team' : 'person'}
                              </span>
                            </div>
                          )}

                          <Link
                            to={`/events/${event.id}`}
                            className="inline-flex items-center text-teal-400 font-semibold hover:text-teal-300 transition-colors text-sm min-h-[48px]"
                            aria-label={`View ${event.title} details`}
                          >
                            View Details <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
