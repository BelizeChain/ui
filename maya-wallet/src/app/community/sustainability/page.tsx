'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  getGreenProjects,
  contributeToGreenProject,
  getUserSRS,
  type GreenProject,
  type SRSInfo,
} from '@/services/pallets/community';
import {
  getMeshNetworkCoverage,
  getRelayMiningStats,
  getGatewayStatus,
  claimRelayRewards,
  type MeshNetworkCoverage,
  type RelayMiningStats,
  type MeshGatewayStatus,
} from '@/services/pallets/mesh';
import { Leaf, ArrowLeft, ShieldCheck, Sun, Warning } from 'phosphor-react';

type Tab = 'projects' | 'mesh' | 'srs';

/**
 * Every figure on this page comes from `pallet_belize_community` (green
 * projects, social-responsibility score) or `pallet_belize_mesh` (network
 * coverage, relay mining).
 *
 * Removed here: three hardcoded projects with invented funding targets and
 * carbon-credit counts, a "5,200 MT CO2e / 340 Ha / +3.5% APR / 2.5% rebate"
 * metric row, live-looking node telemetry ("Battery: 98% • Solar Influx: 42W •
 * Mesh Packets Relayed: 14,204") and two eco-tourism badges attributed to
 * ministries that never issued them. The pallet stores no carbon-credit,
 * uptime, APR-booster or badge concept.
 */
