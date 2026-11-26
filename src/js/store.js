const { createContext, useContext, useEffect, useState } = React;

window.LifeLink = window.LifeLink || {};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BLOOD_AVAILABILITY = [
  { type: "A+", count: 2410, status: "Optimal", badge: "Common" },
  { type: "A-", count: 482, status: "Moderate", badge: "Rare" },
  { type: "B+", count: 3120, status: "Optimal", badge: "Common" },
  { type: "B-", count: 319, status: "Critical Low", badge: "Rare" },
  { type: "AB+", count: 890, status: "Optimal", badge: "Universal Rec." },
  { type: "AB-", count: 142, status: "Urgent", badge: "1% Rare" },
  { type: "O+", count: 5240, status: "Optimal", badge: "High Need" },
  { type: "O-", count: 612, status: "High Need", badge: "Universal" },
];

const BLOOD_COMPATIBILITY = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

const INITIAL_DONORS = [
  {
    id: 1,
    name: "Hamza Tariq",
    initials: "HT",
    blood: "O+",
    km: 3.2,
    area: "Gulberg II Sector, Lahore",
    shortArea: "Gulberg II",
    online: true,
    seen: "Available Now",
    confirmedAgo: "Confirmed 4h ago",
    last: "4 mos ago",
    lastDays: 114,
    times: 6,
    reply: "< 15 mins",
    reliability: 100,
    verified: true,
    pending: false,
    honorScore: 99.4,
    milestones: [
      {
        org: "Fatimid Foundation Lahore",
        tag: "Emergency Whole Blood",
        date: "October 24, 2025",
        desc: "1 Unit Whole Blood donated for pediatric thalassemic support. Verified by Dr. M. Bilal, Transfusion Lead.",
      },
      {
        org: "Mayo Hospital Blood Bank",
        tag: "Surgical Reserve",
        date: "July 13, 2025",
        desc: "Urgent trauma ward dispatch. Coordinated via platform instant notification within 18 minutes.",
      },
      {
        org: "Services Institute of Medical Sciences",
        tag: "Platelet Apheresis",
        date: "February 02, 2025",
        desc: "Single Donor Platelet (SDP) apheresis collection for oncology patient emergency protocol.",
      },
    ],
  },
  {
    id: 2,
    name: "Zainab Fatima",
    initials: "ZF",
    blood: "O+",
    km: 4.8,
    area: "Model Town Perimeter, Lahore",
    shortArea: "Model Town",
    online: true,
    seen: "Available Now",
    confirmedAgo: "Confirmed 2h ago",
    last: "5 mos ago",
    lastDays: 152,
    times: 3,
    reply: "< 20 mins",
    reliability: 98,
    verified: true,
    pending: false,
    honorScore: 98.2,
    milestones: [
      {
        org: "Jinnah Hospital Blood Bank",
        tag: "Emergency Whole Blood",
        date: "September 18, 2025",
        desc: "1 Unit Whole Blood donated for emergency surgical recovery. Verified by Duty Registrar.",
      },
    ],
  },
  {
    id: 3,
    name: "Bilal Ahmed",
    initials: "BA",
    blood: "O+",
    km: 6.1,
    area: "Ferozepur Rd Hospital Zone",
    shortArea: "Ferozepur Rd",
    online: false,
    seen: "Active 45m ago",
    confirmedAgo: "Active 45m ago",
    last: "7 mos ago",
    lastDays: 210,
    times: 9,
    reply: "< 30 mins",
    reliability: 99,
    verified: true,
    pending: false,
    honorScore: 99.1,
    milestones: [
      {
        org: "Lahore General Hospital",
        tag: "Trauma Dispatch",
        date: "August 02, 2025",
        desc: "Verified emergency responder unit for night shift surgical trauma.",
      },
    ],
  },
  {
    id: 4,
    name: "Ayesha Malik",
    initials: "AM",
    blood: "O+",
    km: 7.4,
    area: "Johar Town Core, Lahore",
    shortArea: "Johar Town",
    online: true,
    seen: "Available Now",
    confirmedAgo: "Confirmed 1h ago",
    last: "3 mos ago",
    lastDays: 95,
    times: 4,
    reply: "< 15 mins",
    reliability: 96,
    verified: true,
    pending: true,
    honorScore: 97.5,
    milestones: [
      {
        org: "Doctors Hospital Lahore",
        tag: "Scheduled Reserve",
        date: "November 10, 2025",
        desc: "1 Unit Whole Blood for planned orthopedic surgery.",
      },
    ],
  },
  {
    id: 5,
    name: "Usman Raza",
    initials: "UR",
    blood: "A+",
    km: 2.1,
    area: "Cantt Medical Sector, Lahore",
    shortArea: "Cantt",
    online: true,
    seen: "Available Now",
    confirmedAgo: "Confirmed 3h ago",
    last: "6 mos ago",
    lastDays: 180,
    times: 2,
    reply: "< 25 mins",
    reliability: 95,
    verified: true,
    pending: false,
    honorScore: 96.8,
    milestones: [],
  },
  {
    id: 6,
    name: "Sana Iqbal",
    initials: "SI",
    blood: "B+",
    km: 9.5,
    area: "DHA Phase 4, Lahore",
    shortArea: "DHA",
    online: true,
    seen: "Available Now",
    confirmedAgo: "Confirmed 5h ago",
    last: "8 mos ago",
    lastDays: 240,
    times: 5,
    reply: "< 20 mins",
    reliability: 97,
    verified: true,
    pending: false,
    honorScore: 98.0,
    milestones: [],
  },
  {
    id: 7,
    name: "Dr. Sara Qureshi",
    initials: "SQ",
    blood: "O+",
    km: 3.5,
    area: "General Hospital Sector, Lahore",
    shortArea: "General Hospital",
    online: true,
    seen: "On Shift Nearby",
    confirmedAgo: "Confirmed 20m ago",
    last: "4 mos ago",
    lastDays: 122,
    times: 8,
    reply: "< 10 mins",
    reliability: 100,
    verified: true,
    pending: false,
    honorScore: 99.8,
    milestones: [],
  },
  {
    id: 8,
    name: "Bilal Anwar",
    initials: "BN",
    blood: "B-",
    km: 4.2,
    area: "Gulberg III, Lahore",
    shortArea: "Gulberg",
    online: true,
    seen: "Active & Online",
    confirmedAgo: "Confirmed 1h ago",
    last: "5 mos ago",
    lastDays: 150,
    times: 7,
    reply: "< 15 mins",
    reliability: 99,
    verified: true,
    pending: false,
    honorScore: 99.2,
    milestones: [],
  },
  {
    id: 9,
    name: "Aria Chen",
    initials: "AC",
    blood: "O-",
    km: 2.4,
    area: "St. Jude Metropolitan Sector",
    shortArea: "Metro Central",
    online: true,
    seen: "Verified Hero",
    confirmedAgo: "Confirmed 30m ago",
    last: "4 mos ago",
    lastDays: 118,
    times: 14,
    reply: "< 12 mins",
    reliability: 100,
    verified: true,
    pending: false,
    honorScore: 99.9,
    milestones: [
      {
        org: "St. Jude Metropolitan NICU",
        tag: "Universal Negative Platelets",
        date: "November 02, 2025",
        desc: "Responded to 3-donor controlled alert within 20 minutes for premature infant care.",
      },
    ],
  },
];

