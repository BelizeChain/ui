'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { X, Camera, Warning } from 'phosphor-react';
import { walletLogger } from '@belizechain/shared';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);

      // Create QR code reader
      const codeReader = new BrowserQRCodeReader();
      readerRef.current = codeReader;

      // Get available video devices
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        setError('No camera found on this device');
        return;
      }

      // Use first camera (or back camera on mobile if available)
      const selectedDevice = videoInputDevices.find((device: any) => 
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0];

      // Start decoding from video device
      codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result: any, error: any) => {
          if (result) {
            walletLogger.debug('QR Code scanned', { data: result.getText() });
            onScan(result.getText());
            stopScanning();
          }
          if (error) {
            // Ignore NotFoundExceptions - they're expected when no QR code is in view
            if (error.name !== 'NotFoundException') {
              walletLogger.error('QR scan error', error);
            }
          }
        }
      );
    } catch (err) {
      walletLogger.error('Failed to start scanning', err);
      setError('Failed to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      // Clean up the reader (no reset method in newer versions)
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div>
          <h2 className="text-xl font-bold">Scan QR Code</h2>
          <p className="text-sm text-white/70">Point camera at recipient's QR code</p>
        </div>
        <button
          onClick={() => {
            stopScanning();
            onClose();
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={24} weight="bold" />
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center">
            <Warning size={64} className="text-red-500 mx-auto mb-4" weight="duotone" />
            <p className="text-white font-medium mb-2">{error}</p>
            <button
              onClick={startScanning}
              className="px-4 py-2 bg-caribbean-500 text-white rounded-lg hover:bg-caribbean-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="relative max-w-lg w-full aspect-square">
            {/* Video element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover rounded-xl"
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-caribbean-500" />
              <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-caribbean-500" />
              <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-caribbean-500" />
              <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-caribbean-500" />
              
              {/* Center guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-white/50 rounded-lg" />
              </div>
            </div>

            {/* Scanning indicator */}
            {isScanning && (
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                <div className="px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-2">
                  <Camera size={16} weight="fill" />
                  <span>Scanning...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 text-center text-white/70 text-sm">
        <p>Position the QR code within the frame</p>
        <p className="mt-1">Supported formats: belizechain://, substrate://, or plain address</p>
      </div>
    </div>
  );
}
