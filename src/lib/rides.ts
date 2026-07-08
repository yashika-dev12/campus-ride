/**
 * Ride data + "Your impact" business logic.
 *
 * This is the single source of truth for ride records and the metrics derived
 * from them. It is intentionally UI-agnostic: components subscribe through the
 * `useImpactStats` hook and never touch this module's internals directly.
 *
 * Today the data lives in an in-memory mock store seeded with a plausible ride
 * history. When a real backend/API is available, only the STORE section below
 * needs to change (fetch + mutations should keep the same `Ride[]` shape and
 * call `emit()` after any change) — the interfaces, the impact math, and every
 * consumer stay exactly the same.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RideStatus = "scheduled" | "active" | "completed" | "cancelled";

/** A single carpool ride the current user offered or joined. */
export interface Ride {
  id: string;
  from: string;
  to: string;
  /** One-way trip distance in kilometres. */
  distanceKm: number;
  /** Total seats the driver made available (excludes the driver). */
  seatsTotal: number;
  /** Seats actually taken by co-riders so far. */
  seatsJoined: number;
  /** What each rider pays after the fuel/toll split (₹). */
  costPerSeat: number;
  /** What the trip would have cost the user travelling alone, e.g. a cab (₹). */
  soloFare: number;
  status: RideStatus;
  createdAt: number;
}

/** Fields callers may provide when creating a ride; the rest get defaults. */
export type NewRideInput = Partial<
  Pick<
    Ride,
    "from" | "to" | "distanceKm" | "seatsTotal" | "seatsJoined" | "costPerSeat" | "soloFare"
  >
>;

/** Aggregated numbers rendered by the "Your impact" dashboard section. */
export interface ImpactMetrics {
  /** Count of completed rides. */
  totalRides: number;
  /** Total money the user saved by sharing instead of travelling solo (₹). */
  moneySaved: number;
  /** Estimated CO₂ emissions the user avoided (kg). */
  co2SavedKg: number;
}

/* ------------------------------------------------------------------ */
/* Impact math                                                         */
/* ------------------------------------------------------------------ */

/** Average tailpipe CO₂ for a typical petrol car, kg per km. */
export const CO2_PER_KM = 0.171;

/** A ride only counts toward impact once at least one co-rider has joined. */
function isShared(ride: Ride): boolean {
  return ride.seatsJoined > 0;
}

/** People in the car for a shared ride (co-riders + the driver). */
function occupants(ride: Ride): number {
  return ride.seatsJoined + 1;
}

/**
 * Money the user saved on one completed shared ride: the gap between going
 * solo and paying only their split share.
 */
export function rideMoneySaved(ride: Ride): number {
  return Math.max(0, ride.soloFare - ride.costPerSeat);
}

/**
 * CO₂ the user avoided on one completed shared ride. Sharing a car means the
 * user's personal footprint is only their fraction of the trip's emissions, so
 * the saving is the rest of what a solo drive would have emitted.
 */
export function rideCo2Saved(ride: Ride): number {
  const solo = ride.distanceKm * CO2_PER_KM;
  return solo * (1 - 1 / occupants(ride));
}

/** Derive the dashboard metrics from a list of rides. Pure + memo-friendly. */
export function computeImpact(rides: readonly Ride[]): ImpactMetrics {
  const completedShared = rides.filter((r) => r.status === "completed" && isShared(r));

  return {
    totalRides: rides.filter((r) => r.status === "completed").length,
    moneySaved: completedShared.reduce((sum, r) => sum + rideMoneySaved(r), 0),
    co2SavedKg: completedShared.reduce((sum, r) => sum + rideCo2Saved(r), 0),
  };
}

/* ------------------------------------------------------------------ */
/* Store (swap this section for real API calls later)                  */
/* ------------------------------------------------------------------ */

const ROUTES = [
  { from: "Thapar Uni", to: "Chandigarh Sec 17", distanceKm: 62 },
  { from: "Girls Hostel B", to: "Elante Mall", distanceKm: 58 },
  { from: "Boys Hostel D", to: "Panchkula", distanceKm: 70 },
  { from: "Thapar Uni", to: "Mohali Airport", distanceKm: 65 },
] as const;

