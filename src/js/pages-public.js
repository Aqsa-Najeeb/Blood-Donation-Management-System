const { useState } = React;

window.LifeLinkPublicPages = (() => {
  const { BLOOD_AVAILABILITY, FAQS_DATA, useApp } = window.LifeLink;
  const { WRAP } = window.LifeLinkComponents;

  const statusTone = (status) => {
    if (["Critical Low", "Urgent", "High Need"].includes(status)) {
      return { dot: "bg-danger", text: "text-danger" };
    }
    if (status === "Moderate") {
      return { dot: "bg-pink", text: "text-pink" };
    }
    return { dot: "bg-peach", text: "text-[#ecbda2]" };
  };

  function HomePage() {
    const { navigate, openDonorProfile } = useApp();
    const [roleTab, setRoleTab] = useState("recipient");

    const stepsData = {
      recipient: [
        {
          icon: "./assets/fa666.svg",
          title: "Submit Request",
          text: "Specify the blood group, required units, hospital ward, and attending physician details with swift ease.",
          tag: "INSTANT VALIDATION",
        },
        {
          icon: "./assets/53b7e.svg",
          title: "Intelligent Routing",
          text: "Our proximity engine notifies matching voluntary donors within your chosen radius.",
          tag: "NO CHAOTIC SPAM",
        },
        {
          icon: "./assets/e768e.svg",
          title: "Private Coordination",
          text: "Connect inside the platform chat to confirm timings, blood bank logistics, and reception instructions.",
          tag: "CONTROLLED CONTACT",
        },
        {
          icon: "./assets/89052.svg",
          title: "Completed Donation",
          text: "Donor arrives at the designated blood bank and coordinates directly with the requester.",
          tag: "LIFE SAVED SAFELY",
        },
      ],
      donor: [
        {
          icon: "./assets/fa666.svg",
          title: "Register & Declare",
          text: "Add your declared blood type (unverified), city, area, and contact phone in under 60 seconds.",
          tag: "VOLUNTARY DONOR",
        },
        {
          icon: "./assets/53b7e.svg",
          title: "Targeted Ping",
          text: "Receive an alert only when an accredited hospital near your radius urgently needs your blood group.",
          tag: "ZERO BROADCAST SPAM",
        },
        {
          icon: "./assets/e768e.svg",
          title: "Accept or Pass",
          text: "One tap to confirm availability. Skip cleanly without penalty if you are resting or unavailable.",
          tag: "FULL AUTONOMY",
        },
        {
          icon: "./assets/89052.svg",
          title: "Donate & Track",
          text: "Present your slip at the hospital lab, save a life, and automatically track your 56-day recovery window.",
          tag: "IMPACT CREDITS",
        },
      ],
    };

    return (
      <div className="relative overflow-hidden">
        {/* Atmospheric Glow Layers */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-coral/10 blur-[140px]" />
        <div className="pointer-events-none absolute top-[384px] left-12 w-[420px] h-[420px] rounded-full bg-peach/5 blur-[120px]" />

        {/* Emergency Medical Advisory Bar */}
        <section className={`${WRAP} pt-6 relative`}>
          <div className="bg-cardlow rounded-[32px] p-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-cardtop/40">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cardhigh flex items-center justify-center shrink-0">
                <img src="./assets/26682.svg" alt="" className="w-4 h-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cardtop text-pink text-[11px] font-medium uppercase tracking-[0.55px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink" />
                    EMERGENCY ADVISORY
                  </span>
                  <span className="text-[13px] font-semibold text-text">Hospital Care Protocol</span>
                </div>
                <p className="text-[13px] text-muted mt-1">
                  Life Link matches community voluntary donors. For critical acute emergencies, summon local emergency paramedic helplines directly.
                </p>
              </div>
            </div>
            <a
              href="tel:1122"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card hover:bg-cardhigh text-[13px] font-medium text-text shrink-0 transition self-start md:self-center"
            >
              <img src="./assets/45a0b.svg" alt="" className="w-3.5 h-3.5" />
              Helpline: 112 / 911
            </a>
          </div>
        </section>

        {/* Hero Section */}
        <section className={`${WRAP} pt-8 pb-12 grid lg:grid-cols-12 gap-8 items-center relative`}>
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card shadow-sm">
              <span className="w-2 h-2 rounded-full bg-peach" />
              <span className="text-[11px] font-medium text-primary uppercase tracking-[0.55px]">
                DIRECT VERIFIED BLOOD EXCHANGE
              </span>
              <span className="text-line">/</span>
              <span className="text-[11px] font-medium text-muted tracking-[0.44px]">Zero Intermediaries</span>
            </div>

            <h1 className="text-5xl md:text-[56px] font-bold leading-[1.15] tracking-[-1.4px] text-text">
              Give Blood.<br />
              <span className="text-peach">Save Lives.</span>
            </h1>

            <p className="text-[18px] leading-[28px] text-muted max-w-[576px]">
              A trusted, compassionate platform connecting voluntary verified blood donors with recipients across accredited hospitals in critical moments. Safe, transparent, and direct.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button onClick={() => navigate("/find-donors")} className="btn btn-primary px-9 py-3.5">
                <img src="./assets/e7972.svg" alt="" className="w-4 h-4" />
                Find a Donor
              </button>
              <button onClick={() => navigate("/signup", { role: "donor" })} className="btn btn-dark px-9 py-3.5">
                <img src="./assets/2fa97.svg" alt="" className="w-4 h-4" />
                Become a Donor
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-[13px] text-muted">
              <span className="inline-flex items-center gap-2">
                <img src="./assets/26a93.svg" alt="" className="w-3 h-4" />
                100% Medical ID Checked
              </span>
              <span className="inline-flex items-center gap-2">
                <img src="./assets/220d4.svg" alt="" className="w-3 h-4" />
                Private Contact Protection
              </span>
              <span className="inline-flex items-center gap-2">
                <img src="./assets/59374.svg" alt="" className="w-3 h-4" />
                Real-Time Matching
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 relative pt-4 lg:pt-0">
            {/* Visual Mosaic Card */}
            <div className="aspect-[4/3] rounded-[32px] bg-card overflow-hidden relative shadow-2xl border border-cardtop/60">
              <svg viewBox="0 0 520 390" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="heroOrb" cx="55%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#deab90" stopOpacity="0.32" />
                    <stop offset="50%" stopColor="#4d2b32" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#250a11" stopOpacity="0.95" />
                  </radialGradient>
                </defs>
                <rect width="520" height="390" fill="url(#heroOrb)" />
                <circle cx="260" cy="175" r="145" fill="none" stroke="#fcc6aa" strokeOpacity="0.14" strokeDasharray="6 6" />
                <circle cx="260" cy="175" r="95" fill="none" stroke="#ffc3c8" strokeOpacity="0.2" />
                <circle cx="260" cy="175" r="46" fill="#402027" stroke="#deab90" strokeOpacity="0.4" />
                <path d="M260 148 C260 148 241 171 241 184 A19 19 0 0 0 279 184 C279 171 260 148 260 148 Z" fill="#deab90" />
                {/* Network nodes */}
                <line x1="260" y1="175" x2="132" y2="112" stroke="#fcc6aa" strokeOpacity="0.25" />
                <line x1="260" y1="175" x2="392" y2="124" stroke="#fcc6aa" strokeOpacity="0.25" />
                <line x1="260" y1="175" x2="162" y2="246" stroke="#ffc3c8" strokeOpacity="0.25" />
                <circle cx="132" cy="112" r="8" fill="#4d2b32" stroke="#fcc6aa" strokeWidth="2" />
                <circle cx="392" cy="124" r="8" fill="#4d2b32" stroke="#ffc3c8" strokeWidth="2" />
                <circle cx="162" cy="246" r="8" fill="#4d2b32" stroke="#34d399" strokeWidth="2" />
              </svg>

              {/* Floating Live Request Chip */}
              <div className="absolute bottom-4 inset-x-4 rounded-2xl bg-cardhigh/95 backdrop-blur-md p-4 shadow-xl border border-cardtop/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-deep flex items-center justify-center font-bold text-[20px] text-pink shrink-0">
                    O-
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-text truncate">Universal Donor Needed</span>
                      <span className="w-2 h-2 rounded-full bg-danger shrink-0 animate-pulse" />
                    </div>
                    <div className="text-[12px] text-muted truncate">St. Jude Metropolitan • 2.4 km away</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/find-donors", { blood: "O-" })}
                  className="px-4 py-1.5 rounded-full bg-coral hover:bg-pink text-[#74333d] text-[11px] font-semibold tracking-[0.44px] shrink-0 transition cursor-pointer"
                >
                  Assist Now
                </button>
              </div>
            </div>

            {/* Decorative Floating Metric Badge */}
            <div className="absolute -top-3 right-2 md:-right-4 rounded-2xl bg-cardtop/90 backdrop-blur-xl p-4 shadow-2xl border border-peach/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-peach/20 flex items-center justify-center">
                <img src="./assets/6e17e.svg" alt="" className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[20px] font-bold text-text leading-tight">99.4%</div>
                <div className="text-[11px] font-medium text-muted tracking-[0.44px]">Fulfillment Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-Time Blood Availability Ribbon */}
        <section className={`${WRAP} py-4 relative`}>
          <div className="bg-cardlow rounded-[32px] p-6 shadow-xl border border-cardtop/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-pink" />
                <h2 className="text-[20px] font-bold text-text">Live Blood Bank & Donor Availability</h2>
              </div>
              <span className="text-[13px] text-line">Updated 42 seconds ago • Metro Coverage Network</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {BLOOD_AVAILABILITY.map((b) => {
                const tone = statusTone(b.status);
                return (
                  <button
                    key={b.type}
                    onClick={() => navigate("/find-donors", { blood: b.type })}
                    className="bg-card hover:bg-cardhigh rounded-2xl p-3.5 text-center transition shadow-sm border border-transparent hover:border-peach/30 cursor-pointer group"
                  >
                    <div className="text-[24px] font-bold text-primary group-hover:scale-105 transition-transform">
                      {b.type}
                    </div>
                    <div className="text-[11px] font-medium text-muted mt-0.5">
                      {b.count.toLocaleString()} Donors
                    </div>
                    <div className="inline-flex items-center justify-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                      <span className={`text-[11px] font-bold ${tone.text}`}>{b.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Key Architectural Features */}
        <section className={`${WRAP} py-12 relative`}>
          <div className="text-center max-w-[672px] mx-auto mb-10">
            <div className="text-[11px] font-medium text-primary uppercase tracking-[1.1px]">
              PRINCIPLED INNOVATION
            </div>
            <h2 className="text-3xl md:text-[40px] font-bold leading-tight tracking-[-0.8px] text-text mt-1">
              Engineered to Preserve Life & Privacy
            </h2>
            <p className="text-[15px] text-muted mt-2">
              Built from the ground up to prevent predatory solicitations, spam calls, and hospital chaos during emergency moments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "./assets/647eb.svg",
                arrow: "./assets/b64ed.svg",
                title: "Smart Proximity Matching",
                desc: "Calculates geo-distance and instantly sorts the nearest eligible donors while protecting exact home coordinate data behind encrypted regional boundaries.",
                linkLabel: "Radius filtered matching",
                linkColor: "text-primary",
                to: "/find-donors",
              },
              {
                icon: "./assets/68d7b.svg",
                arrow: "./assets/7592d.svg",
                title: "Controlled Request Protocol",
                desc: "Dispatches alerts to a maximum of 3 qualified donors at a time. This eliminates noisy group spam, panic duplication, and chaotic hospital queues.",
                linkLabel: "Anti-congestion dispatch",
                linkColor: "text-pink",
                to: "/request-blood",
              },
              {
                icon: "./assets/06456.svg",
                arrow: "./assets/d8843.svg",
                title: "Secure In-App Chat",
                desc: "Coordinate transit and blood banking timing with voluntary donors directly inside our encrypted messenger without disclosing personal phone numbers.",
                linkLabel: "Zero phone leaks",
                linkColor: "text-[#ecbda2]",
                to: "/chat",
              },
            ].map((f) => (
              <div
                key={f.title}
                onClick={() => navigate(f.to)}
                className="bg-card hover:bg-cardhigh transition rounded-[32px] p-9 flex flex-col justify-between gap-8 shadow-md border border-cardtop/40 cursor-pointer"
              >
                <div className="flex flex-col gap-4">
                  <div className="w-14 h-14 rounded-full bg-cardtop flex items-center justify-center">
                    <img src={f.icon} alt="" className="w-6 h-6" />
                  </div>
                  <h3 className="text-[24px] font-semibold tracking-[-0.24px] text-text leading-snug">
                    {f.title}
                  </h3>
                  <p className="text-[15px] leading-[24px] text-muted">{f.desc}</p>
                </div>
                <div className={`inline-flex items-center gap-2 text-[13px] font-medium ${f.linkColor}`}>
                  <span>{f.linkLabel}</span>
                  <img src={f.arrow} alt="" className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Impact Stats Section */}
        <section className={`${WRAP} py-6 relative`}>
          <div className="bg-cardlow rounded-[32px] p-8 md:p-10 shadow-xl border border-cardtop/40 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { val: "14,280+", label: "Active Donors", sub: "Verified & ready", color: "text-primary" },
                { val: "38", label: "Cities Covered", sub: "Metropolitan clusters", color: "text-pink" },
                { val: "1,890", label: "Direct Donations", sub: "Life-saving completed", color: "text-[#ecbda2]" },
                { val: "<15m", label: "Response Time", sub: "Median first reply", color: "text-peach" },
              ].map((s) => (
                <div key={s.label}>
                  <div className={`text-4xl lg:text-[46px] font-bold tracking-[-1.2px] leading-none ${s.color}`}>
                    {s.val}
                  </div>
                  <div className="text-[15px] font-semibold text-text mt-2">{s.label}</div>
                  <div className="text-[13px] text-line">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 flex items-center lg:justify-end gap-5">
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#4d2b32" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#deab90"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="314.159"
                    strokeDashoffset="37.7"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-bold text-[20px] text-text leading-none">88%</span>
                  <span className="text-[11px] font-medium text-line mt-1">Acceptance</span>
                </div>
              </div>
              <div>
                <div className="text-[15px] font-semibold text-text">Fast Dispatch</div>
                <p className="text-[13px] text-muted mt-1 max-w-[170px]">
                  88% of requests matched within the first dispatch cycle.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How Life Link Operates */}
        <section className={`${WRAP} pt-14 pb-10 relative`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-[11px] font-medium text-primary uppercase tracking-[1.1px]">
                CLEAR PATHWAYS
              </div>
              <h2 className="text-3xl md:text-[40px] font-bold tracking-[-0.8px] text-text mt-1">
                How Life Link Operates
              </h2>
              <p className="text-[15px] text-muted mt-1">
                Simple, dignified 4-step protocols for both patients in urgency and voluntary heroes.
              </p>
            </div>

            <div className="inline-flex p-1 bg-cardlow rounded-full self-start border border-cardtop/50">
              <button
                onClick={() => setRoleTab("recipient")}
                className={`px-6 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
                  roleTab === "recipient" ? "bg-peach text-[#633e2a]" : "text-muted hover:text-text"
                }`}
              >
                For Recipients
              </button>
              <button
                onClick={() => setRoleTab("donor")}
                className={`px-6 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
                  roleTab === "donor" ? "bg-peach text-[#633e2a]" : "text-muted hover:text-text"
                }`}
              >
                For Donors
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stepsData[roleTab].map((s, idx) => (
              <div
                key={s.title}
                className="bg-card rounded-[32px] p-6 relative overflow-hidden flex flex-col justify-between gap-6 shadow-md border border-cardtop/40"
              >
                <span className="absolute -top-2 right-4 text-[40px] font-bold text-cardtop select-none">
                  0{idx + 1}
                </span>
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-cardhigh flex items-center justify-center">
                    <img src={s.icon} alt="" className="w-4 h-4" />
                  </div>
                  <h4 className="text-[20px] font-semibold text-text mt-1">{s.title}</h4>
                  <p className="text-[13px] leading-[20px] text-muted">{s.text}</p>
                </div>
                <div className="text-[11px] font-medium text-primary uppercase tracking-[0.55px]">
                  {s.tag}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Community Donor Spotlight */}
        <section className={`${WRAP} py-12 grid lg:grid-cols-12 gap-8 items-center relative`}>
          <div className="lg:col-span-5">
            <div
              onClick={() => openDonorProfile(9)}
              className="aspect-[4/3] rounded-[32px] bg-card overflow-hidden relative shadow-2xl border border-cardtop/60 cursor-pointer group"
            >
              <svg viewBox="0 0 480 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id="spotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4d2b32" />
                    <stop offset="100%" stopColor="#1f060c" />
                  </linearGradient>
                </defs>
                <rect width="480" height="360" fill="url(#spotGrad)" />
                <circle cx="240" cy="145" r="76" fill="#402027" stroke="#fcc6aa" strokeOpacity="0.35" strokeWidth="2" />
                <circle cx="240" cy="128" r="28" fill="#deab90" fillOpacity="0.85" />
                <path d="M188 205 C192 172 288 172 292 205" fill="#deab90" fillOpacity="0.85" />
                <text x="240" y="254" textAnchor="middle" fill="#fcc6aa" fontSize="13" fontWeight="600">
                  14 VERIFIED HOSPITAL DONATIONS
                </text>
              </svg>
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-2 bg-surface/85 backdrop-blur-md rounded-2xl p-4 border border-cardtop">
                <div>
                  <div className="font-bold text-[15px] text-text group-hover:text-primary transition">Aria Chen</div>
                  <div className="text-[13px] text-muted">O- Universal Donor • 14 Donations</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-cardhigh/90 text-primary text-[11px] font-semibold tracking-[0.44px]">
                  Verified Hero
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4 lg:pl-6">
            <div className="text-[11px] font-medium text-primary uppercase tracking-[1.1px]">
              COMMUNITY TESTIMONY
            </div>
            <blockquote className="text-2xl md:text-[30px] font-semibold leading-[1.38] tracking-[-0.48px] text-text">
              “When a premature infant in my district required universal negative platelets, Life Link pinged only three of us. No public social media begging, no chaotic phone calls—just a quiet, clear call to serve within 20 minutes.”
            </blockquote>
            <p className="text-[15px] text-muted leading-[24px]">
              Life Link maintains a respectful, orderly donation culture. We protect both the peace of the donor and the urgent dignity of the patient’s family.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button onClick={() => navigate("/signup", { role: "donor" })} className="btn btn-primary px-8 py-3">
                <span>Join as a Voluntary Donor</span>
                <img src="./assets/db24b.svg" alt="" className="w-3 h-3" />
              </button>
              <button
                onClick={() => navigate("/safety-faqs")}
                className="px-4 py-3 text-[15px] font-semibold text-muted hover:text-text transition cursor-pointer"
              >
                Learn our donor code
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Action Callout */}
        <section className={`${WRAP} pt-4 pb-16 relative`}>
          <div className="bg-card rounded-[32px] p-8 md:p-10 relative overflow-hidden shadow-2xl border border-cardtop/50">
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-peach/10 blur-[100px]" />
            <div className="max-w-[672px] flex flex-col items-start gap-4 relative">
              <span className="px-3 py-1 rounded-full bg-cardhigh text-primary text-[11px] font-medium uppercase tracking-[0.55px]">
                READY IN UNDER 2 MINUTES
              </span>
              <h2 className="text-3xl md:text-[40px] font-bold tracking-[-0.8px] text-text">
                Need Blood Right Now?
              </h2>
              <p className="text-[15px] leading-[24px] text-muted">
                Don’t leave life to chance or uncontrolled broadcasts. Initiate a verified, controlled request to discover certified matching donors nearest to your hospital.
              </p>
              <div className="flex flex-wrap gap-4 pt-1">
                <button onClick={() => navigate("/request-blood")} className="btn btn-primary px-9 py-3.5">
                  <img src="./assets/8a39e.svg" alt="" className="w-3.5 h-4" />
                  Initiate Controlled Request
                </button>
                <button onClick={() => navigate("/find-donors")} className="btn btn-subtle px-6 py-3.5">
                  <img src="./assets/4309a.svg" alt="" className="w-4 h-4" />
                  Browse Active Directory
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function AboutPage() {
    const { navigate } = useApp();
    return (
      <div className={`${WRAP} py-12 flex flex-col gap-16`}>
        <section className="text-center max-w-3xl mx-auto flex flex-col items-center gap-5">
          <span className="px-4 py-1.5 rounded-full bg-card text-primary text-[11px] font-semibold uppercase tracking-wider">
            Serving Lives Across 38+ Communities
          </span>
          <h1 className="text-4xl md:text-[52px] font-bold tracking-tight text-text leading-tight">
            About Life Link
          </h1>
          <p className="text-[16px] text-muted leading-relaxed">
            Life Link connects verified voluntary blood donors directly with hospital patients in urgent need—eliminating chaotic social media broadcasts and protecting everyone's privacy.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button onClick={() => navigate("/find-donors")} className="btn btn-primary">Find a Donor</button>
            <button onClick={() => navigate("/signup", { role: "donor" })} className="btn btn-dark">Become a Donor</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 w-full pt-4">
            {[
              { title: "8 Types", sub: "Supported across ABO & Rh" },
              { title: "3 Donors", sub: "Max alerted per cycle" },
              { title: "100% Private", sub: "Encrypted in-app relay chat" },
            ].map((k) => (
              <div key={k.title} className="bg-cardlow rounded-2xl p-4 border border-cardtop/40">
                <div className="font-bold text-text text-lg">{k.title}</div>
                <div className="text-[12px] text-muted">{k.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="text-[11px] uppercase tracking-widest text-primary font-semibold">ORIGIN & PURPOSE</div>
            <h2 className="text-3xl md:text-4xl font-bold text-text">Bridging the Critical Minutes in Hemorrhagic Care</h2>
            <p className="text-[15px] text-muted leading-relaxed">
              Critical blood shortages don't occur because communities lack generosity—they happen because connection in the golden hour is broken. Families resort to public phone posts, creating confusion and overwhelm at hospital wards.
            </p>
            <p className="text-[15px] text-muted leading-relaxed">
              Life Link replaces guesswork with a calm, verified network: confirming donor readiness within 7 days, capping alerts to 3 matches per request, and preserving dignity on both sides.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-card rounded-3xl p-6 border border-cardtop/40">
                <div className="text-3xl font-bold text-primary">14,200+</div>
                <div className="text-[14px] font-semibold text-text mt-2">Verified Registered Donors</div>
                <p className="text-[12px] text-muted mt-1">Pre-cleared with declared blood group records.</p>
              </div>
              <div className="bg-card rounded-3xl p-6 border border-cardtop/40">
                <div className="text-3xl font-bold text-pink">98.4%</div>
                <div className="text-[14px] font-semibold text-text mt-2">Match Fulfillment</div>
                <p className="text-[12px] text-muted mt-1">Within standard trauma emergency parameters.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            {[
              {
                title: "Verified Clinical Standards",
                desc: "Every donation occurs exclusively at accredited hospital blood banks where mandatory serology and cross-matching screening is completed.",
              },
              {
                title: "Under 15 Minutes Match Window",
                desc: "Algorithmic proximity buckets surface active local donors immediately so hospital attendants can coordinate quickly.",
              },
              {
                title: "Absolute Privacy Shield",
                desc: "Personal phone numbers and home coordinates are masked. Initial contact stays inside our encrypted messenger.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-cardlow rounded-3xl p-6 border border-cardtop/50">
                <h3 className="text-xl font-bold text-text">{item.title}</h3>
                <p className="text-[14px] text-muted mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="text-[11px] uppercase tracking-widest text-primary font-semibold">FOUNDATIONAL VALUES</div>
            <h2 className="text-3xl font-bold text-text mt-1">Built on Trust, Empathy & Technical Precision</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Rapid Response", desc: "Real-time proximity ranking prioritizes nearby eligible donors.", action: "Find Donors", to: "/find-donors" },
              { title: "Uncompromising Privacy", desc: "Approximate sectors only—exact addresses stay hidden.", action: "Privacy Controls", to: "/privacy-settings" },
              { title: "Zero Commercialization", desc: "100% voluntary, non-commercial community donation ethos.", action: "Safety Charter", to: "/safety-faqs" },
              { title: "Direct Verification", desc: "7-day freshness checks keep the directory accurate.", action: "How It Works", to: "/how-it-works" },
            ].map((v) => (
              <div key={v.title} className="bg-card rounded-3xl p-6 flex flex-col justify-between gap-6 border border-cardtop/40">
                <div>
                  <h3 className="text-xl font-bold text-text">{v.title}</h3>
                  <p className="text-[13px] text-muted mt-2 leading-relaxed">{v.desc}</p>
                </div>
                <button
                  onClick={() => navigate(v.to)}
                  className="pt-3 border-t border-cardtop text-left text-[12px] font-semibold text-primary hover:text-text flex items-center justify-between cursor-pointer"
                >
                  <span>{v.action}</span>
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function HowItWorksPage() {
    const { navigate } = useApp();
    const [perspective, setPerspective] = useState("all");

    return (
      <div className={`${WRAP} py-12 flex flex-col gap-14`}>
        <section className="text-center max-w-3xl mx-auto flex flex-col items-center gap-5">
          <span className="px-4 py-1 rounded-full bg-card text-primary text-[11px] font-semibold uppercase tracking-wider">
            Transparent End-to-End Dispatch Protocol
          </span>
          <h1 className="text-4xl md:text-[50px] font-bold tracking-tight text-text leading-tight">
            How Life Link Connects <span className="text-peach">Need</span> With Hope
          </h1>
          <p className="text-[15px] text-muted leading-relaxed">
            Whether you are an eligible donor ready to serve or a family member managing an urgent transfusion requirement, here is how every connection is safely coordinated.
          </p>

          <div className="inline-flex flex-wrap justify-center p-1.5 bg-cardlow rounded-full border border-cardtop/50 gap-1">
            {[
              { id: "all", label: "All Stakeholders (Overview)" },
              { id: "donor", label: "For Donors & Volunteers" },
              { id: "recipient", label: "For Blood Seekers" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPerspective(tab.id)}
                className={`px-5 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
                  perspective === tab.id ? "bg-peach text-[#633e2a]" : "text-muted hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-3">
            {[
              { val: "4.2 min", sub: "Median Match Initiation" },
              { val: "100%", sub: "Anonymous Shielding" },
              { val: "5 - 15km", sub: "Controlled Match Radius" },
              { val: "0 $", sub: "Strictly Non-Commercial" },
            ].map((m) => (
              <div key={m.sub} className="bg-card rounded-2xl p-4 border border-cardtop/40">
                <div className="text-2xl font-bold text-primary">{m.val}</div>
                <div className="text-[12px] text-muted mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 4-Phase Request Journey */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-text">The Complete Request Lifecycle</h2>
              <p className="text-[14px] text-muted mt-1">
                From request creation to hospital blood bank verification—every phase enforces anti-spam limits.
              </p>
            </div>
            <button onClick={() => navigate("/request-blood")} className="btn btn-primary self-start">
              Try Live Request Flow
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: "PHASE 01", title: "Create & Verify Profile", desc: "Quick 60-second registration with blood group declaration, city sector, and eligibility screening." },
              { step: "PHASE 02", title: "Smart Broadcast & Matching", desc: "Algorithmic proximity pinging (within 5–15km) to up to 3 eligible matching donors; zero spam." },
              { step: "PHASE 03", title: "Secure & Private Coordination", desc: "Direct masked in-app chat; personal phone numbers and home addresses remain shielded." },
              { step: "PHASE 04", title: "Clinical Verification & Handoff", desc: "Donor visits accredited hospital blood bank, completes cross-match screening, and logs donation." },
            ].map((p) => (
              <div key={p.step} className="bg-card rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-3">
                <span className="text-[11px] font-bold text-primary tracking-wider">{p.step}</span>
                <h3 className="text-lg font-bold text-text">{p.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Deep-Dive Dual Track Journey */}
        <section className="grid lg:grid-cols-2 gap-6">
          {(perspective === "all" || perspective === "donor") && (
            <div className="bg-cardlow rounded-3xl p-7 border border-cardtop/50 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-text">The Donor Track</h3>
                <span className="px-3 py-1 rounded-full bg-card text-primary text-[11px] font-semibold">4 Steps</span>
              </div>
              {[
                { t: "1. Targeted Emergency Ping", d: "Receive a priority notification detailing hospital blood bank location, required ABO group, and urgency tier." },
                { t: "2. One-Tap Accept or Pass", d: "Confirm availability with a single tap. If unavailable, pass without penalty and Life Link reroutes immediately." },
                { t: "3. Guided Transit & Hospital Handoff", d: "Coordinate arrival window via private chat and check in at the transfusion counter with your request slip." },
                { t: "4. Verified Badge & Recovery Schedule", d: "Receive verified impact credits and an automated 56-day health recuperation countdown." },
              ].map((s) => (
                <div key={s.t} className="p-4 rounded-2xl bg-card border border-cardtop/40">
                  <div className="font-semibold text-[15px] text-primary">{s.t}</div>
                  <p className="text-[13px] text-muted mt-1">{s.d}</p>
                </div>
              ))}
            </div>
          )}

          {(perspective === "all" || perspective === "recipient") && (
            <div className="bg-cardlow rounded-3xl p-7 border border-cardtop/50 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-text">The Recipient Track</h3>
                <span className="px-3 py-1 rounded-full bg-card text-pink text-[11px] font-semibold">4 Steps</span>
              </div>
              {[
                { t: "1. Submit Verified Urgent Ticket", d: "Specify patient ABO blood type, required units, hospital ward identifier, and urgency deadline." },
                { t: "2. Simultaneous Multi-Donor Dispatch", d: "The system pings up to 3 local eligible matches. Real-time status notifies you when the first donor accepts." },
                { t: "3. Live Transit & Chat Coordination", d: "Monitor the arriving donor's ETA to the hospital blood bank without exposing personal phone numbers." },
                { t: "4. Hospital Lab Confirmation", d: "Hospital lab completes cross-match and unit collection. Ticket resolves cleanly, stopping duplicate alerts." },
              ].map((s) => (
                <div key={s.t} className="p-4 rounded-2xl bg-card border border-cardtop/40">
                  <div className="font-semibold text-[15px] text-pink">{s.t}</div>
                  <p className="text-[13px] text-muted mt-1">{s.d}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Roles & Permissions */}
        <section>
          <h2 className="text-3xl font-bold text-text text-center mb-8">Who Can Do What on Life Link</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { role: "Community Visitor", desc: "Browse live availability, read transfusion protocols, and explore approximate coverage." },
              { role: "Verified Donor", desc: "Toggle availability, receive targeted pings, coordinate via encrypted chat, and track milestones." },
              { role: "Recipient / Caregiver", desc: "Initiate controlled 3-donor requests, track donor transit ETA, and manage standby backups." },
              { role: "Hospital Coordinator", desc: "Verify unit arrival, perform lab cross-matching, and confirm safe transfusion completion." },
            ].map((r) => (
              <div key={r.role} className="bg-card rounded-3xl p-6 border border-cardtop/40">
                <h3 className="text-lg font-bold text-text">{r.role}</h3>
                <p className="text-[13px] text-muted mt-2 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function SafetyFaqsPage() {
    const { navigate } = useApp();
    const [openIdx, setOpenIdx] = useState(0);

    return (
      <div className={`${WRAP} py-12 flex flex-col gap-12`}>
        <section className="text-center max-w-3xl mx-auto flex flex-col items-center gap-4">
          <span className="px-4 py-1 rounded-full bg-card text-primary text-[11px] font-semibold uppercase tracking-wider">
            Safeguards & Transfusion Protocol
          </span>
          <h1 className="text-4xl md:text-[48px] font-bold tracking-tight text-text leading-tight">
            How Life Link Works & Community Safeguards
          </h1>
          <p className="text-[15px] text-muted">
            A simple, privacy-focused platform connecting people needing blood with nearby voluntary donors. Understand our protocols, boundaries, and how your privacy is protected.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1 text-[12px]">
            {["Approximate Area Only", "Hospital Cross-Match Mandatory", "Private by Default", "7-Day Freshness Check"].map((tag) => (
              <span key={tag} className="px-3.5 py-1.5 rounded-full bg-cardlow border border-cardtop text-muted">
                ✔ {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Critical Medical Notice */}
        <section className="bg-gradient-to-r from-[#4d1b23] to-cardlow border border-danger/30 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-danger/20 text-danger flex items-center justify-center shrink-0 font-bold">
              !
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-text">Critical Notice</h2>
                <span className="px-2 py-0.5 rounded bg-danger text-[#250a11] text-[10px] font-bold uppercase">
                  Medical Disclaimer
                </span>
              </div>
              <p className="text-[13px] text-muted mt-1 leading-relaxed">
                Life Link is a donor-discovery connection tool, NOT an emergency medical service, ambulance dispatch, or blood transfusion bank. For acute medical trauma, contact official emergency services (1122/911) and certified hospital blood banks immediately.
              </p>
            </div>
          </div>
          <a href="tel:1122" className="px-5 py-2.5 rounded-full bg-card hover:bg-cardhigh text-text text-[13px] font-semibold shrink-0">
            Dial 1122 Emergency
          </a>
        </section>

        {/* 4 Pillars */}
        <section>
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">ARCHITECTURE OF TRUST</div>
            <h2 className="text-3xl font-bold text-text mt-1">The 4 Pillars of Community Protection</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                tag: "PILLAR 01 • CLINICAL SAFETY",
                title: "User-Declared Blood Groups",
                desc: "Blood groups are declared by voluntary donors without clinical CNIC or lab verification. Receiving hospitals must always perform pre-transfusion cross-matching tests.",
              },
              {
                tag: "PILLAR 02 • SPATIAL PRIVACY",
                title: "Approximate Area Matching",
                desc: "Exact residential coordinates, building names, or live GPS trails are never collected or visible. All discovery operates via manual city and sector radius buckets.",
              },
              {
                tag: "PILLAR 03 • ANTI-SPAM",
                title: "Max 3 Request Limit & Gates",
                desc: "Requesters are capped at a maximum of 3 concurrent active emergency calls. Contact details remain masked until mutual confirmation.",
              },
              {
                tag: "PILLAR 04 • NEUTRALITY",
                title: "Automated Community Reporting",
                desc: "Zero human intermediary reads private logs. Accruing 3 independent abuse reports triggers an automatic 7-day restriction on emergency notices.",
              },
            ].map((p) => (
              <div key={p.title} className="bg-card rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-3">
                <div className="text-[10px] font-bold text-primary tracking-wider">{p.tag}</div>
                <h3 className="text-lg font-bold text-text">{p.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">FREQUENTLY ASKED</div>
            <h2 className="text-3xl font-bold text-text mt-1">Questions, Protocols & Guarantees</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS_DATA.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={item.q} className="bg-cardlow border border-cardtop/60 rounded-3xl overflow-hidden">
                  <button
                    onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-card/50 transition"
                  >
                    <span className="font-semibold text-[15px] text-text">{item.q}</span>
                    <span className="text-primary text-lg shrink-0">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-[14px] text-muted leading-relaxed flex flex-col gap-3">
                      <p>{item.a}</p>
                      {item.recommendation && (
                        <div className="p-3.5 rounded-2xl bg-card border border-cardtop text-[12px] text-primary">
                          <strong>Recommendation:</strong> {item.recommendation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Pre-Transfusion Checklist */}
        <section className="bg-cardlow rounded-3xl p-8 border border-cardtop/50">
          <h3 className="text-xl font-bold text-text mb-5">The Patient & Donor Pre-Transfusion Checklist</h3>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "1. Laboratory Cross-Matching", d: "Never skip hospital compatibility testing. Ensure certified technicians inspect major & minor cross-match panels." },
              { n: "2. Donor Pre-Screening", d: "Hospital staff verify donor hemoglobin levels, blood pressure, and mandatory infectious disease panels." },
              { n: "3. Zero Financial Exchange", d: "Voluntary donors are strictly prohibited from requesting or receiving monetary payment for blood." },
            ].map((c) => (
              <div key={c.n} className="bg-card rounded-2xl p-5 border border-cardtop/40">
                <div className="font-semibold text-primary text-[14px]">{c.n}</div>
                <p className="text-[13px] text-muted mt-1.5">{c.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-cardtop/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xl font-bold text-text">Ready to save lives in your community?</div>
              <div className="text-[13px] text-muted">Join hundreds of verified local donors standing ready across cities.</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate("/find-donors")} className="btn btn-primary">Find Donors</button>
              <button onClick={() => navigate("/signup", { role: "donor" })} className="btn btn-dark">Become a Donor</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return {
    HomePage,
    AboutPage,
    HowItWorksPage,
    SafetyFaqsPage,
  };
})();
