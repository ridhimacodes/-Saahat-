import { RouteOption } from '../types';

export interface SavedJourney {
  savedAt: string;
  origin: string;
  destination: string;
  route: RouteOption;
  instructions: string[];
  helpPoints: { name: string; type: string; phone: string; distance: string }[];
}

const SAVED_JOURNEY_KEY = 'sahaat_saved_journey';

export const saveJourneyLocally = (
  origin: string,
  destination: string,
  route: RouteOption
): SavedJourney => {
  const savedJourney: SavedJourney = {
    savedAt: new Date().toLocaleString(),
    origin,
    destination,
    route,
    instructions: route.offlineSteps || [
      `Start at ${origin}`,
      `Follow ${route.via}`,
      `Arrive at ${destination}`
    ],
    helpPoints: [
      { name: 'Sector 15 Main Police Station', type: 'Police', phone: '911', distance: '0.8 km' },
      { name: 'St. Jude Community Hospital', type: 'Hospital', phone: '+1 (555) 911-0000', distance: '1.1 km' },
      { name: '24/7 Apex Supermarket', type: '24/7 Store', phone: '+1 (555) 432-1000', distance: '0.3 km' }
    ]
  };

  try {
    localStorage.setItem(SAVED_JOURNEY_KEY, JSON.stringify(savedJourney));
  } catch (err) {
    console.warn('LocalStorage error when saving journey:', err);
  }

  return savedJourney;
};

export const getSavedJourneyLocally = (): SavedJourney | null => {
  try {
    const raw = localStorage.getItem(SAVED_JOURNEY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};
