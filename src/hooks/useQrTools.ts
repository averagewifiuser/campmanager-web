// src/hooks/useQrTools.ts
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateQrPdf, estimatePdfPages } from '@/lib/pdf-utils';
import { generateQrDataUrl, dataUrlToBlob, getRegistrationDisplayName } from '@/lib/qr-utils';
import { generateQrCard, dataUrlToBase64 } from '@/lib/card-utils';
import api from '@/lib/api';
import type { Registration } from '@/lib/types';


//@ts-ignore
interface EmailQrRequest {
  registrations: Registration[];
}

interface EmailQrPayload {
  to: string;
  subject: string;
  name: string;
  camperCode: string;
  qrBase64: string;
}

export const useQrTools = () => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');

  // PDF Generation
  const generatePdf = async (selectedRegistrations: Registration[]) => {
    if (selectedRegistrations.length === 0) {
      throw new Error('No registrations selected');
    }

    setIsGeneratingPdf(true);
    setPdfProgress('Preparing PDF generation...');

    try {
      const estimatedPages = estimatePdfPages(selectedRegistrations.length);
      setPdfProgress(`Generating ${selectedRegistrations.length} QR codes (${estimatedPages} page${estimatedPages > 1 ? 's' : ''})...`);

      await generateQrPdf(selectedRegistrations);
      
      setPdfProgress('PDF generated successfully!');
      
      // Clear progress after a delay
      setTimeout(() => {
        setPdfProgress('');
        setIsGeneratingPdf(false);
      }, 2000);

    } catch (error) {
      console.error('PDF generation failed:', error);
      setPdfProgress('PDF generation failed');
      
      setTimeout(() => {
        setPdfProgress('');
        setIsGeneratingPdf(false);
      }, 3000);
      
      throw error;
    }
  };

  // Email sending mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (payload: EmailQrPayload) => {
      const response = await api.post('/camps/send-email', payload);
      return response.data;
    },
  });

  // Email QR codes to selected registrations
  const sendEmails = async (selectedRegistrations: Registration[]) => {
    if (selectedRegistrations.length === 0) {
      throw new Error('No registrations selected');
    }

    // Filter out registrations without email addresses
    const validRegistrations = selectedRegistrations.filter(reg => reg.email && reg.email.trim() !== '');
    
    if (validRegistrations.length === 0) {
      throw new Error('No registrations with valid email addresses found');
    }

    if (validRegistrations.length !== selectedRegistrations.length) {
      const skipped = selectedRegistrations.length - validRegistrations.length;
      console.warn(`Skipping ${skipped} registration(s) without email addresses`);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each registration
    for (const registration of validRegistrations) {
      try {
        // Generate QR card (styled like PDF cards)
        const cardDataUrl = await generateQrCard(registration);
        
        // Extract base64 data (remove data:image/png;base64, prefix)
        const cardBase64 = dataUrlToBase64(cardDataUrl);
        
        const payload: EmailQrPayload = {
          to: registration.email!,
          subject: 'Your Camper QR Code',
          name: getRegistrationDisplayName(registration),
          camperCode: registration.camper_code || registration.id,
          qrBase64: cardBase64
        };

        await sendEmailMutation.mutateAsync(payload);
        results.success++;

      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${getRegistrationDisplayName(registration)}: ${errorMsg}`);
        console.error(`Failed to send email to ${registration.email}:`, error);
      }
    }

    return results;
  };

  // Generate individual QR code data URL
  const generateQrCode = async (registration: Registration): Promise<string> => {
    try {
      return await generateQrDataUrl(registration);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  };

  // Download individual QR code as PNG
  const downloadQrCode = async (registration: Registration) => {
    try {
      const qrDataUrl = await generateQrDataUrl(registration);
      const blob = dataUrlToBlob(qrDataUrl);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr_${registration.camper_code || registration.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to download QR code:', error);
      throw error;
    }
  };

  return {
    // PDF Generation
    generatePdf,
    isGeneratingPdf,
    pdfProgress,
    estimatePdfPages,
    
    // Email Functionality
    sendEmails,
    isEmailLoading: sendEmailMutation.isPending,
    emailError: sendEmailMutation.error,
    
    // Individual QR Operations
    generateQrCode,
    downloadQrCode,
  };
};

export type QrToolsResult = ReturnType<typeof useQrTools>;
