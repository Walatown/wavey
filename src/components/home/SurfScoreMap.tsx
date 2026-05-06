'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Button } from '@/components/ui/button';

import type { SurfSpot } from '@/types/surf';

interface SurfScoreMapProps {
  spots: SurfSpot[];
  loading: boolean;
  error: string | null;
  selectedSpotId: number | null;
  onSelectSpot: (spot: SurfSpot) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function SurfScoreMap({
  spots,
  loading,
  error,
  selectedSpotId,
  onSelectSpot,
}: SurfScoreMapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  const selectedSpot = useMemo(
    () => spots.find((spot) => spot.id === selectedSpotId) ?? null,
    [selectedSpotId, spots]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !MAPBOX_TOKEN) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [115.1889, -8.4095],
      zoom: 9,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      setReady(true);

      const waterLayers = ['water', 'water-shadow', 'waterway'];
      waterLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'fill-color', '#050505');
        }
      });

      const backgroundLayers = ['background', 'land', 'landcover'];
      backgroundLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          const type = map.getLayer(layerId)?.type;
          if (type === 'background') {
            map.setPaintProperty(layerId, 'background-color', '#131825');
          }
          if (type === 'fill') {
            map.setPaintProperty(layerId, 'fill-color', '#1a2235');
          }
        }
      });

      ['road-primary', 'road-secondary', 'road-street'].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'line-color', '#243050');
        }
      });

      ['admin-0-boundary', 'admin-1-boundary', 'admin-0-boundary-bg'].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'line-color', '#1e2a45');
        }
      });
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !ready) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (spots.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    spots.forEach((spot) => {
      bounds.extend([spot.lon, spot.lat]);

      const isSelected = selectedSpotId === spot.id;

      const markerElement = document.createElement('button');
      const pin = document.createElement('div');
      const markerName = document.createElement('span');
      const markerScore = document.createElement('span');

      markerElement.type = 'button';
      markerElement.className = 'wavey-map-marker';
      markerElement.setAttribute('aria-label', `${spot.name} surf score ${spot.score}`);
      markerElement.onclick = () => onSelectSpot(spot);

      const scoreClass = spot.score < 5 ? 'score-red' : spot.score < 7 ? 'score-yellow' : 'score-green';
      pin.className = `wavey-map-marker-pin ${scoreClass}${isSelected ? ' selected' : ''}`;

      markerName.className = 'wavey-map-marker-name';
      markerName.textContent = spot.name;

      markerScore.className = 'wavey-map-marker-score';
      markerScore.textContent = `${spot.score}`;

      pin.append(markerName, markerScore);
      markerElement.append(pin);

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([spot.lon, spot.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (spots.length === 1) {
      map.flyTo({ center: [spots[0].lon, spots[0].lat], zoom: 10.5, essential: true });
      return;
    }

    map.fitBounds(bounds, {
      padding: { top: 80, right: 40, bottom: 60, left: 40 },
      maxZoom: 11,
      duration: 800,
    });
  }, [onSelectSpot, ready, selectedSpotId, spots]);

  return (
    <section id="spots" className="px-6 pb-0 pt-0 md:px-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur-xl">
        {/* Map header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] bg-white/[0.03] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">bali surf map</div>
              <div className="text-xs text-white/60">live spot radar</div>
            </div>
          </div>
          <div className="hidden text-right text-xs text-white/60 md:block">
            <div>{new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())}</div>
            <div>{new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</div>
          </div>
        </div>

        {/* Map */}
        <div className="relative">
          <div ref={containerRef} className="h-[420px] w-full bg-[#07090f] md:h-[480px]" />

          {!MAPBOX_TOKEN && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center">
              <div className="max-w-sm rounded-lg border border-white/10 bg-neutral-900 px-6 py-5 text-sm text-white/70 shadow-md">
                add <code className="font-medium text-white">NEXT_PUBLIC_MAPBOX_TOKEN</code> to{' '}
                <code className="font-medium text-white">.env.local</code> to show the surf score map.
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute left-4 top-4 rounded-full border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/70 shadow-sm backdrop-blur-md">
              loading spots...
            </div>
          )}

          {selectedSpot && (
            <div className="absolute bottom-4 left-4 max-w-[280px] rounded-xl border border-white/[0.1] bg-black/60 px-5 py-4 shadow-xl backdrop-blur-xl">
              <div className="font-medium text-white">{selectedSpot.name}</div>
              <div className="mt-0.5 text-xs uppercase tracking-wider text-white/60">{selectedSpot.location}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/60">
                <div>wave <span className="font-medium text-white">{selectedSpot.waveHeight.toFixed(1)} m</span></div>
                <div>wind <span className="font-medium text-white">{selectedSpot.windSpeed} km/h</span></div>
                <div>period <span className="font-medium text-white">{selectedSpot.period} sec</span></div>
                <div>rating <span className="font-medium text-white">{selectedSpot.rating}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Map footer */}
        <div className="flex min-h-14 items-center justify-between gap-4 border-t border-white/[0.08] bg-white/[0.03] px-5 py-3">
          <div className="text-sm text-white/60">
            {error
              ? <span className="text-white">{error}</span>
              : selectedSpot
              ? <><span className="font-medium text-white">{selectedSpot.name}</span> · score <span className="font-medium text-white">{selectedSpot.score}</span> / 10</>
              : 'select a spot to see details'}
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => selectedSpot && onSelectSpot(selectedSpot)}
            disabled={!selectedSpot}
          >
            Open Spot
          </Button>
        </div>
      </div>
    </section>
  );
}
