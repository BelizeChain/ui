'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, IdentificationCard, MapPin, Upload, 
  ShieldCheck, Warning, CheckCircle, FileText, Lock, X
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet';

type StepType = 'personal' | 'documents' | 'verification' | 'review';
type KYCLevel = 'Basic' | 'Standard' | 'Enhanced';
type AccountType = 'Citizen' | 'Business' | 'Tourism';
type District = 'Belize' | 'Cayo' | 'Corozal' | 'Orange Walk' | 'Stann Creek' | 'Toledo';

interface KYCApplication {
  // Personal Info
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  district: District;
  accountType: AccountType;
  kycLevel: KYCLevel;
  
  // Contact Info
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  
  // Documents
  ssnDocument: File | null;
  passportDocument: File | null;
  addressProof: File | null;
  
  // Business Info (if applicable)
  businessName?: string;
  businessRegistration?: string;
  
  // Verification
  termsAccepted: boolean;
  dataProcessingConsent: boolean;
}

const DISTRICTS: District[] = ['Belize', 'Cayo', 'Corozal', 'Orange Walk', 'Stann Creek', 'Toledo'];
const ACCOUNT_TYPES: AccountType[] = ['Citizen', 'Business', 'Tourism'];
const KYC_LEVELS: KYCLevel[] = ['Basic', 'Standard', 'Enhanced'];

