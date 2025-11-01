// utils/daily.ts
'use client';

import { supabase } from '@/utils/supabase';

// ----- Types -----
export type HemiShort = 'NH' | 'SH';
export type HemiAny = HemiShort | 'Northern' | 'Southern';

export type DailyRow = {
  sign: string;
  hemisphere: 'Northern' | 'Southern';
  date: string;               // "YYYY-MM-DD"
  daily_horoscope?: string;
  affirmation?: string;
  deeper_insight?: string;
  __source_table__?: 'horoscope_cache';
  [key: string]: any;
};

// =============================================================================
// String helpers
// =============================================================================
function toTitleCaseWord(w: string) {
  return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '';
}

function normalizeDashesToHyphen(s: string) {
  return (s || '').replace(/[\u2012\u2013\u2014\u2015]/g, '-'); // all figure/en/em dashes -> hyphen
}

function squashSpaces(s: string) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function stripTrailingCusp(s: string) {
  return s.replace(/\s*cusp\s*$/i, '').trim();
}

/** A strict, display-friendly normalization (keeps title case and displays en–dash style as hyphen-free text) */
function normalizeSignForDaily(input: string): {
  primaryWithCusp?: string;   // "Aries-Taurus Cusp" (we avoid en dash in user content)
  primaryNoCusp: string;      // "Aries-Taurus" or "Aries"
  parts: string[];
  isCusp: boolean;
} {
  if (!input) return { primaryNoCusp: '', parts: [], isCusp: false };

  let s = squashSpaces(input);
  const isCusp = /\bcusp\b/i.test(s);
  const hyphenBase = normalizeDashesToHyphen(s);
  const noCusp = stripTrailingCusp(hyphenBase);

  const parts = noCusp
    .split('-')
    .map(part =>
      part
        .trim()
        .split(' ')
        .map(toTitleCaseWord)
        .join(' ')
    )
    .filter(Boolean);

  // Display with a simple hyphen (user does not want em dashes)
  const base = parts.join('-');
  const primaryNoCusp = base;
  const primaryWithCusp = isCusp ? `${base} Cusp` : undefined;

  return { primaryWithCusp, primaryNoCusp, parts, isCusp };
}

// ----- A lenient, comparison-focused normalizer (lowercase, hyphen, no extra spaces) -----
function canonSignForCompare(s: string) {
  const hyph = normalizeDashesToHyphen(s);
  return squashSpaces(hyph).toLowerCase();
}
function canonSignNoCusp(s: string) {
  return canonSignForCompare(stripTrailingCusp(s));
}

/** Build sign attempts in strict cusp-first order (no true-sign fallback for cusp unless enabled). */
function buildSignAttemptsForDaily(
  inputLabel: string,
  opts?: { allowTrueSignFallback?: boolean }
): string[] {
  const { primaryWithCusp, primaryNoCusp, parts, isCusp } = normalizeSignForDaily(inputLabel);
  const allowFallback = !!opts?.allowTrueSignFallback;

  const list: string[] = [];
  if (primaryWithCusp) list.push(primaryWithCusp);           // hyphen + "Cusp"
  if (primaryNoCusp) list.push(primaryNoCusp);               // hyphen no cusp

  if (!isCusp || allowFallback) {
    for (const p of parts) if (p) list.push(p);              // fallback to each sign if allowed
  }
  return [...new Set(list)].filter(Boolean);
}

// =============================================================================
// Halloween/Samhain scrubbers (defensive, so stale copy never shows again)
// =============================================================================
const HALLOWEEN_MARKERS = [
  'halloween',
  'samhain',
  'veil walker',
  'pumpkin',
  'thinning veil',
];

function stripHalloweenLines(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const keep = lines.filter(
    line => !HALLOWEEN_MARKERS.some(m => line.toLowerCase().includes(m))
  );
  return keep.join('\n').trim();
}

function sanitizeUserFacingText(s: string): string {
  // 1) remove em/en dashes, 2) trim, 3) purge halloween lines
  const noFancyDash = normalizeDashesToHyphen(s);
  return stripHalloweenLines(noFancyDash).trim();
}

// =============================================================================
// Hemisphere + Date helpers
// =============================================================================
function hemiToDB(hemi?: HemiAny): 'Northern' | 'Southern' {
  const v = (hemi || 'Southern').toString().toLowerCase();
  if (v === 'northern' || v === 'nh') return 'Northern';
  return 'Southern';
}

function pad2(n: number) {
  return `${n}`.padStart(2, '0');
}

/**
 * Return YYYY-MM-DD for a given Date in the given IANA time zone.
 */
function ymdInTZ(d: Date, timeZone: string): string {
  const y = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).format(d);
  const m = new Intl.DateTimeFormat('en-US', { timeZone, month: '2-digit' }).format(d);
  const day = new Intl.DateTimeFormat('en-US', { timeZone, day: '2-digit' }).format(d);
  return `${y}-${m}-${day}`;
}

