'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import { getEconomySupply, type EconomySupply } from '@/services/pallets/economy';
import {
  getComplianceStatus,
  getAccountRestriction,
  type ComplianceStatusView,
  type RestrictionView,
} from '@/services/pallets/compliance';
import {
  ArrowLeft,
  ShieldCheck,
  IdentificationCard,
  Bank,
  Scales,
  Warning,
} from 'phosphor-react';

type Tab = 'reserve' | 'kyc' | 'limits';

/**
 * Everything on this page is read from `pallet_belize_economy` and
 * `pallet_belize_compliance`.
 *
 * The pallet stores no tier-based transaction limits and no exportable
 * certificate, and `compliance.totalReserves` / `compliance.totalLiabilities`
 * do not exist — an earlier version queried them, always failed, and then
 * displayed hardcoded reserves, a 65/35.2 collateral split, a synthetic
 * "ZK proof hash" and a PDF export that produced nothing.
 */
export default function CompliancePage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<Tab>('reserve');
  const [supply, setSupply] = useState<EconomySupply | null>(null);
  const [status, setStatus] = useState<ComplianceStatusView | null>(null);
  const [restriction, setRestriction] = useState<RestrictionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const address = selectedAccount?.address;

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [economy, complianceStatus, restrictionView] = await Promise.all([
        getEconomySupply(),
        getComplianceStatus(address),
        getAccountRestriction(address),
      ]);
      setSupply(economy);
      setStatus(complianceStatus);
      setRestriction(restrictionView);
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

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to view Central Bank reserves and your on-chain compliance record."
        fullScreen
      />
    );
  }

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
              <h1 className="text-xl font-bold">Regulatory Compliance</h1>
              <p className="text-xs text-slate-400">
                pallet economy reserves • pallet compliance account status
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              load();
              addNotification({ type: 'info', message: 'Re-reading compliance data from chain.' });
            }}
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

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold gap-1">
          {(
            [
              { id: 'reserve', label: 'Reserves & Backing' },
              { id: 'kyc', label: 'My Compliance Record' },
              { id: 'limits', label: 'Reporting Thresholds' },
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

        {/* Tab 1: Reserves & backing */}
        {activeTab === 'reserve' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bank size={22} className="text-emerald-400" />
                bBZD Reserves &amp; Backing
              </h3>
              <p className="text-slate-400 mt-1">
                Read from <span className="font-mono">economy.centralBankReserves</span> and{' '}
                <span className="font-mono">economy.totalBbzdSupply</span>. The pallet documents the
                reserves as held <em>off-chain</em> and reported on chain for audit transparency, so
                this ratio is a reported figure — not an independent audit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  bBZD Circulating Supply
                </span>
                <span className="text-xl font-bold text-white font-mono block">
                  {supply ? `${supply.bbzdTotalSupply} BZ$` : '—'}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  economy.totalBbzdSupply
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Reported CB Reserves
                </span>
                <span className="text-xl font-bold text-emerald-400 font-mono block">
                  {supply ? `${supply.centralBankReserves} BZ$` : '—'}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  economy.centralBankReserves
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Reported Backing Ratio
                </span>
                <span
                  className={`text-xl font-bold font-mono block ${
                    supply?.backingRatioPercent != null && supply.backingRatioPercent >= 100
                      ? 'text-emerald-400'
                      : 'text-amber-300'
                  }`}
                >
                  {supply?.backingRatioPercent == null
                    ? '—'
                    : `${supply.backingRatioPercent.toFixed(2)}%`}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {supply?.backingRatioPercent == null
                    ? 'undefined while no bBZD is minted'
                    : 'reserves ÷ bBZD supply'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Minting halted flag:</span>
                <span className={supply?.mintingHalted ? 'text-rose-300' : 'text-slate-200'}>
                  {supply ? String(supply.mintingHalted) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DALLA total supply:</span>
                <span className="text-slate-200">
                  {supply ? `${supply.dallaTotalSupply} Ɗ` : '—'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 flex items-start gap-2">
              <Warning size={14} className="text-slate-500 shrink-0 mt-0.5" weight="bold" />
              pallet compliance stores no reserve or liability figures, so no per-asset collateral
              breakdown can be shown. The previous 65% / 35.2% T-Bill split was hardcoded.
            </p>
          </div>
        )}

        {/* Tab 2: Account compliance record */}
        {activeTab === 'kyc' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IdentificationCard size={22} className="text-purple-400" />
                On-Chain Compliance Record
              </h3>
              <p className="text-slate-400 mt-1">
                Read from <span className="font-mono">compliance.complianceStatusOf</span> and{' '}
                <span className="font-mono">compliance.restrictedAccounts</span> for{' '}
                <span className="font-mono">{address?.slice(0, 12)}…</span>
              </p>
            </div>

            {loading ? (
              <p className="text-slate-400">Reading…</p>
            ) : !status ? (
              <div className="text-center py-8 text-slate-400">
                No compliance record exists for this account yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Verification level</span>
                  <span className="text-white font-bold">{status.verificationLevel || '—'}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Risk level</span>
                  <span className="text-white font-bold">{status.riskLevel || '—'}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Whitelisted</span>
                  <span className={status.whitelisted ? 'text-emerald-300' : 'text-slate-300'}>
                    {String(status.whitelisted)}
                  </span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Restricted</span>
                  <span className={status.restricted ? 'text-rose-300' : 'text-slate-300'}>
                    {String(status.restricted)}
                  </span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between sm:col-span-2">
                  <span className="text-slate-400">Last verification</span>
                  <span className="text-slate-200">
                    {status.lastVerification > 0
                      ? new Date(status.lastVerification).toLocaleString()
                      : '—'}
                  </span>
                </div>
                {restriction && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 sm:col-span-2">
                    <span className="text-slate-400 block mb-1">Restriction entry</span>
                    <span className="text-slate-200 block">
                      restricted = {String(restriction.restricted)}
                    </span>
                    {restriction.reason && (
                      <span className="text-slate-400 block mt-1 break-all">
                        reason: {restriction.reason}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-slate-500 flex items-start gap-2">
              <Warning size={14} className="text-slate-500 shrink-0 mt-0.5" weight="bold" />
              Sanctions-list screening and PEP checks are not exposed per account, and no
              zero-knowledge clearance certificate is issued — earlier rows claiming
              &quot;ICAO 9303 NFC e-Passport scan&quot;, a daily UN/OFAC screening and a ZK proof
              hash were invented.
            </p>
          </div>
        )}

        {/* Tab 3: Reporting thresholds */}
        {activeTab === 'limits' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scales size={22} className="text-cyan-400" />
                Reporting Thresholds
              </h3>
              <p className="text-slate-400 mt-1">
                pallet compliance exposes no tier-based limit storage. Thresholds set under the Belize
                Money Laundering and Terrorism (Prevention) Act are applied off chain, so nothing can be
                shown here.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <p className="text-slate-300 leading-relaxed">
                What the pallet <em>does</em> store is activity reporting:
              </p>
              <ul className="text-slate-400 space-y-1.5 list-disc pl-5 font-mono text-[11px]">
                <li>
                  <span className="text-slate-300">compliance.suspiciousActivities</span> —
                  AML/CFT flags raised against accounts
                </li>
                <li>
                  <span className="text-slate-300">compliance.auditRecords</span> — audit trail of
                  compliance actions
                </li>
                <li>
                  <span className="text-slate-300">compliance.sanctionsList</span> — sanctions
                  entries keyed by a 32-byte identifier
                </li>
                <li>
                  <span className="text-slate-300">compliance.restrictedAccounts</span> — accounts
                  blocked from operations, with a reason
                </li>
              </ul>
              <p className="text-[11px] text-slate-500">
                An earlier version of this tab showed a 100,000 Ɗ daily limit, a 2,000,000 Ɗ monthly
                cap and an &quot;unlimited&quot; cross-border cap. None of those exist on chain.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" weight="bold" />
              <span>
                Your own flags are visible under <em>My Compliance Record</em>, along with any
                restriction entry the pallet holds for your account.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
