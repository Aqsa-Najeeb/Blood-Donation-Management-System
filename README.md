# Life Link: Blood Donation Management System

A community blood donor coordination platform for Lahore. People can search for donors, raise blood requests, respond to them and chat by invitation.

> **Note:** This project currently uses demo data only. Donors, locations and sample records are for demonstration and do not represent real people available to donate.

## Tech Stack

### Frontend

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-663399?style=for-the-badge&logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React_18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Babel](https://img.shields.io/badge/Babel_7.25.6-F9DC3E?style=for-the-badge&logo=babel&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

### Database

![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

### Tools

![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

| Layer | Technology | Used for |
|---|---|---|
| UI | React 18 (CDN), Babel Standalone | Pages, with JSX compiled in the browser |
| Styling | Tailwind CSS | Compiled from `src/input.css` to `src/output.css` |
| Server | Node.js, Express 5 | REST API and static file hosting |
| Security | JSON Web Tokens, bcryptjs, CORS | Authentication, password hashing, origin control |
| Data | MySQL, Prisma ORM | Storage and schema management |
| Testing | Node test runner, Supertest | API and business rule tests |

## Features

- **Accounts:** registration with age check (18+ by default) and user agreement, login with email or username, profile editing, password change and account deactivation
- **Donor search:** filter by blood group, area and radius (5, 10, 25 or 50 km), sorted by distance
- **Blood requests:** 1 to 6 units, with standard, urgent or emergency urgency
- **Matching:** notifies available donors of the same blood group within the chosen radius
- **Responses:** donors accept or decline, and requesters approve or reject those who accept
- **Chat:** invitation-based conversations that either participant can restrict
- **Notifications:** in-app alerts for matches, responses, decisions and closed requests
- **Safety:** user reports, temporary restrictions, rate limiting and login lockout

## Getting Started

### Prerequisites

- Node.js 18.18 or newer, with npm
- MySQL Server on `localhost:3306`
- Internet access in the browser (React, Babel and fonts load from CDNs)

### 1. Clone and install

```bash
git clone https://github.com/Aqsa-Najeeb/Blood-Donation-Management-System.git
cd Blood-Donation-Management-System
npm install
```

### 2. Create the databases

```sql
CREATE DATABASE lifelink_db;
CREATE DATABASE lifelink_test;
```

### 3. Configure the environment

```bash
cp .env.example .env
```

Then edit `.env` with your MySQL username and password.

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Development database | set in `.env` |
| `DATABASE_URL_TEST` | Test database | set in `.env` |
| `JWT_SECRET` | Token signing key. In production it must be a private value of 32+ characters | development value |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | `development` or `production` | `development` in `.env.example` |
| `DEMO_MODE` | Enables demo login (ignored in production) | `false` |
| `CORS_ORIGIN` | Comma-separated allowed origins | `localhost:3000`, `127.0.0.1:3000` |
| `MIN_AGE_YEARS` | Minimum registration age | `18` |
| `AGREEMENT_VERSION` | Current user agreement version | `1.0` |

If you change `PORT`, set `CORS_ORIGIN` to match.

### 4. Set up the schema and sample data

```bash
npm run db:push
npm run db:seed
```

> `db:seed` deletes all existing data in the development database before adding sample users.

### 5. Start the app

```bash
npm start
```

Open <http://localhost:3000>.

## Demo Mode

Demo mode is controlled by environment variables, set in `.env` locally or in your hosting provider's settings.

| `NODE_ENV` | `DEMO_MODE` | Demo mode |
|---|---|---|
| `development` | `true` | Enabled |
| `development` | `false` | Disabled |
| `production` | any value | Always disabled |

Restart or redeploy the backend after changing these values.

> On any publicly accessible server outside `production`, set your own random `JWT_SECRET` of at least 32 characters.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the server |
| `npm run db:push` | Apply the Prisma schema |
| `npm run db:seed` | Reset and seed the database |
| `npm run db:studio` | Browse data in Prisma Studio |
| `npm run build:css` | Rebuild the Tailwind stylesheet |
| `npm run watch:css` | Rebuild styles on change |
| `npm test` | Check files, assets and routes |
| `npm run test:all` | Run the file checks and test suites |

## Running Tests

The test database needs the schema too. Replace the URL below with your `DATABASE_URL_TEST` value.

**macOS / Linux**

```bash
DATABASE_URL="mysql://root:password@localhost:3306/lifelink_test" npx prisma db push
npm run test:all
```

**Windows PowerShell**

```powershell
$env:DATABASE_URL="mysql://root:password@localhost:3306/lifelink_test"
npx prisma db push
Remove-Item Env:DATABASE_URL
npm run test:all
```

> ⚠️ Tests wipe the database named in `DATABASE_URL_TEST`. Never point it at data you want to keep.

## API Overview

All routes start with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| System | `GET /health`, `GET /config` |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/accept-agreement`; `GET /auth/me` |
| Donors | `GET /donors`, `/donors/:id`, `/donors/locations`, `/donors/availability`; `POST /donors/:id/contact` |
| Requests | `GET` and `POST /requests`; `GET /requests/:idOrCode`, `/requests/:idOrCode/responses` |
| Request actions | `PATCH /requests/:idOrCode/respond`, `/requests/:idOrCode/decide/:responseId`; `POST /requests/:idOrCode/cancel`, `/requests/:idOrCode/fulfil` |
| Donor actions | `PATCH /donor/availability`; `GET /donor/alerts` |
| Chats | `GET /chats`, `/chats/:conversationId`; `POST /chats/:conversationId/messages`; `PATCH /chats/:conversationId/restrict` |
| Invitations | `GET` and `POST /chats/invitations`; `PATCH /chats/invitations/:id` |
| Settings | `PUT /settings`, `/profile`, `/settings/password`; `DELETE /settings/account` |
| Notifications and reports | `GET /notifications`; `POST /notifications/read`, `/reports` |

## Business Rules

- Matching uses the exact blood group. It makes no medical compatibility claims.
- A user can have at most 3 open requests.
- Requests expire at 11:59 PM Pakistan time on the required date.
- A requester's contact number is shown only to the requester and approved donors.
- Signed-in users can reveal an available donor's phone number.
- Three reports from different accounts (each over 24 hours old) block the reported user from creating requests for 7 days.

## Project Structure

```text
├── backend/
│   ├── config/       # Policies and demo mode
│   ├── data/         # Supported locations
│   ├── middleware/   # Authentication and rate limiting
│   ├── modules/      # Matching, notifications, lifecycle, restrictions
│   ├── routes/       # API routes
│   └── utils/        # Validators, serializers, distance, clock
├── prisma/           # Schema and seed script
├── src/              # Frontend pages, scripts, styles and assets
├── tests/            # Test suites
├── docs/             # PRD, architecture and decision records
├── evidence/         # Test and verification records
├── postman/          # API collection and environment
└── server.js         # Entry point
```

## Disclaimer

Life Link helps people coordinate. It does not verify medical eligibility or blood compatibility. Always confirm with a qualified medical professional or blood bank.

## License

Released under the [MIT License](LICENSE).
