// src/lib/card-utils.ts
import { generateQrDataUrl } from './qr-utils';
import type { Registration } from './types';

/**
 * Generates a styled card image with QR code, similar to PDF format
 * Returns a data URL of the card image
 */
export const generateQrCard = async (registration: Registration): Promise<string> => {
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  // Card dimensions (match PDF proportions but larger for better quality)
  const cardWidth = 300;
  const cardHeight = 400;
  const padding = 20;
  const qrSize = 150;

  canvas.width = cardWidth;
  canvas.height = cardHeight;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Card border
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, cardWidth - 10, cardHeight - 10);

  // Set font properties
  ctx.textAlign = 'center';
  ctx.fillStyle = '#333333';

  // Title "NBC 2025"
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillStyle = '#2c5aa0';
  ctx.fillText('NBC 2025', cardWidth / 2, 45);

  // Generate and draw QR code
  const qrDataUrl = await generateQrDataUrl(registration);
  
  return new Promise((resolve, reject) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      try {
        // Draw QR code
        const qrX = (cardWidth - qrSize) / 2;
        const qrY = 70;
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // Camper name
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 18px Arial, sans-serif';
        const fullName = `${registration.last_name} ${registration.surname} ${registration.middle_name}`.trim();
        
        // Handle long names by wrapping text
        const maxWidth = cardWidth - (padding * 2);
        const nameY = qrY + qrSize + 35;
        
        if (ctx.measureText(fullName).width > maxWidth) {
          // Split name if too long
          const words = fullName.split(' ');
          let line1 = '';
          let line2 = '';
          
          for (let i = 0; i < words.length; i++) {
            const testLine = line1 + words[i] + ' ';
            if (ctx.measureText(testLine).width > maxWidth && line1 !== '') {
              line2 = words.slice(i).join(' ');
              break;
            }
            line1 = testLine;
          }
          
          ctx.fillText(line1.trim(), cardWidth / 2, nameY);
          if (line2) {
            ctx.fillText(line2, cardWidth / 2, nameY + 25);
          }
        } else {
          ctx.fillText(fullName, cardWidth / 2, nameY);
        }

        // Camper code
        ctx.font = '16px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        const codeY = fullName.length > 20 ? nameY + 50 : nameY + 30;
        ctx.fillText(`Code: ${registration.camper_code || registration.id}`, cardWidth / 2, codeY);

        // Category
        ctx.fillText('Category: Camper', cardWidth / 2, codeY + 25);

        // Add some decorative elements
        ctx.fillStyle = '#2c5aa0';
        ctx.fillRect(padding, cardHeight - 15, cardWidth - (padding * 2), 3);

        // Return the canvas as data URL
        resolve(canvas.toDataURL('image/png'));
        
      } catch (error) {
        reject(error);
      }
    };
    
    qrImg.onerror = () => {
      reject(new Error('Failed to load QR code image'));
    };
    
    qrImg.src = qrDataUrl;
  });
};

/**
 * Converts a data URL to base64 string (removes the data:image/png;base64, prefix)
 */
export const dataUrlToBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};
