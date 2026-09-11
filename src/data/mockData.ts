import { RouteOption, TrustedContact, CommunityNote, UserProfile, OfflineHelpPoint } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: "Maya Sharma",
  avatarUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%236C2BD9'/><circle cx='50' cy='38' r='20' fill='%23FDF4F8'/><path d='M20,90 Q50,60 80,90 Z' fill='%23FDF4F8'/><path d='M32,32 Q50,15 68,32 Q62,20 38,20 Z' fill='%23FF4D8D'/></svg>",
  savedLocations: [
    { label: "Home", address: "Greenwood Apartments, Sector 4" },
    { label: "Work", address: "Innovate Tech Hub, 5th Avenue" },
    { label: "University", address: "City Central Campus Library" }
  ]
};

export const PRESET_AVATARS = [
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%236C2BD9'/><circle cx='50' cy='38' r='20' fill='%23FDF4F8'/><path d='M20,90 Q50,60 80,90 Z' fill='%23FDF4F8'/><path d='M32,32 Q50,15 68,32 Q62,20 38,20 Z' fill='%23FF4D8D'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FF4D8D'/><circle cx='50' cy='38' r='20' fill='%23FFFFFF'/><path d='M18,90 Q50,58 82,90 Z' fill='%23FFFFFF'/><path d='M28,34 Q50,12 72,34 Q65,18 35,18 Z' fill='%236C2BD9'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2300C2A8'/><circle cx='50' cy='38' r='20' fill='%23FDF4F8'/><path d='M20,90 Q50,60 80,90 Z' fill='%23FDF4F8'/><path d='M30,35 Q50,15 70,35 Q60,22 40,22 Z' fill='%231E1B4B'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%234C1D95'/><circle cx='50' cy='38' r='20' fill='%23FCE7F3'/><path d='M18,90 Q50,58 82,90 Z' fill='%23FCE7F3'/><path d='M28,32 Q50,14 72,32 Q62,18 38,18 Z' fill='%23F43F5E'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23A855F7'/><circle cx='50' cy='38' r='20' fill='%23FFFFFF'/><path d='M20,90 Q50,60 80,90 Z' fill='%23FFFFFF'/><path d='M32,32 Q50,16 68,32 Q58,20 42,20 Z' fill='%2300C2A8'/></svg>"
];

export const POPULAR_LOCATIONS = [
  "Central Metro Station & Transit Hub",
  "City Central Campus Library",
  "Innovate Tech Hub (5th Avenue)",
  "Greenwood Apartments, Sector 4",
  "Grand Square Mall & Market",
  "Riverside Public Park Gate 2"
];

export const TRUSTED_CONTACTS: TrustedContact[] = [
  { id: '1', name: 'Mom (Anjali)', phone: '+1 (555) 234-5678', relationship: 'Family', avatarBg: 'bg-purple-500' },
  { id: '2', name: 'Sara (Roommate)', phone: '+1 (555) 987-6543', relationship: 'Roommate', avatarBg: 'bg-pink-500' },
  { id: '3', name: 'Priya (Sister)', phone: '+1 (555) 456-7890', relationship: 'Family', avatarBg: 'bg-teal-500' },
  { id: '4', name: 'Elena (Colleague)', phone: '+1 (555) 321-7654', relationship: 'Friend', avatarBg: 'bg-amber-500' },
];

export const OFFLINE_HELP_POINTS: OfflineHelpPoint[] = [
  {
    id: 'hp-1',
    name: 'Sector 15 Main Police Station',
    type: 'Police',
    distance: '0.8 km away',
    address: '102 Civil Lines, Sector 15',
    phone: '911 / 112',
    open247: true
  },
  {
    id: 'hp-2',
    name: 'St. Jude Community Hospital',
    type: 'Hospital',
    distance: '1.1 km away',
    address: '45 Health Avenue',
    phone: '+1 (555) 911-0000',
    open247: true
  },
  {
    id: 'hp-3',
    name: '24/7 Apex Supermarket & Pharmacy',
    type: '24/7 Store',
    distance: '0.3 km away',
    address: 'Commercial Hub Exit 3',
    phone: '+1 (555) 432-1000',
    open247: true
  },
  {
    id: 'hp-4',
    name: 'Central Metro Security Desk',
    type: 'Transit Station',
    distance: '0.4 km away',
    address: 'Underground Concourse Gate 1',
    phone: '+1 (555) 888-2200',
    open247: true
  }
];

