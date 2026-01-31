'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletLogger, useI18n } from '@belizechain/shared';
import { GlassCard } from '@/components/ui';
import { 
  ArrowLeft, 
  Lightning,
  IdentificationCard,
  Car,
  House,
  Receipt,
  FirstAid,
  GraduationCap,
  Briefcase,
  Tree,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  Storefront,
} from 'phosphor-react';

interface Service {
  id: string;
  name: string;
  category: string;
  icon: any;
  description: string;
  fee: string;
  processingTime: string;
  status?: 'available' | 'in-progress' | 'completed';
}

export default function ServicesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const services: Service[] = [
    {
      id: '1',
      name: 'Electricity Bill Payment',
      category: 'Utilities',
      icon: Lightning,
      description: 'Pay your BEL (Belize Electricity Limited) bill',
      fee: '0 DALLA',
      processingTime: 'Instant',
      status: 'available',
    },
    {
      id: '2',
      name: 'Driver\'s License Renewal',
      category: 'Licenses',
      icon: Car,
      description: 'Renew your Belize driver\'s license online',
      fee: '50 DALLA',
      processingTime: '2-3 business days',
      status: 'in-progress',
    },
    {
      id: '3',
      name: 'Property Tax Payment',
      category: 'Taxes',
      icon: House,
      description: 'Pay annual property tax',
      fee: '0 DALLA',
      processingTime: 'Instant',
      status: 'completed',
    },
    {
      id: '4',
      name: 'Business Registration',
      category: 'Business',
      icon: Briefcase,
      description: 'Register a new business entity',
      fee: '150 DALLA',
      processingTime: '5-7 business days',
      status: 'available',
    },
    {
      id: '5',
      name: 'Passport Application',
      category: 'Identity',
      icon: IdentificationCard,
      description: 'Apply for or renew your Belize passport',
      fee: '200 DALLA',
      processingTime: '10-15 business days',
      status: 'available',
    },
    {
      id: '6',
      name: 'Medical Certificate Request',
      category: 'Healthcare',
      icon: FirstAid,
      description: 'Request medical records or certificates',
      fee: '25 DALLA',
      processingTime: '1-2 business days',
      status: 'available',
    },
    {
      id: '7',
      name: 'School Fee Payment',
      category: 'Education',
      icon: GraduationCap,
      description: 'Pay school tuition and fees',
      fee: '0 DALLA',
      processingTime: 'Instant',
      status: 'available',
    },
    {
      id: '8',
      name: 'Environmental Permit',
      category: 'Environment',
      icon: Tree,
      description: 'Apply for environmental permits',
      fee: '100 DALLA',
      processingTime: '7-10 business days',
      status: 'available',
    },
    {
      id: '9',
      name: 'Water Bill Payment',
      category: 'Utilities',
      icon: Lightning,
      description: 'Pay your BWS (Belize Water Services) bill',
      fee: '0 DALLA',
      processingTime: 'Instant',
      status: 'available',
    },
    {
      id: '10',
      name: 'Vehicle Registration',
      category: 'Licenses',
      icon: Car,
      description: 'Register or renew vehicle registration',
      fee: '75 DALLA',
      processingTime: '3-5 business days',
      status: 'available',
    },
  ];

  const categories = [
    'all',
    'Utilities',
    'Licenses',
    'Taxes',
    'Business',
    'Identity',
    'Healthcare',
    'Education',
    'Environment',
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status?: Service['status']) => {
    switch (status) {
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-maya-100 text-maya-700 rounded-full text-xs font-medium">
            <Clock size={14} weight="fill" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-jungle-100 text-jungle-700 rounded-full text-xs font-medium">
            <CheckCircle size={14} weight="fill" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const handleServiceClick = (service: Service) => {
    walletLogger.debug('Open service', { id: service.id, name: service.name });
    // Future: Navigate to service details/application page
  };

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
              <h1 className="text-xl font-bold text-white">Government {t.nav.services}</h1>
              <p className="text-xs text-gray-400">Pay bills, apply for licenses, and access government services</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-indigo-500/30">
              <div className="flex items-center space-x-1">
                <Storefront size={14} weight="fill" className="text-indigo-400" />
                <span className="text-xs text-indigo-400 font-semibold">Services</span>
              </div>
            </div>
            <Briefcase size={32} className="text-indigo-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlass 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" 
              weight="bold"
            />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${selectedCategory === category
                  ? 'bg-jungle-600 text-white shadow-md'
                  : 'bg-gray-800 text-gray-700 border border-gray-200 hover:border-jungle-300'
                }
              `}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="space-y-3">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt size={64} className="text-gray-300 mx-auto mb-4" weight="duotone" />
              <p className="text-gray-600 font-medium">No services found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className="w-full bg-gray-800 rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-caribbean-300 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Service Icon */}
                    <div className="flex-shrink-0 p-3 bg-gradient-to-br from-jungle-100 to-caribbean-100 rounded-xl">
                      <Icon size={24} className="text-jungle-600" weight="duotone" />
                    </div>

                    {/* Service Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        {getStatusBadge(service.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Fee:</span>{' '}
                          <span className={service.fee === '0 DALLA' ? 'text-jungle-600 font-semibold' : ''}>
                            {service.fee}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Processing:</span> {service.processingTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-gradient-to-br from-caribbean-50 to-caribbean-100 rounded-xl border border-caribbean-200 hover:shadow-md transition-all">
              <Receipt size={32} className="text-caribbean-400 mb-2" weight="duotone" />
              <p className="text-sm font-semibold text-caribbean-900">Pay Bills</p>
              <p className="text-xs text-caribbean-500 mt-1">Utilities & services</p>
            </button>
            
            <button className="p-4 bg-gradient-to-br from-jungle-50 to-jungle-100 rounded-xl border border-jungle-200 hover:shadow-md transition-all">
              <IdentificationCard size={32} className="text-jungle-600 mb-2" weight="duotone" />
              <p className="text-sm font-semibold text-jungle-900">ID Services</p>
              <p className="text-xs text-jungle-700 mt-1">Licenses & permits</p>
            </button>
            
            <button className="p-4 bg-gradient-to-br from-maya-50 to-maya-100 rounded-xl border border-maya-200 hover:shadow-md transition-all">
              <Briefcase size={32} className="text-maya-700 mb-2" weight="duotone" />
              <p className="text-sm font-semibold text-maya-900">Business</p>
              <p className="text-xs text-maya-700 mt-1">Registration & tax</p>
            </button>
            
            <button className="p-4 bg-gradient-to-br from-bluehole-50 to-bluehole-100 rounded-xl border border-bluehole-200 hover:shadow-md transition-all">
              <FirstAid size={32} className="text-bluehole-600 mb-2" weight="duotone" />
              <p className="text-sm font-semibold text-bluehole-900">Healthcare</p>
              <p className="text-xs text-bluehole-700 mt-1">Medical services</p>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 p-4 bg-gradient-to-r from-caribbean-50 to-jungle-50 rounded-xl border border-caribbean-200">
          <p className="text-sm text-gray-700 font-medium mb-1">
            💡 New to government services?
          </p>
          <p className="text-xs text-gray-600">
            Most services can be completed online. Pay with DALLA or bBZD directly from your wallet.
            Track application status in real-time on the blockchain.
          </p>
        </div>
      </div>
    </div>
  );
}
