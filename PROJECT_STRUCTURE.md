# Project Structure

Detailed overview of the HKGK Seva Management System file organization.

## Directory Overview

```
HKGK_SEVA/
├── app/                        # Next.js App Router
├── components/                 # React components
├── lib/                        # Utilities and libraries
├── types/                      # TypeScript definitions
├── supabase/                   # Database migrations
└── public/                     # Static assets
```

## Detailed Structure

### `/app` - Application Routes

```
app/
├── layout.tsx                  # Root layout with AuthProvider
├── page.tsx                    # Home page (redirects based on role)
├── globals.css                 # Global styles
│
├── login/
│   └── page.tsx               # Login page
│
├── register/
│   └── page.tsx               # Registration page
│
├── user/                       # User Portal
│   ├── layout.tsx             # User layout with sidebar
│   ├── sevas/
│   │   ├── page.tsx          # Seva listing
│   │   └── [id]/
│   │       └── page.tsx      # Seva details & donor management
│   └── referrals/
│       └── page.tsx          # Referral dashboard
│
└── admin/                      # Admin Portal
    ├── layout.tsx             # Admin layout with sidebar
    ├── dashboard/
    │   └── page.tsx          # Admin dashboard with stats
    ├── sevas/
    │   ├── page.tsx          # Seva management
    │   └── [id]/
    │       └── page.tsx      # Seva details with all donors
    ├── users/
    │   └── page.tsx          # User management
    └── accounts/
        └── page.tsx          # Financial reports & analytics
```

### `/components` - Reusable Components

```
components/
├── ui/                         # Base UI components (shadcn/ui style)
│   ├── button.tsx             # Button component
│   ├── input.tsx              # Input field
│   ├── label.tsx              # Form label
│   ├── card.tsx               # Card container
│   ├── dialog.tsx             # Modal dialog
│   ├── select.tsx             # Dropdown select
│   ├── switch.tsx             # Toggle switch
│   ├── tabs.tsx               # Tab navigation
│   ├── table.tsx              # Data table
│   ├── badge.tsx              # Status badge
│   ├── dropdown-menu.tsx      # Dropdown menu
│   ├── toast.tsx              # Toast notifications
│   ├── use-toast.ts           # Toast hook
│   └── toaster.tsx            # Toast container
│
├── forms/                      # Form components
│   ├── donor-form.tsx         # Add/Edit donor form
│   └── seva-form.tsx          # Add/Edit seva form
│
├── tables/                     # Table components
│   └── donor-table.tsx        # Donor list table
│
└── layout/                     # Layout components
    ├── user-sidebar.tsx       # User portal sidebar
    ├── admin-sidebar.tsx      # Admin portal sidebar
    └── user-nav.tsx           # User navigation dropdown
```

### `/lib` - Utilities & Libraries

```
lib/
├── auth/
│   └── context.tsx            # Authentication context provider
│
├── supabase/
│   ├── client.ts              # Browser Supabase client
│   ├── server.ts              # Server Supabase client
│   └── middleware.ts          # Middleware for auth
│
└── utils.ts                   # Utility functions
    ├── cn()                   # Class name merger
    ├── formatCurrency()       # Currency formatter
    ├── formatDate()           # Date formatter
    ├── formatDateTime()       # DateTime formatter
    ├── generateReferralLink() # Referral link generator
    ├── copyToClipboard()      # Clipboard utility
    └── downloadCSV()          # CSV export
```

### `/types` - TypeScript Types

```
types/
├── index.ts                   # Main type exports
│   ├── Profile               # User profile
│   ├── Seva                  # Seva details
│   ├── Donor                 # Donor information
│   ├── Referral              # Referral tracking
│   ├── SevaWithStats         # Seva with statistics
│   ├── DonorWithDetails      # Donor with relations
│   ├── UserWithStats         # User with statistics
│   ├── SevaFormData          # Seva form input
│   ├── DonorFormData         # Donor form input
│   ├── AuthFormData          # Auth form input
│   └── RevenueData           # Revenue analytics
│
└── supabase.ts               # Supabase database types
    └── Database              # Auto-generated DB types
```

### `/supabase` - Database

```
supabase/
└── migrations/
    ├── 001_initial_schema.sql    # Database schema
    │   ├── Tables
    │   ├── Functions
    │   ├── Triggers
    │   └── Indexes
    │
    └── 002_row_level_security.sql # RLS policies
        ├── Profile policies
        ├── Seva policies
        ├── Donor policies
        └── Referral policies
```

### Root Configuration Files

