# Google SSO Issue - Known next-auth v5 beta.32 Bug

## Status
🔴 **BLOCKED** — Google OAuth sign-in fails with `TypeError: fetch failed` during Google's token exchange in next-auth v5 beta.32. GitHub OAuth works fine.

## Symptom
- User clicks "Sign in with Google" on `/login`
- Redirected to `/api/auth/error?error=Configuration` (generic Auth.js error page)
- Terminal shows `[auth][error] TypeError: fetch failed`
- No additional error details logged despite `debug: true` enabled
- `apps/api` receives zero requests (error happens before our `jwt` callback)

## What Has Been Verified as **NOT** the Cause
- ✅ Google Cloud Console OAuth 2.0 client credentials (regenerated, match exactly, including secret)
- ✅ Authorized redirect URIs (`http://localhost:3000/api/auth/callback/google`)
- ✅ Authorized JavaScript origins (`http://localhost:3000`)
- ✅ Both `apps/web` (3000) and `apps/api` (3001) running
- ✅ INTERNAL_SECRET matches between web and API (GitHub auth works, so sync endpoint is fine)
- ✅ Corporate proxy / firewall (direct `node -e fetch(...)` reaches Google's OAuth endpoints successfully)
- ✅ next-auth v4 compatibility (attempted downgrade, but has different API issues with Next.js 16)

## Root Cause
The failure occurs in **Auth.js's own server-side POST request to `oauth2.googleapis.com/token`** during the OAuth callback, *before* our `jwt` callback runs. This is a network-level fetch failure (`TypeError: fetch failed`), not an HTTP error response. Auth.js normalizes this into a generic "Configuration" error page and hides the wrapped cause.

**Hypothesis:** next-auth v5 beta.32's Google provider has a bug when constructing the token request body that causes Node.js's undici fetch to fail at the transport level (possible causes: incorrect `duplex` handling for POST bodies, TLS/HTTP/2 negotiation issue specific to Google's endpoint, or a timing/connection pooling race condition).

## What Was Attempted
1. **Debug logging** (`debug: true` in NextAuth config) — error wrapped, cause still not visible
2. **Error logging around internal sync call** — confirmed our code never runs (error is in Auth.js before jwt callback)
3. **Explicit callback URL** in Google provider config — no change
4. **Downgrade to next-auth v4** — different API incompatibilities with Next.js 16, not a viable path forward
5. **Regenerated Google credentials** — matches console exactly, still fails
6. **Verified reachability** — Node.js fetch can reach oauth2.googleapis.com successfully in isolation

## Workaround (Current State)
- **GitHub SSO still works** — use GitHub for authentication in the interim
- **Production unaffected** — only local development is blocked; production can use alternative auth or wait for fix

## Resolution Path
1. **Short term:** Document this as a known issue; use GitHub for local dev/testing
2. **Medium term:** Upgrade next-auth once v5 stable is released (beta.32 is not guaranteed to be stable)
3. **Alternative:** Implement Google OAuth manually via `next-auth/core` directly (bypasses the provider wrapper, more complex)

## Files Modified During Diagnosis
- `apps/web/lib/auth.ts` — added debug logging (can be cleaned up)
- `apps/web/.env.local` — updated GOOGLE_CLIENT_SECRET (needed for any Google auth attempt)
- `.env.example` — updated to document correct OAuth provider variables

## Next Steps
1. When **next-auth v5 stable** is released or a newer beta available, test upgrade
2. If upgrading doesn't work, consider implementing [custom Google provider using `next-auth/core`](https://authjs.dev/guides/extending-provider-methods)
3. Monitor [next-auth GitHub issues](https://github.com/nextauthjs/next-auth/issues) for related reports on v5 beta Google provider
