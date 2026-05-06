'use client';

import { useEffect, useState } from 'react';
import { Footer } from '@/components/home/Footer';
import { SpotDetails } from '@/components/home/SpotDetails';
import { SurfScoreMap } from '@/components/home/SurfScoreMap';
import { WaveyHero } from '@/components/home/WaveyHero';
import { useSurfConditions } from '@/hooks/useSurfConditions';

export default function Home() {
  const { spots, loading, error, fetchConditions, fetchExplanation, explainingSpotId } =
    useSurfConditions();
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId) ?? null;

  useEffect(() => {
    void fetchConditions();
  }, [fetchConditions]);

  useEffect(() => {
    if (!selectedSpot || selectedSpot.explanation) {
      return;
    }

    void fetchExplanation(selectedSpot);
  }, [fetchExplanation, selectedSpot]);

  return (
    <div className="relative min-h-screen bg-[#07090f] text-white">
      {/* Fixed ambient glow orbs — give the glass panels a coloured backdrop to blur */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-[5%] top-[55%] h-[700px] w-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,156,202,0.09) 0%, transparent 70%)' }}
        />
        <div
          className="absolute right-[8%] top-[75%] h-[550px] w-[550px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,97,255,0.07) 0%, transparent 70%)' }}
        />
        <div
          className="absolute left-[40%] top-[110%] h-[500px] w-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,156,202,0.06) 0%, transparent 70%)' }}
        />
      </div>
      <WaveyHero />
      <SurfScoreMap
        spots={spots}
        loading={loading}
        error={error}
        selectedSpotId={selectedSpotId}
        onSelectSpot={(spot) => setSelectedSpotId(spot.id)}
      />
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
