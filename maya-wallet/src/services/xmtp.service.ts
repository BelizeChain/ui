// XMTP Client Service for BelizeChain
// Handles Web3 wallet-to-wallet messaging over XMTP network

// Dynamic imports to prevent SSR WASM issues
let Client: any;
let Wallet: any;
let DecodedMessage: any;

// Lazy load XMTP and Ethers only on client side
if (typeof window !== 'undefined') {
  import('@xmtp/xmtp-js').then((mod) => {
    Client = mod.Client;
    DecodedMessage = mod.DecodedMessage;
  });
  import('ethers').then((mod) => {
    Wallet = mod.Wallet;
  });
}

export interface XMTPConfig {
  env: 'production' | 'dev';
  persistConversations: boolean;
}

export interface MessageMetadata {
  via: 'xmtp' | 'mesh';
  meshHops?: number;
  proofHash?: string;
  district?: string;
}

class XMTPService {
  private client: any = null;
  private conversations: Map<string, any> = new Map();
  private messageListeners: Map<string, (message: any) => void> = new Map();

  async initialize(privateKey: string, config: XMTPConfig = { env: 'production', persistConversations: true }) {
    try {
      // Wait for dynamic imports to complete
      if (!Client || !Wallet) {
        await new Promise((resolve) => {
          const check = setInterval(() => {
            if (Client && Wallet) {
              clearInterval(check);
              resolve(true);
            }
          }, 100);
          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(check);
            resolve(false);
          }, 5000);
        });
      }

      if (!Client || !Wallet) {
        throw new Error('XMTP or Ethers libraries not loaded');
      }

      // Create ethers wallet from private key (BelizeChain uses Polkadot, but XMTP needs Ethereum-compatible signatures)
      // In production, we'll convert Polkadot keypair to Ethereum-compatible format
      const wallet = new Wallet(privateKey);
      
      // Initialize XMTP client
      this.client = await Client.create(wallet, {
        env: config.env,
        persistConversations: config.persistConversations
      });

      console.log('✅ XMTP Client initialized for address:', wallet.address);
      return this.client;
    } catch (error) {
      console.error('❌ XMTP initialization failed:', error);
      throw error;
    }
  }

  async getConversations(): Promise<any[]> {
    if (!this.client) throw new Error('XMTP client not initialized');
    
    const conversations = await this.client.conversations.list();
    
    // Cache conversations
    conversations.forEach((conv: any) => {
      this.conversations.set(conv.peerAddress, conv);
    });

    return conversations;
  }

  async getOrCreateConversation(peerAddress: string): Promise<any> {
    if (!this.client) throw new Error('XMTP client not initialized');

    // Check cache first
    if (this.conversations.has(peerAddress)) {
      return this.conversations.get(peerAddress)!;
    }

    // Check if conversation exists
    const existingConvs = await this.client.conversations.list();
    const existing = existingConvs.find((c: any) => c.peerAddress === peerAddress);
    
    if (existing) {
      this.conversations.set(peerAddress, existing);
      return existing;
    }

    // Create new conversation
    const newConversation = await this.client.conversations.newConversation(peerAddress);
    this.conversations.set(peerAddress, newConversation);
    return newConversation;
  }

  async sendMessage(
    peerAddress: string, 
    content: string, 
    metadata?: MessageMetadata
  ): Promise<any> {
    if (!this.client) throw new Error('XMTP client not initialized');

    const conversation = await this.getOrCreateConversation(peerAddress);
    
    // Attach metadata
    const messageContent = metadata 
      ? { text: content, metadata }
      : content;

    const sentMessage = await conversation.send(messageContent);
    return sentMessage;
  }

  async getMessages(peerAddress: string, limit?: number): Promise<any[]> {
    if (!this.client) throw new Error('XMTP client not initialized');

    const conversation = await this.getOrCreateConversation(peerAddress);
    const messages = await conversation.messages({ limit });
    return messages;
  }

  async streamMessages(
    peerAddress: string,
    onMessage: (message: any) => void
  ): Promise<() => void> {
    if (!this.client) throw new Error('XMTP client not initialized');

    const conversation = await this.getOrCreateConversation(peerAddress);
    
    // Store listener for cleanup
    this.messageListeners.set(peerAddress, onMessage);

    // Start streaming
    const stream = await conversation.streamMessages();
    
    (async () => {
      for await (const message of stream) {
        onMessage(message);
      }
    })();

    // Return cleanup function
    return () => {
      this.messageListeners.delete(peerAddress);
    };
  }

  async streamAllMessages(onMessage: (message: any) => void): Promise<() => void> {
    if (!this.client) throw new Error('XMTP client not initialized');

    const stream = await this.client.conversations.streamAllMessages();
    
    (async () => {
      for await (const message of stream) {
        onMessage(message);
      }
    })();

    return () => {
      // Stream cleanup
    };
  }

  // Check if address can receive XMTP messages
  async canMessage(peerAddress: string): Promise<boolean> {
    if (!this.client) return false;
    return await this.client.canMessage(peerAddress);
  }

  // Disconnect and cleanup
  disconnect() {
    this.client = null;
    this.conversations.clear();
    this.messageListeners.clear();
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  getAddress(): string | null {
    return this.client?.address || null;
  }
}

// Singleton instance
export const xmtpService = new XMTPService();
