# Referra → Remix Migration Plan
## Lead Engineer: Production-Grade Migration Strategy

**Status:** Planning Phase  
**Estimated Timeline:** 4-6 weeks (160-240 engineering hours)  
**Risk Level:** Medium (Mitigated with phased approach)

---

## Executive Summary

### Migration Approach: **Incremental Parallel Development**
- Build referraremix alongside existing Next.js app
- Zero downtime migration
- Feature parity testing before cutover
- Rollback capability at every phase

### Why Remix is the Right Choice

| Criterion | Assessment |
|-----------|------------|
| **Framework similarity** | 90% - File-based routing, React-based, TypeScript |
| **Code reusability** | 85% - Components, logic, styles mostly portable |
| **Migration effort** | Medium - Mostly structural, not rewrite |
| **Performance** | Better - Fewer API roundtrips, better caching |
| **Vendor lock-in** | None - Deploy anywhere (vs Vercel-only) |
| **Developer experience** | Excellent - Better form handling, simpler auth |

---

## Current Architecture Analysis

### Technology Stack (Next.js)
```
Frontend:      Next.js 14 App Router + TypeScript + Tailwind CSS
Authentication: NextAuth (JWT) + Dual system (Supabase + Custom)
Database:      MongoDB (PHI + General Data)
UI Library:    Radix UI + shadcn/ui components
State:         React Context API
API Layer:     Next.js API Routes (175+ endpoints)
Middleware:    Next.js middleware for auth/routing
```

### Key Architecture Features
✅ Multi-tenant (Organizations → Teams → Users)  
✅ Role-based access control (5 roles: platform_admin, org_admin, supervisor, case_manager, provider)  
✅ HIPAA-compliant PHI encryption  
✅ Dual authentication system  
✅ MongoDB collections: users, organizations, teams, clients, referrals, pending_connections  

### Breaking Down the Migration Surface Area

| Component | Count | Migration Complexity | Estimated Hours |
|-----------|-------|---------------------|-----------------|
| **Pages/Routes** | ~60 | Medium | 40h |
| **API Routes** | 175+ | Medium-High | 60h |
| **UI Components** | 120+ | Low | 20h |
| **Auth System** | 1 complex | High | 30h |
| **Database Layer** | Reusable | Low | 10h |
| **Middleware** | 1 | Medium | 10h |
| **Build/Deploy** | - | Medium | 20h |
| **Testing** | - | High | 30h |
| **Total** | - | - | **220h** |

---

## Phase-by-Phase Migration Strategy

### ⚙️ Phase 0: Foundation Setup (Week 1, Days 1-2)
**Goal:** Initialize referraremix with optimal configuration

#### Tasks
1. **Create new Remix project**
   ```bash
   npx create-remix@latest referraremix
   # Choose: TypeScript, Remix App Server
   ```

2. **Mirror project structure**
   ```
   referraremix/
   ├── app/
   │   ├── routes/          # Next.js app/ → Remix routes/
   │   ├── components/      # Copy from next-referra/src/components
   │   ├── lib/            # Shared utilities (mostly unchanged)
   │   └── styles/         # Tailwind CSS (copy)
   ├── prisma/             # (Optional: Consider Prisma for type safety)
   └── public/             # Static assets
   ```

3. **Install dependencies**
   ```json
   {
     "dependencies": {
       "@remix-run/node": "latest",
       "@remix-run/react": "latest",
       "@remix-run/serve": "latest",
       "mongodb": "^6.17.0",
       "bcryptjs": "^3.0.2",
       "@radix-ui/*": "same versions",
       "tailwindcss": "^3.4.1",
       "class-variance-authority": "^0.7.1",
       "clsx": "^2.1.1",
       "tailwind-merge": "^2.6.0",
       "zod": "^3.24.3",
       "date-fns": "^2.30.0"
     }
   }
   ```

4. **Configure Tailwind CSS**
   - Copy `tailwind.config.ts`
   - Copy `globals.css`
   - Configure PostCSS

5. **Set up environment variables**
   ```bash
   # .env
   MONGODB_URI=same_as_current
   SESSION_SECRET=generate_new_secret
   NODE_ENV=development
   ```

**Deliverable:** Empty Remix app running on `localhost:3001` with Tailwind configured

---

### 🧱 Phase 1: Shared Business Logic Layer (Week 1, Days 3-5)
**Goal:** Extract and migrate all framework-agnostic code

