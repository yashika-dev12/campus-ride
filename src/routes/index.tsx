import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
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
  Zap,
} from "lucide-react";

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

  // Login and the immersive live-trip map are full-bleed (no app chrome).
  if (screen === "login") return <LoginScreen onDone={() => setScreen("home")} />;
  if (screen === "live") return <LiveTripScreen back={() => setScreen("home")} />;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <TopNav current={screen} go={setScreen} />
      <main className="flex-1">
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
  );
}

/* ---------- Layout primitives ---------- */

/** Centered, breakpoint-aware page container. */
function PageContainer({
  children,
  size = "wide",
  className = "",
}: {
  children: ReactNode;
  size?: "narrow" | "form" | "wide";
  className?: string;
}) {
  const max = size === "narrow" ? "max-w-2xl" : size === "form" ? "max-w-4xl" : "max-w-6xl";
  return (
    <div className={`mx-auto w-full ${max} px-4 pb-28 sm:px-6 lg:px-8 lg:pb-14 ${className}`}>
      {children}
    </div>
  );
}

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand shadow-[var(--shadow-soft)] sm:h-11 sm:w-11">
        <Car className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </div>
      <span className="font-display text-lg font-bold sm:text-xl">CampusRide</span>
    </div>
  );
}

/* ---------- Navigation ---------- */

