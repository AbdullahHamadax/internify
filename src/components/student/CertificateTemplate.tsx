"use client";

import jsPDF from "jspdf";

export interface CertificateData {
  /** Public verification ID, e.g. "INF-2026-7K4QX9". May be null for legacy certs. */
  certificateId: string | null;
  studentName: string;
  taskTitle: string;
  /** The employer that posted the task (e.g. "Mossa") — NOT the issuing platform. */
  employerName: string;
  finalScore: number;
  completedAt: number;
  /** Logo uploaded by the employer. Rendered with its aspect ratio preserved. */
  employerLogoUrl?: string | null;
}

interface LoadedImage {
  dataUrl: string;
  /** jsPDF format token derived from the image mime type. */
  format: "PNG" | "JPEG" | "WEBP";
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Loads an image URL and returns its base64 data URL, jsPDF format token, and
 * natural pixel dimensions. The dimensions let us preserve the aspect ratio when
 * placing the image in the PDF instead of forcing it into a fixed square.
 * Returns null on any failure (network, unsupported format like SVG, etc.).
 */
async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const mime = blob.type.toLowerCase();
    let format: LoadedImage["format"] | null = null;
    if (mime.includes("png")) format = "PNG";
    else if (mime.includes("jpeg") || mime.includes("jpg")) format = "JPEG";
    else if (mime.includes("webp")) format = "WEBP";
    // SVG and other vector/unsupported formats can't be embedded by jsPDF.
    if (!format) return null;

    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return null;

    const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    if (!dims || dims.w === 0 || dims.h === 0) return null;

    return { dataUrl, format, naturalWidth: dims.w, naturalHeight: dims.h };
  } catch {
    return null;
  }
}

/**
 * Fits (w, h) inside a max box while preserving aspect ratio (object-fit: contain).
 */
function containDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
  return { width: naturalWidth * ratio, height: naturalHeight * ratio };
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "GOOD";
  if (score >= 60) return "SATISFACTORY";
  return "PASS";
}

function getScoreColor(score: number): [number, number, number] {
  if (score >= 90) return [5, 150, 105]; // emerald
  if (score >= 75) return [37, 99, 235]; // blue
  return [217, 119, 6]; // amber
}

// ── Brand palette ──
const INK: [number, number, number] = [23, 37, 84]; // deep navy
const BLUE: [number, number, number] = [37, 99, 235]; // Internify blue
const GOLD: [number, number, number] = [202, 138, 4]; // accent gold
const PAPER: [number, number, number] = [253, 252, 247]; // warm cream
const MUTED: [number, number, number] = [110, 116, 130];

/**
 * Draws centered text with letter-spacing (tracking). jsPDF's built-in
 * `align: "center"` ignores `charSpace`, so tracked labels drift off-center —
 * this measures the real tracked width and positions it precisely.
 */
function drawTrackedCenter(
  doc: jsPDF,
  text: string,
  cx: number,
  y: number,
  charSpace: number,
) {
  const width = doc.getTextWidth(text) + charSpace * Math.max(text.length - 1, 0);
  doc.text(text, cx - width / 2, y, { charSpace, baseline: "alphabetic" });
}

/**
 * Draws an award-style medallion (sunburst seal) showing the final score.
 * Centered at (cx, cy). Verdict/labels are drawn separately by the caller.
 */
function drawScoreSeal(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  score: number,
  color: [number, number, number],
) {
  const spikes = 32;
  const spikeLen = r * 0.26;

  // Sunburst ring behind the disc.
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  for (let i = 0; i < spikes; i++) {
    const a1 = (i / spikes) * Math.PI * 2;
    const a2 = ((i + 1) / spikes) * Math.PI * 2;
    const aMid = ((i + 0.5) / spikes) * Math.PI * 2;
    doc.triangle(
      cx + r * Math.cos(a1), cy + r * Math.sin(a1),
      cx + r * Math.cos(a2), cy + r * Math.sin(a2),
      cx + (r + spikeLen) * Math.cos(aMid), cy + (r + spikeLen) * Math.sin(aMid),
      "F",
    );
  }

  // Colored disc + gold rim + inner hairline ring.
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(cx, cy, r, "F");
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(1);
  doc.circle(cx, cy, r, "S");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, r - 1.8, "S");

  // Score number + "/100".
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`${score}`, cx, cy - 0.2, { align: "center", baseline: "middle" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("/ 100", cx, cy + 5, { align: "center" });
}

/**
 * Scatters decorative confetti particles (dots + diamonds) into the left/right
 * margins and bottom corners, framing the content without crowding it. Uses a
 * fixed seed so the layout is deterministic, and low opacity so it stays subtle.
 */