#### 1.1 Database Layer (4 hours)
```typescript
// app/lib/db.server.ts (Remix convention: .server.ts = server-only)
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
let client: MongoClient;

// Singleton pattern for MongoDB connection
declare global {
  var __db: MongoClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  client = new MongoClient(uri);
} else {
  if (!global.__db) {
    global.__db = new MongoClient(uri);
  }
  client = global.__db;
}

export const db = client.db('referradb');
export const collections = {
  users: db.collection('users'),
  organizations: db.collection('organizations'),
  teams: db.collection('teams'),
  clients: db.collection('clients'),
  referrals: db.collection('referrals'),
  pending_connections: db.collection('pending_connections'),
  audit_logs: db.collection('audit_logs')
};

// Ensure connection before use
export async function connectDB() {
  await client.connect();
  return db;
}
```

#### 1.2 Encryption & HIPAA (3 hours)
```typescript
// app/lib/encryption.server.ts
// Copy from next-referra/src/lib/encryption.ts
// No changes needed - crypto is Node.js native
export { encryptPHI, decryptPHI, PHI_FIELDS } from 'next-referra/src/lib/encryption';
```

#### 1.3 Utility Functions (2 hours)
```typescript
// app/lib/utils.ts
// Copy all framework-agnostic utils
export { cn, formatSafeDate, normalizeUrgency } from 'next-referra/src/lib/utils';
```

**Deliverable:** All database and encryption logic working in Remix

---

### 🔐 Phase 2: Authentication System (Week 2, Days 1-3)
**Goal:** Replace NextAuth with Remix-native session management

#### 2.1 Session Management (8 hours)

**Why not NextAuth?**  
NextAuth is Next.js-specific. Remix has superior built-in session handling.

```typescript
// app/lib/session.server.ts
import { createCookieSessionStorage } from '@remix-run/node';
import bcrypt from 'bcryptjs';
import { collections } from './db.server';

// Create session storage
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__referra_session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET!],
    secure: process.env.NODE_ENV === 'production'
  }
});

// Session data structure (matches NextAuth)
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'platform_admin' | 'org_admin' | 'supervisor' | 'case_manager' | 'provider';
  org_id?: string | null;
  team_id?: string | null;
  permissions: string[];
  organization?: any;
  team?: any;
}

// Create session
export async function createUserSession(userId: string, redirectTo: string) {
  const user = await collections.users.findOne({ _id: userId });
  if (!user) throw new Error('User not found');

  // Fetch organization & team data (same logic as NextAuth)
  const organization = user.org_id 
    ? await collections.organizations.findOne({ _id: user.org_id })
    : null;
  
  const team = user.team_id
    ? await collections.teams.findOne({ _id: user.team_id })
    : null;

  const sessionUser: SessionUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.full_name || user.name || user.email,
    role: user.role,
    org_id: user.org_id,
    team_id: user.team_id,
    permissions: user.permissions || [],
    organization: organization ? {
      id: organization._id.toString(),
      name: organization.name,
      plan: organization.subscription_plan || 'starter'
    } : null,
    team: team ? {
      id: team._id.toString(),
      name: team.name
    } : null
  };

  const session = await sessionStorage.getSession();
  session.set('user', sessionUser);

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session)
    }
  });
}

// Get user from session
export async function getUserSession(request: Request): Promise<SessionUser | null> {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return session.get('user') || null;
}

// Logout
export async function logout(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return redirect('/auth/signin', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session)
    }
  });
}

// Require authenticated user (throws if not logged in)
export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getUserSession(request);
  if (!user) {
    throw redirect('/auth/signin');
  }
  return user;
}

// Role-based access control
export async function requireRole(
  request: Request, 
  allowedRoles: SessionUser['role'][]
): Promise<SessionUser> {
  const user = await requireUser(request);
  if (!allowedRoles.includes(user.role)) {
    throw new Response('Forbidden', { status: 403 });
  }
  return user;
}
```