export const MOCK_ROUTES: Record<string, RouteOption[]> = {
  default: [
    {
      id: 'route-a',
      name: 'Route A — Best Match (Commercial Main Road)',
      via: 'Commercial Main Road & 4th Cross',
      durationMinutes: 18,
      distanceKm: 1.2,
      comfortScore: 9.4,
      color: '#6C2BD9', // Primary Purple for Best Match
      tag: {
        text: 'Well-lit, busy till 10 PM',
        type: 'recommended'
      },
      highlights: [
        { id: 'h1', label: 'Well-lit stretches', iconType: 'lighting' },
        { id: 'h2', label: 'Active storefronts nearby', iconType: 'stores' },
        { id: 'h3', label: 'Police station en route', iconType: 'police' },
        { id: 'h4', label: 'Good connectivity throughout', iconType: 'connectivity' },
        { id: 'h5', label: 'Help points nearby', iconType: 'helppoints' }
      ],
      pros: [
        '100% continuous LED streetlights with zero unlit shadows',
        '18+ active storefronts, cafes & 24/7 pharmacies open late',
        'Dedicated Police Assistance Booth en route at Sector 15',
        '2 illuminated bus stops with live arrival screens'
      ],
      cons: [
        '300m longer than the shortest path (1.2 km vs 0.9 km)',
        'Slightly higher vehicular traffic at 4th Cross junction'
      ],
      offlineSteps: [
        'Exit Metro Gate 2 → Walk straight on Commercial Main Road for 300m',
        'Pass Sector 15 Police Post on your left',
        'Pass 24/7 Corner Bakery on your right (brightly lit sidewalk)',
        'At 4th Cross Street, turn right at the illuminated bus shelter',
        'Continue straight past Greenwood Plaza for 400m → Arrive at Greenwood Apartments Gate 1'
      ],
      conditions: [
        { type: 'streetlight', label: 'Continuous LED Streetlights', count: 24 },
        { type: 'shop', label: 'Open Cafes & Pharmacies', count: 8 },
        { type: 'transit', label: '2 Active Bus Stops', count: 2 },
        { type: 'police', label: 'Police Desk En Route', count: 1 }
      ],
      scoreDetails: {
        lightingScore: 9.5,
        lightingDesc: 'Newly upgraded dual LED streetlights along the full 1.2 km stretch with zero unlit shadows.',
        footfallScore: 9.2,
        footfallDesc: 'High evening footfall driven by outdoor dining, grocery outlets, and active fitness groups.',
        transitScore: 9.0,
        transitDesc: 'Passes 2 illuminated bus shelters with real-time transit display screens.',
        commercialScore: 9.8,
        commercialDesc: 'Active commercial storefronts open past midnight including 24/7 chemist and bakery.',
        summaryExplanation: 'This route scores highest for overall visibility and ambient street presence. Continuous shopfront lighting, police desk, and frequent bus stops make it active and well-frequented.'
      },
      coordinates: [
        [40.7128, -74.0060],
        [40.7135, -74.0045],
        [40.7148, -74.0030],
        [40.7160, -74.0015],
        [40.7172, -74.0005]
      ],
      waypoints: [
        { lat: 40.7135, lng: -74.0045, title: 'Sector 15 Police Post (0.4km)', type: 'police' },
        { lat: 40.7148, lng: -74.0030, title: '24/7 Corner Bakery & Pharmacy', type: 'shop' },
        { lat: 40.7160, lng: -74.0015, title: 'Illuminated Main Street Bus Hub', type: 'transit' }
      ]
    },
    {
      id: 'route-b',
      name: 'Route B — Comfort Route (Parkside Avenue)',
      via: 'Parkside Avenue (Comfort Shortcut)',
      durationMinutes: 14,
      distanceKm: 0.9,
      comfortScore: 8.4,
      color: '#00C2A8', // Teal for Comfort Route
      tag: {
        text: 'Quieter after dark, wide sidewalks',
        type: 'positive'
      },
      highlights: [
        { id: 'h1', label: 'Well-lit stretches', iconType: 'lighting' },
        { id: 'h2', label: 'Good connectivity throughout', iconType: 'connectivity' },
        { id: 'h5', label: 'Help points nearby', iconType: 'helppoints' }
      ],
      pros: [
        'Direct & quiet shortcut saving ~4 minutes walk time',
        'Wide tree-lined residential sidewalks with good visibility',
        'Active apartment security gate guards along 6th Lane'
      ],
      cons: [
        'Lower commercial shop activity after 10 PM',
        'Fewer bus stops compared to main commercial boulevard'
      ],
      offlineSteps: [
        'Head North onto Parkside Avenue → Walk 250m',
        'Pass Park Entrance Gate (illuminated sidewalk)',
        'Turn right onto 6th Residential Lane → Walk 350m',
        'Arrive at Greenwood Apartments Rear Gate'
      ],
      conditions: [
        { type: 'streetlight', label: 'Standard LED Streetlights', count: 18 },
        { type: 'shop', label: 'Convenience Store', count: 3 },
        { type: 'footfall', label: 'Calm Residential Footfall' }
      ],
      scoreDetails: {
        lightingScore: 8.2,
        lightingDesc: 'Clear overhead lighting along wide residential sidewalks.',
        footfallScore: 7.8,
        footfallDesc: 'Calm residential street with steady evening dog walkers and neighborhood security.',
        transitScore: 8.0,
        transitDesc: 'One bus stop near the park entrance.',
        commercialScore: 7.5,
        commercialDesc: 'Quiet residential housing with 2 corner groceries closing at 10 PM.',
        summaryExplanation: 'A peaceful, direct 14-minute walk. Offers wide sidewalks and steady neighborhood lighting.'
      },
      coordinates: [
        [40.7128, -74.0060],
        [40.7138, -74.0075],
        [40.7155, -74.0065],
        [40.7172, -74.0005]
      ],
      waypoints: [
        { lat: 40.7138, lng: -74.0075, title: 'Parkside Streetlight Junction', type: 'streetlight' },
        { lat: 40.7155, lng: -74.0065, title: 'Corner Grocery Store', type: 'shop' }
      ]
    },
    {
      id: 'route-c',
      name: 'Route C — Fastest (Transit Corridor)',
      via: 'Metro Station Plaza & Boulevard',
      durationMinutes: 12,
      distanceKm: 0.8,
      comfortScore: 9.1,
      color: '#FFC857', // Gold / Amber for Fastest
      tag: {
        text: 'Near 24/7 metro plaza & taxi stand',
        type: 'positive'
      },
      highlights: [
        { id: 'h1', label: 'Well-lit stretches', iconType: 'lighting' },
        { id: 'h2', label: 'Active storefronts nearby', iconType: 'stores' },
        { id: 'h4', label: 'Good connectivity throughout', iconType: 'connectivity' },
        { id: 'h5', label: 'Help points nearby', iconType: 'helppoints' }
      ],
      pros: [
        'Fastest route (only 12 mins / 0.8 km distance)',
        'High-intensity flood lighting throughout Metro Plaza',
        'Continuous 24/7 commuter footfall & authorized taxi stand'
      ],
      cons: [
        'Higher noise and crowded pedestrian congestion near Metro exit',
        'Heavy vehicular traffic near taxicab pick-up zone'
      ],
      offlineSteps: [
        'Walk through Metro Main Concourse Plaza (24/7 security presence)',
        'Follow Metro Boulevard sidewalk past Taxi Rank → 500m',
        'Turn left at 24/7 Supermarket onto Sector 4 Link Road → 300m',
        'Arrive at Greenwood Apartments Gate 1'
      ],
      conditions: [
        { type: 'streetlight', label: 'High Intensity Flood Lighting', count: 30 },
        { type: 'shop', label: 'Late-Night Supermarket & Kiosks', count: 11 },
        { type: 'transit', label: 'Metro Station & Authorized Taxi Rank', count: 4 },
        { type: 'cctv', label: 'Municipal Smart City Lighting' }
      ],
      scoreDetails: {
        lightingScore: 9.8,
        lightingDesc: 'Bright floodlit transit plaza and wide unobstructed concrete pedestrian sidewalks.',
        footfallScore: 9.7,
        footfallDesc: 'Continuous commuter movement and active ride-hailing pick-up zones.',
        transitScore: 9.9,
        transitDesc: 'Directly follows the main transit line with 24/7 illuminated station concourses.',
        commercialScore: 9.1,
        commercialDesc: 'Multiple late-night food kiosks, coffee shops, and security desks.',
        summaryExplanation: 'Fastest 12-minute route with high infrastructure support: high-powered lighting, taxi stands, metro staff presence, and open stores.'
      },
      coordinates: [
        [40.7128, -74.0060],
        [40.7120, -74.0035],
        [40.7142, -74.0010],
        [40.7172, -74.0005]
      ],
      waypoints: [
        { lat: 40.7120, lng: -74.0035, title: 'Metro Concourse Security Gate', type: 'transit' },
        { lat: 40.7142, lng: -74.0010, title: '24/7 Taxi Plaza & Open Cafe', type: 'shop' }
      ]
    }
  ]
};

