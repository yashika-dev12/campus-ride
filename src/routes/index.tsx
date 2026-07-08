import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
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
import { Toaster } from "../components/ui/sonner";
import {
  rideStore,
  useCampusRide,
  validateOffer,
  formatDate,
  formatTime,
  MIN_DATE,
  type Ride,
  type LatLng,
} from "../lib/rides";
import { LocationAutocomplete } from "../components/location-autocomplete";

export const Route = createFileRoute("/")({
  component: CampusRideApp,
});

type Screen = "login" | "home" | "offer" | "find" | "details" | "live" | "profile";

const ALL_PREFERENCES = ["Music OK", "AC on", "No smoking", "Girls only", "Quiet ride"];

function CampusRideApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  const openDetails = (id: string) => {
    setSelectedRideId(id);
    setScreen("details");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-6">
      {/* Phone frame */}
      <div className="relative w-full sm:w-[420px] sm:h-[860px] sm:rounded-[2.5rem] sm:border sm:border-white/50 sm:shadow-[0_30px_80px_-20px_oklch(0.4_0.15_240/0.35)] overflow-hidden bg-transparent">
        <div className="relative h-screen sm:h-full overflow-y-auto no-scrollbar">
          {screen === "login" && <LoginScreen onDone={() => setScreen("home")} />}
          {screen === "home" && <HomeScreen go={setScreen} openDetails={openDetails} />}
          {screen === "offer" && <OfferRideScreen back={() => setScreen("home")} />}
          {screen === "find" && (
            <FindRideScreen back={() => setScreen("home")} onSelect={openDetails} />
          )}
          {screen === "details" && (
            <RideDetailsScreen
              rideId={selectedRideId}
              back={() => setScreen("find")}
              onStart={() => setScreen("live")}
            />
          )}
          {screen === "live" && (
            <LiveTripScreen back={() => setScreen("home")} rideId={selectedRideId} />
          )}
          {screen === "profile" && (
            <ProfileScreen back={() => setScreen("home")} onLogout={() => setScreen("login")} />
          )}

          {screen !== "login" && screen !== "live" && <BottomNav current={screen} go={setScreen} />}
        </div>
      </div>
      <Toaster position="top-center" />
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{scrollbar-width:none}`}</style>
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
    <div className="sticky top-0 z-20 glass px-5 py-4 flex items-center gap-3">
      {back && (
        <button
          onClick={back}
          className="h-9 w-9 grid place-items-center rounded-full glass shrink-0"
        >
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

/* ---------- Screens ---------- */

function LoginScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("aditi.sharma@thapar.edu");

  const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSendCode = () => {
    if (!emailValid(email)) {
      toast.error("Please enter a valid university email.");
      return;
    }
    setStep("otp");
  };

  const handleVerify = () => {
    rideStore.login(email.trim());
    onDone();
  };

  return (
    <div className="min-h-full flex flex-col px-6 pt-14 pb-8 relative">
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, oklch(0.85 0.12 200) 0%, transparent 70%)",
        }}
      />
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                University Email
              </label>
              <div className="flex items-center gap-3 bg-white/70 rounded-2xl px-4 py-3 border border-white/60">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
              <button
                onClick={handleSendCode}
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Enter 6-digit code
              </label>
              <div className="flex gap-2 justify-between">
                {["4", "1", "2", "8", "•", "•"].map((c, i) => (
                  <div
                    key={i}
                    className="h-12 w-11 rounded-xl bg-white/70 border border-white/60 grid place-items-center text-lg font-semibold"
                  >
                    {c}
                  </div>
                ))}
              </div>
              <button
                onClick={handleVerify}
                className="w-full gradient-brand rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]"
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

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
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
  );
}

/** Rides the current user has created or joined, soonest first. */
function useMyRides(): Ride[] {
  const { user, rides } = useCampusRide();
  return useMemo(() => {
    if (!user) return [];
    return rides
      .filter((r) => r.driver.id === user.id || r.passengers.includes(user.id))
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [user, rides]);
}

function HomeScreen({
  go,
  openDetails,
}: {
  go: (s: Screen) => void;
  openDetails: (id: string) => void;
}) {
  const { user, rides } = useCampusRide();
  const myRides = useMyRides();

  const firstName = user?.name.split(" ")[0] ?? "there";
  const initials = user?.initials ?? "AS";

  // AI suggested ride: the soonest ride the user could actually join.
  const suggestion = useMemo(
    () =>
      rides.find(
        (r) =>
          r.availableSeats > 0 &&
          (!user || (r.driver.id !== user.id && !r.passengers.includes(user.id))),
      ),
    [rides, user],
  );

  return (
    <div className="pb-28">
      <div className="px-5 pt-12 pb-6 relative">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(80% 60% at 100% 0%, oklch(0.85 0.14 165) 0%, transparent 60%), radial-gradient(80% 60% at 0% 0%, oklch(0.85 0.12 240) 0%, transparent 60%)",
          }}
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Good afternoon,</p>
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
              {firstName} <BadgeCheck className="h-5 w-5 text-[color:var(--primary)]" />
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 w-10 grid place-items-center rounded-full glass">
              <Bell className="h-4 w-4" />
            </button>
            <button
              onClick={() => go("profile")}
              className="h-10 w-10 rounded-full gradient-brand grid place-items-center font-semibold text-white text-sm"
            >
              {initials}
            </button>
          </div>
        </div>

        {/* AI Suggested Ride */}
        <div className="mt-6 rounded-3xl p-5 glass-dark relative overflow-hidden">
          <div
            className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, oklch(0.78 0.15 165) 0%, transparent 70%)",
            }}
          />
          <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--mint)]">
            <Sparkles className="h-3.5 w-3.5" /> AI SUGGESTED RIDE
          </div>
          {suggestion ? (
            <p className="mt-2 text-[15px] leading-snug">
              Based on your class schedule and previous trips,{" "}
              <span className="font-semibold">{suggestion.driver.name}</span> is leaving for{" "}
              <span className="font-semibold">{suggestion.to}</span> at{" "}
              <span className="font-semibold">{formatTime(suggestion.time)}</span>.
            </p>
          ) : (
            <p className="mt-2 text-[15px] leading-snug">
              No rides match your schedule right now.{" "}
              <span className="font-semibold">Offer a ride</span> and help peers get around campus.
            </p>
          )}
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
              onClick={() => (suggestion ? openDetails(suggestion.id) : go("offer"))}
              className="rounded-full bg-white text-[color:var(--foreground)] px-4 py-2 text-sm font-semibold flex items-center gap-1"
            >
              {suggestion ? "Join ride" : "Offer ride"} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

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
            <div
              className="h-10 w-10 rounded-2xl grid place-items-center mb-3"
              style={{
                background: "linear-gradient(135deg, oklch(0.78 0.15 165), oklch(0.72 0.14 190))",
              }}
            >
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
          <button
            onClick={() => go("find")}
            className="text-xs text-[color:var(--primary)] font-semibold"
          >
            See all
          </button>
        </div>
        <div className="space-y-3">
          {myRides.length === 0 ? (
            <div className="glass rounded-2xl p-4 text-sm text-muted-foreground text-center">
              No upcoming rides yet. Offer or find a ride to get started.
            </div>
          ) : (
            myRides.map((r) => (
              <button
                key={r.id}
                onClick={() => openDetails(r.id)}
                className="w-full text-left glass rounded-2xl p-4 flex items-center gap-3"
              >
                <div
                  className="h-11 w-11 rounded-xl grid place-items-center shrink-0"
                  style={{
                    background: "color-mix(in oklab, oklch(0.55 0.18 240) 15%, transparent)",
                  }}
                >
                  <Car className="h-5 w-5 text-[color:var(--primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {r.from} → {r.to}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3" /> {formatDate(r.date)}, {formatTime(r.time)} ·{" "}
                    <Users className="h-3 w-3" />{" "}
                    {r.availableSeats > 0 ? `${r.availableSeats} seats` : "Full"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
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
              { v: String(myRides.length), l: "Rides" },
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

function OfferRideScreen({ back }: { back: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromCoords, setFromCoords] = useState<LatLng | null>(null);
  const [toCoords, setToCoords] = useState<LatLng | null>(null);
  const [date, setDate] = useState(MIN_DATE());
  const [time, setTime] = useState("13:15");
  const [seats, setSeats] = useState(3);
  const [cost, setCost] = useState("85");
  const [prefs, setPrefs] = useState<string[]>(["Music OK", "AC on", "No smoking"]);

  const togglePref = (p: string) =>
    setPrefs((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const handlePublish = () => {
    const costNum = Number(cost);
    const input = {
      from,
      to,
      fromCoords,
      toCoords,
      date,
      time,
      seats,
      cost: costNum,
      preferences: prefs,
    };
    const error = validateOffer(input);
    if (error) {
      toast.error(error);
      return;
    }
    const ride = rideStore.addRide(input);
    toast.success(`Ride published — ${ride.from} → ${ride.to}`);
    back();
  };

  return (
    <div className="pb-28">
      <ScreenHeader title="Offer a Ride" back={back} />
      <div className="px-5 pt-5 space-y-4">
        <div className="glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/70 grid place-items-center shrink-0">
              <MapPin className="h-4 w-4 text-[color:var(--primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Pickup
              </p>
              <LocationAutocomplete
                value={from}
                onValueChange={(v) => {
                  setFrom(v);
                  setFromCoords(null);
                }}
                onSelect={(loc) => {
                  setFrom(loc.name);
                  setFromCoords({ lat: loc.lat, lng: loc.lng });
                }}
                placeholder="Pickup Location"
                inputClassName="font-semibold truncate bg-transparent outline-none w-full"
              />
            </div>
          </div>
          <div className="ml-6 border-l-2 border-dashed border-white/70 h-3" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/70 grid place-items-center shrink-0">
              <Navigation className="h-4 w-4 text-[color:var(--mint)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Destination
              </p>
              <LocationAutocomplete
                value={to}
                onValueChange={(v) => {
                  setTo(v);
                  setToCoords(null);
                }}
                onSelect={(loc) => {
                  setTo(loc.name);
                  setToCoords({ lat: loc.lat, lng: loc.lng });
                }}
                placeholder="Destination"
                inputClassName="font-semibold truncate bg-transparent outline-none w-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Departure
            </p>
            <p className="mt-1 font-semibold flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <input
                type="date"
                value={date}
                min={MIN_DATE()}
                onChange={(e) => setDate(e.target.value)}
                className="font-semibold bg-transparent outline-none min-w-0 flex-1"
              />
            </p>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="text-sm text-muted-foreground bg-transparent outline-none"
            />
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Seats
            </p>
            <div className="mt-1 flex items-center gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setSeats(n)}
                  className={`h-7 w-7 rounded-full grid place-items-center text-xs font-semibold ${n <= seats ? "gradient-brand text-white" : "bg-white/60 text-muted-foreground"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Cost per seat
              </p>
              <div className="flex items-baseline gap-0.5 text-2xl font-bold text-[color:var(--primary)]">
                <span>₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-20 bg-transparent outline-none text-2xl font-bold text-[color:var(--primary)]"
                />
              </div>
              <p className="text-xs text-muted-foreground">Contribution per seat</p>
            </div>
            <div className="h-14 w-14 rounded-2xl gradient-brand grid place-items-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <p className="text-sm font-semibold mb-3">Ride preferences</p>
          <div className="flex flex-wrap gap-2">
            {ALL_PREFERENCES.map((p) => {
              const active = prefs.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePref(p)}
                  className={`text-xs px-3 py-1.5 rounded-full ${active ? "gradient-brand text-white" : "bg-white/60 text-muted-foreground"}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handlePublish}
          className="w-full gradient-brand rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]"
        >
          Publish ride <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Loose, case-insensitive location match: matches when either string contains the other. */
function locationMatches(value: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const v = value.toLowerCase();
  return v.includes(q) || q.includes(v);
}

function FindRideScreen({ back, onSelect }: { back: () => void; onSelect: (id: string) => void }) {
  const { rides } = useCampusRide();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState(1);
  const [applied, setApplied] = useState<{
    pickup: string;
    destination: string;
    date: string;
    seats: number;
  } | null>(null);

  // Matching active rides created through Offer a Ride, filtered by the applied
  // search. Before the first search, every ride with seats available is shown.
  const matches = useMemo(() => {
    const active = rides.filter((r) => r.availableSeats > 0);
    if (!applied) return active;
    return active.filter(
      (r) =>
        locationMatches(r.from, applied.pickup) &&
        locationMatches(r.to, applied.destination) &&
        (!applied.date || r.date === applied.date) &&
        r.availableSeats >= applied.seats,
    );
  }, [rides, applied]);

  const handleFind = () => {
    setApplied({ pickup, destination, date, seats: Math.max(1, seats) });
  };

  return (
    <div className="pb-28">
      <ScreenHeader title="Find a Ride" back={back} />
      <div className="px-5 pt-5 space-y-4">
        <div className="glass rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/70 grid place-items-center shrink-0">
              <MapPin className="h-4 w-4 text-[color:var(--primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                From
              </p>
              <input
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Pickup Location"
                className="font-semibold truncate bg-transparent outline-none w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/70 grid place-items-center shrink-0">
              <Navigation className="h-4 w-4 text-[color:var(--mint)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                To
              </p>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
                className="font-semibold truncate bg-transparent outline-none w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/60 rounded-xl px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">When</p>
              <input
                type="date"
                value={date}
                min={MIN_DATE()}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm font-semibold bg-transparent outline-none w-full"
              />
            </div>
            <div className="bg-white/60 rounded-xl px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                Seats needed
              </p>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={seats}
                onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))}
                className="text-sm font-semibold bg-transparent outline-none w-full"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleFind}
          className="w-full gradient-brand rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]"
        >
          Find Ride <Search className="h-4 w-4" />
        </button>

        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold">{matches.length} matches nearby</p>
          <span className="text-xs text-[color:var(--primary)] font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI ranked
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-white/60 grid place-items-center mx-auto mb-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-semibold">No rides found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your pickup, destination, date, or seats needed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r.id)}
                className="w-full text-left glass rounded-3xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-2xl grid place-items-center text-white font-semibold shrink-0"
                    style={{ background: r.driver.color }}
                  >
                    {r.driver.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold truncate">{r.driver.name}</p>
                      <BadgeCheck className="h-4 w-4 text-[color:var(--primary)] shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">{r.driver.dept}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gradient-brand">₹{r.cost}</p>
                    <p className="text-[10px] text-muted-foreground">per seat</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/60 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {formatTime(r.time)}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />{" "}
                    {r.availableSeats > 0 ? `${r.availableSeats} seats` : "Full"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Star className="h-3 w-3 fill-[color:var(--mint)] text-[color:var(--mint)]" />{" "}
                    {r.driver.rating}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RideDetailsScreen({
  rideId,
  back,
  onStart,
}: {
  rideId: string | null;
  back: () => void;
  onStart: () => void;
}) {
  const { user, rides } = useCampusRide();
  const ride = rides.find((r) => r.id === rideId);

  if (!ride) {
    return (
      <div className="pb-28">
        <ScreenHeader title="Ride Details" back={back} />
        <div className="px-5 pt-10 text-center text-sm text-muted-foreground">
          This ride is no longer available.
        </div>
      </div>
    );
  }

  const isOwn = !!user && ride.driver.id === user.id;
  const alreadyJoined = !!user && ride.passengers.includes(user.id);
  const isFull = ride.availableSeats <= 0;

  const handleJoin = () => {
    const result = rideStore.joinRide(ride.id);
    if (!result.ok) {
      toast.error(result.error ?? "Couldn't join this ride.");
      return;
    }
    toast.success("You've joined the ride!");
    onStart();
  };

  const joinLabel = isOwn
    ? "This is your ride"
    : alreadyJoined
      ? "Already joined"
      : isFull
        ? "Ride is full"
        : "Confirm & join ride";
  const joinDisabled = isOwn || alreadyJoined || isFull;

  return (
    <div className="pb-28">
      <ScreenHeader title="Ride Details" back={back} />
      <div className="px-5 pt-5 space-y-4">
        {/* Driver */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-2xl grid place-items-center text-white font-bold text-xl"
              style={{ background: ride.driver.color }}
            >
              {ride.driver.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-lg">{ride.driver.name}</p>
                <BadgeCheck className="h-5 w-5 text-[color:var(--primary)]" />
              </div>
              <p className="text-xs text-muted-foreground">
                {ride.driver.dept} · Thapar University
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-[color:var(--mint)] text-[color:var(--mint)]" />{" "}
                  {ride.driver.rating}
                </span>
                <span className="text-muted-foreground">{ride.status}</span>
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
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">
                  {formatDate(ride.date)}, {formatTime(ride.time)} · Pickup
                </p>
                <p className="font-semibold">{ride.from}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">
                  Drop-off
                </p>
                <p className="font-semibold">{ride.to}</p>
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
            <p className="font-semibold text-sm">
              {ride.availableSeats > 0 ? `${ride.availableSeats} seats left` : "Full"}
            </p>
            <p className="text-xs text-muted-foreground">
              {ride.passengers.length}{" "}
              {ride.passengers.length === 1 ? "rider joined" : "riders joined"}
            </p>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <p className="text-sm font-semibold mb-3">Cost split</p>
          <div className="space-y-2 text-sm">
            <Row label="Estimated fuel" value="₹340" />
            <Row label="Toll" value="₹60" />
            <Row label={`Split across ${ride.totalSeats + 1}`} value={`÷ ${ride.totalSeats + 1}`} />
            <div className="border-t border-white/60 pt-2 flex items-center justify-between">
              <span className="font-semibold">Your share</span>
              <span className="text-xl font-bold text-gradient-brand">₹{ride.cost}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={joinDisabled}
          className={`w-full gradient-brand rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-soft)] ${joinDisabled ? "opacity-60" : ""}`}
        >
          {joinLabel} <ArrowRight className="h-4 w-4" />
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

function LiveTripScreen({ back, rideId }: { back: () => void; rideId: string | null }) {
  const { rides } = useCampusRide();
  const ride = rides.find((r) => r.id === rideId);
  const destination = ride?.to ?? "Chandigarh Sec 17";
  const driverName = ride
    ? ride.driver.name.split(" ")[0] + " " + (ride.driver.name.split(" ")[1]?.[0] ?? "") + "."
    : "Rohan K.";
  const driverInitials = ride?.driver.initials ?? "RK";
  const driverColor = ride?.driver.color ?? "#4F46E5";

  return (
    <div className="relative h-full min-h-screen sm:min-h-full">
      {/* Faux map */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, oklch(0.9 0.05 200) 0%, oklch(0.88 0.07 165) 100%)",
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full opacity-70"
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
      <div className="relative z-10 px-4 pt-12">
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={back}
            className="h-8 w-8 grid place-items-center rounded-full bg-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase text-muted-foreground font-semibold">
              Trip in progress
            </p>
            <p className="font-semibold truncate">To {destination}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">ETA</p>
            <p className="font-bold text-gradient-brand">14 min</p>
          </div>
        </div>
      </div>

      {/* SOS floating */}
      <button
        className="absolute right-4 top-40 z-10 h-14 w-14 rounded-full grid place-items-center text-white font-bold shadow-lg"
        style={{ background: "linear-gradient(135deg, oklch(0.65 0.24 25), oklch(0.55 0.24 15))" }}
      >
        <AlertTriangle className="h-6 w-6" />
      </button>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div className="glass rounded-3xl p-5">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-2xl grid place-items-center text-white font-semibold"
              style={{ background: driverColor }}
            >
              {driverInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold">{driverName}</p>
                <BadgeCheck className="h-4 w-4 text-[color:var(--primary)]" />
              </div>
              <p className="text-xs text-muted-foreground">Hyundai i20 · PB-11-AK-2205</p>
            </div>
            <button className="h-10 w-10 grid place-items-center rounded-full gradient-brand">
              <Phone className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Distance" value="8.4 km" />
            <Stat label="Speed" value="42 km/h" />
            <Stat label="Arrive" value="1:55 PM" />
          </div>

          <button
            className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-white flex items-center justify-center gap-2"
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
    <div className="bg-white/60 rounded-xl py-2">
      <p className="font-bold text-sm">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileScreen({ back, onLogout }: { back: () => void; onLogout: () => void }) {
  const { user } = useCampusRide();
  const myRides = useMyRides();

  const name = user?.name ?? "Aditi Sharma";
  const initials = user?.initials ?? "AS";
  const dept = user?.dept ?? "CSE '26";
  const rideCount = myRides.length;

  const handleLogout = () => {
    rideStore.logout();
    onLogout();
  };

  return (
    <div className="pb-28">
      <ScreenHeader title="Profile" back={back} />
      <div className="px-5 pt-5 space-y-4">
        <div className="glass rounded-3xl p-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 opacity-60"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, oklch(0.85 0.12 200) 0%, transparent 70%)",
            }}
          />
          <div className="h-20 w-20 rounded-3xl mx-auto gradient-brand grid place-items-center text-white text-2xl font-bold">
            {initials}
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <p className="font-semibold text-lg">{name}</p>
            <BadgeCheck className="h-5 w-5 text-[color:var(--primary)]" />
          </div>
          <p className="text-xs text-muted-foreground">{dept} · Thapar University</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs">
            <span className="glass px-3 py-1 rounded-full flex items-center gap-1">
              <GraduationCap className="h-3 w-3" /> Verified student
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Trust Score" value="96" />
          <StatCard label="Rides" value={String(rideCount)} />
          <StatCard label="Rating" value="4.9" />
        </div>

        <div className="glass rounded-3xl overflow-hidden">
          {[
            {
              icon: Car,
              label: "My rides",
              meta: `${rideCount} ${rideCount === 1 ? "ride" : "rides"}`,
            },
            { icon: Wallet, label: "Payments", meta: "UPI · **** 2280" },
            { icon: Shield, label: "Verification", meta: "ID + Email" },
            { icon: Settings, label: "Preferences", meta: "AC, music, ..." },
          ].map(({ icon: Icon, label, meta }, i, arr) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-4 ${i < arr.length - 1 ? "border-b border-white/60" : ""}`}
            >
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

        <button
          onClick={handleLogout}
          className="w-full glass rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 text-destructive"
        >
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
