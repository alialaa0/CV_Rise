import { useState } from "react";
import { createSubmission } from "./services/submissionService";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCVReview from "./pages/AdminCVReview";

const initialData = {
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

const months = [
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

const years = Array.from(
  { length: 50 },
  (_, i) => new Date().getFullYear() - i
);

const degreeOptions = [
  "High School",
  "Diploma",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Professional Certification",
  "Other",
];

const studyFields = [
  "Accounting",
  "Finance",
  "Marketing",
  "Business Administration",
  "Management",
  "Economics",
  "Computer Science",
  "Information Systems",
  "Engineering",
  "Medicine",
  "Law",
  "Other",
];

const employmentTypes = [
  "Full-time",
  "Part-time",
  "Internship",
  "Freelance",
  "Contract",
  "Temporary",
];

const languageLevels = [
  "Basic",
  "Elementary",
  "Intermediate",
  "Upper-Intermediate",
  "Advanced",
  "Fluent",
  "Native",
];

const technicalSuggestions = [
  "SQL",
  "Python",
  "Java",
  "JavaScript",
  "TypeScript",
  "C++",
  "C#",
  "R",
  "HTML",
  "CSS",
  "PHP",
];

const toolSuggestions = [
  "Excel",
  "Power BI",
  "Tableau",
  "Git",
  "GitHub",
  "Docker",
  "AWS",
  "Azure",
  "Google Cloud",
  "Figma",
];

const softSuggestions = [
  "Communication",
  "Leadership",
  "Teamwork",
  "Problem Solving",
  "Time Management",
  "Critical Thinking",
  "Adaptability",
  "Creativity",
];

const TOTAL_STEPS = 11;

function App() {
  const [data, setData] = useState(initialData);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  // =========================
  // ADMIN ROUTING
  // =========================

  const params = new URLSearchParams(
    window.location.search
  );

  const isAdmin =
    params.get("admin") === "true";

  const submissionId =
    params.get("submission");

  if (isAdmin && submissionId) {
    return (
      <AdminCVReview
        submissionId={submissionId}
        onBack={() => {
          window.location.href =
            "?admin=true";
        }}
      />
    );
  }

  if (isAdmin) {
    return (
      <AdminDashboard
        onOpenSubmission={(id) => {
          window.location.href =
            `?admin=true&submission=${id}`;
        }}
      />
    );
  }

  /* =========================
     PERSONAL
  ========================= */

  const updatePersonal = (field, value) => {
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value,
      },
    }));
  };

  /* =========================
     GENERIC ARRAY UPDATE
  ========================= */

  const updateArrayItem = (
    section,
    index,
    field,
    value
  ) => {
    setData((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const removeArrayItem = (section, index) => {
    setData((prev) => ({
      ...prev,
      [section]: prev[section].filter(
        (_, i) => i !== index
      ),
    }));
  };

  /* =========================
     ADD FUNCTIONS
  ========================= */

  const addEducation = () => {
    setData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: "",
          institution: "",
          fieldOfStudy: "",
          startDate: "",
          endDate: "",
          grade: "",
        },
      ],
    }));
  };

  const addExperience = () => {
    setData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          jobTitle: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          employmentType: "",
          responsibilities: "",
          achievements: "",
        },
      ],
    }));
  };

  const addInternship = () => {
    setData((prev) => ({
      ...prev,
      internships: [
        ...prev.internships,
        {
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ],
    }));
  };

  const addCourse = () => {
    setData((prev) => ({
      ...prev,
      courses: [
        ...prev.courses,
        {
          name: "",
          provider: "",
          date: "",
          certificateId: "",
        },
      ],
    }));
  };

  const addLanguage = () => {
    setData((prev) => ({
      ...prev,
      languages: [
        ...prev.languages,
        {
          language: "",
          level: "",
        },
      ],
    }));
  };

  const addAchievement = () => {
    setData((prev) => ({
      ...prev,
      achievements: [
        ...prev.achievements,
        {
          title: "",
          description: "",
          date: "",
        },
      ],
    }));
  };

  const addProject = () => {
    setData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          name: "",
          description: "",
          technologies: "",
          link: "",
        },
      ],
    }));
  };

  const addAccreditation = () => {
    setData((prev) => ({
      ...prev,
      accreditations: [
        ...prev.accreditations,
        {
          name: "",
          issuer: "",
          date: "",
          credentialId: "",
        },
      ],
    }));
  };

  /* =========================
     SKILLS
  ========================= */

  const addSkill = (category, skill) => {
    const cleanSkill = skill.trim();

    if (!cleanSkill) return;

    if (data.skills[category].includes(cleanSkill)) {
      return;
    }

    setData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [
          ...prev.skills[category],
          cleanSkill,
        ],
      },
    }));
  };

  const removeSkill = (category, skill) => {
    setData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter(
          (item) => item !== skill
        ),
      },
    }));
  };

  /* =========================
     NAVIGATION
  ========================= */

  const nextStep = () => {
    setStep((prev) =>
      Math.min(prev + 1, TOTAL_STEPS)
    );
  };

  const previousStep = () => {
    setStep((prev) =>
      Math.max(prev - 1, 1)
    );
  };

  const goToStep = (targetStep) => {
    setStep(targetStep);
  };

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    console.log("Submitting CV...");

    const submissionId = await createSubmission(data);

    console.log(
      "SUBMISSION CREATED:",
      submissionId
    );

    console.log(
      "CV DATA:",
      JSON.stringify(data, null, 2)
    );

    setSubmitted(true);

  } catch (error) {
    console.error(
      "SUBMISSION ERROR:",
      error
    );

    alert(
      "Something went wrong. Check the browser console."
    );
  }
 };

  /* =========================
     SUCCESS
  ========================= */

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">

        <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg p-10 text-center">

          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600 text-3xl">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Thank You!
          </h1>

          <p className="mt-3 text-slate-600">
            Your CV information has been
            submitted successfully.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <header className="mb-8">

          <div className="flex justify-between items-center">

            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                CV RISE
              </h1>

              <p className="mt-2 text-slate-600">
                Build your professional CV
              </p>
            </div>

            <span className="text-sm text-slate-500">
              Step {step} of {TOTAL_STEPS}
            </span>

          </div>

          {/* PROGRESS */}

          <div className="mt-6 h-2 bg-slate-200 rounded-full overflow-hidden">

            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${
                  (step / TOTAL_STEPS) * 100
                }%`,
              }}
            />

          </div>

        </header>

        <form onSubmit={handleSubmit}>

          {/* ================= STEP 1 ================= */}

          {step === 1 && (
            <Card>

              <SectionTitle>
                Personal Information
              </SectionTitle>

              <p className="text-slate-500 mt-2 mb-6">
                Tell us the basic information
                that should appear on your CV.
              </p>

              <div className="grid md:grid-cols-2 gap-5">

                <Input
                  label="Full Name"
                  required
                  value={data.personal.fullName}
                  onChange={(value) =>
                    updatePersonal(
                      "fullName",
                      value
                    )
                  }
                />

                <Input
                  label="Email"
                  type="email"
                  required
                  value={data.personal.email}
                  onChange={(value) =>
                    updatePersonal(
                      "email",
                      value
                    )
                  }
                />

                <Input
                  label="Phone"
                  required
                  value={data.personal.phone}
                  onChange={(value) =>
                    updatePersonal(
                      "phone",
                      value
                    )
                  }
                />

                <Input
                  label="Location"
                  placeholder="Cairo, Egypt"
                  value={data.personal.location}
                  onChange={(value) =>
                    updatePersonal(
                      "location",
                      value
                    )
                  }
                />

                <Input
                  label="Target Job Title"
                  placeholder="Data Analyst"
                  value={data.personal.targetTitle}
                  onChange={(value) =>
                    updatePersonal(
                      "targetTitle",
                      value
                    )
                  }
                />

                <Input
                  label="LinkedIn"
                  placeholder="LinkedIn URL"
                  value={data.personal.linkedin}
                  onChange={(value) =>
                    updatePersonal(
                      "linkedin",
                      value
                    )
                  }
                />

                <Input
                  label="Portfolio"
                  placeholder="Portfolio URL"
                  value={data.personal.portfolio}
                  onChange={(value) =>
                    updatePersonal(
                      "portfolio",
                      value
                    )
                  }
                />

              </div>

              <div className="mt-6">

                <TextArea
                  label="Professional Summary"
                  placeholder="Briefly describe your professional background and career goals."
                  value={data.personal.summary}
                  onChange={(value) =>
                    updatePersonal(
                      "summary",
                      value
                    )
                  }
                />

              </div>

              <Navigation
                onNext={nextStep}
                showBack={false}
              />

            </Card>
          )}

          {/* ================= STEP 2 ================= */}

          {step === 2 && (
            <EducationStep
              data={data}
              addEducation={addEducation}
              updateItem={updateArrayItem}
              removeItem={removeArrayItem}
              onBack={previousStep}
              onNext={nextStep}
            />
          )}

          {/* ================= STEP 3 ================= */}

          {step === 3 && (
            <ExperienceStep
              data={data}
              addExperience={addExperience}
              updateItem={updateArrayItem}
              removeItem={removeArrayItem}
              onBack={previousStep}
              onNext={nextStep}
            />
          )}

          {/* ================= STEP 4 ================= */}

          {step === 4 && (
            <InternshipStep
              data={data}
              addInternship={addInternship}
              updateItem={updateArrayItem}
              removeItem={removeArrayItem}
              onBack={previousStep}
              onNext={nextStep}
            />
          )}

          {/* ================= STEP 5 ================= */}

          {step === 5 && (
            <CoursesStep
              data={data}
              addCourse={addCourse}
              updateItem={updateArrayItem}
              removeItem={removeArrayItem}
              onBack={previousStep}
              onNext={nextStep}
            />
          )}

          {/* ================= STEP 6 ================= */}

          {step === 6 && (
            <SkillsStep
              data={data}
              addSkill={addSkill}
              removeSkill={removeSkill}
              onBack={previousStep}
              onNext={nextStep}
            />
          )}

          {/* ================= STEP 7 ================= */}

          {step === 7 && (
            <LanguagesStep
              data={data}
              addLanguage={addLanguage}
              updateItem={updateArrayItem}
              removeItem={removeArrayItem}
              onBack={previousStep}
              onNext={nextStep}
            />
          )}

          {/* ================= STEP 8 ================= */}

          {step === 8 && (
            <AchievementsStep
              data={data}
              addAchievement={addAchievement}
              updateItem={updateArrayItem}
              removeItem={removeArrayItem}
              onBack={previousStep}
              onNext={nextStep}
            />
          )}

          {/* ================= STEP 9 ================= */}

          {step === 9 && (
            <ProjectsStep
              data={data}
              addProject={addProject}
              updateItem={updateArrayItem}
              removeItem={removeArrayItem}
              onBack={previousStep}
              onNext={nextStep}
            />
          )}

          {/* ================= STEP 10 ================= */}

          {step === 10 && (
            <AccreditationsStep
              data={data}
              addAccreditation={addAccreditation}
              updateItem={updateArrayItem}
              removeItem={removeArrayItem}
              onBack={previousStep}
              onNext={nextStep}
            />
          )}

          {/* ================= STEP 11 ================= */}

          {step === 11 && (
            <ReviewStep
              data={data}
              goToStep={goToStep}
              onBack={previousStep}
            />
          )}

        </form>

      </div>

    </div>
  );
}

/* =========================================================
   EDUCATION
========================================================= */

function EducationStep({
  data,
  addEducation,
  updateItem,
  removeItem,
  onBack,
  onNext,
}) {
  return (
    <Card>

      <HeaderWithAdd
        title="Education"
        description="Add your most relevant educational qualifications."
        button="Add Education"
        onClick={addEducation}
      />

      {data.education.length === 0 ? (
        <EmptyState
          title="No education added"
          description="Add your degree, diploma, or other relevant qualification."
          buttonText="Add Education"
          onClick={addEducation}
        />
      ) : (
        <div className="space-y-6">

          {data.education.map((item, index) => (

            <ItemCard
              key={index}
              title={`Education #${index + 1}`}
              onRemove={() =>
                removeItem("education", index)
              }
            >

              <div className="grid md:grid-cols-2 gap-5">

                <Select
                  label="Degree"
                  value={item.degree}
                  options={degreeOptions}
                  placeholder="Select degree"
                  onChange={(value) =>
                    updateItem(
                      "education",
                      index,
                      "degree",
                      value
                    )
                  }
                />

                <Select
                  label="Field of Study"
                  value={item.fieldOfStudy}
                  options={studyFields}
                  placeholder="Select field"
                  onChange={(value) =>
                    updateItem(
                      "education",
                      index,
                      "fieldOfStudy",
                      value
                    )
                  }
                />

                <Input
                  label="University / Institution"
                  value={item.institution}
                  onChange={(value) =>
                    updateItem(
                      "education",
                      index,
                      "institution",
                      value
                    )
                  }
                />

                <Input
                  label="Grade / GPA"
                  placeholder="Optional"
                  value={item.grade}
                  onChange={(value) =>
                    updateItem(
                      "education",
                      index,
                      "grade",
                      value
                    )
                  }
                />

                <MonthYear
                  label="Start Date"
                  value={item.startDate}
                  onChange={(value) =>
                    updateItem(
                      "education",
                      index,
                      "startDate",
                      value
                    )
                  }
                />

                <MonthYear
                  label="End Date"
                  value={item.endDate}
                  onChange={(value) =>
                    updateItem(
                      "education",
                      index,
                      "endDate",
                      value
                    )
                  }
                />

              </div>

            </ItemCard>

          ))}

        </div>
      )}

      <Navigation
        onBack={onBack}
        onNext={onNext}
      />

    </Card>
  );
}

