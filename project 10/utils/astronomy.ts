// project 10/utils/astronomy.ts
// Lightweight astronomy helpers for your daily page.
// - Moon phase via SunCalc
// - NASA APOD (optional; safe if key missing)
// - Events + constellations (static tables)
// - NEW: Offline planetary ephemeris (Mercury..Saturn) with retrograde flag

import SunCalc from 'suncalc';

// ───────────────────────────────────────────────────────────────────────────────
// ENV (public) — if you want APOD, put EXPO_PUBLIC_NASA_API_KEY in Netlify vars.
// This file uses process.env to avoid Vite import.meta issues in your setup.
// ───────────────────────────────────────────────────────────────────────────────
const NASA_KEY = (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_NASA_API_KEY) || '';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
export interface AstronomicalEvent {
  name: string;
  description: string;
  date: string;
  hemisphere?: 'Northern' | 'Southern' | 'Both';
  type: 'moon' | 'planet' | 'meteor' | 'solstice' | 'equinox' | 'conjunction' | 'comet';
}

export interface MoonPhase {
  phase: string;
  illumination: number;      // 0..100 (%)
  nextPhase: string;         // 'New Moon' | 'First Quarter' | ...
  nextPhaseDate: string;     // dd/mm/yyyy
}

export interface PlanetaryPosition {
  planet: string;
  sign: string;
  degree: number;
  retrograde: boolean;
}

