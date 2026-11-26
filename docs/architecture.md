# LIFE LINK --- Software Architecture

> **Current-session update (23 November 2026):** Sections 16 and 17 record decisions made during the D4 grilling session and supersede conflicting earlier pending-status statements. The original architecture content and diagrams are retained as historical design context; update diagrams/contracts before implementation.

**Document:** `architecture.md`\
**Project:** LIFE LINK\
**Version:** 1.1\
**Date:** 10 November 2026\
**Status:** Architecture based on validated PRD v2.2 and group-approved
ADRs\
**Primary requirements source:** `prd.md` (LIFE LINK PRD v2.2, 9
November 2026)\
**Architectural drivers source:** `ASRs.md` (LIFE LINK Architecture
Significant Requirements and Architectural Drivers)

------------------------------------------------------------------------

## 1. Introduction and Architecture Purpose

LIFE LINK is a web-based donor-search and direct-contact platform. It
helps requesters find potential blood donors using blood group and
approximate location. It supports donor profiles and availability,
normal donor search, emergency blood requests, in-app notifications,
donor responses, request-specific in-app chat, reporting and
administrative review.

This document describes the system's logical architecture and the
architectural rules that guide implementation. It translates the
validated Product Requirements Document (PRD), Architecture Significant
Requirements (ASRs), architectural drivers and group-approved
Architecture Decision Records (ADRs) into an understandable structure
suitable for the university software engineering project.

The architecture aims to: - separate responsibilities into
understandable logical modules; - follow the group-approved Modular
Monolithic Architecture; - define communication through module
interfaces; - use shared database storage while retaining module-level
data ownership; - apply shared authorization rules consistently, with
each module enforcing permissions for its own operations; - provide
consistent donor search and approximate location matching; - coordinate
emergency request lifecycle, notifications and chat restrictions; -
protect personal information and preserve important records; and - avoid
introducing unapproved technologies, external services or features.

This document does not select a programming language, framework,
database product, hosting platform, deployment platform or specific
implementation technology. These are not mandated by the validated PRD
or the approved ADRs.

## 2. System Overview

LIFE LINK is one web application organized internally into logical
modules. The group-approved architecture style is **Modular Monolithic
Architecture (ADR-01)**. The modules are part of one application; they
are not independently deployed microservices.

The main user classes are:

-   **Requester:** searches for donors, contacts donors, submits
    emergency requests, views notified donors and response statuses, and
    communicates with notified donors.
-   **Donor:** creates and manages a donor profile, updates
    availability, receives matching emergency notifications, responds to
    requests and communicates with requesters.
-   **Administrator:** reviews reports and reported content and takes
    appropriate administrative action. An administrator cannot change a
    donor's availability on the donor's behalf.

A single account may act as both a requester and a donor.

The application uses a shared database. Each logical module is
responsible for managing the records assigned to it (ADR-04). Modules
communicate through defined module interfaces (ADR-03). Direct function
or method calls are suitable for operations internal to a module.
Asynchronous communication may be used where it provides a clear
benefit, such as notification handling. Network-based APIs are not
assumed for internal module communication.

The architecture includes separate donor-search and location-matching
responsibilities (ADR-06), a dedicated emergency-request lifecycle
component (ADR-07), centralized notification management (ADR-08), and
shared authorization rules enforced by modules for their own operations
(ADR-05).

**Decision-status clarification:** `ASR.md` identifies architectural
concerns and explicitly does not select an architecture style. This does
not conflict with the later group decision: ADR-01 separately and
formally approves Modular Monolithic Architecture. The architecture
style is therefore treated as approved here because of ADR-01, not
because it was selected by the ASR document.

## 3. Architectural Drivers

The architecture is guided by the eight ASRs in `ASR.md`.

  -----------------------------------------------------------------------
  ASR                     Architectural driver    Architectural impact
  ----------------------- ----------------------- -----------------------
  ASR-01                  Authentication,         Protected operations
                          authorization and       must verify identity,
                          access control          role, ownership and
                                                  participation. Donor
                                                  contact details,
                                                  request cancellation,
                                                  conversation access and
                                                  administrator actions
                                                  require access control.

  ASR-02                  Donor search            Search combines blood
                          performance and         group, manually
                          filtering               selected city/area,
                                                  radius, distance
                                                  ordering and
                                                  availability freshness
                                                  while meeting the PRD's
                                                  3-second response
                                                  target.

  ASR-03                  Approximate location    Normal search and
                          privacy and matching    emergency matching use
                                                  approximate location
                                                  information and
                                                  consistent
                                                  inclusive-radius rules
                                                  without GPS-based
                                                  location capture or
                                                  public exact-address
                                                  disclosure.

  ASR-04                  Emergency request       Request state governs
                          lifecycle and automatic cancellation, donor
                          expiration              responses,
                                                  notifications and
                                                  whether related
                                                  conversations accept
                                                  new messages.
                                                  Expiration is required
                                                  at 11:59 PM PKT on the
                                                  required date.

  ASR-05                  Emergency notification  The system must
                          targeting and           identify the donors
                          cancellation            notified for a
                                                  particular request so
                                                  cancellation
                                                  notifications reach the
                                                  correct recipients.

  ASR-06                  Request-specific chat,  Conversations are
                          participant             associated with a
                          authorization and       requester, a notified
                          history                 donor and a specific
                                                  request. Access is
                                                  restricted and messages
                                                  become read-only after
                                                  cancellation or
                                                  expiration.

  ASR-07                  Reliability and         Donor profiles,
                          preservation of         emergency requests,
                          important records       responses and chat
                                                  messages must remain
                                                  available during normal
                                                  operation, including
                                                  after cancellation or
                                                  expiration.

  ASR-08                  Maintainability and web Responsibilities and
                          compatibility           interfaces should
                                                  remain understandable
                                                  for the student team;
                                                  the web application
                                                  should support commonly
                                                  used browsers and
                                                  desktop/mobile screen
                                                  sizes.
  -----------------------------------------------------------------------

