/**
 * Transaction Confirmation Modal with SRS Fee Discount
 * Shows fee breakdown with Community pallet SRS-based discounts
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Info, Sparkle } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { calculateEffectiveFee, getUserSRS, type SRSInfo } from '@/services/pallets/community';

interface TransactionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: {
    type: string;
    recipient?: string;
    amount?: string;
    data?: Record<string, any>;
  };
  estimatedFee: string;
  senderAddress: string;
  isLoading?: boolean;
}

export function TransactionConfirmation({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  estimatedFee,
  senderAddress,
  isLoading = false,
}: TransactionConfirmationProps) {
  const [srsInfo, setSrsInfo] = useState<SRSInfo | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<{
    original: string;
    effective: string;
    discount: string;
    discountPercent: number;
  } | null>(null);
  const [loadingFee, setLoadingFee] = useState(true);

  useEffect(() => {
    if (isOpen && senderAddress) {
      loadFeeInfo();
    }
  }, [isOpen, senderAddress, estimatedFee]);

  const loadFeeInfo = async () => {
    setLoadingFee(true);
    try {
      const [srs, feeCalc] = await Promise.all([
        getUserSRS(senderAddress),
        calculateEffectiveFee(senderAddress, estimatedFee)
      ]);
      
      setSrsInfo(srs);
      setFeeBreakdown({
        original: estimatedFee,
        effective: feeCalc.effectiveFee,
        discount: feeCalc.discount,
        discountPercent: feeCalc.discountPercent,
      });
    } catch (error) {
      console.error('Failed to load fee info:', error);
      // Default to no discount
      setFeeBreakdown({
        original: estimatedFee,
        effective: estimatedFee,
        discount: '0',
        discountPercent: 0,
      });
    } finally {
      setLoadingFee(false);
    }
  };

  const getTierName = (tier: number): string => {
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    return tiers[tier - 1] || 'None';
  };

  const getTierColor = (tier: number): string => {
    const colors = [
      'text-orange-400', // Bronze
      'text-gray-300',   // Silver
      'text-yellow-400', // Gold
      'text-cyan-400',   // Platinum
      'text-purple-400', // Diamond
    ];
    return colors[tier - 1] || 'text-gray-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard variant="dark-medium" blur="xl" className="w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-full transition-colors"
          disabled={isLoading}
        >
          <X size={20} className="text-gray-400" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-6">Confirm Transaction</h2>

        {/* Transaction Details */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Type</span>
            <span className="text-sm font-semibold text-white">{transaction.type}</span>
          </div>

          {transaction.recipient && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Recipient</span>
              <span className="text-sm font-mono text-white">
                {transaction.recipient.slice(0, 8)}...{transaction.recipient.slice(-6)}
              </span>
            </div>
          )}

          {transaction.amount && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Amount</span>
              <span className="text-lg font-bold text-white">{transaction.amount} DALLA</span>
            </div>
          )}

          {/* Additional transaction data */}
          {transaction.data && Object.entries(transaction.data).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-sm text-white">{String(value)}</span>
            </div>
          ))}
        </div>

        {/* Fee Breakdown */}
        <div className="border-t border-gray-700 pt-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">Fee Breakdown</h3>
          
          {loadingFee ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-xs text-gray-400 mt-2">Calculating fee discount...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* SRS Tier Badge */}
              {srsInfo && srsInfo.tier > 0 && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkle size={20} className={getTierColor(srsInfo.tier)} weight="fill" />
                    <div>
                      <div className="text-xs text-gray-400">Your SRS Tier</div>
                      <div className={`text-sm font-bold ${getTierColor(srsInfo.tier)}`}>
                        {getTierName(srsInfo.tier)} (Score: {srsInfo.score.toLocaleString()})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Monthly Exemption</div>
                    <div className="text-sm font-semibold text-white">{srsInfo.monthlyFeeExemption} DALLA</div>
                  </div>
                </div>
              )}

              {/* Original Fee */}
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Base Transaction Fee</span>
                <span className="text-sm text-white">{feeBreakdown?.original} DALLA</span>
              </div>

              {/* Discount */}
              {feeBreakdown && parseFloat(feeBreakdown.discount) > 0 && (
                <div className="flex justify-between items-center bg-green-900/20 border border-green-700/30 rounded-lg p-2 px-3">
                  <div className="flex items-center gap-2">
                    <Sparkle size={16} className="text-green-400" weight="fill" />
                    <span className="text-sm font-semibold text-green-400">
                      SRS Discount ({feeBreakdown.discountPercent}%)
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-400">
                    -{feeBreakdown.discount} DALLA
                  </span>
                </div>
              )}

              {/* Final Fee */}
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-base font-bold text-white">Final Transaction Fee</span>
                <span className="text-lg font-bold text-blue-400">
                  {feeBreakdown?.effective} DALLA
                </span>
              </div>

              {/* Savings Message */}
              {feeBreakdown && parseFloat(feeBreakdown.discount) > 0 && (
                <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <Info size={16} className="text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-200">
                    You saved {feeBreakdown.discount} DALLA on this transaction with your {srsInfo && getTierName(srsInfo.tier)} tier status!
                    Continue building your SRS through community participation to save even more.
                  </p>
                </div>
              )}

              {/* No SRS Message */}
              {(!srsInfo || srsInfo.tier === 0) && (
                <div className="flex items-start gap-2 p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <Info size={16} className="text-gray-400 mt-0.5" />
                  <p className="text-xs text-gray-400">
                    Start building your Social Responsibility Score (SRS) to earn fee discounts! 
                    Complete education modules and contribute to green projects.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total */}
        {transaction.amount && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total (Amount + Fee)</span>
              <span className="text-xl font-bold text-white">
                {(parseFloat(transaction.amount) + parseFloat(feeBreakdown?.effective || estimatedFee)).toFixed(4)} DALLA
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || loadingFee}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
