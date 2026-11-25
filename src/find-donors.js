const { useState } = React;

/* ---------- SAMPLE DATA (replace with real data from your backend later) ---------- */
const DONORS = [
  { id: 1, name: "Hamza Tariq",   initials: "HT", blood: "O+", km: 3.2, area: "Gulberg II",     online: true,  seen: "Available Now", last: "4 mos ago", times: 6, reply: "Avg reply: under 15 min", pending: false },
  { id: 2, name: "Zainab Fatima", initials: "ZF", blood: "O+", km: 4.8, area: "Model Town",     online: true,  seen: "Available Now", last: "5 mos ago", times: 3, reply: "Avg reply: under 20 min", pending: false },
  { id: 3, name: "Bilal Ahmed",   initials: "BA", blood: "O+", km: 6.1, area: "Ferozepur Road", online: false, seen: "Active 45m ago", last: "7 mos ago", times: 9, reply: "Avg reply: under 30 min", pending: false },
  { id: 4, name: "Ayesha Malik",  initials: "AM", blood: "O+", km: 7.4, area: "Johar Town",     online: true,  seen: "Available Now", last: "3 mos ago", times: 4, reply: "Avg reply: under 15 min", pending: true },
  { id: 5, name: "Usman Raza",    initials: "UR", blood: "A+", km: 2.1, area: "Cantt",          online: true,  seen: "Available Now", last: "6 mos ago", times: 2, reply: "Avg reply: under 25 min", pending: false },
  { id: 6, name: "Sana Iqbal",    initials: "SI", blood: "B+", km: 9.5, area: "DHA",            online: true,  seen: "Available Now", last: "8 mos ago", times: 5, reply: "Avg reply: under 20 min", pending: false },
];

const BLOODS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RADII = [5, 15, 25, "All"];
const MAX_SELECTED = 3;
const WRAP = "max-w-[1440px] mx-auto px-5 md:px-12 w-full";

