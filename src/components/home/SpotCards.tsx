import type { SurfSpot } from '@/types/surf';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ratingVariants: Record<SurfSpot['rating'], 'good' | 'fair' | 'poor'> = {
  Good: 'good',
  Fair: 'fair',
  Poor: 'poor',
};

interface SpotCardsProps {
  spots: SurfSpot[];
  onSelectSpot: (spot: SurfSpot) => void;
}

function formatWaterTemp(waterTemp: SurfSpot['waterTemp']) {
  return waterTemp === null ? 'N/A' : `${waterTemp}°C`;
}

export function SpotCards({ spots, onSelectSpot }: SpotCardsProps) {
  if (spots.length === 0) return null;

  return (
    <section id="forecast" className="bg-black px-6 py-14 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-medium text-white md:text-3xl">
            today&apos;s conditions in bali
          </h2>
          <p className="mt-2 text-sm text-white/60">tap a spot for a full ai-powered breakdown</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spots.map((spot) => (
            <button
              key={spot.name}
              type="button"
              onClick={() => onSelectSpot(spot)}
              className="group text-left"
            >
              <Card className={cn(
                'h-full cursor-pointer transition-all duration-200',
                'hover:-translate-y-1 hover:border-white/30 hover:shadow-md'
              )}>
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white transition-colors group-hover:text-white/80">
                        {spot.name}
                      </div>
                      <div className="mt-0.5 text-xs uppercase tracking-wider text-white/50">
                        {spot.location}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-center">
                      <div className="text-2xl font-medium leading-none text-white">{spot.score}</div>
                      <div className="mt-0.5 text-[9px] font-medium uppercase tracking-widest text-white/50">/ 10</div>
                    </div>
                  </div>

                  <Badge variant={ratingVariants[spot.rating]} className="mb-4">
                    {spot.rating} conditions
                  </Badge>

                  <div className="grid grid-cols-2 gap-2">
                    <Metric label="Wave Height" value={`${spot.waveHeight.toFixed(1)} m`} />
                    <Metric label="Wind" value={`${spot.windSpeed} km/h ${spot.windDirection}`} />
                    <Metric label="Period" value={`${spot.period} sec`} />
                    <Metric label="Water" value={formatWaterTemp(spot.waterTemp)} />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black px-3 py-2.5">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/50">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
