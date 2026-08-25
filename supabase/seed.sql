-- ============================================================================
-- Seed data — Piers Cave Group
-- Fixed IDs are used throughout so this script is easy to re-run/inspect.
-- Fields marked "TBC" in notes were not available from the source documents
-- reviewed and should be confirmed against Companies House / HMRC before
-- being relied on.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PEOPLE
-- ----------------------------------------------------------------------------
insert into people (id, full_name, dob_month_year, nationality, country_of_residence, occupation, correspondence_address, notes)
values (
  '00000000-0000-0000-0000-000000000001',
  'Mr Piers St John Spencer Galliard Cave',
  'November 1971',
  'British',
  'United Kingdom',
  'Surveyor / Director',
  '58 Lane End Drive, Knaphill, Woking, Surrey, GU21 2QG',
  'Sole director/PSC/shareholder across the group as currently understood.'
)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- COMPANIES
-- ----------------------------------------------------------------------------
insert into companies (id, name, previous_names, company_number, incorporation_date, registered_office, sic_code, status, utr, vat_number, vat_stagger, year_end_day, year_end_month, notes)
values
(
  '00000000-0000-0000-0000-0000000000a1',
  'First Essentials Limited',
  'The Loft Boarding Company Ltd (25 Sep 2013 – 12 Sep 2018)',
  '08704645',
  '2013-09-25',
  '58 Lane End Drive, Knaphill, Woking, Surrey, GU21 2QG',
  '43910 - Roofing activities',
  'Active',
  null,
  null,
  'Mar / Jun / Sep / Dec',
  30, 9,
  'Trades as "The Zero Waste Delivery Company". UTR / VAT number / authentication code: TBC — not yet confirmed in register.'
),
(
  '00000000-0000-0000-0000-0000000000a2',
  'Duuna Limited',
  'Metalla UK Limited (5 May 2021 – 24 Jan 2022)',
  '13378274',
  '2021-05-05',
  '58 Lane End Drive, Knaphill, Woking, Surrey, GU21 2QG',
  '62020 - Information technology consultancy activities',
  'Active',
  null,
  null,
  'Feb / May / Aug / Nov',
  31, 5,
  'UTR / VAT number / authentication code: TBC — not yet confirmed in register.'
),
(
  '00000000-0000-0000-0000-0000000000a3',
  'Clifton Land Consultants Ltd',
  'Clifton Estate Agents Ltd. (10 Jun 2003 – 23 Jul 2004)',
  '04793282',
  '2003-06-10',
  '58 Lane End Drive, Knaphill, Woking, Surrey, GU21 2QG',
  '74902 - Quantity surveying activities',
  'Active',
  '2625246169',
  null,
  'Mar / Jun / Sep / Dec',
  31, 7,
  'UTR confirmed from Piers Cave 2025-26 tax & company summary. VAT number / authentication code: TBC.'
),
(
  '00000000-0000-0000-0000-0000000000a4',
  'Helios Advanced Energy Systems Limited',
  null,
  '09353913',
  '2014-12-12',
  '58 Lane End Drive, Knaphill, Woking, Surrey, GU21 2QG',
  '82990 - Other business support service activities n.e.c.',
  'Active',
  null,
  null,
  'Mar / Jun / Sep / Dec',
  31, 12,
  'UTR / VAT number / authentication code: TBC. No VAT return on file for the Mar/Jun 2026 quarters — verify these were filed.'
)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- OFFICERS (all Piers Cave, sole director on each company)
-- ----------------------------------------------------------------------------
insert into company_officers (company_id, person_id, role, appointed_on, status, notes)
values
('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Director', '2013-09-25', 'Active', 'Appointment date assumed = incorporation date — confirm on Companies House officers page.'),
('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Director', '2021-05-05', 'Active', 'Confirmed via Companies House officers page.'),
('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Director', '2003-06-10', 'Active', 'Confirmed via Companies House officers page. Occupation recorded there: Surveyor.'),
('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000001', 'Director', '2014-12-12', 'Active', 'Appointment date assumed = incorporation date — confirm on Companies House officers page.');

