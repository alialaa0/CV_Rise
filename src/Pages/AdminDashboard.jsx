import { useEffect, useMemo, useState } from "react";

import { getSubmissions } from "../services/adminService";

const STATUS_LABELS = {
  new: "Pending Review",
  processing: "Processing",
  ai_generated: "AI Ready",
  in_review: "In Review",
  ready_to_send: "Ready to Send",
  sent: "Sent",
  ai_failed: "AI Failed",
};

const STATUS_STYLES = {
  new: "border-amber-200 bg-amber-50 text-amber-800",
  processing: "border-slate-200 bg-slate-100 text-slate-700",
  ai_generated: "border-violet-200 bg-violet-50 text-violet-800",
  in_review: "border-blue-200 bg-blue-50 text-blue-800",
  ready_to_send: "border-emerald-200 bg-emerald-50 text-emerald-800",
  sent: "border-slate-800 bg-slate-900 text-white",
  ai_failed: "border-rose-200 bg-rose-50 text-rose-800",
};

const FILTERS = [
  { key: "all", label: "All", statuses: null },
  { key: "pending", label: "Pending", statuses: ["new", "processing", "ai_generated", "ai_failed"] },
  { key: "in_review", label: "In Review", statuses: ["in_review"] },
  { key: "ready", label: "Ready to Send", statuses: ["ready_to_send"] },
  { key: "sent", label: "Sent", statuses: ["sent"] },
];

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "candidate", label: "Candidate Name" },
  { key: "status", label: "Status" },
];

