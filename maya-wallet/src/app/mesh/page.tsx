// src/app/mesh/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { MeshMessage } from '@/types/mesh';
import { useToast } from '@/contexts/ToastContext';
import { useWallet } from '@/contexts/WalletContext';
import { Coins } from 'phosphor-react';
import { motion } from 'framer-motion';

// Extend type to include messages for proof submission
interface PendingProof extends PakitUploadResponse {
  messages: MeshMessage[]; // MeshMessage[] imported from types
}

/** Simple utility to format a timestamp */
function formatTs(ts: number) {
  return new Date(ts).toLocaleString();
}

export default function MeshDashboard() {
  const [pending, setPending] = useState<PendingProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const { isConnected, selectedAccount } = useWallet();

  useEffect(() => {
    async function fetchPending() {
      try {
        const proofs = await pakitBridgeService.getPendingProofs();
        setPending(proofs as any);
      } catch (e) {
        console.error('Failed to fetch pending proofs', e);
        showToast({ type: 'error', message: 'Failed to load pending proofs.' });
      } finally {
        setLoading(false);
      }
    }
    fetchPending();
  }, [showToast]);

    const handleSubmit = async (proof: PendingProof) => {
      if (!isConnected) {
        showToast({ type: 'warning', message: 'Connect your wallet before submitting proofs.' });
        return;
      }
      setSubmitting(prev => new Set(prev).add(proof.ipfsHash));
      try {
        await pakitBridgeService.submitProofs(selectedAccount?.address || '', proof.ipfsHash, proof.messages as MeshMessage[]);
        setPending(prev => prev.filter(p => p.ipfsHash !== proof.ipfsHash));
        showToast({ type: 'success', message: 'Proof submitted successfully!' });
      } catch (err) {
        console.error('Proof submission failed', err);
        showToast({ type: 'error', message: (err as Error).message || 'Proof submission failed' });
      } finally {
        setSubmitting(prev => {
          const newSet = new Set(prev);
          newSet.delete(proof.ipfsHash);
          return newSet;
        });
      }
    };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-xl"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Coins size={28} weight="fill" className="text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Mesh Operator Dashboard</h1>
        </div>
        {loading ? (
          <p className="text-gray-400">Loading pending proofs…</p>
        ) : pending.length === 0 ? (
          <p className="text-gray-400">No pending proof bundles. Upload mesh messages and they will appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead className="bg-gray-700/30">
                <tr>
                  <th className="px-4 py-2 text-gray-300">IPFS Hash</th>
                  <th className="px-4 py-2 text-gray-300">Size (bytes)</th>
                  <th className="px-4 py-2 text-gray-300">Timestamp</th>
                  <th className="px-4 py-2 text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                    <td className="px-4 py-2 text-sm text-emerald-300 break-all">{p.ipfsHash || '(awaiting upload)'}</td>
                    <td className="px-4 py-2 text-sm text-gray-200">{p.size}</td>
                    <td className="px-4 py-2 text-sm text-gray-200">{formatTs(p.timestamp)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleSubmit(p)}
                        disabled={submitting.has(p.ipfsHash) || !isConnected}
                        className={`bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1 px-3 rounded transition ${submitting.has(p.ipfsHash) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {submitting.has(p.ipfsHash) ? 'Submitting…' : 'Submit Proof'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
