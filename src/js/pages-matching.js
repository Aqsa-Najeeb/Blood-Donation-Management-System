const { useEffect, useState } = React;

window.LifeLinkMatchingPages = (() => {
  const { BLOOD_GROUPS, BLOOD_COMPATIBILITY, useApp } = window.LifeLink;
  const { WRAP, LahoreMapPreview } = window.LifeLinkComponents;

  /* ---------- FIND DONORS PAGE (3552:505) ---------- */
  function FindDonorsPage() {
    const {
      params,
      donors,
      selectedDonorIds,
      toggleSelectDonor,
      setSelectedDonorIds,
      sendRequestsToSelected,
      openDonorProfile,
      openChatWithDonor,
      navigate,
      setModal,
    } = useApp();

    const [blood, setBlood] = useState(params.blood || "O+");
    const [radius, setRadius] = useState(15);
    const [onlyOnline, setOnlyOnline] = useState(false);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("near");

    useEffect(() => {
      if (params.blood && BLOOD_GROUPS.includes(params.blood)) {
        setBlood(params.blood);
      }
    }, [params.blood]);

    const filtered = donors
      .filter((d) => blood === "All" || d.blood === blood)
      .filter((d) => radius === "All" || d.km <= radius)
      .filter((d) => !onlyOnline || d.online)
      .filter(
        (d) =>
          !search.trim() ||
          d.area.toLowerCase().includes(search.toLowerCase()) ||
          d.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => (sort === "near" ? a.km - b.km : b.times - a.times));

    return (
      <div className={`${WRAP} pt-8 pb-32 flex flex-col gap-6`}>
        {/* Top Control & Search Filtering Console */}
        <section className="bg-cardlow rounded-[32px] p-6 md:p-8 shadow-xl border border-cardtop/50 flex flex-col gap-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-[0.65px]">
                <span className="w-2 h-2 rounded-full bg-peach" />
                EMERGENCY DONOR DISCOVERY • LAHORE DIVISION
              </div>
              <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-text mt-1">
                Find Matched Voluntary Donors
              </h1>
              <p className="text-[13px] text-muted mt-1">
                Approximate perimeter locator. Direct hospital cross-matching protocol applies.
              </p>
            </div>

            <div className="bg-card px-5 py-3 rounded-full border border-cardtop flex items-center gap-3 self-start xl:self-center">
              <span className="text-[13px] font-medium text-text">Selected Donors:</span>
              <span className="px-3 py-0.5 rounded-full bg-peach text-[#633e2a] text-[12px] font-bold">
                {selectedDonorIds.length} / 3
              </span>
              <span className="text-[11px] text-line hidden sm:inline">(Max 3 per active request)</span>
            </div>
          </div>

          {/* Blood Group Pills Row */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <span className="text-[13px] font-semibold text-muted shrink-0">Blood Group:</span>
            <div className="flex flex-wrap gap-2">
              {["All", ...BLOOD_GROUPS].map((b) => (
                <button
                  key={b}
                  onClick={() => setBlood(b)}
                  className={`px-4 py-2 rounded-full text-[14px] font-semibold transition cursor-pointer ${
                    blood === b
                      ? "bg-peach text-[#633e2a] shadow-md"
                      : "bg-cardhigh text-muted hover:text-text"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Locality, Radius and Immediate Toggle */}
          <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-4 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search locality or donor (e.g. Gulberg, Model Town)"
                className="input-pill bg-card pl-10"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-line text-sm">📍</span>
            </div>

            <div className="lg:col-span-5 flex items-center bg-card p-1.5 rounded-full border border-cardtop/40">
              <span className="px-3 text-[11px] font-medium text-muted hidden sm:inline">Perimeter:</span>
              <div className="grid grid-cols-4 w-full gap-1">
                {[5, 15, 25, "All"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`py-2 rounded-full text-[12px] transition cursor-pointer ${
                      radius === r ? "bg-cardtop text-primary font-semibold" : "text-muted hover:text-text"
                    }`}
                  >
                    {r === "All" ? "All" : `${r} km`}
                  </button>
                ))}
              </div>
            </div>

            <label className="lg:col-span-3 flex items-center justify-between gap-3 bg-card px-5 h-12 rounded-full cursor-pointer border border-cardtop/40">
              <span className="text-[12px] font-medium text-muted">Only Available Donors</span>
              <button
                type="button"
                role="switch"
                aria-checked={onlyOnline}
                onClick={() => setOnlyOnline((v) => !v)}
                className={`w-11 h-6 rounded-full p-0.5 transition cursor-pointer ${
                  onlyOnline ? "bg-peach" : "bg-cardtop"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-surface transition-transform ${
                    onlyOnline ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          </div>
        </section>

        {/* Active Discovery Stats & Sorting Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-text">
              Showing {filtered.length} Verified {filtered.length === 1 ? "Donor" : "Donors"}
            </h2>
            <span className="text-[13px] text-line">• near Lahore, Punjab</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-cardlow border border-cardtop text-text text-[13px] py-2 px-4 rounded-full outline-none cursor-pointer"
            >
              <option value="near">Nearest First (~3 km)</option>
              <option value="count">Most Donations</option>
            </select>
          </div>
        </div>

        {/* Main 8/4 Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-4">
            {filtered.length === 0 ? (
              <div className="bg-cardlow rounded-3xl p-10 text-center border border-cardtop/40">
                <p className="font-semibold text-text text-lg">No donors match these filters.</p>
                <p className="text-[13px] text-muted mt-1">
                  Try widening your distance radius, selecting "All" blood groups, or turning off "Only Available Donors".
                </p>
                <button
                  onClick={() => {
                    setBlood("All");
                    setRadius("All");
                    setOnlyOnline(false);
                    setSearch("");
                  }}
                  className="btn btn-primary mt-5"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filtered.map((d) => {
                const isSelected = selectedDonorIds.includes(d.id);
                return (
                  <article
                    key={d.id}
                    className={`rounded-3xl p-6 shadow-xl border transition flex flex-col gap-4 ${
                      isSelected
                        ? "bg-card border-peach/60"
                        : "bg-cardlow hover:bg-card border-cardtop/50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-full bg-cardtop flex items-center justify-center text-xl font-bold text-primary">
                            {d.initials}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-surface ${
                              d.online ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold text-text">{d.name}</h3>
                            {d.verified && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                                ✔ Platform Verified
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted mt-1">
                            <span className="text-primary">~{d.km} km away ({d.area})</span>
                            <span className="text-line">•</span>
                            <span className={d.online ? "text-emerald-400" : "text-amber-300"}>{d.seen}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                        <div className="h-11 px-4 rounded-full bg-peach text-[#633e2a] text-xl font-bold flex items-center">
                          {d.blood}
                        </div>
                        <span className="text-[11px] text-muted">Last donation: {d.last}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-surface/60 text-[11px] text-muted border border-cardtop/40">
                        Self-Reported Blood Group
                      </span>
                      <span className="px-3 py-1 rounded-full bg-surface/60 text-[11px] text-muted border border-cardtop/40">
                        {d.times} Times Donor
                      </span>
                      <span className="px-3 py-1 rounded-full bg-surface/60 text-[11px] text-muted border border-cardtop/40">
                        Avg response: {d.reply}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => openDonorProfile(d.id)}
                          className="text-[13px] font-semibold text-primary hover:text-text transition cursor-pointer"
                        >
                          View Clinical Profile & Chat →
                        </button>
                        <button
                          onClick={() => openChatWithDonor(d.id)}
                          className="text-[12px] text-muted hover:text-primary transition cursor-pointer"
                        >
                          Quick Message
                        </button>
                      </div>

                      {d.pending ? (
                        <button
                          disabled
                          className="px-6 py-2.5 rounded-full bg-surface/70 text-muted text-[14px] font-semibold border border-cardtop cursor-default"
                        >
                          ⏳ Request Sent • Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleSelectDonor(d.id)}
                          className={`px-6 py-2.5 rounded-full text-[14px] font-semibold transition cursor-pointer ${
                            isSelected
                              ? "bg-cardtop text-primary hover:bg-[#5b343c]"
                              : "bg-peach text-[#633e2a] hover:bg-primary"
                          }`}
                        >
                          {isSelected ? "✔ Donor Selected" : "+ Select for Request"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Sticky Right Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="bg-cardlow rounded-3xl p-6 shadow-xl border border-cardtop/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text">Coverage Radius</h3>
                <span className="text-[11px] text-primary font-semibold">Zone View</span>
              </div>
              <p className="text-[12px] text-muted leading-relaxed">
                In accordance with privacy guidelines, precise residential coordinates are obscured. Displays approximate safety perimeters.
              </p>
              <LahoreMapPreview
                title={`Radial Range: ${radius === "All" ? "City-wide" : `${radius} km Radius`}`}
                subtitle="Auto-calibrated"
                pinLabel="Your Hospital Target"
                heightClass="h-48"
              />
            </div>

            <div className="bg-cardlow rounded-3xl p-6 shadow-xl border border-cardtop/50 flex flex-col gap-3">
              <h3 className="text-lg font-bold text-text">Transfusion Safety Notice</h3>
              <p className="text-[13px] text-muted leading-relaxed">
                Matching reported blood groups serves as an initial digital discovery filter.{" "}
                <span className="text-text font-semibold">
                  Authorized hospital laboratory cross-matching is strictly required
                </span>{" "}
                prior to any patient administration.
              </p>
              <ul className="bg-deep rounded-2xl p-4 text-[12px] text-muted flex flex-col gap-2">
                <li>✔ Voluntary donors will never request monetary payment.</li>
                <li>✔ Confirm recipient compatibility via certified blood bank lab.</li>
              </ul>
              <button
                onClick={() =>
                  setModal({
                    eyebrow: "PROTOCOL v2.4 CERTIFIED",
                    title: "Transfusion Protocol Guide",
                    body: (
                      <div className="flex flex-col gap-2">
                        <p>1. Never bypass hospital laboratory ABO/Rh and infectious disease screening.</p>
                        <p>2. Keep request invitations capped at 3 donors per cycle to avoid hospital crowding.</p>
                        <p>3. Coordinate exclusively via Life Link masked chat until donor check-in.</p>
                      </div>
                    ),
                    confirmLabel: "Open Safety & FAQs",
                    onConfirm: () => navigate("/safety-faqs"),
                  })
                }
                className="text-left text-[12px] font-semibold text-primary hover:text-text cursor-pointer"
              >
                Read Transfusion Protocol Guide ↗
              </button>
            </div>

            <div className="bg-cardhigh rounded-3xl p-4 shadow-lg border border-cardtop flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-text">Immediate Hotline</div>
                <div className="text-[12px] text-muted">24/7 Clinical Coordination</div>
              </div>
              <a
                href="tel:1122"
                className="px-4 py-2 rounded-full bg-card hover:bg-cardtop text-[13px] font-bold text-text transition"
              >
                1122
              </a>
            </div>
          </aside>
        </div>

        {/* Floating Selection Action Bar */}
        {selectedDonorIds.length > 0 && (
          <div className="fixed bottom-5 inset-x-0 z-40 px-5 pointer-events-none">
            <div className="max-w-[820px] mx-auto pointer-events-auto bg-cardhigh/95 backdrop-blur-xl rounded-full p-3 pl-5 shadow-2xl border border-peach/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-peach text-[#633e2a] font-bold flex items-center justify-center">
                  {selectedDonorIds.length}
                </div>
                <div>
                  <div className="font-bold text-[14px] text-text">
                    {selectedDonorIds.length} {selectedDonorIds.length === 1 ? "Donor" : "Donors"} Selected
                  </div>
                  <div className="text-[11px] text-muted hidden sm:block">
                    Emergency notifications queued for Lahore Region
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDonorIds([])}
                  className="px-3 py-2 text-[13px] text-muted hover:text-text cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => sendRequestsToSelected()}
                  className="px-6 py-2.5 rounded-full bg-peach hover:bg-primary text-[#633e2a] font-semibold text-[14px] transition cursor-pointer whitespace-nowrap"
                >
                  Send Requests to Selected ({selectedDonorIds.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- CREATE BLOOD REQUEST PAGE (3552:1041) ---------- */
  function CreateRequestPage() {
    const { navigate, createBloodRequest, showToast } = useApp();
    const [blood, setBlood] = useState("O-");
    const [units, setUnits] = useState(2);
    const [caseCategory, setCaseCategory] = useState("Scheduled Surgical Intervention");
    const [urgency, setUrgency] = useState("Urgent");
    const [hospital, setHospital] = useState("Services Hospital, Ward 4B");
    const [city, setCity] = useState("Lahore, Punjab");
    const [requiredBy, setRequiredBy] = useState("");
    const [notes, setNotes] = useState(
      "Patient undergoing scheduled cardiac surgery; need verified replacement donors."
    );

    const bloodSub = {
      "A+": "Common",
      "A-": "Rare",
      "B+": "Common",
      "B-": "Rare",
      "AB+": "Universal Rec.",
      "AB-": "1% Rare",
      "O+": "High Need",
      "O-": "Universal",
    };

    const addTagChip = (chip) => {
      if (!notes.includes(chip)) {
        setNotes((prev) => (prev ? `${prev} • ${chip}` : chip));
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!hospital.trim() || !city.trim()) {
        showToast("Please specify both Hospital/Facility Name and City.", "warn");
        return;
      }
      const newId = await createBloodRequest({
        blood,
        units,
        caseCategory,
        urgency,
        hospital,
        city,
        requiredBy: requiredBy || (urgency === "Emergency" ? "Immediate (Sub-3h)" : "Within 12 hours"),
        notes,
      });
      if (newId) {
        navigate("/request-track", { id: newId });
      }
    };

    return (
      <div className={`${WRAP} py-8 max-w-4xl flex flex-col gap-6`}>
        <div className="flex items-center justify-between text-[12px] text-muted">
          <button onClick={() => navigate("/recipient-dashboard")} className="hover:text-primary cursor-pointer">
            ← Back to Dashboard
          </button>
          <span className="px-3 py-1 rounded-full bg-cardlow border border-cardtop text-primary">
            ● Active Dispatch Network • 1420 Donors Online
          </span>
        </div>

        <div className="text-center flex flex-col items-center gap-2">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-widest">
            LIFE LINK DISPATCH
          </span>
          <h1 className="text-4xl font-bold text-text">Create Blood Request</h1>
          <p className="text-[14px] text-muted max-w-xl">
            Broadcast your clinical requirement to eligible matched donors nearby. Up to 3 verified donors will be actively alerted.
          </p>
        </div>

        {/* Emergency Warning Notice */}
        <div className="bg-cardlow border border-danger/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-danger/20 text-danger flex items-center justify-center shrink-0 font-bold">
              ▲
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[14px] text-text">Medical Emergency Protocol Notice</span>
                <span className="px-2 py-0.5 rounded bg-danger text-[#250a11] text-[10px] font-bold">URGENT</span>
              </div>
              <p className="text-[12px] text-muted mt-1">
                This platform facilitates voluntary donor connections and is{" "}
                <strong className="text-text">not a certified ambulance or emergency triage dispatch</strong>.
                Contact hospital emergency services immediately for acute crisis.
              </p>
            </div>
          </div>
          <a href="tel:1122" className="px-4 py-2 rounded-full bg-card text-[12px] font-semibold text-text shrink-0">
            📞 Emergency Hotline
          </a>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Section 1 */}
          <div className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/50 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-primary">01</div>
                <h2 className="text-xl font-bold text-text">Patient & Blood Requirement</h2>
                <p className="text-[12px] text-muted">Specify blood type compatibility and volume demanded.</p>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text mb-3">Blood Group Required *</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    type="button"
                    key={bg}
                    onClick={() => setBlood(bg)}
                    className={`rounded-2xl py-3 px-2 text-center border transition cursor-pointer ${
                      blood === bg
                        ? "bg-peach text-[#633e2a] border-primary shadow-md"
                        : "bg-card text-text border-cardtop hover:bg-cardhigh"
                    }`}
                  >
                    <div className="text-lg font-bold">{bg}</div>
                    <div className={`text-[10px] ${blood === bg ? "text-[#633e2a]/80" : "text-muted"}`}>
                      {bloodSub[bg]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-text mb-2">Quantity Needed (Units)</label>
                <div className="flex items-center justify-between bg-surface/80 border border-cardtop rounded-full px-4 h-12">
                  <button
                    type="button"
                    onClick={() => setUnits((u) => Math.max(1, u - 1))}
                    className="w-8 h-8 rounded-full bg-card hover:bg-cardhigh text-text font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <div className="text-[14px] font-bold text-text">
                    {units} <span className="text-[11px] font-normal text-muted">Bag(s) • {units * 450} ml</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnits((u) => Math.min(6, u + 1))}
                    className="w-8 h-8 rounded-full bg-card hover:bg-cardhigh text-text font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-text mb-2">Recipient Case Category</label>
                <select
                  value={caseCategory}
                  onChange={(e) => setCaseCategory(e.target.value)}
                  className="input-pill bg-surface/80"
                >
                  <option>Scheduled Surgical Intervention</option>
                  <option>Intensive Care Unit (ICU)</option>
                  <option>Emergency Trauma Dispatch</option>
                  <option>Thalassemia / Oncology Support</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-semibold text-text">Urgency Level *</label>
                <span className="text-[11px] text-line">Impacts alert radius & frequency</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { id: "Standard", sub: "Within 48 hours", note: "Local network matching" },
                  { id: "Urgent", sub: "Within 12 hours", note: "Fast-track alerts across 15km" },
                  { id: "Emergency", sub: "Immediate (Sub-3h)", note: "Direct SMS push to active donors" },
                ].map((lvl) => (
                  <button
                    type="button"
                    key={lvl.id}
                    onClick={() => setUrgency(lvl.id)}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      urgency === lvl.id
                        ? "bg-cardhigh border-peach shadow-md"
                        : "bg-card border-cardtop/50 hover:bg-cardhigh/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[15px] text-text">{lvl.id}</span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          urgency === lvl.id ? "border-peach bg-peach" : "border-line"
                        }`}
                      />
                    </div>
                    <div className="text-[12px] text-primary mt-1">{lvl.sub}</div>
                    <div className="text-[11px] text-muted mt-0.5">{lvl.note}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/50 flex flex-col gap-5">
            <div>
              <div className="text-[11px] font-bold text-primary">02</div>
              <h2 className="text-xl font-bold text-text">Hospital & Facility Details</h2>
              <p className="text-[12px] text-muted">Accurate location ensures donors reach the correct transfusion center.</p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text mb-2">Medical Facility / Hospital Name *</label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="input-pill"
                placeholder="e.g. Mayo Hospital, ICU Ward 2"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-text mb-2">City & Area *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-pill"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-text mb-2">Required By (Date & Time) *</label>
                <input
                  type="datetime-local"
                  value={requiredBy}
                  onChange={(e) => setRequiredBy(e.target.value)}
                  className="input-pill"
                />
              </div>
            </div>

            <LahoreMapPreview
              title={hospital || "Lahore Central Medical Corridor"}
              subtitle="Radius: 10 km"
              pinLabel={hospital.split(",")[0] || "Hospital Pin"}
              heightClass="h-44"
            />
          </div>

          {/* Section 3 */}
          <div className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/50 flex flex-col gap-4">
            <div>
              <div className="text-[11px] font-bold text-primary">03</div>
              <h2 className="text-xl font-bold text-text">Additional Medical Notes</h2>
              <p className="text-[12px] text-muted">Provide critical procedural guidance for potential donors.</p>
            </div>

            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-box"
            />

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-line mr-1">Quick Presets:</span>
              {["Fasting Not Required", "Replacement Exchange", "Platelet Apheresis"].map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => addTagChip(chip)}
                  className="px-3 py-1 rounded-full bg-card hover:bg-cardhigh text-muted hover:text-text border border-cardtop cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Notice + Actions */}
          <div className="bg-cardlow rounded-3xl p-5 border border-cardtop/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-cardhigh flex items-center justify-center shrink-0">🛡</span>
              <div>
                <div className="text-[13px] font-semibold text-text">Protected Patient Privacy Shield</div>
                <p className="text-[12px] text-muted">
                  Your direct phone number and residential address remain strictly confidential via Life Link encrypted in-app messaging.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-card text-primary text-[11px] font-semibold shrink-0">
              🔒 HIPAA Aligned
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => showToast("Draft saved locally in your browser.", "info")}
              className="px-6 py-3 rounded-full bg-card hover:bg-cardhigh text-text text-[14px] font-semibold cursor-pointer"
            >
              Save as Draft
            </button>

            <div className="flex items-center gap-4">
              <span className="text-[12px] text-muted">Avg response time: <strong className="text-text">14 mins</strong></span>
              <button type="submit" className="btn btn-primary px-8 py-3.5">
                ➤ Submit Request & Find Donors
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  /* ---------- REQUEST TRACKING PAGE (3552:3322) ---------- */
  function RequestTrackPage() {
    const {
      params,
      requests,
      donors,
      activeRequestId,
      setActiveRequestId,
      updateRequestStage,
      reactivateStandbyDonor,
      cancelRequest,
      openChatWithDonor,
      openDonorProfile,
      navigate,
      showToast,
      setModal,
    } = useApp();

    const currentReqId = params.id || activeRequestId;
    const req = requests.find((r) => r.id === currentReqId) || requests[0];
    if (!req) return null;

    const stages = [
      { n: 1, title: "1. Request Broadcasted", sub: "3 Donors Pinged" },
      { n: 2, title: "2. Donor Accepted", sub: "Primary Confirmed" },
      { n: 3, title: "3. Hospital Transit", sub: "En Route • ETA ~25m" },
      { n: 4, title: "4. Donation & Cross-Match", sub: "Lab verification" },
      { n: 5, title: "5. Transfusion Confirmed", sub: "Final Patient Release" },
    ];

    const activeDonorInvite = req.invitedDonors.find((d) => d.status === "Accepted") || req.invitedDonors[0];
    const activeDonor = donors.find((d) => d.id === activeDonorInvite?.donorId) || donors[0];
    const compatible = BLOOD_COMPATIBILITY[activeDonor?.blood || "O+"]?.includes(req.blood);

    return (
      <div className={`${WRAP} py-8 flex flex-col gap-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
          <div className="text-muted">
            <button onClick={() => navigate("/recipient-dashboard")} className="hover:text-primary cursor-pointer">
              Requests
            </button>{" "}
            / <span className="text-text font-semibold">Request #{req.id} Tracking Pipeline</span>
          </div>

          <div className="flex items-center gap-3">
            {requests.length > 1 && (
              <select
                value={req.id}
                onChange={(e) => {
                  setActiveRequestId(e.target.value);
                  navigate("/request-track", { id: e.target.value });
                }}
                className="bg-cardlow border border-cardtop rounded-full px-4 py-1.5 text-text text-[12px] outline-none cursor-pointer"
              >
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    #{r.id} • {r.blood} ({r.status})
                  </option>
                ))}
              </select>
            )}
            <span className="text-primary font-semibold">● LIVE EMERGENCY TRACKING ACTIVE</span>
          </div>
        </div>

        {/* Hero Request Overview Banner */}
        <section className="bg-cardlow rounded-[32px] p-6 md:p-8 border border-cardtop/50 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="px-3 py-1 rounded-full bg-danger/20 text-danger">! {req.urgency}</span>
              <span className="px-3 py-1 rounded-full bg-cardhigh text-primary">● {req.status} — Stage {req.stage}/5</span>
              <span className="px-3 py-1 rounded-full bg-card text-muted">Blood Group: {req.blood}</span>
            </div>
            <h1 className="text-2xl md:text-[34px] font-bold text-text leading-tight">
              {req.units} Unit{req.units > 1 ? "s" : ""} {req.blood} Needed at {req.hospital}
            </h1>
            <div className="flex flex-wrap gap-5 text-[13px] text-muted">
              <span>🏥 {req.ward}</span>
              <span>🕒 Needed By: <strong className="text-text">{req.requiredBy}</strong></span>
              <span>👤 Patient: {req.patient}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 shrink-0">
            <button onClick={() => openChatWithDonor(activeDonor.id)} className="btn btn-primary">
              💬 Contact Active Donor
            </button>
            <button
              onClick={() => showToast(`Connecting to ${req.hospital} Hematology Coordinator...`, "info")}
              className="btn btn-dark"
            >
              📞 Hospital Coordinator Line
            </button>
          </div>
        </section>

        {/* 5-Stage Horizontal Stepper */}
        <section className="bg-cardlow rounded-3xl p-6 md:p-7 border border-cardtop/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] text-primary font-semibold uppercase tracking-wider">LIVE MEDICAL PROGRESSION</div>
              <h2 className="text-xl font-bold text-text">Fulfillment Pipeline Progression</h2>
            </div>
            <span className="text-[12px] text-primary font-semibold">● Current: Stage {req.stage} of 5</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {stages.map((st) => {
              const done = req.stage > st.n;
              const active = req.stage === st.n;
              return (
                <button
                  key={st.n}
                  onClick={() => updateRequestStage(req.id, st.n)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    active
                      ? "bg-cardhigh border-peach shadow-md"
                      : done
                      ? "bg-card border-peach/40"
                      : "bg-surface/60 border-cardtop/40 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                        active
                          ? "bg-peach text-[#633e2a]"
                          : done
                          ? "bg-emerald-400/20 text-emerald-300"
                          : "bg-cardtop text-muted"
                      }`}
                    >
                      {done ? "✔" : st.n}
                    </span>
                    <span className="text-[11px] font-bold text-primary">
                      {active ? "ACTIVE" : done ? "DONE" : "PENDING"}
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold text-text">{st.title}</div>
                  <div className="text-[11px] text-muted mt-0.5">{st.sub}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main 8/4 Split */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Invited Donors Pipeline */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text">Invited Donors Pipeline</h2>
                <p className="text-[12px] text-muted">
                  Strict SRS 3-Donor Protocol: Max 3 concurrent invitations per request slot to prevent over-solicitation.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cardlow border border-cardtop text-[11px] font-semibold text-primary">
                ● {req.invitedDonors.length} / 3 Slots Filled
              </span>
            </div>

            {req.invitedDonors.map((inv) => {
              const donor = donors.find((d) => d.id === inv.donorId);
              if (!donor) return null;
              const isAccepted = inv.status === "Accepted" || inv.status === "Donated";
              return (
                <article
                  key={donor.id}
                  className={`rounded-3xl p-6 border shadow-lg flex flex-col gap-4 ${
                    isAccepted ? "bg-card border-peach/60" : "bg-cardlow border-cardtop/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openDonorProfile(donor.id)}
                        className="w-12 h-12 rounded-full bg-cardtop text-primary font-bold flex items-center justify-center hover:ring-2 ring-peach cursor-pointer"
                      >
                        {donor.initials}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDonorProfile(donor.id)}
                            className="text-lg font-bold text-text hover:text-primary cursor-pointer"
                          >
                            {donor.name}
                          </button>
                          <span className="px-2 py-0.5 rounded-full bg-cardhigh text-primary text-[11px] font-semibold">
                            Verified Donor ({donor.blood})
                          </span>
                        </div>
                        <div className="text-[12px] text-muted">
                          {isAccepted ? `En Route • Blood Group: ${donor.blood}` : `Proximity: ${donor.km} km (${donor.shortArea})`}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold self-start ${
                        isAccepted
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-card text-muted"
                      }`}
                    >
                      {inv.status === "Accepted" ? "✔ Accepted — Chat Active" : inv.status}
                    </span>
                  </div>

                  {isAccepted ? (
                    <>
                      <div className="grid grid-cols-3 gap-3 bg-surface/70 rounded-2xl p-4 border border-cardtop/40">
                        <div>
                          <div className="text-[10px] text-line uppercase">ESTIMATED ARRIVAL</div>
                          <div className="text-lg font-bold text-text">{inv.eta || "~25 Mins"}</div>
                          <div className="text-[11px] text-muted">Target: {inv.targetTime || "3:15 PM"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-line uppercase">DISTANCE FROM WARD</div>
                          <div className="text-lg font-bold text-text">{inv.distance || `${donor.km} km`}</div>
                          <div className="text-[11px] text-muted">{inv.traffic || "Moderate traffic"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-line uppercase">LAST CONTACT PULSE</div>
                          <div className="text-lg font-bold text-emerald-400">{inv.pulse || "Active"}</div>
                          <div className="text-[11px] text-muted">{inv.pulseNote || "Confirmed via GPS"}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-3">
                          <button onClick={() => openChatWithDonor(donor.id)} className="btn btn-primary py-2.5 px-5 text-[13px]">
                            💬 Open Private Chat
                          </button>
                          <button
                            onClick={() => updateRequestStage(req.id, Math.min(5, req.stage + 1))}
                            className="btn btn-dark py-2.5 px-5 text-[13px]"
                          >
                            ✔ Mark Donation Received
                          </button>
                        </div>
                        <button
                          onClick={() => showToast("Hospital gate location pin shared with donor.")}
                          className="text-[12px] text-primary hover:text-text cursor-pointer"
                        >
                          📍 Share Location Pin
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-surface/60 rounded-2xl p-3.5 text-[12px] text-muted border border-cardtop/40">
                        ℹ {inv.reason || "Standby donor ready for instant reactivation without re-broadcasting."}
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-line">{inv.respondedAt}</span>
                        <button
                          onClick={() => reactivateStandbyDonor(req.id, donor.id)}
                          className="px-4 py-2 rounded-full bg-card hover:bg-cardhigh text-text font-semibold cursor-pointer"
                        >
                          ↻ Reactivate Request
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>

          {/* Right Hospital Logistics Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text">Mayo Hospital Hub</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                  Blood Bank Confirmed
                </span>
              </div>
              <LahoreMapPreview
                title="Mayo Blood Bank, Gate 3"
                actionLabel="Get Directions"
                onAction={() => showToast("Directions copied: Gate 3, Transfusion Lab 1st Floor.", "info")}
                pinLabel="Mayo Hospital"
                heightClass="h-40"
              />
              <div className="flex flex-col gap-2 text-[12px] pt-1">
                <div className="flex justify-between"><span className="text-muted">Receiving Unit:</span><span className="text-text font-semibold">{req.ward}</span></div>
                <div className="flex justify-between"><span className="text-muted">Attending Doctor:</span><span className="text-text font-semibold">{req.doctor}</span></div>
                <div className="flex justify-between"><span className="text-muted">Patient Requisition ID:</span><span className="text-text font-semibold">{req.labId}</span></div>
                <div className="flex justify-between"><span className="text-muted">Cross-Match Status:</span><span className="text-emerald-400 font-semibold">{req.crossMatchStatus}</span></div>
              </div>
            </div>

            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-3">
              <h3 className="font-bold text-text">Compatibility Matrix</h3>
              <div className="bg-deep rounded-2xl p-4 flex items-center justify-around">
                <div className="text-center">
                  <div className="text-[11px] text-line">Patient</div>
                  <div className="text-xl font-bold text-text">{req.blood}</div>
                </div>
                <div className="text-center">
                  <div className="text-primary text-lg">⇄</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    {compatible ? "Identical Match" : "Cross-Check Required"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-line">Donor</div>
                  <div className="text-xl font-bold text-primary">{activeDonor?.blood || "O+"}</div>
                </div>
              </div>
              <p className="text-[12px] text-muted">
                {activeDonor?.name} satisfies primary antigen compatibility. Cross-match screening protocol takes ~15 minutes after donor arrival.
              </p>
            </div>

            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/50 flex flex-col gap-2.5">
              <h3 className="font-bold text-text mb-1">Recipient Actions</h3>
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-full bg-card hover:bg-cardhigh text-text text-[13px] font-semibold cursor-pointer"
              >
                🖨 Print Request Summary
              </button>
              <button
                onClick={() => openChatWithDonor(activeDonor.id)}
                className="w-full py-2.5 rounded-full bg-card hover:bg-cardhigh text-text text-[13px] font-semibold cursor-pointer"
              >
                📞 Contact Hospital Coordinator
              </button>
              <button
                onClick={() =>
                  setModal({
                    eyebrow: "CONFIRM CANCELLATION",
                    title: `Cancel Request #${req.id}?`,
                    body: "This will release all standby and active donors on this requisition immediately.",
                    confirmLabel: "Confirm Cancel",
                    onConfirm: () => {
                      cancelRequest(req.id);
                      navigate("/recipient-dashboard");
                    },
                  })
                }
                className="w-full py-2.5 rounded-full text-danger hover:bg-danger/10 text-[13px] font-semibold cursor-pointer"
              >
                ✕ Cancel Entire Request
              </button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return {
    FindDonorsPage,
    CreateRequestPage,
    RequestTrackPage,
  };
})();
