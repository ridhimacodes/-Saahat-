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
