'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GlassCard } from '@/components/ui';
import { getRuntimeConfig } from '@belizechain/shared';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import {
  claimFromFaucet,
  createDaoProposal,
  getFaucetStatus,
  getGemContractCatalog,
  listDaoProposals,
  voteOnDaoProposal,
  getDallaBalance,
  getBeliNftCollection,
  getBeliNftBalanceOf,
  mintBeliNft,
  transferBeliNft,
  listBeliNftsOwnedBy,
  type FaucetStatus,
  type GemContractDescriptor,
  type DaoProposal,
} from '@/services/gem';
import {
  FileCode,
  Code,
  Rocket,
  Package,
  Heart,
  Users,
  Play,
  Download,
  Copy,
  CheckCircle,
  Lightning,
  Diamond,
  ArrowLeft
} from 'phosphor-react';

export default function GemPage() {
  const router = useRouter();
  const { selectedAccount } = useWallet();
  const [activeTab, setActiveTab] = useState<'deploy' | 'contracts' | 'dao' | 'nft'>('deploy');
  const runtimeConfig = getRuntimeConfig();
  const formatAddress = (address?: string) =>
    address ? `${address.slice(0, 8)}…${address.slice(-6)}` : 'Not deployed';

  const catalog: GemContractDescriptor[] = useMemo(() => getGemContractCatalog(), []);
  const deployedCount = catalog.filter((c) => c.deployed).length;

  const [faucetStatus, setFaucetStatus] = useState<FaucetStatus | null>(null);
  const [faucetError, setFaucetError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);

  const refreshFaucet = useCallback(async () => {
    if (!selectedAccount?.address) return;
    try {
      const status = await getFaucetStatus(selectedAccount.address, selectedAccount.address);
      setFaucetStatus(status);
      setFaucetError(null);
    } catch (err) {
      setFaucetError(err instanceof Error ? err.message : 'Failed to read faucet status');
    }
  }, [selectedAccount?.address]);

  useEffect(() => {
    void refreshFaucet();
  }, [refreshFaucet]);

  const handleClaim = useCallback(async () => {
    if (!selectedAccount?.address) {
      setFaucetError('Connect a wallet account to claim from the faucet');
      return;
    }
    setClaiming(true);
    setFaucetError(null);
    setClaimTxHash(null);
    try {
      const hash = await claimFromFaucet(selectedAccount.address);
      setClaimTxHash(hash);
      await refreshFaucet();
    } catch (err) {
      setFaucetError(err instanceof Error ? err.message : 'Faucet claim failed');
    } finally {
      setClaiming(false);
    }
  }, [selectedAccount?.address, refreshFaucet]);

  // DAO state
  const [daoProposals, setDaoProposals] = useState<DaoProposal[]>([]);
  const [daoLoading, setDaoLoading] = useState(false);
  const [daoError, setDaoError] = useState<string | null>(null);
  const [votingPowerRaw, setVotingPowerRaw] = useState<bigint>(0n);
  const [voteBusyId, setVoteBusyId] = useState<number | null>(null);

  // BeliNFT state
  const [nftCollection, setNftCollection] = useState<{ name: string; symbol: string; totalSupply: number } | null>(null);
  const [nftBalance, setNftBalance] = useState<number>(0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshDao = useCallback(async () => {
    if (!selectedAccount?.address) return;
    setDaoLoading(true);
    setDaoError(null);
    try {
      const [proposals, dallaBal] = await Promise.all([
        listDaoProposals(selectedAccount.address, 10),
        getDallaBalance(selectedAccount.address, selectedAccount.address),
      ]);
      setDaoProposals(proposals);
      try {
        setVotingPowerRaw(BigInt(dallaBal));
      } catch {
        setVotingPowerRaw(0n);
      }
    } catch (err) {
      setDaoError(err instanceof Error ? err.message : 'Failed to load DAO data');
    } finally {
      setDaoLoading(false);
    }
  }, [selectedAccount?.address]);

  const refreshNfts = useCallback(async () => {
    if (!selectedAccount?.address) return;
    try {
      const [collection, balance] = await Promise.all([
        getBeliNftCollection(selectedAccount.address),
        getBeliNftBalanceOf(selectedAccount.address, selectedAccount.address),
      ]);
      setNftCollection(collection);
      setNftBalance(balance);
    } catch {
      // best-effort; NFT panel is informational
    }
  }, [selectedAccount?.address]);

  useEffect(() => {
    void refreshDao();
    void refreshNfts();
  }, [refreshDao, refreshNfts]);

  const handleVote = useCallback(
    async (proposalId: number, support: boolean) => {
      if (!selectedAccount?.address) {
        setDaoError('Connect a wallet account to vote');
        return;
      }
      setVoteBusyId(proposalId);
      setDaoError(null);
      try {
        await voteOnDaoProposal(selectedAccount.address, proposalId, support);
        await refreshDao();
      } catch (err) {
        setDaoError(err instanceof Error ? err.message : 'Vote failed');
      } finally {
        setVoteBusyId(null);
      }
    },
    [selectedAccount?.address, refreshDao],
  );

  // Proposal creation form state
  const [propDescription, setPropDescription] = useState('');
  const [propTransferTarget, setPropTransferTarget] = useState('');
  const [propTransferValue, setPropTransferValue] = useState('0');
  const [propBusy, setPropBusy] = useState(false);
  const [propTxHash, setPropTxHash] = useState<string | null>(null);  const handleCreateProposal = useCallback(async () => {
    if (!selectedAccount?.address) {
      setDaoError('Connect a wallet account to create a proposal');
      return;
    }
    const desc = propDescription.trim();
    if (!desc) {
      setDaoError('Description is required');
      return;
    }
    setPropBusy(true);
    setDaoError(null);
    setPropTxHash(null);
    try {
      const target = propTransferTarget.trim() || null;
      const hash = await createDaoProposal(
        selectedAccount.address,
        desc,
        target,
        propTransferValue.trim() || '0',
      );
      setPropTxHash(hash);
      setPropDescription('');
      setPropTransferTarget('');
      setPropTransferValue('0');
      await refreshDao();
    } catch (err) {
      setDaoError(err instanceof Error ? err.message : 'Proposal submission failed');
    } finally {
      setPropBusy(false);
    }
  }, [selectedAccount?.address, propDescription, propTransferTarget, propTransferValue, refreshDao]);

  // NFT form state
  const [nftMintTo, setNftMintTo] = useState('');
  const [nftMintUri, setNftMintUri] = useState('');
  const [nftMintBusy, setNftMintBusy] = useState(false);
  const [nftTransferTo, setNftTransferTo] = useState('');
  const [nftTransferId, setNftTransferId] = useState('');
  const [nftTransferBusy, setNftTransferBusy] = useState(false);
  const [nftTxHash, setNftTxHash] = useState<string | null>(null);
  const [nftError, setNftError] = useState<string | null>(null);
  const [ownedNfts, setOwnedNfts] = useState<Array<{ id: number; uri: string | null }>>([]);

  const refreshOwnedNfts = useCallback(async () => {
    if (!selectedAccount?.address) return;
    try {
      const owned = await listBeliNftsOwnedBy(selectedAccount.address, selectedAccount.address, 100);
      setOwnedNfts(owned);
    } catch {
      setOwnedNfts([]);
    }
  }, [selectedAccount?.address]);

  useEffect(() => {
    if (activeTab === 'nft') void refreshOwnedNfts();
  }, [activeTab, refreshOwnedNfts]);

  const handleMintNft = useCallback(async () => {
    if (!selectedAccount?.address) {
      setNftError('Connect a wallet account first');
      return;
    }
    const to = nftMintTo.trim() || selectedAccount.address;
    const uri = nftMintUri.trim();
    if (!uri) {
      setNftError('Metadata URI is required');
      return;
    }
    setNftMintBusy(true);
    setNftError(null);
    setNftTxHash(null);
    try {
      const hash = await mintBeliNft(selectedAccount.address, to, uri);
      setNftTxHash(hash);
      setNftMintUri('');
      await Promise.all([refreshNfts(), refreshOwnedNfts()]);
    } catch (err) {
      setNftError(err instanceof Error ? err.message : 'Mint failed');
    } finally {
      setNftMintBusy(false);
    }
  }, [selectedAccount?.address, nftMintTo, nftMintUri, refreshNfts, refreshOwnedNfts]);

  const handleTransferNft = useCallback(async () => {
    if (!selectedAccount?.address) {
      setNftError('Connect a wallet account first');
      return;
    }
    const to = nftTransferTo.trim();
    const id = nftTransferId.trim();
    if (!to || !id) {
      setNftError('Recipient and token ID are required');
      return;
    }
    setNftTransferBusy(true);
    setNftError(null);
    setNftTxHash(null);
    try {
      const hash = await transferBeliNft(selectedAccount.address, to, Number(id));
      setNftTxHash(hash);
      setNftTransferId('');
      await Promise.all([refreshNfts(), refreshOwnedNfts()]);
    } catch (err) {
      setNftError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setNftTransferBusy(false);
    }
  }, [selectedAccount?.address, nftTransferTo, nftTransferId, refreshNfts, refreshOwnedNfts]);

  const votingPowerDisplay = useMemo(() => {
    // DALLA has 12 decimals; show whole-token count with thousands separators.
    const whole = votingPowerRaw / 1_000_000_000_000n;
    return whole.toLocaleString();
  }, [votingPowerRaw]);

  const deployedContracts = catalog.map((entry) => ({
    name: entry.label,
    type: entry.type,
    address: formatAddress(entry.address),
    fullAddress: entry.address,
    deployed: entry.deployed,
  }));

  const templates = [
    {
      name: 'PSP22 Token',
      description: 'Fungible token standard',
      icon: <Package size={24} weight="fill" className="text-blue-400" />,
      complexity: 'Beginner',
      gasEstimate: '~0.5 DALLA'
    },
    {
      name: 'PSP34 NFT',
      description: 'Non-fungible token collection',
      icon: <Heart size={24} weight="fill" className="text-pink-400" />,
      complexity: 'Intermediate',
      gasEstimate: '~0.8 DALLA'
    },
    {
      name: 'Simple DAO',
      description: 'Governance with voting',
      icon: <Users size={24} weight="fill" className="text-purple-400" />,
      complexity: 'Advanced',
      gasEstimate: '~1.2 DALLA'
    },
    {
      name: 'Faucet',
      description: 'Testnet token distribution',
      icon: <Lightning size={24} weight="fill" className="text-amber-400" />,
      complexity: 'Beginner',
      gasEstimate: '~0.4 DALLA'
    }
  ];

  // (DAO proposals now sourced from listDaoProposals(); see DAO tab.)

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 selection:bg-teal-500/30">
      {/* Header */}
      <header className="sticky top-0 bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/80 px-4 sm:px-6 py-4 z-20 shadow-lg shadow-black/40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={22} weight="bold" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  The Gem
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30 tracking-wider uppercase font-mono">
                  ink! v5 WASM
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Sovereign Smart Contracts Platform & Developer Registry
              </p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-md">
            <FileCode size={22} weight="fill" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stats Overview */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/30">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-mono uppercase mb-1">Contracts Live</p>
              <p className="text-2xl sm:text-3xl font-bold text-teal-400 font-mono">{deployedCount}/{catalog.length}</p>
            </div>
            <div className="text-center border-x border-slate-800/80">
              <p className="text-xs text-slate-400 font-mono uppercase mb-1">Substrate Network</p>
              <p className="text-sm sm:text-base font-bold text-cyan-400 truncate font-mono" title={runtimeConfig.blockchainWsUrl}>
                {runtimeConfig.networkName}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 font-mono uppercase mb-1">RPC Endpoint</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400 capitalize font-mono">{runtimeConfig.endpointSource}</p>
            </div>
          </div>
        </div>

        {/* Sleek Dark Pill Tabs */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-1.5 shadow-inner flex flex-wrap sm:flex-nowrap gap-1">
          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'deploy'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Rocket size={16} weight="bold" />
            <span>Deploy Templates</span>
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'contracts'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Package size={16} weight="bold" />
            <span>My Contracts</span>
          </button>
          <button
            onClick={() => setActiveTab('dao')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'dao'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Users size={16} weight="bold" />
            <span>DAO Governance</span>
          </button>
          <button
            onClick={() => setActiveTab('nft')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'nft'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Heart size={16} weight="bold" />
            <span>BeliNFT Studio</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'deploy' && (
            <>
              {/* Testnet Faucet Card */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Lightning size={20} className="text-amber-400" weight="fill" />
                      <span>Testnet Faucet</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      {faucetStatus
                        ? `${(BigInt(faucetStatus.dripAmount) / 10n ** 12n).toString()} DALLA per claim • ${faucetStatus.cooldown}-block cooldown`
                        : 'Claim developer test DALLA directly from on-chain faucet'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase tracking-wider">
                    Developer Reserve
                  </span>
                </div>

                <button
                  onClick={handleClaim}
                  disabled={claiming || !selectedAccount?.address || (faucetStatus ? !faucetStatus.canClaim : false)}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-2xl text-xs hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lightning size={16} weight="fill" />
                  <span>{claiming ? 'Claiming DALLA…' : selectedAccount?.address ? 'Claim 100 Test DALLA' : 'Connect Wallet to Claim'}</span>
                </button>

                <p className="text-xs text-slate-400 text-center font-mono">
                  {faucetError
                    ? faucetError
                    : claimTxHash
                      ? `Claim submitted: ${claimTxHash.slice(0, 14)}…`
                      : faucetStatus
                        ? faucetStatus.canClaim
                          ? 'Ready to claim test tokens'
                          : `Next claim available in ${faucetStatus.blocksUntilClaim} blocks`
                        : 'Loading faucet status…'}
                </p>
              </div>

              {/* Contract Templates */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">Standard Contract Templates</h3>
                  <span className="text-xs text-slate-400 font-mono">WASM Bytecode Ready</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((template, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-950/70 border border-slate-850 hover:border-teal-500/40 rounded-2xl transition-all cursor-pointer group shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            {template.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-sm group-hover:text-teal-300 transition-colors">
                              {template.name}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">{template.description}</p>
                          </div>
                        </div>
                        <Play size={18} className="text-slate-500 group-hover:text-teal-400 transition-colors" weight="fill" />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-850 font-mono">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          template.complexity === 'Beginner' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          template.complexity === 'Intermediate' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                          'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        }`}>
                          {template.complexity}
                        </span>
                        <span className="text-slate-500">{template.gasEstimate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SDK & CLI Documentation */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-base">Developer SDK & CLI</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <p className="text-xs text-slate-400 font-mono">Installation Command:</p>
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 text-teal-300 p-3 rounded-xl font-mono text-xs">
                      <span>npm install @belizechain/gem-sdk</span>
                      <button
                        onClick={() => navigator.clipboard?.writeText('npm install @belizechain/gem-sdk')}
                        title="Copy command"
                        className="hover:text-white transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-3">
              {deployedContracts.map((contract, index) => (
                <div
                  key={index}
                  className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{contract.name}</h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-500/15 border border-teal-500/30 text-teal-400">
                          {contract.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                          contract.deployed
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {contract.deployed ? 'Live on Testnet' : 'Pending Deployment'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 truncate max-w-md" title={contract.fullAddress}>
                        {contract.address}
                      </p>
                    </div>

                    <button
                      className="p-2 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-teal-400 transition-colors disabled:opacity-40"
                      disabled={!contract.fullAddress}
                      onClick={() => contract.fullAddress && navigator.clipboard?.writeText(contract.fullAddress)}
                      title="Copy full address"
                    >
                      <Copy size={18} weight="fill" />
                    </button>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={!contract.deployed}
                    >
                      {contract.deployed ? 'Interact with ABI' : 'Deploy First'}
                    </button>
                    <button
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition-all disabled:opacity-40"
                      disabled={!contract.fullAddress}
                    >
                      Inspect Source
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dao' && (
            <>
              {/* Voting Power Card */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">My DAO Voting Power</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">Weighted by DALLA sovereign holdings</p>
                  </div>
                  <Users size={28} className="text-teal-400" weight="fill" />
                </div>
                <p className="text-3xl font-black text-teal-400 font-mono">
                  {selectedAccount?.address ? `${votingPowerDisplay} Ɗ` : 'Connect wallet'}
                </p>
                {nftCollection && (
                  <p className="text-xs text-slate-400 font-mono pt-1 border-t border-slate-800">
                    {nftCollection.name} ({nftCollection.symbol}): {nftBalance} held / {nftCollection.totalSupply} total
                  </p>
                )}
              </div>

              {daoError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 font-mono">
                  {daoError}
                </div>
              )}

              {/* Create Proposal Form */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="font-bold text-white text-base">Submit DAO Proposal</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Introduce governance text motions or attach on-chain DALLA disbursements.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-mono uppercase block mb-1">Proposal Motion Description</label>
                    <textarea
                      value={propDescription}
                      onChange={(e) => setPropDescription(e.target.value)}
                      placeholder="Specify proposal objectives, parameters, and rationale..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-teal-500/50 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-mono uppercase block mb-1">
                        Transfer Target <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={propTransferTarget}
                        onChange={(e) => setPropTransferTarget(e.target.value)}
                        placeholder="5... SS58 Address"
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-mono focus:outline-none focus:border-teal-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-mono uppercase block mb-1">Disbursement (DALLA Ɗ)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.000001"
                        value={propTransferValue}
                        onChange={(e) => setPropTransferValue(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-mono focus:outline-none focus:border-teal-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {propTxHash && (
                    <div className="text-xs text-teal-300 font-mono p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl break-all">
                      Submitted on-chain: {propTxHash}
                    </div>
                  )}

                  <button
                    onClick={handleCreateProposal}
                    disabled={propBusy || !selectedAccount?.address || !propDescription.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-2xl text-xs hover:shadow-lg hover:shadow-teal-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {propBusy ? 'Submitting to ink! Contract…' : 'Submit DAO Proposal'}
                  </button>
                </div>
              </div>

              {/* Proposals List */}
              <div className="space-y-3">
                {daoLoading && daoProposals.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6 font-mono">Loading proposals from Substrate RPC…</p>
                ) : daoProposals.length === 0 ? (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center text-xs text-slate-400 font-mono">
                    {selectedAccount?.address
                      ? 'No proposals active in this contract block. Submit the first proposal above!'
                      : 'Connect wallet to view ink! DAO proposals.'}
                  </div>
                ) : (
                  daoProposals.map((proposal) => {
                    const yes = BigInt(proposal.votesFor || '0');
                    const no = BigInt(proposal.votesAgainst || '0');
                    const total = yes + no;
                    const yesPct = total > 0n ? Number((yes * 10000n) / total) / 100 : 0;
                    const isActive = proposal.status.toLowerCase() === 'active' || proposal.status.toLowerCase() === 'pending';
                    const busy = voteBusyId === proposal.id;
                    return (
                      <div
                        key={proposal.id}
                        className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-bold text-white text-sm">
                              {proposal.description || `Proposal #${proposal.id}`}
                            </h4>
                            <p className="text-xs text-slate-400 font-mono">
                              ID #{proposal.id} • Ends @ block {proposal.endBlock.toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                            isActive ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' :
                            proposal.status.toLowerCase() === 'passed' || proposal.status.toLowerCase() === 'executed'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          }`}>
                            {proposal.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 font-mono text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Aye: {yes.toString()}</span>
                            <span>Nay: {no.toString()}</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500"
                              style={{ width: `${yesPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-mono text-xs">
                          <span className="text-slate-500">Proposer: {proposal.proposer.slice(0, 8)}…{proposal.proposer.slice(-6)}</span>
                          {isActive && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVote(proposal.id, true)}
                                disabled={busy || !selectedAccount?.address}
                                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                              >
                                {busy ? '…' : 'Vote Aye'}
                              </button>
                              <button
                                onClick={() => handleVote(proposal.id, false)}
                                disabled={busy || !selectedAccount?.address}
                                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                              >
                                {busy ? '…' : 'Vote Nay'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {activeTab === 'nft' && (
            <>
              {/* Collection Summary */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{nftCollection?.name ?? 'BeliNFT Collection'}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {nftCollection?.symbol ?? 'BNFT'} • {nftCollection?.totalSupply ?? 0} minted total
                    </p>
                  </div>
                  <Heart size={28} className="text-teal-400" weight="fill" />
                </div>
                <p className="text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
                  Citizen Holdings: <span className="font-bold text-teal-400">{nftBalance}</span> {nftCollection?.symbol ?? 'BNFT'}
                </p>
              </div>

              {nftError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 font-mono">
                  {nftError}
                </div>
              )}

              {nftTxHash && (
                <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-xs text-teal-300 font-mono break-all">
                  Submitted: {nftTxHash}
                </div>
              )}

              {/* Mint NFT Card */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="font-bold text-white text-base">Mint BeliNFT</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deploy a new unique asset into the BeliNFT ink! contract.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-mono uppercase block mb-1">
                      Recipient <span className="text-slate-500">(Defaults to connected wallet)</span>
                    </label>
                    <input
                      type="text"
                      value={nftMintTo}
                      onChange={(e) => setNftMintTo(e.target.value)}
                      placeholder={selectedAccount?.address ?? '5...'}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-mono focus:outline-none focus:border-teal-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-mono uppercase block mb-1">Metadata IPFS / HTTPS URI</label>
                    <input
                      type="text"
                      value={nftMintUri}
                      onChange={(e) => setNftMintUri(e.target.value)}
                      placeholder="ipfs://bafy... or pakit://..."
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-mono focus:outline-none focus:border-teal-500/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleMintNft}
                    disabled={nftMintBusy || !selectedAccount?.address || !nftMintUri.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-2xl text-xs hover:shadow-lg hover:shadow-teal-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {nftMintBusy ? 'Minting NFT…' : 'Mint BeliNFT'}
                  </button>
                </div>
              </div>

              {/* Transfer NFT Card */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="font-bold text-white text-base">Transfer BeliNFT</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Transfer sovereign ownership to another citizen.</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-mono uppercase block mb-1">Recipient Address</label>
                    <input
                      type="text"
                      value={nftTransferTo}
                      onChange={(e) => setNftTransferTo(e.target.value)}
                      placeholder="5..."
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-mono focus:outline-none focus:border-teal-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-mono uppercase block mb-1">Token ID</label>
                    <input
                      type="number"
                      min="0"
                      value={nftTransferId}
                      onChange={(e) => setNftTransferId(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-mono focus:outline-none focus:border-teal-500/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleTransferNft}
                    disabled={nftTransferBusy || !selectedAccount?.address || !nftTransferTo.trim() || !nftTransferId.trim()}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold rounded-2xl text-xs hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {nftTransferBusy ? 'Transferring…' : 'Transfer NFT'}
                  </button>
                </div>
              </div>

              {/* Owned NFTs */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">Your BeliNFTs</h3>
                  <button
                    onClick={() => void refreshOwnedNfts()}
                    className="text-xs font-mono text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Refresh
                  </button>
                </div>

                {ownedNfts.length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono text-center py-4">
                    {selectedAccount?.address
                      ? 'No BeliNFTs registered to this account in the first 100 token IDs.'
                      : 'Connect wallet to view your owned NFTs.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ownedNfts.map((n) => (
                      <div
                        key={n.id}
                        className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs space-y-1 font-mono"
                      >
                        <p className="font-bold text-white text-sm">Token #{n.id}</p>
                        <p className="break-all text-slate-400 text-[11px]">{n.uri ?? '— no URI —'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