### 3.1 Quality Goals and Measurable Targets

-   **Search performance:** PRD NFR-01 requires search results within 3
    seconds under normal operating conditions.
-   **Usability:** PRD NFR-02 requires at least 4 out of 5 test users to
    complete donor search without assistance.
-   **Security and privacy:** PRD NFR-03 requires protection of user
    information and restricted access to protected functionality.
-   **Maintainability:** PRD NFR-05 requires the system to remain
    understandable and manageable for the student development team.
-   **Reliability and preservation:** PRD NFR-06 requires preservation
    of important records, including donor information, emergency
    requests, responses and chat messages.
-   **Compatibility:** PRD NFR-07 requires support for commonly used
    modern browsers and desktop/mobile screen sizes.

`ASR.md` discusses proposed search test assumptions of up to 5,000 donor
records and 20 simultaneous donor-search requests. These are test
assumptions in the ASR document, not additional PRD guarantees or
production-capacity commitments. The team should record actual results
against the PRD's 3-second target.

## 4. Selected Architecture and Justification

### 4.1 Modular Monolithic Architecture

The group approved **Modular Monolithic Architecture** in ADR-01.

LIFE LINK is structured as one application containing logical modules
with clearly defined responsibilities. Modules collaborate through
defined interfaces and share one database, while each module remains
responsible for its own records and operations.

This style is appropriate because it: - separates responsibilities
without requiring independently deployed services; - keeps development,
testing and deployment manageable for the student team; - avoids the
additional network, deployment and operational complexity of
microservices; - is consistent with the approved shared-database
decision; and - allows the team to maintain explicit module interfaces
and ownership boundaries.

### 4.2 Approved Architectural Decisions

  -----------------------------------------------------------------------
  Concern                             Approved decision
  ----------------------------------- -----------------------------------
  Overall architecture style          Modular Monolithic Architecture
                                      (ADR-01).

  Component communication             Defined module interfaces; direct
                                      calls within a module; asynchronous
                                      communication only where
                                      beneficial; APIs for external
                                      integrations only when approved and
                                      required (ADR-03).

  Data storage                        Shared database with individual
                                      module ownership of records
                                      (ADR-04).

  Authorization                       Shared authorization rules, with
                                      each module enforcing permissions
                                      for its own operations (ADR-05).

  Donor search and location           Separate donor-search and
                                      location-matching components with
                                      defined interfaces (ADR-06).

  Request lifecycle                   Dedicated emergency-request
                                      lifecycle component (ADR-07).

  Notifications                       Centralized notification management
                                      (ADR-08).
  -----------------------------------------------------------------------

### 4.3 Current Decision Status (Updated 23 November 2026)

- **ADR-02 — Module Boundaries:** Accepted for the eight logical modules: Authentication, Donor Management, Donor Search, Location Matching, Emergency Requests, Request Lifecycle, Notifications and Chat. Exact interfaces and record ownership mapping remain to be documented.
- **ADR-09 — Chat and Conversation History:** Accepted for the logical Chat responsibility and the current-session chat rules. Conversation grouping (per user pair versus per emergency request) remains open.
- **ADR-10 — External Systems and Integrations:** Accepted that no external SMS/email integration, SMS OTP or CNIC verification is included in the current version.

Authorization remains cross-cutting; UI is the presentation layer. There is no Administration module or administrator actor.

## 5. Architecture Overview Diagram

The following Mermaid diagram is editable and can be rendered by
Markdown tools that support Mermaid.

``` mermaid
flowchart TB
    Requester["Requester"]
    Donor["Donor"]
    %% Administrator actor removed by current-session decision
    UI["Web user interface"]

    subgraph APP["LIFE LINK — one Modular Monolithic Application"]
        AUTH["Authentication and account management"]
        PROFILE["Donor profile and availability"]
        SEARCH["Donor search"]
        LOCATION["Location matching"]
        REQUEST["Emergency request and donor response"]
        LIFE["Request lifecycle"]
        NOTIFY["Centralized notification management"]
        CHAT["In-app chat capability"]
        REPORT["User reporting and automated safeguard"]
        POLICY["Shared authorization rules"]
    end

    DB[("Shared database")]

    Requester --> UI
    Donor --> UI
    UI <--> AUTH
    UI <--> PROFILE
    UI <--> SEARCH
    UI <--> REQUEST
    UI <--> CHAT
    UI <--> REPORT

    POLICY -. "common rules applied by each protected module" .-> AUTH
    POLICY -.-> PROFILE
    POLICY -.-> REQUEST
    POLICY -.-> CHAT
    POLICY -.-> REPORT

    SEARCH -->|"profile and availability query"| PROFILE
    SEARCH <-->|"approximate distance and radius matching"| LOCATION
    REQUEST -->|"matching criteria"| LOCATION
    REQUEST -->|"donor and availability information"| PROFILE

    REQUEST <-->|"request state transition interface"| LIFE
    REQUEST -->|"request and recipient context"| NOTIFY
    LIFE -->|"cancellation / terminal-state effects"| NOTIFY
    REQUEST <-->|"request and participant context"| CHAT
    LIFE -->|"Open / Cancelled / Expired state"| CHAT

    AUTH --> DB
    PROFILE --> DB
    REQUEST --> DB
    LIFE --> DB
    NOTIFY --> DB
    REPORT --> DB
    LOCATION -. "area reference data if persisted" .-> DB
    CHAT -. "conversation and message records; boundary pending ADR-09" .-> DB
```

