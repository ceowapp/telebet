"use client";

import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import FilterModal from '@/components/FilterModal';
import SurebetCard from '@/components/SurebetCard';
import { Button } from '@/components/ui/button';
import { Filter, Pause, RefreshCw } from 'lucide-react';

interface Bet {
  bookmaker: string;
  odds: number;
  market: string;
  stake: number;
}

interface Surebet {
  id: number;
  roi: number;
  sport: string;
  updatedAt: string;
  profit: number;
  match: string;
  league: string;
  date: string;
  bets: Bet[];
}

export default function Dashboard() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'pre-match'>('live');
  const [isPaused, setIsPaused] = useState(false);
  const [surebets, setSurebets] = useState<Surebet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/surebets', { next: { revalidate: 5 } });
        const data: { surebets: Surebet[] } = await res.json();
        setSurebets(Array.isArray(data?.surebets) ? data.surebets : []);
      } catch {
        setError('Failed to load surebets');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    if (!isPaused) {
      timer = setInterval(fetchData, 15000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPaused]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Surebet Dashboard
          </h1>
          <p className="text-lg text-gray-300">
            Real-time arbitrage betting opportunities
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'live' ? 'default' : 'outline'}
              onClick={() => setActiveTab('live')}
              className={activeTab === 'live' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
            >
              Live
            </Button>
            <Button
              variant={activeTab === 'pre-match' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pre-match')}
            >
              Pre-Match
            </Button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
            <Button
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={() => {
                setIsPaused(true);
                setTimeout(() => setIsPaused(false), 0);
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">{error}</div>
        ) : surebets.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Surebets Found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or check back soon for new opportunities
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {surebets.map((surebet) => (
              <SurebetCard key={surebet.id} surebet={surebet} />
            ))}
          </div>
        )}
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </div>
  );
}
