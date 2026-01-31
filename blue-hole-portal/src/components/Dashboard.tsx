'use client';

import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/admin';
import { Button, Card, Badge, LanguageSwitcherCompact } from '@belizechain/shared';
import {
  Vault,
  CurrencyDollar,
  Users,
  Lightning,
  ChartBar,
  Cube,
  Database,
  Brain,
  ShieldCheck,
  SignOut,
  List,
  Gauge,
  CheckCircle,
  WarningCircle,
  Warning,
  Atom,
  Activity,
  BellRinging,
  Bell,
  IdentificationCard,
  XCircle,
  DownloadSimple,
  Trash,
} from 'phosphor-react';
import { monitoringService } from '@/services/monitoring';
import { blockchainService } from '@/services/blockchain';
import type { BlockchainHealth, NawalAIStatus, KinichQuantumStatus, PakitStorageStatus } from '@/services/monitoring';
import type { BlockchainEvent } from '@/services/blockchain';

type TabKey = 'overview' | 'treasury' | 'governance' | 'validators' | 'monitoring' | 'compliance' | 'logs';

export function Dashboard() {
  const { admin, logout } = useAdminStore();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch alerts on mount and setup auto-refresh
  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alertsList = await monitoringService.getAlerts();
        setAlerts(alertsList);
        setUnreadCount(alertsList.filter((a: any) => !a.read).length);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Request desktop notification permission
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show desktop notification for new alerts
  React.useEffect(() => {
    if (typeof window !== 'undefined' && alerts.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      const latestAlert = alerts[0];
      if (latestAlert && !latestAlert.read) {
        new Notification('BelizeChain Alert', {
          body: latestAlert.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      }
    }
  }, [alerts]);

  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    setUnreadCount(0);
    setShowAlerts(false);
  };

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <header className="bg-white border-b border-sand-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-caribbean-500 to-bluehole-600 flex items-center justify-center">
                <ShieldCheck size={24} weight="duotone" className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-bluehole-900">Blue Hole Portal</h1>
                <p className="text-sm text-bluehole-600">Government Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Alert Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative p-2 rounded-lg hover:bg-sand-100 transition-colors"
                  title="Notifications"
                >
                  {unreadCount > 0 ? (
                    <BellRinging size={24} weight="fill" className="text-maya-600" />
                  ) : (
                    <Bell size={24} className="text-bluehole-600" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Alert Dropdown */}
                {showAlerts && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-sand-200 z-50">
                    <div className="p-4 border-b border-sand-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BellRinging size={20} className="text-bluehole-600" />
                        <h3 className="font-semibold text-bluehole-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <Badge variant="warning">{unreadCount} new</Badge>
                        )}
                      </div>
                      <button
                        onClick={clearAllAlerts}
                        className="text-xs text-bluehole-600 hover:text-bluehole-900 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={48} className="mx-auto mb-2 text-sand-400" />
                          <p className="text-sm text-bluehole-600">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-sand-200">
                          {alerts.map((alert) => (
                            <div
                              key={alert.id}
                              onClick={() => markAlertAsRead(alert.id)}
                              className={`p-4 cursor-pointer transition-colors ${
                                alert.read ? 'bg-white' : 'bg-caribbean-50 hover:bg-caribbean-100'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  alert.severity === 'critical' ? 'bg-red-100' :
                                  alert.severity === 'warning' ? 'bg-orange-100' :
                                  'bg-blue-100'
                                }`}>
                                  {alert.severity === 'critical' ? (
                                    <Warning size={20} className="text-red-600" weight="fill" />
                                  ) : alert.severity === 'warning' ? (
                                    <WarningCircle size={20} className="text-orange-600" weight="fill" />
                                  ) : (
                                    <CheckCircle size={20} className="text-blue-600" weight="fill" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-bluehole-900 mb-1">
                                    {alert.title}
                                  </p>
                                  <p className="text-xs text-bluehole-600 mb-2">
                                    {alert.message}
                                  </p>
                                  <p className="text-xs text-bluehole-500">
                                    {new Date(alert.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                {!alert.read && (
                                  <div className="w-2 h-2 rounded-full bg-caribbean-600 flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Switcher */}
              <LanguageSwitcherCompact />

              <div className="text-right">
                <p className="font-semibold text-bluehole-900">{admin?.name}</p>
                <p className="text-sm text-bluehole-600">{admin?.department}</p>
              </div>
              <Badge variant="success" className="capitalize">{admin?.role}</Badge>
              <Button
                variant="outline"
                onClick={logout}
                leftIcon={<SignOut size={20} />}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: Gauge },
              { key: 'treasury', label: 'Treasury', icon: Vault },
              { key: 'governance', label: 'Governance', icon: Users },
              { key: 'validators', label: 'Validators', icon: CheckCircle },
              { key: 'monitoring', label: 'Monitoring', icon: ChartBar },
              { key: 'compliance', label: 'Compliance', icon: ShieldCheck },
              { key: 'logs', label: 'Logs', icon: List },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-caribbean-500 text-caribbean-600'
                      : 'border-transparent text-bluehole-600 hover:text-bluehole-900'
                  }`}
                >
                  <Icon size={20} weight={activeTab === tab.key ? 'fill' : 'regular'} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'treasury' && <TreasuryTab />}
        {activeTab === 'governance' && <GovernanceTab />}
        {activeTab === 'validators' && <ValidatorsTab />}
        {activeTab === 'monitoring' && <MonitoringTab />}
        {activeTab === 'compliance' && <ComplianceTab />}
        {activeTab === 'logs' && <LogsTab />}
      </main>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={CurrencyDollar}
          label="Treasury Balance"
          value="$25.4M"
          change="+5.2%"
          trend="up"
          color="jungle"
        />
        <StatsCard
          icon={Users}
          label="Active Citizens"
          value="12,847"
          change="+234"
          trend="up"
          color="caribbean"
        />
        <StatsCard
          icon={CheckCircle}
          label="Validators"
          value="21"
          change="100% uptime"
          trend="stable"
          color="maya"
        />
        <StatsCard
          icon={ChartBar}
          label="Daily Transactions"
          value="3,524"
          change="+12.3%"
          trend="up"
          color="bluehole"
        />
      </div>

      {/* System Status */}
      <Card>
        <h2 className="text-xl font-bold text-bluehole-900 mb-4 flex items-center space-x-2">
          <Gauge size={24} className="text-caribbean-500" />
          <span>System Status</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusItem icon={Cube} label="Blockchain" status="operational" value="Block #145,234" />
          <StatusItem icon={Database} label="Pakit Storage" status="operational" value="2.3 TB used" />
          <StatusItem icon={Brain} label="Nawal AI" status="operational" value="87 nodes active" />
          <StatusItem icon={Lightning} label="Kinich Quantum" status="operational" value="3 jobs running" />
          <StatusItem icon={ShieldCheck} label="Compliance" status="operational" value="All checks passed" />
          <StatusItem icon={Users} label="Governance" status="operational" value="5 active proposals" />
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-xl font-bold text-bluehole-900 mb-4 flex items-center space-x-2">
          <List size={24} className="text-caribbean-500" />
          <span>Recent Activity</span>
        </h2>
        <div className="space-y-3">
          <ActivityItem
            time="5 minutes ago"
            action="New proposal submitted"
            description="District 3: Community Center Funding"
            icon={Users}
            color="caribbean"
          />
          <ActivityItem
            time="15 minutes ago"
            action="Treasury withdrawal"
            description="$50,000 DALLA - Infrastructure maintenance"
            icon={CurrencyDollar}
            color="jungle"
          />
          <ActivityItem
            time="1 hour ago"
            action="Validator joined"
            description="New validator node activated in Belmopan"
            icon={CheckCircle}
            color="maya"
          />
          <ActivityItem
            time="2 hours ago"
            action="Quantum job completed"
            description="Tourism data analysis - 99.2% accuracy"
            icon={Lightning}
            color="bluehole"
          />
        </div>
      </Card>
    </div>
  );
}

function TreasuryTab() {
  const { admin } = useAdminStore();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [treasuryBalance, setTreasuryBalance] = React.useState<bigint>(BigInt(0));
  const [proposals, setProposals] = React.useState<any[]>([]);
  const [signingId, setSigningId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize blockchain connection
        await blockchainService.initialize();

        // Fetch treasury data in parallel
        const [balance, proposalsList] = await Promise.all([
          blockchainService.getTreasuryBalance(),
          blockchainService.getTreasuryProposals(),
        ]);

        setTreasuryBalance(balance);
        setProposals(proposalsList);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch treasury data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load treasury data');
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to treasury events for real-time updates
    const unsubscribePromise = blockchainService.subscribeToEvents(
      'economy',
      'TreasuryProposed',
      (event) => {
        console.log('New treasury proposal:', event);
        fetchData(); // Refresh data
      }
    );

    // Also subscribe to approvals
    const unsubscribeApprovalPromise = blockchainService.subscribeToEvents(
      'economy',
      'TreasuryApproved',
      (event) => {
        console.log('Treasury proposal approved:', event);
        fetchData(); // Refresh data
      }
    );

    return () => {
      unsubscribePromise.then(unsub => unsub());
      unsubscribeApprovalPromise.then(unsub => unsub());
    };
  }, []);

  const handleSignProposal = async (proposalId: number) => {
    try {
      setSigningId(`${proposalId}`);

      const api = (blockchainService as any).api;
      if (!api) throw new Error('Blockchain API not initialized');

      // Use government admin account
      const adminAccount = admin?.address || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

      // Submit approval transaction
      const extrinsic = api.tx.economy.approveTreasury(proposalId);
      const result = await blockchainService.submitTransaction(extrinsic, adminAccount, (status) => {
        console.log('Transaction status:', status);
      });

      if (result.success) {
        alert('Successfully signed treasury proposal!');
        // Refresh data
        const [balance, proposalsList] = await Promise.all([
          blockchainService.getTreasuryBalance(),
          blockchainService.getTreasuryProposals(),
        ]);
        setTreasuryBalance(balance);
        setProposals(proposalsList);
      } else {
        alert('Failed to sign proposal: ' + result.message);
      }

      setSigningId(null);
    } catch (err) {
      console.error('Failed to sign proposal:', err);
      alert('Failed to sign proposal: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setSigningId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-sand-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-sand-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <Warning size={48} className="mx-auto mb-4 text-maya-600" />
          <h3 className="text-lg font-semibold text-bluehole-900 mb-2">Failed to Load Treasury Data</h3>
          <p className="text-bluehole-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-bluehole-600 text-white rounded-lg hover:bg-bluehole-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  // Separate proposals by status
  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const approvedProposals = proposals.filter(p => p.status === 'approved');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

  // Convert balance from smallest unit (assuming 12 decimals like DALLA)
  const treasuryBalanceFormatted = (Number(treasuryBalance) / 1e12).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-6">
      {/* Treasury Balance Overview */}
      <div>
        <h2 className="text-xl font-bold text-bluehole-900 mb-4">Treasury Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-bluehole-500 to-bluehole-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Main Treasury</h3>
              <Vault size={20} />
            </div>
            <p className="text-3xl font-bold mb-1">
              {treasuryBalanceFormatted}
            </p>
            <p className="text-sm opacity-90">DALLA</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-bluehole-900">Total Proposals</h3>
              <CurrencyDollar size={20} className="text-bluehole-600" />
            </div>
            <p className="text-3xl font-bold text-bluehole-900 mb-1">
              {proposals.length}
            </p>
            <p className="text-sm text-bluehole-600">All time</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-bluehole-900">Pending</h3>
              <WarningCircle size={20} className="text-maya-600" />
            </div>
            <p className="text-3xl font-bold text-maya-600 mb-1">
              {pendingProposals.length}
            </p>
            <p className="text-sm text-bluehole-600">Awaiting approval</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-bluehole-900">Approved</h3>
              <CheckCircle size={20} className="text-jungle-600" />
            </div>
            <p className="text-3xl font-bold text-jungle-600 mb-1">
              {approvedProposals.length}
            </p>
            <p className="text-sm text-bluehole-600">Executed</p>
          </Card>
        </div>
      </div>

      {/* Pending Multi-Sig Requests */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-bluehole-900 flex items-center space-x-2">
            <WarningCircle size={24} className="text-maya-500" />
            <span>Pending Approvals</span>
          </h2>
          <Badge variant="warning">{pendingProposals.length} Awaiting Signatures</Badge>
        </div>

        {pendingProposals.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto mb-4 text-jungle-600" weight="duotone" />
            <p className="text-bluehole-600">No pending proposals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingProposals.map((proposal) => (
              <div key={proposal.id} className="p-4 rounded-lg border border-sand-200 bg-sand-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-bluehole-900 mb-1">
                      Proposal #{proposal.id}
                    </h3>
                    <p className="text-sm text-bluehole-600">
                      Beneficiary: {proposal.beneficiary.slice(0, 12)}...{proposal.beneficiary.slice(-8)}
                    </p>
                    {proposal.bond && (
                      <p className="text-xs text-bluehole-500 mt-1">
                        Bond: {(Number(proposal.bond) / 1e12).toLocaleString()} DALLA
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-bluehole-900">
                      {(Number(proposal.value) / 1e12).toLocaleString()}
                    </p>
                    <p className="text-xs text-bluehole-600">DALLA</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-xs text-bluehole-600 mb-1">Multi-Sig Required</p>
                      <Badge variant="warning">
                        4 of 7 signatures needed
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-bluehole-600 mb-1">Proposed</p>
                      <span className="text-sm font-medium text-bluehole-900">
                        Block #{proposal.proposalIndex || proposal.id}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSignProposal(proposal.id)}
                      disabled={signingId === `${proposal.id}`}
                    >
                      {signingId === `${proposal.id}` ? 'Signing...' : 'Sign & Approve'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Approvals */}
      <Card>
        <h2 className="text-xl font-bold text-bluehole-900 mb-4">Recent Approvals</h2>
        {approvedProposals.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollar size={48} className="mx-auto mb-4 text-sand-400" />
            <p className="text-bluehole-600">No approved proposals yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedProposals.slice(0, 5).map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between p-4 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-jungle-100">
                    <CheckCircle size={24} className="text-jungle-600" weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-medium text-bluehole-900">Proposal #{proposal.id}</h3>
                    <p className="text-sm text-bluehole-600">
                      {proposal.beneficiary.slice(0, 12)}...{proposal.beneficiary.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-bluehole-900">
                    {(Number(proposal.value) / 1e12).toLocaleString()}
                  </p>
                  <Badge variant="success">approved</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Rejected Proposals */}
      {rejectedProposals.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-bluehole-900 mb-4">Rejected Proposals</h2>
          <div className="space-y-3">
            {rejectedProposals.slice(0, 3).map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-red-100">
                    <XCircle size={24} className="text-red-600" weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-medium text-bluehole-900">Proposal #{proposal.id}</h3>
                    <p className="text-sm text-bluehole-600">
                      {proposal.beneficiary.slice(0, 12)}...{proposal.beneficiary.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-bluehole-900">
                    {(Number(proposal.value) / 1e12).toLocaleString()}
                  </p>
                  <Badge variant="error">rejected</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function GovernanceTab() {
  const { admin } = useAdminStore();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [proposals, setProposals] = React.useState<any[]>([]);
  const [votingId, setVotingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize blockchain connection
        await blockchainService.initialize();

        // Fetch governance proposals
        const proposalsList = await blockchainService.getGovernanceProposals();
        setProposals(proposalsList);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch governance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load governance data');
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to governance events
    const unsubscribeProposedPromise = blockchainService.subscribeToEvents(
      'governance',
      'Proposed',
      (event) => {
        console.log('New governance proposal:', event);
        fetchData();
      }
    );

    const unsubscribeVotedPromise = blockchainService.subscribeToEvents(
      'governance',
      'Voted',
      (event) => {
        console.log('New vote cast:', event);
        fetchData();
      }
    );

    return () => {
      unsubscribeProposedPromise.then(unsub => unsub());
      unsubscribeVotedPromise.then(unsub => unsub());
    };
  }, []);

  const handleVote = async (proposalId: number, approve: boolean) => {
    try {
      setVotingId(`${proposalId}-${approve}`);

      const api = (blockchainService as any).api;
      if (!api) throw new Error('Blockchain API not initialized');

      // Use government admin account
      const adminAccount = admin?.address || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

      // Submit vote transaction
      const extrinsic = api.tx.governance.vote(proposalId, approve);
      const result = await blockchainService.submitTransaction(extrinsic, adminAccount, (status) => {
        console.log('Vote transaction status:', status);
      });

      if (result.success) {
        alert(`Successfully voted ${approve ? 'YES' : 'NO'} on proposal #${proposalId}!`);
        // Refresh data
        const proposalsList = await blockchainService.getGovernanceProposals();
        setProposals(proposalsList);
      } else {
        alert('Failed to vote: ' + result.message);
      }

      setVotingId(null);
    } catch (err) {
      console.error('Failed to vote:', err);
      alert('Failed to vote: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setVotingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-sand-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-sand-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <Warning size={48} className="mx-auto mb-4 text-maya-600" />
          <h3 className="text-lg font-semibold text-bluehole-900 mb-2">Failed to Load Governance Data</h3>
          <p className="text-bluehole-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-bluehole-600 text-white rounded-lg hover:bg-bluehole-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  // Filter proposals by status
  const activeProposals = proposals.filter(p => p.status === 'active' || p.status === 'proposed');
  const passedProposals = proposals.filter(p => p.status === 'passed' || p.status === 'executed');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Governance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-bluehole-600 mb-1">Active Proposals</p>
          <p className="text-3xl font-bold text-bluehole-900">{activeProposals.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-bluehole-600 mb-1">Total Proposals</p>
          <p className="text-3xl font-bold text-bluehole-900">{proposals.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-bluehole-600 mb-1">Passed</p>
          <p className="text-3xl font-bold text-jungle-600">{passedProposals.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-bluehole-600 mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{rejectedProposals.length}</p>
        </Card>
      </div>

      {/* Active Proposals */}
      <Card>
        <h2 className="text-xl font-bold text-bluehole-900 mb-4">Active Proposals</h2>
        {activeProposals.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto mb-4 text-jungle-600" weight="duotone" />
            <p className="text-bluehole-600">No active proposals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProposals.map((proposal) => {
              const totalVotes = (proposal.votesFor || 0) + (proposal.votesAgainst || 0);
              const votePercentage = totalVotes > 0 ? ((proposal.votesFor || 0) / totalVotes) * 100 : 0;
              const quorumMet = totalVotes >= (proposal.quorum || 100);
              
              return (
                <div key={proposal.id} className="p-4 rounded-lg border border-sand-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-bluehole-900">Proposal #{proposal.id}</h3>
                        <Badge variant="info">{proposal.status}</Badge>
                        {proposal.district && (
                          <Badge variant="neutral">{proposal.district}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-bluehole-600 mb-2">
                        Proposer: {proposal.proposer?.slice(0, 12)}...{proposal.proposer?.slice(-8)}
                      </p>
                      {proposal.description && (
                        <p className="text-sm text-bluehole-700 mb-2">{proposal.description}</p>
                      )}
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <p className="text-xs text-bluehole-600 mb-1">Proposed</p>
                      <p className="font-semibold text-bluehole-900">Block #{proposal.proposalIndex || proposal.id}</p>
                    </div>
                  </div>

                  {/* Vote Progress Bar */}
                  {totalVotes > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-jungle-600 font-medium">For: {proposal.votesFor || 0}</span>
                        <span className="text-red-600 font-medium">Against: {proposal.votesAgainst || 0}</span>
                      </div>
                      <div className="h-3 bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-jungle-500 to-jungle-600 transition-all"
                          style={{ width: `${votePercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-bluehole-600 mt-1">
                        <span>{votePercentage.toFixed(1)}% in favor</span>
                        <span>
                          {quorumMet ? (
                            <span className="text-jungle-600 flex items-center space-x-1">
                              <CheckCircle size={14} weight="fill" />
                              <span>Quorum met</span>
                            </span>
                          ) : (
                            <span>Quorum: {totalVotes}/{proposal.quorum || 100}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-sand-200">
                    <div className="text-sm text-bluehole-600">
                      Total votes: <span className="font-medium text-bluehole-900">{totalVotes}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={votingId === `${proposal.id}-false`}
                      >
                        {votingId === `${proposal.id}-false` ? 'Voting...' : 'Vote NO'}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={votingId === `${proposal.id}-true`}
                      >
                        {votingId === `${proposal.id}-true` ? 'Voting...' : 'Vote YES'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent Decisions (Passed Proposals) */}
      <Card>
        <h2 className="text-xl font-bold text-bluehole-900 mb-4">Recent Decisions</h2>
        {passedProposals.length === 0 && rejectedProposals.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-sand-400" />
            <p className="text-bluehole-600">No decisions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...passedProposals.slice(0, 3), ...rejectedProposals.slice(0, 2)].map((proposal) => {
              const totalVotes = (proposal.votesFor || 0) + (proposal.votesAgainst || 0);
              const passed = proposal.status === 'passed' || proposal.status === 'executed';
              
              return (
                <div key={proposal.id} className="flex items-center justify-between p-3 rounded-lg border border-sand-200">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${passed ? 'bg-jungle-100' : 'bg-red-100'}`}>
                      {passed ? (
                        <CheckCircle size={20} className="text-jungle-600" weight="fill" />
                      ) : (
                        <XCircle size={20} className="text-red-600" weight="fill" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-bluehole-900">Proposal #{proposal.id}</h3>
                      <p className="text-sm text-bluehole-600">
                        {proposal.votesFor || 0} for, {proposal.votesAgainst || 0} against
                        {proposal.district && ` • ${proposal.district}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={passed ? 'success' : 'error'}>
                      {passed ? 'Passed' : 'Rejected'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function ValidatorsTab() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [validators, setValidators] = React.useState<any[]>([]);
  const [nawalStatus, setNawalStatus] = React.useState<any>(null);
  const [blockMetrics, setBlockMetrics] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize blockchain connection
        await blockchainService.initialize();

        // Fetch data in parallel
        const [validatorsList, nawal, metrics] = await Promise.all([
          blockchainService.getActiveValidators(),
          monitoringService.getNawalStatus().catch(() => null), // Optional
          blockchainService.getMetrics(),
        ]);

        setValidators(validatorsList);
        setNawalStatus(nawal);
        setBlockMetrics(metrics);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch validators data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load validators data');
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-sand-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-sand-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <Warning size={48} className="mx-auto mb-4 text-maya-600" />
          <h3 className="text-lg font-semibold text-bluehole-900 mb-2">Failed to Load Validators Data</h3>
          <p className="text-bluehole-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-bluehole-600 text-white rounded-lg hover:bg-bluehole-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  const totalStake = validators.reduce((sum, v) => sum + Number(v.stake || 0), 0);
  const avgUptime = validators.length > 0
    ? validators.reduce((sum, v) => sum + (v.uptime || 0), 0) / validators.length
    : 0;
  const totalFlContributions = validators.reduce((sum, v) => sum + (v.flContributions || 0), 0);

  return (
    <div className="space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle size={20} className="text-jungle-600" weight="fill" />
            <p className="text-sm text-bluehole-600">Active Validators</p>
          </div>
          <p className="text-3xl font-bold text-bluehole-900">{validators.length}</p>
        </Card>
        <Card>
          <div className="flex items-center space-x-2 mb-2">
            <Gauge size={20} className="text-caribbean-600" />
            <p className="text-sm text-bluehole-600">Avg Uptime</p>
          </div>
          <p className="text-3xl font-bold text-jungle-600">{avgUptime.toFixed(2)}%</p>
        </Card>
        <Card>
          <div className="flex items-center space-x-2 mb-2">
            <CurrencyDollar size={20} className="text-maya-600" />
            <p className="text-sm text-bluehole-600">Total Stake</p>
          </div>
          <p className="text-3xl font-bold text-bluehole-900">
            {(totalStake / 1e12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-bluehole-600">DALLA</p>
        </Card>
        <Card>
          <div className="flex items-center space-x-2 mb-2">
            <Brain size={20} className="text-bluehole-600" />
            <p className="text-sm text-bluehole-600">FL Contributions</p>
          </div>
          <p className="text-3xl font-bold text-bluehole-900">{totalFlContributions}</p>
        </Card>
      </div>

      {/* Validators List */}
      <Card>
        <h2 className="text-xl font-bold text-bluehole-900 mb-4">Validator Nodes</h2>
        {validators.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-sand-400" />
            <p className="text-bluehole-600">No active validators</p>
          </div>
        ) : (
          <div className="space-y-3">
            {validators.map((validator, index) => {
              // Calculate FL score if Nawal data is available
              const flScore = validator.flContributions > 0
                ? Math.min(100, (validator.flContributions / 10) * (nawalStatus?.overallAccuracy || 0.9) * 100)
                : 0;

              return (
                <div key={validator.address} className="p-4 rounded-lg border border-sand-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-jungle-100">
                        <CheckCircle size={24} className="text-jungle-600" weight="duotone" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-bluehole-900">Validator #{index + 1}</h3>
                          <Badge variant="success">active</Badge>
                        </div>
                        <p className="text-sm text-bluehole-600 font-mono mb-1">
                          {validator.address.slice(0, 12)}...{validator.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Validator Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-sand-200">
                    <div>
                      <p className="text-xs text-bluehole-600 mb-1">Uptime</p>
                      <p className="text-lg font-bold text-jungle-600">{validator.uptime?.toFixed(2) || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-bluehole-600 mb-1">Total Stake</p>
                      <p className="text-lg font-bold text-bluehole-900">
                        {(Number(validator.stake || 0) / 1e12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-bluehole-600 mb-1">Commission</p>
                      <p className="text-lg font-bold text-bluehole-900">{validator.commission || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-bluehole-600 mb-1">Era Points</p>
                      <p className="text-lg font-bold text-bluehole-900">{validator.eraPoints || 0}</p>
                    </div>
                  </div>

                  {/* Federated Learning Performance */}
                  {validator.flContributions > 0 && (
                    <div className="mt-4 pt-4 border-t border-sand-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Brain size={16} className="text-bluehole-600" />
                          <p className="text-sm font-medium text-bluehole-900">Federated Learning Performance</p>
                        </div>
                        <span className="text-sm font-semibold text-bluehole-900">{flScore.toFixed(1)}/100</span>
                      </div>
                      <div className="h-2 bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-caribbean-500 to-jungle-500 transition-all"
                          style={{ width: `${flScore}%` }}
                        />
                      </div>
                      <p className="text-xs text-bluehole-600 mt-1">
                        {validator.flContributions} model contributions • Proof of Useful Work
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Network Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-bluehole-900 mb-4 flex items-center space-x-2">
            <Lightning size={20} className="text-maya-600" />
            <span>Block Production</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Current Block</span>
              <span className="font-semibold text-bluehole-900">#{blockMetrics?.blockHeight.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Finalized</span>
              <span className="font-semibold text-jungle-600">#{blockMetrics?.finalizedBlock.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Finality Lag</span>
              <span className="font-semibold text-bluehole-900">
                {(blockMetrics?.blockHeight || 0) - (blockMetrics?.finalizedBlock || 0)} blocks
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Peer Count</span>
              <span className="font-semibold text-bluehole-900">{blockMetrics?.peerCount || 0}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-bluehole-900 mb-4 flex items-center space-x-2">
            <Brain size={20} className="text-caribbean-600" />
            <span>AI Training Status</span>
          </h3>
          {nawalStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-bluehole-600">Active Training Rounds</span>
                <span className="font-semibold text-bluehole-900">{nawalStatus.activeRounds.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-bluehole-600">Participating Validators</span>
                <span className="font-semibold text-jungle-600">
                  {validators.filter(v => v.flContributions > 0).length}/{validators.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-bluehole-600">Model Accuracy</span>
                <span className="font-semibold text-bluehole-900">
                  {(nawalStatus.overallAccuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-bluehole-600">Total Contributions</span>
                <span className="font-semibold text-bluehole-900">{totalFlContributions}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-bluehole-600">Nawal AI service unavailable</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MonitoringTab() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [blockchainHealth, setBlockchainHealth] = React.useState<BlockchainHealth | null>(null);
  const [nawalStatus, setNawalStatus] = React.useState<NawalAIStatus | null>(null);
  const [kinichStatus, setKinichStatus] = React.useState<KinichQuantumStatus | null>(null);
  const [pakitStatus, setPakitStatus] = React.useState<PakitStorageStatus | null>(null);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [blockMetrics, setBlockMetrics] = React.useState<{ labels: string[], data: number[] }>({ labels: [], data: [] });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all monitoring data in parallel
        const [blockchain, nawal, kinich, pakit, alertList] = await Promise.all([
          monitoringService.getBlockchainMetrics(),
          monitoringService.getNawalStatus(),
          monitoringService.getKinichStatus(),
          monitoringService.getPakitStatus(),
          monitoringService.getAlerts(),
        ]);

        setBlockchainHealth(blockchain);
        setNawalStatus(nawal);
        setKinichStatus(kinich);
        setPakitStatus(pakit);
        setAlerts(alertList);

        // Generate block production chart data (last 20 blocks)
        const metrics = await blockchainService.getMetrics();
        const now = Date.now();
        const labels = Array.from({ length: 20 }, (_, i) => {
          const time = new Date(now - (19 - i) * 6000); // 6s block time
          return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        });
        // Simulate block production (1 block per 6s = 10 blocks per minute)
        const data = Array.from({ length: 20 }, () => Math.floor(Math.random() * 3) + 9); // 9-11 blocks
        setBlockMetrics({ labels, data });

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch monitoring data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-sand-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-sand-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-sand-200 rounded-lg"></div>
          <div className="h-96 bg-sand-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <Warning size={48} className="mx-auto mb-4 text-maya-600" />
          <h3 className="text-lg font-semibold text-bluehole-900 mb-2">Failed to Load Monitoring Data</h3>
          <p className="text-bluehole-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-bluehole-600 text-white rounded-lg hover:bg-bluehole-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <div className="flex items-center">
            <Warning size={24} className="text-red-600 mr-3" weight="fill" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">Critical Alerts ({criticalAlerts.length})</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {criticalAlerts.map((alert, i) => (
                  <li key={i}>{alert.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div className="bg-maya-50 border-l-4 border-maya-600 p-4 rounded-lg">
          <div className="flex items-center">
            <Warning size={24} className="text-maya-600 mr-3" />
            <div className="flex-1">
              <h4 className="font-semibold text-maya-900 mb-1">Warnings ({warningAlerts.length})</h4>
              <ul className="text-sm text-maya-700 space-y-1">
                {warningAlerts.slice(0, 3).map((alert, i) => (
                  <li key={i}>{alert.message}</li>
                ))}
                {warningAlerts.length > 3 && (
                  <li className="font-medium">+ {warningAlerts.length - 3} more warnings</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Blockchain Health */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-bluehole-900 flex items-center space-x-2">
              <Cube size={20} className="text-bluehole-600" />
              <span>Blockchain</span>
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              blockchainHealth?.status === 'operational' ? 'bg-jungle-100 text-jungle-700' :
              blockchainHealth?.status === 'degraded' ? 'bg-maya-100 text-maya-700' :
              'bg-red-100 text-red-700'
            }`}>
              {blockchainHealth?.status || 'Unknown'}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Block Height</span>
              <span className="font-semibold text-bluehole-900">{blockchainHealth?.blockHeight.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Finalized</span>
              <span className="font-semibold text-bluehole-900">{blockchainHealth?.finalizedBlock.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Peers</span>
              <span className="font-semibold text-jungle-600">{blockchainHealth?.peerCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Tx/sec</span>
              <span className="font-semibold text-bluehole-900">{blockchainHealth?.transactionsPerSecond.toFixed(1)}</span>
            </div>
          </div>
        </Card>

        {/* Nawal AI Status */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-bluehole-900 flex items-center space-x-2">
              <Brain size={20} className="text-caribbean-600" />
              <span>Nawal AI</span>
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              nawalStatus?.status === 'operational' ? 'bg-jungle-100 text-jungle-700' :
              nawalStatus?.status === 'degraded' ? 'bg-maya-100 text-maya-700' :
              'bg-red-100 text-red-700'
            }`}>
              {nawalStatus?.status || 'down'}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Training Rounds</span>
              <span className="font-semibold text-bluehole-900">{nawalStatus?.activeRounds.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Model Accuracy</span>
              <span className="font-semibold text-jungle-600">{((nawalStatus?.overallAccuracy || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Privacy ε</span>
              <span className="font-semibold text-bluehole-900">{nawalStatus?.privacyMetrics.epsilon.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Genome Gen</span>
              <span className="font-semibold text-caribbean-600">{nawalStatus?.genomeEvolution.generation}</span>
            </div>
          </div>
        </Card>

        {/* Kinich Quantum Status */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-bluehole-900 flex items-center space-x-2">
              <Atom size={20} className="text-maya-600" />
              <span>Kinich Quantum</span>
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              kinichStatus?.status === 'operational' ? 'bg-jungle-100 text-jungle-700' :
              kinichStatus?.status === 'degraded' ? 'bg-maya-100 text-maya-700' :
              'bg-red-100 text-red-700'
            }`}>
              {kinichStatus?.status || 'down'}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Running Jobs</span>
              <span className="font-semibold text-bluehole-900">{kinichStatus?.runningJobs.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Queue Depth</span>
              <span className="font-semibold text-maya-600">{kinichStatus?.queueDepth || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Azure Backend</span>
              <span className={`font-semibold ${kinichStatus?.backends.azure.status === 'online' ? 'text-jungle-600' : 'text-red-600'}`}>
                {kinichStatus?.backends.azure.status || 'offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Success Rate</span>
              <span className="font-semibold text-bluehole-900">{((kinichStatus?.successRate || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        {/* Pakit Storage Status */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-bluehole-900 flex items-center space-x-2">
              <Database size={20} className="text-jungle-600" />
              <span>Pakit Storage</span>
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              pakitStatus?.status === 'operational' ? 'bg-jungle-100 text-jungle-700' :
              pakitStatus?.status === 'degraded' ? 'bg-maya-100 text-maya-700' :
              'bg-red-100 text-red-700'
            }`}>
              {pakitStatus?.status || 'down'}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Capacity Used</span>
              <span className="font-semibold text-bluehole-900">
                {((pakitStatus?.capacityUsed || 0) / (pakitStatus?.capacityTotal || 1) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Dedup Ratio</span>
              <span className="font-semibold text-jungle-600">{pakitStatus?.deduplicationRatio.toFixed(2)}x</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">Compression</span>
              <span className="font-semibold text-bluehole-900">{pakitStatus?.compressionRatio.toFixed(2)}x</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bluehole-600">IPFS Status</span>
              <span className={`font-semibold ${pakitStatus?.ipfs.status === 'online' ? 'text-jungle-600' : 'text-red-600'}`}>
                {pakitStatus?.ipfs.status || 'offline'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block Production Chart */}
        <Card>
          <h3 className="font-semibold text-bluehole-900 mb-4 flex items-center space-x-2">
            <ChartBar size={20} className="text-bluehole-600" />
            <span>Block Production (Last 2 Minutes)</span>
          </h3>
          <div className="h-64">
            <canvas id="blockProductionChart"></canvas>
          </div>
        </Card>

        {/* System Health Timeline */}
        <Card>
          <h3 className="font-semibold text-bluehole-900 mb-4 flex items-center space-x-2">
            <Activity size={20} className="text-jungle-600" />
            <span>System Health</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-sand-50">
              <div className="flex items-center space-x-3">
                <Cube size={20} className="text-bluehole-600" />
                <span className="font-medium text-bluehole-900">Blockchain</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-bluehole-600">Uptime: 99.98%</span>
                <CheckCircle size={20} className="text-jungle-600" weight="fill" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-sand-50">
              <div className="flex items-center space-x-3">
                <Brain size={20} className="text-caribbean-600" />
                <span className="font-medium text-bluehole-900">Nawal AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-bluehole-600">Training: Active</span>
                <CheckCircle size={20} className="text-jungle-600" weight="fill" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-sand-50">
              <div className="flex items-center space-x-3">
                <Atom size={20} className="text-maya-600" />
                <span className="font-medium text-bluehole-900">Kinich Quantum</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-bluehole-600">Jobs: {kinichStatus?.runningJobs.length || 0} running</span>
                <CheckCircle size={20} className={kinichStatus?.runningJobs.length ? "text-jungle-600" : "text-sand-400"} weight="fill" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-sand-50">
              <div className="flex items-center space-x-3">
                <Database size={20} className="text-jungle-600" />
                <span className="font-medium text-bluehole-900">Pakit Storage</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-bluehole-600">
                  {((pakitStatus?.capacityUsed || 0) / 1024 / 1024 / 1024).toFixed(1)} GB used
                </span>
                <CheckCircle size={20} className="text-jungle-600" weight="fill" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Alert History */}
      {alerts.length > 0 && (
        <Card>
          <h3 className="font-semibold text-bluehole-900 mb-4 flex items-center space-x-2">
            <BellRinging size={20} className="text-maya-600" />
            <span>Recent Alerts ({alerts.length})</span>
          </h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-lg border border-sand-200">
                <Warning size={20} className={alert.severity === 'critical' ? 'text-red-600' : 'text-maya-600'} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-bluehole-900">{alert.system}</span>
                    <span className="text-xs text-bluehole-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-bluehole-600">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ComplianceTab() {
  const { admin } = useAdminStore(); // Add admin from store
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [kycQueue, setKycQueue] = React.useState<any[]>([]);
  const [amlFlags, setAmlFlags] = React.useState<any[]>([]);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize blockchain connection
        await blockchainService.initialize();

        // Query pending KYC verifications
        const api = (blockchainService as any).api;
        if (!api) throw new Error('Blockchain API not initialized');

        // Get pending verifications from identity pallet
        const entries = await api.query.identity.pendingVerifications.entries();
        const kycData = entries.map(([key, value]: [any, any]) => {
          const accountId = key.args[0].toString();
          const data = value.toJSON() as any;
          return {
            id: accountId,
            accountId,
            name: data.name || 'Unknown',
            ssn: data.ssn || 'N/A',
            documentType: data.documentType || 'Passport',
            submittedAt: new Date(data.timestamp || Date.now()),
            riskScore: Math.floor(Math.random() * 100), // Would come from compliance checks
          };
        });

        setKycQueue(kycData);

        // Get flagged accounts from compliance pallet
        const flaggedEntries = await api.query.compliance.flaggedAccounts.entries();
        const flaggedData = flaggedEntries.map(([key, value]: [any, any]) => {
          const accountId = key.args[0].toString();
          const data = value.toJSON() as any;
          return {
            id: accountId,
            accountId,
            reason: data.reason || 'Suspicious activity',
            flaggedAt: new Date(data.timestamp || Date.now()),
            severity: data.severity || 'medium',
            transactions: data.transactionCount || 0,
          };
        });

        setAmlFlags(flaggedData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch compliance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load compliance data');
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to new verification requests
    const unsubscribePromise = blockchainService.subscribeToEvents(
      'identity',
      'VerificationRequested',
      (event) => {
        console.log('New KYC verification requested:', event);
        // Refresh data
        fetchData();
      }
    );

    return () => {
      unsubscribePromise.then(unsub => unsub());
    };
  }, []);

  const handleApproveKyc = async (accountId: string) => {
    try {
      setProcessingId(accountId);
      
      const api = (blockchainService as any).api;
      if (!api) throw new Error('Blockchain API not initialized');

      // Use government admin account (from store)
      const adminAccount = admin?.address || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

      // Submit approval transaction
      const extrinsic = api.tx.identity.approveVerification(accountId);
      await blockchainService.submitTransaction(extrinsic, adminAccount);

      // Remove from queue
      setKycQueue(prev => prev.filter(item => item.id !== accountId));
      setProcessingId(null);
    } catch (err) {
      console.error('Failed to approve KYC:', err);
      alert('Failed to approve KYC: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setProcessingId(null);
    }
  };

  const handleRejectKyc = async (accountId: string) => {
    try {
      setProcessingId(accountId);
      
      const api = (blockchainService as any).api;
      if (!api) throw new Error('Blockchain API not initialized');

      // Use government admin account (from store)
      const adminAccount = admin?.address || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

      // Submit rejection transaction
      const extrinsic = api.tx.identity.rejectVerification(accountId);
      await blockchainService.submitTransaction(extrinsic, adminAccount);

      // Remove from queue
      setKycQueue(prev => prev.filter(item => item.id !== accountId));
      setProcessingId(null);
    } catch (err) {
      console.error('Failed to reject KYC:', err);
      alert('Failed to reject KYC: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-sand-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-sand-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <Warning size={48} className="mx-auto mb-4 text-maya-600" />
          <h3 className="text-lg font-semibold text-bluehole-900 mb-2">Failed to Load Compliance Data</h3>
          <p className="text-bluehole-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-bluehole-600 text-white rounded-lg hover:bg-bluehole-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-bluehole-600 mb-1">Pending KYC</p>
              <p className="text-3xl font-bold text-bluehole-900">{kycQueue.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-caribbean-500 to-caribbean-600">
              <IdentificationCard size={32} className="text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-bluehole-600 mb-1">AML Flags</p>
              <p className="text-3xl font-bold text-bluehole-900">{amlFlags.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-maya-500 to-maya-600">
              <ShieldCheck size={32} className="text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-bluehole-600 mb-1">Avg. Risk Score</p>
              <p className="text-3xl font-bold text-bluehole-900">
                {kycQueue.length > 0 ? Math.floor(kycQueue.reduce((sum, k) => sum + k.riskScore, 0) / kycQueue.length) : 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-jungle-500 to-jungle-600">
              <ChartBar size={32} className="text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* KYC Queue */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-bluehole-900 flex items-center space-x-2">
            <IdentificationCard size={24} className="text-caribbean-600" />
            <span>KYC Verification Queue</span>
          </h3>
          <span className="text-sm text-bluehole-600">{kycQueue.length} pending</span>
        </div>

        {kycQueue.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto mb-4 text-jungle-600" weight="duotone" />
            <p className="text-bluehole-600">No pending KYC verifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {kycQueue.map(kyc => (
              <div key={kyc.id} className="p-4 rounded-lg border border-sand-200 hover:border-caribbean-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-bluehole-900 mb-1">{kyc.name}</h4>
                    <p className="text-sm text-bluehole-600 font-mono">{kyc.accountId.slice(0, 12)}...{kyc.accountId.slice(-8)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    kyc.riskScore < 30 ? 'bg-jungle-100 text-jungle-700' :
                    kyc.riskScore < 70 ? 'bg-maya-100 text-maya-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Risk: {kyc.riskScore}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-bluehole-600">SSN:</span>
                    <span className="ml-2 font-medium text-bluehole-900">{kyc.ssn}</span>
                  </div>
                  <div>
                    <span className="text-bluehole-600">Document:</span>
                    <span className="ml-2 font-medium text-bluehole-900">{kyc.documentType}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-bluehole-600">Submitted:</span>
                    <span className="ml-2 font-medium text-bluehole-900">
                      {kyc.submittedAt.toLocaleDateString()} {kyc.submittedAt.toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleApproveKyc(kyc.id)}
                    disabled={processingId === kyc.id}
                    className="flex-1 px-4 py-2 bg-jungle-600 text-white rounded-lg hover:bg-jungle-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <CheckCircle size={18} weight="fill" />
                    <span>{processingId === kyc.id ? 'Processing...' : 'Approve'}</span>
                  </button>
                  <button
                    onClick={() => handleRejectKyc(kyc.id)}
                    disabled={processingId === kyc.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <XCircle size={18} weight="fill" />
                    <span>{processingId === kyc.id ? 'Processing...' : 'Reject'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* AML Flags */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-bluehole-900 flex items-center space-x-2">
            <ShieldCheck size={24} className="text-maya-600" />
            <span>AML Flagged Accounts</span>
          </h3>
          <span className="text-sm text-bluehole-600">{amlFlags.length} flagged</span>
        </div>

        {amlFlags.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto mb-4 text-jungle-600" weight="duotone" />
            <p className="text-bluehole-600">No flagged accounts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sand-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-bluehole-700">Account</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-bluehole-700">Reason</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-bluehole-700">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-bluehole-700">Transactions</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-bluehole-700">Flagged At</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-bluehole-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {amlFlags.map(flag => (
                  <tr key={flag.id} className="border-b border-sand-100 hover:bg-sand-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-bluehole-900">
                        {flag.accountId.slice(0, 8)}...{flag.accountId.slice(-6)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-bluehole-700">{flag.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        flag.severity === 'high' ? 'bg-red-100 text-red-700' :
                        flag.severity === 'medium' ? 'bg-maya-100 text-maya-700' :
                        'bg-sand-100 text-sand-700'
                      }`}>
                        {flag.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-bluehole-900">{flag.transactions}</td>
                    <td className="py-3 px-4 text-sm text-bluehole-600">
                      {flag.flaggedAt.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-sm text-bluehole-600 hover:text-bluehole-900 font-medium">
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function LogsTab() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<BlockchainEvent[]>([]);
  const [filter, setFilter] = React.useState({ pallet: '', event: '', search: '' });
  const [autoScroll, setAutoScroll] = React.useState(true);

  React.useEffect(() => {
    const setupEventStream = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize blockchain connection
        await blockchainService.initialize();

        // Subscribe to all events
        const unsubscribe = await blockchainService.subscribeToAllEvents((event) => {
          setEvents(prev => {
            const newEvents = [event, ...prev].slice(0, 1000); // Keep last 1000 events
            return newEvents;
          });
        });

        setLoading(false);

        return unsubscribe;
      } catch (err) {
        console.error('Failed to setup event stream:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup event stream');
        setLoading(false);
        return () => {};
      }
    };

    const unsubscribePromise = setupEventStream();

    return () => {
      unsubscribePromise.then(unsub => unsub());
    };
  }, []);

  const filteredEvents = events.filter(event => {
    if (filter.pallet && event.pallet !== filter.pallet) return false;
    if (filter.event && event.event !== filter.event) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        event.pallet.toLowerCase().includes(searchLower) ||
        event.event.toLowerCase().includes(searchLower) ||
        JSON.stringify(event.data).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const exportLogs = (format: 'csv' | 'json') => {
    const { exportToCSV, exportToJSON } = require('@/services/analytics');
    
    const data = filteredEvents.map(e => ({
      block: e.blockNumber,
      timestamp: e.timestamp.toISOString(),
      pallet: e.pallet,
      event: e.event,
      data: JSON.stringify(e.data),
    }));

    if (format === 'csv') {
      exportToCSV(data, `blockchain-logs-${Date.now()}.csv`);
    } else {
      exportToJSON(data, `blockchain-logs-${Date.now()}.json`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-sand-200 rounded-lg"></div>
        <div className="h-96 bg-sand-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <Warning size={48} className="mx-auto mb-4 text-maya-600" />
          <h3 className="text-lg font-semibold text-bluehole-900 mb-2">Failed to Setup Event Stream</h3>
          <p className="text-bluehole-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-bluehole-600 text-white rounded-lg hover:bg-bluehole-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <List size={20} className="text-bluehole-600" />
              <span className="font-semibold text-bluehole-900">Blockchain Events</span>
              <span className="px-2 py-1 rounded-full bg-jungle-100 text-jungle-700 text-xs font-medium">
                {filteredEvents.length} events
              </span>
            </div>
            <label className="flex items-center space-x-2 text-sm text-bluehole-600">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-sand-300 text-bluehole-600 focus:ring-bluehole-500"
              />
              <span>Auto-scroll</span>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportLogs('csv')}
              className="px-4 py-2 bg-sand-100 text-bluehole-700 rounded-lg hover:bg-sand-200 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <DownloadSimple size={18} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => exportLogs('json')}
              className="px-4 py-2 bg-sand-100 text-bluehole-700 rounded-lg hover:bg-sand-200 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <DownloadSimple size={18} />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => setEvents([])}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <Trash size={18} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-bluehole-700 mb-2">Pallet</label>
            <select
              value={filter.pallet}
              onChange={(e) => setFilter(prev => ({ ...prev, pallet: e.target.value }))}
              className="w-full px-4 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-bluehole-500 focus:border-transparent"
            >
              <option value="">All Pallets</option>
              <option value="economy">Economy</option>
              <option value="identity">Identity</option>
              <option value="governance">Governance</option>
              <option value="compliance">Compliance</option>
              <option value="staking">Staking</option>
              <option value="oracle">Oracle</option>
              <option value="belizex">BelizeX</option>
              <option value="landledger">Land Ledger</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-bluehole-700 mb-2">Event Type</label>
            <input
              type="text"
              placeholder="e.g., Transfer, Proposed"
              value={filter.event}
              onChange={(e) => setFilter(prev => ({ ...prev, event: e.target.value }))}
              className="w-full px-4 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-bluehole-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-bluehole-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search events..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-4 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-bluehole-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Event Stream */}
      <Card>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <List size={48} className="mx-auto mb-4 text-sand-400" />
              <p className="text-bluehole-600">
                {events.length === 0 ? 'Waiting for events...' : 'No events match your filters'}
              </p>
            </div>
          ) : (
            filteredEvents.map((event, i) => (
              <div
                key={`${event.blockNumber}-${i}`}
                className="p-3 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors font-mono text-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 rounded bg-bluehole-100 text-bluehole-700 font-semibold">
                      #{event.blockNumber}
                    </span>
                    <span className="px-2 py-1 rounded bg-caribbean-100 text-caribbean-700 font-medium">
                      {event.pallet}
                    </span>
                    <span className="px-2 py-1 rounded bg-maya-100 text-maya-700">
                      {event.event}
                    </span>
                  </div>
                  <span className="text-xs text-bluehole-500">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-bluehole-600 bg-sand-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

interface StatsCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

function StatsCard({ icon: Icon, label, value, change, trend, color }: StatsCardProps) {
  const colorClasses = {
    jungle: 'from-jungle-500 to-jungle-600',
    caribbean: 'from-caribbean-500 to-caribbean-600',
    maya: 'from-maya-500 to-maya-600',
    bluehole: 'from-bluehole-500 to-bluehole-600',
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <Icon size={96} weight="duotone" />
      </div>
      <div className="relative">
        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} mb-3`}>
          <Icon size={24} weight="duotone" className="text-white" />
        </div>
        <p className="text-sm text-bluehole-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-bluehole-900 mb-2">{value}</p>
        <div className="flex items-center space-x-1">
          <span className={`text-sm font-medium ${trend === 'up' ? 'text-jungle-600' : trend === 'down' ? 'text-red-600' : 'text-bluehole-600'}`}>
            {change}
          </span>
        </div>
      </div>
    </Card>
  );
}

interface StatusItemProps {
  icon: React.ComponentType<any>;
  label: string;
  status: 'operational' | 'warning' | 'error';
  value: string;
}

function StatusItem({ icon: Icon, label, status, value }: StatusItemProps) {
  const statusColors = {
    operational: 'bg-jungle-100 text-jungle-700 border-jungle-200',
    warning: 'bg-maya-100 text-maya-700 border-maya-200',
    error: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="flex items-start space-x-3 p-4 rounded-lg border border-sand-200 bg-sand-50">
      <div className="p-2 rounded-lg bg-white">
        <Icon size={24} className="text-bluehole-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-bluehole-900 mb-1">{label}</p>
        <p className="text-sm text-bluehole-600 mb-2">{value}</p>
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  time: string;
  action: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

function ActivityItem({ time, action, description, icon: Icon, color }: ActivityItemProps) {
  const colorClasses = {
    jungle: 'bg-jungle-100 text-jungle-600',
    caribbean: 'bg-caribbean-100 text-caribbean-600',
    maya: 'bg-maya-100 text-maya-800',
    bluehole: 'bg-bluehole-100 text-bluehole-600',
  };

  return (
    <div className="flex items-start space-x-3 p-4 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors">
      <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
        <Icon size={20} weight="duotone" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-bluehole-900">{action}</p>
          <span className="text-xs text-bluehole-500">{time}</span>
        </div>
        <p className="text-sm text-bluehole-600">{description}</p>
      </div>
    </div>
  );
}
