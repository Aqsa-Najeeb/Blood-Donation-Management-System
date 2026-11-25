const { useState } = React;

/* ---------- DATA ---------- */
const NAV = ["Home", "Find Donors", "Request Blood", "Donor Dashboard", "Chat", "How it Works"];

const BLOOD = [
  { type: "A+", count: 2410, status: "Optimal" },
  { type: "A-", count: 482, status: "Moderate" },
  { type: "B+", count: 3120, status: "Optimal" },
  { type: "B-", count: 319, status: "Critical Low" },
  { type: "AB+", count: 890, status: "Optimal" },
  { type: "AB-", count: 142, status: "Urgent" },
  { type: "O+", count: 5240, status: "Optimal" },
  { type: "O-", count: 612, status: "High Need" },
];

const FEATURES = [
  { icon: "🧭", title: "Smart Proximity Matching", text: "Finds the nearest eligible donors and keeps exact home locations hidden." },
  { icon: "🔀", title: "Controlled Request Protocol", text: "Alerts a maximum of 3 donors at a time to avoid spam and hospital crowding." },
  { icon: "🔒", title: "Secure In-App Chat", text: "Talk to donors inside the app. No phone numbers are shared." },
];

const STATS = [
  { value: "14,280+", label: "Active Donors" },
  { value: "38", label: "Cities Covered" },
  { value: "1,890", label: "Direct Donations" },
  { value: "<15m", label: "Response Time" },
];

const STEPS = {
  recipient: [
    { title: "Submit Request", text: "Enter blood group, units needed, hospital and doctor details." },
    { title: "Smart Routing", text: "We alert the 3 closest available donors." },
    { title: "Private Chat", text: "Confirm time and blood bank details in the app." },
    { title: "Verified Donation", text: "Donor arrives and the donation is recorded." },
  ],
  donor: [
    { title: "Register & Verify", text: "Add blood type, donation history and your ID." },
    { title: "Get a Ping", text: "You are alerted only when someone near you needs your type." },
    { title: "Accept or Skip", text: "One tap to accept. Skip if you are unavailable." },
    { title: "Donate & Track", text: "Donate, earn badges, see when you can donate again." },
  ],
};

/* ---------- HELPER ---------- */
const statusColor = (s) =>
  ["Critical Low", "Urgent", "High Need"].includes(s)
    ? "text-danger"
    : s === "Moderate"
    ? "text-pink"
    : "text-primary";

const WRAP = "max-w-[1440px] mx-auto px-5 md:px-12 w-full";

/* ---------- COMPONENTS ---------- */
function Header() {
  const [active, setActive] = useState("Home");
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-lg">
      <div className="h-20 max-w-[1440px] mx-auto px-5 md:px-12 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cardhigh flex items-center justify-center">💧</div>
          <div>
            <div className="font-bold leading-none">Life Link</div>
            <div className="text-[11px] text-primary uppercase tracking-wider mt-1">Donate Blood • Share Hope</div>
          </div>
        </a>

        <nav className="hidden xl:flex gap-6">
          {NAV.map((n) => (
            <a
              key={n}
              href="#"
              onClick={() => setActive(n)}
              className={`py-1 text-[15px] ${
                active === n ? "text-primary font-semibold border-b-2 border-peach" : "text-muted hover:text-text"
              }`}
            >
              {n}
            </a>
          ))}
        </nav>

        <div className="hidden sm:flex gap-2">
          <a href="#" className="px-6 py-2.5 rounded-full bg-cardlow font-semibold text-[15px] hover:bg-card">Login</a>
          <a href="#" className="px-6 py-2.5 rounded-full bg-peach text-[#633e2a] font-semibold text-[15px] hover:bg-primary">Become a Donor</a>
        </div>
      </div>
    </header>
  );
}

