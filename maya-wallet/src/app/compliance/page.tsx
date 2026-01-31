'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, IdentificationCard, FileText, CheckCircle, Shield } from 'phosphor-react';
import { GlassCard } from '@/components/ui';

export default function CompliancePage() {
  const router = useRouter();

  const complianceLevel = 3;
  const kycStatus = 'verified';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Compliance & KYC</h1>
              <p className="text-xs text-gray-400">Identity verification and compliance status</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-amber-500/30">
              <div className="flex items-center space-x-1">
                <CheckCircle size={14} weight="fill" className="text-amber-400" />
                <span className="text-xs text-amber-400 font-semibold">Level {complianceLevel}</span>
              </div>
            </div>
            <Shield size={32} className="text-amber-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {/* KYC Status Card */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">KYC Verification</h2>
            <ShieldCheck size={32} className="text-green-500" weight="fill" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-200 rounded-xl">
              <CheckCircle size={24} className="text-green-500" weight="fill" />
              <div>
                <p className="font-semibold text-green-900">Verified</p>
                <p className="text-green-700 text-sm">Level {complianceLevel} Compliance</p>
              </div>
            </div>

            {/* Verification Steps */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-500" weight="fill" />
                <span className="text-gray-300">Identity document uploaded</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-500" weight="fill" />
                <span className="text-gray-300">Address verified</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-500" weight="fill" />
                <span className="text-gray-300">SSN/Passport validated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Limits */}
        <div className="bg-gray-800 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-white mb-3">Transaction Limits</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Daily limit</span>
              <span className="font-semibold text-white">Ɗ 25,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly limit</span>
              <span className="font-semibold text-white">Ɗ 500,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cross-border</span>
              <span className="font-semibold text-green-600">✓ Enabled</span>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-gray-800 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-white mb-3">Verified Documents</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <IdentificationCard size={20} className="text-caribbean-400" weight="bold" />
              <span className="text-gray-300 text-sm">National ID</span>
              <span className="ml-auto text-green-600 text-xs font-medium">✓ Verified</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText size={20} className="text-caribbean-400" weight="bold" />
              <span className="text-gray-300 text-sm">Proof of Address</span>
              <span className="ml-auto text-green-600 text-xs font-medium">✓ Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
