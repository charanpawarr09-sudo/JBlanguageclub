import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { VoxeraEvent } from '../data/events';
import { estimateFee, formatINR } from '../constants/fees';
import { trackRegistrationStart } from '../lib/analytics';
import { PageSEO } from '../lib/seo';
import { ROUTES } from '../constants/routes';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Users,
  User,
  ExternalLink,
  Check,
  CreditCard,
  Shield,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const VITE_API_BASE = '';

/* ─────── Types ─────── */
interface TeamMember {
  name: string;
  email: string;
  rollNumber: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  college?: string;
  department?: string;
  yearOfStudy?: string;
  rollNumber?: string;
  event?: string;
  teamMembers?: Record<number, { name?: string; email?: string; rollNumber?: string }>;
  agreed?: string;
}

/* ─────── Fee Structure Text ─────── */
const FEE_DESCRIPTIONS: Record<string, string> = {
  'debate-competition': '₹99 solo / ₹150 team of 2',
  'poetry-reciting': '₹99 per person',
  'pitch-perfect': '₹50 flat',
  'open-mic': '₹99 solo / ₹150 duo',
  'treasure-hunt': '₹120 per person',
  'film-screening': '₹80 per crew member',
};

/* ─────── Load Razorpay script ─────── */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ═══════════════════════════════════════════
   REGISTER PAGE — SECURE 3-STEP FLOW
   Step 1: Fill details → pre-register
   Step 2: Razorpay payment → auto-verify
   Step 3: Payment confirmed → Google Form (new tab) → Registration Complete
   ═══════════════════════════════════════════ */
