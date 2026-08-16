import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function CVPreviewModal({
  isOpen,
  onClose,
  cvData,
  sourceLabel = "Current Draft",
  onExportWord,
  onExportPdf,
  exportingType = "",
}) {
  if (!isOpen || !cvData) return null;

  const personal = cvData.personal || {};
  const summary = cvData.summary || personal.summary || "";
  const skills = cvData.skills || { technical: [], tools: [], soft: [] };
  const experience = Array.isArray(cvData.experience) ? cvData.experience : [];
  const education = Array.isArray(cvData.education) ? cvData.education : [];
  const internships = Array.isArray(cvData.internships) ? cvData.internships : [];
  const projects = Array.isArray(cvData.projects) ? cvData.projects : [];
  const courses = Array.isArray(cvData.courses) ? cvData.courses : [];
  const accreditations = Array.isArray(cvData.accreditations) ? cvData.accreditations : [];
  const achievements = Array.isArray(cvData.achievements) ? cvData.achievements : [];
  const languages = Array.isArray(cvData.languages) ? cvData.languages : [];

  const contactItems = [
    personal.targetTitle,
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.portfolio,
  ].filter(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CV Document Preview — ATS Professional"
      description={`Real-time document preview using ${sourceLabel}. Exports will match this layout.`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Top Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-slate-700">
              Template: <strong>ATS Professional</strong>
            </span>
            <span className="text-3xs text-slate-400 font-mono">({sourceLabel})</span>
          </div>

          <div className="flex items-center gap-2">
            {onExportWord && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onExportWord}
                loading={exportingType === "word"}
                disabled={Boolean(exportingType)}
              >
                Download Word (.docx)
              </Button>
            )}
            {onExportPdf && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onExportPdf}
                loading={exportingType === "pdf"}
                disabled={Boolean(exportingType)}
              >
                Download PDF
              </Button>
            )}
          </div>
        </div>

        {/* Paper Document Preview Container */}
        <div className="rounded-xl border border-slate-300 bg-white p-8 sm:p-12 shadow-sm font-sans text-slate-900 space-y-6 max-w-[800px] mx-auto text-left leading-relaxed">
          {/* Header */}
          <div className="text-center space-y-1.5 pb-4 border-b border-slate-300">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">
              {personal.fullName || "Candidate Name"}
            </h1>
            {contactItems.length > 0 && (
              <p className="text-xs text-slate-600 font-medium">
                {contactItems.join("  |  ")}
              </p>
            )}
          </div>

          {/* Professional Summary */}
          {summary && (
            <div className="space-y-1.5">
              <PreviewSectionHeader title="Professional Summary" />
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {summary}
              </p>
            </div>
          )}

          {/* Skills */}
          {(skills.technical?.length > 0 || skills.tools?.length > 0 || skills.soft?.length > 0) && (
            <div className="space-y-1.5">
              <PreviewSectionHeader title="Core Skills & Technologies" />
              <div className="text-xs space-y-1 text-slate-700">
                {skills.technical?.length > 0 && (
                  <p>
                    <strong className="text-slate-900">Technical Skills:</strong>{" "}
                    {skills.technical.join(", ")}
                  </p>
                )}
                {skills.tools?.length > 0 && (
                  <p>
                    <strong className="text-slate-900">Tools & Technologies:</strong>{" "}
                    {skills.tools.join(", ")}
                  </p>
                )}
                {skills.soft?.length > 0 && (
                  <p>
                    <strong className="text-slate-900">Professional Skills:</strong>{" "}
                    {skills.soft.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {experience.length > 0 && (
            <div className="space-y-2.5">
              <PreviewSectionHeader title="Work Experience" />
              <div className="space-y-3.5">
                {experience.map((exp, idx) => {
                  const dates = [exp.startDate, exp.current ? "Present" : exp.endDate]
                    .filter(Boolean)
                    .join(" – ");
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between font-bold text-slate-900">
                        <span>
                          {exp.jobTitle || "Job Title"}{" "}
                          {exp.company && <span className="font-semibold text-slate-700">— {exp.company}</span>}
                        </span>
                        <span className="text-slate-500 font-normal text-3xs sm:text-xs">
                          {dates} {exp.location && `| ${exp.location}`}
                        </span>
                      </div>

                      {exp.responsibilities && (
                        <ul className="list-disc list-inside text-slate-700 space-y-0.5 pt-0.5">
                          {String(exp.responsibilities)
                            .split("\n")
                            .map((l) => l.trim().replace(/^[•\-*]\s*/, ""))
                            .filter(Boolean)
                            .map((line, i) => (
                              <li key={i} className="leading-relaxed">
                                {line}
                              </li>
                            ))}
                        </ul>
                      )}

                      {exp.achievements && (
                        <p className="text-slate-800 pt-0.5">
                          <strong className="text-slate-900">Key Achievement:</strong> {exp.achievements}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div className="space-y-2">
              <PreviewSectionHeader title="Education" />
              <div className="space-y-2 text-xs">
                {education.map((edu, idx) => {
                  const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <strong className="text-slate-900">
                          {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                        </strong>
                        {edu.institution && (
                          <span className="text-slate-700"> — {edu.institution}</span>
                        )}
                        {edu.grade && (
                          <span className="text-slate-500 text-3xs"> (GPA: {edu.grade})</span>
                        )}
                      </div>
                      <span className="text-slate-500 text-3xs sm:text-xs">{dates}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Internships */}
          {internships.length > 0 && (
            <div className="space-y-2">
              <PreviewSectionHeader title="Internships" />
              <div className="space-y-2.5 text-xs">
                {internships.map((item, idx) => {
                  const dates = [item.startDate, item.endDate].filter(Boolean).join(" – ");
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between font-bold text-slate-900">
                        <span>
                          {item.title} {item.company && `— ${item.company}`}
                        </span>
                        <span className="text-slate-500 font-normal text-3xs sm:text-xs">{dates}</span>
                      </div>
                      {item.description && (
                        <p className="text-slate-700 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <PreviewSectionHeader title="Projects" />
              <div className="space-y-2 text-xs">
                {projects.map((proj, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      {proj.name}
                      {proj.technologies && (
                        <span className="font-normal text-slate-500"> ({proj.technologies})</span>
                      )}
                      {proj.link && (
                        <span className="font-normal text-blue-600 ml-1.5">| {proj.link}</span>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-slate-700 leading-relaxed">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses & Accreditations */}
          {(courses.length > 0 || accreditations.length > 0) && (
            <div className="space-y-2">
              <PreviewSectionHeader title="Certifications & Courses" />
              <div className="text-xs space-y-1 text-slate-700">
                {accreditations.map((acc, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      <strong className="text-slate-900">{acc.name}</strong>{" "}
                      {acc.issuer && `— ${acc.issuer}`}
                    </span>
                    <span className="text-slate-500 text-3xs">{acc.date}</span>
                  </div>
                ))}
                {courses.map((c, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {c.name} {c.provider && `— ${c.provider}`}
                    </span>
                    <span className="text-slate-500 text-3xs">{c.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages & Achievements */}
          {(languages.length > 0 || achievements.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              {languages.length > 0 && (
                <div className="space-y-1.5">
                  <PreviewSectionHeader title="Languages" />
                  <p className="text-xs text-slate-700">
                    {languages.map((l) => `${l.language} (${l.level})`).join("  •  ")}
                  </p>
                </div>
              )}
              {achievements.length > 0 && (
                <div className="space-y-1.5">
                  <PreviewSectionHeader title="Achievements" />
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                    {achievements.map((a, idx) => (
                      <li key={idx}>
                        <strong>{a.title}</strong>
                        {a.description && ` — ${a.description}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PreviewSectionHeader({ title }) {
  return (
    <div className="border-b border-slate-300 pb-0.5 mb-1.5">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
        {title}
      </h2>
    </div>
  );
}
