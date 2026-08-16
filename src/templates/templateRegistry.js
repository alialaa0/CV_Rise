/**
 * CV Rise Template Registry
 * Defines the single production template: ATS Professional.
 */

export const ATS_PROFESSIONAL_TEMPLATE = {
  id: "ats_professional",
  name: "ATS Professional",
  category: "ATS Optimized",
  status: "Available",
  description:
    "Single-column, text-first, high-legibility layout optimized for Applicant Tracking Systems and hiring managers.",
  characteristics: [
    "Standard uppercase section headings",
    "Single-column linear hierarchy",
    "Bullet-based achievement formatting",
    "No embedded graphics or complex table structures",
  ],
  docx: {
    fontFamily: "Calibri",
    headingColor: "1e293b",
    primaryColor: "2563eb",
    titleSize: 32, // 16pt
    headingSize: 24, // 12pt
    bodySize: 21, // 10.5pt
  },
  isDefault: true,
};

export const TEMPLATES = [ATS_PROFESSIONAL_TEMPLATE];

export function getTemplate(_id = "ats_professional") {
  return ATS_PROFESSIONAL_TEMPLATE;
}

export function getDefaultTemplate() {
  return ATS_PROFESSIONAL_TEMPLATE;
}