const INITIAL_REQUESTS = [
  {
    id: "BR-9402",
    blood: "O+",
    units: 2,
    caseCategory: "Intensive Care Unit (ICU)",
    urgency: "Urgent",
    hospital: "Mayo Hospital, Lahore",
    ward: "ICU Ward 2 • Bed 14",
    city: "Lahore, Punjab",
    requiredBy: "Today, 6:00 PM (3h 15m remaining)",
    requestedAgo: "Requested 48m ago",
    patient: "Farhan Malik (Age 42)",
    attendant: "Farhan Malik (Brother of Patient)",
    doctor: "Dr. S. Aslam (Hematology)",
    labId: "MH-LAB-44816",
    crossMatchStatus: "Sample Stored in Lab #2",
    slipNumber: "#488",
    stage: 3,
    status: "Active",
    notes: "2 units O+ whole blood required for ICU stabilization. Hospital attendant verified.",
    invitedDonors: [
      {
        donorId: 1,
        status: "Accepted",
        eta: "~25 Mins",
        targetTime: "3:15 PM",
        distance: "6.8 km away",
        traffic: "Moderate traffic",
        pulse: "Active",
        pulseNote: "Confirmed via GPS",
        respondedAt: "Confirmed 25m ago",
      },
      {
        donorId: 2,
        status: "On Hold",
        reason: "Automatically placed on hold when Hamza accepted under the 3-donor controlled protocol.",
        respondedAt: "Responded 22 mins ago • Standing by",
      },
      {
        donorId: 3,
        status: "On Hold",
        reason: "Automatically placed on hold when primary donor accepted under the 3-donor controlled protocol.",
        respondedAt: "Responded 25 mins ago • Standing by",
      },
    ],
  },
  {
    id: "BR-9311",
    blood: "B-",
    units: 1,
    caseCategory: "Emergency Ward",
    urgency: "Standard",
    hospital: "Jinnah Hospital, Emergency Ward 4",
    ward: "Emergency Ward 4",
    city: "Lahore, Punjab",
    requiredBy: "Oct 24, 2026",
    requestedAgo: "Fulfilled on Oct 24",
    patient: "Ayesha Siddiqui",
    attendant: "Coordinator Tariq",
    doctor: "Dr. Zeeshan Arshad",
    labId: "JH-LAB-19204",
    crossMatchStatus: "Transfusion Fulfilled",
    slipNumber: "#412",
    stage: 5,
    status: "Fulfilled",
    notes: "Fulfilled on Oct 24 by verified voluntary donor: Bilal Anwar.",
    rating: 5,
    invitedDonors: [
      {
        donorId: 8,
        status: "Donated",
        eta: "Completed",
        targetTime: "Fulfilled",
        distance: "4.2 km away",
        traffic: "Verified",
        pulse: "Verified",
        pulseNote: "Lab confirmed",
        respondedAt: "Fulfilled on Oct 24",
      },
    ],
  },
];

