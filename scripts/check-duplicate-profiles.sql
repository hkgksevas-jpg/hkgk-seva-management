-- Check for duplicate profiles
SELECT id, email, COUNT(*) as count
FROM profiles
GROUP BY id, email
HAVING COUNT(*) > 1;

-- Check all profiles (run this in Supabase SQL Editor with admin access)
SELECT id, email, role, created_at
FROM profiles
ORDER BY created_at DESC;
