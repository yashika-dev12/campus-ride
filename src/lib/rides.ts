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
