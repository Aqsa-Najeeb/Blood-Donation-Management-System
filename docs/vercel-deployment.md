# LIFE LINK — Vercel Deployment & Demo Mode Guide

This guide describes how to configure, deploy, and evaluate **LIFE LINK** on Vercel. It details the safe configuration of **Demo Mode**, the difference between Demo and Production modes, and a step-by-step presentation walkthrough for project evaluation.

---

## 1. Architectural Overview & Safe Separation

LIFE LINK features a strict, backend-controlled separation between **Real Mode** and **Demo Mode**:

| Feature | Production / Real Mode | Demo Mode |
| :--- | :--- | :--- |
| **Configuration** | `NODE_ENV=production`<br>`DEMO_MODE=false` | `NODE_ENV=development`<br>`DEMO_MODE=true` |
| **Backend Storage** | Real MySQL database via Prisma | Isolated in-memory store (`demoStore.js`) |
| **Database Failure** | **Fails Closed** (`503 Service Degraded`); UI blocks requests | Serves seeded demonstration data safely |
| **Demo Activation** | **Never activates automatically**; hard-disabled in production | Enabled only when explicitly configured |
| **Banner / Disclaimers** | No banner | Fixed high-visibility yellow header & chat notice |
| **Account Switching** | Disabled; requires real registration & login | 1-click switcher across donor & recipient accounts |
| **Simulated Chat** | Encrypted real database pair messaging | In-memory simulated pair chat with perspective switching |
| **External Actions** | Real system notifications | No real SMS, email, or emergency dispatch |

> **Security Rule:** Even if `DEMO_MODE=true` is accidentally set, `backend/config/demoMode.js` automatically forces `isDemoModeEnabled() === false` whenever `NODE_ENV === "production"`. Demo mode cannot run in a production environment.

---

## 2. Environment Variables Configuration

Set these environment variables in your Vercel project settings (**Settings > Environment Variables**):

### A. Demo Mode Deployment (Recommended for Presentations & Grading)
For presenting the application without needing a live external MySQL database:

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Enables development/demo features |
| `DEMO_MODE` | `true` | Activates in-memory fictional demo accounts & data |
| `JWT_SECRET` | *(64-character random hex string)* | Signs demo tokens (e.g. `openssl rand -hex 32`) |

*In Demo Mode, `DATABASE_URL` is optional. If MySQL is not present, the system automatically runs the full application in memory.*

### B. Production Mode Deployment
For live multi-user production with a real database:

| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Forces strict security, disables demo mode |
| `DEMO_MODE` | `false` | Explicitly disables demo endpoints |
| `DATABASE_URL` | `mysql://user:pass@host:3306/lifelink` | Managed MySQL database connection string |
| `JWT_SECRET` | *(64-character random hex string)* | Secure key for real user authentication tokens |
| `CORS_ORIGIN` | `https://your-domain.vercel.app` | Restricts API access to your deployed frontend domain |

---

## 3. Step-by-Step Vercel Deployment

### Method 1: Git Integration (Recommended)
1. Push this repository to GitHub or GitLab.
2. Log in to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import the `Blood-Donation-Management-System` repository.
4. In **Project Settings**:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** `npm run build:css`
   - **Output Directory:** *(Leave blank — configured via `vercel.json`)*
5. Add the Environment Variables (see Section 2).
6. Click **Deploy**.

### Method 2: Vercel CLI
```powershell
# 1. Install Vercel CLI if not already installed
npm install -g vercel

# 2. Build Tailwind CSS
npm run build:css

# 3. Deploy to Preview
vercel

# 4. Set Environment Variables when prompted or run:
vercel env add DEMO_MODE development
vercel env add JWT_SECRET development

# 5. Deploy to Production
vercel --prod
```

### Vercel Routing Configuration (`vercel.json`)
The project includes a production-ready `vercel.json` and serverless entry point `api/index.js`:
- `/api/*` requests route directly to Express serverless handlers.
- Static assets (`/assets/*`, `/js/*`, `/output.css`) are served at edge CDN speed from `src/`.
- Client-side SPA routes (`/chat`, `/login`, `/donor-dashboard`, `/request-blood`, etc.) automatically rewrite to `src/index.html`.

---

## 4. Evaluator & Presentation Walkthrough

When `DEMO_MODE=true` is active, the application displays a prominent top bar:
`DEMO MODE — Isolated sample data. Real records are never modified.`

### Step 1: Instant Account Switching
Use the quick buttons in the yellow top banner or on the `/login` page to switch identities instantly:
1. **Usman Khan (Demo Donor):** O+ Blood, Gulberg III, Lahore (`demo.donor`).
2. **Farhan Malik (Demo Recipient):** O+ Requester, Model Town, Lahore (`demo.recipient`).
3. **Ayesha Siddiqui (Demo Donor):** A+ Blood, DHA Phase 5, Lahore (`demo.ayesha`).

### Step 2: Multi-User Simulated Chat Demonstration
1. Click **Farhan (Recipient)** in the top banner.
2. Navigate to **💬 Chat** via the top navigation bar.
3. Observe the pre-seeded active conversation with Usman Khan and the disclaimer:
   > *SIMULATED DEMO CHAT: Messages in demo mode are in-memory simulations for demonstration purposes only.*
4. Type a message: `"Usman, I am waiting near the counter."` and press **Send**.
5. Click **Usman (Donor)** in the top banner to switch to the donor's perspective.
6. The chat screen refreshes immediately to show Farhan's new message from Usman's perspective!
7. Type a reply: `"Received, arriving in 2 minutes."` and send. Switch back to Farhan to confirm instant two-way synchronization.

### Step 3: Emergency Blood Request Demonstration
1. While logged in as **Farhan (Recipient)**, go to **Recipient Dashboard** or **Request Blood**.
2. Notice the sample emergency request `DEMO-1001` at Mayo Hospital (Demo).
3. Switch to **Usman (Donor)** and visit **Donor Dashboard** to view matching alerts and accept/decline responses.
4. Switch back to **Farhan** to accept or decline the donor response (`PATCH /api/requests/:id/decide/:respId`).

### Step 4: Donor Search & Policies
1. Visit **Find Donors** to test real-time blood group filtering (e.g., O+, A+).
2. Visit **User Agreement** (`/user-agreement`) and **Privacy Policy** (`/privacy-policy`) directly from the footer or signup screen.
3. Test signup age verification: entering a birth date under 18 years automatically blocks registration; users 18 and older are permitted.

---

## 5. Verification & Automated Test Results

The entire platform is protected by automated regression test suites covering unit, BVA, policy, security, and demo requirements:

```powershell
# Run the complete test suite
npm run test:all
```

**Verification Results:**
- **35 test suites, 114 tests passing (100% pass rate, 0 failures).**
- **Assets & Structure:** 28 source files, 27 SVG assets, 14 routes, 7 Postman suites verified.
- **Demo Store:** In-memory isolation, demo token signing, rejection on real login, chat synchronization, and zero leakage to real database.
- **Fail-Closed:** In production or when demo mode is false, database disconnection immediately triggers a safe 503 response.
