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

/**
 * Fetch real-time place predictions using Google Places AutocompleteService
 */
export async function getGooglePlacePredictions(input: string): Promise<GooglePlacePrediction[]> {
  if (!input || input.trim().length < 2) return [];

  const loaded = await ensureGoogleMapsLoaded();
  const win = window as any;

  if (!loaded || !win.google || !win.google.maps || !win.google.maps.places) {
    console.warn("Google Maps JS API is not loaded or API key is missing.");
    return [];
  }

  return new Promise((resolve) => {
    try {
      const autocompleteService = new win.google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        {
          input: input.trim(),
        },
        (predictions: any[], status: any) => {
          if (status === win.google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
            const formatted = predictions.map((p) => ({
              placeId: p.place_id,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || '',
              description: p.description
            }));
            resolve(formatted);
          } else {
            resolve([]);
          }
        }
      );
    } catch (err) {
      console.error("Google Places Autocomplete error:", err);
      resolve([]);
    }
  });
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
export async function geocodeGoogleAddress(address: string): Promise<GooglePlaceResult | null> {
  if (!address || !address.trim()) return null;

  const loaded = await ensureGoogleMapsLoaded();
  const win = window as any;

  if (!loaded || !win.google || !win.google.maps) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const geocoder = new win.google.maps.Geocoder();
      geocoder.geocode({ address: address.trim() }, (results: any[], status: any) => {
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