/* =========================================================
   EXPERIENCE
========================================================= */

function ExperienceStep({
  data,
  addExperience,
  updateItem,
  removeItem,
  onBack,
  onNext,
}) {
  return (
    <Card>

      <HeaderWithAdd
        title="Work Experience"
        description="Add your professional work experience."
        button="Add Experience"
        onClick={addExperience}
      />

      {data.experience.length === 0 ? (
        <EmptyState
          title="No work experience"
          description="If you don't have work experience yet, you can continue."
          buttonText="Add Experience"
          onClick={addExperience}
        />
      ) : (
        <div className="space-y-6">

          {data.experience.map((item, index) => (

            <ItemCard
              key={index}
              title={`Experience #${index + 1}`}
              onRemove={() =>
                removeItem("experience", index)
              }
            >

              <div className="grid md:grid-cols-2 gap-5">

                <Input
                  label="Job Title"
                  placeholder="Data Analyst"
                  value={item.jobTitle}
                  onChange={(value) =>
                    updateItem(
                      "experience",
                      index,
                      "jobTitle",
                      value
                    )
                  }
                />

                <Select
                  label="Employment Type"
                  value={item.employmentType}
                  options={employmentTypes}
                  placeholder="Select employment type"
                  onChange={(value) =>
                    updateItem(
                      "experience",
                      index,
                      "employmentType",
                      value
                    )
                  }
                />

                <Input
                  label="Company"
                  value={item.company}
                  onChange={(value) =>
                    updateItem(
                      "experience",
                      index,
                      "company",
                      value
                    )
                  }
                />

                <Input
                  label="Location"
                  placeholder="Cairo, Egypt"
                  value={item.location}
                  onChange={(value) =>
                    updateItem(
                      "experience",
                      index,
                      "location",
                      value
                    )
                  }
                />

                <MonthYear
                  label="Start Date"
                  value={item.startDate}
                  onChange={(value) =>
                    updateItem(
                      "experience",
                      index,
                      "startDate",
                      value
                    )
                  }
                />

                {!item.current && (
                  <MonthYear
                    label="End Date"
                    value={item.endDate}
                    onChange={(value) =>
                      updateItem(
                        "experience",
                        index,
                        "endDate",
                        value
                      )
                    }
                  />
                )}

              </div>

              <div className="mt-6">

                <Toggle
                  label="I currently work here"
                  checked={item.current}
                  onChange={(value) =>
                    updateItem(
                      "experience",
                      index,
                      "current",
                      value
                    )
                  }
                />

              </div>

              <div className="mt-6">

                <TextArea
                  label="Responsibilities"
                  placeholder="Describe your main responsibilities..."
                  value={item.responsibilities}
                  onChange={(value) =>
                    updateItem(
                      "experience",
                      index,
                      "responsibilities",
                      value
                    )
                  }
                />

              </div>

              <div className="mt-6">

                <TextArea
                  label="Achievements"
                  placeholder="What did you achieve? Add numbers or measurable results when possible."
                  value={item.achievements}
                  onChange={(value) =>
                    updateItem(
                      "experience",
                      index,
                      "achievements",
                      value
                    )
                  }
                />

              </div>

            </ItemCard>

          ))}

        </div>
      )}

      <Navigation
        onBack={onBack}
        onNext={onNext}
      />

    </Card>
  );
}

