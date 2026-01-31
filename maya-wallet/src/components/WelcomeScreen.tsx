'use client';

import React from 'react';
import { WalletConnect, useI18n } from '@belizechain/shared';
import { 
  Wallet, 
  ShieldCheck, 
  Globe, 
  Lightning 
} from 'phosphor-react';

export function WelcomeScreen() {
  const { t } = useI18n();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-caribbean-500 to-caribbean-700 flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-24 w-24 rounded-full bg-maya-500 flex items-center justify-center">
            <Wallet size={48} weight="fill" className="text-bluehole-900" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Maya Wallet</h1>
        <p className="text-caribbean-100 text-lg">Your Belizean Digital Wallet</p>
      </div>

      {/* Features */}
      <div className="flex-1 bg-white rounded-t-3xl p-6 pt-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-bluehole-900 mb-6 text-center">
            Simple. Secure. Belizean.
          </h2>

          <div className="space-y-6 mb-8">
            <FeatureCard
              icon={<Wallet size={32} weight="duotone" className="text-caribbean-500" />}
              title={t.wallet.send + " & " + t.wallet.receive}
              description="Transfer money to anyone in Belize instantly, like sending a text message."
            />

            <FeatureCard
              icon={<ShieldCheck size={32} weight="duotone" className="text-jungle-500" />}
              title={"Secure Your " + t.identity.documents}
              description="Keep your IDs, birth certificates, and important documents safe."
            />

            <FeatureCard
              icon={<Globe size={32} weight="duotone" className="text-maya-600" />}
              title="Government Services"
              description="Pay bills, renew licenses, and access services — all in one place."
            />

            <FeatureCard
              icon={<Lightning size={32} weight="duotone" className="text-caribbean-500" />}
              title={t.currency.tourismRewards}
              description={"Earn " + t.currency.earnCashback + " when you spend at hotels, restaurants, and attractions."}
            />
          </div>

          {/* Connect Wallet Button */}
          <div className="mt-8">
            <WalletConnect
              connectText="Get Started"
              variant="primary"
              size="lg"
              className="w-full"
              portalName="Maya Wallet"
            />
            
            <p className="text-center text-sm text-bluehole-600 mt-4">
              {t.wallet.connect} your Polkadot wallet to begin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-bluehole-900 mb-1">{title}</h3>
        <p className="text-sm text-bluehole-600">{description}</p>
      </div>
    </div>
  );
}
