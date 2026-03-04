# VOXERA 2026 — Product Requirements Document

> **Document Metadata**

| Field | Value |
|---|---|
| Product Name | VOXERA 2026 — College Cultural & Literary Festival Website |
| Organized By | JB Language Club |
| Document Version | 2.0.0 |
| Status | Final Draft |
| Document Owner | Product Manager — Tech Team |
| Last Updated | February 2026 |
| Confidentiality | Internal — Development & Design Team |
| Target Launch | March 1, 2026 (soft launch) · March 16, 2026 (event) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Target Audience](#3-target-audience)
4. [Current Problems & Gaps](#4-current-problems--gaps)
5. [Feature Requirements](#5-feature-requirements)
   - 5.1 [Page Completion Plan](#51-page-completion-plan)
   - 5.2 [Event Management System](#52-event-management-system)
   - 5.3 [Registration & Payment System](#53-registration--payment-system)
   - 5.4 [Registration Fees](#54-registration-fees)
   - 5.5 [Admin Dashboard](#55-admin-dashboard)
   - 5.6 [Google Forms Integration](#56-google-forms-integration)
   - 5.7 [Debate Event Specification](#57-debate-event-specification)
6. [UI/UX Improvement Plan](#6-uiux-improvement-plan)
7. [Technical Architecture](#7-technical-architecture)
8. [Database Schema](#8-database-schema)
9. [Security Requirements](#9-security-requirements)
10. [Performance Optimization](#10-performance-optimization)
11. [SEO & Analytics](#11-seo--analytics)
12. [Production Readiness Checklist](#12-production-readiness-checklist)
13. [Future Scalability Roadmap](#13-future-scalability-roadmap)
14. [Timeline & Milestones](#14-timeline--milestones)

---

## 1. Executive Summary

**VOXERA 2026** is the flagship two-day cultural and literary festival hosted by JB Language Club on **March 16–17, 2026**. The festival features six competitive events spanning literary arts, performance, entrepreneurship, and entertainment — designed for college students seeking a platform to express, compete, and connect.

The current website is a **partially built React + TypeScript + Vite application** backed by an Express server and SQLite database. While the codebase demonstrates a strong visual direction (dark theme, violet accent, Framer Motion animations), several production-critical systems are absent or incomplete. Most critically, there is **no working payment gateway**, **no confirmation email system**, **admin credentials are exposed in frontend source code**, and **Google Form integration exists conceptually but not technically**.

This PRD defines the complete specification to transform the existing prototype into a **polished, secure, production-grade event platform** — capable of handling hundreds of registrations, processing payments, sending automated emails, and providing organizers with real-time data visibility.

### Summary of Scope

| Dimension | Current State | Target State |
|-----------|---------------|--------------|
| Pages | 7 pages (several incomplete) | 11 pages (all production-ready) |
| Payment | None | Razorpay integrated |
| Email | None | Automated confirmation emails |
| Auth | Hardcoded client-side password | Server-side JWT auth |
| Database | SQLite (file-based) | PostgreSQL (cloud-hosted) |
| Google Forms | No integration | Embedded + DB sync |
| Mobile UX | Partial | Mobile-first, fully responsive |
| SEO | None | Full meta, OG, sitemap |
| Analytics | None | Google Analytics 4 + Hotjar |

---

## 2. Product Vision

> *"VOXERA's website must be as commanding as the event itself — a premium, immersive digital stage that doesn't just inform, but inspires action."*

**We are building more than a registration website.** We are building the digital identity of VOXERA — a brand asset that:

- Creates immediate excitement and credibility the moment someone lands on it
- Converts curious visitors into registered, paying participants within minutes
- Empowers the organizing team with zero-friction content and data management
- Establishes VOXERA as the benchmark for collegiate event websites in the region

**North Star Metric:** Every design decision, feature, and technical choice should maximize **Registration Conversion Rate** — the percentage of homepage visitors who complete a paid registration.

---

## 3. Target Audience

### 3.1 Primary Users — Event Participants

#### Persona A: The Competitive Student
- **Profile:** 19–22 years old, undergraduate, academically engaged
- **Goal:** Find relevant events, understand rules and fees, register quickly
- **Device:** 70% mobile (Android/Chrome), 30% desktop
- **Behavior:** Arrives via WhatsApp/Instagram link shared by friends; has short attention span; makes decisions within 60 seconds of landing
- **Pain Point:** Confused by vague event descriptions or unclear fee structures; abandons if checkout is slow
- **Success:** Registered and paid within 3 minutes of first visit

#### Persona B: The Arts Enthusiast
- **Profile:** 20–23 years old, interested in poetry, open mic, or film
- **Goal:** Discover creative events, feel emotionally connected to the brand, share with peers
- **Device:** Mix of mobile and laptop
- **Behavior:** Scrolls fully, reads descriptions carefully, visits social media links, registers after 2–3 days
- **Pain Point:** Generic or ugly websites kill enthusiasm; needs visual inspiration
- **Success:** Registered and shared the event with 3+ friends

### 3.2 Secondary Users — Organizers & Admins

#### Persona C: The Event Coordinator (Admin)
- **Profile:** 23–26 years old, club lead or tech volunteer
- **Goal:** Manage registrations, update event info, export data, monitor payment status
- **Device:** Desktop (Windows/Mac, Chrome)
- **Behavior:** Uses admin panel 5–10 times/day during event week; needs fast, filterable tables
- **Pain Point:** Manual registration tracking via spreadsheets is error-prone and time-consuming
- **Success:** Can manage all event data from a single dashboard without touching code

#### Persona D: The Faculty Observer / Sponsor
- **Profile:** 35–55 years old, department head or sponsor representative
- **Goal:** Verify event credibility and professionalism; forward to students
- **Device:** Desktop or tablet
- **Behavior:** Visits homepage only; judges quality by visual polish
- **Success:** Impressed by professionalism; approves/endorses the event

---

## 4. Current Problems & Gaps

### 4.1 Critical Severity — Blockers for Launch

| ID | Problem | Location | Impact |
|----|---------|----------|--------|
| C-01 | **No payment gateway** — registrations collect data but no fees | `Register.tsx`, `server.ts` | Zero revenue; event fees not collected |
| C-02 | **Admin password hardcoded in frontend** — `'JBCLUB@10102026'` visible in source | `Admin.tsx:L47` | Full admin access to anyone inspecting JS bundle |
| C-03 | **No email confirmation** — registrants get no acknowledgment after submitting | `server.ts` (no mailer) | Trust failure; no audit trail for participants |
| C-04 | **SQLite in production** — no concurrency support, file-based, single-write | `db.ts` | Data corruption risk under simultaneous registrations |
| C-05 | **No registration fee enforcement** — `teamSize` and fee structure not in DB schema | `events.ts` data | Cannot bill correctly per team configuration |
| C-06 | **Schedule page uses static data** — changes in admin panel not reflected | `Schedule.tsx:L5` | Admin CRUD is functionally broken for schedule |

### 4.2 High Severity — Must Fix Before Launch

| ID | Problem | Location | Impact |
|----|---------|----------|--------|
| H-01 | **No mobile nav menu** — no hamburger implementation for small screens | `Navbar.tsx` | Entire navigation broken on mobile (majority of users) |
| H-02 | **Home page is incomplete** — missing About, Stats, Sponsors, final CTA sections | `Home.tsx` | Low conversion; uninspiring first impression |
| H-03 | **No 404 / error boundary page** — broken routes crash with blank screen | Missing | Bad UX; SEO penalty for crawl errors |
| H-04 | **Currency wrong** — prizes displayed as `$` (USD) instead of `₹` (INR) | `events.ts` | Credibility issue; incorrect information |
| H-05 | **All images are placeholders** — Loremflickr URLs used throughout | `events.ts` | Unprofessional; random images on every reload |
| H-06 | **No SEO metadata** — no title tags, Open Graph, or Twitter Cards | `index.html` | Zero social shareability; no search indexing |
| H-07 | **No Google Forms integration** — forms exist but are not embedded or synced | All event pages | Disconnected user experience; data siloed in Google |

### 4.3 Medium Severity — Important for Quality

| ID | Problem | Location | Impact |
|----|---------|----------|--------|
| M-01 | Countdown timer missing from hero | `Home.tsx` | Urgency not communicated |
| M-02 | Framer Motion animations are minimal; hero lacks depth | Multiple pages | Aesthetic feel below potential |
| M-03 | No custom font stack loaded | `index.css` | Generic, system-font appearance |
| M-04 | No analytics instrumentation | Entire app | Cannot measure conversions or optimize |
| M-05 | Contact form data not persisted (no DB insert) | `server.ts` | Messages may be lost |
| M-06 | Event detail "Register" button has no pre-selection logic | `EventDetails.tsx` | Extra friction in registration flow |
| M-07 | No accessibility attributes (ARIA, focus rings) | Multiple | WCAG non-compliant |

---

## 5. Feature Requirements

### 5.1 Page Completion Plan

#### 5.1.1 Home Page (`/`) — Major Rework

**Current State:** Hero section + 3 event cards. No other content.

**Required Additions:**

| Section | Description | Priority |
|---------|-------------|----------|
| Hero — Countdown Timer | Live countdown (Days/Hours/Minutes/Seconds) to March 16, 2026 | P0 |
| Hero — Dual CTAs | "Register Now" (primary) + "Explore Events" (secondary) buttons | P0 |
| Stats Strip | Animated counters: Total Events, Expected Participants, Total Prize Pool | P1 |
| About VOXERA | 2-column section: festival description + key highlights / features | P1 |
| Featured Events | Top 3 events from live API (already partially implemented) | P0 |
| Event Categories | Icon grid: Literary, Cultural, Informal, Management | P2 |
| Sponsors / Partners | Logo grid with link-out, fetched from admin | P2 |
| Final CTA Block | "Register Before Slots Fill Up" section with animated urgency indicator | P1 |
| Footer | Complete footer with nav links, social icons, contact info, copyright | P0 |

#### 5.1.2 Events Page (`/events`) — Enhancement

**Required Additions:**
- Category filter tabs (All / Literary / Cultural / Informal / Management)
- Search bar (client-side fuzzy search)
- Registration fee badge on each event card
- Team size badge on each event card
- Empty state for when no events match filter

#### 5.1.3 Event Detail Page (`/events/:id`) — Enhancement

**Required Additions:**
- Registration fee prominently displayed (single + team pricing if applicable)
- "Register for this Event" CTA button pre-selects event on `/register?event=<id>`
- Embedded Google Form (iframe below event details)
- Social share buttons: WhatsApp, Instagram link, Copy URL
- Related events section (same category, bottom of page)
- Structured event metadata: Date, Time, Venue, Team Size, Category, Prize

#### 5.1.4 Schedule Page (`/schedule`) — Bug Fix + Enhancement

**Critical Fix:** Replace static import `from '../data/events'` with live API call `fetch('/api/events')`.

**Enhancements:**
- Day 1 / Day 2 filter toggle
- List view + Timeline view toggle (both fully responsive)

#### 5.1.5 Register Page (`/register`) — Major Rework

- Pre-populated event selector from URL query param
- Real-time fee display for selected event + team configuration
- Team member input (dynamic: add/remove members, bounded by event's `teamSize`)
- Client-side validation before payment step
- Razorpay payment modal integration
- On success: store registration with `payment_id` in DB → send confirmation email → redirect to success page

#### 5.1.6 Contact Page (`/contact`) — Minor Fix

- Ensure form submission persists to `contact_submissions` table in DB
- Admin email notification on new contact submission
- Google Maps embed for venue location

#### 5.1.7 New Pages to Create

| Page | Route | Purpose |
|------|-------|---------|
| About | `/about` | Club history, team members, past editions |
| Registration Success | `/register/success` | Post-payment confirmation with registration ID |
| 404 Not Found | `*` | Custom branded error page with navigation prompt |
| Admin Login | `/admin/login` | Separate hardened login page (replace inline password check) |

---

### 5.2 Event Management System

#### 5.2.1 Event Data Model Enhancements

The current `VoxeraEvent` interface requires the following additions:

```typescript
interface VoxeraEvent {
  // Existing fields...
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory;
  image: string;
  rules: string[];
  teamSize: string;
  prize: string;
  rounds?: Round[];

  // NEW REQUIRED FIELDS:
  registration_fee_single: number;      // Fee for individual registration (INR)
  registration_fee_team: number | null; // Fee for team registration (INR), null if N/A
  max_team_size: number;                // Maximum members per team (1 for individual)
  min_team_size: number;                // Minimum members per team (1 for individual)
  registration_enabled: boolean;        // Toggle registration on/off
  is_published: boolean;                // Toggle visibility on public pages
  google_form_url: string | null;       // Embedded Google Form URL
  slots_total: number | null;           // Max registrations (null = unlimited)
  slots_filled: number;                 // Count of confirmed registrations
  judging_criteria: string[];           // Judging criteria list
  coordinators: EventCoordinator[];     // Event POC contacts
  banner_image: string;                 // High-res banner for event detail page
  thumbnail_image: string;              // Card thumbnail
}

interface EventCoordinator {
  name: string;
  phone: string;
  role: string;
}
```

#### 5.2.2 Event CRUD via Admin Panel

All events must be fully manageable via the admin dashboard without code changes:

- **Create** new events with all fields above
- **Edit** existing events including toggling visibility and registration
- **Delete** events (soft delete — archive, do not hard delete)
- **Reorder** events (drag-to-reorder for homepage featured display)
- **Duplicate** event as template for future editions
- **Preview** event as public user before publishing

#### 5.2.3 Slot Management

- Track `slots_total` and `slots_filled` per event
- Automatically disable registration when `slots_filled >= slots_total`
- Display "X spots remaining" on event cards as slots fill up
- Display "Registration Closed" badge when full

---

### 5.3 Registration & Payment System

#### 5.3.1 Registration Flow (Step-by-Step)

```
Step 1: Event Selection
  → User selects event from dropdown (or pre-selected via URL param)
  → System displays event details, rules, team size requirements, and fee

Step 2: Participant Details
  → Primary registrant: Name, Email, Phone, College, Department, Year
  → Team members (if applicable): Name, Email per additional member
  → System validates all required fields

Step 3: Fee Review & Consent
  → Display itemized fee breakdown
  → Registration Fee: ₹XX (per person / per team)
  → Convenience Fee: ₹0 (absorbed by organizers)
  → Total Amount: ₹XX
  → Checkbox: "I agree to the event rules and code of conduct"

Step 4: Payment
  → Redirect to Razorpay payment modal
  → Accepted: UPI, Net Banking, Debit/Credit Card, Wallets
  → On SUCCESS: Razorpay returns payment_id + order_id

Step 5: Confirmation
  → System stores registration + payment metadata in DB
  → Automated confirmation email sent to primary registrant
  → Redirect to /register/success?id=<registration_id>
  → Success page shows: Registration ID, Event, Date, Venue, Team, Amount Paid

Step 6: On Payment Failure
  → Show error message with failure reason from Razorpay
  → Preserve form data (do NOT clear on failure)
  → Offer "Retry Payment" button (re-initiate Razorpay with same order)
  → Offer "Pay Later" option (saves pending registration, sends reminder email)
```

#### 5.3.2 Email Confirmation Template

The confirmation email must include:

```
Subject: ✅ You're registered for [Event Name] — VOXERA 2026!

Body:
- VOXERA logo + brand header
- Registration confirmed message
- Registration ID: VX-2026-XXXX
- Event: [Name]
- Date & Time: [Date] at [Time]
- Venue: [Location]
- Team Members (if applicable): [List]
- Amount Paid: ₹XX (Payment ID: pay_XXXXXXX)
- Rules reminder (brief)
- Contact info for queries
- "Add to Google Calendar" button link
- VOXERA footer with social links
```

Email Service: **Resend** (primary) or **NodeMailer + Gmail SMTP** (fallback).

#### 5.3.3 Razorpay Integration Architecture

```
Client (React)
  → POST /api/orders (with event_id + team_size)
  → Server creates Razorpay Order via Razorpay SDK
  → Returns { order_id, amount, currency, key_id }
  → Client opens Razorpay modal with order details
  → User completes payment on Razorpay
  → Razorpay triggers webhook → POST /api/webhooks/razorpay
  → Server verifies webhook signature (HMAC-SHA256)
  → Server updates registration status to 'confirmed'
  → Server sends confirmation email
  → Client polls /api/registrations/:id for status OR receives redirect
```

**Critical:** Never trust client-side payment success alone. Always verify via webhook or server-side signature verification.

---

### 5.4 Registration Fees

This section defines the authoritative fee structure for VOXERA 2026. All fees are in **Indian Rupees (₹)**. This data must be stored in the database and enforced server-side — never trust fee amounts sent from the client.

#### 5.4.1 Fee Schedule

| Event | Participation Type | Fee (₹) | Notes |
|-------|--------------------|---------|-------|
| **Debate Competition** | Single | ₹99 | Individual entry |
| **Debate Competition** | Team of 2 | ₹150 | Per team (both members) |
| **Treasure Hunt** | Per Team (4 members) | ₹120 | Fixed per team |
| **Pitch Perfect** | Individual/Team | ₹50 | Per person or per team |
| **Open Mic** | Single | ₹99 | Individual entry |
| **Open Mic** | 2 People | ₹150 | Per pair |
| **Poetry Reciting** | Per Person | ₹99 | Individual only |
| **Film Screening** | Per Person | ₹80 | Per crew member |

#### 5.4.2 Fee Logic Rules

```typescript
// Pseudo-code for dynamic fee calculation
function calculateFee(eventId: string, teamSize: number): number {
  const event = getEvent(eventId);

  switch (eventId) {
    case 'debate-competition':
      return teamSize === 1 ? 99 : 150;

    case 'treasure-hunt':
      return 120; // Fixed per team regardless of member count

    case 'pitch-perfect':
      return 50; // Fixed flat fee

    case 'open-mic':
      return teamSize === 1 ? 99 : 150;

    case 'poetry-reciting':
      return 99 * teamSize; // Per person

    case 'film-screening':
      return 80 * teamSize; // Per crew member

    default:
      throw new Error('Unknown event');
  }
}
```

#### 5.4.3 Fee Display Requirements

- Show registration fee prominently on every event card (badge format)
- On the registration page: dynamically update the displayed fee as user selects event and team size
- On the payment review step: show itemized breakdown before charging
- On the confirmation page and email: show exact amount paid with Razorpay Payment ID

---

### 5.5 Admin Dashboard

#### 5.5.1 Authentication

**Current Problem:** Password `'JBCLUB@10102026'` is hardcoded in the React component and ships in the JS bundle — anyone can find it with DevTools.

**Solution:** Implement proper server-side authentication:

```
POST /api/auth/login
  Body: { username, password }
  → Server validates against hashed password in DB (bcrypt)
  → Returns JWT token (signed, 24h expiry)
  → Client stores in httpOnly cookie (NOT localStorage)

Middleware: verifyAdmin(req, res, next)
  → Checks Authorization: Bearer <token>
  → Validates JWT signature
  → Attaches admin user to req.user
  → Applied to all /api/admin/* routes
```

#### 5.5.2 Dashboard Overview Tab

- Total registrations count (all time + today)
- Revenue collected (total confirmed payments in ₹)
- Per-event registration breakdown (table + bar chart)
- Recent registrations feed (last 10, live-refreshing)
- Pending payments count (initiated but not confirmed)

#### 5.5.3 Registrations Tab

| Feature | Description |
|---------|-------------|
| Full data table | All fields: ID, Name, Email, Phone, Event, Team, Amount, Status, Date |
| Search | Real-time search by name, email, or registration ID |
| Filter | By event, payment status (pending/confirmed/failed), date range |
| Sort | Clickable column headers for all fields |
| Export | One-click CSV export (filtered or all) |
| Individual actions | View full details, mark as present (check-in), refund flag |

#### 5.5.4 Events Management Tab

- List of all events with toggle switches for `is_published` and `registration_enabled`
- Edit button → opens full event edit modal
- Create new event button
- Slot fill indicator (progress bar: X/Y registered)
- Quick stats per event: registrations count, revenue

#### 5.5.5 Site Settings Tab

- Edit hero title, tagline, hero background image
- Contact email and phone (used in emails and footer)
- Social media URLs (Instagram, Twitter, LinkedIn)
- Sponsors management: add/remove/reorder sponsor logos
- Event announcement banner (show/hide, edit text, set expiry)
- Maintenance mode toggle

#### 5.5.6 Contact Submissions Tab

- View all contact form submissions in a table
- Filter by status: New / Read / Replied
- Mark as read, archive, or delete

#### 5.5.7 Analytics Tab (Embedded)

- Embedded Google Analytics 4 dashboard (via GA4 Data API or simple iframe)
- Key metrics: Page views, Unique visitors, Top pages, Registration funnel drop-off

---

### 5.6 Google Forms Integration

Each VOXERA event has an associated Google Form for registration. The integration strategy must balance ease of use with data ownership.

#### 5.6.1 Current Google Form URLs

| Event | Google Form URL |
|-------|----------------|
| Debate | https://forms.gle/Tu7nF2xuPe6bGG1aA |
| Poetry | https://forms.gle/gRye4xaCtEpuXWLc7 |
| Pitch Perfect | https://forms.gle/B5xCvuGFv33ZDaS8A |
| Open Mic | https://forms.gle/eKtGg9opFuhR4sm2A |

#### 5.6.2 Integration Approaches (Compared)

| Approach | Description | Pros | Cons | Recommendation |
|----------|-------------|------|------|----------------|
| **A. Iframe Embed** | Embed Google Form directly in event page using `<iframe>` | Zero backend work | Data only in Google Sheets; no DB sync; poor mobile UX; no custom styling | ❌ Not recommended as primary |
| **B. Google Forms API + Webhook** | Use Apps Script to POST responses to backend webhook | Automatic sync; data in both places | Requires Google account setup; Apps Script can be unreliable | ⚠️ Viable but fragile |
| **C. Zapier / Make.com** | No-code automation: Google Sheets trigger → POST to backend | Easy to set up | Paid service beyond free tier; adds dependency; slight delay | ⚠️ Good short-term |
| **D. Custom Form (Recommended)** | Replace Google Forms with native website forms | Full control; seamless UX; integrated payment; zero data fragmentation | More dev effort (2–3 hours per event) | ✅ **Strongly recommended** |

#### 5.6.3 Recommended Implementation Strategy

**Phase 1 (Immediate — for existing forms):**
- Embed Google Forms via `<iframe>` on each event detail page as a fallback
- Set up Apps Script webhook on each Google Sheet to POST responses to `/api/webhooks/google-forms`
- Backend stores inbound webhook data in `google_form_submissions` table

```javascript
// Google Apps Script (paste into Form's linked Sheet → Extensions → Apps Script)
function onFormSubmit(e) {
  const data = {
    form_name: "debate",
    timestamp: e.values[0],
    name: e.values[1],
    email: e.values[2],
    phone: e.values[3],
    // ... map all fields
  };

  UrlFetchApp.fetch('https://yourdomain.com/api/webhooks/google-forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': 'YOUR_SECRET' },
    payload: JSON.stringify(data)
  });
}
```

**Phase 2 (Preferred — within 2 weeks):**
- Build native registration forms per event within the website
- Migrate all participants to use the native form + Razorpay payment
- Retire Google Form embeds
- All data flows through a single unified system

#### 5.6.4 Admin Sync View

- Admin panel shows a "Google Form Submissions" sub-tab
- Displays all webhook-received entries
- Admin can manually link a Google Form submission to a confirmed registration
- Export button for Google Form responses as CSV

---

### 5.7 Debate Event Specification

This section defines the complete content specification for the Debate Competition event page.

#### Event Identity

| Field | Value |
|-------|-------|
| Event ID | `debate-competition` |
| Title | Debate Competition |
| Subtitle | Words Have Power — VOXERA Edition |
| Category | Literary |
| Date | March 16, 2026 |
| Time | 10:00 AM – 1:00 PM |
| Venue | Seminar Hall |
| Team Size | 1–2 participants |
| Registration Fee | ₹99 (Single) · ₹150 (Team of 2) |

#### Description

```
Words have power — and at VOXERA, we turn opinions into impact.

The Debate Competition at VOXERA is a dynamic platform where ideas clash,
perspectives evolve, and voices rise with confidence. Whether you're a seasoned
debater or a first-time orator, this is your stage to speak truth to power
and challenge the status quo.
```

#### Event Structure

| Round | Name | Format |
|-------|------|--------|
| Round 1 | Preliminary | Topic assigned; individual judging; top performers advance |
| Round 2 | Semi-Final | Elevated difficulty; new topic; evaluated on argumentation depth |
| Round 3 | Final | Championship round; new topic; full judging panel |

**Note:** A new debate topic is introduced at each round. Participants are evaluated individually. Qualification from each round is mandatory to advance.

#### Judging Criteria

| Criterion | Weight |
|-----------|--------|
| Confidence & Stage Presence | High |
| Clarity of Thought | High |
| Speaking Skills | High |
| Critical Thinking | High |
| Logical Reasoning | High |
| Rebuttals | Medium |
| Time Management | Medium |
| Overall Impact | Medium |

#### Official Rules

1. Participants must strictly follow the allocated time limit for each speaking slot.
2. Respectful conduct toward judges, opponents, and audience is mandatory at all times.
3. Use of mobile phones or internet resources during the preparation/speaking period is prohibited.
4. Topics will be disclosed 15 minutes before each round commences.
5. Judges' decision is final and binding. No appeals will be entertained.
6. Participants must be present at the venue 15 minutes before the scheduled start time.
7. Late arrivals may be disqualified at the discretion of the organizing committee.

#### Coordinators

- To be populated by admin before launch (name, phone, role)

---

## 6. UI/UX Improvement Plan

### 6.1 Design Direction

VOXERA must embody a **premium dark-luxury festival aesthetic** — the visual language of high-concept music events, creative-tech summits, and editorial fashion. The current codebase already establishes a dark/violet foundation; the goal is to elevate it from "nice dark website" to "exceptional premium experience."

> **Design Keywords:** Dark Elegance · Neon Precision · Cinematic Depth · Editorial Boldness · Micro-Refinement

**Reference Inspirations:**
- Notion.so — clean typography, generous whitespace
- Vercel.com — dark luxury, crisp layout hierarchy
- Linear.app — precision micro-interactions, system-level polish
- FKJ / music festival sites — emotional, immersive hero sections

---

### 6.2 Color Palette

#### Core Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--bg-primary` | Deep Obsidian | `#030712` | Page base background |
| `--bg-secondary` | Midnight Slate | `#0F172A` | Cards, panels, modals |
| `--bg-elevated` | Dark Violet Mist | `#1E1B4B` | Hover states, active card |
| `--border` | Dim Slate Border | `#1E293B` | Card and section dividers |
| `--border-glow` | Violet Glow Border | `rgba(124,58,237,0.3)` | Focus states, highlighted cards |

#### Accent Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--accent-primary` | Electric Violet | `#7C3AED` | CTAs, primary buttons |
| `--accent-secondary` | Amber Gold | `#F59E0B` | Badges, prizes, star elements |
| `--accent-soft` | Lavender Indigo | `#818CF8` | Borders, outlines, icon accents |
| `--accent-glow` | Violet Halo | `rgba(124,58,237,0.15)` | Box shadows on hover |

#### Text Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--text-primary` | Luminous White | `#F8FAFC` | Headings, important labels |
| `--text-secondary` | Muted Slate | `#94A3B8` | Body copy, descriptions |
| `--text-tertiary` | Dim Slate | `#475569` | Timestamps, secondary metadata |

#### Semantic Palette

| State | Color | Hex |
|-------|-------|-----|
| Success | Emerald | `#10B981` |
| Warning | Amber | `#F59E0B` |
| Error | Rose | `#F43F5E` |
| Info | Sky | `#38BDF8` |

#### Gradient Definitions

```css
/* Hero title gradient */
.gradient-title {
  background: linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 40%, #F59E0B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Primary button gradient */
.gradient-cta {
  background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
}

/* Card glow on hover */
.card-hover-glow {
  box-shadow: 0 0 0 1px rgba(124,58,237,0.4), 0 20px 60px rgba(124,58,237,0.15);
}

/* Aurora hero background */
.aurora-bg {
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.3) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(245,158,11,0.1) 0%, transparent 50%),
              #030712;
}
```

---

### 6.3 Typography

#### Font Stack

| Role | Font Family | Weight | Size | Notes |
|------|-------------|--------|------|-------|
| Display / Hero | **Clash Display** | 700 | 72px–120px | VOXERA title; import from CDN |
| Headings H1–H2 | **DM Sans** or **Inter** | 700 | 36px–56px | Section titles |
| Headings H3–H4 | **Inter** | 600 | 20px–28px | Card titles, subsections |
| Body | **Inter** | 400–500 | 15px–18px | Paragraphs, form labels |
| Monospace / IDs | **JetBrains Mono** | 400 | 13px–14px | Registration IDs, timestamps, stats |
| Tagline / Accent | **Bricolage Grotesque** | 300 | 18px–22px | Italicized subtitles, taglines |

#### Google Fonts Import (Optimized)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400&family=Bricolage+Grotesque:ital,wght@1,300&display=swap" rel="stylesheet">
```

**For Clash Display:** Use Fontshare CDN:
```html
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
```

#### Typography Scale

```css
/* Tailwind custom config additions */
fontSize: {
  'display-xl': ['clamp(4rem, 10vw, 9rem)', { lineHeight: '1', letterSpacing: '-0.04em' }],
  'display-lg': ['clamp(3rem, 7vw, 6rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
  'display-md': ['clamp(2rem, 5vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
}
```

---

### 6.4 Layout Improvements

#### Grid System
- **Max content width:** `max-w-7xl` (1280px) centered with `mx-auto`
- **Section padding:** `py-24 md:py-32` for breathing room between sections
- **Container padding:** `px-6 md:px-8 lg:px-12`
- **Card gap:** `gap-6 md:gap-8`
- **Base unit:** 8px grid (use Tailwind 2-unit multiples: `p-4=16px`, `p-8=32px`, etc.)

#### Layout Patterns
- **Hero:** Full-viewport-height, centered content, layered backgrounds (gradient + noise texture + aurora animation)
- **Features/Events:** 3-column grid on desktop → 2-column tablet → 1-column mobile
- **Event Detail:** 2-column (content 60% + sidebar 40%) on desktop → stacked on mobile
- **Admin Dashboard:** Sidebar nav (fixed) + main content area with tab panels

#### Spacing Rules
- Minimum 40px padding inside cards
- Minimum 80px vertical separation between major sections
- 24px gap between card content elements
- Generous `letter-spacing: -0.02em` on large headings for premium feel

---

### 6.5 Animations & Micro-Interactions

| Element | Animation | Implementation | Notes |
|---------|-----------|----------------|-------|
| Hero title reveal | Characters stagger in with blur-to-sharp + slide up | Framer Motion `staggerChildren` | `duration: 0.05` per char |
| Hero subtitle | Fade + slide up, 300ms delay | Framer Motion | |
| Countdown digits | Flip animation (card flip on change) | Custom CSS `@keyframes flip` | |
| Event cards | Scale 1.02 + glow border on hover | CSS `transition` + Tailwind | |
| CTA buttons | Shimmer sweep left-to-right on hover | CSS `::after` keyframes | |
| Stats counter | Count-up from 0 to value | `react-countup` | Trigger on scroll into view |
| Page transitions | Fade in/out + slight Y offset | Framer Motion `AnimatePresence` | |
| Navbar | `backdrop-blur` increases on scroll; shrinks height | `useScroll` hook | |
| Mobile menu | Slide down + stagger nav items | Framer Motion | |
| Form focus | Label floats up + border glow pulse | CSS `:focus-within` | |
| Loading states | Skeleton shimmer (animated gradient sweep) | Tailwind `animate-pulse` + custom | |
| Payment success | Confetti burst + checkmark scale | `lottie-react` with confetti JSON | |
| Form validation errors | Shake animation + red border pulse | Framer Motion `animate={{ x: [-8, 8, -8, 0] }}` | |
| Scroll indicator | Animated down-arrow pulse in hero | CSS `animate-bounce` | |

**Performance Rule:** Wrap all animations in `prefers-reduced-motion` check:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 6.6 Premium UI Components

#### Glassmorphism Cards

```css
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
}
```

#### Gradient Borders (via pseudo-element)

```css
.gradient-border {
  position: relative;
  border-radius: 16px;
  background: #0F172A;
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 17px;
  background: linear-gradient(135deg, rgba(124,58,237,0.6), rgba(245,158,11,0.3), transparent);
  z-index: -1;
}
```

#### Glow Effect on Interactive Elements

```css
.glow-violet:hover {
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.4),
              0 0 60px rgba(124, 58, 237, 0.15);
}
```

#### Noise Texture Overlay (Hero depth)

```css
.noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* SVG noise */
  opacity: 0.03;
  pointer-events: none;
}
```

---

### 6.7 Mobile-First Responsive Design

#### Breakpoint Strategy

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile (default) | < 640px | Single column, compact spacing, hamburger nav |
| Tablet (`sm:`) | 640px–1024px | 2-column grid, expanded spacing |
| Desktop (`lg:`) | 1024px+ | 3-column grid, full sidebar layouts |
| Wide (`xl:`) | 1280px+ | Max-width container activates |

#### Mobile-Specific Requirements

- Hamburger menu with full-screen overlay navigation (not dropdown)
- Countdown timer: 2×2 grid (Days/Hours top row, Mins/Secs bottom row) on mobile
- Event cards: full-width on mobile with horizontal scroll for filter tabs
- Registration form: single-column, large tap targets (min 48px height for all inputs)
- Admin dashboard: collapsible sidebar, card-based stat view (not tables) on mobile
- Payment flow: optimized for thumb reach (primary actions at bottom of screen)

---

## 7. Technical Architecture

### 7.1 Frontend

| Technology | Choice | Justification |
|-----------|--------|---------------|
| Framework | React 18 + TypeScript | Already in use; mature ecosystem |
| Build Tool | Vite 5 | Already in use; fast HMR |
| Routing | React Router v6 | Already in use |
| State Management | Zustand | Lightweight global state for auth + cart |
| Animations | Framer Motion | Already in use; extend usage |
| Styling | Tailwind CSS v3 | Already in use; extend with custom tokens |
| Forms | React Hook Form + Zod | Type-safe validation; replaces manual state |
| HTTP Client | Axios + SWR | SWR for caching + revalidation |
| Payment | Razorpay React SDK | `react-razorpay` package |
| Emails (preview) | React Email | Preview email templates in dev |
| Charts (Admin) | Recharts | Lightweight, Tailwind-compatible |
| Date handling | date-fns | Lightweight, tree-shakeable |

### 7.2 Backend

| Technology | Choice | Justification |
|-----------|--------|---------------|
| Runtime | Node.js 20 LTS | Already in use |
| Framework | Express.js | Already in use |
| Language | TypeScript | Already in use |
| ORM | Drizzle ORM | Type-safe, lightweight, great DX |
| Email Service | Resend + React Email | Modern, developer-friendly |
| Payment SDK | Razorpay Node SDK | Official SDK, webhook support |
| Auth | JWT + bcrypt | Stateless auth, secure password hashing |
| Validation | Zod | Shared schema between frontend and backend |
| Rate Limiting | express-rate-limit | Protect registration and auth endpoints |
| File Uploads | Multer + Cloudinary | For event image uploads in admin |
| Logging | Winston | Structured logging for production |

### 7.3 Database

**Migrate from SQLite to PostgreSQL.**

| Choice | Option |
|--------|--------|
| Database | PostgreSQL 15 |
| Hosting (Recommended) | Supabase (free tier; PostgreSQL + REST API + realtime) |
| Alternate | Railway, Neon, Render |
| ORM | Drizzle ORM (generate typed queries from schema) |
| Migrations | Drizzle Kit (`drizzle-kit push`, `drizzle-kit migrate`) |

**Why Supabase:**
- Free PostgreSQL instance with 500MB storage
- Built-in REST API and realtime subscriptions
- Dashboard for viewing data without writing SQL
- Row Level Security for data protection
- Easy to connect via standard PostgreSQL connection string

### 7.4 Payment Gateway

**Primary: Razorpay**

Razorpay is the recommended choice for India-based college events:

- Supports UPI, Net Banking, all major debit/credit cards, mobile wallets
- No monthly fee; 2% transaction fee per payment
- Excellent documentation and React SDK
- Webhook support for reliable payment confirmation
- Supports INR natively

**Integration Libraries:**
```bash
npm install razorpay              # Backend SDK
npm install react-razorpay        # Frontend modal
```

**Alternate: PhonePe Payment Gateway**
- Good for UPI-heavy user base
- Slightly more complex integration
- Fallback option if Razorpay is unavailable

**Test Credentials (Development):**
- Use Razorpay test mode with test API keys
- Test cards and UPI IDs available in Razorpay documentation

### 7.5 Hosting & Deployment

#### Frontend Hosting

| Platform | Tier | Cost | Recommendation |
|---------|------|------|----------------|
| **Vercel** | Hobby (free) | Free | ✅ Primary choice |
| Netlify | Starter (free) | Free | Good alternate |
| Cloudflare Pages | Free | Free | Best for global CDN |

**Vercel is recommended** — zero-config deployment for Vite, automatic HTTPS, preview deployments, custom domain support.

#### Backend Hosting

| Platform | Tier | Cost | Recommendation |
|---------|------|------|----------------|
| **Railway** | Starter | ~$5/mo | ✅ Primary choice |
| Render | Free/Starter | Free–$7/mo | Good alternate |
| Fly.io | Free | Free | Good for containerized apps |

#### Database Hosting

| Platform | Tier | Cost | Recommendation |
|---------|------|------|----------------|
| **Supabase** | Free | Free | ✅ Primary choice |
| Neon | Free | Free | Good alternate |
| Railway PostgreSQL | ~$5/mo | ~$5/mo | If using Railway for backend |

#### Domain & DNS

- Register `voxera2026.in` or `voxera.club` (₹500–₹800/year)
- Point domain to Vercel (frontend) with A/CNAME records
- Backend on subdomain: `api.voxera2026.in` → Railway

#### Environment Configuration

```bash
# .env.production (never commit this file)

# Database
DATABASE_URL=postgresql://user:pass@host:5432/voxera

# Auth
JWT_SECRET=<64-char random string>
ADMIN_PASSWORD_HASH=<bcrypt hash>

# Razorpay
RAZORPAY_KEY_ID=rzp_live_XXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX

# Email (Resend)
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXX
FROM_EMAIL=noreply@voxera2026.in

# Frontend URL (for CORS + email links)
FRONTEND_URL=https://voxera2026.in

# Google Forms Webhook
WEBHOOK_SECRET=<32-char random string>
```

---

## 8. Database Schema

### 8.1 Tables

#### `events`

```sql
CREATE TABLE events (
  id                      VARCHAR(100) PRIMARY KEY,
  title                   VARCHAR(200) NOT NULL,
  short_description       TEXT,
  description             TEXT,
  date                    DATE NOT NULL,
  time_start              TIME,
  time_end                TIME,
  location                VARCHAR(200),
  category                VARCHAR(50),
  thumbnail_image         TEXT,
  banner_image            TEXT,
  rules                   JSONB DEFAULT '[]',
  rounds                  JSONB DEFAULT '[]',
  judging_criteria        JSONB DEFAULT '[]',
  team_size_min           INTEGER DEFAULT 1,
  team_size_max           INTEGER DEFAULT 1,
  prize_description       TEXT,
  prize_amount_inr        INTEGER,
  registration_fee_single INTEGER NOT NULL DEFAULT 0,
  registration_fee_team   INTEGER,
  google_form_url         TEXT,
  slots_total             INTEGER,
  slots_filled            INTEGER DEFAULT 0,
  is_published            BOOLEAN DEFAULT false,
  registration_enabled    BOOLEAN DEFAULT false,
  display_order           INTEGER DEFAULT 0,
  coordinators            JSONB DEFAULT '[]',
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);
```

#### `registrations`

```sql
CREATE TABLE registrations (
  id                  SERIAL PRIMARY KEY,
  registration_code   VARCHAR(20) UNIQUE NOT NULL, -- e.g. VX-2026-0042
  event_id            VARCHAR(100) REFERENCES events(id),
  primary_name        VARCHAR(200) NOT NULL,
  primary_email       VARCHAR(200) NOT NULL,
  primary_phone       VARCHAR(20) NOT NULL,
  college_name        VARCHAR(200),
  department          VARCHAR(100),
  year_of_study       VARCHAR(10),
  team_members        JSONB DEFAULT '[]', -- [{name, email}]
  team_size           INTEGER DEFAULT 1,
  fee_amount          INTEGER NOT NULL,   -- Amount in paise (INR * 100)
  payment_status      VARCHAR(20) DEFAULT 'pending', -- pending | confirmed | failed | refunded
  payment_id          VARCHAR(100),       -- Razorpay payment ID
  order_id            VARCHAR(100),       -- Razorpay order ID
  payment_method      VARCHAR(50),        -- upi | card | netbanking | wallet
  confirmation_email_sent BOOLEAN DEFAULT false,
  check_in_status     VARCHAR(20) DEFAULT 'not_checked_in',
  ip_address          INET,
  user_agent          TEXT,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_email ON registrations(primary_email);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
```

#### `razorpay_orders`

```sql
CREATE TABLE razorpay_orders (
  id              SERIAL PRIMARY KEY,
  order_id        VARCHAR(100) UNIQUE NOT NULL,
  registration_id INTEGER REFERENCES registrations(id),
  amount          INTEGER NOT NULL, -- paise
  currency        VARCHAR(10) DEFAULT 'INR',
  status          VARCHAR(20) DEFAULT 'created', -- created | paid | failed
  receipt         VARCHAR(100),
  created_at      TIMESTAMP DEFAULT NOW()
);
```

#### `admin_users`

```sql
CREATE TABLE admin_users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(100) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL, -- bcrypt hash
  email           VARCHAR(200),
  role            VARCHAR(20) DEFAULT 'admin', -- admin | superadmin
  last_login      TIMESTAMP,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

#### `site_settings`

```sql
CREATE TABLE site_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT,
  value_type  VARCHAR(20) DEFAULT 'string', -- string | boolean | json | number
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

#### `contact_submissions`

```sql
CREATE TABLE contact_submissions (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(200) NOT NULL,
  subject     VARCHAR(300),
  message     TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'new', -- new | read | replied | archived
  ip_address  INET,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

#### `google_form_submissions`

```sql
CREATE TABLE google_form_submissions (
  id              SERIAL PRIMARY KEY,
  event_id        VARCHAR(100) REFERENCES events(id),
  form_name       VARCHAR(100),
  submission_data JSONB NOT NULL,
  linked_registration_id INTEGER REFERENCES registrations(id),
  created_at      TIMESTAMP DEFAULT NOW()
);
```

#### `sponsors`

```sql
CREATE TABLE sponsors (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  logo_url      TEXT NOT NULL,
  website_url   TEXT,
  tier          VARCHAR(20) DEFAULT 'general', -- title | gold | silver | general
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

---

## 9. Security Requirements

### 9.1 Authentication & Authorization

- **S-01:** Remove all hardcoded credentials from frontend source code immediately
- **S-02:** Implement server-side JWT authentication for admin panel
- **S-03:** Store admin passwords as bcrypt hashes (minimum 12 rounds)
- **S-04:** JWT tokens stored in `httpOnly; SameSite=Strict; Secure` cookies — never in `localStorage`
- **S-05:** JWT expiry set to 8 hours; implement refresh token rotation for extended sessions
- **S-06:** Rate limit admin login endpoint: max 5 attempts per 15 minutes per IP
- **S-07:** Consider TOTP (Google Authenticator) 2FA for admin access (highly recommended)

### 9.2 API Security

- **S-08:** All admin API routes protected by `verifyAdmin` middleware
- **S-09:** Input validation with Zod on all POST/PUT endpoints
- **S-10:** SQL injection prevention via parameterized queries (enforced by Drizzle ORM)
- **S-11:** XSS prevention via React's default escaping + CSP headers
- **S-12:** CORS configured to whitelist only `voxera2026.in` and `localhost` in development
- **S-13:** Rate limiting on all public endpoints: 100 req/min general, 10 req/min registration
- **S-14:** Request body size limit: 1MB maximum

### 9.3 Payment Security

- **S-15:** Razorpay webhook signature verified using HMAC-SHA256 on every webhook call
- **S-16:** Fee amounts never accepted from client — always calculated server-side
- **S-17:** Order amount validated against expected fee before creating Razorpay order
- **S-18:** Payment IDs logged and deduplicated — prevent replay attacks
- **S-19:** PCI DSS compliance maintained by never handling raw card data (Razorpay handles all card processing)

### 9.4 Data Protection

- **S-20:** All connections enforced over HTTPS (TLS 1.2+)
- **S-21:** Sensitive environment variables (API keys, DB URL) never committed to version control
- **S-22:** `.env` files listed in `.gitignore`
- **S-23:** Phone numbers and emails stored without encryption (acceptable at this scale) but never exposed publicly
- **S-24:** Admin CSV exports password-protected or access-logged
- **S-25:** Database backups automated daily (Supabase provides this automatically)

### 9.5 HTTP Security Headers

```javascript
// Express middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; frame-src https://forms.gle https://docs.google.com; img-src 'self' data: https:; connect-src 'self' https://api.razorpay.com;"
  );
  next();
});
```

---

## 10. Performance Optimization

### 10.1 Frontend Performance

| Optimization | Implementation | Target Gain |
|-------------|----------------|-------------|
| Code splitting | React.lazy + Suspense for all page components | Reduce initial bundle 40% |
| Image optimization | WebP format + `loading="lazy"` + explicit width/height | Eliminate layout shift |
| CDN for images | Upload all event images to Cloudinary; serve via CDN URL | Reduce image load 60% |
| Font optimization | `font-display: swap` + preconnect to fonts.googleapis.com | Prevent render blocking |
| Bundle analysis | `vite-bundle-visualizer` — identify and eliminate heavy deps | Target < 150KB gzipped JS |
| Tree shaking | Verify Framer Motion tree shakes (import specific modules) | -30KB bundle |
| Prefetching | `<Link prefetch>` on high-probability next pages | Sub-100ms navigation |
| Memoization | `React.memo` on EventCard; `useMemo` for filtered event lists | Prevent unnecessary re-renders |

### 10.2 Backend Performance

| Optimization | Implementation |
|-------------|----------------|
| Database indexing | Indexes on `event_id`, `email`, `payment_status`, `created_at` |
| Query optimization | Avoid `SELECT *`; specify only needed columns |
| Response compression | `compression` middleware on Express |
| API caching | Cache `/api/events` and `/api/settings` for 60 seconds (events rarely change) |
| Connection pooling | Use Supabase connection pooler (PgBouncer) for serverless environments |
| Async email sending | Send confirmation emails asynchronously — don't block the API response |

### 10.3 Target Lighthouse Scores

| Metric | Target | Current Estimated |
|--------|--------|------------------|
| Performance | ≥ 90 | ~65 (unoptimized) |
| Accessibility | ≥ 95 | ~60 (missing ARIA) |
| Best Practices | ≥ 95 | ~70 (HTTP headers missing) |
| SEO | ≥ 95 | ~30 (no meta tags) |
| LCP | < 2.5s | ~4s (placeholder images) |
| FID/INP | < 100ms | Good (React is reactive) |
| CLS | < 0.1 | High (images no dimensions) |

---

## 11. SEO & Analytics

### 11.1 SEO Implementation

#### HTML Meta Tags (per page)

```html
<!-- Base (index.html) -->
<meta name="description" content="VOXERA 2026 — JB Language Club's annual cultural and literary festival. Compete in Debate, Poetry, Open Mic, Pitch Perfect, Treasure Hunt, and Film events on March 16-17, 2026.">
<meta name="keywords" content="VOXERA, college fest, debate competition, open mic, poetry, cultural events 2026">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://voxera2026.in/">

<!-- Open Graph (for social sharing) -->
<meta property="og:type" content="website">
<meta property="og:title" content="VOXERA 2026 — JB Language Club Cultural Festival">
<meta property="og:description" content="The ultimate literary and cultural festival. Register now for Debate, Poetry, Open Mic, and more.">
<meta property="og:image" content="https://voxera2026.in/og-banner.jpg"> <!-- 1200x630px -->
<meta property="og:url" content="https://voxera2026.in">
<meta property="og:site_name" content="VOXERA 2026">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="VOXERA 2026 — JB Language Club">
<meta name="twitter:description" content="Register for Debate, Poetry, Open Mic, Pitch Perfect, and more at VOXERA 2026.">
<meta name="twitter:image" content="https://voxera2026.in/og-banner.jpg">
```

#### JSON-LD Structured Data (Event Schema)

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "VOXERA 2026",
  "description": "Annual cultural and literary festival by JB Language Club",
  "startDate": "2026-03-16T09:00:00+05:30",
  "endDate": "2026-03-17T21:00:00+05:30",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "College Campus",
    "address": { "@type": "PostalAddress", "addressCountry": "IN" }
  },
  "organizer": { "@type": "Organization", "name": "JB Language Club" },
  "offers": {
    "@type": "Offer",
    "url": "https://voxera2026.in/register",
    "price": "50",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock"
  }
}
```

#### Technical SEO

- `sitemap.xml` auto-generated at `/sitemap.xml` listing all event and page URLs
- `robots.txt` at root: allow all, disallow `/admin`
- Canonical URLs on all pages
- Dynamic `<title>` tags using React Helmet Async
- 301 redirect from `www.` to non-www (or vice versa)
- 404 page returns HTTP 404 status (not 200)

### 11.2 Analytics Implementation

#### Google Analytics 4

```html
<!-- index.html — GA4 tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### Custom Event Tracking

```javascript
// Track key conversion events

// When user views registration page
gtag('event', 'begin_checkout', { event_category: 'registration', event_name: eventName });

// When user completes payment
gtag('event', 'purchase', {
  transaction_id: registrationCode,
  value: feeAmount,
  currency: 'INR',
  items: [{ item_id: eventId, item_name: eventName, price: feeAmount, quantity: 1 }]
});

// When user views event detail page
gtag('event', 'view_item', { item_id: eventId, item_name: eventName });

// When user clicks Register button on event card
gtag('event', 'add_to_cart', { item_id: eventId, item_name: eventName });
```

#### Hotjar (Optional — UX Insights)

- Install Hotjar snippet for heatmaps and session recordings
- Create funnel: Homepage → Events → Register → Payment → Success
- Set up exit-intent survey: "What stopped you from registering?"
- Record sessions on mobile registration flow to identify friction

---

## 12. Production Readiness Checklist

### Pre-Launch (1 week before event)

#### Security
- [ ] Remove all hardcoded passwords from frontend source
- [ ] Admin auth migrated to server-side JWT
- [ ] HTTPS enforced on all routes
- [ ] All API keys in environment variables (not in code)
- [ ] Razorpay webhook signature verification implemented
- [ ] Rate limiting active on auth and registration endpoints
- [ ] HTTP security headers configured
- [ ] CORS whitelist updated to production domain only

#### Functionality
- [ ] All 6 event registrations tested end-to-end with Razorpay test mode
- [ ] Payment success webhook tested and registration status updates correctly
- [ ] Confirmation email tested and renders correctly across Gmail, Outlook, mobile
- [ ] Admin panel CRUD operations tested for all events
- [ ] CSV export tested with 100+ sample registrations
- [ ] Google Forms webhook integration tested
- [ ] Schedule page pulling from live API (not static data)
- [ ] All Google Form embeds loading correctly on event detail pages
- [ ] Registration fee calculation validated for all events and team sizes

#### Performance
- [ ] Lighthouse score ≥ 90 on both mobile and desktop
- [ ] All images converted to WebP and uploaded to Cloudinary
- [ ] Code splitting implemented for all page-level components
- [ ] Bundle size < 200KB gzipped

#### SEO & Analytics
- [ ] Meta tags verified on all pages using Facebook Debugger + Twitter Card Validator
- [ ] sitemap.xml accessible and valid
- [ ] Google Analytics 4 tracking verified (events firing in GA4 DebugView)
- [ ] Custom event tracking (purchase, begin_checkout) working
- [ ] Google Search Console property verified

#### Design
- [ ] All placeholder (Loremflickr) images replaced with real event imagery
- [ ] Prize amounts updated from `$` to `₹`
- [ ] Mobile navigation (hamburger) functional across all tested devices
- [ ] Countdown timer displaying correct time to March 16, 2026

#### Infrastructure
- [ ] PostgreSQL database provisioned and seeded in production
- [ ] Environment variables configured in production hosting platform
- [ ] Domain DNS correctly pointing to frontend (Vercel) and backend (Railway)
- [ ] SSL certificate active and auto-renewing
- [ ] Daily database backups enabled
- [ ] Error monitoring (Sentry) configured

### Switch Razorpay to Live Mode
- [ ] Razorpay account KYC completed and approved
- [ ] Live API keys (not test keys) in production environment
- [ ] Webhook URL updated to production URL in Razorpay dashboard
- [ ] Test payment of ₹1 made in live mode and refunded

### Post-Launch Monitoring
- [ ] Alert set up for server errors (≥ 5 errors/minute)
- [ ] Alert set up for failed payments (≥ 3 consecutive failures)
- [ ] Monitor registration counts daily vs. event capacity

---

## 13. Future Scalability Roadmap

### Phase 2 — Post-Event Enhancements (April–June 2026)

| Feature | Description | Effort |
|---------|-------------|--------|
| QR Code Check-in | Generate QR code in confirmation email; admin scans at event entrance | Medium |
| WhatsApp Notifications | Send registration confirmation via WhatsApp Business API | Medium |
| Waitlist System | Allow registrations beyond capacity with automatic promotion | Medium |
| Team Chat | Simple in-app message thread per registration/event | High |
| Photo Gallery | Admin uploads event photos; public gallery page | Low |
| Results/Winners | Admin publishes event results; auto-notifies registered participants | Medium |

### Phase 3 — Multi-Edition Platform (VOXERA 2027+)

| Feature | Description | Effort |
|---------|-------------|--------|
| Multi-edition support | Archive previous years; launch new edition via admin toggle | Medium |
| Sponsorship Portal | Dedicated page for sponsors with media kit download and inquiry form | Medium |
| Speaker/Judge Portal | Invite judges, manage profiles, collect bio/headshots | High |
| Volunteer Management | Register as volunteer, assign roles, track hours | High |
| Certificate Generation | Auto-generate participation/winner certificates as PDF | High |
| Leaderboard | Live points leaderboard across events for teams/individuals | High |
| Mobile App | React Native app reusing existing components and API | Very High |

### Phase 4 — Platform as a Service (VOXERA Platform)

| Feature | Description |
|---------|-------------|
| Multi-club/multi-college | Allow other college clubs to create their own event site using the same platform |
| White-label branding | Custom themes, logos, colors per organization |
| Revenue sharing | Platform charges 0.5% per transaction for hosting |
| Analytics SaaS | Advanced event analytics dashboard as a product |

---

## 14. Timeline & Milestones

### Sprint Plan (4 Weeks to Launch)

```
Week 1: Foundation & Security (Feb 25 – Mar 3, 2026)
├── Fix admin auth (remove hardcoded password, implement JWT)          Day 1-2
├── Migrate from SQLite to PostgreSQL (Supabase)                       Day 1-2
├── Update DB schema with new fields (fees, team_size_min/max, etc.)  Day 2-3
├── Fix Schedule page to use live API                                  Day 3
├── Fix all ₹ currency references                                      Day 3
├── Implement mobile hamburger navigation                              Day 4-5
└── Set up CI/CD pipeline (GitHub Actions → Vercel + Railway)         Day 5-7

Week 2: Registration & Payment (Mar 4 – Mar 10, 2026)
├── Build registration fee calculation logic (server-side)            Day 1
├── Update Register page form with dynamic team fields + fee display  Day 1-3
├── Integrate Razorpay (frontend modal + backend order creation)       Day 2-4
├── Implement webhook handler + payment status updates                Day 4-5
├── Build confirmation email template + Resend integration            Day 5-6
├── Build /register/success page                                       Day 6
└── End-to-end payment flow testing (Razorpay test mode)              Day 7

Week 3: UI Polish & Pages (Mar 11 – Mar 14, 2026)
├── Replace placeholder images with real event imagery                Day 1
├── Custom font stack (Clash Display + Inter) + typography updates    Day 1
├── Home page: add Stats, About, Sponsors, CTA sections               Day 1-3
├── Home page: Countdown timer component                              Day 2
├── Event Detail: add Google Form embed, social share, fee display    Day 2-3
├── Events page: category filters + search + fee badge                Day 3
├── Build About page, custom 404 page                                 Day 3-4
├── Animation upgrades: hero reveal, card hover, button shimmer       Day 4-5
└── Full mobile responsiveness audit + fixes                          Day 5-7

Week 4: Admin, SEO & Launch Prep (Mar 14 – Mar 16, 2026)
├── Complete admin dashboard (Registrations table, filters, export)   Day 1-2
├── Google Forms webhook integration + admin sync view                Day 2
├── Site Settings tab in admin (hero, contact, sponsors)              Day 2-3
├── SEO: meta tags, OG, JSON-LD, sitemap, robots.txt                  Day 3
├── Google Analytics 4 + custom event tracking                        Day 3
├── Production Readiness Checklist — all items                        Day 4-5
├── Switch Razorpay to live mode + test payment                       Day 5
├── Domain setup + DNS configuration                                  Day 5
├── Load testing: simulate 500 concurrent users                       Day 6
└── 🚀 Soft Launch — March 15, 2026 (day before event)               Day 7
```

### Key Milestones

| Milestone | Date | Success Criteria |
|-----------|------|-----------------|
| M1: Secure Admin | Mar 3 | Admin accessible only via server-side JWT auth |
| M2: Database Live | Mar 3 | PostgreSQL on Supabase with full schema |
| M3: First Paid Registration | Mar 8 | End-to-end Razorpay test payment completes |
| M4: Email Confirmation | Mar 10 | Confirmation email delivered within 30s of payment |
| M5: UI Complete | Mar 14 | Lighthouse ≥ 90, all pages done, all images real |
| M6: Admin Complete | Mar 14 | All CRUD, export, and settings working |
| M7: SEO + Analytics | Mar 14 | GA4 tracking, sitemap, OG tags verified |
| M8: Soft Launch | Mar 15 | Live on production domain, Razorpay in live mode |
| M9: Event Day | Mar 16 | 0 critical bugs, registrations flowing |

---

## Appendix A: API Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | None | Server health check |
| `GET` | `/api/events` | None | List all published events |
| `GET` | `/api/events/:id` | None | Get single event detail |
| `POST` | `/api/orders` | None | Create Razorpay order |
| `POST` | `/api/register` | None | Submit registration (post-payment) |
| `GET` | `/api/registrations/:code` | None | Get registration by code |
| `POST` | `/api/contact` | None | Submit contact form |
| `POST` | `/api/webhooks/razorpay` | HMAC | Razorpay payment webhook |
| `POST` | `/api/webhooks/google-forms` | Secret | Google Forms submission webhook |
| `POST` | `/api/auth/login` | None | Admin login → JWT |
| `POST` | `/api/auth/logout` | JWT | Admin logout |
| `GET` | `/api/admin/registrations` | JWT | List all registrations |
| `GET` | `/api/admin/registrations/export` | JWT | Download CSV export |
| `GET` | `/api/admin/events` | JWT | List all events (including unpublished) |
| `POST` | `/api/admin/events` | JWT | Create new event |
| `PUT` | `/api/admin/events/:id` | JWT | Update event |
| `DELETE` | `/api/admin/events/:id` | JWT | Soft-delete event |
| `GET` | `/api/settings` | None | Get public site settings |
| `PUT` | `/api/admin/settings` | JWT | Update site settings |
| `GET` | `/api/admin/stats` | JWT | Dashboard statistics |

---

## Appendix B: Registration Code Format

All registrations receive a unique, human-readable code:

```
Format: VX-{YEAR}-{ZERO_PADDED_ID}

Examples:
  VX-2026-0001   (First registration ever)
  VX-2026-0042   (42nd registration)
  VX-2026-0500   (500th registration)
```

This code is used in:
- Confirmation email subject and body
- Success page display
- Admin panel registration list
- At-event check-in (if QR code feature added later)

---

*End of VOXERA 2026 Product Requirements Document v2.0.0*

*This document is maintained by the JB Language Club Tech Team. For questions, revisions, or clarifications, contact the Product Manager.*
