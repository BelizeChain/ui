'use client';

import React, { useState } from 'react';
import { Card, Input, Button, Badge, Alert, useWallet, useI18n } from '@belizechain/shared';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import {
  ArrowLeft,
  UserCircle,
  Camera,
  Copy,
  CheckCircle,
  IdentificationCard,
  Phone,
  EnvelopeSimple,
  MapPin,
} from 'phosphor-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { selectedAccount } = useWallet();
  const { t } = useI18n();
  const account = selectedAccount as InjectedAccountWithMeta & { isVerified?: boolean };
  const [name, setName] = useState(account?.meta.name || '');
  const [email, setEmail] = useState('user@example.com');
  const [phone, setPhone] = useState('+501 123-4567');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCopyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <p className="text-gray-600">Please connect your wallet to view profile.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 z-10">
        <div className="flex items-center space-x-4">
          <Link href="/settings" className="text-white hover:text-gray-300 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-gray-400 text-sm">Manage your account information</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto -mt-4">
        {showSuccess && (
          <Alert variant="success" title="Profile Updated" onClose={() => setShowSuccess(false)}>
            Your profile information has been saved successfully.
          </Alert>
        )}

        {/* Profile Picture */}
        <Card>
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-maya-400 to-maya-600 flex items-center justify-center">
                <UserCircle size={48} weight="fill" className="text-white" />
              </div>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-caribbean-500 hover:bg-caribbean-600 flex items-center justify-center shadow-lg transition-colors">
                <Camera size={16} className="text-white" />
              </button>
            </div>
            <div className="text-center mt-4">
              <h2 className="text-xl font-bold text-gray-900">{name || 'User'}</h2>
              <div className="flex items-center justify-center space-x-2 mt-2">
                {account.isVerified && (
                  <Badge variant="success" className="flex items-center">
                    <CheckCircle size={12} className="mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="info">Citizen</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Wallet Address */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <IdentificationCard size={20} className="mr-2 text-gray-600" />
            Wallet Address
          </h3>
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <code className="text-sm font-mono text-gray-700 flex-1 break-all">
              {account.address}
            </code>
            <button
              onClick={handleCopyAddress}
              className="ml-3 text-caribbean-500 hover:text-caribbean-400 transition-colors"
            >
              {copied ? (
                <CheckCircle size={20} weight="fill" />
              ) : (
                <Copy size={20} />
              )}
            </button>
          </div>
        </Card>

        {/* Personal Information */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              placeholder="+501 XXX-XXXX"
            />
          </div>
        </Card>

        {/* Location */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin size={20} className="mr-2 text-gray-600" />
            Location
          </h3>
          <div className="space-y-4">
            <div>
              <Input
                label="District"
                value="Belize"
                disabled
              />
              <p className="mt-1 text-xs text-gray-600">Your district is determined by your KYC verification</p>
            </div>
            <Input
              label="City/Town"
              placeholder="Enter your city or town"
            />
          </div>
        </Card>

        {/* Verification Status */}
        <Card className={account.isVerified ? 'bg-jungle-50 border-jungle-200' : 'bg-yellow-50 border-yellow-200'}>
          <div className="flex items-start space-x-3">
            {account.isVerified ? (
              <>
                <CheckCircle size={24} className="text-jungle-600 mt-0.5" weight="fill" />
                <div className="flex-1">
                  <h3 className="font-semibold text-jungle-900 mb-1">Identity Verified</h3>
                  <p className="text-sm text-jungle-700">
                    Your identity has been verified. You have full access to all BelizeChain features.
                  </p>
                </div>
              </>
            ) : (
              <>
                <IdentificationCard size={24} className="text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">Verification Required</h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    Complete identity verification to unlock all features and increase transaction limits.
                  </p>
                  <Link href="/verification">
                    <Button variant="primary" size="sm">
                      Start Verification
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Account Stats */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Account Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">Member Since</p>
              <p className="text-lg font-bold text-gray-900">Jan 2025</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">Transactions</p>
              <p className="text-lg font-bold text-gray-900">142</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">Tourism Rewards</p>
              <p className="text-lg font-bold text-gray-900">$87.50</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">Governance Votes</p>
              <p className="text-lg font-bold text-gray-900">8</p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSaveProfile}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
