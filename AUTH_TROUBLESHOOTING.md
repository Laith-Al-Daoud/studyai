# Authentication Troubleshooting Guide

## Problem: "Nothing happens when I try to login"

### Quick Diagnostic Steps

#### 1. Check Browser Console (F12)
Open Developer Tools and look for errors. Common issues:

**"Email not confirmed"**
- ✅ Solution: Verify email or disable email confirmation (see below)

**"Invalid login credentials"**
- ✅ Solution: Double-check email and password

**Network errors**
- ✅ Solution: Check `.env.local` has correct Supabase credentials

#### 2. Check User in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
2. Find your email in the list
3. Check the "Confirmed At" column:
   - **Empty/NULL**: Email not verified ❌
   - **Has timestamp**: Email verified ✅

### Solutions

#### Solution A: Manually Verify Email (Fastest for Testing)

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
2. Click on your user
3. Click "Confirm Email" button
4. Try logging in again

#### Solution B: Disable Email Verification (Development Only)

**⚠️ Only for development! Re-enable for production!**

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers
2. Find "Email" provider
3. Click "Edit"
4. **UNCHECK** "Confirm email"
5. Click "Save"
6. Delete your old user (if exists)
7. Register a new account
8. You can now login immediately!

#### Solution C: Configure Email Service

If you're not receiving verification emails:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/auth
2. Scroll to "SMTP Settings"
3. Supabase provides a default email service, but it's rate-limited
4. For production, configure your own SMTP (Gmail, SendGrid, etc.)

**Default Supabase Email Settings:**
- Limited to 4 emails per hour
- May go to spam folder
- Check your spam/junk folder!

#### Solution D: Use Custom SMTP (Production)

For production or heavy testing, configure custom SMTP:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/auth
2. Enable "Enable Custom SMTP"
3. Configure your SMTP provider:
   - **Gmail**: smtp.gmail.com (port 587)
   - **SendGrid**: smtp.sendgrid.net (port 587)
   - **Mailgun**: smtp.mailgun.org (port 587)

### Common Issues & Fixes

#### Issue 1: "No error message, just stays on login page"

**Cause**: Silent redirect failure or middleware issue

**Fix:**
```bash
# Check if you're already logged in
# Open browser console and run:
localStorage.clear()
# Then refresh and try again
```

#### Issue 2: "Email verification link doesn't work"

**Cause**: Incorrect `NEXT_PUBLIC_SITE_URL` in `.env.local`

**Fix:**
```env
# Make sure this matches your dev server URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Or if using different port:
NEXT_PUBLIC_SITE_URL=http://localhost:3004
```

#### Issue 3: "Infinite redirect loop"

**Cause**: Middleware redirect logic

**Fix:**
1. Clear browser cookies and localStorage
2. Restart dev server
3. Try in incognito/private window

#### Issue 4: "User created but can't see in dashboard"

**Cause**: Wrong project or RLS policy issue

**Fix:**
1. Verify you're looking at correct project
2. Check: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
3. If no users visible, check RLS policies are applied

### Development Workflow (Recommended)

For smooth development experience:

1. **Disable email confirmation** (Solution B above)
2. Test all features without email delays
3. **Before deployment**, re-enable email confirmation
4. Test production flow with real email verification

### Testing Authentication

After fixing, test in this order:

1. **Registration**
   ```
   ✅ Can create account
   ✅ See success message
   ✅ Redirected to login
   ```

2. **Login**
   ```
   ✅ Can enter credentials
   ✅ Can submit form
   ✅ See "Signed in successfully" toast
   ✅ Redirected to /dashboard
   ```

3. **Protected Routes**
   ```
   ✅ Can access /dashboard when logged in
   ✅ Redirected to /login when not logged in
   ✅ Can create subjects/chapters
   ```

4. **Logout**
   ```
   ✅ Click logout in header dropdown
   ✅ Redirected to /login
   ✅ Cannot access /dashboard anymore
   ```

### Debug Commands

```bash
# Check if dev server is running
curl http://localhost:3004

# View your Supabase config (safely)
cat .env.local | grep SUPABASE | sed 's/=.*/=***/'

# Clear Next.js cache
rm -rf .next

# Restart with clean slate
npm run dev
```

### Still Not Working?

If none of the above works:

1. **Check Supabase Status**: https://status.supabase.com/
2. **Check Browser Console**: Any red errors?
3. **Check Network Tab**: Is the auth request returning 200 or an error?
4. **Try Different Browser**: Rule out browser-specific issues
5. **Try Incognito Mode**: Rule out cache/cookie issues

### Getting More Details

Add this to your browser console to see detailed auth state:

```javascript
// Check current auth state
const { createClient } = window.supabaseBrowser || {}
if (createClient) {
  const supabase = createClient()
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session:', data)
    console.log('Error:', error)
  })
}
```

### Contact Support

If still stuck, gather this info:

- [ ] Browser console errors (screenshot)
- [ ] Network tab showing auth request (screenshot)
- [ ] Supabase user list (screenshot)
- [ ] `.env.local` variables (WITHOUT actual keys)
- [ ] Which solution you tried

---

**Most Common Fix**: Disable email confirmation for development! (Solution B)

**Second Most Common**: Manually verify email in dashboard (Solution A)

---

Last Updated: October 30, 2025

