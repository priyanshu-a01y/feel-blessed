# Feel Blessed — real live listener count

The clock is fully client-side and always uses Asia/Kolkata.

The listener counter uses Supabase Realtime Presence. It is intentionally NOT a fake
random number.

1. Create a Supabase project.
2. Copy its Project URL and anon/public key.
3. In Vercel Project Settings → Environment Variables add:
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Redeploy.

The Supabase client uses the public anon key in the browser. Never put a service-role
key in these variables.

Without these variables, Feel Blessed shows only the green LIVE indicator and no fake
listener number.
