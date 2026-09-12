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
  Layers
} from 'lucide-react';
import { RouteOption, TimeOfDay } from '../types';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

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

const originPinIcon = L.divIcon({
  className: 'origin-pin-icon',
  html: `
    <div class="flex items-center justify-center w-7 h-7 bg-[#C2414C] text-white rounded-full border-2 border-white shadow-md text-xs font-bold">
      A
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const destPinIcon = L.divIcon({
  className: 'dest-pin-icon',
  html: `
    <div class="flex items-center justify-center w-7 h-7 bg-[#1E6B45] text-white rounded-full border-2 border-white shadow-md text-xs font-bold">
      B
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// Map Recenter Controller component
const MapRecenterController: React.FC<{ center: [number, number]; trigger: number }> = ({ center, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { animate: true, duration: 1.2 });
    }
  }, [center, trigger, map]);
  return null;
};

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
  const originCoords = coordinates[0] || [19.0760, 72.8777];
  const destCoords = coordinates[coordinates.length - 1] || [19.0800, 72.8800];

  // Navigation simulation states
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isNavigating, setIsNavigating] = useState(true);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [showStepsDrawer, setShowStepsDrawer] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Derive offline steps or generate dynamic turn directions
  const steps = selectedRoute.offlineSteps || [
    `Start from ${origin.split(',')[0]} heading along ${selectedRoute.via}`,
    `Pass well-lit commercial strip with open stores and CCTV coverage`,
    `Continue straight for 400m through active pedestrian zone`,
    `Arrive safely at ${destination.split(',')[0]}`
  ];

  // Current position along polyline coordinates
  const currentPosIdx = Math.min(
    Math.floor((currentStepIdx / Math.max(steps.length - 1, 1)) * (coordinates.length - 1)),
    coordinates.length - 1
  );
  const currentPos = coordinates[currentPosIdx] || originCoords;

  // Auto-advance navigation simulation every 4 seconds when active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isNavigating && !hasArrived) {
      interval = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setHasArrived(true);
            setIsNavigating(false);
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
            return prev;
          }
        });
      }, 4500);
    }
    return () => clearInterval(interval);
  }, [isNavigating, hasArrived, steps.length]);

  const handleArrivedSafely = () => {
    setHasArrived(true);
    setIsNavigating(false);
    confetti({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.6 }
    });
  };

  const handleRecenter = () => {
    setRecenterTrigger(prev => prev + 1);
  };

  return (
    <div className={`relative w-full h-[calc(100vh-70px)] min-h-[600px] flex flex-col font-sans overflow-hidden ${
      isLowSignalGlobal ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-900'
    }`}>

      {/* TOP FLOATING BANNER: Turn-by-Turn Maneuver Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[500] max-w-3xl mx-auto">
        <div className={`rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl border transition-all ${
          isLowSignalGlobal 
            ? 'bg-slate-900/95 border-amber-400/50 text-white ring-1 ring-amber-400/30' 
            : 'bg-emerald-900/95 border-emerald-500/40 text-white shadow-emerald-950/40'
        }`}>
          <div className="flex items-center justify-between gap-3">
            
            {/* Maneuver Icon + Step Instruction */}
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                isLowSignalGlobal ? 'bg-amber-400 text-slate-950 font-black' : 'bg-emerald-400 text-emerald-950 font-black'
              }`}>
                <Navigation className="w-6 h-6 transform rotate-45 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full ${
                    isLowSignalGlobal ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-200'
                  }`}>
                    Step {currentStepIdx + 1} of {steps.length}
                  </span>
                  <span className="text-[11px] font-bold opacity-80">
                    {selectedRoute.name.split('—')[0]}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base leading-snug truncate mt-0.5">
                  {steps[currentStepIdx]}
                </h3>
              </div>
            </div>

            {/* Top Right Quick Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                className={`p-2.5 rounded-full border transition-all ${
                  isVoiceMuted 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title={isVoiceMuted ? "Unmute Voice Guidance" : "Mute Voice Guidance"}
              >
                {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onEndJourney}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* LARGE SCREEN FULL MAP CANVAS */}
      <div className="relative w-full h-full flex-1 z-10">
        <MapContainer
          center={originCoords}
          zoom={15}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          {/* Map Layer Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={
              isLowSignalGlobal
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
          />

          <MapRecenterController center={currentPos} trigger={recenterTrigger} />

          {/* Active Route Polyline */}
          <Polyline
            positions={coordinates}
            pathOptions={{
              color: isLowSignalGlobal ? '#34D399' : (selectedRoute.color || '#1E6B45'),
              weight: 8,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          {/* Origin Marker */}
          <Marker position={originCoords} icon={originPinIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <strong>Origin:</strong> {origin}
              </div>
            </Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker position={destCoords} icon={destPinIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <strong>Destination:</strong> {destination}
              </div>
            </Popup>
          </Marker>

          {/* User Live Live GPS / Position Marker */}
          <Marker position={currentPos} icon={userLiveMarkerIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <strong>Live Journey Position</strong>
                <p className="text-[10px] text-slate-500">{steps[currentStepIdx]}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Map Floating Tools: Recenter + Layer Info */}
        <div className="absolute right-4 bottom-28 z-[400] flex flex-col gap-2">
          <button
            onClick={handleRecenter}
            className="w-12 h-12 rounded-full bg-white text-slate-800 shadow-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
            title="Recenter on My Live Position"
          >
            <LocateFixed className="w-5 h-5 text-emerald-600" />
          </button>

          <button
            onClick={() => setIsNavigating(!isNavigating)}
            className={`w-12 h-12 rounded-full shadow-2xl border flex items-center justify-center active:scale-95 transition-all ${
              isNavigating 
                ? 'bg-amber-500 text-slate-950 border-amber-400' 
                : 'bg-emerald-600 text-white border-emerald-400'
            }`}
            title={isNavigating ? "Pause Simulation" : "Play Simulation"}
          >
            {isNavigating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>

        {/* Collapsible Turn-by-Turn List Drawer overlay */}
        <AnimatePresence>
          {showStepsDrawer && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute left-4 right-4 bottom-28 z-[450] max-w-xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Full Turn-by-Turn Route Guidance</span>
                </h4>
                <button
                  onClick={() => setShowStepsDrawer(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {steps.map((st, sIdx) => {
                  const isCurrent = sIdx === currentStepIdx;
                  return (
                    <div
                      key={sIdx}
                      className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-3 transition-all ${
                        isCurrent 
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-950 dark:text-emerald-300 font-bold' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {sIdx + 1}
                      </span>
                      <span>{st}</span>
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
          
          {/* Left: Journey Metrics */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>ETA & Remaining</span>
              </div>
              <div className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                {selectedRoute.durationMinutes} mins <span className="text-sm font-semibold text-slate-400">• {selectedRoute.distanceKm} km</span>
              </div>
            </div>

            <button
              onClick={() => setShowStepsDrawer(!showStepsDrawer)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1 transition-all"
            >
              <span>{showStepsDrawer ? "Hide Steps" : "View Steps"}</span>
              {showStepsDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Right: Arrival CTA & Safety Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
