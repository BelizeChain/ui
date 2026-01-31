'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, useWallet, useI18n } from '@belizechain/shared';
import { useUIStore } from '@/store/ui';
import {
  ArrowLeft,
  QrCode as QrCodeIcon,
  Copy,
  Share,
  Check,
} from 'phosphor-react';
import QRCode from 'qrcode.react';

export default function ReceivePage() {
  const router = useRouter();
  const { selectedAccount } = useWallet();
  const { t } = useI18n();
  const { addNotification } = useUIStore();
  const [copied, setCopied] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');

  if (!selectedAccount) {
    router.push('/');
    return null;
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(selectedAccount.address);
      setCopied(true);
      addNotification({
        type: 'success',
        message: 'Address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to copy address',
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Send me money on Maya Wallet',
      text: `Send money to ${selectedAccount.meta.name || 'me'} on BelizeChain`,
      url: `belizechain://send?to=${selectedAccount.address}${requestAmount ? `&amount=${requestAmount}` : ''}${requestNote ? `&note=${encodeURIComponent(requestNote)}` : ''}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `Send me ${requestAmount || 'money'} on Maya Wallet: ${selectedAccount.address}`;
      await navigator.clipboard.writeText(text);
      addNotification({
        type: 'success',
        message: 'Payment request copied to clipboard',
      });
    }
  };

  const qrValue = requestAmount || requestNote
    ? `belizechain://send?to=${selectedAccount.address}&amount=${requestAmount}&note=${encodeURIComponent(requestNote)}`
    : selectedAccount.address;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/')}
            className="mr-3 text-bluehole-700 hover:text-bluehole-900"
          >
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-xl font-semibold text-bluehole-900">{t.wallet.receive} Money</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* QR Code */}
        <Card className="text-center">
          <div className="mb-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-jungle-100 text-jungle-700 text-sm font-medium mb-4">
              <QrCodeIcon size={16} />
              <span>Scan to Pay</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl inline-block mb-4">
            <QRCode
              value={qrValue}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <p className="text-sm text-bluehole-600 mb-4">
            Show this QR code to receive money
          </p>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-bluehole-600 mb-1">Your Address</p>
            <p className="text-sm font-mono text-bluehole-900 break-all">
              {selectedAccount.address}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleCopyAddress}
              leftIcon={copied ? <Check size={20} /> : <Copy size={20} />}
              className="flex-1"
            >
              {copied ? 'Copied!' : t.wallet.copyAddress}
            </Button>
            <Button
              variant="primary"
              onClick={handleShare}
              leftIcon={<Share size={20} />}
              className="flex-1"
            >
              Share
            </Button>
          </div>
        </Card>

        {/* Payment Request (Optional) */}
        <Card>
          <h3 className="font-semibold text-bluehole-900 mb-3">
            Request Specific Amount (Optional)
          </h3>
          <p className="text-sm text-bluehole-600 mb-4">
            Create a payment request with a specific amount and note
          </p>

          <div className="space-y-4">
            <Input
              label="Amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
            />

            <Input
              label="Note"
              placeholder="What's this for?"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
            />

            <div className="bg-caribbean-50 border border-caribbean-200 rounded-lg p-3">
              <p className="text-sm text-caribbean-900">
                💡 <strong>Tip:</strong> Adding an amount and note makes it easier for the sender.
                The QR code will include this information.
              </p>
            </div>
          </div>
        </Card>

        {/* How to Receive */}
        <Card className="bg-gray-100 border-gray-300">
          <h3 className="font-semibold text-bluehole-900 mb-3 flex items-center space-x-2">
            <span>📱</span>
            <span>How to Receive Money</span>
          </h3>
          <ol className="space-y-2 text-sm text-bluehole-700 list-decimal list-inside">
            <li>Show the QR code to the sender</li>
            <li>They scan it with Maya Wallet</li>
            <li>Money arrives in seconds!</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="text-xs text-bluehole-600">
              Or share your address by copying or using the share button above.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
