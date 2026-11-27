const { useState } = React;

window.LifeLinkComponents = (() => {
  const { useApp } = window.LifeLink;

  const WRAP = "max-w-[1280px] mx-auto px-5 md:px-10 w-full";

  function Header() {
    const { route, navigate, user, setUser, logoutUser, notifications, markNotificationsRead, showToast } = useApp();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const unreadCount = notifications.filter((n) => n.unread).length;

    const navItems = [
      { label: "Home", path: "/" },
      { label: "Find Donors", path: "/find-donors" },
      { label: "Request Blood", path: "/request-blood" },
      { label: "Donor Dashboard", path: "/donor-dashboard" },
      { label: "Chat", path: "/chat" },
      { label: "How it Works", path: "/how-it-works" },
    ];

    const initials = (user.name || "UK")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-cardtop/40 shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
        <div className="h-20 max-w-[1440px] mx-auto px-5 md:px-12 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left shrink-0 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-cardhigh flex items-center justify-center shrink-0">
              <img src="./assets/20dca.svg" alt="Life Link" className="w-4 h-5" />
            </div>
            <div>
              <div className="font-bold text-[18px] text-text leading-none tracking-tight">Life Link</div>
              <div className="text-[10px] font-medium text-primary uppercase tracking-[0.55px] mt-1">
                DONATE BLOOD • SHARE HOPE
              </div>
            </div>
          </button>

          <nav className="hidden xl:flex items-center gap-6">
            {navItems.map((item) => {
              const active = route === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`py-1.5 text-[14px] whitespace-nowrap transition cursor-pointer ${
                    active
                      ? "text-primary font-semibold border-b-2 border-peach"
                      : "text-muted hover:text-text font-medium"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              {!user.loggedIn ? (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-5 py-2.5 rounded-full bg-cardlow text-text font-semibold text-[14px] hover:bg-card transition cursor-pointer"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate("/signup", { role: "donor" })}
                    className="px-5 py-2.5 rounded-full bg-peach text-[#633e2a] font-semibold text-[14px] hover:bg-primary transition shadow-[0_4px_10px_rgba(222,171,144,0.2)] cursor-pointer whitespace-nowrap"
                  >
                    Become a Donor
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      navigate(user.role === "recipient" ? "/recipient-dashboard" : "/donor-dashboard")
                    }
                    className="px-4 py-2 rounded-full bg-cardlow text-muted hover:text-text text-[13px] font-semibold transition cursor-pointer"
                  >
                    {user.role === "recipient" ? "Recipient Hub" : "Donor Hub"}
                  </button>
                  <button
                    onClick={() => navigate("/request-blood")}
                    className="px-5 py-2.5 rounded-full bg-peach text-[#633e2a] font-semibold text-[14px] hover:bg-primary transition shadow-[0_4px_10px_rgba(222,171,144,0.2)] cursor-pointer whitespace-nowrap"
                  >
                    + Request Blood
                  </button>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                className="w-9 h-9 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center relative transition cursor-pointer"
              >
                <img src="./assets/48ba2.svg" alt="Alerts" className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-coral text-[#250a11] text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-cardlow border border-cardtop rounded-3xl p-4 shadow-2xl z-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-bold text-text">
                      Unread Notifications ({unreadCount})
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markNotificationsRead()}
                          className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="text-[11px] text-line hover:text-text cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-3 rounded-2xl bg-card text-[12px] text-muted text-center">
                        No unread notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setNotifOpen(false);
                            navigate(n.route || "/requests");
                          }}
                          className="text-left p-3 rounded-2xl bg-card hover:bg-cardhigh transition cursor-pointer"
                        >
                          <div className="text-[12px] font-semibold text-text">{n.title}</div>
                          <div className="text-[11px] text-muted mt-0.5">{n.description || n.desc}</div>
                          <div className="text-[10px] text-primary mt-1">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : n.time}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            {user.loggedIn && (
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  className="w-9 h-9 rounded-full bg-cardhigh border border-peach/40 text-primary text-[12px] font-bold flex items-center justify-center hover:bg-cardtop transition cursor-pointer"
                  title={user.name}
                >
                  {initials}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-cardlow border border-cardtop rounded-3xl p-4 shadow-2xl z-50">
                    <div className="pb-3 border-b border-cardtop">
                      <div className="text-[14px] font-bold text-text">{user.name}</div>
                      <div className="text-[11px] text-muted">
                        {user.blood} (declared, unverified) • {user.isDonor ? "Donor Enabled" : "Member Account"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 pt-2 text-[13px]">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/donor-dashboard");
                        }}
                        className="text-left px-3 py-2 rounded-xl hover:bg-card text-muted hover:text-text cursor-pointer"
                      >
                        Donor Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/recipient-dashboard");
                        }}
                        className="text-left px-3 py-2 rounded-xl hover:bg-card text-muted hover:text-text cursor-pointer"
                      >
                        Recipient Dispatch Hub
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/request-track");
                        }}
                        className="text-left px-3 py-2 rounded-xl hover:bg-card text-muted hover:text-text cursor-pointer"
                      >
                        Track Active Request
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/privacy-settings");
                        }}
                        className="text-left px-3 py-2 rounded-xl hover:bg-card text-muted hover:text-text cursor-pointer"
                      >
                        Privacy & Account Settings
                      </button>
                      <button
                        onClick={() => {
                          const nextRole = user.role === "donor" ? "recipient" : "donor";
                          setUser((u) => ({ ...u, role: nextRole }));
                          setProfileOpen(false);
                          showToast(`Switched workspace view to ${nextRole === "donor" ? "Donor" : "Recipient"}.`);
                          navigate(nextRole === "donor" ? "/donor-dashboard" : "/recipient-dashboard");
                        }}
                        className="text-left px-3 py-2 rounded-xl hover:bg-card text-primary cursor-pointer"
                      >
                        Switch to {user.role === "donor" ? "Recipient" : "Donor"} View
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logoutUser();
                        }}
                        className="text-left px-3 py-2 rounded-xl hover:bg-card text-danger cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="xl:hidden w-9 h-9 rounded-full bg-cardlow flex items-center justify-center text-text hover:bg-card cursor-pointer"
              aria-label="Toggle Menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {menuOpen && (
          <div className="xl:hidden bg-cardlow border-t border-cardtop px-5 py-4 flex flex-col gap-2">
            {[
              ...navItems,
              { label: "Recipient Dispatch", path: "/recipient-dashboard" },
              { label: "Track Request", path: "/request-track" },
              { label: "About Us", path: "/about" },
              { label: "Safety & FAQs", path: "/safety-faqs" },
              { label: "Privacy & Settings", path: "/privacy-settings" },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  setMenuOpen(false);
                  navigate(item.path);
                }}
                className={`text-left px-4 py-2.5 rounded-2xl text-[14px] ${
                  route === item.path ? "bg-cardtop text-primary font-semibold" : "text-muted hover:bg-card"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="flex-1 py-2.5 rounded-full bg-card text-text text-[13px] font-semibold"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/signup");
                }}
                className="flex-1 py-2.5 rounded-full bg-peach text-[#633e2a] text-[13px] font-semibold"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  function Footer() {
    const { navigate, showToast, resetDemoData } = useApp();
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
      e.preventDefault();
      if (!email.includes("@")) {
        showToast("Please enter a valid email address.", "warn");
        return;
      }
      setSubscribed(true);
      setEmail("");
      showToast("Subscribed to Life Link emergency alerts & donor camp notices.");
    };

    return (
      <footer className="bg-deep text-muted pt-12 pb-10 border-t border-cardtop/30">
        <div className="max-w-[1440px] mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-cardtop/40">
            <div className="lg:col-span-4 flex flex-col gap-4">
              <button onClick={() => navigate("/")} className="flex items-center gap-3 text-left cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-cardhigh flex items-center justify-center">
                  <img src="./assets/20dca.svg" alt="Life Link" className="w-4 h-5" />
                </div>
                <div>
                  <div className="font-bold text-text text-[20px] leading-none">Life Link</div>
                  <div className="text-[11px] font-medium text-primary uppercase tracking-[0.55px] mt-1">
                    DONATE BLOOD • SHARE HOPE
                  </div>
                </div>
              </button>
              <p className="text-[14px] leading-relaxed text-muted max-w-sm">
                A simple connection can make a big difference. Connecting voluntary blood donors with patients across hospitals, verified instantly in moments of crisis.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {[
                  { icon: "./assets/88d79.svg", label: "Share Network", action: () => showToast("Share link copied to clipboard!") },
                  { icon: "./assets/20682.svg", label: "Regional Coverage", action: () => navigate("/find-donors") },
                  { icon: "./assets/3622e.svg", label: "Encrypted Chat", action: () => navigate("/chat") },
                  { icon: "./assets/4709e.svg", label: "Community Safety", action: () => navigate("/safety-faqs") },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    title={item.label}
                    className="w-10 h-10 rounded-full bg-card hover:bg-cardhigh flex items-center justify-center transition cursor-pointer"
                  >
                    <img src={item.icon} alt={item.label} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3">
              <h4 className="font-bold text-text text-[14px] tracking-[0.75px] uppercase">QUICK LINKS</h4>
              <div className="flex flex-col gap-2 text-[13px]">
                <button onClick={() => navigate("/")} className="text-left hover:text-primary transition cursor-pointer">Home</button>
                <button onClick={() => navigate("/about")} className="text-left hover:text-primary transition cursor-pointer">About Us</button>
                <button onClick={() => navigate("/find-donors")} className="text-left hover:text-primary transition cursor-pointer">Find Donors</button>
                <button onClick={() => navigate("/signup", { role: "donor" })} className="text-left hover:text-primary transition cursor-pointer">Become a Donor</button>
                <button onClick={() => navigate("/recipient-dashboard")} className="text-left hover:text-primary transition cursor-pointer">Recipient Dispatch</button>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3">
              <h4 className="font-bold text-text text-[14px] tracking-[0.75px] uppercase">SUPPORT</h4>
              <div className="flex flex-col gap-2 text-[13px]">
                <button onClick={() => navigate("/safety-faqs")} className="text-left hover:text-primary transition cursor-pointer">FAQs</button>
                <button onClick={() => navigate("/how-it-works")} className="text-left hover:text-primary transition cursor-pointer">How It Works</button>
                <button onClick={() => navigate("/privacy-settings")} className="text-left hover:text-primary transition cursor-pointer">Privacy & Settings</button>
                <button onClick={() => navigate("/safety-faqs")} className="text-left hover:text-primary transition cursor-pointer">Blood Donation Guide</button>
                <button onClick={resetDemoData} className="text-left text-line hover:text-primary transition cursor-pointer">Reset Demo State</button>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <h4 className="font-bold text-text text-[14px] tracking-[0.75px] uppercase">PLATFORM NOTICE</h4>
              <p className="text-[13px] text-muted leading-relaxed">
                Life Link is a voluntary community blood-donor coordination platform. Blood groups are declared and unverified.
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-line">
            <p>© 2026 Life Link. All rights reserved. Approximate location only. Not an emergency medical service.</p>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate("/privacy-settings")} className="hover:text-primary cursor-pointer">Privacy Policy</button>
              <button onClick={() => navigate("/safety-faqs")} className="hover:text-primary cursor-pointer">Terms of Service</button>
              <button onClick={() => navigate("/chat")} className="hover:text-primary cursor-pointer">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  function LahoreMapPreview({
    title = "Lahore Central Medical Corridor",
    subtitle = "Radius: 10 km",
    pinLabel = "Mayo Hospital",
    showRadar = true,
    heightClass = "h-48",
    onAction,
    actionLabel,
  }) {
    return (
      <div className={`relative rounded-2xl overflow-hidden bg-[#1a070d] border border-cardtop/60 ${heightClass}`}>
        <svg viewBox="0 0 600 260" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#deab90" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#f69ea8" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#1a070d" stopOpacity="0" />
            </radialGradient>
            <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#4d2b32" strokeWidth="0.6" strokeOpacity="0.45" />
            </pattern>
          </defs>
          <rect width="600" height="260" fill="#1d0910" />
          <rect width="600" height="260" fill="url(#grid)" />

          {/* Stylized Lahore arterial roads & canal */}
          <path d="M-20 190 Q140 165 300 132 T620 88" fill="none" stroke="#633e2a" strokeWidth="5" strokeOpacity="0.45" />
          <path d="M60 0 Q190 95 285 135 T520 260" fill="none" stroke="#4d2b32" strokeWidth="3.5" />
          <path d="M310 0 L285 135 L255 260" fill="none" stroke="#4d2b32" strokeWidth="3" />
          <path d="M0 78 Q210 102 420 148 T600 175" fill="none" stroke="#402027" strokeWidth="2.5" strokeDasharray="6 4" />

          {/* Districts */}
          <text x="72" y="54" fill="#9d8d86" fontSize="11" fontWeight="600">GULSHAN-E-RAVI</text>
          <text x="358" y="42" fill="#9d8d86" fontSize="11" fontWeight="600">BADSHAHI SECTOR</text>
          <text x="415" y="196" fill="#9d8d86" fontSize="11" fontWeight="600">GULBERG II</text>
          <text x="118" y="218" fill="#9d8d86" fontSize="11" fontWeight="600">MODEL TOWN</text>

          {/* Radar overlay */}
          {showRadar && (
            <>
              <circle cx="290" cy="130" r="108" fill="url(#mapGlow)" />
              <circle cx="290" cy="130" r="96" fill="none" stroke="#fcc6aa" strokeOpacity="0.24" strokeDasharray="5 5" />
              <circle cx="290" cy="130" r="56" fill="none" stroke="#ffc3c8" strokeOpacity="0.32" />
            </>
          )}

          {/* Secondary hospital/donor dots */}
          <circle cx="176" cy="94" r="5" fill="#fcc6aa" />
          <circle cx="430" cy="112" r="5" fill="#ffc3c8" />
          <circle cx="348" cy="186" r="5" fill="#34d399" />
          <text x="186" y="97" fill="#ffd9de" fontSize="10" fontWeight="600">Services Hosp.</text>
          <text x="440" y="115" fill="#ffd9de" fontSize="10" fontWeight="600">Gulberg Hub</text>

          {/* Central Hospital Pin */}
          <circle cx="290" cy="130" r="16" fill="#deab90" fillOpacity="0.22" />
          <circle cx="290" cy="130" r="9" fill="#deab90" />
          <text x="290" y="133.5" textAnchor="middle" fill="#633e2a" fontSize="10" fontWeight="800">H</text>
          <rect x="234" y="144" width="112" height="20" rx="10" fill="#250a11" fillOpacity="0.92" stroke="#4d2b32" />
          <text x="290" y="157" textAnchor="middle" fill="#ffd9de" fontSize="10" fontWeight="600">{pinLabel}</text>
        </svg>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-surface/90 border border-cardtop text-[11px] font-medium text-text backdrop-blur-md">
            📍 {title}
          </span>
          {actionLabel ? (
            <button
              onClick={onAction}
              className="pointer-events-auto px-3 py-1 rounded-full bg-cardhigh/95 hover:bg-cardtop text-[11px] font-semibold text-primary border border-cardtop transition cursor-pointer"
            >
              {actionLabel}
            </button>
          ) : (
            <span className="px-3 py-1 rounded-full bg-surface/90 border border-cardtop text-[11px] text-muted backdrop-blur-md">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  function ToastBanner() {
    const { toast } = useApp();
    if (!toast) return null;
    const toneStyle =
      toast.tone === "warn"
        ? "bg-cardtop border-danger/50 text-danger"
        : toast.tone === "info"
        ? "bg-cardhigh border-peach/40 text-text"
        : "bg-cardhigh border-emerald-400/40 text-text";
    return (
      <div className="fixed top-24 right-5 z-[60] max-w-sm animate-bounce-once">
        <div className={`px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 text-[13px] font-medium ${toneStyle}`}>
          <span>{toast.tone === "warn" ? "⚠" : toast.tone === "info" ? "ℹ" : "✔"}</span>
          <span>{toast.message}</span>
        </div>
      </div>
    );
  }

  function GlobalModal() {
    const { modal, setModal } = useApp();
    if (!modal) return null;
    return (
      <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-cardlow border border-cardtop rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              {modal.eyebrow && (
                <div className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">
                  {modal.eyebrow}
                </div>
              )}
              <h3 className="text-xl font-bold text-text">{modal.title}</h3>
            </div>
            <button
              onClick={() => setModal(null)}
              className="w-8 h-8 rounded-full bg-card hover:bg-cardhigh flex items-center justify-center text-muted hover:text-text cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="text-[14px] text-muted leading-relaxed">{modal.body}</div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setModal(null)}
              className="px-5 py-2.5 rounded-full bg-card hover:bg-cardhigh text-text text-[13px] font-semibold cursor-pointer"
            >
              Close
            </button>
            {modal.confirmLabel && (
              <button
                onClick={() => {
                  modal.onConfirm && modal.onConfirm();
                  setModal(null);
                }}
                className="px-5 py-2.5 rounded-full bg-peach hover:bg-primary text-[#633e2a] text-[13px] font-semibold cursor-pointer"
              >
                {modal.confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return {
    WRAP,
    Header,
    Footer,
    LahoreMapPreview,
    ToastBanner,
    GlobalModal,
  };
})();
