**VOXERA**

Cultural & Literary Festival Platform

**ADMIN PANEL**

Product Requirements Document

  ------------------------------- ---------------------------------------
  **Document Version**            v1.0.0 --- Final

  **Status**                      Approved for Development

  **Product Owner**               JB Language Club --- Tech Team

  **Prepared By**                 Product & Architecture Team

  **Date**                        February 2026

  **Classification**              Internal --- Engineering & Design
  ------------------------------- ---------------------------------------

JB Language Club · JBIET Chapter · voxera2026.in

**1. Product Overview**

**1.1 Purpose**

The VOXERA Admin Panel is a centralized, secure, web-based management
system that allows authorized staff to control every aspect of the
VOXERA festival platform --- without writing a single line of code. It
is designed as a **multi-event, multi-year platform** that can power not
just VOXERA 2026, but every future edition of VOXERA and any new
festivals launched by JB Language Club.

The admin panel eliminates the current dependency on developer
intervention for routine operations such as adding events, updating team
members, viewing registrations, and changing homepage content.

**1.2 Target Users**

The panel serves four distinct internal user types:

  ---------------- ---------------- ------------------ -------------------
  **Role**         **Who They Are** **Primary          **Example**
                                    Responsibility**   

  **Super Admin**  Club President / Full system        Club President or
                   Tech Lead        access. Manage all designated Tech
                                    features, users,   Lead
                                    and settings       

  **Event          Event            Create and manage  Individual event
  Manager**        Coordinators     events, toggle     coordinator
                                    registration, view 
                                    participants       

  **Content        PR / Design team Update homepage    Social media or PR
  Editor**                          text, hero         volunteer
                                    content, FAQs,     
                                    announcements      

  **Technical      Developer on the System settings,   Developer
  Admin**          team             API keys, SEO,     maintaining the
                                    database exports   site
  ---------------- ---------------- ------------------ -------------------

**1.3 Scope**

-   Manages all events across all years and all festivals

-   Manages team members, their roles, photos, and year associations

-   Manages all registrations with export and manual confirmation

-   Manages all public-facing website content without code changes

-   Provides analytics and reporting for organizers

-   Enforces role-based access so each user only sees what they need

**2. Goals & Success Metrics**

**2.1 Primary Goals**

  -------- ------------------------------- ------------------------------------
  **\#**   **Goal**                        **Success Metric**

  **G1**   Zero-code content management    Any content change completable in \<
                                           2 minutes without developer help

  **G2**   Complete registration           100% of registrations visible in
           visibility                      real-time with export capability

  **G3**   Multi-year reusability          System reused for VOXERA 2027 with
                                           zero new infrastructure work

  **G4**   Team management independence    New team member added/removed by any
                                           editor in \< 1 minute

  **G5**   Secure access control           Zero unauthorized data access; all
                                           writes authenticated and logged

  **G6**   Event launch speed              New event published from scratch in
                                           \< 10 minutes

  **G7**   Data integrity                  Zero registration data loss; all
                                           exports match DB records 100%
  -------- ------------------------------- ------------------------------------

**2.2 Anti-Goals (Out of Scope)**

-   Public-facing participant profile pages

-   Real-time chat or messaging between organizers

-   Mobile app version of admin panel (web-only for now)

-   Automated social media posting

-   Third-party ticketing platform integration

**3. User Roles & Permissions**

**3.1 Role Definitions & Permission Matrix**

