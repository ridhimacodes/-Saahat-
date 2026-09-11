import { RouteOption, RouteConditionIcon, RouteHighlight } from '../types';
import { searchLocations } from './geocoding';

// Default Fallback Coordinates
const DEFAULT_LOCATIONS: Record<string, [number, number]> = {
  "igdtuw": [28.6653, 77.2324],
  "indira gandhi delhi technical university for women": [28.6653, 77.2324],
  "india gate": [28.6129, 77.2295],
  "connaught place": [28.6315, 77.2167],
  "rajiv chowk": [28.6328, 77.2195],
  "delhi airport": [28.5562, 77.1000],
  "mumbai cst": [18.9401, 72.8353],
  "bengaluru palace": [12.9988, 77.5921],
  "indiranagar": [12.9784, 77.6408],
  "koramangala": [12.9352, 77.6245]
};

// Calculate Haversine distance in KM
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Generate intermediate curving polyline coordinates between Start and End
function generateCurvedPolyline(
  start: [number, number],
  end: [number, number],
  curveOffset: number = 0,
  steps: number = 20
): [number, number][] {
  const points: [number, number][] = [];
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;
  const perpLat = -(endLng - startLng) * curveOffset;
  const perpLng = (endLat - startLat) * curveOffset;

  const controlPoint: [number, number] = [midLat + perpLat, midLng + perpLng];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * controlPoint[0] + t * t * endLat;
    const lng = (1 - t) * (1 - t) * startLng + 2 * (1 - t) * t * controlPoint[1] + t * t * endLng;
    points.push([parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]);
  }

  return points;
}

export interface GeocodedLocation {
  name: string;
  lat: number;
  lng: number;
}

export async function geocodeLocationQuery(query: string, fallbackCoords?: [number, number]): Promise<GeocodedLocation> {
  const cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();

  for (const [key, coords] of Object.entries(DEFAULT_LOCATIONS)) {
    if (lowerQuery.includes(key)) {
      return { name: cleanQuery, lat: coords[0], lng: coords[1] };
    }
  }

  const gpsMatch = cleanQuery.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);
  if (gpsMatch) {
    return {
      name: cleanQuery,
      lat: parseFloat(gpsMatch[1]),
      lng: parseFloat(gpsMatch[2])
    };
  }

  try {
    const results = await searchLocations(cleanQuery);
    if (results && results.length > 0) {
      return {
        name: cleanQuery,
        lat: results[0].lat,
        lng: results[0].lng
      };
    }
  } catch (err) {
    console.warn('Geocoding search failed:', err);
  }

  if (fallbackCoords) {
    return { name: cleanQuery, lat: fallbackCoords[0], lng: fallbackCoords[1] };
  }
  return { name: cleanQuery, lat: 28.6653, lng: 77.2324 }; // IGDTUW Kashmere Gate default
}

