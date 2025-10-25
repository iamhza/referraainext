# Referra Launch Scope and Build Plan

Author: CTO notes (agreed with founder)
Status: Approved – source of truth for the initial launch cut + Referral Network + Connections

## 0) Non-goals / parked
- Email onboarding, auto-invites, digests: parked. Leave clean hooks but ship without email.

## 1) Global scope decisions (approved)
- Messaging lives only on `/workspace` for all roles.
- Remove old `thread/*` and backup files. Keep `/workspace` as the single route.
- Providers can only access referrals in statuses: `confirmed`, `in_progress`, `active`, `accepted`, `completed`.
- Internal notes (`isInternal`) are private to the author and must never be shown to the other party.
- Standardized message categories everywhere:
  - `status_update`, `document_request`, `service_coordination`, `follow_up_required`, `incident`, `general`
- Sidebar highlighting fixed so only the correct nav item is active (especially on workspace pages).

## 2) Roles and plans
- Case Managers: unlimited, free, ungated for everything.
- Providers: plan-gated.
  - Free: may upload full client list, but can actively track up to 3 clients; cannot submit to Open Referrals (0 submissions/month).
  - Pro: unlimited client tracking, up to 10 submissions/month in Open Referrals.
  - Scale: unlimited client tracking, unlimited submissions.
- Storage for plans: Supabase Postgres `subscriptions` table (with RLS); quotas enforced in APIs.

## 3) Connections (CM ↔ Provider ↔ Client) – for BOTH roles
Goal: Immediate, obvious value for any plan. Build on existing `clients` and `referrals` data – no new people table.

- CSV templates (both roles) include: client name, DOB, county/zip; providers also include `caseManagerEmail` and `providerOrg`.
- Matching:
  - Primary key: normalized `clientName + DOB`.
  - Secondary signals: `caseManagerEmail`, `providerOrg`, location (county/zip).
  - Store a normalized `clientMatchKey`; add an index for fast matching (Mongo).
- Connections list (both roles):
  - Shows client name, counterpart (CM or provider), last activity, badges: Active/Not activated, Needs attention.
  - Quick actions: Activate tracking, Open Workspace, Request Docs, Send Update.
- Activation semantics:
  - One click → create/open referral (idempotent) then land in `/[role]/referrals/[referralId]/workspace`.
  - Reuse existing API `src/app/api/referrals/[id]/assign-provider/route.ts` for assignment.

### Provider gating with Provisional Activation (approved)
- Case manager can always Activate. Workspace opens immediately.
- If provider is over quota:
  - Provider is placed in read-only state (can view messages/files, no posting/uploads) with an in-app upgrade banner.
  - Case manager sees a pill: “Provider in read-only”.
  - Quota starts counting for the provider on first provider reply OR after a 7-day grace period (configurable), whichever comes first.
- Deactivation frees a provider slot. Free plan users can keep exactly 3 active tracked clients at a time; others are locked/greyed with an Upgrade CTA.

## 4) Referral Network (Open Referrals)
- Case manager can “Post to Network” (toggle on a referral) – default expiry 7 days (configurable); can manually close anytime.
- Providers can browse Open Referrals (visibility per plan) and submit “Submissions”.
- Provider submission fields (approved):
  - Required: `coverNote` (free text), `capacityFlag` (yes/no), `earliestStartDate` (date), `serviceAreas` (zip/county), `languages` (multi), `credentials` (checkboxes), `experienceTags` (multi), `contact` (name/phone)
  - Optional: `staffingPlan` (free text), `shiftAvailability` (checklist), `attachments` (PDF)
- Anti-spam/quality controls:
  - Min `coverNote` length 300 chars; duplicate-template penalty (cosine similarity > 0.9).
  - One submission per provider per referral; allow one edit before deadline.
  - Submission window default 7 days.
- Ranking (v1) – show top 10 to CM:
  - Weights: serviceType 25, geo 25, credentials 15, capacity 10, earliestStartDate 10, languages 5, prior-connection 5, submission-quality 5.
  - Explainable scores; sorted; badges for capacity/earliest start.
- Selecting a provider (CM): reuse `assign-provider` and jump directly to `/workspace`.

## 5) Data model + indexes
MongoDB
- `referrals` (existing): add flags/fields: `isOpenToNetwork: boolean`, `networkExpiry: date`.
- `submissions` (new):
  ```json
  {
    "referralId": ObjectId,
    "providerId": string,
    "coverNote": string,
    "capacityFlag": boolean,
    "earliestStartDate": string,
    "serviceAreas": [string],
    "languages": [string],
    "credentials": [string],
    "experienceTags": [string],
    "contact": { "name": string, "phone": string },
    "staffingPlan"?: string,
    "shiftAvailability"?: [string],
    "attachments"?: [ { "name": string, "url": string } ],
    "score": number,
    "status": "submitted" | "shortlisted" | "rejected" | "selected",
    "createdAt": string,
    "updatedAt"?: string
  }
  ```
- Indexes: `submissions.referralId`, `submissions.providerId`, `submissions.createdAt`, `submissions.score`; also ensure `comments.parentId`, `comments.createdAt`, `referrals.status` are indexed.

Supabase (Postgres)
- `subscriptions` table (providers only):
  - Columns: `user_id (pk)`, `plan ('free'|'pro'|'scale')`, `submissions_quota`, `submissions_used`, `max_clients`, `period_start`, `period_end`.
  - RLS: owner read/write; service role for server actions.

## 6) APIs (lean, reuse patterns)
- Connections
  - GET `/api/connections` → role-aware list with activation status, needs-attention, last activity.
  - POST `/api/connections/activate` → idempotent create/open referral, reuse `assign-provider`, apply provisional activation if provider capped.
  - POST `/api/connections/deactivate` → archive/free slot.
