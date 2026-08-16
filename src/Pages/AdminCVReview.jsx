import React, { useEffect, useRef, useState } from "react";
import {
  getSubmission,
  saveSourceCV,
  startReview,
  markReadyToSend,
  markAsSent,
} from "../services/adminService";
import { exportDocx, exportPdf } from "../services/exportService";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import CVEditor from "../components/editor/CVEditor";
import SourceComparisonView from "../components/comparison/SourceComparisonView";
import CVPreviewModal from "../components/templates/CVPreviewModal";

const SOURCE_TABS = [
  { key: "raw", field: "rawData", label: "Original", fullLabel: "Original Submission", saveLabel: "Save Original" },
  { key: "ai", field: "aiData", label: "AI Generated", fullLabel: "AI Generated", saveLabel: "Save AI Version" },
  { key: "final", field: "finalData", label: "Final CV", fullLabel: "Final CV", saveLabel: "Save Final CV" },
];

const SECTIONS = [
  { key: "personal", label: "Personal Information" },
  { key: "summary", label: "Professional Summary" },
  { key: "skills", label: "Skills & Tools" },
  { key: "experience", label: "Work Experience" },
  { key: "education", label: "Education" },
  { key: "internships", label: "Internships" },
  { key: "projects", label: "Projects" },
  { key: "courses", label: "Courses & Training" },
  { key: "accreditations", label: "Certifications" },
  { key: "achievements", label: "Achievements" },
  { key: "languages", label: "Languages" },
  { key: "comparison", label: "Source Comparison" },
];

