'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, FileText, CalendarBlank, House } from 'phosphor-react';
import { GlassCard } from '@/components/ui';

export default function LandPage() {
  const router = useRouter();

  const properties = [
    { id: 1, title: 'Residential Lot - Belize City', size: '0.25 acres', registered: '2023-05-15', verified: true },
    { id: 2, title: 'Commercial Property - San Pedro', size: '0.5 acres', registered: '2022-11-22', verified: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Land Registry</h1>
              <p className="text-xs text-gray-400">Your registered property titles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-green-500/30">
              <div className="flex items-center space-x-1">
                <FileText size={14} weight="fill" className="text-green-400" />
                <span className="text-xs text-green-400 font-semibold">Registry</span>
              </div>
            </div>
            <House size={32} className="text-green-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {properties.length === 0 ? (
          <div className="bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <MapPin size={64} className="mx-auto text-gray-300 mb-4" weight="thin" />
            <p className="text-gray-400 font-medium">No properties registered</p>
            <p className="text-gray-400 text-sm mt-1">Your land titles will appear here</p>
          </div>
        ) : (
          properties.map((property) => (
            <div key={property.id} className="bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-caribbean-100 rounded-xl flex-shrink-0">
                  <MapPin size={24} className="text-caribbean-400" weight="bold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{property.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                    <span>{property.size}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="flex items-center gap-1">
                      <CalendarBlank size={14} weight="bold" />
                      {property.registered}
                    </span>
                  </div>
                  {property.verified && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-500/100/20 text-green-400 rounded text-xs font-medium">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <button className="p-2 text-caribbean-400 hover:bg-caribbean-50 rounded-lg transition-colors">
                  <FileText size={20} weight="bold" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