const INITIAL_DONOR_ALERTS = [
  {
    id: "ALT-771",
    units: 2,
    blood: "O+",
    hospital: "Mayo Hospital, ICU Ward 2 • Bed 14",
    distance: "~4.1 km away",
    recipient: "Tariq M.",
    verified: true,
    expiresIn: "44:51",
    matchLabel: "Exact Match",
    status: "Pending",
  },
  {
    id: "BR-8821",
    units: 1,
    blood: "O+",
    hospital: "Jinnah Hospital",
    ward: "Surgical Tower, 3rd Floor",
    patient: "Ayesha Siddiqui",
    coordinatorPhone: "+92 300 8129031",
    confirmedAgo: "Confirmed 25 mins ago",
    step: 2,
    status: "Accepted",
  },
];

const INITIAL_THREADS = [
  {
    id: "thread-1",
    donorId: 1,
    requestId: "BR-9402",
    hospital: "Mayo Hospital (Transfusion Lab 1F)",
    lastTime: "2m ago",
    statusTag: "At Hospital Site",
    unread: 1,
    archived: false,
    messages: [
      {
        id: "m1",
        sender: "recipient",
        time: "14:14",
        label: "You (Attendant)",
        text: "Hello Hamza, thank you so much for accepting. The patient is in Mayo Hospital ICU Ward 2. We have the requisition form ready.",
        delivered: true,
      },
      {
        id: "m2",
        sender: "donor",
        time: "14:16",
        label: "Hamza Tariq",
        text: "Hello! I am on my way. Should take about 20 minutes from Gulberg. I have completed my blood donation checklist.",
      },
      {
        id: "m3",
        sender: "system",
        time: "14:18",
        text: "Hamza Tariq reported departure towards Mayo Hospital",
      },
      {
        id: "m4",
        sender: "recipient",
        time: "14:21",
        label: "You (Attendant)",
        text: "Please head to the Blood Transfusion Counter on 1st Floor. Ask for Coordinator Tariq with request slip #BR-9402. I am waiting right outside the lab.",
        delivered: true,
      },
      {
        id: "m5",
        sender: "donor",
        time: "14:28",
        label: "Hamza Tariq",
        text: "I've just arrived at Mayo Hospital main gate, heading to Window 3 now.",
      },
    ],
  },
  {
    id: "thread-2",
    donorId: 2,
    requestId: "BR-9402",
    hospital: "Mayo Hospital, Lahore",
    lastTime: "1h ago",
    statusTag: "Standby Donor",
    unread: 0,
    archived: false,
    messages: [
      {
        id: "m2-1",
        sender: "system",
        time: "13:40",
        text: "Case #BR-9402 reserve standby activated",
      },
      {
        id: "m2-2",
        sender: "donor",
        time: "13:45",
        label: "Zainab Fatima",
        text: "Request is currently on standby. Ready to proceed within 25 minutes if backup is needed.",
      },
    ],
  },
  {
    id: "thread-3",
    donorId: 4,
    requestId: "BR-8810",
    hospital: "Jinnah Hospital",
    lastTime: "Yesterday",
    statusTag: "Completed #BR-8810",
    unread: 0,
    archived: true,
    messages: [
      {
        id: "m3-1",
        sender: "system",
        time: "Yesterday",
        text: "Donation completed safely. Lab certificate issued.",
      },
    ],
  },
];

const INITIAL_USER = {
  loggedIn: false,
  isDonor: false,
  name: "",
  email: "",
  phone: "",
  blood: "O+",
  city: "Lahore",
  area: "Model Town",
  donorId: "",
  available: false,
  lastConfirmed: "",
  matchingRadius: 10,
  safetyFlags: 0,
  completedDonations: 0,
  history: [],
};

const FAQS_DATA = [
  {
    q: "Does Life Link guarantee a blood donor will show up?",
    a: "No. Life Link is purely a voluntary connection and community coordination tool. Donors are compassionate private citizens who offer help of their own accord. We cannot legally or operationally guarantee donor arrival, attendance, physiological suitability, or schedule adherence.",
    recommendation: "Always maintain standby backup contacts or reach out to official hospital blood banks simultaneously in acute emergencies.",
  },
  {
    q: "Why is my donor status marked “May be outdated”?",
    a: "Under our 7-Day Freshness Principle, donor profiles that haven't been confirmed within 7 days are automatically flagged so families in critical distress don't call inactive numbers. Tap 'Keep Status Fresh' on your Donor Dashboard or Privacy Settings to restore priority visibility.",
  },
  {
    q: "When are my phone number and hospital details shared?",
    a: "Phone numbers and exact residential coordinates are permanently shielded by default. Communication takes place inside our encrypted in-app messenger. Ward and transfusion counter details are only revealed once a donor explicitly accepts an active requisition.",
  },
  {
    q: "How do emergency requests expire?",
    a: "Controlled emergency pings remain open for 60 minutes per dispatch cycle and expire automatically once the requested units are confirmed or after the deadline passes, preventing stale alerts from lingering.",
  },
  {
    q: "Can I use one account to both donate and request blood?",
    a: "Yes. Any verified member can switch seamlessly between Donor Dashboard and Recipient Dispatch using the navigation header or account menu, while maintaining a single identity verification record.",
  },
  {
    q: "How does the 3-report automatic safeguard work?",
    a: "There is zero human intermediary reading private logs. If an account accrues 3 independent community abuse or solicitation reports, the safety engine triggers an automatic 7-day restriction on generating emergency notices.",
  },
];

