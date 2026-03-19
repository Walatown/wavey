// src/lib/scoring.ts

export type Rating = 'Epic' | 'Good' | 'Fair' | 'Poor';

export interface SurfScore {
  score: number;
  rating: Rating;
}

// Per-spot geographic and physical data.
// Sources:
//   swellDir / offshoreDir: surf-forecast.com spot guides
//   reefPenalty: balisurfingcamp.com, thebeginnersurfer.com, finnsbeachclub.com
//
// reefPenalty is a flat deduction from the final score, applied after weighting.
// It reflects the increased wipeout consequence of surfing over sharp reef vs sand.
// Sandy bottom = 0 penalty. Flat/mixed reef = -0.5. Sharp/shallow reef = -1.0.
//
// This is a beginner-safety app, so the penalty exists to warn beginners that
// the same wave height is more dangerous at a reef break than a beach break.
export const SPOT_DATA: Record<string, {
  swellDir:     number;  // ideal swell direction in degrees
  offshoreDir:  number;  // wind direction that is offshore for this break
  reefPenalty:  number;  // flat score deduction for reef danger (0, 0.5, or 1.0)
  bottomType:   string;  // human-readable label for the UI
}> = {
  'Kuta': {
    swellDir:    225, offshoreDir:  70,
    reefPenalty: 0,   bottomType:  'Sandy beach break — safest for beginners',
  },
  'Seminyak': {
    swellDir:    225, offshoreDir:  70,
    reefPenalty: 0,   bottomType:  'Sandy beach break — safest for beginners',
  },
  'Canggu': {
    swellDir:    225, offshoreDir:  45,
    reefPenalty: 0.5, bottomType:  'Reef bottom — softer than Uluwatu but not sand',
  },
  'Uluwatu': {
    swellDir:    225, offshoreDir:  135,
    reefPenalty: 1.0, bottomType:  'Sharp shallow reef — advanced surfers only',
  },
  'Padang Padang': {
    swellDir:    225, offshoreDir:  135,
    reefPenalty: 0.5, bottomType:  'Reef break — sand/seaweed layer at Baby Padang section',
  },
};

// Shortest angular difference between two compass bearings (0–180).
function angleDiff(a: number, b: number): number {
  return Math.abs(((a - b) + 180) % 360 - 180);
}

function scoreWaveHeight(m: number): number {
  if (m < 0.3)  return 2;
  if (m <= 0.8) return 10;
  if (m <= 1.2) return 7;
  if (m <= 2.0) return 3;
  return 0;
}

// Wind score: base speed score multiplied by direction quality.
// Below 10 km/h the sea is near-glassy — direction is irrelevant at this speed.
function scoreWind(kmh: number, windDirDeg: number, offshoreDir: number): number {
  if (kmh <= 10) return 10;

  const diff = angleDiff(windDirDeg, offshoreDir);
  let dirMultiplier: number;
  if (diff <= 45)  dirMultiplier = 1.0;  // offshore / cross-offshore
  else if (diff <= 90) dirMultiplier = 0.6; // cross-shore
  else dirMultiplier = 0.2;              // onshore

  let speedScore: number;
  if (kmh <= 20) speedScore = 7;
  else if (kmh <= 30) speedScore = 4;
  else if (kmh <= 40) speedScore = 1;
  else speedScore = 0;

  return Math.round(speedScore * dirMultiplier * 10) / 10;
}

function scorePeriod(sec: number): number {
  if (sec < 6)   return 1;
  if (sec <= 8)  return 5;
  if (sec <= 12) return 10;
  return 4;
}

function scoreSwellDirection(swellDirDeg: number, idealSwellDir: number): number {
  const diff = angleDiff(swellDirDeg, idealSwellDir);
  if (diff <= 20)  return 10;
  if (diff <= 45)  return 7;
  if (diff <= 70)  return 4;
  if (diff <= 90)  return 1;
  return 0;
}

function toRating(score: number): Rating {
  if (score >= 8) return 'Epic';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Poor';
}

export function calculateSurfScore(
  waveM: number,
  windKmh: number,
  windDirDeg: number,
  periodSec: number,
  swellDirDeg: number,
  spotName: string,
): SurfScore {
  if (waveM > 2.0 || windKmh > 40) {
    return { score: 0, rating: 'Poor' };
  }

  const spot = SPOT_DATA[spotName] ?? { swellDir: 225, offshoreDir: 70, reefPenalty: 0, bottomType: 'Unknown' };

  // Weights: wave height 40%, wind (speed+direction) 25%, period 20%, swell direction 15%
  const raw =
    scoreWaveHeight(waveM)                             * 0.40 +
    scoreWind(windKmh, windDirDeg, spot.offshoreDir)  * 0.25 +
    scorePeriod(periodSec)                             * 0.20 +
    scoreSwellDirection(swellDirDeg, spot.swellDir)   * 0.15;

  // Apply reef penalty after weighting — flat deduction regardless of conditions.
  // A reef break does not become safer because the waves are small.
  const penalised = Math.max(0, raw - spot.reefPenalty);
  const score = Math.round(penalised * 10) / 10;

  return { score, rating: toRating(score) };
}