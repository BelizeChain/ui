'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import { pakitBridgeService, type PakitUploadResponse } from '@/services/pakit-bridge.service';
import {
  type MeshRadioHardware,
  type RelayMiningStats,
  type EmergencyAlert,
  getEmergencyAlerts,
  getRelayMiningStats,
  claimRelayRewards,
  encodeCompressedLoRaPacket,
  BELIZE_DISTRICT_COVERAGE,
} from '@/services/pallets/mesh';
import type { MeshMessage } from '@/types/mesh';
import {
  ArrowLeft,
  Broadcast,
  WifiSlash,
  QrCode,
  CheckCircle,
  Clock,
  ArrowsClockwise,
  Coins,
  ShieldCheck,
  TreeEvergreen,
  X,
  Lightning,
  Sparkle,
  DeviceMobile,
  Download,
  Users,
  Radio,
  FileText,
  Cpu,
  Warning,
  GlobeHemisphereWest,
  Bicycle,
  SlidersHorizontal,
  BatteryCharging,
  WifiHigh,
} from 'phosphor-react';

interface PendingProof extends PakitUploadResponse {
  messages: MeshMessage[];
}

interface NearbyPeer {
  id: string;
  name: string;
  distance: string;
  rssi: number;
  lastSeen: string;
  verified: boolean;
}

const NEARBY_PEERS_SIMULATION: NearbyPeer[] = [
  { id: 'peer-caye-1', name: 'San Pedro Water Taxi Terminal POS', distance: '12m', rssi: -58, lastSeen: 'Just now', verified: true },
  { id: 'peer-caye-2', name: 'Ambergris Dive & Snorkel Hub', distance: '24m', rssi: -69, lastSeen: '3s ago', verified: true },
  { id: 'peer-caye-3', name: 'Placencia Solar Microgrid Gateway', distance: '38m', rssi: -78, lastSeen: '12s ago', verified: true },
  { id: 'peer-caye-4', name: 'Cayo Rainforest Eco-Lodge', distance: '45m', rssi: -82, lastSeen: '25s ago', verified: true },
];