- Referral Network
  - POST `/api/referrals/[id]/post-to-network` → toggle + expiry date.
  - POST `/api/referrals/[id]/submissions` → create/edit (plan/quality checked).
  - GET `/api/referrals/[id]/submissions` → returns ranked top 10 (+ paginated full list later).
  - POST `/api/referrals/[id]/select-provider` → (if needed) reuse existing `assign-provider` or call it directly.
- Workspace
  - No changes to `/workspace` messaging logic besides read-only state when provider over cap (banner + disabled composer).

## 7) UX specifics
- Provider upload: after import, show “Matches found” with bulk Activate respecting provider quota.
- Connections widgets (both roles): show counters, pills, quick actions.
- Read‑only provider state: upgrade banner, disabled composer; CM sees a pill.
- All activation flows land directly in `/workspace` – no new messaging UI to learn.

## 8) Milestones (execution order)
Day 1
- Supabase `subscriptions` table + RLS; Mongo `submissions` collection + indexes; `referrals` network flags.

Day 2
- Provider submission flow (UI + API) with quotas and basic anti‑spam; scoring util.

Day 3
- Case manager submissions view (ranked top 10) + Select Provider → workspace; provisional activation + read‑only state enforcement.

Day 4
- Connections widgets/lists for both roles; bulk Activate; last‑activity/needs‑attention badges.

Day 5
- QA + polish (empty states, toasts, error handling). Prepare for small beta.

## 9) Safety & integrity checks (must hold)
- Providers never see referrals in `matched/pending` unless confirmed.
- Internal notes never leak across parties.
- Category badges remain consistent across both roles.
- All links to messaging use `/workspace`.

---

This document is the reference for the launch work. Any deviations should be added here before coding.


## 10) API inventory and reuse plan (avoid duplication)

Existing endpoints to REUSE:
- Messaging/Workspace
  - `GET/POST/DELETE /api/referrals/[id]/comments` – canonical comments API (threading via `parentId`).
  - `GET /api/workspace/conversations` – conversations list and needs-attention logic.
- Referral CRUD + selection
  - `PATCH /api/referrals/[id]/assign-provider` – use for Connections → Activate and Network → Select Provider.
  - `GET/POST /api/referrals` and `GET/PATCH/DELETE /api/referrals/[id]` – existing referral data access.
- Users/Providers
  - `GET /api/users/me` – current user/role names.
  - `GET /api/providers/[id]`, `GET /api/providers/all` – provider data from Supabase.
- Presence
  - `POST /api/presence/heartbeat` – keep as-is.

Endpoints that likely EXIST and we will NOT duplicate:
- Potential/Open referrals feed – we can repurpose `GET /api/referrals/potential` to serve Open Referrals by filtering `isOpenToNetwork = true` (instead of creating a brand-new listing route).

New endpoints to ADD (because none exist yet):
- Connections
  - `GET /api/connections` – derive matches from existing `clients` (CM + Provider); include activation status and last activity.
  - `POST /api/connections/activate` – idempotent create/open referral, call `assign-provider`, apply provisional activation if provider capped.
  - `POST /api/connections/deactivate` – archive/free provider slot.
- Referral Network
  - `POST /api/referrals/[id]/post-to-network` – toggle + expiry; minimal flags added on referral.
  - `POST /api/referrals/[id]/submissions` – create/edit provider submission (plan/quality checks).
  - `GET /api/referrals/[id]/submissions` – return ranked submissions (top 10 for CM).

Data/storage additions (no duplicates found):
- Mongo: new `submissions` collection (indexes noted above); `referrals` gains `isOpenToNetwork`, `networkExpiry`.
- Supabase: new `subscriptions` table (providers only) with RLS; no existing table conflicts.

Developer rule of thumb (before adding any new route):
1) Grep for similar route or functionality under `src/app/api/*` and reuse where possible.
2) Prefer extending existing endpoints with flags/filters (e.g., repurpose `referrals/potential`) rather than creating parallel APIs.
3) Keep `/workspace` flows unified by reusing `assign-provider` and the existing comments/conversations APIs.


## 11) Build checklist & progress tracker

Owner: CTO (this repo). Use this as a living checklist during implementation.

- [x] Plan approved; scope locked for Launch Cut + Network + Connections
- [x] Add plan doc and API inventory to repo
- [x] Scoring utility added (`src/lib/scoring.ts`)
- [x] Endpoints scaffolded (no duplication):
  - [x] `POST /api/referrals/[id]/post-to-network`
  - [x] `GET/POST /api/referrals/[id]/submissions`
  - [x] `GET /api/connections`
  - [x] `POST /api/connections/activate`
  - [x] `POST /api/connections/deactivate`
- [ ] Supabase `subscriptions` table + RLS rules (providers only)
- [ ] Provider quota checks (API guards + UI counters)
- [ ] Read‑only provider state in `/workspace` (banner + disabled composer)
- [ ] Case Manager submissions view (ranked top 10) + Select Provider → reuse `assign-provider`
- [ ] Provider submission modal + validations (min 300 chars, duplicate template penalty)
- [ ] Connections widgets (both roles) + bulk Activate
- [ ] “Matches found” summary after uploads
- [ ] Indexes: `comments.parentId`, `comments.createdAt`, `referrals.status`, `submissions.{referralId,providerId,createdAt,score}`
- [ ] Remove legacy `thread/*` and backup files
- [ ] QA pass: role access, internal notes privacy, categories, workspace links

Notes:
- Do not create parallel APIs when an existing one can be extended (see §10).
- All activation flows must redirect into `/workspace` to keep the UX unified.



