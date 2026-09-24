-- =========================================
-- Security hardening migration
-- Captures all fixes applied during security review
-- =========================================

-- Fix 1: Prevent profile role escalation via UPDATE
drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));

-- Fix 2: Prevent profile role escalation via INSERT (signup)
drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles
  for insert with check (auth.uid() = id and role = 'customer');

-- Fix 3: Enforce correct payment amount + block client-set 'paid' status
drop policy if exists "customer create own payment" on payments;
create policy "customer create own payment" on payments
  for insert with check (
    exists (
      select 1 from bookings b
      where b.id = booking_id
        and b.customer_id = auth.uid()
        and b.total_price = amount
    )
    and status = 'pending'
  );

-- Fix 4: Server-side enforced booking price (blocks client tampering)
create or replace function enforce_booking_price()
returns trigger as $$
declare
  car_rate numeric;
  days numeric;
begin
  select daily_rate into car_rate from cars where id = new.car_id;

  if car_rate is null then
    raise exception 'Invalid car_id';
  end if;

  days := new.end_date - new.start_date;

  if days <= 0 then
    raise exception 'end_date must be after start_date';
  end if;

  new.total_price := car_rate * days;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_enforce_booking_price on bookings;
create trigger trg_enforce_booking_price
before insert or update on bookings
for each row execute function enforce_booking_price();

revoke execute on function enforce_booking_price() from public, anon, authenticated;

-- Fix 5: Auto-confirm payments server-side (customer can only insert as 'pending')
create or replace function auto_confirm_payment()
returns trigger as $$
begin
  update payments
  set status = 'paid', paid_at = now()
  where id = new.id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_auto_confirm_payment on payments;
create trigger trg_auto_confirm_payment
after insert on payments
for each row
when (new.status = 'pending')
execute function auto_confirm_payment();

revoke execute on function auto_confirm_payment() from public, anon, authenticated;

-- Fix 6: Admin/staff can view all profiles (was missing — caused infinite recursion on first attempt)
create or replace function is_admin_or_staff()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'staff')
  );
$$ language sql security definer set search_path = public;

revoke execute on function is_admin_or_staff() from public, anon;

drop policy if exists "admin view all profiles" on profiles;
create policy "admin view all profiles" on profiles
  for select using (is_admin_or_staff());

-- Fix 7: Pin search_path on pre-existing functions (Postgres security advisory)
alter function update_car_status() set search_path = public;
alter function restrict_booking_updates() set search_path = public;

revoke execute on function restrict_booking_updates() from public, anon, authenticated;

-- =========================================
-- Feature: Date-aware availability search
-- =========================================

create or replace function get_available_cars(
  p_start_date date,
  p_end_date date,
  p_branch_id uuid default null,
  p_category text default null,
  p_max_price numeric default null
)
returns setof cars as $$
  select c.*
  from cars c
  where c.status not in ('inactive', 'maintenance')
    and (p_branch_id is null or c.branch_id = p_branch_id)
    and (p_category is null or c.category = p_category)
    and (p_max_price is null or c.daily_rate <= p_max_price)
    and not exists (
      select 1 from bookings b
      where b.car_id = c.id
        and b.status in ('pending', 'confirmed', 'ongoing')
        and daterange(b.start_date, b.end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
    )
  order by c.daily_rate asc;
$$ language sql security definer set search_path = public;

revoke execute on function get_available_cars from public, anon;
grant execute on function get_available_cars to authenticated;