**Diagram notes:**

1.  All logical responsibilities are inside one application; the diagram
    does not represent independently deployed services.
2.  Arrows represent logical interaction through module interfaces, not
    network calls.
3.  The shared authorization rules represent common policy, not a
    separately deployed authorization service. Each protected module
    enforces the relevant rules for its own operations.
4.  The database is shared, but each module must manage only the records
    assigned to its ownership boundary.
5.  The database relationships for location reference data and chat
    records are provisional until ADR-02 and ADR-09 are resolved.
6.  The exact module boundaries are subject to ADR-02. Chat's detailed
    boundary is subject to ADR-09.
7.  No external service is shown because none has been approved.

## 6. Main Components and Responsibilities

The following table describes logical responsibilities required by the
PRD and approved ADRs. It is not a claim that every listed
responsibility has already been approved as a separate module. Final
module boundaries are subject to ADR-02; chat's detailed boundary is
subject to ADR-09.

  --------------------------------------------------------------------------
  Logical component /     Responsibilities           Status / boundary
  responsibility                                     
  ----------------------- -------------------------- -----------------------
  Web user interface      Presents                   Required by the
                          registration/sign-in,      web-based PRD. UI
                          donor profile, search,     technology is not
                          emergency request, donor   selected.
                          response, chat and         
                          administration             
                          interactions.              

  Authentication and      Supports account           Required by FR-01/FR-02
  account management      registration and sign-in   and ASR-01. Exact
                          and provides authenticated module boundary subject
                          user identity to protected to ADR-02.
                          operations.                

  Shared authorization    Defines common permission  Policy approach
  rules                   rules based on identity,   approved by ADR-05.
                          role, ownership and        Each protected module
                          participation.             enforces the rules for
                                                     its own operations.

  Donor profile and       Creates and manages donor  Required by
  availability            profiles; maintains blood  FR-03/FR-04. Donors
                          group, manually selected   manage their own
                          city/area, contact number, profile and
                          availability and last      availability.
                          availability update.       

  Donor search            Accepts search criteria    Separate search
                          and applies blood-group,   responsibility approved
                          area, radius, result       by ADR-06.
                          ordering and freshness     
                          requirements.              

  Location matching       Provides approximate       Separate location
                          distance and               responsibility approved
                          inclusive-radius matching  by ADR-06. Ownership
                          for normal search and      and maintenance of
                          emergency matching using   persisted area
                          the same location          reference points
                          representation.            require ADR-02
                                                     confirmation.

  Emergency request and   Accepts and validates      Required by FR-08 to
  donor response          requests; manages request  FR-12. Exact division
                          information and donor      from lifecycle
                          responses; provides        responsibility and
                          requester views of         record ownership
                          notified donors and        subject to ADR-02.
                          response statuses.         

  Request lifecycle       Manages Open, Cancelled    Dedicated component
                          and Expired transitions,   approved by ADR-07.
                          requester-only             Expiry boundary is
                          cancellation rules and     11:59 PM PKT on the
                          time-based expiration;     required date.
                          communicates               
                          terminal-state effects to  
                          related responsibilities.  

  Centralized             Manages in-app emergency   Centralized
  notification management notifications to matching  responsibility approved
                          Available donors and       by ADR-08. Emergency
                          cancellation notifications SMS, WhatsApp and email
                          to all previously notified are outside current
                          donors.                    scope.

  In-app chat capability  Supports separate          Required by FR-13 and
                          requester--donor           ASR-06. Detailed module
                          conversations associated   boundary and interface
                          with a particular          require ADR-09.
                          emergency request; allows  
                          chat before response;      
                          preserves history and      
                          becomes read-only after    
                          cancellation/expiration.   

  Reporting and           Receives reports, supports Required by
  administration          administrator review and   FR-14/FR-15.
                          appropriate moderation     Administrators cannot
                          actions, such as disabling change donor
                          inappropriate profiles.    availability on a
                                                     donor's behalf.
  --------------------------------------------------------------------------

### 6.1 Data Ownership

ADR-04 approves a shared database with individual module ownership. It
does not by itself finalize the exact record-to-module mapping; that
mapping depends on ADR-02 and, for chat, ADR-09.

