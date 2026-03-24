import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const API    = "http://localhost:8000";
const COLORS = ["#4F46E5", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899"];
const POLL_INTERVAL = 15000;

const StatCard = ({ icon, label, value, sub, bg }) => (
  <div className={`${bg} rounded-2xl p-5 shadow-sm`}>
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-3xl font-black text-gray-900">{value}</div>
    <div className="text-sm font-semibold text-gray-700 mt-1">{label}</div>
    {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
  </div>
);

const AnalyticsDashboard = ({ token }) => {
  const [summary,   setSummary]   = useState(null);
  const [perDay,    setPerDay]    = useState([]);
  const [scoreDist, setScoreDist] = useState([]);
  const [mailCats,  setMailCats]  = useState([]);
  const [topRoles,  setTopRoles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchAnalytics = useCallback(async (showLoader = false) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (showLoader) setLoading(true);
    setError("");
    try {
      const [s, d, sc, mc, tr] = await Promise.all([
        fetch(`${API}/analytics/summary`,            { headers }).then(r => r.json()),
        fetch(`${API}/analytics/candidates-per-day`, { headers }).then(r => r.json()),
        fetch(`${API}/analytics/score-distribution`, { headers }).then(r => r.json()),
        fetch(`${API}/analytics/mail-categories`,    { headers }).then(r => r.json()),
        fetch(`${API}/analytics/top-job-roles`,      { headers }).then(r => r.json()),
      ]);
      setSummary(s); setPerDay(d); setScoreDist(sc); setMailCats(mc); setTopRoles(tr);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError("Could not load analytics. Make sure the backend is running.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnalytics(true);
    const id = setInterval(() => fetchAnalytics(false), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchAnalytics]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center text-gray-400">
        <div className="text-5xl mb-4">⏳</div>
        <p className="font-semibold">Loading analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto my-12 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <p className="font-semibold">{error}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">📊 Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Real-time insights across your entire HR pipeline
          {lastUpdated && <span className="ml-2 text-gray-400">· Updated: {lastUpdated}</span>}
        </p>
      </div>

      {/* Stat cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon="👤" label="Total Candidates" value={summary.total_candidates}     bg="bg-indigo-50" />
          <StatCard icon="✅" label="Shortlisted"       value={summary.shortlisted}          bg="bg-green-50"  />
          <StatCard icon="❌" label="Rejected"          value={summary.rejected}             bg="bg-red-50"    />
          <StatCard icon="🎯" label="Avg ATS Score"     value={`${summary.avg_ats_score}%`}  bg="bg-purple-50" />
          <StatCard icon="📧" label="Business Mails"    value={summary.total_mails}          bg="bg-amber-50"  />
          <StatCard
            icon="⚡" label="Auto-Replied" bg="bg-cyan-50"
            value={summary.mail_auto_replied}
            sub={`of ${summary.total_mails} emails`}
          />
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Candidates per day */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4 text-base">📈 Candidates — Last 7 Days</h2>
          {perDay.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={perDay} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="shortlisted" name="Shortlisted" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected"    name="Rejected"    fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ATS Score Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4 text-base">🎯 ATS Score Distribution</h2>
          {scoreDist.every(b => b.count === 0) ? (
            <div className="py-10 text-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDist} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                  {scoreDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mail categories pie */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4 text-base">📬 Business Mail Categories</h2>
          {mailCats.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No business mails yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={mailCats} dataKey="count" nameKey="category"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {mailCats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top job roles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4 text-base">💼 Top Job Roles Applied</h2>
          {topRoles.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No candidate data yet</div>
          ) : (
            <div className="space-y-3">
              {topRoles.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-semibold text-gray-800 mb-1">
                      <span>{r.role}</span>
                      <span className="text-gray-500 font-normal">
                        {r.count} applicants · avg {r.avg_score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (r.count / (topRoles[0]?.count || 1)) * 100)}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export buttons */}
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`${API}/export/candidates.csv`}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
        >
          ⬇️ Export Candidates CSV
        </a>
        <a
          href={`${API}/export/business-mails.csv`}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
        >
          ⬇️ Export Business Mails CSV
        </a>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
