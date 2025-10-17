// components/dashboard/FilterModal.tsx
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const [sortBy, setSortBy] = useState('highest-roi');
  const [minROI, setMinROI] = useState('0');
  const [maxROI, setMaxROI] = useState('100');
  const [minOdds, setMinOdds] = useState('1.0');
  const [maxOdds, setMaxOdds] = useState('10');

  const [selectedSports, setSelectedSports] = useState<string[]>([
    'dota-2',
    'football',
    'handball',
    'hockey',
    'league-of-legends',
    'table-tennis',
    'tennis',
    'valorant',
    'volleyball',
  ]);

  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([
    '188bet',
    '1xbet',
    'bc-game',
    'bti',
    'cloudbet',
    'fb-sports',
    'im-sports',
    'raybet',
    'roobet',
    'saba',
    'sbobet',
    'stake',
  ]);

  const sports = [
    { id: 'american-football', label: 'American football' },
    { id: 'badminton', label: 'Badminton' },
    { id: 'baseball', label: 'Baseball' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'counter-strike', label: 'Counter-Strike' },
    { id: 'darts', label: 'Darts' },
    { id: 'dota-2', label: 'Dota 2' },
    { id: 'football', label: 'Football' },
    { id: 'handball', label: 'Handball' },
    { id: 'hockey', label: 'Hockey' },
    { id: 'league-of-legends', label: 'League of Legends' },
    { id: 'table-tennis', label: 'Table Tennis' },
    { id: 'tennis', label: 'Tennis' },
    { id: 'valorant', label: 'Valorant' },
    { id: 'volleyball', label: 'Volleyball' },
  ];

  const bookmakers = [
    { id: '188bet', label: '188bet' },
    { id: '1xbet', label: '1xbet' },
    { id: 'bc-game', label: 'BC.Game' },
    { id: 'bti', label: 'BTi' },
    { id: 'cloudbet', label: 'Cloudbet' },
    { id: 'fb-sports', label: 'FB Sports' },
    { id: 'im-sports', label: 'IM Sports' },
    { id: 'raybet', label: 'Raybet' },
    { id: 'roobet', label: 'Roobet' },
    { id: 'saba', label: 'SABA' },
    { id: 'sbobet', label: 'SBOBET' },
    { id: 'stake', label: 'Stake' },
  ];

  const toggleSport = (sportId: string) => {
    setSelectedSports((prev) =>
      prev.includes(sportId)
        ? prev.filter((id) => id !== sportId)
        : [...prev, sportId]
    );
  };

  const toggleBookmaker = (bookmakerId: string) => {
    setSelectedBookmakers((prev) =>
      prev.includes(bookmakerId)
        ? prev.filter((id) => id !== bookmakerId)
        : [...prev, bookmakerId]
    );
  };

  const handleClearAll = () => {
    setSelectedSports([]);
    setSelectedBookmakers([]);
    setMinROI('0');
    setMaxROI('100');
    setMinOdds('1.0');
    setMaxOdds('10');
  };

  const handleApplyFilters = () => {
    // Apply filters logic here
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Filter Options</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sort By */}
          <div>
            <Label htmlFor="sort-by" className="text-base font-semibold mb-2 block">
              Sort By:
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="highest-roi">Highest ROI</SelectItem>
                <SelectItem value="lowest-roi">Lowest ROI</SelectItem>
                <SelectItem value="highest-profit">Highest Profit</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ROI & Odds Range */}
          <div>
            <h3 className="text-lg font-semibold mb-4">ROI & Odds Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-roi" className="mb-2 block">
                  Min ROI (%):
                </Label>
                <Input
                  id="min-roi"
                  type="number"
                  value={minROI}
                  onChange={(e) => setMinROI(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="max-roi" className="mb-2 block">
                  Max ROI (%):
                </Label>
                <Input
                  id="max-roi"
                  type="number"
                  value={maxROI}
                  onChange={(e) => setMaxROI(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="min-odds" className="mb-2 block">
                  Min Odds:
                </Label>
                <Input
                  id="min-odds"
                  type="number"
                  step="0.1"
                  value={minOdds}
                  onChange={(e) => setMinOdds(e.target.value)}
                  placeholder="1.0"
                />
              </div>
              <div>
                <Label htmlFor="max-odds" className="mb-2 block">
                  Max Odds:
                </Label>
                <Input
                  id="max-odds"
                  type="number"
                  step="0.1"
                  value={maxOdds}
                  onChange={(e) => setMaxOdds(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Sports */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sports</h3>
            <div className="grid grid-cols-3 gap-3">
              {sports.map((sport) => (
                <div
                  key={sport.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition ${
                    selectedSports.includes(sport.id)
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleSport(sport.id)}
                >
                  <Checkbox
                    id={sport.id}
                    checked={selectedSports.includes(sport.id)}
                    onCheckedChange={() => toggleSport(sport.id)}
                    className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                  />
                  <label
                    htmlFor={sport.id}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {sport.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Bookmakers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bookmakers</h3>
            <div className="grid grid-cols-3 gap-3">
              {bookmakers.map((bookmaker) => (
                <div
                  key={bookmaker.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition ${
                    selectedBookmakers.includes(bookmaker.id)
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleBookmaker(bookmaker.id)}
                >
                  <Checkbox
                    id={bookmaker.id}
                    checked={selectedBookmakers.includes(bookmaker.id)}
                    onCheckedChange={() => toggleBookmaker(bookmaker.id)}
                    className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                  />
                  <label
                    htmlFor={bookmaker.id}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {bookmaker.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}