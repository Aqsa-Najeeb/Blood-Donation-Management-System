(function () {
  const { useState, useEffect } = React;
  const { BLOOD_GROUPS, useApp } = window.LifeLink;
  const WRAP = "max-w-[1440px] mx-auto px-5 md:px-12";

  function RequestsPage() {
    const {
      user,
      navigate,
      showToast,
      fetchRequests,
      submitBloodRequest,
      respondToRequest,
      decideOnRequestResponse,
    } = useApp();

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

    const todayStr = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [form, setForm] = useState({
      bloodGroup: user.blood || "O+",
      hospital: "",
      city: "Lahore",
      area: "Model Town",
      radius: "10",
      requiredDate: todayStr,
      units: "1",
      urgency: "URGENT",
      contactPhone: user.phone || "",
      message: "",
    });
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [items, setItems] = useState([]);

    const loadRequests = async () => {
      const list = await fetchRequests();
      if (list) setItems(list);
    };

    useEffect(() => {
      fetch("/api/donors/locations")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.locations?.length) setLocations(data.locations);
        })
        .catch(() => {});
    }, []);

    useEffect(() => {
      if (user.loggedIn) {
        loadRequests();
        setForm((prev) => ({
          ...prev,
          contactPhone: prev.contactPhone || user.phone || "",
          bloodGroup: prev.bloodGroup || user.blood || "O+",
        }));
      }
    }, [user.loggedIn]);

    if (!user.loggedIn) {
      return (
        <div className={`${WRAP} py-16 text-center`}>
          <div className="max-w-md mx-auto bg-cardlow rounded-3xl p-8 border border-cardtop/60 flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-text">Sign in required</h1>
            <p className="text-[13px] text-muted">
              Please sign in to submit an emergency blood request or view requests matching your declared blood group.
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
    const areas = locations.filter((l) => l.city === form.city).map((l) => l.area);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");

      if (
        !form.bloodGroup ||
        !form.hospital.trim() ||
        !form.city ||
        !form.area ||
        !form.radius ||
        !form.requiredDate ||
        !form.units ||
        !form.urgency ||
        !form.contactPhone.trim()
      ) {
        setErrorMsg("Please fill in all required fields.");
        return;
      }

      const unitsNum = Number(form.units);
      if (!Number.isInteger(unitsNum) || unitsNum < 1 || unitsNum > 6) {
        setErrorMsg("Units must be an integer between 1 and 6.");
        return;
      }

      setSubmitting(true);
      const res = await submitBloodRequest({
        ...form,
        radius: Number(form.radius),
        units: unitsNum,
      });
      setSubmitting(false);

      if (res.error) {
        setErrorMsg(res.error);
        showToast(res.error, "warn");
        return;
      }

      setForm((prev) => ({ ...prev, hospital: "", message: "" }));
      await loadRequests();
    };

    const myRequests = items.filter((r) => r.requesterId === user.id);
    const matchingRequests = items.filter((r) => r.requesterId !== user.id);

    return (
      <div className={`${WRAP} py-10 flex flex-col gap-10`}>
        <div>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
            EMERGENCY BLOOD REQUESTS
          </span>
          <h1 className="text-3xl font-bold text-text mt-1">Create Request & View Matching Needs</h1>
          <p className="text-[13px] text-muted mt-1">
            Only registered users with the same declared blood group can view a request. Maximum 3 OPEN requests per account.
          </p>
        </div>

        {/* Request Creation Form */}
        <section className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/60 flex flex-col gap-5">
          <h2 className="text-xl font-bold text-text">Submit Emergency Blood Request</h2>
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-danger/15 border border-danger/40 text-danger text-[13px]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">
                Blood Group (same blood group)
              </label>
              <select
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="input-pill"
                required
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">Hospital</label>
              <input
                type="text"
                value={form.hospital}
                onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                placeholder="e.g. Mayo Hospital"
                className="input-pill"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">City</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="input-pill"
                required
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">Approximate Area</label>
              <select
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="input-pill"
                required
              >
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">Search Radius</label>
              <select
                value={form.radius}
                onChange={(e) => setForm({ ...form, radius: e.target.value })}
                className="input-pill"
                required
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">Required Date (PKT)</label>
              <input
                type="date"
                value={form.requiredDate}
                min={todayStr}
                onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                className="input-pill"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">Units (1–6)</label>
              <input
                type="number"
                min="1"
                max="6"
                value={form.units}
                onChange={(e) => setForm({ ...form, units: e.target.value })}
                className="input-pill"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="input-pill"
                required
              >
                <option value="STANDARD">STANDARD</option>
                <option value="URGENT">URGENT</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">Contact Phone</label>
              <input
                type="text"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="+92 300 1234567"
                className="input-pill"
                required
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[12px] font-semibold text-text mb-1">Message (optional)</label>
              <textarea
                rows="2"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Optional note for matching donors..."
                className="input-box"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-full bg-peach text-[#633e2a] text-[13px] font-semibold hover:bg-primary transition cursor-pointer disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </section>

        {/* My Requests */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text">My Requests ({myRequests.length})</h2>
          {myRequests.length === 0 ? (
            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/60 text-[13px] text-muted">
              You have not created any requests yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myRequests.map((r) => (
                <div
                  key={r.id}
                  className="bg-cardlow rounded-3xl p-6 border border-cardtop/60 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-primary">
                      {r.code} • {r.bloodGroup} ({r.units} unit{r.units > 1 ? "s" : ""})
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === "OPEN"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-card text-muted border border-cardtop"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text">{r.hospital}</h3>
                  <p className="text-[12px] text-muted">
                    {r.area}, {r.city} (Radius: {r.radius} km) • Urgency: {r.urgency}
                  </p>
                  <p className="text-[12px] text-muted">
                    Required date: {String(r.requiredDate).slice(0, 10)} • Notified donors:{" "}
                    {(r.responses || []).length}
                  </p>

                  {/* Responses Table (B2) */}
                  {(r.responses || []).length > 0 && (
                    <div className="mt-2 overflow-x-auto rounded-2xl border border-cardtop/60">
                      <table className="w-full text-left text-[12px]">
                        <thead className="bg-card text-muted">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Donor</th>
                            <th className="px-3 py-2 font-semibold">Blood</th>
                            <th className="px-3 py-2 font-semibold">Area</th>
                            <th className="px-3 py-2 font-semibold">Response</th>
                            <th className="px-3 py-2 font-semibold">Decision</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cardtop/40">
                          {r.responses.map((resp) => (
                            <tr key={resp.id}>
                              <td className="px-3 py-2 font-medium text-text">
                                {resp.donor?.name || "Donor"}
                              </td>
                              <td className="px-3 py-2 text-muted">{resp.donor?.bloodGroup || r.bloodGroup}</td>
                              <td className="px-3 py-2 text-muted">{resp.donor?.area || "-"}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                    resp.donorResponse === "ACCEPTED"
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : resp.donorResponse === "DECLINED"
                                      ? "bg-danger/20 text-danger"
                                      : "bg-card text-muted"
                                  }`}
                                >
                                  {resp.donorResponse}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {resp.donorResponse === "ACCEPTED" ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await decideOnRequestResponse(r.id, resp.id, "APPROVED");
                                        await loadRequests();
                                      }}
                                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                                        resp.requesterDecision === "APPROVED"
                                          ? "bg-emerald-500 text-white"
                                          : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                      }`}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await decideOnRequestResponse(r.id, resp.id, "REJECTED");
                                        await loadRequests();
                                      }}
                                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                                        resp.requesterDecision === "REJECTED"
                                          ? "bg-danger text-white"
                                          : "bg-danger/20 text-danger hover:bg-danger/30"
                                      }`}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-muted text-[11px]">{resp.requesterDecision}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Matching Requests (Donor View + B2 Responses) */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text">
            Matching Requests — Same Blood Group ({user.blood})
          </h2>
          {matchingRequests.length === 0 ? (
            <div className="bg-cardlow rounded-3xl p-6 border border-cardtop/60 text-[13px] text-muted">
              No requests currently match your declared blood group ({user.blood}).
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {matchingRequests.map((r) => {
                const myResponse = (r.responses || []).find((resp) => resp.donorId === user.id);
                return (
                  <div
                    key={r.id}
                    className="bg-cardlow rounded-3xl p-6 border border-cardtop/60 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-primary">
                        {r.code} • Same blood group: {r.bloodGroup} ({r.units} unit{r.units > 1 ? "s" : ""})
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.status === "OPEN"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-card text-muted border border-cardtop"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-text">{r.hospital}</h3>
                    <p className="text-[12px] text-muted">
                      {r.area}, {r.city} • Urgency: {r.urgency} • Required: {String(r.requiredDate).slice(0, 10)}
                    </p>
                    {r.message && <p className="text-[12px] text-text">{r.message}</p>}

                    {myResponse && (
                      <div className="mt-1 pt-3 border-t border-cardtop/40 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-muted">
                            Your response:{" "}
                            <strong className="text-text">{myResponse.donorResponse}</strong>
                            {myResponse.donorResponse === "ACCEPTED" && " (willing to be contacted)"}
                          </span>
                          <span className="text-muted">
                            Decision: <strong className="text-text">{myResponse.requesterDecision}</strong>
                          </span>
                        </div>

                        {r.status === "OPEN" && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await respondToRequest(r.id, "ACCEPTED");
                                await loadRequests();
                              }}
                              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer ${
                                myResponse.donorResponse === "ACCEPTED"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-peach text-[#633e2a] hover:bg-primary"
                              }`}
                            >
                              Accept (Willing to be contacted)
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await respondToRequest(r.id, "DECLINED");
                                await loadRequests();
                              }}
                              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer ${
                                myResponse.donorResponse === "DECLINED"
                                  ? "bg-danger text-white"
                                  : "bg-card text-muted border border-cardtop hover:text-text"
                              }`}
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {myResponse.requesterDecision === "APPROVED" && r.contactPhone && (
                          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-[12px]">
                            <p className="font-semibold text-emerald-300">
                              Requester Approved — Contact Details
                            </p>
                            <p className="text-text mt-0.5">Phone: {r.contactPhone}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  window.LifeLinkRequestPages = { RequestsPage };
})();
