import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';

// ── Festivals ──
export const festivals = pgTable('festivals', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull().unique(),
    logo_url: text('logo_url'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── Editions ──
export const editions = pgTable('editions', {
    id: serial('id').primaryKey(),
    festival_id: integer('festival_id').notNull(),
    year: integer('year').notNull(),
    theme: varchar('theme', { length: 256 }),
    start_date: varchar('start_date', { length: 64 }),
    end_date: varchar('end_date', { length: 64 }),
    is_active: boolean('is_active').notNull().default(true),
    active_edition: boolean('active_edition').notNull().default(false),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── Events ──
export const events = pgTable('events', {
    id: varchar('id', { length: 128 }).primaryKey(),
    edition_id: integer('edition_id'),
    title: varchar('title', { length: 256 }).notNull(),
    description: text('description').notNull(),
    short_description: varchar('short_description', { length: 256 }),
    date: varchar('date', { length: 64 }).notNull(),
    time: varchar('time', { length: 64 }),
    location: varchar('location', { length: 128 }),
    category: varchar('category', { length: 64 }),
    image: text('image'),
    banner_image: text('banner_image'),
    thumbnail_image: text('thumbnail_image'),
    rules: jsonb('rules').$type<string[]>().default([]),
    team_size: varchar('team_size', { length: 32 }),
    prize: varchar('prize', { length: 64 }),
    rounds: jsonb('rounds').$type<Array<{ title: string; description: string }>>(),
    registration_fee_single: integer('registration_fee_single').notNull().default(0),
    registration_fee_team: integer('registration_fee_team'),
    team_size_min: integer('team_size_min').notNull().default(1),
    team_size_max: integer('team_size_max').notNull().default(1),
    registration_enabled: boolean('registration_enabled').notNull().default(true),
    is_published: boolean('is_published').notNull().default(false),
    is_archived: boolean('is_archived').notNull().default(false),
    google_form_url: text('google_form_url'),
    slots_total: integer('slots_total'),
    slots_filled: integer('slots_filled').notNull().default(0),
    judging_criteria: jsonb('judging_criteria').$type<string[]>().default([]),
    coordinators: jsonb('coordinators').$type<Array<{ name: string; phone: string; role: string }>>().default([]),
    display_order: integer('display_order').notNull().default(0),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── Registrations ──
export const registrations = pgTable('registrations', {
    id: serial('id').primaryKey(),
    registration_code: varchar('registration_code', { length: 32 }).notNull().unique(),
    event_id: varchar('event_id', { length: 128 }).notNull(),
    edition_id: integer('edition_id'),
    primary_name: varchar('primary_name', { length: 256 }).notNull(),
    primary_email: varchar('primary_email', { length: 256 }).notNull(),
    primary_phone: varchar('primary_phone', { length: 20 }),
    college_name: varchar('college_name', { length: 256 }),
    department: varchar('department', { length: 128 }),
    year_of_study: varchar('year_of_study', { length: 32 }),
    roll_number: varchar('roll_number', { length: 64 }),
    team_size: integer('team_size').notNull().default(1),
    team_members: jsonb('team_members').$type<Array<{ name: string; email: string }>>().default([]),
    fee_amount: integer('fee_amount').notNull(),
    payment_id: varchar('payment_id', { length: 128 }),
    order_id: varchar('order_id', { length: 128 }),
    payment_status: varchar('payment_status', { length: 32 }).notNull().default('pending'),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    attended_at: timestamp('attended_at'),
    created_at: timestamp('created_at').defaultNow(),
});

// ── Razorpay Orders ──
export const razorpayOrders = pgTable('razorpay_orders', {
    id: serial('id').primaryKey(),
    order_id: varchar('order_id', { length: 128 }).notNull().unique(),
    event_id: varchar('event_id', { length: 128 }).notNull(),
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('INR'),
    status: varchar('status', { length: 32 }).notNull().default('created'),
    receipt: varchar('receipt', { length: 128 }),
    payload: jsonb('payload'),
    created_at: timestamp('created_at').defaultNow(),
});

// ── Admin Users ──
export const adminUsers = pgTable('admin_users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 64 }).notNull().unique(),
    email: varchar('email', { length: 256 }),
    password_hash: varchar('password_hash', { length: 256 }).notNull(),
    role: varchar('role', { length: 32 }).notNull().default('super_admin'),
    is_active: boolean('is_active').notNull().default(true),
    last_login_at: timestamp('last_login_at'),
    created_at: timestamp('created_at').defaultNow(),
});

// ── Team Members ──
export const teamMembers = pgTable('team_members', {
    id: serial('id').primaryKey(),
    edition_id: integer('edition_id'),
    name: varchar('name', { length: 256 }).notNull(),
    photo_url: text('photo_url'),
    role: varchar('role', { length: 128 }),
    designation: varchar('designation', { length: 256 }),
    dept_group: varchar('dept_group', { length: 64 }),
    display_order: integer('display_order').notNull().default(0),
    linkedin_url: text('linkedin_url'),
    instagram_url: text('instagram_url'),
    email: varchar('email', { length: 256 }),
    phone: varchar('phone', { length: 20 }),
    bio: text('bio'),
    join_date: varchar('join_date', { length: 64 }),
    contributions: text('contributions'),
    skills: text('skills'),
    year_branch: varchar('year_branch', { length: 128 }),
    motto: varchar('motto', { length: 256 }),
    is_active: boolean('is_active').notNull().default(true),
    is_archived: boolean('is_archived').notNull().default(false),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── Site Settings ──
export const siteSettings = pgTable('site_settings', {
    key: varchar('key', { length: 128 }).primaryKey(),
    value: text('value'),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── Content CMS ──
export const content = pgTable('content', {
    id: serial('id').primaryKey(),
    edition_id: integer('edition_id'),
    key: varchar('key', { length: 128 }).notNull(),
    value: text('value'),
    content_type: varchar('content_type', { length: 32 }).notNull().default('text'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── FAQs ──
export const faq = pgTable('faq', {
    id: serial('id').primaryKey(),
    edition_id: integer('edition_id'),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    category: varchar('category', { length: 64 }).notNull().default('General'),
    display_order: integer('display_order').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── Announcements ──
export const announcements = pgTable('announcements', {
    id: serial('id').primaryKey(),
    edition_id: integer('edition_id'),
    text: text('text').notNull(),
    color: varchar('color', { length: 32 }).notNull().default('#7c3aed'),
    link_url: text('link_url'),
    is_active: boolean('is_active').notNull().default(true),
    expires_at: timestamp('expires_at'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── Media Assets ──
export const mediaAssets = pgTable('media_assets', {
    id: serial('id').primaryKey(),
    filename: varchar('filename', { length: 256 }).notNull(),
    original_name: varchar('original_name', { length: 256 }).notNull(),
    url: text('url').notNull(),
    mime_type: varchar('mime_type', { length: 64 }).notNull(),
    size_bytes: integer('size_bytes').notNull(),
    tags: jsonb('tags').$type<string[]>().default([]),
    uploaded_by: integer('uploaded_by'),
    created_at: timestamp('created_at').defaultNow(),
});

// ── Contact Submissions ──
export const contactSubmissions = pgTable('contact_submissions', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).notNull(),
    subject: varchar('subject', { length: 256 }),
    message: text('message').notNull(),
    status: varchar('status', { length: 32 }).notNull().default('new'),
    is_read: boolean('is_read').notNull().default(false),
    created_at: timestamp('created_at').defaultNow(),
});

// ── Audit Log ──
export const auditLog = pgTable('audit_log', {
    id: serial('id').primaryKey(),
    admin_user_id: integer('admin_user_id'),
    admin_username: varchar('admin_username', { length: 64 }),
    action: varchar('action', { length: 64 }).notNull(),
    entity_type: varchar('entity_type', { length: 64 }).notNull(),
    entity_id: varchar('entity_id', { length: 128 }),
    old_value: jsonb('old_value'),
    new_value: jsonb('new_value'),
    ip_address: varchar('ip_address', { length: 64 }),
    created_at: timestamp('created_at').defaultNow(),
});

// ── Google Form Submissions ──
export const googleFormSubmissions = pgTable('google_form_submissions', {
    id: serial('id').primaryKey(),
    event_id: varchar('event_id', { length: 128 }),
    form_response_id: varchar('form_response_id', { length: 256 }),
    payload: jsonb('payload'),
    created_at: timestamp('created_at').defaultNow(),
});

// ── Sponsors ──
export const sponsors = pgTable('sponsors', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    logo_url: text('logo_url'),
    website_url: text('website_url'),
    tier: varchar('tier', { length: 32 }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
});

// ── Testimonials ──
export const testimonials = pgTable('testimonials', {
    id: serial('id').primaryKey(),
    quote: text('quote').notNull(),
    name: varchar('name', { length: 256 }).notNull(),
    college: varchar('college', { length: 256 }),
    emoji: varchar('emoji', { length: 8 }).default('⭐'),
    display_order: integer('display_order').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── Timeline Events ──
export const timelineEvents = pgTable('timeline_events', {
    id: serial('id').primaryKey(),
    day_label: varchar('day_label', { length: 64 }).notNull(),
    day_color: varchar('day_color', { length: 32 }).default('teal'),
    time: varchar('time', { length: 32 }).notNull(),
    title: varchar('title', { length: 256 }).notNull(),
    description: varchar('description', { length: 256 }),
    icon: varchar('icon', { length: 32 }).default('Calendar'),
    event_link: varchar('event_link', { length: 128 }),
    display_order: integer('display_order').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── Past Events ──
export const pastEvents = pgTable('past_events', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    date: varchar('date', { length: 128 }).notNull(),
    year: varchar('year', { length: 8 }).notNull(),
    description: text('description'),
    winner_info: text('winner_info'),
    photos: jsonb('photos').$type<string[]>().default([]),
    highlights: text('highlights'),
    participants_count: integer('participants_count'),
    display_order: integer('display_order').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});
