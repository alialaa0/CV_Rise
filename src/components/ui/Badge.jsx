import React from "react";
import { STATUS_CONFIG } from "./constants";

export default function Badge({ status, size = "md", showDot = true, customLabel = null }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    styles: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400 dark:bg-slate-500",
  };

  const label = customLabel || config.label;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap transition-colors ${config.styles} ${sizeClasses}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
}
