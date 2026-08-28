'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WalletContactsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/contacts');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
      <p className="text-slate-400">Redirecting to Contacts...</p>
    </div>
  );
}
