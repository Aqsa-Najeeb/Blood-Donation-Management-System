(function () {
  const { useState, useEffect } = React;
  const { BLOOD_GROUPS, useApp } = window.LifeLink;
  const WRAP = "max-w-[1440px] mx-auto px-5 md:px-12";

  function SearchDonorsPage() {
    const { user, navigate, showToast, searchDonors, contactDonor, openChatWithDonor, submitSafetyReport, setModal } = useApp();

    const [locations, setLocations] = useState([
      { city: "Lahore", area: "Model Town" },
      { city: "Lahore", area: "Gulberg III" },
      { city: "Lahore", area: "DHA Phase 5" },
      { city: "Lahore", area: "DHA Phase 3" },
      { city: "Lahore", area: "Johar Town Phase 2" },
      { city: "Lahore", area: "Faisal Town" },
      { city: "Lahore", area: "Wapda Town" },
      { city: "Lahore", area: "Garden Town" },
      { city: "Lahore", area: "Shadman" },
      { city: "Lahore", area: "Allama Iqbal Town" },
      { city: "Lahore", area: "Cavalry Ground" },
    ]);

    const [bloodGroup, setBloodGroup] = useState("");
    const [city, setCity] = useState("Lahore");
    const [area, setArea] = useState("Model Town");
    const [radius, setRadius] = useState("10");
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [revealedPhones, setRevealedPhones] = useState({});

    useEffect(() => {
      fetch("/api/donors/locations")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.locations?.length) {
            setLocations(data.locations);
          }
        })
        .catch(() => {});
    }, []);

    if (!user.loggedIn) {
      return (
        <div className={`${WRAP} py-16 text-center`}>
          <div className="max-w-md mx-auto bg-cardlow rounded-3xl p-8 border border-cardtop/60 flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-text">Sign in to search donors</h1>
            <p className="text-[13px] text-muted">
              Donor search and contact details are restricted to signed-in users.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 rounded-full bg-peach text-[#633e2a] font-semibold cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }

    const cities = [...new Set(locations.map((l) => l.city))];
    const areas = locations.filter((l) => l.city === city).map((l) => l.area);

    const handleSearch = async (e) => {
      e.preventDefault();
      setLoading(true);
      const data = await searchDonors({ bloodGroup, city, area, radius });
      setLoading(false);
      if (data) {
        setResults(data.donors || []);
        setSearched(true);
      }
    };

    const handleContact = async (donorId) => {
      const contact = await contactDonor(donorId);
      if (contact?.phone) {
        setRevealedPhones((prev) => ({ ...prev, [donorId]: contact.phone }));
      } else {
        showToast("Could not retrieve donor phone number.", "warn");
      }
    };

    return (
      <div className={`${WRAP} py-10 flex flex-col gap-8`}>
        <div>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
            DONOR SEARCH
          </span>
          <h1 className="text-3xl font-bold text-text mt-1">Find Blood Donors</h1>
          <p className="text-[13px] text-muted mt-1">
            Search registered donors by declared blood group, approximate city/area, and radius (5, 10, 25, or 50 km).
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-cardlow rounded-3xl p-6 border border-cardtop/60 grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label className="block text-[12px] font-semibold text-text mb-1">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="input-pill"
            >
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text mb-1">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="input-pill"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text mb-1">Area</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="input-pill"
            >
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text mb-1">Radius</label>
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="input-pill"
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] rounded-full bg-peach text-[#633e2a] text-[13px] font-semibold hover:bg-primary transition cursor-pointer disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search Donors"}
            </button>
          </div>
        </form>

        {searched && results.length === 0 ? (
          <div className="bg-cardlow rounded-3xl p-10 border border-cardtop/60 text-center">
            <h2 className="text-lg font-bold text-text">No donors found</h2>
            <p className="text-[13px] text-muted mt-1">
              No donors matched your selected blood group, location, and radius. Try expanding the radius or clearing the blood group filter.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((d) => (
              <div
                key={d.id}
                className="bg-cardlow rounded-3xl p-6 border border-cardtop/60 flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-text">{d.name}</h3>
                      <p className="text-[12px] text-muted">
                        {d.area}, {d.city} • {d.distance} km away
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cardhigh text-primary text-[12px] font-bold">
                      {d.bloodGroup} (declared)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        d.available
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-card text-muted border border-cardtop"
                      }`}
                    >
                      {d.available ? "Available" : "Unavailable"}
                    </span>
                    {d.isOutdated && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300">
                        May be outdated
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-cardtop/40 flex flex-col gap-2">
                  {revealedPhones[d.id] ? (
                    <div className="bg-card rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-primary">
                      Phone: {revealedPhones[d.id]}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleContact(d.id)}
                      className="w-full py-2.5 rounded-full bg-peach text-[#633e2a] text-[13px] font-semibold hover:bg-primary transition cursor-pointer"
                    >
                      Contact
                    </button>
                  )}
                  {d.id !== user.id && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openChatWithDonor(d.id)}
                        className="flex-1 py-2 rounded-full bg-card hover:bg-cardhigh text-text text-[12px] font-semibold border border-cardtop transition cursor-pointer"
                      >
                        Message
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          let cat = "SUSPICIOUS_ACTIVITY";
                          let reason = "";
                          setModal({
                            eyebrow: "COMMUNITY SAFEGUARD",
                            title: `Report ${d.name}`,
                            body: (
                              <div className="flex flex-col gap-3">
                                <p className="text-[12px] text-muted">
                                  Select a category and provide a reason of at least 10 characters. Reporter identity is kept private.
                                </p>
                                <select
                                  defaultValue={cat}
                                  onChange={(e) => { cat = e.target.value; }}
                                  className="input-pill bg-surface"
                                >
                                  <option value="FALSE_DONOR_INFO">False Donor Information</option>
                                  <option value="HARASSMENT">Harassment</option>
                                  <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
                                  <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
                                </select>
                                <textarea
                                  rows="3"
                                  onChange={(e) => { reason = e.target.value; }}
                                  placeholder="Describe the issue (at least 10 characters)..."
                                  className="input-box"
                                />
                              </div>
                            ),
                            confirmLabel: "Submit Report",
                            onConfirm: () => submitSafetyReport({ targetUserId: d.id, category: cat, reason }),
                          });
                        }}
                        className="px-4 py-2 rounded-full bg-card hover:bg-danger/20 text-muted hover:text-danger text-[12px] font-semibold border border-cardtop transition cursor-pointer"
                      >
                        Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  window.LifeLinkSearchPages = { SearchDonorsPage };
})();