/* =========================================================
   INTERNSHIPS
========================================================= */

function InternshipStep({
  data,
  addInternship,
  updateItem,
  removeItem,
  onBack,
  onNext,
}) {
  return (
    <Card>

      <HeaderWithAdd
        title="Internships"
        description="Add internships, training programs, or practical experience."
        button="Add Internship"
        onClick={addInternship}
      />

      {data.internships.length === 0 ? (
        <EmptyState
          title="No internships added"
          description="You can skip this step if you don't have internships."
          buttonText="Add Internship"
          onClick={addInternship}
        />
      ) : (
        <div className="space-y-6">

          {data.internships.map((item, index) => (

            <ItemCard
              key={index}
              title={`Internship #${index + 1}`}
              onRemove={() =>
                removeItem("internships", index)
              }
            >

              <div className="grid md:grid-cols-2 gap-5">

                <Input
                  label="Internship Title"
                  placeholder="Data Analyst Intern"
                  value={item.title}
                  onChange={(value) =>
                    updateItem(
                      "internships",
                      index,
                      "title",
                      value
                    )
                  }
                />

                <Input
                  label="Company / Organization"
                  value={item.company}
                  onChange={(value) =>
                    updateItem(
                      "internships",
                      index,
                      "company",
                      value
                    )
                  }
                />

                <Input
                  label="Location"
                  value={item.location}
                  onChange={(value) =>
                    updateItem(
                      "internships",
                      index,
                      "location",
                      value
                    )
                  }
                />

                <div />

                <MonthYear
                  label="Start Date"
                  value={item.startDate}
                  onChange={(value) =>
                    updateItem(
                      "internships",
                      index,
                      "startDate",
                      value
                    )
                  }
                />

                <MonthYear
                  label="End Date"
                  value={item.endDate}
                  onChange={(value) =>
                    updateItem(
                      "internships",
                      index,
                      "endDate",
                      value
                    )
                  }
                />

              </div>

              <div className="mt-6">

                <TextArea
                  label="Description"
                  placeholder="What did you learn or work on?"
                  value={item.description}
                  onChange={(value) =>
                    updateItem(
                      "internships",
                      index,
                      "description",
                      value
                    )
                  }
                />

              </div>

            </ItemCard>

          ))}

        </div>
      )}

      <Navigation
        onBack={onBack}
        onNext={onNext}
      />

    </Card>
  );
}

