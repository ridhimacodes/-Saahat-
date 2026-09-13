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
 * MAP & SPATIAL SERVICES API PLACEHOLDERS
 * =======================================================================
 * Configure your keys in a `.env` file (e.g. VITE_GOOGLE_MAPS_API_KEY=...)
 * or replace the placeholder strings below.
 */
export interface MapServiceEndpoints {
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

export const MAP_API_CONFIG: MapServiceEndpoints = {
  // 1. Map Tiles API (Leaflet raster/vector map layer)
  mapTiles: {
    apiKey: import.meta.env.VITE_MAP_TILES_API_KEY || DEFAULT_GOOGLE_MAPS_API_KEY,
    tileUrlTemplate:
      import.meta.env.VITE_MAP_TILES_URL ||
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },

  // 2. Geocoding API (Address / Landmark -> Coordinates)
  geocoding: {
    apiKey: import.meta.env.VITE_GEOCODING_API_KEY || DEFAULT_GOOGLE_MAPS_API_KEY,
    endpoint:
      import.meta.env.VITE_GEOCODING_API_URL ||
      "https://maps.googleapis.com/maps/api/geocode/json?address={ADDRESS}&key={KEY}"
  },

  // 3. Autocomplete API (Live search suggestions while typing)
  autocomplete: {
    apiKey: import.meta.env.VITE_AUTOCOMPLETE_API_KEY || DEFAULT_GOOGLE_MAPS_API_KEY,
    endpoint:
      import.meta.env.VITE_AUTOCOMPLETE_API_URL ||
      "https://maps.googleapis.com/maps/api/place/autocomplete/json?input={INPUT}&components=country:in&key={KEY}"
  },

  // 4. Places API (Nearby search, points of interest, safe havens)
  places: {
    apiKey: import.meta.env.VITE_PLACES_API_KEY || DEFAULT_GOOGLE_MAPS_API_KEY,
    endpoint:
      import.meta.env.VITE_PLACES_API_URL ||
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={LAT},{LNG}&radius={RADIUS}&key={KEY}"
  },

  // 5. Place Details API (Full address, hours, vicinity, geometry)
  placeDetails: {
    apiKey: import.meta.env.VITE_PLACE_DETAILS_API_KEY || DEFAULT_GOOGLE_MAPS_API_KEY,
    endpoint:
      import.meta.env.VITE_PLACE_DETAILS_API_URL ||
      "https://maps.googleapis.com/maps/api/place/details/json?place_id={PLACE_ID}&fields=name,formatted_address,geometry,vicinity,opening_hours&key={KEY}"
  },

  // 6. Routing API (Direction polylines, duration, distance, walking routes)
  routing: {
    apiKey: import.meta.env.VITE_ROUTING_API_KEY || DEFAULT_GOOGLE_MAPS_API_KEY,
    endpoint:
      import.meta.env.VITE_ROUTING_API_URL ||
      "https://maps.googleapis.com/maps/api/directions/json?origin={ORIGIN}&destination={DESTINATION}&mode=walking&alternatives=true&key={KEY}"
  },

  // 7. Reverse Geocoding API (Coordinates [lat, lng] -> Formatted address)
  reverseGeocoding: {
    apiKey: import.meta.env.VITE_REVERSE_GEOCODING_API_KEY || DEFAULT_GOOGLE_MAPS_API_KEY,
    endpoint:
      import.meta.env.VITE_REVERSE_GEOCODING_API_URL ||
      "https://maps.googleapis.com/maps/api/geocode/json?latlng={LAT},{LNG}&key={KEY}"
  },

  // 8. Static Map API (Snapshot images for Low Signal mode & emergency SMS)
  staticMap: {
    apiKey: import.meta.env.VITE_STATIC_MAP_API_KEY || DEFAULT_GOOGLE_MAPS_API_KEY,
    endpoint:
      import.meta.env.VITE_STATIC_MAP_API_URL ||
      "https://maps.googleapis.com/maps/api/staticmap?center={LAT},{LNG}&zoom={ZOOM}&size={WIDTH}x{HEIGHT}&markers=color:red%7C{LAT},{LNG}&key={KEY}"
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
