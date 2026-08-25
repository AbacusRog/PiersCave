# Piers Cave Group — Company Register & Due Dates Tracker

A standalone register for Piers Cave's companies (First Essentials Limited,
Duuna Limited — formerly Metalla UK Limited, Clifton Land Consultants Ltd,
Helios Advanced Energy Systems Limited) plus his personal Self Assessment
dates, built to the same design as the IFK Group Company Register:

- **Due Dates Tracker** as the landing page — sortable, red/amber/green
  status, "Due Date" (period/anniversary) vs "Due By" (computed deadline),
  filtered to a rolling 24-month window.
- **Mark done → auto-recur** — ticking a task off files it and immediately
  creates its next occurrence (VAT +3 months, Confirmation Statement /
  Year-End Accounts +1 year, Personal Tax +6 months with the payment-type
  note regenerated automatically). Filed items drop out of the default
  view; there's a "Show completed" toggle to see them again.
- **Companies** — add new companies directly in the app, plus full detail
  per company: identity fields (UTR, VAT number, Authentication Code,
  incorporation date), directors, PSCs, shareholders, and that company's
  own due dates (same mark-done control). Officers, PSCs, and shareholders
  can be added, edited, and removed directly on the page — pick an
  existing person from the dropdown, no need to leave the app.
- **People** — add, edit, and delete people directly in the app; every
  director/PSC/shareholder is listed with a bipartite relationship map
  (people ↔ companies) and a page per person showing every company
  they're linked to. The same add/edit/remove controls work from the
  person's side too — pick a company instead of a person.
- **Admin Access** — admins-only screen to manage who can see/edit each
  company's Authentication Code.
- Supabase Auth login gate — nothing is visible until signed in.

Stack: React + Vite + Tailwind, Supabase (Postgres + Auth), deployed as a
static site (Cloudflare Pages, same as the IFK Register).

---

## 1. Create the Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run **`supabase/schema.sql`** first, then
   **`supabase/seed.sql`**.
3. In **Authentication → Providers**, leave Email enabled. This app has no
   public sign-up screen — you create accounts for the people who should
   have access directly in **Authentication → Users → Add user**.
4. Make yourself the first admin (the Admin Access screen needs at least
   one admin to bootstrap from). In the SQL Editor:

   ```sql
   insert into admin_users (user_id, email)
   values ('YOUR-AUTH-USER-UUID', 'you@example.com');
   ```

   Find your user UUID under Authentication → Users.

5. Grab your Project URL and anon public key from **Project Settings →
   API** — you'll need them in step 2.

## 2. Run it locally

```bash
npm install
cp .env.example .env      # then fill in your Supabase URL + anon key
npm run dev
```

## 3. Deploy

Same pattern as the IFK Register:

1. Push this folder to a new GitHub repo (or upload via GitHub's web
   upload interface if you're not using git locally).
2. In Cloudflare Pages, create a project from that repo.
   - Build command: `npm run build`
   - Output directory: `dist`
   - Add the two environment variables (`VITE_SUPABASE_URL`,
     `VITE_SUPABASE_ANON_KEY`) in Cloudflare Pages → Settings →
     Environment variables.
3. Deploy. The app opens on the Due Dates page.

## Data model

| Table | Purpose |
|---|---|
| `people` | One row per real person (directors/PSCs/shareholders) |
| `companies` | Core company record, incl. UTR / VAT number / Authentication Code |
| `company_officers` | Director/Secretary appointments, links people ↔ companies |
| `company_pscs` | Persons with significant control |
| `company_shareholders` | Shareholdings |
| `due_dates` | One row per filing occurrence — VAT / Year-End Accounts / Confirmation Statement / Personal Tax. Hangs off either `company_id` or `person_id`. |
| `admin_users` | Who can see/edit `authentication_code` and manage this list |

`companies_view` is what the app actually queries for reads — it nulls out
`authentication_code` for anyone not in `admin_users`. A trigger on the
underlying `companies` table also silently blocks non-admins from writing
to that column, so it's protected on both reads and writes.

### Due dates: mark done, next occurrence is generated for you

Each `due_dates` row has a `filed` flag. Clicking **Mark done** (on the
tracker or a company page):

1. Sets `filed = true` on that row.
2. Inserts the next occurrence, computed client-side in
   `src/lib/dueDates.js`:
   - **VAT**: Due Date + 3 months; Due By = new Due Date + 1 month + 7 days
   - **Confirmation Statement**: Due Date + 1 year; Due By = + 14 days
   - **Year-End Accounts**: Due Date + 1 year; Due By = + 9 months
   - **Personal Tax**: Due Date + 6 months (alternates 31 Jan / 31 Jul);
     the note is regenerated from the new date (e.g. "2026-27 balancing
     payment + 2027-28 1st payment on account"); amount is set to `TBC`
     since future amounts aren't known yet.

Month arithmetic preserves "end of month" (so a 31 Aug period rolls to
30 Nov, not 1 Dec) and handles leap-year Februarys correctly.

The tracker only ever displays items due within the **next 24 months** —
older filed items are hidden by default (toggle "Show completed" to see
them) and anything beyond the 24-month horizon simply isn't shown yet.
Nothing is deleted; it's a display filter, not a data cap.

## What's seeded vs what still needs confirming

Company core facts (number, incorporation date, registered office, SIC
code, next accounts/confirmation statement dates) came from live Companies
House data as of 25 Aug 2026. Officer appointment for Duuna Limited and
Clifton Land Consultants Ltd, and the PSC/shareholder rows for Duuna
Limited, are confirmed from Companies House extracts on file in Dropbox.

Everything else — UTR and VAT numbers for 3 of the 4 companies,
Authentication Codes for all 4, PSC/shareholder rows for First Essentials,
Clifton Land Consultants, and Helios, and the two Helios VAT quarters with
no return on file — is marked `TBC` in the `notes` field and should be
confirmed before being relied on. Edit those records directly in the app
(or Supabase table editor) once confirmed.

## Not yet built

- Adding due dates for a brand-new company still needs the Supabase table
  editor (inserting into `due_dates` with the right `task_type`,
  `due_date`, and `due_by`) — the tracker only auto-generates the *next*
  occurrence once an existing row is marked done, it doesn't seed the
  first one for you.
- Email reminders ahead of due dates (the IFK Register has this on its own
  roadmap too — Supabase Edge Functions + Resend would be the natural fit
  here as well).
