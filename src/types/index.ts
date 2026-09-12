export type PageType = 'home' | 'search' | 'results' | 'share' | 'community' | 'about' | 'lowsignal' | 'journey';

export type TimeOfDay = 'day' | 'evening' | 'night' | 'lateNight';

export interface RouteConditionIcon {
  type: 'streetlight' | 'shop' | 'transit' | 'cctv' | 'footfall' | 'police';
  label: string;
  count?: number;
}

export interface RouteHighlight {
  id: string;
  label: string;
  iconType: 'lighting' | 'stores' | 'police' | 'connectivity' | 'helppoints';
}

export interface RouteScoreDetails {
  lightingScore: number; // 0 - 10
  lightingDesc: string;
  footfallScore: number; // 0 - 10
  footfallDesc: string;
  transitScore: number; // 0 - 10
  transitDesc: string;
  commercialScore: number; // 0 - 10
  commercialDesc: string;
  summaryExplanation: string;
}

export interface RouteOption {
  id: string;
  name: string;
  via: string;
  durationMinutes: number;
  distanceKm: number;
  comfortScore: number; // 0.0 - 10.0
  color: string; // Map line color
  tag: {
    text: string;
    type: 'positive' | 'neutral' | 'quiet' | 'recommended';
  };
  highlights: RouteHighlight[]; // Positive checklist highlights
  pros: string[]; // Explicit pros
  cons: string[]; // Explicit cons/drawbacks
  conditions: RouteConditionIcon[];
  scoreDetails: RouteScoreDetails;
  coordinates: [number, number][]; // Leaflet LatLng tuples
  waypoints: {
    lat: number;
    lng: number;
    title: string;
    type: 'streetlight' | 'shop' | 'transit' | 'police';
  }[];
  offlineSteps?: string[];
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  avatarBg: string;
}

export interface CommunityNote {
  id: string;
  author: string;
  category: 'Streetlights' | 'Footfall' | 'Transit & Stations' | 'General';
  location: string;
  text: string;
  timestamp: string;
  photoUrl?: string;
  upvotes: number;
  verified: boolean;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  savedLocations: { label: string; address: string }[];
}

export interface OfflineHelpPoint {
  id: string;
  name: string;
  type: 'Police' | 'Hospital' | '24/7 Store' | 'Transit Station';
  distance: string;
  address: string;
  phone: string;
  open247: boolean;
}