/* =========================================================
   COURSES
========================================================= */

function CoursesStep({
  data,
  addCourse,
  updateItem,
  removeItem,
  onBack,
  onNext,
}) {
  return (
    <Card>

      <HeaderWithAdd
        title="Courses & Training"
        description="Add courses and professional training that support your career."
        button="Add Course"
        onClick={addCourse}
      />

      {data.courses.length === 0 ? (
        <EmptyState
          title="No courses added"
          description="You can skip this step if you don't have relevant courses."
          buttonText="Add Course"
          onClick={addCourse}
        />
      ) : (
        <div className="space-y-6">

          {data.courses.map((item, index) => (

            <ItemCard
              key={index}
              title={`Course #${index + 1}`}
              onRemove={() =>
                removeItem("courses", index)
              }
            >

              <div className="grid md:grid-cols-2 gap-5">

                <Input
                  label="Course Name"
                  placeholder="Google Data Analytics"
                  value={item.name}
                  onChange={(value) =>
                    updateItem(
                      "courses",
                      index,
                      "name",
                      value
                    )
                  }
                />

                <Input
                  label="Provider"
                  placeholder="Google / Coursera / Udemy..."
                  value={item.provider}
                  onChange={(value) =>
                    updateItem(
                      "courses",
                      index,
                      "provider",
                      value
                    )
                  }
                />

                <MonthYear
                  label="Completion Date"
                  value={item.date}
                  onChange={(value) =>
                    updateItem(
                      "courses",
                      index,
                      "date",
                      value
                    )
                  }
                />

                <Input
                  label="Certificate ID"
                  placeholder="Optional"
                  value={item.certificateId}
                  onChange={(value) =>
                    updateItem(
                      "courses",
                      index,
                      "certificateId",
                      value
                    )
                  }
                />

              </div>

            </ItemCard>

          ))}

        </div>
      )}

      <Navigation
        onBack={onBack}
        onNext={onNext}
      />

    </Card>
  );
}

