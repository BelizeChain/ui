'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  getTreasuryBalance,
  getTreasurySpendProposals,
  TREASURY_ADDRESS,
  type TreasuryBalance,
  type TreasurySpendProposalView,
} from '@/services/pallets/treasury';
import {
  Vault,
  Users,
  Wallet,
  ShieldCheck,
  Coins,
  Scales,
  ArrowLeft,
} from 'phosphor-react';

/**
 * The runtime does not register `pallet_treasury`. Treasury funds sit in the
 * sovereign account derived from `TreasuryPalletId = b"py/trsry"`, and spends
 * are `TreasurySpend` governance proposals. Everything on this page is read
 * from those two sources — there is no multi-sig vault and no AMM pool behind
 * the sovereign reserves, so neither is shown.
 */
export default function TreasuryPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'disbursements'>('overview');
  const [balance, setBalance] = useState<TreasuryBalance | null>(null);
  const [disbursements, setDisbursements] = useState<TreasurySpendProposalView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [bal, proposals] = await Promise.all([
          getTreasuryBalance(),
          getTreasurySpendProposals(),
        ]);
        if (cancelled) return;
        setBalance(bal);
        setDisbursements(proposals);
        setError('');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setDisbursements([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Approve/execute are governance extrinsics; this page is read-only.
  const handleApproveDisbursement = useCallback(
    (id: number) => {
      addNotification({
        type: 'info',
        message: `Proposal #${id} is voted on through the governance flow (castVote). This page is read-only.`,
      });
    },
    [addNotification],
  );

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to view the BelizeChain sovereign treasury account and its spend proposals."
        fullScreen
      />
    );
  }

  const shortAddress = `${TREASURY_ADDRESS.slice(0, 10)}…${TREASURY_ADDRESS.slice(-8)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button
                title="Return to Maya Wallet"
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all border border-slate-700/50"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Vault size={22} className="text-amber-400" />
                Sovereign Treasury Account
              </h1>
              <p className="text-xs text-slate-400">
                PalletId py/trsry • treasury spends are governance proposals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
              <ShieldCheck size={14} weight="fill" />
              {loading ? 'Reading…' : `${disbursements.length} live proposals`}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200">
            Could not read the treasury account: {error}
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Free Balance
              </span>
              <Coins size={18} className="text-emerald-400" />
            </div>
            <span className="text-2xl font-bold font-mono text-emerald-400 block">
              {balance ? `${balance.freeDalla} Ɗ` : '—'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              system.account(free) on the treasury account
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Reserved Balance
              </span>
              <Wallet size={18} className="text-cyan-400" />
            </div>
            <span className="text-2xl font-bold font-mono text-cyan-300 block">
              {balance ? `${balance.reservedDalla} Ɗ` : '—'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              system.account(reserved) on the treasury account
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Treasury Account
              </span>
              <Users size={18} className="text-purple-400" />
            </div>
            <span className="text-sm font-bold font-mono text-purple-300 block break-all">
              {shortAddress}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(TREASURY_ADDRESS);
                addNotification({ type: 'success', message: 'Treasury address copied.' });
              }}
              className="text-[11px] text-slate-400 font-mono hover:text-white transition-colors"
            >
              Copy full address
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Live Spend Proposals
              </span>
              <Scales size={18} className="text-amber-400" />
            </div>
            <span className="text-2xl font-bold font-mono text-amber-300 block">
              {loading ? '—' : disbursements.length}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              reflect governance pallet proposals
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold gap-1">
          {(['overview', 'disbursements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'overview' ? 'Treasury Account' : 'Spend Proposals'}
            </button>
          ))}
        </div>

        {/* Tab 1: Treasury account */}
        {activeTab === 'overview' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Vault size={22} className="text-amber-400" />
                Sovereign Account
              </h3>
              <p className="text-slate-400 mt-1">
                Derived from <span className="font-mono">TreasuryPalletId = b&quot;py/trsry&quot;</span>.
                The runtime does not register <span className="font-mono">pallet_treasury</span>, so there
                is no `Treasury` storage item to show — only this account&apos;s balances.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Address:</span>
                <span className="text-cyan-300 break-all text-right">{TREASURY_ADDRESS}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Free (planck):</span>
                <span className="text-slate-200">{balance?.freePlanck ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reserved (planck):</span>
                <span className="text-slate-200">{balance?.reservedPlanck ?? '—'}</span>
              </div>
            </div>

            <p className="text-slate-500 text-[11px] leading-relaxed">
              Inflows to this account are whatever the runtime routes to the pallet id. This page does not
              model reward allocations, registry fees or royalty splits — those are runtime concerns and
              are not readable from the wallet.
            </p>
          </div>
        )}

        {/* Tab 2: Spend proposals */}
        {activeTab === 'disbursements' && (
          <div className="space-y-4">
            {!loading && disbursements.length === 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 text-xs">
                No treasury-spend proposals are live on chain.
              </div>
            )}

            {disbursements.map((d) => (
              <div
                key={d.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-md text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold">
                        {d.beneficiary ? 'Treasury Spend' : 'Proposal'}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px] font-bold">#{d.id}</span>
                    </div>
                    <h3 className="font-bold text-white text-base">{d.title}</h3>
                    <span className="text-slate-400 text-xs font-mono">
                      Beneficiary: {d.beneficiary || 'none'}
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-emerald-400 text-lg block">{d.amountDalla} DALLA</span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold inline-block mt-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {d.status} ({d.voteCount.ayes} ayes / {d.voteCount.nays} nays)
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed text-xs">{d.description}</p>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Proposer:</span>
                    <span className="text-slate-300">{d.proposer}</span>
                  </div>

                  {d.voteEnd > 0 && (
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Voting Ends:</span>
                      <span className="text-cyan-400 font-bold">
                        {new Date(d.voteEnd).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleApproveDisbursement(d.id)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    <ShieldCheck size={16} weight="bold" />
                    Vote in Governance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
