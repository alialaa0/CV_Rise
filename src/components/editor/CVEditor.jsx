import React, { useState } from "react";
import Button from "../ui/Button";
import { TextInput, TextArea, SelectInput, MonthYearPicker, CheckboxToggle } from "../ui/Input";

const DEGREE_OPTIONS = [
  "High School Diploma",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctor of Philosophy (PhD)",
  "Professional Diploma",
  "Certification",
  "Other",
];

const STUDY_FIELDS = [
  "Computer Science",
  "Software Engineering",
  "Information Systems",
  "Data Science & Analytics",
  "Business Administration",
  "Finance & Banking",
  "Accounting",
  "Marketing & Communications",
  "Economics",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Medicine & Healthcare",
  "Law",
  "Other",
];

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
  "Temporary",
  "Remote",
];

const LANGUAGE_LEVELS = [
  "Basic",
  "Elementary",
  "Intermediate",
  "Upper-Intermediate",
  "Advanced",
  "Fluent / Professional",
  "Native / Bilingual",
];

export default function CVEditor({
  data,
  _source,
  onUpdatePersonal,
  onUpdateSummary,
  onAddSkill,
  onRemoveSkill,
  onAddArrayItem,
  onUpdateArrayItem,
  onDeleteArrayItem,
  registerSectionRef,
}) {
  const personal = data?.personal || {};
  const summary = data?.summary || personal.summary || "";
  const skills = data?.skills || { technical: [], tools: [], soft: [] };

  return (
    <div className="space-y-6">
      {/* 1. PERSONAL INFORMATION */}
      <EditorSectionCard
        title="Personal Information"
        description="Candidate contact details and target position."
        sectionKey="personal"
        registerRef={registerSectionRef}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Full Name"
            value={personal.fullName}
            onChange={(val) => onUpdatePersonal("fullName", val)}
            placeholder="John Doe"
            required
          />
          <TextInput
            label="Target Position"
            value={personal.targetTitle}
            onChange={(val) => onUpdatePersonal("targetTitle", val)}
            placeholder="Senior Data Analyst"
          />
          <TextInput
            label="Email Address"
            type="email"
            value={personal.email}
            onChange={(val) => onUpdatePersonal("email", val)}
            placeholder="john.doe@example.com"
          />
          <TextInput
            label="Phone Number"
            type="tel"
            value={personal.phone}
            onChange={(val) => onUpdatePersonal("phone", val)}
            placeholder="+1 555 0192"
          />
          <TextInput
            label="Location / City"
            value={personal.location}
            onChange={(val) => onUpdatePersonal("location", val)}
            placeholder="Cairo, Egypt"
          />
          <TextInput
            label="LinkedIn URL"
            value={personal.linkedin}
            onChange={(val) => onUpdatePersonal("linkedin", val)}
            placeholder="linkedin.com/in/username"
          />
          <TextInput
            label="Portfolio / Website"
            value={personal.portfolio}
            onChange={(val) => onUpdatePersonal("portfolio", val)}
            placeholder="portfolio.io"
            className="sm:col-span-2"
          />
        </div>
      </EditorSectionCard>

      {/* 2. PROFESSIONAL SUMMARY */}
      <EditorSectionCard
        title="Professional Summary"
        description="Core introduction, professional focus, and high-level career summary."
        sectionKey="summary"
        registerRef={registerSectionRef}
      >
        <TextArea
          label="Summary"
          value={summary}
          onChange={onUpdateSummary}
          placeholder="Concise overview of skills, domain experience, and key professional strengths..."
          rows={4}
        />
      </EditorSectionCard>

      {/* 3. SKILLS */}
      <EditorSectionCard
        title="Skills & Technologies"
        description="Grouped technical proficiencies, tools, and professional skills."
        sectionKey="skills"
        registerRef={registerSectionRef}
      >
        <div className="space-y-4">
          <SkillGroupManager
            title="Technical Skills"
            group="technical"
            skills={skills.technical || []}
            onAdd={(val) => onAddSkill("technical", val)}
            onRemove={(val) => onRemoveSkill("technical", val)}
            placeholder="e.g. Python, SQL, React, AWS..."
          />
          <SkillGroupManager
            title="Tools & Technologies"
            group="tools"
            skills={skills.tools || []}
            onAdd={(val) => onAddSkill("tools", val)}
            onRemove={(val) => onRemoveSkill("tools", val)}
            placeholder="e.g. Git, Docker, Power BI, Figma..."
          />
          <SkillGroupManager
            title="Professional & Soft Skills"
            group="soft"
            skills={skills.soft || []}
            onAdd={(val) => onAddSkill("soft", val)}
            onRemove={(val) => onRemoveSkill("soft", val)}
            placeholder="e.g. Stakeholder Management, Agile..."
          />
        </div>
      </EditorSectionCard>

      {/* 4. WORK EXPERIENCE */}
      <EditorSectionCard
        title="Work Experience"
        description="Chronological professional employment history."
        sectionKey="experience"
        registerRef={registerSectionRef}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onAddArrayItem("experience", {
                jobTitle: "",
                company: "",
                location: "",
                employmentType: "Full-time",
                startDate: "",
                endDate: "",
                current: false,
                responsibilities: "",
                achievements: "",
              })
            }
          >
            + Add Experience
          </Button>
        }
      >
        {(!data.experience || data.experience.length === 0) ? (
          <EmptySectionPlaceholder
            text="No work experience items added yet."
            onAdd={() =>
              onAddArrayItem("experience", {
                jobTitle: "",
                company: "",
                location: "",
                employmentType: "Full-time",
                startDate: "",
                endDate: "",
                current: false,
                responsibilities: "",
                achievements: "",
              })
            }
            buttonLabel="Add Experience"
          />
        ) : (
          <div className="space-y-4">
            {data.experience.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Experience #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteArrayItem("experience", idx)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <TextInput
                    label="Job Title"
                    value={item.jobTitle}
                    onChange={(v) => onUpdateArrayItem("experience", idx, "jobTitle", v)}
                    placeholder="Senior Data Analyst"
                  />
                  <TextInput
                    label="Company Name"
                    value={item.company}
                    onChange={(v) => onUpdateArrayItem("experience", idx, "company", v)}
                    placeholder="Acme Corp"
                  />
                  <SelectInput
                    label="Employment Type"
                    value={item.employmentType}
                    options={EMPLOYMENT_TYPES}
                    onChange={(v) => onUpdateArrayItem("experience", idx, "employmentType", v)}
                  />
                  <TextInput
                    label="Location"
                    value={item.location}
                    onChange={(v) => onUpdateArrayItem("experience", idx, "location", v)}
                    placeholder="Cairo, Egypt"
                  />
                  <MonthYearPicker
                    label="Start Date"
                    value={item.startDate}
                    onChange={(v) => onUpdateArrayItem("experience", idx, "startDate", v)}
                  />
                  {!item.current && (
                    <MonthYearPicker
                      label="End Date"
                      value={item.endDate}
                      onChange={(v) => onUpdateArrayItem("experience", idx, "endDate", v)}
                    />
                  )}
                  <div className="sm:col-span-2 pt-1">
                    <CheckboxToggle
                      label="I currently work in this role"
                      checked={item.current}
                      onChange={(v) => onUpdateArrayItem("experience", idx, "current", v)}
                    />
                  </div>
                  <TextArea
                    label="Responsibilities"
                    value={item.responsibilities}
                    onChange={(v) => onUpdateArrayItem("experience", idx, "responsibilities", v)}
                    placeholder="Describe main tasks and key scope of work (bullet points recommended)..."
                    rows={3}
                    className="sm:col-span-2"
                  />
                  <TextArea
                    label="Achievements & Measurable Results"
                    value={item.achievements}
                    onChange={(v) => onUpdateArrayItem("experience", idx, "achievements", v)}
                    placeholder="Describe key outcomes, business impact, and measurable achievements..."
                    rows={3}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSectionCard>

      {/* 5. EDUCATION */}
      <EditorSectionCard
        title="Education"
        description="Degrees, diplomas, and academic qualifications."
        sectionKey="education"
        registerRef={registerSectionRef}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onAddArrayItem("education", {
                degree: "Bachelor's Degree",
                institution: "",
                fieldOfStudy: "",
                startDate: "",
                endDate: "",
                grade: "",
              })
            }
          >
            + Add Education
          </Button>
        }
      >
        {(!data.education || data.education.length === 0) ? (
          <EmptySectionPlaceholder
            text="No education entries added."
            onAdd={() =>
              onAddArrayItem("education", {
                degree: "Bachelor's Degree",
                institution: "",
                fieldOfStudy: "",
                startDate: "",
                endDate: "",
                grade: "",
              })
            }
            buttonLabel="Add Education"
          />
        ) : (
          <div className="space-y-4">
            {data.education.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Education #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteArrayItem("education", idx)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectInput
                    label="Degree Level"
                    value={item.degree}
                    options={DEGREE_OPTIONS}
                    onChange={(v) => onUpdateArrayItem("education", idx, "degree", v)}
                  />
                  <SelectInput
                    label="Field of Study"
                    value={item.fieldOfStudy}
                    options={STUDY_FIELDS}
                    onChange={(v) => onUpdateArrayItem("education", idx, "fieldOfStudy", v)}
                  />
                  <TextInput
                    label="Institution / University"
                    value={item.institution}
                    onChange={(v) => onUpdateArrayItem("education", idx, "institution", v)}
                    placeholder="Cairo University"
                  />
                  <TextInput
                    label="Grade / GPA (Optional)"
                    value={item.grade}
                    onChange={(v) => onUpdateArrayItem("education", idx, "grade", v)}
                    placeholder="3.8 / 4.0 or Excellent"
                  />
                  <MonthYearPicker
                    label="Start Date"
                    value={item.startDate}
                    onChange={(v) => onUpdateArrayItem("education", idx, "startDate", v)}
                  />
                  <MonthYearPicker
                    label="End Date (or Expected)"
                    value={item.endDate}
                    onChange={(v) => onUpdateArrayItem("education", idx, "endDate", v)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSectionCard>

      {/* 6. INTERNSHIPS */}
      <EditorSectionCard
        title="Internships & Practical Training"
        description="Practical internships and apprentice programs."
        sectionKey="internships"
        registerRef={registerSectionRef}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onAddArrayItem("internships", {
                title: "",
                company: "",
                location: "",
                startDate: "",
                endDate: "",
                description: "",
              })
            }
          >
            + Add Internship
          </Button>
        }
      >
        {(!data.internships || data.internships.length === 0) ? (
          <EmptySectionPlaceholder
            text="No internships added."
            onAdd={() =>
              onAddArrayItem("internships", {
                title: "",
                company: "",
                location: "",
                startDate: "",
                endDate: "",
                description: "",
              })
            }
            buttonLabel="Add Internship"
          />
        ) : (
          <div className="space-y-4">
            {data.internships.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Internship #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteArrayItem("internships", idx)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Internship Role"
                    value={item.title}
                    onChange={(v) => onUpdateArrayItem("internships", idx, "title", v)}
                    placeholder="Data Analyst Intern"
                  />
                  <TextInput
                    label="Company / Host Organization"
                    value={item.company}
                    onChange={(v) => onUpdateArrayItem("internships", idx, "company", v)}
                    placeholder="Tech Solutions"
                  />
                  <TextInput
                    label="Location"
                    value={item.location}
                    onChange={(v) => onUpdateArrayItem("internships", idx, "location", v)}
                    placeholder="Remote"
                  />
                  <div className="hidden sm:block" />
                  <MonthYearPicker
                    label="Start Date"
                    value={item.startDate}
                    onChange={(v) => onUpdateArrayItem("internships", idx, "startDate", v)}
                  />
                  <MonthYearPicker
                    label="End Date"
                    value={item.endDate}
                    onChange={(v) => onUpdateArrayItem("internships", idx, "endDate", v)}
                  />
                  <TextArea
                    label="Description & Projects"
                    value={item.description}
                    onChange={(v) => onUpdateArrayItem("internships", idx, "description", v)}
                    placeholder="Key projects, tasks, and skills acquired..."
                    rows={3}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSectionCard>

      {/* 7. PROJECTS */}
      <EditorSectionCard
        title="Projects"
        description="Key technical or business projects demonstrating practical capabilities."
        sectionKey="projects"
        registerRef={registerSectionRef}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onAddArrayItem("projects", {
                name: "",
                technologies: "",
                link: "",
                description: "",
              })
            }
          >
            + Add Project
          </Button>
        }
      >
        {(!data.projects || data.projects.length === 0) ? (
          <EmptySectionPlaceholder
            text="No projects recorded."
            onAdd={() =>
              onAddArrayItem("projects", {
                name: "",
                technologies: "",
                link: "",
                description: "",
              })
            }
            buttonLabel="Add Project"
          />
        ) : (
          <div className="space-y-4">
            {data.projects.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Project #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteArrayItem("projects", idx)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Project Name"
                    value={item.name}
                    onChange={(v) => onUpdateArrayItem("projects", idx, "name", v)}
                    placeholder="Sales Analytics Dashboard"
                  />
                  <TextInput
                    label="Technologies Used"
                    value={item.technologies}
                    onChange={(v) => onUpdateArrayItem("projects", idx, "technologies", v)}
                    placeholder="Python, Power BI, PostgreSQL"
                  />
                  <TextInput
                    label="Project URL / Repository"
                    value={item.link}
                    onChange={(v) => onUpdateArrayItem("projects", idx, "link", v)}
                    placeholder="github.com/user/project"
                    className="sm:col-span-2"
                  />
                  <TextArea
                    label="Project Description & Impact"
                    value={item.description}
                    onChange={(v) => onUpdateArrayItem("projects", idx, "description", v)}
                    placeholder="Explain the problem solved, architecture, and results..."
                    rows={3}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSectionCard>

      {/* 8. COURSES & TRAINING */}
      <EditorSectionCard
        title="Courses & Professional Training"
        description="Relevant courses, bootcamps, and specialized programs."
        sectionKey="courses"
        registerRef={registerSectionRef}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onAddArrayItem("courses", {
                name: "",
                provider: "",
                date: "",
                certificateId: "",
              })
            }
          >
            + Add Course
          </Button>
        }
      >
        {(!data.courses || data.courses.length === 0) ? (
          <EmptySectionPlaceholder
            text="No courses added."
            onAdd={() =>
              onAddArrayItem("courses", {
                name: "",
                provider: "",
                date: "",
                certificateId: "",
              })
            }
            buttonLabel="Add Course"
          />
        ) : (
          <div className="space-y-4">
            {data.courses.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Course #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteArrayItem("courses", idx)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Course Title"
                    value={item.name}
                    onChange={(v) => onUpdateArrayItem("courses", idx, "name", v)}
                    placeholder="Google Data Analytics Certificate"
                  />
                  <TextInput
                    label="Provider / Platform"
                    value={item.provider}
                    onChange={(v) => onUpdateArrayItem("courses", idx, "provider", v)}
                    placeholder="Coursera / Google"
                  />
                  <MonthYearPicker
                    label="Completion Date"
                    value={item.date}
                    onChange={(v) => onUpdateArrayItem("courses", idx, "date", v)}
                  />
                  <TextInput
                    label="Credential ID / Link (Optional)"
                    value={item.certificateId}
                    onChange={(v) => onUpdateArrayItem("courses", idx, "certificateId", v)}
                    placeholder="CERT-12345"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSectionCard>

      {/* 9. CERTIFICATIONS & ACCREDITATIONS */}
      <EditorSectionCard
        title="Certifications & Accreditations"
        description="Formal industry certifications and professional accreditations."
        sectionKey="accreditations"
        registerRef={registerSectionRef}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onAddArrayItem("accreditations", {
                name: "",
                issuer: "",
                date: "",
                credentialId: "",
              })
            }
          >
            + Add Certification
          </Button>
        }
      >
        {(!data.accreditations || data.accreditations.length === 0) ? (
          <EmptySectionPlaceholder
            text="No certifications listed."
            onAdd={() =>
              onAddArrayItem("accreditations", {
                name: "",
                issuer: "",
                date: "",
                credentialId: "",
              })
            }
            buttonLabel="Add Certification"
          />
        ) : (
          <div className="space-y-4">
            {data.accreditations.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Certification #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteArrayItem("accreditations", idx)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Certification Name"
                    value={item.name}
                    onChange={(v) => onUpdateArrayItem("accreditations", idx, "name", v)}
                    placeholder="AWS Certified Solutions Architect"
                  />
                  <TextInput
                    label="Issuing Organization"
                    value={item.issuer}
                    onChange={(v) => onUpdateArrayItem("accreditations", idx, "issuer", v)}
                    placeholder="Amazon Web Services"
                  />
                  <MonthYearPicker
                    label="Issue Date"
                    value={item.date}
                    onChange={(v) => onUpdateArrayItem("accreditations", idx, "date", v)}
                  />
                  <TextInput
                    label="Credential ID"
                    value={item.credentialId}
                    onChange={(v) => onUpdateArrayItem("accreditations", idx, "credentialId", v)}
                    placeholder="Optional ID"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSectionCard>

      {/* 10. ACHIEVEMENTS */}
      <EditorSectionCard
        title="Key Achievements & Awards"
        description="Competitions, awards, and notable professional recognitions."
        sectionKey="achievements"
        registerRef={registerSectionRef}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onAddArrayItem("achievements", {
                title: "",
                date: "",
                description: "",
              })
            }
          >
            + Add Achievement
          </Button>
        }
      >
        {(!data.achievements || data.achievements.length === 0) ? (
          <EmptySectionPlaceholder
            text="No achievements added."
            onAdd={() =>
              onAddArrayItem("achievements", {
                title: "",
                date: "",
                description: "",
              })
            }
            buttonLabel="Add Achievement"
          />
        ) : (
          <div className="space-y-4">
            {data.achievements.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Achievement #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteArrayItem("achievements", idx)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Achievement Title / Award"
                    value={item.title}
                    onChange={(v) => onUpdateArrayItem("achievements", idx, "title", v)}
                    placeholder="1st Place Hackathon Winner"
                  />
                  <MonthYearPicker
                    label="Date"
                    value={item.date}
                    onChange={(v) => onUpdateArrayItem("achievements", idx, "date", v)}
                  />
                  <TextArea
                    label="Description"
                    value={item.description}
                    onChange={(v) => onUpdateArrayItem("achievements", idx, "description", v)}
                    placeholder="Context and details of this achievement..."
                    rows={2}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSectionCard>

      {/* 11. LANGUAGES */}
      <EditorSectionCard
        title="Languages"
        description="Spoken and written language proficiencies."
        sectionKey="languages"
        registerRef={registerSectionRef}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onAddArrayItem("languages", {
                language: "",
                level: "Fluent / Professional",
              })
            }
          >
            + Add Language
          </Button>
        }
      >
        {(!data.languages || data.languages.length === 0) ? (
          <EmptySectionPlaceholder
            text="No languages added."
            onAdd={() =>
              onAddArrayItem("languages", {
                language: "",
                level: "Fluent / Professional",
              })
            }
            buttonLabel="Add Language"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.languages.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Language #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteArrayItem("languages", idx)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                <TextInput
                  label="Language"
                  value={item.language}
                  onChange={(v) => onUpdateArrayItem("languages", idx, "language", v)}
                  placeholder="English"
                />
                <SelectInput
                  label="Proficiency Level"
                  value={item.level}
                  options={LANGUAGE_LEVELS}
                  onChange={(v) => onUpdateArrayItem("languages", idx, "level", v)}
                />
              </div>
            ))}
          </div>
        )}
      </EditorSectionCard>
    </div>
  );
}

function EditorSectionCard({ title, description, sectionKey, action = null, registerRef, children }) {
  return (
    <section
      ref={(el) => registerRef?.(sectionKey, el)}
      data-section-key={sectionKey}
      className="rounded-xl border border-slate-200 bg-white shadow-xs p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SkillGroupManager({ title, skills, onAdd, onRemove, placeholder }) {
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const clean = draft.trim();
    if (!clean) return;
    onAdd(clean);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-700">{title}</div>
      <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-slate-50 border border-slate-200">
        {skills.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No skills listed in this category.</span>
        ) : (
          skills.map((skill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => onRemove(skill)}
                className="text-slate-400 hover:text-rose-600 transition cursor-pointer font-bold text-sm leading-none"
                aria-label={`Remove ${skill}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-100"
        />
        <Button variant="secondary" size="sm" onClick={handleAdd} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}

function EmptySectionPlaceholder({ text, onAdd, buttonLabel }) {
  return (
    <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2.5">
      <p className="text-xs text-slate-500">{text}</p>
      {onAdd && (
        <Button variant="secondary" size="sm" onClick={onAdd}>
          + {buttonLabel}
        </Button>
      )}
    </div>
  );
}