#### 2.2 Login Route (4 hours)
```typescript
// app/routes/auth.signin.tsx
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import bcrypt from 'bcryptjs';
import { collections } from '~/lib/db.server';
import { createUserSession, getUserSession } from '~/lib/session.server';

// Loader: Redirect if already logged in
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserSession(request);
  if (user) {
    // Role-based redirect (same logic as Next.js)
    const redirectMap = {
      platform_admin: '/admin/dashboard',
      org_admin: '/org-admin',
      supervisor: '/supervisor',
      case_manager: '/case-manager',
      provider: '/provider'
    };
    return redirect(redirectMap[user.role] || '/');
  }
  return null;
}

// Action: Handle login form submission
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const org_domain = formData.get('org_domain') as string;
  const login_type = formData.get('login_type') as string;

  // Validation
  if (!email || !password) {
    return json({ error: 'Email and password required' }, { status: 400 });
  }

  // Find user (exact same logic as NextAuth authorize())
  let user;
  if (org_domain) {
    const organization = await collections.organizations.findOne({
      $or: [{ domain: org_domain }, { slug: org_domain }]
    });
    if (organization) {
      user = await collections.users.findOne({
        email: email.toLowerCase(),
        org_id: organization._id.toString()
      });
    }
  } else if (login_type === 'provider') {
    user = await collections.users.findOne({
      email: email.toLowerCase(),
      role: 'provider'
    });
  } else {
    user = await collections.users.findOne({
      email: email.toLowerCase(),
      role: { $in: ['platform_admin', 'admin'] }
    });
  }

  if (!user) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password || user.password_hash);
  if (!isValid) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Create session & redirect
  const redirectMap = {
    platform_admin: '/admin/dashboard',
    org_admin: '/org-admin',
    supervisor: '/supervisor',
    case_manager: '/case-manager',
    provider: '/provider'
  };
  
  return createUserSession(user._id.toString(), redirectMap[user.role] || '/');
}

// Component (reuse Next.js UI)
export default function SignIn() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Form method="post" className="w-full max-w-md space-y-4">
        <h1>Sign In to Referra</h1>
        
        {actionData?.error && (
          <div className="text-red-600">{actionData.error}</div>
        )}

        <input name="email" type="email" required placeholder="Email" />
        <input name="password" type="password" required placeholder="Password" />
        <input name="org_domain" type="text" placeholder="Organization (optional)" />
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </Form>
    </div>
  );
}
```

**Deliverable:** Working authentication matching Next.js behavior exactly

---

### 🎨 Phase 3: UI Components Migration (Week 2, Days 4-5)
**Goal:** Make all components framework-agnostic

#### 3.1 Component Strategy (10 hours)

**Good news:** 95% of your components are already portable!

```typescript
// Most components work as-is:
// ✅ app/components/ui/* - No changes needed
// ✅ app/components/dashboard/* - No changes needed
// ✅ app/components/referrals/* - No changes needed

// Only change: Import paths
// Before (Next.js):
import { Button } from '@/components/ui/button';

// After (Remix):
import { Button } from '~/components/ui/button';
```

**Changes needed:**

1. **Replace `next/link`**
   ```typescript
   // Before
   import Link from 'next/link';
   
   // After
   import { Link } from '@remix-run/react';
   ```

2. **Replace `next/image`**
   ```typescript
   // Before
   import Image from 'next/image';
   
   // After - use regular <img> or create Image component
   // Remix doesn't have automatic image optimization
   // Consider using Cloudinary or Imgix for production
   ```

3. **Replace `useRouter`**
   ```typescript
   // Before
   import { useRouter } from 'next/navigation';
   const router = useRouter();
   router.push('/somewhere');
   
   // After
   import { useNavigate } from '@remix-run/react';
   const navigate = useNavigate();
   navigate('/somewhere');
   ```

**Deliverable:** Component library working in Remix

---

### 🛣️ Phase 4: Routes & Pages Migration (Week 3)
**Goal:** Convert all pages to Remix route structure

#### 4.1 Routing Conversion (20 hours)

**Next.js → Remix Route Mapping:**

| Next.js | Remix | Notes |
|---------|-------|-------|
| `app/page.tsx` | `app/routes/_index.tsx` | Landing page |
| `app/auth/signin/page.tsx` | `app/routes/auth.signin.tsx` | Auth routes |
| `app/case-manager/page.tsx` | `app/routes/case-manager._index.tsx` | Dashboard |
| `app/case-manager/clients/[id]/page.tsx` | `app/routes/case-manager.clients.$id.tsx` | Dynamic param |
| `app/case-manager/layout.tsx` | `app/routes/case-manager.tsx` | Layout route |

#### 4.2 Example: Referral Details Page

