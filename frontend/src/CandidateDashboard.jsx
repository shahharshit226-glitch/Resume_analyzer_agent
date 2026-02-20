// import { useEffect, useState, useCallback } from "react";

// const POLL_INTERVAL = 10000; // refresh every 10 seconds

// const statusBadge = (status) => {
//   const base = "px-3 py-1 rounded-full text-xs font-bold inline-block ";
//   if (status === "Shortlisted") {
//     return <span className={base + "bg-green-100 text-green-700 border border-green-300"}>✅ Shortlisted</span>;
//   }
//   return <span className={base + "bg-red-100 text-red-700 border border-red-300"}>❌ Rejected</span>;
// };

// const CandidateDashboard = () => {
//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [lastUpdated, setLastUpdated] = useState(null);
//   const [error, setError] = useState(null);

//   const fetchCandidates = useCallback(async (isManual = false) => {
//     if (isManual) setRefreshing(true);
//     setError(null);
//     try {
//       const res = await fetch("http://localhost:8000/candidates");
//       if (!res.ok) throw new Error("Failed to fetch");
//       const data = await res.json();
//       setCandidates(data);
//       setLastUpdated(new Date().toLocaleTimeString());
//     } catch (err) {
//       setError("Could not reach backend. Is it running?");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   // Initial fetch
//   useEffect(() => {
//     fetchCandidates();
//   }, [fetchCandidates]);

//   // Auto-poll every 10 seconds
//   useEffect(() => {
//     const interval = setInterval(() => fetchCandidates(), POLL_INTERVAL);
//     return () => clearInterval(interval);
//   }, [fetchCandidates]);

//   const [showAll, setShowAll] = useState(false);

//   const shortlisted = candidates.filter((c) => c.status === "Shortlisted").length;
//   const rejected = candidates.filter((c) => c.status === "Rejected").length;
//   const visibleCandidates = showAll ? candidates : candidates.slice(0, 3);
//   const hasMore = candidates.length > 3;

//   return (
//     <div className="bg-white rounded-xl shadow p-6 my-6 max-w-4xl mx-auto">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-lg font-bold text-gray-800">📋 Candidate Dashboard</h2>
//           {lastUpdated && (
//             <p className="text-xs text-gray-400 mt-0.5">Last updated: {lastUpdated} · Auto-refreshes every 10s</p>
//           )}
//         </div>
//         <button
//           onClick={() => fetchCandidates(true)}
//           disabled={refreshing}
//           className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
//         >
//           <span className={refreshing ? "animate-spin inline-block" : "inline-block"}>🔄</span>
//           {refreshing ? "Refreshing..." : "Refresh"}
//         </button>
//       </div>

//       {/* Stats row */}
//       {candidates.length > 0 && (
//         <div className="flex gap-4 mb-4">
//           <div className="flex-1 bg-indigo-50 rounded-lg p-3 text-center">
//             <div className="text-2xl font-black text-indigo-700">{candidates.length}</div>
//             <div className="text-xs text-gray-500 font-medium">Total</div>
//           </div>
//           <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
//             <div className="text-2xl font-black text-green-700">{shortlisted}</div>
//             <div className="text-xs text-gray-500 font-medium">Shortlisted</div>
//           </div>
//           <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
//             <div className="text-2xl font-black text-red-700">{rejected}</div>
//             <div className="text-xs text-gray-500 font-medium">Rejected</div>
//           </div>
//         </div>
//       )}

