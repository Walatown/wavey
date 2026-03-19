'use client';

import { useState } from 'react';

// Types for your API response
interface SpotData {
  name: string;
  location: string;
  waveHeight: number;
  period: number;
  windSpeed: number;
  windDirection: string;
  waterTemp: number;
  score: number;
  rating: 'Epic' | 'Good' | 'Fair' | 'Poor';
  bestTime: string;
  explanation: string;
}

export default function Home() {
  const [spots, setSpots] = useState<SpotData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<SpotData | null>(null);


  const fetchConditions = async () => {
    setLoading(true);
    try {
// page.tsx — browser talks to backend
const response = await fetch('/api/surf-conditions'); //  Next.js server

      if (!response.ok) {
        const text = await response.text();
        console.error('API error:', text);
        alert(`API error: ${text}`); // temporarily show it on screen
        return;
      }
  
      const data = await response.json();
      setSpots(data);
    } catch (error) {
      console.error('Error:', error);
      alert(`Fetch failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Epic': return 'bg-[#d1fae5] text-[#065f46]';
      case 'Good': return 'bg-[#dbeafe] text-[#1e40af]';
      case 'Fair': return 'bg-[#fef9c3] text-[#854d0e]';
      case 'Poor': return 'bg-[#fee2e2] text-[#991b1b]';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const showDetail = (spot: SpotData) => {
    setSelectedSpot(spot);
  };

  const showConditions = () => {
    setSelectedSpot(null);
  };

  return (
    <div className="min-h-screen bg-[#e0f4ff]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-10 py-4 bg-white border-b border-[#e0f4ff]">
        <div className="text-2xl font-bold text-[#0077b6]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Wavey
        </div>
        <ul className="flex gap-7 list-none">
          <li>
            <a href="#" onClick={showConditions} className="text-[#2d4a5a] font-semibold text-sm hover:text-[#0077b6] transition-colors">
              Conditions
            </a>
          </li>
          <li>
            <a href="#" className="text-[#2d4a5a] font-semibold text-sm hover:text-[#0077b6] transition-colors">
              Forecast
            </a>
          </li>
          <li>
            <a href="#" className="text-[#2d4a5a] font-semibold text-sm hover:text-[#0077b6] transition-colors">
              About
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="text-center px-10 py-16 bg-gradient-to-b from-[#f0faff] to-[#e0f4ff]">
        <h1 className="text-5xl font-bold text-[#1a2e3b] mb-4 leading-tight">
          Where should you surf today?
        </h1>
        <p className="text-lg text-[#7a9aaa] font-semibold max-w-xl mx-auto mb-8">
          Real-time surf conditions in Bali with AI-powered explanations. No jargon, just clear guidance.
        </p>
      </section>

      {/* Search Section */}
      <div className="px-10 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl p-6 shadow-lg max-w-4xl mx-auto">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase text-[#7a9aaa] mb-2">
                 Bali Surf Spots
              </label>
              <div className="text-base font-semibold text-[#2d4a5a] bg-[#e0f4ff] px-3 py-3 rounded-xl border-2 border-[#e8f4f8]">
                Bali
              </div>
            </div>
            <button
              onClick={fetchConditions}
              disabled={loading}
              className="bg-[#0077b6] text-white font-bold text-base px-7 py-3 rounded-full hover:bg-[#00b4d8] transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Check Conditions'}
            </button>
          </div>
        </div>
      </div>

      {/* Conditions Section */}
      {!selectedSpot && spots.length > 0 && (
        <section className="max-w-6xl mx-auto px-10 py-16 bg-white mt-8 rounded-t-2xl">
          <h2 className="text-4xl font-bold text-[#1a2e3b] mb-8 text-center">
            Today&apos;s conditions in Bali
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {spots.map((spot, index) => (
              <div
                key={index}
                onClick={() => showDetail(spot)}
                className="bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-[#90e0ef] hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-extrabold text-lg text-[#1a2e3b] mb-0.5">
                      {spot.name}
                    </div>
                    <div className="text-sm text-[#7a9aaa] font-semibold">
                      {spot.location}
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-[#0077b6] leading-none">
                    {spot.score}
                  </div>
                </div>

                <div className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide mb-3 ${getRatingColor(spot.rating)}`}>
                  {spot.rating}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="text-sm text-[#2d4a5a] font-semibold">
                    <span className="block text-xs text-[#7a9aaa] mb-0.5">Wave Height</span>
                    {spot.waveHeight.toFixed(1)} m
                  </div>
                  <div className="text-sm text-[#2d4a5a] font-semibold">
                    <span className="block text-xs text-[#7a9aaa] mb-0.5">Wind</span>
                    {spot.windSpeed} km/h {spot.windDirection}
                  </div>
                  <div className="text-sm text-[#2d4a5a] font-semibold">
                    <span className="block text-xs text-[#7a9aaa] mb-0.5">Period</span>
                    {spot.period} sec
                  </div>
                  <div className="text-sm text-[#2d4a5a] font-semibold">
                    <span className="block text-xs text-[#7a9aaa] mb-0.5">Water</span>
                    {spot.waterTemp}°C
                  </div>
                </div>

                {/* <div className="mt-3 pt-3 border-t border-[#e8f4f8] text-sm text-[#7a9aaa] font-semibold">
                  🌊 Best: {spot.bestTime}
                </div> */}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Detail Section */}
      {selectedSpot && (
        <section className="max-w-6xl mx-auto px-10 py-16 bg-[#e0f4ff]">
          <button
            onClick={showConditions}
            className="bg-[#7a9aaa] text-white font-bold text-sm px-6 py-2.5 rounded-full mb-5 hover:bg-[#2d4a5a] transition-colors"
          >
            ← Back to spots
          </button>

          <h2 className="text-4xl font-bold text-[#1a2e3b] mb-8 text-center">
            Detailed conditions
          </h2>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-[#f0f4f8]">
              <div>
                <div className="text-3xl font-bold text-[#1a2e3b] mb-1">
                  🏖 {selectedSpot.name}
                </div>
                <div className="text-sm text-[#7a9aaa] font-semibold">
                  {selectedSpot.location} · Updated now
                </div>
              </div>
              <div className="text-right">
                <div className="text-6xl font-bold text-[#0077b6] leading-none">
                  {selectedSpot.score}
                </div>
                <div className="text-xs font-bold text-[#7a9aaa]">
                  Surf Score
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#e0f4ff] rounded-xl p-4 text-center">
                <span className="block text-2xl font-bold text-[#1a2e3b] mb-1">
                  {selectedSpot.waveHeight.toFixed(1)} m
                </span>
                <span className="block text-xs text-[#7a9aaa] font-bold uppercase">
                  Wave Height
                </span>
              </div>
              <div className="bg-[#e0f4ff] rounded-xl p-4 text-center">
                <span className="block text-2xl font-bold text-[#1a2e3b] mb-1">
                  {selectedSpot.windSpeed} km/h
                </span>
                <span className="block text-xs text-[#7a9aaa] font-bold uppercase">
                  Wind
                </span>
              </div>
              <div className="bg-[#e0f4ff] rounded-xl p-4 text-center">
                <span className="block text-2xl font-bold text-[#1a2e3b] mb-1">
                  {selectedSpot.period} sec
                </span>
                <span className="block text-xs text-[#7a9aaa] font-bold uppercase">
                  Period
                </span>
              </div>
              <div className="bg-[#e0f4ff] rounded-xl p-4 text-center">
                <span className="block text-2xl font-bold text-[#1a2e3b] mb-1">
                  {selectedSpot.waterTemp}°C
                </span>
                <span className="block text-xs text-[#7a9aaa] font-bold uppercase">
                  Water Temp
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#e0f4ff] to-[#d1fdf6] rounded-xl p-5 mb-5 border-l-4 border-[#0077b6]">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#0077b6] mb-2">
                 AI Analysis
              </div>
              <div className="text-base font-semibold text-[#2d4a5a] leading-relaxed">
                {selectedSpot.explanation}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#1a2e3b] text-white/60 px-10 py-8 text-center">
        <div className="text-xl font-bold text-white mb-3">
          Wavey 
        </div>
        <div className="text-sm leading-relaxed">
          First version of the Surf conditions with AI-powered explanations<br />
          Made for Dutch surfers
        </div>
      </footer>
    </div>
  );
}