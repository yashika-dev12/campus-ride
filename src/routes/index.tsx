import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Home,
  Search,
  PlusCircle,
  User,
  Bell,
  MapPin,
  Clock,
  Users,
  Star,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Navigation,
  Phone,
  AlertTriangle,
  GraduationCap,
  Mail,
  ChevronRight,
  Wallet,
  Car,
  LogOut,
  Settings,
  BadgeCheck,
  Calendar,
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { analyzeTimetable, type TimetableAnalysis } from "../lib/timetable";
import { ImpactSection } from "../components/ImpactSection";
import { useImpactStats } from "../hooks/useImpactStats";
import { createRide, joinRide, completeRide } from "../lib/rides";

export const Route = createFileRoute("/")({
  component: CampusRideApp,
});

type Screen = "login" | "home" | "offer" | "find" | "details" | "live" | "profile";

const NAV_ITEMS: { id: Screen; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "find", icon: Search, label: "Find" },
  { id: "offer", icon: PlusCircle, label: "Offer" },
  { id: "profile", icon: User, label: "Profile" },
];

function CampusRideApp() {
  const [screen, setScreen] = useState<Screen>("login");

  // Auth is a standalone full-bleed experience — no app chrome.
  if (screen === "login") {
    return <LoginScreen onDone={() => setScreen("home")} />;
  }

  // The live trip is an immersive, full-screen map. It intentionally drops the
  // sidebar / bottom nav so the map can own the whole viewport at every size.
  if (screen === "live") {
    return <LiveTripScreen back={() => setScreen("home")} />;
  }

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden">
      {/* Desktop / laptop persistent sidebar */}
      <SideNav current={screen} go={setScreen} />

      {/* Main content column — mobile scrolls the page, bottom nav sticks. */}
      <div className="relative flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 overflow-x-hidden">
          {screen === "home" && <HomeScreen go={setScreen} />}
          {screen === "offer" && <OfferRideScreen back={() => setScreen("home")} />}
          {screen === "find" && (
            <FindRideScreen back={() => setScreen("home")} onSelect={() => setScreen("details")} />
          )}
          {screen === "details" && (
            <RideDetailsScreen back={() => setScreen("find")} onStart={() => setScreen("live")} />
          )}
          {screen === "profile" && (
            <ProfileScreen back={() => setScreen("home")} onLogout={() => setScreen("login")} />
          )}
        </main>
        <BottomNav current={screen} go={setScreen} />
      </div>
    </div>
  );
}

/* ---------- Navigation ---------- */

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand shadow-[var(--shadow-soft)]">
        <Car className="h-5 w-5 text-white" />
      </div>
      <span className="font-display text-lg font-bold">CampusRide</span>
    </div>
  );
}

