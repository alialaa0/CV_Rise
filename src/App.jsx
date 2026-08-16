import React, { useState, useEffect } from "react";
import { createSubmission } from "./services/submissionService";
import { subscribeToAuth, logoutAdmin } from "./services/authService";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useLanguage } from "./hooks/useLanguage";
import { useTheme } from "./hooks/useTheme";
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

export default function Root() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  );
}

function App() {
  const { t, language, setLanguage, dir } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [data, setData] = useState(INITIAL_DATA);
  const [step, setStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");

  // Track expanded repeatable cards: { "education-0": true, ... }
  const [expandedCards, setExpandedCards] = useState({
    "education-0": true,
    "experience-0": true,
    "internships-0": true,
    "courses-0": true,
    "languages-0": true,
    "accreditations-0": true,
    "achievements-0": true,
    "projects-0": true,
  });

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-900 dark:text-slate-100">
          <div className="text-center space-y-2.5">
            <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verifying administrator session...</p>
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-900 dark:text-slate-100">
          <div className="max-w-md w-full rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 p-7 text-center space-y-4 shadow-sm">
            <div className="w-11 h-11 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg font-bold border border-rose-200 dark:border-rose-800">
              ✕
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Access Denied</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
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
  // CANDIDATE CV BUILDER (4-PAGE GUIDED WORKSPACE)
  // Zero Admin references or navigation exposed
  // ==========================================

  const updatePersonal = (field, value) => {
    setData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const toggleExpandCard = (key) => {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
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
    setData((prev) => {
      const currentList = Array.isArray(prev[section]) ? prev[section] : [];
      const newIndex = currentList.length;
      setExpandedCards((e) => ({ ...e, [`${section}-${newIndex}`]: true }));
      return {
        ...prev,
        [section]: [...currentList, template],
      };
    });
  };

  const addSkill = (category, skill) => {
    const clean = skill.trim();
    if (!clean) return;

    setData((prev) => {
      const currentList = prev.skills[category] || [];
      // Normalize casing to prevent duplicate entries like "python" and "Python"
      const exists = currentList.some((s) => s.toLowerCase() === clean.toLowerCase());
      if (exists) return prev;

      return {
        ...prev,
        skills: {
          ...prev.skills,
          [category]: [...currentList, clean],
        },
      };
    });
  };

  const removeSkill = (category, skill) => {
    setData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: (prev.skills[category] || []).filter(
          (item) => item.toLowerCase() !== skill.toLowerCase()
        ),
      },
    }));
  };

  const validateStep = (currentStep) => {
    const errors = {};
    if (currentStep === 1) {
      if (!data.personal.fullName?.trim()) errors.fullName = t("val.required");
      if (!data.personal.targetTitle?.trim()) errors.targetTitle = t("val.required");
      if (!data.personal.email?.trim()) {
        errors.email = t("val.required");
      } else if (!data.personal.email.includes("@")) {
        errors.email = t("val.invalidEmail");
      }
      if (!data.personal.phone?.trim()) errors.phone = t("val.required");
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(step)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJumpToStep = (targetStep) => {
    if (targetStep < step || validateStep(step)) {
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateStep(1)) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSubmitting(true);
      const newId = await createSubmission(data);
      setSubmissionId(newId);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs">
            ✓
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tracking-tight">
              {t("success.title")}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("success.message", { name: data.personal.fullName || "Candidate" })}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-mono">
            {t("success.refLabel")}: <strong className="text-slate-950 dark:text-white dir-ltr">#{submissionId.slice(0, 10)}</strong>
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setData(INITIAL_DATA);
                setStep(1);
                setSubmitted(false);
              }}
            >
              {t("success.another")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const CANDIDATE_PAGES = [
    { step: 1, title: t("step1.title"), subtitle: t("step1.subtitle"), badge: t("step1.badge") },
    { step: 2, title: t("step2.title"), subtitle: t("step2.subtitle"), badge: t("step2.badge") },
    { step: 3, title: t("step3.title"), subtitle: t("step3.subtitle"), badge: t("step3.badge") },
    { step: 4, title: t("step4.title"), subtitle: t("step4.subtitle"), badge: t("step4.badge") },
  ];

  const currentPage = CANDIDATE_PAGES[step - 1];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 transition-colors duration-150">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-2xs shrink-0">
              CV
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-950 dark:text-white tracking-tight block leading-none truncate">
                {t("app.title")}
              </span>
              <span className="text-2xs text-slate-500 dark:text-slate-400 font-medium truncate block">
                {t("app.candidateSubtitle")}
              </span>
            </div>
          </div>

          {/* Controls: Step Badge + Language Toggle + Theme Selector */}
          <div className="flex items-center gap-2">
            {/* Step Progress Pill */}
            <span className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              {t("app.stepProgress", { current: step, total: 4 })}
            </span>

            {/* Language Switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5" role="group" aria-label={t("lang.label")}>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 text-2xs font-bold rounded-md transition cursor-pointer ${
                  language === "en"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ar")}
                className={`px-2 py-1 text-2xs font-bold rounded-md transition cursor-pointer ${
                  language === "ar"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="التحويل إلى العربية"
              >
                عربي
              </button>
            </div>

            {/* Theme Switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5" role="group" aria-label={t("theme.label")}>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`px-2 py-1 text-xs rounded-md transition cursor-pointer ${
                  theme === "light"
                    ? "bg-white dark:bg-slate-700 text-amber-600 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title={t("theme.light")}
              >
                ☀
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`px-2 py-1 text-xs rounded-md transition cursor-pointer ${
                  theme === "dark"
                    ? "bg-white dark:bg-slate-700 text-blue-400 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title={t("theme.dark")}
              >
                🌙
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`hidden md:inline-block px-2 py-1 text-2xs rounded-md transition cursor-pointer ${
                  theme === "system"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title={t("theme.system")}
              >
                💻
              </button>
            </div>
          </div>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </header>

      {/* 2. MAIN GUIDED WORKSPACE CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Desktop 4-Step Interactive Progress Stepper */}
        <div className="hidden sm:grid grid-cols-4 gap-2.5 mb-6">
          {CANDIDATE_PAGES.map((p) => {
            const isCurrent = p.step === step;
            const isCompleted = p.step < step;
            return (
              <button
                key={p.step}
                type="button"
                onClick={() => handleJumpToStep(p.step)}
                className={`p-3 rounded-xl border text-left rtl:text-right transition cursor-pointer ${
                  isCurrent
                    ? "bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-500 shadow-xs ring-1 ring-blue-100 dark:ring-blue-900/40"
                    : isCompleted
                    ? "bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {p.badge}
                  </span>
                  {isCompleted && (
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-3xs font-bold flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold truncate text-slate-900 dark:text-white">{p.title}</div>
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-6">
            {/* Page Header */}
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {currentPage.badge} — {currentPage.title}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {currentPage.title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal">{currentPage.subtitle}</p>
            </div>

            {/* ========================================================= */}
            {/* PAGE 1: PROFILE */}
            {/* ========================================================= */}
            {step === 1 && (
              <div className="space-y-7">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    {t("step1.personalHeader")}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextInput
                      label={t("step1.fullName")}
                      value={data.personal.fullName}
                      onChange={(v) => updatePersonal("fullName", v)}
                      placeholder={t("step1.fullNamePlaceholder")}
                      error={validationErrors.fullName}
                      required
                    />
                    <TextInput
                      label={t("step1.targetTitle")}
                      value={data.personal.targetTitle}
                      onChange={(v) => updatePersonal("targetTitle", v)}
                      placeholder={t("step1.targetTitlePlaceholder")}
                      error={validationErrors.targetTitle}
                      required
                    />
                    <TextInput
                      label={t("step1.email")}
                      type="email"
                      dir="ltr"
                      value={data.personal.email}
                      onChange={(v) => updatePersonal("email", v)}
                      placeholder={t("step1.emailPlaceholder")}
                      error={validationErrors.email}
                      required
                    />
                    <TextInput
                      label={t("step1.phone")}
                      type="tel"
                      dir="ltr"
                      value={data.personal.phone}
                      onChange={(v) => updatePersonal("phone", v)}
                      placeholder={t("step1.phonePlaceholder")}
                      error={validationErrors.phone}
                      required
                    />
                    <TextInput
                      label={t("step1.location")}
                      value={data.personal.location}
                      onChange={(v) => updatePersonal("location", v)}
                      placeholder={t("step1.locationPlaceholder")}
                    />
                    <TextInput
                      label={t("step1.linkedin")}
                      dir="ltr"
                      value={data.personal.linkedin}
                      onChange={(v) => updatePersonal("linkedin", v)}
                      placeholder={t("step1.linkedinPlaceholder")}
                    />
                    <TextInput
                      label={t("step1.portfolio")}
                      dir="ltr"
                      value={data.personal.portfolio}
                      onChange={(v) => updatePersonal("portfolio", v)}
                      placeholder={t("step1.portfolioPlaceholder")}
                      className="sm:col-span-2"
                    />
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="space-y-3 pt-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    {t("step1.summaryHeader")}
                  </h2>
                  <TextArea
                    label={t("step1.summary")}
                    value={data.personal.summary}
                    onChange={(v) => updatePersonal("summary", v)}
                    placeholder={t("step1.summaryPlaceholder")}
                    hint={t("step1.summaryHint")}
                    rows={4}
                  />
                </div>

                {/* INLINE REVIEW: Profile Review */}
                <InlineReviewSection
                  title={t("step1.reviewTitle")}
                  subtitle={t("step1.reviewSubtitle")}
                >
                  <div className="grid gap-3.5 sm:grid-cols-2 text-sm">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        {t("step1.fullName")}
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {data.personal.fullName || <span className="text-slate-400 dark:text-slate-500 font-normal italic">{t("action.notEntered")}</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        {t("step1.targetTitle")}
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {data.personal.targetTitle || <span className="text-slate-400 dark:text-slate-500 font-normal italic">{t("action.notEntered")}</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        {t("step1.email")}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 dir-ltr text-left rtl:text-right">
                        {data.personal.email || <span className="text-slate-400 dark:text-slate-500 italic">{t("action.notEntered")}</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        {t("step1.phone")}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 dir-ltr text-left rtl:text-right">
                        {data.personal.phone || <span className="text-slate-400 dark:text-slate-500 italic">{t("action.notEntered")}</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        {t("step1.location")}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {data.personal.location || <span className="text-slate-400 dark:text-slate-500 italic">{t("action.notEntered")}</span>}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        {t("step1.linkedin")} / {t("step1.portfolio")}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 dir-ltr truncate text-left rtl:text-right">
                        {[data.personal.linkedin, data.personal.portfolio].filter(Boolean).join("  •  ") || (
                          <span className="text-slate-400 dark:text-slate-500 italic">{t("step1.noLinks")}</span>
                        )}
                      </p>
                    </div>

                    <div className="sm:col-span-2 space-y-0.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        {t("step1.summary")}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                        {data.personal.summary || <span className="text-slate-400 dark:text-slate-500 italic">{t("step1.noSummary")}</span>}
                      </p>
                    </div>
                  </div>
                </InlineReviewSection>
              </div>
            )}

            {/* ========================================================= */}
            {/* PAGE 2: EDUCATION & EXPERIENCE */}
            {/* ========================================================= */}
            {step === 2 && (
              <div className="space-y-7">
                {/* Education */}
                <ExpandableRepeatableSection
                  title={t("edu.title")}
                  description={t("edu.description")}
                  sectionKey="education"
                  items={data.education}
                  expandedCards={expandedCards}
                  onToggleExpand={toggleExpandCard}
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
                  addButtonLabel={t("edu.add")}
                  emptyMessage={t("edu.noEntries")}
                  renderCollapsed={(item) => (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs sm:text-sm">
                      <div>
                        <strong className="text-slate-900 dark:text-white">
                          {item.degree} {item.fieldOfStudy ? `in ${item.fieldOfStudy}` : ""}
                        </strong>
                        {item.institution && <span className="text-slate-600 dark:text-slate-400"> — {item.institution}</span>}
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 dir-ltr">
                        {[item.startDate, item.endDate].filter(Boolean).join(" – ") || "—"}
                      </span>
                    </div>
                  )}
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
                      <SelectInput
                        label={t("edu.degree")}
                        value={item.degree}
                        options={DEGREE_OPTIONS}
                        onChange={(v) => updateArrayItem("education", idx, "degree", v)}
                      />
                      <SelectInput
                        label={t("edu.fieldOfStudy")}
                        value={item.fieldOfStudy}
                        options={STUDY_FIELDS}
                        onChange={(v) => updateArrayItem("education", idx, "fieldOfStudy", v)}
                      />
                      <TextInput
                        label={t("edu.institution")}
                        value={item.institution}
                        onChange={(v) => updateArrayItem("education", idx, "institution", v)}
                        placeholder={t("edu.institutionPlaceholder")}
                      />
                      <TextInput
                        label={t("edu.grade")}
                        value={item.grade}
                        onChange={(v) => updateArrayItem("education", idx, "grade", v)}
                        placeholder={t("edu.gradePlaceholder")}
                      />
                      <MonthYearPicker
                        label={t("edu.startDate")}
                        value={item.startDate}
                        onChange={(v) => updateArrayItem("education", idx, "startDate", v)}
                      />
                      <MonthYearPicker
                        label={t("edu.endDate")}
                        value={item.endDate}
                        onChange={(v) => updateArrayItem("education", idx, "endDate", v)}
                      />
                    </div>
                  )}
                />

                {/* Work Experience */}
                <ExpandableRepeatableSection
                  title={t("exp.title")}
                  description={t("exp.description")}
                  sectionKey="experience"
                  items={data.experience}
                  expandedCards={expandedCards}
                  onToggleExpand={toggleExpandCard}
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
                  addButtonLabel={t("exp.add")}
                  emptyMessage={t("exp.noEntries")}
                  renderCollapsed={(item) => (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs sm:text-sm">
                      <div>
                        <strong className="text-slate-900 dark:text-white">{item.jobTitle || "Role"}</strong>
                        {item.company && <span className="text-slate-600 dark:text-slate-400"> at {item.company}</span>}
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 dir-ltr">
                        {[item.startDate, item.current ? "Present" : item.endDate].filter(Boolean).join(" – ") || "—"}
                      </span>
                    </div>
                  )}
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
                      <TextInput
                        label={t("exp.jobTitle")}
                        value={item.jobTitle}
                        onChange={(v) => updateArrayItem("experience", idx, "jobTitle", v)}
                        placeholder={t("exp.jobTitlePlaceholder")}
                      />
                      <TextInput
                        label={t("exp.company")}
                        value={item.company}
                        onChange={(v) => updateArrayItem("experience", idx, "company", v)}
                        placeholder={t("exp.companyPlaceholder")}
                      />
                      <SelectInput
                        label={t("exp.employmentType")}
                        value={item.employmentType}
                        options={EMPLOYMENT_TYPES}
                        onChange={(v) => updateArrayItem("experience", idx, "employmentType", v)}
                      />
                      <TextInput
                        label={t("exp.location")}
                        value={item.location}
                        onChange={(v) => updateArrayItem("experience", idx, "location", v)}
                        placeholder={t("exp.locationPlaceholder")}
                      />
                      <MonthYearPicker
                        label={t("exp.startDate")}
                        value={item.startDate}
                        onChange={(v) => updateArrayItem("experience", idx, "startDate", v)}
                      />
                      {!item.current && (
                        <MonthYearPicker
                          label={t("exp.endDate")}
                          value={item.endDate}
                          onChange={(v) => updateArrayItem("experience", idx, "endDate", v)}
                        />
                      )}
                      <div className="sm:col-span-2 pt-0.5">
                        <CheckboxToggle
                          label={t("exp.current")}
                          checked={item.current}
                          onChange={(v) => updateArrayItem("experience", idx, "current", v)}
                        />
                      </div>
                      <TextArea
                        label={t("exp.responsibilities")}
                        value={item.responsibilities}
                        onChange={(v) => updateArrayItem("experience", idx, "responsibilities", v)}
                        placeholder={t("exp.responsibilitiesPlaceholder")}
                        rows={3}
                        className="sm:col-span-2"
                      />
                      <TextArea
                        label={t("exp.achievements")}
                        value={item.achievements}
                        onChange={(v) => updateArrayItem("experience", idx, "achievements", v)}
                        placeholder={t("exp.achievementsPlaceholder")}
                        rows={2}
                        className="sm:col-span-2"
                      />
                    </div>
                  )}
                />

                {/* Internships */}
                <ExpandableRepeatableSection
                  title={t("intern.title")}
                  description={t("intern.description")}
                  sectionKey="internships"
                  items={data.internships}
                  expandedCards={expandedCards}
                  onToggleExpand={toggleExpandCard}
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
                  addButtonLabel={t("intern.add")}
                  emptyMessage={t("intern.noEntries")}
                  renderCollapsed={(item) => (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs sm:text-sm">
                      <div>
                        <strong className="text-slate-900 dark:text-white">{item.title || "Internship"}</strong>
                        {item.company && <span className="text-slate-600 dark:text-slate-400"> — {item.company}</span>}
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 dir-ltr">
                        {[item.startDate, item.endDate].filter(Boolean).join(" – ") || "—"}
                      </span>
                    </div>
                  )}
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
                      <TextInput
                        label={t("intern.titleLabel")}
                        value={item.title}
                        onChange={(v) => updateArrayItem("internships", idx, "title", v)}
                        placeholder={t("intern.titlePlaceholder")}
                      />
                      <TextInput
                        label={t("intern.company")}
                        value={item.company}
                        onChange={(v) => updateArrayItem("internships", idx, "company", v)}
                        placeholder={t("intern.companyPlaceholder")}
                      />
                      <TextInput
                        label={t("intern.location")}
                        value={item.location}
                        onChange={(v) => updateArrayItem("internships", idx, "location", v)}
                        placeholder={t("intern.locationPlaceholder")}
                      />
                      <div className="hidden sm:block" />
                      <MonthYearPicker
                        label={t("intern.startDate")}
                        value={item.startDate}
                        onChange={(v) => updateArrayItem("internships", idx, "startDate", v)}
                      />
                      <MonthYearPicker
                        label={t("intern.endDate")}
                        value={item.endDate}
                        onChange={(v) => updateArrayItem("internships", idx, "endDate", v)}
                      />
                      <TextArea
                        label={t("intern.descriptionLabel")}
                        value={item.description}
                        onChange={(v) => updateArrayItem("internships", idx, "description", v)}
                        placeholder={t("intern.descriptionPlaceholder")}
                        rows={2}
                        className="sm:col-span-2"
                      />
                    </div>
                  )}
                />

                {/* INLINE REVIEW: Education & Experience Review */}
                <InlineReviewSection
                  title={t("step2.reviewTitle")}
                  subtitle={t("step2.reviewSubtitle")}
                >
                  <div className="space-y-4 text-sm">
                    {/* Education Summary */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        {t("edu.title")} ({data.education.length})
                      </span>
                      {data.education.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">{t("edu.noEntries")}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {data.education.map((e, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                              <strong className="text-slate-900 dark:text-white">{e.degree} in {e.fieldOfStudy || "General"}</strong>
                              {e.institution && <span className="text-slate-600 dark:text-slate-400"> — {e.institution}</span>}
                              {(e.startDate || e.endDate) && (
                                <span className="text-slate-400 dark:text-slate-500 ml-1 dir-ltr">
                                  ({[e.startDate, e.endDate].filter(Boolean).join(" – ")})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Experience Summary */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        {t("exp.title")} ({data.experience.length})
                      </span>
                      {data.experience.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">{t("exp.noEntries")}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {data.experience.map((exp, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                              <strong className="text-slate-900 dark:text-white">{exp.jobTitle || "Job Title"}</strong>
                              {exp.company && <span className="text-slate-600 dark:text-slate-400"> at {exp.company}</span>}
                              {(exp.startDate || exp.endDate || exp.current) && (
                                <span className="text-slate-400 dark:text-slate-500 ml-1 dir-ltr">
                                  ({[exp.startDate, exp.current ? "Present" : exp.endDate].filter(Boolean).join(" – ")})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Internships Summary */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        {t("intern.title")} ({data.internships.length})
                      </span>
                      {data.internships.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">{t("intern.noEntries")}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {data.internships.map((item, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                              <strong className="text-slate-900 dark:text-white">{item.title || "Internship"}</strong>
                              {item.company && <span className="text-slate-600 dark:text-slate-400"> — {item.company}</span>}
                              {(item.startDate || item.endDate) && (
                                <span className="text-slate-400 dark:text-slate-500 ml-1 dir-ltr">
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
            {/* PAGE 3: SKILLS & QUALIFICATIONS */}
            {/* ========================================================= */}
            {step === 3 && (
              <div className="space-y-7">
                {/* Skills Group */}
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    {t("skills.sectionHeader")}
                  </h2>
                  <div className="space-y-4">
                    <SkillManager
                      title={t("skills.technical")}
                      category="technical"
                      skills={data.skills.technical}
                      suggestions={TECH_SUGGESTIONS}
                      onAdd={addSkill}
                      onRemove={removeSkill}
                      placeholder={t("skills.searchPlaceholder")}
                      addLabel={t("skills.addBtn")}
                      activeLabel={t("skills.activeLabel")}
                      suggestionsLabel={t("skills.suggestionsLabel")}
                      countLabel={t("skills.selectedCount", { count: data.skills.technical.length })}
                      emptyHelper={t("skills.noSkillsSelected")}
                    />

                    <SkillManager
                      title={t("skills.tools")}
                      category="tools"
                      skills={data.skills.tools}
                      suggestions={TOOL_SUGGESTIONS}
                      onAdd={addSkill}
                      onRemove={removeSkill}
                      placeholder={t("skills.searchPlaceholder")}
                      addLabel={t("skills.addBtn")}
                      activeLabel={t("skills.activeLabel")}
                      suggestionsLabel={t("skills.suggestionsLabel")}
                      countLabel={t("skills.selectedCount", { count: data.skills.tools.length })}
                      emptyHelper={t("skills.noSkillsSelected")}
                    />

                    <SkillManager
                      title={t("skills.soft")}
                      category="soft"
                      skills={data.skills.soft}
                      suggestions={SOFT_SUGGESTIONS}
                      onAdd={addSkill}
                      onRemove={removeSkill}
                      placeholder={t("skills.searchPlaceholder")}
                      addLabel={t("skills.addBtn")}
                      activeLabel={t("skills.activeLabel")}
                      suggestionsLabel={t("skills.suggestionsLabel")}
                      countLabel={t("skills.selectedCount", { count: data.skills.soft.length })}
                      emptyHelper={t("skills.noSkillsSelected")}
                    />
                  </div>
                </div>

                {/* Languages */}
                <ExpandableRepeatableSection
                  title={t("langSec.title")}
                  description={t("langSec.description")}
                  sectionKey="languages"
                  items={data.languages}
                  expandedCards={expandedCards}
                  onToggleExpand={toggleExpandCard}
                  onAdd={() =>
                    addArrayItem("languages", {
                      language: "",
                      level: "Fluent / Professional",
                    })
                  }
                  onRemove={(i) => removeArrayItem("languages", i)}
                  addButtonLabel={t("langSec.add")}
                  emptyMessage={t("langSec.noEntries")}
                  renderCollapsed={(item) => (
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <strong className="text-slate-900 dark:text-white">{item.language || "Language"}</strong>
                      <span className="text-slate-500 dark:text-slate-400">{item.level}</span>
                    </div>
                  )}
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
                      <TextInput
                        label={t("langSec.language")}
                        value={item.language}
                        onChange={(v) => updateArrayItem("languages", idx, "language", v)}
                        placeholder={t("langSec.languagePlaceholder")}
                      />
                      <SelectInput
                        label={t("langSec.level")}
                        value={item.level}
                        options={LANGUAGE_LEVELS}
                        onChange={(v) => updateArrayItem("languages", idx, "level", v)}
                      />
                    </div>
                  )}
                />

                {/* Courses & Training */}
                <ExpandableRepeatableSection
                  title={t("courses.title")}
                  description={t("courses.description")}
                  sectionKey="courses"
                  items={data.courses}
                  expandedCards={expandedCards}
                  onToggleExpand={toggleExpandCard}
                  onAdd={() =>
                    addArrayItem("courses", {
                      name: "",
                      provider: "",
                      date: "",
                      certificateId: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("courses", i)}
                  addButtonLabel={t("courses.add")}
                  emptyMessage={t("courses.noEntries")}
                  renderCollapsed={(item) => (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs sm:text-sm">
                      <div>
                        <strong className="text-slate-900 dark:text-white">{item.name || "Course"}</strong>
                        {item.provider && <span className="text-slate-600 dark:text-slate-400"> — {item.provider}</span>}
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 dir-ltr">{item.date || "—"}</span>
                    </div>
                  )}
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
                      <TextInput
                        label={t("courses.name")}
                        value={item.name}
                        onChange={(v) => updateArrayItem("courses", idx, "name", v)}
                        placeholder={t("courses.namePlaceholder")}
                      />
                      <TextInput
                        label={t("courses.provider")}
                        value={item.provider}
                        onChange={(v) => updateArrayItem("courses", idx, "provider", v)}
                        placeholder={t("courses.providerPlaceholder")}
                      />
                      <MonthYearPicker
                        label={t("courses.date")}
                        value={item.date}
                        onChange={(v) => updateArrayItem("courses", idx, "date", v)}
                      />
                      <TextInput
                        label={t("courses.certId")}
                        dir="ltr"
                        value={item.certificateId}
                        onChange={(v) => updateArrayItem("courses", idx, "certificateId", v)}
                        placeholder={t("courses.certIdPlaceholder")}
                      />
                    </div>
                  )}
                />

                {/* Certifications */}
                <ExpandableRepeatableSection
                  title={t("certs.title")}
                  description={t("certs.description")}
                  sectionKey="accreditations"
                  items={data.accreditations}
                  expandedCards={expandedCards}
                  onToggleExpand={toggleExpandCard}
                  onAdd={() =>
                    addArrayItem("accreditations", {
                      name: "",
                      issuer: "",
                      date: "",
                      credentialId: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("accreditations", i)}
                  addButtonLabel={t("certs.add")}
                  emptyMessage={t("certs.noEntries")}
                  renderCollapsed={(item) => (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs sm:text-sm">
                      <div>
                        <strong className="text-slate-900 dark:text-white">{item.name || "Certification"}</strong>
                        {item.issuer && <span className="text-slate-600 dark:text-slate-400"> — {item.issuer}</span>}
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 dir-ltr">{item.date || "—"}</span>
                    </div>
                  )}
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
                      <TextInput
                        label={t("certs.name")}
                        value={item.name}
                        onChange={(v) => updateArrayItem("accreditations", idx, "name", v)}
                        placeholder={t("certs.namePlaceholder")}
                      />
                      <TextInput
                        label={t("certs.issuer")}
                        value={item.issuer}
                        onChange={(v) => updateArrayItem("accreditations", idx, "issuer", v)}
                        placeholder={t("certs.issuerPlaceholder")}
                      />
                      <MonthYearPicker
                        label={t("certs.date")}
                        value={item.date}
                        onChange={(v) => updateArrayItem("accreditations", idx, "date", v)}
                      />
                      <TextInput
                        label={t("certs.credentialId")}
                        dir="ltr"
                        value={item.credentialId}
                        onChange={(v) => updateArrayItem("accreditations", idx, "credentialId", v)}
                        placeholder={t("certs.credentialIdPlaceholder")}
                      />
                    </div>
                  )}
                />

                {/* Achievements */}
                <ExpandableRepeatableSection
                  title={t("achieve.title")}
                  description={t("achieve.description")}
                  sectionKey="achievements"
                  items={data.achievements}
                  expandedCards={expandedCards}
                  onToggleExpand={toggleExpandCard}
                  onAdd={() =>
                    addArrayItem("achievements", {
                      title: "",
                      date: "",
                      description: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("achievements", i)}
                  addButtonLabel={t("achieve.add")}
                  emptyMessage={t("achieve.noEntries")}
                  renderCollapsed={(item) => (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs sm:text-sm">
                      <strong className="text-slate-900 dark:text-white">{item.title || "Achievement"}</strong>
                      <span className="text-slate-400 dark:text-slate-500 dir-ltr">{item.date || "—"}</span>
                    </div>
                  )}
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
                      <TextInput
                        label={t("achieve.titleLabel")}
                        value={item.title}
                        onChange={(v) => updateArrayItem("achievements", idx, "title", v)}
                        placeholder={t("achieve.titlePlaceholder")}
                      />
                      <MonthYearPicker
                        label={t("achieve.date")}
                        value={item.date}
                        onChange={(v) => updateArrayItem("achievements", idx, "date", v)}
                      />
                      <TextArea
                        label={t("achieve.descriptionLabel")}
                        value={item.description}
                        onChange={(v) => updateArrayItem("achievements", idx, "description", v)}
                        placeholder={t("achieve.descriptionPlaceholder")}
                        rows={2}
                        className="sm:col-span-2"
                      />
                    </div>
                  )}
                />

                {/* INLINE REVIEW: Skills & Qualifications Review */}
                <InlineReviewSection
                  title={t("step3.reviewTitle")}
                  subtitle={t("step3.reviewSubtitle")}
                >
                  <div className="space-y-4 text-sm">
                    {/* Skills Summary */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        {t("skills.sectionHeader")}
                      </span>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                          <span className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase block">
                            {t("skills.technical")}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {data.skills.technical.length === 0 ? (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic">None</span>
                            ) : (
                              data.skills.technical.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-medium border border-blue-100 dark:border-blue-800/60 dir-ltr">
                                  {s}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                          <span className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase block">
                            {t("skills.tools")}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {data.skills.tools.length === 0 ? (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic">None</span>
                            ) : (
                              data.skills.tools.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-600 dir-ltr">
                                  {s}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                          <span className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase block">
                            {t("skills.soft")}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {data.skills.soft.length === 0 ? (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic">None</span>
                            ) : (
                              data.skills.soft.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-100 dark:border-emerald-800/60">
                                  {s}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        {t("langSec.title")}
                      </span>
                      {data.languages.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">{t("langSec.noEntries")}</p>
                      ) : (
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                          {data.languages.map((l) => `${l.language || "Language"} (${l.level || "Fluent"})`).join("  •  ")}
                        </p>
                      )}
                    </div>

                    {/* Certifications & Courses */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        {t("certs.title")} & {t("courses.title")}
                      </span>
                      {[...data.accreditations, ...data.courses].length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">{t("certs.noEntries")}</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {data.accreditations.map((acc, i) => (
                            <span key={`acc-${i}`} className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                              <strong>{acc.name}</strong> {acc.issuer && `— ${acc.issuer}`}
                            </span>
                          ))}
                          {data.courses.map((c, i) => (
                            <span key={`c-${i}`} className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
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
                {/* Projects */}
                <ExpandableRepeatableSection
                  title={t("proj.title")}
                  description={t("proj.description")}
                  sectionKey="projects"
                  items={data.projects}
                  expandedCards={expandedCards}
                  onToggleExpand={toggleExpandCard}
                  onAdd={() =>
                    addArrayItem("projects", {
                      name: "",
                      technologies: "",
                      link: "",
                      description: "",
                    })
                  }
                  onRemove={(i) => removeArrayItem("projects", i)}
                  addButtonLabel={t("proj.add")}
                  emptyMessage={t("proj.noEntries")}
                  renderCollapsed={(item) => (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs sm:text-sm">
                      <div>
                        <strong className="text-slate-900 dark:text-white">{item.name || "Project"}</strong>
                        {item.technologies && (
                          <span className="text-slate-500 dark:text-slate-400 dir-ltr font-normal ml-1">
                            ({item.technologies})
                          </span>
                        )}
                      </div>
                      {item.link && <span className="text-blue-600 dark:text-blue-400 dir-ltr text-xs truncate">{item.link}</span>}
                    </div>
                  )}
                  renderItem={(item, idx) => (
                    <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
                      <TextInput
                        label={t("proj.name")}
                        value={item.name}
                        onChange={(v) => updateArrayItem("projects", idx, "name", v)}
                        placeholder={t("proj.namePlaceholder")}
                      />
                      <TextInput
                        label={t("proj.technologies")}
                        dir="ltr"
                        value={item.technologies}
                        onChange={(v) => updateArrayItem("projects", idx, "technologies", v)}
                        placeholder={t("proj.technologiesPlaceholder")}
                      />
                      <TextInput
                        label={t("proj.link")}
                        dir="ltr"
                        value={item.link}
                        onChange={(v) => updateArrayItem("projects", idx, "link", v)}
                        placeholder={t("proj.linkPlaceholder")}
                        className="sm:col-span-2"
                      />
                      <TextArea
                        label={t("proj.descriptionLabel")}
                        value={item.description}
                        onChange={(v) => updateArrayItem("projects", idx, "description", v)}
                        placeholder={t("proj.descriptionPlaceholder")}
                        rows={3}
                        className="sm:col-span-2"
                      />
                    </div>
                  )}
                />

                {/* Comprehensive 11-Section Final Review */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {t("step4.finalReviewTitle")}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("step4.finalReviewSubtitle")}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {/* 1. Personal Info */}
                    <ReviewCard title={t("rev.personal")} onEdit={() => handleJumpToStep(1)} editLabel={t("action.edit")}>
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-2xs uppercase font-bold text-slate-400 dark:text-slate-500 block">{t("step1.fullName")}</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{data.personal.fullName || "—"}</span>
                        </div>
                        <div>
                          <span className="text-2xs uppercase font-bold text-slate-400 dark:text-slate-500 block">{t("step1.targetTitle")}</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{data.personal.targetTitle || "—"}</span>
                        </div>
                        <div>
                          <span className="text-2xs uppercase font-bold text-slate-400 dark:text-slate-500 block">{t("step1.email")}</span>
                          <span className="text-slate-700 dark:text-slate-300 dir-ltr text-left rtl:text-right">{data.personal.email || "—"}</span>
                        </div>
                        <div>
                          <span className="text-2xs uppercase font-bold text-slate-400 dark:text-slate-500 block">{t("step1.phone")}</span>
                          <span className="text-slate-700 dark:text-slate-300 dir-ltr text-left rtl:text-right">{data.personal.phone || "—"}</span>
                        </div>
                      </div>
                    </ReviewCard>

                    {/* 2. Summary */}
                    <ReviewCard title={t("rev.summary")} onEdit={() => handleJumpToStep(1)} editLabel={t("action.edit")}>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {data.personal.summary || <span className="italic text-slate-400 dark:text-slate-500">{t("step1.noSummary")}</span>}
                      </p>
                    </ReviewCard>

                    {/* 3. Education */}
                    <ReviewCard title={t("rev.education")} onEdit={() => handleJumpToStep(2)} editLabel={t("action.edit")}>
                      {data.education.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t("edu.noEntries")}</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.education.map((e, i) => (
                            <div key={i}>
                              <strong className="text-slate-900 dark:text-white">{e.degree} in {e.fieldOfStudy || "General"}</strong> — {e.institution} <span className="dir-ltr">({e.startDate} – {e.endDate})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* 4. Experience */}
                    <ReviewCard title={t("rev.experience")} onEdit={() => handleJumpToStep(2)} editLabel={t("action.edit")}>
                      {data.experience.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t("exp.noEntries")}</span>
                      ) : (
                        <div className="space-y-1.5 text-xs sm:text-sm">
                          {data.experience.map((exp, i) => (
                            <div key={i}>
                              <strong className="text-slate-900 dark:text-white">{exp.jobTitle} at {exp.company}</strong> <span className="dir-ltr">({exp.startDate} – {exp.current ? "Present" : exp.endDate})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* 5. Internships */}
                    <ReviewCard title={t("rev.internships")} onEdit={() => handleJumpToStep(2)} editLabel={t("action.edit")}>
                      {data.internships.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t("intern.noEntries")}</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.internships.map((item, i) => (
                            <div key={i}>
                              <strong className="text-slate-900 dark:text-white">{item.title} at {item.company}</strong> <span className="dir-ltr">({item.startDate} – {item.endDate})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* 6. Skills */}
                    <ReviewCard title={t("rev.skills")} onEdit={() => handleJumpToStep(3)} editLabel={t("action.edit")}>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          ...data.skills.technical,
                          ...data.skills.tools,
                          ...data.skills.soft,
                        ].length === 0 ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">None added</span>
                        ) : (
                          [
                            ...data.skills.technical,
                            ...data.skills.tools,
                            ...data.skills.soft,
                          ].map((s, i) => (
                            <span key={i} className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 dir-ltr">
                              {s}
                            </span>
                          ))
                        )}
                      </div>
                    </ReviewCard>

                    {/* 7. Languages */}
                    <ReviewCard title={t("rev.languages")} onEdit={() => handleJumpToStep(3)} editLabel={t("action.edit")}>
                      {data.languages.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t("langSec.noEntries")}</span>
                      ) : (
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                          {data.languages.map((l) => `${l.language} (${l.level})`).join("  •  ")}
                        </div>
                      )}
                    </ReviewCard>

                    {/* 8. Courses */}
                    <ReviewCard title={t("rev.courses")} onEdit={() => handleJumpToStep(3)} editLabel={t("action.edit")}>
                      {data.courses.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t("courses.noEntries")}</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.courses.map((c, i) => (
                            <div key={i}>{c.name} — {c.provider} <span className="dir-ltr">({c.date})</span></div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* 9. Certifications */}
                    <ReviewCard title={t("rev.certs")} onEdit={() => handleJumpToStep(3)} editLabel={t("action.edit")}>
                      {data.accreditations.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t("certs.noEntries")}</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.accreditations.map((acc, i) => (
                            <div key={i}><strong>{acc.name}</strong> — {acc.issuer} <span className="dir-ltr">({acc.date})</span></div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* 10. Achievements */}
                    <ReviewCard title={t("rev.achievements")} onEdit={() => handleJumpToStep(3)} editLabel={t("action.edit")}>
                      {data.achievements.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t("achieve.noEntries")}</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.achievements.map((a, i) => (
                            <div key={i}><strong>{a.title}</strong> <span className="dir-ltr">({a.date})</span></div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>

                    {/* 11. Projects */}
                    <ReviewCard title={t("rev.projects")} onEdit={() => handleJumpToStep(4)} editLabel={t("action.edit")}>
                      {data.projects.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t("proj.noEntries")}</span>
                      ) : (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {data.projects.map((p, i) => (
                            <div key={i}><strong>{p.name}</strong> <span className="dir-ltr">({p.technologies})</span></div>
                          ))}
                        </div>
                      )}
                    </ReviewCard>
                  </div>
                </div>
              </div>
            )}

            {/* 3. BOTTOM WORKSPACE NAVIGATION */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handlePrevStep}
                  disabled={submitting}
                >
                  {dir === "rtl" ? "→" : "←"} {t("action.back")}
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextStep}
                >
                  {t("action.continue")} {dir === "rtl" ? "←" : "→"}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={submitting}
                >
                  {submitting ? t("action.submitting") : t("action.submit")}
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function ExpandableRepeatableSection({
  title,
  description,
  sectionKey,
  items,
  expandedCards,
  onToggleExpand,
  onAdd,
  onRemove,
  addButtonLabel,
  emptyMessage,
  renderCollapsed,
  renderItem,
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onAdd}>
          + {addButtonLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-5 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
          <Button variant="secondary" size="sm" onClick={onAdd}>
            + {addButtonLabel}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const cardKey = `${sectionKey}-${idx}`;
            const isExpanded = Boolean(expandedCards[cardKey]);

            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 p-4 space-y-3 shadow-2xs transition-all duration-150"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      {title} #{idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleExpand(cardKey)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isExpanded ? t("action.collapse") : t("action.expand")}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition cursor-pointer"
                    >
                      {t("action.remove")}
                    </button>
                  </div>
                </div>

                {/* Collapsed Summary vs Expanded Editor */}
                {isExpanded ? (
                  renderItem(item, idx)
                ) : (
                  renderCollapsed(item)
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SkillManager({
  title,
  category,
  skills = [],
  suggestions = [],
  onAdd,
  onRemove,
  placeholder,
  addLabel,
  activeLabel,
  suggestionsLabel,
  countLabel,
  emptyHelper,
}) {
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    onAdd(category, draft);
    setDraft("");
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        <span className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {countLabel}
        </span>
      </div>

      {/* Active Skills Block */}
      <div className="min-h-[42px] p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
        <span className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {activeLabel}
        </span>
        {skills.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic">{emptyHelper}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs dir-ltr"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => onRemove(category, s)}
                  className="text-blue-400 hover:text-rose-600 dark:hover:text-rose-400 font-bold leading-none cursor-pointer text-sm"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
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
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 shadow-2xs"
        />
        <Button variant="secondary" size="md" onClick={handleAdd} disabled={!draft.trim()}>
          {addLabel}
        </Button>
      </div>

      {/* Quick Secondary Suggestions */}
      <div className="space-y-1.5 pt-1">
        <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
          {suggestionsLabel}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s, idx) => {
            const isSelected = skills.some((sk) => sk.toLowerCase() === s.toLowerCase());
            return (
              <button
                key={idx}
                type="button"
                onClick={() => (isSelected ? onRemove(category, s) : onAdd(category, s))}
                className={`px-2.5 py-1 rounded-full text-xs transition cursor-pointer dir-ltr ${
                  isSelected
                    ? "bg-blue-600 text-white font-semibold shadow-2xs border border-blue-600"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
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
  const { t } = useLanguage();

  return (
    <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/80">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <span className="text-2xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          {t("action.livePreview")}
        </span>
      </div>
      {children}
    </div>
  );
}

function ReviewCard({ title, onEdit, editLabel, children }) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-2xs">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          {editLabel}
        </button>
      </div>
      {children}
    </div>
  );
}
