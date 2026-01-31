'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as identityService from '@/services/pallets/identity';
import {
  IdentificationCard,
  ShieldCheck,
  Fingerprint,
  QrCode,
  Warning,
  CheckCircle,
  Clock,
  CaretRight,
  Plus,
  Download,
  Share,
  Copy,
  Link as LinkIcon,
  ArrowLeft
} from 'phosphor-react';

export default function BelizeIDPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'accounts'>('overview');
  const [belizeId, setBelizeId] = useState<identityService.BelizeID | null>(null);
  const [ssnRecord, setSsnRecord] = useState<identityService.SSNRecord | null>(null);
  const [passportRecord, setPassportRecord] = useState<identityService.PassportRecord | null>(null);
  const [kycStatus, setKycStatus] = useState<identityService.KYCStatus | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<Array<{label: string; address: string; isPrimary: boolean}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch identity data from blockchain
  useEffect(() => {
    async function fetchIdentityData() {
      if (!selectedAccount) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const [idData, ssnData, passportData, kycData] = await Promise.all([
          identityService.getBelizeID(selectedAccount.address),
          identityService.getSSNRecord(selectedAccount.address),
          identityService.getPassportRecord(selectedAccount.address),
          identityService.getKYCStatus(selectedAccount.address)
        ]);
        
        setBelizeId(idData);
        setSsnRecord(ssnData);
        setPassportRecord(passportData);
        setKycStatus(kycData);
      } catch (err: any) {
        console.error('Failed to fetch identity data:', err);
        setError(err.message || 'Unable to load identity data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchIdentityData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchIdentityData, 30000);
    return () => clearInterval(interval);
  }, [selectedAccount]);

  // Get KYC badge based on level
  const getKycBadge = (level: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      'None': { label: 'No KYC', color: 'bg-gray-200 text-gray-400' },
      'Basic': { label: 'L1 - Basic', color: 'bg-blue-500/20 text-blue-400' },
      'Enhanced': { label: 'L2 - Enhanced', color: 'bg-emerald-500/20 text-emerald-400' },
      'Full': { label: 'L3 - Full', color: 'bg-amber-500/20 text-amber-400' }
    };
    return badges[level] || badges['None'];
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner message="Loading BelizeID from blockchain..." fullScreen />;
  }

  // Show connect wallet prompt
  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your wallet to view your BelizeID" fullScreen />;
  }

  // Show error state
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} fullScreen />;
  }

  const kycBadge = kycStatus ? getKycBadge(kycStatus.level) : getKycBadge('None');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">BelizeID</h1>
              <p className="text-xs text-gray-400">Your Sovereign Digital Identity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full ${kycBadge.color} font-semibold text-sm`}>
              {kycBadge.label}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <IdentificationCard size={20} className="text-white" weight="fill" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* No Identity - Registration Prompt */}
        {!belizeId && (
          <GlassCard variant="dark-medium" blur="lg" className="p-8 text-center">
            <IdentificationCard size={64} className="mx-auto mb-4 text-gray-500" weight="duotone" />
            <h3 className="text-lg font-bold text-white mb-2">No BelizeID Found</h3>
            <p className="text-gray-400 text-sm mb-6">
              Register your BelizeID to access government services and verify your identity on-chain
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
              <Plus size={20} weight="bold" />
              Register BelizeID
            </button>
          </GlassCard>
        )}

        {/* Identity Card */}
        {belizeId && (
          <>
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold">
                    {belizeId.firstName.charAt(0)}{belizeId.lastName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {belizeId.firstName} {belizeId.middleName ? belizeId.middleName + ' ' : ''}{belizeId.lastName}
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">{belizeId.nationality}</p>
                    <p className="text-xs text-gray-500">{belizeId.district} District</p>
                  </div>
                </div>
                <QrCode size={48} className="text-blue-400" weight="fill" />
              </div>

              {/* Verification Status */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="flex items-center space-x-2">
                  {belizeId.ssnVerified ? (
                    <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                  ) : (
                    <Warning size={20} className="text-amber-400" weight="fill" />
                  )}
                  <span className="text-xs font-medium text-gray-300">SSN</span>
                </div>
                <div className="flex items-center space-x-2">
                  {belizeId.passportVerified ? (
                    <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                  ) : (
                    <Warning size={20} className="text-amber-400" weight="fill" />
                  )}
                  <span className="text-xs font-medium text-gray-300">Passport</span>
                </div>
                <div className="flex items-center space-x-2">
                  {kycStatus && kycStatus.status === 'Verified' ? (
                    <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                  ) : (
                    <Clock size={20} className="text-gray-400" weight="fill" />
                  )}
                  <span className="text-xs font-medium text-gray-300">KYC</span>
                </div>
              </div>

              {/* DID */}
              <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-400 mb-1">Decentralized Identifier (DID)</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-white truncate flex-1">did:belize:{belizeId.id}</p>
                  <button className="ml-2 p-1.5 hover:bg-gray-700/50 rounded transition-colors">
                    <Copy size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400">Date of Birth</p>
                  <p className="text-sm font-semibold text-white">{belizeId.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Registration Date</p>
                  <p className="text-sm font-semibold text-white">{formatDate(belizeId.registrationDate)}</p>
                </div>
              </div>

              {/* Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Valid Until</p>
                  <p className="text-sm font-semibold text-white">{formatDate(belizeId.expiryDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">KYC Status</p>
                  <p className={`text-sm font-semibold ${
                    belizeId.kycStatus === 'Verified' ? 'text-emerald-400' :
                    belizeId.kycStatus === 'Pending' ? 'text-amber-400' :
                    belizeId.kycStatus === 'Rejected' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {belizeId.kycStatus}
                  </p>
                </div>
              </div>

              {/* Transaction Limits (from KYC) */}
              {kycStatus && kycStatus.level !== 'None' && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Transaction Limits</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Daily</p>
                      <p className="text-sm font-semibold text-white">{kycStatus.limits.dailyTransfer} DALLA</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly</p>
                      <p className="text-sm font-semibold text-white">{kycStatus.limits.monthlyTransfer} DALLA</p>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center justify-center p-4 bg-gray-800/50 border border-gray-700/30 rounded-xl shadow-sm hover:bg-gray-800/70 transition-all">
                <Share size={24} className="text-blue-400 mb-2" weight="fill" />
                <span className="text-xs font-medium text-white">Share</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-gray-800/50 border border-gray-700/30 rounded-xl shadow-sm hover:bg-gray-800/70 transition-all">
                <Download size={24} className="text-emerald-400 mb-2" weight="fill" />
                <span className="text-xs font-medium text-white">Export</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-gray-800/50 border border-gray-700/30 rounded-xl shadow-sm hover:bg-gray-800/70 transition-all">
                <QrCode size={24} className="text-purple-400 mb-2" weight="fill" />
                <span className="text-xs font-medium text-white">QR Code</span>
              </button>
            </div>
          </>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 bg-gray-800/50 rounded-xl p-1 shadow-sm border border-gray-700/30">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'credentials'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Credentials
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'accounts'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Accounts
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* KYC Levels */}
            <GlassCard variant="dark" blur="sm" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">KYC Verification Levels</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={24} className="text-blue-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Level 1 - Basic</p>
                      <p className="text-xs text-gray-400">SSN Verification</p>
                    </div>
                  </div>
                  <ShieldCheck size={20} className="text-blue-400" weight="fill" />
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={24} className="text-emerald-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Level 2 - Standard</p>
                      <p className="text-xs text-gray-400">SSN + Passport</p>
                    </div>
                  </div>
                  <ShieldCheck size={20} className="text-emerald-400" weight="fill" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-200 rounded-lg opacity-60">
                  <div className="flex items-center space-x-3">
                    <Clock size={24} className="text-gray-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Level 3 - Enhanced</p>
                      <p className="text-xs text-gray-400">All + Biometrics</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-blue-400 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                    Upgrade
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Benefits */}
            <GlassCard variant="dark" blur="sm" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Current Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="font-medium text-white">Property Transactions</p>
                    <p className="text-xs text-gray-400">Buy and sell land on LandLedger</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="font-medium text-white">Payroll Services</p>
                    <p className="text-xs text-gray-400">Receive automated salary payments</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="font-medium text-white">Cross-Chain Bridges</p>
                    <p className="text-xs text-gray-400">Transfer assets to Ethereum/Polkadot</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'credentials' && belizeId && (
          <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-700">
            {/* SSN Credential */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <IdentificationCard size={24} weight="fill" className="text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">SSN</h4>
                    <p className="text-xs text-gray-400">Social Security Board</p>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  belizeId.ssnVerified
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {belizeId.ssnVerified ? 'Verified' : 'Pending'}
                </div>
              </div>

              {ssnRecord ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">SSN Number</p>
                    <p className="font-medium text-white">***-**-{ssnRecord.ssn.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Verified Date</p>
                    <p className="font-medium text-white">
                      {ssnRecord.verificationDate ? formatDate(ssnRecord.verificationDate) : '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  <button className="mt-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-semibold hover:bg-blue-500/30">
                    Submit SSN for Verification
                  </button>
                </div>
              )}
            </div>

            {/* Passport Credential */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <IdentificationCard size={24} weight="fill" className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Passport</h4>
                    <p className="text-xs text-gray-400">Immigration Department</p>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  belizeId.passportVerified
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {belizeId.passportVerified ? 'Verified' : 'Pending'}
                </div>
              </div>

              {passportRecord ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">Passport Number</p>
                    <p className="font-medium text-white">{passportRecord.passportNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Issuing Country</p>
                    <p className="font-medium text-white">{passportRecord.issuingCountry}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Issue Date</p>
                    <p className="font-medium text-white">{formatDate(passportRecord.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Expiry Date</p>
                    <p className="font-medium text-white">{formatDate(passportRecord.expiryDate)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  <button className="mt-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg font-semibold hover:bg-emerald-500/30">
                    Submit Passport for Verification
                  </button>
                </div>
              )}
            </div>

            {/* KYC Credential */}
            {kycStatus && kycStatus.level !== 'None' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <ShieldCheck size={24} weight="fill" className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">KYC {kycStatus.level}</h4>
                      <p className="text-xs text-gray-400">Compliance Department</p>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    kycStatus.status === 'Verified'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : kycStatus.status === 'Pending'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {kycStatus.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">KYC Level</p>
                    <p className="font-medium text-white">{kycStatus.level}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Verified Date</p>
                    <p className="font-medium text-white">
                      {kycStatus.verificationDate ? formatDate(kycStatus.verificationDate) : '-'}
                    </p>
                  </div>
                </div>

                {kycStatus.documents.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-2">Verified Documents</p>
                    <div className="space-y-1">
                      {kycStatus.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                          <CheckCircle size={14} className="text-emerald-400" weight="fill" />
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        )}

        {/* Credentials Section */}
        {activeTab === 'credentials' && (
          <GlassCard variant="dark-medium" blur="lg" className="space-y-4">
            <div className="p-4">
              <h3 className="font-semibold text-white mb-4">Verifiable Credentials</h3>
              <p className="text-sm text-gray-400">Manage your digital credentials and attestations.</p>
            </div>

            <div className="p-4">
              <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center space-x-2 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
                <Plus size={20} weight="bold" />
                <span className="font-medium">Add Credential</span>
              </button>
            </div>
          </GlassCard>
        )}

        {activeTab === 'accounts' && (
          <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
            {linkedAccounts.map((account, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-white">{account.label}</p>
                    {account.isPrimary && (
                      <span className="px-2 py-0.5 bg-blue-500/100/20 text-blue-400 text-xs rounded-full font-semibold">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-gray-400">{account.address}</p>
                </div>
                <button>
                  <CaretRight size={18} className="text-gray-400" weight="bold" />
                </button>
              </div>
            ))}

            <div className="p-4">
              <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center space-x-2 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
                <Plus size={20} weight="bold" />
                <span className="font-medium">Link Account</span>
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Maximum {linkedAccounts.length} of 5 accounts linked
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  </div>
  );
}
