# Deployment Guide

Complete guide for deploying HKGK Seva Management System to production.

## Prerequisites

- [x] GitHub account
- [x] Vercel account (free tier works)
- [x] Supabase account (free tier works)
- [x] Domain name (optional, Vercel provides free subdomain)

## Step-by-Step Deployment

### 1. Prepare Supabase Database

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization or create new one
4. Project settings:
   - **Name**: HKGK Seva Management
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
5. Wait for project setup to complete

#### Run Database Migrations

1. Go to SQL Editor in Supabase Dashboard
2. Create new query and paste contents of:
   - `supabase/migrations/001_initial_schema.sql`
3. Run the query (should see success message)
4. Create another query with:
   - `supabase/migrations/002_row_level_security.sql`
5. Run the query

#### Enable Realtime

1. Go to Database > Replication
2. Enable Realtime for these tables:
   - `sevas`
   - `donors`
   - `profiles`
   - `referrals`

#### Create Admin User

1. Go to Authentication > Users
2. Click "Add User"
3. Create user with:
   - Email: `admin@harekrishna.org`
   - Password: (strong password - save this!)
   - Auto Confirm User: Yes
4. Go back to SQL Editor
5. Run this query:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@harekrishna.org';
```

6. Verify with:

```sql
SELECT * FROM profiles WHERE email = 'admin@harekrishna.org';
```

#### Get API Keys

1. Go to Project Settings > API
2. Copy these values (you'll need them for Vercel):
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJxxx...`

### 2. Prepare Code Repository

#### Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - HKGK Seva Management"

# Create GitHub repository (do this on GitHub website)
# Then add remote and push
git remote add origin https://github.com/yourusername/hkgk-seva.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel

#### Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" > "Project"
4. Import your repository
5. Vercel will auto-detect Next.js

#### Configure Project

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `./` (default)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)

#### Add Environment Variables

In the "Environment Variables" section, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

**Important**: For `NEXT_PUBLIC_SITE_URL`, you can use the Vercel-provided URL initially, then update it later if you add a custom domain.

#### Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. You'll get a deployment URL like: `https://hkgk-seva-xxx.vercel.app`

### 4. Configure Supabase for Production

#### Update Authentication URLs

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Update these settings:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add `https://your-app.vercel.app/**`

#### Test Email Templates (Optional)

If using email confirmations:
1. Go to Authentication > Email Templates
2. Customize templates with your branding
3. Update sender email if needed

### 5. Post-Deployment Checklist

#### Update Environment Variables in Vercel

If you need to update `NEXT_PUBLIC_SITE_URL` after getting your final domain:

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Edit `NEXT_PUBLIC_SITE_URL`
3. Trigger a redeploy: Deployments > ⋯ menu > Redeploy

#### Test Critical Flows

- [ ] Register new user account
- [ ] Login with user credentials
- [ ] Create a seva (as admin)
- [ ] Add a donor (as user)
- [ ] Update payment status
- [ ] Verify real-time updates work
- [ ] Test referral link
- [ ] Export CSV report (as admin)

#### Create Test Data

For demo purposes, you may want to:
1. Create a few sample sevas
2. Add sample donors
3. Test different payment statuses

### 6. Custom Domain (Optional)

#### Add Custom Domain in Vercel

1. Go to Project Settings > Domains
2. Add your domain (e.g., `seva.yourdomain.com`)
3. Vercel will provide DNS records

#### Update DNS

1. Go to your domain registrar
2. Add the DNS records Vercel provided
3. Wait for DNS propagation (can take 24-48 hours)

#### Update Environment Variables

Once custom domain is working:
```env
NEXT_PUBLIC_SITE_URL=https://seva.yourdomain.com
```

Then redeploy.

### 7. Monitoring & Maintenance

#### Set Up Error Monitoring

Consider adding:
- Vercel Analytics (built-in)
- Sentry for error tracking
- Supabase logs monitoring

#### Regular Backups

Supabase Pro plan includes automated backups. For free tier:
1. Periodically export database
2. Store backups securely

#### Performance Monitoring

- Check Vercel Analytics dashboard
- Monitor Supabase Dashboard > Reports
- Review slow queries and optimize

## Production Environment Variables

### Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_SITE_URL=https://your-production-url.com
```

### Optional

If you need additional configuration:

```env
# For custom SMTP (if not using Supabase email)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASS=your-password
```

## Troubleshooting Deployment

### Build Fails on Vercel

**Error**: Module not found
- Check `package.json` has all dependencies
- Run `npm install` locally to verify
- Check import paths are correct

**Error**: Environment variables not found
- Ensure all `NEXT_PUBLIC_*` variables are set in Vercel
- Redeploy after adding variables

### Authentication Not Working

**Error**: Invalid redirect URL
- Add production URL to Supabase > Auth > URL Configuration
- Include wildcard: `https://yourapp.com/**`

**Error**: Email confirmation not sending
- Check Supabase > Auth > Email Templates
- Verify sender email settings

### Real-time Not Working

**Error**: WebSocket connection failed
- Enable Realtime for tables in Supabase
- Check if using Supabase free tier limits
- Verify browser console for errors

### Database Errors

**Error**: Permission denied
- Verify RLS policies are applied
- Check SQL migrations ran successfully
- Test queries in Supabase SQL Editor

## Scaling Considerations

### Supabase Limits

**Free Tier**:
- 500MB database
- 2GB bandwidth/month
- 50MB file storage

**Upgrade triggers**:
- More than 10,000 donors
- Heavy concurrent usage
- Need daily backups

### Vercel Limits

**Hobby (Free)**:
- 100GB bandwidth/month
- 6,000 build minutes/month

**Upgrade triggers**:
- High traffic (>100k visits/month)
- Need advanced analytics
- Require team collaboration

## Security Best Practices

### Environment Variables

- Never commit `.env.local` to git
- Use different keys for dev/prod
- Rotate keys periodically

### Database Security

- Keep RLS policies enabled
- Regular security audits
- Monitor Supabase logs

### Application Security

- Keep dependencies updated
- Use HTTPS only (Vercel default)
- Implement rate limiting if needed

## Maintenance Schedule

### Weekly

- Check error logs
- Monitor performance metrics
- Review user feedback

### Monthly

- Update dependencies (`npm update`)
- Review and optimize database queries
- Check security advisories

### Quarterly

- Database optimization
- Review and update documentation
- Plan feature updates

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Deployment Completed!** Your HKGK Seva Management System is now live! 🚀
