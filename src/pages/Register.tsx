import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { VoxeraEvent, events as localEvents } from '../data/events';
import { normalizeEvent } from '../lib/normalizeEvent';
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
} from 'lucide-react';

const VITE_API_BASE = '';

const generateLocalRegistrationCode = () =>
  `OFFLINE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

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
  'film-screening': 'Select a film below',
};

/* ═══════════════════════════════════════════
   REGISTER PAGE — 2-STEP FLOW
   Step 1: Fill details → pre-register
   Step 2: Complete payment/details via Google Form (new tab)
   ═══════════════════════════════════════════ */
export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedEventId = searchParams.get('event') || '';

  /* ─── State ─── */
  const [events, setEvents] = useState<VoxeraEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [step, setStep] = useState(1); // 1=Details, 2=Complete
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
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(null);

  // Step 2 data
  const [googleFormUrl, setGoogleFormUrl] = useState<string | null>(null);
  const [formOpened, setFormOpened] = useState(false);

  /* ─── Fetch Events ─── */
  useEffect(() => {
    const fallback = () => {
      setEvents(localEvents.filter((e) => e.is_published && e.registration_enabled));
      setLoadingEvents(false);
    };

    fetch(`${VITE_API_BASE}/api/events`)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) return null;
        try {
          return await res.json();
        } catch {
          return null;
        }
      })
      .then((data) => {
        if (!Array.isArray(data)) { fallback(); return; }
        const mapped = data
          .filter((e: Record<string, unknown>) => e.is_published && e.registration_enabled)
          .map(normalizeEvent);
        setEvents(mapped.length > 0 ? mapped : localEvents.filter((e) => e.is_published && e.registration_enabled));
        setLoadingEvents(false);
      })
      .catch(fallback);
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

  const displayFee = useMemo(() => {
    if (!selectedEventId || !selectedEvent) return 0;
    // For events with per-round pricing, use the selected round's fee
    if (selectedEvent.rounds && selectedEvent.rounds.length > 0 && selectedRoundIndex !== null) {
      const round = selectedEvent.rounds[selectedRoundIndex] as any;
      if (round?.fee != null && round.fee > 0) return round.fee;
    }
    // Use the event object's own fee fields (works for DB-created events with any ID)
    if (effectiveTeamSize > 1 && selectedEvent.registration_fee_team != null && selectedEvent.registration_fee_team > 0) {
      return selectedEvent.registration_fee_team;
    }
    if (selectedEvent.registration_fee_single != null && selectedEvent.registration_fee_single > 0) {
      return selectedEvent.registration_fee_single;
    }
    // Try hardcoded lookup by event ID
    const hardcoded = estimateFee(selectedEventId, effectiveTeamSize);
    if (hardcoded > 0) return hardcoded;
    // Final fallback: infer fee from event title for admin-created events
    const title = (selectedEvent.title || '').toLowerCase();
    if (title.includes('screening') || title.includes('film')) return 80;
    if (title.includes('poetry') || title.includes('recit')) return 99;
    if (title.includes('debate')) return effectiveTeamSize > 1 ? 150 : 99;
    if (title.includes('pitch')) return effectiveTeamSize > 1 ? 99 : 50;
    if (title.includes('open mic') || title.includes('open-mic')) return effectiveTeamSize > 1 ? 150 : 99;
    if (title.includes('treasure') || title.includes('hunt')) return 120;
    return 0;
  }, [selectedEventId, effectiveTeamSize, selectedRoundIndex, selectedEvent]);

  /* ─── When event changes, reset ─── */
  useEffect(() => {
    if (selectedEvent) {
      setParticipationType(selectedEvent.team_size_min > 1 ? 'team' : 'solo');
      setTeamMembers([]);
      setSelectedRoundIndex(null);
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
    if (selectedEventId === 'film-screening' && selectedRoundIndex === null) errors.event = 'Please select a film to watch.';
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
          selected_round_index: selectedEventId === 'film-screening' ? selectedRoundIndex : undefined,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          // Ignore JSON parse errors – we'll fall back to generic messages below
        }
      }

      const selectedRoundFormUrl =
        selectedEventId === 'film-screening' &&
        selectedRoundIndex !== null &&
        selectedEvent?.rounds &&
        selectedEvent.rounds[selectedRoundIndex]
          ? (selectedEvent.rounds[selectedRoundIndex] as any).google_form_url || null
          : null;

      if (!res.ok) {
        // If backend fails but we have a Google Form URL configured locally
        // (event-level or per-round), fall back so the user can still complete registration.
        const fallbackUrl = selectedRoundFormUrl || selectedEvent?.google_form_url;
        if (fallbackUrl) {
          const localCode = generateLocalRegistrationCode();
          setRegistrationCode(localCode);
          setGoogleFormUrl(fallbackUrl);
          setFormOpened(false);
          setStep(2);
          return;
        }

        const fallbackMessage =
          res.status === 404
            ? 'Registration service is currently unavailable. Please try again in a few minutes or contact the organizers.'
            : 'Pre-registration failed. Please try again.';
        throw new Error((data && data.error) || fallbackMessage);
      }

      setRegistrationCode(data.registration_code);
      setGoogleFormUrl(
        data.google_form_url || selectedRoundFormUrl || selectedEvent?.google_form_url || null
      );
      setFormOpened(false);
      setStep(2); // Go to complete step
    } catch (err: unknown) {
      // Final fallback: if API is unreachable but we have a form URL (event-level or per-round),
      // still move the user to Step 2 with a locally generated code.
      const fallbackUrl =
        (selectedEventId === 'film-screening' &&
          selectedRoundIndex !== null &&
          selectedEvent?.rounds &&
          (selectedEvent.rounds[selectedRoundIndex] as any)?.google_form_url) ||
        selectedEvent?.google_form_url ||
        null;

      if (fallbackUrl) {
        const localCode = generateLocalRegistrationCode();
        setRegistrationCode(localCode);
        setGoogleFormUrl(fallbackUrl);
        setFormOpened(false);
        setStep(2);
      } else {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setServerError(message);
      }
    } finally {
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
     2-STEP INDICATOR
     ═══════════════════════════════════════════ */
  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-10">
      {[
        { num: 1, label: 'Your Details' },
        { num: 2, label: 'Complete' },
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
      <PageSEO title="Register" description="Register for VOXERA 2026 events and secure your spot today." />

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

                  {/* ── Film Selection (for film-screening only) ── */}
                  {selectedEventId === 'film-screening' && selectedEvent?.rounds && selectedEvent.rounds.length > 0 && (
                    <div>
                      <h3 className={labelClass}>Select a Film</h3>
                      <div className="space-y-3">
                        {selectedEvent.rounds.map((round, idx) => {
                          const isSelected = selectedRoundIndex === idx;
                          const fee = (round as any).fee;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedRoundIndex(idx)}
                              className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
                                ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                                : 'border-white/10 bg-white/5 hover:border-amber-500/40'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold text-sm ${isSelected ? 'text-amber-300' : 'text-white/80'}`}>
                                  {round.title}
                                </span>
                                {fee && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isSelected
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-white/5 text-white/40 border border-white/10'
                                    }`}>
                                    ₹{fee}
                                  </span>
                                )}
                              </div>
                              <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{round.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                          {FEE_DESCRIPTIONS[selectedEventId] || (
                            selectedEvent.registration_fee_team
                              ? `₹${selectedEvent.registration_fee_single} solo / ₹${selectedEvent.registration_fee_team} team`
                              : `₹${selectedEvent.registration_fee_single} per person`
                          )} · for{' '}
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
                    aria-label="Continue"
                  >
                    {submitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Saving your details...</>
                    ) : (
                      <>Next: Complete Registration <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═════ STEP 2: COMPLETE (GOOGLE FORM) ═════ */}
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

                {!formOpened && (
                  <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-md p-6 md:p-8 shadow-2xl shadow-black/40 space-y-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
                      <ExternalLink className="w-7 h-7 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                      Complete Your Registration
                    </h2>
                    <p className="text-white/50 text-sm max-w-md mx-auto">
                      Open the form below to complete the payment/confirmation for <strong className="text-teal-300">{selectedEvent?.title}</strong>. Use the same email: <strong className="text-teal-300">{primaryEmail}</strong>.
                    </p>

                    <div className="rounded-2xl border border-teal-500/25 bg-teal-500/8 p-5 text-center">
                      <p className="text-xs uppercase tracking-widest text-teal-400 font-semibold mb-1">Amount</p>
                      <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatINR(displayFee)}
                      </p>
                      <p className="text-white/40 text-xs mt-1">{selectedEvent?.title}</p>
                    </div>

                    {googleFormUrl ? (
                      <>
                        <button
                          onClick={handleOpenGoogleForm}
                          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/30 text-base"
                        >
                          Open Google Form <ExternalLink className="w-5 h-5" />
                        </button>
                        <p className="text-white/30 text-xs">Opens in a new tab</p>
                      </>
                    ) : (
                      <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-2xl text-amber-300/90 text-sm">
                        Form link not available for this selection yet. Please contact the organizers.
                      </div>
                    )}
                  </div>
                )}

                {formOpened && (
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
                      Registration Submitted! 🎉
                    </h2>
                    <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
                      Your details are recorded. After you complete the form/payment, the organizers will verify and confirm your entry for <strong className="text-teal-300">{selectedEvent?.title}</strong>.
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
