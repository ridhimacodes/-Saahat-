import React from 'react';
import { Compass, Search, MessageSquare, ShieldCheck, Sun, Moon, Sunset, Sparkles, User as UserIcon, BatteryLow, AlertTriangle } from 'lucide-react';
import { PageType, TimeOfDay, UserProfile } from '../types';

interface NavbarProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  timeOfDay: TimeOfDay;
  setTimeOfDay: (time: TimeOfDay) => void;
  userProfile: UserProfile;
  onOpenProfileModal: () => void;
  onTriggerSOS: () => void;
  isLowSignalGlobal: boolean;
  setIsLowSignalGlobal: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  timeOfDay,
  setTimeOfDay,
  userProfile,
  onOpenProfileModal,
  onTriggerSOS,
  isLowSignalGlobal,
  setIsLowSignalGlobal
}) => {
  return (
    <>
      {/* Low Signal Active Global Banner */}
      {isLowSignalGlobal && (
        <div className="bg-amber-400 text-slate-950 text-xs font-black py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-amber-500 shadow-sm z-50 relative">
          <BatteryLow className="w-4 h-4 text-slate-950 animate-pulse" />
          <span>Low Signal Mode: ON — High-Contrast Low-Power UI Active Across All Pages</span>
          <button
            onClick={() => setIsLowSignalGlobal(false)}
            className="ml-2 px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-bold hover:bg-slate-800 transition-colors"
          >
            Turn OFF
          </button>
        </div>
      )}

      {/* Floating Pill-Shaped Top Header */}
      <header className={`sticky top-0 z-40 transition-all ${
        isLowSignalGlobal ? 'bg-slate-950/95 border-b border-slate-800' : 'bg-white/90 backdrop-blur-md border-b border-purple-100'
      } shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Brand Logo */}
            <div 
              onClick={() => setActivePage('home')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <img
                src="/logo.png"
                alt="Saahat Logo"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform duration-300"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-extrabold text-xl sm:text-2xl tracking-tight ${
                    isLowSignalGlobal 
                      ? 'text-white' 
                      : 'bg-gradient-to-r from-[#6C2BD9] via-purple-700 to-[#FF4D8D] bg-clip-text text-transparent'
                  }`}>
                    Saahat
                  </span>
                  {!isLowSignalGlobal && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-500" />
                      Privacy First
                    </span>
                  )}
                </div>
                <p className={`text-[11px] font-medium tracking-wide hidden sm:block ${
                  isLowSignalGlobal ? 'text-amber-400 font-mono' : 'text-slate-500'
                }`}>
                  Har Safar Mein Raahat
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => setActivePage('home')}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${
                  activePage === 'home'
                    ? (isLowSignalGlobal ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-purple-100 text-brand-purple')
                    : (isLowSignalGlobal ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-brand-purple hover:bg-purple-50/70')
                }`}
              >
                Home
              </button>

              <button
                onClick={() => setActivePage('search')}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${
                  activePage === 'search' || activePage === 'results'
                    ? (isLowSignalGlobal ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-purple-100 text-brand-purple')
                    : (isLowSignalGlobal ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-brand-purple hover:bg-purple-50/70')
                }`}
              >
                Find Route
              </button>

              <button
                onClick={() => setActivePage('share')}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${
                  activePage === 'share'
                    ? (isLowSignalGlobal ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-purple-100 text-brand-purple')
                    : (isLowSignalGlobal ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-brand-purple hover:bg-purple-50/70')
                }`}
              >
                Share ETA
              </button>

              <button
                onClick={() => setActivePage('community')}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${
                  activePage === 'community'
                    ? (isLowSignalGlobal ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-purple-100 text-brand-purple')
                    : (isLowSignalGlobal ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-brand-purple hover:bg-purple-50/70')
                }`}
              >
                Notes
              </button>

              <button
                onClick={() => setActivePage('about')}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${
                  activePage === 'about'
                    ? (isLowSignalGlobal ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-purple-100 text-brand-purple')
                    : (isLowSignalGlobal ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-brand-purple hover:bg-purple-50/70')
                }`}
              >
                About
              </button>

              <button
                onClick={() => setIsLowSignalGlobal(!isLowSignalGlobal)}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 flex items-center gap-1.5 ${
                  isLowSignalGlobal
                    ? 'bg-amber-400 text-slate-950 font-bold border border-amber-500 shadow-sm'
                    : 'text-slate-700 hover:text-purple-700 font-bold bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80'
                }`}
                title="Toggle Global Low Signal & Offline Battery Saver Mode"
              >
                <BatteryLow className={`w-4 h-4 ${isLowSignalGlobal ? 'text-slate-950 animate-pulse' : 'text-amber-600'}`} />
                <span>Low Power Mode</span>
                <span className={`w-2 h-2 rounded-full ${isLowSignalGlobal ? 'bg-emerald-700 animate-ping' : 'bg-slate-400'}`} />
              </button>
            </nav>

            {/* Right Controls: Profile Avatar */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Profile Avatar Button */}
              <button
                onClick={onOpenProfileModal}
                className="relative p-0.5 rounded-full ring-2 ring-purple-300 hover:ring-brand-pink transition-all hover:scale-110"
                title="Profile & Settings"
              >
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg border-t shadow-lg px-2 py-2 ${
        isLowSignalGlobal ? 'bg-slate-950/95 border-slate-800 text-slate-100' : 'bg-white/95 border-purple-100'
      }`}>
        <div className="grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => setActivePage('home')}
            className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all ${
              activePage === 'home' 
                ? (isLowSignalGlobal ? 'text-amber-400 font-bold' : 'text-brand-purple font-bold') 
                : (isLowSignalGlobal ? 'text-slate-400' : 'text-slate-400')
            }`}
          >
            <Compass className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setActivePage('search')}
            className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all ${
              activePage === 'search' || activePage === 'results' 
                ? (isLowSignalGlobal ? 'text-amber-400 font-bold' : 'text-brand-purple font-bold') 
                : (isLowSignalGlobal ? 'text-slate-400' : 'text-slate-400')
            }`}
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Search</span>
          </button>

          <button
            onClick={() => setIsLowSignalGlobal(!isLowSignalGlobal)}
            className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all ${
              isLowSignalGlobal ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BatteryLow className="w-5 h-5 mb-0.5 text-amber-400 animate-pulse" />
            <span className="text-[10px]">Low Power Mode</span>
          </button>

          <button
            onClick={() => setActivePage('share')}
            className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all ${
              activePage === 'share' 
                ? (isLowSignalGlobal ? 'text-amber-400 font-bold' : 'text-brand-purple font-bold') 
                : (isLowSignalGlobal ? 'text-slate-400' : 'text-slate-400')
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Share ETA</span>
          </button>

          <button
            onClick={() => setActivePage('community')}
            className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all ${
              activePage === 'community' 
                ? (isLowSignalGlobal ? 'text-amber-400 font-bold' : 'text-brand-purple font-bold') 
                : (isLowSignalGlobal ? 'text-slate-400' : 'text-slate-400')
            }`}
          >
            <MessageSquare className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Notes</span>
          </button>
        </div>
      </div>
    </>
  );
};
