# LIFE LINK — Product Requirements Document (PRD)

> **Current-session amendment:** This PRD retains the original v2.2 requirements and adds the approved design decisions from the 23 November 2026 D4 grilling session in Section 16. Where Section 16 explicitly changes a prior statement, Section 16 takes precedence. Unchanged requirements remain in force. This amendment is a design update; it does not claim implementation or testing completion.

**Version:** 2.2  
**Date:** 9 November 2026  
**Status:** Previously approved scope retained; FR-16 and FR-17 are proposed additions pending TA/client approval.  
**Project:** LIFE LINK  
**Document:** Product Requirements Document

---

# 1. Introduction

## 1.1 Purpose

LIFE LINK is a donor-search and direct-contact platform designed to help people find potential blood donors based on blood group and approximate location.

The platform allows users to register as donors, manage their availability, search for donors, submit emergency blood requests, and communicate with potential donors through in-app chat.

The main objective is to make finding and contacting potential blood donors easier while keeping the platform simple, accessible and focused on donor discovery.

## 1.2 Project Scope

LIFE LINK will provide the following functionality:

- User registration and sign-in.
- Donor profile creation and management.
- Blood group-based donor searching.
- Manual city and area selection.
- Location-based filtering using selectable search radii.
- Donor availability and freshness indicators.
- Direct contact with donors.
- Emergency blood request submission.
- In-app notifications to matching available donors.
- Donor responses to emergency requests.
- In-app chat between requesters and notified donors.
- Reporting suspicious or inappropriate profiles.
- Automated user-reporting safeguard; no administrator dashboard or human review.
- **Proposed, pending TA/client approval:** Registration-only SMS OTP for phone number verification, as described in FR-17.
- **Proposed, pending TA/client approval:** CNIC-based identity verification, as described in FR-16.

Registration SMS OTP, if approved, will only be used to verify a phone number during registration. It will not be used for emergency request notifications.

CNIC-based identity verification is not part of the confirmed implementation scope unless approved by the TA/client.

The project will focus on donor discovery and communication. It will not guarantee that a donor will respond, be medically eligible, or complete a donation.

## 1.3 Intended Users

**Requester:** A user searching for potential blood donors or submitting an emergency blood request.

**Donor:** A registered user who provides donor information and manages their availability.


A single account may act as both a requester and a donor.

---

# 2. Overall Description

## 2.1 Product Perspective

LIFE LINK is a web-based platform that connects people searching for blood donors with registered potential donors.

The platform provides donor discovery, availability information, emergency request management and direct communication.

It acts as a connection platform rather than a medical service or blood bank.

## 2.2 User Classes

| User | Responsibilities |
|---|---|
| Requester | Search for donors, contact donors, submit emergency requests and communicate with notified donors |
| Donor | Create and manage donor profile, update availability, respond to requests and communicate with requesters |

## 2.3 Operating Environment

The system is intended to operate as a web-based application accessible through commonly used web browsers.

The interface should be understandable and usable on commonly used desktop and mobile screen sizes.

## 2.4 Assumptions and Dependencies

- Users have access to an internet connection.
- Users provide accurate registration and donor information.
- Donors are responsible for maintaining their availability information.
- Location information is entered manually by users.
- The platform uses approximate city and area information rather than exact residential addresses.
- Users must be signed in to access protected platform functionality.
- The platform does not independently guarantee medical compatibility or donor eligibility.
- In-app notifications and chat depend on the platform being available.
- Registration-only SMS OTP may depend on an external SMS service or provider, subject to TA/client approval.
- SMS OTP verification confirms access to the provided phone number but does not establish a user's real-world identity.
- Registration SMS OTP shall not be used for emergency request notifications.

---

# 3. Functional Requirements

## 3.1 User Registration and Authentication

### FR-01: User Registration

The system shall allow users to create an account by providing the required registration information.

The system shall validate required registration fields before creating an account.

### FR-02: User Sign-In

The system shall allow registered users to sign in to their accounts.

Users must be authenticated before accessing protected functionality, including donor search contact details, emergency requests and in-app chat.

## 3.2 Donor Profile Management

### FR-03: Create and Manage Donor Profile

The system shall allow a registered user to create and manage a donor profile.

The donor profile shall contain:

| Field | Requirement |
|---|---|
| Full name | Required |
| Blood group | Required |
| City | Required |
| Area | Required |
| Contact number | Required |
| Availability status | Required |
| Last availability update | Generated by the system |

The system shall allow donors to update their profile information.

### FR-04: Manage Availability

The system shall allow donors to manually change their availability status between:

- Available
- Unavailable

Whenever a donor changes their availability status, the system shall record the date and time of that update.

Unavailable donors may still appear in normal donor search results but shall be clearly labelled as Unavailable.

Unavailable donors shall not receive emergency request notifications.

## 3.3 Donor Search

