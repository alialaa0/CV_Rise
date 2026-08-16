import { useEffect, useMemo, useRef, useState } from "react";

import {
  getSubmission,
  saveFinalCV,
  saveSourceCV,
  startReview,
  markReadyToSend,
  markAsSent,
} from "../services/adminService";

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

const SOURCE_OPTIONS = [
  { key: "raw", field: "rawData", label: "Original", fullLabel: "Original Submission", saveLabel: "Save Original" },
  { key: "ai", field: "aiData", label: "AI Generated", fullLabel: "AI Generated", saveLabel: "Save AI Version" },
  { key: "final", field: "finalData", label: "Final", fullLabel: "Final CV", saveLabel: "Save Final CV" },
];

const COMPARISON_OPTIONS = [
  { from: "raw", to: "ai", label: "Compare Original vs AI" },
  { from: "ai", to: "final", label: "Compare AI vs Final" },
  { from: "raw", to: "final", label: "Compare Original vs Final" },
];

const PERSONAL_FIELDS = [
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "targetTitle", label: "Target Position" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "portfolio", label: "Portfolio" },
];

const REPEATABLE_SECTIONS = [
  {
    key: "education",
    label: "Education",
    itemLabel: "Education",
    addLabel: "Add Education",
    fields: [
      { key: "degree", label: "Degree" },
      { key: "institution", label: "Institution" },
      { key: "fieldOfStudy", label: "Field of Study" },
      { key: "startDate", label: "Start Date", placeholder: "September 2022" },
      { key: "endDate", label: "End Date", placeholder: "July 2026" },
      { key: "grade", label: "Grade" },
    ],
  },
  {
    key: "experience",
    label: "Experience",
    itemLabel: "Experience",
    addLabel: "Add Experience",
    fields: [
      { key: "company", label: "Company" },
      { key: "jobTitle", label: "Job Title" },
      { key: "employmentType", label: "Employment Type" },
      { key: "location", label: "Location" },
      { key: "startDate", label: "Start Date", placeholder: "January 2024" },
      { key: "endDate", label: "End Date", placeholder: "Present" },
      { key: "current", label: "Current", type: "checkbox" },
      { key: "responsibilities", label: "Responsibilities", type: "textarea" },
      { key: "achievements", label: "Achievements", type: "textarea" },
    ],
  },
  {
    key: "internships",
    label: "Internships",
    itemLabel: "Internship",
    addLabel: "Add Internship",
    fields: [
      { key: "title", label: "Title" },
      { key: "company", label: "Company" },
      { key: "location", label: "Location" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    key: "courses",
    label: "Courses",
    itemLabel: "Course",
    addLabel: "Add Course",
    fields: [
      { key: "name", label: "Name" },
      { key: "provider", label: "Provider" },
      { key: "date", label: "Date" },
      { key: "certificateId", label: "Certificate ID" },
    ],
  },
  {
    key: "languages",
    label: "Languages",
    itemLabel: "Language",
    addLabel: "Add Language",
    fields: [
      { key: "language", label: "Language" },
      { key: "level", label: "Level" },
    ],
  },
  {
    key: "achievements",
    label: "Achievements",
    itemLabel: "Achievement",
    addLabel: "Add Achievement",
    fields: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "date", label: "Date" },
    ],
  },
  {
    key: "projects",
    label: "Projects",
    itemLabel: "Project",
    addLabel: "Add Project",
    fields: [
      { key: "name", label: "Name" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "technologies", label: "Technologies" },
      { key: "link", label: "Link" },
    ],
  },
  {
    key: "accreditations",
    label: "Accreditations",
    itemLabel: "Accreditation",
    addLabel: "Add Accreditation",
    fields: [
      { key: "name", label: "Name" },
      { key: "issuer", label: "Issuer" },
      { key: "date", label: "Date" },
      { key: "credentialId", label: "Credential ID" },
    ],
  },
];

const SKILL_GROUPS = [
  { key: "technical", label: "Technical Skills" },
  { key: "tools", label: "Tools" },
  { key: "soft", label: "Soft Skills" },
];

const EMPTY_SKILLS = { technical: [], tools: [], soft: [] };

const BASE_NAV_ITEMS = [
  { key: "source", label: "Source" },
  { key: "personal", label: "Personal Information" },
  { key: "summary", label: "Professional Summary" },
  { key: "skills", label: "Skills" },
];

const FINAL_NAV_ITEM = { key: "final-review", label: "Final Review" };

const ASSISTANT_PROMPTS = [
  "Make the summary shorter",
  "Make it ATS friendly",
  "Improve experience",
  "Fix grammar",
  "Make this CV more professional and concise",
  "Find missing information",
];

