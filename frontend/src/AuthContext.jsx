import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API = "http://localhost:8000";

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("agh_token"));
  const [loading, setLoading] = useState(true);

  // On mount: validate stored token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => setUser(data))
      .catch(() => { localStorage.removeItem("agh_token"); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const body = new URLSearchParams({ username: email, password });
    const res  = await fetch(`${API}/auth/login`, { method: "POST", body });
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
    };
    return (map[user.role] || []).includes(section);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;