### FR-05: Search for Donors

The system shall allow signed-in requesters to search for potential donors using:

- Blood group.
- City.
- Area.
- Search radius.

The user shall manually select their city and area instead of relying on GPS-based location detection.

The available search radius options shall be:

- 5 km
- 10 km
- 25 km
- 50 km

The system shall display donors whose calculated approximate distance from the selected search location is less than or equal to the selected radius.

Donors outside the selected radius shall not appear in the results.

The system shall display matching donors with their available profile information and availability status.

### FR-06: Search Result Ordering and Freshness

The system shall arrange search results according to the following rules:

1. Donors shall be displayed in ascending order of approximate distance.
2. If two or more donors have the same distance, the donor with the most recently updated availability shall appear first.
3. If both distance and availability update time are identical, either ordering is acceptable.

The system shall display a freshness indicator based on the last availability update.

- Availability updated within the last 7 days: display the normal availability status.
- Availability not updated for more than 7 days: display **May be outdated**.

A donor marked May be outdated shall remain visible in search results.

The freshness indicator does not automatically change the donor's availability status.

### FR-07: Contact a Donor

The system shall allow a signed-in requester to select the Contact option for a donor displayed in normal search results.

The donor's contact number shall only be visible to a signed-in requester after selecting Contact.

The system shall not publicly expose donor contact numbers to unauthenticated users.

---

# 4. Emergency Blood Request Management

The following requirements are approved for the current implementation.

### FR-08: Submit an Emergency Blood Request

The system shall allow a signed-in requester to submit an emergency blood request.

The request shall contain the following information:

| Field | Requirement |
|---|---|
| Blood group | Required |
| City | Required |
| Area | Required |
| Search radius | Required |
| Required date | Required |
| Additional message | Optional |

The requester must provide all required fields before submitting the request.

The system shall reject a required date that is in the past.

After successful submission, the request shall receive the status **Open**.

### FR-09: Notify Matching Donors

The system shall notify donors through in-app notifications when an emergency request matches their profile.

A donor shall receive a notification only if all the following conditions are satisfied:

- The donor's blood group matches the requested blood group.
- The donor's availability status is Available.
- The donor's approximate location falls within the requester's selected radius.

The radius boundary shall be inclusive.

Donors marked Unavailable and donors outside the selected radius shall not receive the emergency request notification.

The system shall not send SMS, WhatsApp or email notifications for emergency blood requests in the current implementation.

### FR-10: Donor Response to Emergency Requests

The system shall allow notified donors to respond to an Open emergency request.

The available response states shall be:

| Response | Meaning |
|---|---|
| Pending | The donor has not responded yet |
| Accepted | The donor is willing to be contacted about the request |
| Declined | The donor is not willing or able to respond to the request |

The system shall display the response status to the requester.

Donors may change their response while the request remains Open.

The latest response shall be displayed.

Multiple donors may accept the same request.

An Accepted response shall not automatically close the request.

An Accepted response does not guarantee an actual donation.

### FR-11: View Emergency Request Responses

The system shall allow the requester who created an emergency request to view its notified donors and their response statuses.

The requester shall be able to distinguish between Pending, Accepted and Declined responses.

The requester shall also be able to access the relevant donor conversations through the request.

Previously submitted donor responses shall remain visible to the requester after the request is cancelled or expired.

### FR-12: Cancel an Emergency Request

The system shall allow only the requester who created an emergency request to cancel it while its status is Open.

After cancellation:

- The request status shall change to Cancelled.
- All donors previously notified about the request shall receive an in-app cancellation notification.
- Donors shall no longer be able to submit or change their responses.
- Previously submitted responses shall remain visible to the requester.
- Existing chat messages shall remain viewable.
- No new chat messages shall be allowed for that request.

The system shall not allow other users to cancel a request on behalf of its requester.

### FR-18: Automatic Emergency Request Expiration

The system shall automatically change an emergency request's status from Open to Expired at **11:59 PM Pakistan Standard Time (PKT) on its required date**.

The required date shall be interpreted using Pakistan Standard Time (PKT, UTC+05:00).

After expiration:

- The request status shall change to Expired.
- Donors shall no longer be able to submit or change their responses.
- Previously submitted donor responses shall remain visible to the requester.
- Existing chat messages shall remain viewable.
- No new chat messages shall be allowed for that request.

The expiration boundary shall be 11:59 PM PKT on the required date. The request shall not remain Open beyond that boundary.

---

# 5. In-App Chat

### FR-13: Requester and Donor Communication

The system shall provide an in-app chat feature for communication between a requester and donors notified about a particular emergency request.

The requester shall be able to initiate a conversation with any donor who received the notification.

The requester does not need to wait for the donor to accept or decline the request before initiating a conversation.

The donor may voluntarily respond through the chat.

The following rules shall apply:

- Each donor shall have a separate conversation with the requester for that emergency request.
- The requester may communicate with multiple notified donors.
- A donor may communicate even if their response status is Pending or Declined.
- Chatting shall not automatically change a donor's response status.
- Chatting shall not imply acceptance or guarantee donation.
- Communication is optional for both parties.
- The system shall preserve existing messages after request cancellation or expiration.
- Existing messages shall remain viewable in read-only mode after cancellation or expiration.
- No new messages shall be allowed once the request becomes Cancelled or Expired.

The chat feature shall remain separate from the Accept and Decline response mechanism.

---

# 6. User Reporting and Automated Safeguards

### FR-14: Report Suspicious Profiles or Content

The system shall allow users to report suspicious donor profiles or inappropriate content.

Reports are handled through the automated reporting safeguard defined in Section 16; no administrator review is provided.

The platform shall not require CNIC submission as a default registration requirement for the current prototype.

### FR-15: Automated Reporting Safeguard (Amended 23 November 2026)

The system shall record user reports and apply the automated precautionary safeguard defined in Section 16 when the selected threshold of three independent reports is reached.

The selected consequence is a seven-day restriction on creating new emergency requests only. Other account functions remain available. Reporter identity and restriction details shall remain private.

A report count is not proof of misconduct. The safeguard is not a verified finding. The definition of independent reporters, duplicate prevention and anti-coordination safeguards must be specified before implementation.

No administrator role, dashboard or human review is included in this version.

Automatic donor identity verification is outside the current implementation scope unless the proposed FR-16 is approved by the TA/client.

### FR-16: CNIC-Based Identity Verification (Proposed — Pending TA/Client Approval)

**Description:**

The system may support CNIC-based identity verification to improve the authenticity and trustworthiness of user accounts.

**Proposed requirements:**

1. Users may be required to provide CNIC information for identity verification.
2. Phone OTP verification confirms access to a phone number but does not establish a user's real-world identity.
3. The system should support an identity verification process through an authorized verification method.
4. The verification process should maintain statuses such as Pending, Verified and Rejected.
5. CNIC information must not be visible to other ordinary users.
6. Access to CNIC information must be restricted to authorized personnel.
7. The system must protect sensitive identity information from unauthorized access.

**Open decisions requiring approval:**

- Whether CNIC verification is mandatory for all users or only certain account types.
- Whether users submit a CNIC number or an image of their CNIC.
- Whether verification is performed manually by an administrator or through an authorized verification service.
- How CNIC information is stored, protected and retained.

**Approval status:** Proposed. Not included in the confirmed implementation scope until approved by the TA/client.

### FR-17: Phone Number Verification Through SMS OTP (Proposed — Pending TA/Client Validation)

**Description:**

The system may verify a user's phone number through a One-Time Password (OTP) sent by SMS during account registration.

**Proposed requirements:**

1. The system shall send an OTP to the phone number provided during registration.
2. The user shall enter the received OTP to complete phone number verification.
3. The system shall validate the entered OTP before marking the phone number as verified.
4. The system shall not consider a phone number verified until the correct OTP has been entered.
5. OTP verification shall apply during registration only.
6. OTP verification shall not be required every time the user signs in.
7. SMS OTP shall not be used to send emergency request notifications.
8. The system shall provide an appropriate error message when an invalid OTP is entered.

**Open decisions requiring TA/client validation:**

- Whether SMS OTP verification is mandatory for every new registration.
- Which SMS provider or service, if any, will be used.
- OTP expiration duration.
- OTP resend limits and retry limits.
- Whether users can change their phone number after registration and how that change will be verified.

**Approval status:** Proposed — pending TA/client validation. This requirement shall not be treated as confirmed implementation scope until approved.

---

# 7. Business Rules