The following table identifies the expected ownership areas for group
confirmation. It is a proposed mapping, not a claim that the pending
decisions have been approved.

  -----------------------------------------------------------------------
  Record category         Expected owning         Qualification
                          responsibility          
  ----------------------- ----------------------- -----------------------
  User account and        Authentication and      Confirm account/profile
  authentication records  account management      separation under
                                                  ADR-02.

  Donor profile and       Donor profile and       Consistent with
  availability            availability            FR-03/FR-04.

  Approximate area        Location matching or an Confirm under ADR-02;
  reference points        agreed reference-data   ASR-03 requires
                          owner                   consistent approximate
                                                  points.

  Emergency request and   Emergency request and   Confirm exact ownership
  donor response records  donor response          of request status
                                                  versus lifecycle
                                                  transitions under
                                                  ADR-02.

  Request state           Request lifecycle       Lifecycle management is
  transitions and expiry  responsibility          approved by ADR-07;
  information                                     exact persistence
                                                  ownership must be
                                                  agreed with ADR-02.

  Notification and        Centralized             ASR-05 identifies
  recipient records       notification management donor/account ID,
                                                  request ID,
                                                  notification status and
                                                  timestamp as proposed
                                                  recipient information.
                                                  Confirm the exact
                                                  record design.

  Conversations and       In-app chat             Required capability;
  messages                responsibility          detailed
                                                  boundary/ownership
                                                  subject to ADR-09.

  Reports and moderation  Reporting and           Exact record structure
  records                 administration          is not specified by the
                                                  PRD.
  -----------------------------------------------------------------------

A module should not bypass another module's ownership responsibility by
directly manipulating its internal records. Cross-module operations
should use the owning module's defined interface.

## 7. Component Interactions and Communication

### 7.1 Communication Rules

The following rules follow ADR-03:

1.  Modules communicate through defined module interfaces.
2.  Direct function or method calls may be used for operations internal
    to a module.
3.  Network-based APIs are not assumed for internal module
    communication.
4.  APIs may be introduced for external integrations only when an
    external integration is approved and required.
5.  Asynchronous events or messages may be used where they provide a
    clear benefit, such as notification handling.
6.  A message broker, API gateway, service mesh or other communication
    infrastructure must not be introduced without an approved decision.

Detailed interface signatures and contracts are not finalized here. They
should be specified after ADR-02 and ADR-09 are resolved.

### 7.2 Key Interactions

**Normal donor search** 1. The requester signs in and enters blood
group, manually selected city/area and radius. 2. Donor search obtains
relevant donor profile and availability information through the
responsible interface. 3. Donor search uses location matching to
calculate approximate distance and apply the inclusive radius boundary.
4. Results are ordered by ascending distance, then by most recent
availability update. 5. Availability older than seven days is labelled
"May be outdated"; the donor remains visible. 6. Unavailable donors may
appear in normal search results but are labelled Unavailable. 7. A
signed-in requester sees a donor's contact number only after selecting
Contact.

**Emergency request submission and matching** 1. A signed-in requester
submits the required blood group, city, area, radius and required date;
the additional message is optional. 2. The request responsibility
validates required fields and rejects a required date in the past. 3.
The request is created with Open status. 4. Emergency matching uses the
same approximate location representation and inclusive-radius rule as
normal search. 5. Only donors with a matching blood group, Available
status and approximate location within the selected radius are eligible.
6. Centralized notification management creates in-app notifications and
retains request-specific recipient information. 7. Notified donors
initially have Pending response status.

**Donor response** 1. A notified donor accesses the relevant Open
request. 2. The response operation verifies that the request is Open and
that the donor is an authorized notified participant. 3. The donor
submits Accepted or Declined. 4. The latest response is made available
to the requester. 5. A donor may change their response while the request
remains Open. 6. Multiple donors may accept; acceptance does not
automatically close the request.

**Cancellation** 1. The requester asks to cancel their own Open request.
2. Authorization verifies requester ownership and the lifecycle rules
verify Open status. 3. The lifecycle responsibility transitions the
request to Cancelled through the agreed interface. 4. Centralized
notification management sends an in-app cancellation notification to all
donors previously notified about that request. 5. New or changed donor
responses are blocked. 6. Related conversations become read-only;
existing responses and messages remain viewable.

**Expiration** 1. The lifecycle responsibility ensures an Open request
changes to Expired at 11:59 PM Pakistan Standard Time (UTC+05:00) on its
required date. 2. After expiration, new or changed donor responses are
blocked. 3. Related conversations become read-only. 4. Previously
submitted responses and existing messages remain viewable. 5. The
mechanism that triggers expiry has not been selected by an ADR and must
be defined during implementation design without assuming an unapproved
technology.

**Chat** 1. A requester may start a separate conversation with any donor
notified about the request, even before that donor responds. 2. Each
conversation is associated with the specific requester, donor and
emergency request. 3. Participant authorization is checked before
conversation access and message operations. 4. Chat does not change the
donor's response status. 5. Once the request is Cancelled or Expired,
existing messages remain viewable to authorized participants but new
messages are rejected.

**Administration** 1. A user submits a report about a suspicious donor
profile or inappropriate content. 2. Reporting/administration makes the
report available for administrator review. 3. The administrator reviews
the report and may take an appropriate action, such as disabling an
inappropriate profile. 4. Administrator operations do not permit
changing a donor's availability on their behalf.

