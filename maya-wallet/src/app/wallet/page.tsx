'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WalletRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
      <p className="text-slate-400">Loading Maya Wallet...</p>
    </div>
  );
}