export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedEventId = searchParams.get('event') || '';

  /* ─── State ─── */
  const [events, setEvents] = useState<VoxeraEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [step, setStep] = useState(1); // 1=Details, 2=Payment, 3=Complete
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [registrationCode, setRegistrationCode] = useState('');

  // Step 1 data
  const [selectedEventId, setSelectedEventId] = useState(preSelectedEventId);
  const [participationType, setParticipationType] = useState<'solo' | 'team'>('solo');
  const [primaryName, setPrimaryName] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [agreed, setAgreed] = useState(false);

  // Step 2/3 data
  const [paymentError, setPaymentError] = useState('');
  const [googleFormUrl, setGoogleFormUrl] = useState<string | null>(null);
  const [formOpened, setFormOpened] = useState(false);

  /* ─── Fetch Events ─── */
  useEffect(() => {
    fetch(`${VITE_API_BASE}/api/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.filter((e: VoxeraEvent) => e.is_published && e.registration_enabled));
        setLoadingEvents(false);
      })
      .catch(() => setLoadingEvents(false));
  }, []);

  /* ─── Derived Values ─── */
  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const allowsTeam = useMemo(() => {
    if (!selectedEvent) return false;
    return selectedEvent.team_size_max > 1;
  }, [selectedEvent]);

  const effectiveTeamSize = useMemo(() => {
    if (!selectedEvent) return 1;
    if (participationType === 'solo') return 1;
    return Math.max(selectedEvent.team_size_min, teamMembers.length + 1);
  }, [selectedEvent, participationType, teamMembers.length]);

  const displayFee = useMemo(
    () => (selectedEventId ? estimateFee(selectedEventId, effectiveTeamSize) : 0),
    [selectedEventId, effectiveTeamSize]
  );

  /* ─── When event changes, reset ─── */
  useEffect(() => {
    if (selectedEvent) {
      setParticipationType(selectedEvent.team_size_min > 1 ? 'team' : 'solo');
      setTeamMembers([]);
      trackRegistrationStart(selectedEvent.id);
    }
  }, [selectedEvent]);

  /* ─── When participation type changes ─── */
  useEffect(() => {
    if (participationType === 'solo') {
      setTeamMembers([]);
    } else if (selectedEvent && teamMembers.length === 0) {
      const minExtra = Math.max(1, selectedEvent.team_size_min - 1);
      setTeamMembers(Array.from({ length: minExtra }, () => ({ name: '', email: '', rollNumber: '' })));
    }
  }, [participationType, selectedEvent]);

  /* ─── Validation ─── */
  const validateStep1 = (): boolean => {
    const errors: FieldErrors = {};

    if (!selectedEventId) errors.event = 'Please select an event.';
    if (!primaryName.trim()) errors.name = 'Full name is required.';
    if (!primaryEmail.trim() || !/\S+@\S+\.\S+/.test(primaryEmail))
      errors.email = 'Valid email address is required.';
    if (!primaryPhone.trim() || !/^[6-9]\d{9}$/.test(primaryPhone.replace(/\s/g, '')))
      errors.phone = 'Valid 10-digit Indian mobile number is required.';
    if (!college.trim()) errors.college = 'College/University name is required.';
    if (!department.trim()) errors.department = 'Department is required.';
    if (!yearOfStudy) errors.yearOfStudy = 'Please select your year of study.';
    if (!rollNumber.trim()) errors.rollNumber = 'Roll number is required.';

    if (participationType === 'team') {
      const tmErrors: Record<number, { name?: string; email?: string; rollNumber?: string }> = {};
      teamMembers.forEach((member, i) => {
        const me: { name?: string; email?: string; rollNumber?: string } = {};
        if (!member.name.trim()) me.name = 'Name is required.';
        if (!member.email.trim() || !/\S+@\S+\.\S+/.test(member.email)) me.email = 'Valid email is required.';
        if (!member.rollNumber.trim()) me.rollNumber = 'Roll number is required.';
        if (Object.keys(me).length > 0) tmErrors[i] = me;
      });
      if (Object.keys(tmErrors).length > 0) errors.teamMembers = tmErrors;
    }

    if (!agreed) errors.agreed = 'You must agree to the event rules to continue.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ─── Submit Step 1 → Pre-Register ─── */
  const handleSubmitStep1 = async () => {
    if (!validateStep1()) return;
    setSubmitting(true);
    setServerError('');

    try {
      const res = await fetch(`${VITE_API_BASE}/api/registrations/pre-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEventId,
          team_size: effectiveTeamSize,
          participation_type: participationType,
          primary_name: primaryName,
          primary_email: primaryEmail,
          primary_phone: primaryPhone,
          college_name: college,
          department,
          year_of_study: yearOfStudy,
          roll_number: rollNumber,
          team_members: teamMembers.map((m) => ({
            name: m.name,
            email: m.email,
            roll_number: m.rollNumber,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Pre-registration failed');

      setRegistrationCode(data.registration_code);
      setStep(2); // Go to payment step
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Step 2 → Razorpay Payment ─── */
  const handleRazorpayPayment = async () => {
    setSubmitting(true);
    setPaymentError('');

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load payment gateway. Please check your internet connection.');

      // Create order on server
      const orderRes = await fetch(`${VITE_API_BASE}/api/registrations/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_code: registrationCode }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');
      if (orderData.already_paid) {
        // Already confirmed — skip to step 3
        setStep(3);
        setSubmitting(false);
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'VOXERA 2026',
        description: `Registration: ${selectedEvent?.title || 'Event'}`,
        order_id: orderData.order_id,
        prefill: {
          name: orderData.name,
          email: orderData.email,
          contact: orderData.phone,
        },
        theme: { color: '#0d9488' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // Verify payment on server
          try {
            const verifyRes = await fetch(`${VITE_API_BASE}/api/registrations/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registration_code: registrationCode,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

            // Payment verified! Save Google Form URL and go to Step 3
            setGoogleFormUrl(verifyData.google_form_url || null);
            setStep(3);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Payment verification failed';
            setPaymentError(msg);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentError('Payment was cancelled. Please try again.');
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setPaymentError(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setPaymentError(message);
      setSubmitting(false);
    }
  };

  /* ─── Open Google Form in new tab ─── */
  const handleOpenGoogleForm = () => {
    if (googleFormUrl) {
      window.open(googleFormUrl, '_blank', 'noopener,noreferrer');
      setFormOpened(true);
    }
  };

  /* ─── Team Member Helpers ─── */
  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const addTeamMember = () => {
    if (!selectedEvent) return;
    const maxExtra = selectedEvent.team_size_max - 1;
    if (teamMembers.length < maxExtra) {
      setTeamMembers((prev) => [...prev, { name: '', email: '', rollNumber: '' }]);
    }
  };

  const removeTeamMember = (index: number) => {
    if (!selectedEvent) return;
    const minExtra = Math.max(1, selectedEvent.team_size_min - 1);
    if (teamMembers.length > minExtra) {
      setTeamMembers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  /* ═══════════════════════════════════════════
     3-STEP INDICATOR
     ═══════════════════════════════════════════ */
  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-10">
      {[
        { num: 1, label: 'Your Details' },
        { num: 2, label: 'Pay Fee' },
        { num: 3, label: 'Complete' },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          {i > 0 && (
            <div className={`w-6 sm:w-12 h-0.5 transition-colors duration-500 ${step > i ? 'bg-teal-500' : 'bg-white/10'}`} />
          )}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${step === s.num
                ? 'bg-gradient-to-r from-teal-600 to-purple-600 text-white shadow-lg shadow-teal-600/40'
                : step > s.num
                  ? 'bg-teal-900/50 text-teal-200'
                  : 'bg-white/5 text-white/30'
                }`}
            >
              {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-[10px] sm:text-xs font-medium hidden sm:inline ${step === s.num ? 'text-teal-300' : step > s.num ? 'text-teal-400/60' : 'text-white/30'
              }`}>
              {s.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  /* ─── Input Classes ─── */
  const inputClass =
    'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all min-h-[48px]';
  const labelClass = 'text-xs font-semibold uppercase tracking-widest text-teal-400 mb-2 block';
  const errorTextClass = 'text-xs text-rose-400 mt-1.5';

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <Layout>
      <PageSEO title="Register" description="Register for VOXERA 2026 events — secure your spot today." />

      <div className="min-h-screen pt-28 pb-20 px-4 flex items-start justify-center bg-[#080810] relative overflow-hidden">
        {/* Aurora Blobs */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl relative z-10 mt-8"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Event Registration
            </h1>
            <p className="text-white/50">Secure your spot at VOXERA 2026.</p>
          </div>

          {stepIndicator}

          {/* Server Error */}
          {serverError && (
            <div className="p-4 mb-6 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{serverError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ═════ STEP 1: Details Form ═════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-md p-6 md:p-8 shadow-2xl shadow-black/40 space-y-7">

                  {/* ── Event Selection ── */}
                  <div>
                    <label className={labelClass}>Select Event</label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      disabled={loadingEvents}
                      className={inputClass + ' appearance-none cursor-pointer'}
                      aria-label="Select Event"
                    >
                      <option value="" disabled>
                        {loadingEvents ? 'Loading events...' : 'Choose an event...'}
                      </option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id} className="bg-[#080810]">
                          {event.title} ({event.category})
                        </option>
                      ))}
                    </select>
                    {fieldErrors.event && <p className={errorTextClass}>{fieldErrors.event}</p>}
                  </div>

                  {/* ── Personal Info ── */}
                  <div>
                    <h3 className={labelClass}>Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <input type="text" value={primaryName} onChange={(e) => setPrimaryName(e.target.value)} className={inputClass} placeholder="Full Name *" aria-label="Full Name" />
                        {fieldErrors.name && <p className={errorTextClass}>{fieldErrors.name}</p>}
                      </div>
                      <div>
                        <input type="email" value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} className={inputClass} placeholder="Email Address *" aria-label="Email" />
                        {fieldErrors.email && <p className={errorTextClass}>{fieldErrors.email}</p>}
                      </div>
                      <div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">+91</span>
                          <input type="tel" value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value)} className={inputClass + ' pl-12'} placeholder="Mobile Number *" aria-label="Mobile Number" />
                        </div>
                        {fieldErrors.phone && <p className={errorTextClass}>{fieldErrors.phone}</p>}
                      </div>
                      <div>
                        <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className={inputClass} placeholder="Roll Number *" aria-label="Roll Number" />
                        {fieldErrors.rollNumber && <p className={errorTextClass}>{fieldErrors.rollNumber}</p>}
                      </div>
                    </div>
                  </div>

                  {/* ── Academic Info ── */}
                  <div>
                    <h3 className={labelClass}>Academic Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <input type="text" value={college} onChange={(e) => setCollege(e.target.value)} className={inputClass} placeholder="College / University *" aria-label="College" />
                        {fieldErrors.college && <p className={errorTextClass}>{fieldErrors.college}</p>}
                      </div>
                      <div>
                        <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} placeholder="Department *" aria-label="Department" />
                        {fieldErrors.department && <p className={errorTextClass}>{fieldErrors.department}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <select value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} className={inputClass + ' appearance-none cursor-pointer'} aria-label="Year of Study">
                          <option value="" disabled className="bg-[#080810]">Year of Study *</option>
                          {['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG / Masters', 'PhD'].map((y) => (
                            <option key={y} value={y} className="bg-[#080810]">{y}</option>
                          ))}
                        </select>
                        {fieldErrors.yearOfStudy && <p className={errorTextClass}>{fieldErrors.yearOfStudy}</p>}
                      </div>
                    </div>
                  </div>

                  {/* ── Participation Type ── */}
                  {selectedEvent && allowsTeam && (
                    <div>
                      <h3 className={labelClass}>Participation Type</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setParticipationType('solo')}
                          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all min-h-[48px] ${participationType === 'solo'
                            ? 'border-teal-500 bg-teal-500/15 text-teal-300'
                            : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                            }`}
                          aria-label="Solo Participation"
                        >
                          <User className="w-4 h-4" /> Solo
                        </button>
                        <button
                          type="button"
                          onClick={() => setParticipationType('team')}
                          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all min-h-[48px] ${participationType === 'team'
                            ? 'border-teal-500 bg-teal-500/15 text-teal-300'
                            : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                            }`}
                          aria-label="Team Participation"
                        >
                          <Users className="w-4 h-4" /> Team
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Team Members ── */}
                  {participationType === 'team' && teamMembers.length > 0 && selectedEvent && (
                    <div>
                      <h3 className={labelClass}>
                        Team Members ({teamMembers.length + 1} / {selectedEvent.team_size_max} max)
                      </h3>
                      <div className="space-y-4">
                        {teamMembers.map((member, index) => (
                          <div key={index} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white/60">Member {index + 2}</span>
                              {teamMembers.length > Math.max(1, selectedEvent.team_size_min - 1) && (
                                <button
                                  type="button"
                                  onClick={() => removeTeamMember(index)}
                                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                              <div>
                                <input type="text" value={member.name} onChange={(e) => updateTeamMember(index, 'name', e.target.value)} className={inputClass} placeholder="Full Name *" aria-label={`Team member ${index + 2} name`} />
                                {fieldErrors.teamMembers?.[index]?.name && (<p className={errorTextClass}>{fieldErrors.teamMembers[index].name}</p>)}
                              </div>
                              <div>
                                <input type="email" value={member.email} onChange={(e) => updateTeamMember(index, 'email', e.target.value)} className={inputClass} placeholder="Email *" aria-label={`Team member ${index + 2} email`} />
                                {fieldErrors.teamMembers?.[index]?.email && (<p className={errorTextClass}>{fieldErrors.teamMembers[index].email}</p>)}
                              </div>
                              <div>
                                <input type="text" value={member.rollNumber} onChange={(e) => updateTeamMember(index, 'rollNumber', e.target.value)} className={inputClass} placeholder="Roll No *" aria-label={`Team member ${index + 2} roll number`} />
                                {fieldErrors.teamMembers?.[index]?.rollNumber && (<p className={errorTextClass}>{fieldErrors.teamMembers[index].rollNumber}</p>)}
                              </div>
                            </div>
                          </div>
                        ))}

                        {teamMembers.length < (selectedEvent.team_size_max - 1) && (
                          <button
                            type="button"
                            onClick={addTeamMember}
                            className="w-full py-2.5 border border-dashed border-white/15 rounded-xl text-white/40 text-sm hover:border-teal-500/40 hover:text-teal-400 transition-all min-h-[48px]"
                          >
                            + Add Team Member
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Fee Display Card ── */}
                  {selectedEvent && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`fee-${selectedEventId}-${effectiveTeamSize}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-2xl border border-teal-500/25 bg-teal-500/8 p-5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold">Registration Fee</span>
                          <span className="text-white font-bold text-2xl" style={{ fontFamily: 'var(--font-mono)' }}>
                            {formatINR(displayFee)}
                          </span>
                        </div>
                        <p className="text-white/40 text-xs">
                          {FEE_DESCRIPTIONS[selectedEventId] || ''} · for{' '}
                          {effectiveTeamSize > 1 ? `team of ${effectiveTeamSize}` : 'individual'}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {/* ── Rules Agreement ── */}
                  <label className="flex items-start gap-3 cursor-pointer group min-h-[48px] p-1">
                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${agreed ? 'bg-teal-600 border-teal-600' : 'border-white/20 bg-transparent group-hover:border-white/40'
                      }`}>
                      {agreed && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only" aria-label="Agree to event rules" />
                    <span className="text-sm text-white/50 leading-relaxed">
                      I agree to the event rules and code of conduct. I understand that the registration fee is non-refundable.
                    </span>
                  </label>
                  {fieldErrors.agreed && <p className={errorTextClass + ' -mt-4 ml-8'}>{fieldErrors.agreed}</p>}

                  {/* ── Submit Button ── */}
                  <button
                    onClick={handleSubmitStep1}
                    disabled={submitting}
                    className="w-full min-h-[48px] py-4 bg-gradient-to-r from-teal-600 to-purple-600 text-white font-bold rounded-2xl hover:from-teal-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 text-base"
                    aria-label="Continue to Payment"
                  >
                    {submitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Saving your details...</>
                    ) : (
                      <>Next: Pay Registration Fee <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═════ STEP 2: RAZORPAY PAYMENT ═════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Success Summary Card */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-emerald-300 font-semibold text-sm">Details Saved Successfully!</p>
                      <p className="text-emerald-400/60 text-xs mt-1">
                        {primaryName} · {selectedEvent?.title} · Code: <span className="font-mono text-emerald-300">{registrationCode}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Card */}
                <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-md p-6 md:p-8 shadow-2xl shadow-black/40 space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                      <CreditCard className="w-7 h-7 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                      Pay Registration Fee
                    </h2>
                    <p className="text-white/50 text-sm">
                      Complete your payment securely via Razorpay. Supports UPI, cards, net banking & more.
                    </p>
                  </div>

                  {/* Fee Amount */}
                  <div className="rounded-2xl border border-teal-500/25 bg-teal-500/8 p-5 text-center">
                    <p className="text-xs uppercase tracking-widest text-teal-400 font-semibold mb-1">Amount to Pay</p>
                    <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatINR(displayFee)}
                    </p>
                    <p className="text-white/40 text-xs mt-1">{selectedEvent?.title}</p>
                  </div>

                  {/* Security Note */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                    <Shield className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-violet-300/70">
                      Payment is processed securely by Razorpay. Your card/UPI details are never stored on our servers.
                    </p>
                  </div>

                  {/* Payment Error */}
                  {paymentError && (
                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{paymentError}</span>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    onClick={handleRazorpayPayment}
                    disabled={submitting}
                    className="w-full min-h-[48px] py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 text-base"
                    aria-label="Pay Now"
                  >
                    {submitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    ) : (
                      <>Pay {formatINR(displayFee)} via Razorpay <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═════ STEP 3: PAYMENT CONFIRMED + GOOGLE FORM ═════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Payment Confirmed Card */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-emerald-300 font-semibold text-sm">Payment Verified Successfully! ✅</p>
                      <p className="text-emerald-400/60 text-xs mt-1">
                        Your registration for <strong className="text-emerald-300">{selectedEvent?.title}</strong> is confirmed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Google Form Section — only if URL exists */}
                {googleFormUrl && !formOpened && (
                  <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-md p-6 md:p-8 shadow-2xl shadow-black/40 space-y-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
                      <ExternalLink className="w-7 h-7 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      One Last Step
                    </h2>
                    <p className="text-white/50 text-sm max-w-md mx-auto">
                      Please complete the Google Form to finalize your entry details. Use the same email: <strong className="text-teal-300">{primaryEmail}</strong>.
                    </p>
                    <button
                      onClick={handleOpenGoogleForm}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/30 text-base"
                    >
                      Open Google Form <ExternalLink className="w-5 h-5" />
                    </button>
                    <p className="text-white/30 text-xs">Opens in a new tab</p>
                  </div>
                )}

                {/* Registration Complete — shown after form opened OR if no form URL */}
                {(formOpened || !googleFormUrl) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
                    className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-md p-8 md:p-10 shadow-2xl text-center space-y-5"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.6, delay: 0.4 }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-900/30 mx-auto"
                    >
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      Registration Complete! 🎉
                    </h2>
                    <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
                      Payment verified, details recorded — you're all set for <strong className="text-teal-300">{selectedEvent?.title}</strong> at VOXERA 2026!
                    </p>

                    {/* Registration Code */}
                    <div className="inline-block p-4 bg-teal-900/20 border border-teal-500/30 rounded-2xl">
                      <p className="text-xs text-teal-300 uppercase tracking-widest mb-1">Your Registration Code</p>
                      <p className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                        {registrationCode}
                      </p>
                    </div>

                    <p className="text-white/30 text-xs">A confirmation email has been sent to <strong className="text-teal-300">{primaryEmail}</strong></p>

                    <button
                      onClick={() => navigate(`${ROUTES.REGISTER_SUCCESS}?code=${registrationCode}`)}
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal-600 to-purple-600 text-white font-semibold rounded-xl hover:from-teal-500 hover:to-purple-500 transition-all min-h-[48px] text-sm shadow-lg shadow-teal-900/30"
                    >
                      View Full Details <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
}