export default function KYCApplicationPage() {
  const router = useRouter();
  const { selectedAccount } = useWalletStore();
  const [currentStep, setCurrentStep] = useState<StepType>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [application, setApplication] = useState<KYCApplication>({
    fullName: '',
    dateOfBirth: '',
    nationality: 'Belizean',
    district: 'Belize',
    accountType: 'Citizen',
    kycLevel: 'Standard',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    ssnDocument: null,
    passportDocument: null,
    addressProof: null,
    termsAccepted: false,
    dataProcessingConsent: false,
  });

  const steps: { id: StepType; label: string; icon: any }[] = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'documents', label: 'Document Upload', icon: Upload },
    { id: 'verification', label: 'Address Verification', icon: MapPin },
    { id: 'review', label: 'Review & Submit', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // TODO: Integrate with blockchain submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push('/compliance?applied=true');
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'personal':
        return application.fullName && application.email && application.phone && application.dateOfBirth;
      case 'documents':
        return application.ssnDocument && application.passportDocument;
      case 'verification':
        return application.address && application.city && application.addressProof;
      case 'review':
        return application.termsAccepted && application.dataProcessingConsent;
      default:
        return false;
    }
  };

  const calculateRiskScore = () => {
    let score = 0;
    
    // Account type risk
    if (application.accountType === 'Tourism') score += 20;
    else if (application.accountType === 'Business') score += 15;
    else score += 5;
    
    // KYC level (higher level = more verification = lower risk)
    if (application.kycLevel === 'Basic') score += 25;
    else if (application.kycLevel === 'Standard') score += 10;
    else score += 0;
    
    // Document completeness
    const docsProvided = [application.ssnDocument, application.passportDocument, application.addressProof]
      .filter(Boolean).length;
    score += (3 - docsProvided) * 15;
    
    return Math.min(100, score);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack} 
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">KYC Application</h1>
              <p className="text-xs text-gray-400">Know Your Customer verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-purple-500/20 rounded-lg">
              <span className="text-xs font-medium text-purple-300">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive ? 'bg-purple-500' :
                      isCompleted ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}>
                      <Icon size={24} className="text-white" weight={isActive ? 'fill' : 'duotone'} />
                    </div>
                    <p className={`mt-2 text-xs font-medium ${
                      isActive ? 'text-purple-400' :
                      isCompleted ? 'text-emerald-400' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-gray-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Encryption Notice */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
          <Lock size={20} className="text-blue-400 flex-shrink-0 mt-0.5" weight="fill" />
          <div>
            <p className="text-sm font-medium text-blue-300 mb-1">End-to-End Encrypted</p>
            <p className="text-xs text-blue-200/80">
              All personal information and documents are encrypted using AES-256 encryption before being stored on-chain via IPFS.
            </p>
          </div>
        </div>

        {/* Step Content */}
        <GlassCard variant="dark-medium" blur="lg" className="p-8">
          {currentStep === 'personal' && (
            <PersonalInfoStep application={application} setApplication={setApplication} />
          )}
          {currentStep === 'documents' && (
            <DocumentsStep application={application} setApplication={setApplication} />
          )}
          {currentStep === 'verification' && (
            <VerificationStep application={application} setApplication={setApplication} />
          )}
          {currentStep === 'review' && (
            <ReviewStep application={application} setApplication={setApplication} riskScore={calculateRiskScore()} />
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-700">
            <Button
              onClick={handleBack}
              variant="secondary"
            >
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>
            
            {currentStep === 'review' ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedAccount || !isStepValid() || isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next Step
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/**
 * Step 1: Personal Information
 */
function PersonalInfoStep({ application, setApplication }: {
  application: KYCApplication;
  setApplication: React.Dispatch<React.SetStateAction<KYCApplication>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Personal Information</h2>
        <p className="text-sm text-gray-400">Provide your basic personal details</p>
      </div>

      <div className="space-y-4">
        {/* Account Type & KYC Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Type <span className="text-red-400">*</span>
            </label>
            <select
              value={application.accountType}
              onChange={(e) => setApplication({ ...application, accountType: e.target.value as AccountType })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {ACCOUNT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              KYC Level <span className="text-red-400">*</span>
            </label>
            <select
              value={application.kycLevel}
              onChange={(e) => setApplication({ ...application, kycLevel: e.target.value as KYCLevel })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {KYC_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={application.fullName}
            onChange={(e) => setApplication({ ...application, fullName: e.target.value })}
            placeholder="John Martinez"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Date of Birth & Nationality */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date of Birth <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={application.dateOfBirth}
              onChange={(e) => setApplication({ ...application, dateOfBirth: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nationality
            </label>
            <input
              type="text"
              value={application.nationality}
              onChange={(e) => setApplication({ ...application, nationality: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            District <span className="text-red-400">*</span>
          </label>
          <select
            value={application.district}
            onChange={(e) => setApplication({ ...application, district: e.target.value as District })}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            {DISTRICTS.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={application.email}
              onChange={(e) => setApplication({ ...application, email: e.target.value })}
              placeholder="john@example.com"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={application.phone}
              onChange={(e) => setApplication({ ...application, phone: e.target.value })}
              placeholder="+501 123-4567"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Business Info (conditional) */}
        {application.accountType === 'Business' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={application.businessName || ''}
                onChange={(e) => setApplication({ ...application, businessName: e.target.value })}
                placeholder="Tropical Tours Ltd"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                value={application.businessRegistration || ''}
                onChange={(e) => setApplication({ ...application, businessRegistration: e.target.value })}
                placeholder="BZ-12345"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Step 2: Document Upload
 */
function DocumentsStep({ application, setApplication }: {
  application: KYCApplication;
  setApplication: React.Dispatch<React.SetStateAction<KYCApplication>>;
}) {
  const handleFileChange = (field: 'ssnDocument' | 'passportDocument' | 'addressProof', file: File | null) => {
    setApplication({ ...application, [field]: file });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Document Upload</h2>
        <p className="text-sm text-gray-400">Upload required identity documents</p>
      </div>

      <div className="space-y-4">
        <FileUpload
          label="Social Security Number (SSN) Document"
          file={application.ssnDocument}
          onChange={(file) => handleFileChange('ssnDocument', file)}
          required
        />
        <FileUpload
          label="Passport or National ID"
          file={application.passportDocument}
          onChange={(file) => handleFileChange('passportDocument', file)}
          required
        />
        <FileUpload
          label="Proof of Address (Optional)"
          file={application.addressProof}
          onChange={(file) => handleFileChange('addressProof', file)}
          description="Utility bill, bank statement, or lease agreement (less than 3 months old)"
        />
      </div>
    </div>
  );
}

/**
 * Step 3: Address Verification
 */
function VerificationStep({ application, setApplication }: {
  application: KYCApplication;
  setApplication: React.Dispatch<React.SetStateAction<KYCApplication>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Address Verification</h2>
        <p className="text-sm text-gray-400">Provide your current residential address</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Street Address <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={application.address}
            onChange={(e) => setApplication({ ...application, address: e.target.value })}
            placeholder="123 Main Street"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              City <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={application.city}
              onChange={(e) => setApplication({ ...application, city: e.target.value })}
              placeholder="Belize City"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={application.postalCode}
              onChange={(e) => setApplication({ ...application, postalCode: e.target.value })}
              placeholder="00000"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {!application.addressProof && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
            <Warning size={20} className="text-amber-400 flex-shrink-0 mt-0.5" weight="fill" />
            <div>
              <p className="text-sm font-medium text-amber-300 mb-1">Address Proof Recommended</p>
              <p className="text-xs text-amber-200/80">
                Upload proof of address in the previous step to expedite your application approval.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Step 4: Review & Submit
 */
function ReviewStep({ application, setApplication, riskScore }: {
  application: KYCApplication;
  setApplication: React.Dispatch<React.SetStateAction<KYCApplication>>;
  riskScore: number;
}) {
  const riskLevel = riskScore < 30 ? 'Low' : riskScore < 70 ? 'Medium' : 'High';
  const riskColor = riskLevel === 'Low' ? 'emerald' : riskLevel === 'Medium' ? 'amber' : 'red';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Review Application</h2>
        <p className="text-sm text-gray-400">Verify all information before submitting</p>
      </div>

      {/* Risk Assessment */}
      <div className={`p-4 bg-${riskColor}-500/10 border border-${riskColor}-500/20 rounded-lg`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Risk Assessment</span>
          <span className={`text-lg font-bold text-${riskColor}-400`}>{riskLevel}</span>
        </div>
        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-${riskColor}-500 transition-all duration-500`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Score: {riskScore}/100</p>
      </div>

      {/* Application Summary */}
      <div className="space-y-3">
        <SummaryItem label="Full Name" value={application.fullName} />
        <SummaryItem label="Account Type" value={application.accountType} />
        <SummaryItem label="KYC Level" value={application.kycLevel} />
        <SummaryItem label="District" value={application.district} />
        <SummaryItem label="Email" value={application.email} />
        <SummaryItem label="Phone" value={application.phone} />
        <SummaryItem label="Address" value={`${application.address}, ${application.city}`} />
        
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Documents Uploaded</p>
          <div className="space-y-1">
            <DocumentStatus label="SSN Document" uploaded={!!application.ssnDocument} />
            <DocumentStatus label="Passport" uploaded={!!application.passportDocument} />
            <DocumentStatus label="Address Proof" uploaded={!!application.addressProof} />
          </div>
        </div>
      </div>

      {/* Consent Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={application.termsAccepted}
            onChange={(e) => setApplication({ ...application, termsAccepted: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-gray-700 bg-gray-800/50 text-purple-500 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-300">
            I accept the <span className="text-purple-400 hover:underline">Terms of Service</span> and <span className="text-purple-400 hover:underline">Privacy Policy</span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={application.dataProcessingConsent}
            onChange={(e) => setApplication({ ...application, dataProcessingConsent: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-gray-700 bg-gray-800/50 text-purple-500 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-300">
            I consent to the processing of my personal data for KYC verification purposes
          </span>
        </label>
      </div>
    </div>
  );
}

/**
 * File Upload Component
 */
function FileUpload({ label, file, onChange, required, description }: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  description?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {file ? (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-emerald-400" weight="duotone" />
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            onClick={() => onChange(null)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-red-400" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
          <Upload size={32} className="text-gray-500 mb-2" weight="duotone" />
          <p className="text-sm font-medium text-gray-400 mb-1">Click to upload</p>
          <p className="text-xs text-gray-600">PDF, JPG, PNG (max 10MB)</p>
          <input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
        </label>
      )}
      {description && (
        <p className="mt-2 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

/**
 * Summary Item Component
 */
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-800/50 rounded-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}

/**
 * Document Status Component
 */
function DocumentStatus({ label, uploaded }: { label: string; uploaded: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      {uploaded ? (
        <div className="flex items-center gap-1">
          <CheckCircle size={14} className="text-emerald-400" weight="fill" />
          <span className="text-xs text-emerald-400">Uploaded</span>
        </div>
      ) : (
        <span className="text-xs text-gray-600">Not uploaded</span>
      )}
    </div>
  );
}
