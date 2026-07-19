/**
 * Blockchain Error Mapping Utility
 *
 * Maps raw Substrate/Polkadot.js errors to user-friendly messages.
 * Used across both Maya Wallet and Blue Hole Portal for consistent error UX.
 */

/** Categorised user-friendly error with optional recovery hint. */
export interface FriendlyError {
  message: string;
  title: string;
  recoverable: boolean;
  hint?: string;
}

/**
 * Known Substrate module error patterns.
 * Keys are `{section}.{name}` lowercased (e.g. `balances.insufficientbalance`).
 */
const MODULE_ERRORS: Record<string, FriendlyError> = {
  // ── Balances / Economy ──
  'balances.insufficientbalance': {
    title: 'Insufficient Balance',
    message: 'You don\'t have enough DALLA to complete this transaction (including fees).',
    recoverable: true,
    hint: 'Try reducing the amount or add more funds to your wallet.',
  },
  'economy.insufficientbalance': {
    title: 'Insufficient Balance',
    message: 'Not enough DALLA or bBZD for this transfer.',
    recoverable: true,
    hint: 'Check your balance and try a smaller amount.',
  },
  'balances.existentialdeposit': {
    title: 'Minimum Balance Required',
    message: 'This transfer would bring your account below the minimum required balance.',
    recoverable: true,
    hint: 'Keep at least 1 DALLA in your account.',
  },
  'balances.liquidityrequirements': {
    title: 'Funds Locked',
    message: 'Some of your funds are locked for staking or governance and cannot be transferred.',
    recoverable: true,
    hint: 'Unstake or unlock your funds first.',
  },

  // ── Staking ──
  'staking.alreadybonded': {
    title: 'Already Staked',
    message: 'This account already has an active staking bond.',
    recoverable: false,
  },
  'staking.insufficientbond': {
    title: 'Stake Too Low',
    message: 'The amount is below the minimum staking requirement.',
    recoverable: true,
    hint: 'Increase your stake amount to meet the minimum.',
  },
  'staking.notenoughcontrollers': {
    title: 'Controller Required',
    message: 'A controller account is needed for this staking operation.',
    recoverable: true,
  },
  'staking.notnominator': {
    title: 'Not a Nominator',
    message: 'This account is not registered as a nominator.',
    recoverable: true,
    hint: 'Bond funds and nominate validators first.',
  },

  // ── Governance ──
  'democracy.alreadyvoted': {
    title: 'Already Voted',
    message: 'You have already cast a vote on this proposal.',
    recoverable: false,
  },
  'democracy.proposalblacklisted': {
    title: 'Proposal Rejected',
    message: 'This proposal has been permanently rejected by the council.',
    recoverable: false,
  },
  'democracy.notenoughfunds': {
    title: 'Insufficient Voting Power',
    message: 'You need more DALLA to place this vote.',
    recoverable: true,
    hint: 'Conviction voting multiplies your lock period but increases voting power.',
  },

  // ── Identity / KYC ──
  'identity.notfound': {
    title: 'Identity Not Found',
    message: 'No BelizeID record exists for this account.',
    recoverable: true,
    hint: 'Register your BelizeID first.',
  },
  'compliance.restrictedaccount': {
    title: 'Account Restricted',
    message: 'Your account is restricted. Please contact compliance support.',
    recoverable: false,
  },
  'compliance.kyclevelinsufficient': {
    title: 'KYC Level Too Low',
    message: 'This action requires a higher KYC verification level.',
    recoverable: true,
    hint: 'Upgrade your KYC level in the BelizeID section.',
  },

  // ── BelizeX (DEX) ──
  'belizex.slippageexceeded': {
    title: 'Price Changed',
    message: 'The price moved beyond your slippage tolerance while the transaction was processing.',
    recoverable: true,
    hint: 'Try again or increase your slippage tolerance.',
  },
  'belizex.insufficientliquidity': {
    title: 'Not Enough Liquidity',
    message: 'There isn\'t enough liquidity in the pool for this trade size.',
    recoverable: true,
    hint: 'Try a smaller amount or wait for more liquidity.',
  },

  // ── BNS ──
  'bns.domainnotavailable': {
    title: 'Domain Taken',
    message: 'This .bz domain name is already registered.',
    recoverable: true,
    hint: 'Try a different domain name.',
  },
  'bns.domainexpired': {
    title: 'Domain Expired',
    message: 'This domain has expired and cannot be used.',
    recoverable: true,
    hint: 'Renew the domain to restore it.',
  },

  // ── LandLedger ──
  'landledger.notowner': {
    title: 'Not Property Owner',
    message: 'Only the registered owner can modify this land title.',
    recoverable: false,
  },

  // ── Interoperability (Bridges) ──
  'interoperability.bridgepaused': {
    title: 'Bridge Paused',
    message: 'This cross-chain bridge is temporarily paused for maintenance.',
    recoverable: false,
    hint: 'Try again later or use a different bridge.',
  },
  'interoperability.dailylimitexceeded': {
    title: 'Daily Limit Reached',
    message: 'The daily transfer limit for this bridge has been reached.',
    recoverable: true,
    hint: 'Try again tomorrow or use a smaller amount.',
  },

  // ── Contracts (GEM) ──
  'contracts.outofgas': {
    title: 'Execution Failed',
    message: 'The smart contract ran out of gas during execution.',
    recoverable: true,
    hint: 'Try increasing the gas limit.',
  },
  'contracts.contractnotfound': {
    title: 'Contract Not Found',
    message: 'The smart contract at this address does not exist.',
    recoverable: false,
  },
};