## 8. Data Flow

This section describes logical data movement, not a physical database
schema.

### 8.1 Donor Profile and Availability

-   A user registers and signs in.
-   A donor creates or updates their profile.
-   The donor manages their own Available/Unavailable status.
-   The system records the last availability update timestamp.
-   Donor search reads relevant profile and availability information
    through the owning responsibility.
-   The donor-profile responsibility manages its records in the shared
    database.

### 8.2 Search and Location

-   The requester supplies blood group, manually selected city/area and
    radius.
-   Donor search obtains matching profile and availability information.
-   Location matching uses the approximate location representation
    described in ASR-03.
-   Search applies the inclusive radius rule and result ordering.
-   The interface displays availability and freshness labels.
-   Exact residential addresses and GPS-based user location are not
    required by this flow.

### 8.3 Emergency Request and Notifications

-   The requester submits an emergency request.
-   The request responsibility validates and records the request as
    Open.
-   Matching uses blood group, Available status and the shared
    approximate-location/radius rule.
-   Centralized notification management sends in-app notifications to
    eligible donors.
-   Notification-recipient information associates each notified donor
    with the relevant request.
-   Donor responses are recorded and made visible to the requester.
-   On cancellation, the lifecycle responsibility coordinates the state
    transition and notification management uses the retained recipient
    information to notify all previously notified donors.

ASR-05 proposes recipient information containing donor/account ID,
request ID, notification status and timestamp. The group should confirm
the exact record structure when module/data ownership is finalized.

### 8.4 Chat and History

-   A conversation is associated with one requester, one notified donor
    and one emergency request.
-   Messages are managed through the chat responsibility.
-   Access is restricted to authorized participants.
-   Request lifecycle status determines whether the conversation is
    writable.
-   Cancellation or expiration does not delete previous messages or
    responses; it changes permitted operations to read-only behaviour.

### 8.5 Shared Database

The application uses one shared database. Each module owns and manages
its assigned records. Other modules obtain data through the owning
module's defined interface rather than bypassing its responsibility.

The database product, physical schema, transaction strategy, backup
method and recovery mechanism have not been selected by the approved
decisions and are not prescribed here.

## 9. Security and Privacy Considerations

Security and privacy requirements are derived primarily from PRD NFR-03,
ASR-01 and ASR-06.

### 9.1 Authentication and Authorization

-  The authentication responsibility is separated from
real-world identity verification.

-  Authentication establishes whether a user can access
their account.

-  Identity verification establishes whether the user's
claimed identity has been checked through an approved
verification process.

-  The system must maintain these as separate concepts.

-  The identity verification mechanism remains subject
to client/TA approval.

-  Modules must not independently assume that a logged-in
user is identity-verified.

-   Users must be authenticated before accessing protected
    functionality.
-   Shared authorization rules define consistent permission
    expectations.
-   Each module enforces permissions for its own operations (ADR-05).
-   Donors can manage only their own profiles and availability.
-   Only the requester who created an Open request can cancel it.
-   Only the requester and donors notified about a request may access
    the relevant conversation.
-   Donor contact numbers are visible only to signed-in requesters after
    selecting Contact.
-   Administrator access is limited to report review and permitted
    moderation actions.
-   Administrators cannot change donor availability on a donor's behalf.

The shared authorization rules are not assumed to be a separately
deployed service. They are common rules applied and enforced by the
modules responsible for the protected operations.

### 9.2 Personal and Location Information

-   Exact residential addresses must not be publicly displayed.
-   Location entry is manual city/area selection; GPS-based location
    detection is not part of the confirmed PRD scope.
-   Approximate area information is used for distance matching.
-   Donor contact numbers are not publicly exposed to unauthenticated
    users.
-   The platform does not claim to medically verify donor compatibility
    or guarantee donation.

### 9.3 Conversation Protection

-   Conversations are associated with a particular request and its
    requester/donor participants.
-   Participant authorization is checked for conversation access and
    message operations.
-   New messages are blocked after request cancellation or expiration.
-   Existing messages remain viewable to authorized participants in
    read-only mode.

### 9.4 Proposed Identity Verification Features

PRD v2.2 identifies CNIC-based identity verification (FR-16) and
registration-only SMS OTP (FR-17) as proposed additions pending
TA/client approval. They are not confirmed implementation requirements
in this architecture.

No CNIC collection, verification provider, SMS provider or external
identity service is assumed. If either feature is approved later, the
PRD, relevant ASRs and ADRs must be updated before its integration is
treated as part of the approved architecture. Registration OTP, if
approved, is for registration phone-number verification only and must
not be used for emergency notifications.

## 10. Performance and Reliability Considerations

### 10.1 Search Performance

-   The PRD requires search results within 3 seconds under normal
    operating conditions.
-   Search combines blood group, city/area, radius, distance ordering
    and availability freshness.
-   The same approximate location representation and distance-matching
    rules are used for normal search and emergency matching.
-   ASR.md proposes test assumptions of up to 5,000 donor records and 20
    simultaneous donor-search requests. These are proposed test
    conditions, not PRD production-capacity guarantees.
-   The team should measure and record actual response times against the
    PRD target.
-   No specific indexing, caching or database optimization technology is
    selected.

