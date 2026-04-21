/**
 * Extracts all text content from a PDF file.
 * Works client-side in the browser.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamically import pdfjs-dist to avoid SSR "DOMMatrix is not defined" error
  const pdfjsLib = await import("pdfjs-dist");
  
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

