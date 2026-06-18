# Performance Audit & Optimization Plan

## 1. Architecture summary (today)

- **Frontend**: React 18 + Vite 5 + TS, Tailwind, shadcn. Routing via `react-router-dom`. `App.tsx` wraps everything in `QueryClientProvider` (React Query), `AuthProvider`, `AdminAuthProvider`, `BrowserRouter`. Several routes are `lazy()` (map, blog, admin, region pages); core social routes (Feed, Profile, SpotDetail, Messages, Publish…) are eager.
- **State**: React Query is installed but **almost never used** — most pages call `supabase.from(...)` directly inside `useEffect` and store results in local `useState`. No cache, no dedupe, no stale-while-revalidate. Auth in a Context. i18n via i18next.
- **Backend (Lovable Cloud / Supabase)**: PostgREST + RLS, edge functions (`admin-api`, `google-places`, `capture-lead`, `r2-*`, `send-welcome-email`), Cloudflare R2 for media via signed uploads, 5 public Storage buckets for avatars/posts/spots/reviews/reports.
- **Map**: Leaflet (`SpotMap.tsx`, 423 lines) — markers built from raw spots, re-created on every state change. Mini-map in profile uses the same pattern.
- **Images**: client-side compression to WebP via `browser-image-compression` (good). But static assets in `src/assets/` and `public/` are heavy (see §3.4).

## 2. Bottleneck analysis (evidence)

Pulled from `db_health` + `pg_stat_statements` + `pg_indexes` + repo scan.

- **DB is healthy** (13.7 MB, 6/60 connections, 41% memory). Not the bottleneck in absolute terms — but query patterns are wasteful.
- **Slow queries (cumulative)**: top offenders are `audit_logs` inserts (8.7 s total, called on every admin/login event), repeated `messages WHERE receiver_id=? AND read=false` polling (1665 calls), `follows WHERE follower_id=?` (729 calls), `posts + profiles` join (327 calls, max 1 s), `posts WHERE user_id=?` (6227 calls — N+1 from profile views/feed).
- **Missing indexes** on hot filters:
  - `spots(created_by)` — used in `ProfileSpotsMiniMap`, profile page.
  - `messages(receiver_id, read)` — partial index would collapse the 1665-call poller.
  - `notifications(user_id, read)` — `DesktopSidebar` count query.
  - `audit_logs(actor_id, created_at DESC)` and `audit_logs(created_at DESC)` for admin.
  - `reports(status, created_at DESC)` for admin queue.
  - `posts(user_id, created_at DESC)` composite (today only single-column `user_id` + single-column `created_at`).
- **Over-fetching**: most queries are `select('*')` — `profiles`, `posts`, `spots` rows are large. Mini-map already trims; feed/profile do not.
- **Client-side**: React Query exists but unused → every route change re-fetches from scratch. No memoization in `SpotMap`; markers and `featureGroup` rebuilt every render. Polling-style `useEffect` re-runs on every prop change.
- **Bundle/assets**: `src/assets/` carries ~6 MB of JPG/PNG (some 1.2 MB single files). `public/images/fish/` 3.7 MB. `public/*-trout.png` 300–400 KB each, all loaded by the landing species section. `framer-motion`, `recharts`, `embla-carousel`, `@tiptap/*` are eager-loaded in places they don't need to be.

## 3. Action items

### 3.1 Database (single migration)
- Add indexes:
  - `CREATE INDEX idx_spots_created_by ON spots(created_by);`
  - `CREATE INDEX idx_messages_receiver_unread ON messages(receiver_id) WHERE read = false;`
  - `CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = false;`
  - `CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);`
  - `CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);`
  - `CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);`
  - `CREATE INDEX idx_reports_status_created ON reports(status, created_at DESC);`
  - `CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);`

### 3.2 Query hygiene (frontend)
- Replace `select('*')` with explicit column lists on the hot paths: Feed, Profile, SpotMap, DesktopSidebar, SpotDetail, Messages list, Notifications.
- Switch unread counters (`useUnreadMessages`, sidebar notifications) to `count: 'exact', head: true` (already done in places) and rely on the new partial indexes.
- Stop refetching `profiles` per post — fetch via the existing `posts → profiles` join with selected columns only.

### 3.3 React Query as the cache layer
- Wrap the hot reads in `useQuery` with sensible `staleTime` (e.g. spots 5 min, profile 2 min, notifications 30 s, messages list 15 s) and `gcTime` 10 min so back-navigation is instant.
- Add `queryClient` defaults: `refetchOnWindowFocus: false`, `retry: 1`.
- Migrate (in order of impact): `SpotMap` spots fetch, `Feed` posts fetch, `Profile` posts/spots, `useUnreadMessages`, `DesktopSidebar` unread counters, `SpotDetail`.

### 3.4 Map & rendering memoization
- In `SpotMap.tsx`: memoize marker creation (`useMemo` on filtered spots), keep the `L.Map` instance in a ref and only diff/add/remove markers when the spot list actually changes (compare by id). Wrap drawer/filter callbacks in `useCallback`. Make the drawer + filter sheet not cause map re-mount.
- Same diffing approach in `ProfileSpotsMiniMap`.
- Use `React.memo` on `SpotDetailDrawer`, `MapLegend`, `BottomNav`, sidebar widgets.

### 3.5 Bundle & assets
- Lazy-load: `Publish`, `Messages`, `EditProfile`, `PostDetail`, `Notifications`, `Search`, `Invite`, `InstallaApp`, `Contatti`, `LeadMagnet` (Feed stays eager).
- Lazy-load `@tiptap/*` inside the blog editor only (it's admin-only — already lazy via AdminBlogEditor — verify no leakage).
- Convert heavy `src/assets/*.jpg/png` to WebP at the source (target ≤120 KB each); shrink `season-summer.jpg` (1.2 MB), `spot-lago-tovel.jpg` (1.1 MB), `flywaters-logo.png` (664 KB → SVG or 80 KB PNG). Use `vite-imagetools` or a one-shot `squoosh-cli` pass committed to repo.
- Resize `public/*-trout.png` and `public/images/fish/*` to max 800 px wide WebP (the cards render ~300 px).
- Add manual chunks in `vite.config.ts` for `leaflet`, `recharts`, `framer-motion`, `@tiptap` so they don't pollute the main bundle.

### 3.6 Misc
- Drop synchronous `await imageCompression` blocking on submit — already off the UI thread via web worker, keep as-is; just ensure single concurrent compression call.
- Verify `sw.js` (service worker) is actually registered and caches static assets — if yes, bump versioning; if no, either remove the file or wire it up properly.

## 4. Suggested execution order (most critical first)

1. **DB migration** with the 8 new indexes (§3.1) — instant win on already-deployed traffic.
2. **React Query rewrite** of `SpotMap`, `Feed`, `useUnreadMessages`, sidebar counters (§3.3) + `select` column trimming (§3.2).
3. **Map memoization** (§3.4).
4. **Route lazy-loading + manual chunks** (§3.5 first half).
5. **Asset slim-down** (§3.5 second half) — biggest single-page LCP win on landing/profile.

## 5. Risks / non-goals
- No schema changes beyond indexes, so no RLS impact and no app-code coupling.
- React Query rewrite touches many components; will land in small PRs per route so behavior parity is easy to verify.
- Asset re-encoding can shift visual fidelity slightly; will keep originals in a `src/assets/_originals/` folder if needed.

Shall I proceed starting with step 1 (the index migration) and step 2 (React Query + column trimming on `SpotMap` + `Feed` + unread counters)?