export default function SustainabilityPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [projects, setProjects] = useState<GreenProject[]>([]);
  const [srs, setSrs] = useState<SRSInfo | null>(null);
  const [coverage, setCoverage] = useState<MeshNetworkCoverage | null>(null);
  const [relayStats, setRelayStats] = useState<RelayMiningStats | null>(null);
  const [gateway, setGateway] = useState<MeshGatewayStatus | null>(null);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const address = selectedAccount?.address;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [greenProjects, meshCoverage] = await Promise.all([
        getGreenProjects(),
        getMeshNetworkCoverage(),
      ]);
      setProjects(greenProjects);
      setCoverage(meshCoverage);

      if (address) {
        const [srsInfo, stats, gatewayStatus] = await Promise.all([
          getUserSRS(address),
          getRelayMiningStats(address),
          getGatewayStatus(address),
        ]);
        setSrs(srsInfo);
        setRelayStats(stats);
        setGateway(gatewayStatus);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    // Deferred so the effect body doesn't call setState synchronously
    // (react-hooks/set-state-in-effect).
    Promise.resolve().then(load);
  }, [load]);

  const handleContribute = async (project: GreenProject) => {
    if (!address) return;
    const raw = amounts[project.projectId] ?? '25';
    const amount = Math.floor(parseFloat(raw));
    if (!Number.isFinite(amount) || amount <= 0) {
      addNotification({ type: 'error', message: 'Enter a whole-DALLA amount greater than zero.' });
      return;
    }

    setBusyId(project.projectId);
    try {
      const { hash } = await contributeToGreenProject(address, project.projectId, String(amount));
      addNotification({
        type: 'success',
        message: `Contributed ${amount} DALLA to "${project.name}" (tx ${hash.slice(0, 10)}…).`,
      });
      await load();
    } catch (err) {
      // Never report success on a rejected extrinsic.
      addNotification({
        type: 'error',
        message: `Contribution failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleClaimRelayRewards = async () => {
    if (!address) return;
    setIsClaiming(true);
    try {
      const { amountClaimed } = await claimRelayRewards(address);
      addNotification({
        type: 'success',
        message: `Claimed ${amountClaimed} DALLA in relay rewards.`,
      });
      await load();
    } catch (err) {
      addNotification({
        type: 'error',
        message: `Relay reward claim failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to view BelizeChain green projects and mesh relay mining."
        fullScreen
      />
    );
  }

  const totalRaised = projects.reduce(
    (sum, p) => sum + (parseFloat(p.currentFunding) || 0),
    0,
  );
  const totalContributors = projects.reduce((sum, p) => sum + p.contributorCount, 0);
  const activeProjects = projects.filter((p) => p.isActive).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Green Projects & Mesh Relay</h1>
              <p className="text-xs text-slate-400">
                pallet community • pallet mesh
              </p>
            </div>
          </div>
          <button
            onClick={() => load()}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full text-xs font-bold"
          >
            {loading ? 'Reading…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* Real aggregate metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Green Projects</span>
            <span className="text-lg font-bold text-emerald-400 font-mono block">
              {loading ? '—' : projects.length}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {activeProjects} active on chain
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Funding Raised</span>
            <span className="text-lg font-bold text-cyan-300 font-mono block">
              {loading ? '—' : `${totalRaised.toFixed(2)} Ɗ`}
            </span>
            <span className="text-[11px] text-slate-400 block">sum of currentFunding</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Contributors</span>
            <span className="text-lg font-bold text-purple-300 font-mono block">
              {loading ? '—' : totalContributors}
            </span>
            <span className="text-[11px] text-slate-400 block">counted per project</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Your SRS</span>
            <span className="text-lg font-bold text-amber-300 font-mono block">
              {srs ? `${srs.score} / 10000` : '—'}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {srs ? `tier ${srs.tier}` : 'no score recorded'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold">
          {(
            [
              { id: 'projects', label: 'Green Projects' },
              { id: 'mesh', label: 'Mesh Relay Mining' },
              { id: 'srs', label: 'Social Responsibility' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[150px] py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: green projects */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {!loading && projects.length === 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 text-xs">
                No green projects are registered on chain.
              </div>
            )}

            {projects.map((project) => {
              const target = parseFloat(project.targetFunding) || 0;
              const current = parseFloat(project.currentFunding) || 0;
              const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

              return (
                <div
                  key={project.projectId}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            project.isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {project.isActive ? 'Active' : 'Closed'}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-800 rounded-full text-[10px] font-bold text-slate-300">
                          {project.category}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          #{project.projectId}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-sm">{project.name}</h3>
                      <p className="text-slate-400 text-[11px]">{project.description}</p>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <span className="text-white font-bold block">
                        {project.currentFunding} Ɗ
                      </span>
                      <span className="text-slate-500 text-[10px] block">
                        of {project.targetFunding} Ɗ target
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>{progress.toFixed(1)}% funded</span>
                      <span>{project.contributorCount} contributor{project.contributorCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  {project.milestones.length > 0 && (
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Milestones
                      </span>
                      {project.milestones.map((m, i) => (
                        <div key={i} className="flex justify-between text-[11px] gap-3">
                          <span className="text-slate-300">{m.description}</span>
                          <span className={m.achieved ? 'text-emerald-400' : 'text-slate-500'}>
                            {m.achieved ? 'reached' : `${m.targetAmount} Ɗ`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amounts[project.projectId] ?? '25'}
                      onChange={(e) =>
                        setAmounts((prev) => ({ ...prev, [project.projectId]: e.target.value }))
                      }
                      className="w-full sm:w-32 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                      aria-label="Contribution amount in DALLA"
                    />
                    <button
                      onClick={() => handleContribute(project)}
                      disabled={busyId === project.projectId || !project.isActive}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Leaf size={14} weight="bold" />
                      {busyId === project.projectId ? 'Submitting…' : 'Contribute DALLA'}
                    </button>
                  </div>
                </div>
              );
            })}

            <p className="text-[11px] text-slate-500 flex items-start gap-2">
              <Warning size={14} className="text-slate-500 shrink-0 mt-0.5" weight="bold" />
              Contributions go through <span className="font-mono">community.contributeToGreenProject</span>
              , which takes whole-DALLA units. The pallet stores no carbon-credit or hectare figure,
              so none is displayed.
            </p>
          </div>
        )}

        {/* Tab 2: mesh relay */}
        {activeTab === 'mesh' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sun size={22} className="text-amber-400" />
                  LoRa Mesh Relay Network
                </h3>
                <p className="text-slate-400 mt-1">
                  Read from <span className="font-mono">mesh.meshNodes</span> and{' '}
                  <span className="font-mono">mesh.relayRewards</span>.
                </p>
              </div>

              {coverage ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                  {(
                    [
                      ['Total nodes', coverage.totalNodes],
                      ['Active nodes', coverage.activeNodes],
                      ['Gateway nodes', coverage.gatewayNodes],
                      ['Messages relayed', coverage.messagesRelayed],
                      ['Transactions relayed', coverage.transactionsRelayed],
                      ['Emergency alerts', coverage.emergencyAlertsSent],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1"
                    >
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        {label}
                      </span>
                      <span className="text-white font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">Mesh network data is unavailable.</p>
              )}
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white">Your Relay Mining</h3>

              {!relayStats ? (
                <p className="text-slate-400">
                  You do not own a mesh node, so there is nothing to relay or claim.
                  {gateway && !gateway.hasGateway && ' A gateway node is required to settle mesh transactions.'}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Node</span>
                      <span className="text-white">{relayStats.nodeId}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Packets relayed
                      </span>
                      <span className="text-white">{relayStats.packetsRelayed}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Transactions relayed
                      </span>
                      <span className="text-white">{relayStats.transactionsRelayed}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Reputation
                      </span>
                      <span className="text-white">
                        {relayStats.reputationScore} / 10000
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Unclaimed rewards
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {relayStats.unclaimedRewardsDalla} Ɗ
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Gateway
                      </span>
                      <span className="text-white">{String(relayStats.isGateway)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-start gap-2">
                    <Warning size={14} className="text-slate-500 shrink-0 mt-0.5" weight="bold" />
                    The pallet records no uptime percentage and no lifetime-total figure, so neither is
                    shown. The previous panel displayed a battery level, a solar wattage and a packet
                    count that came from nowhere.
                  </p>

                  <button
                    onClick={handleClaimRelayRewards}
                    disabled={isClaiming || parseFloat(relayStats.unclaimedRewardsDalla) <= 0}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs transition-all"
                  >
                    {isClaiming ? 'Claiming…' : 'Claim Relay Rewards'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: social responsibility score */}
        {activeTab === 'srs' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={22} className="text-purple-400" />
                Social Responsibility Score
              </h3>
              <p className="text-slate-400 mt-1">
                Read from <span className="font-mono">community.socialResponsibilityScores</span> for{' '}
                <span className="font-mono">{address?.slice(0, 12)}…</span>
              </p>
            </div>

            {loading ? (
              <p className="text-slate-400">Reading…</p>
            ) : !srs ? (
              <p className="text-slate-400">
                No social-responsibility score is recorded for this account.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                  {(
                    [
                      ['Score', `${srs.score} / 10000`],
                      ['Tier', String(srs.tier)],
                      ['Participations', String(srs.participationCount)],
                      ['Volunteer hours', String(srs.volunteerHours)],
                      ['Education modules', String(srs.educationModulesCompleted)],
                      ['Green contributions', `${srs.greenProjectContributions} Ɗ`],
                      ['Monthly fee exemption', `${srs.monthlyFeeExemption} Ɗ`],
                      [
                        'Last updated',
                        srs.lastUpdated > 0 ? new Date(srs.lastUpdated).toLocaleString() : '—',
                      ],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1"
                    >
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        {label}
                      </span>
                      <span className="text-white font-bold">{value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 flex items-start gap-2">
                  <Warning size={14} className="text-slate-500 shrink-0 mt-0.5" weight="bold" />
                  Eco-tourism &quot;badges&quot; previously shown here were attributed to government
                  ministries. The community pallet issues no such credential.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