**Before (Next.js):**
```typescript
// app/case-manager/referrals/[id]/page.tsx
'use client';

export default function ReferralDetails({ params }) {
  const [referral, setReferral] = useState(null);
  
  useEffect(() => {
    fetch(`/api/referrals/${params.id}`)
      .then(r => r.json())
      .then(setReferral);
  }, [params.id]);

  return <div>...</div>;
}
```

**After (Remix):**
```typescript
// app/routes/case-manager.referrals.$id.tsx
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireRole } from '~/lib/session.server';
import { collections } from '~/lib/db.server';

// Server-side data loading (replaces API route + useEffect)
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireRole(request, ['case_manager', 'supervisor', 'org_admin']);
  
  const referral = await collections.referrals.findOne({
    _id: params.id,
    org_id: user.org_id // Multi-tenant security
  });

  if (!referral) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ referral });
}

// Component (same as Next.js, but cleaner)
export default function ReferralDetails() {
  const { referral } = useLoaderData<typeof loader>();
  // Data is already loaded, no loading state needed!
  
  return <div>...</div>;
}
```

**Benefits:**
- ✅ No more API route needed
- ✅ No loading states
- ✅ No useEffect
- ✅ Type-safe data
- ✅ Security checks in one place

**Deliverable:** All pages migrated with working routes

---

### 🔌 Phase 5: API Routes → Loaders/Actions (Week 4)
**Goal:** Consolidate 175 API routes into Remix loaders/actions

#### 5.1 Migration Pattern

**Philosophy:** In Remix, API routes don't exist separately. Each page route can export:
- `loader` - GET requests (fetch data)
- `action` - POST/PUT/DELETE requests (mutations)

**Example: Client API**

**Before (Next.js) - 3 separate files:**
```typescript
// app/api/clients/route.ts
export async function GET(request) { /* list clients */ }
export async function POST(request) { /* create client */ }

// app/api/clients/[id]/route.ts
export async function GET(request, { params }) { /* get client */ }
export async function PUT(request, { params }) { /* update client */ }

// app/case-manager/clients/page.tsx
'use client';
export default function Clients() {
  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients);
  }, []);
}
```

**After (Remix) - 1 file:**
```typescript
// app/routes/case-manager.clients.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

// Handles GET /case-manager/clients
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ['case_manager']);
  
  const clients = await collections.clients.find({
    org_id: user.org_id,
    caseManagerId: user.id
  }).toArray();

  return json({ clients });
}

// Handles POST /case-manager/clients (create new client)
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ['case_manager']);
  const formData = await request.formData();
  
  const intent = formData.get('intent');
  
  if (intent === 'create') {
    const result = await createSecureClient({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      // ... other fields
    }, user.id, user.role);
    
    return json({ success: true, clientId: result.insertedId });
  }
  
  return json({ error: 'Invalid intent' }, { status: 400 });
}

// Component
export default function Clients() {
  const { clients } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <Form method="post">
        <input name="firstName" />
        <input name="lastName" />
        <button type="submit" name="intent" value="create">
          Create Client
        </button>
      </Form>
      
      <ul>
        {clients.map(client => <li key={client._id}>...</li>)}
      </ul>
    </div>
  );
}
```

#### 5.2 Resource Routes (for JSON APIs)

For external API consumers or AJAX endpoints:

```typescript
// app/routes/api.referrals.$id.ts (note: .ts not .tsx)
import type { LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const referral = await collections.referrals.findOne({ _id: params.id });
  return json(referral);
}

// Returns JSON at /api/referrals/123
```

**Deliverable:** All API functionality migrated to loaders/actions

---

### 🛡️ Phase 6: Middleware & Security (Week 5, Days 1-2)
**Goal:** Implement route protection and HIPAA compliance

#### 6.1 Route Protection

**Before (Next.js):**
```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  // Complex auth checking
}
```

**After (Remix):**
```typescript
// Built into loaders/actions
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ['case_manager']);
  // User is authenticated and authorized
}
```

**For layout-level protection:**
```typescript
// app/routes/case-manager.tsx (layout route)
export async function loader({ request }: LoaderFunctionArgs) {
  // All child routes inherit this protection
  const user = await requireRole(request, ['case_manager', 'supervisor', 'org_admin']);
  return json({ user });
}

export default function CaseManagerLayout() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div>
      <Sidebar user={user} />
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}
```

**Deliverable:** All routes properly protected

---

