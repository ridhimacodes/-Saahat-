/**
 * Google Maps API Configuration & Helper
 * 
 * To connect your live Google Maps API key:
 * 1. Set VITE_GOOGLE_MAPS_API_KEY in your .env file, OR
 * 2. Paste your API key string below in DEFAULT_GOOGLE_MAPS_API_KEY.
 */

export const DEFAULT_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.head.appendChild(script);
  });
};
