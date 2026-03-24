// import React, { useEffect, useState, useCallback } from "react";

// const API_BASE = "http://localhost:8000";
// const POLL_INTERVAL = 15000;

// // ── Helpers ──────────────────────────────────────────────────────────────────

// const SECTION_META = {
//   HR:        { icon: "👥", color: "indigo",  label: "HR" },
//   Finance:   { icon: "💰", color: "emerald", label: "Finance" },
//   Logistics: { icon: "📦", color: "amber",   label: "Logistics" },
//   Support:   { icon: "🛠️", color: "rose",    label: "Support" },
// };

// const PRIORITY_BADGE = {
//   HIGH:   "bg-red-100 text-red-700 border-red-300",
//   MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-300",
//   LOW:    "bg-green-100 text-green-700 border-green-300",
// };

// const CATEGORY_DISPLAY = {
//   Appointment:   "📅 Appointment",
//   Resignation:   "🚪 Resignation",
//   Billing:       "💳 Billing",
//   Logistics:     "📦 Logistics",
//   BankStatement: "🏦 Bank Statement",
//   Support:       "🛠️ Support",
//   Uncategorized: "📬 Uncategorized",
// };

// // ── Sub-components ───────────────────────────────────────────────────────────

// const DraftModal = ({ mail, onClose, onSend }) => {
//   const [sending, setSending] = useState(false);
//   const [sent, setSent] = useState(mail?.draft_status === "sent");

//   const handleSend = async () => {
//     setSending(true);
//     try {
//       const res = await fetch(`${API_BASE}/draft/send/${mail.id}`, { method: "POST" });
//       const data = await res.json();
//       if (data.status === "sent" || data.status === "already_sent") {
//         setSent(true);
//         onSend && onSend(mail.id);
//       }
//     } catch {
//       /* ignore */
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
//         {/* Modal header */}
//         <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
//           <div>
//             <h3 className="text-white font-bold text-base">📝 Auto-Generated Draft Reply</h3>
//             <p className="text-indigo-200 text-xs mt-0.5">Review before sending</p>
//           </div>
//           <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
//         </div>

//         {/* Meta */}
//         <div className="px-6 pt-4 pb-2 border-b bg-gray-50 text-sm text-gray-600 space-y-1">
//           <div><span className="font-semibold text-gray-700">To: </span>{mail.sender}</div>
//           <div><span className="font-semibold text-gray-700">Subject: </span>Re: {mail.subject}</div>
//           <div><span className="font-semibold text-gray-700">Category: </span>
//             <span className="text-indigo-600 font-medium">{CATEGORY_DISPLAY[mail.category] || mail.category}</span>
//           </div>
//         </div>

//         {/* Draft body */}
//         <div className="px-6 py-4">
//           <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
//             {mail.draft_body}
//           </pre>
//         </div>

//         {/* Actions */}
//         <div className="px-6 pb-5 flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
//           >
//             Close
//           </button>
//           {sent ? (
//             <span className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-300 rounded-lg">
//               ✅ Sent
//             </span>
//           ) : (
//             <button
//               onClick={handleSend}
//               disabled={sending}
//               className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-all"
//             >
//               {sending ? "Sending…" : "✉️ Send Reply"}
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// const MailRow = ({ mail, index, onDraftClick }) => (
//   <tr className="border-b hover:bg-indigo-50/40 transition-colors">
//     <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
//     <td className="px-4 py-3 text-gray-800 text-sm max-w-[180px] truncate" title={mail.sender}>
//       {mail.sender}
//     </td>
//     <td className="px-4 py-3 text-gray-700 text-sm max-w-[220px]">
//       <div className="truncate font-medium" title={mail.subject}>{mail.subject}</div>
//       {mail.snippet && (
//         <div className="text-gray-400 text-xs truncate mt-0.5" title={mail.snippet}>
//           {mail.snippet}
//         </div>
//       )}
//     </td>
//     <td className="px-4 py-3">
//       <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
//         {CATEGORY_DISPLAY[mail.category] || mail.category}
//       </span>
//     </td>
//     <td className="px-4 py-3">
//       <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[mail.priority] || PRIORITY_BADGE.MEDIUM}`}>
//         {mail.priority}
//       </span>
//     </td>
//     <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{mail.processed_at}</td>
//     <td className="px-4 py-3">
//       <button
//         onClick={() => onDraftClick(mail)}
//         className="text-xs font-semibold px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
//       >
//         📝 Draft
//       </button>
//     </td>
//   </tr>
// );

