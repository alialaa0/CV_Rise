import React from "react";
import { MONTHS, YEARS } from "./constants";

export function FormField({ label, required = false, hint = null, error = null, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[13px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </span>
          {hint && <span className="text-xs text-slate-400 dark:text-slate-500 font-normal lowercase">{hint}</span>}
        </label>
      )}
      {children}
      {error && <span className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">{error}</span>}
    </div>
  );
}

export function TextInput({
  label,
  value = "",
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
  error = null,
  hint = null,
  dir = "auto",
  className = "",
  ...props
}) {
  return (
    <FormField label={label} required={required} hint={hint} error={error} className={className}>
      <input
        type={type}
        dir={dir}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm sm:text-[15px] leading-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-all duration-150 shadow-2xs"
        {...props}
      />
    </FormField>
  );
}

export function TextArea({
  label,
  value = "",
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  rows = 4,
  error = null,
  hint = null,
  dir = "auto",
  className = "",
  ...props
}) {
  return (
    <FormField label={label} required={required} hint={hint} error={error} className={className}>
      <textarea
        dir={dir}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm sm:text-[15px] leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed resize-y transition-all duration-150 shadow-2xs"
        {...props}
      />
    </FormField>
  );
}

export function SelectInput({
  label,
  value = "",
  onChange,
  options = [],
  placeholder = "Select option...",
  required = false,
  disabled = false,
  error = null,
  hint = null,
  className = "",
  ...props
}) {
  return (
    <FormField label={label} required={required} hint={hint} error={error} className={className}>
      <select
        value={value ?? ""}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm sm:text-[15px] leading-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-all duration-150 shadow-2xs"
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </FormField>
  );
}

export function MonthYearPicker({
  label,
  value = "",
  onChange,
  required = false,
  disabled = false,
  error = null,
  hint = null,
  monthPlaceholder = "Month",
  yearPlaceholder = "Year",
  className = "",
}) {
  let initialMonth = "";
  let initialYear = "";

  if (value) {
    if (value.includes("-")) {
      const parts = value.split("-");
      initialMonth = parts[0] || "";
      initialYear = parts[1] || "";
    } else if (value.includes(" ")) {
      const parts = value.split(" ");
      initialMonth = parts[0] || "";
      initialYear = parts[1] || "";
    }
  }

  const handleMonthChange = (newMonth) => {
    if (!newMonth && !initialYear) {
      onChange("");
    } else {
      onChange(`${newMonth || ""}-${initialYear || ""}`);
    }
  };

  const handleYearChange = (newYear) => {
    if (!initialMonth && !newYear) {
      onChange("");
    } else {
      onChange(`${initialMonth || ""}-${newYear || ""}`);
    }
  };

  return (
    <FormField label={label} required={required} hint={hint} error={error} className={className}>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={initialMonth}
          disabled={disabled}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm sm:text-[15px] leading-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all duration-150 shadow-2xs"
        >
          <option value="">{monthPlaceholder}</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={initialYear}
          disabled={disabled}
          onChange={(e) => handleYearChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm sm:text-[15px] leading-normal text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all duration-150 shadow-2xs"
        >
          <option value="">{yearPlaceholder}</option>
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </FormField>
  );
}

export function CheckboxToggle({ label, checked = false, onChange, disabled = false, className = "" }) {
  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none text-sm text-slate-700 dark:text-slate-300 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:text-slate-900 dark:hover:text-slate-100"
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 cursor-pointer"
      />
      <span className="font-semibold text-xs tracking-wide uppercase">{label}</span>
    </label>
  );
}
