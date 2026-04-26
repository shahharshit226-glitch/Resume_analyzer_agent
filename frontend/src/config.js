const DEFAULT_PROD_API_BASE = "https://resume-analyzer-agent-r0dp.onrender.com";
const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);

const rawApiBase = import.meta.env.VITE_API_BASE_URL
  || (isLocalHost ? "/api" : DEFAULT_PROD_API_BASE);

export const API_BASE = rawApiBase.endsWith("/")
  ? rawApiBase.slice(0, -1)
  : rawApiBase;

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};
