/**
 * Blue Hole Portal Admin Store
 * 
 * MIGRATED TO SHARED HOOKS: Uses @belizechain/shared useWallet for wallet connection,
 * but extends with government-specific Admin profile and permissions.
 * 
 * This store:
 * - Uses shared useWallet for connection (replaces mock username/password)
 * - Queries Governance pallet for admin role verification
 * - Manages admin-specific state (role, department, permissions)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import { useWallet } from '@belizechain/shared';

export interface Admin {
  id: string;
  address: string;
  name: string;
  role: 'super-admin' | 'treasury' | 'compliance' | 'operations';
  department: string;
  permissions: string[];
  lastLogin: number;
}

interface AdminState {
  admin: Admin | null;
  isLoading: boolean;
  
  // Actions
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  loadAdminProfile: (address: string) => Promise<void>;
}

/**
 * Query blockchain for admin role and permissions
 */
async function loadBlockchainService() {
  if (typeof window === 'undefined') {
    throw new Error('Blockchain service can only be used client-side');
  }
  
  const { blockchainService } = await import('@/services/blockchain');
  return blockchainService;
}

type AdminRoleInfo = Pick<Admin, 'role' | 'department' | 'permissions'>;

/**
 * Resolve an address's on-chain admin role for the Blue Hole Portal.
 *
 * Authorization is derived from the runtime governance surface:
 *  - the `sudo` key   -> super-admin (full permissions)
 *  - `technicalCouncil` member -> operations role (protocol/security)
 *  - `governanceCouncil` member -> treasury role (democratic governance)
 *
 * Returns `null` for any wallet that holds none of these seats so callers can
 * fail closed instead of granting blanket admin access.
 */
async function resolveAdminRole(api: any, address: string): Promise<AdminRoleInfo | null> {
  // Normalize the target so SS58 prefix differences don't break comparison.
  const target = api.registry.createType('AccountId', address);

  // Sudo key -> root authority (testnet).
  try {
    const sudoKey = await api.query.sudo?.key?.();
    if (sudoKey) {
      const sudoAccount = sudoKey.isSome ? sudoKey.unwrap() : sudoKey;
      if (!sudoKey.isNone && target.eq(sudoAccount)) {
        return {
          role: 'super-admin',
          department: 'Root Authority',
          permissions: ['treasury', 'governance', 'compliance', 'operations', 'quantum', 'storage'],
        };
      }
    }
  } catch (err) {
    console.error('Sudo key lookup failed:', err);
  }

  const isCouncilMember = async (pallet: string): Promise<boolean> => {
    try {
      const members: any = await api.query[pallet]?.members?.();
      if (!members) return false;
      return members.some((member: any) => target.eq(member));
    } catch (err) {
      console.error(`${pallet} membership lookup failed:`, err);
      return false;
    }
  };

  if (await isCouncilMember('technicalCouncil')) {
    return {
      role: 'operations',
      department: 'Technical Council',
      permissions: ['operations', 'quantum', 'storage', 'governance'],
    };
  }

  if (await isCouncilMember('governanceCouncil')) {
    return {
      role: 'treasury',
      department: 'Governance Council',
      permissions: ['treasury', 'governance', 'compliance'],
    };
  }

  return null;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      admin: null,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        
        try {
          // Connect the Polkadot.js extension and verify the wallet holds an
          // on-chain admin role (sudo key or a governance/technical council
          // seat) before granting access to the government portal.
          if (typeof window === 'undefined') {
            throw new Error('Wallet connection only available client-side');
          }
          
          const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
          
          const extensions = await web3Enable('Blue Hole Portal');
          if (extensions.length === 0) {
            throw new Error('Please install Polkadot.js extension to continue');
          }
          
          const accounts = await web3Accounts();
          if (accounts.length === 0) {
            throw new Error('No accounts found in Polkadot.js extension');
          }
          
          // Use first account (or let user select)
          const account = accounts[0];

          const blockchain = await loadBlockchainService();
          await blockchain.initialize();
          const api = await blockchain.getApi();

          const roleInfo = await resolveAdminRole(api, account.address);
          if (!roleInfo) {
            throw new Error(
              'This wallet is not authorized for the Blue Hole Portal. Admin access requires a sudo key or a governance/technical council seat.',
            );
          }

          // Prefer the on-chain identity display name; fall back to the
          // extension-provided account name.
          let name = account.meta.name || 'Government Official';
          try {
            const identityRaw = await api.query.identity?.identityOf?.(account.address);
            const identity = identityRaw?.toJSON() as any;
            name = identity?.display || identity?.name || name;
          } catch {
            // Identity lookup is best-effort; keep the fallback name.
          }

          const admin: Admin = {
            id: account.address,
            address: account.address,
            name,
            role: roleInfo.role,
            department: roleInfo.department,
            permissions: roleInfo.permissions,
            lastLogin: Date.now(),
          };
          
          set({ admin, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ admin: null });
      },

      checkAuth: () => {
        // Check if stored admin is still valid
        const stored = get().admin;
        if (stored && Date.now() - stored.lastLogin > 24 * 60 * 60 * 1000) {
          // Session expired after 24 hours
          set({ admin: null });
        }
      },

      loadAdminProfile: async (address: string) => {
        try {
          const blockchain = await loadBlockchainService();
          await blockchain.initialize();
          const api = await blockchain.getApi();

          // Verify the address still holds an on-chain admin role before
          // restoring the persisted session.
          const roleInfo = await resolveAdminRole(api, address);
          if (!roleInfo) {
            set({ admin: null });
            return;
          }

          // Query Identity pallet for the display name / district.
          const identityRaw = await api.query.identity?.identityOf?.(address);
          const identity = identityRaw?.toJSON() as any;

          const adminProfile: Admin = {
            id: address.slice(0, 8),
            address,
            name: identity?.display || identity?.name || 'Government Official',
            role: roleInfo.role,
            department: identity?.district || roleInfo.department,
            permissions: roleInfo.permissions,
            lastLogin: Date.now(),
          };

          set({ admin: adminProfile });
        } catch (error) {
          console.error('Failed to load admin profile:', error);
          // Fail closed: never grant admin access when verification fails.
          set({ admin: null });
        }
      },
    }),
    {
      name: 'blue-hole-admin-storage',
      partialize: (state) => ({
        // Only persist admin address for re-loading
        adminAddress: state.admin?.address,
      }),
    }
  )
);

/**
 * Hook for using admin with wallet integration
 * This wraps shared useWallet + admin state
 */
export function useAdminWithWallet() {
  const { selectedAccount, isConnected, connect, disconnect } = useWallet();
  const { admin, loadAdminProfile, logout } = useAdminStore();

  // Auto-load admin profile when wallet connects
  useEffect(() => {
    if (selectedAccount?.address && !admin) {
      loadAdminProfile(selectedAccount.address).catch(console.error);
    }
  }, [admin, loadAdminProfile, selectedAccount?.address]);

  return {
    admin,
    selectedAccount,
    isConnected,
    connect,
    disconnect,
    logout,
  };
}
