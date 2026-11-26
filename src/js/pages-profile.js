(function () {
  const { useState, useEffect } = React;
  const { BLOOD_GROUPS, useApp } = window.LifeLink;
  const WRAP = "max-w-[1440px] mx-auto px-5 md:px-12";

  function ProfilePage() {
    const {
      user,
      navigate,
      showToast,
      saveProfile,
      enableDonorMode,
      toggleDonorAvailability,
      deleteAccount,
    } = useApp();

    const [form, setForm] = useState({
      name: user.name || "",
      blood: user.blood || "O+",
      city: user.city || "Lahore",
      area: user.area || "",
      phone: user.phone || "",
    });
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      setForm({
        name: user.name || "",
        blood: user.blood || "O+",
        city: user.city || "Lahore",
        area: user.area || "",
        phone: user.phone || "",
      });
    }, [user.name, user.blood, user.city, user.area, user.phone]);

    if (!user.loggedIn) {
      return (
        <div className={`${WRAP} py-16 text-center`}>
          <div className="max-w-md mx-auto bg-cardlow rounded-3xl p-8 border border-cardtop/60 flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-text">Sign in required</h1>
            <p className="text-[13px] text-muted">
              Please sign in to manage your donor profile, availability, or account settings.
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

    const handleSaveProfile = async (e) => {
      e.preventDefault();
      if (!form.name.trim() || !form.blood || !form.city.trim() || !form.area.trim() || !form.phone.trim()) {
        showToast("Full name, blood group, city, area, and contact number are all required.", "warn");
        return;
      }
      setSaving(true);
      await saveProfile(form);
      setSaving(false);
    };

    const handleDeleteAccount = async () => {
      if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
        showToast('Please type "DELETE" to confirm account deletion.', "warn");
        return;
      }
      await deleteAccount();
    };

    const lastUpdateLabel = user.lastAvailabilityUpdate
      ? new Date(user.lastAvailabilityUpdate).toLocaleString()
      : "Not updated yet";

    return (
      <div className={`${WRAP} py-10 flex flex-col gap-8`}>
        <div>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
            ACCOUNT & DONOR PROFILE
          </span>
          <h1 className="text-3xl font-bold text-text mt-1">Profile & Availability</h1>
          <p className="text-[13px] text-muted mt-1">
            Manage your declared blood group, approximate city/area, manual donor availability, and account status.
          </p>
        </div>

        {/* Donor Mode & Manual Availability Section */}
        <section className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/60 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text">Donor Availability</h2>
              <p className="text-[12px] text-muted mt-1">
                {user.isDonor
                  ? "Toggle your availability manually. Availability never changes automatically."
                  : "Enable donor mode to appear in donor searches. New donors start Unavailable."}
              </p>
            </div>
            {!user.isDonor ? (
              <button
                type="button"
                onClick={enableDonorMode}
                className="px-5 py-2.5 rounded-full bg-peach text-[#633e2a] text-[13px] font-semibold hover:bg-primary transition cursor-pointer shrink-0"
              >
                Enable Donor Mode
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleDonorAvailability(!user.available)}
                className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition cursor-pointer shrink-0 ${
                  user.available
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-card text-muted border border-cardtop"
                }`}
              >
                {user.available ? "● Available (Click to set Unavailable)" : "○ Unavailable (Click to set Available)"}
              </button>
            )}
          </div>

          <div className="bg-card rounded-2xl p-4 border border-cardtop/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
            <span className="text-muted">
              Donor mode: <strong className="text-text">{user.isDonor ? "Enabled" : "Disabled"}</strong>
              {user.isDonor && (
                <>
                  {" "}• Current status:{" "}
                  <strong className={user.available ? "text-emerald-400" : "text-muted"}>
                    {user.available ? "Available" : "Unavailable"}
                  </strong>
                </>
              )}
            </span>
            <span className="text-muted">
              Last availability update: <strong className="text-text">{lastUpdateLabel}</strong>
            </span>
          </div>
        </section>

        {/* Edit Profile Form */}
        <section className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/60 flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-text">Personal & Donor Details</h2>
            <p className="text-[12px] text-muted mt-1">
              All fields are required. Blood group is self-declared and unverified.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-pill"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">
                Blood Group (declared, unverified)
              </label>
              <select
                value={form.blood}
                onChange={(e) => setForm({ ...form, blood: e.target.value })}
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
              <label className="block text-[12px] font-semibold text-text mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="input-pill"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text mb-1">Approximate Area</label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="input-pill"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-text mb-1">Contact Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+92 300 1234567"
                className="input-pill"
                required
              />
            </div>

            <div className="sm:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-full bg-peach text-[#633e2a] text-[13px] font-semibold hover:bg-primary transition cursor-pointer disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        {/* Delete Account Section with Confirmation */}
        <section className="bg-cardlow rounded-3xl p-6 md:p-8 border border-danger/40 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-danger">Delete Account</h2>
            <p className="text-[12px] text-muted mt-1">
              Deactivating your account anonymises your name, email, and phone number, signs you out, and removes you from donor search. Existing messages and reports remain displayed as &quot;Deleted user&quot;.
            </p>
          </div>

          {!confirmDeleteOpen ? (
            <div>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="px-5 py-2.5 rounded-full bg-danger/20 border border-danger/50 text-danger text-[13px] font-semibold hover:bg-danger/30 transition cursor-pointer"
              >
                Request Account Deletion
              </button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-4 border border-danger/40 flex flex-col gap-3">
              <p className="text-[12px] text-text font-semibold">
                Confirm deletion: type <span className="text-danger">DELETE</span> below to permanently deactivate and anonymise your account.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="input-pill"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 rounded-full bg-danger text-white text-[13px] font-semibold cursor-pointer"
                >
                  Confirm Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteOpen(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-5 py-2.5 rounded-full bg-cardtop text-text text-[13px] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  window.LifeLinkProfilePages = { ProfilePage };
})();