```
├── package.json               # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS config
├── next.config.js            # Next.js configuration
├── postcss.config.js         # PostCSS configuration
├── .eslintrc.json           # ESLint rules
├── .gitignore               # Git ignore rules
├── middleware.ts            # Next.js middleware
├── vercel.json              # Vercel deployment config
│
├── .env.local.example       # Environment template
├── README.md                # Main documentation
├── DEPLOYMENT.md            # Deployment guide
├── QUICKSTART.md            # Quick start guide
└── PROJECT_STRUCTURE.md     # This file
```

## Key File Descriptions

### Authentication Flow

1. `middleware.ts` - Intercepts all requests, updates auth session
2. `lib/auth/context.tsx` - Provides auth state to entire app
3. `app/layout.tsx` - Wraps app with AuthProvider
4. `app/login/page.tsx` - Handles login logic
5. `app/register/page.tsx` - Handles registration with referral support

### Data Flow (User Portal)

1. `app/user/sevas/page.tsx` - Fetches all sevas
2. Real-time subscription updates slots
3. `app/user/sevas/[id]/page.tsx` - Shows seva details
4. `components/forms/donor-form.tsx` - Add/edit donors
5. `components/tables/donor-table.tsx` - Display donors
6. Database trigger updates `sevas.booked_slots`

### Data Flow (Admin Portal)

1. `app/admin/dashboard/page.tsx` - Aggregates statistics
2. `app/admin/sevas/page.tsx` - Manages all sevas
3. `app/admin/sevas/[id]/page.tsx` - Views all donors for seva
4. `app/admin/users/page.tsx` - Lists all users with stats
5. `app/admin/accounts/page.tsx` - Financial analytics

### Form Validation

All forms use:
- `react-hook-form` for form state
- `zod` for schema validation
- `@hookform/resolvers/zod` for integration

Example schema locations:
- `components/forms/donor-form.tsx` - Donor validation
- `components/forms/seva-form.tsx` - Seva validation

### Styling System

- **Tailwind CSS**: Utility-first CSS
- **CSS Variables**: Theme colors in `app/globals.css`
- **cn() Helper**: Merges classes in `lib/utils.ts`
- **Saffron Theme**: Orange/saffron color palette

### Real-time Features

Implemented in these files:
- `app/user/sevas/page.tsx` - Seva list updates
- `app/user/sevas/[id]/page.tsx` - Donor list updates
- Uses `supabase.channel()` for subscriptions

## Component Hierarchy

### User Portal

```
UserLayout (sidebar + content)
  └── SevasPage
      └── SevaCard (multiple)
          └── Link to SevaDetailsPage

  └── SevaDetailsPage
      ├── SevaStats Card
      └── DonorManagement Card
          ├── DonorTable
          └── DonorForm (modal)
```

### Admin Portal

```
AdminLayout (sidebar + content)
  └── Dashboard
      └── StatCard (multiple)

  └── SevasPage
      ├── SevaCard (multiple)
      └── SevaForm (modal)

  └── AdminSevaDetailsPage
      ├── Stats Card
      └── AllDonorsTable

  └── UsersPage
      ├── UsersTable
      └── UserDonorsDialog

  └── AccountsPage
      ├── TotalRevenue Card
      └── Tabs
          ├── SevaRevenue (chart + list)
          ├── PaymentModeRevenue (pie chart)
          └── StatusRevenue (summary)
```

## Import Aliases

The project uses TypeScript path aliases:

```typescript
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { cn } from '@/lib/utils'
```

`@/` resolves to the root directory.

## Environment Variables

All environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_SITE_URL` - Application URL

## Navigation Routes

### Public Routes
- `/login` - Login page
- `/register` - Registration page (with ?ref= support)

### User Routes (role: user)
- `/user/sevas` - Browse sevas
- `/user/sevas/[id]` - Manage donors for seva
- `/user/referrals` - Referral dashboard

### Admin Routes (role: admin)
- `/admin/dashboard` - Overview statistics
- `/admin/sevas` - Seva management
- `/admin/sevas/[id]` - View all donors for seva
- `/admin/users` - User management
- `/admin/accounts` - Financial reports

## Database Tables

### profiles
- Primary user information
- Role-based access (user/admin)
- Referral code for each user

### sevas
- Seva details and slot management
- Real-time slot tracking

### donors
- Donor information and payments
- Auto-generated enrollment numbers
- Links to seva and user

### referrals
- Tracks referral relationships

## API Routes

This application uses Server Actions and direct Supabase calls. No traditional API routes are used.

## Build Output

```
.next/                    # Next.js build output (gitignored)
├── cache/               # Build cache
├── server/              # Server bundles
├── static/              # Static assets
└── types/               # Generated types
```

---

This structure follows Next.js 14 App Router best practices with clear separation of concerns and maintainable code organization.