### 10.2 Usability and Compatibility Validation

-   PRD NFR-02 requires at least 4 out of 5 test users to complete donor
    search without assistance.
-   The team should evaluate the donor-search interaction against this
    target.
-   PRD NFR-07 requires support for commonly used modern browsers and
    desktop/mobile screen sizes.
-   The ASR document discusses browser/device test coverage; exact
    browser versions are not specified as architectural technology
    choices.

### 10.3 Lifecycle Reliability

-   Request lifecycle behaviour must remain consistent across request
    responses, notifications and chat.
-   The dedicated lifecycle responsibility coordinates Open, Cancelled
    and Expired transitions (ADR-07).
-   Expiration must follow the PRD's 11:59 PM PKT boundary on the
    required date.
-   The implementation must reliably enforce terminal states so new or
    changed responses and new chat messages are not accepted after
    cancellation or expiration.
-   The exact time-trigger or scheduling mechanism has not been
    selected.

### 10.4 Record Preservation and Consistency

-   Donor information, emergency requests, responses and chat messages
    must be preserved during normal operation (NFR-06).
-   Cancellation and expiration must not erase previous responses or
    messages.
-   Notification-recipient information must remain available to identify
    cancellation recipients.
-   Request creation, response recording, cancellation, recipient
    tracking and terminal-state enforcement must be tested for
    consistent outcomes.
-   Backup, restore, transaction and disaster-recovery mechanisms are
    not specified by the PRD or approved ADRs and require further design
    if needed.

### 10.5 Notification Reliability

-   Emergency notifications are in-app only.
-   Only matching Available donors within the inclusive radius receive
    emergency notifications.
-   Cancellation notifications go to all previously notified donors for
    that request.
-   Centralized notification management maintains the recipient
    association required for cancellation.
-   Delivery guarantees, retry behaviour and detailed notification
    status semantics are not specified by the PRD or approved ADRs. They
    must not be invented as approved requirements.

## 11. Maintainability and Scalability Considerations

### 11.1 Maintainability

-   Keep logical responsibilities focused and understandable.
-   Communicate across module boundaries through defined interfaces.
-   Use direct calls within a module for internal operations.
-   Avoid network APIs or asynchronous messaging unless required and
    justified.
-   Apply shared authorization rules consistently, with module-level
    enforcement.
-   Keep request lifecycle state distinct from donor response state; an
    Accepted response does not close the request.
-   Keep chat behaviour separate from Accept/Decline response behaviour.
-   Avoid adding frameworks, infrastructure or external integrations not
    required by the PRD or approved ADRs.
-   Finalize module boundaries and ownership through ADR-02 and chat
    boundaries through ADR-09.

### 11.2 Scalability

The approved architecture for the current project is a modular monolith.
It supports separation of responsibilities within one application, but
it does not claim independent deployment or independent scaling of
modules.

Search performance should be evaluated against the PRD target and ASR
test assumptions. A future move to independently deployed services,
separate databases, caching infrastructure or other scaling mechanisms
would require architectural evaluation and group approval.

### 11.3 Web Compatibility

The PRD requires support for commonly used modern browsers and
desktop/mobile screen sizes. The team should validate the interface on
the agreed browser/device test scope. This does not imply a guarantee
for every browser version or device.

## 12. Architectural Constraints

The following constraints are grounded in the validated PRD and approved
ADRs:

1.  LIFE LINK is a web-based donor discovery and direct-contact
    platform.
2.  The selected architecture style is Modular Monolithic Architecture
    (ADR-01).
3.  The application is one system organized into logical modules; exact
    final boundaries remain subject to ADR-02.
4.  Modules communicate through defined interfaces (ADR-03).
5.  Direct function/method calls may be used within a module.
6.  Network-based APIs are not assumed for internal module
    communication; use them for external integrations only if approved
    and required.
7.  Asynchronous communication is used only where beneficial and
    justified.
8.  One shared database is used, with individual module ownership of
    records (ADR-04).
9.  Shared authorization rules are enforced by each module for its own
    operations (ADR-05).
10. Donor search and location matching are separate responsibilities
    with defined interfaces (ADR-06).
11. Emergency request lifecycle management is handled by a dedicated
    component (ADR-07).
12. Notification management is centralized (ADR-08).
13. Donor search uses blood group, manually selected city/area and
    radius options of 5 km, 10 km, 25 km and 50 km.
14. The search radius boundary is inclusive.
15. Normal donor search may show Unavailable donors; emergency
    notifications go only to matching Available donors.
16. Availability older than seven days is labelled "May be outdated";
    those donors remain visible in normal search.
17. Emergency notifications are in-app only; SMS, WhatsApp and email
    emergency notifications are outside current scope.
18. Requests start Open after successful submission, may be cancelled
    only by their requester while Open, and expire at 11:59 PM PKT on
    the required date.
19. Donor responses and existing chat messages remain viewable after
    cancellation or expiration; new/changed responses and new chat
    messages are blocked.
20. Chat is associated with a requester, notified donor and emergency
    request; it does not change donor response status. Its detailed
    module boundary remains subject to ADR-09.
21. Exact residential addresses are not publicly displayed; GPS-based
    location capture is not part of the confirmed scope.
