'use client';

import { useCallback, useState } from 'react';

import type { SurfExplanationRequest, SurfSpot } from '@/types/surf';

const EXPLANATION_CACHE_MS = 60 * 60 * 1000;

// Manages surf spot data, loading state, and per-spot explanation fetching.
export function useSurfConditions() {
  const [spots, setSpots] = useState<SurfSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explainingSpotId, setExplainingSpotId] = useState<number | null>(null);
  const [explanationFetchedAt, setExplanationFetchedAt] = useState<Record<number, number>>({});

  // Loads the latest surf conditions and clears any cached explanation timestamps.
  const fetchConditions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/surf-data');

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Unable to load surf conditions.');
      }

      const data: SurfSpot[] = await response.json();
      setSpots(data);
      setExplanationFetchedAt({});
    } catch (error) {
      console.error('Failed to fetch surf conditions:', error);
      setError(error instanceof Error ? error.message : 'Unable to load surf conditions.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Loads an AI explanation for one spot unless the cached result is still fresh.
  const fetchExplanation = useCallback(async (spot: SurfSpot) => {
    const fetchedAt = explanationFetchedAt[spot.id];
    const isFresh = Boolean(fetchedAt) && Date.now() - fetchedAt < EXPLANATION_CACHE_MS;

    if (spot.explanation && isFresh) {
      return;
    }

    setExplainingSpotId(spot.id);

    try {
      const payload: SurfExplanationRequest = {
        spotId: spot.id,
        name: spot.name,
        waveHeight: spot.waveHeight,
        windSpeed: spot.windSpeed,
        windDirection: spot.windDirection,
        period: spot.period,
        score: spot.score,
        rating: spot.rating,
      };

      const response = await fetch('/api/surf-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Unable to load AI explanation.');
      }

      const data: { explanation: string } = await response.json();
      setSpots((currentSpots) =>
        currentSpots.map((currentSpot) =>
          currentSpot.id === spot.id
            ? { ...currentSpot, explanation: data.explanation }
            : currentSpot
        )
      );
      setExplanationFetchedAt((currentTimes) => ({
        ...currentTimes,
        [spot.id]: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to fetch AI explanation:', error);
      setError(error instanceof Error ? error.message : 'Unable to load AI explanation.');
    } finally {
      setExplainingSpotId((currentId) => (currentId === spot.id ? null : currentId));
    }
  }, [explanationFetchedAt]);

  return {
    spots,
    loading,
    error,
    fetchConditions,
    fetchExplanation,
    explainingSpotId,
  };
}
