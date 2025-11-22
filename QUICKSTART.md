# Quick Start Guide

Get your HKGK Seva Management System running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Set Up Supabase (2 min)

### Create Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in details and wait for setup

### Run Migrations

In Supabase Dashboard > SQL Editor:

1. Copy and run `supabase/migrations/001_initial_schema.sql`
2. Copy and run `supabase/migrations/002_row_level_security.sql`

### Create Admin User

In Authentication > Users:
1. Add user: `admin@harekrishna.org` with a password
2. In SQL Editor run:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@harekrishna.org';
```

## Step 3: Configure Environment (30 sec)

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Get these values from Supabase > Project Settings > API

## Step 4: Start Development Server (30 sec)

```bash
npm run dev
```

Visit http://localhost:3000

## Step 5: Test the Application (1 min)

### Login as Admin
- Email: `admin@harekrishna.org`
- Password: (the one you set)

You'll be redirected to Admin Dashboard!

### Create a Seva
1. Go to Sevas tab
2. Click "Add Seva"
3. Fill in details

### Register as User
1. Logout
2. Go to Register page
3. Create a user account

### Add Donors
1. Login as user
2. Browse sevas
3. Click "Manage Donors"
4. Add donor information

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Default Credentials

**Admin**:
- Email: `admin@harekrishna.org`
- Password: (set during setup)

## Next Steps

1. **Customize**: Update branding colors in `tailwind.config.ts`
2. **Deploy**: Follow `DEPLOYMENT.md` for production deployment
3. **Explore**: Check out all features in the admin and user portals

## Troubleshooting

**Can't connect to database?**
- Check `.env.local` has correct Supabase credentials
- Ensure migrations ran successfully

**Real-time not working?**
- Enable Realtime in Supabase Dashboard > Database > Replication

**Admin can't access admin portal?**
- Verify role is 'admin' in profiles table

## Support

For detailed documentation, see:
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Deployment guide

---

**Happy Coding!** Hare Krishna! 🙏
