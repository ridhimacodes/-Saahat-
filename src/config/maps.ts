/**
 * ====================================================================================
 * 8 SEPARATE GEOAPIFY API KEYS - CONFIGURATION & PLACEHOLDERS
 * ====================================================================================
 * You can either:
 *  A) Paste each individual key directly in the strings below, OR
 *  B) Put them in your `.env` file in the project root using the corresponding VITE_ variable names.
 */

// Optional global fallback keys
export const DEFAULT_GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "";
export const DEFAULT_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// 1. Map Tiles API Key (For rendering custom Leaflet map styles, e.g., osm-bright)
// Place your Geoapify Map Tiles API key here:
export const GEOAPIFY_MAP_TILES_API_KEY =
  import.meta.env.VITE_GEOAPIFY_MAP_TILES_API_KEY || "PASTE_YOUR_MAP_TILES_API_KEY_HERE";

// 2. Geocoding API Key (For searching addresses, landmarks, colleges, and getting coordinates)
// Place your Geoapify Geocoding API key here:
export const GEOAPIFY_GEOCODING_API_KEY =
  import.meta.env.VITE_GEOAPIFY_GEOCODING_API_KEY || "PASTE_YOUR_GEOCODING_API_KEY_HERE";

// 3. Autocomplete API Key (For live dropdown search suggestions as user types)
// Place your Geoapify Autocomplete API key here:
export const GEOAPIFY_AUTOCOMPLETE_API_KEY =
  import.meta.env.VITE_GEOAPIFY_AUTOCOMPLETE_API_KEY || "PASTE_YOUR_AUTOCOMPLETE_API_KEY_HERE";

// 4. Places API Key (For finding nearby safe havens, open stores, police stations, cafes)
// Place your Geoapify Places API key here:
export const GEOAPIFY_PLACES_API_KEY =
  import.meta.env.VITE_GEOAPIFY_PLACES_API_KEY || "PASTE_YOUR_PLACES_API_KEY_HERE";

// 5. Place Details API Key (For opening hours, phone numbers, exact boundaries, facilities)
// Place your Geoapify Place Details API key here:
export const GEOAPIFY_PLACE_DETAILS_API_KEY =
  import.meta.env.VITE_GEOAPIFY_PLACE_DETAILS_API_KEY || "PASTE_YOUR_PLACE_DETAILS_API_KEY_HERE";

// 6. Routing API Key (For turn-by-turn walking directions, safe corridors, distance, and ETA)
// Place your Geoapify Routing API key here:
export const GEOAPIFY_ROUTING_API_KEY =
  import.meta.env.VITE_GEOAPIFY_ROUTING_API_KEY || "PASTE_YOUR_ROUTING_API_KEY_HERE";

// 7. Reverse Geocoding API Key (For converting user GPS coordinates [lat, lng] into a readable address)
// Place your Geoapify Reverse Geocoding API key here:
export const GEOAPIFY_REVERSE_GEOCODING_API_KEY =
  import.meta.env.VITE_GEOAPIFY_REVERSE_GEOCODING_API_KEY || "PASTE_YOUR_REVERSE_GEOCODING_API_KEY_HERE";

// 8. Static Map API Key (For generating offline static map snapshot images for Low Signal mode & emergency SMS)
// Place your Geoapify Static Map API key here:
export const GEOAPIFY_STATIC_MAP_API_KEY =
  import.meta.env.VITE_GEOAPIFY_STATIC_MAP_API_KEY || "PASTE_YOUR_STATIC_MAP_API_KEY_HERE";

export interface GeoapifyServiceEndpoints {
  mapTiles: {
    apiKey: string;
    tileUrlTemplate: string;
    attribution: string;
  };
  geocoding: {
    apiKey: string;
    endpoint: string;
  };
  autocomplete: {
    apiKey: string;
    endpoint: string;
  };
  places: {
    apiKey: string;
    endpoint: string;
  };
  placeDetails: {
    apiKey: string;
    endpoint: string;
  };
  routing: {
    apiKey: string;
    endpoint: string;
  };
  reverseGeocoding: {
    apiKey: string;
    endpoint: string;
  };
  staticMap: {
    apiKey: string;
    endpoint: string;
  };
}

export const MAP_API_CONFIG: GeoapifyServiceEndpoints = {
  // 1. Map Tiles API
  mapTiles: {
    apiKey: GEOAPIFY_MAP_TILES_API_KEY,
    tileUrlTemplate:
      import.meta.env.VITE_GEOAPIFY_MAP_TILES_URL ||
      "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey={API_KEY}",
    attribution:
      'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
  },

  // 2. Geocoding API
  geocoding: {
    apiKey: GEOAPIFY_GEOCODING_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_GEOCODING_API_URL ||
      "https://api.geoapify.com/v1/geocode/search?text={TEXT}&filter=countrycode:in&apiKey={API_KEY}"
  },

  // 3. Autocomplete API
  autocomplete: {
    apiKey: GEOAPIFY_AUTOCOMPLETE_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_AUTOCOMPLETE_API_URL ||
      "https://api.geoapify.com/v1/geocode/autocomplete?text={TEXT}&filter=countrycode:in&bias=proximity:{LNG},{LAT}&apiKey={API_KEY}"
  },

  // 4. Places API
  places: {
    apiKey: GEOAPIFY_PLACES_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_PLACES_API_URL ||
      "https://api.geoapify.com/v2/places?categories={CATEGORIES}&filter=circle:{LNG},{LAT},{RADIUS}&bias=proximity:{LNG},{LAT}&limit=20&apiKey={API_KEY}"
  },

  // 5. Place Details API
  placeDetails: {
    apiKey: GEOAPIFY_PLACE_DETAILS_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_PLACE_DETAILS_API_URL ||
      "https://api.geoapify.com/v2/place-details?id={PLACE_ID}&apiKey={API_KEY}"
  },

  // 6. Routing API
  routing: {
    apiKey: GEOAPIFY_ROUTING_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_ROUTING_API_URL ||
      "https://api.geoapify.com/v1/routing?waypoints={FROM_LAT},{FROM_LNG}|{TO_LAT},{TO_LNG}&mode=walk&details=instruction_details&apiKey={API_KEY}"
  },

  // 7. Reverse Geocoding API
  reverseGeocoding: {
    apiKey: GEOAPIFY_REVERSE_GEOCODING_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_REVERSE_GEOCODING_API_URL ||
      "https://api.geoapify.com/v1/geocode/reverse?lat={LAT}&lon={LNG}&apiKey={API_KEY}"
  },

  // 8. Static Map API
  staticMap: {
    apiKey: GEOAPIFY_STATIC_MAP_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_STATIC_MAP_API_URL ||
      "https://maps.geoapify.com/v1/staticmap?style=osm-bright&width={WIDTH}&height={HEIGHT}&center=lonlat:{LNG},{LAT}&zoom={ZOOM}&marker=lonlat:{LNG},{LAT};color:%23c2414c;size:medium&apiKey={API_KEY}"
  }
};

/**
 * Utility helper to substitute parameters into placeholder endpoint strings
 */
export function formatApiEndpoint(
  endpointTemplate: string,
  params: Record<string, string | number>
): string {
  let url = endpointTemplate;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(String(value)));
  }
  return url;
}

export const loadGoogleMapsScript = (apiKey: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const win = window as any;
    if (win.google && win.google.maps) {
      resolve(true);
      return;
    }

    if (!apiKey) {
      resolve(false);
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.head.appendChild(script);
  });
};
