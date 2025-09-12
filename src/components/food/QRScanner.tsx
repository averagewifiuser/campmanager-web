import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start camera
  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setScanning(true);
      startScanning();
    } catch (err) {
      const errorMessage = 'Camera access denied or not available';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setScanning(false);
  };

  // Start scanning for QR codes
  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          //@ts-ignore
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Simple QR code detection simulation
          // In a real implementation, you would use a library like jsQR
          // For now, we'll simulate QR detection by looking for specific patterns
          const mockQRDetection = () => {
            // This is a mock - in reality you'd use jsQR or similar
            // For demo purposes, we'll randomly "detect" a QR code
            if (Math.random() > 0.95) { // 5% chance per scan
              const mockData = JSON.stringify({
                camper_id: `camper_${Date.now()}`,
                camper_code: `C${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                type: 'camper_identification'
              });
              onScan(mockData);
              stopCamera();
            }
          };
          
          mockQRDetection();
        }
      }
    }, 100); // Scan every 100ms
  };

  // Effect to handle active state changes
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="relative w-full">
      {error ? (
        <div className="aspect-square bg-red-50 rounded-lg flex items-center justify-center border-2 border-dashed border-red-300">
          <div className="text-center p-4">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button onClick={startCamera} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-1 bg-blue-500 animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {scanning ? 'Scanning...' : 'Camera Ready'}
          </div>
        </div>
      )}
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default QRScanner;
