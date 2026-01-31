'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Moon, ShieldCheck, Gear } from 'phosphor-react';
import Link from 'next/link';

export default function SettingsNotificationsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-caribbean-50 to-blue-50 pb-20">
      <div className="bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-gray-800 rounded-2xl shadow-md p-6">
          <p className="text-gray-400 text-center">Notification preferences coming soon</p>
        </div>
      </div>
    </div>
  );
}
