import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import { getTemplate } from "../templates/templateRegistry";

/**
 * Clean filename generator: FirstName_LastName_CV.ext
 */
export function buildCleanFileName(cvData) {
  const name = cvData?.personal?.fullName || "";
  const cleanName = name
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "_");
  return cleanName ? `${cleanName}_CV` : "Candidate_CV";
}

/**
 * Trigger browser file download from Blob
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export CV to standard editable Microsoft Word DOCX
 */
export async function exportDocx(cvData, templateId = "ats_professional") {
  const template = getTemplate(templateId);
  const font = template.docx?.fontFamily || "Calibri";
  const personal = cvData?.personal || {};
  const summary = cvData?.summary || personal.summary || "";
  const skills = cvData?.skills || { technical: [], tools: [], soft: [] };

  const sectionsChildren = [];

  // 1. CANDIDATE NAME / TITLE HEADER
  const fullName = personal.fullName || "Candidate CV";
  sectionsChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: template.docx?.titleSize || 32, // 16pt
          font,
          color: "0f172a",
        }),
      ],
    })
  );

  // Contact Info line
  const contactParts = [
    personal.targetTitle,
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.portfolio,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    sectionsChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: contactParts.join("  |  "),
            size: 19, // 9.5pt
            font,
            color: "475569",
          }),
        ],
      })
    );
  }

  // Section Heading Helper
  function createSectionHeading(title) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 100 },
      border: {
        bottom: {
          color: "cbd5e1",
          space: 2,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 22, // 11pt
          font,
          color: "1e293b",
        }),
      ],
    });
  }

  // 2. PROFESSIONAL SUMMARY
  if (summary) {
    sectionsChildren.push(createSectionHeading("Professional Summary"));
    sectionsChildren.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: summary,
            size: 21,
            font,
            color: "334155",
          }),
        ],
      })
    );
  }

  // 3. SKILLS
  const techSkills = Array.isArray(skills.technical) ? skills.technical : [];
  const toolSkills = Array.isArray(skills.tools) ? skills.tools : [];
  const softSkills = Array.isArray(skills.soft) ? skills.soft : [];
  const hasSkills = techSkills.length > 0 || toolSkills.length > 0 || softSkills.length > 0;

  if (hasSkills) {
    sectionsChildren.push(createSectionHeading("Core Skills & Technologies"));
    if (techSkills.length > 0) {
      sectionsChildren.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Technical Skills: ", bold: true, size: 20, font, color: "1e293b" }),
            new TextRun({ text: techSkills.join(", "), size: 20, font, color: "334155" }),
          ],
        })
      );
    }
    if (toolSkills.length > 0) {
      sectionsChildren.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Tools & Technologies: ", bold: true, size: 20, font, color: "1e293b" }),
            new TextRun({ text: toolSkills.join(", "), size: 20, font, color: "334155" }),
          ],
        })
      );
    }
    if (softSkills.length > 0) {
      sectionsChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: "Professional & Soft Skills: ", bold: true, size: 20, font, color: "1e293b" }),
            new TextRun({ text: softSkills.join(", "), size: 20, font, color: "334155" }),
          ],
        })
      );
    }
  }

  // 4. WORK EXPERIENCE
  const experience = Array.isArray(cvData?.experience) ? cvData.experience : [];
  if (experience.length > 0) {
    sectionsChildren.push(createSectionHeading("Work Experience"));
    experience.forEach((exp) => {
      const dates = [exp.startDate, exp.current ? "Present" : exp.endDate].filter(Boolean).join(" – ");
      const roleLine = [exp.jobTitle, exp.company].filter(Boolean).join(" — ");

      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ text: roleLine, bold: true, size: 21, font, color: "0f172a" }),
            dates ? new TextRun({ text: `  (${dates})`, font, size: 19, color: "64748b" }) : null,
            exp.location ? new TextRun({ text: ` | ${exp.location}`, font, size: 19, color: "64748b" }) : null,
          ].filter(Boolean),
        })
      );

      if (exp.responsibilities) {
        String(exp.responsibilities)
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((line) => {
            sectionsChildren.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 40 },
                children: [new TextRun({ text: line.replace(/^[•\-*]\s*/, ""), size: 20, font, color: "334155" })],
              })
            );
          });
      }

      if (exp.achievements) {
        String(exp.achievements)
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((line) => {
            sectionsChildren.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: "Key Achievement: ", bold: true, size: 20, font, color: "1e293b" }),
                  new TextRun({ text: line.replace(/^[•\-*]\s*/, ""), size: 20, font, color: "334155" }),
                ],
              })
            );
          });
      }
    });
  }

  // 5. EDUCATION
  const education = Array.isArray(cvData?.education) ? cvData.education : [];
  if (education.length > 0) {
    sectionsChildren.push(createSectionHeading("Education"));
    education.forEach((edu) => {
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
      const eduTitle = [edu.degree, edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : null]
        .filter(Boolean)
        .join(" ");

      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: eduTitle, bold: true, size: 21, font, color: "0f172a" }),
            edu.institution ? new TextRun({ text: ` — ${edu.institution}`, font, size: 20, color: "334155" }) : null,
            dates ? new TextRun({ text: ` (${dates})`, font, size: 19, color: "64748b" }) : null,
          ].filter(Boolean),
        })
      );

      if (edu.grade) {
        sectionsChildren.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "Grade / GPA: ", font, bold: true, size: 19, color: "475569" }),
              new TextRun({ text: edu.grade, font, size: 19, color: "475569" }),
            ],
          })
        );
      }
    });
  }

  // 6. INTERNSHIPS
  const internships = Array.isArray(cvData?.internships) ? cvData.internships : [];
  if (internships.length > 0) {
    sectionsChildren.push(createSectionHeading("Internships & Practical Training"));
    internships.forEach((item) => {
      const dates = [item.startDate, item.endDate].filter(Boolean).join(" – ");
      const titleLine = [item.title, item.company].filter(Boolean).join(" — ");

      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: titleLine, bold: true, size: 21, font, color: "0f172a" }),
            dates ? new TextRun({ text: ` (${dates})`, font, size: 19, color: "64748b" }) : null,
          ].filter(Boolean),
        })
      );

      if (item.description) {
        sectionsChildren.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: item.description, size: 20, font, color: "334155" })],
          })
        );
      }
    });
  }

  // 7. PROJECTS
  const projects = Array.isArray(cvData?.projects) ? cvData.projects : [];
  if (projects.length > 0) {
    sectionsChildren.push(createSectionHeading("Projects"));
    projects.forEach((proj) => {
      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: proj.name || "Project", bold: true, size: 21, font, color: "0f172a" }),
            proj.technologies ? new TextRun({ text: ` (${proj.technologies})`, font, size: 19, color: "64748b" }) : null,
            proj.link ? new TextRun({ text: ` | ${proj.link}`, font, size: 19, color: "2563eb" }) : null,
          ].filter(Boolean),
        })
      );

      if (proj.description) {
        sectionsChildren.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: proj.description, size: 20, font, color: "334155" })],
          })
        );
      }
    });
  }

  // 8. COURSES & CERTIFICATIONS
  const courses = Array.isArray(cvData?.courses) ? cvData.courses : [];
  if (courses.length > 0) {
    sectionsChildren.push(createSectionHeading("Courses & Professional Training"));
    courses.forEach((c) => {
      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({ text: c.name || "Course", bold: true, size: 20, font, color: "0f172a" }),
            c.provider ? new TextRun({ text: ` — ${c.provider}`, font, size: 19, color: "334155" }) : null,
            c.date ? new TextRun({ text: ` (${c.date})`, font, size: 19, color: "64748b" }) : null,
          ].filter(Boolean),
        })
      );
    });
  }

  // 9. ACCREDITATIONS & LICENSES
  const accreditations = Array.isArray(cvData?.accreditations) ? cvData.accreditations : [];
  if (accreditations.length > 0) {
    sectionsChildren.push(createSectionHeading("Certifications & Accreditations"));
    accreditations.forEach((acc) => {
      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({ text: acc.name || "Certification", bold: true, size: 20, font, color: "0f172a" }),
            acc.issuer ? new TextRun({ text: ` — ${acc.issuer}`, font, size: 19, color: "334155" }) : null,
            acc.date ? new TextRun({ text: ` (${acc.date})`, font, size: 19, color: "64748b" }) : null,
          ].filter(Boolean),
        })
      );
    });
  }

  // 10. ACHIEVEMENTS
  const achievements = Array.isArray(cvData?.achievements) ? cvData.achievements : [];
  if (achievements.length > 0) {
    sectionsChildren.push(createSectionHeading("Key Achievements & Awards"));
    achievements.forEach((ach) => {
      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({ text: ach.title || "Achievement", bold: true, size: 20, font, color: "0f172a" }),
            ach.date ? new TextRun({ text: ` (${ach.date})`, font, size: 19, color: "64748b" }) : null,
          ].filter(Boolean),
        })
      );
      if (ach.description) {
        sectionsChildren.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: ach.description, size: 19, font, color: "334155" })],
          })
        );
      }
    });
  }

  // 11. LANGUAGES
  const languages = Array.isArray(cvData?.languages) ? cvData.languages : [];
  if (languages.length > 0) {
    sectionsChildren.push(createSectionHeading("Languages"));
    const langFormatted = languages
      .map((l) => [l.language, l.level ? `(${l.level})` : null].filter(Boolean).join(" "))
      .join("  •  ");

    sectionsChildren.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: langFormatted, size: 20, font, color: "334155" })],
      })
    );
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: sectionsChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${buildCleanFileName(cvData)}.docx`;
  downloadBlob(blob, fileName);
  return fileName;
}

/**
 * Export CV to PDF format
 */
export function exportPdf(cvData, _templateId = "ats_professional") {
  const lines = buildPdfContentLines(cvData).slice(0, 60);
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 790 Td",
    "14 TL",
    ...lines.map((line, index) => `${index === 0 ? "" : "T*"}(${escapePdf(line)}) Tj`),
    "ET",
  ].join("\n");

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

  const blob = new Blob([pdf], { type: "application/pdf" });
  const fileName = `${buildCleanFileName(cvData)}.pdf`;
  downloadBlob(blob, fileName);
  return fileName;
}

function buildPdfContentLines(cv) {
  const lines = [
    cv.personal?.fullName || "CV Rise CV",
    [cv.personal?.targetTitle, cv.personal?.email, cv.personal?.phone, cv.personal?.location]
      .filter(Boolean)
      .join(" | "),
    "",
  ];

  addPdfSection(lines, "PROFESSIONAL SUMMARY", [cv.summary || cv.personal?.summary]);
  
  const skills = cv.skills || {};
  const skillList = [];
  if (skills.technical?.length) skillList.push(`Technical: ${skills.technical.join(", ")}`);
  if (skills.tools?.length) skillList.push(`Tools: ${skills.tools.join(", ")}`);
  if (skills.soft?.length) skillList.push(`Soft Skills: ${skills.soft.join(", ")}`);
  addPdfSection(lines, "SKILLS", skillList);

  addPdfSection(lines, "WORK EXPERIENCE", (cv.experience || []).map(formatExperiencePdf));
  addPdfSection(lines, "EDUCATION", (cv.education || []).map(formatEducationPdf));
  addPdfSection(lines, "INTERNSHIPS", (cv.internships || []).map(formatInternshipPdf));
  addPdfSection(lines, "PROJECTS", (cv.projects || []).map(formatProjectPdf));
  addPdfSection(lines, "COURSES & TRAINING", (cv.courses || []).map(formatCoursePdf));
  addPdfSection(lines, "CERTIFICATIONS", (cv.accreditations || []).map(formatAccreditationPdf));
  addPdfSection(lines, "LANGUAGES", (cv.languages || []).map((l) => `${l.language} (${l.level})`));

  return lines.flatMap((line) => wrapLine(line, 90));
}

function addPdfSection(lines, title, values) {
  const items = (values || []).filter(Boolean);
  if (items.length === 0) return;

  lines.push(`--- ${title} ---`);
  items.forEach((item) => {
    String(item)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => lines.push(l));
  });
  lines.push("");
}

function formatExperiencePdf(item) {
  const dates = [item.startDate, item.current ? "Present" : item.endDate].filter(Boolean).join(" - ");
  const header = [item.jobTitle, item.company, dates].filter(Boolean).join(" | ");
  const parts = [header];
  if (item.responsibilities) parts.push(item.responsibilities);
  if (item.achievements) parts.push(`Achievement: ${item.achievements}`);
  return parts.join("\n");
}

function formatEducationPdf(item) {
  const dates = [item.startDate, item.endDate].filter(Boolean).join(" - ");
  return [item.degree, item.fieldOfStudy ? `in ${item.fieldOfStudy}` : null, item.institution, dates]
    .filter(Boolean)
    .join(" | ");
}

function formatInternshipPdf(item) {
  const dates = [item.startDate, item.endDate].filter(Boolean).join(" - ");
  return [item.title, item.company, dates, item.description].filter(Boolean).join(" | ");
}

function formatProjectPdf(item) {
  return [item.name, item.technologies ? `(${item.technologies})` : null, item.description]
    .filter(Boolean)
    .join(" | ");
}

function formatCoursePdf(item) {
  return [item.name, item.provider, item.date].filter(Boolean).join(" | ");
}

function formatAccreditationPdf(item) {
  return [item.name, item.issuer, item.date].filter(Boolean).join(" | ");
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

function escapePdf(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "");
}
