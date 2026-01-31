'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, QrCode } from 'phosphor-react';
import Link from 'next/link';
import { useI18n } from '@belizechain/shared';

export default function WalletReceivePage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-caribbean-50 to-blue-50 pb-20">
      <div className="bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-2xl font-bold">{t.wallet.receive} Payment</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-gray-800 rounded-2xl shadow-md p-8 text-center space-y-4">
          <QrCode size={64} className="mx-auto text-caribbean-500" weight="thin" />
          <p className="text-gray-400">{t.wallet.receive} feature uses the main receive page</p>
          <Link 
            href="/receive" 
            className="inline-block px-6 py-3 bg-caribbean-600 text-white rounded-xl font-semibold hover:bg-caribbean-700"
          >
            Go to {t.wallet.receive} Page
          </Link>
        </div>
      </div>
    </div>
  );
}
