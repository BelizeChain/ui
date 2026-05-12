'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GlassCard } from '@/components/ui';
import { getRuntimeConfig } from '@belizechain/shared';
import { useRouter } from 'next/navigation';
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
              <h1 className="text-xl font-bold text-white">The Gem 💎</h1>
              <p className="text-xs text-gray-400">Smart Contracts Platform (ink!)</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-red-400 flex items-center justify-center">
            <FileCode size={20} className="text-white" weight="fill" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Contracts</p>
              <p className="text-2xl font-bold text-pink-400">{deployedCount}/{catalog.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Network</p>
              <p className="text-sm font-bold text-blue-400 truncate" title={runtimeConfig.blockchainWsUrl}>
                {runtimeConfig.networkName}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Endpoint</p>
              <p className="text-sm font-bold text-emerald-400 capitalize">{runtimeConfig.endpointSource}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <Rocket size={20} weight="fill" />
            <span className="font-semibold">Deploy</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Code size={20} weight="fill" className="text-gray-400" />
            <span className="font-semibold text-white">Interact</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2 bg-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'deploy'
                ? 'bg-gradient-to-r from-pink-500 to-red-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            Deploy
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'contracts'
                ? 'bg-gradient-to-r from-pink-500 to-red-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            My Contracts
          </button>
          <button
            onClick={() => setActiveTab('dao')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'dao'
                ? 'bg-gradient-to-r from-pink-500 to-red-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            DAO
          </button>
          <button
            onClick={() => setActiveTab('nft')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'nft'
                ? 'bg-gradient-to-r from-pink-500 to-red-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            NFTs
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 space-y-4">
        {activeTab === 'deploy' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">Testnet Faucet</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {faucetStatus
                      ? `${(BigInt(faucetStatus.dripAmount) / 10n ** 12n).toString()} DALLA per claim, ${faucetStatus.cooldown}-block cooldown`
                      : 'Get test DALLA from the on-chain faucet'}
                  </p>
                </div>
                <Lightning size={32} className="text-amber-400" weight="fill" />
              </div>
              <button
                onClick={handleClaim}
                disabled={claiming || !selectedAccount?.address || (faucetStatus ? !faucetStatus.canClaim : false)}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {claiming ? 'Claiming…' : selectedAccount?.address ? 'Claim Test DALLA' : 'Connect Wallet to Claim'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                {faucetError
                  ? faucetError
                  : claimTxHash
                    ? `✅ Claim submitted: ${claimTxHash.slice(0, 14)}…`
                    : faucetStatus
                      ? faucetStatus.canClaim
                        ? 'Ready to claim'
                        : `Next claim available in ${faucetStatus.blocksUntilClaim} blocks`
                      : 'Loading faucet status…'}
              </p>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Contract Templates</h3>
              <div className="space-y-3">
                {templates.map((template, index) => (
                  <div key={index} className="p-4 bg-gray-200 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{template.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{template.description}</p>
                        </div>
                      </div>
                      <Play size={20} className="text-pink-400" weight="fill" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full font-semibold ${
                        template.complexity === 'Beginner' ? 'bg-green-500/100/20 text-green-400' :
                        template.complexity === 'Intermediate' ? 'bg-blue-500/100/20 text-blue-400' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {template.complexity}
                      </span>
                      <span className="text-gray-400">Est. Gas: {template.gasEstimate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-6">
              <h3 className="font-bold text-white mb-4">SDK & Documentation</h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-gradient-to-r from-gray-200 to-gray-900 text-white rounded-lg flex items-center justify-between hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3">
                    <Package size={20} weight="fill" />
                    <span className="font-medium">Install SDK</span>
                  </div>
                  <Download size={20} weight="fill" />
                </button>
                <div className="p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Installation command:</p>
                  <div className="flex items-center justify-between bg-gray-200 text-white p-2 rounded font-mono text-xs">
                    <span>npm install @belizechain/gem-sdk</span>
                    <Copy size={14} className="cursor-pointer hover:text-blue-400" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-3">
            {deployedContracts.map((contract, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-white">{contract.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        contract.type === 'PSP22' ? 'bg-blue-500/100/20 text-blue-400' :
                        contract.type === 'PSP34' ? 'bg-pink-100 text-pink-700' :
                        contract.type === 'DEX' ? 'bg-cyan-100 text-cyan-700' :
                        contract.type === 'PSP37' ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {contract.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${contract.deployed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {contract.deployed ? 'Live' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400" title={contract.fullAddress}>{contract.address}</p>
                  </div>
                  <button
                    className="ml-2 disabled:opacity-40"
                    disabled={!contract.fullAddress}
                    onClick={() => contract.fullAddress && navigator.clipboard?.writeText(contract.fullAddress)}
                    title="Copy full address"
                  >
                    <Copy size={20} className="text-pink-400" weight="fill" />
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    className="flex-1 py-2 bg-gradient-to-r from-pink-400 to-red-400 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-shadow disabled:opacity-50"
                    disabled={!contract.deployed}
                  >
                    {contract.deployed ? 'Interact' : 'Deploy First'}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={!contract.fullAddress}
                  >
                    View
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {activeTab === 'dao' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">My Voting Power</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Based on DALLA holdings</p>
                </div>
                <Users size={32} className="text-purple-400" weight="fill" />
              </div>
              <p className="text-3xl font-bold text-purple-400">
                {selectedAccount?.address ? `${votingPowerDisplay} DALLA` : 'Connect wallet'}
              </p>
              {nftCollection && (
                <p className="text-xs text-gray-400 mt-2">
                  {nftCollection.name} ({nftCollection.symbol}): {nftBalance} held / {nftCollection.totalSupply} total
                </p>
              )}
            </GlassCard>

            {daoError && (
              <div className="text-xs text-red-400">{daoError}</div>
            )}

            <GlassCard variant="dark" blur="sm" className="p-5">
              <h3 className="font-bold text-white mb-1">Create Proposal</h3>
              <p className="text-xs text-gray-400 mb-4">
                Submit a text proposal, or attach a treasury DALLA transfer.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Description</label>
                  <textarea
                    value={propDescription}
                    onChange={(e) => setPropDescription(e.target.value)}
                    placeholder="What should the DAO do?"
                    rows={3}
                    className="w-full bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Transfer target <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={propTransferTarget}
                      onChange={(e) => setPropTransferTarget(e.target.value)}
                      placeholder="r1... AccountId"
                      className="w-full bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Transfer DALLA</label>
                    <input
                      type="number"
                      min="0"
                      step="0.000001"
                      value={propTransferValue}
                      onChange={(e) => setPropTransferValue(e.target.value)}
                      className="w-full bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700"
                    />
                  </div>
                </div>
                {propTxHash && (
                  <div className="text-xs text-emerald-300 break-all">
                    Submitted: {propTxHash}
                  </div>
                )}
                <button
                  onClick={handleCreateProposal}
                  disabled={propBusy || !selectedAccount?.address || !propDescription.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {propBusy ? 'Submitting…' : 'Submit Proposal'}
                </button>
              </div>
            </GlassCard>

            <div className="space-y-3">
              {daoLoading && daoProposals.length === 0 ? (
                <p className="text-sm text-gray-400">Loading proposals…</p>
              ) : daoProposals.length === 0 ? (
                <p className="text-sm text-gray-400">
                  {selectedAccount?.address
                    ? 'No proposals yet. Submit one from the DAO contract.'
                    : 'Connect a wallet to view DAO proposals.'}
                </p>
              ) : (
                daoProposals.map((proposal) => {
                  const yes = BigInt(proposal.votesFor || '0');
                  const no = BigInt(proposal.votesAgainst || '0');
                  const total = yes + no;
                  const yesPct = total > 0n ? Number((yes * 10000n) / total) / 100 : 0;
                  const isActive = proposal.status.toLowerCase() === 'active' || proposal.status.toLowerCase() === 'pending';
                  const busy = voteBusyId === proposal.id;
                  return (
                    <GlassCard key={proposal.id} variant="dark" blur="sm" className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">
                            {proposal.description || `Proposal #${proposal.id}`}
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            ID #{proposal.id} • Ends @ block {proposal.endBlock.toLocaleString()}
                          </p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ml-2 ${
                          isActive ? 'bg-blue-500/20 text-blue-400' :
                          proposal.status.toLowerCase() === 'passed' || proposal.status.toLowerCase() === 'executed' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {proposal.status}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">For: {yes.toString()}</span>
                          <span className="text-gray-400">Against: {no.toString()}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-l-full"
                            style={{ width: `${yesPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Proposer: {proposal.proposer.slice(0, 8)}…{proposal.proposer.slice(-6)}</span>
                        {isActive && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleVote(proposal.id, true)}
                              disabled={busy || !selectedAccount?.address}
                              className="px-4 py-1.5 bg-emerald-400 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {busy ? '…' : 'Vote For'}
                            </button>
                            <button
                              onClick={() => handleVote(proposal.id, false)}
                              disabled={busy || !selectedAccount?.address}
                              className="px-4 py-1.5 bg-gray-200 text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {busy ? '…' : 'Against'}
                            </button>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'nft' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{nftCollection?.name ?? 'BeliNFT Collection'}</h3>
                  <p className="text-xs text-gray-400">
                    {nftCollection?.symbol ?? 'BNFT'} • {nftCollection?.totalSupply ?? 0} minted total
                  </p>
                </div>
                <Heart size={32} className="text-pink-400" weight="fill" />
              </div>
              <p className="text-sm text-gray-300">
                You hold <span className="font-bold text-white">{nftBalance}</span>{' '}
                {nftCollection?.symbol ?? 'BNFT'}
              </p>
            </GlassCard>

            {nftError && <div className="text-xs text-red-400">{nftError}</div>}
            {nftTxHash && (
              <div className="text-xs text-emerald-300 break-all">Submitted: {nftTxHash}</div>
            )}

            <GlassCard variant="dark" blur="sm" className="p-5">
              <h3 className="font-bold text-white mb-1">Mint NFT</h3>
              <p className="text-xs text-gray-400 mb-4">
                Mint a new BeliNFT. Typically restricted to the collection owner.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Recipient <span className="text-gray-500">(defaults to you)</span>
                  </label>
                  <input
                    type="text"
                    value={nftMintTo}
                    onChange={(e) => setNftMintTo(e.target.value)}
                    placeholder={selectedAccount?.address ?? 'r1...'}
                    className="w-full bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Metadata URI</label>
                  <input
                    type="text"
                    value={nftMintUri}
                    onChange={(e) => setNftMintUri(e.target.value)}
                    placeholder="ipfs://… or https://…"
                    className="w-full bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                  />
                </div>
                <button
                  onClick={handleMintNft}
                  disabled={nftMintBusy || !selectedAccount?.address || !nftMintUri.trim()}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nftMintBusy ? 'Minting…' : 'Mint NFT'}
                </button>
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-5">
              <h3 className="font-bold text-white mb-1">Transfer NFT</h3>
              <p className="text-xs text-gray-400 mb-4">Send a BeliNFT you own.</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Recipient</label>
                  <input
                    type="text"
                    value={nftTransferTo}
                    onChange={(e) => setNftTransferTo(e.target.value)}
                    placeholder="r1..."
                    className="w-full bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Token ID</label>
                  <input
                    type="number"
                    min="0"
                    value={nftTransferId}
                    onChange={(e) => setNftTransferId(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700"
                  />
                </div>
                <button
                  onClick={handleTransferNft}
                  disabled={nftTransferBusy || !selectedAccount?.address || !nftTransferTo.trim() || !nftTransferId.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nftTransferBusy ? 'Transferring…' : 'Transfer NFT'}
                </button>
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">Your NFTs</h3>
                <button
                  onClick={() => void refreshOwnedNfts()}
                  className="text-xs text-pink-400 hover:text-pink-300"
                >
                  Refresh
                </button>
              </div>
              {ownedNfts.length === 0 ? (
                <p className="text-sm text-gray-400">
                  {selectedAccount?.address
                    ? 'No BeliNFTs found in the first 100 token IDs.'
                    : 'Connect a wallet to view your NFTs.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ownedNfts.map((n) => (
                    <div
                      key={n.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-xs text-gray-300"
                    >
                      <p className="font-semibold text-white mb-1">Token #{n.id}</p>
                      <p className="break-all text-gray-400">{n.uri ?? '— no URI —'}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