const STORAGE_KEY = "lifelink_platform_state_v2"; // legacy key — still cleared on logout
const TOKEN_KEY = "lifelink_jwt_token";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function mapApiDonor(d) {
  return {
    id: d.id,
    name: d.name,
    initials: d.initials,
    blood: d.bloodGroup,
    km: d.distanceKm ?? 3.5,
    area: d.area,
    shortArea: d.shortArea,
    online: d.online,
    seen: d.seenLabel,
    confirmedAgo: "Confirmed recently",
    last: d.lastDonationLabel || "—",
    lastDays: d.lastDonationDays || null,
    times: d.completedDonations || 0,
    reply: d.replyLabel,
    pending: false,
    milestones: [],
  };
}

function mapApiUser(u, prevUser) {
  return {
    ...(prevUser || INITIAL_USER),
    id: u.id,
    loggedIn: true,
    isDonor: Boolean(u.isDonor),
    name: u.name,
    email: u.email || prevUser?.email || "",
    phone: u.phone || prevUser?.phone || "",
    blood: u.bloodGroup || prevUser?.blood || "O+",
    city: u.city || "Lahore",
    area: u.area || "Model Town & Surrounds",
    donorId: u.donorIdCode || prevUser?.donorId || "",
    available: u.available ?? false,
    lastAvailabilityUpdate: u.lastAvailabilityUpdate || null,
    lastConfirmed: "Synced with MySQL",
    matchingRadius: u.matchingRadiusKm ?? 10,
    safetyFlags: u.safetyFlags ?? 0,
    completedDonations: u.completedDonations ?? 0,
  };
}

function mapApiRequest(r) {
  const statusMap = { ACTIVE: "Active", FULFILLED: "Fulfilled", CANCELLED: "Cancelled" };
  const invStatusMap = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    ON_HOLD: "On Hold",
    DECLINED: "Declined",
    DONATED: "Donated",
  };
  return {
    id: r.code,
    dbId: r.id,
    blood: r.bloodGroup,
    units: r.units,
    caseCategory: r.caseCategory,
    urgency: r.urgency.charAt(0) + r.urgency.slice(1).toLowerCase(),
    hospital: r.hospital,
    ward: r.ward,
    city: r.city,
    requiredBy: r.requiredBy,
    requestedAgo: "Synced",
    patient: r.patientName,
    attendant: r.attendantName,
    doctor: r.doctorName,
    labId: r.labId,
    crossMatchStatus: r.crossMatchStatus,
    slipNumber: r.slipNumber,
    stage: r.stage,
    status: statusMap[r.status] || "Active",
    notes: r.notes,
    rating: r.rating,
    invitedDonors: (r.invitations || []).map((inv) => ({
      id: inv.id,
      donorId: inv.donorId,
      status: invStatusMap[inv.status] || "Pending",
      eta: inv.eta,
      targetTime: inv.targetTime,
      distance: inv.distanceLabel,
      traffic: inv.trafficNote,
      pulse: inv.pulseStatus,
      pulseNote: inv.pulseNote,
      reason: inv.reason,
      respondedAt: inv.respondedAt,
    })),
  };
}

function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathPart, queryPart] = raw.split("?");
  const params = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((val, key) => {
      params[key] = val;
    });
  }
  return { path: pathPart || "/", params };
}

function loadSavedState() {
  // localStorage state fallback removed — UI uses the API only.
  // Auth token (TOKEN_KEY) is still kept in localStorage.
  return null;
}

const AppContext = createContext(null);