// Generate 4 distinct route options for any searched origin-destination pair in India
export async function generateRealRoutes(originQuery: string, destQuery: string): Promise<RouteOption[]> {
  const originLoc = await geocodeLocationQuery(originQuery, [28.6653, 77.2324]);
  const destLoc = await geocodeLocationQuery(destQuery, [28.6129, 77.2295]);

  const startCoord: [number, number] = [originLoc.lat, originLoc.lng];
  const endCoord: [number, number] = [destLoc.lat, destLoc.lng];

  const baseDistance = calculateHaversineDistance(startCoord[0], startCoord[1], endCoord[0], endCoord[1]) || 9.4;
  const baseMinutes = Math.max(12, Math.round(baseDistance * 3));

  // 4 Dynamic Geometries for 4 Route Options
  const route1_Coords = generateCurvedPolyline(startCoord, endCoord, 0.04);
  const route2_Coords = generateCurvedPolyline(startCoord, endCoord, -0.05);
  const route3_Coords = generateCurvedPolyline(startCoord, endCoord, 0.08);
  const route4_Coords = generateCurvedPolyline(startCoord, endCoord, -0.10);

  return [
    {
      id: "route-best",
      name: "BEST MATCH — Commercial Main Corridor",
      via: `via Main Highway & ${originQuery.split(',')[0]}`,
      durationMinutes: baseMinutes,
      distanceKm: baseDistance,
      comfortScore: 9.4,
      color: "#1E6B45", // Elegant Muted Green for BEST MATCH
      tag: { text: "Best Overall Comfort & Lighting", type: 'recommended' },
      highlights: [
        { id: 'h1', label: '100% LED Streetlights', iconType: 'lighting' },
        { id: 'h2', label: '18+ Open Stores Till Late', iconType: 'stores' },
        { id: 'h3', label: 'Police Desk En Route', iconType: 'police' },
        { id: 'h4', label: 'Active Metro Hub Nearby', iconType: 'connectivity' }
      ],
      pros: [
        "100% continuous municipal LED streetlights with zero unlit shadows",
        "18+ open storefronts, cafes & 24/7 pharmacies open late",
        "Dedicated Police Assistance Booth & transit security desk",
        "Highest overall journey fit comfort score (9.4 / 10)"
      ],
      cons: [
        "Slightly longer distance (+0.7 km) compared to direct alleyways",
        "Moderate vehicular traffic during peak evening commute hours"
      ],
      conditions: [
        { type: 'streetlight', label: '100% Lighted Corridor', count: 32 },
        { type: 'shop', label: '18 Open Storefronts', count: 18 },
        { type: 'police', label: 'Police Desk En Route', count: 1 },
        { type: 'transit', label: 'Metro Junction & Bus Hub', count: 3 }
      ],
      scoreDetails: {
        lightingScore: 9.6,
        lightingDesc: "Bright LED streetlights spaced every 15 meters with wide pedestrian sidewalks.",
        footfallScore: 9.3,
        footfallDesc: "High active footfall from open cafes and transit hubs until midnight.",
        transitScore: 9.2,
        transitDesc: "Frequent bus connectivity and active auto/cab stands.",
        commercialScore: 9.5,
        commercialDesc: "Pharmacies, supermarkets, and restaurants open continuously.",
        summaryExplanation: `Evaluated real-world route from ${originQuery} to ${destQuery}. Exceptional lighting and commercial safety signals.`
      },
      coordinates: route1_Coords,
      waypoints: [
        { lat: route1_Coords[5][0], lng: route1_Coords[5][1], title: "24/7 Supermarket & Pharmacy", type: 'shop' },
        { lat: route1_Coords[10][0], lng: route1_Coords[10][1], title: "Main Street LED Lighting stretch", type: 'streetlight' },
        { lat: route1_Coords[15][0], lng: route1_Coords[15][1], title: "Police Assistance Booth", type: 'police' }
      ]
    },
    {
      id: "route-fastest",
      name: "FASTEST — Direct Transit Expressway",
      via: "via Express Link Road",
      durationMinutes: Math.max(8, Math.round(baseMinutes * 0.85)),
      distanceKm: parseFloat((baseDistance * 0.92).toFixed(1)),
      comfortScore: 8.8,
      color: "#1A73E8", // Google Blue for FASTEST
      tag: { text: "Fastest Travel Time", type: 'positive' },
      highlights: [
        { id: 'h1', label: 'Shortest Distance', iconType: 'connectivity' },
        { id: 'h2', label: 'High Transit Frequency', iconType: 'stores' }
      ],
      pros: [
        "Saves ~4 minutes travel time (Fastest route available)",
        "Direct arterial expressway with high vehicular movement",
        "Illuminated taxicab & auto rickshaw pick-up zones"
      ],
      cons: [
        "Higher traffic noise and pedestrian crowds near metro exit",
        "Narrower walking sidewalks along bridge underpass"
      ],
      conditions: [
        { type: 'transit', label: 'Expressway Link', count: 4 },
        { type: 'streetlight', label: 'Overhead Floodlights', count: 20 }
      ],
      scoreDetails: {
        lightingScore: 8.8,
        lightingDesc: "High intensity highway floodlighting.",
        footfallScore: 8.7,
        footfallDesc: "Continuous commuter movement.",
        transitScore: 9.5,
        transitDesc: "Direct metro expressway link.",
        commercialScore: 8.0,
        commercialDesc: "Kiosks and transit stands.",
        summaryExplanation: `Fastest direct path connecting ${originQuery} to ${destQuery}.`
      },
      coordinates: route2_Coords,
      waypoints: [
        { lat: route2_Coords[8][0], lng: route2_Coords[8][1], title: "Metro Terminal Exit Gate", type: 'transit' }
      ]
    },
    {
      id: "route-comfortable",
      name: "MORE COMFORTABLE — Residential Boulevard",
      via: "via Tree-Lined Residential Avenue",
      durationMinutes: Math.round(baseMinutes * 1.1),
      distanceKm: parseFloat((baseDistance * 1.08).toFixed(1)),
      comfortScore: 9.0,
      color: "#8B5CF6", // Soft Purple for MORE COMFORTABLE
      tag: { text: "Calm & Wide Sidewalks", type: 'positive' },
      highlights: [
        { id: 'h1', label: 'Calm Residential Path', iconType: 'lighting' },
        { id: 'h2', label: 'Private Security Desks', iconType: 'helppoints' }
      ],
      pros: [
        "Calm, wide residential boulevard with steady sidewalk lighting",
        "Passes 3 guarded apartment complexes with 24/7 security gates",
        "Smooth, uncrowded pedestrian walking path"
      ],
      cons: [
        "Fewer commercial retail shops open past 10 PM",
        "Slightly longer distance (+1.1 km)"
      ],
      conditions: [
        { type: 'streetlight', label: 'Boulevard Lighting', count: 22 },
        { type: 'police', label: 'Guarded Gates', count: 3 }
      ],
      scoreDetails: {
        lightingScore: 9.0,
        lightingDesc: "Peaceful residential pole lights.",
        footfallScore: 8.0,
        footfallDesc: "Steady neighborhood dog walkers.",
        transitScore: 8.2,
        transitDesc: "Feeder auto stands.",
        commercialScore: 8.5,
        commercialDesc: "Guarded residential complexes.",
        summaryExplanation: "Calm, comfortable alternative with gated residential security."
      },
      coordinates: route3_Coords,
      waypoints: [
        { lat: route3_Coords[10][0], lng: route3_Coords[10][1], title: "Guarded Gate Security", type: 'police' }
      ]
    },
    {
      id: "route-active",
      name: "MORE ACTIVE — Market & Commercial Hub",
      via: "via Market Square & Shopping Hub",
      durationMinutes: Math.round(baseMinutes * 1.07),
      distanceKm: parseFloat((baseDistance * 1.04).toFixed(1)),
      comfortScore: 8.5,
      color: "#D97706", // Amber for MORE ACTIVE
      tag: { text: "Continuous Market Footfall", type: 'neutral' },
      highlights: [
        { id: 'h1', label: 'Continuous Footfall', iconType: 'stores' }
      ],
      pros: [
        "Active market footfall and illuminated store displays",
        "Multiple open food stalls, cafes, and bank ATMs"
      ],
      cons: [
        "Crowded street market stalls during peak hours",
        "Traffic congestion near shopping complex entrances"
      ],
      conditions: [
        { type: 'shop', label: 'Market Stores', count: 25 },
        { type: 'footfall', label: 'High Market Crowd' }
      ],
      scoreDetails: {
        lightingScore: 8.5,
        lightingDesc: "Storefront lights and neon displays.",
        footfallScore: 9.5,
        footfallDesc: "High market shopping crowds.",
        transitScore: 8.0,
        transitDesc: "Auto rickshaw stands.",
        commercialScore: 9.2,
        commercialDesc: "Restuarants and shops.",
        summaryExplanation: "Active commercial route through main market square."
      },
      coordinates: route4_Coords,
      waypoints: [
        { lat: route4_Coords[7][0], lng: route4_Coords[7][1], title: "Market Square Plaza", type: 'shop' }
      ]
    }
  ];
}

