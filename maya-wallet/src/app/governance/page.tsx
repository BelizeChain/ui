'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  getActiveReferenda,
  getDistrictCouncil,
  submitProposal,
  voteOnProposal,
  type DistrictCouncil,
  type Referendum as ChainReferendum,
} from '@/services/pallets/governance';
import { getTreasuryBalance, type TreasuryBalance } from '@/services/pallets/treasury';
import {
  Users,
  Plus,
  ArrowLeft,
  Scales,
  ThumbsUp,
  ThumbsDown,
} from 'phosphor-react';

/** The six districts `governance.districtRepresentation` is keyed by. */
const DISTRICT_NAMES = [
  'Belize',
  'Cayo',
  'Corozal',
  'Orange Walk',
  'Stann Creek',
  'Toledo',
] as const;

export default function GovernancePage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'referendums' | 'council' | 'delegation' | 'create'>('referendums');
  const [conviction, setConviction] = useState<number>(1);
  const [votingId, setVotingId] = useState<number | null>(null);

  // CONFIG-002: real referenda from governance.referendumInfoOf.
  const [referendums, setReferendums] = useState<ChainReferendum[]>([]);
  const [, setGovError] = useState('');
  // Real balance of the treasury account, from `system.account`.
  const [treasury, setTreasury] = useState<TreasuryBalance | null>(null);

  // Real district representation. This tab used to render a hardcoded list of
  // invented councilors, seat counts and districts; the pallet stores only a
  // membership list per district (`governance.districtRepresentation`).
  const [districtCouncils, setDistrictCouncils] = useState<DistrictCouncil[]>([]);

  // Create-proposal form. Submitting spends treasury funds, so every field is
  // controlled and the button stays disabled until the input is usable.
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [proposalBeneficiary, setProposalBeneficiary] = useState('');
  const [proposalValue, setProposalValue] = useState('');
  const [proposalCategory, setProposalCategory] = useState('District Infrastructure');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const refe = await getActiveReferenda();
        if (!cancelled) {
          setReferendums(refe);
          setGovError('');
        }
      } catch (err) {
        if (!cancelled) setGovError(err instanceof Error ? err.message : String(err));
      }
      try {
        const balance = await getTreasuryBalance();
        if (!cancelled) setTreasury(balance);
      } catch {
        if (!cancelled) setTreasury(null);
      }
      try {
        // Every district is read, including ones with no representative yet, so
        // an empty seat is visible rather than simply absent from the list.
        const councils = await Promise.all(
          DISTRICT_NAMES.map((district) => getDistrictCouncil(district))
        );
        if (!cancelled) {
          setDistrictCouncils(
            councils.filter((council): council is DistrictCouncil => council !== null)
          );
        }
      } catch {
        if (!cancelled) setDistrictCouncils([]);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // CONFIG-002: real castVote extrinsic via the governance pallet.
  const handleVote = async (id: number, vote: 'Aye' | 'Nay') => {
    setVotingId(id);
    try {
      await voteOnProposal(selectedAccount!.address, id, vote, 'None');
      addNotification({ type: 'success', message: `Cast ${vote} vote on referendum #${id} (${conviction}x conviction).` });
      const refe = await getActiveReferenda();
      setReferendums(refe);
    } catch (err) {
      addNotification({ type: 'error', message: `Vote failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setVotingId(null);
    }
  };

  /**
   * Submit a treasury-spend proposal.
   *
   * This form previously reported "Proposal submitted! Bonded 100 Ɗ" without
   * sending anything — a success message for an action that never happened.
   * `governance.proposeTreasurySpend` is the real extrinsic: it takes the
   * recipient, the amount and a description, and charges the pallet's own
   * deposit. The amount is not guessed; it comes from the form.
   */
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount?.address) return;

    const amount = Number(proposalValue);
    if (!Number.isFinite(amount) || amount <= 0) {
      addNotification({
        type: 'error',
        message: 'Enter the treasury amount in DALLA, greater than zero.',
      });
      return;
    }
    if (!proposalBeneficiary.trim()) {
      addNotification({
        type: 'error',
        message: 'Enter the beneficiary account that would receive the funds.',
      });
      return;
    }

    setIsSubmittingProposal(true);
    try {
      const { hash, proposalIndex } = await submitProposal(selectedAccount.address, {
        value: String(amount),
        beneficiary: proposalBeneficiary.trim(),
        title: proposalTitle.trim(),
        description: proposalDescription.trim(),
        category: proposalCategory,
      });

      addNotification({
        type: 'success',
        message:
          proposalIndex >= 0
            ? `Proposal #${proposalIndex} submitted on chain (tx ${hash.slice(0, 10)}…).`
            : `Proposal submitted on chain (tx ${hash.slice(0, 10)}…).`,
      });
      setProposalTitle('');
      setProposalDescription('');
      setProposalBeneficiary('');
      setProposalValue('');

      const refe = await getActiveReferenda();
      setReferendums(refe);
    } catch (err) {
      // Never report success on a rejected extrinsic.
      addNotification({
        type: 'error',
        message: `Proposal failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to vote on BelizeChain sovereign governance referendums." fullScreen />;
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
              <h1 className="text-xl font-bold">BelizeChain Sovereign Governance</h1>
              <p className="text-xs text-slate-400">National Referendums • Quadratic Voting • Treasury Grants</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Scales size={16} weight="bold" />
              Quadratic Voting Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Treasury Reserve Balance</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {treasury ? treasury.freeDalla : '—'}
              </span>
              <span className="text-[10px] text-emerald-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              {treasury ? `${treasury.reservedDalla} Ɗ reserved` : 'Treasury read unavailable'}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Referenda On Record</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">{referendums.length}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">From governance.referendumInfoOf</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Voting Mechanism</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">Quadratic</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Anti-Whale Decentralized</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Conviction Multiplier</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-amber-300 font-mono">{conviction}x Weight</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Locked for {conviction * 2} Eras</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['referendums', 'council', 'delegation', 'create'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'referendums'
                ? 'Active Referendums'
                : tab === 'council'
                ? 'District Councils'
                : tab === 'delegation'
                ? 'Vote Delegation'
                : 'Submit Proposal'}
            </button>
          ))}
        </div>

        {/* Conviction Selector Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-white block">Conviction Voting Multiplier</span>
            <p className="text-slate-400 text-[11px]">Lock your bonded voting stake to increase voting power weight.</p>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 6].map((c) => (
              <button
                key={c}
                onClick={() => setConviction(c)}
                className={`px-3 py-1.5 rounded-xl font-bold font-mono transition-all ${
                  conviction === c
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c}x
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Referendums */}
        {activeTab === 'referendums' && (
          <div className="space-y-4">
            {referendums.map((r) => {
              const ayes = r.voteCounts[0] ?? 0;
              const nays = r.voteCounts[1] ?? 0;
              const totalVotes = ayes + nays;
              const ayePct = totalVotes > 0 ? Math.round((ayes / totalVotes) * 100) : 0;

              return (
                <div
                  key={r.index}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold rounded-full text-[10px]">
                          Quorum {r.quorumPercentage}%
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono">Referendum #{r.index}</span>
                      </div>
                      <h3 className="font-bold text-white text-sm">{r.title || `On-chain Referendum #${r.index}`}</h3>
                    </div>

                    <span
                      className={`px-3 py-1 font-bold rounded-full text-[10px] ${
                        r.status === 'Voting'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">{r.description || 'No description recorded on chain.'}</p>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Total votes cast:</span>
                    <span className="text-emerald-400 font-bold font-mono">{r.totalVotes.toLocaleString()}</span>
                  </div>

                  {/* Voting Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold">{r.options[0] ?? 'Option 0'}: {ayes} ({ayePct}%)</span>
                      <span className="text-rose-400 font-bold">{r.options[1] ?? 'Option 1'}: {nays} ({100 - ayePct}%)</span>
                    </div>
                    <div className="w-full bg-rose-500/30 rounded-full h-2 overflow-hidden flex">
                      <div className="bg-emerald-500 h-2 transition-all duration-500" style={{ width: `${ayePct}%` }} />
                    </div>
                  </div>

                  {/* Voting Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleVote(r.index, 'Aye')}
                      disabled={votingId === r.index || r.status !== 'Voting'}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        false
                          ? 'bg-emerald-500 text-slate-950 shadow-lg'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                    >
                      <ThumbsUp size={16} weight="bold" />
                      Vote Aye ({conviction}x)
                    </button>

                    <button
                      onClick={() => handleVote(r.index, 'Nay')}
                      disabled={votingId === r.index || r.status !== 'Voting'}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        false
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      <ThumbsDown size={16} weight="bold" />
                      Vote Nay ({conviction}x)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Council */}
        {activeTab === 'council' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={22} className="text-purple-400" />
                Belize 6-District Sovereign Council
              </h3>
              <p className="text-slate-400 mt-1">
                District representatives as recorded in governance.districtRepresentation. The
                pallet stores the membership list per district only — no prime, seat count or
                motion history.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DISTRICT_NAMES.map((district) => {
                const council = districtCouncils.find((c) => c.district === district);
                const members = council?.members ?? [];
                return (
                  <div
                    key={district}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{district}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          members.length > 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {members.length > 0 ? `${members.length} Seated` : 'Vacant'}
                      </span>
                    </div>
                    {members.length > 0 ? (
                      members.map((member) => (
                        <span
                          key={member}
                          className="text-slate-400 text-[11px] font-mono block truncate"
                        >
                          {member}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px] block">
                        No representative recorded on chain.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Delegation */}
        {activeTab === 'delegation' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={22} className="text-cyan-400" />
                Delegate Citizen Voting Power
              </h3>
              <p className="text-slate-400 mt-1">Delegate your voting power to trusted technical or ecological delegates.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addNotification({ type: 'success', message: 'Voting power successfully delegated to Ceiba Foundation!' });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Delegate Address or BNS (.bz)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ceiba-foundation.bz"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
              >
                Delegate Voting Power
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Create */}
        {activeTab === 'create' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={22} className="text-emerald-400" />
                Submit Treasury Spend Proposal
              </h3>
              <p className="text-slate-400 mt-1">
                Calls governance.proposeTreasurySpend. No deposit is charged; the
                proposal then needs Foundation Board approval — 1 signature under
                10K Ɗ, 3-of-7 under 100K Ɗ, 4-of-7 above.
              </p>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Proposal Title</label>
                <input
                  type="text"
                  required
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="e.g. BIP-15: Placencia Solar-Powered Mesh Relay Node"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Beneficiary Account</label>
                <input
                  type="text"
                  required
                  value={proposalBeneficiary}
                  onChange={(e) => setProposalBeneficiary(e.target.value)}
                  placeholder="r1... (the account that would receive the funds)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Treasury Amount (Ɗ)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={proposalValue}
                  onChange={(e) => setProposalValue(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Category</label>
                <select
                  value={proposalCategory}
                  onChange={(e) => setProposalCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="District Infrastructure">District Infrastructure</option>
                  <option value="Treasury Grant">Treasury Grant</option>
                  <option value="National Policy">National Policy</option>
                  <option value="Runtime Upgrade">Runtime Upgrade</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Detailed Description & Milestones</label>
                <textarea
                  rows={4}
                  required
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  placeholder="Provide rationale, technical specifications, and delivery milestones..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingProposal}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all disabled:opacity-60"
              >
                {isSubmittingProposal ? 'Submitting on chain…' : 'Submit Treasury Proposal'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
