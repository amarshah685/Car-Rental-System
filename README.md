# Car Rental System

A full-stack car rental platform built with React and Supabase, featuring real-time car availability, secure booking with database-level double-booking prevention, role-based access control, and a complete customer-to-admin workflow.

## Features

- **Browse & filter cars** by category, branch, status, and price
- **Authentication** — customer sign-up/login via Supabase Auth
- **Booking flow** — date selection with live price calculation and conflict detection
- **Database-enforced no-overlap booking** — an exclusion constraint at the Postgres level makes double-booking the same car impossible, independent of application logic
- **Payment flow** — simulated payment tied to each booking
- **My Bookings** — customers can view and cancel their own bookings
- **Admin dashboard** — manage all bookings, update car status/fleet, and view customer records
- **Row Level Security (RLS)** on every table, so customers can only see/modify their own data while admins have full visibility
- **Auto-updating car status** via a Postgres trigger — a car flips to `rented` when a booking goes `ongoing`, and back to `available` on `completed`/`cancelled`

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Database:** PostgreSQL with exclusion constraints and triggers for data integrity

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Extends Supabase `auth.users` with name, phone, license, and role (`customer`/`staff`/`admin`) |
| `branches` | Pickup/drop-off locations |
| `cars` | Fleet inventory — make, model, category, daily rate, status |
| `bookings` | Rental bookings with date ranges and status lifecycle |
| `payments` | Payment records linked to bookings |

Key data-integrity features:
- **Exclusion constraint** on `bookings` prevents overlapping date ranges for the same car at the database level
- **RLS policies** restrict each table's access by ownership and role
- **Trigger** on `bookings.status` automatically updates the linked car's status

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (LTS)
- A [Supabase](https://supabase.com) project
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/car-rental-system.git
cd car-rental-system
```

### 2. Set up the database
Link the Supabase CLI to your project and push the schema:
```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### 3. Configure environment variables
Create a `.env` file in the project root (for the CLI):
```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Create a `.env` file inside `car-rental-frontend/`:
```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. Install dependencies and run
```bash
cd car-rental-frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure
```
car-rental-system/
├── supabase/
│   └── migrations/       # Database schema, RLS policies, triggers
├── car-rental-frontend/
│   └── src/
│       ├── App.jsx            # Main app shell, car browsing/filtering
│       ├── Auth.jsx           # Sign up / login
│       ├── BookingForm.jsx    # Date selection + booking creation
│       ├── PaymentForm.jsx    # Payment step after booking
│       ├── MyBookings.jsx     # Customer's booking history
│       └── AdminDashboard.jsx # Admin: manage bookings, cars, customers
└── README.md
```

## Author

Muhammad Amar Firdaus bin Abdullah
Final-year Computer Science student, Universiti Teknologi MARA (UiTM) Kuala Terengganu