function Advisory() {
  return (
    <section className={`${WRAP} pt-6 relative`}>
      <div className="bg-cardlow rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-cardtop text-pink text-[11px] uppercase tracking-wider">
            Emergency Advisory
          </span>
          <p className="text-[13px] text-muted mt-1">
            Life Link connects volunteer donors. In a critical emergency, call your local emergency number first.
          </p>
        </div>
        <a href="tel:1122" className="px-4 py-2 rounded-full bg-card text-[13px] font-medium hover:bg-cardhigh">
          🚑 Helpline: 1122
        </a>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className={`${WRAP} py-10 grid lg:grid-cols-12 gap-6 items-center relative`}>
      <div className="lg:col-span-7 flex flex-col items-start gap-6">
        <span className="px-4 py-1.5 rounded-full bg-card text-[11px] uppercase tracking-wider text-primary">
          Direct Verified Blood Exchange
        </span>
        <h1 className="text-5xl md:text-[56px] leading-tight font-bold tracking-tight">
          Give Blood.<br />
          <span className="text-peach">Save Lives.</span>
        </h1>
        <p className="text-lg text-muted max-w-xl">
          Connect verified volunteer donors with patients in hospitals, fast and safely.
        </p>
        <div className="flex flex-wrap gap-4">
          <a href="#" className="btn btn-primary">🔍 Find a Donor</a>
          <a href="#" className="btn btn-dark">🤝 Become a Donor</a>
        </div>
        <div className="flex flex-wrap gap-6 text-[13px] text-muted">
          <span>✔ Medical ID checked</span>
          <span>🔒 Private contact</span>
          <span>⚡ Real-time matching</span>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="rounded-3xl overflow-hidden bg-card aspect-[4/3] relative shadow-2xl">
          {/* Put your image here: <img src="hero.jpg" className="w-full h-full object-cover" /> */}
          <div className="absolute inset-0 bg-gradient-to-br from-cardtop to-surface" />
          <div className="absolute bottom-4 inset-x-4 p-4 bg-cardhigh/95 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#1f060c] flex items-center justify-center font-bold text-pink">O-</div>
              <div>
                <div className="text-[13px] font-semibold">Universal Donor Needed</div>
                <div className="text-[13px] text-muted">St. Jude Metropolitan • 2.4 km</div>
              </div>
            </div>
            <a href="#" className="px-3 py-1.5 rounded-full bg-[#f69ea8] text-[#74333d] text-[11px] font-semibold">Assist Now</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Availability() {
  return (
    <section className={`${WRAP} py-4 relative`}>
      <div className="bg-cardlow rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
          <h2 className="font-bold text-xl">Live Blood Bank & Donor Availability</h2>
          <span className="text-[13px] text-line">Updated 42 seconds ago</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {BLOOD.map((b) => (
            <div key={b.type} className="bg-card hover:bg-cardhigh rounded-2xl p-3 text-center transition">
              <div className="text-2xl font-bold text-primary">{b.type}</div>
              <div className="text-[11px] text-muted">{b.count.toLocaleString()} Donors</div>
              <div className={`text-[11px] font-semibold ${statusColor(b.status)}`}>{b.status}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className={`${WRAP} py-10 relative`}>
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-4xl font-bold">Built to Protect Life & Privacy</h2>
        <p className="text-muted mt-2">No spam calls. No hospital chaos. Just the right donors.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-card hover:bg-cardhigh transition rounded-3xl p-10">
            <div className="w-14 h-14 rounded-full bg-cardtop flex items-center justify-center text-2xl mb-4">{f.icon}</div>
            <h3 className="text-2xl font-semibold mb-2">{f.title}</h3>
            <p className="text-muted">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className={`${WRAP} py-6 relative`}>
      <div className="bg-cardlow rounded-3xl p-10 grid lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-primary">{s.value}</div>
              <div className="font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-4 flex lg:justify-end">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#4d2b32" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#deab90" strokeWidth="10"
                strokeLinecap="round" strokeDasharray="314.159" strokeDashoffset="40" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-bold text-xl">88%</span>
              <span className="text-[11px] text-line">Acceptance</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const [role, setRole] = useState("recipient");

  const tab = (name, label) => (
    <button
      onClick={() => setRole(name)}
      className={`px-6 py-2 rounded-full text-[13px] font-semibold transition ${
        role === name ? "bg-peach text-[#633e2a]" : "text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className={`${WRAP} py-10 relative`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-bold">How It Works</h2>
          <p className="text-muted mt-2">Four simple steps for patients and donors.</p>
        </div>
        <div className="inline-flex p-1 bg-cardlow rounded-full self-start">
          {tab("recipient", "For Recipients")}
          {tab("donor", "For Donors")}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS[role].map((s, i) => (
          <div key={s.title} className="bg-card rounded-3xl p-6 relative overflow-hidden">
            <span className="absolute -top-2 right-4 text-4xl font-bold text-cardtop">0{i + 1}</span>
            <h4 className="text-xl font-semibold mb-2 mt-8">{s.title}</h4>
            <p className="text-[13px] text-muted">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className={`${WRAP} py-10 grid lg:grid-cols-12 gap-6 items-center relative`}>
      <div className="lg:col-span-5 aspect-[4/3] rounded-3xl bg-card flex items-end p-4">
        <div>
          <div className="font-bold">Aria Chen</div>
          <div className="text-[13px] text-muted">O- Donor • 14 Donations</div>
        </div>
      </div>
      <div className="lg:col-span-7 flex flex-col gap-4 lg:pl-6">
        <blockquote className="text-3xl font-semibold leading-snug">
          “Only three of us got the alert. No begging on social media, no chaos. Just a clear call to help within 20 minutes.”
        </blockquote>
        <a href="#" className="btn btn-primary self-start">Join as a Donor</a>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className={`${WRAP} pt-6 pb-10 relative`}>
      <div className="bg-card rounded-3xl p-10 flex flex-col items-start gap-4">
        <h2 className="text-4xl font-bold">Need Blood Right Now?</h2>
        <p className="text-muted max-w-2xl">Send a controlled request and reach verified donors nearest to your hospital.</p>
        <div className="flex flex-wrap gap-4">
          <a href="#" className="btn btn-primary">💧 Start a Request</a>
          <a href="#" className="btn btn-dark">Browse Donors</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <footer className="bg-[#1f060c] text-muted pt-12 pb-8">
      <div className="max-w-[1440px] mx-auto px-5 md:px-12 grid md:grid-cols-2 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <div className="font-bold text-text text-lg">Life Link</div>
          <p className="mt-3 text-[15px] max-w-sm">Connecting volunteer blood donors with patients across hospitals.</p>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-2 text-[13px]">
          <span className="font-bold text-text uppercase tracking-wider">Quick Links</span>
          {["Home", "About Us", "Find Donors", "Become a Donor", "Contact Us"].map((l) => (
            <a key={l} href="#" className="hover:text-primary">{l}</a>
          ))}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-2 text-[13px]">
          <span className="font-bold text-text uppercase tracking-wider">Support</span>
          {["FAQs", "Help Center", "Terms of Service", "Privacy Policy"].map((l) => (
            <a key={l} href="#" className="hover:text-primary">{l}</a>
          ))}
        </div>

        <div className="lg:col-span-4">
          <span className="font-bold text-text uppercase tracking-wider text-[13px]">Stay Connected</span>
          {done ? (
            <p className="mt-3 text-primary">You are subscribed.</p>
          ) : (
            <div className="flex gap-2 mt-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 h-[52px] px-5 rounded-full bg-card text-text placeholder:text-line text-[13px] outline-none focus:ring-1 focus:ring-peach"
              />
              <button
                onClick={() => email.includes("@") && setDone(true)}
                className="h-[52px] px-6 rounded-full bg-peach text-[#633e2a] font-semibold hover:bg-primary"
              >
                Subscribe
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-center text-[13px] text-line mt-10">© 2026 Life Link. All rights reserved.</p>
    </footer>
  );
}

function App() {
  return (
    <>
      <Header />
      <main className="pt-20 relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-pink/10 rounded-full blur-[140px] pointer-events-none" />
        <Advisory />
        <Hero />
        <Availability />
        <Features />
        <Stats />
        <HowItWorks />
        <Testimonial />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);