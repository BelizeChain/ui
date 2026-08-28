'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WalletReceiveRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/receive');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
      <p className="text-slate-400">Redirecting to Receive...</p>
    </div>
  );
}
