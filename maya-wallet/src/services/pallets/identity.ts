/**
 * BelizeChain Identity Pallet Integration
 * Handles BelizeID, SSN/Passport verification, and KYC status
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface BelizeID {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  district: string;
  ssnVerified: boolean;
  passportVerified: boolean;
  kycStatus: 'None' | 'Pending' | 'Verified' | 'Rejected';
  registrationDate: number;
  expiryDate: number;
}

export interface SSNRecord {
  ssn: string;
  verified: boolean;
  verificationDate?: number;
  verifier?: string;
}

export interface PassportRecord {
  passportNumber: string;
  issuingCountry: string;
  issueDate: number;
  expiryDate: number;
  verified: boolean;
  verificationDate?: number;
}

export interface KYCStatus {
  level: 'None' | 'Basic' | 'Enhanced' | 'Full';
  status: 'None' | 'Pending' | 'Verified' | 'Rejected';
  verificationDate?: number;
  documents: string[];
  limits: {
    dailyTransfer: string;
    monthlyTransfer: string;
  };
}

/**
 * Get BelizeID for an address
 */
export async function getBelizeID(address: string): Promise<BelizeID | null> {
  const api = await initializeApi();
  
  try {
    const identity: any = await api.query.identity?.identities(address);
    
    if (!identity || identity.isNone) {
      return null;
    }

    const data = identity.unwrap();
    
    return {
      id: data.id.toString(),
      firstName: data.firstName.toString(),
      middleName: data.middleName?.toString(),
      lastName: data.lastName.toString(),
      dateOfBirth: data.dateOfBirth.toString(),
      nationality: data.nationality.toString(),
      address: data.address.toString(),
      district: data.district.toString(),
      ssnVerified: data.ssnVerified.toHuman(),
      passportVerified: data.passportVerified.toHuman(),
      kycStatus: data.kycStatus.toString(),
      registrationDate: data.registrationDate.toNumber(),
      expiryDate: data.expiryDate.toNumber(),
    };
  } catch (error) {
    console.error('Failed to fetch BelizeID:', error);
    return null;
  }
}

/**
 * Register a new BelizeID
 */
export async function registerBelizeID(
  address: string,
  data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    residenceAddress: string;
    district: string;
  }
): Promise<{ hash: string; blockHash?: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    
    const tx = api.tx.identity.registerIdentity(
      data.firstName,
      data.middleName || '',
      data.lastName,
      data.dateOfBirth,
      data.nationality,
      data.residenceAddress,
      data.district
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          // Check for errors
          events.forEach(({ event }) => {
            if (api.events.system.ExtrinsicFailed.is(event)) {
              const [dispatchError]: any = event.data;
              let errorMessage = 'Registration failed';
              
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              }
              
              reject(new Error(errorMessage));
            }
          });

          resolve({
            hash: txHash.toString(),
            blockHash: status.asInBlock.toString(),
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('BelizeID registration failed:', error);
    throw error;
  }
}

/**
 * Get SSN verification status
 */
export async function getSSNRecord(address: string): Promise<SSNRecord | null> {
  const api = await initializeApi();
  
  try {
    const ssnRecord: any = await api.query.identity?.ssnRecords(address);
    
    if (!ssnRecord || ssnRecord.isNone) {
      return null;
    }

    const data = ssnRecord.unwrap();
    
    return {
      ssn: data.ssn.toString(),
      verified: data.verified.toHuman(),
      verificationDate: data.verificationDate?.toNumber(),
      verifier: data.verifier?.toString(),
    };
  } catch (error) {
    console.error('Failed to fetch SSN record:', error);
    return null;
  }
}

/**
 * Submit SSN for verification
 */
export async function submitSSNVerification(
  address: string,
  ssn: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.identity.submitSsnVerification(ssn);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('SSN verification submission failed:', error);
    throw error;
  }
}

/**
 * Get passport verification status
 */
export async function getPassportRecord(address: string): Promise<PassportRecord | null> {
  const api = await initializeApi();
  
  try {
    const passportRecord: any = await api.query.identity?.passportRecords(address);
    
    if (!passportRecord || passportRecord.isNone) {
      return null;
    }

    const data = passportRecord.unwrap();
    
    return {
      passportNumber: data.passportNumber.toString(),
      issuingCountry: data.issuingCountry.toString(),
      issueDate: data.issueDate.toNumber(),
      expiryDate: data.expiryDate.toNumber(),
      verified: data.verified.toHuman(),
      verificationDate: data.verificationDate?.toNumber(),
    };
  } catch (error) {
    console.error('Failed to fetch passport record:', error);
    return null;
  }
}

/**
 * Submit passport for verification
 */
export async function submitPassportVerification(
  address: string,
  passportNumber: string,
  issuingCountry: string,
  issueDate: number,
  expiryDate: number
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.identity.submitPassportVerification(
      passportNumber,
      issuingCountry,
      issueDate,
      expiryDate
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Passport verification submission failed:', error);
    throw error;
  }
}

/**
 * Get KYC status for an address
 */
export async function getKYCStatus(address: string): Promise<KYCStatus> {
  const api = await initializeApi();
  
  try {
    const kycRecord: any = await api.query.compliance?.kycRecords(address);
    
    if (!kycRecord || kycRecord.isNone) {
      return {
        level: 'None',
        status: 'None',
        documents: [],
        limits: {
          dailyTransfer: '25000.00', // Default citizen limit
          monthlyTransfer: '750000.00',
        },
      };
    }

    const data = kycRecord.unwrap();
    
    return {
      level: data.level.toString() as any,
      status: data.status.toString() as any,
      verificationDate: data.verificationDate?.toNumber(),
      documents: data.documents.toHuman() as string[],
      limits: {
        dailyTransfer: formatBalance(data.dailyLimit.toString()),
        monthlyTransfer: formatBalance(data.monthlyLimit.toString()),
      },
    };
  } catch (error) {
    console.error('Failed to fetch KYC status:', error);
    return {
      level: 'None',
      status: 'None',
      documents: [],
      limits: {
        dailyTransfer: '25000.00',
        monthlyTransfer: '750000.00',
      },
    };
  }
}

/**
 * Resolve address to BelizeID name (for contact display)
 */
export async function resolveAddressToName(address: string): Promise<string | null> {
  const belizeID = await getBelizeID(address);
  
  if (!belizeID) {
    return null;
  }

  const fullName = [
    belizeID.firstName,
    belizeID.middleName,
    belizeID.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return fullName || null;
}

/**
 * Check if address has completed KYC
 */
export async function isKYCVerified(address: string): Promise<boolean> {
  const kycStatus = await getKYCStatus(address);
  return kycStatus.status === 'Verified';
}

/**
 * Get account type from identity
 */
export async function getAccountType(address: string): Promise<'Citizen' | 'Business' | 'Tourism' | 'Government' | null> {
  const api = await initializeApi();
  
  try {
    const accountData: any = await api.query.economy?.accounts(address);
    
    if (!accountData || accountData.isNone) {
      return null;
    }

    return accountData.unwrap().accountType.toString() as any;
  } catch (error) {
    console.error('Failed to fetch account type:', error);
    return null;
  }
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
