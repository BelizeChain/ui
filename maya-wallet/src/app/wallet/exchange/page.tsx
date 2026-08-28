'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WalletExchangeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/trade');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
      <p className="text-slate-400">Redirecting to Trade...</p>
    </div>
  );
}