/* =========================================================
   SKILLS
========================================================= */

function SkillsStep({
  data,
  addSkill,
  removeSkill,
  onBack,
  onNext,
}) {
  return (
    <Card>

      <SectionTitle>
        Skills
      </SectionTitle>

      <p className="text-slate-500 mt-2 mb-8">
        Select your skills or type your own.
      </p>

      <SkillCategory
        title="Technical Skills"
        category="technical"
        skills={data.skills.technical}
        suggestions={technicalSuggestions}
        addSkill={addSkill}
        removeSkill={removeSkill}
      />

      <SkillCategory
        title="Tools & Technologies"
        category="tools"
        skills={data.skills.tools}
        suggestions={toolSuggestions}
        addSkill={addSkill}
        removeSkill={removeSkill}
      />

      <SkillCategory
        title="Soft Skills"
        category="soft"
        skills={data.skills.soft}
        suggestions={softSuggestions}
        addSkill={addSkill}
        removeSkill={removeSkill}
      />

      <Navigation
        onBack={onBack}
        onNext={onNext}
      />

    </Card>
  );
}

function SkillCategory({
  title,
  category,
  skills,
  suggestions,
  addSkill,
  removeSkill,
}) {
  const [customSkill, setCustomSkill] = useState("");

  const submitSkill = () => {
    addSkill(category, customSkill);
    setCustomSkill("");
  };

  return (
    <div className="mb-10">

      <h3 className="font-semibold text-slate-900 mb-3">
        {title}
      </h3>

      <div className="flex gap-2">

        <input
          value={customSkill}
          onChange={(e) =>
            setCustomSkill(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitSkill();
            }
          }}
          placeholder="Type a skill..."
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
        />

        <button
          type="button"
          onClick={submitSkill}
          className="px-5 rounded-xl bg-blue-600 text-white font-medium"
        >
          Add
        </button>

      </div>

      <div className="flex flex-wrap gap-2 mt-4">

        {suggestions.map((skill) => {

          const selected =
            skills.includes(skill);

          return (
            <button
              key={skill}
              type="button"
              onClick={() =>
                selected
                  ? removeSkill(category, skill)
                  : addSkill(category, skill)
              }
              className={`px-3 py-2 rounded-full text-sm border transition ${
                selected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"
              }`}
            >
              {selected ? "✓ " : "+ "}
              {skill}
            </button>
          );
        })}

      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-5">

          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-2 rounded-full bg-slate-100 text-slate-700 text-sm"
            >
              {skill}

              <button
                type="button"
                onClick={() =>
                  removeSkill(category, skill)
                }
                className="ml-2 text-red-500"
              >
                ×
              </button>
            </span>
          ))}

        </div>
      )}

    </div>
  );
}

/* =========================================================
   LANGUAGES
========================================================= */