22. No programming language, framework, database product or deployment
    platform is mandated by the PRD.
23. CNIC verification and registration SMS OTP remain proposed and
    pending TA/client approval in PRD v2.2.
24. The project must remain understandable and manageable within the
    academic development period.
25. The platform does not claim to provide medical compatibility
    verification or guarantee a donation.

## 13. Open Decisions and Items Requiring Group Attention

This section preserves unresolved matters and does not silently decide
them.

  -----------------------------------------------------------------------
  Item                    Current evidence/status Required follow-up
  ----------------------- ----------------------- -----------------------
  ADR-02 --- Module       Pending. The ASR        Group must approve
  boundaries              document identifies     final module
                          architectural concerns  boundaries,
                          and candidate           responsibilities,
                          responsibility areas    interfaces and record
                          but does not approve a  ownership.
                          final module            
                          decomposition.          

  ADR-09 --- Chat and     Pending. PRD FR-13 and  Group must approve
  conversation history    ASR-06 define required  chat's architectural
                          chat behaviour, but the boundary and its
                          detailed component      interaction with
                          boundary and interface  request lifecycle and
                          decision are not        authorization.
                          approved.               

  ADR-10 --- External     Pending. No external    Group must decide
  systems and             service/provider is     whether an external
  integrations            approved.               integration is needed.
                                                  Do not add one by
                                                  assumption.

  Registration SMS OTP    PRD v2.2 marks FR-17    Keep outside confirmed
                          proposed and pending    implementation scope
                          TA/client approval.     until validated and
                                                  reflected in an updated
                                                  PRD and ADR. No
                                                  provider is selected.

  CNIC verification       PRD v2.2 marks FR-16    Keep outside confirmed
                          proposed and pending    implementation scope
                          TA/client approval.     unless formally
                                                  approved through scope
                                                  change.

  Approximate area points ASR-03 requires         Confirm how area
                          consistent approximate  reference points are
                          location matching; the  maintained and which
                          PRD requires manual     responsibility owns
                          city/area selection.    them under ADR-02.

  Data ownership mapping  ADR-04 approves         Approve the exact
                          module-level ownership, record-to-module
                          but ADR-02 is pending.  ownership mapping
                                                  through ADR-02.

  Request/lifecycle       ADR-07 approves a       Confirm the owning
  record ownership        dedicated lifecycle     responsibility and
                          component, but the      transition interface
                          division between        through ADR-02.
                          request record          
                          ownership and lifecycle 
                          transition              
                          responsibility is not   
                          fully specified.        

  Expiry execution        The expiry boundary is  Define and test the
  mechanism               specified by the PRD    implementation
                          and lifecycle           mechanism without
                          responsibility is       assuming an unapproved
                          approved, but the       technology.
                          trigger mechanism is    
                          not selected.           

  Notification recipient  ASR-05 proposes         Confirm the record
  information             donor/account ID,       structure and ownership
                          request ID,             through ADR-02/ADR-08
                          notification status and implementation detail.
                          timestamp.              

  Notification delivery   Centralized management  Define only what is
  semantics               is approved; retry and  required and obtain
                          delivery guarantees are group approval before
                          not specified.          adding stronger
                                                  guarantees or
                                                  infrastructure.
  -----------------------------------------------------------------------

### 13.1 PRD and ASR Consistency

-   `ASR.md` does not select an architecture style. ADR-01 separately
    records the group's approval of Modular Monolithic Architecture. The
    two documents serve different purposes and are consistent when read
    together.
-   PRD v2.2 remains the source of confirmed product requirements. FR-16
    (CNIC verification) and FR-17 (registration SMS OTP) remain proposed
    and pending TA/client approval.
-   ASR-02 includes proposed test assumptions of up to 5,000 donor
    records and 20 simultaneous searches. These do not replace or expand
    the PRD's 3-second performance requirement.
-   ASR-03 describes approximate location matching. Exact ownership and
    maintenance of area reference points remain open under ADR-02.
-   ASR-05 proposes notification-recipient information needed for
    cancellation targeting. The exact schema is not finalized here.
-   ASR-06 defines the required conversation behaviour, while ADR-09
    remains pending for the detailed component boundary.
-   ADR-05's approved approach is shared authorization rules with
    module-level enforcement. The diagram therefore does not represent a
    separate centralized authorization service.
-   ADR-06, ADR-07 and ADR-08 are included because the group approved
    separate search/location responsibilities, a dedicated lifecycle
    component and centralized notification management.

## 14. ADR References

