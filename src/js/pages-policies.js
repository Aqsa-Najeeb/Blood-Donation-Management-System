(function () {
  const { useApp } = window.LifeLink;
  const WRAP = "max-w-[1440px] mx-auto px-5 md:px-12";

  const POLICY_NAV = [
    { path: "/user-agreement", label: "User Agreement" },
    { path: "/privacy-policy", label: "Privacy Policy" },
    { path: "/terms-of-use", label: "Terms of Use" },
    { path: "/community-guidelines", label: "Community Guidelines" },
    { path: "/emergency-request-policy", label: "Emergency Request Policy" },
    { path: "/donor-safety-policy", label: "Donor Safety Policy" },
    { path: "/moderation-policy", label: "Reporting & Moderation" },
    { path: "/disclaimer", label: "Disclaimer" },
  ];

  function PolicyLayout({ title, subtitle, updated = "November 2026", children }) {
    const { route, navigate, agreementVersion } = useApp();

    return (
      <div className={`${WRAP} py-10 md:py-14`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3">
            <div className="bg-cardlow rounded-3xl p-5 border border-cardtop/60 lg:sticky lg:top-24 flex flex-col gap-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary px-2 pb-1">
                LIFE LINK Policies (v{agreementVersion || "1.0"})
              </div>
              <div className="flex flex-wrap lg:flex-col gap-1.5">
                {POLICY_NAV.map((item) => {
                  const active = route === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`text-left px-3.5 py-2 rounded-2xl text-[13px] font-medium transition cursor-pointer ${
                        active
                          ? "bg-cardhigh text-primary font-semibold"
                          : "text-muted hover:bg-card hover:text-text"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <article className="lg:col-span-9 bg-cardlow rounded-[32px] p-6 md:p-10 border border-cardtop/60 shadow-xl flex flex-col gap-6">
            <header className="border-b border-cardtop/50 pb-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Last Updated: {updated}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-text mt-1">{title}</h1>
              {subtitle && <p className="text-[14px] text-muted mt-2">{subtitle}</p>}
            </header>

            <div className="flex flex-col gap-5 text-[14px] leading-relaxed text-muted">
              {children}
            </div>

            <footer className="pt-4 border-t border-cardtop/40 flex flex-wrap items-center justify-between gap-3 text-[12px] text-line">
              <span>LIFE LINK Community Blood Coordination Platform</span>
              <div className="flex gap-4">
                <button onClick={() => navigate("/signup")} className="text-primary hover:underline cursor-pointer">
                  Create Account
                </button>
                <button onClick={() => navigate("/")} className="hover:text-text cursor-pointer">
                  Back to Home
                </button>
              </div>
            </footer>
          </article>
        </div>
      </div>
    );
  }

  function Section({ heading, children }) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] font-bold text-text">{heading}</h2>
        <div className="flex flex-col gap-2">{children}</div>
      </section>
    );
  }

  function UserAgreementPage() {
    const { agreementVersion, minAge } = useApp();
    return (
      <PolicyLayout
        title={`LIFE LINK User Agreement (Version ${agreementVersion || "1.0"})`}
        subtitle="You must read and accept this agreement before creating a LIFE LINK account."
      >
        <Section heading="1. Eligibility & Truthful Information">
          <p>
            You confirm that you meet the minimum age requirement ({minAge}+ years) and will provide truthful,
            accurate personal information including your name, phone number, city/area, and declared blood group.
          </p>
        </Section>
        <Section heading="2. Responsible Platform Use">
          <p>
            You agree to use LIFE LINK strictly for lawful, voluntary blood donation coordination. You must not
            create fake emergency blood requests, impersonate donors or recipients, or submit misleading availability data.
          </p>
        </Section>
        <Section heading="3. Respectful Conduct & Contact Privacy">
          <p>
            You must not harass, threaten, or abuse other users. Donor phone numbers and request contact details are
            shared solely for coordinating active blood needs; misusing, scraping, or redistributing another user’s
            contact information is strictly prohibited.
          </p>
        </Section>
        <Section heading="4. No Medical or Availability Guarantee">
          <p>
            LIFE LINK connects community users but does not guarantee blood availability, donor arrival, or medical
            eligibility. Blood groups are user-declared and unverified. Always verify emergency details directly with
            the hospital and qualified medical staff before taking action.
          </p>
        </Section>
        <Section heading="5. Reporting, Moderation & Updates">
          <p>
            Violations may be reported by other users. Under our automated moderation rules, three independent reports
            from distinct accounts older than 24 hours trigger a 7-day precautionary restriction on creating new
            emergency requests. Substantial updates to this agreement require a new version and re-acceptance.
          </p>
        </Section>
      </PolicyLayout>
    );
  }

  function PrivacyPolicyPage() {
    return (
      <PolicyLayout
        title="Privacy Policy"
        subtitle="How LIFE LINK collects, uses, displays, and protects your information."
      >
        <Section heading="1. Information We Collect">
          <p>
            During signup and profile updates, we collect your full name, username, phone number, declared blood group,
            city/area, date of birth (used to verify minimum age), password hash, and optional email address. We also
            store emergency requests you create, donor responses, in-app chat messages, and safety reports you submit.
          </p>
        </Section>
        <Section heading="2. How Information Is Used & Displayed">
          <p>
            Your account data is used to authenticate your session, match blood requests within your selected city/area
            radius, and coordinate voluntary donations. Donor search displays only your name, declared blood group,
            approximate city/area, distance, and availability freshness to signed-in users. Your date of birth and
            password hash are never shown to other users.
          </p>
        </Section>
        <Section heading="3. When Contact Details Are Visible">
          <p>
            Requester contact phone numbers are hidden until the requester explicitly approves a responding donor.
            Available donors’ contact phone numbers are only accessible to signed-in users through the rate-limited
            contact action; unavailable donors’ phone numbers are not disclosed.
          </p>
        </Section>
        <Section heading="4. Protection, Third Parties & Deletion">
          <p>
            Passwords are hashed with bcrypt, API routes require JWT authentication, and reporter identities are never
            returned by any API response. LIFE LINK does not sell or share your personal data with third parties. You
            can deactivate and anonymise your account at any time in Privacy &amp; Account Settings, which replaces your
            name, email, and phone with anonymised placeholders and blocks future logins.
          </p>
        </Section>
        <Section heading="5. Your Responsibilities & Privacy Contact">
          <p>
            Keep your password confidential and avoid sharing unnecessary sensitive details in chat or request notes.
            For privacy questions or data concerns, contact the platform administrator through your local LIFE LINK
            project deployment team.
          </p>
        </Section>
      </PolicyLayout>
    );
  }

  function TermsOfUsePage() {
    return (
      <PolicyLayout
        title="Terms of Use"
        subtitle="Rules governing access to and use of the LIFE LINK platform."
      >
        <Section heading="1. Purpose of LIFE LINK">
          <p>
            LIFE LINK is a community coordination tool designed to help patients and families locate nearby voluntary
            blood donors and manage blood requests.
          </p>
        </Section>
        <Section heading="2. User Responsibilities & Prohibited Behavior">
          <p>
            Users must provide accurate account details, keep donor availability up to date, and treat all members
            with respect. Prohibited behavior includes fake requests, false donor profiles, harassment, spam,
            automated scraping, and attempting to bypass platform rate limits or authorization checks.
          </p>
        </Section>
        <Section heading="3. Requests, Privacy & Moderation">
          <p>
            Active emergency requests are capped at 3 open requests per user and automatically expire after their
            required date. Users must respect donor privacy and only use shared contact details for the active request.
            Accounts that receive 3 independent safety reports are temporarily restricted from creating new emergency
            requests for 7 days.
          </p>
        </Section>
        <Section heading="4. Platform Limitations">
          <p>
            LIFE LINK is provided as-is for community coordination without guarantees of uptime, donor response, or
            medical outcomes. By creating an account, you accept these Terms of Use and all linked policies.
          </p>
        </Section>
      </PolicyLayout>
    );
  }

  function CommunityGuidelinesPage() {
    return (
      <PolicyLayout
        title="Community Guidelines"
        subtitle="Standards for safe, respectful, and trustworthy participation."
      >
        <Section heading="Respectful Communication">
          <p>
            Communicate courteously in chats and requests. Harassment, threats, hate speech, or abusive language of any
            kind is prohibited and may be reported or restricted by chat participants.
          </p>
        </Section>
        <Section heading="Honesty & Accuracy">
          <p>
            Do not post fake donor information, fake emergency requests, or misleading urgency levels. Do not
            impersonate another person, hospital staff, or organization.
          </p>
        </Section>
        <Section heading="Anti-Spam & Contact Respect">
          <p>
            Do not send unsolicited spam messages or repeated unwanted chat invitations. Never misuse, sell, or share
            donor phone numbers obtained through LIFE LINK outside the specific blood need.
          </p>
        </Section>
      </PolicyLayout>
    );
  }

  function EmergencyRequestPolicyPage() {
    return (
      <PolicyLayout
        title="Emergency Request Policy"
        subtitle="Requirements for creating and managing blood requests."
      >
        <Section heading="Genuine & Accurate Requests">
          <p>
            Every blood request must represent a real patient need. Blood group, hospital name, city/area, units
            needed, required date, urgency level, and contact phone number must be accurate. Fake or misleading
            requests are strictly prohibited.
          </p>
        </Section>
        <Section heading="Managing & Closing Requests">
          <p>
            Requesters should review responding donors promptly and mark requests as Fulfilled or Cancelled as soon as
            the need is met or no longer active, so donors are notified and not contacted unnecessarily.
          </p>
        </Section>
        <Section heading="No Independent Verification">
          <p>
            LIFE LINK cannot independently verify every hospital admission or guarantee blood availability. Donors and
            families should confirm details directly before traveling.
          </p>
        </Section>
      </PolicyLayout>
    );
  }

  function DonorSafetyPolicyPage() {
    return (
      <PolicyLayout
        title="Donor Safety Policy"
        subtitle="Guidance to help voluntary donors stay safe and informed."
      >
        <Section heading="Verify Before Acting">
          <p>
            Always verify the hospital, ward, and patient details directly with the requester or hospital blood bank
            before traveling to donate.
          </p>
        </Section>
        <Section heading="Voluntary Choice & Personal Boundaries">
          <p>
            Donation is 100% voluntary. You should never feel pressured or coerced into accepting a request or sharing
            personal information beyond what is needed to coordinate at a recognized hospital or blood bank.
          </p>
        </Section>
        <Section heading="Medical Eligibility">
          <p>
            LIFE LINK does not assess or certify medical eligibility to donate blood. Always follow screening guidance
            and advice from qualified medical professionals at the blood bank or hospital.
          </p>
        </Section>
      </PolicyLayout>
    );
  }

  function ModerationPolicyPage() {
    return (
      <PolicyLayout
        title="Reporting & Moderation Policy"
        subtitle="How community safety reports and precautionary restrictions work."
      >
        <Section heading="Submitting Good-Faith Reports">
          <p>
            Signed-in users whose accounts are older than 24 hours can report suspicious or inappropriate behavior
            from a donor profile or chat using one of four categories: False Donor Info, Harassment, Inappropriate
            Content, or Suspicious Activity, with a detailed reason of at least 10 characters. False or malicious
            reporting is prohibited.
          </p>
        </Section>
        <Section heading="Automated Precautionary Restriction Rule">
          <p>
            LIFE LINK uses an automated, evidence-based threshold with no human review panel or appeal workflow:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Only one report per reporter per target account is counted.</li>
            <li>Reporter identities are kept private and are never returned by any API.</li>
            <li>On the 3rd independent report since the last restriction start, a precautionary 7-day restriction is triggered.</li>
            <li>The restriction blocks creating new emergency requests only (all urgencies); searching, responding, chatting, and editing your profile remain available.</li>
            <li>Reporting does not automatically delete accounts or permanently ban users.</li>
          </ul>
        </Section>
      </PolicyLayout>
    );
  }

  function DisclaimerPage() {
    return (
      <PolicyLayout
        title="Disclaimer"
        subtitle="Important limitations of the LIFE LINK platform."
      >
        <Section heading="Coordination Tool Only">
          <p>
            LIFE LINK is a community platform intended solely to connect people seeking blood with potential voluntary
            donors. LIFE LINK is not a blood bank, hospital, or emergency medical service.
          </p>
        </Section>
        <Section heading="No Guarantees & Medical Advice">
          <p>
            LIFE LINK does not guarantee donor availability, donor response, donation completion, or blood group
            compatibility. Nothing on this platform constitutes medical advice. Always rely on licensed hospitals,
            emergency services, and qualified medical professionals for blood screening, cross-matching, and urgent care.
          </p>
        </Section>
      </PolicyLayout>
    );
  }

  window.LifeLinkPolicyPages = {
    UserAgreementPage,
    PrivacyPolicyPage,
    TermsOfUsePage,
    CommunityGuidelinesPage,
    EmergencyRequestPolicyPage,
    DonorSafetyPolicyPage,
    ModerationPolicyPage,
    DisclaimerPage,
  };
})();
