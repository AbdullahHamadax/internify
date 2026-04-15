import jsPDF from "jspdf";

/**
 * ATS-Friendly CV PDF Generator
 *
 * ATS rules enforced:
 * - Single-column layout
 * - No tables or text boxes
 * - Standard fonts (Helvetica = Arial equivalent in jsPDF)
 * - All text is selectable (not images)
 * - Plain section headings: "Experience", "Education", "Skills"
 * - Clean margins and consistent spacing
 */

interface CVExperience {
  company: string;
  jobTitle: string;
  date: string;
  bullets: string[];
}

interface CVEducation {
  institution: string;
  degree: string;
  field: string;
  date: string;
}

interface CVData {
  summary: string;
  experience: CVExperience[];
  education: CVEducation[];
  skills: Record<string, string[]>;
  links: {
    portfolio?: string | null;
    github?: string | null;
    linkedin?: string | null;
  };
}

// Layout constants
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT = 5.5;
const SECTION_GAP = 8;

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

export function generateCvPdf(
  cvData: CVData,
  fullName: string,
  email: string
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN_TOP;

  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      y = MARGIN_TOP;
    }
  };

  // ─── HEADER: Name ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(fullName.toUpperCase(), PAGE_WIDTH / 2, y, { align: "center" });
  y += 9;

  // ─── HEADER: Contact Line ───
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const contactParts: string[] = [email];
  if (cvData.links?.linkedin) contactParts.push(cvData.links.linkedin);
  if (cvData.links?.github) contactParts.push(cvData.links.github);
  if (cvData.links?.portfolio) contactParts.push(cvData.links.portfolio);

  const contactLine = contactParts.join("  |  ");
  const contactLines = wrapText(doc, contactLine, CONTENT_WIDTH);
  contactLines.forEach((line) => {
    checkPageBreak(LINE_HEIGHT);
    doc.text(line, PAGE_WIDTH / 2, y, { align: "center" });
    y += LINE_HEIGHT;
  });

  y += 3;

  // ─── Divider ───
  const drawDivider = () => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
    y += 4;
  };

  // ─── Section Header ───
  const drawSectionHeader = (title: string) => {
    checkPageBreak(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title.toUpperCase(), MARGIN_LEFT, y);
    y += 1.5;
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
    y += 5;
  };

  // ═══════════════════════════════════════════
  // PROFESSIONAL SUMMARY
  // ═══════════════════════════════════════════
  drawDivider();

  if (cvData.summary) {
    drawSectionHeader("Professional Summary");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summaryLines = wrapText(doc, cvData.summary, CONTENT_WIDTH);
    summaryLines.forEach((line) => {
      checkPageBreak(LINE_HEIGHT);
      doc.text(line, MARGIN_LEFT, y);
      y += LINE_HEIGHT;
    });
    y += SECTION_GAP;
  }

  // ═══════════════════════════════════════════
  // EXPERIENCE
  // ═══════════════════════════════════════════
  if (cvData.experience && cvData.experience.length > 0) {
    drawSectionHeader("Experience");

    cvData.experience.forEach((exp, idx) => {
      // Job title + date on one line
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(exp.jobTitle, MARGIN_LEFT, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(exp.date, PAGE_WIDTH - MARGIN_RIGHT, y, { align: "right" });
      y += LINE_HEIGHT;

      // Company name
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text(exp.company, MARGIN_LEFT, y);
      y += LINE_HEIGHT + 1;

      // Bullet points
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      exp.bullets.forEach((bullet) => {
        const bulletText = `•  ${bullet}`;
        const bulletLines = wrapText(doc, bulletText, CONTENT_WIDTH - 5);
        bulletLines.forEach((line, lineIdx) => {
          checkPageBreak(LINE_HEIGHT);
          doc.text(
            lineIdx === 0 ? line : `    ${line}`,
            MARGIN_LEFT + 3,
            y
          );
          y += LINE_HEIGHT;
        });
      });

      // Spacing between entries
      if (idx < cvData.experience.length - 1) {
        y += 4;
      }
    });

    y += SECTION_GAP;
  }

  // ═══════════════════════════════════════════
  // EDUCATION
  // ═══════════════════════════════════════════
  if (cvData.education && cvData.education.length > 0) {
    drawSectionHeader("Education");

    cvData.education.forEach((edu) => {
      checkPageBreak(15);

      // Degree + date
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const degreeText = `${edu.degree} — ${edu.field}`;
      doc.text(degreeText, MARGIN_LEFT, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(edu.date, PAGE_WIDTH - MARGIN_RIGHT, y, { align: "right" });
      y += LINE_HEIGHT;

      // Institution
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text(edu.institution, MARGIN_LEFT, y);
      y += LINE_HEIGHT + 2;
    });

    y += SECTION_GAP;
  }

  // ═══════════════════════════════════════════
  // SKILLS
  // ═══════════════════════════════════════════
  if (cvData.skills && Object.keys(cvData.skills).length > 0) {
    drawSectionHeader("Skills");

    doc.setFontSize(10);

    Object.entries(cvData.skills).forEach(([category, skillsList]) => {
      checkPageBreak(LINE_HEIGHT * 2);

      // Category label
      doc.setFont("helvetica", "bold");
      const categoryLabel = `${category}: `;
      doc.text(categoryLabel, MARGIN_LEFT, y);

      // Skills text
      const labelWidth = doc.getTextWidth(categoryLabel);
      doc.setFont("helvetica", "normal");
      const skillsText = (skillsList as string[]).join(", ");
      const skillsLines = wrapText(
        doc,
        skillsText,
        CONTENT_WIDTH - labelWidth
      );

      skillsLines.forEach((line, lineIdx) => {
        if (lineIdx === 0) {
          doc.text(line, MARGIN_LEFT + labelWidth, y);
        } else {
          checkPageBreak(LINE_HEIGHT);
          doc.text(line, MARGIN_LEFT + labelWidth, y);
        }
        y += LINE_HEIGHT;
      });

      y += 1;
    });
  }

  return doc;
}
