import { 
  GEOAPIFY_AUTOCOMPLETE_API_KEY,
  GEOAPIFY_GEOCODING_API_KEY,
  GEOAPIFY_PLACES_API_KEY,
  GEOAPIFY_PLACE_DETAILS_API_KEY,
  GEOAPIFY_ROUTING_API_KEY,
  GEOAPIFY_REVERSE_GEOCODING_API_KEY,
  GEOAPIFY_STATIC_MAP_API_KEY,
  GEOAPIFY_MAP_TILES_API_KEY
} from '../config/maps';

export interface GeoapifySuggestion {
  placeId: string;
  name: string;
  formatted: string;
  addressLine1: string;
  addressLine2: string;
  lat: number;
  lng: number;
}

export interface GeoapifyRouteResponse {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][];
  steps: string[];
}

/**
 * 1. Geoapify Autocomplete API
 * Biased towards India (filter=countrycode:in) with location proximity bias if coords provided
 */
export async function getGeoapifyAutocomplete(
  text: string, 
  userCoords?: { lat: number; lng: number }
): Promise<GeoapifySuggestion[]> {
  if (!text || text.trim().length < 1) return [];

  try {
    let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text.trim())}&filter=countrycode:in&format=json&apiKey=${GEOAPIFY_AUTOCOMPLETE_API_KEY}`;
    if (userCoords?.lat && userCoords?.lng) {
      url += `&bias=proximity:${userCoords.lng},${userCoords.lat}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Geoapify autocomplete HTTP ${res.status}:`, await res.text());
      return [];
    }

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => ({
      placeId: item.place_id || `${item.lat},${item.lon}`,
      name: item.name || item.address_line1 || item.formatted?.split(',')[0] || text,
      formatted: item.formatted || '',
      addressLine1: item.address_line1 || item.name || '',
      addressLine2: item.address_line2 || item.city || item.state || item.formatted || '',
      lat: item.lat,
      lng: item.lon
    }));
  } catch (err) {
    console.error('Geoapify autocomplete error:', err);
    return [];
  }
}

/**
 * 2. Geoapify Geocoding Search API
 */
export async function geocodeGeoapifyAddress(
  text: string,
  userCoords?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number; formatted: string; name: string } | null> {
  if (!text || text.trim().length < 1) return null;

  try {
    let url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text.trim())}&filter=countrycode:in&format=json&apiKey=${GEOAPIFY_GEOCODING_API_KEY}`;
    if (userCoords?.lat && userCoords?.lng) {
      url += `&bias=proximity:${userCoords.lng},${userCoords.lat}`;
    }

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const first = data.results[0];
    return {
      lat: first.lat,
      lng: first.lon,
      formatted: first.formatted || '',
      name: first.name || first.address_line1 || text
    };
  } catch (err) {
    console.error('Geoapify geocoding error:', err);
    return null;
  }
}

/**
 * 3. Geoapify Reverse Geocoding API
 */
export async function reverseGeocodeGeoapify(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${GEOAPIFY_REVERSE_GEOCODING_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    return data.results[0].formatted || null;
  } catch (err) {
    console.error('Geoapify reverse geocoding error:', err);
    return null;
  }
}

/**
 * 4. Geoapify Routing API (turn-by-turn walking / transit)
 */
export async function getGeoapifyRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: 'walk' | 'transit' | 'drive' = 'walk'
): Promise<GeoapifyRouteResponse | null> {
  try {
    const routingMode = mode === 'walk' ? 'walk' : mode === 'transit' ? 'transit' : 'drive';
    const url = `https://api.geoapify.com/v1/routing?waypoints=${fromLat},${fromLng}|${toLat},${toLng}&mode=${routingMode}&apiKey=${GEOAPIFY_ROUTING_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Geoapify routing HTTP ${res.status}:`, await res.text());
      return null;
    }

    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;

    const feature = data.features[0];
    const props = feature.properties || {};

    // Coordinates in Geoapify GeoJSON format are [lon, lat], Leaflet requires [lat, lon]
    let coordinates: [number, number][] = [];
    if (feature.geometry && feature.geometry.coordinates) {
      if (feature.geometry.type === 'LineString') {
        coordinates = feature.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      } else if (feature.geometry.type === 'MultiLineString') {
        coordinates = feature.geometry.coordinates.flat().map((c: [number, number]) => [c[1], c[0]]);
      }
    }

    const steps: string[] = [];
    if (props.legs && Array.isArray(props.legs)) {
      props.legs.forEach((leg: any) => {
        if (leg.steps && Array.isArray(leg.steps)) {
          leg.steps.forEach((step: any) => {
            if (step.instruction?.text) {
              steps.push(step.instruction.text);
            }
          });
        }
      });
    }

    const distanceKm = props.distance ? parseFloat((props.distance / 1000).toFixed(1)) : 1.0;
    const durationMinutes = props.time ? Math.round(props.time / 60) : Math.round(distanceKm * 15);

    return {
      distanceKm,
      durationMinutes,
      coordinates,
      steps
    };
  } catch (err) {
    console.error('Geoapify routing error:', err);
    return null;
  }
}

/**
 * 5. Geoapify Places API (Safe havens, police, hospitals, pharmacy)
 */
export async function getGeoapifyNearbyPlaces(
  lat: number,
  lng: number,
  categories: string = 'service.police,healthcare.hospital,healthcare.pharmacy',
  radiusMeters: number = 2000
) {
  try {
    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lng},${lat},${radiusMeters}&limit=20&apiKey=${GEOAPIFY_PLACES_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    return data.features || [];
  } catch (err) {
    console.error('Geoapify places error:', err);
    return [];
  }
}

/**
 * 6. Geoapify Static Map URL Builder
 */
export function getGeoapifyStaticMapUrl(
  lat: number,
  lng: number,
  zoom: number = 15,
  width: number = 600,
  height: number = 400
): string {
  return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=${width}&height=${height}&center=lonlat:${lng},${lat}&zoom=${zoom}&marker=lonlat:${lng},${lat};color:%23ea4335;size:medium&apiKey=${GEOAPIFY_STATIC_MAP_API_KEY}`;
}