/** Desktop / laptop navigation rail (lg+). Hidden on mobile & tablet. */
function SideNav({ current, go }: { current: Screen; go: (s: Screen) => void }) {
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col p-4 lg:flex xl:w-72">
      <div className="glass flex flex-1 flex-col rounded-[2rem] p-4 xl:p-5">
        <BrandMark className="px-2 py-2" />

        <nav className="mt-6 flex flex-col gap-1.5">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
            const active = current === id;
            return (
              <button
                key={id}
                onClick={() => go(id)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "gradient-brand text-white shadow-[var(--shadow-soft)]"
                    : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-white" : ""}`} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button
            onClick={() => go("profile")}
            className="flex w-full items-center gap-3 rounded-2xl bg-white/55 p-3 text-left transition hover:bg-white/80"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-brand text-sm font-semibold text-white">
              AS
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Aditi Sharma</p>
              <p className="truncate text-xs text-muted-foreground">CSE '26 · Verified</p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Mobile & tablet bottom navigation. Hidden once the sidebar takes over (lg+). */
function BottomNav({ current, go }: { current: Screen; go: (s: Screen) => void }) {
  return (
    <div className="sticky bottom-0 z-30 px-4 pb-4 pt-2 lg:hidden">
      <div className="glass mx-auto flex max-w-md justify-around rounded-3xl px-2 py-2">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 transition ${
                active ? "gradient-brand" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-white" : ""}`} />
              <span className={`text-[10px] font-medium ${active ? "text-white" : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Shared ---------- */

function ScreenHeader({
  title,
  back,
  right,
}: {
  title: string;
  back?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="glass sticky top-0 z-20 px-5 py-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
        {back && (
          <button
            onClick={back}
            className="glass grid h-9 w-9 shrink-0 place-items-center rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h2 className="flex-1 truncate text-lg font-semibold">{title}</h2>
        {right}
      </div>
    </div>
  );
}

/** Standard centered content column shared by the inner screens. */
function ScreenBody({
  children,
  className = "max-w-2xl",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full ${className} px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pb-12`}>
      {children}
    </div>
  );
}

/* ---------- Screens ---------- */

function LoginScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"email" | "otp">("email");
  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden lg:grid lg:grid-cols-2">
      {/* Hero / brand panel */}
      <div className="relative flex flex-col overflow-hidden px-6 pt-14 pb-6 sm:px-10 lg:justify-center lg:px-14 lg:pt-16 lg:pb-16 xl:px-20">
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, oklch(0.85 0.12 200) 0%, transparent 70%)",
          }}
        />
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-xl">
          <BrandMark className="mb-10 lg:mb-14" />
          <h1 className="text-4xl font-bold leading-tight lg:text-5xl xl:text-6xl">
            Ride with your <span className="text-gradient-brand">campus</span>.
          </h1>
          <p className="mt-3 text-muted-foreground lg:mt-5 lg:text-lg">
            AI-matched carpools for verified university students. Safer, cheaper, greener.
          </p>
          {/* Trust badges live in the hero on large screens. */}
          <div className="mt-8 hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-[color:var(--mint)]" /> Verified
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[color:var(--primary)]" /> Secure
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[color:var(--mint)]" /> AI matched
            </span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 pb-10 sm:px-10 lg:px-14 lg:pb-0">
        <div className="w-full max-w-md">
          <div className="glass space-y-4 rounded-3xl p-5 sm:p-6">
            {step === "email" ? (
              <>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  University Email
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    defaultValue="aditi.sharma@thapar.edu"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                <button
                  onClick={() => setStep("otp")}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3.5 font-semibold shadow-[var(--shadow-soft)]"
                >
                  Send verification code <ArrowRight className="h-4 w-4" />
                </button>
                <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
                  <Shield className="h-3 w-3" /> Only verified .edu accounts allowed
                </p>
              </>
            ) : (
              <>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Enter 6-digit code
                </label>
                <div className="flex gap-2">
                  {["4", "1", "2", "8", "•", "•"].map((c, i) => (
                    <div
                      key={i}
                      className="grid h-12 min-w-0 flex-1 place-items-center rounded-xl border border-white/60 bg-white/70 text-lg font-semibold"
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <button
                  onClick={onDone}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3.5 font-semibold shadow-[var(--shadow-soft)]"
                >
                  Verify & continue <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setStep("email")}
                  className="w-full text-xs text-muted-foreground"
                >
                  Change email
                </button>
              </>
            )}
          </div>

          {/* Trust badges below the card on mobile / tablet. */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground lg:hidden">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-[color:var(--mint)]" /> Verified
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[color:var(--primary)]" /> Secure
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--mint)]" /> AI matched
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="pb-28 lg:pb-12">
      {/* Greeting header with ambient gradient */}
      <div className="relative px-4 pt-12 pb-6 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(80% 60% at 100% 0%, oklch(0.85 0.14 165) 0%, transparent 60%), radial-gradient(80% 60% at 0% 0%, oklch(0.85 0.12 240) 0%, transparent 60%)",
          }}
        />
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Good afternoon,</p>
            <h1 className="flex items-center gap-1.5 text-2xl font-bold lg:text-3xl">
              Aditi <BadgeCheck className="h-5 w-5 text-[color:var(--primary)]" />
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="glass grid h-10 w-10 place-items-center rounded-full">
              <Bell className="h-4 w-4" />
            </button>
            <button
              onClick={() => go("profile")}
              className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-sm font-semibold text-white lg:hidden"
            >
              AS
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Dashboard: single column on mobile, two-column from tablet up. */}
        <div className="space-y-4 md:grid md:grid-cols-12 md:items-start md:gap-5 md:space-y-0 lg:gap-6">
          {/* Primary column */}
          <div className="space-y-4 md:col-span-7 md:space-y-5 lg:space-y-6">
            <AIRideCard go={go} />

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => go("offer")}
                className="glass rounded-3xl p-4 text-left sm:p-5"
              >
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl gradient-brand">
                  <PlusCircle className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold">Offer a Ride</p>
                <p className="text-xs text-muted-foreground">Share your car, split fuel</p>
              </button>
              <button onClick={() => go("find")} className="glass rounded-3xl p-4 text-left sm:p-5">
                <div
                  className="mb-3 grid h-10 w-10 place-items-center rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.78 0.15 165), oklch(0.72 0.14 190))",
                  }}
                >
                  <Search className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold">Find a Ride</p>
                <p className="text-xs text-muted-foreground">Match with peers</p>
              </button>
            </div>
          </div>

          {/* Secondary column */}
          <div className="space-y-4 md:col-span-5 md:space-y-5 lg:space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Upcoming rides</h3>
                <button className="text-xs font-semibold text-[color:var(--primary)]">
                  See all
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {upcomingRides.map((r, i) => (
                  <div key={i} className="glass flex items-center gap-3 rounded-2xl p-4">
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: "color-mix(in oklab, oklch(0.55 0.18 240) 15%, transparent)",
                      }}
                    >
                      <Car className="h-5 w-5 text-[color:var(--primary)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {r.from} → {r.to}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {r.time} · <Users className="h-3 w-3" />{" "}
                        {r.seats} seats
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>

            <ImpactSection />
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
      : "setup",
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
      window.setTimeout(() => setVisibleSteps(i + 1), 300 + i * 400),
    );
    return () => timers.forEach(clearTimeout);
  }, [state]);

  // Cancel a pending demo simulation if the card unmounts.
  useEffect(
    () => () => {
      if (demoTimer.current) clearTimeout(demoTimer.current);
    },
    [],
  );

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 glass-dark sm:p-6">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.15 165) 0%, transparent 70%)" }}
      />

      {/* Hidden native file pickers */}
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onFileSelected}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
      />

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
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/20"
            >
              <FileText className="h-4 w-4 text-[color:var(--mint)]" /> Upload PDF
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/20"
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-4 text-[15px] font-semibold tracking-tight shadow-[var(--shadow-soft)] transition hover:brightness-105"
          >
            <Upload className="h-4 w-4" /> ✨ Use Demo Timetable (Recommended)
          </button>
          <p className="mt-3 text-center text-[11px] text-white/55">
            Perfect for exploring CampusRide instantly.
          </p>
          {error && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}
        </>
      )}

      {state === "processing" && (
        <>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Loader2 className="h-4 w-4 animate-spin text-[color:var(--mint)]" /> 🤖 AI
            Processing...
          </div>
          {fileName && (
            <p className="mt-2 flex items-center gap-1.5 truncate text-[13px] leading-snug text-muted-foreground">
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
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--mint)]" />
                ) : (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
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
              className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" /> Change Timetable
            </button>
          </div>
          <p className="mt-2 text-[15px] leading-snug">
            Based on your uploaded timetable, your last class ends at{" "}
            <span className="font-semibold">{analysis?.lastClassEndTime ?? "1:15 PM"}</span>. We
            found <span className="font-semibold">3 students</span> heading to{" "}
            <span className="font-semibold">Chandigarh</span> around the same time.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              {["#8B5CF6", "#22C55E", "#F59E0B"].map((c, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-[oklch(0.22_0.05_250)]"
                  style={{ background: c }}
                />
              ))}
            </div>
            <button
              onClick={() => go("details")}
              className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]"
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
    <>
      <ScreenHeader title="Offer a Ride" back={back} />
      <ScreenBody className="max-w-3xl">
        <div className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0">
          {/* Left column */}
          <div className="space-y-4">
            <div className="glass space-y-4 rounded-3xl p-5">
              <Field
                icon={<MapPin className="h-4 w-4 text-[color:var(--primary)]" />}
                label="Pickup"
                value="Thapar University, Main Gate"
              />
              <div className="ml-6 h-3 border-l-2 border-dashed border-white/70" />
              <Field
                icon={<Navigation className="h-4 w-4 text-[color:var(--mint)]" />}
                label="Destination"
                value="Chandigarh, Sector 17"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Departure
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-semibold">
                  <Calendar className="h-4 w-4" /> Today
                </p>
                <p className="text-sm text-muted-foreground">1:15 PM</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Seats
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${n <= 3 ? "gradient-brand text-white" : "bg-white/60 text-muted-foreground"}`}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cost per seat
                  </p>
                  <p className="text-2xl font-bold text-gradient-brand">₹85</p>
                  <p className="text-xs text-muted-foreground">Auto-calculated fuel split</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-5">
              <p className="mb-3 text-sm font-semibold">Ride preferences</p>
              <div className="flex flex-wrap gap-2">
                {["Music OK", "AC on", "No smoking", "Girls only", "Quiet ride"].map((p, i) => (
                  <span
                    key={p}
                    className={`rounded-full px-3 py-1.5 text-xs ${i < 3 ? "gradient-brand text-white" : "bg-white/60 text-muted-foreground"}`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            createRide({
              from: "Thapar University",
              to: "Chandigarh, Sector 17",
              distanceKm: 62,
              seatsTotal: 3,
              costPerSeat: 85,
              soloFare: 300,
            });
            back();
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-4 font-semibold shadow-[var(--shadow-soft)]"
        >
          Publish ride <ArrowRight className="h-4 w-4" />
        </button>
      </ScreenBody>
    </>
  );
}

function Field({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/70">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-semibold">{value}</p>
      </div>
    </div>
  );
}

const availableRides = [
  {
    name: "Rohan K.",
    dept: "CSE '25",
    from: "Thapar Uni",
    to: "Chandigarh Sec 17",
    time: "1:15 PM",
    seats: 3,
    cost: 85,
    score: 4.9,
    color: "#4F46E5",
  },
  {
    name: "Priya M.",
    dept: "ECE '26",
    from: "Thapar Uni",
    to: "Elante Mall",
    time: "2:00 PM",
    seats: 2,
    cost: 90,
    score: 4.8,
    color: "#10B981",
  },
  {
    name: "Arjun S.",
    dept: "MBA '25",
    from: "Boys Hostel D",
    to: "Panchkula",
    time: "4:30 PM",
    seats: 1,
    cost: 120,
    score: 4.7,
    color: "#F59E0B",
  },
  {
    name: "Neha V.",
    dept: "Design '27",
    from: "Thapar Uni",
    to: "Mohali Airport",
    time: "6:00 PM",
    seats: 3,
    cost: 150,
    score: 5.0,
    color: "#EC4899",
  },
];

function FindRideScreen({ back, onSelect }: { back: () => void; onSelect: () => void }) {
  return (
    <>
      <ScreenHeader title="Find a Ride" back={back} />
      <ScreenBody className="max-w-5xl">
        <div className="space-y-4">
          <div className="glass space-y-3 rounded-3xl p-5">
            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:space-y-0">
              <Field
                icon={<MapPin className="h-4 w-4 text-[color:var(--primary)]" />}
                label="From"
                value="Thapar University"
              />
              <Field
                icon={<Navigation className="h-4 w-4 text-[color:var(--mint)]" />}
                label="To"
                value="Chandigarh"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 sm:max-w-md">
              <div className="rounded-xl bg-white/60 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">When</p>
                <p className="text-sm font-semibold">Today, 1 PM</p>
              </div>
              <div className="rounded-xl bg-white/60 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Seats needed
                </p>
                <p className="text-sm font-semibold">1</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold">{availableRides.length} matches nearby</p>
            <span className="flex items-center gap-1 text-xs font-semibold text-[color:var(--primary)]">
              <Sparkles className="h-3 w-3" /> AI ranked
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {availableRides.map((r, i) => (
              <button key={i} onClick={onSelect} className="glass rounded-3xl p-4 text-left">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-semibold text-white"
                    style={{ background: r.color }}
                  >
                    {r.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold">{r.name}</p>
                      <BadgeCheck className="h-4 w-4 shrink-0 text-[color:var(--primary)]" />
                    </div>
                    <p className="text-xs text-muted-foreground">{r.dept}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-gradient-brand">₹{r.cost}</p>
                    <p className="text-[10px] text-muted-foreground">per seat</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/60 pt-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {r.time}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" /> {r.seats} seats
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Star className="h-3 w-3 fill-[color:var(--mint)] text-[color:var(--mint)]" />{" "}
                    {r.score}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </ScreenBody>
    </>
  );
}

function RideDetailsScreen({ back, onStart }: { back: () => void; onStart: () => void }) {
  return (
    <>
      <ScreenHeader title="Ride Details" back={back} />
      <ScreenBody className="max-w-4xl">
        <div className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0">
          {/* Left column: driver + route */}
          <div className="space-y-4">
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center gap-4">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-xl font-bold text-white"
                  style={{ background: "#4F46E5" }}
                >
                  RK
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-lg font-semibold">Rohan Kapoor</p>
                    <BadgeCheck className="h-5 w-5 text-[color:var(--primary)]" />
                  </div>
                  <p className="text-xs text-muted-foreground">CSE '25 · Thapar University</p>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-[color:var(--mint)] text-[color:var(--mint)]" />{" "}
                      4.9
                    </span>
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

            <div className="glass rounded-3xl p-5">
              <div className="flex">
                <div className="mr-4 flex flex-col items-center pt-1">
                  <div className="h-3 w-3 rounded-full bg-[color:var(--primary)]" />
                  <div className="my-1 min-h-[40px] w-0.5 flex-1 bg-gradient-to-b from-[color:var(--primary)] to-[color:var(--mint)]" />
                  <div className="h-3 w-3 rounded-full bg-[color:var(--mint)]" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                      1:15 PM · Pickup
                    </p>
                    <p className="font-semibold">Thapar University, Main Gate</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                      1:55 PM · Drop-off
                    </p>
                    <p className="font-semibold">Chandigarh, Sector 17</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: car, seats, cost */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-4">
                <Car className="mb-2 h-5 w-5 text-[color:var(--primary)]" />
                <p className="text-sm font-semibold">Hyundai i20</p>
                <p className="text-xs text-muted-foreground">White · PB-11-AK-2205</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <Users className="mb-2 h-5 w-5 text-[color:var(--mint)]" />
                <p className="text-sm font-semibold">3 seats left</p>
                <p className="text-xs text-muted-foreground">1 rider joined</p>
              </div>
            </div>

            <div className="glass rounded-3xl p-5">
              <p className="mb-3 text-sm font-semibold">Cost split</p>
              <div className="space-y-2 text-sm">
                <Row label="Estimated fuel" value="₹340" />
                <Row label="Toll" value="₹60" />
                <Row label="Split across 4" value="÷ 4" />
                <div className="flex items-center justify-between border-t border-white/60 pt-2">
                  <span className="font-semibold">Your share</span>
                  <span className="text-xl font-bold text-gradient-brand">₹85</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            joinRide();
            onStart();
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-4 font-semibold shadow-[var(--shadow-soft)]"
        >
          Confirm & join ride <ArrowRight className="h-4 w-4" />
        </button>
      </ScreenBody>
    </>
  );
}

function TrustPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/60 py-2">
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

function LiveTripScreen({ back }: { back: () => void }) {
  // Leaving the live trip means the ride finished — mark it completed so the
  // "Your impact" dashboard reflects the new ride on return to Home.
  const finish = () => {
    completeRide();
    back();
  };
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Faux map — fills the whole viewport at every screen size. */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, oklch(0.9 0.05 200) 0%, oklch(0.88 0.07 165) 100%)",
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full opacity-70"
          viewBox="0 0 400 800"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                opacity="0.6"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path
            d="M 40 700 Q 120 500 180 420 T 340 120"
            stroke="oklch(0.55 0.18 240)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="0"
          />
          <path
            d="M 40 700 Q 120 500 180 420"
            stroke="oklch(0.78 0.15 165)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="40" cy="700" r="10" fill="oklch(0.55 0.18 240)" />
          <circle cx="340" cy="120" r="10" fill="oklch(0.78 0.15 165)" />
          <circle
            cx="180"
            cy="420"
            r="14"
            fill="white"
            stroke="oklch(0.55 0.18 240)"
            strokeWidth="4"
          />
        </svg>
      </div>

      {/* Top bar */}
      <div className="relative z-10 px-4 pt-12 sm:px-6 lg:pt-8">
        <div className="glass mx-auto flex max-w-2xl items-center gap-3 rounded-2xl px-4 py-3">
          <button
            onClick={finish}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              Trip in progress
            </p>
            <p className="truncate font-semibold">To Chandigarh Sec 17</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">ETA</p>
            <p className="font-bold text-gradient-brand">14 min</p>
          </div>
        </div>
      </div>

      {/* SOS floating */}
      <button
        className="absolute right-4 top-40 z-10 grid h-14 w-14 place-items-center rounded-full font-bold text-white shadow-lg sm:right-6 lg:top-28"
        style={{ background: "linear-gradient(135deg, oklch(0.65 0.24 25), oklch(0.55 0.24 15))" }}
      >
        <AlertTriangle className="h-6 w-6" />
      </button>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6">
        <div className="glass mx-auto max-w-xl rounded-3xl p-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30 lg:hidden" />
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl font-semibold text-white"
              style={{ background: "#4F46E5" }}
            >
              RK
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold">Rohan K.</p>
                <BadgeCheck className="h-4 w-4 text-[color:var(--primary)]" />
              </div>
              <p className="text-xs text-muted-foreground">Hyundai i20 · PB-11-AK-2205</p>
            </div>
            <button className="grid h-10 w-10 place-items-center rounded-full gradient-brand">
              <Phone className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Distance" value="8.4 km" />
            <Stat label="Speed" value="42 km/h" />
            <Stat label="Arrive" value="1:55 PM" />
          </div>

          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, oklch(0.6 0.24 25), oklch(0.5 0.24 15))",
            }}
          >
            <AlertTriangle className="h-4 w-4" /> Emergency SOS
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/60 py-2">
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileScreen({ back, onLogout }: { back: () => void; onLogout: () => void }) {
  const { totalRides } = useImpactStats();
  return (
    <>
      <ScreenHeader title="Profile" back={back} />
      <ScreenBody className="max-w-5xl">
        <div className="space-y-4 md:grid md:grid-cols-3 md:items-start md:gap-5 md:space-y-0 lg:gap-6">
          {/* Identity card */}
          <div className="glass relative overflow-hidden rounded-3xl p-6 text-center md:col-span-1">
            <div
              className="absolute inset-0 -z-10 opacity-60"
              style={{
                background:
                  "radial-gradient(60% 80% at 50% 0%, oklch(0.85 0.12 200) 0%, transparent 70%)",
              }}
            />
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl gradient-brand text-2xl font-bold text-white">
              AS
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <p className="text-lg font-semibold">Aditi Sharma</p>
              <BadgeCheck className="h-5 w-5 text-[color:var(--primary)]" />
            </div>
            <p className="text-xs text-muted-foreground">CSE '26 · Thapar University</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs">
              <span className="glass flex items-center gap-1 rounded-full px-3 py-1">
                <GraduationCap className="h-3 w-3" /> Verified student
              </span>
            </div>
          </div>

          {/* Stats + menu + sign out */}
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Trust Score" value="96" />
              <StatCard label="Rides" value={String(totalRides)} />
              <StatCard label="Rating" value="4.9" />
            </div>

            <div className="glass overflow-hidden rounded-3xl">
              {[
                { icon: Car, label: "My rides", meta: `${totalRides} completed` },
                { icon: Wallet, label: "Payments", meta: "UPI · **** 2280" },
                { icon: Shield, label: "Verification", meta: "ID + Email" },
                { icon: Settings, label: "Preferences", meta: "AC, music, ..." },
              ].map(({ icon: Icon, label, meta }, i, arr) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 px-4 py-4 ${i < arr.length - 1 ? "border-b border-white/60" : ""}`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/70">
                    <Icon className="h-4 w-4 text-[color:var(--primary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="truncate text-xs text-muted-foreground">{meta}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>

            <button
              onClick={onLogout}
              className="glass flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </ScreenBody>
    </>
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
