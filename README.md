# HKGK Seva Management System

A comprehensive full-stack web application for managing Hare Krishna Seva (service) enrollments with role-based access for users and administrators.

## Features

### User Portal
- **Seva Browsing**: View all available sevas with real-time slot availability
- **Donor Management**: Add, edit, and manage donors with detailed information
- **Payment Tracking**: Track payment status, modes, and amounts
- **Referral System**: Unique referral links for each user with tracking
- **Real-time Updates**: Live slot availability across all users

### Admin Portal
- **Dashboard**: Overview of sevas, users, donors, and revenue
- **Seva Management**: Create, edit, and manage sevas
- **User Management**: View all users and their donor contributions
- **Financial Reports**: Comprehensive revenue analytics with charts
- **Data Export**: Export reports to CSV format

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Realtime)
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts
- **UI Components**: Radix UI primitives

## Prerequisites

- Node.js 18+ and npm
- A Supabase account
- Git

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HKGK_SEVA
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon/public key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run Database Migrations

In your Supabase project:

1. Go to SQL Editor
2. Run the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the contents of `supabase/migrations/002_row_level_security.sql`

### 6. Create Admin User

In Supabase Dashboard:

1. Go to Authentication > Users
2. Click "Add User"
3. Email: `admin@harekrishna.org`
4. Password: (choose a secure password)
5. After creation, go to SQL Editor and run:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@harekrishna.org';
```

### 7. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

#### profiles
- Extends Supabase auth.users
- Stores user information and role
- Referral code for each user

#### sevas
- Seva details (name, description, slots)
- Tracks total and booked slots
- Active/inactive status

#### donors
- Donor information
- Payment details and status
- Auto-generated enrollment numbers
- Links to seva and user who added them

#### referrals
- Tracks referral relationships between users

### Key Features

- **Auto-generated Enrollment Numbers**: Format `SEVA-YYYY-NNNNN`
- **Automatic Slot Management**: Triggers update booked slots on payment status changes
- **Row Level Security**: Ensures users only see their own data
- **Real-time Subscriptions**: Live updates across all connected clients

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your Vercel deployment URL)

4. Deploy!

### Supabase Configuration

Ensure these settings in Supabase:

1. **Authentication > URL Configuration**
   - Add your Vercel domain to "Site URL"
   - Add your Vercel domain to "Redirect URLs"

2. **Database > Replication**
   - Enable Realtime for tables: `sevas`, `donors`, `profiles`

## Project Structure

```
HKGK_SEVA/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin portal routes
│   ├── user/              # User portal routes
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── tables/           # Table components
│   └── ui/               # UI primitives
├── lib/                   # Utility libraries
│   ├── auth/             # Authentication context
│   ├── supabase/         # Supabase clients
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript types
│   ├── index.ts
│   └── supabase.ts
└── supabase/             # Database migrations
    └── migrations/
```

## Usage Guide

### For Users

1. **Register**: Create an account (optionally use a referral link)
2. **Browse Sevas**: View available sevas and their slot availability
3. **Add Donors**: Click on a seva and add donor information
4. **Manage Payments**: Update payment status and details
5. **Share Referral**: Get your unique referral link from Referrals page

### For Admins

1. **Login**: Use admin credentials
2. **Dashboard**: View overall statistics
3. **Manage Sevas**: Create, edit, or delete sevas
4. **View Users**: See all users and their contributions
5. **Generate Reports**: View financial analytics and export data

## Key Features Explained

### Real-time Slot Updates

When any user books a slot (marks payment as "paid"), the available slots update instantly for all users viewing that seva. This uses Supabase Realtime subscriptions.

### Enrollment Numbers

Each donor gets a unique enrollment number in the format `SEVA-2025-00001`. The number auto-increments and resets each year.

### Payment Status

- **Pending**: Slot is "blocked" but not counted in booked slots
- **Paid**: Slot is "booked" and counted in total booked slots

### Referral System

Each user gets a unique referral code. Share the referral link to invite others. Track who signed up through your link in the Referrals dashboard.

### Data Export

Admins can export financial reports to CSV format for offline analysis or record-keeping.

## Security

- Row Level Security (RLS) policies ensure data isolation
- Users can only see and manage their own donors
- Admins have full access to all data
- Secure authentication via Supabase Auth
- Environment variables protect sensitive keys

## Troubleshooting

### "Failed to fetch" errors

- Check Supabase URL and key in `.env.local`
- Ensure RLS policies are applied
- Verify database migrations ran successfully

### Real-time updates not working

- Enable Realtime in Supabase Dashboard for tables
- Check browser console for connection errors

### Admin can't access admin portal

- Verify role is set to 'admin' in profiles table
- Check SQL query: `SELECT role FROM profiles WHERE email = 'admin@harekrishna.org'`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:
- Check existing documentation
- Review Supabase logs
- Check browser console for errors

## License

MIT License - feel free to use for your organization

## Credits

Built with Next.js, Supabase, and Tailwind CSS for the Hare Krishna community.

---

**Hare Krishna!** 🙏
# Trigger deployment