| ID | Business Rule |
|---|---|
| BR-01 | An Accepted emergency request response indicates willingness to be contacted, not a confirmed donation. |
| BR-02 | Donor matching shall use the same blood group. The system shall not claim to determine medical compatibility. |
| BR-03 | LIFE LINK does not guarantee that a donor will respond or complete a donation. |
| BR-04 | AI-generated suggestions or prototype ideas shall not become requirements unless approved by the client/team. |
| BR-05 | Unavailable donors may appear in normal search results but shall not receive emergency request notifications. |
| BR-06 | Only approximate city and area information shall be used for location-based searching. Exact residential addresses shall not be publicly displayed. |
| BR-07 | Donors are responsible for managing their own profiles and availability. |
| BR-08 | Users must sign in before accessing protected functionality. |
| BR-09 | Only Available donors with matching blood groups and locations within the selected radius shall receive emergency request notifications. |
| BR-10 | Only the requester who created an Open emergency request may cancel it. |
| BR-11 | Emergency requests shall remain Open until cancelled or automatically expired at 11:59 PM Pakistan Standard Time (PKT) on their required date. |
| BR-12 | The system shall automatically change an emergency request's status to Expired at the 11:59 PM PKT expiry boundary on its required date. |
| BR-13 | Donors may change their responses only while the associated request remains Open. |
| BR-14 | Multiple donors may accept the same emergency request without automatically closing it. |
| BR-15 | Requesters may initiate chat with all donors notified about their emergency request, regardless of their response status. |
| BR-16 | Chat messages shall be read-only after the associated request is cancelled or expired. |
| BR-17 | Donor availability shall be labelled May be outdated if it has not been updated for more than 7 days. |
| BR-18 | The donor search radius boundary shall be inclusive. A donor at exactly the selected radius shall be included. |
| BR-19 | Donor search results shall be sorted by distance, followed by the most recent availability update. |
| BR-20 | A single user account may function as both a requester and a donor. |
| BR-21 | Donor contact numbers shall only be visible to signed-in requesters after selecting Contact. |
| BR-22 | In-app chat shall not automatically indicate donor acceptance or guarantee a donation. |
| BR-23 | Emergency request expiration shall occur at 11:59 PM PKT on the request's required date. |
| BR-24 | Previously submitted donor responses shall remain visible to the requester after cancellation or expiration. |
| BR-25 | Registration SMS OTP, if approved, shall be used only for phone number verification during registration and not for emergency notifications. This rule remains subject to TA/client approval. |

---

# 8. Non-Functional Requirements

### NFR-01: Performance

The system should return donor search results within 3 seconds under normal operating conditions.

### NFR-02: Usability

At least 4 out of 5 test users should be able to complete a donor search without assistance.

The interface should use understandable labels, clear navigation and simple interaction flows.

### NFR-03: Privacy and Access Control

The system shall protect users' personal information.

- Exact residential addresses shall not be displayed publicly.
- Donor contact numbers shall only be visible to signed-in requesters after selecting Contact.
- Users shall be able to manage only their own donor profiles and availability.
- Only authorized participants shall access their relevant emergency request conversations.
- Administrators shall access information required for reviewing reported profiles and content.
- If CNIC verification is approved, CNIC information shall be restricted to authorized personnel and protected against unauthorized access.

### NFR-04: Availability Freshness

The system shall clearly indicate when donor availability information may be outdated.

The threshold shall be more than 7 days since the last availability update.

### NFR-05: Maintainability

The system should be organized into understandable and manageable components to support future modifications.

### NFR-06: Reliability

The system should preserve submitted donor information, emergency requests, donor responses and chat messages during normal operation.

### NFR-07: Compatibility

The system should be accessible through commonly used modern web browsers and support commonly used desktop and mobile screen sizes.

---

# 9. Constraints

- The project must be completed within the available academic development period.
- The implementation must remain understandable and manageable for the student development team.
- The current implementation shall focus on donor discovery, emergency requests and direct communication.
- The system shall use approximate location information rather than exact residential addresses.
- The system shall not claim to provide medical compatibility verification.
- No specific programming language, database, framework or deployment platform is mandated by the current requirements.
- Registration-only SMS OTP is not a confirmed implementation constraint until approved by the TA/client.
- CNIC-based identity verification is not a confirmed implementation constraint until approved by the TA/client.

---

# 10. Features Deferred to Future Scope

The following features are not included in the current confirmed implementation:

1. SMS notifications for emergency blood requests.
2. WhatsApp notifications.
3. Email notifications.
4. Online blood donation confirmation.
5. Donation history and tracking.
6. Automatic donor identity verification, except if the proposed FR-16 is separately approved by the TA/client. Until that approval, CNIC-based identity verification is not part of the confirmed implementation scope.
7. Hospital integration.
8. Payment or reward systems.

**Clarification:** Registration-only SMS OTP is a separate proposed feature under FR-17. It must not be confused with SMS notifications for emergency requests.

These features may be considered in future versions but shall not be treated as committed requirements for the current implementation unless separately approved.

---

# 11. Acceptance Criteria

The following criteria shall be used to evaluate whether the system satisfies its functional requirements.

