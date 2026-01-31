'use client';

import React, { useState } from 'react';
import { Card, Input, Button, Badge, Alert } from '@belizechain/shared';
import {
  ArrowLeft,
  UserCircle,
  Camera,
  Copy,
  CheckCircle,
  ShieldCheck,
  IdentificationCard,
  Phone,
  EnvelopeSimple,
  Buildings,
  Clock,
} from 'phosphor-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@belizechain.gov.bz');
  const [phone, setPhone] = useState('+501 223-4567');
  const [department, setDepartment] = useState('Treasury Department');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const adminAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(adminAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-bluehole-600 to-bluehole-800 px-4 pt-6 pb-8">
        <div className="flex items-center space-x-4">
          <Link href="/settings" className="text-white hover:text-bluehole-100 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Administrator Profile</h1>
            <p className="text-bluehole-100 text-sm">Manage your government account</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto -mt-4">
        {showSuccess && (
          <Alert variant="success" title="Profile Updated" onClose={() => setShowSuccess(false)}>
            Your administrator profile has been saved successfully.
          </Alert>
        )}

        {/* Profile Picture & Role */}
        <Card>
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-bluehole-400 to-bluehole-600 flex items-center justify-center">
                <UserCircle size={48} weight="fill" className="text-white" />
              </div>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-jungle-500 hover:bg-jungle-600 flex items-center justify-center shadow-lg transition-colors">
                <Camera size={16} className="text-white" />
              </button>
            </div>
            <div className="text-center mt-4">
              <h2 className="text-xl font-bold text-sand-900">{name}</h2>
              <p className="text-sm text-sand-600 mt-1">{department}</p>
              <div className="flex items-center justify-center space-x-2 mt-3">
                <Badge variant="info">
                  <ShieldCheck size={12} className="mr-1" />
                  Admin
                </Badge>
                <Badge variant="success">
                  <CheckCircle size={12} className="mr-1" />
                  Authorized Signer
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Government Account Address */}
        <Card>
          <h3 className="font-semibold text-sand-900 mb-3 flex items-center">
            <IdentificationCard size={20} className="mr-2 text-sand-600" />
            Government Account Address
          </h3>
          <div className="bg-sand-50 rounded-lg p-3 flex items-center justify-between">
            <code className="text-sm font-mono text-sand-700 flex-1 break-all">
              {adminAddress}
            </code>
            <button
              onClick={handleCopyAddress}
              className="ml-3 text-bluehole-500 hover:text-bluehole-600 transition-colors"
            >
              {copied ? (
                <CheckCircle size={20} weight="fill" />
              ) : (
                <Copy size={20} />
              )}
            </button>
          </div>
          <p className="text-xs text-sand-600 mt-2">
            This address has multi-signature authorization for treasury operations
          </p>
        </Card>

        {/* Contact Information */}
        <Card>
          <h3 className="font-semibold text-sand-900 mb-4">Contact Information</h3>
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
              placeholder="your.email@belizechain.gov.bz"
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

        {/* Department & Role */}
        <Card>
          <h3 className="font-semibold text-sand-900 mb-4 flex items-center">
            <Buildings size={20} className="mr-2 text-sand-600" />
            Government Department
          </h3>
          <div className="space-y-4">
            <Input
              label="Department"
              value={department}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepartment(e.target.value)}
              placeholder="Your department name"
            />
            <div>
              <Input
                label="Role"
                value="Treasury Administrator"
                disabled
              />
              <p className="mt-1 text-xs text-sand-600">Your role is managed by system administrators</p>
            </div>
            <div>
              <Input
                label="Clearance Level"
                value="Level 4 - Treasury Operations"
                disabled
              />
              <p className="mt-1 text-xs text-sand-600">Required clearance for multi-signature approvals</p>
            </div>
          </div>
        </Card>

        {/* Authorization Status */}
        <Card className="bg-jungle-50 border-jungle-200">
          <div className="flex items-start space-x-3">
            <ShieldCheck size={24} className="text-jungle-600 mt-0.5" weight="fill" />
            <div className="flex-1">
              <h3 className="font-semibold text-jungle-900 mb-1">Multi-Signature Authorization</h3>
              <p className="text-sm text-jungle-700 mb-3">
                You are an authorized signer for government treasury operations requiring 4 of 7 approvals.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-jungle-200">
                  <p className="text-xs text-sand-600 mb-1">Total Transactions</p>
                  <p className="text-lg font-bold text-sand-900">247</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-jungle-200">
                  <p className="text-xs text-sand-600 mb-1">Pending Approvals</p>
                  <p className="text-lg font-bold text-sand-900">3</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-jungle-200">
                  <p className="text-xs text-sand-600 mb-1">Your Approvals</p>
                  <p className="text-lg font-bold text-sand-900">189</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-jungle-200">
                  <p className="text-xs text-sand-600 mb-1">Response Time</p>
                  <p className="text-lg font-bold text-sand-900">2.4h</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Activity */}
        <Card>
          <h3 className="font-semibold text-sand-900 mb-4 flex items-center">
            <Clock size={20} className="mr-2 text-sand-600" />
            Account Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-sand-200">
              <div>
                <p className="text-sm font-medium text-sand-900">Last Login</p>
                <p className="text-xs text-sand-600">October 15, 2025 at 9:42 AM</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-sand-200">
              <div>
                <p className="text-sm font-medium text-sand-900">Account Created</p>
                <p className="text-xs text-sand-600">January 5, 2025</p>
              </div>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-sand-200">
              <div>
                <p className="text-sm font-medium text-sand-900">Last Password Change</p>
                <p className="text-xs text-sand-600">September 1, 2025</p>
              </div>
              <Link href="/security/change-password">
                <Button variant="outline" size="sm">Change</Button>
              </Link>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-sand-900">Two-Factor Authentication</p>
                <p className="text-xs text-sand-600">Enabled via authenticator app</p>
              </div>
              <Badge variant="success">
                <CheckCircle size={12} className="mr-1" />
                Enabled
              </Badge>
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

        {/* Additional Links */}
        <div className="text-center text-sm text-sand-600 pt-4 space-y-2">
          <div className="flex justify-center space-x-4">
            <Link href="/audit-log" className="hover:text-bluehole-600">View Audit Log</Link>
            <Link href="/permissions" className="hover:text-bluehole-600">Manage Permissions</Link>
            <Link href="/support" className="hover:text-bluehole-600">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
