export interface GeocodingResult {
  placeId: string;
  displayName: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
}

// Indian Landmark Dictionary with exact address details matching user search queries
const FAMOUS_INDIAN_PLACES: Record<string, GeocodingResult> = {
  "igdtuw": {
    placeId: "igdtuw-1",
    displayName: "Indira Gandhi Delhi Technical University for Women, Kashmere Gate, New Delhi",
    title: "Indira Gandhi Delhi Technical University for Women",
    address: "New Church Rd, James Church, Opp. St, Old Delhi, Kashmere Gate, New Delhi, Delhi, 110006, India",
    lat: 28.6653,
    lng: 77.2324
  },
  "indira gandhi delhi technical university for women": {
    placeId: "igdtuw-1",
    displayName: "Indira Gandhi Delhi Technical University for Women, Kashmere Gate, New Delhi",
    title: "Indira Gandhi Delhi Technical University for Women",
    address: "New Church Rd, James Church, Opp. St, Old Delhi, Kashmere Gate, New Delhi, Delhi, 110006, India",
    lat: 28.6653,
    lng: 77.2324
  },
  "india gate": {
    placeId: "india-gate-1",
    displayName: "India Gate, Rajpath, New Delhi",
    title: "India Gate",
    address: "India Gate, New Delhi, Delhi, India",
    lat: 28.6129,
    lng: 77.2295
  },
  "connaught place": {
    placeId: "cp-1",
    displayName: "Connaught Place, New Delhi",
    title: "Connaught Place",
    address: "Inner Circle, Connaught Place, New Delhi, Delhi 110001, India",
    lat: 28.6315,
    lng: 77.2167
  },
  "rajiv chowk": {
    placeId: "rajiv-chowk-1",
    displayName: "Rajiv Chowk Metro Station, Connaught Place, New Delhi",
    title: "Rajiv Chowk Metro Station",
    address: "Block B, Connaught Place, New Delhi, Delhi 110001, India",
    lat: 28.6328,
    lng: 77.2195
  },
  "delhi airport": {
    placeId: "del-1",
    displayName: "Indira Gandhi International Airport (DEL), New Delhi",
    title: "Delhi Airport (DEL)",
    address: "Palam, New Delhi, Delhi 110037, India",
    lat: 28.5562,
    lng: 77.1000
  },
  "indira gandhi international airport (del) t3": {
    placeId: "del-t3",
    displayName: "Terminal 3, Indira Gandhi International Airport (DEL), New Delhi",
    title: "IGI Airport Terminal 3 (T3)",
    address: "Terminal 3, IGI Airport, New Delhi, Delhi 110037, India",
    lat: 28.5562,
    lng: 77.1000
  },
  "indira gandhi international airport t3": {
    placeId: "del-t3",
    displayName: "Terminal 3, Indira Gandhi International Airport (DEL), New Delhi",
    title: "IGI Airport Terminal 3 (T3)",
    address: "Terminal 3, IGI Airport, New Delhi, Delhi 110037, India",
    lat: 28.5562,
    lng: 77.1000
  },
  "igi airport t3": {
    placeId: "del-t3",
    displayName: "Terminal 3, Indira Gandhi International Airport (DEL), New Delhi",
    title: "IGI Airport Terminal 3 (T3)",
    address: "Terminal 3, IGI Airport, New Delhi, Delhi 110037, India",
    lat: 28.5562,
    lng: 77.1000
  },
  "t3 airport": {
    placeId: "del-t3",
    displayName: "Terminal 3, Indira Gandhi International Airport (DEL), New Delhi",
    title: "IGI Airport Terminal 3 (T3)",
    address: "Terminal 3, IGI Airport, New Delhi, Delhi 110037, India",
    lat: 28.5562,
    lng: 77.1000
  },
  "sector 15": {
    placeId: "sec-15-noida",
    displayName: "Sector 15, Noida, Uttar Pradesh",
    title: "Sector 15, Noida",
    address: "Sector 15, Noida, Uttar Pradesh 201301, India",
    lat: 28.5833,
    lng: 77.3167
  },
  "sector 15 noida": {
    placeId: "sec-15-noida",
    displayName: "Sector 15, Noida, Uttar Pradesh",
    title: "Sector 15, Noida",
    address: "Sector 15, Noida, Uttar Pradesh 201301, India",
    lat: 28.5833,
    lng: 77.3167
  },
  "sector 15 gurgaon": {
    placeId: "sec-15-ggn",
    displayName: "Sector 15, Gurugram, Haryana",
    title: "Sector 15, Gurugram",
    address: "Sector 15 Part 1, Gurugram, Haryana 122001, India",
    lat: 28.4682,
    lng: 77.0378
  },
  "sector 15 gurugram": {
    placeId: "sec-15-ggn",
    displayName: "Sector 15, Gurugram, Haryana",
    title: "Sector 15, Gurugram",
    address: "Sector 15 Part 1, Gurugram, Haryana 122001, India",
    lat: 28.4682,
    lng: 77.0378
  },
  "noida": {
    placeId: "noida-1",
    displayName: "Noida, Uttar Pradesh",
    title: "Noida",
    address: "Gautam Buddha Nagar, Noida, Uttar Pradesh, India",
    lat: 28.5708,
    lng: 77.3260
  },
  "gurgaon": {
    placeId: "ggn-1",
    displayName: "Gurugram, Haryana",
    title: "Gurugram",
    address: "Gurugram, Haryana, India",
    lat: 28.4595,
    lng: 77.0266
  },
  "gurugram": {
    placeId: "ggn-1",
    displayName: "Gurugram, Haryana",
    title: "Gurugram",
    address: "Gurugram, Haryana, India",
    lat: 28.4595,
    lng: 77.0266
  },
  "dwarka": {
    placeId: "dwarka-1",
    displayName: "Dwarka, New Delhi",
    title: "Dwarka",
    address: "Dwarka Sub-city, South West Delhi, New Delhi, Delhi 110075, India",
    lat: 28.5921,
    lng: 77.0460
  },
  "saket": {
    placeId: "saket-1",
    displayName: "Saket, South Delhi, New Delhi",
    title: "Saket",
    address: "Saket, Press Enclave Road, South Delhi, New Delhi, Delhi 110017, India",
    lat: 28.5244,
    lng: 77.2100
  },
  "mumbai cst": {
    placeId: "cst-1",
    displayName: "Chhatrapati Shivaji Maharaj Terminus (CST), Mumbai",
    title: "Chhatrapati Shivaji Maharaj Terminus (CST)",
    address: "Chhatrapati Shivaji Terminus Area, Fort, Mumbai, Maharashtra 400001, India",
    lat: 18.9401,
    lng: 72.8353
  },
  "bengaluru palace": {
    placeId: "bg-palace-1",
    displayName: "Bengaluru Palace, Vasanth Nagar, Bengaluru",
    title: "Bengaluru Palace",
    address: "Vasanth Nagar, Bengaluru, Karnataka 560052, India",
    lat: 12.9988,
    lng: 77.5921
  },
  "indiranagar": {
    placeId: "indiranagar-1",
    displayName: "Indiranagar 100ft Road, Bengaluru",
    title: "Indiranagar Metro & 100ft Road",
    address: "100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India",
    lat: 12.9784,
    lng: 77.6408
  },
  "koramangala": {
    placeId: "koramangala-1",
    displayName: "Koramangala 5th Block, Bengaluru",
    title: "Koramangala 5th Block",
    address: "5th Block, Koramangala, Bengaluru, Karnataka 560095, India",
    lat: 12.9352,
    lng: 77.6245
  }
};

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];
  const cleanQuery = query.trim().toLowerCase();

  // Check Indian landmarks dictionary first for immediate exact match
  const matches: GeocodingResult[] = [];
  for (const [key, val] of Object.entries(FAMOUS_INDIAN_PLACES)) {
    if (key.includes(cleanQuery) || cleanQuery.includes(key)) {
      matches.push(val);
    }
  }
  if (matches.length > 0) return matches;

  // Real-time OpenStreetMap Nominatim Geocoding fallback with full Indian address details
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en' }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.map((item: any) => {
      const parts = item.display_name.split(',');
      const title = parts[0]?.trim() || item.name || query;
      const address = parts.slice(1).join(',').trim() || item.display_name;

      return {
        placeId: item.place_id.toString(),
        displayName: item.display_name,
        title,
        address,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      };
    });
  } catch (error) {
    console.error('Geocoding search failed:', error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en' }
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}
