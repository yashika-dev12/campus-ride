import { useSyncExternalStore } from "react";

/* ---------------------------------------------------------------------------
 * Campus Ride — centralized data source
 *
 * A single framework-agnostic external store holds the demo user and every
 * ride. Screens subscribe with `useCampusRide()` (see hooks below) so any
 * mutation — create, join, fill — is reflected everywhere with no manual
 * refresh. Data is persisted to localStorage so it survives reloads.
 * ------------------------------------------------------------------------- */

export type Driver = {
  id: string;
  name: string;
  dept: string;
  initials: string;
  color: string;
  rating: number;
};

export type RideStatus = "Available" | "Full";

export type LatLng = { lat: number; lng: number };

export type Ride = {
  id: string;
  driver: Driver;
  from: string;
  to: string;
  fromCoords?: LatLng | null; // set when picked via location autocomplete
  toCoords?: LatLng | null;
  date: string; // ISO yyyy-mm-dd
  time: string; // 24h HH:mm, formatted for display via formatTime()
  totalSeats: number;
  availableSeats: number;
  passengers: string[]; // user ids that joined
  cost: number;
  preferences: string[];
  status: RideStatus;
  createdAt: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  initials: string;
  dept: string;
};

export type CampusRideState = {
  user: User | null;
  rides: Ride[];
};

const STORAGE_KEY = "campus-ride:v1";
const DRIVER_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#0EA5E9", "#8B5CF6"];

/* ---------------------------------- utils --------------------------------- */

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join(" ") || "Campus Rider"
  );
}

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "2026-07-08" -> "Today" / "Tomorrow" / "Wed, 9 Jul" */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const today = todayISO();
  if (iso === today) return "Today";
  const d = new Date(iso + "T00:00:00");
  const t = new Date(today + "T00:00:00");
  const diffDays = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** "13:15" -> "1:15 PM". Passes through values that are already formatted. */
