'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import { getEconomySupply, type EconomySupply } from '@/services/pallets/economy';
import { ChartLineUp, ArrowLeft, Warning } from 'phosphor-react';

/**
 * Macro figures come from `pallet_belize_economy` supply/reserve storage.
 *
 * There is no on-chain notion of transaction volume, wallet count or district
 * distribution — extrinsic have no geography attached — so those cannot be
 * shown at all. The previous version displayed a 21,000,000 DALLA supply, a
 * BZ$1.48M 30-day volume, 4,120 "identity verified citizens" and a six-district
 * volume breakdown; all of it was hardcoded.
 */
export default function AnalyticsPage() {
  const { selectedAccount, isConnected } = useWallet();
  const [supply, setSupply] = useState<EconomySupply | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getEconomySupply()
      .then((result) => {
        if (cancelled) return;
        setSupply(result);
        setError(result ? '' : 'pallet economy supply storage is unavailable on this node.');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to view BelizeChain on-chain macroeconomic analytics."
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
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ChartLineUp size={24} className="text-emerald-400" />
                Economic Analytics
              </h1>
              <p className="text-xs text-slate-400">
                pallet economy supply &amp; reserve storage
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
            {loading ? 'Reading…' : 'On-chain'}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs">
          <Warning size={20} className="text-cyan-400 shrink-0" weight="bold" />
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-cyan-300">Scope:</strong> only values the runtime actually stores are
            shown. Transaction volume, active-wallet counts and district breakdowns have no on-chain
            source — extrinsics carry no geography — so no such panel exists here.
            <span className="block mt-1 text-slate-400">
              The bBZD backing ratio uses <span className="font-mono">economy.centralBankReserves</span>,
              which the pallet documents as <em>off-chain</em> reserves reported for audit transparency.
              It is a reported figure, not an independently verified audit.
            </span>
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              DALLA Total Supply
            </span>
            <span className="text-lg font-bold text-emerald-400 font-mono block">
              {supply ? `${supply.dallaTotalSupply} Ɗ` : '—'}
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">economy.totalSupply</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              bBZD Total Supply
            </span>
            <span className="text-lg font-bold text-cyan-300 font-mono block">
              {supply ? `${supply.bbzdTotalSupply} BZ$` : '—'}
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">economy.totalBbzdSupply</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Reported CB Reserves
            </span>
            <span className="text-lg font-bold text-purple-300 font-mono block">
              {supply ? `${supply.centralBankReserves} BZ$` : '—'}
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">
              economy.centralBankReserves
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Reported Backing Ratio
            </span>
            <span className="text-lg font-bold text-emerald-400 font-mono block">
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

        {/* Minting status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl text-xs">
          <h3 className="text-base font-bold text-white">Minting Status</h3>
          {loading ? (
            <p className="text-slate-400">Reading…</p>
          ) : supply ? (
            <div
              className={`rounded-2xl border p-4 ${
                supply.mintingHalted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <span className="font-bold block">
                {supply.mintingHalted
                  ? 'bBZD minting is halted'
                  : 'bBZD minting is not halted'}
              </span>
              <span className="text-[11px] block mt-1 opacity-80 font-mono">
                economy.mintingHalted = {String(supply.mintingHalted)}
              </span>
            </div>
          ) : (
            <p className="text-slate-400">Minting status is unavailable.</p>
          )}
        </div>
      </div>
    </div>
  );
}