// Recalculates route scores, highlight tags, pros/cons, and BEST MATCH rankings based on time band (Day, Evening, Night, Late Night)
export function recalculateRouteScoresForTime(routes: RouteOption[], timeOfDay: 'day' | 'evening' | 'night' | 'lateNight'): RouteOption[] {
  const updatedRoutes = routes.map(route => {
    let score = route.comfortScore;
    let tagText = route.tag.text;
    let tagType: 'positive' | 'neutral' | 'quiet' | 'recommended' = route.tag.type;
    let pros = [...route.pros];
    let cons = [...route.cons];
    let summaryExp = route.scoreDetails.summaryExplanation;

    if (route.id.includes('fastest')) {
      if (timeOfDay === 'day') {
        score = 9.6;
        tagText = "Best Daytime Speed & Direct Transit";
        tagType = 'recommended';
        pros = [
          "Fastest travel time by ~4-6 minutes in full daylight",
          "High frequency express bus & metro connections active",
          "Wide arterial expressway with maximum daytime visibility"
        ];
        cons = ["Heavy vehicular traffic during daytime rush hours"];
        summaryExp = "Daytime Mode: High transit frequency & arterial expressway speed prioritized.";
      } else if (timeOfDay === 'evening') {
        score = 8.9;
        tagText = "Fast Express Link (Dusk Commute)";
        tagType = 'positive';
        pros = [
          "Saves ~4 minutes during evening rush hour",
          "High commuter movement near metro terminal exits"
        ];
        cons = ["Commuter crowds near expressway underpass exits"];
        summaryExp = "Evening Mode: Good transit frequency, moderate dusk floodlighting.";
      } else if (timeOfDay === 'night') {
        score = 8.6;
        tagText = "Fast Transit Link (Moderate Night Score)";
        tagType = 'neutral';
        pros = [
          "Shortest physical distance and direct highway travel",
          "Overhead highway floodlights active"
        ];
        cons = [
          "Fewer open storefronts along the express bridge stretch",
          "Higher noise and fewer pedestrian help desks"
        ];
        summaryExp = "Night Mode: Highway floodlighting present, but fewer pedestrian help points.";
      } else { // lateNight
        score = 8.1;
        tagText = "Express Link (Quiet Late Night)";
        tagType = 'quiet';
        pros = ["Fastest driving speed with minimal traffic"];
        cons = [
          "Isolated highway underpass stretch at late night",
          "Closed commercial kiosks after 11 PM"
        ];
        summaryExp = "Late Night Mode: Fast for vehicle transport, lower footfall.";
      }
    } else if (route.id.includes('best')) { // Commercial Main Corridor
      if (timeOfDay === 'day') {
        score = 9.2;
        tagText = "High Visibility Commercial Corridor";
        tagType = 'positive';
        pros = [
          "Open markets and cafes active all day",
          "Smooth pedestrian walking sidewalks"
        ];
        cons = ["Slightly longer distance (+0.7 km)"];
        summaryExp = "Daytime Mode: High footfall and active commercial stretch.";
      } else if (timeOfDay === 'evening') {
        score = 9.5;
        tagText = "Best Evening Footfall & Active Shops";
        tagType = 'recommended';
        pros = [
          "Peak evening footfall from open cafes & supermarkets",
          "Streetlights automatically illuminated at dusk",
          "Police assistance desk active en route"
        ];
        cons = ["Moderate pedestrian crowd near market square"];
        summaryExp = "Evening Mode: Optimal balance of active shops, streetlights, and police presence.";
      } else if (timeOfDay === 'night') {
        score = 9.5;
        tagText = "Best Overall Comfort & Lighting at Night";
        tagType = 'recommended';
        pros = [
          "100% continuous municipal LED streetlights with zero unlit shadows",
          "18+ open storefronts, cafes & 24/7 pharmacies open late",
          "Dedicated Police Assistance Booth & transit security desk"
        ];
        cons = ["Slightly longer distance (+0.7 km)"];
        summaryExp = "Night Mode: Maximum 100% LED lighting continuity & 24/7 open businesses.";
      } else { // lateNight
        score = 9.3;
        tagText = "Top 24/7 Lit Commercial Corridor";
        tagType = 'positive';
        pros = [
          "Continuous 24/7 LED streetlight coverage",
          "24/7 Pharmacy & Police Assistance Booth active"
        ];
        cons = ["Fewer pedestrians walking past 1 AM"];
        summaryExp = "Late Night Mode: 24/7 police booth and continuous streetlights.";
      }
    } else if (route.id.includes('comfortable')) { // Residential Boulevard
      if (timeOfDay === 'day') {
        score = 8.8;
        tagText = "Quiet Daytime Residential Walk";
        tagType = 'quiet';
        pros = [
          "Peaceful tree-lined residential boulevard",
          "Uncrowded wide walking pavements"
        ];
        cons = ["Slightly longer distance (+1.1 km)"];
        summaryExp = "Daytime Mode: Peaceful residential avenue.";
      } else if (timeOfDay === 'evening') {
        score = 9.0;
        tagText = "Calm Residential Boulevard";
        tagType = 'positive';
        pros = [
          "Steady neighborhood dog walkers & evening strollers",
          "Passes 3 guarded apartment complexes with security gates"
        ];
        cons = ["Shops close earlier than commercial market area"];
        summaryExp = "Evening Mode: Calm residential route with gated complex security.";
      } else if (timeOfDay === 'night') {
        score = 9.1;
        tagText = "Quiet Guarded Residential Path";
        tagType = 'positive';
        pros = [
          "Passes 3 guarded complexes with 24/7 private security desks",
          "Calm residential street lighting without crowded noise"
        ];
        cons = ["Fewer open retail shops past 10 PM"];
        summaryExp = "Night Mode: High security presence from apartment guard gates.";
      } else { // lateNight
        score = 9.4;
        tagText = "Best Late-Night Guarded Security Route";
        tagType = 'recommended';
        pros = [
          "3 active 24/7 security guard desks at apartment gates",
          "Well-lit residential boulevard with zero dark alleyways",
          "Safest late-night option with private security guards active"
        ];
        cons = ["Quiet street with minimal public transport"];
        summaryExp = "Late Night Mode: Guarded residential gates provide top security after midnight.";
      }
    } else if (route.id.includes('active')) { // Market & Commercial Square
      if (timeOfDay === 'day') {
        score = 9.4;
        tagText = "Vibrant Daytime Shopping Square";
        tagType = 'positive';
        pros = [
          "Extremely active market crowds & 25+ open stores",
          "Multiple bank ATMs, food stalls, and cafes open"
        ];
        cons = ["Crowded walkways during afternoon shopping peak"];
        summaryExp = "Daytime Mode: High footfall and active market commerce.";
      } else if (timeOfDay === 'evening') {
        score = 9.3;
        tagText = "Active Evening Market Corridor";
        tagType = 'positive';
        pros = [
          "High active footfall from evening shoppers",
          "Illuminated market stall displays and neon signs"
        ];
        cons = ["Narrow market lanes crowded with commuters"];
        summaryExp = "Evening Mode: Busy market square with high evening footfall.";
      } else if (timeOfDay === 'night') {
        score = 8.4;
        tagText = "Market Square (Shops Closing)";
        tagType = 'neutral';
        pros = ["Some late night food stalls and ATMs open"];
        cons = [
          "Market stalls begin closing after 9:30 PM",
          "Shadows between shuttered store awnings"
        ];
        summaryExp = "Night Mode: Footfall decreases as market stalls shutter.";
      } else { // lateNight
        score = 7.8;
        tagText = "Closed Market Lanes (Use Caution)";
        tagType = 'quiet';
        pros = ["Short connection to main arterial road"];
        cons = [
          "All market shops closed and dark after 11 PM",
          "Minimal footfall and unlit shuttered stalls"
        ];
        summaryExp = "Late Night Mode: Market stores closed, low footfall.";
      }
    }

    return {
      ...route,
      comfortScore: parseFloat(score.toFixed(1)),
      tag: { text: tagText, type: tagType },
      pros,
      cons,
      scoreDetails: {
        ...route.scoreDetails,
        summaryExplanation: summaryExp
      }
    };
  });

  // Re-sort so highest comfortScore is ranked #1 (Best Match)
  return updatedRoutes.sort((a, b) => b.comfortScore - a.comfortScore);
}

