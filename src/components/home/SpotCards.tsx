import type { SurfSpot } from '@/types/surf';

const ratingStyles: Record<SurfSpot['rating'], string> = {
  Good: 'bg-[#dbeafe] text-[#1e40af]',
  Fair: 'bg-[#fef9c3] text-[#854d0e]',
  Poor: 'bg-[#fee2e2] text-[#991b1b]',
};

interface SpotCardsProps {
  spots: SurfSpot[];
  onSelectSpot: (spot: SurfSpot) => void;
}

export function SpotCards({ spots, onSelectSpot }: SpotCardsProps) {
  if (spots.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 mx-auto max-w-6xl rounded-t-2xl bg-white px-10 py-16">
      <h2 className="mb-8 text-center text-4xl font-bold text-[#1a2e3b]">
        Today&apos;s conditions in Bali
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {spots.map((spot) => (
          <button
            key={spot.name}
            type="button"
            onClick={() => onSelectSpot(spot)}
            className="cursor-pointer rounded-2xl border-2 border-transparent bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#90e0ef] hover:shadow-lg"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="mb-0.5 text-lg font-extrabold text-[#1a2e3b]">{spot.name}</div>
                <div className="text-sm font-semibold text-[#7a9aaa]">{spot.location}</div>
              </div>
              <div className="text-4xl font-bold leading-none text-[#0077b6]">{spot.score}</div>
            </div>

            <div
              className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${ratingStyles[spot.rating]}`}
            >
              {spot.rating}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Metric label="Wave Height" value={`${spot.waveHeight.toFixed(1)} m`} />
              <Metric label="Wind" value={`${spot.windSpeed} km/h ${spot.windDirection}`} />
              <Metric label="Period" value={`${spot.period} sec`} />
              <Metric label="Water" value={`${spot.waterTemp}°C`} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm font-semibold text-[#2d4a5a]">
      <span className="mb-0.5 block text-xs text-[#7a9aaa]">{label}</span>
      {value}
    </div>
  );
}