Permissions use the format: **C** = Create · **R** = Read · **U** =
Update · **D** = Delete · **X** = No Access

  ---------------------- ------------ ------------ ------------ -------------
  **Feature Area**       **Super      **Event      **Content    **Technical
                         Admin**      Manager**    Editor**     Admin**

  Events --- Create /    **CRUD**     **CRU**      **R**        **CRUD**
  Edit / Delete                                                 

  Events --- Publish /   **Yes**      **Yes**      **No**       **Yes**
  Unpublish                                                     

  Events --- Toggle      **Yes**      **Yes**      **No**       **Yes**
  Registration                                                  

  Team Members --- Full  **CRUD**     **No**       **CRU**      **CRUD**
  CRUD                                                          

  Team Members ---       **Yes**      **No**       **Yes**      **Yes**
  Archive                                                       

  Registrations --- View **Yes**      **Yes**      **No**       **Yes**

  Registrations ---      **Yes**      **Yes**      **No**       **Yes**
  Export CSV                                                    

  Registrations ---      **Yes**      **Yes**      **No**       **No**
  Confirm / Reject                                              

  Registrations ---      **Yes**      **No**       **No**       **Yes**
  Delete                                                        

  Content --- Hero /     **CRUD**     **No**       **CRUD**     **CRUD**
  Homepage                                                      

  Content --- FAQs /     **CRUD**     **No**       **CRUD**     **CRUD**
  Banners                                                       

  Media Library          **CRUD**     **CRU**      **CRU**      **CRUD**

  Analytics --- View     **Yes**      **Yes**      **No**       **Yes**

  Settings --- SEO /     **Yes**      **No**       **No**       **Yes**
  Branding                                                      

  Admin Users --- Manage **CRUD**     **No**       **No**       **CRUD**

  Audit Logs --- View    **Yes**      **No**       **No**       **Yes**

  Multi-Festival ---     **Yes**      **No**       **No**       **Yes**
  Manage                                                        
  ---------------------- ------------ ------------ ------------ -------------

**3.2 Access Control Implementation Rules**

-   All admin routes must be protected by server-side JWT verification
    middleware

-   Role is embedded in the JWT payload at login --- not stored
    client-side

-   Frontend renders UI conditionally based on role, but server enforces
    all permissions independently

-   Sessions expire after 24 hours --- refresh token required for
    extended sessions

-   Failed permission checks must return 403 with a logged audit entry

-   Super Admin cannot be deleted if they are the last Super Admin in
    the system

**4. System Architecture**

**4.1 High-Level Architecture**

The admin panel is a **modular React SPA** served by the same Vite
frontend as the public website, but gated behind authentication. The
backend is a **Node.js + Express REST API** connected to a **PostgreSQL
database** via Drizzle ORM. All admin operations are executed through
versioned, authenticated API routes.

**4.2 Modular Structure**

  ------------------- ------------------------- ---------------------------
  **Module**          **Frontend**              **Backend**

  **Auth**            AdminLogin.tsx,           /api/auth/\* --- login,
                      ProtectedRoute.tsx,       logout, refresh, me
                      authStore.ts              

  **Events**          EventsManager.tsx,        /api/admin/events ---
                      EventFormModal.tsx        CRUD + toggle

  **Team**            TeamManager.tsx,          /api/admin/team --- CRUD +
                      MemberFormModal.tsx       archive + reorder

  **Registrations**   RegistrationsTable.tsx,   /api/admin/registrations
                      ExportPanel.tsx           --- view, confirm, export

  **Content CMS**     ContentEditor.tsx,        /api/admin/content ---
                      BannerManager.tsx         hero, FAQs, announcements

  **Media**           MediaLibrary.tsx,         /api/admin/media ---
                      FileUploader.tsx          upload, list, delete

  **Analytics**       AnalyticsDashboard.tsx    /api/admin/analytics ---
                                                stats aggregation

  **Settings**        SiteSettings.tsx,         /api/admin/settings,
                      UserManager.tsx           /api/admin/users
  ------------------- ------------------------- ---------------------------

**4.3 Multi-Event Architecture**

Every entity in the system is scoped to a **Festival** and an
**Edition** (year). This allows the same admin panel to manage VOXERA
2026, VOXERA 2027, and entirely different festivals like \"LINGUAFEST\"
or \"ARTWAVE\" simultaneously.