// const SectionPanel = ({ sectionKey, data, onDraftClick }) => {
//   const meta = SECTION_META[sectionKey] || { icon: "📬", color: "gray", label: sectionKey };
//   const [expanded, setExpanded] = useState(true);
//   const mails = data?.mails || [];

//   const colorMap = {
//     indigo:  { header: "bg-indigo-600",  badge: "bg-indigo-100 text-indigo-700" },
//     emerald: { header: "bg-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
//     amber:   { header: "bg-amber-500",   badge: "bg-amber-100 text-amber-700" },
//     rose:    { header: "bg-rose-600",    badge: "bg-rose-100 text-rose-700" },
//     gray:    { header: "bg-gray-600",    badge: "bg-gray-100 text-gray-700" },
//   };
//   const colors = colorMap[meta.color] || colorMap.gray;

//   return (
//     <div className="bg-white rounded-xl shadow mb-5 overflow-hidden">
//       {/* Section header */}
//       <div
//         className={`${colors.header} px-5 py-3 flex items-center justify-between cursor-pointer`}
//         onClick={() => setExpanded((p) => !p)}
//       >
//         <div className="flex items-center gap-2">
//           <span className="text-xl">{meta.icon}</span>
//           <span className="text-white font-bold text-sm">{meta.label}</span>
//           <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
//             {mails.length}
//           </span>
//         </div>
//         <span className="text-white/80 text-sm">{expanded ? "▲" : "▼"}</span>
//       </div>

//       {/* Table */}
//       {expanded && (
//         mails.length === 0 ? (
//           <div className="text-gray-400 text-sm py-6 text-center">
//             No {meta.label.toLowerCase()} emails yet.
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm text-left">
//               <thead>
//                 <tr className="bg-gray-50 border-b">
//                   <th className="px-4 py-2 text-gray-500 font-semibold text-xs">#</th>
//                   <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Sender</th>
//                   <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Subject / Preview</th>
//                   <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Category</th>
//                   <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Priority</th>
//                   <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Received</th>
//                   <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Draft</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {mails.map((mail, i) => (
//                   <MailRow key={mail.id} mail={mail} index={i} onDraftClick={onDraftClick} />
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )
//       )}
//     </div>
//   );
// };

// // ── Main Component ────────────────────────────────────────────────────────────

// const BusinessMailCenter = () => {
//   const [sections, setSections] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [lastUpdated, setLastUpdated] = useState(null);
//   const [error, setError] = useState(null);
//   const [activeDraft, setActiveDraft] = useState(null);
//   const [totalMails, setTotalMails] = useState(0);

//   const fetchSections = useCallback(async (isManual = false) => {
//     if (isManual) setRefreshing(true);
//     setError(null);
//     try {
//       const res = await fetch(`${API_BASE}/categorized-mails/dashboard-sections`);
//       if (!res.ok) throw new Error("Failed to fetch");
//       const data = await res.json();
//       setSections(data);
//       const total = Object.values(data).reduce((acc, s) => acc + (s.total || 0), 0);
//       setTotalMails(total);
//       setLastUpdated(new Date().toLocaleTimeString());
//     } catch {
//       setError("Could not reach backend. Is it running?");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => { fetchSections(); }, [fetchSections]);
//   useEffect(() => {
//     const id = setInterval(() => fetchSections(), POLL_INTERVAL);
//     return () => clearInterval(id);
//   }, [fetchSections]);

//   const handleDraftSent = (mailId) => {
//     // Optimistically update draft status in sections state
//     setSections((prev) => {
//       const updated = { ...prev };
//       for (const sKey of Object.keys(updated)) {
//         updated[sKey] = {
//           ...updated[sKey],
//           mails: updated[sKey].mails.map((m) =>
//             m.id === mailId ? { ...m, draft_status: "sent" } : m
//           ),
//         };
//       }
//       return updated;
//     });
//   };

//   return (
//     <div className="max-w-5xl mx-auto px-2 py-6">
//       {/* Draft modal */}
//       {activeDraft && (
//         <DraftModal
//           mail={activeDraft}
//           onClose={() => setActiveDraft(null)}
//           onSend={(id) => { handleDraftSent(id); setActiveDraft(null); }}
//         />
//       )}

//       {/* Page header */}
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-black text-gray-900">🏢 Business Mail Center</h1>
//           <p className="text-gray-500 text-sm mt-0.5">
//             Smart categorization for non-resume business emails
//             {lastUpdated && (
//               <span className="ml-2 text-gray-400">· Last updated: {lastUpdated} · Auto-refreshes every 15s</span>
//             )}
//           </p>
//         </div>
//         <button
//           onClick={() => fetchSections(true)}
//           disabled={refreshing}
//           className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all"
//         >
//           <span className={refreshing ? "animate-spin" : ""}>🔄</span>
//           {refreshing ? "Refreshing…" : "Refresh"}
//         </button>
//       </div>