export default function AdminCVReview({ submissionId, onBack }) {
  const [submission, setSubmission] = useState(null);
  const [sourceDrafts, setSourceDrafts] = useState(null);
  const [selectedSource, setSelectedSource] = useState("final");
  const [reviewerName, setReviewerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState("");
  const [message, setMessage] = useState(null);
  const [dirtySources, setDirtySources] = useState({});
  const [activeSection, setActiveSection] = useState("source");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [rawModalSource, setRawModalSource] = useState(null);
  const [comparisonPair, setComparisonPair] = useState(COMPARISON_OPTIONS[0]);
  const [confirmUseAsFinal, setConfirmUseAsFinal] = useState(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    let isMounted = true;

    async function loadSubmission() {
      try {
        setLoading(true);
        setMessage(null);

        const data = await getSubmission(submissionId);

        if (!isMounted) {
          return;
        }

        setSubmission(data);
        setReviewerName(data.reviewerName || "");
        setSourceDrafts(buildSourceDrafts(data));
        setSelectedSource(data.finalData ? "final" : "raw");
        setDirtySources({});
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setMessage({ type: "error", text: "Failed to load submission." });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSubmission();

    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  const selectedConfig = getSourceConfig(selectedSource);
  const selectedCV = sourceDrafts?.[selectedSource] || createEmptyCV();
  const selectedPreparedData = useMemo(() => prepareCVData(selectedCV), [selectedCV]);
  const finalPreparedData = useMemo(
    () => prepareCVData(sourceDrafts?.final || createEmptyCV()),
    [sourceDrafts]
  );
  const hasAnyDirtySource = Object.values(dirtySources).some(Boolean);
  const canMarkSent = submission?.status === "ready_to_send";
  const headerPersonal =
    selectedCV.personal ||
    sourceDrafts?.final?.personal ||
    sourceDrafts?.raw?.personal ||
    {};
  const candidateName = headerPersonal.fullName || "Unnamed Candidate";
  const targetPosition = headerPersonal.targetTitle || "No target position";

  const navItems = useMemo(() => {
    if (!selectedCV) {
      return [...BASE_NAV_ITEMS, FINAL_NAV_ITEM];
    }

    return [
      ...BASE_NAV_ITEMS.map((item) => ({
        ...item,
        count: getSectionCount(item.key, selectedCV),
      })),
      ...REPEATABLE_SECTIONS.map((section) => ({
        key: section.key,
        label: section.label,
        count: getSectionCount(section.key, selectedCV),
      })),
      FINAL_NAV_ITEM,
    ];
  }, [selectedCV]);

  const sourceComparison = useMemo(() => {
    if (!sourceDrafts || !comparisonPair) {
      return [];
    }

    return compareCVSources(comparisonPair.from, comparisonPair.to, sourceDrafts);
  }, [sourceDrafts, comparisonPair]);

  useEffect(() => {
    if (!selectedCV || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0];

        if (visibleEntry?.target?.dataset?.sectionKey) {
          setActiveSection(visibleEntry.target.dataset.sectionKey);
        }
      },
      { rootMargin: "-160px 0px -55% 0px", threshold: [0.1, 0.35] }
    );

    Object.values(sectionRefs.current).forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [selectedCV, selectedSource]);

  function registerSection(key, element) {
    if (element) {
      sectionRefs.current[key] = element;
    }
  }

  function activateSection(key, shouldScroll = false) {
    setActiveSection(key);

    if (shouldScroll) {
      sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function updateSelectedDraft(updater) {
    setDirtySources((previous) => ({ ...previous, [selectedSource]: true }));
    setSourceDrafts((previous) => ({
      ...previous,
      [selectedSource]: updater(previous[selectedSource] || createEmptyCV()),
    }));
  }

  function updatePersonal(field, value) {
    updateSelectedDraft((previous) => ({
      ...previous,
      personal: { ...(previous.personal || {}), [field]: value },
    }));
  }

  function updateSummary(value) {
    updateSelectedDraft((previous) => ({
      ...previous,
      summary: value,
      personal: { ...(previous.personal || {}), summary: value },
    }));
  }

  function updateArrayItem(section, index, field, value) {
    updateSelectedDraft((previous) => {
      const items = [...(previous[section] || [])];
      const current = items[index];

      items[index] = field === null
        ? value
        : { ...(isPlainObject(current) ? current : {}), [field]: value };

      return { ...previous, [section]: items };
    });
  }

  function addArrayItem(section) {
    const sectionConfig = REPEATABLE_SECTIONS.find((item) => item.key === section);

    updateSelectedDraft((previous) => ({
      ...previous,
      [section]: [...(previous[section] || []), createEmptyItem(sectionConfig)],
    }));
  }

  function deleteArrayItem(section, index) {
    const confirmed = window.confirm(
      "Delete this item? This only changes the currently selected source until you save."
    );

    if (!confirmed) {
      return;
    }

    updateSelectedDraft((previous) => ({
      ...previous,
      [section]: (previous[section] || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function addSkill(group, value) {
    const cleanValue = value.trim();

    if (!cleanValue) {
      return;
    }

    updateSelectedDraft((previous) => {
      const skills = normalizeSkillsObject(previous.skills);
      const current = skills[group] || [];

      if (current.includes(cleanValue)) {
        return previous;
      }

      return { ...previous, skills: { ...skills, [group]: [...current, cleanValue] } };
    });
  }

  function removeSkill(group, value) {
    updateSelectedDraft((previous) => {
      const skills = normalizeSkillsObject(previous.skills);

      return {
        ...previous,
        skills: { ...skills, [group]: (skills[group] || []).filter((item) => item !== value) },
      };
    });
  }

  function applyAssistantAction(action) {
    if (!action || !isPlainObject(action)) {
      return false;
    }

    if (action.type === "batch" && Array.isArray(action.actions)) {
      let appliedAny = false;
      action.actions.forEach((item) => {
        appliedAny = applyAssistantAction(item) || appliedAny;
      });
      return appliedAny;
    }

    if (action.type === "update_summary") {
      updateSummary(String(action.value || ""));
      activateSection("summary", true);
      return true;
    }

    if (action.type === "update_personal" && PERSONAL_FIELDS.some((field) => field.key === action.field)) {
      updatePersonal(action.field, String(action.value || ""));
      activateSection("personal", true);
      return true;
    }

    if (action.type === "add_skill" && SKILL_GROUPS.some((group) => group.key === action.group)) {
      addSkill(action.group, String(action.value || ""));
      activateSection("skills", true);
      return true;
    }

    if (action.type === "remove_skill" && SKILL_GROUPS.some((group) => group.key === action.group)) {
      removeSkill(action.group, String(action.value || ""));
      activateSection("skills", true);
      return true;
    }

    if (
      action.type === "update_section" &&
      REPEATABLE_SECTIONS.some((section) => section.key === action.section) &&
      Array.isArray(action.value)
    ) {
      updateSelectedDraft((previous) => ({ ...previous, [action.section]: action.value }));
      activateSection(action.section, true);
      return true;
    }

    return false;
  }

  async function handleSaveSource() {
    if (!validateReviewer()) {
      return;
    }

    const sourceData = selectedSource === "final" ? finalPreparedData : selectedPreparedData;

    try {
      setSaving(true);
      setMessage(null);

      await saveSourceCV(submissionId, selectedConfig.field, sourceData, reviewerName.trim());

      setSubmission((previous) => ({
        ...previous,
        [selectedConfig.field]: sourceData,
        status: selectedSource === "final" ? "in_review" : previous.status,
        reviewerName: reviewerName.trim(),
        updatedAt: new Date(),
      }));

      setSourceDrafts((previous) => ({
        ...previous,
        [selectedSource]: buildEditableCV(sourceData),
      }));
      setDirtySources((previous) => ({ ...previous, [selectedSource]: false }));
      setMessage({ type: "success", text: `${selectedConfig.fullLabel} saved.` });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: `Failed to save ${selectedConfig.fullLabel.toLowerCase()}.` });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFinal() {
    if (!validateReviewer()) {
      return false;
    }

    try {
      setSaving(true);
      setMessage(null);

      await saveFinalCV(submissionId, finalPreparedData, reviewerName.trim());

      setSubmission((previous) => ({
        ...previous,
        finalData: finalPreparedData,
        status: "in_review",
        reviewerName: reviewerName.trim(),
        updatedAt: new Date(),
      }));

      setSourceDrafts((previous) => ({ ...previous, final: buildEditableCV(finalPreparedData) }));
      setDirtySources((previous) => ({ ...previous, final: false }));
      setMessage({ type: "success", text: "Final CV saved." });
      return true;
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to save Final CV." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleStartReview() {
    if (!validateReviewer()) {
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await startReview(submissionId, reviewerName.trim());
      setSubmission((previous) => ({
        ...previous,
        status: "in_review",
        reviewerName: reviewerName.trim(),
        reviewStartedAt: previous?.reviewStartedAt || new Date(),
        updatedAt: new Date(),
      }));
      setMessage({ type: "success", text: "Review started." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to start review." });
    } finally {
      setSaving(false);
    }
  }

  async function handleReadyToSend() {
    if (!validateReviewer()) {
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await markReadyToSend(submissionId, finalPreparedData, reviewerName.trim());
      setSubmission((previous) => ({
        ...previous,
        finalData: finalPreparedData,
        status: "ready_to_send",
        reviewerName: reviewerName.trim(),
        reviewedAt: new Date(),
        updatedAt: new Date(),
      }));
      setDirtySources((previous) => ({ ...previous, final: false }));
      setMessage({ type: "success", text: "CV marked as ready to send." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to mark CV as ready to send." });
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkSent() {
    if (!canMarkSent) {
      setMessage({ type: "error", text: "Mark the CV as Ready to Send before marking it as Sent." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await markAsSent(submissionId);
      setSubmission((previous) => ({ ...previous, status: "sent", sentAt: new Date(), updatedAt: new Date() }));
      setMessage({ type: "success", text: "CV marked as sent." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to mark CV as sent." });
    } finally {
      setSaving(false);
    }
  }

  function handleUseAsFinal(sourceKey) {
    const sourceConfig = getSourceConfig(sourceKey);

    setSourceDrafts((previous) => ({ ...previous, final: cloneCV(previous[sourceKey] || createEmptyCV()) }));
    setDirtySources((previous) => ({ ...previous, final: true }));
    setSelectedSource("final");
    setConfirmUseAsFinal(null);
    setMessage({
      type: "success",
      text: `${sourceConfig.fullLabel} copied into Final CV locally. Use Save Final CV when ready.`,
    });
  }

  function handleExportWord() {
    try {
      setExporting("word");
      downloadBlob(createDocxBlob(finalPreparedData), `${buildCleanFileName(finalPreparedData)}.docx`);
      setMessage({ type: "success", text: "Your CV is ready. Download Word completed." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to generate Word document." });
    } finally {
      setExporting("");
    }
  }

  function handleExportPdf() {
    try {
      setExporting("pdf");
      downloadBlob(createPdfBlob(finalPreparedData), `${buildCleanFileName(finalPreparedData)}.pdf`);
      setMessage({ type: "success", text: "Your CV is ready. Download PDF completed." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to generate PDF." });
    } finally {
      setExporting("");
    }
  }

  function validateReviewer() {
    if (reviewerName.trim()) {
      return true;
    }

    setMessage({ type: "error", text: "Reviewer name is required." });
    return false;
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="mt-4 h-8 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-4/5 rounded bg-slate-100" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!submission || !sourceDrafts) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">CV not found</h1>
            <button type="button" onClick={onBack} className="mt-4 text-sm font-medium text-blue-700 hover:text-blue-900">
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button type="button" onClick={onBack} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                Back to Dashboard
              </button>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-semibold text-slate-950">{candidateName}</h1>
                <StatusBadge status={submission.status} />
                {hasAnyDirtySource && (
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">
                    Unsaved source edits
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">{targetPosition}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Editing: {selectedConfig.fullLabel}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[220px_auto] lg:min-w-[660px]">
              <FieldInput label="Reviewer Name" value={reviewerName} onChange={setReviewerName} disabled={saving} required />

              <div className="flex flex-wrap items-end gap-2">
                <ActionButton variant="secondary" onClick={handleStartReview} disabled={saving}>Start Review</ActionButton>
                <ActionButton onClick={handleSaveSource} disabled={saving}>{saving ? "Saving..." : selectedConfig.saveLabel}</ActionButton>
                <ActionButton variant="success" onClick={handleReadyToSend} disabled={saving}>Ready to Send</ActionButton>
                <ActionButton
                  variant="dark"
                  onClick={handleMarkSent}
                  disabled={saving || !canMarkSent}
                  title={canMarkSent ? "" : "Mark Ready to Send before marking as Sent"}
                >
                  Mark as Sent
                </ActionButton>
              </div>
            </div>
          </div>

          {message && <MessageBanner message={message} />}
        </div>
      </header>

      <main
        className={`mx-auto grid max-w-[1560px] gap-6 px-4 py-6 sm:px-6 ${
          assistantOpen ? "xl:grid-cols-[260px_minmax(0,1fr)_370px]" : "xl:grid-cols-[260px_minmax(0,1fr)]"
        }`}
      >
        <aside className="space-y-4 xl:sticky xl:top-32 xl:h-fit">
          <ReviewNavigation items={navItems} activeSection={activeSection} onSelect={(key) => activateSection(key, true)} />
          <MetadataPanel submission={submission} />
        </aside>

        <section className="min-w-0 space-y-5">
          <SourceDataPanel
            selectedSource={selectedSource}
            dirtySources={dirtySources}
            sourceDrafts={sourceDrafts}
            comparisonPair={comparisonPair}
            comparison={sourceComparison}
            sectionKey="source"
            active={activeSection === "source"}
            registerSection={registerSection}
            onActivate={activateSection}
            onSelectSource={setSelectedSource}
            onViewRaw={setRawModalSource}
            onCompare={setComparisonPair}
            onRequestUseAsFinal={setConfirmUseAsFinal}
          />

          <PersonalSection value={selectedCV.personal} onChange={updatePersonal} sectionKey="personal" active={activeSection === "personal"} registerSection={registerSection} onActivate={activateSection} />
          <SummarySection value={selectedCV.summary} onChange={updateSummary} sectionKey="summary" active={activeSection === "summary"} registerSection={registerSection} onActivate={activateSection} />
          <SkillsSection skills={selectedCV.skills} onAddSkill={addSkill} onRemoveSkill={removeSkill} sectionKey="skills" active={activeSection === "skills"} registerSection={registerSection} onActivate={activateSection} />

          {REPEATABLE_SECTIONS.map((section) => (
            <RepeatableSection
              key={section.key}
              section={section}
              items={selectedCV[section.key] || []}
              active={activeSection === section.key}
              registerSection={registerSection}
              onActivate={activateSection}
              onAdd={() => addArrayItem(section.key)}
              onDelete={(index) => deleteArrayItem(section.key, index)}
              onUpdate={(index, field, value) => updateArrayItem(section.key, index, field, value)}
            />
          ))}

          <FinalReviewBar
            active={activeSection === "final-review"}
            dirty={Boolean(dirtySources.final)}
            saving={saving}
            exporting={exporting}
            registerSection={registerSection}
            onActivate={activateSection}
            onSave={handleSaveFinal}
            onReady={handleReadyToSend}
            onExportWord={handleExportWord}
            onExportPdf={handleExportPdf}
          />
        </section>

        <AssistantPanel
          open={assistantOpen}
          onToggle={() => setAssistantOpen((value) => !value)}
          submissionId={submissionId}
          selectedSource={selectedSource}
          sourceLabel={selectedConfig.fullLabel}
          sourceDrafts={sourceDrafts}
          cv={selectedPreparedData}
          onApplyAction={applyAssistantAction}
        />
      </main>

      {rawModalSource && (
        <RawDataModal sourceKey={rawModalSource} data={prepareCVData(sourceDrafts[rawModalSource])} onClose={() => setRawModalSource(null)} />
      )}

      {confirmUseAsFinal && (
        <ConfirmDialog
          title="Replace Final CV?"
          body="This will replace the current Final CV data locally. It will not write to Firestore until you use Save Final CV."
          confirmLabel="Replace Final CV"
          onCancel={() => setConfirmUseAsFinal(null)}
          onConfirm={() => handleUseAsFinal(confirmUseAsFinal)}
        />
      )}
    </PageShell>
  );
}

function buildSourceDrafts(submission) {
  return {
    raw: buildEditableCV(submission.rawData || {}),
    ai: buildEditableCV(submission.aiData || {}),
    final: buildEditableCV(submission.finalData || {}),
  };
}

function buildEditableCV(data) {
  const cv = isPlainObject(data) ? data : {};
  const personal = isPlainObject(cv.personal) ? cv.personal : {};
  const summary = firstDefined(cv.summary, personal.summary) || "";

  return {
    ...createEmptyCV(),
    ...cv,
    personal: { ...createEmptyCV().personal, ...personal, summary },
    summary,
    skills: normalizeSkillsObject(cv.skills),
    education: normalizeArray(cv.education),
    experience: normalizeArray(cv.experience),
    internships: normalizeArray(cv.internships),
    courses: normalizeArray(cv.courses),
    languages: normalizeArray(cv.languages),
    achievements: normalizeArray(cv.achievements),
    projects: normalizeArray(cv.projects),
    accreditations: normalizeArray(cv.accreditations),
  };
}

function createEmptyCV() {
  return {
    personal: { fullName: "", email: "", phone: "", location: "", targetTitle: "", linkedin: "", portfolio: "", summary: "" },
    summary: "",
    skills: { ...EMPTY_SKILLS },
    education: [],
    experience: [],
    internships: [],
    courses: [],
    languages: [],
    achievements: [],
    projects: [],
    accreditations: [],
  };
}

function prepareCVData(cv) {
  const draft = cv || createEmptyCV();

  return {
    ...draft,
    personal: { ...(draft.personal || {}), summary: draft.summary || "" },
    summary: draft.summary || "",
    skills: normalizeSkillsObject(draft.skills),
    education: normalizeArray(draft.education),
    experience: normalizeArray(draft.experience),
    internships: normalizeArray(draft.internships),
    courses: normalizeArray(draft.courses),
    languages: normalizeArray(draft.languages),
    achievements: normalizeArray(draft.achievements),
    projects: normalizeArray(draft.projects),
    accreditations: normalizeArray(draft.accreditations),
  };
}

function cloneCV(cv) {
  return buildEditableCV(JSON.parse(JSON.stringify(prepareCVData(cv))));
}

function getSourceConfig(sourceKey) {
  return SOURCE_OPTIONS.find((source) => source.key === sourceKey) || SOURCE_OPTIONS[0];
}

function getSectionCount(section, cv) {
  if (section === "source" || section === "final-review") {
    return undefined;
  }

  if (section === "personal") {
    return PERSONAL_FIELDS.filter((field) => cv.personal?.[field.key]).length;
  }

  if (section === "summary") {
    return cv.summary ? 1 : 0;
  }

  if (section === "skills") {
    const skills = normalizeSkillsObject(cv.skills);
    return Object.values(skills).reduce((total, values) => total + values.length, 0);
  }

  return normalizeArray(cv[section]).length;
}

function PageShell({ children }) {
  return <div className="min-h-screen bg-slate-100 text-slate-900">{children}</div>;
}

function ReviewNavigation({ items, activeSection, onSelect }) {
  return (
    <nav className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 px-2">
        <h2 className="text-sm font-semibold text-slate-950">Review Navigation</h2>
        <p className="mt-1 text-xs text-slate-500">Jump to a CV section.</p>
      </div>

      <select
        value={activeSection}
        onChange={(event) => onSelect(event.target.value)}
        className="mb-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:hidden"
        aria-label="Review section"
      >
        {items.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
            {item.count !== undefined ? ` - ${item.count}` : ""}
          </option>
        ))}
      </select>

      <div className="hidden space-y-1 xl:block">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex w-full items-center justify-between rounded-md border-l-2 px-3 py-2 text-left text-sm transition ${
              activeSection === item.key
                ? "border-blue-600 bg-blue-50 font-semibold text-blue-800"
                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <span>{item.label}</span>
            {item.count !== undefined && <span className="text-xs text-slate-400">{item.count}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}

function SourceDataPanel({
  selectedSource,
  dirtySources,
  sourceDrafts,
  comparisonPair,
  comparison,
  sectionKey,
  active,
  registerSection,
  onActivate,
  onSelectSource,
  onViewRaw,
  onCompare,
  onRequestUseAsFinal,
}) {
  return (
    <SectionCard
      title="Source Data"
      description="Select one CV version. The full structured editor below edits only that version."
      sectionKey={sectionKey}
      active={active}
      registerSection={registerSection}
      onActivate={onActivate}
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-fit">
            {SOURCE_OPTIONS.map((source) => (
              <button
                key={source.key}
                type="button"
                onClick={() => onSelectSource(source.key)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition sm:flex-none ${
                  selectedSource === source.key
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {source.label}
                {dirtySources[source.key] ? " *" : ""}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton variant="secondary" onClick={() => onViewRaw(selectedSource)}>View Raw Data</ActionButton>
            {selectedSource !== "final" && (
              <ActionButton variant="dark" onClick={() => onRequestUseAsFinal(selectedSource)}>Use as Final</ActionButton>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
          Editing: {getSourceConfig(selectedSource).fullLabel}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {SOURCE_OPTIONS.map((source) => {
            const cv = sourceDrafts[source.key] || createEmptyCV();
            const summary = cv.summary || cv.personal?.summary || "No summary";

            return (
              <div
                key={source.key}
                className={`rounded-lg border p-4 ${
                  selectedSource === source.key ? "border-blue-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{source.fullLabel}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {getSectionCount("skills", cv)} skills, {normalizeArray(cv.experience).length} experience items
                    </p>
                  </div>
                  <StatusDot active={selectedSource === source.key} dirty={dirtySources[source.key]} />
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{summary}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Source Comparison</h3>
              <p className="mt-1 text-xs text-slate-500">Added, removed, and changed content between versions.</p>
            </div>
            <select
              value={`${comparisonPair.from}:${comparisonPair.to}`}
              onChange={(event) => {
                const [from, to] = event.target.value.split(":");
                onCompare({ from, to, label: event.target.selectedOptions[0].textContent });
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              aria-label="Comparison pair"
            >
              {COMPARISON_OPTIONS.map((option) => (
                <option key={option.label} value={`${option.from}:${option.to}`}>{option.label}</option>
              ))}
            </select>
          </div>

          <ComparisonList comparison={comparison} />
        </div>
      </div>
    </SectionCard>
  );
}

function StatusDot({ active, dirty }) {
  return (
    <span
      className={`mt-1 h-2.5 w-2.5 rounded-full ${dirty ? "bg-orange-500" : active ? "bg-blue-600" : "bg-slate-300"}`}
      aria-hidden="true"
    />
  );
}

function ComparisonList({ comparison }) {
  if (comparison.length === 0) {
    return <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">No meaningful differences found for this comparison.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {comparison.map((section) => (
        <div key={section.title} className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-950">{section.title}</h4>
          <div className="mt-2 grid gap-2 lg:grid-cols-3">
            <ChangeColumn title="Added" items={section.added} tone="success" />
            <ChangeColumn title="Removed" items={section.removed} tone="danger" />
            <ChangeColumn title="Changed" items={section.changed} tone="info" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChangeColumn({ title, items, tone }) {
  const tones = {
    success: "text-emerald-800 bg-emerald-50 border-emerald-100",
    danger: "text-rose-800 bg-rose-50 border-rose-100",
    info: "text-blue-800 bg-blue-50 border-blue-100",
  };

  return (
    <div className={`rounded-md border p-3 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs opacity-70">None</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {items.slice(0, 8).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
          {items.length > 8 && <li>{items.length - 8} more</li>}
        </ul>
      )}
    </div>
  );
}

function FinalReviewBar({
  active,
  dirty,
  saving,
  exporting,
  registerSection,
  onActivate,
  onSave,
  onReady,
  onExportWord,
  onExportPdf,
}) {
  return (
    <section
      ref={(element) => registerSection?.("final-review", element)}
      data-section-key="final-review"
      tabIndex={0}
      onFocus={() => onActivate?.("final-review")}
      onClick={() => onActivate?.("final-review")}
      className={`sticky bottom-4 scroll-mt-36 rounded-lg border p-4 outline-none transition ${
        active ? "border-blue-300 bg-blue-50 shadow-lg ring-2 ring-blue-100" : "border-slate-200 bg-white shadow-lg"
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-slate-950">Final CV Review</p>
          <p className="text-sm text-slate-500">
            {dirty ? "Final CV has unsaved edits. Save it before sending or exporting." : "Exports always use the current Final CV data."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton variant="secondary" onClick={onExportWord} disabled={Boolean(exporting)}>{exporting === "word" ? "Preparing..." : "Download Word"}</ActionButton>
          <ActionButton variant="secondary" onClick={onExportPdf} disabled={Boolean(exporting)}>{exporting === "pdf" ? "Preparing..." : "Download PDF"}</ActionButton>
          <ActionButton variant="secondary" onClick={onSave} disabled={saving}>Save Final CV</ActionButton>
          <ActionButton variant="success" onClick={onReady} disabled={saving}>Ready to Send</ActionButton>
        </div>
      </div>
    </section>
  );
}

function AssistantPanel({ open, onToggle, submissionId, selectedSource, sourceLabel, sourceDrafts, cv, onApplyAction }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "I can suggest safe CV edits for the selected source. I will show current and suggested text before anything is applied.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [working, setWorking] = useState(false);

  function sendPrompt(promptText = input) {
    const prompt = promptText.trim();

    if (!prompt) {
      return;
    }

    setInput("");
    setWorking(true);
    setPendingAction(null);
    setMessages((current) => [...current, { role: "user", text: prompt }]);

    window.setTimeout(() => {
      const result = createAssistantResponse({ prompt, submissionId, sourceLabel, sourceDrafts, cv });

      setMessages((current) => [...current, { role: "assistant", text: result.text }]);
      setPendingAction(result.action || null);
      setWorking(false);
    }, 200);
  }

  function applyPendingAction() {
    if (!pendingAction) {
      return;
    }

    const applied = onApplyAction(pendingAction);
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        text: applied
          ? `Applied to ${sourceLabel}. Review the highlighted section, then use ${getSourceConfig(selectedSource).saveLabel}.`
          : "I could not apply that change because it did not pass local validation.",
      },
    ]);
    setPendingAction(null);
  }

  return (
    <>
      {!open && (
        <button type="button" onClick={onToggle} className="fixed bottom-5 right-5 z-40 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-700">
          CV Assistant
        </button>
      )}

      {open && (
        <aside className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] rounded-t-xl border border-slate-200 bg-white shadow-2xl transition xl:sticky xl:top-32 xl:z-0 xl:max-h-[calc(100vh-9rem)] xl:rounded-lg">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">CV Assistant</h2>
              <p className="mt-1 text-xs text-slate-500">Working on this CV only - {submissionId}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-700">Editing: {sourceLabel}</p>
            </div>
            <button type="button" onClick={onToggle} className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50">
              Close
            </button>
          </div>

          <div className="flex max-h-[calc(82vh-76px)] flex-col xl:max-h-[calc(100vh-14rem)]">
            <div className="flex-1 space-y-3 overflow-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-6 ${
                    message.role === "user" ? "ml-8 bg-blue-700 text-white" : "mr-8 bg-slate-100 text-slate-800"
                  }`}
                >
                  {message.text}
                </div>
              ))}

              {pendingAction && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">Proposed change</p>
                  <p className="mt-1">{pendingAction.label}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={applyPendingAction} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                      {pendingAction.type === "batch" ? "Apply All" : "Apply"}
                    </button>
                    <button type="button" onClick={() => setPendingAction(null)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {working && <div className="text-sm text-slate-500">Preparing a safe suggestion...</div>}
            </div>

            <div className="border-t border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {ASSISTANT_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => sendPrompt(prompt)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendPrompt();
                }}
              >
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about this CV..." className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <button type="submit" disabled={working} className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  Send
                </button>
              </form>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}

function PersonalSection({ value = {}, onChange, sectionKey, active, registerSection, onActivate }) {
  const knownFields = PERSONAL_FIELDS.map((field) => field.key);
  const extraFields = Object.keys(value).filter((field) => !knownFields.includes(field) && field !== "summary");

  return (
    <SectionCard title="Personal Information" description="Candidate contact details and target role for the selected source." sectionKey={sectionKey} active={active} registerSection={registerSection} onActivate={onActivate}>
      <div className="grid gap-4 md:grid-cols-2">
        {PERSONAL_FIELDS.map((field) => (
          <FieldInput key={field.key} label={field.label} type={field.type} value={value[field.key] || ""} onChange={(newValue) => onChange(field.key, newValue)} />
        ))}
        {extraFields.map((field) => (
          <FieldInput key={field} label={formatLabel(field)} value={value[field] || ""} onChange={(newValue) => onChange(field, newValue)} />
        ))}
      </div>
    </SectionCard>
  );
}

function SummarySection({ value, onChange, sectionKey, active, registerSection, onActivate }) {
  return (
    <SectionCard title="Professional Summary" description="Summary for the currently selected CV source." sectionKey={sectionKey} active={active} registerSection={registerSection} onActivate={onActivate}>
      <FieldInput label="Summary" type="textarea" value={value || ""} onChange={onChange} placeholder="Write or improve the candidate summary..." />
    </SectionCard>
  );
}

function SkillsSection({ skills, onAddSkill, onRemoveSkill, sectionKey, active, registerSection, onActivate }) {
  const safeSkills = normalizeSkillsObject(skills);
  const shownGroups = [
    ...SKILL_GROUPS,
    ...Object.keys(safeSkills).filter((key) => !SKILL_GROUPS.some((group) => group.key === key)).map((key) => ({ key, label: formatLabel(key) })),
  ];

  return (
    <SectionCard title="Skills" description="Grouped skill tags for the selected source." sectionKey={sectionKey} active={active} registerSection={registerSection} onActivate={onActivate}>
      <div className="space-y-5">
        {shownGroups.map((group) => (
          <SkillGroup key={group.key} group={group} skills={safeSkills[group.key] || []} onAddSkill={onAddSkill} onRemoveSkill={onRemoveSkill} />
        ))}
      </div>
    </SectionCard>
  );
}

function SkillGroup({ group, skills, onAddSkill, onRemoveSkill }) {
  const [draft, setDraft] = useState("");

  function submitSkill() {
    onAddSkill(group.key, draft);
    setDraft("");
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{group.label}</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <span className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500">No information yet</span>
        ) : (
          skills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
              {skill}
              <button type="button" onClick={() => onRemoveSkill(group.key, skill)} className="font-semibold text-rose-600 hover:text-rose-800" aria-label={`Remove ${skill}`}>
                x
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSkill();
            }
          }}
          placeholder="Add a skill..."
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button type="button" onClick={submitSkill} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Add
        </button>
      </div>
    </div>
  );
}

function RepeatableSection({ section, items, active, registerSection, onActivate, onAdd, onDelete, onUpdate }) {
  return (
    <SectionCard
      title={section.label}
      description={`${items.length} item${items.length === 1 ? "" : "s"}`}
      sectionKey={section.key}
      active={active}
      registerSection={registerSection}
      onActivate={onActivate}
      action={<button type="button" onClick={onAdd} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">+ {section.addLabel}</button>}
    >
      {items.length === 0 ? (
        <EmptySection onAdd={onAdd} label={section.addLabel} />
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <EditableItem key={index} section={section} item={item} index={index} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function EditableItem({ section, item, index, onDelete, onUpdate }) {
  if (!isPlainObject(item)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <ItemHeader title={`${section.itemLabel} #${index + 1}`} onDelete={() => onDelete(index)} />
        <FieldInput label={section.itemLabel} type="textarea" value={item || ""} onChange={(value) => onUpdate(index, null, value)} />
      </div>
    );
  }

  const configuredFields = section.fields.map((field) => field.key);
  const extraFields = Object.keys(item).filter((field) => !configuredFields.includes(field));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <ItemHeader title={`${section.itemLabel} #${index + 1}`} onDelete={() => onDelete(index)} />
      <div className="grid gap-4 md:grid-cols-2">
        {section.fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
            <FieldInput label={field.label} type={field.type} value={item[field.key]} placeholder={field.placeholder} onChange={(value) => onUpdate(index, field.key, value)} />
          </div>
        ))}
        {extraFields.map((field) => (
          <div key={field} className="md:col-span-2">
            <FieldInput label={formatLabel(field)} type={Array.isArray(item[field]) ? "list" : "textarea"} value={item[field]} onChange={(value) => onUpdate(index, field, value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemHeader({ title, onDelete }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <button type="button" onClick={onDelete} className="rounded-md px-2 py-1 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-800">
        Delete
      </button>
    </div>
  );
}

function EmptySection({ onAdd, label }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="text-sm font-medium text-slate-600">No information yet</p>
      <button type="button" onClick={onAdd} className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
        + {label}
      </button>
    </div>
  );
}

function SectionCard({ title, description, action, children, sectionKey, active, registerSection, onActivate }) {
  return (
    <section
      ref={(element) => sectionKey && registerSection?.(sectionKey, element)}
      data-section-key={sectionKey}
      tabIndex={0}
      onFocus={() => sectionKey && onActivate?.(sectionKey)}
      onClick={() => sectionKey && onActivate?.(sectionKey)}
      className={`scroll-mt-36 rounded-lg border p-5 outline-none transition ${
        active ? "border-blue-300 bg-blue-50/40 shadow-md ring-2 ring-blue-100" : "border-slate-200 bg-white shadow-sm hover:border-slate-300"
      }`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function FieldInput({ label, value, onChange, type = "text", placeholder = "", disabled = false, required = false }) {
  if (type === "checkbox") {
    return (
      <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={Boolean(value)} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-blue-600" />
        {label}
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label className="block">
        <FieldLabel label={label} required={required} />
        <textarea
          value={formatInputValue(value)}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
      </label>
    );
  }

  if (type === "list" || Array.isArray(value)) {
    return (
      <label className="block">
        <FieldLabel label={label} required={required} />
        <textarea
          value={Array.isArray(value) ? value.join(", ") : value || ""}
          disabled={disabled}
          placeholder="Separate items with commas"
          onChange={(event) => onChange(splitList(event.target.value))}
          rows={3}
          className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
      </label>
    );
  }

  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <input
        type={type}
        value={formatInputValue(value)}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
      />
    </label>
  );
}

function FieldLabel({ label, required }) {
  return (
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      {required && <span className="text-rose-600"> *</span>}
    </span>
  );
}

function MetadataPanel({ submission }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Review Details</h2>
        <StatusBadge status={submission.status} />
      </div>
      <dl className="space-y-3 text-sm">
        <MetaItem label="Reviewer" value={submission.reviewerName} />
        <MetaItem label="Review Started" value={formatDate(submission.reviewStartedAt)} />
        <MetaItem label="Reviewed" value={formatDate(submission.reviewedAt)} />
        <MetaItem label="Sent" value={formatDate(submission.sentAt)} />
        <MetaItem label="Created" value={formatDate(submission.createdAt)} />
        <MetaItem label="Updated" value={formatDate(submission.updatedAt)} />
      </dl>
    </section>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[190px] text-right font-medium text-slate-800">{value || "Not set"}</dd>
    </div>
  );
}

function RawDataModal({ sourceKey, data, onClose }) {
  const json = JSON.stringify(data || {}, null, 2);

  async function copySource() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(json);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Raw Data - {getSourceConfig(sourceKey).fullLabel}</h2>
            <p className="mt-1 text-sm text-slate-500">Technical inspection only. The structured editor remains the primary editing UI.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50">Close</button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="mb-2 flex justify-end">
            <button type="button" onClick={copySource} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Copy JSON</button>
          </div>
          <pre className="max-h-[60vh] overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">{json}</pre>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton variant="secondary" onClick={onCancel}>Cancel</ActionButton>
          <ActionButton variant="danger" onClick={onConfirm}>{confirmLabel}</ActionButton>
        </div>
      </div>
    </div>
  );
}

function MessageBanner({ message }) {
  const styles = message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return <div className={`mt-4 rounded-md border px-3 py-2 text-sm ${styles}`}>{message.text}</div>;
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || "border-slate-200 bg-slate-100 text-slate-700"}`}>
      {STATUS_LABELS[status] || status || "Unknown"}
    </span>
  );
}

function ActionButton({ children, onClick, disabled, variant = "primary", title = "" }) {
  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800",
    secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    success: "bg-emerald-700 text-white hover:bg-emerald-800",
    danger: "bg-rose-700 text-white hover:bg-rose-800",
    dark: "bg-slate-900 text-white hover:bg-slate-700",
  };

  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={`rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]}`}>
      {children}
    </button>
  );
}

function createAssistantResponse({ prompt, submissionId, sourceLabel, sourceDrafts, cv }) {
  const normalizedPrompt = prompt.toLowerCase();

  if (asksForAnotherCandidate(normalizedPrompt)) {
    return { text: "I can only work with the currently open CV. I cannot access another candidate, browse submissions, or use data outside this submission." };
  }

  const addSkillAction = parseAddSkill(prompt);
  if (addSkillAction) {
    const skills = normalizeSkillsObject(cv.skills);
    const current = skills[addSkillAction.group] || [];
    const suggested = current.includes(addSkillAction.value) ? current : [...current, addSkillAction.value];

    return {
      text: formatSuggestionText({ sourceLabel, title: formatLabel(addSkillAction.group), current: current.join(", ") || "No skills listed", suggested: suggested.join(", ") }),
      action: { ...addSkillAction, label: `Add ${addSkillAction.value} to ${formatLabel(addSkillAction.group)} in ${sourceLabel}.` },
    };
  }

  const removeSkillAction = parseRemoveSkill(prompt);
  if (removeSkillAction) {
    const skills = normalizeSkillsObject(cv.skills);
    const current = skills[removeSkillAction.group] || [];
    const suggested = current.filter((skill) => skill !== removeSkillAction.value);

    return {
      text: formatSuggestionText({ sourceLabel, title: formatLabel(removeSkillAction.group), current: current.join(", ") || "No skills listed", suggested: suggested.join(", ") || "No skills listed" }),
      action: { ...removeSkillAction, label: `Remove ${removeSkillAction.value} from ${formatLabel(removeSkillAction.group)} in ${sourceLabel}.` },
    };
  }

  const targetTitle = parseTargetTitle(prompt);
  if (targetTitle) {
    return {
      text: formatSuggestionText({ sourceLabel, title: "Target Position", current: cv.personal?.targetTitle || "Not set", suggested: targetTitle }),
      action: { type: "update_personal", field: "targetTitle", value: targetTitle, label: `Update target position in ${sourceLabel}.` },
    };
  }

  if (normalizedPrompt.includes("compare")) {
    const option = normalizedPrompt.includes("original") && normalizedPrompt.includes("final")
      ? COMPARISON_OPTIONS[2]
      : normalizedPrompt.includes("ai") && normalizedPrompt.includes("final")
        ? COMPARISON_OPTIONS[1]
        : COMPARISON_OPTIONS[0];
    const comparison = compareCVSources(option.from, option.to, sourceDrafts);

    return {
      text: comparison.length > 0
        ? comparison.map((section) => `${section.title}\nAdded: ${section.added.join(", ") || "None"}\nRemoved: ${section.removed.join(", ") || "None"}\nChanged: ${section.changed.join(", ") || "None"}`).join("\n\n")
        : "No meaningful differences found for that source comparison.",
    };
  }

  if (normalizedPrompt.includes("missing")) {
    return { text: findMissingInformation(prepareCVData(sourceDrafts.raw), cv, sourceLabel) };
  }

  if (isSummaryRequest(normalizedPrompt)) {
    const currentSummary = cv.summary || cv.personal?.summary || "";
    const suggestedSummary = buildSuggestedSummary(cv, normalizedPrompt);

    if (!suggestedSummary || suggestedSummary === currentSummary) {
      return { text: "I need more existing information in this CV before I can safely rewrite the summary without inventing facts." };
    }

    return {
      text: formatSuggestionText({ sourceLabel, title: "Professional Summary", current: currentSummary || "No summary yet", suggested: suggestedSummary }),
      action: { type: "update_summary", value: suggestedSummary, label: `Replace the professional summary in ${sourceLabel}.` },
    };
  }

  if (isSectionRewriteRequest(normalizedPrompt)) {
    const section = inferEditableSection(normalizedPrompt);
    const currentItems = normalizeArray(cv[section]);
    const suggestedItems = currentItems.map((item) => improveTextFields(item, normalizedPrompt));

    if (currentItems.length === 0) {
      return { text: `I cannot improve ${formatLabel(section).toLowerCase()} because that section is empty in ${sourceLabel}.` };
    }

    return {
      text: formatSuggestionText({ sourceLabel, title: formatLabel(section), current: summarizeItems(currentItems), suggested: summarizeItems(suggestedItems) }),
      action: { type: "update_section", section, value: suggestedItems, label: `Replace ${formatLabel(section).toLowerCase()} wording in ${sourceLabel}.` },
    };
  }

  if (normalizedPrompt.includes("professional") || normalizedPrompt.includes("concise")) {
    const actions = [];
    const summary = cv.summary || cv.personal?.summary || "";
    const suggestedSummary = buildSuggestedSummary(cv, normalizedPrompt);

    if (suggestedSummary && suggestedSummary !== summary) {
      actions.push({ type: "update_summary", value: suggestedSummary });
    }

    ["experience", "projects", "achievements"].forEach((section) => {
      const items = normalizeArray(cv[section]);
      const improved = items.map((item) => improveTextFields(item, normalizedPrompt));

      if (items.length > 0 && JSON.stringify(items) !== JSON.stringify(improved)) {
        actions.push({ type: "update_section", section, value: improved });
      }
    });

    if (actions.length === 0) {
      return { text: "I do not see enough existing text to safely revise without inventing information." };
    }

    return {
      text: `Editing: ${sourceLabel}\n\nSuggested multi-field revision:\n\n${actions.map((action) => {
        if (action.type === "update_summary") {
          return `Professional Summary\nCurrent:\n${summary || "No summary yet"}\n\nSuggested:\n${action.value}`;
        }

        return `${formatLabel(action.section)}\nCurrent:\n${summarizeItems(cv[action.section])}\n\nSuggested:\n${summarizeItems(action.value)}`;
      }).join("\n\n")}`,
      action: { type: "batch", actions, label: `Apply ${actions.length} suggested changes to ${sourceLabel}.` },
    };
  }

  return {
    text: `I am scoped to submission ${submissionId} and the selected source: ${sourceLabel}. I can propose summary, experience, project, achievement, internship, grammar, skills, and comparison changes for this CV only.`,
  };
}

function asksForAnotherCandidate(prompt) {
  return prompt.includes("another candidate") || prompt.includes("other candidate") || prompt.includes("all submissions") || prompt.includes("other submissions") || prompt.includes("different cv");
}

function isSummaryRequest(prompt) {
  return prompt.includes("summary") || prompt.includes("ats") || prompt.includes("shorter") || prompt.includes("more detailed") || prompt.includes("more professional") || prompt.includes("stronger");
}

function isSectionRewriteRequest(prompt) {
  return prompt.includes("experience") || prompt.includes("project") || prompt.includes("achievement") || prompt.includes("internship") || prompt.includes("grammar") || prompt.includes("action verb") || prompt.includes("repetition");
}

function inferEditableSection(prompt) {
  if (prompt.includes("project")) {
    return "projects";
  }
  if (prompt.includes("achievement")) {
    return "achievements";
  }
  if (prompt.includes("internship")) {
    return "internships";
  }
  return "experience";
}

function buildSuggestedSummary(cv, prompt) {
  const currentSummary = String(cv.summary || cv.personal?.summary || "").trim();
  const personal = cv.personal || {};
  const skills = normalizeSkillsObject(cv.skills);
  const topSkills = [...skills.technical, ...skills.tools, ...skills.soft].slice(0, 5);
  const firstExperience = normalizeArray(cv.experience)[0];
  const firstEducation = normalizeArray(cv.education)[0];
  const facts = [];

  if (personal.targetTitle) {
    facts.push(personal.targetTitle);
  }
  if (firstExperience?.jobTitle || firstExperience?.company) {
    facts.push(`${firstExperience.jobTitle || "experience"}${firstExperience.company ? ` at ${firstExperience.company}` : ""}`);
  }
  if (firstEducation?.degree || firstEducation?.fieldOfStudy) {
    facts.push(`${firstEducation.degree || ""}${firstEducation.fieldOfStudy ? ` in ${firstEducation.fieldOfStudy}` : ""}`.trim());
  }
  if (topSkills.length > 0) {
    facts.push(topSkills.join(", "));
  }
  if (!currentSummary && facts.length === 0) {
    return "";
  }
  if (prompt.includes("shorter") || prompt.includes("concise")) {
    return compactText(currentSummary || facts.join(". "), 2);
  }
  if (prompt.includes("more detailed") && currentSummary) {
    return [currentSummary, facts.filter((fact) => !currentSummary.toLowerCase().includes(fact.toLowerCase())).slice(0, 2).join(". ")].filter(Boolean).join(". ");
  }

  return compactText(currentSummary || facts.join(". "), 3)
    .replace(/\bi\b/gi, "the candidate")
    .replace(/\bworked on\b/gi, "contributed to")
    .trim();
}

function improveTextFields(item, prompt) {
  if (!isPlainObject(item)) {
    return compactText(item, prompt.includes("detailed") ? 5 : 3);
  }

  const improved = { ...item };
  ["description", "responsibilities", "achievements"].forEach((field) => {
    if (improved[field]) {
      improved[field] = prompt.includes("detailed") ? String(improved[field]).trim() : compactText(improved[field], 4);
    }
  });

  return improved;
}

function formatSuggestionText({ sourceLabel, title, current, suggested }) {
  return `Editing: ${sourceLabel}\n\n${title}\n\nCurrent Version\n${current}\n\nSuggested Version\n${suggested}`;
}

function parseAddSkill(prompt) {
  const match = prompt.match(/add\s+(.+?)\s+to\s+(technical skills|technical|tools|soft skills|soft)/i);
  if (!match) {
    return null;
  }
  return { type: "add_skill", group: normalizeSkillGroup(match[2]), value: cleanQuotedValue(match[1]) };
}

function parseRemoveSkill(prompt) {
  const match = prompt.match(/remove\s+(.+?)\s+from\s+(technical skills|technical|tools|soft skills|soft)/i);
  if (!match) {
    return null;
  }
  return { type: "remove_skill", group: normalizeSkillGroup(match[2]), value: cleanQuotedValue(match[1]) };
}

function parseTargetTitle(prompt) {
  const match = prompt.match(/(?:change|set|update)\s+(?:the\s+)?target\s+(?:position|title|job)\s+to\s+(.+)/i);
  return match ? cleanQuotedValue(match[1]) : null;
}

function normalizeSkillGroup(value) {
  if (value.toLowerCase().includes("tool")) {
    return "tools";
  }
  if (value.toLowerCase().includes("soft")) {
    return "soft";
  }
  return "technical";
}

function cleanQuotedValue(value) {
  return value.replace(/^["']|["']$/g, "").replace(/[.?!]$/g, "").trim();
}

function findMissingInformation(raw, current, sourceLabel) {
  const missing = [];

  REPEATABLE_SECTIONS.forEach((section) => {
    const rawItems = normalizeArray(raw[section.key]);
    const currentItems = normalizeArray(current[section.key]);

    if (rawItems.length > currentItems.length) {
      missing.push(`${section.label}: Original has ${rawItems.length}, ${sourceLabel} has ${currentItems.length}.`);
    }
  });

  PERSONAL_FIELDS.forEach((field) => {
    if (raw.personal?.[field.key] && !current.personal?.[field.key]) {
      missing.push(`${field.label} exists in Original but is missing from ${sourceLabel}.`);
    }
  });

  if ((raw.personal?.summary || raw.summary) && !(current.summary || current.personal?.summary)) {
    missing.push(`Professional Summary exists in Original but is missing from ${sourceLabel}.`);
  }

  return missing.length > 0 ? `I found possible missing information:\n${missing.join("\n")}` : `I did not find obvious Original sections missing from ${sourceLabel}.`;
}

function compareCVSources(fromKey, toKey, drafts) {
  const from = prepareCVData(drafts[fromKey] || createEmptyCV());
  const to = prepareCVData(drafts[toKey] || createEmptyCV());
  const fromLabel = getSourceConfig(fromKey).label;
  const toLabel = getSourceConfig(toKey).label;
  const sections = [];
  const summaryDiff = compareValues(from.summary || from.personal?.summary, to.summary || to.personal?.summary, `${fromLabel} summary`, `${toLabel} summary`);

  if (summaryDiff) {
    sections.push({ title: "Professional Summary", added: summaryDiff.added, removed: summaryDiff.removed, changed: summaryDiff.changed });
  }

  const personalChanges = [];
  PERSONAL_FIELDS.forEach((field) => {
    if (normalizeText(from.personal?.[field.key]) !== normalizeText(to.personal?.[field.key])) {
      personalChanges.push(`${field.label}: ${displayValue(from.personal?.[field.key])} -> ${displayValue(to.personal?.[field.key])}`);
    }
  });

  if (personalChanges.length > 0) {
    sections.push({ title: "Personal Information", added: [], removed: [], changed: personalChanges });
  }

  const fromSkills = normalizeSkillsObject(from.skills);
  const toSkills = normalizeSkillsObject(to.skills);
  const skillAdded = [];
  const skillRemoved = [];

  new Set([...Object.keys(fromSkills), ...Object.keys(toSkills)]).forEach((group) => {
    const fromValues = fromSkills[group] || [];
    const toValues = toSkills[group] || [];
    skillAdded.push(...toValues.filter((item) => !fromValues.includes(item)).map((item) => `${formatLabel(group)}: ${item}`));
    skillRemoved.push(...fromValues.filter((item) => !toValues.includes(item)).map((item) => `${formatLabel(group)}: ${item}`));
  });

  if (skillAdded.length > 0 || skillRemoved.length > 0) {
    sections.push({ title: "Skills", added: skillAdded, removed: skillRemoved, changed: [] });
  }

  REPEATABLE_SECTIONS.forEach((section) => {
    const diff = compareItemArrays(from[section.key], to[section.key], section.label);
    if (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0) {
      sections.push({ title: section.label, ...diff });
    }
  });

  return sections;
}

function compareValues(from, to, fromLabel, toLabel) {
  const left = normalizeText(from);
  const right = normalizeText(to);

  if (left === right) {
    return null;
  }
  if (!left && right) {
    return { added: [`${toLabel}: ${right}`], removed: [], changed: [] };
  }
  if (left && !right) {
    return { added: [], removed: [`${fromLabel}: ${left}`], changed: [] };
  }
  return { added: [], removed: [], changed: [`${fromLabel}: ${left}`, `${toLabel}: ${right}`] };
}

function compareItemArrays(fromItems, toItems, label) {
  const from = normalizeArray(fromItems);
  const to = normalizeArray(toItems);
  const diff = { added: [], removed: [], changed: [] };
  const max = Math.max(from.length, to.length);

  for (let index = 0; index < max; index += 1) {
    const left = from[index];
    const right = to[index];

    if (left === undefined) {
      diff.added.push(`${label} #${index + 1}: ${summarizeValue(right)}`);
    } else if (right === undefined) {
      diff.removed.push(`${label} #${index + 1}: ${summarizeValue(left)}`);
    } else if (JSON.stringify(left) !== JSON.stringify(right)) {
      diff.changed.push(...compareItemFields(left, right, `${label} #${index + 1}`));
    }
  }

  return diff;
}

function compareItemFields(left, right, prefix) {
  if (!isPlainObject(left) || !isPlainObject(right)) {
    return [`${prefix}: ${summarizeValue(left)} -> ${summarizeValue(right)}`];
  }

  const fields = new Set([...Object.keys(left), ...Object.keys(right)]);
  const changes = [];

  fields.forEach((field) => {
    if (normalizeText(left[field]) !== normalizeText(right[field])) {
      changes.push(`${prefix} ${formatLabel(field)}: ${displayValue(left[field])} -> ${displayValue(right[field])}`);
    }
  });

  return changes;
}

function summarizeItems(items) {
  return normalizeArray(items).map((item, index) => `${index + 1}. ${summarizeValue(item)}`).join("\n") || "No items";
}

function summarizeValue(value) {
  if (isPlainObject(value)) {
    const useful = [value.title, value.name, value.jobTitle, value.company, value.institution, value.description, value.responsibilities, value.achievements].filter(Boolean);
    return useful.join(" - ").slice(0, 180) || JSON.stringify(value).slice(0, 180);
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return displayValue(value);
}

function displayValue(value) {
  return normalizeText(value) || "Empty";
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.join(", ").trim();
  }
  if (isPlainObject(value)) {
    return JSON.stringify(value);
  }
  return String(value).trim();
}

function normalizeSkillsObject(value) {
  if (Array.isArray(value)) {
    return { ...EMPTY_SKILLS, technical: value.filter(Boolean) };
  }
  if (typeof value === "string") {
    return { ...EMPTY_SKILLS, technical: splitList(value) };
  }
  if (!isPlainObject(value)) {
    return { ...EMPTY_SKILLS };
  }

  const normalized = { ...EMPTY_SKILLS, ...value };
  Object.keys(normalized).forEach((key) => {
    normalized[key] = normalizeSkillList(normalized[key]);
  });
  return normalized;
}

function normalizeSkillList(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return splitList(value);
  }
  return [];
}

function splitList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return [value];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function createEmptyItem(section) {
  return section.fields.reduce((item, field) => {
    item[field.key] = field.type === "checkbox" ? false : "";
    return item;
  }, {});
}

function compactText(value, maxLines = 4) {
  if (!value) {
    return "";
  }
  return String(value).split(/\n|;/).map((item) => item.trim()).filter(Boolean).slice(0, maxLines).join("\n");
}

function formatInputValue(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (isPlainObject(value)) {
    return JSON.stringify(value, null, 2);
  }
  return value;
}

function formatLabel(value) {
  return String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  let date = value;
  if (typeof value.toDate === "function") {
    date = value.toDate();
  } else if (typeof value.seconds === "number") {
    date = new Date(value.seconds * 1000);
  }

  return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "";
}

function buildCleanFileName(cv) {
  const name = cv.personal?.fullName || "";
  const cleanName = name.trim().replace(/[<>:"/\\|?*]+/g, "").replace(/\s+/g, "_");
  return cleanName ? `${cleanName}_CV` : "CV_Rise_CV";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createDocxBlob(cv) {
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    },
    { name: "word/document.xml", content: buildDocxDocumentXml(cv) },
  ];

  return new Blob([createZip(files)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

function buildDocxDocumentXml(cv) {
  const parts = [
    docParagraph(cv.personal?.fullName || "CV Rise CV", "title"),
    docParagraph([cv.personal?.targetTitle, cv.personal?.email, cv.personal?.phone, cv.personal?.location].filter(Boolean).join(" | "), "small"),
  ];

  addDocSection(parts, "Professional Summary", [cv.summary || cv.personal?.summary]);
  addDocSection(parts, "Skills", flattenSkills(cv.skills));
  addDocSection(parts, "Education", normalizeArray(cv.education).map(formatCvItem));
  addDocSection(parts, "Experience", normalizeArray(cv.experience).map(formatCvItem));
  addDocSection(parts, "Internships", normalizeArray(cv.internships).map(formatCvItem));
  addDocSection(parts, "Courses", normalizeArray(cv.courses).map(formatCvItem));
  addDocSection(parts, "Languages", normalizeArray(cv.languages).map(formatCvItem));
  addDocSection(parts, "Achievements", normalizeArray(cv.achievements).map(formatCvItem));
  addDocSection(parts, "Projects", normalizeArray(cv.projects).map(formatCvItem));
  addDocSection(parts, "Accreditations", normalizeArray(cv.accreditations).map(formatCvItem));

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${parts.join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`;
}

function addDocSection(parts, title, values) {
  const items = normalizeArray(values).filter(Boolean);
  if (items.length === 0) {
    return;
  }

  parts.push(docParagraph(title, "heading"));
  items.forEach((item) => {
    String(item).split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => parts.push(docParagraph(line, "body")));
  });
}

function docParagraph(text, style = "body") {
  const sizes = { title: "34", heading: "24", small: "18", body: "20" };
  const bold = style === "title" || style === "heading" ? "<w:b/>" : "";
  const spacing = style === "heading" ? '<w:spacing w:before="240" w:after="80"/>' : '<w:spacing w:after="80"/>';
  return `<w:p><w:pPr>${spacing}</w:pPr><w:r><w:rPr>${bold}<w:sz w:val="${sizes[style] || sizes.body}"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function flattenSkills(skills) {
  const normalized = normalizeSkillsObject(skills);
  return Object.entries(normalized).filter(([, values]) => values.length > 0).map(([group, values]) => `${formatLabel(group)}: ${values.join(", ")}`);
}

function formatCvItem(item) {
  if (!isPlainObject(item)) {
    return String(item || "");
  }

  return Object.entries(item)
    .filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== false)
    .map(([key, value]) => `${formatLabel(key)}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("\n");
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const crc = crc32(contentBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, contentBytes.length, true);
    localView.setUint32(22, contentBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, contentBytes.length, true);
    centralView.setUint32(24, contentBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + contentBytes.length;
  });

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return new Blob([...localParts, ...centralParts, endRecord]);
}

function crc32(bytes) {
  let crc = -1;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[index]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function createPdfBlob(cv) {
  const lines = buildPdfLines(cv).slice(0, 58);
  const content = ["BT", "/F1 11 Tf", "50 790 Td", "14 TL", ...lines.map((line, index) => `${index === 0 ? "" : "T*"}(${escapePdf(line)}) Tj`), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function buildPdfLines(cv) {
  const lines = [
    cv.personal?.fullName || "CV Rise CV",
    [cv.personal?.targetTitle, cv.personal?.email, cv.personal?.phone, cv.personal?.location].filter(Boolean).join(" | "),
    "",
  ];

  addPdfSection(lines, "Professional Summary", [cv.summary || cv.personal?.summary]);
  addPdfSection(lines, "Skills", flattenSkills(cv.skills));
  addPdfSection(lines, "Education", normalizeArray(cv.education).map(formatCvItem));
  addPdfSection(lines, "Experience", normalizeArray(cv.experience).map(formatCvItem));
  addPdfSection(lines, "Internships", normalizeArray(cv.internships).map(formatCvItem));
  addPdfSection(lines, "Courses", normalizeArray(cv.courses).map(formatCvItem));
  addPdfSection(lines, "Languages", normalizeArray(cv.languages).map(formatCvItem));
  addPdfSection(lines, "Achievements", normalizeArray(cv.achievements).map(formatCvItem));
  addPdfSection(lines, "Projects", normalizeArray(cv.projects).map(formatCvItem));
  addPdfSection(lines, "Accreditations", normalizeArray(cv.accreditations).map(formatCvItem));

  return lines.flatMap((line) => wrapLine(line, 92));
}

function addPdfSection(lines, title, values) {
  const items = normalizeArray(values).filter(Boolean);
  if (items.length === 0) {
    return;
  }

  lines.push(title);
  items.forEach((item) => {
    String(item).split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => lines.push(line));
  });
  lines.push("");
}

function wrapLine(value, maxLength) {
  const text = String(value || "");
  const lines = [];
  let current = "";

  text.split(" ").forEach((word) => {
    if ((current + " " + word).trim().length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });

  if (current || lines.length === 0) {
    lines.push(current);
  }
  return lines;
}

function escapeXml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapePdf(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "");
}
