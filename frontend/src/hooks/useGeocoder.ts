/**
 * Smart multi-source geocoder for DisasterPredictor.
 * Tries 3 different strategies in order and merges de-duplicated results.
 *
 * Strategy 1 – Nominatim with cleaned query + "India" appended
 * Strategy 2 – Photon (komoot) — much better fuzzy matching for institutions/colleges
 * Strategy 3 – Nominatim bare (global, no country constraint)
 */

export interface GeoResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
}

/** Normalize a raw user query before sending to geocoders */
function cleanQuery(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .replace(/\.\s*/g, ' ')         // "St. Joseph" → "St Joseph"
    .replace(/'/g, '')              // "Joseph's" → "Josephs"
    .replace(/\s+/g, ' ')
    .trim();
}

/** Expand common Indian institution abbreviations */
function expandAbbreviations(q: string): string {
  return q
    .replace(/\bSt\b/gi, 'Saint')
    .replace(/\bInst\b/gi, 'Institute')
    .replace(/\bEngg\b/gi, 'Engineering')
    .replace(/\bTech\b/gi, 'Technology')
    .replace(/\bAEC\b/gi, 'Arts Engineering College')
    .replace(/\bMEC\b/gi, 'Medical Engineering College')
    .replace(/\bGovt\b/gi, 'Government');
}

const HEADERS = { 'User-Agent': 'DisasterPredictor-SIH-CodeNova/1.0' };

async function nominatimSearch(q: string): Promise<GeoResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&namedetails=1&q=${encodeURIComponent(q)}&limit=5&accept-language=en`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function photonSearch(q: string): Promise<GeoResult[]> {
  try {
    // Photon returns GeoJSON; we convert to Nominatim-compatible shape
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en`;
    const res = await fetch(url, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
    if (!res.ok) return [];
    const gj = await res.json();
    if (!gj?.features?.length) return [];

    return gj.features.map((f: any, i: number): GeoResult => {
      const p = f.properties || {};
      const [lon, lat] = f.geometry?.coordinates || [0, 0];
      const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
      return {
        place_id: `photon-${p.osm_id ?? i}`,
        display_name: parts.join(', '),
        lat: String(lat),
        lon: String(lon),
        type: p.type || p.osm_type || '',
        class: p.osm_key || '',
      };
    });
  } catch {
    return [];
  }
}

function dedup(results: GeoResult[]): GeoResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    // De-duplicate by rounded coordinate
    const key = `${parseFloat(r.lat).toFixed(3)},${parseFloat(r.lon).toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function smartGeocode(rawQuery: string): Promise<GeoResult[]> {
  const base = cleanQuery(rawQuery);
  const expanded = expandAbbreviations(base);

  // Run all three strategies in parallel for speed
  const [nomIndia, photon, nomGlobal] = await Promise.all([
    nominatimSearch(expanded + ' India'),
    photonSearch(expanded + ' India'),
    nominatimSearch(base),
  ]);

  // If Photon only, try a shorter version (drop last word) to increase fuzzy hit chance
  let photonShort: GeoResult[] = [];
  if (nomIndia.length === 0 && photon.length === 0) {
    const words = expanded.split(' ');
    if (words.length > 3) {
      photonShort = await photonSearch(words.slice(0, -1).join(' ') + ' India');
    }
  }

  const merged = dedup([...nomIndia, ...photon, ...nomGlobal, ...photonShort]);
  return merged.slice(0, 6);
}
