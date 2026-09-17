create type user_role as enum ('customer', 'admin', 'staff');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  license_no text,
  license_verified boolean default false,
  role user_role not null default 'customer',
  created_at timestamptz default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  lat numeric,
  lng numeric,
  created_at timestamptz default now()
);

create type car_status as enum ('available', 'rented', 'maintenance', 'inactive');

create table cars (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id),
  make text not null,
  model text not null,
  year int not null,
  plate_number text unique not null,
  category text, -- e.g. economy, SUV, luxury
  transmission text, -- automatic/manual
  seats int,
  daily_rate numeric(10,2) not null,
  status car_status not null default 'available',
  image_url text,
  created_at timestamptz default now()
);


create type booking_status as enum ('pending', 'confirmed', 'ongoing', 'completed', 'cancelled');

create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id) not null,
  car_id uuid references cars(id) not null,
  pickup_branch_id uuid references branches(id),
  dropoff_branch_id uuid references branches(id),
  start_date date not null,
  end_date date not null,
  total_price numeric(10,2) not null,
  status booking_status not null default 'pending',
  created_at timestamptz default now(),
  check (end_date > start_date)
);


create type payment_status as enum ('pending', 'paid', 'refunded', 'failed');

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) not null,
  amount numeric(10,2) not null,
  method text, -- card, fpx, cash, etc.
  status payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz default now()
);



create extension if not exists btree_gist;

alter table bookings
add constraint no_overlapping_bookings
exclude using gist (
  car_id with =,
  daterange(start_date, end_date, '[]') with &&
) where (status in ('pending', 'confirmed', 'ongoing'));


alter table profiles enable row level security;
alter table cars enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;

-- Profiles: users see/edit only their own row
create policy "own profile" on profiles
  for select using (auth.uid() = id);
create policy "update own profile" on profiles
  for update using (auth.uid() = id);

-- Cars: everyone can view, only admin/staff can modify
create policy "cars are public" on cars
  for select using (true);
create policy "admin manage cars" on cars
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
  );

-- Bookings: customers see only their own; admins see all
create policy "own bookings" on bookings
  for select using (
    customer_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
  );
create policy "create own booking" on bookings
  for insert with check (customer_id = auth.uid());
create policy "admin update bookings" on bookings
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
  );

-- Payments: tied to booking ownership
create policy "own payments" on payments
  for select using (
    exists (select 1 from bookings b where b.id = booking_id and b.customer_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
  );


create or replace function update_car_status()
returns trigger as $$
begin
  if new.status = 'ongoing' then
    update cars set status = 'rented' where id = new.car_id;
  elsif new.status in ('completed', 'cancelled') then
    update cars set status = 'available' where id = new.car_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_update_car_status
after update of status on bookings
for each row execute function update_car_status();