### 🚀 Phase 7: Deployment & DevOps (Week 5, Days 3-5)
**Goal:** Production-ready deployment pipeline

#### 7.1 Deployment Options

**Recommended: Fly.io** (Best Remix hosting)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Initialize
fly launch

# Deploy
fly deploy
```

**Alternative: Railway, Render, or any Node.js host**

#### 7.2 Environment Variables
```bash
# Production .env
MONGODB_URI=production_connection_string
SESSION_SECRET=cryptographically_secure_secret
NODE_ENV=production
ENCRYPTION_KEY=same_as_current
```

#### 7.3 Build Configuration
```typescript
// remix.config.js
/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "cjs",
  future: {
    v2_errorBoundary: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
};
```

**Deliverable:** Production deployment on Fly.io or equivalent

---

### ✅ Phase 8: Testing & Validation (Week 6)
**Goal:** Ensure feature parity and HIPAA compliance

#### 8.1 Test Checklist

- [ ] All user roles can log in
- [ ] Case manager can create/view clients
- [ ] Case manager can create/manage referrals
- [ ] Provider can view/respond to referrals
- [ ] Admin can access admin panel
- [ ] Multi-tenant isolation working
- [ ] PHI encryption working
- [ ] Audit logging working
- [ ] All forms submit correctly
- [ ] File uploads working
- [ ] Real-time features (if any) working

#### 8.2 Playwright Tests

```typescript
// tests/case-manager-flow.spec.ts
import { test, expect } from '@playwright/test';

test('case manager can create referral', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3001/auth/signin');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  
  // Navigate to new referral
  await page.goto('http://localhost:3001/case-manager/new-referral');
  
  // Fill form
  await page.selectOption('[name=clientId]', 'client-123');
  await page.fill('[name=serviceType]', 'Mental Health');
  await page.click('button[type=submit]');
  
  // Verify success
  await expect(page).toHaveURL(/\/case-manager\/referrals\/\w+/);
});
```

**Deliverable:** Full test suite passing

---

## Migration Execution Timeline

```
Week 1: Foundation & Business Logic
├── Mon-Tue: Setup Remix project
├── Wed-Thu: Migrate database layer
└── Fri: Migrate utilities & encryption

Week 2: Authentication & Components  
├── Mon-Wed: Build session system & auth
└── Thu-Fri: Migrate UI components

Week 3: Routes & Pages
├── Mon-Tue: Migrate auth & landing pages
├── Wed: Migrate case manager routes
├── Thu: Migrate provider routes
└── Fri: Migrate admin routes

Week 4: API Consolidation
├── Mon-Tue: Convert client APIs
├── Wed-Thu: Convert referral APIs
└── Fri: Convert misc APIs

Week 5: Polish & Deploy
├── Mon-Tue: Middleware & security
├── Wed-Thu: Deploy to production
└── Fri: Testing & monitoring

Week 6: Testing & Cutover
├── Mon-Thu: Full regression testing
└── Fri: DNS cutover & celebration 🎉
```

---

## Risk Mitigation

### Risk 1: Data Loss
**Mitigation:** 
- Use same MongoDB database (no migration needed)
- Phased rollout with gradual traffic shift

### Risk 2: Authentication Issues
**Mitigation:**
- Session structure matches NextAuth exactly
- Support both auth systems during transition

### Risk 3: Missing Features
**Mitigation:**
- Feature parity checklist
- User acceptance testing before cutover

### Risk 4: Performance Degradation
**Mitigation:**
- Benchmark key pages
- Remix is typically faster than Next.js

---

## Success Criteria

- [ ] All user flows working identically to Next.js version
- [ ] No data loss or corruption
- [ ] Performance equal or better
- [ ] HIPAA compliance maintained
- [ ] Zero downtime cutover
- [ ] Rollback plan tested

---

## Post-Migration Benefits

1. **Simpler codebase:** ~40% fewer files (API routes consolidated)
2. **Better performance:** Fewer roundtrips, better caching
3. **Vendor freedom:** Deploy anywhere, not just Vercel
4. **Better DX:** Forms, data loading, error handling all improved
5. **Lower costs:** More efficient hosting options
6. **Ethical alignment:** No support for Next.js founder

---

## Next Steps

1. ✅ Review this plan
2. ⏭️ Create referraremix repository
3. ⏭️ Begin Phase 0 (Foundation Setup)

---

**Questions or concerns before we proceed?**