/* ---------- HEADER ---------- */
function Header() {
  const links = [
    { label: "Home", href: "index.html" },
    { label: "Find Donors", href: "find-donors.html" },
    { label: "Request Blood", href: "#" },
    { label: "Donor Dashboard", href: "#" },
    { label: "Chat", href: "#" },
    { label: "How it Works", href: "#" },
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-lg">
      <div className="h-20 max-w-[1440px] mx-auto px-5 md:px-12 flex items-center justify-between">
        <a href="index.html" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cardhigh flex items-center justify-center">💧</div>
          <div>
            <div className="font-bold leading-none">Life Link</div>
            <div className="text-[11px] text-primary uppercase tracking-wider mt-1">Donate Blood • Share Hope</div>
          </div>
        </a>
        <nav className="hidden xl:flex gap-6">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`py-1 text-[15px] ${
                l.label === "Find Donors" ? "text-primary font-semibold border-b-2 border-peach" : "text-muted hover:text-text"
              }`}
            >
              {l.label}
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

/* ---------- FILTERS ---------- */
function Filters({ blood, setBlood, radius, setRadius, onlyOnline, setOnlyOnline, search, setSearch, selectedCount }) {
  return (
    <section className="bg-cardlow rounded-3xl p-6 shadow-xl flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] text-primary uppercase tracking-wider">Emergency Donor Search</div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Find Matched Volunteer Donors</h1>
          <p className="text-[13px] text-muted mt-1">Distances are approximate. The hospital lab must confirm the blood match.</p>
        </div>
        <div className="bg-card px-6 py-3 rounded-full flex items-center gap-3 self-start xl:self-center">
          <span className="text-[13px]">Selected Donors:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-peach text-[#633e2a] text-[11px] font-bold">
            {selectedCount} / {MAX_SELECTED}
          </span>
        </div>
      </div>

      {/* Blood group */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <span className="text-[13px] text-muted font-semibold">Blood Group:</span>
        <div className="flex flex-wrap gap-2">
          {BLOODS.map((b) => (
            <button
              key={b}
              onClick={() => setBlood(b)}
              className={`px-4 py-2 rounded-full text-[15px] font-semibold transition ${
                blood === b ? "bg-peach text-[#633e2a]" : "bg-cardhigh text-muted hover:text-text"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Search, radius, toggle */}
      <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search area, e.g. Gulberg"
          className="lg:col-span-4 w-full h-[52px] px-5 rounded-full bg-card text-text placeholder:text-line text-[13px] outline-none focus:bg-cardtop"
        />

        <div className="lg:col-span-5 flex items-center bg-card p-1 rounded-full">
          <span className="px-3 text-[11px] text-muted hidden sm:inline">Distance:</span>
          <div className="grid grid-cols-4 w-full gap-1">
            {RADII.map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`py-2 rounded-full text-[11px] transition ${
                  radius === r ? "bg-cardtop text-primary font-semibold" : "text-muted hover:text-text"
                }`}
              >
                {r === "All" ? "All" : `${r} km`}
              </button>
            ))}
          </div>
        </div>

        <label className="lg:col-span-3 flex items-center justify-between sm:justify-end gap-3 bg-card/60 px-4 h-[52px] rounded-full cursor-pointer">
          <span className="text-[11px] text-muted">Only available donors</span>
          <input
            type="checkbox"
            checked={onlyOnline}
            onChange={(e) => setOnlyOnline(e.target.checked)}
            className="w-5 h-5 accent-[#deab90]"
          />
        </label>
      </div>
    </section>
  );
}

/* ---------- DONOR CARD ---------- */
function DonorCard({ d, isSelected, onToggle }) {
  return (
    <article className="bg-cardlow hover:bg-card transition rounded-3xl p-6 shadow-xl flex flex-col gap-4">
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
            <h2 className="text-xl font-bold">{d.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted mt-1">
              <span className="text-primary">~{d.km} km away ({d.area})</span>
              <span className="text-line">•</span>
              <span className={d.online ? "text-emerald-400" : "text-muted"}>{d.seen}</span>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <div className="h-11 px-4 rounded-full bg-peach text-[#633e2a] text-xl font-bold flex items-center">{d.blood}</div>
          <span className="text-[11px] text-muted">Last donation: {d.last}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 rounded-full bg-card text-[11px] text-muted">Blood group self-reported</span>
        <span className="px-3 py-1 rounded-full bg-card text-[11px] text-muted">{d.times} donations</span>
        <span className="px-3 py-1 rounded-full bg-card text-[11px] text-muted">{d.reply}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button className="text-[13px] text-primary hover:text-text text-left py-2">View Profile & Chat</button>

        {d.pending ? (
          <button disabled className="px-6 py-2.5 rounded-full bg-card text-muted opacity-80 cursor-default text-[15px] font-semibold">
            ⏳ Request Sent • Pending
          </button>
        ) : (
          <button
            onClick={() => onToggle(d.id)}
            className={`px-6 py-2.5 rounded-full text-[15px] font-semibold transition ${
              isSelected ? "bg-cardtop text-primary hover:bg-[#522f36]" : "bg-peach text-[#633e2a] hover:bg-primary"
            }`}
          >
            {isSelected ? "✔ Donor Selected" : "+ Select for Request"}
          </button>
        )}
      </div>
    </article>
  );
}

/* ---------- SIDEBAR ---------- */
function Sidebar({ radius }) {
  return (
    <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-28">
      <div className="bg-cardlow rounded-3xl p-6 shadow-xl flex flex-col gap-3">
        <h3 className="text-xl font-bold">Search Area</h3>
        <p className="text-[13px] text-muted">
          Exact home addresses are never shown. Distances are rounded.
        </p>
        <div className="h-40 rounded-2xl bg-[#1f060c] flex items-center justify-center relative overflow-hidden">
          <div className="absolute w-44 h-44 rounded-full border border-primary/20" />
          <div className="absolute w-28 h-28 rounded-full border border-pink/30" />
          <div className="w-10 h-10 rounded-full bg-peach flex items-center justify-center z-10">🏥</div>
        </div>
        <div className="text-[11px] text-muted">
          Range: {radius === "All" ? "No limit" : `${radius} km`}
        </div>
      </div>

      <div className="bg-cardlow rounded-3xl p-6 shadow-xl flex flex-col gap-3">
        <h3 className="text-xl font-bold">Safety Notice</h3>
        <p className="text-[13px] text-muted leading-relaxed">
          A matching blood group here is only a first filter.{" "}
          <span className="text-text font-medium">The hospital lab must cross-match the blood</span> before it is given to any patient.
        </p>
        <ul className="bg-[#1f060c] rounded-2xl p-4 text-[11px] text-muted flex flex-col gap-2">
          <li>✔ Volunteer donors never ask for money.</li>
          <li>✔ Confirm compatibility at a certified blood bank lab.</li>
        </ul>
      </div>

      <div className="bg-cardhigh rounded-3xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold">Emergency Hotline</div>
          <div className="text-[13px] text-muted">Rescue, 24/7</div>
        </div>
        <a href="tel:1122" className="px-4 py-2 rounded-full bg-card text-[13px] font-medium hover:bg-cardtop">1122</a>
      </div>
    </aside>
  );
}

/* ---------- FLOATING BAR ---------- */
function SelectionBar({ count, onClear, onSend }) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 inset-x-0 z-40 px-5 md:px-12 pointer-events-none">
      <div className="max-w-[880px] mx-auto pointer-events-auto bg-cardhigh/95 backdrop-blur-xl rounded-full p-3 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 pl-3">
          <div className="w-9 h-9 rounded-full bg-peach text-[#633e2a] flex items-center justify-center font-bold">{count}</div>
          <span className="font-bold">{count} {count === 1 ? "Donor" : "Donors"} Selected</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClear} className="px-4 py-2.5 text-[13px] text-muted hover:text-text hidden sm:inline">Clear</button>
          <button onClick={onSend} className="px-6 py-3 rounded-full bg-peach text-[#633e2a] font-semibold hover:bg-primary whitespace-nowrap">
            Send Requests ({count})
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="bg-[#1f060c] text-muted pt-12 pb-8 mt-10">
      <div className="max-w-[1440px] mx-auto px-5 md:px-12 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <div className="font-bold text-text text-lg">Life Link</div>
          <p className="mt-2 text-[15px] max-w-sm">Connecting volunteer blood donors with patients across hospitals.</p>
        </div>
        <div className="flex gap-6 text-[13px]">
          <a href="#" className="hover:text-primary">Privacy Policy</a>
          <a href="#" className="hover:text-primary">Terms of Service</a>
          <a href="#" className="hover:text-primary">Contact</a>
        </div>
      </div>
      <p className="text-center text-[13px] text-line mt-8">© 2026 Life Link. All rights reserved.</p>
    </footer>
  );
}

/* ---------- PAGE ---------- */
function App() {
  const [blood, setBlood] = useState("O+");
  const [radius, setRadius] = useState(15);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("near");
  const [selected, setSelected] = useState([1]);

  const list = DONORS
    .filter((d) => d.blood === blood)
    .filter((d) => radius === "All" || d.km <= radius)
    .filter((d) => !onlyOnline || d.online)
    .filter((d) => d.area.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sort === "near" ? a.km - b.km : b.times - a.times));

  const toggle = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else if (selected.length >= MAX_SELECTED) {
      alert("You can select a maximum of 3 donors per request.");
    } else {
      setSelected([...selected, id]);
    }
  };

  const send = () => {
    alert("Demo only: this would send requests to " + selected.length + " donor(s).");
  };

  return (
    <>
      <Header />
      <main className="pt-20 pb-32">
        <div className={`${WRAP} pt-6 flex flex-col gap-6`}>
          <Filters
            blood={blood} setBlood={setBlood}
            radius={radius} setRadius={setRadius}
            onlyOnline={onlyOnline} setOnlyOnline={setOnlyOnline}
            search={search} setSearch={setSearch}
            selectedCount={selected.length}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <h2 className="text-xl font-bold">
              {list.length} {list.length === 1 ? "donor" : "donors"} found
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted uppercase tracking-wider">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-cardlow text-text text-[13px] py-2 px-4 rounded-full outline-none cursor-pointer"
              >
                <option value="near">Nearest first</option>
                <option value="count">Most donations</option>
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-4">
              {list.length === 0 ? (
                <div className="bg-cardlow rounded-3xl p-10 text-center">
                  <p className="font-semibold">No donors match these filters.</p>
                  <p className="text-[13px] text-muted mt-1">Try a larger distance, another blood group, or turn off "Only available donors".</p>
                </div>
              ) : (
                list.map((d) => (
                  <DonorCard key={d.id} d={d} isSelected={selected.includes(d.id)} onToggle={toggle} />
                ))
              )}
            </div>
            <Sidebar radius={radius} />
          </div>
        </div>
      </main>
      <Footer />
      <SelectionBar count={selected.length} onClear={() => setSelected([])} onSend={send} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);