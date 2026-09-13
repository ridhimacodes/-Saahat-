import { DEFAULT_GOOGLE_MAPS_API_KEY, loadGoogleMapsScript } from '../config/maps';

export interface GooglePlaceResult {
  placeId: string;
  name: string;
  address: string;
  displayName: string;
  lat: number;
  lng: number;
}

export interface GooglePlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

export interface GoogleRouteResult {
  name: string;
  via: string;
  distanceKm: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
  coordinates: [number, number][];
  steps: string[];
}

let googleMapsLoadedPromise: Promise<boolean> | null = null;

export function getApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || DEFAULT_GOOGLE_MAPS_API_KEY || "";
}

export function ensureGoogleMapsLoaded(): Promise<boolean> {
  const key = getApiKey();
  if (!googleMapsLoadedPromise) {
    googleMapsLoadedPromise = loadGoogleMapsScript(key);
  }
  return googleMapsLoadedPromise;
}

export interface GooglePlacePredictionResponse {
  predictions: GooglePlacePrediction[];
  rawStatus: string;
  debugMessage: string;
  source: 'google-places-js' | 'google-places-rest' | 'none';
}

/**
 * Global debug listener so UI components can display real-time API responses
 */
type DebugListener = (info: { status: string; message: string; timestamp: string }) => void;
const debugListeners: Set<DebugListener> = new Set();

export function onGooglePlacesDebug(listener: DebugListener): () => void {
  debugListeners.add(listener);
  return () => debugListeners.delete(listener);
}

