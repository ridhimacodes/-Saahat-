/**
 * Google Maps API Configuration & Helper
 * 
 * To connect your live Google Maps API key:
 * 1. Set VITE_GOOGLE_MAPS_API_KEY in your .env file, OR
 * 2. Paste your API key string below in DEFAULT_GOOGLE_MAPS_API_KEY.
 */

export const DEFAULT_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY_HERE";

/**
 * =======================================================================
 * GEOAPIFY SPATIAL SERVICES API PLACEHOLDERS & CONFIGURATION
 * =======================================================================
 * To connect your live Geoapify API key:
 * 1. Set `VITE_GEOAPIFY_API_KEY=your_key` in your `.env` file, OR
 * 2. Paste your API key string below in `DEFAULT_GEOAPIFY_API_KEY`.
 */
export const DEFAULT_GEOAPIFY_API_KEY =
  import.meta.env.VITE_GEOAPIFY_API_KEY || "YOUR_GEOAPIFY_API_KEY_HERE";

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
  // 1. Map Tiles API (Geoapify raster/vector styles: osm-bright, klokantech-basic, positron, etc.)
  mapTiles: {
    apiKey: import.meta.env.VITE_GEOAPIFY_MAP_TILES_API_KEY || DEFAULT_GEOAPIFY_API_KEY,
    tileUrlTemplate:
      import.meta.env.VITE_GEOAPIFY_MAP_TILES_URL ||
      "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey={API_KEY}",
    attribution:
      'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
  },

  // 2. Geocoding API (Forward Address/Place Search -> Coordinates)
  geocoding: {
    apiKey: import.meta.env.VITE_GEOAPIFY_GEOCODING_API_KEY || DEFAULT_GEOAPIFY_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_GEOCODING_API_URL ||
      "https://api.geoapify.com/v1/geocode/search?text={TEXT}&filter=countrycode:in&apiKey={API_KEY}"
  },

  // 3. Autocomplete API (Live address/place suggestions while typing)
  autocomplete: {
    apiKey: import.meta.env.VITE_GEOAPIFY_AUTOCOMPLETE_API_KEY || DEFAULT_GEOAPIFY_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_AUTOCOMPLETE_API_URL ||
      "https://api.geoapify.com/v1/geocode/autocomplete?text={TEXT}&filter=countrycode:in&bias=proximity:{LNG},{LAT}&apiKey={API_KEY}"
  },

  // 4. Places API (Nearby Search for Points of Interest, safe havens, shops, transit)
  places: {
    apiKey: import.meta.env.VITE_GEOAPIFY_PLACES_API_KEY || DEFAULT_GEOAPIFY_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_PLACES_API_URL ||
      "https://api.geoapify.com/v2/places?categories={CATEGORIES}&filter=circle:{LNG},{LAT},{RADIUS}&bias=proximity:{LNG},{LAT}&limit=20&apiKey={API_KEY}"
  },

  // 5. Place Details API (Detailed venue features, address, contact, facilities)
  placeDetails: {
    apiKey: import.meta.env.VITE_GEOAPIFY_PLACE_DETAILS_API_KEY || DEFAULT_GEOAPIFY_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_PLACE_DETAILS_API_URL ||
      "https://api.geoapify.com/v2/place-details?id={PLACE_ID}&apiKey={API_KEY}"
  },

  // 6. Routing API (Turn-by-turn walking/transit directions, distance, and coordinates)
  routing: {
    apiKey: import.meta.env.VITE_GEOAPIFY_ROUTING_API_KEY || DEFAULT_GEOAPIFY_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_ROUTING_API_URL ||
      "https://api.geoapify.com/v1/routing?waypoints={FROM_LAT},{FROM_LNG}|{TO_LAT},{TO_LNG}&mode=walk&details=instruction_details&apiKey={API_KEY}"
  },

  // 7. Reverse Geocoding API (Coordinates [lat, lng] -> Formatted Street Address)
  reverseGeocoding: {
    apiKey: import.meta.env.VITE_GEOAPIFY_REVERSE_GEOCODING_API_KEY || DEFAULT_GEOAPIFY_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOAPIFY_REVERSE_GEOCODING_API_URL ||
      "https://api.geoapify.com/v1/geocode/reverse?lat={LAT}&lon={LNG}&apiKey={API_KEY}"
  },

  // 8. Static Map API (Snapshot images for Low Signal mode & SMS Tracking)
  staticMap: {
    apiKey: import.meta.env.VITE_GEOAPIFY_STATIC_MAP_API_KEY || DEFAULT_GEOAPIFY_API_KEY,
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
