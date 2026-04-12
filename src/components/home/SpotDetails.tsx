import type { SurfSpot } from '@/types/surf';

interface SpotDetailsProps {
  spot: SurfSpot;
  onBack: () => void;
  explanationLoading: boolean;
}

export function SpotDetails({ spot, onBack, explanationLoading }: SpotDetailsProps) {
  return (
    <section className="mx-auto max-w-6xl bg-[#e0f4ff] px-10 py-16">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 rounded-full bg-[#7a9aaa] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2d4a5a]"
      >
        ← Back to spots
      </button>

      <h2 className="mb-8 text-center text-4xl font-bold text-[#1a2e3b]">Detailed conditions</h2>

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-start justify-between border-b-2 border-[#f0f4f8] pb-5">
          <div>
            <div className="mb-1 text-3xl font-bold text-[#1a2e3b]">🏖 {spot.name}</div>
            <div className="text-sm font-semibold text-[#7a9aaa]">{spot.location} · Updated now</div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold leading-none text-[#0077b6]">{spot.score}</div>
            <div className="text-xs font-bold text-[#7a9aaa]">Surf Score</div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Wave Height" value={`${spot.waveHeight.toFixed(1)} m`} />
          <StatCard label="Wind" value={`${spot.windSpeed} km/h`} />
          <StatCard label="Period" value={`${spot.period} sec`} />
          <StatCard label="Water Temp" value={`${spot.waterTemp}°C`} />
        </div>

        <div className="mb-5 rounded-xl border-l-4 border-[#0077b6] bg-gradient-to-br from-[#e0f4ff] to-[#d1fdf6] p-5">
          <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#0077b6]">
            AI Analysis
          </div>
          <div className="text-base font-semibold leading-relaxed text-[#2d4a5a]">
            {explanationLoading
              ? 'Loading AI explanation...'
              : spot.explanation || 'No explanation available for this spot right now.'}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#e0f4ff] p-4 text-center">
      <span className="mb-1 block text-2xl font-bold text-[#1a2e3b]">{value}</span>
      <span className="block text-xs font-bold uppercase text-[#7a9aaa]">{label}</span>
    </div>
  );
}