function drawConfetti(doc: jsPDF, pageW: number, pageH: number) {
  const palette: [number, number, number][] = [
    BLUE,
    GOLD,
    INK,
    [171, 71, 188], // brand purple (#AB47BC)
    [5, 150, 105], // emerald
  ];

  // Simple seeded LCG so the scatter is consistent run to run.
  let seed = 987654321;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  // Confetti in the side margins + bottom corners only.
  const inZone = (x: number, y: number) => {
    const inSide =
      (x > 14 && x < 33) || (x > pageW - 33 && x < pageW - 14);
    const upper = y > 16 && y < 132;
    const bottom = y > 184 && y < pageH - 14;
    return inSide && (upper || bottom);
  };

  let placed = 0;
  let guard = 0;
  while (placed < 46 && guard < 600) {
    guard++;
    const x = 14 + rand() * (pageW - 28);
    const y = 16 + rand() * (pageH - 30);
    if (!inZone(x, y)) continue;

    const color = palette[Math.floor(rand() * palette.length)];
    doc.setGState(doc.GState({ opacity: 0.35 + rand() * 0.5 }));
    doc.setFillColor(color[0], color[1], color[2]);

    if (rand() > 0.5) {
      doc.circle(x, y, 0.5 + rand() * 1.1, "F"); // dot
    } else {
      const h = 0.8 + rand() * 1.2; // diamond
      doc.triangle(x, y - h, x + h, y, x, y + h, "F");
      doc.triangle(x, y - h, x - h, y, x, y + h, "F");
    }
    placed++;
  }

  doc.setGState(doc.GState({ opacity: 1 }));
}

/**
 * Generates and downloads a certificate PDF using jsPDF.
 *
 * Layout hierarchy (top → bottom):
 *   1. Issuer branding   — "Issued by" + Internify mark & wordmark (platform)
 *   2. Title             — CERTIFICATE OF COMPLETION
 *   3. Recipient         — "proudly presented to" + Student Name
 *   4. Achievement       — single sentence: task + date
 *   5. Employer field    — "Task posted by [Employer]" + employer logo
 *   6. Footer row        — Score medallion  |  Internify issuer signature
 *   7. Verification      — Certificate ID centered at the bottom
 */
/**
 * Builds the certificate filename from the task title and student name.
 */
function certificateFileName(data: CertificateData): string {
  const safeTaskTitle = data.taskTitle.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  const safeName = data.studentName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
  return `Internify_Certificate_${safeName}_${safeTaskTitle}.pdf`;
}

/**
 * Builds the certificate PDF document (without saving). Returned so callers can
 * either preview it (blob URL) or download it (save) — viewing should not force
 * an automatic download.
 */
