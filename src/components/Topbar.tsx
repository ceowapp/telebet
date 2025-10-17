// components/dashboard/Header.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="bg-black text-white border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold">
            TeleBet
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/surebet" className="hover:text-yellow-500 transition">
              Surebet
            </Link>
            <Link href="/valuebet" className="hover:text-yellow-500 transition">
              Valuebet
            </Link>
            <Link href="/bet-checker" className="hover:text-yellow-500 transition">
              Bet Checker
            </Link>
            <Link href="/profile" className="hover:text-yellow-500 transition">
              Profile
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                1
              </span>
            </button>
            <Button variant="destructive">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}