export default function AdminCVReview({ submissionId, onBack }) {
  const [submission, setSubmission] = useState(null);
  const [sourceDrafts, setSourceDrafts] = useState({
    raw: createEmptyCV(),
    ai: createEmptyCV(),
    final: createEmptyCV(),
  });
  const [selectedSource, setSelectedSource] = useState("final");
  const [reviewerName, setReviewerName] = useState("");
  const [dirtySources, setDirtySources] = useState({ raw: false, ai: false, final: false });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingType, setExportingType] = useState(""); // "word" | "pdf" | ""
  const [message, setMessage] = useState(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [rawModalOpen, setRawModalOpen] = useState(false);
  const [confirmUseAsFinalOpen, setConfirmUseAsFinalOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const sectionRefs = useRef({});

  // 1. LOAD SUBMISSION DATA FROM FIRESTORE
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setMessage(null);

        const data = await getSubmission(submissionId);
        if (!isMounted) return;

        setSubmission(data);
        setReviewerName(data.reviewerName || "");

        const raw = normalizeCV(data.rawData);
        const ai = normalizeCV(data.aiData);
        const final = normalizeCV(data.finalData || data.aiData || data.rawData);

        setSourceDrafts({ raw, ai, final });
        setSelectedSource(data.finalData ? "final" : data.aiData ? "ai" : "raw");
        setDirtySources({ raw: false, ai: false, final: false });
      } catch (err) {
        console.error("Failed to load submission:", err);
        if (isMounted) {
          setMessage({ type: "error", text: "Failed to load submission." });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  const activeSourceConfig = SOURCE_TABS.find((t) => t.key === selectedSource) || SOURCE_TABS[2];
  const activeDraft = sourceDrafts[selectedSource] || createEmptyCV();

  const candidateHeaderName =
    activeDraft.personal?.fullName ||
    sourceDrafts.final?.personal?.fullName ||
    sourceDrafts.raw?.personal?.fullName ||
    "Candidate CV";

  const candidateHeaderTitle =
    activeDraft.personal?.targetTitle ||
    sourceDrafts.final?.personal?.targetTitle ||
    sourceDrafts.raw?.personal?.targetTitle ||
    "Target Position Not Set";

  const hasUnsavedEdits = Object.values(dirtySources).some(Boolean);
  const isCurrentDraftDirty = Boolean(dirtySources[selectedSource]);

  // Section Ref Helper
  function registerSectionRef(key, el) {
    if (el) sectionRefs.current[key] = el;
  }

  function scrollToSection(key) {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // DRAFT MUTATION HELPERS
  function updateActiveDraft(updater) {
    setDirtySources((prev) => ({ ...prev, [selectedSource]: true }));
    setSourceDrafts((prev) => ({
      ...prev,
      [selectedSource]: updater(prev[selectedSource] || createEmptyCV()),
    }));
  }

  function handleUpdatePersonal(field, value) {
    updateActiveDraft((cv) => ({
      ...cv,
      personal: { ...(cv.personal || {}), [field]: value },
    }));
  }

  function handleUpdateSummary(value) {
    updateActiveDraft((cv) => ({
      ...cv,
      summary: value,
      personal: { ...(cv.personal || {}), summary: value },
    }));
  }

  function handleAddSkill(group, skill) {
    updateActiveDraft((cv) => {
      const skills = { ...(cv.skills || {}) };
      const current = Array.isArray(skills[group]) ? [...skills[group]] : [];
      if (!current.includes(skill)) current.push(skill);
      return { ...cv, skills: { ...skills, [group]: current } };
    });
  }

  function handleRemoveSkill(group, skill) {
    updateActiveDraft((cv) => {
      const skills = { ...(cv.skills || {}) };
      const current = Array.isArray(skills[group]) ? skills[group].filter((s) => s !== skill) : [];
      return { ...cv, skills: { ...skills, [group]: current } };
    });
  }

  function handleAddArrayItem(section, newItem) {
    updateActiveDraft((cv) => ({
      ...cv,
      [section]: [...(Array.isArray(cv[section]) ? cv[section] : []), newItem],
    }));
  }

  function handleUpdateArrayItem(section, index, field, value) {
    updateActiveDraft((cv) => {
      const list = [...(Array.isArray(cv[section]) ? cv[section] : [])];
      list[index] = { ...(list[index] || {}), [field]: value };
      return { ...cv, [section]: list };
    });
  }

  function handleDeleteArrayItem(section, index) {
    updateActiveDraft((cv) => {
      const list = [...(Array.isArray(cv[section]) ? cv[section] : [])].filter((_, i) => i !== index);
      return { ...cv, [section]: list };
    });
  }

  // "USE AS FINAL" (Copies current selected draft to finalDraft locally)
  function handleUseAsFinalConfirmed() {
    const currentData = JSON.parse(JSON.stringify(sourceDrafts[selectedSource]));
    setSourceDrafts((prev) => ({
      ...prev,
      final: currentData,
    }));
    setDirtySources((prev) => ({ ...prev, final: true }));
    setSelectedSource("final");
    setConfirmUseAsFinalOpen(false);
    setMessage({
      type: "success",
      text: `${activeSourceConfig.fullLabel} copied into Final CV locally. Click "Save Final CV" to save to Firestore.`,
    });
  }

  // DISCARD LOCAL CHANGES
  function handleDiscardChangesConfirmed() {
    if (!submission) return;
    const savedSourceData = submission[activeSourceConfig.field];
    setSourceDrafts((prev) => ({
      ...prev,
      [selectedSource]: normalizeCV(savedSourceData),
    }));
    setDirtySources((prev) => ({ ...prev, [selectedSource]: false }));
    setConfirmDiscardOpen(false);
    setMessage({
      type: "success",
      text: `Discarded local changes in ${activeSourceConfig.fullLabel}.`,
    });
  }

  // VALIDATE REVIEWER NAME
  function checkReviewerName() {
    if (!reviewerName.trim()) {
      setMessage({ type: "error", text: "Reviewer name is required before saving." });
      return false;
    }
    return true;
  }

  // SAVE ACTIVE SOURCE DATA TO FIRESTORE
  async function handleSaveActiveSource() {
    if (!checkReviewerName()) return;

    try {
      setSaving(true);
      setMessage(null);

      const sourceDataToSave = sourceDrafts[selectedSource];
      await saveSourceCV(
        submissionId,
        activeSourceConfig.field,
        sourceDataToSave,
        reviewerName.trim()
      );

      setSubmission((prev) => ({
        ...prev,
        [activeSourceConfig.field]: sourceDataToSave,
        reviewerName: reviewerName.trim(),
        status: selectedSource === "final" ? "in_review" : prev.status,
        updatedAt: new Date(),
      }));

      setDirtySources((prev) => ({ ...prev, [selectedSource]: false }));
      setMessage({ type: "success", text: `${activeSourceConfig.fullLabel} saved successfully.` });
    } catch (err) {
      console.error("Failed to save active source:", err);
      setMessage({ type: "error", text: `Failed to save ${activeSourceConfig.fullLabel}.` });
    } finally {
      setSaving(false);
    }
  }

  // WORKFLOW: START REVIEW
  async function handleStartReview() {
    if (!checkReviewerName()) return;

    try {
      setSaving(true);
      setMessage(null);
      await startReview(submissionId, reviewerName.trim());
      setSubmission((prev) => ({
        ...prev,
        status: "in_review",
        reviewerName: reviewerName.trim(),
        updatedAt: new Date(),
      }));
      setMessage({ type: "success", text: "Review status updated to In Review." });
    } catch (err) {
      console.error("Start review error:", err);
      setMessage({ type: "error", text: "Failed to start review." });
    } finally {
      setSaving(false);
    }
  }

  // WORKFLOW: READY TO SEND
  async function handleReadyToSend() {
    if (!checkReviewerName()) return;

    try {
      setSaving(true);
      setMessage(null);
      const finalDataToSave = sourceDrafts.final;
      await markReadyToSend(submissionId, finalDataToSave, reviewerName.trim());
      setSubmission((prev) => ({
        ...prev,
        finalData: finalDataToSave,
        status: "ready_to_send",
        reviewerName: reviewerName.trim(),
        updatedAt: new Date(),
      }));
      setDirtySources((prev) => ({ ...prev, final: false }));
      setMessage({ type: "success", text: "CV marked as Ready to Send." });
    } catch (err) {
      console.error("Mark ready to send error:", err);
      setMessage({ type: "error", text: "Failed to mark as Ready to Send." });
    } finally {
      setSaving(false);
    }
  }

  // WORKFLOW: MARK AS SENT
  async function handleMarkSent() {
    if (submission?.status !== "ready_to_send") {
      setMessage({
        type: "error",
        text: "CV must be marked Ready to Send before marking as Sent.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await markAsSent(submissionId);
      setSubmission((prev) => ({
        ...prev,
        status: "sent",
        updatedAt: new Date(),
      }));
      setMessage({ type: "success", text: "CV marked as Sent." });
    } catch (err) {
      console.error("Mark as sent error:", err);
      setMessage({ type: "error", text: "Failed to mark as Sent." });
    } finally {
      setSaving(false);
    }
  }

  // EXPORTS
  async function handleExportDocx() {
    try {
      setExportingType("word");
      const filename = await exportDocx(activeDraft, "ats_professional");
      setMessage({ type: "success", text: `Exported Word document: ${filename}` });
    } catch (err) {
      console.error("Docx export error:", err);
      setMessage({ type: "error", text: "Failed to generate DOCX file." });
    } finally {
      setExportingType("");
    }
  }

  function handleExportPdf() {
    try {
      setExportingType("pdf");
      const filename = exportPdf(activeDraft, "ats_professional");
      setMessage({ type: "success", text: `Exported PDF document: ${filename}` });
    } catch (err) {
      console.error("PDF export error:", err);
      setMessage({ type: "error", text: "Failed to generate PDF file." });
    } finally {
      setExportingType("");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading candidate CV workspace...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-6 text-center space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Submission Not Found</h2>
          <p className="text-xs text-slate-500">The requested CV submission could not be located.</p>
          <Button variant="primary" onClick={onBack}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* 1. TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs shadow-xs">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-3 space-y-2.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Candidate Identity */}
            <div className="flex items-start gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shrink-0 cursor-pointer mt-0.5"
                title="Back to Admin Dashboard"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-950 truncate tracking-tight">
                    {candidateHeaderName}
                  </h1>
                  <Badge status={submission.status} size="sm" />
                  {hasUnsavedEdits && (
                    <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      Unsaved Local Edits
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {candidateHeaderTitle} •{" "}
                  <span className="font-mono text-slate-400">ID: {submissionId.slice(0, 8)}</span>
                </p>
              </div>
            </div>

            {/* Reviewer & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
                  Reviewer:
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Your Name"
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none w-32 sm:w-36"
                />
              </div>

              {/* Start Review */}
              {submission.status !== "in_review" && submission.status !== "ready_to_send" && submission.status !== "sent" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleStartReview}
                  disabled={saving}
                >
                  Start Review
                </Button>
              )}

              {/* Save Active Source Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveActiveSource}
                loading={saving}
              >
                {activeSourceConfig.saveLabel}
                {isCurrentDraftDirty ? " *" : ""}
              </Button>

              {/* Discard changes button */}
              {isCurrentDraftDirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDiscardOpen(true)}
                  disabled={saving}
                >
                  Discard
                </Button>
              )}

              {/* Preview CV Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
              >
                Preview CV
              </Button>

              {/* Ready to Send */}
              <Button
                variant="success"
                size="sm"
                onClick={handleReadyToSend}
                disabled={saving}
              >
                Ready to Send
              </Button>

              {/* Mark as Sent */}
              <Button
                variant="dark"
                size="sm"
                onClick={handleMarkSent}
                disabled={saving || submission.status !== "ready_to_send"}
                title={submission.status !== "ready_to_send" ? "Mark Ready to Send first" : ""}
              >
                Mark as Sent
              </Button>
            </div>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                message.type === "error"
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              <span>{message.text}</span>
              <button
                type="button"
                onClick={() => setMessage(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. MAIN REVIEW WORKSPACE */}
      <main className="max-w-[1520px] mx-auto px-4 sm:px-6 pt-5 grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        {/* Left Sidebar Navigation */}
        <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          {/* Section Navigation */}
          <nav className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs space-y-0.5">
            <div className="px-2 py-1 text-2xs font-bold uppercase tracking-wider text-slate-400">
              Document Sections
            </div>
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => scrollToSection(s.key)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition text-left cursor-pointer"
              >
                <span>{s.label}</span>
                {s.key === "experience" && activeDraft.experience?.length ? (
                  <span className="text-2xs px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-bold">
                    {activeDraft.experience.length}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          {/* Template Info Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Template
              </span>
              <span className="text-2xs px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Active
              </span>
            </div>
            <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100 space-y-0.5">
              <span className="text-xs font-bold text-blue-900 block">ATS Professional</span>
              <span className="text-2xs text-blue-700 block">ATS Optimized Layout</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setPreviewModalOpen(true)}
            >
              Preview Document
            </Button>
          </div>
        </aside>

        {/* Center Main Editor & Tools */}
        <div className="min-w-0 space-y-5">
          {/* Source Selector Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Source Tabs */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                {SOURCE_TABS.map((tab) => {
                  const isSelected = selectedSource === tab.key;
                  const isDirty = dirtySources[tab.key];
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSelectedSource(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? "bg-white text-blue-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {isDirty && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-500"
                          title="Unsaved changes in this draft"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Source Actions */}
              <div className="flex items-center gap-2">
                {selectedSource !== "final" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmUseAsFinalOpen(true)}
                  >
                    Use as Final
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRawModalOpen(true)}
                >
                  View Raw JSON
                </Button>
              </div>
            </div>

            {/* Active Source Sub-bar */}
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-medium">
                Editing Source: <strong className="text-slate-900">{activeSourceConfig.fullLabel}</strong>
              </span>
              {isCurrentDraftDirty ? (
                <span className="text-amber-700 font-medium">● Unsaved local edits</span>
              ) : (
                <span className="text-emerald-700 font-medium">✓ Up to date</span>
              )}
            </div>
          </div>

          {/* Unified Structured CV Editor */}
          <CVEditor
            data={activeDraft}
            _source={selectedSource}
            onUpdatePersonal={handleUpdatePersonal}
            onUpdateSummary={handleUpdateSummary}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            onAddArrayItem={handleAddArrayItem}
            onUpdateArrayItem={handleUpdateArrayItem}
            onDeleteArrayItem={handleDeleteArrayItem}
            registerSectionRef={registerSectionRef}
          />

          {/* Source Comparison Panel */}
          <div
            ref={(el) => registerSectionRef("comparison", el)}
            data-section-key="comparison"
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
          >
            <SourceComparisonView sourceDrafts={sourceDrafts} />
          </div>

          {/* Bottom Export & Readiness Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Export & Finalization</h3>
              <p className="text-xs text-slate-500">
                Exports reflect the current active draft with ATS Professional layout.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
              >
                Preview CV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportDocx}
                loading={exportingType === "word"}
                disabled={Boolean(exportingType)}
              >
                Download Word (.docx)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportPdf}
                loading={exportingType === "pdf"}
                disabled={Boolean(exportingType)}
              >
                Download PDF
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleReadyToSend}
                disabled={saving}
              >
                Mark Ready to Send
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Real-time Document Preview Modal */}
      <CVPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        cvData={activeDraft}
        sourceLabel={activeSourceConfig.fullLabel}
        onExportWord={handleExportDocx}
        onExportPdf={handleExportPdf}
        exportingType={exportingType}
      />

      {/* Technical Raw JSON Inspection Modal */}
      <Modal
        isOpen={rawModalOpen}
        onClose={() => setRawModalOpen(false)}
        title={`Raw JSON Data — ${activeSourceConfig.fullLabel}`}
        description="Technical inspection view."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(JSON.stringify(activeDraft, null, 2));
                  setMessage({ type: "success", text: "Copied JSON data to clipboard." });
                }
              }}
            >
              Copy JSON
            </Button>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono max-h-[60vh] overflow-y-auto leading-relaxed">
            {JSON.stringify(activeDraft, null, 2)}
          </pre>
        </div>
      </Modal>

      {/* Confirm "Use as Final" Dialog */}
      <ConfirmDialog
        isOpen={confirmUseAsFinalOpen}
        title="Replace Final CV with Current Draft?"
        body={`This will copy all current fields from "${activeSourceConfig.fullLabel}" (including any unsaved local edits) into your local Final CV draft. It will not write to Firestore until you explicitly click "Save Final CV".`}
        confirmLabel="Replace Final CV Draft"
        confirmVariant="primary"
        onConfirm={handleUseAsFinalConfirmed}
        onCancel={() => setConfirmUseAsFinalOpen(false)}
      />

      {/* Confirm Discard Local Changes Dialog */}
      <ConfirmDialog
        isOpen={confirmDiscardOpen}
        title={`Discard changes in ${activeSourceConfig.fullLabel}?`}
        body={`This will discard all unsaved edits in your local ${activeSourceConfig.fullLabel} draft and revert back to the last saved Firestore state.`}
        confirmLabel="Discard Changes"
        confirmVariant="danger"
        onConfirm={handleDiscardChangesConfirmed}
        onCancel={() => setConfirmDiscardOpen(false)}
      />
    </div>
  );
}

function createEmptyCV() {
  return {
    personal: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      targetTitle: "",
      linkedin: "",
      portfolio: "",
      summary: "",
    },
    summary: "",
    skills: {
      technical: [],
      tools: [],
      soft: [],
    },
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

function normalizeCV(raw) {
  if (!raw || typeof raw !== "object") return createEmptyCV();

  const empty = createEmptyCV();
  const personal = { ...empty.personal, ...(raw.personal || {}) };
  const summary = raw.summary || personal.summary || "";

  return {
    ...empty,
    ...raw,
    personal: { ...personal, summary },
    summary,
    skills: {
      technical: Array.isArray(raw.skills?.technical) ? raw.skills.technical : [],
      tools: Array.isArray(raw.skills?.tools) ? raw.skills.tools : [],
      soft: Array.isArray(raw.skills?.soft) ? raw.skills.soft : [],
    },
    education: Array.isArray(raw.education) ? raw.education : [],
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    internships: Array.isArray(raw.internships) ? raw.internships : [],
    courses: Array.isArray(raw.courses) ? raw.courses : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    accreditations: Array.isArray(raw.accreditations) ? raw.accreditations : [],
  };
}
