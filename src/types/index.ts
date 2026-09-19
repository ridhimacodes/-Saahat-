export type PageType = 'home' | 'search' | 'results' | 'share' | 'community' | 'about' | 'lowsignal' | 'journey';

export type TimeOfDay = 'day' | 'evening' | 'night' | 'lateNight';

export type TravelMode = 'CAB' | 'WALKING' | 'TRANSIT' | 'TWO_WHEELER';

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

export type SafetySignalCategory = 
  | 'Poor lighting' 
  | 'Isolated area' 
  | 'Road obstruction' 
  | 'Heavy crowd' 
  | 'Other safety concerns'
  | 'Streetlights' 
  | 'Footfall' 
  | 'Transit & Stations' 
  | 'General';

export interface CommunityNote {
  id: string;
  author: string;
  category: SafetySignalCategory | string;
  location: string;
  text: string;
  timestamp: string;
  photoUrl?: string;
  upvotes: number;
  verified: boolean;
  coordinates?: [number, number];
}

export interface SafePlace {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'pharmacy' | 'metro' | 'public_place';
  lat: number;
  lng: number;
  address?: string;
  distanceKm?: number;
  openStatus?: string;
  phone?: string;
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

// ---------------------------------------------------------------------------
// Active Check-In & ETA Extension Types
// ---------------------------------------------------------------------------

export type CheckInStatus = 
  | 'pending'
  | 'safe_delayed'
  | 'safe_low_signal'
  | 'help_requested'
  | 'no_response'
  | 'arrived_safely';

export type CheckInChannel = 'whatsapp' | 'sms';

export interface CheckInStatusEvent {
  status: CheckInStatus;
  timestamp: number;
  timestampFormatted: string;
  channel?: CheckInChannel;
  note?: string;
}

export interface ActiveCheckInJourney {
  id: string;
  recipientName: string;
  recipientPhone: string;
  routeName: string;
  durationMinutes: number;
  expectedArrivalTime: string;
  targetTimestamp: number;
  customArrivalMessage?: string;
  customMessageReleased: boolean;
  checkinStatus: CheckInStatus;
  newCheckinTime?: string;
  channelUsed: CheckInChannel;
  statusHistory: CheckInStatusEvent[];
  escalationTier: number; // 0: None, 1: Nudge, 2: SMS Fallback, 3: Emergency Escalation
  lastKnownLocation?: {
    lat: number;
    lng: number;
    mapsLink: string;
    text: string;
  };
  backstopTimestamp?: number;
}
