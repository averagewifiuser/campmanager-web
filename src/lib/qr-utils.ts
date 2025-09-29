// src/lib/qr-utils.ts
import QRCode from 'qrcode';

export interface QrData {
  camperId: string;
  camperCode: string;
  type: 'camper_identification';
}

/**
 * Generates a QR code data URL (base64) for a given registration
 */
export const generateQrDataUrl = async (registration: {
  id: string;
  camper_code?: string;
  name?: string;
  category?: string;
}): Promise<string> => {
  const qrData: QrData = {
    camperId: registration.id,
    camperCode: registration.camper_code || registration.id,
    type: 'camper_identification'
  };

  const qrString = JSON.stringify(qrData);
  
  try {
    const dataUrl = await QRCode.toDataURL(qrString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generates a QR code as a canvas element for a given registration
 */
export const generateQrCanvas = async (registration: {
  id: string;
  camper_code?: string;
}): Promise<HTMLCanvasElement> => {
  const qrData: QrData = {
    camperId: registration.id,
    camperCode: registration.camper_code || registration.id,
    type: 'camper_identification'
  };

  const qrString = JSON.stringify(qrData);
  
  try {
    const canvas = await QRCode.toCanvas(qrString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return canvas;
  } catch (error) {
    console.error('Error generating QR canvas:', error);
    throw new Error('Failed to generate QR canvas');
  }
};

/**
 * Converts a data URL to a blob
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * Gets the display name for a registration
 */
export const getRegistrationDisplayName = (registration: {
  surname?: string;
  middle_name?: string;
  last_name?: string;
}): string => {
  return `${registration.surname || ''} ${registration.middle_name || ''} ${registration.last_name || ''}`.trim();
};
