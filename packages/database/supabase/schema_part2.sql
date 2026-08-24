-- Migration: Phase 4 Schema for FinanceOS Remaining Models
-- Run this script in the Supabase SQL editor to create the rest of the tables and RLS policies.

-- =====================================================================================
-- BUDGETS TABLE
-- =====================================================================================
create table public.budgets (
  id text primary key, -- Text because we generate local UUIDs starting with custom prefixes, or we can use UUID. Let's use text to avoid UUID validation issues if we mix prefix types
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  category text not null check (char_length(trim(category)) > 0),
  limit_amount numeric not null check (limit_amount >= 0),
  spent_amount numeric not null default 0,
  period text not null check (period in ('Monthly', 'Yearly')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.budgets enable row level security;
create policy "Users can manage their own budgets." on public.budgets for all using (auth.uid() = user_id);
create index idx_budgets_user_id on public.budgets(user_id);

-- =====================================================================================
-- SAVINGS GOALS TABLE
-- =====================================================================================
create table public.savings_goals (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (char_length(trim(name)) > 0),
  target_amount numeric not null check (target_amount >= 0),
  current_amount numeric not null default 0,
  deadline date not null,
  linked_account_id text,
  icon text not null,
  color text not null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.savings_goals enable row level security;
create policy "Users can manage their own savings goals." on public.savings_goals for all using (auth.uid() = user_id);
create index idx_savings_goals_user_id on public.savings_goals(user_id);

-- =====================================================================================
-- INVESTMENTS TABLES
-- =====================================================================================
create table public.fixed_deposits (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  bank_name text not null,
  principal_amount numeric not null,
  interest_rate numeric not null,
  start_date date not null,
  maturity_date date not null,
  maturity_amount numeric not null,
  nominee_name text,
  is_matured boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.fixed_deposits enable row level security;
create policy "Users can manage their own fds." on public.fixed_deposits for all using (auth.uid() = user_id);
create index idx_fds_user_id on public.fixed_deposits(user_id);

create table public.stock_holdings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  symbol text not null,
  name text not null,
  quantity numeric not null,
  average_price numeric not null,
  current_price numeric not null,
  nominee_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.stock_holdings enable row level security;
create policy "Users can manage their own stocks." on public.stock_holdings for all using (auth.uid() = user_id);
create index idx_stocks_user_id on public.stock_holdings(user_id);

create table public.mutual_fund_holdings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  scheme_code text not null,
  scheme_name text not null,
  units numeric not null,
  average_nav numeric not null,
  current_nav numeric not null,
  nominee_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.mutual_fund_holdings enable row level security;
create policy "Users can manage their own mfs." on public.mutual_fund_holdings for all using (auth.uid() = user_id);
create index idx_mfs_user_id on public.mutual_fund_holdings(user_id);

create table public.gold_holdings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('Physical', 'SGB', 'Digital')),
  quantity_grams numeric not null,
  purchase_price numeric not null,
  current_price numeric not null,
  nominee_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.gold_holdings enable row level security;
create policy "Users can manage their own gold." on public.gold_holdings for all using (auth.uid() = user_id);
create index idx_gold_user_id on public.gold_holdings(user_id);

create table public.nps_holdings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  pran_number text not null,
  balance numeric not null,
  allocation_e numeric not null,
  allocation_c numeric not null,
  allocation_g numeric not null,
  allocation_a numeric not null,
  nominee_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.nps_holdings enable row level security;
create policy "Users can manage their own nps." on public.nps_holdings for all using (auth.uid() = user_id);
create index idx_nps_user_id on public.nps_holdings(user_id);

create table public.provident_fund_holdings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('EPF', 'PPF')),
  account_number text not null,
  balance numeric not null,
  yearly_contribution numeric not null,
  nominee_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.provident_fund_holdings enable row level security;
create policy "Users can manage their own pf." on public.provident_fund_holdings for all using (auth.uid() = user_id);
create index idx_pf_user_id on public.provident_fund_holdings(user_id);

create table public.us_stock_holdings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  ticker text not null,
  name text not null,
  shares numeric not null,
  avg_cost_usd numeric not null,
  current_price_usd numeric not null,
  usd_inr_rate numeric not null,
  nominee_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.us_stock_holdings enable row level security;
create policy "Users can manage their own us stocks." on public.us_stock_holdings for all using (auth.uid() = user_id);
create index idx_us_stocks_user_id on public.us_stock_holdings(user_id);

create table public.real_estate_holdings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  property_name text not null,
  location text not null,
  purchase_value numeric not null,
  estimated_current_value numeric not null,
  monthly_rental_income numeric,
  is_mortgaged boolean not null default false,
  outstanding_loan numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.real_estate_holdings enable row level security;
create policy "Users can manage their own real estate." on public.real_estate_holdings for all using (auth.uid() = user_id);
create index idx_real_estate_user_id on public.real_estate_holdings(user_id);

create table public.bond_holdings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  issuer text not null,
  bond_type text not null check (bond_type in ('SGB', 'Corporate', 'GovtGSec', 'TaxFree')),
  face_value numeric not null,
  coupon_rate numeric not null,
  maturity_date date not null,
  quantity numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.bond_holdings enable row level security;
create policy "Users can manage their own bonds." on public.bond_holdings for all using (auth.uid() = user_id);
create index idx_bonds_user_id on public.bond_holdings(user_id);

create table public.insurance_policies (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  policy_name text not null,
  provider text not null,
  policy_type text not null check (policy_type in ('Health', 'TermLife', 'Motor', 'ULIP')),
  sum_assured numeric not null,
  premium_amount numeric not null,
  renewal_date date not null,
  policy_number text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.insurance_policies enable row level security;
create policy "Users can manage their own insurance." on public.insurance_policies for all using (auth.uid() = user_id);
create index idx_insurance_user_id on public.insurance_policies(user_id);


-- =====================================================================================
-- DOCUMENTS TABLE (Metadata & Base64 storage)
-- =====================================================================================
create table public.encrypted_documents (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  category text not null check (category in ('PAN', 'Aadhaar', 'Insurance', 'Property', 'Tax', 'MutualFund', 'Loan', 'Passport', 'Other')),
  upload_date timestamp with time zone not null,
  file_size_formatted text not null,
  tags text[],
  notes text,
  is_encrypted boolean not null default false,
  ocr_summary text,
  data text, -- store base64 string
  mime_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.encrypted_documents enable row level security;
create policy "Users can manage their own documents." on public.encrypted_documents for all using (auth.uid() = user_id);
create index idx_docs_user_id on public.encrypted_documents(user_id);


-- =====================================================================================
-- AUTOMATION RULES
-- =====================================================================================
create table public.automation_rules (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  trigger_type text not null check (trigger_type in ('CategoryMatch', 'AmountOver', 'DescriptionContains')),
  match_pattern text not null,
  target_category text not null,
  target_tag text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.automation_rules enable row level security;
create policy "Users can manage their own automation rules." on public.automation_rules for all using (auth.uid() = user_id);
create index idx_auto_rules_user_id on public.automation_rules(user_id);

-- =====================================================================================
-- TAX (TDS)
-- =====================================================================================
create table public.tds_summaries (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  tan_of_deductor text not null,
  deductor_name text not null,
  amount_paid numeric not null,
  tax_deducted numeric not null,
  financial_year text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.tds_summaries enable row level security;
create policy "Users can manage their own tds." on public.tds_summaries for all using (auth.uid() = user_id);
create index idx_tds_user_id on public.tds_summaries(user_id);


-- =====================================================================================
-- BUSINESS BOOKKEEPING
-- =====================================================================================
create table public.vendor_customers (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  gstin text,
  phone text,
  email text,
  address text,
  type text not null check (type in ('Customer', 'Vendor')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.vendor_customers enable row level security;
create policy "Users can manage their own vendor customers." on public.vendor_customers for all using (auth.uid() = user_id);
create index idx_vc_user_id on public.vendor_customers(user_id);

create table public.inventory_items (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  code text not null,
  name text not null,
  quantity numeric not null,
  purchase_price numeric not null,
  sales_price numeric not null,
  gst_rate numeric not null,
  reorder_level numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.inventory_items enable row level security;
create policy "Users can manage their own inventory items." on public.inventory_items for all using (auth.uid() = user_id);
create index idx_inventory_user_id on public.inventory_items(user_id);

create table public.business_invoices (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  invoice_number text not null,
  date date not null,
  due_date date not null,
  customer_id text not null,
  customer_name text not null,
  customer_gstin text,
  items jsonb not null, -- Store InvoiceItems array as JSON
  subtotal numeric not null,
  cgst_total numeric not null,
  sgst_total numeric not null,
  igst_total numeric not null,
  grand_total numeric not null,
  status text not null check (status in ('Draft', 'Sent', 'Paid', 'Overdue')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.business_invoices enable row level security;
create policy "Users can manage their own business invoices." on public.business_invoices for all using (auth.uid() = user_id);
create index idx_invoices_user_id on public.business_invoices(user_id);

create table public.business_register_entries (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  type text not null check (type in ('Sales', 'Purchase')),
  ref_number text not null,
  party_name text not null,
  taxable_amount numeric not null,
  cgst numeric not null,
  sgst numeric not null,
  igst numeric not null,
  total_amount numeric not null,
  gst_rate numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.business_register_entries enable row level security;
create policy "Users can manage their own business register entries." on public.business_register_entries for all using (auth.uid() = user_id);
create index idx_register_user_id on public.business_register_entries(user_id);

-- =====================================================================================
-- RECURRING TRANSACTIONS
-- =====================================================================================
create table public.recurring_transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  description text not null,
  amount numeric not null,
  type text not null check (type in ('Income', 'Expense', 'Transfer')),
  category text not null,
  account_id text not null,
  ref_account_id text,
  frequency text not null check (frequency in ('Monthly', 'Quarterly', 'Weekly')),
  next_due_date date not null,
  is_active boolean not null default true,
  start_date date,
  step_up_pct numeric,
  target_asset_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.recurring_transactions enable row level security;
create policy "Users can manage their own recurring transactions." on public.recurring_transactions for all using (auth.uid() = user_id);
create index idx_recurring_user_id on public.recurring_transactions(user_id);
