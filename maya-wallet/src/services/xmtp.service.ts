// XMTP Client Service for BelizeChain
// Handles Web3 wallet-to-wallet messaging over XMTP network
//
// Uses @xmtp/browser-sdk (the maintained WASM-based XMTP web SDK) in place of
// the deprecated @xmtp/xmtp-js line, whose elliptic/ws dependency chain carried
// open security advisories.
//
// NOTE: initialization stays intentionally gated upstream in MessagingContext
// (no secure per-account key derivation from the Polkadot signer yet). Until
// that bridge ships, no production call reaches initialize().

// Dynamic imports to prevent SSR WASM issues
let ClientModule: typeof import('@xmtp/browser-sdk') | null = null;
let DecodedMessage: any;

// Lazy load XMTP browser SDK only on client side
if (typeof window !== 'undefined') {
  import('@xmtp/browser-sdk').then((mod) => {
    ClientModule = mod;
    DecodedMessage = null;
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
      if (!ClientModule) {
        await new Promise((resolve) => {
          const check = setInterval(() => {
            if (ClientModule) {
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

      if (!ClientModule) {
        throw new Error('XMTP browser SDK not loaded');
      }

      // Browser SDK derives identity from an EOA signer backed by a hex key.
      // Kept as a best-effort bridge; the wallet layer must provide a usable
      // signer path before this can fire in production.
      const signer = ClientModule.createEOASigner(privateKey as `0x${string}`);

      // Initialize XMTP client.
      // `env` is accepted at runtime but dropped from the public `create`
      // options type because ClientOptions is a union (NetworkOptions |
      // backend) — Omit over the union hides branch-only keys. Cast keeps the
      // runtime-valid `env` until the SDK widens the type.
      type NetworkedOptions = Omit<
        import('@xmtp/browser-sdk').ClientOptions,
        'codecs' | 'backend'
      > & { env?: import('@xmtp/browser-sdk').XmtpEnv };

      const createOptions = {
        env: config.env,
      } as NetworkedOptions;

      this.client = await ClientModule.Client.create(signer, createOptions);

      const state = await this.client.inboxState();
      console.log('[XMTP] Client initialized for inbox:', state.inboxId);
      return this.client;
    } catch (error) {
      console.error('[XMTP] Initialization failed:', error);
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
    // Check if conversation exists
    const existingConvs = await this.client.conversations.list();
    const existing = existingConvs.find(
      (c: any) => (c.peerInboxId ?? c.peerAddress) === peerAddress,
    );

    if (existing) {
      this.conversations.set(peerAddress, existing);
      return existing;
    }

    // Create new direct message
    const newConversation = await this.client.conversations.newDm(peerAddress);
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

  // Check if an identifier (inboxId or address) can receive XMTP messages
  async canMessage(identifier: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.canMessage([identifier]);
    return Boolean(result);
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
