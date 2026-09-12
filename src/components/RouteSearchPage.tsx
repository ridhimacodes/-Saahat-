import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, LocateFixed, Search, X, MapPin, Sparkles, Clock } from 'lucide-react';
import { TimeOfDay } from '../types';
import { searchLocations, GeocodingResult } from '../services/geocoding';

interface RouteSearchPageProps {
  onSearchComplete: (origin: string, destination: string) => void;
  timeOfDay: TimeOfDay;
  setTimeOfDay: (time: TimeOfDay) => void;
  isLowSignalGlobal?: boolean;
}

const POPULAR_SUGGESTIONS: GeocodingResult[] = [
  { placeId: 'p1', displayName: "Indira Gandhi Delhi Technical University for Women", title: "Indira Gandhi Delhi Technical University for Women", address: "New Church Rd, Kashmere Gate, New Delhi, Delhi 110006", lat: 28.6653, lng: 77.2324 },
  { placeId: 'p2', displayName: "India Gate, Rajpath, New Delhi", title: "India Gate", address: "Rajpath, India Gate, New Delhi, Delhi 110001", lat: 28.6129, lng: 77.2295 },
  { placeId: 'p3', displayName: "Connaught Place & Rajiv Chowk Metro", title: "Connaught Place & Rajiv Chowk Metro", address: "Connaught Place, Inner Circle, New Delhi, Delhi 110001", lat: 28.6315, lng: 77.2167 },
  { placeId: 'p4', displayName: "Indira Gandhi International Airport (DEL) T3", title: "Indira Gandhi International Airport (DEL) T3", address: "Palam, New Delhi, Delhi 110037", lat: 28.5562, lng: 77.1000 },
  { placeId: 'p5', displayName: "Chhatrapati Shivaji Maharaj Terminus (CST)", title: "Chhatrapati Shivaji Maharaj Terminus (CST)", address: "Fort, Mumbai, Maharashtra 400001", lat: 18.9401, lng: 72.8353 },
  { placeId: 'p6', displayName: "Bengaluru City Railway Station & Metro", title: "Bengaluru City Railway Station & Metro", address: "Majestic, Bengaluru, Karnataka 560023", lat: 12.9784, lng: 77.5696 }
];

