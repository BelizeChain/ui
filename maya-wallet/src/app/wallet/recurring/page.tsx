'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarBlank, Plus, Trash, Pause, Play } from 'phosphor-react';
import { getRecurringPayments, type RecurringPayment } from '@/services/recurring';

export default function RecurringPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<RecurringPayment[]>([]);

  useEffect(() => {
    setPayments(getRecurringPayments());
  }, []);

  const activePayments = payments.filter(p => p.active);
  const pausedPayments = payments.filter(p => !p.active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-caribbean-50 to-blue-50 pb-20">
      <div className="bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-2xl font-bold">Recurring Payments</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Add Button */}
        <button className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
          <Plus size={24} weight="bold" />
          Create Recurring Payment
        </button>

        {/* Active Payments */}
        {activePayments.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-3">Active ({activePayments.length})</h2>
            <div className="space-y-3">
              {activePayments.map((payment) => (
                <div key={payment.id} className="bg-gray-800 rounded-xl shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{payment.name}</h3>
                      <p className="text-gray-500 text-sm font-mono mt-1">{payment.recipientAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-caribbean-400">Ɗ{payment.amount.toFixed(2)}</p>
                      <p className="text-gray-500 text-xs capitalize">{payment.frequency}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <CalendarBlank size={16} weight="bold" />
                    <span>Next: {payment.nextPaymentDate.toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-gray-100 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                      <Pause size={16} weight="bold" />
                      Pause
                    </button>
                    <button className="px-4 py-2 bg-red-500/10 text-red-600 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paused Payments */}
        {pausedPayments.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-3">Paused ({pausedPayments.length})</h2>
            <div className="space-y-3">
              {pausedPayments.map((payment) => (
                <div key={payment.id} className="bg-gray-800 rounded-xl shadow-sm p-4 opacity-60">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{payment.name}</h3>
                      <p className="text-gray-500 text-sm font-mono mt-1">{payment.recipientAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-400">Ɗ{payment.amount.toFixed(2)}</p>
                      <p className="text-gray-500 text-xs capitalize">{payment.frequency}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-caribbean-100 text-caribbean-500 rounded-lg text-sm font-medium hover:bg-caribbean-200 transition-colors flex items-center justify-center gap-1">
                      <Play size={16} weight="bold" />
                      Resume
                    </button>
                    <button className="px-4 py-2 bg-red-500/10 text-red-600 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {payments.length === 0 && (
          <div className="bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <CalendarBlank size={64} className="mx-auto text-gray-300 mb-4" weight="thin" />
            <p className="text-gray-500 font-medium">No recurring payments</p>
            <p className="text-gray-400 text-sm mt-1">Set up automatic payments for bills and subscriptions</p>
          </div>
        )}
      </div>
    </div>
  );
}