function broadcastDebug(status: string, message: string) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[Google Places API Debug] [${timestamp}] Status: ${status} | Message: ${message}`);
  debugListeners.forEach((fn) => {
    try {
      fn({ status, message, timestamp });
    } catch (e) {
      console.error(e);
    }
  });
}

/**
 * Fetch real-time place predictions using Google Places API (no restrictive types, unrestricted bias to India)
 */
export async function getGooglePlacePredictions(
  input: string,
  userLocation?: { lat: number; lng: number }
): Promise<GooglePlacePredictionResponse> {
  if (!input || input.trim().length < 1) {
    return { predictions: [], rawStatus: 'EMPTY_INPUT', debugMessage: 'Query is empty', source: 'none' };
  }

  const trimmed = input.trim();
  const apiKey = getApiKey();

  if (!apiKey) {
    const msg = 'No Google Maps API Key configured (VITE_GOOGLE_MAPS_API_KEY is empty). Falling back to OpenStreetMap.';
    console.warn(`[Google Places API] ${msg}`);
    broadcastDebug('NO_API_KEY', msg);
    return { predictions: [], rawStatus: 'NO_API_KEY', debugMessage: msg, source: 'none' };
  }

  const loaded = await ensureGoogleMapsLoaded();
  const win = window as any;

  // 1. First attempt: Google Maps JavaScript AutocompleteService
  if (loaded && win.google && win.google.maps && win.google.maps.places) {
    return new Promise((resolve) => {
      try {
        const autocompleteService = new win.google.maps.places.AutocompleteService();
        
        // Unrestricted search: NO types filter (e.g. no '(cities)', no 'establishment' restrictions)
        // Searches all landmarks, schools, stadiums, stores, local buildings, streets, etc.
        const request: any = {
          input: trimmed,
          // country: 'in' component restriction to bias within India without restricting categories
          componentRestrictions: { country: 'in' }
        };

        if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
          request.location = new win.google.maps.LatLng(userLocation.lat, userLocation.lng);
          request.radius = 50000; // 50km radius bias
        }

        console.log(`[Google Places Autocomplete] Sending request for "${trimmed}":`, request);

        autocompleteService.getPlacePredictions(
          request,
          (predictions: any[], status: any) => {
            // FULL RAW API RESPONSE LOGGED TO CONSOLE
            console.log(`[Google Places API Response] query: "${trimmed}"`, {
              rawStatusCode: status,
              predictionsCount: predictions?.length || 0,
              rawPredictions: predictions
            });

            const statusStr = String(status);

            if (status === win.google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
              const formatted: GooglePlacePrediction[] = predictions.map((p) => ({
                placeId: p.place_id,
                mainText: p.structured_formatting?.main_text || p.description,
                secondaryText: p.structured_formatting?.secondary_text || '',
                description: p.description
              }));
              const msg = `Received ${formatted.length} prediction(s) for "${trimmed}"`;
              broadcastDebug(statusStr, msg);
              resolve({
                predictions: formatted,
                rawStatus: statusStr,
                debugMessage: msg,
                source: 'google-places-js'
              });
            } else {
              let explanation = `Status: ${statusStr}`;
              if (statusStr === 'ZERO_RESULTS') {
                explanation = `Google Places found 0 results for "${trimmed}". (Check spelling or try broader keywords)`;
              } else if (statusStr === 'REQUEST_DENIED') {
                explanation = `API Request Denied. Please ensure 'Places API' / 'Places API (New)' is enabled and billing is active in Google Cloud Console.`;
              } else if (statusStr === 'OVER_QUERY_LIMIT') {
                explanation = `Google Places quota limit exceeded.`;
              } else if (statusStr === 'INVALID_REQUEST') {
                explanation = `Invalid request parameters sent to Google Places.`;
              }
              broadcastDebug(statusStr, explanation);
              resolve({
                predictions: [],
                rawStatus: statusStr,
                debugMessage: explanation,
                source: 'google-places-js'
              });
            }
          }
        );
      } catch (err: any) {
        console.error('[Google Places Autocomplete Exception]:', err);
        const errMsg = err?.message || String(err);
        broadcastDebug('EXCEPTION', errMsg);
        resolve({
          predictions: [],
          rawStatus: 'EXCEPTION',
          debugMessage: errMsg,
          source: 'google-places-js'
        });
      }
    });
  }

  // 2. If JS SDK failed to initialize, report clear error
  const msg = 'Google Maps JavaScript SDK is not ready or failed to load.';
  broadcastDebug('SDK_NOT_LOADED', msg);
  return {
    predictions: [],
    rawStatus: 'SDK_NOT_LOADED',
    debugMessage: msg,
    source: 'none'
  };
}

/**
 * Fetch exact coordinates & place details using Google Place ID
 */
export async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
  if (!placeId) return null;

  const loaded = await ensureGoogleMapsLoaded();
  const win = window as any;

  if (!loaded || !win.google || !win.google.maps || !win.google.maps.places) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const dummyDiv = document.createElement('div');
      const placesService = new win.google.maps.places.PlacesService(dummyDiv);

      placesService.getDetails(
        {
          placeId: placeId,
          fields: ['place_id', 'name', 'formatted_address', 'geometry', 'vicinity']
        },
        (place: any, status: any) => {
          if (status === win.google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            resolve({
              placeId: place.place_id,
              name: place.name || '',
              address: place.formatted_address || place.vicinity || '',
              displayName: `${place.name}, ${place.formatted_address || ''}`,
              lat,
              lng
            });
          } else {
            resolve(null);
          }
        }
      );
    } catch (err) {
      console.error("Google Place Details error:", err);
      resolve(null);
    }
  });
}

/**
 * Geocode text address using Google Geocoder Service
 */
export async function geocodeGoogleAddress(
  address: string,
  userLocation?: { lat: number; lng: number }
): Promise<GooglePlaceResult | null> {
  if (!address || !address.trim()) return null;

  const loaded = await ensureGoogleMapsLoaded();
  const win = window as any;

  if (!loaded || !win.google || !win.google.maps) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const geocoder = new win.google.maps.Geocoder();
      const req: any = {
        address: address.trim(),
        componentRestrictions: { country: 'IN' }
      };

      if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
        req.location = new win.google.maps.LatLng(userLocation.lat, userLocation.lng);
      }

      geocoder.geocode(req, (results: any[], status: any) => {
        if (status === win.google.maps.GeocoderStatus.OK && results && results[0]) {
          const res = results[0];
          const lat = res.geometry.location.lat();
          const lng = res.geometry.location.lng();
          resolve({
            placeId: res.place_id,
            name: address.split(',')[0].trim(),
            address: res.formatted_address,
            displayName: res.formatted_address,
            lat,
            lng
          });
        } else {
          resolve(null);
        }
      });
    } catch (err) {
      console.error("Google Geocoder error:", err);
      resolve(null);
    }
  });
}

/**
 * Calculate exact routes, distance, and duration using Google Routes / Directions Service
 */
export async function getGoogleDirections(
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string,
  travelMode: 'WALKING' | 'DRIVING' | 'BICYCLING' | 'TRANSIT' = 'WALKING'
): Promise<GoogleRouteResult[]> {
  const loaded = await ensureGoogleMapsLoaded();
  const win = window as any;

  if (!loaded || !win.google || !win.google.maps) {
    return [];
  }

  return new Promise((resolve) => {
    try {
      const directionsService = new win.google.maps.DirectionsService();

      const originParam = typeof origin === 'string' 
        ? origin 
        : new win.google.maps.LatLng(origin.lat, origin.lng);

      const destParam = typeof destination === 'string' 
        ? destination 
        : new win.google.maps.LatLng(destination.lat, destination.lng);

      const mode = win.google.maps.TravelMode[travelMode] || win.google.maps.TravelMode.WALKING;

      directionsService.route(
        {
          origin: originParam,
          destination: destParam,
          travelMode: mode,
          provideRouteAlternatives: true
        },
        (result: any, status: any) => {
          if (status === win.google.maps.DirectionsStatus.OK && result && result.routes && result.routes.length > 0) {
            const googleRoutes: GoogleRouteResult[] = result.routes.map((route: any, idx: number) => {
              const leg = route.legs[0];
              const distanceKm = parseFloat((leg.distance.value / 1000).toFixed(1));
              const durationMinutes = Math.round(leg.duration.value / 60);

              const coordinates: [number, number][] = route.overview_path.map((pt: any) => [
                parseFloat(pt.lat().toFixed(6)),
                parseFloat(pt.lng().toFixed(6))
              ]);

              const steps: string[] = leg.steps.map((st: any) => 
                st.instructions.replace(/<[^>]*>?/gm, '')
              );

              return {
                name: route.summary ? `via ${route.summary}` : `Route ${idx + 1}`,
                via: route.summary ? `via ${route.summary}` : leg.start_address,
                distanceKm,
                durationMinutes,
                distanceText: leg.distance.text,
                durationText: leg.duration.text,
                coordinates,
                steps
              };
            });
            resolve(googleRoutes);
          } else {
            resolve([]);
          }
        }
      );
    } catch (err) {
      console.error("Google Directions Service error:", err);
      resolve([]);
    }
  });
}