export interface ApodResult {
  title: string;
  date: string;      // YYYY-MM-DD
  mediaType: 'image' | 'video' | 'other';
  url: string;       // image URL or video URL
  hdurl?: string;    // image HD (if provided)
  thumbnailUrl?: string; // for videos
  copyright?: string;
  explanation?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers (generic)
// ───────────────────────────────────────────────────────────────────────────────
async function fetchJSON<T>(url: string, opts?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 10000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${txt || 'Request failed'}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0;
}

// ───────────────────────────────────────────────────────────────────────────────
// NASA — Astronomy Picture of the Day (APOD)
// ───────────────────────────────────────────────────────────────────────────────
export async function getApod(date?: string): Promise<ApodResult | null> {
  try {
    if (!isNonEmptyString(NASA_KEY)) {
      console.warn('[APOD] Missing EXPO_PUBLIC_NASA_API_KEY — returning null.');
      return null;
    }

    const qs = new URLSearchParams({
      api_key: NASA_KEY,
      thumbs: 'true',
    });
    if (isNonEmptyString(date)) qs.set('date', date); // YYYY-MM-DD

    const data = await fetchJSON<any>(`https://api.nasa.gov/planetary/apod?${qs.toString()}`, {
      timeoutMs: 12000,
    });

    const mediaType =
      data.media_type === 'image' ? 'image' :
      data.media_type === 'video' ? 'video' : 'other';

    const result: ApodResult = {
      title: isNonEmptyString(data.title) ? data.title : 'Astronomy Picture of the Day',
      date: isNonEmptyString(data.date) ? data.date : new Date().toISOString().slice(0, 10),
      mediaType,
      url: isNonEmptyString(data.url) ? data.url : '',
      hdurl: isNonEmptyString(data.hdurl) ? data.hdurl : undefined,
      thumbnailUrl: isNonEmptyString(data.thumbnail_url) ? data.thumbnail_url : undefined,
      copyright: isNonEmptyString(data.copyright) ? data.copyright : undefined,
      explanation: isNonEmptyString(data.explanation) ? data.explanation : undefined,
    };

    if (mediaType === 'video' && !result.thumbnailUrl) {
      result.thumbnailUrl = result.url;
    }

    return result;
  } catch (err) {
    console.error('[APOD] Failed to fetch:', err);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Events (static list)
// ───────────────────────────────────────────────────────────────────────────────
export const CURRENT_ASTRONOMICAL_EVENTS: AstronomicalEvent[] = [
  {
    name: "🦁 New Moon in Leo",
    description: "The Fire Mirror ritual: Reclaim your inner radiance and attract aligned recognition. Light a gold candle in front of a mirror, gaze at your reflection and whisper: 'I see the fire. I call it higher.' Write self-praise on a bay leaf and burn it safely.",
    date: "2025-08-01",
    hemisphere: "Northern",
    type: "moon"
  },
  {
    name: "🪐 Lionsgate Portal (8/8)",
    description: "Portal of Prosperity spell: Activate abundance with celestial support. Arrange 8 coins in an infinity shape with citrine at centre. Sip sun-charged water and journal: 'I open the gate. I walk with fate.' Think bigger—manifest worth, not just wealth.",
    date: "2025-08-08",
    hemisphere: "Northern",
    type: "conjunction"
  },
  {
    name: "🌕 Full Moon in Aquarius",
    description: "The Electric Thread ritual: Activate your higher mind and soul network. Tie silver thread around your wrist, hold the other end to the moon saying: 'I am connected, expanded, awake.' Write 3 visionary ideas with actions.",
    date: "2025-08-17",
    hemisphere: "Northern",
    type: "moon"
  },
  {
    name: "Geminids Meteor Shower Peak",
    description: "The most reliable meteor shower of the year reaches its peak, with up to 120 meteors per hour visible in dark skies.",
    date: "2024-12-14",
    hemisphere: "Both",
    type: "meteor"
  },
  {
    name: "Winter Solstice",
    description: "The shortest day of the year in the Northern Hemisphere, marking the astronomical beginning of winter.",
    date: "2024-12-21",
    hemisphere: "Northern",
    type: "solstice"
  },
  {
    name: "Summer Solstice",
    description: "The longest day of the year in the Southern Hemisphere, marking the astronomical beginning of summer.",
    date: "2024-12-21",
    hemisphere: "Southern",
    type: "solstice"
  },
  {
    name: "Jupiter-Saturn Conjunction",
    description: "Jupiter and Saturn appear close together in the evening sky, creating a beautiful celestial dance.",
    date: "2024-12-28",
    hemisphere: "Both",
    type: "conjunction"
  },
  {
    name: "Quadrantids Meteor Shower",
    description: "The first major meteor shower of the year, best viewed in the pre-dawn hours.",
    date: "2025-01-04",
    hemisphere: "Northern",
    type: "meteor"
  },
  {
    name: "Mars Opposition",
    description: "Mars reaches opposition, appearing brightest and largest in our sky as Earth passes between Mars and the Sun.",
    date: "2025-01-16",
    hemisphere: "Both",
    type: "planet"
  },
  {
    name: "Comet C/2023 A3 Visible",
    description: "A newly discovered comet becomes visible to the naked eye in the western sky after sunset.",
    date: "2025-02-10",
    hemisphere: "Both",
    type: "comet"
  }
];

// ───────────────────────────────────────────────────────────────────────────────
// LUNAR — Sydney-accurate calc using SunCalc
// ───────────────────────────────────────────────────────────────────────────────
function nowInSydney(): Date {
  const sydneyStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
  return new Date(sydneyStr);
}

function phaseNameFromFraction(phase: number): 'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter' | 'Waxing Crescent' | 'Waxing Gibbous' | 'Waning Gibbous' | 'Waning Crescent' {
  if (Math.abs(phase - 0) < 0.0125 || phase > 0.9875) return 'New Moon';
  if (Math.abs(phase - 0.25) < 0.0125) return 'First Quarter';
  if (Math.abs(phase - 0.5) < 0.0125) return 'Full Moon';
  if (Math.abs(phase - 0.75) < 0.0125) return 'Last Quarter';
  if (phase > 0 && phase < 0.25) return 'Waxing Crescent';
  if (phase > 0.25 && phase < 0.5) return 'Waxing Gibbous';
  if (phase > 0.5 && phase < 0.75) return 'Waning Gibbous';
  return 'Waning Crescent';
}

function fmtAU(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function findNextQuarter(start: Date): { nextPhase: 'New Moon'|'First Quarter'|'Full Moon'|'Last Quarter'; date: Date } {
  const targets: Array<{label:'New Moon'|'First Quarter'|'Full Moon'|'Last Quarter', value:number}> = [
    { label: 'New Moon', value: 0 },
    { label: 'First Quarter', value: 0.25 },
    { label: 'Full Moon', value: 0.5 },
    { label: 'Last Quarter', value: 0.75 },
  ];
  const startPhase = SunCalc.getMoonIllumination(start).phase;

  for (let h = 1; h <= 24 * 35; h++) {
    const t = new Date(start.getTime() + h * 3600 * 1000);
    const p = SunCalc.getMoonIllumination(t).phase;

    for (const trg of targets) {
      const crossed =
        (startPhase <= trg.value && p >= trg.value) ||
        (trg.value === 0 && startPhase > 0.95 && p < 0.05);

      if (crossed || Math.abs(p - trg.value) < 0.005) {
        return { nextPhase: trg.label, date: t };
      }
    }
  }
  return { nextPhase: 'Full Moon', date: new Date(start.getTime() + 14 * 86400 * 1000) };
}

export function getCurrentMoonPhase(): MoonPhase {
  const now = nowInSydney();
  const { fraction, phase } = SunCalc.getMoonIllumination(now);

  const name = phaseNameFromFraction(phase);
  const illumination = Math.round(fraction * 100);
  const { nextPhase, date } = findNextQuarter(now);

  console.log('[lunar:accurate]', {
    sydneyLocal: now.toString(),
    iso: now.toISOString(),
    phaseName: name,
    fraction,
    pct: illumination,
    nextPhase,
    nextPhaseDate: fmtAU(date),
  });

  return {
    phase: name,
    illumination,
    nextPhase,
    nextPhaseDate: fmtAU(date),
  };
}

function getNextPhase(currentPhase: string): string {
  const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const currentIndex = phases.indexOf(currentPhase);
  return currentIndex >= 0 ? phases[(currentIndex + 1) % phases.length] : 'Waxing Crescent';
}

// ───────────────────────────────────────────────────────────────────────────────
// Planetary positions — normalization/fallback helpers
// ───────────────────────────────────────────────────────────────────────────────
type RawPlanet = {
  name?: string;
  planet?: string;
  sign?: string;
  degree?: number;
  lon?: number;
  longitude?: number;
  ecliptic_longitude?: number;
  retrograde?: boolean;
  speed?: number;
  velocity?: number;
  // @ts-ignore
  source?: string;
};

const ZODIAC_SIGNS_ARRAY = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

function lonToSignAndDegree(lon: number) {
  const L = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(L / 30);
  const degree = Math.round((L - signIndex * 30) * 100) / 100;
  return { sign: ZODIAC_SIGNS_ARRAY[signIndex], degree };
}

function normalizePlanetName(n?: string) {
  if (!n) return '';
  return n.replace(/_/g, ' ')
          .toLowerCase()
          .replace(/^\w/, c => c.toUpperCase());
}

function getLon(raw: RawPlanet): number | null {
  if (typeof raw.ecliptic_longitude === 'number') return raw.ecliptic_longitude;
  if (typeof raw.longitude === 'number') return raw.longitude;
  if (typeof raw.lon === 'number') return raw.lon;
  // @ts-ignore
  if (typeof (raw as any).lng === 'number') return (raw as any).lng;
  return null;
}

function isCalcSource(src?: string) {
  return !!src && /calc|mock|approx/i.test(src);
}

const lastGoodPositions = new Map<string, PlanetaryPosition>();

function normalizePlanetaryPositions(rawList: RawPlanet[]): PlanetaryPosition[] {
  console.log('Normalizing planetary positions:', rawList);
  const result: PlanetaryPosition[] = [];

  for (const raw of rawList) {
    const name = normalizePlanetName(raw.name || raw.planet) || 'Planet';
    const retro = Boolean(
      raw.retrograde ??
      (typeof raw.speed === 'number' ? raw.speed < 0 : false) ??
      (typeof raw.velocity === 'number' ? raw.velocity < 0 : false)
    );
    const lon = getLon(raw);

    if (raw.sign && typeof raw.degree === 'number' && raw.degree !== 0) {
      const pos: PlanetaryPosition = { planet: name, sign: raw.sign, degree: raw.degree, retrograde: retro };
      lastGoodPositions.set(name, pos);
      result.push(pos);
      continue;
    }

    if (raw.sign && typeof raw.degree === 'number' && raw.degree === 0) {
      if (isCalcSource((raw as any).source) && lon !== null) {
        const { sign, degree } = lonToSignAndDegree(lon);
        const pos: PlanetaryPosition = { planet: name, sign, degree, retrograde: retro };
        lastGoodPositions.set(name, pos);
        result.push(pos);
        continue;
      }

      const cached = lastGoodPositions.get(name);
      if (cached) {
        result.push(cached);
        continue;
      }

      const fallbackPositions = getCurrentPlanetaryPositions();
      const fallbackPlanet = fallbackPositions.find(p => p.planet === name);
      if (fallbackPlanet) {
        lastGoodPositions.set(name, fallbackPlanet);
        result.push(fallbackPlanet);
        continue;
      }

      const pos: PlanetaryPosition = { planet: name, sign: raw.sign, degree: 0, retrograde: retro };
      result.push(pos);
      continue;
    }

    if (lon !== null) {
      const { sign, degree } = lonToSignAndDegree(lon);
      const pos: PlanetaryPosition = { planet: name, sign, degree, retrograde: retro };
      lastGoodPositions.set(name, pos);
      result.push(pos);
      continue;
    }

    const cached = lastGoodPositions.get(name);
    if (cached) {
      result.push(cached);
      continue;
    }

    console.warn(`Skipping ${name}: no sign/degree/longitude and no cache.`);
  }

  console.log('Normalized planetary positions:', result);
  return result;
}

// ───────────────────────────────────────────────────────────────────────────────
// PLANETS — NEW lightweight offline ephemeris (Mercury..Saturn)
// Accuracy ~1–2° typical (good for sign/degree + retrograde).
// ───────────────────────────────────────────────────────────────────────────────
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

function toJulianDay(d: Date): number {
  const Y = d.getUTCFullYear();
  let M = d.getUTCMonth() + 1;
  const D =
    d.getUTCDate() +
    (d.getUTCHours() + (d.getUTCMinutes() + d.getUTCSeconds() / 60) / 60) / 24;

  let y = Y;
  let m = M;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    D +
    B -
    1524.5;
  return JD;
}

function centuriesSinceJ2000(d: Date): number {
  const JD = toJulianDay(d);
  return (JD - 2451545.0) / 36525.0;
}

function solveKepler(M: number, e: number): number {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let i = 0; i < 6; i++) {
    const f = E - e * Math.sin(E) - M;
    const f1 = 1 - e * Math.cos(E);
    const dE = -f / f1;
    E += dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

type Elements = {
  a: number;      // AU
  e: number;
  I: number;      // deg
  L: number;      // deg
  wBar: number;   // deg (longitude of perihelion)
  Omega: number;  // deg (ascending node)
};

function elementsForBody(name: 'Mercury'|'Venus'|'Earth'|'Mars'|'Jupiter'|'Saturn', T: number): Elements {
  switch (name) {
    case 'Mercury':
      return { a: 0.38709893, e: 0.20563069 + 0.00002527*T, I: 7.00487 - 23.51*T/3600, L: 252.25084 + 149472.67411175*T, wBar: 77.45645 + 1.556477*T, Omega: 48.33167 - 0.125340*T };
    case 'Venus':
      return { a: 0.72333199, e: 0.00677323 - 0.00004938*T, I: 3.39471 - 2.86*T/3600, L: 181.97973 + 58517.81538729*T, wBar: 131.53298 - 1.617*T, Omega: 76.68069 - 0.277694*T };
    case 'Earth':
      return { a: 1.00000011 - 0.00000005*T, e: 0.01671022 - 0.00003804*T, I: 0.00005 - 46.94*T/3600, L: 100.46435 + 35999.3728521*T, wBar: 102.94719 + 0.71953*T, Omega: -11.26064 - 0.008*T };
    case 'Mars':
      return { a: 1.52366231 - 0.00007221*T, e: 0.09341233 + 0.00011902*T, I: 1.85061 - 25.47*T/3600, L: 355.45332 + 19140.29934243*T, wBar: 336.04084 + 1.841*T, Omega: 49.57854 - 0.292573*T };
    case 'Jupiter':
      return { a: 5.20336301 + 0.00060737*T, e: 0.04839266 - 0.00012880*T, I: 1.30530 - 4.15*T/3600, L: 34.40438 + 3034.74612775*T, wBar: 14.33121 + 1.612666*T, Omega: 100.55615 + 0.204691*T };
    case 'Saturn':
      return { a: 9.53707032 - 0.00301530*T, e: 0.05415060 - 0.00036762*T, I: 2.48446 + 6.11*T/3600, L: 49.94432 + 1222.49362201*T, wBar: 93.05723 + 1.963761*T, Omega: 113.71504 - 0.266009*T };
  }
}

function heliocentricXYZ(el: Elements): { x: number; y: number; z: number } {
  const a = el.a;
  const e = el.e;
  const I = el.I * D2R;
  const L = norm360(el.L) * D2R;
  const wBar = norm360(el.wBar) * D2R;
  const Omega = norm360(el.Omega) * D2R;

  const M = L - wBar;
  const E = solveKepler(M, e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);

  const xPrime = a * (cosE - e);
  const yPrime = a * Math.sqrt(1 - e * e) * sinE;

  const omega = wBar - Omega;

  const cosO = Math.cos(Omega), sinO = Math.sin(Omega);
  const cosi = Math.cos(I),     sini = Math.sin(I);
  const cosw = Math.cos(omega), sinw = Math.sin(omega);

  const x1 = cosw * xPrime - sinw * yPrime;
  const y1 = sinw * xPrime + cosw * yPrime;

  const x2 = x1;
  const y2 = y1 * cosi;
  const z2 = y1 * sini;

  const x = cosO * x2 - sinO * y2;
  const y = sinO * x2 + cosO * y2;
  const z = z2;

  return { x, y, z };
}

function geocentricLongitude(planet: 'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn', d: Date): number {
  const T = centuriesSinceJ2000(d);
  const earth = heliocentricXYZ(elementsForBody('Earth', T));
  const body  = heliocentricXYZ(elementsForBody(planet, T));
  const X = body.x - earth.x;
  const Y = body.y - earth.y;
  const lambda = Math.atan2(Y, X) * R2D;
  return norm360(lambda);
}

function isRetrograde(planet: 'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn', d: Date): boolean {
  const lon1 = geocentricLongitude(planet, d);
  const lon2 = geocentricLongitude(planet, new Date(d.getTime() + 86400000));
  const delta = ((lon2 - lon1 + 540) % 360) - 180; // -180..+180
  return delta < 0;
}

function getPlanetaryPositionsApprox(d = new Date()): PlanetaryPosition[] {
  const names: Array<'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn'> = [
    'Mercury','Venus','Mars','Jupiter','Saturn'
  ];

  return names.map((name) => {
    const lon = geocentricLongitude(name, d);
    const { sign, degree } = lonToSignAndDegree(lon);
    const retro = isRetrograde(name, d);
    return { planet: name, sign, degree, retrograde: retro };
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Public planetary API (your old fallback kept as backup)
// ───────────────────────────────────────────────────────────────────────────────
export async function getCurrentPlanetaryPositionsEnhanced(
  hemisphere: 'Northern' | 'Southern' = 'Northern'
): Promise<PlanetaryPosition[]> {
  try {
    return getPlanetaryPositionsApprox(new Date());
  } catch (err) {
    console.error('Error in approx planetary engine, falling back:', err);
    return getCurrentPlanetaryPositions();
  }
}

// Legacy simple placeholder (kept as ultimate fallback)
export function getCurrentPlanetaryPositions(): PlanetaryPosition[] {
  const today = nowInSydney();
  const baseDate = new Date('2025-08-13');
  const daysSinceBase = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

  return [
    { planet: "Mercury",  sign: "Leo",      degree: Math.max(0, Math.min(29, 28 + daysSinceBase * 1.2)),  retrograde: false },
    { planet: "Venus",    sign: "Virgo",    degree: Math.max(0, Math.min(29, 18 + daysSinceBase * 0.8)),  retrograde: false },
    { planet: "Mars",     sign: "Gemini",   degree: Math.max(0, Math.min(29, 22 + daysSinceBase * 0.3)),  retrograde: false },
    { planet: "Jupiter",  sign: "Gemini",   degree: Math.max(0, Math.min(29, 14 + daysSinceBase * 0.05)), retrograde: false },
    { planet: "Saturn",   sign: "Pisces",   degree: Math.max(0, Math.min(29, 19 + daysSinceBase * 0.02)), retrograde: true  },
  ];
}

// ───────────────────────────────────────────────────────────────────────────────
// Hemisphere events
// ───────────────────────────────────────────────────────────────────────────────
function getSouthernHemisphereEvents(): AstronomicalEvent[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      name: "🌟 Southern Cross Navigation",
      description: "The Southern Cross (Crux) serves as the southern hemisphere's primary navigation constellation, pointing toward the South Celestial Pole.",
      date: today,
      hemisphere: 'Southern',
      type: 'planet'
    },
    {
      name: "✨ Magellanic Clouds Viewing",
      description: "Optimal viewing conditions for the Large and Small Magellanic Clouds, satellite galaxies of the Milky Way visible only from southern latitudes.",
      date: today,
      hemisphere: 'Southern',
      type: 'planet'
    },
    {
      name: "🌌 Carina Nebula Region",
      description: "The Carina constellation region offers spectacular deep-sky viewing, including the famous Carina Nebula, visible only from southern latitudes.",
      date: today,
      hemisphere: 'Southern',
      type: 'planet'
    }
  ];
}

export function getHemisphereEvents(hemisphere: 'Northern' | 'Southern'): AstronomicalEvent[] {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

  const filteredEvents = CURRENT_ASTRONOMICAL_EVENTS.filter(event => {
    const eventDate = new Date(event.date);
    const isInTimeRange = eventDate >= today && eventDate <= thirtyDaysFromNow;
    const isRelevantToHemisphere = event.hemisphere === 'Both' || event.hemisphere === hemisphere;
    return isInTimeRange && isRelevantToHemisphere;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (filteredEvents.length === 0) {
    if (hemisphere === 'Northern') {
      return [
        {
          name: "Polaris Navigation Star",
          description: "The North Star (Polaris) remains fixed in the northern sky, serving as a reliable navigation reference point. Ursa Major and Cassiopeia circle around it.",
          date: today.toISOString().split('T')[0],
          hemisphere: 'Northern',
          type: 'planet'
        },
        {
          name: "Orion Winter Viewing",
          description: "Orion constellation dominates the northern winter sky, with its distinctive belt and bright stars Betelgeuse and Rigel clearly visible.",
          date: today.toISOString().split('T')[0],
          hemisphere: 'Northern',
          type: 'planet'
        }
      ];
    }
    return getSouthernHemisphereEvents();
  }

  return filteredEvents;
}

// ───────────────────────────────────────────────────────────────────────────────
// Constellations (static + enhanced hook point)
// ───────────────────────────────────────────────────────────────────────────────
export async function getVisibleConstellationsEnhanced(hemisphere: 'Northern' | 'Southern'): Promise<string[]> {
  try {
    console.log('Using fallback constellations');
  } catch (error) {
    console.error('Error fetching enhanced constellations:', error);
  }
  return getVisibleConstellations(hemisphere);
}

export function getVisibleConstellations(hemisphere: 'Northern' | 'Southern'): string[] {
  const month = new Date().getMonth();

  const northernConstellations = [
    ["Orion", "Taurus", "Gemini", "Auriga", "Perseus", "Canis Major", "Ursa Major", "Cassiopeia"], // Winter (Dec-Feb)
    ["Leo", "Virgo", "Boötes", "Corona Borealis", "Ursa Major", "Ursa Minor", "Draco", "Cassiopeia"], // Spring (Mar-May)
    ["Cygnus", "Lyra", "Aquila", "Hercules", "Ophiuchus", "Ursa Major", "Cassiopeia", "Draco"], // Summer (Jun-Aug)
    ["Pegasus", "Andromeda", "Cassiopeia", "Cepheus", "Ursa Major", "Perseus", "Aries", "Triangulum"] // Fall (Sep-Nov)
  ];

  const southernConstellations = [
    ["Southern Cross", "Centaurus", "Carina", "Vela", "Puppis", "Crux", "Musca", "Chamaeleon"], // Summer (Dec-Feb)
    ["Southern Cross", "Centaurus", "Hydra", "Crater", "Corvus", "Carina", "Chamaeleon", "Volans"], // Autumn (Mar-May)
    ["Southern Cross", "Centaurus", "Carina", "Sagittarius", "Scorpius", "Ara", "Telescopium", "Corona Australis"], // Winter (Jun-Aug)
    ["Southern Cross", "Centaurus", "Carina", "Grus", "Phoenix", "Tucana", "Pavo", "Indus"] // Spring (Sep-Nov)
  ];

  const seasonIndex = Math.floor(month / 3);
  return hemisphere === 'Northern'
    ? northernConstellations[seasonIndex]
    : southernConstellations[seasonIndex];
}

// ───────────────────────────────────────────────────────────────────────────────
// Insight + APOD combo
// ───────────────────────────────────────────────────────────────────────────────
export function getAstronomicalInsight(hemisphere: 'Northern' | 'Southern'): string {
  const moonPhase = getCurrentMoonPhase();
  const events = getHemisphereEvents(hemisphere);
  const constellations = getVisibleConstellations(hemisphere);

  let insights: string[];

  if (hemisphere === 'Southern') {
    insights = [
      `The ${moonPhase.phase} (${moonPhase.illumination}% illuminated) illuminates the southern sky, ${moonPhase.illumination > 75 ? 'washing out fainter stars but highlighting the Southern Cross and Carina region' : 'creating perfect conditions for viewing the Southern Cross, Magellanic Clouds, and other southern celestial treasures unique to your hemisphere'}.`,
      `In the Southern Hemisphere, the iconic Southern Cross (Crux) guides navigators toward the South Celestial Pole, while the Large and Small Magellanic Clouds—satellite galaxies of the Milky Way—offer spectacular viewing opportunities invisible to northern observers.`,
      events.length > 0
        ? `Southern Hemisphere highlight: ${events[0].name}. ${events[0].description}`
        : `The Southern Hemisphere celestial sphere reveals wonders invisible to northern observers, including the Coal Sack Nebula, Carina Nebula, Magellanic Clouds, and the brilliant Southern Cross constellation pointing to the South Celestial Pole.`,
      `From your Southern Hemisphere location, you have exclusive access to celestial treasures like the Southern Cross, Magellanic Clouds, and deep-sky objects in Carina and Centaurus.`
    ];
  } else {
    insights = [
      `The ${moonPhase.phase} (${moonPhase.illumination}% illuminated) ${moonPhase.illumination > 50 ? 'brightens' : 'darkens'} the northern sky, ${moonPhase.illumination > 75 ? 'making it perfect for lunar observation but washing out fainter stars' : 'creating ideal conditions for viewing Orion, the Big Dipper, and northern deep-sky objects'}.`,
      `In the northern hemisphere, Polaris (the North Star) remains fixed as a reliable navigation beacon, while Ursa Major (Big Dipper) and Cassiopeia circle around it.`,
      events.length > 0
        ? `Northern sky highlight: ${events[0].name}. ${events[0].description}`
        : `The northern celestial sphere offers iconic sights like Ursa Major, Cassiopeia, and Orion’s Belt. Polaris serves as the fixed navigation star.`,
      `Polaris and the circumpolar constellations (Ursa Major, Cassiopeia) are visible year-round from northern latitudes.`
    ];
  }

  return insights[Math.floor(Math.random() * insights.length)];
}

export async function getAstronomicalInsightWithApod(
  hemisphere: 'Northern' | 'Southern',
  apodDate?: string
): Promise<{ insight: string; apod: ApodResult | null }> {
  const insight = getAstronomicalInsight(hemisphere);
  const apod = await getApod(apodDate);
  return { insight, apod };
}