| ID | Acceptance Criteria |
|---|---|
| AC-01 | A user can successfully register by providing all required registration information. |
| AC-02 | A registered user can sign in to the system. |
| AC-03 | A user can create a donor profile containing all required fields. |
| AC-04 | A donor can update their profile information. |
| AC-05 | A donor can change availability between Available and Unavailable. |
| AC-06 | The system records the availability update date and time. |
| AC-07 | A requester can search using blood group, city, area and a selected radius. |
| AC-08 | The system provides the radius options 5 km, 10 km, 25 km and 50 km. |
| AC-09 | A donor exactly at the selected radius is included, while a donor beyond it is excluded. |
| AC-10 | Search results are ordered by ascending distance. |
| AC-11 | Donors at equal distances are ordered by most recent availability update. |
| AC-12 | Availability older than 7 days is labelled May be outdated without removing the donor from results. |
| AC-13 | Unavailable donors remain visible in normal search results with a clear Unavailable label. |
| AC-14 | A signed-in requester can select Contact to view the donor's contact number. |
| AC-15 | An emergency request cannot be submitted without all required fields. |
| AC-16 | An emergency request with a past required date is rejected. |
| AC-17 | A successfully submitted emergency request receives Open status. |
| AC-18 | Only matching Available donors within the selected radius receive emergency notifications. |
| AC-19 | Unavailable donors and donors outside the selected radius do not receive emergency notifications. |
| AC-20 | A notified donor can respond with Accepted or Declined. |
| AC-21 | A donor who has not responded is displayed as Pending. |
| AC-22 | A donor can change their response while the request remains Open. |
| AC-23 | Multiple donors can accept the same request without automatically closing it. |
| AC-24 | The requester can view all notified donors and their latest response statuses. |
| AC-25 | Only the requester who created an Open request can cancel it. |
| AC-26 | Cancelling a request changes its status to Cancelled and notifies all previously notified donors. |
| AC-27 | Donors cannot submit or change responses after cancellation. |
| AC-28 | The system automatically changes a request to Expired at 11:59 PM PKT on its required date. |
| AC-29 | The requester can initiate a separate chat with every donor notified about their emergency request, including before a donor responds. |
| AC-30 | A donor can voluntarily reply to a requester through in-app chat. |
| AC-31 | Chatting does not automatically change the donor's response status. |
| AC-32 | Existing chat messages remain viewable after cancellation or expiration, but new messages cannot be sent. |
| AC-33 | A user can report a suspicious donor profile or inappropriate content. |
| AC-34 | Three independent reports trigger the selected seven-day precautionary restriction on creating new emergency requests only, subject to defined independence and duplicate-report safeguards. |
| AC-35 | The temporary reporting restriction does not disable unrelated account functions or change donor availability. |
| AC-36 | At least 4 out of 5 test users can complete a donor search without assistance. |
| AC-37 | Donor search results are returned within 3 seconds under normal operating conditions. |
| AC-38 | An emergency request automatically changes to Expired at 11:59 PM PKT on its required date. |
| AC-39 | Previously submitted donor responses remain visible to the requester after an emergency request expires. |
| AC-40 | Existing chat messages remain viewable in read-only mode after expiration. |

**Proposed acceptance criteria — pending TA/client validation of FR-17:**

| ID | Acceptance Criteria |
|---|---|
| AC-41 | If registration SMS OTP is approved, a user must enter the correct OTP before their phone number is marked as verified. |
| AC-42 | Registration OTP verification is not required during every subsequent sign-in. |
| AC-43 | Registration OTP is not used for emergency request notifications. |

AC-41 to AC-43 shall only become confirmed acceptance criteria if FR-17 is approved.

---

# 12. User Flows

## 12.1 Normal Donor Search Flow

1. The requester signs in.
2. The requester opens the donor search page.
3. The requester selects a blood group.
4. The requester manually selects a city and area.
5. The requester selects a search radius.
6. The requester submits the search.
7. The system finds donors matching the blood group and location criteria.
8. The system displays donors within the selected radius.
9. The system sorts donors by distance and then availability update time.
10. The system displays availability and freshness indicators.
11. The requester selects Contact for a donor.
12. The system displays the donor's contact number.

## 12.2 Emergency Request Flow

1. The requester signs in.
2. The requester opens the emergency request section.
3. The requester enters the required blood group, city, area, search radius and required date.
4. The requester may enter an additional message.
5. The requester submits the request.
6. The system validates the required information.
7. The system creates the request with Open status.
8. The system identifies matching Available donors within the selected radius.
9. The system sends in-app notifications to matching donors.
10. Notified donors initially have Pending response status.
11. Donors may Accept or Decline.
12. The requester views the latest response statuses.
13. The requester may initiate a separate chat with any notified donor, even before that donor responds.
14. The request remains Open until cancelled or automatically expires at 11:59 PM PKT on its required date.

## 12.3 Donor Response Flow

1. A matching Available donor receives an in-app emergency request notification.
2. The donor opens the notification.
3. The donor views the emergency request information.
4. The donor chooses Accept or Decline.
5. The system records the response.
6. The requester can view the updated response.
7. The donor may change their response while the request remains Open.
8. After cancellation or expiration, the donor can no longer submit or change their response.
9. Previously submitted responses remain visible to the requester.

## 12.4 In-App Chat Flow

1. The requester opens an emergency request.
2. The requester views its notified donors.
3. The requester selects any notified donor.
4. The system opens a separate conversation for that donor and request.
5. The requester may send a message regardless of whether the donor has responded.
6. The donor may voluntarily reply.
7. The system preserves the conversation while the request remains active.
8. If the request becomes Cancelled or Expired, the conversation remains viewable but becomes read-only.

