'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Scan, CameraRotate, CheckCircle, XCircle } from 'phosphor-react';
import Link from 'next/link';

export default function ScannerPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-caribbean-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-2xl font-bold">QR Scanner</h1>
        </div>
        <p className="text-white/90 text-sm ml-12">Scan payment QR codes or merchant verification</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Scanner View */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-6 space-y-4">
          <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden">
            {!scanning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Scan size={64} className="text-white/50" weight="thin" />
                <p className="text-white/70 text-center px-4">
                  Tap button below to start scanning
                </p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Scanning overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-caribbean-400 rounded-xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="flex-1 bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Scan size={24} weight="bold" />
                Start Scanner
              </button>
            ) : (
              <>
                <button
                  onClick={stopScanner}
                  className="flex-1 bg-gray-600 text-white py-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                  Stop
                </button>
                <button className="px-6 bg-gray-800 border-2 border-caribbean-500 text-caribbean-400 py-4 rounded-xl font-semibold hover:bg-caribbean-50 transition-colors">
                  <CameraRotate size={24} weight="bold" />
                </button>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-200 rounded-xl">
              <XCircle size={24} className="text-red-500 flex-shrink-0" weight="fill" />
              <div className="flex-1">
                <p className="text-red-900 font-medium">Scanner Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Scanned Data */}
          {scannedData && (
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-200 rounded-xl">
              <CheckCircle size={24} className="text-green-500 flex-shrink-0" weight="fill" />
              <div className="flex-1">
                <p className="text-green-900 font-medium">QR Code Detected</p>
                <p className="text-green-700 text-sm mt-1 font-mono break-all">{scannedData}</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong>Payment QR:</strong> Scan to auto-fill payment details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong>Merchant Verification:</strong> Verify Oracle-registered merchants</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong>Tourism Rewards:</strong> Scan at participating merchants for cashback</span>
            </li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/wallet/receive" className="bg-gray-800 p-4 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
            <p className="font-semibold text-white">Show My QR</p>
            <p className="text-sm text-gray-400 mt-1">Receive payments</p>
          </Link>
          <Link href="/send" className="bg-gray-800 p-4 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
            <p className="font-semibold text-white">Send Payment</p>
            <p className="text-sm text-gray-400 mt-1">Manual entry</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