//       {/* Content */}
//       {error ? (
//         <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
//       ) : loading ? (
//         <div className="text-gray-400 text-sm py-6 text-center">Loading candidates...</div>
//       ) : candidates.length === 0 ? (
//         <div className="text-gray-400 text-sm py-6 text-center">
//           No candidates yet. Once the email agent processes a resume, it will appear here.
//         </div>
//       ) : (
//         <>
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm text-left">
//               <thead>
//                 <tr className="bg-indigo-50">
//                   <th className="px-4 py-2 font-semibold text-gray-700">#</th>
//                   <th className="px-4 py-2 font-semibold text-gray-700">Email</th>
//                   <th className="px-4 py-2 font-semibold text-gray-700">Job Role</th>
//                   <th className="px-4 py-2 font-semibold text-gray-700">ATS Score</th>
//                   <th className="px-4 py-2 font-semibold text-gray-700">Status</th>
//                   <th className="px-4 py-2 font-semibold text-gray-700">Date</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {visibleCandidates.map((c, i) => (
//                   <tr key={i} className="border-b hover:bg-indigo-50/50 transition-colors">
//                     <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
//                     <td className="px-4 py-2 text-gray-800">{c.email}</td>
//                     <td className="px-4 py-2 text-gray-600">{c.job_role}</td>
//                     <td className="px-4 py-2">
//                       <span className="font-black text-indigo-700 text-base">{c.score}</span>
//                       <span className="text-gray-400 text-xs">/100</span>
//                     </td>
//                     <td className="px-4 py-2">{statusBadge(c.status)}</td>
//                     <td className="px-4 py-2 text-gray-400 text-xs">{c.date}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* Show more / less toggle */}
//           {hasMore && (
//             <div className="mt-4 text-center">
//               <button
//                 onClick={() => setShowAll((prev) => !prev)}
//                 className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-all"
//               >
//                 {showAll
//                   ? "⬆ Show Less"
//                   : `⬇ View All ${candidates.length} Candidates (${candidates.length - 3} more)`}
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default CandidateDashboard;


import React, { useEffect, useState, useCallback } from "react";

const POLL_INTERVAL = 10000; // refresh every 10 seconds

const statusBadge = (status) => {
  const base = "px-3 py-1 rounded-full text-xs font-bold inline-block ";
  if (status === "Shortlisted") {
    return <span className={base + "bg-green-100 text-green-700 border border-green-300"}>✅ Shortlisted</span>;
  }
  return <span className={base + "bg-red-100 text-red-700 border border-red-300"}>❌ Rejected</span>;
};

const CandidateDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchCandidates = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/candidates");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCandidates(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError("Could not reach backend. Is it running?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Auto-poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchCandidates(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

  const [showAll, setShowAll] = useState(false);

  const shortlisted = candidates.filter((c) => c.status === "Shortlisted").length;
  const rejected = candidates.filter((c) => c.status === "Rejected").length;
  const visibleCandidates = showAll ? candidates : candidates.slice(0, 3);
  const hasMore = candidates.length > 3;

  return (
    <div className="bg-white rounded-xl shadow p-6 my-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">📋 Candidate Dashboard</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">Last updated: {lastUpdated} · Auto-refreshes every 10s</p>
          )}
        </div>
        <button
          onClick={() => fetchCandidates(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          <span className={refreshing ? "animate-spin inline-block" : "inline-block"}>🔄</span>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats row */}
      {candidates.length > 0 && (
        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-indigo-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-indigo-700">{candidates.length}</div>
            <div className="text-xs text-gray-500 font-medium">Total</div>
          </div>
          <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-green-700">{shortlisted}</div>
            <div className="text-xs text-gray-500 font-medium">Shortlisted</div>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-red-700">{rejected}</div>
            <div className="text-xs text-gray-500 font-medium">Rejected</div>
          </div>
        </div>
      )}

      {/* Content */}
      {error ? (
        <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
      ) : loading ? (
        <div className="text-gray-400 text-sm py-6 text-center">Loading candidates...</div>
      ) : candidates.length === 0 ? (
        <div className="text-gray-400 text-sm py-6 text-center">
          No candidates yet. Once the email agent processes a resume, it will appear here.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="px-4 py-2 font-semibold text-gray-700">#</th>
                  <th className="px-4 py-2 font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-2 font-semibold text-gray-700">Job Role</th>
                  <th className="px-4 py-2 font-semibold text-gray-700">ATS Score</th>
                  <th className="px-4 py-2 font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-2 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {visibleCandidates.map((c, i) => (
                  <tr key={i} className="border-b hover:bg-indigo-50/50 transition-colors">
                    <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2 text-gray-800">{c.email}</td>
                    <td className="px-4 py-2 text-gray-600">{c.job_role}</td>
                    <td className="px-4 py-2">
                      <span
                        className="font-black text-indigo-700 text-base"
                        title="ATS Compatibility Score — used for shortlisting decision"
                      >{c.score}</span>
                      <span className="text-gray-400 text-xs">/100</span>
                      <div className="text-gray-400 text-xs">ATS</div>
                    </td>
                    <td className="px-4 py-2">{statusBadge(c.status)}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show more / less toggle */}
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll((prev) => !prev)}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-all"
              >
                {showAll
                  ? "⬆ Show Less"
                  : `⬇ View All ${candidates.length} Candidates (${candidates.length - 3} more)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CandidateDashboard;