"use client";

import { Button } from '@/components/ui/button';
import { Clock, DollarSign, X } from 'lucide-react';

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

interface SurebetCardProps {
  surebet: Surebet;
}

export default function SurebetCard({ surebet }: SurebetCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
              {surebet.roi}%
            </div>
            <span className="text-gray-700 font-medium">{surebet.sport}</span>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Match Info */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Updated: {surebet.updatedAt}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
            <DollarSign className="w-4 h-4" />
            <span>Profit: ${surebet.profit}</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {surebet.match}
        </h3>
        <p className="text-sm text-gray-600 mb-1">{surebet.league}</p>
        <p className="text-sm text-gray-500">{surebet.date}</p>
      </div>

      {/* Bets */}
      <div className="p-4">
        <div className={`grid gap-4 ${surebet.bets.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {surebet.bets.map((bet, index) => (
            <div key={index} className="relative">
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">{bet.bookmaker}</span>
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded font-bold text-lg">
                    {bet.odds}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{bet.market}</p>
                <p className="text-sm font-semibold text-blue-600">
                  Bet: ${bet.stake}
                </p>
                <Button className="w-full mt-3 bg-slate-900 hover:bg-slate-800">
                  Place Bet →
                </Button>
              </div>
              {index < surebet.bets.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-6 transform -translate-y-1/2 items-center justify-center w-12 h-12 bg-white rounded-full border-2 border-gray-300 font-bold text-gray-600">
                  VS
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}