/* ---------------------------------------------------------------------------
 * Photon (OpenStreetMap) geocoding client.
 *
 * Photon is a free, key-less geocoder hosted by Komoot at photon.komoot.io.
 * It returns GeoJSON, supports CORS, and needs no API key — so this runs
 * entirely from the browser. Callers pass an AbortSignal so in-flight requests
 * can be cancelled when the query changes (debounced typing).
 * ------------------------------------------------------------------------- */

export type PhotonLocation = {
  /** Human-readable label built from the Photon feature properties. */
  name: string;
  lat: number;
  lng: number;
};

type PhotonProperties = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  osm_id?: number;
  osm_type?: string;
  type?: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProperties;
};

const PHOTON_URL = "https://photon.komoot.io/api/";

/** Minimum query length before hitting the network. */
export const MIN_QUERY_LENGTH = 2;

/** Build a readable, single-line label from a Photon feature's properties. */
function labelOf(p: PhotonProperties): string {
  const street = p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street;
  const primary = [p.name, street].filter(Boolean).join(", ");
  const region = [p.city ?? p.district ?? p.county, p.state, p.country].filter(Boolean).join(", ");
  return [primary, region].filter(Boolean).join(", ") || p.name || "Unknown location";
}

/**
 * Search OpenStreetMap via Photon. Returns up to `limit` de-duplicated results.
 * Throws on network / HTTP errors so callers can render an error state; an
 * aborted request rejects with a DOMException the caller can ignore.
 */
export async function searchLocations(
  query: string,
  signal?: AbortSignal,
  limit = 6,
): Promise<PhotonLocation[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY_LENGTH) return [];

  const url = `${PHOTON_URL}?q=${encodeURIComponent(q)}&limit=${limit}&lang=en`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Photon request failed (${res.status})`);

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];

  const seen = new Set<string>();
  const results: PhotonLocation[] = [];
  for (const feature of features) {
    const coords = feature.geometry?.coordinates;
    if (!coords) continue;
    const [lng, lat] = coords;
    if (typeof lat !== "number" || typeof lng !== "number") continue;

    const name = labelOf(feature.properties ?? {});
    const key = `${name}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ name, lat, lng });
  }
  return results;
}