function TopNav({ current, go }: { current: Screen; go: (s: Screen) => void }) {
  return (
    <header className="sticky top-0 z-40 hidden lg:block">
      <div className="glass">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-8">
          <button onClick={() => go("home")} className="shrink-0">
            <BrandMark />
          </button>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
              const active = current === id;
              return (
                <button
                  key={id}
                  onClick={() => go(id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "gradient-brand text-white shadow-[var(--shadow-soft)]"
                      : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full glass">
              <Bell className="h-4 w-4" />
            </button>
            <button
              onClick={() => go("profile")}
              className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-sm font-semibold text-white"
            >
              AS
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ current, go }: { current: Screen; go: (s: Screen) => void }) {
  return (
    <div className="sticky bottom-0 z-30 px-4 pb-4 pt-2 lg:hidden">
      <div className="mx-auto flex max-w-md justify-around rounded-3xl glass px-2 py-2">
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
    <div className="sticky top-0 z-20 glass px-4 py-4 sm:px-6 lg:top-16">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
        {back && (
          <button
            onClick={back}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full glass"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h2 className="flex-1 truncate text-lg font-semibold sm:text-xl">{title}</h2>
        {right}
      </div>
    </div>
  );
}

/* ---------- Screens ---------- */

function LoginScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"email" | "otp">("email");
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, oklch(0.85 0.12 200) 0%, transparent 70%), radial-gradient(50% 50% at 100% 100%, oklch(0.85 0.14 165) 0%, transparent 60%)",
        }}
      />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
        {/* Brand / marketing */}
        <div className="flex flex-1 flex-col justify-center lg:flex-none">
          <BrandMark className="mb-10 lg:mb-8" />
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Ride with your <span className="text-gradient-brand">campus</span>.
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground sm:mt-4 sm:text-lg">
            AI-matched carpools for verified university students. Safer, cheaper, greener.
          </p>

          {/* Feature highlights — richer on larger screens */}
          <div className="mt-8 hidden gap-3 sm:grid sm:grid-cols-3 lg:mt-10">
            {[
              { icon: Sparkles, label: "AI matched", desc: "Rides that fit your schedule" },
              { icon: Shield, label: "Verified only", desc: "Students with .edu accounts" },
              { icon: Wallet, label: "Split fuel", desc: "Auto-calculated fair fares" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-2xl glass p-4">
                <Icon className="mb-2 h-5 w-5 text-[color:var(--primary)]" />
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Auth card */}
        <div className="mt-8 w-full lg:mt-0">
          <div className="mx-auto w-full max-w-md space-y-4 rounded-3xl glass p-5 sm:p-6 lg:ml-auto lg:mr-0">
            {step === "email" ? (
              <>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  University Email
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    defaultValue="aditi.sharma@thapar.edu"
                    className="w-full flex-1 bg-transparent text-sm outline-none"
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
                <div className="flex justify-between gap-2">
                  {["4", "1", "2", "8", "•", "•"].map((c, i) => (
                    <div
                      key={i}
                      className="grid h-12 flex-1 place-items-center rounded-xl border border-white/60 bg-white/70 text-lg font-semibold sm:h-14"
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

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
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
    <div className="relative">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-72"
        style={{
          background:
            "radial-gradient(80% 60% at 100% 0%, oklch(0.85 0.14 165) 0%, transparent 60%), radial-gradient(80% 60% at 0% 0%, oklch(0.85 0.12 240) 0%, transparent 60%)",
        }}
      />
      <PageContainer className="pt-8 sm:pt-10 lg:pt-8">
        {/* Greeting — global nav shows avatar/bell on desktop, so keep this contextual */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground sm:text-sm">Good afternoon,</p>
            <h1 className="flex items-center gap-1.5 text-2xl font-bold sm:text-3xl">
              Aditi <BadgeCheck className="h-5 w-5 text-[color:var(--primary)] sm:h-6 sm:w-6" />
            </h1>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button className="grid h-10 w-10 place-items-center rounded-full glass">
              <Bell className="h-4 w-4" />
            </button>
            <button
              onClick={() => go("profile")}
              className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-sm font-semibold text-white"
            >
              AS
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-4 lg:col-span-2">
            {/* AI Suggested Ride */}
            <div className="relative overflow-hidden rounded-3xl glass-dark p-5 sm:p-6">
              <div
                className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-40"
                style={{
                  background: "radial-gradient(circle, oklch(0.78 0.15 165) 0%, transparent 70%)",
                }}
              />
              <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--mint)]">
                <Sparkles className="h-3.5 w-3.5" /> AI SUGGESTED RIDE
              </div>
              <p className="mt-2 text-[15px] leading-snug sm:text-base">
                Based on your class schedule and previous trips,{" "}
                <span className="font-semibold">3 students</span> are leaving for{" "}
                <span className="font-semibold">Chandigarh</span> at{" "}
                <span className="font-semibold">1:15 PM</span>.
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
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => go("offer")}
                className="rounded-3xl glass p-4 text-left sm:p-5"
              >
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl gradient-brand sm:h-12 sm:w-12">
                  <PlusCircle className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold">Offer a Ride</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Share your car, split fuel
                </p>
              </button>
              <button onClick={() => go("find")} className="rounded-3xl glass p-4 text-left sm:p-5">
                <div
                  className="mb-3 grid h-10 w-10 place-items-center rounded-2xl sm:h-12 sm:w-12"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.78 0.15 165), oklch(0.72 0.14 190))",
                  }}
                >
                  <Search className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold">Find a Ride</p>
                <p className="text-xs text-muted-foreground sm:text-sm">Match with peers</p>
              </button>
            </div>

            {/* Upcoming */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold sm:text-lg">Upcoming rides</h3>
                <button className="text-xs font-semibold text-[color:var(--primary)]">
                  See all
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {upcomingRides.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl glass p-4">
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
          </div>

          {/* Sidebar: impact stats */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl glass p-5 sm:p-6 lg:sticky lg:top-24">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold sm:text-lg">Your impact</h3>
                <Zap className="h-4 w-4 text-[color:var(--mint)]" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { v: "₹2,340", l: "Saved" },
                  { v: "18 kg", l: "CO₂ cut" },
                  { v: "27", l: "Rides" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="text-lg font-bold text-gradient-brand sm:text-xl">{s.v}</p>
                    <p className="text-[11px] text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

const upcomingRides = [
  { from: "Thapar Uni", to: "Chandigarh Sec 17", time: "Today, 1:15 PM", seats: 3 },
  { from: "Girls Hostel B", to: "Elante Mall", time: "Tomorrow, 5:00 PM", seats: 2 },
];

function OfferRideScreen({ back }: { back: () => void }) {
  return (
    <>
      <ScreenHeader title="Offer a Ride" back={back} />
      <PageContainer size="form" className="pt-5">
        <div className="space-y-4">
          <div className="space-y-4 rounded-3xl glass p-5 sm:p-6">
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

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl glass p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Departure
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-semibold">
                <Calendar className="h-4 w-4" /> Today
              </p>
              <p className="text-sm text-muted-foreground">1:15 PM</p>
            </div>
            <div className="rounded-2xl glass p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Seats
              </p>
              <div className="mt-1 flex items-center gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                      n <= 3 ? "gradient-brand text-white" : "bg-white/60 text-muted-foreground"
                    }`}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl glass p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cost per seat
                  </p>
                  <p className="text-2xl font-bold text-gradient-brand sm:text-3xl">₹85</p>
                  <p className="text-xs text-muted-foreground">Auto-calculated fuel split</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl glass p-5 sm:p-6">
              <p className="mb-3 text-sm font-semibold">Ride preferences</p>
              <div className="flex flex-wrap gap-2">
                {["Music OK", "AC on", "No smoking", "Girls only", "Quiet ride"].map((p, i) => (
                  <span
                    key={p}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      i < 3 ? "gradient-brand text-white" : "bg-white/60 text-muted-foreground"
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-4 font-semibold shadow-[var(--shadow-soft)]">
            Publish ride <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </PageContainer>
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
      <PageContainer className="pt-5">
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          {/* Search filters */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24">
            <div className="space-y-3 rounded-3xl glass p-5 sm:p-6">
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
              <div className="grid grid-cols-2 gap-3 pt-2">
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
          </aside>

          {/* Results */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-sm font-semibold">{availableRides.length} matches nearby</p>
              <span className="flex items-center gap-1 text-xs font-semibold text-[color:var(--primary)]">
                <Sparkles className="h-3 w-3" /> AI ranked
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {availableRides.map((r, i) => (
                <button
                  key={i}
                  onClick={onSelect}
                  className="w-full rounded-3xl glass p-4 text-left transition hover:shadow-[var(--shadow-glass)] sm:p-5"
                >
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
        </div>
      </PageContainer>
    </>
  );
}

function RideDetailsScreen({ back, onStart }: { back: () => void; onStart: () => void }) {
  return (
    <>
      <ScreenHeader title="Ride Details" back={back} />
      <PageContainer size="form" className="pt-5">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          {/* Left column */}
          <div className="space-y-4">
            {/* Driver */}
            <div className="rounded-3xl glass p-5 sm:p-6">
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

            {/* Route */}
            <div className="rounded-3xl glass p-5 sm:p-6">
              <div className="flex">
                <div className="mr-4 flex flex-col items-center pt-1">
                  <div className="h-3 w-3 rounded-full bg-[color:var(--primary)]" />
                  <div className="my-1 w-0.5 flex-1 bg-gradient-to-b from-[color:var(--primary)] to-[color:var(--mint)] min-h-[40px]" />
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

          {/* Right column */}
          <div className="space-y-4">
            {/* Car & seats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl glass p-4 sm:p-5">
                <Car className="mb-2 h-5 w-5 text-[color:var(--primary)]" />
                <p className="text-sm font-semibold">Hyundai i20</p>
                <p className="text-xs text-muted-foreground">White · PB-11-AK-2205</p>
              </div>
              <div className="rounded-2xl glass p-4 sm:p-5">
                <Users className="mb-2 h-5 w-5 text-[color:var(--mint)]" />
                <p className="text-sm font-semibold">3 seats left</p>
                <p className="text-xs text-muted-foreground">1 rider joined</p>
              </div>
            </div>

            <div className="rounded-3xl glass p-5 sm:p-6">
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

            <button
              onClick={onStart}
              className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-4 font-semibold shadow-[var(--shadow-soft)]"
            >
              Confirm & join ride <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </PageContainer>
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
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Faux map */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, oklch(0.9 0.05 200) 0%, oklch(0.88 0.07 165) 100%)",
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full opacity-70"
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMid slice"
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
      <div className="relative z-10 px-4 pt-8 sm:px-6 lg:pt-6">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl glass px-4 py-3">
          <button
            onClick={back}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70"
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
        className="absolute right-4 top-32 z-10 grid h-14 w-14 place-items-center rounded-full font-bold text-white shadow-lg sm:right-6 sm:top-28 lg:right-8"
        style={{ background: "linear-gradient(135deg, oklch(0.65 0.24 25), oklch(0.55 0.24 15))" }}
      >
        <AlertTriangle className="h-6 w-6" />
      </button>

      {/* Bottom sheet — becomes a floating side panel on large screens */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 lg:inset-auto lg:bottom-8 lg:right-8 lg:w-full lg:max-w-sm lg:p-0">
        <div className="mx-auto w-full max-w-3xl rounded-3xl glass p-5 sm:p-6 lg:max-w-none">
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
  return (
    <>
      <ScreenHeader title="Profile" back={back} />
      <PageContainer size="form" className="pt-5">
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          {/* Left column: identity + stats */}
          <div className="space-y-4 lg:col-span-1">
            <div className="relative overflow-hidden rounded-3xl glass p-6 text-center">
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
                <span className="flex items-center gap-1 rounded-full glass px-3 py-1">
                  <GraduationCap className="h-3 w-3" /> Verified student
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Trust Score" value="96" />
              <StatCard label="Rides" value="27" />
              <StatCard label="Rating" value="4.9" />
            </div>
          </div>

          {/* Right column: menu + sign out */}
          <div className="space-y-4 lg:col-span-2">
            <div className="overflow-hidden rounded-3xl glass">
              {[
                { icon: Car, label: "My rides", meta: "27 completed" },
                { icon: Wallet, label: "Payments", meta: "UPI · **** 2280" },
                { icon: Shield, label: "Verification", meta: "ID + Email" },
                { icon: Settings, label: "Preferences", meta: "AC, music, ..." },
              ].map(({ icon: Icon, label, meta }, i, arr) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${
                    i < arr.length - 1 ? "border-b border-white/60" : ""
                  }`}
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl glass py-3.5 font-semibold text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl glass p-4 text-center">
      <p className="text-2xl font-bold text-gradient-brand">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