-- ----------------------------------------------------------------------------
-- PSC (persons with significant control)
-- ----------------------------------------------------------------------------
insert into company_pscs (company_id, person_id, nature_of_control, notes)
values
('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'TBC', 'Not yet confirmed via Companies House PSC register.'),
(
  '00000000-0000-0000-0000-0000000000a2',
  '00000000-0000-0000-0000-000000000001',
  'Holds, directly or indirectly, 75% or more of the shares. Holds the right, directly or indirectly, to appoint or remove a majority of the board of directors.',
  'Confirmed via Companies House company information extract (as Metalla UK Limited, 21 Jan 2022).'
),
('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'TBC', 'Not yet confirmed via Companies House PSC register.'),
('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000001', 'TBC', 'Not yet confirmed via Companies House PSC register.');

-- ----------------------------------------------------------------------------
-- SHAREHOLDERS
-- ----------------------------------------------------------------------------
insert into company_shareholders (company_id, person_id, share_class, shares_held, notes)
values
('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Ordinary', null, 'TBC — shareholding not yet confirmed.'),
('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Ordinary', 2, 'Confirmed via Companies House company information extract (as Metalla UK Limited, 21 Jan 2022).'),
('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Ordinary', null, 'TBC — shareholding not yet confirmed.'),
('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000001', 'Ordinary', null, 'TBC — shareholding not yet confirmed.');

-- ----------------------------------------------------------------------------
-- DUE DATES — next 24 months from 25 Aug 2026
-- ----------------------------------------------------------------------------

-- First Essentials Limited (a1) — VAT: Mar/Jun/Sep/Dec quarters
insert into due_dates (company_id, task_type, due_date, due_by) values
('00000000-0000-0000-0000-0000000000a1','VAT','2026-09-30','2026-11-07'),
('00000000-0000-0000-0000-0000000000a1','VAT','2026-12-31','2027-02-07'),
('00000000-0000-0000-0000-0000000000a1','VAT','2027-03-31','2027-05-07'),
('00000000-0000-0000-0000-0000000000a1','VAT','2027-06-30','2027-08-07'),
('00000000-0000-0000-0000-0000000000a1','VAT','2027-09-30','2027-11-07'),
('00000000-0000-0000-0000-0000000000a1','VAT','2027-12-31','2028-02-07'),
('00000000-0000-0000-0000-0000000000a1','VAT','2028-03-31','2028-05-07'),
('00000000-0000-0000-0000-0000000000a1','VAT','2028-06-30','2028-08-07'),
('00000000-0000-0000-0000-0000000000a1','Year-End Accounts','2026-09-30','2027-06-30'),
('00000000-0000-0000-0000-0000000000a1','Year-End Accounts','2027-09-30','2028-06-30'),
('00000000-0000-0000-0000-0000000000a1','Confirmation Statement','2026-09-25','2026-10-09'),
('00000000-0000-0000-0000-0000000000a1','Confirmation Statement','2027-09-25','2027-10-09');

-- Duuna Limited (a2) — VAT: Feb/May/Aug/Nov quarters
insert into due_dates (company_id, task_type, due_date, due_by) values
('00000000-0000-0000-0000-0000000000a2','VAT','2026-08-31','2026-10-07'),
('00000000-0000-0000-0000-0000000000a2','VAT','2026-11-30','2027-01-07'),
('00000000-0000-0000-0000-0000000000a2','VAT','2027-02-28','2027-04-07'),
('00000000-0000-0000-0000-0000000000a2','VAT','2027-05-31','2027-07-07'),
('00000000-0000-0000-0000-0000000000a2','VAT','2027-08-31','2027-10-07'),
('00000000-0000-0000-0000-0000000000a2','VAT','2027-11-30','2028-01-07'),
('00000000-0000-0000-0000-0000000000a2','VAT','2028-02-29','2028-04-07'),
('00000000-0000-0000-0000-0000000000a2','VAT','2028-05-31','2028-07-07'),
('00000000-0000-0000-0000-0000000000a2','Year-End Accounts','2026-05-31','2027-02-28'),
('00000000-0000-0000-0000-0000000000a2','Year-End Accounts','2027-05-31','2028-02-28'),
('00000000-0000-0000-0000-0000000000a2','Confirmation Statement','2027-05-04','2027-05-18'),
('00000000-0000-0000-0000-0000000000a2','Confirmation Statement','2028-05-04','2028-05-18');

-- Clifton Land Consultants Ltd (a3) — VAT: Mar/Jun/Sep/Dec quarters
insert into due_dates (company_id, task_type, due_date, due_by) values
('00000000-0000-0000-0000-0000000000a3','VAT','2026-09-30','2026-11-07'),
('00000000-0000-0000-0000-0000000000a3','VAT','2026-12-31','2027-02-07'),
('00000000-0000-0000-0000-0000000000a3','VAT','2027-03-31','2027-05-07'),
('00000000-0000-0000-0000-0000000000a3','VAT','2027-06-30','2027-08-07'),
('00000000-0000-0000-0000-0000000000a3','VAT','2027-09-30','2027-11-07'),
('00000000-0000-0000-0000-0000000000a3','VAT','2027-12-31','2028-02-07'),
('00000000-0000-0000-0000-0000000000a3','VAT','2028-03-31','2028-05-07'),
('00000000-0000-0000-0000-0000000000a3','VAT','2028-06-30','2028-08-07'),
('00000000-0000-0000-0000-0000000000a3','Year-End Accounts','2026-07-31','2027-04-30'),
('00000000-0000-0000-0000-0000000000a3','Year-End Accounts','2027-07-31','2028-04-30'),
('00000000-0000-0000-0000-0000000000a3','Confirmation Statement','2027-06-10','2027-06-24'),
('00000000-0000-0000-0000-0000000000a3','Confirmation Statement','2028-06-10','2028-06-24');

-- Helios Advanced Energy Systems Limited (a4) — VAT: Mar/Jun/Sep/Dec quarters
insert into due_dates (company_id, task_type, due_date, due_by, flag) values
('00000000-0000-0000-0000-0000000000a4','VAT','2026-03-31','2026-05-07','No VAT return found on file for this quarter — confirm it was filed.'),
('00000000-0000-0000-0000-0000000000a4','VAT','2026-06-30','2026-08-07','No VAT return found on file for this quarter — confirm it was filed.');
insert into due_dates (company_id, task_type, due_date, due_by) values
('00000000-0000-0000-0000-0000000000a4','VAT','2026-09-30','2026-11-07'),
('00000000-0000-0000-0000-0000000000a4','VAT','2026-12-31','2027-02-07'),
('00000000-0000-0000-0000-0000000000a4','VAT','2027-03-31','2027-05-07'),
('00000000-0000-0000-0000-0000000000a4','VAT','2027-06-30','2027-08-07'),
('00000000-0000-0000-0000-0000000000a4','VAT','2027-09-30','2027-11-07'),
('00000000-0000-0000-0000-0000000000a4','VAT','2027-12-31','2028-02-07'),
('00000000-0000-0000-0000-0000000000a4','VAT','2028-03-31','2028-05-07'),
('00000000-0000-0000-0000-0000000000a4','VAT','2028-06-30','2028-08-07'),
('00000000-0000-0000-0000-0000000000a4','Year-End Accounts','2025-12-31','2026-09-30'),
('00000000-0000-0000-0000-0000000000a4','Year-End Accounts','2026-12-31','2027-09-30'),
('00000000-0000-0000-0000-0000000000a4','Confirmation Statement','2026-12-12','2026-12-26'),
('00000000-0000-0000-0000-0000000000a4','Confirmation Statement','2027-12-12','2027-12-26');

-- Piers Cave — Personal Tax (Self Assessment payments; due_date = due_by)
insert into due_dates (person_id, task_type, due_date, due_by, amount, note) values
('00000000-0000-0000-0000-000000000001','Personal Tax','2027-01-31','2027-01-31','£2,706.63','2025-26 balancing payment + 2026-27 1st payment on account'),
('00000000-0000-0000-0000-000000000001','Personal Tax','2027-07-31','2027-07-31','£902.21','2026-27 2nd payment on account'),
('00000000-0000-0000-0000-000000000001','Personal Tax','2028-01-31','2028-01-31','TBC','2026-27 balancing payment + 2027-28 1st payment on account'),
('00000000-0000-0000-0000-000000000001','Personal Tax','2028-07-31','2028-07-31','TBC','2027-28 2nd payment on account');