export function formatTime(time: string): string {
  if (!time) return "";
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return time;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${period}`;
}

/* ------------------------------- seed data -------------------------------- */

function seedRides(): Ride[] {
  const base: Array<Omit<Ride, "id" | "createdAt" | "status" | "passengers" | "availableSeats">> = [
    {
      driver: {
        id: "seed-rohan",
        name: "Rohan Kapoor",
        dept: "CSE '25",
        initials: "RK",
        color: "#4F46E5",
        rating: 4.9,
      },
      from: "Thapar Uni",
      to: "Chandigarh Sec 17",
      date: todayISO(),
      time: "13:15",
      totalSeats: 3,
      cost: 85,
      preferences: ["Music OK", "AC on", "No smoking"],
    },
    {
      driver: {
        id: "seed-priya",
        name: "Priya M.",
        dept: "ECE '26",
        initials: "PM",
        color: "#10B981",
        rating: 4.8,
      },
      from: "Thapar Uni",
      to: "Elante Mall",
      date: todayISO(),
      time: "14:00",
      totalSeats: 2,
      cost: 90,
      preferences: ["AC on", "Quiet ride"],
    },
    {
      driver: {
        id: "seed-arjun",
        name: "Arjun S.",
        dept: "MBA '25",
        initials: "AS",
        color: "#F59E0B",
        rating: 4.7,
      },
      from: "Boys Hostel D",
      to: "Panchkula",
      date: todayISO(),
      time: "16:30",
      totalSeats: 1,
      cost: 120,
      preferences: ["Music OK"],
    },
    {
      driver: {
        id: "seed-neha",
        name: "Neha V.",
        dept: "Design '27",
        initials: "NV",
        color: "#EC4899",
        rating: 5.0,
      },
      from: "Thapar Uni",
      to: "Mohali Airport",
      date: todayISO(),
      time: "18:00",
      totalSeats: 3,
      cost: 150,
      preferences: ["AC on", "Girls only"],
    },
  ];
  return base.map((r, i) => ({
    ...r,
    id: `seed_${i}`,
    passengers: [],
    availableSeats: r.totalSeats,
    status: "Available" as const,
    createdAt: Date.now() - (base.length - i) * 60_000,
  }));
}

/* --------------------------------- store ---------------------------------- */

function emptyState(): CampusRideState {
  return { user: null, rides: seedRides() };
}

function loadState(): CampusRideState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as CampusRideState;
    if (!parsed || !Array.isArray(parsed.rides)) return emptyState();
    return { user: parsed.user ?? null, rides: parsed.rides };
  } catch {
    return emptyState();
  }
}

// Server render + first client render must agree, so both start from the
// deterministic empty state. The persisted state is loaded on the client after
// mount (hydrateFromStorage) to avoid hydration mismatches.
const serverSnapshot: CampusRideState = emptyState();
let state: CampusRideState = emptyState();
let hydrated = false;

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setState(next: CampusRideState) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — keep in-memory state */
    }
  }
  emit();
}

function hydrateFromStorage() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const loaded = loadState();
  // Only swap if it differs from the current reference to avoid a needless tick.
  state = loaded;
  emit();
}

export const rideStore = {
  subscribe(listener: () => void): () => void {
    // Lazily hydrate from localStorage the first time a component subscribes.
    hydrateFromStorage();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): CampusRideState {
    return state;
  },
  getServerSnapshot(): CampusRideState {
    return serverSnapshot;
  },

  /* -------------------------------- actions ------------------------------- */

  login(email: string): User {
    const name = nameFromEmail(email);
    const user: User = {
      id: makeId("user"),
      name,
      email,
      initials: initialsOf(name),
      dept: "CSE '26",
    };
    setState({ ...state, user });
    return user;
  },

  logout() {
    setState({ ...state, user: null });
  },

  addRide(input: OfferRideInput): Ride {
    const user = state.user;
    const driver: Driver = user
      ? {
          id: user.id,
          name: user.name,
          dept: user.dept,
          initials: user.initials,
          color: DRIVER_COLORS[state.rides.length % DRIVER_COLORS.length],
          rating: 5.0,
        }
      : {
          id: makeId("driver"),
          name: "You",
          dept: "CSE '26",
          initials: "ME",
          color: DRIVER_COLORS[0],
          rating: 5.0,
        };

    const ride: Ride = {
      id: makeId("ride"),
      driver,
      from: input.from.trim(),
      to: input.to.trim(),
      fromCoords: input.fromCoords ?? null,
      toCoords: input.toCoords ?? null,
      date: input.date,
      time: input.time,
      totalSeats: input.seats,
      availableSeats: input.seats,
      passengers: [],
      cost: input.cost,
      preferences: input.preferences,
      status: "Available",
      createdAt: Date.now(),
    };
    setState({ ...state, rides: [ride, ...state.rides] });
    return ride;
  },

  joinRide(rideId: string): { ok: boolean; error?: string } {
    const user = state.user;
    if (!user) return { ok: false, error: "You need to be signed in to join a ride." };
    const ride = state.rides.find((r) => r.id === rideId);
    if (!ride) return { ok: false, error: "This ride is no longer available." };
    if (ride.driver.id === user.id) return { ok: false, error: "You can't join your own ride." };
    if (ride.passengers.includes(user.id))
      return { ok: false, error: "You've already joined this ride." };
    if (ride.availableSeats <= 0) return { ok: false, error: "This ride is full." };

    const rides = state.rides.map((r) => {
      if (r.id !== rideId) return r;
      const availableSeats = r.availableSeats - 1;
      return {
        ...r,
        passengers: [...r.passengers, user.id],
        availableSeats,
        status: (availableSeats <= 0 ? "Full" : "Available") as RideStatus,
      };
    });
    setState({ ...state, rides });
    return { ok: true };
  },
};

/* ------------------------------ offer input ------------------------------- */

export type OfferRideInput = {
  from: string;
  to: string;
  fromCoords?: LatLng | null;
  toCoords?: LatLng | null;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm
  seats: number;
  cost: number;
  preferences: string[];
};

const LOCATION_RE = /[a-zA-Z]/;

/** Returns a human-readable error string, or null when the input is valid. */
export function validateOffer(input: Partial<OfferRideInput>): string | null {
  const from = (input.from ?? "").trim();
  const to = (input.to ?? "").trim();
  if (!from) return "Please enter a pickup location.";
  if (from.length < 3 || !LOCATION_RE.test(from)) return "Please enter a valid pickup location.";
  if (!to) return "Please enter a destination.";
  if (to.length < 3 || !LOCATION_RE.test(to)) return "Please enter a valid destination.";
  if (from.toLowerCase() === to.toLowerCase()) return "Pickup and destination must be different.";
  if (!input.date) return "Please choose a departure date.";
  if (input.date < todayISO()) return "Departure date can't be in the past.";
  if (!input.time) return "Please choose a departure time.";
  if (!input.seats || input.seats <= 0) return "Seats must be greater than zero.";
  if (input.cost == null || Number.isNaN(input.cost) || input.cost < 0)
    return "Please enter a valid contribution amount.";
  return null;
}

/* --------------------------------- hooks ---------------------------------- */

export function useCampusRide(): CampusRideState {
  return useSyncExternalStore(
    rideStore.subscribe,
    rideStore.getSnapshot,
    rideStore.getServerSnapshot,
  );
}

export const MIN_DATE = todayISO;
