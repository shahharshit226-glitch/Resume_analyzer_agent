import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

const API = "http://localhost:8000";

const STATUS_BADGE = {
  Shortlisted: "bg-green-100 text-green-700 border-green-200",
  Rejected:    "bg-red-100 text-red-700 border-red-200",
};
const PRIORITY_BADGE = {
  HIGH:   "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW:    "bg-green-100 text-green-700",
};

const SearchFilter = ({ token }) => {
  const [query,    setQuery]    = useState("");
  const [scope,    setScope]    = useState("all");     // all | candidates | mails
  const [status,   setStatus]   = useState("all");
  const [category, setCategory] = useState("all");
  const [cands,    setCands]    = useState([]);
  const [mails,    setMails]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  const hdrs = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cr, mr] = await Promise.all([
          fetch(`${API}/candidates`,              { headers: hdrs }).then(r => r.ok ? r.json() : []),
          fetch(`${API}/categorized-mails/all`,   { headers: hdrs }).then(r => r.ok ? r.json() : []),
        ]);
        setCands(Array.isArray(cr) ? cr : []);
        setMails(Array.isArray(mr) ? mr : []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const q = query.toLowerCase();

  const filteredCands = cands.filter(c => {
    const matchQ = !q || c.email?.toLowerCase().includes(q) || c.job_role?.toLowerCase().includes(q);
    const matchS = status === "all" || c.status === status;
    return matchQ && matchS;
  });

  const filteredMails = mails.filter(m => {
    const matchQ = !q || m.subject?.toLowerCase().includes(q) || m.sender?.toLowerCase().includes(q);
    const matchC = category === "all" || m.category === category;
    return matchQ && matchC;
  });

  const showCands = scope === "all" || scope === "candidates";
  const showMails = scope === "all" || scope === "mails";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">🔍 Search & Filter</h1>
        <p className="text-gray-500 mt-1">Search across candidates and business emails instantly</p>
      </div>

      {/* Search bar + filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        {/* Input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by email, subject, job role, sender name…"
            className="w-full border-2 border-gray-200 focus:border-indigo-400 rounded-xl pl-12 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400/20 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Scope */}
          {[
            { id: "all",        label: "All" },
            { id: "candidates", label: "👤 Candidates" },
            { id: "mails",      label: "📧 Emails" },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setScope(s.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                scope === s.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}

          {/* Status filter (candidates) */}
          {(scope === "all" || scope === "candidates") && (
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">All Statuses</option>
              <option value="Shortlisted">✅ Shortlisted</option>
              <option value="Rejected">❌ Rejected</option>
            </select>
          )}

          {/* Category filter (mails) */}
          {(scope === "all" || scope === "mails") && (
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">All Categories</option>
              {["Appointment","Resignation","Billing","Logistics","BankStatement","Support","Uncategorized"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Result count badge */}
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {showCands && `${filteredCands.length} candidates`}
            {showCands && showMails && " · "}
            {showMails && `${filteredMails.length} emails`}
          </span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-400">Loading…</div>
      )}

      {/* Candidates table */}
      {!loading && showCands && filteredCands.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3">
            <h2 className="text-white font-bold text-sm">👤 Candidates ({filteredCands.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Email", "Job Role", "ATS Score", "Status", "Date"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCands.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-800 font-medium">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.job_role}</td>
                    <td className="px-4 py-3">
                      <span className="font-black text-indigo-700 text-base">{c.score ?? c.ats_score}</span>
                      <span className="text-gray-400 text-xs">/100</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[c.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{(c.date || c.processed_at || "").slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Business mails table */}
      {!loading && showMails && filteredMails.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-3">
            <h2 className="text-white font-bold text-sm">📧 Business Emails ({filteredMails.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Sender", "Subject", "Category", "Priority", "Auto-Reply", "Date"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMails.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-800 max-w-[160px] truncate" title={m.sender}>{m.sender}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate" title={m.subject}>{m.subject}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 font-semibold">
                        {m.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[m.priority] || "bg-gray-100 text-gray-600"}`}>
                        {m.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-base">
                      {m.auto_reply_sent ? "✅" : "⏳"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {(m.processed_at || "").slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && query && filteredCands.length === 0 && filteredMails.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-semibold text-gray-600 text-lg">No results for "{query}"</p>
          <p className="text-gray-400 text-sm mt-1">Try a different keyword or adjust the filters above</p>
        </div>
      )}

      {/* Initial empty state (no query) */}
      {!loading && !query && filteredCands.length === 0 && filteredMails.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
          <div className="text-5xl mb-3">📂</div>
          <p className="font-semibold text-gray-600">No data yet</p>
          <p className="text-gray-400 text-sm mt-1">Candidates and business mails will appear here once processed</p>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;