function LanguagesStep({
  data,
  addLanguage,
  updateItem,
  removeItem,
  onBack,
  onNext,
}) {
  return (
    <Card>

      <HeaderWithAdd
        title="Languages"
        description="Add the languages you can use professionally."
        button="Add Language"
        onClick={addLanguage}
      />

      {data.languages.length === 0 ? (
        <EmptyState
          title="No languages added"
          description="Add the languages you speak and your proficiency level."
          buttonText="Add Language"
          onClick={addLanguage}
        />
      ) : (
        <div className="space-y-4">

          {data.languages.map((item, index) => (

            <ItemCard
              key={index}
              title={`Language #${index + 1}`}
              onRemove={() =>
                removeItem("languages", index)
              }
            >

              <div className="grid md:grid-cols-2 gap-5">

                <Input
                  label="Language"
                  placeholder="English"
                  value={item.language}
                  onChange={(value) =>
                    updateItem(
                      "languages",
                      index,
                      "language",
                      value
                    )
                  }
                />

                <Select
                  label="Proficiency"
                  value={item.level}
                  options={languageLevels}
                  placeholder="Select level"
                  onChange={(value) =>
                    updateItem(
                      "languages",
                      index,
                      "level",
                      value
                    )
                  }
                />

              </div>

            </ItemCard>

          ))}

        </div>
      )}

      <Navigation
        onBack={onBack}
        onNext={onNext}
      />

    </Card>
  );
}

/* =========================================================
   ACHIEVEMENTS
========================================================= */

function AchievementsStep({
  data,
  addAchievement,
  updateItem,
  removeItem,
  onBack,
  onNext,
}) {
  return (
    <Card>

      <HeaderWithAdd
        title="Achievements"
        description="Highlight awards, competitions, leadership, or important accomplishments."
        button="Add Achievement"
        onClick={addAchievement}
      />

      {data.achievements.length === 0 ? (
        <EmptyState
          title="No achievements added"
          description="This section is optional."
          buttonText="Add Achievement"
          onClick={addAchievement}
        />
      ) : (
        <div className="space-y-6">

          {data.achievements.map(
            (item, index) => (

              <ItemCard
                key={index}
                title={`Achievement #${index + 1}`}
                onRemove={() =>
                  removeItem(
                    "achievements",
                    index
                  )
                }
              >

                <div className="grid md:grid-cols-2 gap-5">

                  <Input
                    label="Achievement Title"
                    placeholder="Competition Winner"
                    value={item.title}
                    onChange={(value) =>
                      updateItem(
                        "achievements",
                        index,
                        "title",
                        value
                      )
                    }
                  />

                  <MonthYear
                    label="Date"
                    value={item.date}
                    onChange={(value) =>
                      updateItem(
                        "achievements",
                        index,
                        "date",
                        value
                      )
                    }
                  />

                </div>

                <div className="mt-5">

                  <TextArea
                    label="Description"
                    placeholder="Briefly explain the achievement..."
                    value={item.description}
                    onChange={(value) =>
                      updateItem(
                        "achievements",
                        index,
                        "description",
                        value
                      )
                    }
                  />

                </div>

              </ItemCard>

            )
          )}

        </div>
      )}

      <Navigation
        onBack={onBack}
        onNext={onNext}
      />

    </Card>
  );
}

/* =========================================================
   PROJECTS
========================================================= */

function ProjectsStep({
  data,
  addProject,
  updateItem,
  removeItem,
  onBack,
  onNext,
}) {
  return (
    <Card>

      <HeaderWithAdd
        title="Projects"
        description="Add projects that demonstrate your practical skills."
        button="Add Project"
        onClick={addProject}
      />

      {data.projects.length === 0 ? (
        <EmptyState
          title="No projects added"
          description="Projects are especially useful for students and junior candidates."
          buttonText="Add Project"
          onClick={addProject}
        />
      ) : (
        <div className="space-y-6">

          {data.projects.map(
            (item, index) => (

              <ItemCard
                key={index}
                title={`Project #${index + 1}`}
                onRemove={() =>
                  removeItem(
                    "projects",
                    index
                  )
                }
              >

                <div className="grid md:grid-cols-2 gap-5">

                  <Input
                    label="Project Name"
                    value={item.name}
                    onChange={(value) =>
                      updateItem(
                        "projects",
                        index,
                        "name",
                        value
                      )
                    }
                  />

                  <Input
                    label="Project Link"
                    placeholder="GitHub / Demo URL"
                    value={item.link}
                    onChange={(value) =>
                      updateItem(
                        "projects",
                        index,
                        "link",
                        value
                      )
                    }
                  />

                </div>

                <div className="mt-5">

                  <Input
                    label="Technologies"
                    placeholder="Python, SQL, Power BI..."
                    value={item.technologies}
                    onChange={(value) =>
                      updateItem(
                        "projects",
                        index,
                        "technologies",
                        value
                      )
                    }
                  />

                </div>

                <div className="mt-5">

                  <TextArea
                    label="Project Description"
                    placeholder="What did you build? What problem did it solve?"
                    value={item.description}
                    onChange={(value) =>
                      updateItem(
                        "projects",
                        index,
                        "description",
                        value
                      )
                    }
                  />

                </div>

              </ItemCard>

            )
          )}

        </div>
      )}

      <Navigation
        onBack={onBack}
        onNext={onNext}
      />

    </Card>
  );
}

/* =========================================================
   ACCREDITATIONS
========================================================= */

