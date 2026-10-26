/**
 * Supabase base URL for SERVER-SIDE calls only.
 *
 * Do not import this from browser code — it is deliberately not a
 * `NEXT_PUBLIC_*` value and belongs only in server components, route
 * handlers and the proxy.
 *
 * On Vercel / hosted Supabase there is one URL for everyone, so this just
 * returns `NEXT_PUBLIC_SUPABASE_URL`.
 *
 * On a self-hosted deployment the Supabase gateway sits on the same Docker
 * network as this app. `SUPABASE_INTERNAL_URL` lets server-side requests
 * reach it directly (e.g. `http://api-gw:8000`) instead of going out to the
 * public hostname and back in through the reverse proxy. That matters
 * because the proxy calls `auth.getUser()` plus a `profiles` lookup on
 * every request, so the public round-trip would be paid on every page load.
 */
export const SUPABASE_SERVER_URL =
  process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
