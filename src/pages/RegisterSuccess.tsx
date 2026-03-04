import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { PageSEO } from '../lib/seo';
import { ROUTES } from '../constants/routes';
import { CheckCircle, Calendar, Share2, ExternalLink, Loader2, Copy, Check, Clock, AlertCircle } from 'lucide-react';
import { formatINR } from '../constants/fees';

interface RegistrationData {
    registration_code: string;
    event_title: string;
    event_date: string;
    event_time: string;
    event_location: string;
    primary_name: string;
    primary_email: string;
    team_members: Array<{ name: string; email: string }>;
    team_size: number;
    fee_amount: number;
    status: string;
    payment_status: string;
    payment_id: string | null;
}

export default function RegisterSuccess() {
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code') || '';
    const [data, setData] = useState<RegistrationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!code) { setLoading(false); return; }
        fetch(`/api/registrations/${code}`)
            .then((res) => res.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [code]);

    const handleCopy = async () => {
        if (!data) return;
        try {
            await navigator.clipboard.writeText(data.registration_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = data.registration_code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const googleCalendarUrl = data
        ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            `VOXERA 2026: ${data.event_title}`
        )}&dates=20260316T043000Z/20260316T063000Z&details=${encodeURIComponent(
            `Registration Code: ${data.registration_code}\nVenue: ${data.event_location}`
        )}&location=${encodeURIComponent(data.event_location || 'JBIET Campus')}`
        : '';

    const whatsappUrl = data
        ? `https://wa.me/?text=${encodeURIComponent(
            `🎉 I just registered for ${data.event_title} at VOXERA 2026!\n\n📋 Registration Code: ${data.registration_code}\n📅 Date: ${data.event_date}\n📍 Venue: ${data.event_location}\n💰 Fee: ${formatINR(data.fee_amount / 100)}\n\nRegister now at voxera2026.in!`
        )}`
        : '';

    // Determine status
    const isConfirmed = data?.status === 'confirmed';
    const isPendingPayment = data?.status === 'pending_payment';
    const isPaymentSubmitted = data?.payment_status === 'payment_submitted' && data?.status !== 'confirmed';

    // Confetti only for confirmed
    const confettiColors = ['#7C3AED', '#F59E0B', '#818CF8', '#10B981', '#F43F5E', '#6D28D9'];

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center bg-[#080810]">
                    <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageSEO
                title={isConfirmed ? "Registration Confirmed" : "Registration Submitted"}
                description={isConfirmed ? "Your registration for VOXERA 2026 has been confirmed!" : "Your registration is being processed."}
            />

            {/* Confetti — only for confirmed */}
            {isConfirmed && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div
                            key={i}
                            className="confetti-piece absolute w-3 h-3 rounded-sm"
                            style={{
                                backgroundColor: confettiColors[i % confettiColors.length],
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="min-h-screen py-20 px-4 flex items-center justify-center bg-[#080810] relative overflow-hidden">
                {/* Aurora */}
                <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-md p-8 text-center shadow-2xl shadow-black/40 relative z-10"
                >
                    {/* Status Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                        className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${isConfirmed
                                ? 'bg-emerald-900/30 text-emerald-400'
                                : isPendingPayment
                                    ? 'bg-red-900/30 text-red-400'
                                    : 'bg-amber-900/30 text-amber-400'
                            }`}
                    >
                        {isConfirmed ? (
                            <CheckCircle className="w-10 h-10" />
                        ) : isPendingPayment ? (
                            <AlertCircle className="w-10 h-10" />
                        ) : (
                            <Clock className="w-10 h-10" />
                        )}
                    </motion.div>

                    {/* Title & Subtitle based on status */}
                    {isConfirmed ? (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                Registration Confirmed! 🎉
                            </h1>
                            <p className="text-white/50 mb-8">You're all set for VOXERA 2026. See you there!</p>
                        </>
                    ) : isPendingPayment ? (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                Payment Required
                            </h1>
                            <p className="text-white/50 mb-4">Your details are saved but payment is still pending.</p>
                            <Link
                                to={`/register?event=${data?.event_title || ''}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-500 transition-all mb-8"
                            >
                                Complete Payment <ExternalLink className="w-4 h-4" />
                            </Link>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                Payment Under Review
                            </h1>
                            <p className="text-white/50 mb-4">
                                Your payment (UTR: <span className="font-mono text-teal-300">{data?.payment_id}</span>) has been submitted.
                            </p>
                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-8 text-sm text-amber-300/80">
                                <p>The organizer will verify your payment and confirm your registration. You'll receive a confirmation email once verified.</p>
                            </div>
                        </>
                    )}

                    {data ? (
                        <div className="space-y-6">
                            {/* Registration Code with Copy */}
                            <div className="p-5 bg-teal-900/20 border border-teal-500/30 rounded-2xl">
                                <p className="text-xs text-teal-300 uppercase tracking-widest mb-2">Registration Code</p>
                                <div className="flex items-center justify-center gap-3">
                                    <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                                        {data.registration_code}
                                    </p>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                                        aria-label="Copy registration code"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-white/50" />
                                        )}
                                    </button>
                                </div>
                                {copied && (
                                    <p className="text-xs text-emerald-400 mt-1">Copied!</p>
                                )}
                            </div>

                            {/* Status Badge */}
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isConfirmed
                                    ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30'
                                    : isPendingPayment
                                        ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                                        : 'bg-amber-900/30 text-amber-400 border border-amber-500/30'
                                }`}>
                                {isConfirmed ? <CheckCircle className="w-4 h-4" /> : isPendingPayment ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                {isConfirmed ? 'Confirmed' : isPendingPayment ? 'Payment Pending' : 'Payment Under Review'}
                            </div>

                            {/* Event Details */}
                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-left space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/40">Event</span>
                                    <span className="text-white font-medium">{data.event_title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/40">Date</span>
                                    <span className="text-white">{data.event_date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/40">Venue</span>
                                    <span className="text-white">{data.event_location}</span>
                                </div>
                                {data.team_members && data.team_members.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Team</span>
                                        <span className="text-white text-right">{data.primary_name}, {data.team_members.map((m) => m.name).join(', ')}</span>
                                    </div>
                                )}
                                <div className="border-t border-white/8 pt-3 flex justify-between">
                                    <span className="text-white/40">Registration Fee</span>
                                    <span className="text-white font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                                        {formatINR(data.fee_amount / 100)}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons — only show share for confirmed/payment_submitted */}
                            {(isConfirmed || isPaymentSubmitted) && (
                                <div className="space-y-3">
                                    <a
                                        href={googleCalendarUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full min-h-[48px] py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                        aria-label="Add to Google Calendar"
                                    >
                                        <Calendar className="w-4 h-4" /> Add to Google Calendar
                                    </a>
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full min-h-[48px] py-3 bg-green-800/80 text-white rounded-2xl font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                        aria-label="Share on WhatsApp"
                                    >
                                        <Share2 className="w-4 h-4" /> Share on WhatsApp
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-white/40">Registration details could not be loaded.</p>
                    )}

                    <Link
                        to={ROUTES.EVENTS}
                        className="inline-flex items-center gap-2 text-teal-400 font-medium hover:text-teal-300 transition-colors mt-8 min-h-[48px]"
                        aria-label="Back to Events"
                    >
                        <ExternalLink className="w-4 h-4" /> Back to Events
                    </Link>
                </motion.div>
            </div>
        </Layout>
    );
}
