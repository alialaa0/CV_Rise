import React, { useEffect, useMemo, useState } from "react";
import { getSubmissions } from "../services/adminService";
import { logoutAdmin } from "../services/authService";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

const FILTERS = [
  { key: "all", label: "All Submissions", statuses: null },
  {
    key: "pending",
    label: "Pending Review",
    statuses: ["new", "processing", "ai_generated", "ai_failed"],
  },
  { key: "in_review", label: "In Review", statuses: ["in_review"] },
  { key: "ready", label: "Ready to Send", statuses: ["ready_to_send"] },
  { key: "sent", label: "Sent", statuses: ["sent"] },
];

const SORTS = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "candidate", label: "Candidate Name" },
  { key: "status", label: "Status" },
];

export default function AdminDashboard({ onOpenSubmission, adminUser, onLogout }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSort, setActiveSort] = useState("newest");

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to fetch admin submissions:", err);
      setError("Failed to load candidate submissions. Please verify your administrative session.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      if (onLogout) onLogout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const enrichedSubmissions = useMemo(() => {
    return submissions.map((sub) => {
      const rawP = sub.rawData?.personal || {};
      const aiP = sub.aiData?.personal || {};
      const finP = sub.finalData?.personal || {};
      const p = { ...rawP, ...aiP, ...finP };

      const firstExp =
        sub.finalData?.experience?.[0] ||
        sub.aiData?.experience?.[0] ||
        sub.rawData?.experience?.[0] ||
        {};

      return {
        ...sub,
        profile: {
          name: p.fullName || "Unnamed Candidate",
          email: p.email || "No email",
          targetTitle: p.targetTitle || "—",
          company: firstExp.company || "",
        },
      };
    });
  }, [submissions]);

  const kpis = useMemo(() => {
    const total = enrichedSubmissions.length;
    const pending = enrichedSubmissions.filter((s) =>
      ["new", "processing", "ai_generated", "ai_failed"].includes(s.status)
    ).length;
    const inReview = enrichedSubmissions.filter((s) => s.status === "in_review").length;
    const ready = enrichedSubmissions.filter((s) => s.status === "ready_to_send").length;
    const sent = enrichedSubmissions.filter((s) => s.status === "sent").length;

    return [
      { label: "Total Submissions", value: total, color: "text-slate-900" },
      { label: "Pending Review", value: pending, color: "text-amber-700" },
      { label: "In Review", value: inReview, color: "text-blue-700" },
      { label: "Ready to Send", value: ready, color: "text-emerald-700" },
      { label: "Sent", value: sent, color: "text-slate-700" },
    ];
  }, [enrichedSubmissions]);

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const currentFilterObj = FILTERS.find((f) => f.key === activeFilter) || FILTERS[0];

    return enrichedSubmissions
      .filter((sub) => {
        if (!currentFilterObj.statuses) return true;
        return currentFilterObj.statuses.includes(sub.status);
      })
      .filter((sub) => {
        if (!q) return true;
        return (
          sub.profile.name.toLowerCase().includes(q) ||
          sub.profile.email.toLowerCase().includes(q) ||
          sub.profile.targetTitle.toLowerCase().includes(q) ||
          sub.profile.company.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (activeSort === "oldest") {
          return getDateTimestamp(a.createdAt) - getDateTimestamp(b.createdAt);
        }
        if (activeSort === "candidate") {
          return a.profile.name.localeCompare(b.profile.name);
        }
        if (activeSort === "status") {
          return String(a.status || "").localeCompare(String(b.status || ""));
        }
        return getDateTimestamp(b.createdAt) - getDateTimestamp(a.createdAt);
      });
  }, [enrichedSubmissions, activeFilter, searchQuery, activeSort]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-5 animate-pulse">
          <div className="h-7 w-40 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="h-80 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              CV
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                CV Rise
              </h1>
              <p className="text-xs text-slate-500 font-medium">Administrator Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {adminUser && (
              <span className="hidden sm:inline-block text-xs text-slate-600 font-medium border-r border-slate-200 pr-3">
                {adminUser.email}
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadData(true)}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* KPI Metrics Banner */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-0.5"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {kpi.label}
              </div>
              <div className={`text-2xl font-bold tracking-tight ${kpi.color}`}>
                {kpi.value}
              </div>
            </div>
          ))}
        </section>

        {/* Workspace Card */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeFilter === f.key
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search & Sort */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate, email, title..."
                    className="w-full sm:w-60 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <select
                  value={activeSort}
                  onChange={(e) => setActiveSort(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
                  aria-label="Sort submissions"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submissions Data View */}
          {error ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-rose-600 font-medium">{error}</p>
              <Button variant="secondary" size="sm" onClick={() => loadData()}>
                Retry
              </Button>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-10 text-center space-y-1.5">
              <p className="text-sm font-semibold text-slate-800">
                {searchQuery ? "No matching submissions found" : "No submissions in this view"}
              </p>
              <p className="text-xs text-slate-500">
                {searchQuery
                  ? "Try adjusting your search keyword or active filter."
                  : "Candidate submissions will appear here once submitted."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Target Position</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Reviewer</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Last Updated</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.map((sub) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50/80 transition-colors duration-100"
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-sm">
                            {sub.profile.name}
                          </div>
                          <div className="text-slate-500 text-xs mt-0.5">
                            {sub.profile.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 text-xs">
                            {sub.profile.targetTitle}
                          </div>
                          {sub.profile.company && (
                            <div className="text-slate-400 text-2xs mt-0.5">
                              {sub.profile.company}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={sub.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium text-xs">
                          {sub.reviewerName || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {formatDisplayDate(sub.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {formatDisplayDate(sub.updatedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenSubmission(sub.id)}
                          >
                            Open Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="lg:hidden divide-y divide-slate-100 p-3 space-y-3">
                {filteredSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{sub.profile.name}</h3>
                        <p className="text-xs text-slate-500">{sub.profile.email}</p>
                      </div>
                      <Badge status={sub.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
                      <div>
                        <span className="text-2xs uppercase font-semibold text-slate-400 block">
                          Target Position
                        </span>
                        <span>{sub.profile.targetTitle}</span>
                      </div>
                      <div>
                        <span className="text-2xs uppercase font-semibold text-slate-400 block">
                          Reviewer
                        </span>
                        <span>{sub.reviewerName || "Unassigned"}</span>
                      </div>
                      <div>
                        <span className="text-2xs uppercase font-semibold text-slate-400 block">
                          Submitted
                        </span>
                        <span>{formatDisplayDate(sub.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-2xs uppercase font-semibold text-slate-400 block">
                          Updated
                        </span>
                        <span>{formatDisplayDate(sub.updatedAt)}</span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => onOpenSubmission(sub.id)}
                    >
                      Open Review
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function getDateTimestamp(val) {
  if (!val) return 0;
  if (typeof val.toDate === "function") return val.toDate().getTime();
  if (typeof val.seconds === "number") return val.seconds * 1000;
  if (val instanceof Date) return val.getTime();
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatDisplayDate(val) {
  if (!val) return "—";
  let d = val;
  if (typeof val.toDate === "function") d = val.toDate();
  else if (typeof val.seconds === "number") d = new Date(val.seconds * 1000);
  else if (!(val instanceof Date)) d = new Date(val);

  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
