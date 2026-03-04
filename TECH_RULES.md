# TECH_RULES.md
## VOXERA 2026 — Technical Standards & Engineering Rules

> **Document Type:** Engineering Reference · Living Document
> **Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Express · PostgreSQL · Razorpay
> **Applies To:** All developers contributing to the VOXERA 2026 codebase
> **Enforcement:** Rules marked 🔴 are blockers for PR merge. Rules marked 🟡 are strongly recommended.

---

## Table of Contents

1. [Project Philosophy](#1-project-philosophy)
2. [Repository Structure](#2-repository-structure)
3. [Frontend Rules](#3-frontend-rules)
4. [Backend Rules](#4-backend-rules)
5. [Database Rules](#5-database-rules)
6. [Styling & Design System Rules](#6-styling--design-system-rules)
7. [Animation Rules](#7-animation-rules)
8. [Payment Integration Rules](#8-payment-integration-rules)
9. [Security Rules](#9-security-rules)
10. [Performance Rules](#10-performance-rules)
11. [Testing Rules](#11-testing-rules)
12. [Git & Version Control Rules](#12-git--version-control-rules)
13. [Environment & Configuration Rules](#13-environment--configuration-rules)
14. [Deployment Rules](#14-deployment-rules)
15. [Accessibility Rules](#15-accessibility-rules)
16. [SEO Rules](#16-seo-rules)
17. [Error Handling Rules](#17-error-handling-rules)
18. [Code Quality Rules](#18-code-quality-rules)

---

## 1. Project Philosophy

### 1.1 Core Principles

These four principles govern every technical decision on this project:

| Principle | What It Means in Practice |
|-----------|--------------------------|
| **Conversion First** | Every page, component, and interaction must reduce friction toward the goal: user registers and pays within 3 minutes |
| **Mobile First** | Design and code for the smallest screen first, then expand. 70% of users are on mobile |
| **Security by Default** | Sensitive operations are never trusted from the client. Fees, auth, and payments are validated server-side, always |
| **Explicit Over Clever** | Write code that a junior developer can read without context. No magic, no over-abstraction |

### 1.2 North Star Metric

> **Registration Conversion Rate** — the percentage of homepage visitors who complete a paid registration.

Every PR, refactor, or new feature must be evaluated against this question:  
*"Does this help or harm the conversion rate?"*

### 1.3 What We Are NOT Building

- A generic template that can be reused for anything
- An over-engineered microservices system
- A feature-heavy platform with unused capabilities
- Code that prioritizes developer cleverness over user clarity

---

## 2. Repository Structure

### 2.1 Monorepo Layout

```
voxera-2026/
├── client/                        # React frontend (Vite)
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── og-banner.jpg          # 1200×630px for social sharing
│   │   ├── robots.txt
│   │   └── sitemap.xml            # Auto-generated, do not edit manually
│   ├── src/
│   │   ├── assets/                # Static assets (fonts, SVGs, local images)
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/                # Primitive components (Button, Input, Badge, etc.)
│   │   │   ├── layout/            # Navbar, Footer, Layout wrapper
│   │   │   ├── events/            # EventCard, EventGrid, EventFilter
│   │   │   ├── registration/      # RegistrationForm, TeamMemberInput, FeeDisplay
│   │   │   ├── payment/           # PaymentModal, PaymentStatus, OrderSummary
│   │   │   └── admin/             # AdminSidebar, DataTable, StatCard
│   │   ├── pages/                 # Route-level page components (lazy loaded)
│   │   │   ├── Home.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── EventDetail.tsx
│   │   │   ├── Schedule.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── RegisterSuccess.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── About.tsx
│   │   │   ├── Admin.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   └── NotFound.tsx
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useEvents.ts
│   │   │   ├── useRegistration.ts
│   │   │   ├── useCountdown.ts
│   │   │   └── useAdmin.ts
│   │   ├── lib/                   # Third-party wrappers & utilities
│   │   │   ├── axios.ts           # Axios instance with base URL + interceptors
│   │   │   ├── analytics.ts       # GA4 event tracking wrappers
│   │   │   ├── razorpay.ts        # Razorpay modal helper
│   │   │   └── seo.ts             # React Helmet helper
│   │   ├── store/                 # Zustand global state
│   │   │   ├── authStore.ts       # Admin auth state
│   │   │   └── registrationStore.ts
│   │   ├── schemas/               # Shared Zod schemas (mirrored from server)
│   │   │   ├── event.schema.ts
│   │   │   └── registration.schema.ts
│   │   ├── types/                 # TypeScript type definitions
│   │   │   └── index.ts
│   │   ├── constants/             # App-wide constants
│   │   │   ├── fees.ts            # Registration fee constants — SINGLE SOURCE OF TRUTH
│   │   │   └── routes.ts          # Route path constants
│   │   ├── App.tsx                # Router + lazy imports
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Tailwind + CSS custom properties
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── routes/                # Route handlers
│   │   │   ├── events.routes.ts
│   │   │   ├── registrations.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── webhooks.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── controllers/           # Business logic
│   │   │   ├── events.controller.ts
│   │   │   ├── registrations.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── securityHeaders.ts
│   │   ├── services/              # External service integrations
│   │   │   ├── razorpay.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── storage.service.ts
│   │   ├── db/                    # Database layer
│   │   │   ├── schema.ts          # Drizzle ORM schema
│   │   │   ├── migrations/        # Generated migration files
│   │   │   └── index.ts           # DB connection + pool
│   │   ├── schemas/               # Zod validation schemas
│   │   │   ├── event.schema.ts
│   │   │   └── registration.schema.ts
│   │   ├── utils/                 # Shared utilities
│   │   │   ├── fees.ts            # Fee calculation logic — AUTHORITATIVE
│   │   │   ├── codes.ts           # Registration code generator
│   │   │   └── logger.ts          # Winston logger
│   │   └── index.ts               # Express app entry point
│   └── tsconfig.json
│
├── shared/                        # Shared types between client + server
│   └── types.ts
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint + test on every PR
│       └── deploy.yml             # Deploy on merge to main
│
├── .env.example                   # Template — NEVER put real values here
├── .gitignore
├── package.json                   # Root workspace config
└── TECH_RULES.md                  # This file
```

### 2.2 🔴 Naming Conventions

```
Files:         PascalCase for components   → EventCard.tsx
               camelCase for utilities     → calculateFee.ts
               kebab-case for assets       → hero-banner.webp

Components:    PascalCase                  → <EventCard />
Hooks:         camelCase with "use"        → useCountdown()
Stores:        camelCase with "Store"      → authStore
Constants:     SCREAMING_SNAKE_CASE        → MAX_TEAM_SIZE
Types:         PascalCase                  → VoxeraEvent
Zod schemas:   camelCase with "Schema"     → registrationSchema
API routes:    kebab-case, plural nouns    → /api/events, /api/registrations
DB tables:     snake_case, plural          → registrations, admin_users
DB columns:    snake_case                  → payment_status, created_at
```

---

## 3. Frontend Rules

### 3.1 Framework & Language

**🔴 Use React 19 with TypeScript (strict mode).** No JavaScript files allowed in `src/`.

```json
// tsconfig.json — required settings
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**🔴 No `any` type.** Use `unknown` with type guards, or define a proper interface.

```typescript
// ❌ NEVER
const data: any = await response.json();

// ✅ ALWAYS
const data: VoxeraEvent = await response.json() as VoxeraEvent;
// OR use Zod to parse + validate
const data = eventSchema.parse(await response.json());
```

### 3.2 Component Rules

**🔴 Every component must have explicit TypeScript prop types.**

```typescript
// ❌ WRONG — no prop types
export default function EventCard({ event, index }) { ... }

// ✅ CORRECT — explicit interface
interface EventCardProps {
  event: VoxeraEvent;
  index: number;
  onRegister?: (eventId: string) => void;
}
export default function EventCard({ event, index, onRegister }: EventCardProps) { ... }
```

**🟡 Components should be small and focused.** If a component exceeds 200 lines, split it.

**🔴 All page-level components must be lazy loaded** to enable code splitting:

```typescript
// App.tsx — REQUIRED pattern
import { lazy, Suspense } from 'react';
import PageLoader from '@/components/ui/PageLoader';

const Home       = lazy(() => import('@/pages/Home'));
const Events     = lazy(() => import('@/pages/Events'));
const Register   = lazy(() => import('@/pages/Register'));
const Admin      = lazy(() => import('@/pages/Admin'));

// Wrap routes in Suspense
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/events" element={<Events />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### 3.3 State Management Rules

**🔴 Follow this state hierarchy strictly:**

| State Type | Where to Put It | Tool |
|-----------|----------------|------|
| Server data (events, registrations) | Server state cache | SWR |
| Form state | Local component state | React Hook Form |
| Global UI (auth, modals) | Global store | Zustand |
| URL-driven state (filters, pagination) | URL search params | `useSearchParams` |
| Derived/computed data | `useMemo` | React |

**🔴 Never use `useEffect` to fetch data.** Use SWR instead:

```typescript
// ❌ WRONG — useEffect fetch anti-pattern
useEffect(() => {
  fetch('/api/events').then(res => res.json()).then(setEvents);
}, []);

// ✅ CORRECT — SWR with automatic caching + revalidation
import useSWR from 'swr';
const fetcher = (url: string) => axios.get(url).then(r => r.data);

function Events() {
  const { data: events, error, isLoading } = useSWR<VoxeraEvent[]>('/api/events', fetcher);
  // ...
}
```

**🟡 Zustand store slices should be small and scoped:**

```typescript
// store/authStore.ts
import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  adminUser: null,
  login: (token, user) => set({ isAuthenticated: true, adminUser: user }),
  logout: () => set({ isAuthenticated: false, adminUser: null }),
}));
```

### 3.4 Form Rules

**🔴 All forms must use React Hook Form + Zod validation.**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registrationSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters'),
  email:   z.string().email('Enter a valid email address'),
  phone:   z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  eventId: z.string().min(1, 'Please select an event'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

function RegistrationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });
  // ...
}
```

**🔴 Never clear form data on payment failure.** Preserve all field values so users can retry.

**🟡 All inputs must have `min-h-[48px]`** for mobile tap target compliance.

### 3.5 Routing Rules

**🔴 Route paths must be defined as constants, never hardcoded strings:**

```typescript
// constants/routes.ts
export const ROUTES = {
  HOME:             '/',
  EVENTS:           '/events',
  EVENT_DETAIL:     '/events/:id',
  SCHEDULE:         '/schedule',
  REGISTER:         '/register',
  REGISTER_SUCCESS: '/register/success',
  CONTACT:          '/contact',
  ABOUT:            '/about',
  ADMIN:            '/admin',
  ADMIN_LOGIN:      '/admin/login',
  NOT_FOUND:        '*',
} as const;

// Usage
<Link to={ROUTES.REGISTER}>Register</Link>
navigate(ROUTES.REGISTER_SUCCESS);
```

**🔴 Admin routes must be wrapped in a `ProtectedRoute` component:**

```typescript
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
  return <>{children}</>;
}
```

---

## 4. Backend Rules

### 4.1 Architecture Rules

**🔴 Separate concerns strictly: Routes → Controllers → Services → DB**

```
Route handler:   Parse request, validate input with Zod, call controller
Controller:      Business logic, orchestrate services, format response
Service:         Single external integration (Razorpay, Resend, Cloudinary)
DB layer:        Drizzle ORM queries only — no raw SQL except in migrations
```

```typescript
// ❌ WRONG — business logic inside route handler
app.post('/api/register', async (req, res) => {
  const fee = req.body.fee; // NEVER trust client fee
  const order = await razorpay.orders.create({ amount: fee * 100 }); // Wrong
  res.json(order);
});

// ✅ CORRECT — controller calls service
// routes/registrations.routes.ts
router.post('/', validate(registrationSchema), registrationController.create);

// controllers/registrations.controller.ts
export async function create(req: Request, res: Response) {
  const fee = calculateFee(req.body.eventId, req.body.teamSize); // Server-side
  const order = await razorpayService.createOrder(fee, req.body.eventId);
  res.json(order);
}
```

### 4.2 API Design Rules

**🔴 All API responses must follow this shape:**

```typescript
// Success
{ success: true, data: T, message?: string }

// Error
{ success: false, error: string, code?: string }

// Paginated
{ success: true, data: T[], meta: { total: number, page: number, limit: number } }
```

**🔴 HTTP status codes must be accurate:**

| Situation | Status Code |
|-----------|------------|
| Success | 200 |
| Created | 201 |
| Bad request / validation error | 400 |
| Unauthenticated | 401 |
| Forbidden (authenticated but not allowed) | 403 |
| Not found | 404 |
| Conflict (duplicate registration) | 409 |
| Server error | 500 |

**🟡 All public GET endpoints should support caching headers:**

```typescript
// Cache events list for 60 seconds
res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
```

### 4.3 Validation Middleware

**🔴 Every POST/PUT/PATCH route must go through Zod validation middleware:**

```typescript
// middleware/validate.middleware.ts
import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data; // Replace with parsed, typed data
    next();
  };
}
```

### 4.4 Fee Calculation Rules

**🔴 Registration fees are ALWAYS calculated server-side. Never trust amounts from the client.**

```typescript
// server/utils/fees.ts — THE SINGLE SOURCE OF TRUTH FOR FEES
export const REGISTRATION_FEES = {
  'debate-competition': {
    single: 99,
    team: 150,
    maxTeam: 2,
  },
  'treasure-hunt': {
    team: 120,   // Fixed per team
    maxTeam: 4,
  },
  'pitch-perfect': {
    flat: 50,    // Fixed regardless of team size
    maxTeam: 4,
  },
  'open-mic': {
    single: 99,
    team: 150,
    maxTeam: 2,
  },
  'poetry-reciting': {
    perPerson: 99,
    maxTeam: 1,  // Individual only
  },
  'film-screening': {
    perPerson: 80,
    maxTeam: 10, // No hard cap on crew
  },
} as const;

export function calculateFee(eventId: string, teamSize: number): number {
  const fees = REGISTRATION_FEES[eventId as keyof typeof REGISTRATION_FEES];
  if (!fees) throw new Error(`Unknown event: ${eventId}`);

  if ('flat' in fees)      return fees.flat;
  if ('perPerson' in fees) return fees.perPerson * teamSize;
  if ('single' in fees)    return teamSize === 1 ? fees.single : fees.team;
  if ('team' in fees)      return fees.team;

  throw new Error(`Fee structure not defined for: ${eventId}`);
}

// Fee is returned in RUPEES. Multiply by 100 for Razorpay (paise).
```

---

## 5. Database Rules

### 5.1 Technology

**🔴 Use PostgreSQL 15+ via Supabase. SQLite is not permitted in production.**

**🔴 Use Drizzle ORM for all database operations.** No raw SQL in application code (migrations only).

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                  // Max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
```

### 5.2 Schema Rules

**🔴 All tables must have:**
- `id` as primary key (SERIAL or UUID)
- `created_at TIMESTAMP DEFAULT NOW()`
- `updated_at TIMESTAMP DEFAULT NOW()` with a trigger to auto-update

**🔴 Use soft deletes, never hard deletes on events or registrations:**

```typescript
// schema.ts — soft delete pattern
export const events = pgTable('events', {
  id:         varchar('id', { length: 100 }).primaryKey(),
  // ... other fields
  deleted_at: timestamp('deleted_at'),  // NULL = active, timestamp = deleted
});

// Query — always filter deleted records
const activeEvents = await db
  .select()
  .from(schema.events)
  .where(isNull(schema.events.deletedAt));
```

**🔴 All monetary values stored as INTEGER in paise (₹ × 100).** Never use FLOAT for money.

```typescript
// ✅ Store 99 rupees as 9900 (paise)
fee_amount: integer('fee_amount').notNull()  // 9900 = ₹99.00

// ❌ NEVER store as decimal or float
fee_amount: real('fee_amount')  // Floating point precision errors
```

### 5.3 Migration Rules

**🟡 All schema changes must go through a migration file.** Never alter the production DB manually.

```bash
# Generate migration after schema changes
npx drizzle-kit generate:pg --schema=./server/src/db/schema.ts

# Apply migrations
npx drizzle-kit push:pg

# Never run drizzle-kit push on production without review
```

**🔴 Migrations must be committed to version control and reviewed before merging.**

### 5.4 Query Rules

**🟡 Avoid `SELECT *` in production queries:**

```typescript
// ❌ WRONG
const events = await db.select().from(schema.events);

// ✅ CORRECT — specify needed fields
const events = await db.select({
  id:               schema.events.id,
  title:            schema.events.title,
  shortDescription: schema.events.shortDescription,
  date:             schema.events.date,
  category:         schema.events.category,
  thumbnailImage:   schema.events.thumbnailImage,
  registrationFee:  schema.events.registrationFeeSingle,
  slotsFilled:      schema.events.slotsFilled,
  slotsTotal:       schema.events.slotsTotal,
}).from(schema.events).where(eq(schema.events.isPublished, true));
```

---

## 6. Styling & Design System Rules

### 6.1 Design Token System

**🔴 All design values must be consumed from the token system defined in `index.css`.** No hardcoded hex values in component files.

```css
/* client/src/index.css — AUTHORITATIVE TOKEN DEFINITIONS */
@layer base {
  :root {
    /* Backgrounds */
    --bg-primary:       #0B0F14;
    --bg-secondary:     #111827;
    --bg-card:          #1F2937;

    /* Accents */
    --accent-emerald:       #10B981;
    --accent-emerald-hover: #059669;
    --accent-glow:          rgba(16, 185, 129, 0.15);
    --accent-glow-strong:   rgba(16, 185, 129, 0.40);

    /* Text */
    --text-primary:   #FFFFFF;
    --text-secondary: #D1D5DB;
    --text-muted:     #6B7280;

    /* Semantic */
    --semantic-success: #10B981;
    --semantic-error:   #F43F5E;
    --semantic-warning: #F59E0B;
    --semantic-info:    #38BDF8;

    /* Shadows */
    --shadow-card:      0 4px 24px rgba(0, 0, 0, 0.4);
    --shadow-glow:      0 0 20px var(--accent-glow-strong), 0 0 60px var(--accent-glow);

    /* Borders */
    --border-default:   #1F2937;
    --border-accent:    rgba(16, 185, 129, 0.3);
    --border-radius-card: 16px;

    /* Animation Durations */
    --duration-fast:    150ms;
    --duration-base:    300ms;
    --duration-slow:    500ms;
  }
}
```

**🔴 Extend Tailwind config to expose CSS tokens as utility classes:**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary':       'var(--bg-primary)',
        'bg-secondary':     'var(--bg-secondary)',
        'bg-card':          'var(--bg-card)',
        'accent':           'var(--accent-emerald)',
        'accent-hover':     'var(--accent-emerald-hover)',
        'text-primary':     'var(--text-primary)',
        'text-secondary':   'var(--text-secondary)',
        'text-muted':       'var(--text-muted)',
      },
      boxShadow: {
        'card':  'var(--shadow-card)',
        'glow':  'var(--shadow-glow)',
      },
      borderRadius: {
        'card': 'var(--border-radius-card)',
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        sans:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      transitionDuration: {
        fast: '150ms',
        base: '300ms',
      },
    },
  },
} satisfies Config;
```

### 6.2 Component Styling Rules

**🟡 Use the `cn()` utility for conditional class merging:**

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage in components
<button className={cn(
  'px-6 py-3 rounded-card font-semibold transition-colors duration-base',
  'bg-accent text-white hover:bg-accent-hover',
  isLoading && 'opacity-50 cursor-not-allowed',
  className
)}>
```

**🔴 Event card hover glow must use the emerald accent:**

```tsx
// EventCard.tsx — required hover pattern
<div className="
  bg-bg-card rounded-card border border-[var(--border-default)]
  transition-all duration-base cursor-pointer
  hover:border-[var(--border-accent)] hover:shadow-glow hover:scale-[1.02]
">
```

**🟡 All glassmorphism panels must use this exact pattern:**

```css
.glass-panel {
  background: rgba(31, 41, 55, 0.6);   /* bg-card with opacity */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--border-radius-card);
}
```

### 6.3 Responsive Design Rules

**🔴 Mobile-first. All styles default to mobile. Add `sm:`, `md:`, `lg:` to expand.**

```tsx
// ❌ WRONG — desktop first
<div className="grid grid-cols-3 sm:grid-cols-1">

// ✅ CORRECT — mobile first
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

**🔴 Breakpoints to use:**

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| (default) | < 640px | Mobile — single column |
| `sm:` | ≥ 640px | Tablet — 2 column |
| `lg:` | ≥ 1024px | Desktop — 3+ column |
| `xl:` | ≥ 1280px | Wide — max-w-7xl activates |

**🔴 All interactive elements must have `min-h-[48px]`** (WCAG touch target size).

---

## 7. Animation Rules

### 7.1 Framer Motion Rules

**🟡 All page-level animations use `AnimatePresence` from `motion/react`:**

```tsx
// App.tsx — required wrapper for page transitions
import { AnimatePresence } from 'motion/react';

<AnimatePresence mode="wait">
  <Routes location={location} key={location.pathname}>
    {/* routes */}
  </Routes>
</AnimatePresence>
```

**🟡 Standard animation variants — use these, do not invent new ones without discussion:**

```typescript
// lib/animations.ts — shared animation presets
export const fadeUp = {
  initial:   { opacity: 0, y: 20 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const stagger = {
  animate: {
    transition: { staggerChildren: 0.08 }
  }
};

export const cardReveal = {
  initial:   { opacity: 0, scale: 0.96, y: 16 },
  animate:   { opacity: 1, scale: 1,    y: 0  },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export const heroTitleChar = {
  initial:    { opacity: 0, y: 20, filter: 'blur(8px)' },
  animate:    { opacity: 1, y: 0,  filter: 'blur(0px)' },
  transition: { duration: 0.4 },
};
```

### 7.2 Reduced Motion Rule

**🔴 All animations must respect `prefers-reduced-motion`.** This is an accessibility requirement.

```css
/* index.css — REQUIRED — must be present */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```typescript
// For Framer Motion — use the hook
import { useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      animate={{ y: shouldReduce ? 0 : [0, -10, 0] }}
      transition={{ repeat: shouldReduce ? 0 : Infinity }}
    />
  );
}
```

### 7.3 Animation Performance Rules

**🟡 Only animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, or `margin` — these trigger layout recalculation.**

```tsx
// ❌ WRONG — triggers layout (expensive)
<motion.div animate={{ height: '200px', marginTop: '16px' }} />

// ✅ CORRECT — compositor only (cheap)
<motion.div animate={{ scale: 1.05, opacity: 0.9 }} />
```

---

## 8. Payment Integration Rules

### 8.1 Razorpay Integration Flow

**🔴 The payment flow must follow this exact sequence. No shortcuts.**

```
1. Client POSTs to /api/orders with { eventId, teamSize }
2. Server calculates fee server-side (NEVER from client)
3. Server creates Razorpay order via SDK
4. Server returns { orderId, amount, currency, keyId }
5. Client opens Razorpay modal with server-provided values
6. User pays on Razorpay
7. Razorpay sends webhook to /api/webhooks/razorpay
8. Server verifies webhook HMAC-SHA256 signature
9. Server updates registration status to 'confirmed'
10. Server sends confirmation email asynchronously
11. Client polls /api/registrations/:code for status
```

**🔴 Never process payment confirmation based on client callback alone.** The webhook is authoritative.

### 8.2 Webhook Security

**🔴 All Razorpay webhooks must be signature-verified before processing:**

```typescript
// services/razorpay.service.ts
import crypto from 'crypto';

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

// In webhook route — MUST use raw body parser (not json parser)
router.post(
  '/razorpay',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const isValid = verifyWebhookSignature(
      req.body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );

    if (!isValid) return res.status(401).json({ error: 'Invalid signature' });
    // Process event...
  }
);
```

### 8.3 Payment Amount Rules

**🔴 Amount sent to Razorpay must always be in paise (INR × 100):**

```typescript
// ✅ CORRECT
const amountInPaise = calculateFee(eventId, teamSize) * 100;
await razorpay.orders.create({ amount: amountInPaise, currency: 'INR' });

// ❌ WRONG — passing rupees directly
await razorpay.orders.create({ amount: 99, currency: 'INR' }); // Creates ₹0.99 order!
```

**🔴 Validate order amount server-side before creating:**

```typescript
const expectedFee = calculateFee(eventId, teamSize);
if (expectedFee <= 0) throw new Error('Invalid fee amount');
if (expectedFee > 10000) throw new Error('Fee exceeds maximum allowed'); // Sanity check
```

---

## 9. Security Rules

### 9.1 Authentication

**🔴 Admin password must NOT exist in any frontend code or bundle.**

```typescript
// ❌ NEVER — hardcoded in client (current critical bug)
if (password === 'JBCLUB@10102026') setIsAuthenticated(true);

// ✅ CORRECT — server-side validation
// POST /api/auth/login → server verifies bcrypt hash → returns JWT
```

**🔴 JWTs must be stored in `httpOnly` cookies, never in `localStorage`:**

```typescript
// Server — set cookie on login
res.cookie('voxera_admin_token', token, {
  httpOnly: true,          // JS cannot access
  secure: true,            // HTTPS only
  sameSite: 'strict',      // CSRF protection
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
});

// ❌ NEVER in client
localStorage.setItem('token', jwt); // XSS vulnerable
```

### 9.2 Input Sanitization

**🔴 All user inputs must be validated with Zod before processing.**

**🟡 Sanitize phone numbers and strip non-numeric characters before storing.**

**🔴 Never interpolate user input directly into log messages (log injection):**

```typescript
// ❌ WRONG
logger.info(`Registration from: ${req.body.name}`); // Log injection risk

// ✅ CORRECT
logger.info('New registration', { name: req.body.name, eventId: req.body.eventId });
```

### 9.3 Rate Limiting

**🔴 Apply rate limits to all sensitive endpoints:**

```typescript
import rateLimit from 'express-rate-limit';

export const registrationLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              10,              // 10 registration attempts per IP
  message:          { error: 'Too many registration attempts. Please try again later.' },
  standardHeaders:  true,
  legacyHeaders:    false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,              // 5 login attempts per IP
  message:  { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max:      100,
});

// Apply
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/register', registrationLimiter);
```

### 9.4 Environment Variables

**🔴 Never commit `.env` files. Use `.env.example` as the template.**

**🔴 Fail fast on missing required environment variables at startup:**

```typescript
// server/src/index.ts — startup validation
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'FRONTEND_URL',
];

REQUIRED_ENV_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1); // Crash immediately — do not start with missing config
  }
});
```

---

## 10. Performance Rules

### 10.1 Image Rules

**🔴 All event images must be served via Cloudinary.** No images stored in the repository or served from the app server.

**🔴 All images must use WebP format** with JPEG fallback for older browsers:

```tsx
// ✅ CORRECT — responsive image with WebP
<picture>
  <source srcSet={cloudinaryUrl(image, 'webp')} type="image/webp" />
  <img
    src={cloudinaryUrl(image, 'jpg')}
    alt={eventTitle}
    loading="lazy"
    width={800}
    height={600}   // ALWAYS specify dimensions to prevent layout shift
    className="w-full h-full object-cover"
  />
</picture>
```

**🔴 Always specify `width` and `height` on `<img>` tags** to prevent Cumulative Layout Shift (CLS).

**🟡 Cloudinary URL helper:**

```typescript
// lib/cloudinary.ts
export function cloudinaryUrl(
  publicId: string,
  format: 'webp' | 'jpg' = 'webp',
  width = 800
): string {
  const base = `https://res.cloudinary.com/${process.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
  return `${base}/f_${format},q_auto,w_${width},c_fill/${publicId}`;
}
```

### 10.2 Bundle Rules

**🟡 Monitor bundle size on every PR.** Target: < 200KB gzipped initial JS.

```typescript
// vite.config.ts — bundle analysis
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({ open: true, gzipSize: true }), // Run: vite build --mode analyze
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion':        ['framer-motion'],
          'charts':        ['recharts'],
        },
      },
    },
  },
});
```

### 10.3 API Caching

**🟡 Cache static-ish API responses:**

```typescript
// Events list changes rarely — cache aggressively
router.get('/events', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  // ...
});

// Registration data changes constantly — no cache
router.get('/admin/registrations', verifyAdmin, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  // ...
});
```

---

## 11. Testing Rules

### 11.1 Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Unit tests | Vitest | Fee calculation, utils, validators |
| Component tests | React Testing Library | Form validation, user flows |
| Integration tests | Supertest | API endpoints |
| E2E tests (optional) | Playwright | Registration + payment flow |

### 11.2 What Must Be Tested

**🔴 The fee calculation function must have 100% test coverage:**

```typescript
// server/utils/fees.test.ts
import { calculateFee } from './fees';

describe('calculateFee', () => {
  test('debate single entry: ₹99', () => {
    expect(calculateFee('debate-competition', 1)).toBe(99);
  });
  test('debate team of 2: ₹150', () => {
    expect(calculateFee('debate-competition', 2)).toBe(150);
  });
  test('treasure hunt team: ₹120 fixed', () => {
    expect(calculateFee('treasure-hunt', 4)).toBe(120);
  });
  test('pitch perfect: ₹50 flat', () => {
    expect(calculateFee('pitch-perfect', 1)).toBe(50);
    expect(calculateFee('pitch-perfect', 4)).toBe(50);
  });
  test('open mic single: ₹99', () => {
    expect(calculateFee('open-mic', 1)).toBe(99);
  });
  test('open mic pair: ₹150', () => {
    expect(calculateFee('open-mic', 2)).toBe(150);
  });
  test('poetry per person: ₹99 × teamSize', () => {
    expect(calculateFee('poetry-reciting', 1)).toBe(99);
  });
  test('film per person: ₹80 × crew', () => {
    expect(calculateFee('film-screening', 5)).toBe(400);
  });
  test('unknown event throws error', () => {
    expect(() => calculateFee('unknown-event', 1)).toThrow();
  });
});
```

**🔴 All API endpoints must have integration tests for:**
- Happy path (valid input → correct response)
- Validation failure (invalid input → 400 with error details)
- Auth failure on protected routes (missing token → 401)

---

## 12. Git & Version Control Rules

### 12.1 Branch Strategy

```
main          → Production. Protected. Requires PR + review.
staging       → Pre-production testing. Auto-deploys to staging environment.
feature/*     → Feature branches. Branch from staging.
fix/*         → Bug fix branches.
hotfix/*      → Emergency fixes to main. Requires expedited review.
```

**🔴 Never commit directly to `main` or `staging`.** Always use pull requests.

### 12.2 Commit Message Format

**🔴 Follow Conventional Commits:**

```
<type>(<scope>): <short description>

[optional body]

[optional footer: BREAKING CHANGE, closes #issue]
```

```bash
# Types
feat:     New feature
fix:      Bug fix
perf:     Performance improvement
refactor: Code restructure (no behavior change)
style:    Formatting only
test:     Test changes
docs:     Documentation
chore:    Build scripts, dependencies

# Examples
feat(registration): add dynamic fee display for team events
fix(schedule): replace static data import with live API call
fix(admin): remove hardcoded password from frontend source
perf(events): add Cloudinary CDN for image serving
feat(payment): integrate Razorpay webhook signature verification
```

### 12.3 PR Rules

**🔴 PRs must include:**
- Description of changes
- Screenshot or recording for UI changes
- Test evidence (test output or Playwright recording for E2E)
- No unresolved merge conflicts

**🔴 PRs touching payment, auth, or security code require two reviewer approvals.**

---

## 13. Environment & Configuration Rules

### 13.1 Environment Files

```bash
.env                  # Local development — gitignored, never commit
.env.example          # Template with all keys, no real values — committed
.env.test             # Test environment — gitignored
```

### 13.2 Required Environment Variables

```bash
# .env.example — copy this to .env and fill in values

# ─── Database ───────────────────────────────────────
DATABASE_URL=postgresql://user:password@host:5432/voxera

# ─── Auth ───────────────────────────────────────────
JWT_SECRET=                    # Min 64 chars, random. Generate: openssl rand -hex 32
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=           # bcrypt hash. Generate: node -e "require('bcrypt').hash('pw',12,console.log)"

# ─── Razorpay ───────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_XXXXXXXX      # Use rzp_test_ in dev, rzp_live_ in prod
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# ─── Email (Resend) ─────────────────────────────────
RESEND_API_KEY=re_
FROM_EMAIL=noreply@voxera2026.in
FROM_NAME=VOXERA 2026

# ─── Cloudinary ─────────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ─── App Config ─────────────────────────────────────
NODE_ENV=development           # development | production | test
PORT=3000
FRONTEND_URL=http://localhost:5173   # production: https://voxera2026.in
WEBHOOK_SECRET=                # For Google Forms webhook verification

# ─── Frontend (Vite — prefix with VITE_) ────────────
VITE_API_BASE_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=          # Public key only — safe to expose
VITE_CLOUDINARY_CLOUD_NAME=
VITE_GA4_MEASUREMENT_ID=G-
```

---

## 14. Deployment Rules

### 14.1 Infrastructure

| Service | Platform | Notes |
|---------|---------|-------|
| Frontend | Vercel | Auto-deploy on `main` push |
| Backend | Railway | Dockerfile-based deploy |
| Database | Supabase | PostgreSQL + connection pooler |
| Images | Cloudinary | CDN delivery |
| Email | Resend | Transactional email |
| Monitoring | Sentry | Error tracking frontend + backend |

### 14.2 CI/CD Pipeline Rules

**🔴 No code merges to `main` without passing CI:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, staging]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: TypeScript check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test

      - name: Build check
        run: npm run build
```

### 14.3 Pre-Deploy Checklist

**🔴 Before every production deploy:**

- [ ] All environment variables set in hosting platform dashboard
- [ ] `RAZORPAY_KEY_ID` uses `rzp_live_` prefix (not `rzp_test_`)
- [ ] Database migrations run successfully on production DB
- [ ] Webhook URL in Razorpay dashboard points to production domain
- [ ] `FRONTEND_URL` env var matches actual production domain (for CORS + email links)
- [ ] Sentry DSN configured for both frontend and backend

---

## 15. Accessibility Rules

**🔴 Minimum WCAG 2.1 Level AA compliance required.**

**🔴 All interactive elements must have ARIA labels when visual label is absent:**

```tsx
// ❌ WRONG — icon button with no accessible name
<button onClick={closeModal}>
  <X className="w-5 h-5" />
</button>

// ✅ CORRECT
<button onClick={closeModal} aria-label="Close registration modal">
  <X className="w-5 h-5" aria-hidden="true" />
</button>
```

**🔴 All form inputs must have associated `<label>` elements:**

```tsx
// ✅ CORRECT — explicit label association
<label htmlFor="email" className="text-text-secondary text-sm">
  Email Address
</label>
<input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
  {...register('email')}
/>
{errors.email && (
  <span id="email-error" role="alert" className="text-semantic-error text-sm">
    {errors.email.message}
  </span>
)}
```

**🔴 Color contrast: All text must pass WCAG AA (4.5:1 ratio).** The design token system is pre-validated for this — do not override token colors with custom hex values.

**🟡 Implement a visible skip-nav link for keyboard users:**

```tsx
// Layout.tsx — first element in body
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50
             focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-card"
>
  Skip to main content
</a>
```

---

## 16. SEO Rules

**🔴 Every page must use React Helmet Async for meta tags:**

```tsx
// Every page component — required
import { Helmet } from 'react-helmet-async';

export default function EventDetail({ event }: { event: VoxeraEvent }) {
  return (
    <>
      <Helmet>
        <title>{event.title} — VOXERA 2026 | JB Language Club</title>
        <meta name="description" content={event.shortDescription} />
        <meta property="og:title" content={`${event.title} — VOXERA 2026`} />
        <meta property="og:description" content={event.shortDescription} />
        <meta property="og:image" content={event.bannerImage} />
        <meta property="og:type" content="event" />
        <link rel="canonical" href={`https://voxera2026.in/events/${event.id}`} />
      </Helmet>
      {/* page content */}
    </>
  );
}
```

**🔴 All images must have descriptive `alt` text.** Never use `alt=""` except for decorative images.

**🟡 Implement JSON-LD event structured data on the homepage and event detail pages.**

---

## 17. Error Handling Rules

### 17.1 Frontend Error Handling

**🔴 All pages must be wrapped in an Error Boundary:**

```tsx
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
          <div className="text-center max-w-md px-6">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Something went wrong</h1>
            <p className="text-text-secondary mb-8">
              We encountered an unexpected error. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-accent text-white rounded-card font-semibold"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**🟡 Use Axios interceptors to handle API errors globally:**

```typescript
// lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Send httpOnly cookies
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 17.2 Backend Error Handling

**🔴 Use a global error handler as the last Express middleware:**

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Never expose internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred'
    : err.message;

  res.status(500).json({ success: false, error: message });
}

// Register LAST in server/src/index.ts
app.use(globalErrorHandler);
```

---

## 18. Code Quality Rules

### 18.1 ESLint Configuration

**🔴 All code must pass ESLint without errors before merge:**

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### 18.2 Code Review Checklist

Before approving any PR, verify:

- [ ] No hardcoded secrets, API keys, or passwords
- [ ] No `any` TypeScript types
- [ ] No `console.log` debug statements
- [ ] No hardcoded hex color values (use CSS tokens)
- [ ] Fee amounts never accepted from client request body
- [ ] All new routes have rate limiting applied
- [ ] All new admin routes have `verifyAdmin` middleware
- [ ] New images use Cloudinary URLs + WebP format
- [ ] Animations wrapped in `prefers-reduced-motion` check
- [ ] All interactive elements have ARIA labels
- [ ] New pages have Helmet SEO meta tags

### 18.3 Prohibited Patterns

**🔴 The following patterns are banned in this codebase:**

```typescript
// 1. Hardcoded credentials
if (password === 'JBCLUB@10102026') { ... }   // ❌ BANNED

// 2. Client-side fee amounts
const fee = req.body.fee;                      // ❌ BANNED — always calculate server-side

// 3. Any type
const data: any = response.data;              // ❌ BANNED

// 4. Direct DB access in route handlers
app.get('/events', async (req, res) => {
  const events = await db.query('...');        // ❌ BANNED — use controller layer
});

// 5. JWT in localStorage
localStorage.setItem('token', jwt);           // ❌ BANNED — use httpOnly cookies

// 6. useEffect for data fetching
useEffect(() => { fetch('/api/events')... }); // ❌ BANNED — use SWR

// 7. Unauthenticated admin routes
router.get('/admin/registrations', handler);  // ❌ BANNED — must have verifyAdmin

// 8. Inline color values
style={{ color: '#10B981' }}                  // ❌ BANNED — use CSS token class
```

---

## Appendix: Quick Reference

### Fee Reference Table

| Event | Single | Team | Notes |
|-------|--------|------|-------|
| Debate | ₹99 | ₹150 (2 people) | Team of exactly 2 |
| Treasure Hunt | — | ₹120 (team) | Fixed per team of 4 |
| Pitch Perfect | ₹50 | ₹50 (flat) | Same regardless of team size |
| Open Mic | ₹99 | ₹150 (2 people) | Pair or individual |
| Poetry | ₹99 | — | Individual only |
| Film Screening | ₹80/person | ₹80 × crew | Per crew member |

> ⚠️ **Always calculate fees server-side using `calculateFee()` in `server/utils/fees.ts`.**
> Never use these constants directly in client code for billing purposes.

### Registration Code Format

```
VX-{YEAR}-{ZERO_PADDED_ID}

Examples:
  VX-2026-0001   First registration
  VX-2026-0042   42nd registration
  VX-2026-0500   500th registration
```

### Key Contacts

| Role | Responsibility |
|------|---------------|
| Tech Lead | Architecture decisions, security reviews |
| Frontend Dev | React, UI, animations, responsiveness |
| Backend Dev | API, payment, email, DB |
| Designer | Design tokens, component specs, assets |

---

*TECH_RULES.md · VOXERA 2026 · JB Language Club Engineering*
*This is a living document. Propose changes via PR with justification.*