export const RouteSearchPage: React.FC<RouteSearchPageProps> = ({
  onSearchComplete,
  timeOfDay,
  setTimeOfDay,
  isLowSignalGlobal = false
}) => {
  // Started empty by default as requested
  const [originTitle, setOriginTitle] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  
  const [destTitle, setDestTitle] = useState("");
  const [destAddress, setDestAddress] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // Autocomplete suggestions
  const [originSuggestions, setOriginSuggestions] = useState<GeocodingResult[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodingResult[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const handleSwap = () => {
    const tempT = originTitle;
    const tempA = originAddress;
    setOriginTitle(destTitle);
    setOriginAddress(destAddress);
    setDestTitle(tempT);
    setDestAddress(tempA);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (showOriginDropdown) {
        if (originTitle.trim().length > 1) {
          const results = await searchLocations(originTitle);
          setOriginSuggestions(results);
        } else {
          setOriginSuggestions(POPULAR_SUGGESTIONS);
        }
      } else {
        setOriginSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [originTitle, showOriginDropdown]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (showDestDropdown) {
        if (destTitle.trim().length > 1) {
          const results = await searchLocations(destTitle);
          setDestSuggestions(results);
        } else {
          setDestSuggestions(POPULAR_SUGGESTIONS);
        }
      } else {
        setDestSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [destTitle, showDestDropdown]);

  const handleUseGpsLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocatingUser(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOriginTitle("Current GPS Location");
          setOriginAddress(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
          setIsLocatingUser(false);
        },
        (err) => {
          console.warn('GPS location fetch error:', err);
          setOriginTitle("Current Location");
          setOriginAddress("Connaught Place, New Delhi");
          setIsLocatingUser(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOrigin = originTitle.trim() || "Central Metro Station, New Delhi";
    const finalDest = destTitle.trim() || "India Gate, New Delhi";

    setIsSearching(true);
    const fullOrigin = originAddress ? `${finalOrigin}, ${originAddress}` : finalOrigin;
    const fullDest = destAddress ? `${finalDest}, ${destAddress}` : finalDest;

    setTimeout(() => {
      setIsSearching(false);
      onSearchComplete(fullOrigin, fullDest);
    }, 1000);
  };

  return (
    <div className={`min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans ${isLowSignalGlobal ? 'bg-slate-950 text-slate-100' : 'bg-[#F9F4F0]'}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Main Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 sm:p-10 border shadow-xl relative space-y-6 ${
            isLowSignalGlobal
              ? 'bg-slate-900 border-2 border-slate-700 text-slate-100 shadow-2xl'
              : 'bg-[#FAF5F1] border-[#E8D8D3] shadow-pink-950/5'
          }`}
        >
          {/* Card Title & Subtitle Header */}
          <div className="space-y-1">
            <h1 className={`font-serif font-bold text-3xl sm:text-4xl tracking-tight ${isLowSignalGlobal ? 'text-white' : 'text-[#3E1627]'}`}>
              Plan my journey
            </h1>
            <p className={`text-xs sm:text-sm font-medium ${isLowSignalGlobal ? 'text-slate-300' : 'text-[#6E4B59]'}`}>
              Search any place in India — a college, metro station, landmark, hospital or address.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* FROM Input Box */}
            <div className="relative z-30 space-y-1.5">
              <label className="block text-xs font-bold tracking-widest text-[#7E5767] uppercase ml-1">
                FROM
              </label>
              <div className="bg-white rounded-3xl border border-[#E0D0C9] p-3.5 sm:p-4 flex items-start justify-between gap-3 shadow-xs hover:border-[#A3526B] transition-colors focus-within:ring-2 focus-within:ring-[#A3526B]/20">
                <div className="w-3 h-3 rounded-full bg-[#C2414C] mt-2 flex-shrink-0"></div>
                <div className="flex-1 space-y-0.5">
                  <input
                    type="text"
                    value={originTitle}
                    onChange={(e) => {
                      setOriginTitle(e.target.value);
                      setShowOriginDropdown(true);
                    }}
                    onFocus={() => setShowOriginDropdown(true)}
                    placeholder="Search origin college, landmark or metro station..."
                    required
                    className="w-full font-bold text-base text-[#3E1627] bg-transparent outline-none border-none p-0"
                  />
                  <input
                    type="text"
                    value={originAddress}
                    onChange={(e) => setOriginAddress(e.target.value)}
                    placeholder="Full address details..."
                    className="w-full text-xs text-[#7E5767] bg-transparent outline-none border-none p-0 truncate font-medium"
                  />
                </div>
                {originTitle && (
                  <button
                    type="button"
                    onClick={() => { setOriginTitle(''); setOriginAddress(''); }}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* FROM Autocomplete Dropdown */}
              {showOriginDropdown && originSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#E0D0C9] p-2 z-50 max-h-60 overflow-y-auto space-y-1">
                  {originSuggestions.map((item) => (
                    <button
                      key={item.placeId}
                      type="button"
                      onClick={() => {
                        setOriginTitle(item.title);
                        setOriginAddress(item.address);
                        setShowOriginDropdown(false);
                      }}
                      className="w-full text-left p-3 rounded-xl hover:bg-[#F9F4F0] text-xs space-y-0.5 border-b border-slate-50 last:border-0"
                    >
                      <div className="font-bold text-[#3E1627] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C2414C]" />
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[#7E5767] text-[11px] truncate pl-5">{item.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TO Input Box */}
            <div className="relative z-20 space-y-1.5">
              <label className="block text-xs font-bold tracking-widest text-[#7E5767] uppercase ml-1">
                TO
              </label>
              <div className="bg-white rounded-3xl border border-[#E0D0C9] p-3.5 sm:p-4 flex items-start justify-between gap-3 shadow-xs hover:border-[#A3526B] transition-colors focus-within:ring-2 focus-within:ring-[#A3526B]/20">
                <div className="w-3 h-3 rounded-full bg-[#1E6B45] mt-2 flex-shrink-0"></div>
                <div className="flex-1 space-y-0.5">
                  <input
                    type="text"
                    value={destTitle}
                    onChange={(e) => {
                      setDestTitle(e.target.value);
                      setShowDestDropdown(true);
                    }}
                    onFocus={() => setShowDestDropdown(true)}
                    placeholder="Search destination..."
                    required
                    className="w-full font-bold text-base text-[#3E1627] bg-transparent outline-none border-none p-0"
                  />
                  <input
                    type="text"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    placeholder="Full address details..."
                    className="w-full text-xs text-[#7E5767] bg-transparent outline-none border-none p-0 truncate font-medium"
                  />
                </div>
                {destTitle && (
                  <button
                    type="button"
                    onClick={() => { setDestTitle(''); setDestAddress(''); }}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* TO Autocomplete Dropdown */}
              {showDestDropdown && destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#E0D0C9] p-2 z-50 max-h-60 overflow-y-auto space-y-1">
                  {destSuggestions.map((item) => (
                    <button
                      key={item.placeId}
                      type="button"
                      onClick={() => {
                        setDestTitle(item.title);
                        setDestAddress(item.address);
                        setShowDestDropdown(false);
                      }}
                      className="w-full text-left p-3 rounded-xl hover:bg-[#F9F4F0] text-xs space-y-0.5 border-b border-slate-50 last:border-0"
                    >
                      <div className="font-bold text-[#3E1627] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#1E6B45]" />
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[#7E5767] text-[11px] truncate pl-5">{item.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons Row Matching Reference Screenshot 1 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseGpsLocation}
                  className="px-4 py-2.5 rounded-full bg-[#F2E6E2] hover:bg-[#E8D8D3] text-[#5E253B] font-bold text-xs flex items-center gap-1.5 border border-[#E0D0C9] transition-all shadow-2xs"
                >
                  <LocateFixed className={`w-3.5 h-3.5 text-[#A3526B] ${isLocatingUser ? 'animate-spin' : ''}`} />
                  <span>Use my location</span>
                </button>

                <button
                  type="button"
                  onClick={handleSwap}
                  className="px-4 py-2.5 rounded-full bg-[#F2E6E2] hover:bg-[#E8D8D3] text-[#5E253B] font-bold text-xs flex items-center gap-1.5 border border-[#E0D0C9] transition-all shadow-2xs"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#A3526B]" />
                  <span>Swap locations</span>
                </button>
              </div>

              {/* Primary Search Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="px-7 py-3 rounded-full bg-[#A3526B] hover:bg-[#8F445B] text-white font-bold text-sm flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-80"
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Evaluating Route Signals...</span>
                  </div>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search journey</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>

      </div>
    </div>
  );
};
