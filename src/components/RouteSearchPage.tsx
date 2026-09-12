import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, LocateFixed, Search, X, MapPin, Sparkles, Clock, AlertCircle, Sun, Sunset, Moon } from 'lucide-react';
import { TimeOfDay } from '../types';
import { searchLocations, GeocodingResult } from '../services/geocoding';
import { 
  getGooglePlacePredictions, 
  getGooglePlaceDetails, 
  geocodeGoogleAddress,
  ensureGoogleMapsLoaded,
  getApiKey,
  GooglePlaceResult 
} from '../services/googleMapsService';

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
  const [originTitle, setOriginTitle] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  const [selectedOriginPlace, setSelectedOriginPlace] = useState<GooglePlaceResult | null>(null);

  const [destTitle, setDestTitle] = useState("");
  const [destAddress, setDestAddress] = useState("");
  const [selectedDestPlace, setSelectedDestPlace] = useState<GooglePlaceResult | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Autocomplete suggestions
  const [originSuggestions, setOriginSuggestions] = useState<GeocodingResult[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodingResult[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // Pre-load Google Maps SDK on mount
  useEffect(() => {
    ensureGoogleMapsLoaded();
  }, []);

  const handleSwap = () => {
    const tempT = originTitle;
    const tempA = originAddress;
    const tempPlace = selectedOriginPlace;

    setOriginTitle(destTitle);
    setOriginAddress(destAddress);
    setSelectedOriginPlace(selectedDestPlace);

    setDestTitle(tempT);
    setDestAddress(tempA);
    setSelectedDestPlace(tempPlace);
  };

  // Google Places Autocomplete predictions for FROM field
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (showOriginDropdown) {
        if (originTitle.trim().length > 1) {
          const googlePreds = await getGooglePlacePredictions(originTitle);
          if (googlePreds && googlePreds.length > 0) {
            setOriginSuggestions(
              googlePreds.map((gp) => ({
                placeId: gp.placeId,
                displayName: gp.description,
                title: gp.mainText,
                address: gp.secondaryText || gp.description,
                lat: 0,
                lng: 0
              }))
            );
            return;
          }
          const fallbackResults = await searchLocations(originTitle);
          setOriginSuggestions(fallbackResults);
        } else {
          setOriginSuggestions(POPULAR_SUGGESTIONS);
        }
      } else {
        setOriginSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [originTitle, showOriginDropdown]);

  // Google Places Autocomplete predictions for TO field
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (showDestDropdown) {
        if (destTitle.trim().length > 1) {
          const googlePreds = await getGooglePlacePredictions(destTitle);
          if (googlePreds && googlePreds.length > 0) {
            setDestSuggestions(
              googlePreds.map((gp) => ({
                placeId: gp.placeId,
                displayName: gp.description,
                title: gp.mainText,
                address: gp.secondaryText || gp.description,
                lat: 0,
                lng: 0
              }))
            );
            return;
          }
          const fallbackResults = await searchLocations(destTitle);
          setDestSuggestions(fallbackResults);
        } else {
          setDestSuggestions(POPULAR_SUGGESTIONS);
        }
      } else {
        setDestSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [destTitle, showDestDropdown]);

  // Handle selecting an origin suggestion from Google Places
  const handleSelectOriginSuggestion = async (item: GeocodingResult) => {
    setOriginTitle(item.title);
    setOriginAddress(item.address);
    setShowOriginDropdown(false);
    setSearchError(null);

    if (item.placeId && !item.placeId.startsWith('p') && !item.placeId.includes('-')) {
      const details = await getGooglePlaceDetails(item.placeId);
      if (details) {
        setSelectedOriginPlace(details);
        setOriginAddress(details.address || item.address);
        return;
      }
    }

    if (item.lat && item.lng) {
      setSelectedOriginPlace({
        placeId: item.placeId,
        name: item.title,
        address: item.address,
        displayName: item.displayName,
        lat: item.lat,
        lng: item.lng
      });
    }
  };

  // Handle selecting a destination suggestion from Google Places
  const handleSelectDestSuggestion = async (item: GeocodingResult) => {
    setDestTitle(item.title);
    setDestAddress(item.address);
    setShowDestDropdown(false);
    setSearchError(null);

    if (item.placeId && !item.placeId.startsWith('p') && !item.placeId.includes('-')) {
      const details = await getGooglePlaceDetails(item.placeId);
      if (details) {
        setSelectedDestPlace(details);
        setDestAddress(details.address || item.address);
        return;
      }
    }

    if (item.lat && item.lng) {
      setSelectedDestPlace({
        placeId: item.placeId,
        name: item.title,
        address: item.address,
        displayName: item.displayName,
        lat: item.lat,
        lng: item.lng
      });
    }
  };

  const handleUseGpsLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocatingUser(true);
      setSearchError(null);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          const gpsPlace: GooglePlaceResult = {
            placeId: 'gps-user-loc',
            name: 'Current Location',
            address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
            displayName: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            lat,
            lng
          };

          setSelectedOriginPlace(gpsPlace);
          setOriginTitle("Current Location");
          setOriginAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          setIsLocatingUser(false);
        },
        (err) => {
          console.warn('GPS location error:', err);
          setIsLocatingUser(false);
          setSearchError("Location permission was denied or is unavailable. Please type your origin in the search box.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setSearchError("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    if (!originTitle.trim() || !destTitle.trim()) {
      setSearchError("Please specify both origin and destination locations.");
      return;
    }

    setIsSearching(true);

    // Resolve origin place details if not already selected
    let finalOriginObj = selectedOriginPlace;
    if (!finalOriginObj || finalOriginObj.name !== originTitle) {
      const geocoded = await geocodeGoogleAddress(originTitle + (originAddress ? `, ${originAddress}` : ''));
      if (geocoded) {
        finalOriginObj = geocoded;
      } else {
        const fallback = await searchLocations(originTitle);
        if (fallback && fallback.length > 0) {
          finalOriginObj = {
            placeId: fallback[0].placeId,
            name: fallback[0].title,
            address: fallback[0].address,
            displayName: fallback[0].displayName,
            lat: fallback[0].lat,
            lng: fallback[0].lng
          };
        }
      }
    }

    // Resolve destination place details if not already selected
    let finalDestObj = selectedDestPlace;
    if (!finalDestObj || finalDestObj.name !== destTitle) {
      const geocoded = await geocodeGoogleAddress(destTitle + (destAddress ? `, ${destAddress}` : ''));
      if (geocoded) {
        finalDestObj = geocoded;
      } else {
        const fallback = await searchLocations(destTitle);
        if (fallback && fallback.length > 0) {
          finalDestObj = {
            placeId: fallback[0].placeId,
            name: fallback[0].title,
            address: fallback[0].address,
            displayName: fallback[0].displayName,
            lat: fallback[0].lat,
            lng: fallback[0].lng
          };
        }
      }
    }

    if (!finalOriginObj || !finalDestObj || (!finalOriginObj.lat && !finalOriginObj.address)) {
      setIsSearching(false);
      setSearchError("No precise location found. Please select a valid Google Place from suggestions.");
      return;
    }

    // Embed exact Place ID and Coordinates in formatted location string
    const fullOrigin = `${finalOriginObj.name} (${finalOriginObj.lat.toFixed(6)}, ${finalOriginObj.lng.toFixed(6)}) [placeId:${finalOriginObj.placeId}]`;
    const fullDest = `${finalDestObj.name} (${finalDestObj.lat.toFixed(6)}, ${finalDestObj.lng.toFixed(6)}) [placeId:${finalDestObj.placeId}]`;

    setTimeout(() => {
      setIsSearching(false);
      onSearchComplete(fullOrigin, fullDest);
    }, 600);
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

          {searchError && (
            <div className="p-4 rounded-2xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

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
                      onClick={() => handleSelectOriginSuggestion(item)}
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
                      onClick={() => handleSelectDestSuggestion(item)}
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

            {/* DEPARTURE TIME / TIME-BASED SCORING SELECTOR */}
            <div className="relative z-10 space-y-2 pt-1">
              <label className="block text-xs font-bold tracking-widest text-[#7E5767] uppercase ml-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#A3526B]" />
                  <span>DEPARTURE TIME & TIME-BASED SCORING</span>
                </span>
                <span className="text-[10px] normal-case font-semibold text-[#A3526B]">
                  Scores & Best Match update by time
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'day' as TimeOfDay, label: 'Daytime', timeStr: '3:00 PM', rangeStr: '6 AM – 5 PM', icon: Sun, color: 'text-amber-500' },
                  { id: 'evening' as TimeOfDay, label: 'Evening', timeStr: '7:00 PM', rangeStr: '5 PM – 9 PM', icon: Sunset, color: 'text-orange-500' },
                  { id: 'night' as TimeOfDay, label: 'Night', timeStr: '9:00 PM', rangeStr: '9 PM – 11 PM', icon: Moon, color: 'text-indigo-500' },
                  { id: 'lateNight' as TimeOfDay, label: 'Late Night', timeStr: '1:00 AM', rangeStr: '11 PM – 6 AM', icon: Sparkles, color: 'text-purple-500' },
                ].map((item) => {
                  const isSelected = timeOfDay === item.id;
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTimeOfDay(item.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? (isLowSignalGlobal
                              ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/40 shadow-md'
                              : 'bg-[#5E253B] border-[#5E253B] text-white ring-2 ring-[#5E253B]/20 shadow-md')
                          : (isLowSignalGlobal
                              ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'bg-white border-[#E0D0C9] text-[#3E1627] hover:border-[#A3526B] shadow-2xs')
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : item.color}`} />
                          {item.label}
                        </span>
                        {isSelected && (
                          <span className={`w-2 h-2 rounded-full ${isLowSignalGlobal ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <span className={`block font-extrabold text-xs ${isSelected ? 'text-amber-200' : 'text-[#A3526B]'}`}>
                          {item.timeStr}
                        </span>
                        <span className={`block text-[10px] font-medium ${isSelected ? 'opacity-80' : 'text-[#7E5767]'}`}>
                          {item.rangeStr}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
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
