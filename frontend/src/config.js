const rawApiBase = import.meta.env.VITE_API_BASE_URL || "/api";

export const API_BASE = rawApiBase.endsWith("/")
  ? rawApiBase.slice(0, -1)
  : rawApiBase;

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};
