import { useState, useEffect } from "react";
import { createSubmission } from "./services/submissionService";
import { subscribeToAuth, logoutAdmin } from "./services/authService";
import AdminLogin from "./Pages/AdminLogin";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminCVReview from "./Pages/AdminCVReview";
import Button from "./components/ui/Button";
import {
  TextInput,
  TextArea,
  SelectInput,
  MonthYearPicker,
  CheckboxToggle,
} from "./components/ui/Input";

const INITIAL_DATA = {
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
  education: [],
  experience: [],
  internships: [],
  courses: [],
  skills: {
    technical: [],
    tools: [],
    soft: [],
  },
  languages: [],
  achievements: [],
  projects: [],
  accreditations: [],
};

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

const TECH_SUGGESTIONS = [
  "SQL", "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C#", "HTML/CSS", "PostgreSQL", "R",
];

const TOOL_SUGGESTIONS = [
  "Git", "GitHub", "Docker", "Power BI", "Excel", "Tableau", "AWS", "Azure", "Figma", "Jira",
];

const SOFT_SUGGESTIONS = [
  "Problem Solving", "Communication", "Team Leadership", "Critical Thinking", "Time Management", "Adaptability",
];

const CANDIDATE_PAGES = [
  { step: 1, title: "Profile", subtitle: "Personal Information & Professional Summary" },
  { step: 2, title: "Education & Experience", subtitle: "Academic history, professional roles, and internships" },
  { step: 3, title: "Skills & Qualifications", subtitle: "Skills, languages, certifications, courses, and achievements" },
  { step: 4, title: "Projects & Review", subtitle: "Showcase projects and review your complete CV before submitting" },
];

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");

  // Auth State
  const [authState, setAuthState] = useState({
    user: null,
    isAuthorized: false,
    loading: true,
  });

  // Client Routing State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentSearch, setCurrentSearch] = useState(window.location.search);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentSearch(window.location.search);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((result) => {
      setAuthState(result);
    });
    return () => unsubscribe();
  }, []);

  const navigate = (pathWithSearch) => {
    window.history.pushState({}, "", pathWithSearch);
    const [path, search] = pathWithSearch.split("?");
    setCurrentPath(path || "/");
    setCurrentSearch(search ? `?${search}` : "");
  };

  // ROUTE PARSING
  const searchParams = new URLSearchParams(currentSearch);
  const isAdminQuery = searchParams.get("admin") === "true";
  const urlSubmissionId = searchParams.get("submission");

  const isAdminRoute =
    currentPath.startsWith("/admin") ||
    isAdminQuery;

  const isAdminLoginRoute =
    currentPath === "/admin/login" ||
    searchParams.get("admin") === "login";

  let adminReviewId = null;
  if (currentPath.startsWith("/admin/review/")) {
    adminReviewId = currentPath.replace("/admin/review/", "").trim();
  } else if (isAdminQuery && urlSubmissionId) {
    adminReviewId = urlSubmissionId;
  }

  // ==========================================
  // ADMIN AUTHENTICATION & ROUTING GATING
  // ==========================================
  if (isAdminRoute || isAdminLoginRoute) {
    if (authState.loading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="text-center space-y-2.5">
            <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Verifying administrator session...</p>
          </div>
        </div>
      );
    }

    // Unauthenticated user -> render login
    if (!authState.user) {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            navigate("/admin");
          }}
        />
      );
    }

    // Authenticated user but unauthorized
    if (!authState.isAuthorized) {
      const handleTryAnotherAccount = async () => {
        await logoutAdmin();
        setAuthState({ user: null, isAuthorized: false, loading: false });
        navigate("/admin/login");
      };

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
          <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-7 text-center space-y-4 shadow-sm">
            <div className="w-11 h-11 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-lg font-bold border border-rose-200">
              ✕
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Access Denied</h2>
              <p className="text-xs text-slate-600">
                Account <strong>{authState.user.email}</strong> is not authorized for the Admin Portal.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTryAnotherAccount}
              >
                Try Another Account
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Authenticated & Authorized Admin -> Route to Review or Dashboard
    if (adminReviewId) {
      return (
        <AdminCVReview
          submissionId={adminReviewId}
          onBack={() => navigate("/admin")}
        />
      );
    }

    return (
      <AdminDashboard
        adminUser={authState.user}
        onOpenSubmission={(id) => navigate(`/admin/review/${id}`)}
        onLogout={() => navigate("/admin/login")}
      />
    );
  }

  // ==========================================
  // CANDIDATE CV BUILDER (4-PAGE FLOW)
  // Zero Admin links exposed to candidates
  // ==========================================

  const updatePersonal = (field, value) => {
    setData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
  };

  const updateArrayItem = (section, index, field, value) => {
    setData((prev) => {
      const items = [...prev[section]];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, [section]: items };
    });
  };

  const removeArrayItem = (section, index) => {
    setData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const addArrayItem = (section, template) => {
    setData((prev) => ({
      ...prev,
      [section]: [...prev[section], template],
    }));
  };

  const addSkill = (category, skill) => {
    const clean = skill.trim();
    if (!clean) return;
    if (data.skills[category].includes(clean)) return;

    setData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...prev.skills[category], clean],
      },
    }));
  };

  const removeSkill = (category, skill) => {
    setData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter((item) => item !== skill),
      },
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      setSubmitting(true);
      const newId = await createSubmission(data);
      setSubmissionId(newId);
      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Something went wrong with submission. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold border border-emerald-200">
            ✓
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-950">CV Submitted Successfully!</h1>
            <p className="text-xs text-slate-600">
              Thank you, <strong className="text-slate-900">{data.personal.fullName || "Candidate"}</strong>.
              Your details have been securely recorded for review.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono">
            Submission Reference: <strong>#{submissionId.slice(0, 10)}</strong>
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setData(INITIAL_DATA);
                setStep(1);
                setSubmitted(false);
              }}
            >
              Submit Another CV
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentPage = CANDIDATE_PAGES[step - 1];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-2xs">
              CV
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight block leading-none">
                CV Rise
              </span>
              <span className="text-xs text-slate-500 font-medium">Candidate CV Builder</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Step {step} of 4
            </span>
          </div>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="h-1 bg-slate-100 w-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </header>

      {/* Main 4-Page Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Step Indicator Header (Desktop) */}
        <div className="hidden sm:grid grid-cols-4 gap-2.5 mb-6">
          {CANDIDATE_PAGES.map((p) => {
            const isCurrent = p.step === step;
            const isCompleted = p.step < step;
            return (
              <button
                key={p.step}
                type="button"
                onClick={() => setStep(p.step)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  isCurrent
                    ? "bg-white border-blue-600 shadow-xs ring-1 ring-blue-100"
                    : isCompleted
                    ? "bg-slate-100/80 border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-white/50 border-slate-200 text-slate-400 hover:bg-white"
                }`}
              >
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Step {p.step}
                </div>
                <div className="text-xs font-bold truncate text-slate-900">{p.title}</div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-6">
            {/* Page Title & Subtitle */}
            <div className="pb-4 border-b border-slate-100 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Step {step} of 4 — {currentPage.title}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
                {currentPage.title}
              </h1>
              <p className="text-sm text-slate-500 leading-normal">{currentPage.subtitle}</p>
            </div>

            {/* ========================================================= */}
            {/* PAGE 1: PROFILE (Personal Info + Summary + Inline Review) */}
            {/* ========================================================= */}
            {step === 1 && (
              <div className="space-y-7">
                {/* 1.1 Personal Information */}
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 pb-1.5 border-b border-slate-100">
                    Personal Information
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextInput
                      label="Full Name"
                      value={data.personal.fullName}
                      onChange={(v) => updatePersonal("fullName", v)}
                      placeholder="Sarah Jenkins"
                      required
                    />
                    <TextInput
                      label="Target Position"
                      value={data.personal.targetTitle}
                      onChange={(v) => updatePersonal("targetTitle", v)}
                      placeholder="Senior Data Analyst"
                      required
                    />
                    <TextInput
                      label="Email Address"
                      type="email"
                      value={data.personal.email}
                      onChange={(v) => updatePersonal("email", v)}
                      placeholder="sarah@example.com"
                      required
                    />
                    <TextInput
                      label="Phone Number"
                      type="tel"
                      value={data.personal.phone}
                      onChange={(v) => updatePersonal("phone", v)}
                      placeholder="+1 555 0192"
                      required
                    />
                    <TextInput
                      label="Location / City"
                      value={data.personal.location}
                      onChange={(v) => updatePersonal("location", v)}
                      placeholder="Cairo, Egypt"
                    />
                    <TextInput
                      label="LinkedIn Profile URL"
                      value={data.personal.linkedin}
                      onChange={(v) => updatePersonal("linkedin", v)}
                      placeholder="linkedin.com/in/username"
                    />
                    <TextInput
                      label="Portfolio / GitHub URL"
                      value={data.personal.portfolio}
                      onChange={(v) => updatePersonal("portfolio", v)}
                      placeholder="github.com/username"
                      className="sm:col-span-2"
                    />
                  </div>
                </div>

                {/* 1.2 Professional Summary */}
                <div className="space-y-3 pt-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 pb-1.5 border-b border-slate-100">
                    Professional Summary
                  </h2>
                  <TextArea
                    label="Career Objective & Summary"
                    value={data.personal.summary}
                    onChange={(v) => updatePersonal("summary", v)}
                    placeholder="Briefly describe your career background, core competencies, and career objective..."
                    rows={4}
                  />
                </div>

                {/* 1.3 INLINE REVIEW: Profile Review */}
                <InlineReviewSection title="Profile Review" subtitle="Live summary of your entered personal details.">
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Full Name
                      </span>
                      <p className="font-semibold text-slate-900">
                        {data.personal.fullName || <span className="text-slate-400 font-normal italic">Not entered yet</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Target Position
                      </span>
                      <p className="font-semibold text-slate-900">
                        {data.personal.targetTitle || <span className="text-slate-400 font-normal italic">Not entered yet</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Email Address
                      </span>
                      <p className="text-slate-700">
                        {data.personal.email || <span className="text-slate-400 italic">Not entered yet</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Phone Number
                      </span>
                      <p className="text-slate-700">
                        {data.personal.phone || <span className="text-slate-400 italic">Not entered yet</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Location
                      </span>
                      <p className="text-slate-700">
                        {data.personal.location || <span className="text-slate-400 italic">Not entered yet</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Links
                      </span>
                      <p className="text-slate-700 truncate">
                        {[data.personal.linkedin, data.personal.portfolio].filter(Boolean).join("  •  ") || (
                          <span className="text-slate-400 italic">No links added</span>
                        )}
                      </p>
                    </div>

                    <div className="sm:col-span-2 space-y-0.5 pt-1 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Professional Summary
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                        {data.personal.summary || <span className="text-slate-400 italic">No summary entered yet.</span>}
                      </p>
                    </div>
                  </div>
                </InlineReviewSection>
              </div>
            )}

            {/* ========================================================= */}
            {/* PAGE 2: EDUCATION & EXPERIENCE (+ Inline Review) */}
            {/* ========================================================= */}
            {step === 2 && (
              <div className="space-y-7">
                {/* 2.1 Education */}
                <RepeatableSection
                  title="Education"
                  description="Add university degrees, diplomas, or academic qualifications."
                  items={data.education}
                  onAdd={() =>
                    addArrayItem("education", {
                      degree: "Bachelor's Degree",
                      institution: "",
                      fieldOfStudy: "",
                      startDate: "",
                      endDate: "",
                      grade: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("education", i)}
                  addButtonLabel="Add Degree / Qualification"
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <SelectInput
                        label="Degree"
                        value={item.degree}
                        options={DEGREE_OPTIONS}
                        onChange={(v) => updateArrayItem("education", idx, "degree", v)}
                      />
                      <SelectInput
                        label="Field of Study"
                        value={item.fieldOfStudy}
                        options={STUDY_FIELDS}
                        onChange={(v) => updateArrayItem("education", idx, "fieldOfStudy", v)}
                      />
                      <TextInput
                        label="University / Institution"
                        value={item.institution}
                        onChange={(v) => updateArrayItem("education", idx, "institution", v)}
                        placeholder="Cairo University"
                      />
                      <TextInput
                        label="Grade / GPA (Optional)"
                        value={item.grade}
                        onChange={(v) => updateArrayItem("education", idx, "grade", v)}
                        placeholder="3.8 / 4.0"
                      />
                      <MonthYearPicker
                        label="Start Date"
                        value={item.startDate}
                        onChange={(v) => updateArrayItem("education", idx, "startDate", v)}
                      />
                      <MonthYearPicker
                        label="End Date"
                        value={item.endDate}
                        onChange={(v) => updateArrayItem("education", idx, "endDate", v)}
                      />
                    </div>
                  )}
                />

                {/* 2.2 Work Experience */}
                <RepeatableSection
                  title="Work Experience"
                  description="Add professional work history and career milestones."
                  items={data.experience}
                  onAdd={() =>
                    addArrayItem("experience", {
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
                  onRemove={(i) => removeArrayItem("experience", i)}
                  addButtonLabel="Add Work Experience"
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <TextInput
                        label="Job Title"
                        value={item.jobTitle}
                        onChange={(v) => updateArrayItem("experience", idx, "jobTitle", v)}
                        placeholder="Data Analyst"
                      />
                      <TextInput
                        label="Company Name"
                        value={item.company}
                        onChange={(v) => updateArrayItem("experience", idx, "company", v)}
                        placeholder="Acme Corp"
                      />
                      <SelectInput
                        label="Employment Type"
                        value={item.employmentType}
                        options={EMPLOYMENT_TYPES}
                        onChange={(v) => updateArrayItem("experience", idx, "employmentType", v)}
                      />
                      <TextInput
                        label="Location"
                        value={item.location}
                        onChange={(v) => updateArrayItem("experience", idx, "location", v)}
                        placeholder="Cairo, Egypt"
                      />
                      <MonthYearPicker
                        label="Start Date"
                        value={item.startDate}
                        onChange={(v) => updateArrayItem("experience", idx, "startDate", v)}
                      />
                      {!item.current && (
                        <MonthYearPicker
                          label="End Date"
                          value={item.endDate}
                          onChange={(v) => updateArrayItem("experience", idx, "endDate", v)}
                        />
                      )}
                      <div className="sm:col-span-2 pt-0.5">
                        <CheckboxToggle
                          label="I currently work in this role"
                          checked={item.current}
                          onChange={(v) => updateArrayItem("experience", idx, "current", v)}
                        />
                      </div>
                      <TextArea
                        label="Key Responsibilities"
                        value={item.responsibilities}
                        onChange={(v) => updateArrayItem("experience", idx, "responsibilities", v)}
                        placeholder="Detail day-to-day responsibilities..."
                        rows={3}
                        className="sm:col-span-2"
                      />
                      <TextArea
                        label="Key Achievements & Metrics"
                        value={item.achievements}
                        onChange={(v) => updateArrayItem("experience", idx, "achievements", v)}
                        placeholder="e.g. Reduced query latency by 40%..."
                        rows={2}
                        className="sm:col-span-2"
                      />
                    </div>
                  )}
                />

                {/* 2.3 Internships */}
                <RepeatableSection
                  title="Internships"
                  description="Add student internships, apprenticeships, or practical training programs."
                  items={data.internships}
                  onAdd={() =>
                    addArrayItem("internships", {
                      title: "",
                      company: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      description: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("internships", i)}
                  addButtonLabel="Add Internship"
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <TextInput
                        label="Internship Title"
                        value={item.title}
                        onChange={(v) => updateArrayItem("internships", idx, "title", v)}
                        placeholder="Business Analyst Intern"
                      />
                      <TextInput
                        label="Organization / Company"
                        value={item.company}
                        onChange={(v) => updateArrayItem("internships", idx, "company", v)}
                        placeholder="Vodafone"
                      />
                      <TextInput
                        label="Location"
                        value={item.location}
                        onChange={(v) => updateArrayItem("internships", idx, "location", v)}
                        placeholder="Cairo / Remote"
                      />
                      <div className="hidden sm:block" />
                      <MonthYearPicker
                        label="Start Date"
                        value={item.startDate}
                        onChange={(v) => updateArrayItem("internships", idx, "startDate", v)}
                      />
                      <MonthYearPicker
                        label="End Date"
                        value={item.endDate}
                        onChange={(v) => updateArrayItem("internships", idx, "endDate", v)}
                      />
                      <TextArea
                        label="Description & Projects"
                        value={item.description}
                        onChange={(v) => updateArrayItem("internships", idx, "description", v)}
                        placeholder="Key contributions and learnings..."
                        rows={2}
                        className="sm:col-span-2"
                      />
                    </div>
                  )}
                />

                {/* 2.4 INLINE REVIEW: Education & Experience Review */}
                <InlineReviewSection
                  title="Education & Experience Review"
                  subtitle="Live summary of your academic history and professional timeline."
                >
                  <div className="space-y-4 text-sm">
                    {/* Education summary */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Education ({data.education.length})
                      </span>
                      {data.education.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No education entries added yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {data.education.map((e, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                              <strong className="text-slate-900">{e.degree} in {e.fieldOfStudy || "General"}</strong>
                              {e.institution && <span className="text-slate-600"> — {e.institution}</span>}
                              {(e.startDate || e.endDate) && (
                                <span className="text-slate-400 ml-1">({[e.startDate, e.endDate].filter(Boolean).join(" – ")})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Experience summary */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Work Experience ({data.experience.length})
                      </span>
                      {data.experience.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No work experience entries added yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {data.experience.map((exp, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                              <strong className="text-slate-900">{exp.jobTitle || "Job Title"}</strong>
                              {exp.company && <span className="text-slate-600"> at {exp.company}</span>}
                              {(exp.startDate || exp.endDate || exp.current) && (
                                <span className="text-slate-400 ml-1">
                                  ({[exp.startDate, exp.current ? "Present" : exp.endDate].filter(Boolean).join(" – ")})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Internships summary */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Internships ({data.internships.length})
                      </span>
                      {data.internships.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No internships listed.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {data.internships.map((item, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                              <strong className="text-slate-900">{item.title || "Internship"}</strong>
                              {item.company && <span className="text-slate-600"> — {item.company}</span>}
                              {(item.startDate || item.endDate) && (
                                <span className="text-slate-400 ml-1">
                                  ({[item.startDate, item.endDate].filter(Boolean).join(" – ")})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </InlineReviewSection>
              </div>
            )}

            {/* ========================================================= */}
            {/* PAGE 3: SKILLS & QUALIFICATIONS (+ Inline Review) */}
            {/* ========================================================= */}
            {step === 3 && (
              <div className="space-y-7">
                {/* 3.1 Skills Group */}
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 pb-1.5 border-b border-slate-100">
                    Skills & Competencies
                  </h2>
                  <div className="space-y-4">
                    <SkillManager
                      title="Technical Skills"
                      category="technical"
                      skills={data.skills.technical}
                      suggestions={TECH_SUGGESTIONS}
                      onAdd={addSkill}
                      onRemove={removeSkill}
                    />

                    <SkillManager
                      title="Tools & Technologies"
                      category="tools"
                      skills={data.skills.tools}
                      suggestions={TOOL_SUGGESTIONS}
                      onAdd={addSkill}
                      onRemove={removeSkill}
                    />

                    <SkillManager
                      title="Professional & Soft Skills"
                      category="soft"
                      skills={data.skills.soft}
                      suggestions={SOFT_SUGGESTIONS}
                      onAdd={addSkill}
                      onRemove={removeSkill}
                    />
                  </div>
                </div>

                {/* 3.2 Languages */}
                <RepeatableSection
                  title="Languages"
                  description="List languages and your professional fluency level."
                  items={data.languages}
                  onAdd={() =>
                    addArrayItem("languages", {
                      language: "",
                      level: "Fluent / Professional",
                    })
                  }
                  onRemove={(i) => removeArrayItem("languages", i)}
                  addButtonLabel="Add Language"
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <TextInput
                        label="Language"
                        value={item.language}
                        onChange={(v) => updateArrayItem("languages", idx, "language", v)}
                        placeholder="English"
                      />
                      <SelectInput
                        label="Proficiency Level"
                        value={item.level}
                        options={LANGUAGE_LEVELS}
                        onChange={(v) => updateArrayItem("languages", idx, "level", v)}
                      />
                    </div>
                  )}
                />

                {/* 3.3 Courses & Training */}
                <RepeatableSection
                  title="Courses & Training"
                  description="Add completed bootcamps, workshops, and certified online courses."
                  items={data.courses}
                  onAdd={() =>
                    addArrayItem("courses", {
                      name: "",
                      provider: "",
                      date: "",
                      certificateId: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("courses", i)}
                  addButtonLabel="Add Course"
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <TextInput
                        label="Course / Program Name"
                        value={item.name}
                        onChange={(v) => updateArrayItem("courses", idx, "name", v)}
                        placeholder="Data Engineering Bootcamp"
                      />
                      <TextInput
                        label="Provider / Institution"
                        value={item.provider}
                        onChange={(v) => updateArrayItem("courses", idx, "provider", v)}
                        placeholder="Coursera / IBM"
                      />
                      <MonthYearPicker
                        label="Completion Date"
                        value={item.date}
                        onChange={(v) => updateArrayItem("courses", idx, "date", v)}
                      />
                      <TextInput
                        label="Certificate ID / URL"
                        value={item.certificateId}
                        onChange={(v) => updateArrayItem("courses", idx, "certificateId", v)}
                        placeholder="Optional"
                      />
                    </div>
                  )}
                />

                {/* 3.4 Certifications & Accreditations */}
                <RepeatableSection
                  title="Certifications & Accreditations"
                  description="Add industry-recognized professional certifications and credentials."
                  items={data.accreditations}
                  onAdd={() =>
                    addArrayItem("accreditations", {
                      name: "",
                      issuer: "",
                      date: "",
                      credentialId: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("accreditations", i)}
                  addButtonLabel="Add Certification"
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <TextInput
                        label="Certification Title"
                        value={item.name}
                        onChange={(v) => updateArrayItem("accreditations", idx, "name", v)}
                        placeholder="AWS Solutions Architect"
                      />
                      <TextInput
                        label="Issuing Organization"
                        value={item.issuer}
                        onChange={(v) => updateArrayItem("accreditations", idx, "issuer", v)}
                        placeholder="Amazon Web Services"
                      />
                      <MonthYearPicker
                        label="Issue Date"
                        value={item.date}
                        onChange={(v) => updateArrayItem("accreditations", idx, "date", v)}
                      />
                      <TextInput
                        label="Credential ID"
                        value={item.credentialId}
                        onChange={(v) => updateArrayItem("accreditations", idx, "credentialId", v)}
                        placeholder="Optional ID"
                      />
                    </div>
                  )}
                />

                {/* 3.5 Achievements */}
                <RepeatableSection
                  title="Achievements & Honors"
                  description="Highlight competitions, hackathons, academic honors, or notable awards."
                  items={data.achievements}
                  onAdd={() =>
                    addArrayItem("achievements", {
                      title: "",
                      date: "",
                      description: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("achievements", i)}
                  addButtonLabel="Add Achievement"
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <TextInput
                        label="Award / Achievement Title"
                        value={item.title}
                        onChange={(v) => updateArrayItem("achievements", idx, "title", v)}
                        placeholder="1st Place FinTech Hackathon"
                      />
                      <MonthYearPicker
                        label="Date"
                        value={item.date}
                        onChange={(v) => updateArrayItem("achievements", idx, "date", v)}
                      />
                      <TextArea
                        label="Description"
                        value={item.description}
                        onChange={(v) => updateArrayItem("achievements", idx, "description", v)}
                        placeholder="Briefly describe the context and achievement..."
                        rows={2}
                        className="sm:col-span-2"
                      />
                    </div>
                  )}
                />

                {/* 3.6 INLINE REVIEW: Skills & Qualifications Review */}
                <InlineReviewSection
                  title="Skills & Qualifications Review"
                  subtitle="Live summary of your competencies, certifications, and languages."
                >
                  <div className="space-y-4 text-sm">
                    {/* Skills Summary */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Selected Skills
                      </span>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                          <span className="text-2xs font-bold text-slate-400 uppercase block">Technical</span>
                          <div className="flex flex-wrap gap-1">
                            {data.skills.technical.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">None added</span>
                            ) : (
                              data.skills.technical.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-blue-50 text-blue-800 font-medium border border-blue-100">
                                  {s}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                          <span className="text-2xs font-bold text-slate-400 uppercase block">Tools</span>
                          <div className="flex flex-wrap gap-1">
                            {data.skills.tools.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">None added</span>
                            ) : (
                              data.skills.tools.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-800 font-medium border border-slate-200">
                                  {s}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                          <span className="text-2xs font-bold text-slate-400 uppercase block">Soft Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {data.skills.soft.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">None added</span>
                            ) : (
                              data.skills.soft.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-emerald-50 text-emerald-800 font-medium border border-emerald-100">
                                  {s}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Languages
                      </span>
                      {data.languages.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No languages added yet.</p>
                      ) : (
                        <p className="text-xs text-slate-800 font-medium">
                          {data.languages.map((l) => `${l.language || "Language"} (${l.level || "Fluent"})`).join("  •  ")}
                        </p>
                      )}
                    </div>

                    {/* Certifications & Courses */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Certifications & Courses
                      </span>
                      {[...data.accreditations, ...data.courses].length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No certifications or courses added yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {data.accreditations.map((acc, i) => (
                            <span key={`acc-${i}`} className="px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-slate-800">
                              <strong>{acc.name}</strong> {acc.issuer && `— ${acc.issuer}`}
                            </span>
                          ))}
                          {data.courses.map((c, i) => (
                            <span key={`c-${i}`} className="px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-slate-800">
                              {c.name} {c.provider && `— ${c.provider}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </InlineReviewSection>
              </div>
            )}

            {/* ========================================================= */}
            {/* PAGE 4: PROJECTS & COMPREHENSIVE FINAL REVIEW */}
            {/* ========================================================= */}
            {step === 4 && (
              <div className="space-y-7">
                {/* 4.1 Projects */}
                <RepeatableSection
                  title="Projects"
                  description="Showcase practical projects demonstrating your technical and analytical capability."
                  items={data.projects}
                  onAdd={() =>
                    addArrayItem("projects", {
                      name: "",
                      technologies: "",
                      link: "",
                      description: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("projects", i)}
                  addButtonLabel="Add Project"
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <TextInput
                        label="Project Name"
                        value={item.name}
                        onChange={(v) => updateArrayItem("projects", idx, "name", v)}
                        placeholder="Customer Churn Prediction"
                      />
                      <TextInput
                        label="Technologies Used"
                        value={item.technologies}
                        onChange={(v) => updateArrayItem("projects", idx, "technologies", v)}
                        placeholder="Python, Scikit-Learn, Power BI"
                      />
                      <TextInput
                        label="GitHub / Demo URL"
                        value={item.link}
                        onChange={(v) => updateArrayItem("projects", idx, "link", v)}
                        placeholder="github.com/user/project"
                        className="sm:col-span-2"
                      />
                      <TextArea
                        label="Description & Outcomes"
                        value={item.description}
                        onChange={(v) => updateArrayItem("projects", idx, "description", v)}
                        placeholder="Explain problem, architecture, and outcomes..."
                        rows={3}
                        className="sm:col-span-2"
                      />
                    </div>
                  )}
                />

                {/* 4.2 Comprehensive 11-Section Final Review */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Comprehensive Final Review
                    </h2>
                    <p className="text-xs text-slate-500">
                      Verify your complete CV information before submission. Click "Edit" on any section to make updates.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {/* Personal Info Review */}
                    <ReviewCard title="1. Personal Information" onEdit={() => setStep(1)}>
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-2xs uppercase font-bold text-slate-400 block">Name</span>
                          <span className="font-semibold text-slate-900">{data.personal.fullName || "—"}</span>
                        </div>
                        <div>
                          <span className="text-2xs uppercase font-bold text-slate-400 block">Target Role</span>
                          <span className="font-semibold text-slate-900">{data.personal.targetTitle || "—"}</span>
                        </div>
                        <div>
                          <span className="text-2xs uppercase font-bold text-slate-400 block">Email</span>
                          <span className="text-slate-700">{data.personal.email || "—"}</span>
                        </div>
                        <div>
                          <span className="text-2xs uppercase font-bold text-slate-400 block">Phone</span>
                          <span className="text-slate-700">{data.personal.phone || "—"}</span>
                        </div>
                      </div>
                    </ReviewCard>

                    {/* Summary Review */}
                    <ReviewCard title="2. Professional Summary" onEdit={() => setStep(1)}>
                      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {data.personal.summary || <span className="italic text-slate-400">No summary provided</span>}
                      </p>
                    </ReviewCard>

                    {/* Education Review */}
                    <ReviewCard title="3. Education" onEdit={() => setStep(2)}>
                      {data.education.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No education recorded</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.education.map((e, i) => (
                            <div key={i}>
                              <strong className="text-slate-900">{e.degree} in {e.fieldOfStudy || "General"}</strong> — {e.institution} ({e.startDate} – {e.endDate})
                            </div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* Experience Review */}
                    <ReviewCard title="4. Work Experience" onEdit={() => setStep(2)}>
                      {data.experience.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No work experience listed</span>
                      ) : (
                        <div className="space-y-1.5 text-xs sm:text-sm">
                          {data.experience.map((exp, i) => (
                            <div key={i}>
                              <strong className="text-slate-900">{exp.jobTitle} at {exp.company}</strong> ({exp.startDate} – {exp.current ? "Present" : exp.endDate})
                            </div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* Internships Review */}
                    <ReviewCard title="5. Internships" onEdit={() => setStep(2)}>
                      {data.internships.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No internships listed</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.internships.map((item, i) => (
                            <div key={i}>
                              <strong className="text-slate-900">{item.title} at {item.company}</strong> ({item.startDate} – {item.endDate})
                            </div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* Skills Review */}
                    <ReviewCard title="6. Skills & Tools" onEdit={() => setStep(3)}>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          ...data.skills.technical,
                          ...data.skills.tools,
                          ...data.skills.soft,
                        ].length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No skills added</span>
                        ) : (
                          [
                            ...data.skills.technical,
                            ...data.skills.tools,
                            ...data.skills.soft,
                          ].map((s, i) => (
                            <span key={i} className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-800 font-medium border border-slate-200">
                              {s}
                            </span>
                          ))
                        )}
                      </div>
                    </ReviewCard>

                    {/* Languages Review */}
                    <ReviewCard title="7. Languages" onEdit={() => setStep(3)}>
                      {data.languages.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No languages listed</span>
                      ) : (
                        <div className="text-xs sm:text-sm text-slate-700">
                          {data.languages.map((l) => `${l.language} (${l.level})`).join("  •  ")}
                        </div>
                      )}
                    </ReviewCard>

                    {/* Courses Review */}
                    <ReviewCard title="8. Courses & Training" onEdit={() => setStep(3)}>
                      {data.courses.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No courses recorded</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.courses.map((c, i) => (
                            <div key={i}>{c.name} — {c.provider} ({c.date})</div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* Certifications Review */}
                    <ReviewCard title="9. Certifications" onEdit={() => setStep(3)}>
                      {data.accreditations.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No certifications listed</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.accreditations.map((acc, i) => (
                            <div key={i}><strong>{acc.name}</strong> — {acc.issuer} ({acc.date})</div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* Achievements Review */}
                    <ReviewCard title="10. Achievements" onEdit={() => setStep(3)}>
                      {data.achievements.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No achievements listed</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.achievements.map((a, i) => (
                            <div key={i}><strong>{a.title}</strong> ({a.date})</div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* Projects Review */}
                    <ReviewCard title="11. Projects" onEdit={() => setStep(4)}>
                      {data.projects.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No projects listed</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.projects.map((p, i) => (
                            <div key={i}><strong>{p.name}</strong> ({p.technologies})</div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Form Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setStep((s) => Math.max(1, s - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={submitting}
                >
                  ← Back
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setStep((s) => Math.min(4, s + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Continue →
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={submitting}
                >
                  Submit CV Information
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function RepeatableSection({
  title,
  description,
  items,
  onAdd,
  onRemove,
  addButtonLabel,
  renderItem,
}) {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-xs sm:text-sm text-slate-500">{description}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onAdd}>
          + {addButtonLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-5 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
          <p className="text-xs sm:text-sm text-slate-500">No {title.toLowerCase()} added yet.</p>
          <Button variant="secondary" size="sm" onClick={onAdd}>
            + {addButtonLabel}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3 relative shadow-2xs"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {title} #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                >
                  Remove
                </button>
              </div>

              {renderItem(item, idx)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillManager({ title, category, skills, suggestions, onAdd, onRemove }) {
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    onAdd(category, draft);
    setDraft("");
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
        <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
          {skills.length} Selected
        </span>
      </div>

      {/* Selected Skills Block */}
      <div className="min-h-[38px] p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
        <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Active Skills
        </span>
        {skills.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No skills selected. Type below or click suggestions.</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => onRemove(category, s)}
                  className="text-blue-400 hover:text-rose-600 font-bold leading-none cursor-pointer text-sm"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Custom Input */}
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
          placeholder="Type custom skill..."
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-2xs"
        />
        <Button variant="secondary" size="md" onClick={handleAdd} disabled={!draft.trim()}>
          Add
        </Button>
      </div>

      {/* Secondary Suggestion Chips */}
      <div className="space-y-1.5 pt-1">
        <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
          Quick Suggestions
        </span>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s, idx) => {
            const isSelected = skills.includes(s);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => (isSelected ? onRemove(category, s) : onAdd(category, s))}
                className={`px-2.5 py-1 rounded-full text-xs transition cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white font-semibold shadow-2xs border border-blue-600"
                    : "bg-white text-slate-600 border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-700"
                }`}
              >
                {isSelected ? "✓ " : "+ "}
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InlineReviewSection({ title, subtitle, children }) {
  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Live Preview
        </span>
      </div>
      {children}
    </div>
  );
}

function ReviewCard({ title, onEdit, children }) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}
