import React, { createContext, useContext, useState, useEffect } from "react";
import { buildApiUrl } from "./config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("agh_token"));
  const [loading, setLoading] = useState(true);

  // On mount: validate stored token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(buildApiUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => setUser(data))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        localStorage.removeItem("agh_token");
        setToken(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [token]);

  const login = async (email, password) => {
    const body = new URLSearchParams({ username: email, password });
    const res  = await fetch(buildApiUrl("/auth/login"), { method: "POST", body });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("agh_token", data.access_token);
    setToken(data.access_token);
    setUser({ email, role: data.role, name: data.name });
    return data;
  };

  const register = async ({ name, email, password }) => {
    const res = await fetch(buildApiUrl("/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "user" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  };

  const logout = () => {
    localStorage.removeItem("agh_token");
    setToken(null);
    setUser(null);
  };

  // Check if current user can see a named section
  const canAccess = (section) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    const map = {
      hr:      ["candidates", "agent", "business", "analytics", "notifications", "search"],
      finance: ["business", "analytics", "notifications", "search"],
      user:    ["analyzer"],
    };
    return (map[user.role] || []).includes(section);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