async function buildCertificatePDF(data: CertificateData): Promise<jsPDF> {
  const {
    certificateId,
    studentName,
    taskTitle,
    employerName,
    finalScore,
    completedAt,
    employerLogoUrl,
  } = data;

  const dateStr = new Date(completedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fallback display ID for legacy certificates without a stored ID.
  const displayCertId =
    certificateId ??
    `INF-${new Date(completedAt).getFullYear()}-LEGACY`;

  // Load logos (aspect ratio preserved). The Internify brand logo lives in
  // /public; the employer logo (if any) comes from the certificate record.
  const [brandLogo, logo] = await Promise.all([
    loadImage("/InternifyLogo.png"),
    employerLogoUrl ? loadImage(employerLogoUrl) : Promise.resolve(null),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const cx = pageW / 2;
  const scoreColor = getScoreColor(finalScore);

  // ── Background ──
  doc.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
  doc.rect(0, 0, pageW, pageH, "F");

  // ── Decorative confetti (drawn early so it sits behind the content) ──
  drawConfetti(doc, pageW, pageH);

  // ── Borders: gold outer + navy hairline inner ──
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(2.5);
  doc.rect(8, 8, pageW - 16, pageH - 16);
  doc.setDrawColor(INK[0], INK[1], INK[2]);
  doc.setLineWidth(0.4);
  doc.rect(12, 12, pageW - 24, pageH - 24);

  // ── Corner flourishes (small L-shaped gold accents) ──
  const drawCorner = (x: number, y: number, dx: number, dy: number) => {
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setLineWidth(1.2);
    doc.line(x, y, x + 10 * dx, y);
    doc.line(x, y, x, y + 10 * dy);
  };
  drawCorner(18, 18, 1, 1);
  drawCorner(pageW - 18, 18, -1, 1);
  drawCorner(18, pageH - 18, 1, -1);
  drawCorner(pageW - 18, pageH - 18, -1, -1);

  // ── 1. Issuer branding (platform) — "ISSUED BY" + Internify logo, centered ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  drawTrackedCenter(doc, "ISSUED BY", cx, 23, 2);

  if (brandLogo) {
    const fit = containDimensions(brandLogo.naturalWidth, brandLogo.naturalHeight, 40, 19);
    doc.addImage(brandLogo.dataUrl, brandLogo.format, cx - fit.width / 2, 27, fit.width, fit.height);
  } else {
    // Fallback to a wordmark if the logo asset can't be loaded.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text("Internify", cx, 40, { align: "center" });
  }

  // ── 2. Title ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(29);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  drawTrackedCenter(doc, "CERTIFICATE OF COMPLETION", cx, 60, 0.5);

  // Divider under title — gold line with diamond end-caps.
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(1);
  doc.line(cx - 42, 66, cx + 42, 66);
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  [cx - 46, cx + 46].forEach((dx) => {
    doc.triangle(dx, 64, dx + 2, 66, dx, 68, "F");
    doc.triangle(dx, 64, dx - 2, 66, dx, 68, "F");
  });

  // ── 3. Recipient ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text("This certificate is proudly presented to", cx, 80, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.text(studentName, cx, 95, { align: "center" });

  // Underline sized to the name.
  const nameWidth = doc.getTextWidth(studentName);
  const underlineHalf = Math.min(Math.max(nameWidth / 2 + 6, 30), 110);
  doc.setDrawColor(INK[0], INK[1], INK[2]);
  doc.setLineWidth(0.4);
  doc.line(cx - underlineHalf, 100, cx + underlineHalf, 100);

  // ── 4. Achievement sentence (task + date) ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  const sentence = `For successfully completing the "${taskTitle}" task on ${dateStr}.`;
  const sentenceLines = doc.splitTextToSize(sentence, pageW - 100);
  let cursorY = 111;
  sentenceLines.forEach((line: string) => {
    doc.text(line, cx, cursorY, { align: "center" });
    cursorY += 7;
  });

  // ── 5. Employer field — "Task posted by [Employer]" + logo ──
  const employerLabelY = cursorY + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  drawTrackedCenter(doc, "TASK POSTED BY", cx, employerLabelY, 1.5);

  // Measure employer name to center logo + name together.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const employerNameWidth = doc.getTextWidth(employerName);

  let logoW = 0;
  let logoH = 0;
  if (logo) {
    const fit = containDimensions(logo.naturalWidth, logo.naturalHeight, 16, 11);
    logoW = fit.width;
    logoH = fit.height;
  }

  const gap = logo ? 5 : 0;
  const groupWidth = logoW + gap + employerNameWidth;
  const groupStartX = cx - groupWidth / 2;
  const rowY = employerLabelY + 9;

  if (logo) {
    try {
      doc.addImage(
        logo.dataUrl,
        logo.format,
        groupStartX,
        rowY - logoH / 2,
        logoW,
        logoH,
      );
    } catch {
      // If the logo fails to render, the name alone still reads correctly.
    }
  }
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(employerName, groupStartX + logoW + gap, rowY, { baseline: "middle" });

  // ── 6. Footer: Score medallion + verdict (left, side-by-side)  |  signature (right) ──
  const footerCY = pageH - 40;

  // Left: medallion with the score label/verdict beside it (a row, not a column).
  const medR = 12;
  const medCX = 46;
  drawScoreSeal(doc, medCX, footerCY, medR, finalScore, scoreColor);

  const labelX = medCX + medR + medR * 0.26 + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text("FINAL SCORE", labelX, footerCY - 1.5, { charSpace: 1, baseline: "alphabetic" });
  doc.setFontSize(15);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(getScoreLabel(finalScore), labelX, footerCY + 6, { baseline: "alphabetic" });

  // Right: Internify issuer signature block.
  const signX = pageW - 56;
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(20);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Internify", signX, footerCY, { align: "center" });
  doc.setDrawColor(INK[0], INK[1], INK[2]);
  doc.setLineWidth(0.4);
  doc.line(signX - 28, footerCY + 5, signX + 28, footerCY + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  drawTrackedCenter(doc, "ISSUING PLATFORM", signX, footerCY + 10, 1);

  // ── 7. Verification: label above the rule, ID below — centered ──
  // Anchored high enough that the last line (verify URL) clears the inner
  // frame (bottom edge at pageH - 12); otherwise it overlaps the borders.
  const certIdY = pageH - 31;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  drawTrackedCenter(doc, "CERTIFICATE ID", cx, certIdY, 1.5);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.5);
  doc.line(cx - 28, certIdY + 2.5, cx + 28, certIdY + 2.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  drawTrackedCenter(doc, displayCertId, cx, certIdY + 9, 0.8);

  // Where to verify this ID. Keeps the certificate self-describing: anyone
  // holding it knows exactly where to confirm authenticity.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  drawTrackedCenter(
    doc,
    "VERIFY AT INTERNIFY-ONE.VERCEL.APP/VERIFY",
    cx,
    certIdY + 13,
    0.8,
  );

  return doc;
}

/**
 * Builds and immediately downloads the certificate PDF.
 */
export async function generateCertificatePDF(data: CertificateData): Promise<void> {
  const doc = await buildCertificatePDF(data);
  doc.save(certificateFileName(data));
}

/**
 * Builds the certificate and returns the raw PDF bytes. Used to render a visual
 * preview (e.g. via pdf.js → canvas) without triggering a browser download —
 * embedding a blob PDF in an <iframe> downloads it in many browsers.
 */
export async function getCertificatePdfBytes(
  data: CertificateData,
): Promise<ArrayBuffer> {
  const doc = await buildCertificatePDF(data);
  return doc.output("arraybuffer");
}
