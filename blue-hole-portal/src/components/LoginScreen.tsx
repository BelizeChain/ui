'use client';

import React from 'react';
import { WalletConnect } from '@belizechain/shared';
import { ShieldCheck } from 'phosphor-react';

export function LoginScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bluehole-900 via-bluehole-800 to-caribbean-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-caribbean-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-jungle-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-lg shadow-2xl rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-caribbean-500 to-bluehole-600 mb-4">
            <ShieldCheck size={40} weight="duotone" className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-bluehole-900 mb-2">Blue Hole Portal</h1>
          <p className="text-bluehole-600 mb-6">Government Administration Dashboard</p>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-maya-100 text-maya-800 text-sm">
            <div className="w-2 h-2 rounded-full bg-maya-500 animate-pulse" />
            <span>Secure Access</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bluehole-50 border border-bluehole-200 rounded-lg p-4 text-sm text-bluehole-700">
            <p className="font-semibold mb-2">🔐 Authorized Personnel Only</p>
            <p>Connect your government-authorized Polkadot.js wallet to access the administration dashboard.</p>
          </div>

          <WalletConnect 
            connectText="Connect Government Wallet"
            variant="primary"
            size="lg"
            className="w-full"
            portalName="Blue Hole Portal"
          />

          <p className="text-center text-sm text-bluehole-600">
            Requires Polkadot.js browser extension
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-bluehole-200">
          <p className="text-xs text-center text-bluehole-500">
            Secured by BelizeChain • Ministry of Digital Transformation
          </p>
        </div>
      </div>
    </div>
  );
}