## 12.5 Emergency Request Cancellation Flow

1. The requester opens their own emergency request.
2. The requester selects Cancel.
3. The system changes the request status to Cancelled.
4. The system sends an in-app cancellation notification to all previously notified donors.
5. Donors can no longer submit or change responses.
6. Previous responses remain visible to the requester.
7. Existing conversations remain accessible in read-only mode.

## 12.6 Emergency Request Expiration Flow

1. An emergency request remains Open until its required date's expiry boundary.
2. At 11:59 PM PKT on the required date, the system changes the request status to Expired.
3. Donors can no longer submit or change responses.
4. Previously submitted donor responses remain visible to the requester.
5. Existing conversations remain accessible in read-only mode.
6. No new chat messages can be sent for that request.

## 12.7 User Reporting and Automated Safeguard Flow (Amended 23 November 2026)

1. A registered user identifies false donor information, harassment, inappropriate content or suspicious activity.
2. The user submits a report, including from a chat.
3. The system records the report without exposing the reporter's identity to the reported user.
4. The automated reporting safeguard evaluates the report threshold and applicable duplicate/independence rules.
5. The session-selected threshold is three independent reports. The proposed consequence is a seven-day restriction on creating new emergency requests only.
6. Other account functions remain available during this restriction. The restriction record is private and stores the reason, start date and expiry date.
7. No administrator dashboard or human administrator review is included in this version.
8. A report count is not proof that misconduct occurred. The threshold is a precautionary automated trigger, not a verified finding.

**Important unresolved implementation detail:** the precise definition of independent reporters, duplicate-report prevention, rate limits and safeguards against coordinated false reporting still require specification. The current-session discussion selected no formal appeal mechanism.

## 12.8 Registration OTP Flow (Proposed — Pending TA/Client Validation)

1. A user enters the required registration information, including a phone number.
2. The system sends an OTP to the provided phone number.
3. The user enters the received OTP.
4. The system validates the OTP.
5. If the OTP is correct, the phone number is marked as verified.
6. If the OTP is incorrect, the system displays an appropriate error message.
7. Successful phone number verification allows registration to proceed according to the approved registration process.

This flow is proposed and shall only be implemented if FR-17 is approved.

---

# 13. Edge Cases and Failure Scenarios

## 13.1 Donor Search

| Scenario | Expected System Behaviour |
|---|---|
| No matching donors exist | Display: "No matching donors found within your selected radius. Try expanding your search radius or selecting another location." |
| A required search field is missing | Block the search and identify the missing field. |
| A donor is exactly at the selected radius | Include the donor. |
| A donor is slightly beyond the selected radius | Exclude the donor. |
| Two donors have equal distances | Display the donor with the more recent availability update first. |
| Distance and update time are identical | Either ordering is acceptable. |
| A donor has not updated availability for more than 7 days | Display May be outdated and keep the donor visible. |
| A donor is Unavailable | Display the donor with an Unavailable label. |
| A user is not signed in | Require sign-in before accessing protected donor search functionality and contact details. |

## 13.2 Emergency Requests

| Scenario | Expected System Behaviour |
|---|---|
| A required field is missing | Prevent request submission and identify the missing field. |
| Required date is in the past | Reject the request and ask the requester to select a valid date. |
| No donors match the request | Create the request as Open and notify no donors. The requester can still view the request. |
| A donor has the wrong blood group | Do not notify that donor. |
| A donor is Unavailable | Do not notify that donor. |
| A donor is outside the selected radius | Do not notify that donor. |
| A donor is exactly at the radius boundary | Notify that donor if all other matching conditions are satisfied. |
| A donor has not responded | Display Pending. |
| Several donors accept | Display all their Accepted responses; do not automatically close the request. |
| A donor changes their response | Display the latest response while the request remains Open. |
| A requester attempts to cancel another user's request | Prevent the cancellation. |
| A requester cancels their request | Notify all previously notified donors and prevent further responses. |
| The required date reaches 11:59 PM PKT | Automatically change the request status to Expired at the specified expiry boundary. |
| A request expires after donors have responded | Previously submitted donor responses remain visible to the requester. |
| A request expires while conversations exist | Existing messages remain viewable, but no new messages can be sent. |

## 13.3 In-App Chat

| Scenario | Expected System Behaviour |
|---|---|
| Requester messages a donor before a response | Allow the conversation. |
| Donor has Pending status | Allow the donor and requester to communicate. |
| Donor has Declined status | Allow the conversation to continue while the request remains Open. |
| Multiple donors are notified | Maintain separate conversations for each donor. |
| Donor does not reply | Keep the conversation available without forcing a response. |
| Request is Cancelled | Preserve messages but prevent new messages. |
| Request is Expired | Preserve messages but prevent new messages. |
| Requester chats with a donor | Do not automatically change the donor's response status. |
| A request expires after one or more donors have responded | Previous donor responses remain visible to the requester. |

