import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Calendar, DollarSign, BarChart3, School, UserCheck } from 'lucide-react';

interface AnalyticsData {
    totalRegistrations: number; todayRegistrations: number;
    confirmedCount: number; pendingCount: number; cancelledCount: number;
    totalRevenue: number; publishedEvents: number; totalEvents: number;
    registrationsByEvent: Record<string, { event_title: string; count: number; slots_total: number | null }>;
    registrationsOverTime: Record<string, number>;
    topCollege: string; participationSplit: { solo: number; team: number };
}

export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics', { credentials: 'include' })
            .then(r => {
                if (!r.ok) throw new Error('API error');
                return r.json();
            })
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />)}</div>;
    if (!data) return <p className="text-slate-500 text-center py-12">Failed to load analytics</p>;

    const colorMap: Record<string, { icon: string; bar: string }> = {
        violet: { icon: 'text-violet-400', bar: 'bg-violet-500' },
        emerald: { icon: 'text-emerald-400', bar: 'bg-emerald-500' },
        blue: { icon: 'text-blue-400', bar: 'bg-blue-500' },
        amber: { icon: 'text-amber-400', bar: 'bg-amber-500' },
        pink: { icon: 'text-pink-400', bar: 'bg-pink-500' },
        red: { icon: 'text-red-400', bar: 'bg-red-500' },
    };

    const metrics = [
        { label: 'Total Registrations', value: data.totalRegistrations, sub: `${data.todayRegistrations} today`, icon: Users, color: 'violet' },
        { label: 'Confirmed', value: data.confirmedCount, sub: `${data.pendingCount} pending`, icon: UserCheck, color: 'emerald' },
        { label: 'Published Events', value: data.publishedEvents, sub: `${data.totalEvents} total`, icon: Calendar, color: 'blue' },
        { label: 'Total Revenue', value: `₹${(data.totalRevenue / 100).toLocaleString()}`, sub: 'from confirmed', icon: DollarSign, color: 'amber' },
        { label: 'Top College', value: data.topCollege, icon: School, color: 'pink' },
    ];

    const eventEntries = (Object.entries(data.registrationsByEvent) as [string, { event_title: string; count: number; slots_total: number | null }][]).sort((a, b) => b[1].count - a[1].count);
    const maxCount = Math.max(...eventEntries.map(e => e[1].count), 1);
    const timeEntries = Object.entries(data.registrationsOverTime) as [string, number][];
    const maxDaily = Math.max(...timeEntries.map(e => e[1]), 1);

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h2>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {metrics.map((m, i) => (
                    <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <m.icon className={`w-4 h-4 ${colorMap[m.color]?.icon || 'text-slate-400'}`} />
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{m.label}</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{m.value}</p>
                        {'sub' in m && m.sub && <p className="text-slate-500 text-xs mt-0.5">{m.sub}</p>}
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registrations by Event */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-teal-400" /> Registrations by Event</h3>
                    <div className="space-y-3">
                        {eventEntries.slice(0, 10).map(([id, info]) => (
                            <div key={id}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-300 truncate mr-4">{info.event_title}</span>
                                    <span className="text-white font-medium">{info.count}{info.slots_total ? `/${info.slots_total}` : ''}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(info.count / (info.slots_total || maxCount)) * 100}%` }} transition={{ duration: 0.8 }}
                                        className={`h-full rounded-full ${info.slots_total && info.count >= info.slots_total ? 'bg-red-500' : 'bg-gradient-to-r from-teal-600 to-emerald-600'}`} />
                                </div>
                            </div>
                        ))}
                        {eventEntries.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No registration data</p>}
                    </div>
                </div>

                {/* Registrations Over Time */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Last 30 Days</h3>
                    <div className="flex items-end gap-1 h-40">
                        {timeEntries.map(([date, count]) => (
                            <div key={date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                <motion.div initial={{ height: 0 }} animate={{ height: `${(count / maxDaily) * 100}%` }} transition={{ duration: 0.5 }}
                                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t min-h-[2px]" />
                                <div className="hidden group-hover:block absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                    {date.split('-').slice(1).join('/')}: {count}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-600">
                        <span>{timeEntries[0]?.[0]?.split('-').slice(1).join('/')}</span>
                        <span>Today</span>
                    </div>
                </div>

                {/* Participation Split */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4">Participation Type</h3>
                    <div className="flex items-center gap-6">
                        <div className="relative w-32 h-32">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="4" />
                                <circle cx="18" cy="18" r="15" fill="none" stroke="#7c3aed" strokeWidth="4"
                                    strokeDasharray={`${(data.participationSplit.solo / (data.totalRegistrations || 1)) * 94.25} 94.25`}
                                    strokeDashoffset="0"
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s ease' }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white">{data.totalRegistrations}</span>
                                <span className="text-xs text-slate-500">total</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-teal-500" />
                                <div>
                                    <p className="text-white font-medium">Solo: {data.participationSplit.solo}</p>
                                    <p className="text-slate-500 text-xs">{((data.participationSplit.solo / (data.totalRegistrations || 1)) * 100).toFixed(0)}%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                                <div>
                                    <p className="text-white font-medium">Team: {data.participationSplit.team}</p>
                                    <p className="text-slate-500 text-xs">{((data.participationSplit.team / (data.totalRegistrations || 1)) * 100).toFixed(0)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Confirmed', count: data.confirmedCount, barClass: 'bg-emerald-500' },
                            { label: 'Pending', count: data.pendingCount, barClass: 'bg-amber-500' },
                            { label: 'Cancelled', count: data.cancelledCount, barClass: 'bg-red-500' },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-300">{item.label}</span>
                                    <span className="text-white font-medium">{item.count}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(item.count / (data.totalRegistrations || 1)) * 100}%` }} transition={{ duration: 0.8 }}
                                        className={`h-full rounded-full ${item.barClass}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
