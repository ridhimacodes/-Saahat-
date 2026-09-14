import { 
  GEOAPIFY_GEOCODING_API_KEY, 
  GEOAPIFY_REVERSE_GEOCODING_API_KEY 
} from '../config/maps';

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
}

// Comprehensive Indian Landmark & Locality Dictionary across all major metropolitan regions
const FAMOUS_INDIAN_PLACES: Record<string, GeocodingResult> = {
  // --- MUMBAI ---
  "cst": { placeId: "cst-1", displayName: "Chhatrapati Shivaji Maharaj Terminus (CST), Mumbai", title: "Chhatrapati Shivaji Maharaj Terminus (CST)", address: "Fort, Mumbai, Maharashtra 400001, India", lat: 18.9401, lng: 72.8353 },
  "csmt": { placeId: "cst-1", displayName: "Chhatrapati Shivaji Maharaj Terminus (CST), Mumbai", title: "Chhatrapati Shivaji Maharaj Terminus (CST)", address: "Fort, Mumbai, Maharashtra 400001, India", lat: 18.9401, lng: 72.8353 },
  "chhatrapati shivaji": { placeId: "cst-1", displayName: "Chhatrapati Shivaji Maharaj Terminus (CST), Mumbai", title: "Chhatrapati Shivaji Maharaj Terminus (CST)", address: "Fort, Mumbai, Maharashtra 400001, India", lat: 18.9401, lng: 72.8353 },
  "chhatrapati shivaji maharaj terminus": { placeId: "cst-1", displayName: "Chhatrapati Shivaji Maharaj Terminus (CST), Mumbai", title: "Chhatrapati Shivaji Maharaj Terminus (CST)", address: "Fort, Mumbai, Maharashtra 400001, India", lat: 18.9401, lng: 72.8353 },
  "chhatrapati shivaji maharaj terminus (cst)": { placeId: "cst-1", displayName: "Chhatrapati Shivaji Maharaj Terminus (CST), Mumbai", title: "Chhatrapati Shivaji Maharaj Terminus (CST)", address: "Fort, Mumbai, Maharashtra 400001, India", lat: 18.9401, lng: 72.8353 },
  "marine drive": { placeId: "marine-1", displayName: "Marine Drive, Netaji Subhash Chandra Bose Road, Mumbai", title: "Marine Drive", address: "Marine Drive, Churchgate, Mumbai, Maharashtra 400020, India", lat: 18.9440, lng: 72.8230 },
  "marine drive mumbai": { placeId: "marine-1", displayName: "Marine Drive, Netaji Subhash Chandra Bose Road, Mumbai", title: "Marine Drive", address: "Marine Drive, Churchgate, Mumbai, Maharashtra 400020, India", lat: 18.9440, lng: 72.8230 },
  "nariman point": { placeId: "nariman-1", displayName: "Nariman Point, South Mumbai", title: "Nariman Point", address: "Nariman Point, Mumbai, Maharashtra 400021, India", lat: 18.9256, lng: 72.8242 },
  "gateway of india": { placeId: "gateway-1", displayName: "Gateway of India, Colaba, Mumbai", title: "Gateway of India", address: "Apollo Bandar, Colaba, Mumbai, Maharashtra 400001, India", lat: 18.9220, lng: 72.8347 },
  "colaba": { placeId: "colaba-1", displayName: "Colaba Causeway, Mumbai", title: "Colaba", address: "Colaba, Mumbai, Maharashtra 400005, India", lat: 18.9067, lng: 72.8147 },
  "bandra": { placeId: "bandra-1", displayName: "Bandra West, Mumbai", title: "Bandra West", address: "Hill Road, Bandra West, Mumbai, Maharashtra 400050, India", lat: 19.0596, lng: 72.8295 },
  "bandra kurla complex": { placeId: "bkc-1", displayName: "Bandra Kurla Complex (BKC), Mumbai", title: "Bandra Kurla Complex (BKC)", address: "BKC, Bandra East, Mumbai, Maharashtra 400051, India", lat: 19.0686, lng: 72.8700 },
  "bkc": { placeId: "bkc-1", displayName: "Bandra Kurla Complex (BKC), Mumbai", title: "Bandra Kurla Complex (BKC)", address: "BKC, Bandra East, Mumbai, Maharashtra 400051, India", lat: 19.0686, lng: 72.8700 },
  "juhu": { placeId: "juhu-1", displayName: "Juhu Beach, Mumbai", title: "Juhu Beach", address: "Juhu Tara Rd, Juhu, Mumbai, Maharashtra 400049, India", lat: 19.0988, lng: 72.8264 },
  "andheri": { placeId: "andheri-1", displayName: "Andheri Station & West, Mumbai", title: "Andheri West", address: "SV Road, Andheri West, Mumbai, Maharashtra 400058, India", lat: 19.1197, lng: 72.8464 },
  "dadar": { placeId: "dadar-1", displayName: "Dadar TT Circle & Station, Mumbai", title: "Dadar Central", address: "Dadar West, Mumbai, Maharashtra 400028, India", lat: 19.0178, lng: 72.8478 },
  "powai": { placeId: "powai-1", displayName: "Powai Lake & IIT Bombay, Mumbai", title: "Powai", address: "IIT Area, Powai, Mumbai, Maharashtra 400076, India", lat: 19.1257, lng: 72.9170 },
  "worli": { placeId: "worli-1", displayName: "Worli Sea Face, Mumbai", title: "Worli Sea Face", address: "Worli, Mumbai, Maharashtra 400030, India", lat: 19.0134, lng: 72.8164 },
  "mumbai airport": { placeId: "bom-1", displayName: "Chhatrapati Shivaji Maharaj International Airport (BOM), Mumbai", title: "Mumbai Airport (BOM T2)", address: "Sahar Road, Vile Parle East, Mumbai, Maharashtra 400099, India", lat: 19.0896, lng: 72.8656 },

  // --- DELHI NCR ---
  "igdtuw": { placeId: "igdtuw-1", displayName: "Indira Gandhi Delhi Technical University for Women, Kashmere Gate, New Delhi", title: "Indira Gandhi Delhi Technical University for Women", address: "New Church Rd, Kashmere Gate, New Delhi, Delhi 110006, India", lat: 28.6653, lng: 77.2324 },
  "kashmere gate": { placeId: "igdtuw-1", displayName: "Kashmere Gate Metro Station, Old Delhi", title: "Kashmere Gate", address: "Kashmere Gate, Old Delhi, Delhi 110006, India", lat: 28.6653, lng: 77.2324 },
  "india gate": { placeId: "india-gate-1", displayName: "India Gate, Rajpath, New Delhi", title: "India Gate", address: "India Gate, New Delhi, Delhi 110001, India", lat: 28.6129, lng: 77.2295 },
  "connaught place": { placeId: "cp-1", displayName: "Connaught Place, New Delhi", title: "Connaught Place", address: "Inner Circle, Connaught Place, New Delhi, Delhi 110001, India", lat: 28.6315, lng: 77.2167 },
  "rajiv chowk": { placeId: "rajiv-chowk-1", displayName: "Rajiv Chowk Metro Station, Connaught Place, New Delhi", title: "Rajiv Chowk Metro Station", address: "Block B, Connaught Place, New Delhi, Delhi 110001, India", lat: 28.6328, lng: 77.2195 },
  "delhi airport": { placeId: "del-1", displayName: "Indira Gandhi International Airport (DEL), New Delhi", title: "Delhi Airport (DEL)", address: "Palam, New Delhi, Delhi 110037, India", lat: 28.5562, lng: 77.1000 },
  "indira gandhi international airport (del) t3": { placeId: "del-t3", displayName: "Terminal 3, Indira Gandhi International Airport (DEL), New Delhi", title: "IGI Airport Terminal 3 (T3)", address: "Terminal 3, IGI Airport, New Delhi, Delhi 110037, India", lat: 28.5562, lng: 77.1000 },
  "indira gandhi international airport t3": { placeId: "del-t3", displayName: "Terminal 3, Indira Gandhi International Airport (DEL), New Delhi", title: "IGI Airport Terminal 3 (T3)", address: "Terminal 3, IGI Airport, New Delhi, Delhi 110037, India", lat: 28.5562, lng: 77.1000 },
  "igi airport t3": { placeId: "del-t3", displayName: "Terminal 3, Indira Gandhi International Airport (DEL), New Delhi", title: "IGI Airport Terminal 3 (T3)", address: "Terminal 3, IGI Airport, New Delhi, Delhi 110037, India", lat: 28.5562, lng: 77.1000 },
  "t3 airport": { placeId: "del-t3", displayName: "Terminal 3, Indira Gandhi International Airport (DEL), New Delhi", title: "IGI Airport Terminal 3 (T3)", address: "Terminal 3, IGI Airport, New Delhi, Delhi 110037, India", lat: 28.5562, lng: 77.1000 },
  "noida stadium": { placeId: "noida-stadium-1", displayName: "Noida Stadium, Ramnath Goenka Marg, Sector 21A, Noida", title: "Noida Stadium", address: "Sector 21A, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301, India", lat: 28.5908, lng: 77.3373 },
  "alliance world school": { placeId: "alliance-world-school-1", displayName: "Alliance World School, Sector 56, Noida", title: "Alliance World School", address: "C-54A, Sector 56, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301, India", lat: 28.6042, lng: 77.3458 },
  "alliance world": { placeId: "alliance-world-school-1", displayName: "Alliance World School, Sector 56, Noida", title: "Alliance World School", address: "C-54A, Sector 56, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301, India", lat: 28.6042, lng: 77.3458 },
  "sector 15": { placeId: "sec-15-noida", displayName: "Sector 15, Noida, Uttar Pradesh", title: "Sector 15, Noida", address: "Sector 15, Noida, Uttar Pradesh 201301, India", lat: 28.5833, lng: 77.3167 },
  "sector 15 noida": { placeId: "sec-15-noida", displayName: "Sector 15, Noida, Uttar Pradesh", title: "Sector 15, Noida", address: "Sector 15, Noida, Uttar Pradesh 201301, India", lat: 28.5833, lng: 77.3167 },
  "sector 15 gurgaon": { placeId: "sec-15-ggn", displayName: "Sector 15, Gurugram, Haryana", title: "Sector 15, Gurugram", address: "Sector 15 Part 1, Gurugram, Haryana 122001, India", lat: 28.4682, lng: 77.0378 },
  "sector 15 gurugram": { placeId: "sec-15-ggn", displayName: "Sector 15, Gurugram, Haryana", title: "Sector 15, Gurugram", address: "Sector 15 Part 1, Gurugram, Haryana 122001, India", lat: 28.4682, lng: 77.0378 },
  "noida": { placeId: "noida-1", displayName: "Noida, Uttar Pradesh", title: "Noida", address: "Gautam Buddha Nagar, Noida, Uttar Pradesh, India", lat: 28.5708, lng: 77.3260 },
  "gurgaon": { placeId: "ggn-1", displayName: "Gurugram, Haryana", title: "Gurugram", address: "Gurugram, Haryana, India", lat: 28.4595, lng: 77.0266 },
  "gurugram": { placeId: "ggn-1", displayName: "Gurugram, Haryana", title: "Gurugram", address: "Gurugram, Haryana, India", lat: 28.4595, lng: 77.0266 },
  "dwarka": { placeId: "dwarka-1", displayName: "Dwarka, New Delhi", title: "Dwarka", address: "Dwarka Sub-city, South West Delhi, New Delhi, Delhi 110075, India", lat: 28.5921, lng: 77.0460 },
  "saket": { placeId: "saket-1", displayName: "Saket, South Delhi, New Delhi", title: "Saket", address: "Saket, Press Enclave Road, South Delhi, New Delhi, Delhi 110017, India", lat: 28.5244, lng: 77.2100 },
  "hauz khas": { placeId: "hauz-khas-1", displayName: "Hauz Khas Village, New Delhi", title: "Hauz Khas", address: "Hauz Khas Village, New Delhi, Delhi 110016, India", lat: 28.5494, lng: 77.2001 },
  "lajpat nagar": { placeId: "lajpat-1", displayName: "Lajpat Nagar Central Market, New Delhi", title: "Lajpat Nagar", address: "Lajpat Nagar, New Delhi, Delhi 110024, India", lat: 28.5677, lng: 77.2433 },
  "karol bagh": { placeId: "karol-1", displayName: "Karol Bagh Market, New Delhi", title: "Karol Bagh", address: "Karol Bagh, New Delhi, Delhi 110005, India", lat: 28.6517, lng: 77.1906 },

  // --- BENGALURU ---
  "bengaluru palace": { placeId: "bg-palace-1", displayName: "Bengaluru Palace, Vasanth Nagar, Bengaluru", title: "Bengaluru Palace", address: "Vasanth Nagar, Bengaluru, Karnataka 560052, India", lat: 12.9988, lng: 77.5921 },
  "indiranagar": { placeId: "indiranagar-1", displayName: "Indiranagar 100ft Road, Bengaluru", title: "Indiranagar Metro & 100ft Road", address: "100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India", lat: 12.9784, lng: 77.6408 },
  "koramangala": { placeId: "koramangala-1", displayName: "Koramangala 5th Block, Bengaluru", title: "Koramangala 5th Block", address: "5th Block, Koramangala, Bengaluru, Karnataka 560095, India", lat: 12.9352, lng: 77.6245 },
  "mg road": { placeId: "mg-1", displayName: "MG Road Metro & Brigade Road, Bengaluru", title: "MG Road", address: "MG Road, Bengaluru, Karnataka 560001, India", lat: 12.9716, lng: 77.5946 },
  "whitefield": { placeId: "wf-1", displayName: "Whitefield IT Park, Bengaluru", title: "Whitefield", address: "ITPL Main Rd, Whitefield, Bengaluru, Karnataka 560066, India", lat: 12.9698, lng: 77.7499 },
  "hsr layout": { placeId: "hsr-1", displayName: "HSR Layout 2nd Sector, Bengaluru", title: "HSR Layout", address: "HSR Layout, Bengaluru, Karnataka 560102, India", lat: 12.9121, lng: 77.6446 },
  "bengaluru airport": { placeId: "blr-air-1", displayName: "Kempegowda International Airport (BLR), Bengaluru", title: "Bengaluru Airport (BLR)", address: "Devanahalli, Bengaluru, Karnataka 560300, India", lat: 13.1986, lng: 77.7066 },

  // --- HYDERABAD ---
  "charminar": { placeId: "hyd-1", displayName: "Charminar, Old City, Hyderabad", title: "Charminar", address: "Charminar, Hyderabad, Telangana 500002, India", lat: 17.3616, lng: 78.4747 },
  "hitec city": { placeId: "hyd-2", displayName: "HITEC City & Cyber Towers, Hyderabad", title: "HITEC City", address: "HITEC City, Madhapur, Hyderabad, Telangana 500081, India", lat: 17.4435, lng: 78.3772 },
  "gachibowli": { placeId: "hyd-3", displayName: "Gachibowli Financial District, Hyderabad", title: "Gachibowli", address: "Gachibowli, Hyderabad, Telangana 500032, India", lat: 17.4401, lng: 78.3489 }
};