//       {/* Summary stats */}
//       {!loading && !error && (
//         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
//           {Object.entries(SECTION_META).map(([key, meta]) => {
//             const count = sections[key]?.total || 0;
//             const colorMap = {
//               indigo:  "bg-indigo-50 text-indigo-700",
//               emerald: "bg-emerald-50 text-emerald-700",
//               amber:   "bg-amber-50 text-amber-700",
//               rose:    "bg-rose-50 text-rose-700",
//             };
//             return (
//               <div key={key} className={`rounded-xl p-4 text-center ${colorMap[meta.color]}`}>
//                 <div className="text-2xl">{meta.icon}</div>
//                 <div className="text-2xl font-black mt-1">{count}</div>
//                 <div className="text-xs font-semibold opacity-70 mt-0.5">{meta.label}</div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* Content */}
//       {error ? (
//         <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-4">{error}</div>
//       ) : loading ? (
//         <div className="text-gray-400 text-sm py-12 text-center">Loading business mail center…</div>
//       ) : totalMails === 0 ? (
//         <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
//           <div className="text-4xl mb-3">📭</div>
//           <p className="font-semibold text-gray-500">No business emails categorized yet.</p>
//           <p className="text-sm mt-1">
//             Once the email agent processes a non-resume email, it will appear here automatically.
//           </p>
//         </div>
//       ) : (
//         Object.keys(SECTION_META).map((sKey) => (
//           <SectionPanel
//             key={sKey}
//             sectionKey={sKey}
//             data={sections[sKey]}
//             onDraftClick={setActiveDraft}
//           />
//         ))
//       )}
//     </div>
//   );
// };

// export default BusinessMailCenter;


import React, { useEffect, useState, useCallback } from "react";

const API_BASE = "http://localhost:8000";
const POLL_INTERVAL = 15000;

const SECTION_META = {
  HR:        { icon: "👥", color: "indigo",  label: "HR" },
  Finance:   { icon: "💰", color: "emerald", label: "Finance" },
  Logistics: { icon: "📦", color: "amber",   label: "Logistics" },
  Support:   { icon: "🛠️", color: "rose",    label: "Support" },
};

const PRIORITY_BADGE = {
  HIGH:   "bg-red-100 text-red-700 border-red-300",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-300",
  LOW:    "bg-green-100 text-green-700 border-green-300",
};

const CATEGORY_DISPLAY = {
  Appointment:   "📅 Appointment",
  Resignation:   "🚪 Resignation",
  Billing:       "💳 Billing",
  Logistics:     "📦 Logistics",
  BankStatement: "🏦 Bank Statement",
  Support:       "🛠️ Support",
  Uncategorized: "📬 Uncategorized",
};

