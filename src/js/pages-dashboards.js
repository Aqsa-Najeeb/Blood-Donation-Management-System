const { useState } = React;

window.LifeLinkDashboardPages = (() => {
  const { BLOOD_COMPATIBILITY, useApp } = window.LifeLink;
  const { WRAP, LahoreMapPreview } = window.LifeLinkComponents;

  /* ---------- DONOR DASHBOARD (3552:1461) ---------- */
  function DonorDashboardPage() {
    const {
      user,
      setUser,
      donorAlerts,
      acceptIncomingDonorAlert,
      declineIncomingDonorAlert,
      advanceDonorActiveStep,
      navigate,
      showToast,
    } = useApp();

    const [declineReasons, setDeclineReasons] = useState({});

    const initials = (user.name || "UK")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const pendingAlerts = donorAlerts.filter((a) => a.status === "Pending");
    const activeAccepted = donorAlerts.filter((a) => a.status === "Accepted");

    const toggleAvailability = () => {
      const next = !user.available;
      setUser((u) => ({
        ...u,
        available: next,
        lastConfirmed: next ? "Just now" : u.lastConfirmed,
      }));
      showToast(next ? "Status set to Available to Donate." : "Status set to Paused / Offline.", "info");
    };

    const confirmFresh = () => {
      setUser((u) => ({ ...u, available: true, lastConfirmed: "Just now" }));
      showToast("7-Day freshness timestamp refreshed!");
    };

    const readinessPct = Math.min(100, Math.round((user.recoveryDaysDone / 56) * 100));

    return (
      <div className={`${WRAP} py-8 flex flex-col gap-6`}>
        {/* Welcome Banner */}
        <section className="bg-cardlow rounded-[32px] p-6 md:p-8 border border-cardtop/50 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cardtop flex items-center justify-center text-2xl font-bold text-primary shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text">Welcome back, {user.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="px-3 py-0.5 rounded-full bg-cardhigh text-primary text-[11px] font-semibold">
                  🩸 {user.blood} POSITIVE
                </span>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                  ✔ Platform Verified
                </span>
              </div>
              <div className="text-[12px] text-muted mt-1.5">
                📍 {user.area}, {user.city} • Donor ID: {user.donorId}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl p-4 md:p-5 border border-cardtop/60 flex flex-col gap-3 min-w-[290px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-semibold text-text">
                  Status:{" "}
                  <span className={user.available ? "text-emerald-400" : "text-amber-300"}>
                    {user.available ? "Available to Donate" : "Paused / Unavailable"}
                  </span>
                </div>
                <div className="text-[11px] text-line">Last confirmed: {user.lastConfirmed}</div>
              </div>
              <button
                onClick={toggleAvailability}
                role="switch"
                aria-checked={user.available}
                className={`w-12 h-6 rounded-full p-0.5 transition cursor-pointer ${
                  user.available ? "bg-peach" : "bg-cardtop"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-surface transition-transform ${
                    user.available ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-cardtop/50 text-[11px] text-muted">
              <span>7-Day Inactivity Rule: Auto-switches offline if unconfirmed</span>
              <button
                onClick={confirmFresh}
                className="px-3 py-1 rounded-full bg-cardhigh hover:bg-cardtop text-primary font-semibold shrink-0 cursor-pointer"
              >
                ↻ Confirm 7 Days
              </button>
            </div>
          </div>
        </section>

        {/* 4 Metric Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "TOTAL REQUESTS", val: String(10 + donorAlerts.length), sub: "+2 this month" },
            { label: "COMPLETED DONATIONS", val: String(user.completedDonations), sub: "Full verified units" },
            { label: "LIVES IMPACTED", val: `~${user.livesImpacted}`, sub: "Patients assisted" },
            { label: "RESPONSE RATE", val: `${user.responseRate}%`, sub: "Avg reply <4m" },
          ].map((m) => (
            <div key={m.label} className="bg-cardlow rounded-3xl p-5 border border-cardtop/50">
              <div className="text-[11px] font-semibold text-line tracking-wider">{m.label}</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-text">{m.val}</span>
                <span className="text-[12px] text-muted">{m.sub}</span>
              </div>
              <div className="h-1 bg-cardtop rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-peach rounded-full w-3/4" />
              </div>
            </div>
          ))}
        </section>

        {/* Main 8/4 Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">🔔 Active & Incoming Requests</h2>
              <span className="text-[11px] font-semibold text-primary uppercase">
                {donorAlerts.length} ACTION ITEMS
              </span>
            </div>

            {pendingAlerts.map((alert) => (
              <div key={alert.id} className="bg-cardlow rounded-3xl p-6 border border-danger/40 shadow-xl flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-danger/20 text-danger text-[11px] font-bold">
                      ● URGENT REQUEST
                    </span>
                    <span className="text-[12px] text-muted">📍 {alert.distance}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-card text-[11px] text-primary">
                    ⏱ Expires in: {alert.expiresIn}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-text">
                      {alert.units} Units of {alert.blood} Needed
                    </h3>
                    <div className="text-[13px] text-muted mt-1">{alert.hospital}</div>
                    <div className="text-[12px] text-muted mt-1">
                      Recipient: <strong className="text-text">{alert.recipient}</strong> •{" "}
                      <span className="text-emerald-400">Hospital Attendant Verified</span>
                    </div>
                  </div>
                  <div className="bg-deep rounded-2xl px-4 py-3 text-center border border-cardtop shrink-0">
                    <div className="text-[10px] text-line">Blood Compatibility</div>
                    <div className="text-sm font-bold text-primary">{alert.matchLabel}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-cardtop/50">
                  <select
                    value={declineReasons[alert.id] || ""}
                    onChange={(e) =>
                      setDeclineReasons((prev) => ({ ...prev, [alert.id]: e.target.value }))
                    }
                    className="bg-card border border-cardtop rounded-full px-4 py-2 text-[12px] text-muted outline-none cursor-pointer"
                  >
                    <option value="">Decline (Select reason)</option>
                    <option value="Recently donated">Recently donated</option>
                    <option value="Out of city">Out of city</option>
                    <option value="Medical rest">Medical rest</option>
                  </select>
                  <button
                    onClick={() => declineIncomingDonorAlert(alert.id, declineReasons[alert.id])}
                    className="px-5 py-2.5 rounded-full bg-card hover:bg-cardhigh text-text text-[13px] font-semibold cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => acceptIncomingDonorAlert(alert.id)}
                    className="px-6 py-2.5 rounded-full bg-peach hover:bg-primary text-[#633e2a] text-[13px] font-semibold cursor-pointer"
                  >
                    ✔ Accept Request
                  </button>
                </div>
              </div>
            ))}

            {activeAccepted.map((item) => (
              <div key={item.id} className="bg-cardlow rounded-3xl p-6 border border-peach/50 shadow-xl flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-peach/20 text-primary text-[11px] font-semibold">
                      ✦ Accepted — In Progress
                    </span>
                    <span className="text-[12px] text-muted">Request #{item.id}</span>
                  </div>
                  <span className="text-[11px] text-line">{item.confirmedAgo}</span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-text">
                    {item.units} Unit {item.blood} at {item.hospital}
                  </h3>
                  <div className="text-[13px] text-muted mt-1">
                    {item.ward} • Patient: {item.patient}
                  </div>
                  <div className="text-[12px] text-primary mt-1">
                    📞 Hospital Coordinator Contact: {item.coordinatorPhone}
                  </div>
                </div>

                <div className="bg-deep rounded-2xl p-4 border border-cardtop/50">
                  <div className="flex justify-between text-[11px] mb-2">
                    <span className="text-muted">Workflow Progress</span>
                    <span className="text-primary font-semibold">Step {item.step} of 4</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["1. Accepted", "2. Chat Active", "3. Donated", "4. Confirmed"].map((label, idx) => {
                      const active = idx + 1 <= item.step;
                      return (
                        <div key={label}>
                          <div className={`h-1.5 rounded-full mb-1.5 ${active ? "bg-peach" : "bg-cardtop"}`} />
                          <div className={`text-[11px] ${active ? "text-text font-semibold" : "text-line"}`}>
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate("/chat")}
                    className="px-5 py-2.5 rounded-full bg-card hover:bg-cardhigh text-text text-[13px] font-semibold cursor-pointer"
                  >
                    💬 Open Private Chat
                  </button>
                  {item.step < 4 ? (
                    <button
                      onClick={() => advanceDonorActiveStep(item.id)}
                      className="px-6 py-2.5 rounded-full bg-peach hover:bg-primary text-[#633e2a] text-[13px] font-semibold cursor-pointer"
                    >
                      ✔ {item.step < 3 ? 'Mark as "I\'ve Donated"' : "Confirm Hospital Receipt"}
                    </button>
                  ) : (
                    <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-[12px] font-semibold">
                      ✔ Donation Verified & Logged
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Area Emergency Heatmap */}
            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text">Area Emergency Heatmap</h3>
                <span className="text-[12px] text-line">Radius: {user.matchingRadius} km</span>
              </div>
              <LahoreMapPreview
                title="High Demand Sector: Central Lahore District"
                subtitle="Live Radius"
                pinLabel="Mayo Hospital"
                heightClass="h-48"
              />
            </div>
          </div>

          {/* Right Column */}
          <aside className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text">Donation History</h3>
                <span className="text-[12px] text-line">{user.history.length} Total</span>
              </div>
              <div className="flex flex-col gap-3">
                {user.history.map((h) => (
                  <div key={h.hospital + h.date} className="border-l-2 border-peach pl-3.5 py-0.5">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-semibold text-text">{h.hospital}</span>
                      <span className="text-[11px] text-line">{h.date}</span>
                    </div>
                    <div className="text-[12px] text-muted">{h.type}</div>
                    <div className="text-[11px] text-primary">{h.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col items-center text-center gap-4">
              <div className="w-full text-left font-bold text-text">〰 Donation Readiness</div>
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#4d2b32" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#deab90"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="301.59"
                    strokeDashoffset={301.59 * (1 - readinessPct / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-text">{readinessPct}%</span>
                  <span className="text-[10px] text-primary font-semibold uppercase">READY</span>
                </div>
              </div>
              <p className="text-[12px] text-muted">
                You completed your required 56-day physiological recovery period. Eligible for whole blood & platelets.
              </p>
              <div className="w-full bg-deep rounded-2xl p-3 text-[11px] text-muted border border-cardtop/40">
                Please consult your medical doctor or on-site hemoglobin tester before giving blood.
              </div>
            </div>

            <div className="bg-cardlow rounded-3xl p-5 border border-cardtop/50 flex flex-col gap-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-line mb-1">
                DONOR ACTIONS & SETTINGS
              </div>
              {[
                { label: "Edit Donor Profile", to: "/privacy-settings" },
                { label: "Privacy & Contact Settings", to: "/privacy-settings" },
                { label: "Medical Eligibility Record", to: "/safety-faqs" },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigate(link.to)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card hover:bg-cardhigh text-[13px] text-text font-medium transition cursor-pointer"
                >
                  <span>{link.label}</span>
                  <span className="text-primary">›</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ---------- RECIPIENT CENTRAL DISPATCH (3552:1958) ---------- */
  function RecipientDashboardPage() {
    const {
      requests,
      donors,
      cancelRequest,
      openChatWithDonor,
      openDonorProfile,
      navigate,
      showToast,
      setModal,
    } = useApp();

    const [streamTab, setStreamTab] = useState("live");
    const [showArchiveOnly, setShowArchiveOnly] = useState(false);

    const activeReqs = requests.filter((r) => r.status === "Active");
    const archivedReqs = requests.filter((r) => r.status !== "Active");
    const visibleReqs =
      showArchiveOnly || streamTab === "history"
        ? archivedReqs.length > 0
          ? archivedReqs
          : requests
        : activeReqs.length > 0
        ? activeReqs
        : requests;

    return (
      <div className={`${WRAP} py-8 flex flex-col gap-6`}>
        {/* Emergency Protocol Notice */}
        <div className="bg-cardlow border border-danger/30 rounded-3xl p-4 md:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-danger/20 text-danger flex items-center justify-center font-bold shrink-0">
              ✱
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-danger">
                EMERGENCY PROTOCOL NOTICE
              </div>
              <p className="text-[12px] text-muted">
                Life Link facilitates voluntary peer connections. For acute trauma emergencies, dial your local hospital dispatch directly.
              </p>
            </div>
          </div>
          <a href="tel:1122" className="px-4 py-2 rounded-full bg-card text-[12px] font-semibold text-text shrink-0">
            📞 Emergency Dispatch: 1122
          </a>
        </div>

        {/* Workspace Header */}
        <section className="bg-cardlow rounded-[32px] p-6 md:p-8 border border-cardtop/50 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              PATIENT CASE WORKSPACE • Active Monitoring Enabled
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text mt-1">Recipient Central Dispatch</h1>
            <p className="text-[14px] text-muted mt-1 max-w-xl">
              Manage critical blood requisitions, coordinate with matching neighborhood donors in real-time, and monitor verified courier logistics.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => setShowArchiveOnly((v) => !v)}
              className="btn btn-dark text-[13px] py-2.5 px-5"
            >
              {showArchiveOnly ? "Show All Active" : "Archive Filter"}
            </button>
            <button onClick={() => navigate("/request-blood")} className="btn btn-primary text-[14px] py-2.5 px-6">
              ⊕ + Create New Blood Request
            </button>
          </div>
        </section>

        {/* Operational Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "REQUISITIONS", val: String(requests.length).padStart(2, "0"), sub: "+1 this week", note: "Total cases registered" },
            { label: "DONORS CONNECTED", val: "05", sub: "3 in vicinity", note: "Direct chat lines unlocked" },
            { label: "FULFILLED UNITS", val: "02", sub: "100% matched", note: "Transfusions completed" },
            { label: "MEDIAN RESPONSE", val: "18", sub: "mins", note: "From request to donor confirmation" },
          ].map((m) => (
            <div key={m.label} className="bg-cardlow rounded-3xl p-5 border border-cardtop/50">
              <div className="text-[11px] font-semibold text-line uppercase">{m.label}</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-text">{m.val}</span>
                <span className="text-[12px] text-primary">{m.sub}</span>
              </div>
              <div className="text-[11px] text-muted mt-1">{m.note}</div>
            </div>
          ))}
        </section>

        {/* Main 8/4 Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: Requisition Pipeline */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">Requisition Pipeline</h2>
              <div className="inline-flex bg-cardlow rounded-full p-1 border border-cardtop/50">
                <button
                  onClick={() => {
                    setStreamTab("live");
                    setShowArchiveOnly(false);
                  }}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer ${
                    streamTab === "live" ? "bg-cardtop text-primary" : "text-muted"
                  }`}
                >
                  Live Stream
                </button>
                <button
                  onClick={() => setStreamTab("history")}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer ${
                    streamTab === "history" ? "bg-cardtop text-primary" : "text-muted"
                  }`}
                >
                  History Log
                </button>
              </div>
            </div>

            {visibleReqs.map((r) => {
              const primaryInvite = r.invitedDonors[0];
              const primaryDonor = donors.find((d) => d.id === primaryInvite?.donorId) || donors[0];
              return (
                <article
                  key={r.id}
                  className={`rounded-3xl p-6 border shadow-xl flex flex-col gap-4 ${
                    r.status === "Active" ? "bg-cardlow border-peach/40" : "bg-cardlow border-cardtop/50 opacity-90"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-cardhigh flex flex-col items-center justify-center shrink-0">
                        <span className="font-bold text-primary leading-none">{r.blood}</span>
                        <span className="text-[9px] text-muted mt-0.5">{r.units}U</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="text-line">ID: #{r.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              r.status === "Active"
                                ? "bg-danger/20 text-danger"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {r.status === "Active" ? `${r.urgency.toUpperCase()} PRIORITY` : r.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-text mt-0.5">{r.hospital}</h3>
                        <div className="text-[12px] text-muted">{r.ward} • Patient: {r.patient}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-line">{r.requestedAgo}</div>
                      <span className="inline-block mt-1 px-3 py-1 rounded-full bg-card text-[11px] text-primary font-semibold">
                        ● {r.invitedDonors.length} Donors Invited
                      </span>
                    </div>
                  </div>

                  {r.status === "Active" ? (
                    <>
                      <div className="bg-deep rounded-2xl p-4 border border-cardtop/40">
                        <div className="flex justify-between text-[11px] mb-2">
                          <span className="text-primary font-semibold">
                            Current Phase: Donor Coordination & Screen Test
                          </span>
                          <span className="text-muted">Stage {r.stage} of 5</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {["Created", "Matched", "Transit / Screening", "Transfusion Ready"].map((s, idx) => (
                            <div key={s}>
                              <div className={`h-1.5 rounded-full mb-1 ${idx + 1 <= r.stage ? "bg-peach" : "bg-cardtop"}`} />
                              <div className="text-[10px] text-muted">{s}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2.5 text-[12px] text-muted">
                          <span className="w-8 h-8 rounded-full bg-cardtop text-primary font-bold flex items-center justify-center">
                            {primaryDonor.initials}
                          </span>
                          <span>
                            <strong className="text-text">{primaryDonor.name}</strong> ({primaryInvite?.status || "Invited"}, {primaryDonor.km} km away)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => cancelRequest(r.id)}
                            className="px-4 py-2 rounded-full bg-card hover:bg-cardhigh text-muted hover:text-danger text-[12px] font-semibold cursor-pointer"
                          >
                            Cancel Requisition
                          </button>
                          <button
                            onClick={() => openChatWithDonor(primaryDonor.id)}
                            className="px-4 py-2 rounded-full bg-card hover:bg-cardhigh text-text text-[12px] font-semibold cursor-pointer"
                          >
                            💬 Coordinator Chat
                          </button>
                          <button
                            onClick={() => navigate("/request-track", { id: r.id })}
                            className="px-5 py-2 rounded-full bg-peach hover:bg-primary text-[#633e2a] text-[12px] font-semibold cursor-pointer"
                          >
                            Track Dispatch
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-cardtop/40">
                      <span className="text-[12px] text-muted">{r.notes}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setModal({
                              eyebrow: "VERIFIED LAB RECEIPT",
                              title: `Medical Receipt • #${r.id}`,
                              body: (
                                <div className="flex flex-col gap-2 text-[13px]">
                                  <p><strong>Hospital:</strong> {r.hospital}</p>
                                  <p><strong>Blood Group:</strong> {r.blood} ({r.units} Unit)</p>
                                  <p><strong>Lab Reference:</strong> {r.labId}</p>
                                  <p><strong>Attending Officer:</strong> {r.doctor}</p>
                                  <p className="text-emerald-400 font-semibold pt-2">✔ Transfusion Screening & Cross-Match Cleared</p>
                                </div>
                              ),
                            })
                          }
                          className="px-4 py-2 rounded-full bg-card hover:bg-cardhigh text-text text-[12px] font-semibold cursor-pointer"
                        >
                          View Medical Receipt
                        </button>
                        <button
                          onClick={() => showToast("Thank you! Donor impact rating recorded.")}
                          className="px-4 py-2 rounded-full bg-cardhigh hover:bg-cardtop text-primary text-[12px] font-semibold cursor-pointer"
                        >
                          ★ Rate Experience
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {/* Spatial Monitoring Card */}
            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-text">Emergency Transit Proximity</h3>
                  <p className="text-[12px] text-muted">Live telemetry around Mayo Central and Jinnah Care District</p>
                </div>
                <span className="text-[11px] text-primary font-semibold">● GPS HUB SYNCED</span>
              </div>
              <LahoreMapPreview
                title="Donor ETA: 8 minutes via Mall Rd"
                actionLabel="Enlarge Radius"
                onAction={() => navigate("/find-donors")}
                pinLabel="Mayo Hospital"
                heightClass="h-44"
              />
            </div>
          </div>

          {/* Right: Matched Nearby Donors */}
          <aside className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-text">Matched Nearby Donors</h3>
                  <p className="text-[11px] text-muted">Eligible & active for O+ / B-</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-card text-[10px] text-primary font-semibold">
                  2/3 slots filled
                </span>
              </div>

              {donors.slice(6, 9).map((d) => (
                <div key={d.id} className="bg-card rounded-2xl p-4 border border-cardtop/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => openDonorProfile(d.id)}
                      className="flex items-center gap-3 text-left cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-cardtop text-primary font-bold flex items-center justify-center">
                        {d.initials}
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-text hover:text-primary">{d.name}</div>
                        <div className="text-[11px] text-muted">📍 {d.km} km • {d.shortArea}</div>
                      </div>
                    </button>
                    <span className="px-2.5 py-1 rounded-full bg-cardhigh text-primary text-[12px] font-bold">
                      {d.blood}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>Donated {d.times} times • {d.last}</span>
                    <span className="text-emerald-400">{d.seen}</span>
                  </div>
                  <button
                    onClick={() => openChatWithDonor(d.id)}
                    className="w-full py-2 rounded-full bg-peach hover:bg-primary text-[#633e2a] text-[12px] font-semibold transition cursor-pointer"
                  >
                    ✉ Send Requisition Invite
                  </button>
                </div>
              ))}

              <button
                onClick={() => navigate("/find-donors")}
                className="text-center text-[12px] font-semibold text-primary hover:text-text cursor-pointer pt-1"
              >
                Browse 18 More Donors in Sector ›
              </button>
            </div>

            <div className="bg-cardlow rounded-3xl p-5 border border-cardtop/50 flex flex-col gap-2">
              <h4 className="font-bold text-text text-[14px]">🛡 Transfusion Safety Check</h4>
              <p className="text-[12px] text-muted leading-relaxed">
                Every voluntary donor unit requires cross-matching verification by the hospital blood bank before infusion. Never proceed without clinical screening.
              </p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ---------- DONOR PROFILE (3552:2910) ---------- */
  function DonorProfilePage() {
    const {
      params,
      donors,
      activeDonorProfileId,
      toggleSelectDonor,
      selectedDonorIds,
      openChatWithDonor,
      navigate,
    } = useApp();

    const donorId = Number(params.id || activeDonorProfileId || 1);
    const donor = donors.find((d) => d.id === donorId) || donors[0];
    const compatibleRecipients = BLOOD_COMPATIBILITY[donor.blood] || [donor.blood];
    const isSelected = selectedDonorIds.includes(donor.id);

    return (
      <div className={`${WRAP} py-8 flex flex-col gap-6`}>
        <div className="text-[12px] text-muted">
          <button onClick={() => navigate("/find-donors")} className="hover:text-primary cursor-pointer">
            🔍 Find Donors
          </button>{" "}
          › Donor Profile › <span className="text-text font-semibold">{donor.name} ({donor.blood})</span>
        </div>

        {/* Hero Profile Bento */}
        <section className="bg-cardlow rounded-[32px] p-6 md:p-8 border border-cardtop/50 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-24 h-24 rounded-full bg-cardtop border-2 border-peach/60 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
              {donor.initials}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-bold text-text">{donor.name}</h1>
                <span className="px-3 py-1 rounded-full bg-cardhigh text-primary text-[11px] font-semibold">
                  🏅 Platform Verified Donor
                </span>
              </div>
              <div className="text-[12px] text-emerald-400 font-medium">
                ● {donor.seen} • {donor.confirmedAgo}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="px-3.5 py-1 rounded-full bg-peach text-[#633e2a] font-bold text-[14px]">
                  {donor.blood}
                </span>
                <span className="text-[14px] text-text font-medium">
                  {donor.blood === "O-" ? "Universal Blood Donor" : "Verified Red Blood Cell Donor"}
                </span>
              </div>
              <div className="text-[12px] text-muted">
                📍 {donor.area} • ~{donor.km} km from your designated facility
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => {
                if (!isSelected) toggleSelectDonor(donor.id);
                navigate("/find-donors");
              }}
              className="btn btn-primary"
            >
              📣 {isSelected ? "Selected for Request" : "Invite to Active Request"}
            </button>
            <button onClick={() => openChatWithDonor(donor.id)} className="btn btn-dark">
              🔒 Message Donor (Encrypted)
            </button>
          </div>
        </section>

        {/* Asymmetric 7/5 Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-2xl bg-cardhigh flex items-center justify-center">🪪</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-card text-[10px] text-primary">Tier 1 Certified</span>
                </div>
                <h2 className="text-lg font-bold text-text">Identity Verification</h2>
                <p className="text-[12px] text-primary font-semibold">Platform Verified (Academic Demo Sample)</p>
                <p className="text-[12px] text-muted leading-relaxed">
                  Government ID document hash confirmed. Biometric identity matches platform registration archive.
                </p>
                <div className="text-[11px] text-emerald-400 pt-1">✔ Valid through December 2026</div>
              </div>

              <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-2xl bg-cardhigh flex items-center justify-center">🩸</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-danger/20 text-danger text-[10px]">Laboratory Alert</span>
                </div>
                <h2 className="text-lg font-bold text-text">Blood Group Verification</h2>
                <p className="text-[12px] text-primary font-semibold">Self-Reported {donor.blood}</p>
                <div className="bg-deep rounded-2xl p-3 text-[11px] text-muted border border-cardtop/40">
                  <strong className="text-text">Clinical Disclaimer:</strong> Self-reported status. Authorized hospital cross-matching required prior to transfusion.
                </div>
                <div className="text-[11px] text-line">Last clinical lab match: {donor.lastMatch || "Fatimid FDN"}</div>
              </div>
            </div>

            <div className="bg-cardlow rounded-3xl p-5 border border-cardtop/50 flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-cardhigh flex items-center justify-center shrink-0">🛡</span>
              <div>
                <div className="text-[13px] font-bold text-text">
                  Life Link Safe Interaction Protocol <span className="text-primary text-[11px] ml-2">Zero-Leakage</span>
                </div>
                <p className="text-[12px] text-muted mt-1 leading-relaxed">
                  Phone number and exact coordinates are kept confidential. Direct coordinates will not be revealed until both hospital registrar and voluntary donor confirm an active requisition dispatch.
                </p>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary">SERVICE LOG</div>
                  <h2 className="text-xl font-bold text-text">Recent Donation Milestones</h2>
                </div>
                <span className="text-[12px] text-line">{donor.times} platform records</span>
              </div>
              <div className="flex flex-col gap-4">
                {(donor.milestones || []).map((m) => (
                  <div key={m.org + m.date} className="border-l-2 border-peach pl-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-text">{m.org}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-card text-[10px] text-primary">{m.tag}</span>
                      </div>
                      <span className="text-[11px] text-line">{m.date}</span>
                    </div>
                    <p className="text-[12px] text-muted mt-1">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                DONOR READINESS STATUS
              </div>
              <h3 className="text-lg font-bold text-text mt-1">Standard Rest Interval Satisfied</h3>
              <p className="text-[13px] text-muted mt-1 leading-relaxed">
                {donor.name.split(" ")[0]} has cleared the 90-day biological recovery window for whole blood donations. Hemoglobin is projected within optimal physiological thresholds (&gt;13.0 g/dL).
              </p>
            </div>
          </div>

          <aside className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary">RELIABILITY INDEX</div>
                <h2 className="text-xl font-bold text-text">Donation Statistics</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Verified Donations", val: donor.times, sub: "Successful Donations" },
                  { label: "Commitment Rate", val: `${donor.reliability}%`, sub: "Reliability Score" },
                  { label: "Median Response", val: donor.reply, sub: "Instant App Alerts" },
                  { label: "Last Donation", val: donor.last, sub: "Eligible & Ready", good: true },
                ].map((s) => (
                  <div key={s.label} className="bg-card rounded-2xl p-4 border border-cardtop/40">
                    <div className="text-[11px] text-muted">{s.label}</div>
                    <div className="text-2xl font-bold text-text mt-1">{s.val}</div>
                    <div className={`text-[11px] mt-0.5 ${s.good ? "text-emerald-400" : "text-line"}`}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="bg-deep rounded-2xl p-4 flex items-center justify-between gap-4 border border-cardtop/40">
                <div>
                  <div className="text-[13px] font-bold text-text">Honor Donor Tier</div>
                  <div className="text-[11px] text-muted">2 more donations until Silver Badge milestone.</div>
                </div>
                <div className="relative w-14 h-14 shrink-0">
                  <svg viewBox="0 0 60 60" className="-rotate-90 w-full h-full">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="#4d2b32" strokeWidth="5" />
                    <circle
                      cx="30"
                      cy="30"
                      r="24"
                      fill="none"
                      stroke="#deab90"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="150.8"
                      strokeDashoffset="37.7"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-text">
                    75%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary">VICINITY PERIMETER</div>
                  <h2 className="text-lg font-bold text-text">{donor.shortArea} Medical Hub</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-card text-[10px] text-muted">● Fuzzy Geofence</span>
              </div>
              <LahoreMapPreview
                title="Within 15 min driving range"
                subtitle="Approximate zone"
                pinLabel={donor.shortArea}
                heightClass="h-44"
              />
            </div>

            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-3">
              <h3 className="text-[15px] font-bold text-text">🩸 {donor.blood} Recipient Compatibility</h3>
              <p className="text-[12px] text-muted">
                As an {donor.blood} donor, {donor.name.split(" ")[0]}'s red blood cells can be transfused to patients with these blood types:
              </p>
              <div className="flex flex-wrap gap-2">
                {compatibleRecipients.map((bg, i) => (
                  <span
                    key={bg}
                    className={`px-3 py-1 rounded-full text-[12px] font-semibold ${
                      i === 0 ? "bg-cardhigh text-primary border border-peach/40" : "bg-card text-text"
                    }`}
                  >
                    {bg} {i === 0 ? "(Match)" : ""}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return {
    DonorDashboardPage,
    RecipientDashboardPage,
    DonorProfilePage,
  };
})();
