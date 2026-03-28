
Goal: make password-reset and logout always stay on `ocodx.store`, and make logged-out users always see the preferred “2nd model” landing page.

What I found
- The reset email function already generates recovery links to `https://ocodx.store/reset-password`.
- `src/lib/oauthHashCapture.ts` already redirects recovery-token visits from `*.lovable.app` to `https://ocodx.store`.
- The remaining problems come from frontend routing/state:
  1. Logout currently sends users to `/auth`, not `/`, so they bypass the marketing landing page.
  2. `src/pages/Index.tsx` still contains an older authenticated homepage UI in the same file, while only the logged-out state renders `LandingPage`. That makes the app feel like it has two different “home” experiences.
  3. The current canonical-domain redirect only runs for `type=recovery` links. It does not enforce `ocodx.store` more generally if a user lands on the published `*.lovable.app` domain during auth/logout flows.
  4. Your currently reported published URL is still `https://cozy-cipher-chat.lovable.app`, so frontend navigation can still happen there unless the app itself forces the branded domain.

Implementation plan
1. Enforce the branded domain on the client
- Expand `src/lib/oauthHashCapture.ts` into a more general canonical-host guard.
- Keep the recovery-token redirect, but also add a safe redirect rule for normal app loads on `*.lovable.app` to `https://ocodx.store` for routes like `/`, `/auth`, and `/reset-password`.
- Preserve pathname, query string, and hash during redirect.
- Add a small safeguard so this never loops on the correct domain.

2. Fix logout destinations
- Update logout flows to navigate to `/` instead of `/auth`:
  - `src/pages/Index.tsx`
  - `src/pages/Settings.tsx`
  - `src/pages/ResetPassword.tsx` after password change/sign-out
- This ensures users land on the real public homepage after signing out or completing a reset.

3. Make the root route consistently use the preferred landing strategy
- Refactor `src/pages/Index.tsx` so the root route has one clear responsibility:
  - logged out → always show `LandingPage`
  - logged in → show the app/home dashboard
- Preserve the password-recovery session bootstrapping already in place.
- Remove ambiguity that could make old/home-like content appear when session state changes.

4. Align branding/copy between the public landing and root experience
- Review the root-page authenticated header copy and structure so it no longer feels like the “old landing page.”
- Keep the preferred public landing as the only unauthenticated homepage.
- If needed, separate the logged-in dashboard presentation more clearly from marketing content.

5. Validate the end-to-end flows after implementation
- Password reset request → click email link → if it opens on `*.lovable.app`, app immediately redirects to `ocodx.store/reset-password`
- Save new password → sign-out/redirect → user lands on `https://ocodx.store/`
- Manual logout from inside the app → user lands on `https://ocodx.store/`
- Visiting `/` while logged out always shows the 2nd landing page

Technical details
```text
Current behavior
reset email -> ocodx.store/reset-password -> reset works
logout / some auth transitions -> navigate("/auth") or stay on *.lovable.app
logged out root -> LandingPage
logged in root -> old mixed home UI in Index.tsx

Planned behavior
any relevant app entry on *.lovable.app -> redirect to ocodx.store
logout/reset completion -> navigate("/")
logged out root -> only 2nd landing page
logged in root -> app dashboard, clearly separate from marketing landing
```

Files likely involved
- `src/lib/oauthHashCapture.ts`
- `src/pages/Index.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/Settings.tsx`

Why this should solve it
- It fixes both issues at their actual source:
  - domain visibility: by forcing the canonical branded domain in the client
  - old landing page reappearing: by routing logged-out users back to `/` and simplifying the root-page session logic
