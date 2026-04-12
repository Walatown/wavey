import test from 'node:test';
import assert from 'node:assert/strict';

import { getWaveHeight, toSurfExplanationRequest } from './waveHeight.ts';
import type { SurfSpot } from '../types/surf';

test('getWaveHeight returns the exact hourly wave height at the selected index', () => {
  const marine = {
    hourly: {
      wave_height: [0.6, 1.25, 1.9],
    },
  };

  assert.equal(getWaveHeight(marine, 1), 1.25);
});

test('getWaveHeight falls back to 0 when wave height data is missing or out of range', () => {
  assert.equal(getWaveHeight({ hourly: {} }, 0), 0);
  assert.equal(getWaveHeight({ hourly: { wave_height: [0.8] } }, 4), 0);
});

test('toSurfExplanationRequest preserves the exact wave height from the spot payload', () => {
  const spot: SurfSpot = {
    id: 7,
    name: 'Keramas',
    location: 'Bali',
    waveHeight: 1.37,
    period: 12,
    windSpeed: 18,
    windDirection: 'SE',
    waterTemp: 27,
    score: 82,
    rating: 'Good',
    bestTime: '',
    explanation: '',
  };

  const request = toSurfExplanationRequest(spot);

  assert.equal(request.waveHeight, 1.37);
  assert.equal(request.waveHeight, spot.waveHeight);
});