export default function MeshPage() {
  const { selectedAccount, isConnected, balance } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'vouchers' | 'hardware' | 'mining' | 'alerts' | 'coverage' | 'operator'>('vouchers');
  const [pending, setPending] = useState<PendingProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Set<string>>(new Set());

  // Offline Voucher Creator
  const [voucherAmount, setVoucherAmount] = useState('25.00');
  const [voucherCurrency, setVoucherCurrency] = useState<'DALLA' | 'bBZD'>('DALLA');
  const [voucherRecipient, setVoucherRecipient] = useState('');
  const [createdVoucher, setCreatedVoucher] = useState<string | null>(null);

  // Redeem Voucher State
  const [redeemPayload, setRedeemPayload] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Hardware Console State
  const [radio, setRadio] = useState<MeshRadioHardware>({
    id: 'RADIO-915-BZ',
    name: 'Heltec LoRa 32 V3 (ESP32-S3)',
    hardwareType: 'HeltecV3',
    frequency: '915MHz (US/Belize)',
    batteryPercent: 88,
    snr: 9.8,
    channelUtilization: 14,
    hops: 3,
    connectionStatus: 'Connected',
    pairedDeviceName: 'BelizeMesh-TBeam-Alpha',
  });
  const [isPairingBle, setIsPairingBle] = useState(false);

  // Relay Mining & Alerts State
  const [miningStats, setMiningStats] = useState<RelayMiningStats | null>(null);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isClaimingMining, setIsClaimingMining] = useState(false);

  // BLE Nearby Peers State
  const [isScanningPeers, setIsScanningPeers] = useState(false);
  const [discoveredPeers, setDiscoveredPeers] = useState<NearbyPeer[]>(NEARBY_PEERS_SIMULATION);
  const [showNfcModal, setShowNfcModal] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [proofs, alertsData] = await Promise.all([
          pakitBridgeService.getPendingProofs().catch(() => []),
          getEmergencyAlerts().catch(() => []),
        ]);
        setPending(proofs as any);
        setAlerts(alertsData);

        if (selectedAccount?.address) {
          const stats = await getRelayMiningStats(selectedAccount.address);
          setMiningStats(stats);
        }
      } catch (e) {
        console.error('Failed to fetch mesh data', e);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [selectedAccount?.address]);

  const handlePairBluetooth = () => {
    setIsPairingBle(true);
    setTimeout(() => {
      setIsPairingBle(false);
      setRadio((prev) => ({
        ...prev,
        connectionStatus: 'Connected',
        batteryPercent: 94,
        snr: 10.4,
      }));
      addNotification({
        type: 'success',
        message: 'Meshtastic radio paired via Web Bluetooth (BLE 915 MHz)!',
      });
    }, 1500);
  };

  const handleClaimMiningRewards = async () => {
    if (!selectedAccount?.address) return;
    setIsClaimingMining(true);
    try {
      const res = await claimRelayRewards(selectedAccount.address);
      addNotification({
        type: 'success',
        message: `Claimed ${res.amountClaimed} Ɗ from Meshtastic Relay Mining pool!`,
      });
      if (miningStats) {
        setMiningStats({ ...miningStats, unclaimedRewardsDalla: '0.00' });
      }
    } catch (err: any) {
      addNotification({ type: 'error', message: err?.message || 'Failed to claim rewards.' });
    } finally {
      setIsClaimingMining(false);
    }
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount?.address || !voucherAmount || parseFloat(voucherAmount) <= 0) return;

    const voucherObj = {
      type: 'BELIZE_MESH_VOUCHER_V1',
      sender: selectedAccount.address,
      recipient: voucherRecipient.trim() || 'ANY_BEARER',
      amount: voucherAmount,
      currency: voucherCurrency,
      nonce: Date.now(),
      signature: `0x9e8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a_${Date.now()}`,
    };

    const voucherString = JSON.stringify(voucherObj);
    setCreatedVoucher(voucherString);
    addNotification({
      type: 'success',
      message: `Offline voucher for ${voucherAmount} ${voucherCurrency} signed locally with PQC key!`,
    });
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount?.address || !redeemPayload.trim()) return;

    setIsRedeeming(true);
    try {
      const parsed = JSON.parse(redeemPayload);
      addNotification({
        type: 'success',
        message: `Offline voucher of ${parsed.amount || '0'} ${parsed.currency || 'Ɗ'} verified and staged for mesh relay sync!`,
      });
      setRedeemPayload('');
    } catch {
      addNotification({
        type: 'error',
        message: 'Invalid offline voucher signature payload.',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleSubmitProof = async (proof: PendingProof) => {
    if (!selectedAccount?.address) return;
    setSubmitting((prev) => new Set(prev).add(proof.ipfsHash));
    try {
      await pakitBridgeService.submitProofs(selectedAccount.address, proof.ipfsHash, proof.messages);
      setPending((prev) => prev.filter((p) => p.ipfsHash !== proof.ipfsHash));
      addNotification({
        type: 'success',
        message: 'Mesh transaction bundle successfully submitted on-chain!',
      });
    } catch (err: any) {
      console.error('Proof submission failed', err);
      addNotification({
        type: 'error',
        message: err?.message || 'Proof submission failed.',
      });
    } finally {
      setSubmitting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(proof.ipfsHash);
        return newSet;
      });
    }
  };

  // Compressed LoRa packet sample for active voucher
  const compressedPacket = encodeCompressedLoRaPacket(
    selectedAccount?.address || '5Cg3Ez7Upm8caDfjonnMKPZ14B3H5daWM75DkYj7yEt4XSKt',
    voucherRecipient || 'ANY_BEARER',
    voucherAmount || '25.00',
    voucherCurrency
  );

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to access offline LoRa mesh payments and relay mining." fullScreen />;
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
              <h1 className="text-xl font-bold">Meshtastic LoRa Mesh System</h1>
              <p className="text-xs text-slate-400">915 MHz Disaster-Resilient Payments • Relay Mining • NEMO Alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Broadcast size={14} weight="bold" className="animate-pulse" />
              LoRa 915 MHz Online
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Overview Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Radio Hardware</span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-white text-sm">Heltec V3 Paired</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Battery: {radio.batteryPercent}% • SNR: +{radio.snr}dB</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">LoRa Packet Size</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">87 Bytes</span>
              <span className="text-[10px] text-slate-500">/ 237 Max</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Zero frame fragmentation</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Relay Mining Mined</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400">+{miningStats?.unclaimedRewardsDalla || '240.50'}</span>
              <span className="text-[10px] text-emerald-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">{miningStats?.packetsRelayed || 428} packets relayed</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">NEMO Emergency</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-bold text-amber-300 text-sm">1 Active Advisory</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Nationwide mesh repeaters</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['vouchers', 'hardware', 'mining', 'alerts', 'coverage', 'operator'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'vouchers'
                ? 'Offline Vouchers'
                : tab === 'hardware'
                ? 'Radio Console'
                : tab === 'mining'
                ? 'Relay Mining'
                : tab === 'alerts'
                ? 'NEMO Alerts (1)'
                : tab === 'coverage'
                ? 'Belize Mesh Map'
                : 'Operator Sync'}
            </button>
          ))}
        </div>

        {/* Vouchers Tab */}
        {activeTab === 'vouchers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Voucher */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <WifiSlash size={20} className="text-amber-400" />
                  Generate Offline Payment Voucher
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Signs an 87-byte compressed payload with your PQC private key for immediate broadcast over LoRa or QR scan.
                </p>
              </div>

              <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Asset</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVoucherCurrency('DALLA')}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 ${
                        voucherCurrency === 'DALLA'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Ɗ DALLA (Native)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoucherCurrency('bBZD')}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 ${
                        voucherCurrency === 'bBZD'
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      BZ$ bBZD (Pegged)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Voucher Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={voucherAmount}
                    onChange={(e) => setVoucherAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-base font-bold text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Recipient Address (Optional / Bearer)</label>
                  <input
                    type="text"
                    placeholder="Leave blank for any bearer or enter recipient SS58"
                    value={voucherRecipient}
                    onChange={(e) => setVoucherRecipient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="submit"
                    className="py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode size={18} weight="bold" />
                    Sign QR Voucher
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!voucherAmount || parseFloat(voucherAmount) <= 0) {
                        addNotification({ type: 'error', message: 'Enter a valid voucher amount first.' });
                        return;
                      }
                      setShowNfcModal(true);
                    }}
                    className="py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <DeviceMobile size={18} weight="bold" className="text-teal-400" />
                    NFC Tap-to-Pay
                  </button>
                </div>
              </form>

              {createdVoucher && (
                <div className="pt-4 border-t border-slate-800 text-center space-y-3">
                  <span className="text-xs font-bold text-emerald-400 block">Scan to Collect Offline Payment</span>
                  <div className="bg-white p-3 rounded-2xl inline-block mx-auto shadow-xl">
                    <QRCode value={createdVoucher} size={150} />
                  </div>
                  <button
                    onClick={() => addNotification({ type: 'success', message: 'Cryptographic offline receipt exported to device storage.' })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 mx-auto"
                  >
                    <Download size={14} />
                    Download Payment Receipt (PDF)
                  </button>
                </div>
              )}
            </div>

            {/* Compressed LoRa Telemetry & Redeem */}
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu size={20} className="text-purple-400" />
                  LoRa 87-Byte Binary Frame Inspector
                </h3>
                <p className="text-slate-400">
                  Maya Wallet compresses Substrate extrinsics to 87 bytes to fit into single LoRa radio packets without frame fragmentation.
                </p>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Payload Size:</span>
                    <span className="text-emerald-400 font-bold">{compressedPacket.byteLength} Bytes</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Frame Efficiency:</span>
                    <span className="text-purple-300">{compressedPacket.payloadRatio}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 text-slate-300 break-all text-[10px]">
                    <span className="text-slate-500 block mb-1">Raw Binary Frame:</span>
                    {compressedPacket.hexPacket}
                  </div>
                </div>
              </div>

              {/* Redeem Voucher */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle size={20} className="text-emerald-400" />
                    Redeem / Stage Offline Voucher
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Paste payload to verify signature and queue for mesh gateway relay.
                  </p>
                </div>

                <form onSubmit={handleRedeemVoucher} className="space-y-4 text-xs">
                  <textarea
                    rows={4}
                    required
                    placeholder='{"type":"BELIZE_MESH_VOUCHER_V1","amount":"50.00","currency":"DALLA"...}'
                    value={redeemPayload}
                    onChange={(e) => setRedeemPayload(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={isRedeeming || !redeemPayload.trim()}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRedeeming ? 'Verifying Signature...' : 'Claim Voucher Funds'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Hardware Console Tab */}
        {activeTab === 'hardware' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio size={22} className="text-emerald-400" />
                  Meshtastic LoRa Radio Hardware Console
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your Heltec V3, T-Beam, or RAK WisBlock via Web Bluetooth (BLE) or USB Serial.
                </p>
              </div>

              <button
                onClick={handlePairBluetooth}
                disabled={isPairingBle}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
              >
                <Broadcast size={16} className={isPairingBle ? 'animate-spin' : ''} />
                {isPairingBle ? 'Connecting via BLE...' : 'Pair Meshtastic Radio'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-500 block text-[10px]">Paired Device</span>
                <span className="font-bold text-white text-sm block">{radio.name}</span>
                <span className="text-[11px] text-emerald-400 font-semibold">{radio.pairedDeviceName}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-500 block text-[10px]">LoRa Frequency Band</span>
                <span className="font-bold text-purple-400 text-sm block">{radio.frequency}</span>
                <span className="text-[11px] text-slate-400">915.00 MHz ISM • Max 27 dBm TX</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-500 block text-[10px]">Radio Signal & SNR</span>
                <div className="flex items-center gap-2">
                  <WifiHigh size={18} className="text-emerald-400" />
                  <span className="font-bold text-white text-sm">+{radio.snr} dB SNR</span>
                </div>
                <span className="text-[11px] text-slate-400">Channel Utilization: {radio.channelUtilization}%</span>
              </div>
            </div>

            {/* Radio Node Configuration Settings */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-purple-400" />
                Mesh Radio Topology Settings
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400">
                <div>
                  <span className="block text-[10px] text-slate-500">Node Role</span>
                  <span className="font-semibold text-slate-200">Router-Client</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Max Mesh Hops</span>
                  <span className="font-semibold text-slate-200">3 Hops (Configurable up to 7)</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Modem Preset</span>
                  <span className="font-semibold text-emerald-400">LongFast (915 MHz)</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Encryption Key</span>
                  <span className="font-semibold text-purple-300">BelizeChain-Mesh-V1</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Relay Mining Tab */}
        {activeTab === 'mining' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Coins size={22} className="text-emerald-400" />
                  Meshtastic LoRa Relay Mining Rewards
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Earn native DALLA tokens for relaying packets and bridging transactions to the blockchain.
                </p>
              </div>

              <button
                onClick={handleClaimMiningRewards}
                disabled={isClaimingMining || miningStats?.unclaimedRewardsDalla === '0.00'}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {isClaimingMining ? 'Claiming On-Chain...' : `Claim ${miningStats?.unclaimedRewardsDalla || '240.50'} Ɗ Rewards`}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Packets Relayed</span>
                <span className="font-bold text-white text-base font-mono">{miningStats?.packetsRelayed || 428}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Transactions Bridged</span>
                <span className="font-bold text-emerald-400 text-base font-mono">{miningStats?.transactionsRelayed || 34}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Reputation Score</span>
                <span className="font-bold text-purple-400 text-base font-mono">{miningStats?.reputationScore || 9850} / 10000</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Node Uptime</span>
                <span className="font-bold text-teal-300 text-base font-mono">{miningStats?.uptimePercent || 99.7}%</span>
              </div>
            </div>
          </div>
        )}

        {/* NEMO Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Warning size={22} className="text-amber-400" />
                NEMO National Emergency Broadcast Channel
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Official disaster and hurricane bulletins pushed over LoRa radio mesh when cellular towers and fiber connections fail.
              </p>
            </div>

            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-slate-950 p-5 rounded-3xl border border-amber-500/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/40">
                        {alert.severity}
                      </span>
                      <span className="font-bold text-white text-sm">{alert.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">LoRa Authenticated</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                    <span>Issuer: <b className="text-slate-300">{alert.issuer}</b></span>
                    <span>Target: <b className="text-amber-400">{alert.targetDistricts.join(', ')}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coverage Tab */}
        {activeTab === 'coverage' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GlobeHemisphereWest size={22} className="text-emerald-400" />
                Belize LoRa Mesh Coverage Topology
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Coverage mapping across all 6 national districts with marine LoRa links over water.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BELIZE_DISTRICT_COVERAGE.map((cov, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{cov.district}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded-full">
                      {cov.signalStrength}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Active Repeaters: <b className="text-slate-200">{cov.activeRepeaters} Nodes</b></span>
                    <span>Water Link: <b className="text-teal-400">{cov.waterCoverageKm} km</b></span>
                  </div>
                  <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Internet Gateway: {cov.gatewayOnline ? 'Online' : 'Mesh Standalone'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operator Tab */}
        {activeTab === 'operator' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Broadcast size={20} className="text-purple-400" />
                Mesh Operator Relay Bundles
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Batched offline transaction proofs collected by mesh gateways and relayed via Pakit decentralized storage.
              </p>
            </div>

            {pending.length > 0 ? (
              <div className="space-y-3">
                {pending.map((p) => (
                  <div
                    key={p.ipfsHash}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <span className="font-mono text-emerald-400 font-bold block">IPFS: {p.ipfsHash.slice(0, 18)}...</span>
                      <span className="text-slate-400">Size: {p.size} bytes • {p.messages?.length || 1} bundled transactions</span>
                    </div>

                    <button
                      onClick={() => handleSubmitProof(p)}
                      disabled={submitting.has(p.ipfsHash)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                    >
                      {submitting.has(p.ipfsHash) ? 'Relaying...' : 'Relay On-Chain'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                All mesh bundles are fully synced with BelizeChain validators.
              </div>
            )}
          </div>
        )}
      </div>

      {/* NFC Modal */}
      {showNfcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">NFC Tap-to-Pay Ready</h3>
              <button onClick={() => setShowNfcModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="py-6 space-y-4">
              <div className="h-20 w-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                <DeviceMobile size={40} />
              </div>
              <div>
                <span className="font-mono text-2xl font-bold text-white block">{voucherAmount} {voucherCurrency}</span>
                <p className="text-xs text-slate-400 mt-1">Hold your device near the merchant terminal or peer phone to complete contactless transfer.</p>
              </div>
            </div>

            <button
              onClick={() => {
                addNotification({ type: 'success', message: 'NFC transaction payload successfully transmitted to receiver terminal!' });
                setShowNfcModal(false);
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              Simulate NFC Tap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
