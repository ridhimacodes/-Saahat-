import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Heart, 
  Sparkles, 
  Share2, 
  PhoneCall, 
  LocateFixed, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowLeft,
  Volume2,
  VolumeX,
  Mic,
  Volume1,
  Layers,
  Plus,
  Minus
} from 'lucide-react';
import { RouteOption, TimeOfDay } from '../types';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { logJourneyStart, markJourneyComplete } from '../services/supabaseService';

interface ActiveJourneyPageProps {
  selectedRoute: RouteOption;
  origin: string;
  destination: string;
  onEndJourney: () => void;
  onNavigateHome: () => void;
  isLowSignalGlobal: boolean;
  timeOfDay: TimeOfDay;
}

// Custom Leaflet Icons for Navigation
const userLiveMarkerIcon = L.divIcon({
  className: 'user-live-navigation-marker',
  html: `
    <div class="relative flex items-center justify-center w-10 h-10">
      <span class="absolute w-10 h-10 rounded-full bg-emerald-500/30 animate-ping"></span>
      <span class="absolute w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const originDotIcon = L.divIcon({
  className: 'origin-dot-pin',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-5 h-5 rounded-full bg-[#C2414C] border-2 border-white shadow-md"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const destDotIcon = L.divIcon({
  className: 'dest-dot-pin',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-5 h-5 rounded-full bg-[#1E6B45] border-2 border-white shadow-md"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Custom Step Pins along the Route Line
const getStepMarkerIcon = (stepNum: number, isCurrent: boolean) => {
  return L.divIcon({
    className: 'step-number-pin',
    html: `
      <div class="flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-lg border-2 border-white transition-all ${
        isCurrent ? 'bg-amber-400 text-slate-950 scale-125 ring-4 ring-amber-400/40' : 'bg-slate-900 text-white opacity-90'
      }">
        ${stepNum}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const getNearbyLayerIcon = (type: string) => {
  let emoji = '📍';
  let bgColor = 'bg-[#1E6B45]';
  if (type === 'hospital') { emoji = '🏥'; bgColor = 'bg-rose-600'; }
  if (type === 'police') { emoji = '👮'; bgColor = 'bg-blue-600'; }
  if (type === 'metro') { emoji = '🚇'; bgColor = 'bg-indigo-600'; }
  if (type === 'pharmacy') { emoji = '💊'; bgColor = 'bg-emerald-600'; }
  if (type === 'fuel') { emoji = '⛽'; bgColor = 'bg-amber-600'; }

  return L.divIcon({
    className: 'landmark-marker',
    html: `
      <div class="flex items-center justify-center w-7 h-7 ${bgColor} text-white rounded-full border-2 border-white shadow-md text-xs font-bold">
        ${emoji}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// Map Recenter Controller component fitting full route bounds
const MapRecenterController: React.FC<{ coords: [number, number][]; trigger: number }> = ({ coords, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  }, [coords, trigger, map]);
  return null;
};

// Zoom Controls
const ZoomControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-28 right-4 z-[400] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col divide-y divide-slate-100">
      <button 
        onClick={() => map.zoomIn()} 
        className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors"
        title="Zoom In"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button 
        onClick={() => map.zoomOut()} 
        className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors"
        title="Zoom Out"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
};

// Calculate Haversine distance in meters
function getHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Distance from point to line segment in meters
function getPointToSegmentDistanceMeters(
  p: [number, number],
  v: [number, number],
  w: [number, number]
): number {
  const l2 = ((v[0] - w[0]) ** 2 + (v[1] - w[1]) ** 2);
  if (l2 === 0) return getHaversineDistanceMeters(p[0], p[1], v[0], v[1]);
  let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection: [number, number] = [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])];
  return getHaversineDistanceMeters(p[0], p[1], projection[0], projection[1]);
}

// Minimum distance from user to route polyline in meters
function getMinDistanceToRoute(userLoc: [number, number], polyline: [number, number][]): number {
  if (!polyline || polyline.length === 0) return 0;
  if (polyline.length === 1) return getHaversineDistanceMeters(userLoc[0], userLoc[1], polyline[0][0], polyline[0][1]);
  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const dist = getPointToSegmentDistanceMeters(userLoc, polyline[i], polyline[i + 1]);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

export const ActiveJourneyPage: React.FC<ActiveJourneyPageProps> = ({
  selectedRoute,
  origin,
  destination,
  onEndJourney,
  onNavigateHome,
  isLowSignalGlobal,
  timeOfDay
}) => {
  const coordinates = selectedRoute.coordinates;
  const originCoords = coordinates[0] || [28.6653, 77.2324];
  const destCoords = coordinates[coordinates.length - 1] || [28.6129, 77.2295];

  // Derive offline steps or generate turn directions
  const steps = (selectedRoute.offlineSteps && selectedRoute.offlineSteps.length > 0)
    ? selectedRoute.offlineSteps
    : [
        `Start from ${origin.split(',')[0]} heading along ${selectedRoute.via}`,
        `Pass well-lit commercial strip with open stores and CCTV coverage`,
        `Continue straight for 400m through active pedestrian zone`,
        `Arrive safely at ${destination.split(',')[0]}`
      ];

  // Map each step to a specific geographic coordinate along the route polyline
  const stepCoordinates: [number, number][] = steps.map((_, sIdx) => {
    const coordIdx = Math.min(
      Math.floor((sIdx / Math.max(steps.length - 1, 1)) * (coordinates.length - 1)),
      coordinates.length - 1
    );
    return coordinates[coordIdx] || originCoords;
  });

  // Navigation and Tracking states
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showStepsDrawer, setShowStepsDrawer] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [journeyLogId, setJourneyLogId] = useState<string | null>(null);

  // Live Location & Tracking
  const [userLivePos, setUserLivePos] = useState<[number, number]>(originCoords);
  const [isGpsLocked, setIsGpsLocked] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Simulation Mode state
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 5>(1);
  const [simProgressIndex, setSimProgressIndex] = useState(0);

  // Refs for tracking speech announcements per step to prevent duplicate announcements
  const announcedAdvanceStepRef = useRef<Set<number>>(new Set());
  const announcedNowStepRef = useRef<Set<number>>(new Set());
  const lastOffRouteAnnouncementTime = useRef<number>(0);
  const offRouteCountRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);
  const simTimerRef = useRef<any>(null);

  // Background logging of active journey to Supabase
  useEffect(() => {
    const arrivalTimeStr = (() => {
      const d = new Date();
      d.setMinutes(d.getMinutes() + selectedRoute.durationMinutes);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    })();

    logJourneyStart(origin, destination, selectedRoute, arrivalTimeStr)
      .then(id => { if (id) setJourneyLogId(id); })
      .catch(err => console.warn('Supabase journey log:', err));
  }, []);

  // Active layers state for nearby support places
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    hospital: false,
    police: true,
    metro: true,
    pharmacy: false,
    fuel: false
  });

  const toggleLayer = (layerKey: string) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Nearby support places along route
  const mockNearbyPlaces = originCoords ? [
    { type: 'police', title: 'Police Assistance Desk', lat: originCoords[0] + 0.003, lng: originCoords[1] + 0.002 },
    { type: 'hospital', title: 'City Central Emergency Hospital', lat: originCoords[0] - 0.004, lng: originCoords[1] + 0.005 },
    { type: 'metro', title: 'Transit / Metro Station Exit', lat: originCoords[0] + 0.001, lng: originCoords[1] - 0.003 },
    { type: 'pharmacy', title: '24/7 Chemist & Healthcare', lat: originCoords[0] + 0.005, lng: originCoords[1] - 0.001 },
    { type: 'fuel', title: 'HP Fuel & Express Station', lat: originCoords[0] - 0.002, lng: originCoords[1] - 0.004 },
  ] : [];

  // Web Speech API Voice Assistant Helper
  const speakText = (text: string) => {
    if (isVoiceMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start Navigation Action
  const handleStartNavigation = () => {
    setIsNavigationActive(true);
    speakText(`Starting navigation to ${destination.split(',')[0]}. Head towards ${steps[0]}`);
  };

  // Pause / Stop Navigation Action
  const handlePauseNavigation = () => {
    setIsNavigationActive(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    speakText("Navigation paused.");
  };

  // Arrival Trigger
  const handleArrivedSafely = () => {
    setHasArrived(true);
    setIsNavigationActive(false);
    setIsSimulationMode(false);
    markJourneyComplete(journeyLogId);
    speakText(`You have arrived safely at ${destination.split(',')[0]}. Journey complete.`);
    confetti({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.6 }
    });
  };

  // Continuous Proximity-based Turn-by-Turn Logic processor
  const processPositionUpdate = (pos: [number, number]) => {
    setUserLivePos(pos);

    // 1. Check distance to final destination
    const distToDest = getHaversineDistanceMeters(pos[0], pos[1], destCoords[0], destCoords[1]);
    if (distToDest <= 25 && !hasArrived) {
      handleArrivedSafely();
      return;
    }

    // 2. Check Off-Route Deviation (>50 meters from route polyline)
    const deviationDist = getMinDistanceToRoute(pos, coordinates);
    if (deviationDist > 50) {
      offRouteCountRef.current += 1;
      if (offRouteCountRef.current >= 2) {
        setIsOffRoute(true);
        const now = Date.now();
        if (now - lastOffRouteAnnouncementTime.current > 15000) {
          lastOffRouteAnnouncementTime.current = now;
          speakText("Off route. Recalculating route...");
          setIsRecalculating(true);
          setTimeout(() => setIsRecalculating(false), 3000);
        }
      }
    } else {
      offRouteCountRef.current = 0;
      if (isOffRoute) setIsOffRoute(false);
    }

    // 3. Check proximity to upcoming steps
    for (let i = currentStepIdx; i < steps.length; i++) {
      const targetStepCoord = stepCoordinates[i];
      if (!targetStepCoord) continue;

      const distToStep = getHaversineDistanceMeters(pos[0], pos[1], targetStepCoord[0], targetStepCoord[1]);

      // If user reaches within 20m of this step, advance to next step automatically
      if (distToStep <= 20 && i === currentStepIdx && currentStepIdx < steps.length - 1) {
        const nextStepIdx = currentStepIdx + 1;
        setCurrentStepIdx(nextStepIdx);
        break;
      }

      // Final turn prompt ("Turn left now" / "[Instruction] now") when ~20-30m away
      if (distToStep <= 35 && !announcedNowStepRef.current.has(i) && isNavigationActive) {
        announcedNowStepRef.current.add(i);
        const instruction = steps[i];
        speakText(`${instruction} now.`);
        break;
      }

      // Advance warning ("In 200 meters, [instruction]") when ~150-220m away
      if (distToStep > 40 && distToStep <= 220 && !announcedAdvanceStepRef.current.has(i) && isNavigationActive) {
        announcedAdvanceStepRef.current.add(i);
        const instruction = steps[i];
        speakText(`In ${Math.round(distToStep)} meters, ${instruction}`);
        break;
      }
    }
  };

  // Continuous Live Geolocation Tracking via watchPosition
  useEffect(() => {
    if (!isNavigationActive || isSimulationMode) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      console.warn("Geolocation not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setIsGpsLocked(true);
        setGpsAccuracy(Math.round(position.coords.accuracy));
        const newCoords: [number, number] = [position.coords.latitude, position.coords.longitude];
        processPositionUpdate(newCoords);
      },
      (error) => {
        console.warn("Live GPS watchPosition warning:", error.message);
        setIsGpsLocked(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isNavigationActive, isSimulationMode, currentStepIdx, steps, stepCoordinates, coordinates, hasArrived, isOffRoute]);

  // Simulation Mode: smooth playback along polyline coordinates for testing without walking
  useEffect(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }

    if (isSimulationMode && isNavigationActive && !hasArrived) {
      const intervalMs = Math.round(1500 / simSpeed);
      simTimerRef.current = setInterval(() => {
        setSimProgressIndex((prev) => {
          const next = prev + 1;
          if (next >= coordinates.length) {
            handleArrivedSafely();
            return prev;
          }
          const nextCoord = coordinates[next];
          if (nextCoord) {
            processPositionUpdate(nextCoord);
          }
          return next;
        });
      }, intervalMs);
    }

    return () => {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
    };
  }, [isSimulationMode, isNavigationActive, simSpeed, coordinates, hasArrived]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
      }
    };
  }, []);

  // Distance & time remaining calculations based on user's live position to destination
  const distanceRemainingMeters = getHaversineDistanceMeters(
    userLivePos[0],
    userLivePos[1],
    destCoords[0],
    destCoords[1]
  );
  const distanceRemainingKm = (distanceRemainingMeters / 1000).toFixed(1);

  // Remaining minutes derived from remaining distance relative to route
  const remainingMinutes = Math.max(1, Math.round((distanceRemainingMeters / 1000) / (selectedRoute.distanceKm / selectedRoute.durationMinutes)));
  const expectedArrivalTime = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + remainingMinutes);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  })();

  const handleReplayVoice = () => {
    if (hasArrived) {
      speakText("You have arrived safely at your destination.");
    } else {
      speakText(`Step ${currentStepIdx + 1} of ${steps.length}: ${steps[currentStepIdx]}`);
    }
  };

  const handleRecenter = () => {
    setRecenterTrigger(prev => prev + 1);
  };

  const handlePrevStep = () => {
    const prevIdx = Math.max(0, currentStepIdx - 1);
    setCurrentStepIdx(prevIdx);
    speakText(`Step ${prevIdx + 1}: ${steps[prevIdx]}`);
  };

  const handleNextStep = () => {
    const nextIdx = Math.min(steps.length - 1, currentStepIdx + 1);
    setCurrentStepIdx(nextIdx);
    speakText(`Step ${nextIdx + 1}: ${steps[nextIdx]}`);
  };

  return (
    <div className={`relative w-full h-[calc(100vh-70px)] min-h-[600px] flex flex-col font-sans overflow-hidden ${
      isLowSignalGlobal ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-900'
    }`}>

      {/* FULL MAP CANVAS CONTAINER WITH ALL OVERLAYS INSIDE */}
      <div className="relative w-full h-full flex-1 z-10 overflow-hidden">

        {/* TOP FLOATING OVERLAY CONTAINER: Direction Card & Amenity Filters */}
        <div className="absolute top-4 left-3 right-3 sm:left-6 sm:right-6 z-[400] max-w-3xl mx-auto space-y-2">
          
          {/* Primary Turn-by-Turn Direction Banner */}
          <div className={`rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl border transition-all ${
            isOffRoute
              ? 'bg-rose-950/95 border-rose-500 text-white ring-2 ring-rose-500 animate-pulse'
              : isLowSignalGlobal 
              ? 'bg-slate-900/95 border-amber-400/60 text-white ring-1 ring-amber-400/30' 
              : 'bg-[#5E253B]/95 border-[#A3526B]/50 text-white shadow-pink-950/40'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Left: Step Icon & Direction Instruction Text */}
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md mt-0.5 sm:mt-0 ${
                  isOffRoute
                    ? 'bg-rose-600 text-white font-black animate-bounce'
                    : isLowSignalGlobal 
                    ? 'bg-amber-400 text-slate-950 font-black' 
                    : 'bg-emerald-500 text-white font-black'
                }`}>
                  {isOffRoute ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Navigation className={`w-5 h-5 transform rotate-45 ${isNavigationActive ? 'animate-pulse' : ''}`} />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full ${
                      isOffRoute
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                        : isLowSignalGlobal 
                        ? 'bg-amber-400/20 text-amber-300' 
                        : 'bg-emerald-400/20 text-emerald-200'
                    }`}>
                      {isOffRoute ? 'Off Route' : `Step ${currentStepIdx + 1} of ${steps.length}`}
                    </span>
                    <span className="text-[11px] font-bold opacity-80">
                      {selectedRoute.name.split('—')[0]}
                    </span>

                    {/* GPS Status Indicator */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      isSimulationMode
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : isGpsLocked
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      <LocateFixed className={`w-3 h-3 ${isNavigationActive ? 'animate-pulse' : ''}`} />
                      <span>
                        {isSimulationMode 
                          ? `Simulating (${simSpeed}x)` 
                          : isGpsLocked 
                          ? `GPS Active ${gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}` 
                          : 'GPS Ready'}
                      </span>
                    </div>

                    {/* Voice Assistant Active Indicator */}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold">
                      <Mic className={`w-3 h-3 ${isSpeaking ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`} />
                      <span>{isSpeaking ? 'Speaking...' : isVoiceMuted ? 'Muted' : 'Voice Active'}</span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base leading-snug text-white">
                    {isOffRoute 
                      ? (isRecalculating ? "Off route: Recalculating path to destination..." : "You have deviated from the route (>50m). Please return to the highlighted path.") 
                      : steps[currentStepIdx]}
                  </h3>
                </div>
              </div>

              {/* Right: Quick Controls (Step Navigation + Voice Assistant Replay) */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-1 sm:pt-0 border-t sm:border-t-0 border-white/10 w-full sm:w-auto justify-end flex-wrap">
                {/* Step Previous/Next buttons */}
                <div className="flex items-center bg-white/10 rounded-full border border-white/20 overflow-hidden">
                  <button
                    onClick={handlePrevStep}
                    disabled={currentStepIdx === 0}
                    className="p-2 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Previous Direction Step"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-1 text-[11px] font-bold text-slate-200 font-mono">
                    {currentStepIdx + 1}/{steps.length}
                  </span>
                  <button
                    onClick={handleNextStep}
                    disabled={currentStepIdx === steps.length - 1}
                    className="p-2 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Next Direction Step"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Voice Replay button */}
                <button
                  onClick={handleReplayVoice}
                  className="px-3 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                  title="Listen to Voice Direction"
                >
                  <Volume1 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-amber-300' : 'text-amber-200'}`} />
                  <span className="hidden sm:inline">Listen</span>
                </button>

                {/* Voice Mute Toggle */}
                <button
                  onClick={() => {
                    const nextMute = !isVoiceMuted;
                    setIsVoiceMuted(nextMute);
                    if (nextMute && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`p-2 rounded-full border transition-all ${
                    isVoiceMuted 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                  title={isVoiceMuted ? "Unmute Voice Guidance" : "Mute Voice Guidance"}
                >
                  {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setShowStepsDrawer(!showStepsDrawer)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all flex items-center gap-1 shadow-xs"
                >
                  <span>{showStepsDrawer ? "Hide List" : "Directions"}</span>
                  {showStepsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    handlePauseNavigation();
                    onEndJourney();
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/40 transition-all flex items-center gap-1 shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              </div>

            </div>
          </div>

          {/* Secondary Bar: Amenity Support Filters + Demo Simulation Mode Controls + Recenter Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {/* Simulation Mode Toggle Button */}
              <button
                onClick={() => {
                  const nextSim = !isSimulationMode;
                  setIsSimulationMode(nextSim);
                  if (nextSim && !isNavigationActive) {
                    setIsNavigationActive(true);
                  }
                  speakText(nextSim ? "Simulation demo mode enabled." : "Live GPS tracking resumed.");
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md shrink-0 ${
                  isSimulationMode 
                    ? 'bg-purple-600 text-white border border-purple-400 ring-2 ring-purple-400/40' 
                    : 'bg-white/95 text-slate-800 border border-slate-200 hover:bg-slate-100'
                }`}
                title="Simulate movement along route without walking"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isSimulationMode ? "Demo Mode: ON" : "Demo Simulation"}</span>
              </button>

              {/* Simulation Speed Selector (only when simulation is active) */}
              {isSimulationMode && (
                <div className="flex items-center bg-slate-800/90 text-white rounded-full p-0.5 border border-slate-700 shadow-md shrink-0">
                  {([1, 2, 5] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSimSpeed(spd)}
                      className={`px-2 py-1 rounded-full text-[10px] font-black transition-all ${
                        simSpeed === spd ? 'bg-purple-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => toggleLayer('police')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md shrink-0 ${
                  activeLayers.police ? 'bg-blue-600 text-white border border-blue-400' : 'bg-white/95 text-slate-800 border border-slate-200'
                }`}
              >
                <span>👮 Police</span>
              </button>

              <button
                onClick={() => toggleLayer('hospital')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md shrink-0 ${
                  activeLayers.hospital ? 'bg-rose-600 text-white border border-rose-400' : 'bg-white/95 text-slate-800 border border-slate-200'
                }`}
              >
                <span>🏥 Hospitals</span>
              </button>

              <button
                onClick={() => toggleLayer('metro')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md shrink-0 ${
                  activeLayers.metro ? 'bg-indigo-600 text-white border border-indigo-400' : 'bg-white/95 text-slate-800 border border-slate-200'
                }`}
              >
                <span>🚇 Metro</span>
              </button>

              <button
                onClick={() => toggleLayer('pharmacy')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md shrink-0 ${
                  activeLayers.pharmacy ? 'bg-emerald-600 text-white border border-emerald-400' : 'bg-white/95 text-slate-800 border border-slate-200'
                }`}
              >
                <span>💊 Pharmacies</span>
              </button>

              <button
                onClick={() => toggleLayer('fuel')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md shrink-0 ${
                  activeLayers.fuel ? 'bg-amber-600 text-white border border-amber-400' : 'bg-white/95 text-slate-800 border border-slate-200'
                }`}
              >
                <span>⛽ Fuel</span>
              </button>
            </div>

            <button
              onClick={handleRecenter}
              className="px-4 py-1.5 rounded-full bg-white text-[#3E1627] font-bold text-xs shadow-md border border-[#E0D0C9] hover:bg-slate-50 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-[#A3526B]" />
              <span>Recenter</span>
            </button>
          </div>

        </div>

        {/* MAP CONTAINER */}
        <MapContainer
          center={originCoords}
          zoom={14}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          {/* Google Maps Tiles */}
          <TileLayer 
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
            maxZoom={20}
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            attribution="&copy; Google Maps"
          />

          <ZoomControls />
          <MapRecenterController coords={coordinates} trigger={recenterTrigger} />

          {/* Active Route Polyline */}
          <Polyline
            positions={coordinates}
            pathOptions={{
              color: isOffRoute ? '#EF4444' : isLowSignalGlobal ? '#34D399' : (selectedRoute.color || '#1E6B45'),
              weight: 8,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: isOffRoute ? '8, 8' : undefined
            }}
          />

          {/* Render Step Pins along the Route Polyline */}
          {steps.map((st, sIdx) => {
            const stepPos = stepCoordinates[sIdx];
            if (!stepPos) return null;
            const isCurrent = sIdx === currentStepIdx;

            return (
              <Marker
                key={`step-pin-${sIdx}`}
                position={stepPos}
                icon={getStepMarkerIcon(sIdx + 1, isCurrent)}
                eventHandlers={{
                  click: () => {
                    setCurrentStepIdx(sIdx);
                    speakText(`Step ${sIdx + 1}: ${st}`);
                  }
                }}
              >
                <Popup>
                  <div className="font-sans text-xs space-y-1 p-1">
                    <strong className="text-amber-800 block">Step {sIdx + 1} of {steps.length}</strong>
                    <p className="text-slate-800 font-bold">{st}</p>
                    <button
                      onClick={() => speakText(`Step ${sIdx + 1}: ${st}`)}
                      className="mt-1 px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1"
                    >
                      <Volume1 className="w-3 h-3" />
                      <span>Hear Voice Direction</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Nearby Support Places Markers */}
          {mockNearbyPlaces.map((place, idx) => {
            if (!activeLayers[place.type]) return null;
            return (
              <Marker 
                key={idx} 
                position={[place.lat, place.lng]} 
                icon={getNearbyLayerIcon(place.type)}
              >
                <Popup>
                  <div className="font-sans text-xs space-y-1">
                    <strong className="text-slate-900 block">{place.title}</strong>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      Verified En-Route Support
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Origin Dot Pin */}
          <Marker position={originCoords} icon={originDotIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <strong>Origin:</strong> {origin}
              </div>
            </Popup>
          </Marker>

          {/* Destination Dot Pin */}
          <Marker position={destCoords} icon={destDotIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <strong>Destination:</strong> {destination}
              </div>
            </Popup>
          </Marker>

          {/* User Live GPS / Position Marker */}
          <Marker position={userLivePos} icon={userLiveMarkerIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <strong>Live Journey Position</strong>
                <p className="text-[10px] text-slate-500">
                  {isOffRoute ? "Deviated from designated route" : steps[currentStepIdx]}
                </p>
                <p className="text-[9px] text-slate-400 font-mono mt-1">
                  Remaining: {distanceRemainingKm} km ({remainingMinutes} mins)
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Collapsible Turn-by-Turn List Drawer overlay INSIDE MAP */}
        <AnimatePresence>
          {showStepsDrawer && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute left-4 right-4 bottom-24 z-[400] max-w-xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Full Turn-by-Turn Directions ({steps.length} Steps)</span>
                </h4>
                <button
                  onClick={() => setShowStepsDrawer(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {steps.map((st, sIdx) => {
                  const isCurrent = sIdx === currentStepIdx;
                  return (
                    <div
                      key={sIdx}
                      onClick={() => {
                        setCurrentStepIdx(sIdx);
                        speakText(`Step ${sIdx + 1}: ${st}`);
                      }}
                      className={`p-3 rounded-2xl text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                        isCurrent 
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-950 dark:text-emerald-300 font-bold shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${
                          isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {sIdx + 1}
                        </span>
                        <span>{st}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(`Step ${sIdx + 1}: ${st}`);
                        }}
                        className="p-1.5 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-300 hover:bg-amber-400/30 transition-all shrink-0 ml-2"
                        title="Listen to this direction"
                      >
                        <Volume1 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* BOTTOM CONTROL DOCK & ARRIVAL MODAL */}
      <div className="relative z-[500] w-full p-4 bg-slate-900/95 border-t border-slate-800 text-white shadow-2xl backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left: Journey Live Metrics */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Live ETA: {expectedArrivalTime}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                {remainingMinutes} mins left <span className="text-sm font-semibold text-slate-400">• {distanceRemainingKm} km remaining</span>
              </div>
            </div>

            <button
              onClick={() => setShowStepsDrawer(!showStepsDrawer)}
              className="px-3.5 py-2 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1 transition-all"
            >
              <span>{showStepsDrawer ? "Hide Directions" : "View Steps"}</span>
              {showStepsDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Right: Start/Pause Navigation & Arrival CTA Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* Start / Pause Navigation Action */}
            {!hasArrived && (
              <button
                onClick={() => {
                  if (isNavigationActive) {
                    handlePauseNavigation();
                  } else {
                    handleStartNavigation();
                  }
                }}
                className={`px-5 py-3.5 rounded-full font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                  isNavigationActive
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                }`}
              >
                {isNavigationActive ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Nav</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Navigation</span>
                  </>
                )}
              </button>
            )}

            {!hasArrived ? (
              <button
                onClick={handleArrivedSafely}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 text-amber-200 fill-amber-200" />
                <span>I've Arrived Safely!</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Journey Complete!
                </span>
                <button
                  onClick={onNavigateHome}
                  className="px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
