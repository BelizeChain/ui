'use client';

import React, { useState } from 'react';
import { Button } from '@belizechain/shared';
import { GlassCard } from '@/components/ui/glass-card';
import {
  ArrowLeft,
  ShieldCheck,
  Bell,
  Monitor,
  Key,
  Database,
  Clock,
  SignOut,
  CheckCircle,
} from 'phosphor-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Custom dark-themed components
const DarkSwitch = ({ 
  checked, 
  onCheckedChange, 
  label, 
  description, 
  disabled = false 
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1">
      {label && <label className="block text-sm font-medium text-white mb-1">{label}</label>}
      {description && <p className="text-sm text-gray-400">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
        checked ? 'bg-blue-500' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  </div>
);

const DarkSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  helperText 
}: {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  helperText?: string;
}) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-white mb-2">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="flex h-11 w-full rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2 text-sm text-white ring-offset-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-700/50 transition-colors"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-gray-800 text-white">
          {option.label}
        </option>
      ))}
    </select>
    {helperText && <p className="mt-2 text-sm text-gray-400">{helperText}</p>}
  </div>
);

export default function SettingsPage() {
  const router = useRouter();
  
  // Notification Settings
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [treasuryAlerts, setTreasuryAlerts] = useState(true);
  const [proposalAlerts, setProposalAlerts] = useState(false);

  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [auditLogging, setAuditLogging] = useState(true);

  // Display Settings
  const [darkMode, setDarkMode] = useState(false);
  const [dataRefreshInterval, setDataRefreshInterval] = useState('30');
  const [dashboardLayout, setDashboardLayout] = useState('default');

  // System Settings
  const [blockchainSync, setBlockchainSync] = useState(true);
  const [cacheEnabled, setCacheEnabled] = useState(true);

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveSettings = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

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
              <h1 className="text-xl font-bold text-white">System Settings</h1>
              <p className="text-xs text-gray-400">Configure portal preferences</p>
            </div>
          </div>
          <Monitor size={32} className="text-blue-400" weight="duotone" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {showSuccess && (
          <GlassCard variant="dark-medium" blur="lg" className="p-4 border-emerald-500/30 bg-emerald-500/10">
            <div className="flex items-start gap-3">
              <CheckCircle size={24} className="text-emerald-400 flex-shrink-0" weight="fill" />
              <div>
                <h3 className="font-semibold text-white mb-1">Settings Saved</h3>
                <p className="text-sm text-gray-300">Your system settings have been updated successfully.</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Notifications */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center">
            <Bell size={20} className="mr-2 text-blue-400" weight="duotone" />
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <DarkSwitch
              checked={systemAlerts}
              onCheckedChange={setSystemAlerts}
              label="System Alerts"
              description="Receive notifications about system status and maintenance"
            />
            <DarkSwitch
              checked={securityAlerts}
              onCheckedChange={setSecurityAlerts}
              label="Security Alerts"
              description="Critical security events and unauthorized access attempts"
            />
            <DarkSwitch
              checked={treasuryAlerts}
              onCheckedChange={setTreasuryAlerts}
              label="Treasury Alerts"
              description="Multi-signature wallet transactions and approvals"
            />
            <DarkSwitch
              checked={proposalAlerts}
              onCheckedChange={setProposalAlerts}
              label="Governance Proposals"
              description="New proposals and voting deadlines"
            />
          </div>
        </GlassCard>

        {/* Security */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center">
            <ShieldCheck size={20} className="mr-2 text-blue-400" weight="duotone" />
            Security Settings
          </h3>
          <div className="space-y-4">
            <DarkSwitch
              checked={twoFactorAuth}
              onCheckedChange={setTwoFactorAuth}
              label="Two-Factor Authentication"
              description="Require 2FA for sensitive operations"
            />
            <DarkSelect
              label="Session Timeout"
              value={sessionTimeout}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSessionTimeout(e.target.value)}
              options={[
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' },
                { value: 'never', label: 'Never (not recommended)' },
              ]}
              helperText="Automatically log out after period of inactivity"
            />
            <DarkSwitch
              checked={auditLogging}
              onCheckedChange={setAuditLogging}
              label="Audit Logging"
              description="Record all administrative actions (required for compliance)"
              disabled
            />
          </div>
        </GlassCard>

        {/* Display Settings */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center">
            <Monitor size={20} className="mr-2 text-blue-400" weight="duotone" />
            Display & Performance
          </h3>
          <div className="space-y-4">
            <DarkSwitch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              label="Dark Mode"
              description="Enable dark theme (coming soon)"
              disabled
            />
            <DarkSelect
              label="Data Refresh Interval"
              value={dataRefreshInterval}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDataRefreshInterval(e.target.value)}
              options={[
                { value: '10', label: 'Every 10 seconds' },
                { value: '30', label: 'Every 30 seconds' },
                { value: '60', label: 'Every minute' },
                { value: '300', label: 'Every 5 minutes' },
                { value: 'manual', label: 'Manual only' },
              ]}
              helperText="How often to fetch latest blockchain data"
            />
            <DarkSelect
              label="Dashboard Layout"
              value={dashboardLayout}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDashboardLayout(e.target.value)}
              options={[
                { value: 'default', label: 'Default Layout' },
                { value: 'compact', label: 'Compact View' },
                { value: 'detailed', label: 'Detailed View' },
                { value: 'custom', label: 'Custom Layout' },
              ]}
            />
          </div>
        </GlassCard>

        {/* System Monitoring */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center">
            <Database size={20} className="mr-2 text-blue-400" weight="duotone" />
            System Monitoring
          </h3>
          <div className="space-y-4">
            <DarkSwitch
              checked={blockchainSync}
              onCheckedChange={setBlockchainSync}
              label="Real-time Blockchain Sync"
              description="Keep synchronized with latest blockchain state"
            />
            <DarkSwitch
              checked={cacheEnabled}
              onCheckedChange={setCacheEnabled}
              label="Data Caching"
              description="Cache frequently accessed data for better performance"
            />
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-start space-x-3">
                <Clock size={20} className="text-blue-400 mt-0.5" weight="duotone" />
                <div>
                  <p className="font-medium text-white text-sm mb-1">System Status</p>
                  <p className="text-sm text-gray-300">
                    Last sync: 2 seconds ago · Node: Healthy · Peers: 47
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Multi-Signature Wallet */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center">
            <Key size={20} className="mr-2 text-blue-400" weight="duotone" />
            Multi-Signature Treasury
          </h3>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <p className="text-sm text-gray-300 mb-3">
              Treasury operations require 4 of 7 authorized signatures
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your Approval Status:</span>
                <span className="font-medium text-emerald-400">Authorized Signer</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pending Approvals:</span>
                <span className="font-medium text-white">3 transactions</span>
              </div>
            </div>
            <Link href="/treasury">
              <Button variant="outline" size="sm" className="w-full mt-4 border-gray-600 text-gray-300 hover:bg-gray-700">
                View Treasury Dashboard
              </Button>
            </Link>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
        >
          <SignOut size={18} className="mr-2" />
          Sign Out
        </Button>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 pt-4 space-y-1">
          <p>Blue Hole Portal v1.0.0</p>
          <div className="flex justify-center space-x-4">
            <Link href="/docs" className="hover:text-blue-400 transition-colors">System Docs</Link>
            <Link href="/support" className="hover:text-blue-400 transition-colors">Support</Link>
            <Link href="/audit-log" className="hover:text-blue-400 transition-colors">Audit Log</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