function AppProvider({ children, defaultRoute }) {
  const saved = loadSavedState();

  const [routeState, setRouteState] = useState(() => {
    if (window.location.hash) return parseHash();
    return { path: defaultRoute || "/", params: {} };
  });

  const [apiConnected, setApiConnected] = useState(false);
  const [user, setUser] = useState(saved?.user || INITIAL_USER);
  const [donors, setDonors] = useState(saved?.donors || INITIAL_DONORS);
  const [requests, setRequests] = useState(saved?.requests || INITIAL_REQUESTS);
  const [donorAlerts, setDonorAlerts] = useState(saved?.donorAlerts || INITIAL_DONOR_ALERTS);
  const [threads, setThreads] = useState(saved?.threads || INITIAL_THREADS);
  const [selectedDonorIds, setSelectedDonorIds] = useState(saved?.selectedDonorIds || [1, 2]);
  const [activeRequestId, setActiveRequestId] = useState(saved?.activeRequestId || "BR-9402");
  const [activeThreadId, setActiveThreadId] = useState(saved?.activeThreadId || "thread-1");
  const [activeDonorProfileId, setActiveDonorProfileId] = useState(saved?.activeDonorProfileId || 1);
  const [notifications, setNotifications] = useState(
    saved?.notifications || [
      {
        id: "n1",
        title: "Hamza Tariq arrived at Mayo Hospital",
        desc: "Request #BR-9402 • Heading to Transfusion Window 3",
        time: "2m ago",
        route: "/chat",
        unread: true,
      },
      {
        id: "n2",
        title: "2 Units O+ Urgent Alert nearby",
        desc: "Mayo Hospital ICU Ward 2 • ~4.1 km away",
        time: "18m ago",
        route: "/donor-dashboard",
        unread: true,
      },
    ]
  );
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  // Sync with Express REST API + MySQL when database is live
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const health = await apiFetch("/api/health");
        if (!active || health.database !== "mysql-connected") return;
        setApiConnected(true);

        const donorsRes = await apiFetch("/api/donors");
        if (!active) return;
        if (donorsRes.donors?.length) setDonors(donorsRes.donors.map(mapApiDonor));

        if (localStorage.getItem(TOKEN_KEY)) {
          try {
            const [me, reqsRes, chatsRes] = await Promise.all([
              apiFetch("/api/auth/me"),
              apiFetch("/api/requests"),
              apiFetch("/api/chats"),
            ]);
            if (!active) return;
            if (me.user) setUser((prev) => mapApiUser(me.user, prev));
            if (reqsRes.requests?.length) setRequests(reqsRes.requests.map(mapApiRequest));
            if (chatsRes.threads?.length) {
              setThreads(
                chatsRes.threads.map((t) => ({
                  id: String(t.id),
                  dbId: t.id,
                  donorId: t.donorId,
                  requestId: t.request?.code || String(t.requestId),
                  hospital: t.hospital,
                  lastTime: "Synced",
                  statusTag: t.statusTag,
                  unread: 0,
                  archived: t.archived,
                  messages: (t.messages || []).map((m) => ({
                    id: String(m.id),
                    sender: String(m.senderRole || "RECIPIENT").toLowerCase(),
                    time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    label: m.senderRole === "RECIPIENT" ? "You (Attendant)" : t.donor?.name || "Donor",
                    text: m.text,
                    delivered: m.delivered,
                  })),
                }))
              );
            }
          } catch {
            localStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch {
        // Fallback smoothly to local seeded state when MySQL is offline
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleHash = () => {
      setRouteState(parseHash());
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // State is not persisted to localStorage — UI uses the API only.

  const showToast = (message, tone = "success") => {
    const id = Date.now();
    setToast({ id, message, tone });
    setTimeout(() => {
      setToast((curr) => (curr && curr.id === id ? null : curr));
    }, 3600);
  };

  const navigate = (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const targetHash = `#${path}${qs ? `?${qs}` : ""}`;
    if (window.location.hash === targetHash) {
      setRouteState({ path, params });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = targetHash;
    }
  };

  const pushNotification = (title, desc, route = "/donor-dashboard") => {
    setNotifications((prev) => [
      { id: "n-" + Date.now(), title, desc, time: "Just now", route, unread: true },
      ...prev.slice(0, 7),
    ]);
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (apiConnected) apiFetch("/api/notifications/read", { method: "POST" }).catch(() => {});
  };

  const toggleSelectDonor = (donorId) => {
    const donor = donors.find((d) => d.id === donorId);
    if (!donor || donor.pending) return;
    if (selectedDonorIds.includes(donorId)) {
      setSelectedDonorIds((prev) => prev.filter((id) => id !== donorId));
      showToast(`${donor.name} removed from selection.`, "info");
      return;
    }
    if (selectedDonorIds.length >= 3) {
      showToast("Maximum 3 donors can be selected per controlled request.", "warn");
      return;
    }
    setSelectedDonorIds((prev) => [...prev, donorId]);
    showToast(`${donor.name} selected (${selectedDonorIds.length + 1}/3).`, "success");
  };

  const sendRequestsToSelected = (targetReqId) => {
    if (selectedDonorIds.length === 0) return;
    const reqId = targetReqId || activeRequestId;
    const picked = [...selectedDonorIds];

    if (apiConnected) {
      apiFetch(`/api/requests/${reqId}/invite`, {
        method: "POST",
        body: JSON.stringify({ donorIds: picked }),
      }).catch(() => {});
    }

    setDonors((prev) => prev.map((d) => (picked.includes(d.id) ? { ...d, pending: true } : d)));
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;
        const existingIds = new Set(r.invitedDonors.map((x) => x.donorId));
        const additions = picked
          .filter((id) => !existingIds.has(id))
          .map((id, idx) => {
            const donor = donors.find((d) => d.id === id);
            return {
              donorId: id,
              status: r.invitedDonors.length === 0 && idx === 0 ? "Accepted" : "Pending",
              eta: `~${Math.max(12, Math.round((donor?.km || 4) * 4))} Mins`,
              targetTime: "In 25 mins",
              distance: `${donor?.km || 4.0} km away`,
              traffic: "Moderate traffic",
              pulse: "Ping Sent",
              pulseNote: "Awaiting confirmation",
              respondedAt: "Invited just now",
            };
          });
        return { ...r, invitedDonors: [...r.invitedDonors, ...additions].slice(0, 3) };
      })
    );

    pushNotification(
      `Dispatched ${picked.length} controlled request${picked.length > 1 ? "s" : ""}`,
      `Assigned to requisition ${reqId}`,
      "/request-track"
    );
    setSelectedDonorIds([]);
    showToast(`Sent controlled request invites to ${picked.length} verified donor(s).`);
    navigate("/request-track", { id: reqId });
  };

  const createBloodRequest = async (payload) => {
    const newId = `BR-${Math.floor(9410 + Math.random() * 580)}`;
    if (apiConnected) {
      try {
        const res = await apiFetch("/api/requests", {
          method: "POST",
          body: JSON.stringify({
            bloodGroup: payload.blood,
            units: payload.units,
            caseCategory: payload.caseCategory,
            urgency: payload.urgency,
            hospital: payload.hospital,
            city: payload.city,
            requiredBy: payload.requiredBy,
            notes: payload.notes,
          }),
        });
        if (res.request) {
          const mapped = mapApiRequest(res.request);
          setRequests((prev) => [mapped, ...prev]);
          setActiveRequestId(mapped.id);
          pushNotification(`Created Requisition ${mapped.id}`, `${payload.units} Unit(s) ${payload.blood} • ${payload.hospital}`, "/request-track");
          showToast(`Requisition ${mapped.id} created! Matching donors alerted.`);
          return mapped.id;
        }
      } catch (err) {
        showToast(err.message, "warn");
        return null;
      }
    }

    const matchingDonors = donors.filter((d) => d.blood === payload.blood && d.online).slice(0, 3);
    const newRequest = {
      id: newId,
      blood: payload.blood,
      units: payload.units,
      caseCategory: payload.caseCategory,
      urgency: payload.urgency,
      hospital: payload.hospital,
      ward: payload.ward || "Transfusion Ward",
      city: payload.city,
      requiredBy: payload.requiredBy || "Within 12 hours",
      requestedAgo: "Requested just now",
      patient: user.loggedIn ? `${user.name} (Patient Requisition)` : "Verified Ward Patient",
      attendant: user.name || "Authorized Attendant",
      doctor: "Duty Hematology Officer",
      labId: `LAB-${Math.floor(10000 + Math.random() * 89999)}`,
      crossMatchStatus: "Awaiting Donor Sample",
      slipNumber: `#${Math.floor(500 + Math.random() * 400)}`,
      stage: 1,
      status: "Active",
      notes: payload.notes || "Replacement donor required per hospital protocol.",
      invitedDonors: matchingDonors.map((d, idx) => ({
        donorId: d.id,
        status: idx === 0 ? "Pending" : "On Hold",
        eta: `~${Math.round(d.km * 4 + 8)} Mins`,
        targetTime: "Pending",
        distance: `${d.km} km away`,
        traffic: "Normal traffic",
        pulse: "Alert Pushed",
        pulseNote: "Controlled 3-donor cap",
        respondedAt: "Pinged just now",
        reason: idx > 0 ? "Queued in 3-donor controlled slot until primary donor responds." : undefined,
      })),
    };

    setRequests((prev) => [newRequest, ...prev]);
    setActiveRequestId(newId);
    pushNotification(`Created Requisition ${newId}`, `${payload.units} Unit(s) ${payload.blood} • ${payload.hospital}`, "/request-track");
    showToast(`Requisition ${newId} created! Matching donors alerted.`);
    return newId;
  };

  const updateRequestStage = (reqId, nextStage) => {
    if (apiConnected) {
      apiFetch(`/api/requests/${reqId}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage: nextStage }),
      }).catch(() => {});
    }
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;
        const fulfilled = nextStage >= 5;
        return {
          ...r,
          stage: nextStage,
          status: fulfilled ? "Fulfilled" : "Active",
          crossMatchStatus: fulfilled
            ? "Transfusion Fulfilled"
            : nextStage === 4
            ? "Lab Cross-Match In Progress"
            : r.crossMatchStatus,
        };
      })
    );
    showToast(`Requisition ${reqId} updated to stage ${nextStage} of 5.`);
  };

  const reactivateStandbyDonor = (reqId, donorId) => {
    if (apiConnected) {
      apiFetch(`/api/requests/${reqId}/reactivate/${donorId}`, { method: "POST" }).catch(() => {});
    }
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;
        return {
          ...r,
          invitedDonors: r.invitedDonors.map((inv) =>
            inv.donorId === donorId
              ? {
                  ...inv,
                  status: "Accepted",
                  eta: "~18 Mins",
                  targetTime: "3:25 PM",
                  pulse: "Active",
                  pulseNote: "Reactivated standby",
                  respondedAt: "Reactivated just now",
                }
              : inv.status === "Accepted"
              ? { ...inv, status: "On Hold", respondedAt: "Moved to standby" }
              : inv
          ),
        };
      })
    );
    const d = donors.find((x) => x.id === donorId);
    showToast(`${d?.name || "Standby donor"} promoted to Active En Route.`);
  };

  const cancelRequest = (reqId) => {
    if (apiConnected) apiFetch(`/api/requests/${reqId}/cancel`, { method: "POST" }).catch(() => {});
    setRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: "Cancelled" } : r)));
    showToast(`Requisition ${reqId} has been cancelled.`, "info");
  };

  const acceptIncomingDonorAlert = (alertId) => {
    const alertItem = donorAlerts.find((a) => a.id === alertId);
    setDonorAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: "Accepted",
              step: 2,
              confirmedAgo: "Confirmed just now",
              ward: "ICU Ward 2 • Bed 14",
              patient: alertItem?.recipient || "Tariq M.",
              coordinatorPhone: "+92 300 8129031",
            }
          : a
      )
    );
    pushNotification("Donation Request Accepted", `In-app chat opened for ${alertItem?.hospital || "Hospital"}`, "/chat");
    showToast("Request accepted! Private chat with recipient coordinator is now active.");
  };

  const declineIncomingDonorAlert = (alertId, reason) => {
    setDonorAlerts((prev) => prev.filter((a) => a.id !== alertId));
    showToast(`Request declined${reason ? ` (${reason})` : ""}. Rerouted to next nearest donor.`, "info");
  };

  const advanceDonorActiveStep = (alertId) => {
    setDonorAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, step: Math.min(4, (a.step || 2) + 1) } : a))
    );
    setUser((prev) => ({
      ...prev,
      completedDonations: prev.completedDonations + 1,
      livesImpacted: prev.livesImpacted + 3,
    }));
    showToast("Marked as donated! Hospital lab confirmation logged.");
  };

  const sendMessage = (threadId, text, sender = "recipient") => {
    if (!text.trim()) return;
    const thread = threads.find((t) => t.id === threadId);
    if (apiConnected && thread?.dbId) {
      apiFetch(`/api/chats/${thread.dbId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: text.trim(), senderRole: sender.toUpperCase() }),
      }).catch(() => {});
    }
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              lastTime: "Just now",
              unread: 0,
              messages: [
                ...t.messages,
                {
                  id: "msg-" + Date.now(),
                  sender,
                  time: timeStr,
                  label: sender === "recipient" ? "You (Attendant)" : "Donor",
                  text: text.trim(),
                  delivered: true,
                },
              ],
            }
          : t
      )
    );
  };

  const openChatWithDonor = (donorId) => {
    const existing = threads.find((t) => t.donorId === donorId);
    if (existing) {
      setActiveThreadId(existing.id);
    } else {
      const donor = donors.find((d) => d.id === donorId);
      const newThread = {
        id: `thread-${donorId}-${Date.now()}`,
        donorId,
        requestId: activeRequestId,
        hospital: "Mayo Hospital (Transfusion Lab 1F)",
        lastTime: "Just now",
        statusTag: "Encrypted Relay",
        unread: 0,
        archived: false,
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: "system",
            time: "Now",
            text: `Encrypted relay opened with ${donor?.name || "Donor"}. Phone numbers remain shielded.`,
          },
        ],
      };
      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
    }
    navigate("/chat");
  };

  const openDonorProfile = (donorId) => {
    setActiveDonorProfileId(donorId);
    navigate("/donor-profile", { id: String(donorId) });
  };

  const loginUser = async ({ username, password, role }) => {
    if (apiConnected) {
      if (!password) {
        showToast("Please enter your password to sign in.", "warn");
        return false;
      }
      try {
        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        if (res.token && res.user) {
          localStorage.setItem(TOKEN_KEY, res.token);
          setUser((prev) => mapApiUser(res.user, prev));
          showToast(`Welcome back, ${res.user.name}!`);
          navigate(res.user.role === "RECIPIENT" ? "/recipient-dashboard" : "/donor-dashboard");
          return true;
        }
      } catch (err) {
        showToast(err.message, "warn");
        return false;
      }
    }

    setUser((prev) => ({
      ...prev,
      loggedIn: true,
      role: role || prev.role,
      name: username?.trim() || prev.name,
      lastConfirmed: "Just now",
    }));
    showToast(`Welcome back, ${username?.trim() || user.name}!`);
    navigate(role === "recipient" ? "/recipient-dashboard" : "/donor-dashboard");
    return true;
  };

  const saveSettings = async (updates) => {
    if (apiConnected && localStorage.getItem(TOKEN_KEY)) {
      try {
        const res = await apiFetch("/api/settings", {
          method: "PUT",
          body: JSON.stringify({
            name: updates.name,
            email: updates.email,
            phone: updates.phone,
            bloodGroup: updates.blood,
            city: updates.city,
            area: updates.area,
            available: updates.available,
            strictPhoneShielding: updates.strictPhoneShielding,
            matchingRadiusKm: updates.matchingRadius,
          }),
        });
        if (res.user) {
          setUser((prev) => mapApiUser(res.user, prev));
          showToast("Account & privacy settings saved successfully!");
          return true;
        }
      } catch (err) {
        showToast(err.message, "warn");
        return false;
      }
    }
    setUser((prev) => ({ ...prev, ...updates, lastConfirmed: "Just now" }));
    showToast("Account & privacy settings saved successfully!");
    return true;
  };

  const submitSafetyReport = async ({ targetUserId, category, reason, evidence }) => {
    if (apiConnected && localStorage.getItem(TOKEN_KEY)) {
      try {
        const res = await apiFetch("/api/reports", {
          method: "POST",
          body: JSON.stringify({ targetUserId, category, reason, evidence }),
        });
        showToast(
          res.autoRestricted
            ? "Safety report submitted. Threshold reached: emergency request privileges restricted for 7 days."
            : "Safety report submitted confidentially.",
          "info"
        );
        return true;
      } catch (err) {
        showToast(err.message, "warn");
        return false;
      }
    }
    showToast("Safety report logged confidentially.", "info");
    return true;
  };

  const signupUser = async (form) => {
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          bloodGroup: form.blood,
          city: form.city,
          area: form.area,
        }),
      });
      if (res.token && res.user) {
        localStorage.setItem(TOKEN_KEY, res.token);
        setUser((prev) => mapApiUser(res.user, prev));
        showToast(`Account created for ${res.user.name}!`);
        navigate("/donor-dashboard");
      }
    } catch (err) {
      showToast(err.message, "warn");
    }
  };

  const saveProfile = async (form) => {
    try {
      const res = await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          bloodGroup: form.blood,
          city: form.city,
          area: form.area,
          phone: form.phone,
        }),
      });
      if (res.user) setUser((prev) => mapApiUser(res.user, prev));
      showToast("Profile updated.");
      return true;
    } catch (err) {
      showToast(err.message, "warn");
      return false;
    }
  };

  const enableDonorMode = async () => {
    try {
      const res = await apiFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ isDonor: true }),
      });
      if (res.user) setUser((prev) => mapApiUser(res.user, prev));
      showToast("Donor mode enabled (starting as Unavailable).");
    } catch (err) {
      showToast(err.message, "warn");
    }
  };

  const toggleDonorAvailability = async (nextAvailable) => {
    try {
      const res = await apiFetch("/api/donor/availability", {
        method: "PATCH",
        body: JSON.stringify({ available: Boolean(nextAvailable) }),
      });
      if (res.user) setUser((prev) => mapApiUser(res.user, prev));
      showToast(`Availability set to ${nextAvailable ? "Available" : "Unavailable"}.`);
    } catch (err) {
      showToast(err.message, "warn");
    }
  };

  const searchDonors = async ({ bloodGroup, city, area, radius }) => {
    try {
      const qs = new URLSearchParams();
      if (bloodGroup) qs.set("bloodGroup", bloodGroup);
      if (city) qs.set("city", city);
      if (area) qs.set("area", area);
      if (radius) qs.set("radius", radius);
      return await apiFetch(`/api/donors?${qs.toString()}`);
    } catch (err) {
      showToast(err.message, "warn");
      return null;
    }
  };

  const contactDonor = async (donorId) => {
    try {
      return await apiFetch(`/api/donors/${donorId}/contact`, { method: "POST" });
    } catch (err) {
      showToast(err.message, "warn");
      return null;
    }
  };

  const deleteAccount = async () => {
    try {
      await apiFetch("/api/settings/account", { method: "DELETE" });
      localStorage.removeItem(TOKEN_KEY);
      setUser(INITIAL_USER);
      showToast("Account deactivated and anonymised.", "info");
      navigate("/");
    } catch (err) {
      showToast(err.message, "warn");
    }
  };

  const logoutUser = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser((prev) => ({ ...prev, loggedIn: false }));
    showToast("Signed out safely.", "info");
    navigate("/");
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(INITIAL_USER);
    setDonors(INITIAL_DONORS);
    setRequests(INITIAL_REQUESTS);
    setDonorAlerts(INITIAL_DONOR_ALERTS);
    setThreads(INITIAL_THREADS);
    setSelectedDonorIds([1, 2]);
    setActiveRequestId("BR-9402");
    setActiveThreadId("thread-1");
    setActiveDonorProfileId(1);
    showToast("Demo data reset to defaults.", "info");
  };

  return (
    <AppContext.Provider
      value={{
        apiConnected,
        route: routeState.path,
        params: routeState.params,
        navigate,
        user,
        setUser,
        donors,
        setDonors,
        requests,
        setRequests,
        donorAlerts,
        threads,
        setThreads,
        selectedDonorIds,
        setSelectedDonorIds,
        toggleSelectDonor,
        sendRequestsToSelected,
        activeRequestId,
        setActiveRequestId,
        activeThreadId,
        setActiveThreadId,
        activeDonorProfileId,
        setActiveDonorProfileId,
        createBloodRequest,
        updateRequestStage,
        reactivateStandbyDonor,
        cancelRequest,
        acceptIncomingDonorAlert,
        declineIncomingDonorAlert,
        advanceDonorActiveStep,
        sendMessage,
        openChatWithDonor,
        openDonorProfile,
        notifications,
        markNotificationsRead,
        loginUser,
        signupUser,
        saveSettings,
        saveProfile,
        enableDonorMode,
        toggleDonorAvailability,
        searchDonors,
        contactDonor,
        deleteAccount,
        submitSafetyReport,
        logoutUser,
        resetDemoData,
        toast,
        showToast,
        modal,
        setModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  return useContext(AppContext);
}

window.LifeLink = {
  BLOOD_GROUPS,
  BLOOD_AVAILABILITY,
  BLOOD_COMPATIBILITY,
  FAQS_DATA,
  AppProvider,
  useApp,
};
