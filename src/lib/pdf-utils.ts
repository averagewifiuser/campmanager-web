// src/lib/pdf-utils.ts
import jsPDF from "jspdf";
import { generateQrDataUrl } from "./qr-utils";
import type { Registration } from "./types";

/**
 * Estimates the number of pages needed for a given number of registrations
 * Based on the current layout: 4 cards per row, with each card being 60mm tall
 */
export const estimatePdfPages = (registrationCount: number): number => {
  if (registrationCount === 0) return 0;
  
  const pageHeight = 297; // A4 height in mm
  const margin = 10;
  const cellHeight = 60;
  const cardsPerRow = 4;
  
  const availableHeight = pageHeight - (margin * 2);
  const rowsPerPage = Math.floor(availableHeight / cellHeight);
  const cardsPerPage = rowsPerPage * cardsPerRow;
  
  return Math.ceil(registrationCount / cardsPerPage);
};

/**
 * Generates a PDF with styled QR cards for selected registrations
 * Layout: 4 cards per row in A4 portrait, scaled down 50%
 */
export const generateQrPdf = async (
  registrations: Registration[]
): Promise<void> => {
  if (registrations.length === 0) {
    throw new Error("No registrations selected");
  }

  const pdf = new jsPDF("portrait", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Layout config (scaled down with padding)
  const margin = 10;
  const padding = 5;
  const cellWidth = (pageWidth - margin * 2) / 4; // 4 per row
  const cellHeight = 60; // was 120 → reduced
  const qrSize = 25;

  let currentCol = 0;
  let currentRow = 0;

  for (let i = 0; i < registrations.length; i++) {
    const reg = registrations[i];
    const x = margin + currentCol * cellWidth;
    const y = margin + currentRow * cellHeight;

    // Card area
    const cardX = x + padding;
    const cardY = y + padding;
    const cardW = cellWidth - padding * 2;
    //@ts-ignore
    const cardH = cellHeight - padding * 2;

    // Draw card border (optional)
    pdf.setDrawColor(200);
    pdf.rect(x, y, cellWidth, cellHeight);

    // Title (centered top)
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("NBC 2025", cardX + cardW / 2, cardY + 5, { align: "center" });

    // QR code
    const qrDataUrl = await generateQrDataUrl({
      id: reg.id,
      camper_code: reg.camper_code,
      name: reg.last_name + " " + reg.surname + " " + reg.middle_name,
    });

    const qrX = cardX + cardW / 2 - qrSize / 2;
    const qrY = cardY + 10;

    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // Camper name
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      reg.last_name + " " + reg.surname + " " + reg.middle_name,
      cardX + cardW / 2,
      qrY + qrSize + 6,
      { align: "center" }
    );

    // Camper code
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Code: ${reg.camper_code}`,
      cardX + cardW / 2,
      qrY + qrSize + 12,
      { align: "center" }
    );

    // Category
    pdf.setFontSize(6);
    pdf.text(
      `Category: Camper`,
      cardX + cardW / 2,
      qrY + qrSize + 18,
      { align: "center" }
    );

    // Update grid position
    currentCol++;
    if (currentCol >= 4) {
      currentCol = 0;
      currentRow++;
      if ((currentRow + 1) * cellHeight > pageHeight - margin) {
        pdf.addPage();
        currentRow = 0;
      }
    }
  }

  pdf.save(`camper-qr-cards-${new Date().toISOString().split("T")[0]}.pdf`);
};
