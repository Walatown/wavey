'use client';

import { useEffect, useState } from 'react';
import { Footer } from '@/components/home/Footer';
import { Header } from '@/components/home/Header';
import { SearchPanel } from '@/components/home/SearchPanel';
import { SpotCards } from '@/components/home/SpotCards';
import { SpotDetails } from '@/components/home/SpotDetails';
import { useSurfConditions } from '@/hooks/useSurfConditions';

export default function Home() {
  const { spots, loading, error, fetchConditions, fetchExplanation, explainingSpotId } =
    useSurfConditions();
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId) ?? null;

  useEffect(() => {
    if (!selectedSpot || selectedSpot.explanation) {
      return;
    }

    void fetchExplanation(selectedSpot);
  }, [fetchExplanation, selectedSpot]);

  return (
    <div className="min-h-screen bg-[#e0f4ff]">
      <Header onShowConditions={() => setSelectedSpotId(null)} />
      <SearchPanel
        loading={loading}
        error={error}
        onFetchConditions={async () => {
          setSelectedSpotId(null);
          await fetchConditions();
        }}
      />
      {!selectedSpot && (
        <SpotCards spots={spots} onSelectSpot={(spot) => setSelectedSpotId(spot.id)} />
      )}
      {selectedSpot && (
        <SpotDetails
          spot={selectedSpot}
          onBack={() => setSelectedSpotId(null)}
          explanationLoading={explainingSpotId === selectedSpot.id}
        />
      )}
      <Footer />
    </div>
  );
}
