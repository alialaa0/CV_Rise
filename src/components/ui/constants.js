export const STATUS_CONFIG = {
  new: {
    label: "Pending Review",
    styles: "bg-amber-50 text-amber-700 border-amber-200/80",
    dot: "bg-amber-500",
  },
  processing: {
    label: "Processing",
    styles: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  ai_generated: {
    label: "AI Ready",
    styles: "bg-violet-50 text-violet-700 border-violet-200/80",
    dot: "bg-violet-500",
  },
  in_review: {
    label: "In Review",
    styles: "bg-blue-50 text-blue-700 border-blue-200/80",
    dot: "bg-blue-600",
  },
  ready_to_send: {
    label: "Ready to Send",
    styles: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  sent: {
    label: "Sent",
    styles: "bg-slate-900 text-white border-slate-900",
    dot: "bg-emerald-400",
  },
  ai_failed: {
    label: "AI Failed",
    styles: "bg-rose-50 text-rose-700 border-rose-200/80",
    dot: "bg-rose-500",
  },
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const YEARS = Array.from(
  { length: 50 },
  (_, i) => new Date().getFullYear() - i
);
