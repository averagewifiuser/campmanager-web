import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { camperApi, campsApi, categoriesApi, handleApiError } from '../lib/api';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Download, User, Hash, Tag } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Registration } from '../lib/types';

export const CamperQRCodePage: React.FC = () => {
  const { camperId } = useParams<{ camperId: string }>();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get registration data
  const { data: registrationData, isLoading: isLoadingRegistration, error: registrationError } = useQuery<Registration>({
    queryKey: ['camper-qr-data', camperId],
    queryFn: () => camperApi.getCamperQRData(camperId!),
    enabled: !!camperId,
  });

  // Get camp data
  const { data: campData, isLoading: isLoadingCamp } = useQuery({
    queryKey: ['camp', registrationData?.camp_id],
    queryFn: () => campsApi.getCamp(registrationData!.camp_id),
    enabled: !!registrationData?.camp_id,
  });

  // Get categories to find category name
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', registrationData?.camp_id],
    queryFn: () => categoriesApi.getCategories(registrationData!.camp_id),
    enabled: !!registrationData?.camp_id,
  });

  const isLoading = isLoadingRegistration || isLoadingCamp || isLoadingCategories;
  const error = registrationError;

  // Get category name from categories data
  const categoryName = categories?.find(cat => cat.id === registrationData?.category_id)?.name || 'Unknown';

  useEffect(() => {
    if (registrationData) {
      generateQRCode();
    }
  }, [registrationData]);

  const generateQRCode = async () => {
    if (!registrationData) return;

    try {
      const qrData = {
        camperId: registrationData.id,
        camperCode: registrationData.camper_code,
        type: 'camper_identification'
      };

      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    }
  };

  const downloadPDF = async () => {
    if (!cardRef.current || !registrationData) return;

    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 150;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
      const y = 20;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      const fileName = `${registrationData.surname}_${registrationData.middle_name}_QR_Code.pdf`;
      pdf.save(fileName);

      toast({
        title: 'Success',
        description: 'QR code downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Camper Not Found
            </h2>
            <p className="text-gray-600">
              {handleApiError(error)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!registrationData) {
    return null;
  }

  const fullName = `${registrationData.surname} ${registrationData.middle_name} ${registrationData.last_name}`.trim();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* QR Code Card */}
        <Card ref={cardRef} className="bg-white shadow-lg">
          <CardContent className="p-8 text-center">
            {/* Camp Name Header */}
            <div className="mb-6">
              <h1 className="text-lg font-bold text-gray-900 mb-1">
                {campData?.name || 'Camp'}
              </h1>
              <div className="h-1 bg-blue-600 rounded mx-auto w-16"></div>
            </div>

            {/* QR Code */}
            <div className="mb-6">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Camper QR Code" 
                  className="mx-auto border-2 border-gray-200 rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              )}
            </div>

            {/* Camper Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">{fullName}</p>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <Hash className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Camper Code</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {registrationData.camper_code}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <Tag className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-semibold text-gray-900">
                    {categoryName}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Scan this QR code for Food Allocation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Download Button */}
        <div className="mt-6">
          <Button
            onClick={downloadPDF}
            disabled={isGeneratingPDF || !qrCodeDataUrl}
            className="w-full"
            size="lg"
          >
            {isGeneratingPDF ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download as PDF
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Save the PDF to your phone for easy access</li>
              <li>• Present this QR code during camp check-in</li>
              <li>• Keep the code secure and don't share with others</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CamperQRCodePage;
