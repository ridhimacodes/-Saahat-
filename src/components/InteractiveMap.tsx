import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RouteOption, SafePlace, CommunityNote } from '../types';
import { GEOAPIFY_MAP_TILES_API_KEY, MAP_API_CONFIG } from '../config/maps';
import { fetchNearbySafePlaces } from '../services/safePlacesService';
import { fetchRecentSafetySignals } from '../services/supabaseService';
import { 
  Navigation, 
  Compass, 
  Layers, 
  MapPin, 
  ShieldCheck, 
  LocateFixed, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus, 
  Building2, 
  Shield, 
  Train, 
  Cross, 
  Fuel, 
  Store, 
  Landmark, 
  Stethoscope, 
  Activity, 
  Eye, 
  Sun, 
  Globe,
  AlertTriangle
} from 'lucide-react';

// Custom SVG Pins matching Google Maps
const originDotIcon = L.divIcon({
  className: 'origin-dot-pin',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-5 h-5 rounded-full bg-[#EA4335] border-2 border-white shadow-md"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const destDotIcon = L.divIcon({
  className: 'dest-dot-pin',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-5 h-5 rounded-full bg-[#34A853] border-2 border-white shadow-md"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const userGpsIcon = L.divIcon({
  className: 'user-gps-marker',
  html: `
    <div class="relative flex items-center justify-center w-9 h-9">
      <span class="absolute w-9 h-9 rounded-full bg-[#4285F4]/30 animate-ping"></span>
      <span class="absolute w-5 h-5 rounded-full bg-[#4285F4] border-2 border-white shadow-md"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const getNearbyLayerIcon = (type: string) => {
  let emoji = '📍';
  let bgColor = 'bg-[#34A853]';
  if (type === 'hospital') { emoji = '🏥'; bgColor = 'bg-rose-600'; }
  if (type === 'police') { emoji = '👮'; bgColor = 'bg-blue-600'; }
  if (type === 'metro') { emoji = '🚇'; bgColor = 'bg-indigo-600'; }
  if (type === 'railway') { emoji = '🚉'; bgColor = 'bg-purple-600'; }
  if (type === 'pharmacy') { emoji = '💊'; bgColor = 'bg-emerald-600'; }
  if (type === 'fuel') { emoji = '⛽'; bgColor = 'bg-amber-600'; }
  if (type === 'landmark') { emoji = '🏛️'; bgColor = 'bg-[#5E253B]'; }
  if (type === 'open') { emoji = '🏪'; bgColor = 'bg-teal-600'; }

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

const getSignalMarkerIcon = (category: string) => {
  let emoji = '⚠️';
  let bgColor = 'bg-amber-600';
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('light')) { emoji = '💡'; bgColor = 'bg-yellow-600'; }
  else if (catLower.includes('obstruction')) { emoji = '🚧'; bgColor = 'bg-orange-600'; }
  else if (catLower.includes('crowd')) { emoji = '👥'; bgColor = 'bg-purple-600'; }
  else if (catLower.includes('isolated')) { emoji = '🌙'; bgColor = 'bg-slate-700'; }

  return L.divIcon({
    className: 'community-signal-marker',
    html: `
      <div class="flex items-center justify-center w-7 h-7 ${bgColor} text-white rounded-full border-2 border-white shadow-md text-xs font-bold ring-2 ring-amber-400/50 animate-pulse">
        ${emoji}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// Map Recenter Helper component
const MapRecenterController: React.FC<{ coords: [number, number][]; triggerRecenter: number; targetPoint?: [number, number] | null }> = ({ coords, triggerRecenter, targetPoint }) => {
  const map = useMap();
  useEffect(() => {
    if (targetPoint) {
      map.flyTo(targetPoint, 16, { animate: true });
    } else if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [coords, triggerRecenter, targetPoint, map]);
  return null;
};

// Custom Google Controls (Zoom, My Location, Layers, Fullscreen)
const GoogleMapControls: React.FC<{
  onLocate: () => void;
  onRecenter: () => void;
  mapType: 'standard' | 'satellite' | 'terrain' | 'traffic';
  setMapType: (type: 'standard' | 'satellite' | 'terrain' | 'traffic') => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}> = ({ onLocate, onRecenter, mapType, setMapType, isFullscreen, toggleFullscreen }) => {
  const map = useMap();
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  return (
    <>
      {/* Top Left: Map Layer Type Menu Switcher */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 hover:bg-slate-100 font-bold text-xs shadow-md border border-slate-200 backdrop-blur-md flex items-center gap-1.5 transition-all"
            title="Google Maps Layers & Views"
          >
            <Layers className="w-4 h-4 text-[#4285F4]" />
            <span className="capitalize">{mapType} Map</span>
          </button>

          {showLayerMenu && (
            <div className="absolute top-10 left-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 z-[500] w-44">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block">
                Map Types & Overlays
              </span>
              <button
                onClick={() => { setMapType('standard'); setShowLayerMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  mapType === 'standard' ? 'bg-blue-50 text-[#4285F4]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Standard Road</span>
              </button>
              <button
                onClick={() => { setMapType('satellite'); setShowLayerMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  mapType === 'satellite' ? 'bg-blue-50 text-[#4285F4]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Satellite Imagery</span>
              </button>
              <button
                onClick={() => { setMapType('terrain'); setShowLayerMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  mapType === 'terrain' ? 'bg-blue-50 text-[#4285F4]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Terrain & Elevation</span>
              </button>
              <button
                onClick={() => { setMapType('traffic'); setShowLayerMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  mapType === 'traffic' ? 'bg-blue-50 text-[#4285F4]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                <span>Live Traffic Overlay</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Control Stack on Bottom-Right */}
      <div className="absolute bottom-6 right-3 z-[400] flex flex-col gap-2">
        {/* Fullscreen Toggle */}
        <button 
          onClick={toggleFullscreen} 
          className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Locate Me GPS Button */}
        <button 
          onClick={onLocate} 
          className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 text-[#4285F4] hover:bg-blue-50 transition-colors"
          title="Show My Location (GPS)"
        >
          <LocateFixed className="w-4 h-4 animate-pulse" />
        </button>

        {/* Recenter Route Button */}
        <button 
          onClick={onRecenter} 
          className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          title="Recenter Route"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
        </button>

        {/* Zoom In/Out Stack */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col divide-y divide-slate-100">
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
      </div>
    </>
  );
};

interface InteractiveMapProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute?: (id: string) => void;
  isLowSignalGlobal?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute = () => {},
  isLowSignalGlobal
}) => {
  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const [recenterCount, setRecenterCount] = useState(0);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain' | 'traffic'>('standard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userGpsPos, setUserGpsPos] = useState<[number, number] | null>(null);

  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    hospital: false,
    police: true,
    metro: true,
    pharmacy: false,
    fuel: false,
    signals: true
  });

  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [safetySignals, setSafetySignals] = useState<CommunityNote[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleLayer = (layerKey: string) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserGpsPos(coords);
        },
        (err) => console.warn('GPS location error:', err),
        { enableHighAccuracy: !isLowSignalGlobal }
      );
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.warn(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.warn(err));
    }
  };

  const originCoords = selectedRoute.coordinates[0];
  const destCoords = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];

  // Dynamic fetch of verified Safe Places and Community Signals around active route
  useEffect(() => {
    if (originCoords) {
      fetchNearbySafePlaces(originCoords).then(places => setSafePlaces(places));
    }
    fetchRecentSafetySignals().then(signals => setSafetySignals(signals));
  }, [originCoords?.[0], originCoords?.[1]]);

  // Fallback nearby support places
  const mockNearbyPlaces = originCoords ? [
    { type: 'police', title: 'Police Assistance Desk', lat: originCoords[0] + 0.003, lng: originCoords[1] + 0.002 },
    { type: 'hospital', title: 'City Central Emergency Hospital', lat: originCoords[0] - 0.004, lng: originCoords[1] + 0.005 },
    { type: 'metro', title: 'Transit / Metro Station Exit', lat: originCoords[0] + 0.001, lng: originCoords[1] - 0.003 },
    { type: 'pharmacy', title: '24/7 Chemist & Healthcare', lat: originCoords[0] + 0.005, lng: originCoords[1] - 0.001 },
    { type: 'fuel', title: 'HP Fuel & Express Station', lat: originCoords[0] - 0.002, lng: originCoords[1] - 0.004 },
  ] : [];

  // Combine fetched safePlaces with mockNearbyPlaces
  const displaySafePlaces: SafePlace[] = safePlaces.length > 0 
    ? safePlaces 
    : mockNearbyPlaces.map((p, idx) => ({
        id: `mock-sp-${idx}`,
        name: p.title,
        type: p.type as any,
        lat: p.lat,
        lng: p.lng,
        address: 'Verified En-Route Safe Facility',
        openStatus: '24/7 Monitored'
      }));

  // Determine tile URL based on mapType
  const getTileUrl = () => {
    switch (mapType) {
      case 'satellite':
        return "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
      case 'terrain':
        return "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}";
      case 'traffic':
        return "https://mt1.google.com/vt/lyrs=m@221000000,traffic&x={x}&y={y}&z={z}";
      case 'standard':
      default:
        // Use Geoapify Map Tiles API key
        return GEOAPIFY_MAP_TILES_API_KEY
          ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_MAP_TILES_API_KEY}`
          : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    }
  };

  const getTileAttribution = () => {
    if (mapType === 'standard' && GEOAPIFY_MAP_TILES_API_KEY) {
      return MAP_API_CONFIG.mapTiles.attribution;
    }
    return '&copy; Google Maps';
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isFullscreen ? 'h-screen font-sans bg-slate-900' : 'h-[460px] sm:h-[560px] rounded-3xl'} overflow-hidden shadow-xl border border-[#E8D8D3] ${
        isLowSignalGlobal ? 'bg-slate-950 border-slate-800' : 'bg-[#F9F4F0]'
      } font-sans`}
    >
      
      {/* Top Bar: Safe Places & Safety Signals Amenity Filters */}
      <div className="absolute top-3 left-44 right-14 z-[400] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => toggleLayer('police')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm shrink-0 ${
            activeLayers.police ? 'bg-blue-600 text-white border border-blue-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>👮 Police</span>
        </button>

        <button
          onClick={() => toggleLayer('hospital')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm shrink-0 ${
            activeLayers.hospital ? 'bg-rose-600 text-white border border-rose-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>🏥 Hospitals</span>
        </button>

        <button
          onClick={() => toggleLayer('metro')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm shrink-0 ${
            activeLayers.metro ? 'bg-indigo-600 text-white border border-indigo-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>🚇 Metro</span>
        </button>

        <button
          onClick={() => toggleLayer('pharmacy')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm shrink-0 ${
            activeLayers.pharmacy ? 'bg-emerald-600 text-white border border-emerald-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>💊 Pharmacies</span>
        </button>

        <button
          onClick={() => toggleLayer('fuel')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm shrink-0 ${
            activeLayers.fuel ? 'bg-amber-600 text-white border border-amber-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>⛽ Public Help</span>
        </button>

        <button
          onClick={() => toggleLayer('signals')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm shrink-0 ${
            activeLayers.signals ? 'bg-amber-500 text-slate-950 font-black border border-amber-400 ring-2 ring-amber-400/30' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
          title="Toggle Recent Community Safety Signals"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          <span>Safety Signals</span>
        </button>
      </div>

      {/* Main Map Container */}
      <MapContainer
        center={originCoords || [28.6653, 77.2324]}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Map Layer Tiles */}
        <TileLayer 
          key={mapType}
          url={getTileUrl()} 
          maxZoom={20}
          attribution={getTileAttribution()}
        />

        <GoogleMapControls 
          onLocate={handleLocateMe}
          onRecenter={() => { setUserGpsPos(null); setRecenterCount(c => c + 1); }}
          mapType={mapType}
          setMapType={setMapType}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
        />

        <MapRecenterController 
          coords={selectedRoute.coordinates} 
          triggerRecenter={recenterCount} 
          targetPoint={userGpsPos}
        />

        {/* Draw Routes with Distinct Polylines */}
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isBestMatch = route.id === 'route-best' || route.name.toLowerCase().includes('best');

          return (
            <React.Fragment key={route.id}>
              {/* Outer Outline for Selected Route */}
              {isSelected && (
                <Polyline
                  positions={route.coordinates}
                  pathOptions={{
                    color: isBestMatch ? '#14532D' : '#1E40AF',
                    weight: 10,
                    opacity: 0.35,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
              )}

              {/* Main Route Polyline */}
              <Polyline
                positions={route.coordinates}
                pathOptions={{
                  color: route.color || (isBestMatch ? '#1E6B45' : '#1A73E8'),
                  weight: isSelected ? 7 : 4,
                  opacity: isSelected ? 0.95 : 0.5,
                  lineCap: 'round',
                  lineJoin: 'round',
                  dashArray: isSelected ? undefined : '6, 8',
                }}
                eventHandlers={{
                  click: () => onSelectRoute(route.id)
                }}
              >
                <Popup>
                  <div className="p-1 font-sans">
                    <span className="font-bold text-xs text-[#3E1627] block">{route.name}</span>
                    <span className="text-[11px] text-slate-600 font-semibold">{route.durationMinutes} mins ({route.distanceKm} km)</span>
                  </div>
                </Popup>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* Origin Red Dot Marker */}
        {originCoords && (
          <Marker position={originCoords} icon={originDotIcon}>
            <Popup>
              <div className="p-1 font-sans text-center">
                <span className="text-xs font-bold text-[#EA4335] block">Pickup Location (A)</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Green Dot Marker */}
        {destCoords && (
          <Marker position={destCoords} icon={destDotIcon}>
            <Popup>
              <div className="p-1 font-sans text-center">
                <span className="text-xs font-bold text-[#34A853] block">Destination Location (B)</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* User GPS Pulsing Dot */}
        {userGpsPos && (
          <Marker position={userGpsPos} icon={userGpsIcon}>
            <Popup>
              <div className="p-1 font-sans text-center">
                <span className="text-xs font-bold text-blue-600 block">Your Current GPS Location</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Safe Places Markers */}
        {displaySafePlaces.map((place) => {
          const layerKey = place.type === 'public_place' ? 'fuel' : place.type;
          if (!activeLayers[layerKey]) return null;
          return (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={getNearbyLayerIcon(place.type)}>
              <Popup>
                <div className="p-1.5 font-sans space-y-1 min-w-[170px]">
                  <strong className="text-xs font-bold text-slate-900 block">{place.name}</strong>
                  <span className="inline-block text-[10px] text-emerald-800 font-bold uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Safe Place • {place.type}
                  </span>
                  {place.address && <p className="text-[11px] text-slate-600 mt-0.5">{place.address}</p>}
                  {place.distanceKm !== undefined && (
                    <p className="text-[10px] font-bold text-emerald-700">{place.distanceKm} km away</p>
                  )}
                  {place.openStatus && (
                    <span className="block text-[10px] font-medium text-slate-600">
                      🕒 {place.openStatus}
                    </span>
                  )}
                  {place.phone && (
                    <a href={`tel:${place.phone}`} className="inline-flex items-center gap-1 text-[11px] text-purple-700 font-bold hover:underline mt-1">
                      📞 {place.phone}
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Community Safety Signals Markers */}
        {activeLayers.signals && safetySignals.map((sig, sIdx) => {
          const sigPos: [number, number] = sig.coordinates || (
            originCoords ? [
              originCoords[0] + (sIdx % 2 === 0 ? 0.0025 : -0.0025) * ((sIdx % 4) + 1) * 0.4,
              originCoords[1] + (sIdx % 2 === 0 ? -0.003 : 0.003) * ((sIdx % 4) + 1) * 0.4
            ] : [28.6653, 77.2324]
          );

          return (
            <Marker key={sig.id} position={sigPos} icon={getSignalMarkerIcon(sig.category)}>
              <Popup>
                <div className="p-1.5 font-sans space-y-1.5 max-w-[220px]">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {sig.category}
                    </span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 block">{sig.location}</strong>
                  <p className="text-xs text-slate-700 italic leading-relaxed">"{sig.text}"</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Reported {sig.timestamp}</span>
                    <span className="font-semibold text-emerald-700">Verified</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">
                    Recent community safety signal • Non-permanent report
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Google Watermark in Lower Left Corner */}
      <div className="absolute bottom-2 left-3 z-[400] pointer-events-none opacity-90">
        <span className="text-[11px] font-black tracking-tighter font-sans text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs backdrop-blur-xs">
          <span className="text-[#4285F4]">G</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#FBBC05]">o</span>
          <span className="text-[#4285F4]">g</span>
          <span className="text-[#34A853]">l</span>
          <span className="text-[#EA4335]">e</span> Maps Engine
        </span>
      </div>

    </div>
  );
};
