import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Home, Search, PlusCircle, User, Bell, MapPin, Clock, Users, Star,
  Shield, Sparkles, ArrowRight, ArrowLeft, Navigation, Phone, AlertTriangle,
  GraduationCap, Mail, ChevronRight, Wallet, Car, LogOut, Settings,
  BadgeCheck, Calendar, Zap, Upload, FileText, Image as ImageIcon,
  Loader2, CheckCircle2, RefreshCw, X,
} from "lucide-react";
import { analyzeTimetable, type TimetableAnalysis } from "../lib/timetable";
import { sendSos } from "../lib/sos";

export const Route = createFileRoute("/")({
  component: CampusRideApp,
});

type Screen = "login" | "home" | "offer" | "find" | "details" | "live" | "profile";

function CampusRideApp() {
  const [screen, setScreen] = useState<Screen>("login");

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-6">
      {/* Phone frame */}
      <div className="relative w-full sm:w-[420px] sm:h-[860px] sm:rounded-[2.5rem] sm:border sm:border-white/50 sm:shadow-[0_30px_80px_-20px_oklch(0.4_0.15_240/0.35)] overflow-hidden bg-transparent">
        <div className="relative h-screen sm:h-full overflow-y-auto no-scrollbar">
          {screen === "login" && <LoginScreen onDone={() => setScreen("home")} />}
          {screen === "home" && <HomeScreen go={setScreen} />}
          {screen === "offer" && <OfferRideScreen back={() => setScreen("home")} />}
          {screen === "find" && <FindRideScreen back={() => setScreen("home")} onSelect={() => setScreen("details")} />}
          {screen === "details" && <RideDetailsScreen back={() => setScreen("find")} onStart={() => setScreen("live")} />}
          {screen === "live" && <LiveTripScreen back={() => setScreen("home")} />}
          {screen === "profile" && <ProfileScreen back={() => setScreen("home")} onLogout={() => setScreen("login")} />}

          {screen !== "login" && screen !== "live" && <BottomNav current={screen} go={setScreen} />}
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{scrollbar-width:none}`}</style>
    </div>
  );
}

/* ---------- Shared ---------- */

function ScreenHeader({ title, back, right }: { title: string; back?: () => void; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 glass px-5 py-4 flex items-center gap-3">
      {back && (
        <button onClick={back} className="h-9 w-9 grid place-items-center rounded-full glass shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      <h2 className="text-lg font-semibold flex-1 truncate">{title}</h2>
      {right}
    </div>
  );
}

function BottomNav({ current, go }: { current: Screen; go: (s: Screen) => void }) {
  const items: { id: Screen; icon: typeof Home; label: string }[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "find", icon: Search, label: "Find" },
    { id: "offer", icon: PlusCircle, label: "Offer" },
    { id: "profile", icon: User, label: "Profile" },
  ];
  return (
    <div className="sticky bottom-0 z-30 px-4 pb-4 pt-2">
      <div className="glass rounded-3xl px-2 py-2 flex justify-around">
        {items.map(({ id, icon: Icon, label }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition ${
                active ? "gradient-brand" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-white" : ""}`} />
              <span className={`text-[10px] font-medium ${active ? "text-white" : ""}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Screens ---------- */

function LoginScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"email" | "otp">("email");
  return (
    <div className="min-h-full flex flex-col px-6 pt-14 pb-8 relative">
      <div className="absolute inset-0 -z-10 opacity-70"
        style={{ background: "radial-gradient(60% 40% at 50% 0%, oklch(0.85 0.12 200) 0%, transparent 70%)" }} />
      <div className="flex items-center gap-2 mb-10">
        <div className="h-11 w-11 rounded-2xl gradient-brand grid place-items-center shadow-[var(--shadow-soft)]">
          <Car className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold font-display">CampusRide</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-4xl font-bold leading-tight">
          Ride with your <span className="text-gradient-brand">campus</span>.
        </h1>
        <p className="mt-3 text-muted-foreground">
          AI-matched carpools for verified university students. Safer, cheaper, greener.
        </p>

        <div className="mt-8 glass rounded-3xl p-5 space-y-4">
          {step === "email" ? (
            <>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">University Email</label>
              <div className="flex items-center gap-3 bg-white/70 rounded-2xl px-4 py-3 border border-white/60">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  defaultValue="aditi.sharma@thapar.edu"
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
              <button
                onClick={() => setStep("otp")}
                className="w-full gradient-brand rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]"
              >
                Send verification code <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" /> Only verified .edu accounts allowed
              </p>
            </>
          ) : (
            <>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enter 6-digit code</label>
              <div className="flex gap-2 justify-between">
                {["4", "1", "2", "8", "•", "•"].map((c, i) => (
                  <div key={i} className="h-12 w-11 rounded-xl bg-white/70 border border-white/60 grid place-items-center text-lg font-semibold">
                    {c}
                  </div>
                ))}
              </div>
              <button
                onClick={onDone}
                className="w-full gradient-brand rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]"
              >
                Verify & continue <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => setStep("email")} className="w-full text-xs text-muted-foreground">
                Change email
              </button>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-[color:var(--mint)]" /> Verified</span>
          <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-[color:var(--primary)]" /> Secure</span>
          <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[color:var(--mint)]" /> AI matched</span>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="pb-28">
      <div className="px-5 pt-12 pb-6 relative">
        <div className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(80% 60% at 100% 0%, oklch(0.85 0.14 165) 0%, transparent 60%), radial-gradient(80% 60% at 0% 0%, oklch(0.85 0.12 240) 0%, transparent 60%)" }} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Good afternoon,</p>
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
              Aditi <BadgeCheck className="h-5 w-5 text-[color:var(--primary)]" />
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 w-10 grid place-items-center rounded-full glass"><Bell className="h-4 w-4" /></button>
            <button onClick={() => go("profile")} className="h-10 w-10 rounded-full gradient-brand grid place-items-center font-semibold text-white text-sm">AS</button>
          </div>
        </div>

        {/* AI onboarding / suggested ride */}
        <AIRideCard go={go} />

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => go("offer")} className="glass rounded-3xl p-4 text-left group">
            <div className="h-10 w-10 rounded-2xl gradient-brand grid place-items-center mb-3">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
            <p className="font-semibold">Offer a Ride</p>
            <p className="text-xs text-muted-foreground">Share your car, split fuel</p>
          </button>
          <button onClick={() => go("find")} className="glass rounded-3xl p-4 text-left">
            <div className="h-10 w-10 rounded-2xl grid place-items-center mb-3"
              style={{ background: "linear-gradient(135deg, oklch(0.78 0.15 165), oklch(0.72 0.14 190))" }}>
              <Search className="h-5 w-5 text-white" />
            </div>
            <p className="font-semibold">Find a Ride</p>
            <p className="text-xs text-muted-foreground">Match with peers</p>
          </button>
        </div>
      </div>

      {/* Upcoming */}
      <div className="px-5 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Upcoming rides</h3>
          <button className="text-xs text-[color:var(--primary)] font-semibold">See all</button>
        </div>
        <div className="space-y-3">
          {upcomingRides.map((r, i) => (
            <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl grid place-items-center shrink-0"
                style={{ background: "color-mix(in oklab, oklch(0.55 0.18 240) 15%, transparent)" }}>
                <Car className="h-5 w-5 text-[color:var(--primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{r.from} → {r.to}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <Clock className="h-3 w-3" /> {r.time} · <Users className="h-3 w-3" /> {r.seats} seats
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-5 glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Your impact</h3>
            <Zap className="h-4 w-4 text-[color:var(--mint)]" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { v: "₹2,340", l: "Saved" },
              { v: "18 kg", l: "CO₂ cut" },
              { v: "27", l: "Rides" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-lg font-bold text-gradient-brand">{s.v}</p>
                <p className="text-[11px] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const upcomingRides = [
  { from: "Thapar Uni", to: "Chandigarh Sec 17", time: "Today, 1:15 PM", seats: 3 },
  { from: "Girls Hostel B", to: "Elante Mall", time: "Tomorrow, 5:00 PM", seats: 2 },
];

const processingSteps = [
  "Analyzing timetable...",
  "Detecting class timings...",
  "Finding students with similar schedules...",
  "Generating ride recommendations...",
];

type AICardState = "setup" | "processing" | "suggested";

// Canned schedule used by the "Use Demo Timetable" shortcut so users can
// explore instantly without an upload or an API key.
const DEMO_ANALYSIS: TimetableAnalysis = {
  classTimings: [
    { day: "Monday", subject: "Data Structures", startTime: "9:00 AM", endTime: "10:00 AM" },
    { day: "Monday", subject: "DBMS", startTime: "11:00 AM", endTime: "12:00 PM" },
    { day: "Tuesday", subject: "Operating Systems", startTime: "10:00 AM", endTime: "11:15 AM" },
    { day: "Wednesday", subject: "Computer Networks", startTime: "12:00 PM", endTime: "1:15 PM" },
  ],
  lastClassEndTime: "1:15 PM",
  days: ["Monday", "Tuesday", "Wednesday"],
  subjects: ["Data Structures", "DBMS", "Operating Systems", "Computer Networks"],
};

function loadStoredAnalysis(): TimetableAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("timetableAnalysis");
    return raw ? (JSON.parse(raw) as TimetableAnalysis) : null;
  } catch {
    return null;
  }
}

function AIRideCard({ go }: { go: (s: Screen) => void }) {
  const [state, setState] = useState<AICardState>(() =>
    typeof window !== "undefined" && localStorage.getItem("timetableUploaded") === "true"
      ? "suggested"
      : "setup"
  );
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TimetableAnalysis | null>(loadStoredAnalysis);
  const [error, setError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const demoTimer = useRef<number | null>(null);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (file) void analyzeFile(file);
  };

  // Reveal the processing checklist while the analysis runs.
  useEffect(() => {
    if (state !== "processing") return;
    setVisibleSteps(0);
    const timers = processingSteps.map((_, i) =>
      window.setTimeout(() => setVisibleSteps(i + 1), 300 + i * 400)
    );
    return () => timers.forEach(clearTimeout);
  }, [state]);

  // Cancel a pending demo simulation if the card unmounts.
  useEffect(() => () => {
    if (demoTimer.current) clearTimeout(demoTimer.current);
  }, []);

  return (
    <div className="mt-6 rounded-3xl p-5 glass-dark relative overflow-hidden">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.15 165) 0%, transparent 70%)" }} />

      {/* Hidden native file pickers */}
      <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFileSelected} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />

      {state === "setup" && (
        <>
          <div className="flex items-center gap-2 text-base font-bold tracking-tight text-white">
            <Sparkles className="h-4 w-4 text-[color:var(--mint)]" /> 🤖 AI Ride Matching
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/75">
            Upload your class timetable so CampusRide can recommend rides based on your schedule.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => pdfInputRef.current?.click()}
              className="rounded-2xl px-3 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/30 transition-colors"
            >
              <FileText className="h-4 w-4 text-[color:var(--mint)]" /> Upload PDF
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="rounded-2xl px-3 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/30 transition-colors"
            >
              <ImageIcon className="h-4 w-4 text-[color:var(--mint)]" /> Upload Image
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/25" />
            <span className="text-[11px] font-semibold tracking-widest text-white/70">OR</span>
            <div className="h-px flex-1 bg-white/25" />
          </div>

          <button
            onClick={() => useDemoTimetable()}
            className="w-full gradient-brand rounded-2xl py-4 text-[15px] font-semibold tracking-tight flex items-center justify-center gap-2 shadow-[var(--shadow-soft)] hover:brightness-105 transition"
          >
            <Upload className="h-4 w-4" /> ✨ Use Demo Timetable (Recommended)
          </button>
          <p className="mt-3 text-[11px] text-center text-white/55">
            Perfect for exploring CampusRide instantly.
          </p>
          {error && (
            <p className="mt-3 text-[12px] text-center text-destructive flex items-center justify-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}
        </>
      )}

      {state === "processing" && (
        <>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Loader2 className="h-4 w-4 animate-spin text-[color:var(--mint)]" /> 🤖 AI Processing...
          </div>
          {fileName && (
            <p className="mt-2 text-[13px] leading-snug text-muted-foreground flex items-center gap-1.5 truncate">
              <FileText className="h-3.5 w-3.5 shrink-0 text-[color:var(--primary)]" />
              <span className="truncate">{fileName}</span>
            </p>
          )}
          <div className="mt-4 space-y-2.5">
            {processingSteps.map((step, i) => (
              <div
                key={step}
                className={`flex items-center gap-2 text-[13px] transition-opacity duration-300 ${
                  i < visibleSteps ? "opacity-100" : "opacity-30"
                }`}
              >
                {i < visibleSteps ? (
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--mint)] shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {state === "suggested" && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--mint)]">
              <Sparkles className="h-3.5 w-3.5" /> AI SUGGESTED RIDE
            </div>
            <button
              onClick={() => beginSetup()}
              className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Change Timetable
            </button>
          </div>
          <p className="mt-2 text-[15px] leading-snug">
            Based on your uploaded timetable, your last class ends at <span className="font-semibold">{analysis?.lastClassEndTime ?? "1:15 PM"}</span>. We found <span className="font-semibold">3 students</span> heading to <span className="font-semibold">Chandigarh</span> around the same time.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              {["#8B5CF6", "#22C55E", "#F59E0B"].map((c, i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-[oklch(0.22_0.05_250)]" style={{ background: c }} />
              ))}
            </div>
            <button
              onClick={() => go("details")}
              className="rounded-full bg-white text-[color:var(--foreground)] px-4 py-2 text-sm font-semibold flex items-center gap-1"
            >
              Join ride <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Real upload path: send the file to the Gemini-backed server function.
  async function analyzeFile(file: File) {
    setError(null);
    setFileName(file.name);
    setState("processing");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await analyzeTimetable({ data: form });
      applyAnalysis(result);
    } catch (err) {
      setState("setup");
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  // Demo path: no file, no API call — reuse the same processing flow.
  function useDemoTimetable() {
    setError(null);
    setFileName(null);
    setState("processing");
    demoTimer.current = window.setTimeout(() => applyAnalysis(DEMO_ANALYSIS), 2000);
  }

  function applyAnalysis(result: TimetableAnalysis) {
    setAnalysis(result);
    localStorage.setItem("timetableUploaded", "true");
    localStorage.setItem("timetableAnalysis", JSON.stringify(result));
    setState("suggested");
  }

  function beginSetup() {
    setError(null);
    setFileName(null);
    setState("setup");
  }
}

function OfferRideScreen({ back }: { back: () => void }) {
  return (
    <div className="pb-28">
      <ScreenHeader title="Offer a Ride" back={back} />
      <div className="px-5 pt-5 space-y-4">
        <div className="glass rounded-3xl p-5 space-y-4">
          <Field icon={<MapPin className="h-4 w-4 text-[color:var(--primary)]" />} label="Pickup" value="Thapar University, Main Gate" />
          <div className="ml-6 border-l-2 border-dashed border-white/70 h-3" />
          <Field icon={<Navigation className="h-4 w-4 text-[color:var(--mint)]" />} label="Destination" value="Chandigarh, Sector 17" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Departure</p>
            <p className="mt-1 font-semibold flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Today</p>
            <p className="text-sm text-muted-foreground">1:15 PM</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Seats</p>
            <div className="mt-1 flex items-center gap-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={`h-7 w-7 rounded-full grid place-items-center text-xs font-semibold ${n <= 3 ? "gradient-brand text-white" : "bg-white/60 text-muted-foreground"}`}>
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Cost per seat</p>
              <p className="text-2xl font-bold text-gradient-brand">₹85</p>
              <p className="text-xs text-muted-foreground">Auto-calculated fuel split</p>
            </div>
            <div className="h-14 w-14 rounded-2xl gradient-brand grid place-items-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <p className="text-sm font-semibold mb-3">Ride preferences</p>
          <div className="flex flex-wrap gap-2">
            {["Music OK", "AC on", "No smoking", "Girls only", "Quiet ride"].map((p, i) => (
              <span key={p} className={`text-xs px-3 py-1.5 rounded-full ${i < 3 ? "gradient-brand text-white" : "bg-white/60 text-muted-foreground"}`}>
                {p}
              </span>
            ))}
          </div>
        </div>

        <button className="w-full gradient-brand rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]">
          Publish ride <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-white/70 grid place-items-center shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className="font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

const availableRides = [
  { name: "Rohan K.", dept: "CSE '25", from: "Thapar Uni", to: "Chandigarh Sec 17", time: "1:15 PM", seats: 3, cost: 85, score: 4.9, color: "#4F46E5" },
  { name: "Priya M.", dept: "ECE '26", from: "Thapar Uni", to: "Elante Mall", time: "2:00 PM", seats: 2, cost: 90, score: 4.8, color: "#10B981" },
  { name: "Arjun S.", dept: "MBA '25", from: "Boys Hostel D", to: "Panchkula", time: "4:30 PM", seats: 1, cost: 120, score: 4.7, color: "#F59E0B" },
  { name: "Neha V.", dept: "Design '27", from: "Thapar Uni", to: "Mohali Airport", time: "6:00 PM", seats: 3, cost: 150, score: 5.0, color: "#EC4899" },
];

function FindRideScreen({ back, onSelect }: { back: () => void; onSelect: () => void }) {
  return (
    <div className="pb-28">
      <ScreenHeader title="Find a Ride" back={back} />
      <div className="px-5 pt-5 space-y-4">
        <div className="glass rounded-3xl p-5 space-y-3">
          <Field icon={<MapPin className="h-4 w-4 text-[color:var(--primary)]" />} label="From" value="Thapar University" />
          <Field icon={<Navigation className="h-4 w-4 text-[color:var(--mint)]" />} label="To" value="Chandigarh" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/60 rounded-xl px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">When</p>
              <p className="text-sm font-semibold">Today, 1 PM</p>
            </div>
            <div className="bg-white/60 rounded-xl px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Seats needed</p>
              <p className="text-sm font-semibold">1</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold">{availableRides.length} matches nearby</p>
          <span className="text-xs text-[color:var(--primary)] font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI ranked
          </span>
        </div>

        <div className="space-y-3">
          {availableRides.map((r, i) => (
            <button key={i} onClick={onSelect} className="w-full text-left glass rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl grid place-items-center text-white font-semibold shrink-0" style={{ background: r.color }}>
                  {r.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold truncate">{r.name}</p>
                    <BadgeCheck className="h-4 w-4 text-[color:var(--primary)] shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.dept}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gradient-brand">₹{r.cost}</p>
                  <p className="text-[10px] text-muted-foreground">per seat</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/60 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {r.time}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /> {r.seats} seats</span>
                <span className="flex items-center gap-1 font-semibold"><Star className="h-3 w-3 fill-[color:var(--mint)] text-[color:var(--mint)]" /> {r.score}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RideDetailsScreen({ back, onStart }: { back: () => void; onStart: () => void }) {
  return (
    <div className="pb-28">
      <ScreenHeader title="Ride Details" back={back} />
      <div className="px-5 pt-5 space-y-4">
        {/* Driver */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl grid place-items-center text-white font-bold text-xl" style={{ background: "#4F46E5" }}>
              RK
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-lg">Rohan Kapoor</p>
                <BadgeCheck className="h-5 w-5 text-[color:var(--primary)]" />
              </div>
              <p className="text-xs text-muted-foreground">CSE '25 · Thapar University</p>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-semibold"><Star className="h-3.5 w-3.5 fill-[color:var(--mint)] text-[color:var(--mint)]" /> 4.9</span>
                <span className="text-muted-foreground">142 rides</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <TrustPill label="Trust Score" value="98" />
            <TrustPill label="On-time" value="96%" />
            <TrustPill label="Verified" value="✓" />
          </div>
        </div>

        {/* Route */}
        <div className="glass rounded-3xl p-5">
          <div className="flex">
            <div className="flex flex-col items-center mr-4 pt-1">
              <div className="h-3 w-3 rounded-full bg-[color:var(--primary)]" />
              <div className="w-0.5 flex-1 my-1 bg-gradient-to-b from-[color:var(--primary)] to-[color:var(--mint)] min-h-[40px]" />
              <div className="h-3 w-3 rounded-full bg-[color:var(--mint)]" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">1:15 PM · Pickup</p>
                <p className="font-semibold">Thapar University, Main Gate</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">1:55 PM · Drop-off</p>
                <p className="font-semibold">Chandigarh, Sector 17</p>
              </div>
            </div>
          </div>
        </div>

        {/* Car & cost */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4">
            <Car className="h-5 w-5 text-[color:var(--primary)] mb-2" />
            <p className="font-semibold text-sm">Hyundai i20</p>
            <p className="text-xs text-muted-foreground">White · PB-11-AK-2205</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <Users className="h-5 w-5 text-[color:var(--mint)] mb-2" />
            <p className="font-semibold text-sm">3 seats left</p>
            <p className="text-xs text-muted-foreground">1 rider joined</p>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <p className="text-sm font-semibold mb-3">Cost split</p>
          <div className="space-y-2 text-sm">
            <Row label="Estimated fuel" value="₹340" />
            <Row label="Toll" value="₹60" />
            <Row label="Split across 4" value="÷ 4" />
            <div className="border-t border-white/60 pt-2 flex items-center justify-between">
              <span className="font-semibold">Your share</span>
              <span className="text-xl font-bold text-gradient-brand">₹85</span>
            </div>
          </div>
        </div>

        <button onClick={onStart} className="w-full gradient-brand rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]">
          Confirm & join ride <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TrustPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/60 rounded-xl py-2">
      <p className="text-base font-bold text-gradient-brand">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

// Live trip / driver data used by the Call and SOS actions.
const liveRide = {
  rideId: "ride_rk_chd_0115",
  userId: "aditi_sharma",
  driver: { name: "Rohan K.", phone: "+919876543210" },
};

function LiveTripScreen({ back }: { back: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }

  function confirmSos() {
    setConfirmOpen(false);
    if (!("geolocation" in navigator)) {
      showToast("Location isn't available on this device.", false);
      return;
    }
    setSending(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await sendSos({
            data: {
              rideId: liveRide.rideId,
              userId: liveRide.userId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              timestamp: new Date().toISOString(),
            },
          });
          showToast("SOS sent successfully.", true);
        } catch {
          showToast("Couldn't send SOS. Please try again.", false);
        } finally {
          setSending(false);
        }
      },
      () => {
        setSending(false);
        showToast("Enable location access to send an SOS.", false);
      }
    );
  }

  return (
    <div className="relative h-full min-h-screen sm:min-h-full">
      {/* Faux map */}
      <div className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.9 0.05 200) 0%, oklch(0.88 0.07 165) 100%)",
        }}>
        <svg className="absolute inset-0 w-full h-full opacity-70" viewBox="0 0 400 800" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path d="M 40 700 Q 120 500 180 420 T 340 120" stroke="oklch(0.55 0.18 240)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="0" />
          <path d="M 40 700 Q 120 500 180 420" stroke="oklch(0.78 0.15 165)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="700" r="10" fill="oklch(0.55 0.18 240)" />
          <circle cx="340" cy="120" r="10" fill="oklch(0.78 0.15 165)" />
          <circle cx="180" cy="420" r="14" fill="white" stroke="oklch(0.55 0.18 240)" strokeWidth="4" />
        </svg>
      </div>

      {/* Top bar */}
      <div className="relative z-10 px-4 pt-12">
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
          <button onClick={back} className="h-8 w-8 grid place-items-center rounded-full bg-white/70">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase text-muted-foreground font-semibold">Trip in progress</p>
            <p className="font-semibold truncate">To Chandigarh Sec 17</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">ETA</p>
            <p className="font-bold text-gradient-brand">14 min</p>
          </div>
        </div>
      </div>

      {/* SOS floating */}
      <button
        onClick={() => setConfirmOpen(true)}
        className="absolute right-4 top-40 z-10 h-14 w-14 rounded-full grid place-items-center text-white font-bold shadow-lg"
        style={{ background: "linear-gradient(135deg, oklch(0.65 0.24 25), oklch(0.55 0.24 15))" }}>
        <AlertTriangle className="h-6 w-6" />
      </button>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div className="glass rounded-3xl p-5">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl grid place-items-center text-white font-semibold" style={{ background: "#4F46E5" }}>RK</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold">Rohan K.</p>
                <BadgeCheck className="h-4 w-4 text-[color:var(--primary)]" />
              </div>
              <p className="text-xs text-muted-foreground">Hyundai i20 · PB-11-AK-2205</p>
            </div>
            <a
              href={`tel:${liveRide.driver.phone}`}
              className="h-10 w-10 grid place-items-center rounded-full gradient-brand"
            >
              <Phone className="h-4 w-4 text-white" />
            </a>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Distance" value="8.4 km" />
            <Stat label="Speed" value="42 km/h" />
            <Stat label="Arrive" value="1:55 PM" />
          </div>

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={sending}
            className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, oklch(0.6 0.24 25), oklch(0.5 0.24 15))" }}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            {sending ? "Sending SOS…" : "Emergency SOS"}
          </button>
        </div>
      </div>

      {/* Success / error toast */}
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl px-4 py-3 flex items-center gap-2 shadow-lg">
          {toast.ok ? (
            <CheckCircle2 className="h-4 w-4 text-[color:var(--mint)] shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Emergency SOS confirmation modal */}
      {confirmOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative glass rounded-3xl p-6 w-full max-w-[320px] text-center">
            <button
              onClick={() => setConfirmOpen(false)}
              className="absolute right-3 top-3 h-8 w-8 grid place-items-center rounded-full bg-white/70"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto h-14 w-14 rounded-2xl grid place-items-center"
              style={{ background: "linear-gradient(135deg, oklch(0.65 0.24 25), oklch(0.55 0.24 15))" }}>
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <p className="mt-4 font-semibold text-lg">Send Emergency SOS?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This shares your live location with CampusRide safety.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 glass rounded-2xl py-3 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmSos}
                className="flex-1 rounded-2xl py-3 font-semibold text-white"
                style={{ background: "linear-gradient(135deg, oklch(0.6 0.24 25), oklch(0.5 0.24 15))" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/60 rounded-xl py-2">
      <p className="font-bold text-sm">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileScreen({ back, onLogout }: { back: () => void; onLogout: () => void }) {
  return (
    <div className="pb-28">
      <ScreenHeader title="Profile" back={back} />
      <div className="px-5 pt-5 space-y-4">
        <div className="glass rounded-3xl p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-60"
            style={{ background: "radial-gradient(60% 80% at 50% 0%, oklch(0.85 0.12 200) 0%, transparent 70%)" }} />
          <div className="h-20 w-20 rounded-3xl mx-auto gradient-brand grid place-items-center text-white text-2xl font-bold">
            AS
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <p className="font-semibold text-lg">Aditi Sharma</p>
            <BadgeCheck className="h-5 w-5 text-[color:var(--primary)]" />
          </div>
          <p className="text-xs text-muted-foreground">CSE '26 · Thapar University</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs">
            <span className="glass px-3 py-1 rounded-full flex items-center gap-1">
              <GraduationCap className="h-3 w-3" /> Verified student
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Trust Score" value="96" />
          <StatCard label="Rides" value="27" />
          <StatCard label="Rating" value="4.9" />
        </div>

        <div className="glass rounded-3xl overflow-hidden">
          {[
            { icon: Car, label: "My rides", meta: "27 completed" },
            { icon: Wallet, label: "Payments", meta: "UPI · **** 2280" },
            { icon: Shield, label: "Verification", meta: "ID + Email" },
            { icon: Settings, label: "Preferences", meta: "AC, music, ..." },
          ].map(({ icon: Icon, label, meta }, i, arr) => (
            <div key={label} className={`flex items-center gap-3 px-4 py-4 ${i < arr.length - 1 ? "border-b border-white/60" : ""}`}>
              <div className="h-9 w-9 rounded-xl bg-white/70 grid place-items-center shrink-0">
                <Icon className="h-4 w-4 text-[color:var(--primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{meta}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>

        <button onClick={onLogout} className="w-full glass rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <p className="text-2xl font-bold text-gradient-brand">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