function AccreditationsStep({
  data,
  addAccreditation,
  updateItem,
  removeItem,
  onBack,
  onNext,
}) {
  return (
    <Card>

      <HeaderWithAdd
        title="Certifications & Accreditations"
        description="Add professional certifications or credentials."
        button="Add Certification"
        onClick={addAccreditation}
      />

      {data.accreditations.length === 0 ? (
        <EmptyState
          title="No certifications added"
          description="You can skip this section if you don't have certifications."
          buttonText="Add Certification"
          onClick={addAccreditation}
        />
      ) : (
        <div className="space-y-6">

          {data.accreditations.map(
            (item, index) => (

              <ItemCard
                key={index}
                title={`Certification #${index + 1}`}
                onRemove={() =>
                  removeItem(
                    "accreditations",
                    index
                  )
                }
              >

                <div className="grid md:grid-cols-2 gap-5">

                  <Input
                    label="Certification Name"
                    placeholder="AWS Cloud Practitioner"
                    value={item.name}
                    onChange={(value) =>
                      updateItem(
                        "accreditations",
                        index,
                        "name",
                        value
                      )
                    }
                  />

                  <Input
                    label="Issuing Organization"
                    placeholder="Amazon Web Services"
                    value={item.issuer}
                    onChange={(value) =>
                      updateItem(
                        "accreditations",
                        index,
                        "issuer",
                        value
                      )
                    }
                  />

                  <MonthYear
                    label="Issue Date"
                    value={item.date}
                    onChange={(value) =>
                      updateItem(
                        "accreditations",
                        index,
                        "date",
                        value
                      )
                    }
                  />

                  <Input
                    label="Credential ID"
                    placeholder="Optional"
                    value={item.credentialId}
                    onChange={(value) =>
                      updateItem(
                        "accreditations",
                        index,
                        "credentialId",
                        value
                      )
                    }
                  />

                </div>

              </ItemCard>

            )
          )}

        </div>
      )}

      <Navigation
        onBack={onBack}
        onNext={onNext}
      />

    </Card>
  );
}

/* =========================================================
   REVIEW
========================================================= */

function ReviewStep({
  data,
  goToStep,
  onBack,
}) {
  return (
    <Card>

      <SectionTitle>
        Review Your Information
      </SectionTitle>

      <p className="text-slate-500 mt-2 mb-8">
        Review everything before submitting your CV.
      </p>

      <ReviewSection
        title="Personal Information"
        step={1}
        goToStep={goToStep}
      >
        <ReviewGrid>

          <ReviewItem
            label="Full Name"
            value={data.personal.fullName}
          />

          <ReviewItem
            label="Email"
            value={data.personal.email}
          />

          <ReviewItem
            label="Phone"
            value={data.personal.phone}
          />

          <ReviewItem
            label="Target Job"
            value={data.personal.targetTitle}
          />

          <ReviewItem
            label="Location"
            value={data.personal.location}
          />

        </ReviewGrid>

      </ReviewSection>

      <ReviewSection
        title="Education"
        step={2}
        goToStep={goToStep}
      >
        <ReviewList
          items={data.education}
          empty="No education added"
          render={(item) => (
            <>
              <strong>
                {item.degree}
              </strong>

              <div className="text-sm text-slate-600">
                {item.institution}
                {item.fieldOfStudy &&
                  ` • ${item.fieldOfStudy}`}
              </div>
            </>
          )}
        />
      </ReviewSection>

      <ReviewSection
        title="Work Experience"
        step={3}
        goToStep={goToStep}
      >
        <ReviewList
          items={data.experience}
          empty="No work experience added"
          render={(item) => (
            <>
              <strong>
                {item.jobTitle}
              </strong>

              <div className="text-sm text-slate-600">
                {item.company}
                {item.employmentType &&
                  ` • ${item.employmentType}`}
              </div>
            </>
          )}
        />
      </ReviewSection>

      <ReviewSection
        title="Internships"
        step={4}
        goToStep={goToStep}
      >
        <ReviewList
          items={data.internships}
          empty="No internships added"
          render={(item) => (
            <>
              <strong>
                {item.title}
              </strong>

              <div className="text-sm text-slate-600">
                {item.company}
              </div>
            </>
          )}
        />
      </ReviewSection>

      <ReviewSection
        title="Courses"
        step={5}
        goToStep={goToStep}
      >
        <ReviewList
          items={data.courses}
          empty="No courses added"
          render={(item) => (
            <>
              <strong>
                {item.name}
              </strong>

              <div className="text-sm text-slate-600">
                {item.provider}
              </div>
            </>
          )}
        />
      </ReviewSection>

      <ReviewSection
        title="Skills"
        step={6}
        goToStep={goToStep}
      >

        <div className="flex flex-wrap gap-2">

          {[
            ...data.skills.technical,
            ...data.skills.tools,
            ...data.skills.soft,
          ].length === 0 ? (
            <span className="text-slate-500">
              No skills added
            </span>
          ) : (
            [
              ...data.skills.technical,
              ...data.skills.tools,
              ...data.skills.soft,
            ].map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 bg-slate-100 rounded-full text-sm"
              >
                {skill}
              </span>
            ))
          )}

        </div>

      </ReviewSection>

      <ReviewSection
        title="Languages"
        step={7}
        goToStep={goToStep}
      >
        <ReviewList
          items={data.languages}
          empty="No languages added"
          render={(item) => (
            <>
              <strong>
                {item.language}
              </strong>

              <div className="text-sm text-slate-600">
                {item.level}
              </div>
            </>
          )}
        />
      </ReviewSection>

      <ReviewSection
        title="Achievements"
        step={8}
        goToStep={goToStep}
      >
        <ReviewList
          items={data.achievements}
          empty="No achievements added"
          render={(item) => (
            <strong>
              {item.title}
            </strong>
          )}
        />
      </ReviewSection>

      <ReviewSection
        title="Projects"
        step={9}
        goToStep={goToStep}
      >
        <ReviewList
          items={data.projects}
          empty="No projects added"
          render={(item) => (
            <>
              <strong>
                {item.name}
              </strong>

              <div className="text-sm text-slate-600">
                {item.technologies}
              </div>
            </>
          )}
        />
      </ReviewSection>

      <ReviewSection
        title="Certifications"
        step={10}
        goToStep={goToStep}
      >
        <ReviewList
          items={data.accreditations}
          empty="No certifications added"
          render={(item) => (
            <>
              <strong>
                {item.name}
              </strong>

              <div className="text-sm text-slate-600">
                {item.issuer}
              </div>
            </>
          )}
        />
      </ReviewSection>

      <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between">

        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium"
        >
          ← Back
        </button>

        <button
          type="submit"
          className="px-7 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          Submit CV
        </button>

      </div>

    </Card>
  );
}