## 13.4 Accounts and Reporting (Amended 23 November 2026)

| Scenario | Expected System Behaviour |
|---|---|
| One user wants to search and donate | Allow the same account to act as both requester and donor. |
| A user reports a suspicious profile or chat content | Record the report and keep the reporter's identity private from the reported user. |
| Three independent reports reach the selected threshold | Apply the selected seven-day precautionary restriction on creating new emergency requests, subject to the independent-report and duplicate safeguards that must be specified. |
| A user is under the temporary request-creation restriction | Allow other account functions; prevent only creation of new emergency requests until expiry. |
| A donor's information may be incorrect | Treat profile information as user-declared; do not claim automatic or medical verification. |
| An administrator function is requested | No administrator role, dashboard or human review exists in this version. |

## 13.5 Registration OTP (Proposed — Pending TA/Client Validation)

| Scenario | Expected System Behaviour |
|---|---|
| User enters a correct OTP | Mark the phone number as verified. |
| User enters an incorrect OTP | Display an appropriate error message and do not mark the number as verified. |
| User has not entered an OTP | Do not mark the phone number as verified. |
| User attempts OTP verification during sign-in | OTP verification shall not be required for every subsequent sign-in. |
| User requests emergency blood notifications through SMS OTP | Registration OTP shall not be treated as an emergency notification service. |

---

# 14. Proposed Test Conditions

## 14.1 Purpose

The following values are proposed test conditions for evaluating system performance and behaviour.

They are testing assumptions, not additional functional requirements or confirmed production-capacity guarantees.

## 14.2 Proposed Test Conditions

| ID | Proposed Test Condition | Purpose |
|---|---|---|
| PTC-01 | 5,000 donor records in the test dataset | Evaluate donor search and filtering with a larger dataset. |
| PTC-02 | 20 simultaneous donor searches | Evaluate search performance when multiple users search at the same time. |

## 14.3 Evaluation

The proposed test conditions shall be used to evaluate whether the system continues to satisfy the existing performance requirement, NFR-01, which states that donor search results should be returned within 3 seconds under normal operating conditions.

The results of these tests shall be recorded during testing.

The test team should record:

- Number of donor records used.
- Number of simultaneous searches.
- Search response times.
- Whether the 3-second performance target was achieved.
- Any observed errors or performance problems.

**Important:** The values of 5,000 records and 20 simultaneous searches are proposed testing assumptions. They do not establish guaranteed production capacity or a new performance commitment.

---

# 15. Traceability and Consistency

The functional requirements, business rules, non-functional requirements, acceptance criteria, user flows, proposed test conditions and edge cases in this document describe the same product behaviour.

The following important decisions must remain consistent throughout future project documentation and implementation:

- Manual city and area selection is used instead of GPS-based location entry.
- Search radius options are 5 km, 10 km, 25 km and 50 km.
- The selected radius boundary is inclusive.
- Donor results are ordered by distance and availability update time.
- Availability becomes May be outdated after more than 7 days.
- Emergency requests are approved for the current implementation.
- Only matching Available donors within the selected radius are notified.
- Donor responses are Pending, Accepted and Declined.
- Only the requester may cancel their Open request.
- Requests automatically expire at 11:59 PM PKT on their required date.
- Previously submitted donor responses remain visible after cancellation and expiration.
- Requesters may chat with all notified donors, even before they respond.
- Chatting is independent of the donor's Accept/Decline response.
- Existing chat messages remain available in read-only mode after cancellation or expiration.
- User reporting is included with the automated safeguard; administrator review is excluded.
- FR-16 proposes CNIC-based identity verification, but it remains pending TA/client approval.
- FR-17 proposes registration-only SMS OTP, but it remains pending TA/client validation.
- Registration SMS OTP is separate from SMS emergency notifications.
- The 5,000-record dataset and 20-simultaneous-search conditions are proposed test conditions, not confirmed production-capacity requirements.
- Future-scope features must not be treated as committed implementation requirements.

---

**End of LIFE LINK — Product Requirements Document, Version 2.3 (current-session amendments dated 23 November 2026)**

---

# 16. Current-Session Decision Amendments (23 November 2026)

This section records decisions made during the D4 grilling session. It is part of the current PRD baseline and overrides conflicting earlier wording where stated.

## 16.1 Account and security decisions

- Registration and sign-in use email and password.
- Passwords must be securely hashed; plaintext storage is prohibited.
- No SMS OTP or CNIC verification is included in this version. FR-16 and FR-17 remain outside implementation scope unless separately approved by the TA/client.
- One account may act as both donor and requester.
- Users may edit their own profiles and registered blood group.
- Donors manually control availability; a new donor defaults to Unavailable.
- Users may request account deletion. The deletion/retention procedure remains to be specified.
- Blood group is user-declared and unverified; the system must not imply medical verification.

