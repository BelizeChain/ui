// QR Code Generator Service
import { walletLogger } from '@belizechain/shared';

export interface QRCodeData {
  address: string;
  amount?: number;
  currency?: 'DALLA' | 'bBZD';
  message?: string;
  paymentRequest?: boolean;
  merchantId?: string; // For tourism rewards
}

/**
 * Execute a payment from scanned QR code
 */
export async function executeQRPayment(
  fromAddress: string,
  qrData: QRCodeData
): Promise<{ success: boolean; txHash?: string; tourismBonus?: number; error?: string }> {
  try {
    if (!qrData.amount || !qrData.currency) {
      return { success: false, error: 'QR code must include amount and currency' };
    }
    
    // Check for tourism merchant verification if merchantId present
    let tourismBonus = 0;
    if (qrData.merchantId) {
      try {
        const { getMerchantVerification } = await import('./oracle');
        const merchantInfo = await getMerchantVerification(qrData.merchantId);
        
        if (merchantInfo.verified && merchantInfo.category) {
          // Tourism rewards: 5-8% cashback based on category
          const rewardRates: Record<string, number> = {
            'dining': 0.08,
            'accommodation': 0.07,
            'tours': 0.06,
            'shopping': 0.05,
          };
          
          const rate = rewardRates[merchantInfo.category] || 0.05;
          tourismBonus = qrData.amount * rate;
          
          walletLogger.info('Tourism bonus calculated', {
            merchant: qrData.merchantId,
            category: merchantInfo.category,
            bonus: tourismBonus,
          });
        }
      } catch (error) {
        walletLogger.warn('Merchant verification failed', { error });
        // Continue without tourism bonus
      }
    }
    
    // Execute blockchain transfer
    const { submitTransfer } = await import('./blockchain');
    const result = await submitTransfer(
      fromAddress,
      qrData.address,
      qrData.amount.toString(),
      qrData.currency.toLowerCase() as 'dalla' | 'bBZD'
    );
    
    walletLogger.info('QR payment executed', {
      amount: qrData.amount,
      currency: qrData.currency,
      txHash: result.hash,
      tourismBonus,
    });
    
    return {
      success: true,
      txHash: result.hash,
      tourismBonus,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Payment failed';
    walletLogger.error('QR payment failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

// Generate QR code data URL string
// This creates a payment URI that can be encoded as QR code
export function generatePaymentURI(data: QRCodeData): string {
  const params = new URLSearchParams();
  
  if (data.amount) {
    params.append('amount', data.amount.toString());
  }
  
  if (data.currency) {
    params.append('currency', data.currency);
  }
  
  if (data.message) {
    params.append('message', encodeURIComponent(data.message));
  }
  
  if (data.paymentRequest) {
    params.append('type', 'request');
  }
  
  const uri = `belizechain:${data.address}${params.toString() ? '?' + params.toString() : ''}`;
  
  walletLogger.info('Payment URI generated', { address: data.address });
  return uri;
}

// Parse payment URI from QR code scan
export function parsePaymentURI(uri: string): QRCodeData | null {
  try {
    // Check if URI starts with belizechain: protocol
    if (!uri.startsWith('belizechain:')) {
      // Try to parse as plain address
      if (isValidAddress(uri)) {
        return { address: uri };
      }
      return null;
    }
    
    // Remove protocol prefix
    const withoutProtocol = uri.replace('belizechain:', '');
    
    // Split address and params
    const [address, paramsString] = withoutProtocol.split('?');
    
    if (!isValidAddress(address)) {
      return null;
    }
    
    const data: QRCodeData = { address };
    
    // Parse query parameters
    if (paramsString) {
      const params = new URLSearchParams(paramsString);
      
      const amount = params.get('amount');
      if (amount) {
        data.amount = parseFloat(amount);
      }
      
      const currency = params.get('currency');
      if (currency === 'DALLA' || currency === 'bBZD') {
        data.currency = currency;
      }
      
      const message = params.get('message');
      if (message) {
        data.message = decodeURIComponent(message);
      }
      
      const type = params.get('type');
      if (type === 'request') {
        data.paymentRequest = true;
      }
    }
    
    walletLogger.info('Payment URI parsed', { address: data.address });
    return data;
  } catch (error) {
    walletLogger.error('Failed to parse payment URI', error);
    return null;
  }
}

// Validate Substrate address format
function isValidAddress(address: string): boolean {
  // Basic validation - Substrate addresses are typically 47-48 characters
  // and start with specific prefixes depending on the network
  // For BelizeChain, addresses start with '5' (generic Substrate)
  
  if (!address || address.length < 47 || address.length > 48) {
    return false;
  }
  
  // Check if starts with valid prefix
  if (!address.startsWith('5')) {
    return false;
  }
  
  // Check if contains only valid base58 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}

// Utility: Shorten address for display (e.g., "5GrwvaEF...xqtbQr")
export function shortenAddress(address: string, startChars: number = 8, endChars: number = 6): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Utility: Copy address to clipboard
export async function copyAddressToClipboard(address: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = address;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      walletLogger.info('Address copied to clipboard (fallback)', { address });
      return true;
    }
    
    await navigator.clipboard.writeText(address);
    walletLogger.info('Address copied to clipboard', { address });
    return true;
  } catch (error) {
    walletLogger.error('Failed to copy address to clipboard', error);
    return false;
  }
}

// Utility: Share payment request via Web Share API
export async function sharePaymentRequest(data: QRCodeData): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.share) {
      return false;
    }
    
    const uri = generatePaymentURI(data);
    const text = data.paymentRequest 
      ? `Please send me ${data.amount} ${data.currency}\n\n${uri}`
      : `My BelizeChain address:\n${uri}`;
    
    await navigator.share({
      title: 'BelizeChain Payment Request',
      text,
    });
    
    walletLogger.info('Payment request shared', { address: data.address });
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      walletLogger.error('Failed to share payment request', error);
    }
    return false;
  }
}

// Generate QR code as SVG (simple implementation without external library)
// For production, use a library like `qrcode.react` or `qrcode`
export function generateQRCodeSVG(data: string, size: number = 256): string {
  // This is a placeholder - in production, use a proper QR code library
  // Example: import QRCode from 'qrcode'
  // const qrDataUrl = await QRCode.toDataURL(data, { width: size });
  
  walletLogger.warn('generateQRCodeSVG is a placeholder - use qrcode library in production');
  
  // Return simple SVG placeholder
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="white"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="monospace" font-size="12">
      QR Code Placeholder
    </text>
    <text x="50%" y="60%" text-anchor="middle" dy=".3em" font-family="monospace" font-size="10">
      ${shortenAddress(data)}
    </text>
  </svg>`;
}

// Example usage in React component:
/*
import QRCode from 'qrcode.react';
import { generatePaymentURI } from './services/qrcode';

function ReceivePage() {
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
  const uri = generatePaymentURI({ address, amount: 100, currency: 'DALLA' });
  
  return (
    <div className="flex flex-col items-center">
      <QRCode 
        value={uri}
        size={256}
        level="H"
        includeMargin
      />
      <p className="mt-4 text-sm text-gray-600">
        Scan to send payment
      </p>
    </div>
  );
}
*/
