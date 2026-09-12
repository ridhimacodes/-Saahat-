import { RouteOption } from '../types';

export interface SavedJourney {
  id: string;
  savedAt: string;
  origin: string;
  destination: string;
  route: RouteOption;
  instructions: string[];
  helpPoints: { name: string; type: string; phone: string; distance: string }[];
  storageSizeMb: string;
}

const SAVED_JOURNEYS_KEY = 'saahat_saved_journeys';
const ACTIVE_SAVED_JOURNEY_KEY = 'saahat_saved_journey';

export const estimateStorageSize = (route: RouteOption): string => {
  const coordsCount = route.coordinates?.length || 20;
  const baseSize = 1.6 + (coordsCount * 0.04);
  return `${baseSize.toFixed(1)} MB saved`;
};

export const saveJourneyLocally = (
  origin: string,
  destination: string,
  route: RouteOption
): SavedJourney => {
  const instructions = route.offlineSteps || [
    `Start from ${origin.split(',')[0]} heading along ${route.via}`,
    `Pass well-lit commercial strip with open stores and CCTV coverage`,
    `Continue straight for 400m through active pedestrian zone`,
    `Arrive safely at ${destination.split(',')[0]}`
  ];

  const helpPoints = [
    { name: `${route.name.split('—')[0]} Police Booth`, type: 'Police', phone: '100 / 112', distance: '0.4 km' },
    { name: 'City Emergency Healthcare Center', type: 'Hospital', phone: '+91 11 2305 1200', distance: '0.9 km' },
    { name: '24/7 Chemist & Convenience Store', type: '24/7 Store', phone: '+91 98765 43210', distance: '0.2 km' },
    { name: 'Metro Terminal Security Desk', type: 'Transit Station', phone: '155370', distance: '0.6 km' }
  ];

  const storageSizeMb = estimateStorageSize(route);

  const savedJourney: SavedJourney = {
    id: route.id,
    savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    origin: origin || 'Selected Origin',
    destination: destination || 'Selected Destination',
    route,
    instructions,
    helpPoints,
    storageSizeMb
  };

  try {
    const existing = getSavedJourneysLocally();
    const filtered = existing.filter(j => j.id !== route.id);
    const updated = [savedJourney, ...filtered];
    localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(updated));
    localStorage.setItem(ACTIVE_SAVED_JOURNEY_KEY, JSON.stringify(savedJourney));
  } catch (err) {
    console.warn('LocalStorage error when saving journey:', err);
  }

  return savedJourney;
};

export const getSavedJourneysLocally = (): SavedJourney[] => {
  try {
    const raw = localStorage.getItem(SAVED_JOURNEYS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const singleRaw = localStorage.getItem(ACTIVE_SAVED_JOURNEY_KEY);
    return singleRaw ? [JSON.parse(singleRaw)] : [];
  } catch (err) {
    return [];
  }
};

export const getSavedJourneyLocally = (): SavedJourney | null => {
  const all = getSavedJourneysLocally();
  return all.length > 0 ? all[0] : null;
};

export const isRouteDownloaded = (routeId: string): boolean => {
  const journeys = getSavedJourneysLocally();
  return journeys.some(j => j.id === routeId);
};

export const deleteSavedJourneyLocally = (routeId: string): void => {
  try {
    const existing = getSavedJourneysLocally();
    const updated = existing.filter(j => j.id !== routeId);
    localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('LocalStorage deletion error:', err);
  }
};
