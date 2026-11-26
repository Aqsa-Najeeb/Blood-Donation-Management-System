# ADR-09 — Chat and Conversation History

**Status:** Accepted for logical Chat responsibility; conversation grouping detail remains open  
**Project:** LIFE LINK  
**Decision date:** 23 November 2026  
**Decision source:** Current-session D4 grilling decisions

## 1. Context

Chat is a confirmed general platform capability, not limited to request-specific conversations. The session established invitation, access, privacy and content rules.

## 2. Architectural drivers

Conversation privacy, participant authorization, abuse prevention, history preservation and manageable implementation.

## 3. Decision

The modular monolith includes a logical Chat module. The following behaviour is approved:
- Only registered users can exchange chat invitations; donors and requesters can both initiate.
- One pending invitation maximum per user pair; invitations do not expire automatically.
- Recipient actions: Accept, Reject or Restrict.
- Accept opens chat. After Reject, the sender waits 24 hours before another invitation.
- Restrict contact prevents new messages and invitations between the pair, but does not suspend accounts or hide profiles.
- The recipient who applied the restriction can remove it.
- Existing messages remain visible to both participants after restriction.
- After restriction removal, a new invitation must be accepted before messaging resumes.
- Individual messages cannot be deleted; only the two participants can view history.
- Text-only chat; no media or voice.
- Users can report from chat.
- No notifications for chat invitations, invitation decisions or messages.

## 4. Open detail

The conversation grouping model is not decided: one conversation per user pair versus separate conversations per emergency request. The interface and record model must preserve the approved general-chat capability and must not silently remove existing request-linked behaviour. Resolve grouping before implementing the final data model.

## 5. Consequences

### Positive
Chat rules and the logical module responsibility are now clear enough for supporting design.

### Trade-offs
The conversation grouping model and its relationship to request lifecycle still need a specific decision. Contact restriction must not be confused with an account-level temporary restriction on creating emergency requests.
