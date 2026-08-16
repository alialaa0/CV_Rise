import React, { useState } from "react";

const COMPARISON_PAIRS = [
  { from: "raw", to: "ai", label: "Original vs AI Generated" },
  { from: "ai", to: "final", label: "AI Generated vs Final CV" },
  { from: "raw", to: "final", label: "Original vs Final CV" },
];

export default function SourceComparisonView({ sourceDrafts }) {
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const pair = COMPARISON_PAIRS[selectedPairIndex];

  const fromCv = sourceDrafts?.[pair.from] || {};
  const toCv = sourceDrafts?.[pair.to] || {};

  const diffs = computeHumanReadableDiff(fromCv, toCv);

  return (
    <div className="space-y-4">
      {/* Pair Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Source Comparison</h3>
          <p className="text-xs text-slate-500">
            Compare differences between versions section by section.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          {COMPARISON_PAIRS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedPairIndex(idx)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                selectedPairIndex === idx
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Diffs List */}
      {diffs.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 font-medium">
            No meaningful differences detected between these two sources.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {diffs.map((section, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {section.title}
              </h4>

              <div className="grid gap-2.5 sm:grid-cols-3">
                {/* Added */}
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-3xs font-bold text-emerald-800 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Added ({section.added.length})</span>
                  </div>
                  {section.added.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">None</p>
                  ) : (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {section.added.map((item, i) => (
                        <li key={i} className="leading-snug">
                          + {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Removed */}
                <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-3xs font-bold text-rose-800 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Removed ({section.removed.length})</span>
                  </div>
                  {section.removed.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">None</p>
                  ) : (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {section.removed.map((item, i) => (
                        <li key={i} className="leading-snug">
                          − {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Changed / Modified */}
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-3xs font-bold text-blue-800 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Changed ({section.changed.length})</span>
                  </div>
                  {section.changed.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">None</p>
                  ) : (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {section.changed.map((item, i) => (
                        <li key={i} className="leading-snug">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function computeHumanReadableDiff(from, to) {
  const sections = [];

  // 1. Summary
  const fromSum = from.summary || from.personal?.summary || "";
  const toSum = to.summary || to.personal?.summary || "";
  if (fromSum.trim() !== toSum.trim()) {
    sections.push({
      title: "Professional Summary",
      added: !fromSum && toSum ? ["Summary created"] : [],
      removed: fromSum && !toSum ? ["Summary cleared"] : [],
      changed: fromSum && toSum ? ["Wording updated"] : [],
    });
  }

  // 2. Personal Info
  const p1 = from.personal || {};
  const p2 = to.personal || {};
  const personalChanges = [];
  ["fullName", "targetTitle", "email", "phone", "location", "linkedin", "portfolio"].forEach((f) => {
    if ((p1[f] || "").trim() !== (p2[f] || "").trim()) {
      personalChanges.push(`${formatLabel(f)}: "${p1[f] || "empty"}" → "${p2[f] || "empty"}"`);
    }
  });
  if (personalChanges.length > 0) {
    sections.push({
      title: "Personal Information",
      added: [],
      removed: [],
      changed: personalChanges,
    });
  }

  // 3. Skills
  const s1 = from.skills || {};
  const s2 = to.skills || {};
  const allGroups = ["technical", "tools", "soft"];
  const addedSkills = [];
  const removedSkills = [];

  allGroups.forEach((g) => {
    const list1 = Array.isArray(s1[g]) ? s1[g] : [];
    const list2 = Array.isArray(s2[g]) ? s2[g] : [];
    list2.filter((x) => !list1.includes(x)).forEach((x) => addedSkills.push(`${formatLabel(g)}: ${x}`));
    list1.filter((x) => !list2.includes(x)).forEach((x) => removedSkills.push(`${formatLabel(g)}: ${x}`));
  });

  if (addedSkills.length > 0 || removedSkills.length > 0) {
    sections.push({
      title: "Skills",
      added: addedSkills,
      removed: removedSkills,
      changed: [],
    });
  }

  // 4. Repeatable sections
  const repeatableKeys = [
    { key: "experience", title: "Work Experience", nameKey: "jobTitle" },
    { key: "education", title: "Education", nameKey: "degree" },
    { key: "internships", title: "Internships", nameKey: "title" },
    { key: "courses", title: "Courses & Training", nameKey: "name" },
    { key: "projects", title: "Projects", nameKey: "name" },
    { key: "accreditations", title: "Certifications", nameKey: "name" },
    { key: "languages", title: "Languages", nameKey: "language" },
    { key: "achievements", title: "Achievements", nameKey: "title" },
  ];

  repeatableKeys.forEach(({ key, title, nameKey }) => {
    const arr1 = Array.isArray(from[key]) ? from[key] : [];
    const arr2 = Array.isArray(to[key]) ? to[key] : [];

    const added = [];
    const removed = [];
    const changed = [];

    const max = Math.max(arr1.length, arr2.length);
    for (let i = 0; i < max; i++) {
      const item1 = arr1[i];
      const item2 = arr2[i];

      if (!item1 && item2) {
        added.push(`${item2[nameKey] || `Item #${i + 1}`}`);
      } else if (item1 && !item2) {
        removed.push(`${item1[nameKey] || `Item #${i + 1}`}`);
      } else if (JSON.stringify(item1) !== JSON.stringify(item2)) {
        changed.push(`${item2[nameKey] || item1[nameKey] || `Item #${i + 1}`} (details modified)`);
      }
    }

    if (added.length > 0 || removed.length > 0 || changed.length > 0) {
      sections.push({ title, added, removed, changed });
    }
  });

  return sections;
}

function formatLabel(str) {
  return String(str || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
