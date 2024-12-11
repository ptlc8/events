// Environment config
export const isProd = import.meta.env.PROD;
export const isApp = import.meta.env.MODE == "app";

// App config
export const baseUrl = import.meta.env.BASE_URL ?? "/";
export const backendUrl = import.meta.env.VITE_BACKEND_URL ?? baseUrl;
export const origin = import.meta.env.VITE_BACKEND_URL ?? (document.location.origin + baseUrl);

// Mapbox config
export const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;