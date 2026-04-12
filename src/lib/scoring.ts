// src/lib/scoring.ts
// Surfability Scoring Logic v2.1
// Formula based on: Surfability_Scoring_Logic.docx (Polina Terentjeva, 2026)
// Refinements from live testing:
//   - Wind direction applied at all speeds above 5 km/h (Kuta onshore bug fix)
//   - Onshore period penalty added (Bingin long period inflation fix)
//   - UTC timezone fix in openMeteo.ts ensures correct forecast hour is read

export type Rating = 'Good' | 'Fair' | 'Poor';

export interface SurfScore {
  score:  number;
  rating: Rating;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Shortest angular difference between two compass bearings (0–180°).
// Handles wrap-around: angleDiff(350, 10) = 20, not 340.
function angleDiff(a: number, b: number): number {
  return Math.abs(((a - b) + 180) % 360 - 180);
}

// ─── SUB-SCORE FUNCTIONS ──────────────────────────────────────────────────────

// Wave height sub-score (0–10).
// The single most important safety factor for beginners.
// Source: La Point Camps (2025), Outer Reef (2025), Rise Up Surf (2024)
//
//  < 0.3m  → 2   too flat, waves don't form properly
//  0.3–0.8 → 10  ideal beginner range
//  0.8–1.2 → 7   manageable but getting big
//  1.2–2.0 → 3   too big for most beginners
//  > 2.0m  → never reached — hard override fires first
function scoreWaveHeight(m: number): number {
  if (m < 0.3)  return 2;
  if (m <= 0.8) return 10;
  if (m <= 1.2) return 7;
  if (m <= 2.0) return 3;
  return 0;
}

// Wind sub-score (0–10) — speed × direction multiplier.
// Source: Surf Hub (2024), La Point Camps (2025), Cornish Wave (2024)
// Document section 5.1 (speed thresholds) + section 10 (direction multiplier)
//
// Speed base score:
//   ≤ 5 km/h  → 10  truly glassy, direction irrelevant
//   ≤ 10 km/h → 10  near-glassy (direction still applied — Kuta fix)
//   ≤ 20 km/h → 7   light wind, acceptable
//   ≤ 30 km/h → 4   choppy, harder to learn
//   > 30 km/h → 0   too strong for beginners
//
// Direction multiplier:
//   0–45°   offshore / cross-offshore  → 1.0  groomed wave faces
//   45–90°  cross-shore               → 0.6  degraded but surfable
//   > 90°   onshore                   → 0.2  blown out, heavily penalised
//
// Fix: old code returned 10 for anything ≤ 10 km/h ignoring direction.
// A 5 km/h onshore wind at Kuta now correctly returns 10 × 0.2 = 2.0.
function scoreWind(kmh: number, windDirDeg: number, offshoreDir: number): number {
  // Truly glassy — direction has no measurable effect at this speed
  if (kmh <= 5) return 10;

  const diff = angleDiff(windDirDeg, offshoreDir);
  const dirMultiplier =
    diff <= 45 ? 1.0 :
    diff <= 90 ? 0.6 :
                 0.2;

  const speedScore =
    kmh <= 10 ? 10 :
    kmh <= 20 ? 7  :
    kmh <= 30 ? 4  :
                0;

  return Math.round(speedScore * dirMultiplier * 10) / 10;
}

// Swell period sub-score (0–10).
// Source: Surf Hub (2024), Outer Reef (2025), Wikipedia surf forecasting
//
//  < 6s      → 1   unsurfable wind chop
//  6–8s      → 5   weak wind swell, poor shape
//  8–12s     → 10  ideal beginner groundswell
//  > 12s     → 4   powerful, more consequential wipeouts
//  > 12s + onshore wind → 1  powerful AND blown out = worst case for beginners
//
// Fix: Bingin scored too high because 12.5s period gave a 4 even with onshore wind.
// Long period + onshore = more energy hitting a blown-out surface = more dangerous.
function scorePeriod(sec: number, windIsOnshore: boolean): number {
  if (sec < 6)   return 1;
  if (sec <= 8)  return 5;
  if (sec <= 12) return 10;
  return windIsOnshore ? 1 : 4;
}

// Swell direction sub-score (0–10).
// Each beach faces a specific direction — swell from the wrong angle
// doesn't hit the break properly and produces poor or no waves.
// Source: document section 10, surf-forecast.com spot guides
//
//  0–20°   near-perfect alignment       → 10
//  20–45°  good angle, break works well → 7
//  45–70°  workable, reduced power      → 4
//  70–90°  barely hitting the break     → 1
//  > 90°   swell missing the break      → 0
function scoreSwellDirection(swellDirDeg: number, idealSwellDir: number): number {
  const diff = angleDiff(swellDirDeg, idealSwellDir);
  if (diff <= 20) return 10;
  if (diff <= 45) return 7;
  if (diff <= 70) return 4;
  if (diff <= 90) return 1;
  return 0;
}

// Converts numeric score to rating label.
// Three labels only — matches document section 5.3.
// No 'Epic' label — not defined in the scoring document.
//   7–10 → Good  safe and suitable for beginners
//   4–6  → Fair  manageable, some challenges
//   0–3  → Poor  not recommended for beginners
function toRating(score: number): Rating {
  if (score >= 7) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Poor';
}

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

// Calculates surfability score (0–10) and rating label for a single spot.
// All spot-specific config comes from the database — no hardcoded data here.
//
// Formula v2.1 (document section 11.4 + live test refinements):
//   score = (waveSubScore  × 0.40)
//         + (windSubScore  × 0.25)
//         + (periodSubScore× 0.20)
//         + (swellDirScore × 0.15)
//   minus reef penalty (flat deduction after weighting)
//
// Hard safety overrides — always return score 0, rating Poor:
//   waveHeight > 2.0m    hold-down risk, physically dangerous for beginners
//   windSpeed  > 40 km/h unsafe conditions
//
// Reef penalty (source: balisurfingcamp.com, thebeginnersurfer.com):
//   0.0  sandy beach break  no penalty, safest bottom
//   0.5  mixed / flat reef  increased wipeout consequence
//   1.0  sharp shallow reef advanced surfers only
//
// Parameters — all spot-specific values come from db (spots table):
//   waveM         wave height in metres
//   windKmh       wind speed in km/h
//   windDirDeg    wind direction in degrees
//   periodSec     wave period in seconds
//   swellDirDeg   swell direction in degrees
//   idealSwellDir spots.ideal_swell_dir
//   offshoreDir   spots.offshore_wind_dir
//   reefPenalty   spots.reef_penalty
export function calculateSurfScore(
  waveM:         number,
  windKmh:       number,
  windDirDeg:    number,
  periodSec:     number,
  swellDirDeg:   number,
  idealSwellDir: number,
  offshoreDir:   number,
  reefPenalty:   number,
): SurfScore {
  // Hard safety overrides — fire before any calculation
  if (waveM > 2.0 || windKmh > 40) {
    return { score: 0, rating: 'Poor' };
  }

  // Pre-calculate wind angle — reused in scoreWind and scorePeriod
  const windDiff      = angleDiff(windDirDeg, offshoreDir);
  const windIsOnshore = windDiff > 90;

  const raw =
    scoreWaveHeight(waveM)                          * 0.40 +
    scoreWind(windKmh, windDirDeg, offshoreDir)     * 0.25 +
    scorePeriod(periodSec, windIsOnshore)           * 0.20 +
    scoreSwellDirection(swellDirDeg, idealSwellDir) * 0.15;

  // Apply reef penalty after weighting.
  // A reef break does not become safer just because waves are small.
  // Math.max(0) ensures score never goes negative.
  const score = Math.max(0, Math.round((raw - reefPenalty) * 10) / 10);

  return { score, rating: toRating(score) };
}