import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";

const API = "http://localhost:8000";

const NotificationBell = ({ token }) => {
  const [items,   setItems]   = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const hdrs = token ? { Authorization: `Bearer ${token}` } : {};

  // Poll unread count every 15 s
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`${API}/notifications/count`, { headers: hdrs });
        if (r.ok) { const d = await r.json(); setUnread(d.unread_count || 0); }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/notifications`, { headers: hdrs });
      if (r.ok) {
        const d = await r.json();
        setItems(d.notifications || []);
        setUnread(d.unread_count || 0);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchAll();
  };

  const fmtTime = t => {
    if (!t) return "";
    try { return new Date(t + (t.includes("Z") ? "" : "Z")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return t.slice(11, 16); }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={toggle}
        className="relative p-2 rounded-xl hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-all"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center px-1 animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-14 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">🔔 Notifications</span>
            <span className="text-indigo-200 text-xs">{unread} new (last hour)</span>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-semibold text-gray-500 text-sm">All caught up!</p>
                <p className="text-gray-400 text-xs mt-1">No activity in the last 24 hours</p>
              </div>
            ) : (
              items.map((n, i) => (
                <div
                  key={n.id || i}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors
                    ${n.type === "candidate" ? "border-l-4 border-indigo-400" : "border-l-4 border-purple-400"}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{n.title}</span>
                      <span className="text-gray-400 text-xs flex-shrink-0">{fmtTime(n.time)}</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-0.5 truncate">{n.message}</p>
                    {n.priority === "high" && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t text-center">
            <button
              onClick={fetchAll}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;