export const INITIAL_COMMUNITY_NOTES: CommunityNote[] = [
  {
    id: 'note-1',
    author: 'Anonymous Explorer',
    category: 'Streetlights',
    location: '4th Cross Street near Metro Gate 2',
    text: 'Municipal crew upgraded the streetlights here to bright dual LEDs yesterday! Great visibility along the sidewalk now.',
    timestamp: '2 hours ago',
    photoUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=500',
    upvotes: 24,
    verified: true
  },
  {
    id: 'note-2',
    author: 'Local Resident',
    category: 'Footfall',
    location: 'Grand Square Night Market',
    text: 'Night market food stalls are vibrant and open till 11:30 PM this week. Lots of families and students walking around.',
    timestamp: 'Yesterday at 9:15 PM',
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=500',
    upvotes: 18,
    verified: true
  },
  {
    id: 'note-3',
    author: 'Commuter Maya',
    category: 'Transit & Stations',
    location: 'Sector 4 Bus Shelter',
    text: 'New digital countdown screen installed at Sector 4 bus stop. Well-lit seating area with public Wi-Fi operational.',
    timestamp: '2 days ago',
    upvotes: 12,
    verified: true
  },
  {
    id: 'note-4',
    author: 'Anonymous',
    category: 'Streetlights',
    location: 'Parkside Ave North Alley',
    text: 'Constructors working on building facade — temporary light tower installed near park entrance.',
    timestamp: '3 days ago',
    upvotes: 9,
    verified: false
  }
];
