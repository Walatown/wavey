'use client';

import { useCallback, useState } from 'react';

import { toSurfExplanationRequest } from '@/lib/waveHeight';
import type { SurfExplanationRequest, SurfSpot } from '@/types/surf';

export function useSurfConditions() {
  const [spots, setSpots] = useState<SurfSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explainingSpotId, setExplainingSpotId] = useState<number | null>(null);

  const fetchConditions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/surf-conditions');

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Unable to load surf conditions.');
      }

      const data: SurfSpot[] = await response.json();
      setSpots(data);
    } catch (error) {
      console.error('Failed to fetch surf conditions:', error);
      setError(error instanceof Error ? error.message : 'Unable to load surf conditions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExplanation = useCallback(async (spot: SurfSpot) => {
    if (spot.explanation) {
      return;
    }

    setExplainingSpotId(spot.id);

    try {
      const payload: SurfExplanationRequest = toSurfExplanationRequest(spot);

      const response = await fetch('/api/surf-explanation', {
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
    } catch (error) {
      console.error('Failed to fetch AI explanation:', error);
      setError(error instanceof Error ? error.message : 'Unable to load AI explanation.');
    } finally {
      setExplainingSpotId((currentId) => (currentId === spot.id ? null : currentId));
    }
  }, []);

  return {
    spots,
    loading,
    error,
    fetchConditions,
    fetchExplanation,
    explainingSpotId,
  };
}