-   Festival --- top-level entity (e.g. \"VOXERA\", \"LinguaFest\")

-   Edition --- year-scoped instance of a festival (e.g. \"VOXERA
    2026\", \"VOXERA 2027\")

-   Event --- individual competition/event within an edition (e.g.
    \"Debate Competition\")

-   All registrations, team members, and content are linked to a
    specific Edition

-   Switching between festivals/years is a context selector in the top
    nav bar of admin

**4.4 Conceptual Entity Relationships**

**Festival** 1 → N **Edition** 1 → N **Event** 1 → N **Registration**

**Edition** 1 → N **TeamMember**

**Event** 1 → N **EventCategory** (via junction)

**AdminUser** 1 → N **AuditLog**

**MediaAsset** is shared globally or scoped to Edition

**5. Core Features**

**5A. Event Management**

**Create / Edit Events**

The event creation form must support all fields required for a fully
functional event listing:

  ------------------ ---------------------- ------------------------------
  **Field**          **Type**               **Notes**

  **Title**          Text                   Required. Max 80 chars

  **Short            Text                   Used on event cards. Max 160
  Description**                             chars

  **Full             Rich Text (Markdown)   Rendered on event detail page
  Description**                             

  **Category**       Dropdown               Literary / Cultural / Informal
                                            / Management

  **Date & Time**    Date + Time Picker     Start and end time

  **Venue**          Text                   Room/hall name

  **Banner Image**   Media Library Picker   High-res image for event
                                            detail page

  **Thumbnail        Media Library Picker   Card thumbnail image
  Image**                                   

  **Registration Fee Number (₹)             Server-authoritative
  (Solo)**                                  

  **Registration Fee Number (₹) + null      Set to N/A if solo-only event
  (Team)**           toggle                 

  **Min Team Size**  Number                 Minimum 1

  **Max Team Size**  Number                 If = 1, team option is hidden
                                            in frontend

  **Total Slots**    Number + \"Unlimited\" If set, registration closes
                     toggle                 when filled

  **Rules**          List editor            Ordered list of competition
                     (add/remove/reorder)   rules

  **Judging          List editor            Criteria shown on event detail
  Criteria**                                page

  **Google Form      URL + Test button      Validates URL is a real Google
  URL**                                     Forms link

  **Coordinators**   Repeatable group       Name, Phone, Role per
                                            coordinator

  **Is Published**   Toggle                 Controls public visibility

  **Registration     Toggle                 Overrides slot count ---
  Enabled**                                 manual override

  **Display Order**  Number                 Controls ordering on events
                                            listing page
  ------------------ ---------------------- ------------------------------

**Event Actions**

-   Publish / Unpublish --- single toggle, instant effect on public site

-   Open / Close Registration --- independent of publish status

-   Duplicate --- clone entire event as a draft for new edition

-   Archive --- soft delete, hidden from public but preserved in DB

-   Preview --- opens a read-only view of how the event looks on public
    site

-   Drag-to-reorder --- change display order on the events listing page

-   Slot progress bar --- shows X / Y registered at a glance on the
    events list

**5B. Team Management**

⭐ This is the most critical section. Team leadership changes every
year. The entire Team page on the public site must be driven by this
module --- zero hardcoding.

**Team Member Fields**

  ------------------ ---------------- ------------------------------------
  **Field**          **Type**         **Notes**

  **Full Name**      Text             Required

  **Profile Photo**  Image Upload /   Cropped to 1:1. Shown on Team page
                     Media Picker     

  **Role / Title**   Text             e.g. President, Vice President, Tech
                                      Lead

  **Designation**    Text             e.g. B.Sc CS 3rd Year (shown as
                                      subtitle)

  **Department       Dropdown         e.g. Core Team, Technical, Creative,
  Group**                             Outreach

  **Festival         Linked to        e.g. VOXERA 2026 --- enables
  Edition**          Edition          year-based filtering

  **Display Order**  Number           Controls order within group

  **LinkedIn URL**   URL (optional)   Social link shown on Team card

  **Instagram URL**  URL (optional)   Social link shown on Team card

  **Is Active**      Toggle           Show/hide without deleting

  **Is Archived**    Toggle           Move to past team --- hides from
                                      current year, keeps in history
  ------------------ ---------------- ------------------------------------

**Team Management Actions**

-   Add new member with photo upload directly in the form

-   Edit any existing member --- all fields editable

-   Remove member --- soft delete, confirm dialog required

-   Archive member --- moves to \"Past Teams\" view, stays in DB

-   Reorder within group --- drag handles to reorder members in same
    department group

-   Bulk archive all members of an Edition --- \"End of Year\" action to
    archive entire team

-   Copy structure --- duplicate the current year\'s team structure for
    new year with empty names

-   Filter by Edition --- view \"VOXERA 2026 Team\" vs \"VOXERA 2025
    Team\" separately

-   Filter by Group --- Core Team / Technical / Creative / Outreach
    separately

> **ℹ** *The public Team page should render groups in a defined order,
> with member cards derived entirely from this admin data. No team
> member should ever be hardcoded in frontend source code.*

**5C. Registration Management**

**Registration Table**

The registrations tab must display a searchable, filterable, sortable
table of all registrations:

-   Columns: VX Code, Name, Email, Phone, College, Department, Year,
    Roll No, Event, Type (Solo/Team), Fee, Status, Registered On

-   Team member details expandable in a row drawer (click row to expand)

-   Real-time search across Name, Email, VX Code, College

-   Filter by: Event, Status (Pending / Confirmed / Cancelled), Date
    range, Participation type

-   Sort by any column header (ascending / descending)

-   Pagination --- 25 / 50 / 100 rows per page

**Registration Actions**

-   Confirm --- manually mark a registration as confirmed (for offline
    payment verification)

-   Cancel --- mark as cancelled with optional reason note

-   View full details --- modal with all participant and team member
    data

-   Mark attendance --- check-in button for day-of event management

-   Export CSV --- all visible (filtered) records exported as .csv

-   Export Excel --- same as CSV but .xlsx format

-   Bulk confirm --- select multiple pending registrations and confirm
    all at once

-   Send reminder email --- trigger a reminder email to pending
    registrations for a specific event

**Registration Stats Strip**

At the top of the Registrations tab, always show:

-   Total Registrations (all time)

-   Today\'s Registrations count

-   Confirmed count vs Pending count vs Cancelled count

-   Per-event registration bar showing X registered / Y total slots

**5D. Content Management (CMS)**

**Homepage Content**

-   Hero Title --- main headline text

-   Hero Tagline --- subtitle below title

-   Hero Background Image / Video URL

-   Stats Strip values --- Events count, Participants display text,
    Prize Pool display text

-   About Section --- description text and key highlights (editable
    list)

-   CTA Button labels and link targets

**Announcement Banner**

-   Banner text --- e.g. \"Early bird registration closes March 10!\"

-   Banner color --- choose from preset palette

-   Show / Hide toggle

-   Auto-hide after date --- set expiry datetime

-   Link URL --- optional CTA link inside the banner

**FAQ Management**

-   Add / edit / delete FAQ items

-   Reorder via drag and drop

-   Group FAQs into categories (Registration, Events, General)

**Event Schedule Page**

-   All schedule data comes from Events in the DB --- no separate
    schedule editor needed

-   Day 1 / Day 2 classification --- added as a field on each event (Day
    1 or Day 2)

**5E. Media Management**

**Central Media Library**

A shared media library accessible from all admin modules. Any image
field in any form should open this library as a picker modal.

-   Upload images --- drag and drop or file picker (JPG, PNG, WebP, SVG)

-   File size limit --- 5MB per file

-   Auto-generate thumbnail on upload

-   Search by filename or tag

-   Tag images --- e.g. \"hero\", \"team\", \"event-banner\"

-   Copy URL --- one-click to copy the CDN URL

-   Delete --- with usage check (warn if image is used in an active
    event/content)

-   Folder organization --- optional folder grouping by year or category

**5F. Analytics Dashboard**

**Overview Metrics (Always Visible)**

  ---------------------- ------------------------------------------------
  **Metric**             **Description**

  **Total                All-time count with today\'s count as a subtitle
  Registrations**        

  **Revenue Collected**  Sum of confirmed registration fees in ₹

  **Pending              Count of registrations awaiting confirmation
  Registrations**        

  **Events Published**   Count of live events vs total events

  **Registration by      Bar chart --- registrations per event
  Event**                

  **Registration over    Line chart --- daily registrations over last 30
  Time**                 days

  **Top College**        Most represented college in registrations

  **Participation Type   Donut chart --- Solo vs Team registrations
  Split**                
  ---------------------- ------------------------------------------------

> **ℹ** *Charts are rendered client-side using the registration data
> from the API --- no third-party analytics service required for basic
> metrics.*

**5G. Site Settings**

**Branding**

-   Festival logo upload (shown in navbar and emails)

-   Primary accent color (hex code --- updates CSS variable)

-   Festival tagline (used in emails and SEO)

**Contact Information**

-   Contact email --- shown in footer and used as reply-to in emails

-   Contact phone number --- shown in footer

-   Venue address --- shown on contact page and in confirmation emails

**Social Media URLs**

-   Instagram, Twitter/X, LinkedIn, YouTube, WhatsApp group link

**SEO Metadata**

-   Default page title template

-   Meta description

-   OG image URL (for WhatsApp/social sharing preview)

-   Google Analytics measurement ID (GA4)

**Event Activation**

-   Active Edition selector --- which year\'s events show on the public
    site

-   Registration global kill switch --- disable all registrations
    instantly

-   Maintenance mode toggle --- shows a maintenance page to public users

**Admin User Management**

-   View all admin users with their roles and last login

-   Create new admin user --- name, email, password, role assignment

-   Edit role of existing user

-   Deactivate user account (does not delete --- preserves audit trail)

-   Force logout --- invalidate all sessions for a specific user

**6. Database Model (Conceptual)**

The following entities and their key fields define the data
architecture. All entities include standard audit fields:
**created_at**, **updated_at**, **created_by**.

**6.1 Core Entities**

  ----------------------- ----------------------- ------------------------------------
  **Entity**              **Key Fields**          **Relationships & Notes**

  **Festival**            id, name, slug,         Top-level container. One per
                          logo_url, is_active     festival brand (VOXERA, etc.)

  **Edition**             id, festival_id, year,  One per year. \"active_edition\"
                          theme, start_date,      flag controls what the public sees.
                          end_date, is_active,    
                          active_edition          

  **Event**               id, edition_id, title,  Core event entity. Fully scoped to
                          slug, category,         an Edition.
                          description, rules\[\], 
                          judging_criteria\[\],   
                          fees,                   
                          team_size_min/max,      
                          slots_total,            
                          slots_filled,           
                          is_published,           
                          registration_enabled,   
                          google_form_url,        
                          display_order           

  **Registration**        id, event_id,           status: pending \| confirmed \|
                          edition_id, vx_code,    cancelled
                          name, email, phone,     
                          college, dept, year,    
                          roll_no,                
                          participation_type,     
                          total_fee, status,      
                          team_members (JSONB),   
                          attended_at             

  **TeamMember**          id, edition_id, name,   Fully scoped to Edition. Archived
                          photo_url, role,        members preserved.
                          designation,            
                          dept_group,             
                          display_order,          
                          linkedin_url,           
                          instagram_url,          
                          is_active, is_archived  

  **AdminUser**           id, username, email,    role: super_admin \| event_manager
                          password_hash, role,    \| content_editor \| technical_admin
                          is_active,              
                          last_login_at           

  **Content**             id, edition_id, key,    Key-value CMS. key examples:
                          value, content_type     hero_title, hero_tagline,
                          (text \| html \| url \| about_text, stats_events
                          json)                   

  **MediaAsset**          id, filename,           Shared across all editions unless
                          original_name, url,     tagged otherwise
                          mime_type, size_bytes,  
                          tags\[\], uploaded_by   

  **Announcement**        id, edition_id, text,   Site-wide banner shown to public
                          color, link_url,        users
                          is_active, expires_at   

  **FAQ**                 id, edition_id,         FAQs shown on public site
                          question, answer,       
                          category,               
                          display_order,          
                          is_active               

  **ContactSubmission**   id, name, email,        Status managed from Contacts tab in
                          subject, message,       admin
                          status (new \| read \|  
                          replied), created_at    

  **AuditLog**            id, admin_user_id,      Immutable. Never deleted. All writes
                          action, entity_type,    logged.
                          entity_id, old_value    
                          (JSONB), new_value      
                          (JSONB), ip_address,    
                          created_at              
  ----------------------- ----------------------- ------------------------------------

**7. Admin Panel UX Requirements**

**7.1 Layout**

-   Fixed left sidebar --- Festival/Edition context switcher at top,
    navigation links below

-   Top bar --- current festival + edition name, logged-in user name +
    role badge, logout button

-   Main content area --- scrollable, max-width container for all tab
    content

-   Breadcrumb --- e.g. \"VOXERA 2026 \> Events \> Edit: Debate
    Competition\"

**7.2 Search & Filters**

-   Every list view (Events, Registrations, Team, Media) must have a
    real-time search input

-   Filters shown as pill/chip selectors above the table, not buried in
    a modal

-   Active filters visually indicated --- easy one-click clear

-   Filter state persisted in URL query params for shareability

**7.3 Bulk Actions**

-   Checkbox on each table row for multi-select

-   Floating action bar appears at bottom when rows are selected

-   Bulk actions available: Confirm, Cancel, Export Selected, Archive
    Selected

-   Confirmation dialog for all destructive bulk actions

**7.4 Forms & Modals**

-   All create/edit forms open as slide-over panels (not full page
    navigations)

-   Inline validation --- errors shown below each field as user types

-   Unsaved changes warning --- prompt before closing form if data was
    entered

-   Auto-save draft --- form data saved to localStorage every 30s as
    draft

**7.5 Feedback & Loading States**

-   All async actions show a loading spinner on the triggering button

-   Success/error toast notifications (bottom-right corner, 4s
    auto-dismiss)

-   Skeleton loading states on all tables and cards during initial data
    fetch

-   Empty states with clear instructions when no data exists

**7.6 Responsive Design**

-   Full functionality on desktop (1280px+) --- primary use case

-   Usable on tablet (768px+) --- sidebar collapses to icon-only

-   Mobile (375px+) --- sidebar hidden, accessible via hamburger menu.
    Limited to read-only views only

**8. Security Requirements**

**8.1 Authentication**

-   JWT-based authentication --- tokens signed with HS256, 24-hour
    expiry

-   JWT stored in httpOnly, SameSite=Strict cookie --- never in
    localStorage

-   bcrypt (cost factor 12) for password hashing --- never stored in
    plaintext

-   Rate limiting --- login endpoint: 10 attempts per 15 minutes per IP,
    then 1-hour lockout

-   Login attempt logging --- IP, timestamp, success/failure stored in
    AuditLog

-   Forced re-authentication required after password change

**8.2 Authorization**

-   Every API route checks role from JWT on the server --- client-side
    role checks are UI-only

-   Resource ownership checked --- Event Manager A cannot edit Event
    Manager B\'s content if scoped

-   All 401/403 responses include a logged AuditLog entry

-   Admin cannot delete their own account

**8.3 Audit Logging**

-   Every create, update, delete, and status change is written to
    AuditLog

-   AuditLog stores: who (admin_user_id), what (action + entity), when
    (timestamp), old value, new value, IP

-   AuditLog is append-only --- no delete or update route exists for it

-   Super Admin can view audit logs filtered by user, action type, or
    date range

**8.4 Data Validation**

-   All inputs validated with Zod schemas on the server --- never trust
    client data

-   File uploads: type whitelist (jpg, png, webp, svg), size limit 5MB,
    filename sanitized

-   Rich text / markdown fields: sanitized with DOMPurify before storage

-   URL fields: validated as proper HTTP/HTTPS URLs

-   Phone numbers: validated as Indian mobile format (+91 10-digit)

**9. Scalability & Future Readiness**

**9.1 Multiple Festivals**

The Festival entity is the root of the hierarchy. Adding a new festival
(e.g. \"LinguaFest 2027\") requires only inserting a new Festival row
and creating Edition records under it. No code changes required. The
admin panel\'s context switcher in the sidebar allows admins to jump
between festivals instantly.

**9.2 Multiple Editions (Years)**

Creating a new edition (e.g. VOXERA 2027) involves:

1.  Click \"New Edition\" in Settings --- sets year, theme, dates

2.  Use \"Duplicate Events\" from 2026 --- copies all events as drafts

3.  Use \"Copy Team Structure\" --- creates empty team slots for the new
    year

4.  Update fees, dates, descriptions as needed

5.  Set new edition as \"Active\" --- public site immediately reflects
    new content

**9.3 Growing User Base**

-   All DB queries on Registration use indexed columns (event_id, email,
    status, created_at)

-   Pagination on all list views --- never loads unbounded result sets

-   CSV export uses streaming response --- handles 10,000+ rows without
    timeout

-   Media assets served from CDN (Cloudflare R2 / Supabase Storage) ---
    not from server

-   Read-heavy admin routes (GET /api/events) can be cached with 60s TTL

**10. Non-Functional Requirements**

  --------------------- ----------------- -------------------- ---------------------
  **Category**          **Requirement**   **Target**           **Notes**

  **Performance**       Page load (admin  **\< 2 seconds on    Code-split by tab
                        dashboard)        4G**                 route

  **Performance**       API response time **\< 300ms p95**     DB query optimization
                        (reads)                                required

  **Performance**       CSV export (1000  **\< 5 seconds**     Streaming response
                        rows)                                  

  **Reliability**       Uptime            **99.5% monthly**    Vercel + Supabase SLA
                                                               coverage

  **Reliability**       Data backup       **Daily automated    Supabase automatic
                                          backups**            backups

  **Reliability**       Zero data loss    **Soft deletes       Archive instead of
                                          only**               hard delete

  **Maintainability**   TypeScript        **100% of new code** No \`any\` types in
                        coverage                               prod

  **Maintainability**   Component reuse   **Shared form        EventForm, MemberForm
                                          components**         reused

  **Maintainability**   API versioning    **/api/v1/\*         Enables future
                                          prefix**             non-breaking changes

  **Browser Support**   Desktop browsers  **Chrome 100+,       No IE support
                                          Firefox 100+, Edge   
                                          100+, Safari 15+**   

  **Accessibility**     WCAG compliance   **WCAG 2.1 AA**      Focus management,
                                                               ARIA labels on forms
  --------------------- ----------------- -------------------- ---------------------

**11. Future Enhancements Roadmap**

  ----------- -------------- ------------------------------------ ---------------
  **Phase**   **Priority**   **Feature**                          **Rationale**

  **v1.1**    **🔴 High**    Fix all broken admin API routes      Current
                             (POST /api/events, DELETE            critical gaps
                             /api/events/:id, auth on write       blocking
                             calls)                               usability

  **v1.1**    **🔴 High**    Logout button in admin sidebar       Currently
                                                                  missing ---
                                                                  security risk

  **v1.1**    **🔴 High**    Contact submissions viewer in admin  Route exists,
                                                                  UI missing

  **v1.1**    **🔴 High**    Homepage stats editable from Content Currently
                             tab (Events count, Prize Pool,       hardcoded
                             Participants)                        

  **v1.2**    **🟠 Med**     Email sender --- trigger             Needed for
                             reminder/announcement emails to      event ops
                             filtered registrant list             

  **v1.2**    **🟠 Med**     Attendance / check-in module --- QR  Day-of event
                             code scanner or VX code lookup on    management
                             mobile                               

  **v1.2**    **🟠 Med**     Registration status management ---   Manual payment
                             manually confirm/cancel with email   verification
                             notification                         

  **v1.2**    **🟠 Med**     Full Team Management module with     Leadership
                             photo upload, reordering, archive    changes every
                                                                  year

  **v1.3**    **🟡 Low**     Sponsors management ---              Currently
                             add/remove/reorder sponsor logos     hardcoded
                             from admin                           

  **v1.3**    **🟡 Low**     Schedule builder --- visual timeline Better than
                             editor with drag-to-reschedule       editing fields

  **v1.3**    **🟡 Low**     Multi-admin user management UI       Scale to larger
                             (currently env-var only)             teams

  **v2.0**    **⚪ Future**  Multi-festival support --- context   Long-term reuse
                             switcher for VOXERA vs other         
                             festivals                            

  **v2.0**    **⚪ Future**  Public API for Google Forms webhook  Data
                             sync --- auto-link form submission   unification
                             to registration                      

  **v2.0**    **⚪ Future**  Real-time dashboard with websocket   Live
                             updates                              registration
                                                                  monitoring

  **v2.0**    **⚪ Future**  Mobile app (React Native) for admin  Event day
                             on-the-go                            operations
  ----------- -------------- ------------------------------------ ---------------

**12. Known Current Gaps --- Honest State of Build**

This section documents the delta between this PRD\'s vision and the
current code as of February 2026, for transparency with the engineering
team.

  ------------------------- -------------- ----------------------------------
  **Gap**                   **Severity**   **Fix Required**

  POST /api/events (create) **🔴           Add route in server/index.ts with
  route missing             Critical**     verifyAdmin middleware

  DELETE /api/events/:id    **🔴           Add soft-delete route in
  route missing             Critical**     server/index.ts

  Frontend write calls      **🔴           Add credentials: \'include\' to
  missing credentials:      Critical**     all fetch() calls in Admin.tsx
  include                                  

  GET /api/registrations    **🔴           Change to GET
  --- wrong URL             Critical**     /api/admin/registrations in
                                           Admin.tsx

  POST /api/settings ---    **🔴           Change to PUT /api/settings in
  wrong method              Critical**     Content and Contacts tabs

  No logout button in admin **🔴           Add logout button calling POST
  sidebar                   Critical**     /api/auth/logout

  Settings tab is empty     **🟠 Medium**  Implement global settings form
  placeholder                              

  Contact submissions not   **🟠 Medium**  Add fetch + table UI using GET
  displayed                                /api/admin/contacts

  Team Management module    **🟠 Medium**  Build full CRUD team management
  not built                                tab

  Homepage stats are        **🟠 Medium**  Move to Content CMS key-value
  hardcoded                                store

  No attendance/check-in    **🟡 Low**     Add attended_at field + mark
  functionality                            button

  No email sending from     **🟡 Low**     Add email blast endpoint + UI
  admin                                    
  ------------------------- -------------- ----------------------------------

This document is the authoritative specification for the VOXERA Admin
Panel. All engineering decisions, feature scope changes, and
architectural modifications must be reflected here as amendments before
implementation.

**Version 1.0.0 --- February 2026 --- JB Language Club Tech Team**
