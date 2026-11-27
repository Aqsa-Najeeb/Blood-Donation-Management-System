const { useEffect, useRef, useState } = React;

window.LifeLinkAccountPages = (() => {
  const { BLOOD_GROUPS, useApp } = window.LifeLink;
  const { WRAP, LahoreMapPreview } = window.LifeLinkComponents;

  /* ---------- IN-APP CHAT (Pair-based, C2) ---------- */
  function ChatPage() {
    const {
      conversations,
      setConversations,
      chatInvitations,
      setChatInvitations,
      activeConversationId,
      setActiveConversationId,
      sendMessage,
      submitSafetyReport,
      navigate,
      showToast,
      setModal,
      user,
    } = useApp();

    const [tab, setTab] = useState("conversations");
    const [draft, setDraft] = useState("");
    const [convMessages, setConvMessages] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [reportCategory, setReportCategory] = useState("SUSPICIOUS_ACTIVITY");
    const [reportReason, setReportReason] = useState("");
    const feedRef = useRef(null);

    useEffect(() => {
      let active = true;
      (async () => {
        try {
          const TOKEN_KEY = "ll_auth_token";
          if (!localStorage.getItem(TOKEN_KEY)) return;
          const headers = { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` };
          const [convRes, invRes] = await Promise.all([
            fetch("/api/chats", { headers }).then((r) => r.json()),
            fetch("/api/chats/invitations", { headers }).then((r) => r.json()),
          ]);
          if (!active) return;
          if (convRes.conversations) setConversations(convRes.conversations);
          if (invRes) setChatInvitations({ received: invRes.received || [], sent: invRes.sent || [] });
        } catch {}
      })();
      return () => { active = false; };
    }, []);

    useEffect(() => {
      if (!activeConversationId) { setConvMessages([]); setActiveConv(null); return; }
      let active = true;
      (async () => {
        try {
          const TOKEN_KEY = "ll_auth_token";
          const headers = { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` };
          const res = await fetch(`/api/chats/${activeConversationId}`, { headers }).then((r) => r.json());
          if (!active) return;
          if (res.conversation) {
            setActiveConv(res.conversation);
            setConvMessages(res.conversation.messages || []);
          }
        } catch {}
      })();
      return () => { active = false; };
    }, [activeConversationId]);

    useEffect(() => {
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, [convMessages.length, activeConversationId]);

    const handleSend = async (e) => {
      e.preventDefault();
      if (!draft.trim() || !activeConversationId) return;
      await sendMessage(activeConversationId, draft);
      setDraft("");
      try {
        const TOKEN_KEY = "ll_auth_token";
        const headers = { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` };
        const res = await fetch(`/api/chats/${activeConversationId}`, { headers }).then((r) => r.json());
        if (res.conversation) setConvMessages(res.conversation.messages || []);
      } catch {}
    };

    const handleInvitation = async (invId, action) => {
      try {
        const TOKEN_KEY = "ll_auth_token";
        const res = await fetch(`/api/chats/invitations/${invId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
          body: JSON.stringify({ action }),
        }).then((r) => r.json());
        showToast(`Invitation ${action.toLowerCase()}ed.`);
        const invRes = await fetch("/api/chats/invitations", {
          headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
        }).then((r) => r.json());
        setChatInvitations({ received: invRes.received || [], sent: invRes.sent || [] });
        if (action === "ACCEPT" && res.conversation) {
          const convRes = await fetch("/api/chats", {
            headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
          }).then((r) => r.json());
          if (convRes.conversations) setConversations(convRes.conversations);
          setActiveConversationId(res.conversation.id);
          setTab("conversations");
        }
      } catch (err) {
        showToast(err.message || "Failed to respond to invitation.", "warn");
      }
    };

    const handleRestrict = async (convId, action) => {
      try {
        const TOKEN_KEY = "ll_auth_token";
        await fetch(`/api/chats/${convId}/restrict`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
          body: JSON.stringify({ action }),
        }).then((r) => r.json());
        showToast(action === "apply" ? "Restriction applied." : "Restriction removed. A new invitation is needed to resume messaging.");
        const convRes = await fetch("/api/chats", {
          headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
        }).then((r) => r.json());
        if (convRes.conversations) setConversations(convRes.conversations);
      } catch (err) {
        showToast(err.message || "Failed.", "warn");
      }
    };

    if (!user.loggedIn) {
      return (
        <div className={`${WRAP} py-16 text-center`}>
          <h1 className="text-2xl font-bold text-text mb-2">Sign In Required</h1>
          <p className="text-muted text-sm mb-4">You need to be signed in to use chat.</p>
          <button onClick={() => navigate("/login")} className="btn btn-primary px-6 py-3">Sign In</button>
        </div>
      );
    }

    return (
      <div className={`${WRAP} py-6 flex flex-col gap-4`}>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-text">💬 Chats</h1>
          <div className="text-[12px] text-muted">Pair-based messaging</div>
        </div>

        <div className="flex gap-2 text-[12px]">
          {[
            { id: "conversations", label: `Conversations (${conversations.length})` },
            { id: "received", label: `Received (${chatInvitations.received.filter((i) => i.status === "PENDING").length})` },
            { id: "sent", label: `Sent (${chatInvitations.sent.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full font-semibold cursor-pointer ${
                tab === t.id ? "bg-peach text-[#633e2a]" : "bg-card text-muted hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-4 items-stretch min-h-[600px]">
          <aside className="lg:col-span-4 bg-cardlow rounded-3xl p-4 border border-cardtop/50 flex flex-col gap-3 overflow-y-auto">
            {tab === "conversations" && conversations.map((c) => {
              const selected = activeConversationId === c.id;
              const restricted = c.restrictedById !== null;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConversationId(c.id)}
                  className={`p-3.5 rounded-2xl text-left border transition cursor-pointer ${
                    selected ? "bg-cardhigh border-peach/60" : "bg-card/60 hover:bg-card border-cardtop/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-cardtop text-primary text-[12px] font-bold flex items-center justify-center shrink-0">
                      {(c.partner?.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-text truncate">{c.partner?.name || "User"}</div>
                      <div className="text-[10px] text-primary">{c.partner?.bloodGroup || ""} • {c.partner?.area || ""}</div>
                    </div>
                  </div>
                  {restricted && <span className="text-[10px] text-danger mt-1 inline-block">🚫 Restricted</span>}
                  {c.requiresReinvite && !restricted && <span className="text-[10px] text-amber-400 mt-1 inline-block">⚠ Reinvite needed</span>}
                </button>
              );
            })}
            {tab === "received" && chatInvitations.received.map((inv) => (
              <div key={inv.id} className="p-3.5 rounded-2xl bg-card/60 border border-cardtop/40 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-cardtop text-primary text-[12px] font-bold flex items-center justify-center shrink-0">
                    {(inv.sender?.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text">{inv.sender?.name || "User"}</div>
                    <div className="text-[10px] text-muted">Status: {inv.status}</div>
                  </div>
                </div>
                {inv.status === "PENDING" && (
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleInvitation(inv.id, "ACCEPT")} className="btn btn-primary text-[11px] py-1.5 px-3">Accept</button>
                    <button onClick={() => handleInvitation(inv.id, "REJECT")} className="px-3 py-1.5 rounded-full bg-card hover:bg-cardhigh text-[11px] text-muted cursor-pointer">Reject</button>
                    <button onClick={() => handleInvitation(inv.id, "RESTRICT")} className="px-3 py-1.5 rounded-full bg-danger/20 hover:bg-danger/40 text-[11px] text-danger cursor-pointer">Restrict</button>
                  </div>
                )}
              </div>
            ))}
            {tab === "sent" && chatInvitations.sent.map((inv) => (
              <div key={inv.id} className="p-3.5 rounded-2xl bg-card/60 border border-cardtop/40 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-cardtop text-primary text-[12px] font-bold flex items-center justify-center shrink-0">
                  {(inv.recipient?.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-text">{inv.recipient?.name || "User"}</div>
                  <div className="text-[10px] text-muted">Status: {inv.status}</div>
                </div>
              </div>
            ))}
            {tab === "conversations" && conversations.length === 0 && (
              <div className="text-center text-[12px] text-muted py-6">No conversations yet. Use the Message button on a donor profile to start one.</div>
            )}
          </aside>

          <section className="lg:col-span-8 bg-cardlow rounded-3xl border border-cardtop/50 flex flex-col overflow-hidden">
            {activeConv ? (
              <>
                <div className="p-4 md:px-6 border-b border-cardtop/50 flex flex-wrap items-center justify-between gap-3 bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cardtop text-primary font-bold flex items-center justify-center">
                      {(activeConv.partner?.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-[15px] font-bold text-text">{activeConv.partner?.name}</h1>
                      <div className="text-[11px] text-muted">{activeConv.partner?.bloodGroup} • {activeConv.partner?.area}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setModal({
                          eyebrow: "COMMUNITY SAFEGUARD",
                          title: "Report Safety Concern",
                          body: (
                            <div className="flex flex-col gap-3">
                              <p>Select a category and provide clear evidence. 3 independent reports trigger an automatic 7-day restriction on creating new emergency requests.</p>
                              <select defaultValue={reportCategory} onChange={(e) => setReportCategory(e.target.value)} className="input-pill bg-surface">
                                <option value="FALSE_DONOR_INFO">False Donor Information</option>
                                <option value="HARASSMENT">Harassment</option>
                                <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
                                <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
                              </select>
                              <textarea rows="3" defaultValue={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Describe what happened..." className="input-box" />
                            </div>
                          ),
                          confirmLabel: "Submit Confidential Report",
                          onConfirm: () =>
                            submitSafetyReport({
                              targetUserId: activeConv.partner?.id,
                              category: reportCategory,
                              reason: reportReason.trim().length >= 10 ? reportReason.trim() : "Safety concern reported via chat.",
                            }),
                        })
                      }
                      className="px-2.5 py-1.5 rounded-full bg-card hover:bg-cardhigh text-[11px] text-muted cursor-pointer"
                    >
                      ⚑ Report
                    </button>
                    {activeConv.restrictedById === user.id && (
                      <button onClick={() => handleRestrict(activeConv.id, "remove")} className="px-3 py-1.5 rounded-full bg-card hover:bg-cardhigh text-[11px] font-semibold text-amber-400 cursor-pointer">Remove Restriction</button>
                    )}
                    {!activeConv.restrictedById && !activeConv.requiresReinvite && (
                      <button onClick={() => handleRestrict(activeConv.id, "apply")} className="px-3 py-1.5 rounded-full bg-card hover:bg-danger/20 text-[11px] font-semibold text-danger cursor-pointer">Restrict</button>
                    )}
                  </div>
                </div>
                {(activeConv.restrictedById || activeConv.requiresReinvite) && (
                  <div className="mx-4 mt-3 p-3 rounded-2xl bg-danger/10 border border-danger/30 text-[12px] text-danger">
                    {activeConv.restrictedById
                      ? "🚫 This conversation is restricted. Messages and invitations are blocked."
                      : "⚠ Restriction was removed. A new chat invitation must be accepted before messaging can resume."}
                  </div>
                )}
                <div ref={feedRef} className="flex-1 p-4 md:px-6 overflow-y-auto flex flex-col gap-3 max-h-[400px]">
                  {convMessages.length === 0 && <div className="text-center text-[12px] text-muted py-6">No messages yet. Send the first message!</div>}
                  {convMessages.map((m) => {
                    const outgoing = m.senderId === user.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${outgoing ? "items-end" : "items-start"}`}>
                        <div className="text-[10px] text-line mb-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {m.senderName || "You"}
                        </div>
                        <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                          outgoing ? "bg-peach text-[#3b1f12] font-medium rounded-br-sm" : "bg-card text-text border border-cardtop/50 rounded-bl-sm"
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!activeConv.restrictedById && !activeConv.requiresReinvite && (
                  <form onSubmit={handleSend} className="p-4 border-t border-cardtop/50 flex items-center gap-2 bg-card/40">
                    <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${activeConv.partner?.name || "partner"}... (max 1000 chars)`} maxLength={1000} className="input-pill flex-1 h-11" />
                    <span className="text-[10px] text-line shrink-0">{draft.length}/1000</span>
                    <button type="submit" className="btn btn-primary py-2.5 px-5 text-[13px]">Send ➤</button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted text-[13px]">Select a conversation to start messaging.</div>
            )}
          </section>
        </div>
      </div>
    );
  }

  /* ---------- PRIVACY & SETTINGS (3552:4800) ---------- */
  function PrivacySettingsPage() {
    const { user, saveSettings, showToast, setModal, logoutUser } = useApp();
    const [form, setForm] = useState({ ...user });
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [activeSection, setActiveSection] = useState("profile");

    const saveChanges = async () => {
      await saveSettings(form);
    };

    const discardChanges = () => {
      setForm({ ...user });
      showToast("Unsaved edits discarded.", "info");
    };

    return (
      <div className={`${WRAP} py-8 pb-28 flex flex-col gap-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-card text-primary text-[11px] font-semibold uppercase tracking-wider">
              USER GOVERNANCE & DATA GUARD
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-text mt-2">Account & Privacy Settings</h1>
            <p className="text-[14px] text-muted mt-1">
              Manage your personal credentials, donor availability, approximate location, and privacy protections.
            </p>
          </div>
          <div className="bg-cardlow rounded-2xl px-5 py-3 border border-cardtop/60 flex items-center gap-3 self-start">
            <span className="w-10 h-10 rounded-full bg-cardhigh text-primary font-bold flex items-center justify-center">
              {form.blood}
            </span>
            <div>
              <div className="text-[13px] font-bold text-text">Self-Declared Profile</div>
              <div className="text-[11px] text-muted">{form.city}, {form.area}</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Sub-Navigation Rail */}
          <aside className="lg:col-span-3 flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="bg-cardlow rounded-3xl p-3 border border-cardtop/50 flex flex-col gap-1">
              {[
                { id: "profile", label: "👤 Profile & Blood Group" },
                { id: "availability", label: "⚡ Donor Availability" },
                { id: "privacy", label: "🛡 Privacy & Safety" },
                { id: "security", label: "🔑 Account Security" },
              ].map((nav) => (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveSection(nav.id);
                    const el = document.getElementById(`settings-${nav.id}`);
                    el && el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`px-4 py-3 rounded-2xl text-left text-[13px] font-semibold transition cursor-pointer ${
                    activeSection === nav.id ? "bg-cardhigh text-primary" : "text-muted hover:text-text hover:bg-card/50"
                  }`}
                >
                  {nav.label}
                </button>
              ))}
            </div>

            <div className="bg-cardlow rounded-3xl p-5 border border-cardtop/50">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                ✔ DONOR CREDIBILITY
              </div>
              <p className="text-[12px] text-muted mt-2">
                {form.safetyFlags} flags reported across historical donor inquiries in the {form.city} region.
              </p>
              <div className="h-1.5 bg-cardtop rounded-full mt-3">
                <div className="h-full bg-peach rounded-full w-full" />
              </div>
            </div>
          </aside>

          {/* Main Settings Canvas */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {/* Section 1 */}
            <section id="settings-profile" className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/50 flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider">IDENTITY & DECLARED STATUS</div>
                  <h2 className="text-xl font-bold text-text">Profile & Declared Blood Group</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-card text-[11px] text-muted">Last updated: Today</span>
              </div>

              <div className="bg-deep rounded-2xl p-4 border border-cardtop/60 text-[12px] text-muted">
                <strong className="text-text">Important Blood Group Policy:</strong> Updating your blood group is strictly self-declared. Life Link records this timestamp publicly in user search results to guarantee transparency for emergency requesters.
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1.5">Full Name (Legal or Display)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1.5">Account Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1.5">
                    Contact Phone (Protected by Privacy Shield)
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1.5">Declared Blood Group</label>
                  <select
                    value={form.blood}
                    onChange={(e) => setForm({ ...form, blood: e.target.value })}
                    className="input-pill"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1.5">Primary Metropolitan City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1.5">Approximate Area / District Zone</label>
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="input-pill"
                  />
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="settings-availability" className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/50 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider">READINESS & FRESHNESS SYSTEM</div>
                  <h2 className="text-xl font-bold text-text">Donor Availability Controls</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                  ● Status: {form.available ? "Fresh (Active within 7 days)" : "Paused"}
                </span>
              </div>

              <div className="bg-card rounded-2xl p-5 border border-cardtop/50 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-text text-[15px]">
                    Available to Donate <span className="ml-2 px-2 py-0.5 rounded-full bg-cardhigh text-primary text-[10px]">Emergency Matchable</span>
                  </div>
                  <p className="text-[12px] text-muted mt-1">
                    When enabled, your profile appears in emergency searches within your approximate radius.
                  </p>
                </div>
                <button
                  onClick={() => setForm({ ...form, available: !form.available })}
                  className={`w-12 h-6 rounded-full p-0.5 transition cursor-pointer shrink-0 ${
                    form.available ? "bg-peach" : "bg-cardtop"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-surface transition-transform ${form.available ? "translate-x-6" : ""}`} />
                </button>
              </div>

              <div className="bg-deep rounded-2xl p-4 border border-cardtop/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[12px] text-muted">
                  <strong className="text-text">7-Day Freshness Assurance Rule:</strong> Profiles inactive for &gt;7 days display as “May be outdated”.
                </div>
                <button
                  onClick={() => {
                    setForm((f) => ({ ...f, lastConfirmed: "Just now", available: true }));
                    showToast("Timestamp refreshed for 7 more days!");
                  }}
                  className="px-4 py-2 rounded-full bg-card hover:bg-cardhigh text-primary text-[12px] font-semibold shrink-0 cursor-pointer"
                >
                  ↻ Refresh Timestamp Now
                </button>
              </div>
            </section>

            {/* Section 3 */}
            <section id="settings-privacy" className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/50 flex flex-col gap-5">
              <div>
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider">ZERO UNSOLICITED CALLS GUARANTEE</div>
                <h2 className="text-xl font-bold text-text">Privacy Shield & In-App Coordination</h2>
              </div>

              <div className="bg-card rounded-2xl p-5 border border-cardtop/50 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-text text-[14px]">Strict Phone Shielding</div>
                  <p className="text-[12px] text-muted mt-0.5">
                    Only reveal contact phone to requesters if manually accepted in an active emergency thread.
                  </p>
                </div>
                <button
                  onClick={() => setForm({ ...form, strictPhoneShielding: !form.strictPhoneShielding })}
                  className={`w-12 h-6 rounded-full p-0.5 transition cursor-pointer shrink-0 ${
                    form.strictPhoneShielding ? "bg-peach" : "bg-cardtop"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-surface transition-transform ${form.strictPhoneShielding ? "translate-x-6" : ""}`} />
                </button>
              </div>

              <div className="bg-card rounded-2xl p-5 border border-cardtop/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-text text-[14px]">Approximate Matching Radius</div>
                    <div className="text-[12px] text-muted">Limit requests to cases within a manageable transit boundary.</div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-deep text-primary font-bold text-[14px]">
                    {form.matchingRadius} km
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={form.matchingRadius}
                  onChange={(e) => setForm({ ...form, matchingRadius: Number(e.target.value) })}
                  className="w-full accent-[#deab90] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-line">
                  <span>5 km (Immediate Neighborhood)</span>
                  <span>15 km (Standard Urban)</span>
                  <span>50 km (District Wide)</span>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4 border border-emerald-500/20 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-text text-[13px]">Account in Good Standing</div>
                  <div className="text-[11px] text-muted">
                    0 safety flags or harassment complaints reported. Your donor trust index is at 100%.
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                  Active Protection
                </span>
              </div>
            </section>

            {/* Section 4 */}
            <section id="settings-security" className="bg-cardlow rounded-3xl p-6 md:p-8 border border-cardtop/50 flex flex-col gap-5">
              <div>
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider">ACCESS CREDENTIALS & TERMINATION</div>
                <h2 className="text-xl font-bold text-text">Security & Account Lifecycle</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="At least 8 chars + symbol"
                    className="input-pill"
                  />
                </div>
              </div>

              <div className="bg-danger/10 border border-danger/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-danger text-[14px]">⚠ Permanent Account Deletion</div>
                  <p className="text-[12px] text-muted mt-1">
                    Deleting your account unpublishes your blood record immediately. Anonymized safety logs remain archived for 30 days.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setModal({
                      eyebrow: "ACCOUNT TERMINATION",
                      title: "Request Account Deletion?",
                      body: "Your donor availability will be hidden immediately and you will be signed out.",
                      confirmLabel: "Confirm Sign Out & Deactivate",
                      onConfirm: logoutUser,
                    })
                  }
                  className="px-4 py-2 rounded-full bg-card hover:bg-danger/20 text-danger text-[12px] font-semibold shrink-0 cursor-pointer"
                >
                  Request Deletion
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Sticky Action Footer Bar */}
        <div className="fixed bottom-5 inset-x-0 z-40 px-5 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto bg-cardhigh/95 backdrop-blur-xl rounded-full px-6 py-3 shadow-2xl border border-cardtop flex items-center justify-between gap-4">
            <span className="text-[12px] text-muted">● Settings synced with secure cloud.</span>
            <div className="flex items-center gap-3">
              <button onClick={discardChanges} className="text-[13px] text-muted hover:text-text cursor-pointer">
                Discard
              </button>
              <button onClick={saveChanges} className="btn btn-primary py-2 px-6 text-[13px]">
                ✔ Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- LOGIN PAGE (3441:6111) ---------- */
  function LoginPage() {
    const { demoMode, demoLogin, loginUser, navigate, showToast } = useApp();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("donor");

    const submit = (e) => {
      e.preventDefault();
      if (!username.trim() || !password.trim()) {
        showToast("Please enter both username and password.", "warn");
        return;
      }
      loginUser({ username, password, role });
    };

    return (
      <div className={`${WRAP} py-16 flex items-center justify-center relative`}>
        <div className="w-full max-w-md relative">
          <button
            onClick={() => navigate("/")}
            aria-label="Back to Home"
            className="hidden sm:flex absolute -left-14 top-6 w-10 h-10 rounded-full bg-cardlow border border-cardtop items-center justify-center text-muted hover:text-text cursor-pointer"
          >
            ←
          </button>

          <div className="bg-cardlow rounded-[32px] p-8 md:p-10 border border-cardtop/60 shadow-2xl flex flex-col gap-6">
            <h1 className="text-3xl font-bold text-center text-text">Login</h1>

            <div className="grid grid-cols-2 bg-surface p-1 rounded-full border border-cardtop/40">
              <button
                type="button"
                onClick={() => setRole("donor")}
                className={`py-2 rounded-full text-[12px] font-semibold cursor-pointer ${
                  role === "donor" ? "bg-cardhigh text-primary" : "text-muted"
                }`}
              >
                Voluntary Donor
              </button>
              <button
                type="button"
                onClick={() => setRole("recipient")}
                className={`py-2 rounded-full text-[12px] font-semibold cursor-pointer ${
                  role === "recipient" ? "bg-cardhigh text-primary" : "text-muted"
                }`}
              >
                Recipient / Patient
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-text mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="input-pill"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-pill"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2">
                Log In
              </button>
            </form>

            {demoMode && (
              <>
                <div className="text-center text-[12px] text-line">Or quick demo sign-in</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => demoLogin("donor")}
                    className="py-2.5 px-3 rounded-full bg-card hover:bg-cardhigh text-[12px] font-semibold text-text cursor-pointer"
                  >
                    Demo Donor
                  </button>
                  <button
                    type="button"
                    onClick={() => demoLogin("recipient")}
                    className="py-2.5 px-3 rounded-full bg-card hover:bg-cardhigh text-[12px] font-semibold text-text cursor-pointer"
                  >
                    Demo Recipient
                  </button>
                </div>
              </>
            )}

            <p className="text-center text-[13px] text-muted">
              Don’t have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- SIGN UP PAGE (3441:6260) ---------- */
  function SignupPage() {
    const { params, signupUser, navigate, showToast } = useApp();
    const [role, setRole] = useState(params.role === "recipient" ? "recipient" : "donor");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [blood, setBlood] = useState("");
    const [city, setCity] = useState("Lahore, Pakistan");
    const [area, setArea] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const submit = (e) => {
      e.preventDefault();
      if (!name.trim() || !email.includes("@") || !blood || !phone.trim() || !area.trim()) {
        showToast("Please fill in your full name, phone, valid email, area, and blood group.", "warn");
        return;
      }
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || password !== confirm) {
        showToast("Passwords must match, be 8+ chars, and include a letter and number.", "warn");
        return;
      }
      signupUser({ name, phone, email, blood, city, area, password });
    };

    return (
      <div className={`${WRAP} py-12 flex items-center justify-center relative`}>
        <div className="w-full max-w-xl relative">
          <button
            onClick={() => navigate("/")}
            aria-label="Back to Home"
            className="hidden sm:flex absolute -left-14 top-6 w-10 h-10 rounded-full bg-cardlow border border-cardtop items-center justify-center text-muted hover:text-text cursor-pointer"
          >
            ←
          </button>

          <div className="bg-cardlow rounded-[32px] p-8 md:p-10 border border-cardtop/60 shadow-2xl flex flex-col gap-5">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-text">Join Life Link</h1>
              <p className="text-[13px] text-muted mt-1">Register to request or donate blood in your area</p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-text mb-2">I want to register as a:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("donor")}
                    className={`py-3 px-4 rounded-2xl border text-[13px] font-semibold transition cursor-pointer ${
                      role === "donor"
                        ? "bg-cardhigh border-peach text-text"
                        : "bg-card border-cardtop text-muted"
                    }`}
                  >
                    🤍 Voluntary Donor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("recipient")}
                    className={`py-3 px-4 rounded-2xl border text-[13px] font-semibold transition cursor-pointer ${
                      role === "recipient"
                        ? "bg-cardhigh border-peach text-text"
                        : "bg-card border-cardtop text-muted"
                    }`}
                  >
                    👤 Recipient / Patient
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1">Area / Sector</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Model Town"
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1">Blood Group (declared, unverified)</label>
                  <select
                    value={blood}
                    onChange={(e) => setBlood(e.target.value)}
                    className="input-pill"
                  >
                    <option value="">Select Group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1">City / Location</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lahore, Pakistan"
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-pill"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="input-pill"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full mt-2">
                Create Account
              </button>
            </form>

            <p className="text-center text-[13px] text-muted">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return {
    ChatPage,
    PrivacySettingsPage,
    LoginPage,
    SignupPage,
  };
})();