/**
 * Patterns matched against the raw error message string for errors that
 * don't come through as structured module errors.
 */
const MESSAGE_PATTERNS: Array<{ pattern: RegExp; error: FriendlyError }> = [
  {
    pattern: /1010.*invalid transaction.*inability to pay/i,
    error: {
      title: 'Cannot Pay Fees',
      message: 'Your account doesn\'t have enough DALLA to pay the transaction fee.',
      recoverable: true,
      hint: 'Add DALLA to your account to cover network fees.',
    },
  },
  {
    pattern: /1010.*invalid transaction.*stale/i,
    error: {
      title: 'Transaction Expired',
      message: 'This transaction has expired. Please try again.',
      recoverable: true,
    },
  },
  {
    pattern: /1012.*transaction.*pool/i,
    error: {
      title: 'Network Busy',
      message: 'The transaction pool is full. The network is experiencing high demand.',
      recoverable: true,
      hint: 'Wait a moment and try again.',
    },
  },
  {
    pattern: /disconnected|websocket|connection/i,
    error: {
      title: 'Connection Lost',
      message: 'Lost connection to the BelizeChain network.',
      recoverable: true,
      hint: 'Check your internet connection and try again.',
    },
  },
  {
    pattern: /timeout|timed out/i,
    error: {
      title: 'Request Timed Out',
      message: 'The network didn\'t respond in time.',
      recoverable: true,
      hint: 'The network may be busy. Try again shortly.',
    },
  },
  {
    pattern: /user (rejected|cancelled|denied)/i,
    error: {
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction in your wallet extension.',
      recoverable: true,
    },
  },
  {
    pattern: /extension not found|polkadot.*extension/i,
    error: {
      title: 'Wallet Not Found',
      message: 'The Polkadot.js browser extension is not installed or not enabled for this site.',
      recoverable: true,
      hint: 'Install the Polkadot.js extension and enable it for this site.',
    },
  },
  {
    pattern: /module not found|pallet.*not.*available/i,
    error: {
      title: 'Feature Unavailable',
      message: 'This feature is not available on the current network.',
      recoverable: false,
      hint: 'The runtime may need to be upgraded to include this pallet.',
    },
  },
];

/** Fallback for completely unknown errors. */
const UNKNOWN_ERROR: FriendlyError = {
  title: 'Something Went Wrong',
  message: 'An unexpected error occurred. Please try again.',
  recoverable: true,
  hint: 'If the problem persists, check the browser console for details.',
};

/**
 * Convert a raw blockchain error into a user-friendly message.
 *
 * Handles:
 * - Structured Substrate module errors (DispatchError with section/name)
 * - Raw error message strings
 * - Generic Error objects
 *
 * @param error - The raw error from a blockchain interaction
 * @returns A user-friendly error with title, message, and recovery hint
 */
export function getUserFriendlyError(error: unknown): FriendlyError {
  // 1. Try structured module error (from api.registry.findMetaError)
  if (error && typeof error === 'object') {
    const err = error as any;

    // Dispatch error with decoded module info
    if (err.section && err.name) {
      const key = `${err.section}.${err.name}`.toLowerCase();
      if (MODULE_ERRORS[key]) return MODULE_ERRORS[key];
    }

    // Error with a message string
    const message = err.message || err.toString?.() || '';
    if (message) {
      // Check for `Section.Name` patterns in the error message
      const moduleMatch = message.match(/(\w+)\.(\w+)/);
      if (moduleMatch) {
        const key = `${moduleMatch[1]}.${moduleMatch[2]}`.toLowerCase();
        if (MODULE_ERRORS[key]) return MODULE_ERRORS[key];
      }

      // Check message patterns
      for (const { pattern, error: friendlyError } of MESSAGE_PATTERNS) {
        if (pattern.test(message)) return friendlyError;
      }
    }
  }

  // 2. Try raw string
  if (typeof error === 'string') {
    const lower = error.toLowerCase();
    for (const [key, friendlyError] of Object.entries(MODULE_ERRORS)) {
      if (lower.includes(key)) return friendlyError;
    }
    for (const { pattern, error: friendlyError } of MESSAGE_PATTERNS) {
      if (pattern.test(error)) return friendlyError;
    }
  }

  return UNKNOWN_ERROR;
}

/**
 * Convenience: get just the user-facing message string.
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  return getUserFriendlyError(error).message;
}
