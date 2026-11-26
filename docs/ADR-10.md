# ADR-10 — External Systems and Integrations

**Status:** Accepted — no external integrations in current scope  
**Project:** LIFE LINK  
**Decision date:** 23 November 2026  
**Decision source:** Current-session D4 grilling decisions

## 1. Context

The original architecture left external providers unresolved. The current-session decisions explicitly excluded SMS OTP, SMS notification providers and external email notification integrations.

## 2. Architectural drivers

Scope control, privacy, security, maintainability, cost and avoiding unapproved dependencies.

## 3. Decision

No external SMS or email service integration is included in the current version. Authentication uses email and password without SMS OTP. Notifications are in-app only. CNIC verification is not included. No external provider may be added without a separately approved scope change and updated ADR.

## 4. Consequences

### Positive
- Avoids provider setup, credentials, external dependencies and integration complexity.
- Keeps the local demonstration scope manageable.

### Trade-offs
- No SMS/email delivery is available in this version.
- In-app notification delivery and local deployment behaviour must be tested within the application.