// ── Draft Modal ───────────────────────────────────────────────────────────────
const DraftModal = ({ mail, onClose, onSend }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(mail?.draft_status === "sent");
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/draft/send/${mail.id}`, { method: "POST" });
      const data = await res.json();
      if (data.status === "sent" || data.status === "already_sent") {
        setSent(true);
        onSend && onSend(mail.id);
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mail.draft_body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base">📝 Draft Reply — Manual Follow-up</h3>
            <p className="text-indigo-200 text-xs mt-0.5">
              Auto-reply already sent ✅ · This draft is for your detailed follow-up
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Auto-reply status banner */}
        {mail.auto_reply_sent ? (
          <div className="bg-green-50 border-b border-green-200 px-6 py-3 flex items-center gap-2">
            <span className="text-green-600 text-lg">✅</span>
            <div>
              <span className="text-green-800 font-semibold text-sm">Instant acknowledgement auto-reply was sent</span>
              <p className="text-green-600 text-xs">Sender was notified their email was received and is being reviewed.</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
            <span className="text-yellow-600 text-lg">⚠️</span>
            <span className="text-yellow-800 text-sm font-medium">Auto-reply could not be sent (check SMTP config) — send this draft manually.</span>
          </div>
        )}

        {/* Meta */}
        <div className="px-6 pt-4 pb-3 bg-gray-50 border-b text-sm text-gray-600 space-y-1.5">
          <div><span className="font-semibold text-gray-700 w-20 inline-block">To:</span>{mail.sender}</div>
          <div><span className="font-semibold text-gray-700 w-20 inline-block">Subject:</span>Re: {mail.subject}</div>
          <div>
            <span className="font-semibold text-gray-700 w-20 inline-block">Category:</span>
            <span className="text-indigo-600 font-medium">{CATEGORY_DISPLAY[mail.category] || mail.category}</span>
          </div>
        </div>

        {/* Draft body */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Draft Message</p>
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-60 overflow-y-auto">
            {mail.draft_body}
          </pre>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          {sent ? (
            <span className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-300 rounded-lg">
              ✅ Draft Sent
            </span>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-all"
            >
              {sending ? "Sending…" : "✉️ Send Draft Reply"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Mail Row ──────────────────────────────────────────────────────────────────
const MailRow = ({ mail, index, onDraftClick }) => (
  <tr className="border-b hover:bg-indigo-50/40 transition-colors">
    <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>

    <td className="px-4 py-3 text-gray-800 text-sm max-w-[160px] truncate" title={mail.sender}>
      {mail.sender}
    </td>

    <td className="px-4 py-3 text-gray-700 text-sm max-w-[200px]">
      <div className="truncate font-medium" title={mail.subject}>{mail.subject}</div>
      {mail.snippet && (
        <div className="text-gray-400 text-xs truncate mt-0.5" title={mail.snippet}>
          {mail.snippet}
        </div>
      )}
    </td>

    <td className="px-4 py-3">
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
        {CATEGORY_DISPLAY[mail.category] || mail.category}
      </span>
    </td>

    <td className="px-4 py-3">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[mail.priority] || PRIORITY_BADGE.MEDIUM}`}>
        {mail.priority}
      </span>
    </td>

    {/* Auto-reply status */}
    <td className="px-4 py-3 text-center">
      {mail.auto_reply_sent ? (
        <span title="Instant acknowledgement sent" className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-300 rounded-full px-2 py-0.5">
          ✅ Sent
        </span>
      ) : (
        <span title="Auto-reply not sent" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
          ⏳ Pending
        </span>
      )}
    </td>

    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{mail.processed_at}</td>

    {/* Draft button */}
    <td className="px-4 py-3">
      <button
        onClick={() => onDraftClick(mail)}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
          mail.draft_status === "sent"
            ? "bg-green-50 text-green-700 border border-green-300"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
      >
        {mail.draft_status === "sent" ? "✅ Sent" : "📝 Draft"}
      </button>
    </td>
  </tr>
);