export default function AdminDashboard({ onOpenSubmission }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  async function loadSubmissions({ refresh = false } = {}) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const data = await getSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load submissions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  const enrichedSubmissions = useMemo(
    () => submissions.map((submission) => ({
      ...submission,
      profile: getSubmissionProfile(submission),
    })),
    [submissions]
  );

  const kpis = useMemo(() => {
    const total = enrichedSubmissions.length;

    return [
      {
        label: "Total Submissions",
        value: total,
        accent: "border-blue-200 bg-blue-50 text-blue-800",
      },
      {
        label: "Pending Review",
        value: countByStatuses(enrichedSubmissions, FILTERS[1].statuses),
        accent: "border-amber-200 bg-amber-50 text-amber-800",
      },
      {
        label: "In Review",
        value: countByStatuses(enrichedSubmissions, ["in_review"]),
        accent: "border-violet-200 bg-violet-50 text-violet-800",
      },
      {
        label: "Ready to Send",
        value: countByStatuses(enrichedSubmissions, ["ready_to_send"]),
        accent: "border-emerald-200 bg-emerald-50 text-emerald-800",
      },
      {
        label: "Sent",
        value: countByStatuses(enrichedSubmissions, ["sent"]),
        accent: "border-slate-200 bg-slate-100 text-slate-800",
      },
    ];
  }, [enrichedSubmissions]);

  const visibleSubmissions = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const filterConfig = FILTERS.find((item) => item.key === filter) || FILTERS[0];

    return enrichedSubmissions
      .filter((submission) => {
        if (!filterConfig.statuses) {
          return true;
        }

        return filterConfig.statuses.includes(submission.status);
      })
      .filter((submission) => {
        if (!cleanQuery) {
          return true;
        }

        return [
          submission.profile.name,
          submission.profile.email,
          submission.profile.targetTitle,
          submission.profile.company,
        ].some((value) => value.toLowerCase().includes(cleanQuery));
      })
      .sort((first, second) => sortSubmissions(first, second, sort));
  }, [enrichedSubmissions, filter, query, sort]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center p-6">
          <div className="w-full rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-950">Could not load submissions</h1>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => loadSubmissions()}
              className="mt-5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">CV Rise</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">Admin Workspace</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review candidate submissions, track readiness, and open each CV workflow.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block">
              <span className="sr-only">Search submissions</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, target, company"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-80"
              />
            </label>
            <button
              type="button"
              onClick={() => loadSubmissions({ refresh: true })}
              disabled={refreshing}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} />
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    filter === item.key
                      ? "border-blue-200 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {SORTS.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          {visibleSubmissions.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Candidate</th>
                      <th className="px-5 py-3">Target Position</th>
                      <th className="px-5 py-3">Submission Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Reviewer</th>
                      <th className="px-5 py-3">Last Updated</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {visibleSubmissions.map((submission) => (
                      <SubmissionRow key={submission.id} submission={submission} onOpenSubmission={onOpenSubmission} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {visibleSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} onOpenSubmission={onOpenSubmission} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function DashboardShell({ children }) {
  return <div className="min-h-screen bg-slate-100 text-slate-900">{children}</div>;
}

function DashboardSkeleton() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-5 h-8 w-14 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-80 rounded-lg border border-slate-200 bg-white shadow-sm" />
      </div>
    </DashboardShell>
  );
}

function KpiCard({ kpi }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${kpi.accent}`}>
        {kpi.label}
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{kpi.value}</p>
    </div>
  );
}

function SubmissionRow({ submission, onOpenSubmission }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-4">
        <div className="font-semibold text-slate-950">{submission.profile.name}</div>
        <div className="mt-1 text-xs text-slate-500">{submission.profile.email}</div>
      </td>
      <td className="px-5 py-4 text-slate-700">{submission.profile.targetTitle}</td>
      <td className="px-5 py-4 text-slate-500">{formatDate(submission.createdAt)}</td>
      <td className="px-5 py-4"><StatusBadge status={submission.status} /></td>
      <td className="px-5 py-4 text-slate-600">{submission.reviewerName || "Unassigned"}</td>
      <td className="px-5 py-4 text-slate-500">{formatDate(submission.updatedAt)}</td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onOpenSubmission(submission.id)}
          className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Open Review
        </button>
      </td>
    </tr>
  );
}

function SubmissionCard({ submission, onOpenSubmission }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-slate-950">{submission.profile.name}</h2>
          <p className="mt-1 truncate text-sm text-slate-500">{submission.profile.email}</p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <Meta label="Target" value={submission.profile.targetTitle} />
        <Meta label="Reviewer" value={submission.reviewerName || "Unassigned"} />
        <Meta label="Submitted" value={formatDate(submission.createdAt)} />
        <Meta label="Updated" value={formatDate(submission.updatedAt)} />
      </dl>

      <button
        type="button"
        onClick={() => onOpenSubmission(submission.id)}
        className="mt-4 w-full rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Open Review
      </button>
    </article>
  );
}

function Meta({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value || "-"}</dd>
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="p-12 text-center">
      <h2 className="text-lg font-semibold text-slate-950">
        {query ? "No matching submissions" : "No submissions yet"}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {query ? "Try a different search or filter." : "Candidate submissions will appear here when they are created."}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || "border-slate-200 bg-slate-100 text-slate-700"}`}>
      {STATUS_LABELS[status] || status || "Unknown"}
    </span>
  );
}

function getSubmissionProfile(submission) {
  const rawPersonal = submission.rawData?.personal || {};
  const aiPersonal = submission.aiData?.personal || {};
  const finalPersonal = submission.finalData?.personal || {};
  const personal = { ...rawPersonal, ...aiPersonal, ...finalPersonal };
  const firstCompany =
    submission.finalData?.experience?.[0]?.company ||
    submission.aiData?.experience?.[0]?.company ||
    submission.rawData?.experience?.[0]?.company ||
    "";

  return {
    name: personal.fullName || "Unnamed candidate",
    email: personal.email || "No email",
    targetTitle: personal.targetTitle || "-",
    company: firstCompany,
  };
}

function countByStatuses(submissions, statuses) {
  return submissions.filter((submission) => statuses.includes(submission.status)).length;
}

function sortSubmissions(first, second, sort) {
  if (sort === "oldest") {
    return getDateValue(first.createdAt) - getDateValue(second.createdAt);
  }

  if (sort === "candidate") {
    return first.profile.name.localeCompare(second.profile.name);
  }

  if (sort === "status") {
    return String(first.status || "").localeCompare(String(second.status || ""));
  }

  return getDateValue(second.createdAt) - getDateValue(first.createdAt);
}

function getDateValue(value) {
  const date = normalizeDate(value);
  return date ? date.getTime() : 0;
}

function formatDate(value) {
  const date = normalizeDate(value);
  return date ? date.toLocaleDateString() : "-";
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
