-- Migration: Initial Core Schema for FinanceOS
-- Sets up Profiles, Accounts, and Transactions with Row Level Security (RLS)
-- Enables UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================================================
-- 1. PROFILES TABLE (Netflix-style sub-profiles for a family/account)
-- =====================================================================================
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null, -- The Supabase Auth User that owns this profile
  name text not null check (char_length(trim(name)) > 0),
  role text not null check (role in ('Admin', 'Member', 'Viewer')),
  avatar text,
  is_nominee_provided boolean not null default false,
  relationship text, -- 'Self', 'Spouse', 'Child', 'Parent', etc.
  pin_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policy: Users can only select/insert/update/delete profiles they own
create policy "Users can manage their own family profiles." 
  on public.profiles for all 
  using (auth.uid() = user_id);

-- =====================================================================================
-- 2. BANK ACCOUNTS TABLE
-- =====================================================================================
create table public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null, -- For easy RLS
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (char_length(trim(name)) > 0),
  bank_name text not null check (char_length(trim(bank_name)) > 0),
  account_number text not null, 
  ifsc_code text not null,
  account_type text not null, -- 'Savings', 'Current', 'CreditCard', 'Loan', etc.
  balance numeric not null default 0,
  limit_amount numeric check (limit_amount >= 0),
  interest_rate numeric,
  nominee_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.accounts enable row level security;

-- Policy: Users can only manage accounts they own
create policy "Users can manage their own accounts." 
  on public.accounts for all 
  using (auth.uid() = user_id);

-- =====================================================================================
-- 3. TRANSACTIONS TABLE
-- =====================================================================================
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null, -- For easy RLS
  account_id uuid references public.accounts(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  description text not null check (char_length(trim(description)) > 0),
  amount numeric not null check (amount >= 0),
  type text not null check (type in ('Income', 'Expense', 'Transfer')),
  category text not null check (char_length(trim(category)) > 0),
  gst_rate numeric check (gst_rate >= 0),
  gst_amount numeric check (gst_amount >= 0),
  tag text,
  ref_account_id uuid references public.accounts(id) on delete set null,
  is_duplicate boolean default false,
  is_auto_generated boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Policy: Users can only manage transactions they own
create policy "Users can manage their own transactions." 
  on public.transactions for all 
  using (auth.uid() = user_id);

-- =====================================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================================
create index idx_profiles_user_id on public.profiles(user_id);
create index idx_accounts_user_id on public.accounts(user_id);
create index idx_accounts_profile_id on public.accounts(profile_id);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_account_id on public.transactions(account_id);
create index idx_transactions_date on public.transactions(date);