// ── Section Panel ─────────────────────────────────────────────────────────────
const SectionPanel = ({ sectionKey, data, onDraftClick }) => {
  const meta   = SECTION_META[sectionKey] || { icon: "📬", color: "gray", label: sectionKey };
  const mails  = data?.mails || [];
  const [expanded, setExpanded] = useState(true);

  const autoRepliedCount = mails.filter(m => m.auto_reply_sent).length;

  const colorMap = {
    indigo:  { header: "bg-indigo-600",  badge: "bg-white text-indigo-700" },
    emerald: { header: "bg-emerald-600", badge: "bg-white text-emerald-700" },
    amber:   { header: "bg-amber-500",   badge: "bg-white text-amber-700" },
    rose:    { header: "bg-rose-600",    badge: "bg-white text-rose-700" },
    gray:    { header: "bg-gray-600",    badge: "bg-white text-gray-700" },
  };
  const colors = colorMap[meta.color] || colorMap.gray;

  return (
    <div className="bg-white rounded-xl shadow mb-5 overflow-hidden">
      <div
        className={`${colors.header} px-5 py-3 flex items-center justify-between cursor-pointer`}
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{meta.icon}</span>
          <span className="text-white font-bold text-sm">{meta.label}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
            {mails.length} emails
          </span>
          {mails.length > 0 && (
            <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
              ✅ {autoRepliedCount}/{mails.length} auto-replied
            </span>
          )}
        </div>
        <span className="text-white/80 text-sm">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        mails.length === 0 ? (
          <div className="text-gray-400 text-sm py-8 text-center">
            No {meta.label.toLowerCase()} emails yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-gray-500 font-semibold text-xs">#</th>
                  <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Sender</th>
                  <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Subject / Preview</th>
                  <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Category</th>
                  <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Priority</th>
                  <th className="px-4 py-2 text-gray-500 font-semibold text-xs text-center">Auto-Reply</th>
                  <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Received</th>
                  <th className="px-4 py-2 text-gray-500 font-semibold text-xs">Draft</th>
                </tr>
              </thead>
              <tbody>
                {mails.map((mail, i) => (
                  <MailRow key={mail.id} mail={mail} index={i} onDraftClick={onDraftClick} />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const BusinessMailCenter = () => {
  const [sections,    setSections]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState(null);
  const [activeDraft, setActiveDraft] = useState(null);
  const [totalMails,  setTotalMails]  = useState(0);
  const [totalAutoReplied, setTotalAutoReplied] = useState(0);

  const fetchSections = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const res  = await fetch(`${API_BASE}/categorized-mails/dashboard-sections`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSections(data);

      let total = 0, autoReplied = 0;
      Object.values(data).forEach(s => {
        total       += s.total || 0;
        autoReplied += (s.mails || []).filter(m => m.auto_reply_sent).length;
      });
      setTotalMails(total);
      setTotalAutoReplied(autoReplied);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError("Could not reach backend. Is it running?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);
  useEffect(() => {
    const id = setInterval(() => fetchSections(), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchSections]);

  const handleDraftSent = (mailId) => {
    setSections(prev => {
      const updated = { ...prev };
      for (const sKey of Object.keys(updated)) {
        updated[sKey] = {
          ...updated[sKey],
          mails: updated[sKey].mails.map(m =>
            m.id === mailId ? { ...m, draft_status: "sent" } : m
          ),
        };
      }
      return updated;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-2 py-6">
      {/* Draft modal */}
      {activeDraft && (
        <DraftModal
          mail={activeDraft}
          onClose={() => setActiveDraft(null)}
          onSend={id => { handleDraftSent(id); setActiveDraft(null); }}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">🏢 Business Mail Center</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Smart categorization · Instant auto-replies · Draft follow-ups
            {lastUpdated && (
              <span className="ml-2 text-gray-400">· Updated: {lastUpdated}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchSections(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all"
        >
          <span className={refreshing ? "animate-spin" : ""}>🔄</span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* How it works banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 mb-6">
        <h3 className="text-indigo-800 font-bold text-sm mb-2">⚡ How Business Mail Processing Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-indigo-700">
          <div className="flex items-start gap-2">
            <span className="text-lg">📨</span>
            <div>
              <div className="font-semibold">1. Email Arrives</div>
              <div className="text-indigo-500">Non-resume email detected by agent</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">✅</span>
            <div>
              <div className="font-semibold">2. Auto-Reply Sent Instantly</div>
              <div className="text-indigo-500">"We received your email and are reviewing it"</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">📝</span>
            <div>
              <div className="font-semibold">3. Draft Saved for You</div>
              <div className="text-indigo-500">Full professional reply ready — send when ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(SECTION_META).map(([key, meta]) => {
            const count         = sections[key]?.total || 0;
            const autoReplied   = (sections[key]?.mails || []).filter(m => m.auto_reply_sent).length;
            const colorMap = {
              indigo:  "bg-indigo-50 text-indigo-700",
              emerald: "bg-emerald-50 text-emerald-700",
              amber:   "bg-amber-50 text-amber-700",
              rose:    "bg-rose-50 text-rose-700",
            };
            return (
              <div key={key} className={`rounded-xl p-4 text-center ${colorMap[meta.color]}`}>
                <div className="text-2xl">{meta.icon}</div>
                <div className="text-2xl font-black mt-1">{count}</div>
                <div className="text-xs font-semibold opacity-70">{meta.label}</div>
                {count > 0 && (
                  <div className="text-xs mt-1 opacity-60">✅ {autoReplied} replied</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Global auto-reply summary */}
      {!loading && !error && totalMails > 0 && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-6">
          <span className="text-2xl">📊</span>
          <div className="text-sm">
            <span className="font-bold text-green-800">{totalAutoReplied} of {totalMails}</span>
            <span className="text-green-700"> senders received instant acknowledgement auto-replies.</span>
            {totalMails - totalAutoReplied > 0 && (
              <span className="text-yellow-700 ml-2">
                ⚠️ {totalMails - totalAutoReplied} need manual attention (check SMTP config).
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {error ? (
        <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-4">{error}</div>
      ) : loading ? (
        <div className="text-gray-400 text-sm py-12 text-center">Loading business mail center…</div>
      ) : totalMails === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="font-semibold text-gray-500 text-lg">No business emails categorized yet.</p>
          <p className="text-sm mt-2 max-w-md mx-auto">
            Once the email agent receives a non-resume email, it will automatically
            send an acknowledgement reply to the sender and save a draft here for your follow-up.
          </p>
        </div>
      ) : (
        Object.keys(SECTION_META).map(sKey => (
          <SectionPanel
            key={sKey}
            sectionKey={sKey}
            data={sections[sKey]}
            onDraftClick={setActiveDraft}
          />
        ))
      )}
    </div>
  );
};

export default BusinessMailCenter;