/* =========================================================
   SHARED COMPONENTS
========================================================= */

function Card({ children }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-2xl font-semibold text-slate-900">
      {children}
    </h2>
  );
}

function HeaderWithAdd({
  title,
  description,
  button,
  onClick,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

      <div>

        <SectionTitle>
          {title}
        </SectionTitle>

        <p className="text-slate-500 mt-2">
          {description}
        </p>

      </div>

      <button
        type="button"
        onClick={onClick}
        className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100"
      >
        + {button}
      </button>

    </div>
  );
}

function ItemCard({
  title,
  onRemove,
  children,
}) {
  return (
    <div className="border border-slate-200 rounded-2xl p-6">

      <div className="flex items-center justify-between mb-6">

        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>

        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Remove
        </button>

      </div>

      {children}

    </div>
  );
}

function EmptyState({
  title,
  description,
  buttonText,
  onClick,
}) {
  return (
    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">

      <h3 className="font-semibold text-slate-800">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium"
      >
        {buttonText}
      </button>

    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-slate-700 mb-2">

        {label}

        {required && (
          <span className="text-red-500 ml-1">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full min-h-32 rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y"
      />

    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >

        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

    </div>
  );
}

function MonthYear({
  label,
  value,
  onChange,
}) {
  const parts = value.split("-");

  const month = parts[0] || "";
  const year = parts[1] || "";

  const update = (
    newMonth,
    newYear
  ) => {
    if (!newMonth && !newYear) {
      onChange("");
    } else {
      onChange(
        `${newMonth}-${newYear}`
      );
    }
  };

  return (
    <div>

      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      <div className="grid grid-cols-2 gap-3">

        <select
          value={month}
          onChange={(e) =>
            update(
              e.target.value,
              year
            )
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        >

          <option value="">
            Month
          </option>

          {months.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}

        </select>

        <select
          value={year}
          onChange={(e) =>
            update(
              month,
              e.target.value
            )
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        >

          <option value="">
            Year
          </option>

          {years.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}

        </select>

      </div>

    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="w-5 h-5 accent-blue-600"
      />

      <span className="text-sm text-slate-700">
        {label}
      </span>

    </label>
  );
}

function Navigation({
  onBack,
  onNext,
  showBack = true,
}) {
  return (
    <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between">

      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
        >
          ← Back
        </button>
      ) : (
        <div />
      )}

      <button
        type="button"
        onClick={onNext}
        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
      >
        Continue →
      </button>

    </div>
  );
}

function ReviewSection({
  title,
  step,
  goToStep,
  children,
}) {
  return (
    <div className="border border-slate-200 rounded-2xl p-5 mb-5">

      <div className="flex items-center justify-between mb-4">

        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>

        <button
          type="button"
          onClick={() => goToStep(step)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Edit
        </button>

      </div>

      {children}

    </div>
  );
}

function ReviewGrid({ children }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {children}
    </div>
  );
}

function ReviewItem({
  label,
  value,
}) {
  return (
    <div>

      <div className="text-xs text-slate-400">
        {label}
      </div>

      <div className="text-sm text-slate-800 mt-1">
        {value || "Not provided"}
      </div>

    </div>
  );
}

function ReviewList({
  items,
  empty,
  render,
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {empty}
      </p>
    );
  }

  return (
    <div className="space-y-3">

      {items.map((item, index) => (
        <div
          key={index}
          className="bg-slate-50 rounded-xl p-4"
        >
          {render(item)}
        </div>
      ))}

    </div>
  );
}

export default App;