## 16.2 Donor search and emergency request visibility

- Donor search filters are blood group and location. Both Available and Unavailable donors appear in results, with availability clearly labelled.
- Donor availability does not automatically change after a donor responds.
- Emergency requests are visible only to registered users whose declared blood group matches the requested blood group; the request owner must retain access to their own request.
- The existing approximate-location and radius rules remain applicable where they do not conflict with this amendment.
- Exact residential location must not be exposed.

## 16.3 Emergency request rules

- Request information includes blood group, hospital/location, required units, contact details and urgency.
- A user may have at most three active emergency requests.
- Multiple donors may respond to one request, and the requester may accept multiple donor responses.
- Requester contact details are revealed to a donor only after the requester accepts that donor's response. Contact details must not be exposed in general request listings before acceptance.
- Users may cancel their own requests; requesters manually close their requests.
- The session-selected request status set is Open and Closed. The distinction between closure outcomes (fulfilled, cancelled, expired) needs a consistent representation before implementation.
- The original automatic expiry requirement (11:59 PM PKT on the required date) remains unless the group formally changes it. The implementation must reconcile expiry with the selected Open/Closed status model; a recommended representation is `status = Closed` plus a `closure_reason` value such as Fulfilled, Cancelled or Expired. This representation is a recommendation, not a separately approved decision.

## 16.4 Chat

- Chat is a general platform capability, not limited to emergency-request-specific conversations.
- Only registered users may send/receive invitations; donors and requesters may both initiate.
- There is no fixed invitation limit, but only one pending invitation may exist between a pair of users.
- Invitations do not expire automatically.
- Recipient actions are Accept, Reject or Restrict.
- Accept opens the chat. After Reject, the sender must wait 24 hours before sending another invitation.
- Restrict contact prevents new messages and invitations between the pair but does not suspend either account. The recipient who applied the restriction may remove it.
- Existing messages remain visible to both participants after contact restriction. After it is removed, either user may send a new invitation and the recipient must accept before messaging resumes.
- Contact restriction does not hide the recipient's profile.
- Individual messages cannot be deleted. Only the two participants can view the chat history.
- Chat is text-only. No image, document or voice messages.
- Users may report another user from chat.
- No chat-event notifications are sent.
- The exact grouping of conversations (one conversation per user pair versus separate conversations per emergency request) remains open. The original request-linked chat behaviour must not be silently discarded until this is decided.

## 16.5 Notifications

In-app notifications are limited to:
1. Relevant emergency requests.
2. Responses to a user's own emergency requests.
3. Emergency request status changes.

Notifications are in-app only. There is no notification-history page. No notification is sent for chat invitations, invitation decisions or new chat messages. The precise transient-alert presentation and persistence model require implementation design.

## 16.6 Reporting and automated safeguard

- Reporting categories: false donor information, harassment, inappropriate content and suspicious activity.
- No administrator role, dashboard or human report review.
- The selected threshold is three independent reports.
- The selected temporary restriction duration is seven days.
- The restricted capability is creating new emergency requests only; other account functions remain available.
- The restriction record is private and stores reason, start date and expiry date.
- Reporter identity remains private.
- No formal appeal mechanism was selected.
- A report count is not proof of a violation. Treat the threshold as a precautionary automated safeguard, not a verified finding.
- The exact definition of independent reporters, duplicate reporting, rate limits and anti-coordination safeguards remain open.
- The session contained an earlier alternative recommendation to record reports without automatically restricting users. The later accepted seven-day restriction direction supersedes that alternative, but the conflict should remain documented until the group confirms the final policy.

## 16.7 Architecture and platform decisions

- Modular monolith, one shared database and REST API.
- Each module owns its own records within the shared database.
- Authorization is cross-cutting; UI is a presentation layer.
- Local deployment is the demonstration target.
- English only.
- No external SMS or email service integrations.
- No administrator module.
- Proposed eight logical modules: Authentication, Donor Management, Donor Search, Location Matching, Emergency Requests, Request Lifecycle, Notifications and Chat. Detailed interfaces and record ownership mapping remain subject to ADR review.

## 16.8 Items requiring explicit follow-up

1. Define independent-report and duplicate-report safeguards.
2. Define whether a temporary restriction notice is shown and what it contains.
3. Reconcile Open/Closed status with fulfilled/cancelled/expired closure outcomes.
4. Define donor response transitions (including whether a requester can decline a response and whether donors can withdraw).
5. Define when a request closes when multiple donors have been accepted.
6. Decide whether chats are grouped per user pair or per emergency request.
7. Define account-deletion and data-retention behaviour.
8. Specify whether transient in-app alerts are stored only as delivery events or not persisted at all.

