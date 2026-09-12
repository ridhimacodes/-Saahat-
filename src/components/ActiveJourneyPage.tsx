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
  Layers,
  Plus,
  Minus
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

// Zoom Controls matching Map 1
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

  // Navigation simulation states
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isNavigating, setIsNavigating] = useState(true);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [showStepsDrawer, setShowStepsDrawer] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Active layers state for nearby support places matching Map 1
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

  // Nearby places derived matching Map 1
  const mockNearbyPlaces = originCoords ? [
    { type: 'police', title: 'Police Assistance Desk', lat: originCoords[0] + 0.003, lng: originCoords[1] + 0.002 },
    { type: 'hospital', title: 'City Central Emergency Hospital', lat: originCoords[0] - 0.004, lng: originCoords[1] + 0.005 },
    { type: 'metro', title: 'Rajiv Chowk Metro Exit 2', lat: originCoords[0] + 0.001, lng: originCoords[1] - 0.003 },
    { type: 'pharmacy', title: '24/7 Chemist & Healthcare', lat: originCoords[0] + 0.005, lng: originCoords[1] - 0.001 },
    { type: 'fuel', title: 'HP Fuel & Express Station', lat: originCoords[0] - 0.002, lng: originCoords[1] - 0.004 },
  ] : [];

  // Auto-advance navigation simulation every 4.5 seconds when active
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

      {/* TOP FLOATING BAR: Nearby Support Layers Toggles Matching Map 1 */}
      <div className="absolute top-3 left-3 right-28 z-[450] flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => toggleLayer('police')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md flex-shrink-0 ${
            activeLayers.police ? 'bg-blue-600 text-white border border-blue-400' : 'bg-white/95 text-slate-800 border border-slate-200'
          }`}
        >
          <span>👮 Police</span>
        </button>

        <button
          onClick={() => toggleLayer('hospital')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md flex-shrink-0 ${
            activeLayers.hospital ? 'bg-rose-600 text-white border border-rose-400' : 'bg-white/95 text-slate-800 border border-slate-200'
          }`}
        >
          <span>🏥 Hospitals</span>
        </button>

        <button
          onClick={() => toggleLayer('metro')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md flex-shrink-0 ${
            activeLayers.metro ? 'bg-indigo-600 text-white border border-indigo-400' : 'bg-white/95 text-slate-800 border border-slate-200'
          }`}
        >
          <span>🚇 Metro</span>
        </button>

        <button
          onClick={() => toggleLayer('pharmacy')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md flex-shrink-0 ${
            activeLayers.pharmacy ? 'bg-emerald-600 text-white border border-emerald-400' : 'bg-white/95 text-slate-800 border border-slate-200'
          }`}
        >
          <span>💊 Pharmacies</span>
        </button>

        <button
          onClick={() => toggleLayer('fuel')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md flex-shrink-0 ${
            activeLayers.fuel ? 'bg-amber-600 text-white border border-amber-400' : 'bg-white/95 text-slate-800 border border-slate-200'
          }`}
        >
          <span>⛽ Fuel</span>
        </button>
      </div>

      {/* TOP-RIGHT RECENTER BUTTON MATCHING MAP 1 */}
      <button
        onClick={handleRecenter}
        className="absolute top-3 right-3 z-[450] px-4 py-1.5 rounded-full bg-white text-[#3E1627] font-bold text-xs shadow-md border border-[#E0D0C9] hover:bg-slate-50 transition-all flex items-center gap-1.5"
      >
        <Compass className="w-3.5 h-3.5 text-[#A3526B]" />
        <span>Recenter</span>
      </button>

      {/* PROMINENT TURN-BY-TURN DIRECTION / NAVIGATION BLOCK ON SCREEN */}
      <div className="absolute top-14 left-3 right-3 sm:left-4 sm:right-4 z-[450] max-w-2xl mx-auto">
        <div className={`rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl border transition-all ${
          isLowSignalGlobal 
            ? 'bg-slate-900/95 border-amber-400/50 text-white ring-1 ring-amber-400/30' 
            : 'bg-[#5E253B]/95 border-[#A3526B]/40 text-white shadow-pink-950/30'
        }`}>
          <div className="flex items-center justify-between gap-3">
            
            {/* Step Icon & Current Instruction */}
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isLowSignalGlobal ? 'bg-amber-400 text-slate-950 font-black' : 'bg-emerald-500 text-white font-black'
              }`}>
                <Navigation className="w-5 h-5 transform rotate-45 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full ${
                    isLowSignalGlobal ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-200'
                  }`}>
                    Step {currentStepIdx + 1} of {steps.length}
                  </span>
                  <span className="text-[11px] font-bold opacity-80 truncate">
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
                onClick={() => setShowStepsDrawer(!showStepsDrawer)}
                className="px-3 py-2 rounded-full text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all flex items-center gap-1"
              >
                <span>{showStepsDrawer ? "Hide List" : "Directions"}</span>
                {showStepsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onEndJourney}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-400/30 transition-all flex items-center gap-1"
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
          zoom={14}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          {/* Authentic Google Maps Light Theme Tiles (Identical to Map 1) */}
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
              color: isLowSignalGlobal ? '#34D399' : (selectedRoute.color || '#1E6B45'),
              weight: 8,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          {/* Nearby Support Places Markers Matching Map 1 */}
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
          <Marker position={currentPos} icon={userLiveMarkerIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <strong>Live Journey Position</strong>
                <p className="text-[10px] text-slate-500">{steps[currentStepIdx]}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Collapsible Turn-by-Turn List Drawer overlay */}
        <AnimatePresence>
          {showStepsDrawer && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute left-4 right-4 bottom-24 z-[450] max-w-xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3"
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
              className="px-3.5 py-2 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1 transition-all"
            >
              <span>{showStepsDrawer ? "Hide Directions" : "View Directions List"}</span>
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