The following statuses reflect the group decisions recorded for this
project. The final ADR files in the submission folder should use
matching titles, options, rationale and statuses.

  ---------------------------------------------------------------------------
  ADR               Decision              Status            Related sections
  ----------------- --------------------- ----------------- -----------------
  ADR-01            Overall Architecture  **Accepted**      2, 4, 5, 12
                    Style --- Modular                       
                    Monolithic                              
                    Architecture                            

  ADR-02            Module Boundaries and **Pending**       5, 6, 13
                    Responsibilities                        

  ADR-03            Component             **Accepted**      2, 4, 7, 12
                    Communication ---                       
                    defined module                          
                    interfaces and                          
                    appropriate                             
                    direct/asynchronous                     
                    communication                           

  ADR-04            Data Ownership and    **Accepted**      2, 4, 6.1, 8, 12
                    Storage --- shared                      
                    database with                           
                    individual module                       
                    ownership                               

  ADR-05            Authentication and    **Accepted**      4, 5, 6, 7, 9, 12
                    Authorization ---                       
                    shared rules with                       
                    module-level                            
                    enforcement                             

  ADR-06            Donor Search and      **Accepted**      4, 5, 6, 7, 8
                    Location Matching ---                   
                    separate                                
                    responsibilities with                   
                    defined interfaces                      

  ADR-07            Emergency Request     **Accepted**      5, 6, 7, 10, 12
                    Lifecycle and Expiry                    
                    --- dedicated                           
                    lifecycle component                     

  ADR-08            Notification          **Accepted**      4, 5, 6, 7, 8, 10
                    Management ---                          
                    centralized                             
                    notification                            
                    management                              

  ADR-09            Chat and Conversation **Pending**       5, 6, 7, 8, 9, 13
                    History                                 

  ADR-10            External Systems and  **Pending**       9, 12, 13
                    Integrations                            
  ---------------------------------------------------------------------------

## 15. Source Documents

This architecture is based on:

1.  `val-prd.md` --- LIFE LINK Product Requirements Document, Version
    2.2, dated 9 November 2026.
2.  `ASR.md` --- LIFE LINK Architecture Significant Requirements and
    Architectural Drivers, based on PRD v2.2.
3.  `Deliverable–3.docx` --- Deliverable 3 instructions.
4.  Group-approved architectural decisions recorded for ADR-01, ADR-03,
    ADR-04, ADR-05, ADR-06, ADR-07 and ADR-08.

The PRD remains the source of product behaviour. ASRs identify
architectural concerns and drivers; ADRs record approved architectural
choices. Where a detail remains unresolved, this document identifies it
as pending rather than selecting a technology or feature by assumption.

------------------------------------------------------------------------

**End of `architecture.md`**


---

## 16. Current-Session Architecture Decisions (23 November 2026)

### 16.1 Approved architecture baseline
- Modular monolith; no microservices.
- One shared database.
- Each logical module owns and manages its own records.
- REST API.
- Authorization is cross-cutting.
- UI is a presentation layer.
- Local deployment for demonstration.
- English-only interface.
- No external SMS or email integration; no SMS OTP or CNIC verification in this version.
- No administrator role, dashboard or human report-review workflow.

### 16.2 Logical modules
The current approved logical module set is:
1. Authentication
2. Donor Management
3. Donor Search
4. Location Matching
5. Emergency Requests
6. Request Lifecycle
7. Notifications
8. Chat

Administration is removed. Authorization is not a standalone module; it is enforced across protected operations. UI is not a business module.

The exact entity/table ownership map and REST interface contracts remain to be written as supporting artefacts. Do not invent those contracts or treat a proposed directory structure as an approved interface.

### 16.3 Chat responsibility
Chat is general platform functionality and may also be associated with emergency requests. Approved rules include registered-user invitations, one pending invitation per pair, no automatic expiry, Accept/Reject/Restrict, 24-hour retry after rejection, contact restriction without account suspension, participant-only history, immutable individual messages, text-only content and no chat notifications.

The grouping model (one conversation per pair or separate conversations per request) remains open. The Chat module boundary is approved at logical level; detailed grouping/data contract is not.

### 16.4 Reporting safeguard
Reporting remains available without an administrator. Three independent reports is the selected threshold for a seven-day precautionary restriction on creating new emergency requests only. Other account functions remain available. Restriction records are private and contain reason, start date and expiry date; reporter identity remains private. No formal appeal mechanism was selected.

A report count is not proof of misconduct. The restriction is a precautionary automated trigger, not a verified finding. Definition of independent reporters, duplicate prevention, rate limits and anti-coordination safeguards remain open and must be specified before implementation.

### 16.5 Data access boundaries
- Users may edit their own profiles and declared blood group.
- Donors control their own availability.
- A new donor defaults to Unavailable.
- Requester contact details are disclosed only to donors whose responses the requester accepts.
- Emergency requests are visible only to registered users with a matching declared blood group, while the owner retains access.
- Only the two chat participants can read their conversation history.
- Reporter identity and restriction records are private.
- A reporting restriction prevents only new emergency-request creation during its seven-day period.

### 16.6 Notifications
In-app only; no notification-history page. Notify for relevant emergency requests, responses to the user's own requests and request status changes. Do not notify for chat events. Exact transient alert delivery/persistence mechanics remain a design detail.

## 17. Required Reconciliation Before Implementation
1. Update architecture diagrams to remove Administration and show the eight logical modules.
2. Define module-owned entities/tables and REST contracts.
3. Define the independent-report rule and anti-abuse safeguards.
4. Reconcile Open/Closed request statuses with fulfilled/cancelled/expired outcomes.
5. Define donor response transitions and request closure with multiple accepted donors.
6. Decide chat grouping and request association.
7. Define account deletion and retention behaviour.
8. Specify the notification delivery model without a history page.


> **Diagram note:** The original architecture diagrams are retained for traceability. Any remaining legacy Administrator labels in historical diagrams are superseded by Section 16; update the diagrams before implementation to show the automated reporting safeguard and eight-module structure.