/** User time zone (falls back to UTC if unknown) */
function getUserTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch {
    return 'UTC';
  }
}

// Legacy anchors
function anchorLocal(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function anchorUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/**
 * Build date anchors prioritizing the USER'S LOCAL DAY in their time zone,
 * then UTC, plus ±1-day in the user TZ to cover midnight edges.
 */
function buildDailyAnchors(d = new Date()): string[] {
  const userTZ = getUserTimeZone();

  const todayUser = ymdInTZ(d, userTZ);
  const yesterdayUser = ymdInTZ(new Date(d.getTime() - 24 * 60 * 60 * 1000), userTZ);
  const tomorrowUser = ymdInTZ(new Date(d.getTime() + 24 * 60 * 60 * 1000), userTZ);

  const todayUTC = anchorUTC(d);
  const todayLocal = anchorLocal(d); // device clock

  const anchors = [
    todayUser,
    todayUTC,
    todayLocal,
    yesterdayUser,
    tomorrowUser,
  ];

  return [...new Set(anchors)].filter(Boolean);
}

// =============================================================================
// Cache helpers
// =============================================================================
// BUMP VERSION to invalidate old localStorage keys that caused stale content.
const CACHE_VERSION = 'v3'; // bumped

function cacheKeyDaily(
  userId: string | undefined,
  sign: string,
  hemi: 'Northern' | 'Southern',
  ymd: string
) {
  return `${CACHE_VERSION}:daily:${userId ?? 'anon'}:${sign}:${hemi}:${ymd}`;
}
function getFromCache<T = unknown>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function setInCache(key: string, value: unknown) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Does a DB row's sign match a candidate, once both are normalized? */
function rowMatchesSign(rowSign: string, candidate: string) {
  if (!rowSign || !candidate) return false;

  // Canonical forms
  const canRow = canonSignForCompare(rowSign);
  const canRowNoCusp = canonSignNoCusp(rowSign);

  const canCand = canonSignForCompare(candidate);
  const canCandNoCusp = canonSignNoCusp(candidate);

  // Exact or no-cusp equivalence
  return (
    canRow === canCand ||
    canRow === canCandNoCusp ||
    canRowNoCusp === canCand ||
    canRowNoCusp === canCandNoCusp
  );
}

// =============================================================================
// DB fetchers
// =============================================================================

/** Fetch all rows for a given date+hemi; we’ll match the sign client-side. */
async function fetchRowsForDate(
  date: string,
  hemi: 'Northern' | 'Southern',
  debug?: boolean
): Promise<{ rows: DailyRow[]; error: any }> {
  const { data, error } = await supabase
    .from('horoscope_cache')
    .select('sign, hemisphere, date, daily_horoscope, affirmation, deeper_insight')
    .eq('hemisphere', hemi)
    .eq('date', date);

  if (debug) {
    console.log('[daily] (horoscope_cache:list)', {
      date, hemisphere: hemi,
      error: error?.message || null,
      count: Array.isArray(data) ? data.length : 0,
    });
  }

  if (error) return { rows: [], error };

  const rows: DailyRow[] = (data || []).map(r => ({
    sign: r.sign,
    hemisphere: r.hemisphere,
    date: r.date,
    daily_horoscope: r.daily_horoscope || '',
    affirmation: r.affirmation || '',
    deeper_insight: r.deeper_insight || '',
    __source_table__: 'horoscope_cache',
  }));

  return { rows, error: null };
}

// =============================================================================
// PUBLIC API
// =============================================================================

export async function getDailyForecast(
  signIn: string,
  hemisphereIn: HemiAny,
  opts?: {
    userId?: string;
    forceDate?: string;        // if provided, overrides anchors entirely
    useCache?: boolean;
    debug?: boolean;
    allowTrueSignFallback?: boolean;
  }
): Promise<DailyRow | null> {
  const debug = !!opts?.debug;
  const userId = opts?.userId;
  const hemi = hemiToDB(hemisphereIn);

  const today = new Date();
  const anchors = opts?.forceDate ? [opts?.forceDate] : buildDailyAnchors(today);

  const signAttempts = buildSignAttemptsForDaily(signIn, {
    allowTrueSignFallback: !!opts?.allowTrueSignFallback,
  });

  if (debug) {
    console.log('[daily] attempts', {
      originalSign: signIn,
      signAttempts,
      anchors,
      hemisphere: hemi,
      todayUserTZ: getUserTimeZone(),
      todayUTC: anchorUTC(today),
      todayLocal: anchorLocal(today),
    });
  }

  // Cache first (unless disabled)
  if (opts?.useCache !== false) {
    for (const dateStr of anchors) {
      for (const s of signAttempts) {
        const key = cacheKeyDaily(userId, s, hemi, dateStr);
        const cached = getFromCache<DailyRow>(key);
        if (cached && cached.date === dateStr && cached.hemisphere === hemi && cached.sign === s) {
          if (debug) console.log('💾 [daily] cache hit', { key, sign: s, hemi, date: dateStr, source: cached.__source_table__ });
          // scrub cached content just in case
          cached.daily_horoscope = sanitizeUserFacingText(cached.daily_horoscope || '');
          cached.affirmation = sanitizeUserFacingText(cached.affirmation || '');
          cached.deeper_insight = sanitizeUserFacingText(cached.deeper_insight || '');
          return cached;
        }
      }
    }
  }

  // DB tries: pull all rows for date+hemi, then match sign locally
  for (const dateStr of anchors) {
    if (debug) console.log(`[daily] Fetching list for date="${dateStr}", hemisphere="${hemi}"`);
    const { rows, error } = await fetchRowsForDate(dateStr, hemi, debug);
    if (error) continue;
    if (!rows.length) {
      if (debug) console.log('[daily] no rows for that date+hemi, trying next anchor');
      continue;
    }

    // Try each candidate against fetched rows
    for (const cand of signAttempts) {
      const match = rows.find(r => rowMatchesSign(r.sign, cand));
      if (match) {
        // sanitize before caching and returning
        const clean: DailyRow = {
          ...match,
          daily_horoscope: sanitizeUserFacingText(match.daily_horoscope || ''),
          affirmation: sanitizeUserFacingText(match.affirmation || ''),
          deeper_insight: sanitizeUserFacingText(match.deeper_insight || ''),
        };

        const key = cacheKeyDaily(userId, clean.sign, hemi, dateStr);
        setInCache(key, clean);

        if (debug) {
          console.log(`[daily] ✅ MATCH`, {
            wanted: cand,
            matchedRowSign: clean.sign,
            hemi,
            date: dateStr,
            hasDaily: !!clean.daily_horoscope,
            hasAff: !!clean.affirmation,
            hasDeep: !!clean.deeper_insight,
          });
        }
        return clean;
      }
    }

    if (debug) {
      console.log('[daily] no sign match among rows for date anchor; sample signs:', rows.slice(0, 5).map(r => r.sign));
    }
  }

  if (debug) console.warn('[daily] not found for', { signAttempts, anchors, hemi });
  return null;
}

/** Convenience wrapper for screens */
export async function getAccessibleHoroscope(user: any, opts?: {
  forceDate?: string;
  useCache?: boolean;
  debug?: boolean;
}) {
  const debug = !!opts?.debug;

  const hemisphere: HemiAny =
    user?.hemisphere === 'NH' || user?.hemisphere === 'SH'
      ? user.hemisphere
      : (user?.hemisphere as 'Northern' | 'Southern') || 'Southern';

  const signLabel =
    user?.cuspResult?.cuspName ||
    user?.cuspResult?.primarySign ||
    user?.preferred_sign ||
    '';

  const isCuspInput = /\bcusp\b/i.test(signLabel);

  const row = await getDailyForecast(signLabel, hemisphere, {
    userId: user?.id || user?.email,
    forceDate: opts?.forceDate,
    useCache: false,     // keep fresh to avoid stale cache
    debug: true,         // keep logs visible while verifying
    allowTrueSignFallback: !isCuspInput ? true : false,
  });

  if (!row) return null;

  // Final defensive scrub on the way out
  return {
    date: row.date,
    sign: row.sign,
    hemisphere: row.hemisphere,
    daily: sanitizeUserFacingText(row.daily_horoscope || ''),
    affirmation: sanitizeUserFacingText(row.affirmation || ''),
    deeper: sanitizeUserFacingText(row.deeper_insight || ''),
    raw: row,
  };
}

// =============================================================================
// Optional tiny Mish helpers (safe to ignore if unused)
// =============================================================================

/** Clear any spooky cached Mish payloads created earlier, if present. */
export function clearMysticMishArtifacts() {
  if (typeof window === 'undefined') return;
  const candidates = [
    'mish.ritual',
    'mish.ritual.current',
    'mysticMish.tabRitual',
    'cusp_ritual_cache',
    'ritual_text',
  ];
  try {
    for (const k of candidates) {
      const v = window.localStorage.getItem(k) || '';
      if (HALLOWEEN_MARKERS.some(m => v.toLowerCase().includes(m))) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

/** Broadcast a neutral November notice to the Mish tab, if you ever want to from here. */
export function broadcastMishNotice(message = 'November gateway active. Tap Mish on the Daily page to load todays rite here.') {
  if (typeof window === 'undefined') return;
  const payload = { title: 'Mystic Mish', body: sanitizeUserFacingText(message), version: 'daily-utils' };
  try {
    window.localStorage.setItem('mish.ritual', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('mish:ritual', { detail: payload }));
  } catch {
    // ignore
  }
}

export const DailyHelpers = {
  normalizeSignForDaily,
  hemiToDB,
  anchorLocal,
  anchorUTC,
  ymdInTZ,
  buildDailyAnchors,
  buildSignAttemptsForDaily,
  cacheKeyDaily,
};