// Deterministic seed history (no Date.now / Math.random) so server and client
// render identical values and hydration stays clean.
function seedRides(): Ride[] {
  const completed: Ride[] = Array.from({ length: 14 }, (_, i) => {
    const route = ROUTES[i % ROUTES.length];
    const costPerSeat = 85 + (i % 4) * 20;
    return {
      id: `seed-${i}`,
      ...route,
      seatsTotal: 4,
      seatsJoined: (i % 3) + 1,
      costPerSeat,
      soloFare: costPerSeat + 160 + (i % 3) * 40,
      status: "completed",
      createdAt: i,
    };
  });

  const scheduled: Ride[] = [
    {
      id: "sched-0",
      from: "Thapar Uni",
      to: "Chandigarh Sec 17",
      distanceKm: 62,
      seatsTotal: 4,
      seatsJoined: 2,
      costPerSeat: 85,
      soloFare: 300,
      status: "scheduled",
      createdAt: 100,
    },
    {
      id: "sched-1",
      from: "Girls Hostel B",
      to: "Elante Mall",
      distanceKm: 58,
      seatsTotal: 3,
      seatsJoined: 1,
      costPerSeat: 90,
      soloFare: 280,
      status: "scheduled",
      createdAt: 101,
    },
  ];

  return [...scheduled, ...completed];
}

let rides: Ride[] = seedRides();
let idCounter = 0;
// The ride most recently created/joined; used as the default target so screens
// can drive the lifecycle without threading ride IDs through the UI.
let focusId: string | null = null;
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

/** Great-circle distance in km between two lat/lng points (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
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
  for (const listener of listeners) listener();
}

/** Subscribe to ride changes. Returns an unsubscribe function. */
export function subscribeRides(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current ride list. Reference is stable until a mutation replaces it. */
export function getRides(): Ride[] {
  return rides;
}

function nextId(): string {
  idCounter += 1;
  return `ride-${idCounter}`;
}

function latest(predicate: (r: Ride) => boolean): Ride | undefined {
  // Newest first so the "current" ride wins when several match.
  return [...rides].sort((a, b) => b.createdAt - a.createdAt).find(predicate);
}

function resolveTarget(id: string | undefined, statuses: RideStatus[]): Ride | undefined {
  if (id) return rides.find((r) => r.id === id);
  const focused = focusId ? rides.find((r) => r.id === focusId) : undefined;
  if (focused && statuses.includes(focused.status)) return focused;
  return latest((r) => statuses.includes(r.status));
}

function replace(id: string, patch: Partial<Ride>) {
  rides = rides.map((r) => (r.id === id ? { ...r, ...patch } : r));
  emit();
}

/** Publish a new ride (status: scheduled) and focus it for the next action. */
export function createRide(input: NewRideInput = {}): Ride {
  const ride: Ride = {
    id: nextId(),
    from: input.from ?? "Thapar University",
    to: input.to ?? "Chandigarh, Sector 17",
    distanceKm: input.distanceKm ?? 62,
    seatsTotal: input.seatsTotal ?? 3,
    seatsJoined: input.seatsJoined ?? 0,
    costPerSeat: input.costPerSeat ?? 85,
    soloFare: input.soloFare ?? 300,
    status: "scheduled",
    createdAt: Date.now(),
  };
  rides = [ride, ...rides];
  focusId = ride.id;
  emit();
  return ride;
}

/** A co-rider joins a ride (adds a seat, capped at capacity). */
export function joinRide(id?: string): void {
  const target = resolveTarget(id, ["scheduled", "active"]);
  if (!target) return;
  focusId = target.id;
  replace(target.id, {
    seatsJoined: Math.min(target.seatsJoined + 1, target.seatsTotal),
    status: "active",
  });
}

/** Mark a ride completed so it starts counting toward impact. */
export function completeRide(id?: string): void {
  const target = resolveTarget(id, ["scheduled", "active"]);
  if (!target) return;
  if (target.id === focusId) focusId = null;
  replace(target.id, { status: "completed" });
}

/** Cancel a ride; excluded from impact so the metrics recalculate down. */
export function cancelRide(id?: string): void {
  const target = resolveTarget(id, ["scheduled", "active"]);
  if (!target) return;
  if (target.id === focusId) focusId = null;
  replace(target.id, { status: "cancelled" });
}
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
