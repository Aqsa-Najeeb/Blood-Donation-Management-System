# ADR-11 — Technology Stack Selection

**Status:** Accepted  
**Project:** LIFE LINK  
**Decision date:** 26 Nov 2026  
**Decision source:** Core Engineering Team Architecture Review

---

## 1. Context

The initial architectural documentation (`ADR-01` through `ADR-10` and `AGENTS.md` Section 8) deliberately left the concrete technology stack uncommitted to avoid premature optimization and maintain framework agnosticism during requirements refinement. 

With functional baselines established and prototype validation required for local demonstration and evaluation, the project requires an approved, unified implementation stack that supports the Modular Monolith architecture (`ADR-01`), shared relational data integrity (`ADR-04`), REST communication (`ADR-03`), and zero-build, rapid-evaluation frontend presentation.

---

## 2. Architectural Drivers

1. **Simplicity and Maintainability:** Lightweight codebase running in standard Node.js without distributed microservice or multi-runtime complexity.
2. **Schema Safety & Relational Integrity:** Strongly typed database access with transactional migrations supporting shared relational tables (users, requests, responses, chat messages).
3. **Frictionless Local Execution:** Rapid setup for local evaluation without complex frontend bundlers, container orchestration, or heavy toolchain prerequisites.
4. **Consistency with Prototype:** Leveraging existing Express + Prisma foundation while refactoring to full PRD and session compliance.

---

## 3. Decision

Adopt the following application technology stack for LIFE LINK:
- **Backend Runtime & Framework:** Node.js with **Express** (REST API architecture).
- **ORM & Data Layer:** **Prisma ORM** with **MySQL** database (relational storage with declarative schema and migrations).
- **Frontend Presentation:** **React** loaded via **UMD scripts** in the browser with in-browser **Babel** compilation (`@babel/standalone`) and Tailwind CSS.

---

## 4. Alternatives Considered

### Alternative 1: Full-Stack Next.js (TypeScript + Next.js App Router + Prisma + PostgreSQL)
- **Description:** A consolidated React framework combining server-side rendering, API routes, and modern TypeScript compilation.
- **Trade-offs:**
  - *Advantages:* Unified language across stack, built-in bundling, strong type sharing between backend and frontend, large community ecosystem.
  - *Disadvantages:* Substantially heavier build pipeline, Node.js version sensitivity, complex SSR/hydration edge cases during local demonstration, steeper learning curve, and higher memory footprint on evaluation machines.

### Alternative 2: Python / Django with Django REST Framework (DRF) + Vanilla JS / MPA
- **Description:** Traditional multi-page application or decoupled REST API backed by Python Django and Django ORM.
- **Trade-offs:**
  - *Advantages:* Mature built-in authentication, robust admin scaffolding, excellent documentation, and well-tested ORM.
  - *Disadvantages:* Introduces a secondary language/runtime runtime barrier (Python vs. JavaScript/React ecosystem), conflicts with existing Node.js prototype investments, requires Python virtual environments, and lacks reactive UI state handling needed for interactive chat and matching alerts without complex frontend integration.

---

## 5. Rationale for Selection

1. **Express** provides a minimalistic, transparent HTTP routing engine aligning directly with the modular monolith REST requirements.
2. **Prisma + MySQL** offers a declarative schema definition (`schema.prisma`), intuitive relational mapping, and rock-solid relational constraint enforcement.
3. **React via UMD and in-browser Babel** delivers reactive UI components and state management without the fragility, overhead, and build-step friction of Webpack, Vite, or Next.js bundlers. Demonstrators can run the system immediately after `npm install` and `node server.js`.

---

## 6. Consequences

### Positive
- Zero build step required for frontend changes; editing static JS files reflects immediately upon browser reload.
- Full local execution with minimal resource utilization.
- Strong schema verification through Prisma Client.
- Aligns directly with the existing prototype codebase layout, allowing focus on business rule alignment rather than total greenfield re-scaffolding.

### Negative / Trade-offs
- In-browser Babel transpilation carries a minor client-side performance cost at initial page load (acceptable for local demonstration and evaluation).
- Lack of compile-time TypeScript type checking across client and server boundaries requires strict runtime payload sanitization and schema validators.

---

## 7. Related Requirements and Decisions
- **ADR-01:** Modular Monolithic Architecture.
- **ADR-04:** Shared Database with Logical Module Ownership.
- **ADR-05:** Shared Authorization Rules.
- **ASR-08:** Maintainability and Deployment Simplicity.