export async function searchLocations(query: string, userCoords?: { lat: number; lng: number }): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];
  const cleanQuery = query.trim().toLowerCase().replace(/[,.-]/g, ' ');

  // 1. Primary: Search Geoapify Geocoding API (Fast, accurate, handles small landmarks, colonies, sectors across India)
  try {
    const geoapifyUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query.trim())}&filter=countrycode:in&limit=8&format=json&apiKey=${GEOAPIFY_GEOCODING_API_KEY}${userCoords?.lat ? `&bias=proximity:${userCoords.lng},${userCoords.lat}` : ''}`;
    const geoapifyRes = await fetch(geoapifyUrl);
    if (geoapifyRes.ok) {
      const geoapifyData = await geoapifyRes.json();
      if (geoapifyData.results && geoapifyData.results.length > 0) {
        return geoapifyData.results.map((item: any) => ({
          placeId: item.place_id || `geo-${item.lat}-${item.lon}`,
          displayName: item.formatted,
          title: item.name || item.address_line1 || item.formatted?.split(',')[0] || query,
          address: item.formatted || item.address_line2 || '',
          lat: item.lat,
          lng: item.lon
        }));
      }
    }
  } catch (err) {
    console.warn('Geoapify search fallback to Nominatim:', err);
  }

  // 2. Secondary fallback: Search live OpenStreetMap (Nominatim)
  try {
    const fetchOSM = async (searchQ: string) => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQ)}&countrycodes=in&limit=6&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'SaahatApp/1.0 (contact@saahat.app)'
        }
      });
      if (!response.ok) return [];
      return await response.json();
    };

    let data = await fetchOSM(query);

    // If query has specific words or commas that might be too strict, try relaxed variations
    if (!data || data.length === 0) {
      data = await fetchOSM(query + ', India');
    }

    if (!data || data.length === 0) {
      const commaParts = query.split(',').map(s => s.trim()).filter(Boolean);
      if (commaParts.length > 1) {
        for (let i = 1; i < commaParts.length; i++) {
          const sub = commaParts.slice(i).join(', ');
          data = await fetchOSM(sub);
          if (data && data.length > 0) break;
        }
      }
    }

    if (!data || data.length === 0) {
      const words = query.trim().split(/\s+/).filter(Boolean);
      if (words.length > 2) {
        for (let i = words.length - 1; i >= 2; i--) {
          const sub = words.slice(0, i).join(' ');
          data = await fetchOSM(sub);
          if (data && data.length > 0) break;
        }
      }
    }

    if (data && data.length > 0) {
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
    }
  } catch (error) {
    console.error('Geocoding live search failed, falling back to local database:', error);
  }

  // 3. Check local Indian landmarks dictionary for exact or token matches
  const matches: GeocodingResult[] = [];
  const addedIds = new Set<string>();
  const queryTokens = cleanQuery.split(/\s+/).filter(t => t.length > 1);

  for (const [key, val] of Object.entries(FAMOUS_INDIAN_PLACES)) {
    const keyClean = key.replace(/[,.-]/g, ' ');
    if (cleanQuery === keyClean || (keyClean.startsWith(cleanQuery) && cleanQuery.length >= 3)) {
      if (!addedIds.has(val.placeId)) {
        matches.push(val);
        addedIds.add(val.placeId);
      }
    } else if (queryTokens.length >= 2 && queryTokens.every(tok => keyClean.includes(tok))) {
      if (!addedIds.has(val.placeId)) {
        matches.push(val);
        addedIds.add(val.placeId);
      }
    }
  }

  if (matches.length > 0) return matches;

  // 4. Fallback: Allow any typed place to be used as a custom point using Delhi NCR center
  return [{
    placeId: `custom-${Date.now()}`,
    displayName: `${query.trim()}, India`,
    title: query.trim(),
    address: `${query.trim()}, India`,
    lat: 28.6139,
    lng: 77.2090
  }];
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // 1. Primary: Geoapify Reverse Geocoding API
  try {
    const geoapifyUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${GEOAPIFY_REVERSE_GEOCODING_API_KEY}`;
    const res = await fetch(geoapifyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted || data.results[0].address_line1 || null;
      }
    }
  } catch (err) {
    console.warn('Geoapify reverse geocoding fallback to Nominatim:', err);
  }

  // 2. Secondary fallback: Nominatim
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
