import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RouteOption } from '../types';
import { 
  Navigation, 
  Compass, 
  Layers, 
  MapPin, 
  ShieldCheck, 
  LocateFixed, 
  Play, 
  Square, 
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
  Stethoscope
} from 'lucide-react';

// Custom SVG Pins matching Google / Reference Screenshot 2
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

const userGpsIcon = L.divIcon({
  className: 'user-gps-marker',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <span class="absolute w-8 h-8 rounded-full bg-[#1A73E8]/30 animate-ping"></span>
      <span class="absolute w-5 h-5 rounded-full bg-[#1A73E8] border-2 border-white shadow-md"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const getNearbyLayerIcon = (type: string) => {
  let emoji = '📍';
  let bgColor = 'bg-[#1E6B45]';
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

// Map Recenter Helper component
const MapRecenterController: React.FC<{ coords: [number, number][]; triggerRecenter: number }> = ({ coords, triggerRecenter }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [coords, triggerRecenter, map]);
  return null;
};

// Custom Zoom Controls matching Reference Screenshot 2
const ZoomControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-4 z-[400] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col divide-y divide-slate-100">
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

interface InteractiveMapProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  isLowSignalGlobal?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  isLowSignalGlobal
}) => {
  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const [recenterCount, setRecenterCount] = useState(0);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    hospital: false,
    police: true,
    metro: true,
    pharmacy: false,
    fuel: false
  });

  const [userGpsPos, setUserGpsPos] = useState<[number, number] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleLayer = (layerKey: string) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGpsPos([pos.coords.latitude, pos.coords.longitude]);
          setRecenterCount(c => c + 1);
        },
        (err) => console.warn('GPS location error:', err),
        { enableHighAccuracy: true }
      );
    }
  };

  const originCoords = selectedRoute.coordinates[0];
  const destCoords = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];

  // Derive nearby support places coordinates based on origin
  const mockNearbyPlaces = originCoords ? [
    { type: 'police', title: 'Police Assistance Desk', lat: originCoords[0] + 0.003, lng: originCoords[1] + 0.002 },
    { type: 'hospital', title: 'City Central Emergency Hospital', lat: originCoords[0] - 0.004, lng: originCoords[1] + 0.005 },
    { type: 'metro', title: 'Rajiv Chowk Metro Exit 2', lat: originCoords[0] + 0.001, lng: originCoords[1] - 0.003 },
    { type: 'pharmacy', title: '24/7 Chemist & Healthcare', lat: originCoords[0] + 0.005, lng: originCoords[1] - 0.001 },
    { type: 'fuel', title: 'HP Fuel & Express Station', lat: originCoords[0] - 0.002, lng: originCoords[1] - 0.004 },
  ] : [];

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-[460px] sm:h-[560px] rounded-3xl overflow-hidden shadow-xl border border-[#E8D8D3] ${
        isLowSignalGlobal ? 'bg-slate-950 border-slate-800' : 'bg-[#F9F4F0]'
      } font-sans`}
    >
      
      {/* Top Floating Bar: Nearby Support Layers Toggles */}
      <div className="absolute top-3 left-3 right-20 z-[400] flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => toggleLayer('police')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm flex-shrink-0 ${
            activeLayers.police ? 'bg-blue-600 text-white border border-blue-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>👮 Police</span>
        </button>

        <button
          onClick={() => toggleLayer('hospital')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm flex-shrink-0 ${
            activeLayers.hospital ? 'bg-rose-600 text-white border border-rose-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>🏥 Hospitals</span>
        </button>

        <button
          onClick={() => toggleLayer('metro')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm flex-shrink-0 ${
            activeLayers.metro ? 'bg-indigo-600 text-white border border-indigo-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>🚇 Metro</span>
        </button>

        <button
          onClick={() => toggleLayer('pharmacy')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm flex-shrink-0 ${
            activeLayers.pharmacy ? 'bg-emerald-600 text-white border border-emerald-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>💊 Pharmacies</span>
        </button>

        <button
          onClick={() => toggleLayer('fuel')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-sm flex-shrink-0 ${
            activeLayers.fuel ? 'bg-amber-600 text-white border border-amber-400' : 'bg-white/90 text-slate-700 border border-slate-200'
          }`}
        >
          <span>⛽ Fuel</span>
        </button>
      </div>

      {/* Top-Right Recenter Button Matching Reference Screenshot 2 */}
      <button
        onClick={() => setRecenterCount(c => c + 1)}
        className="absolute top-3 right-3 z-[400] px-4 py-1.5 rounded-full bg-white text-[#3E1627] font-bold text-xs shadow-md border border-[#E0D0C9] hover:bg-slate-50 transition-all flex items-center gap-1.5"
      >
        <Compass className="w-3.5 h-3.5 text-[#A3526B]" />
        <span>Recenter</span>
      </button>

      {/* Main Map Container */}
      <MapContainer
        center={originCoords || [28.6653, 77.2324]}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Esri World Street Map Tiles (Zero Watermark Vector Google Map Look) */}
        <TileLayer 
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" 
        />

        <ZoomControls />
        <MapRecenterController coords={selectedRoute.coordinates} triggerRecenter={recenterCount} />

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
                <span className="text-xs font-bold text-[#C2414C] block">Pickup Location (A)</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Green Dot Marker */}
        {destCoords && (
          <Marker position={destCoords} icon={destDotIcon}>
            <Popup>
              <div className="p-1 font-sans text-center">
                <span className="text-xs font-bold text-[#1E6B45] block">Destination Location (B)</span>
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

        {/* Optional Nearby Support Place Markers */}
        {mockNearbyPlaces.map((place, idx) => {
          if (!activeLayers[place.type]) return null;
          return (
            <Marker key={idx} position={[place.lat, place.lng]} icon={getNearbyLayerIcon(place.type)}>
              <Popup>
                <div className="p-1.5 font-sans">
                  <span className="text-xs font-bold text-slate-800 block">{place.title}</span>
                  <span className="text-[10px] text-blue-700 font-bold capitalize mt-0.5 block">
                    Verified Support Facility
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Google Watermark in Lower Left Corner */}
      <div className="absolute bottom-2 left-3 z-[400] pointer-events-none opacity-80">
        <span className="text-[11px] font-black tracking-tighter font-sans text-slate-600 bg-white/70 px-2 py-0.5 rounded backdrop-blur-xs">
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
