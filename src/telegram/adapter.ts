import {
  BaseMessageSignerWalletAdapter,
  isVersionedTransaction,
  SendTransactionOptions,
  WalletAccountError,
  WalletConnectionError,
  WalletDisconnectedError,
  WalletDisconnectionError,
  WalletError,
  WalletName,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSendTransactionError,
  WalletSignMessageError,
  WalletSignTransactionError,
} from '@solana/wallet-adapter-base';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
  TransactionVersion,
  VersionedTransaction,
} from '@solana/web3.js';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { ITelegramConfig } from './contexts/TelegramWalletContext';
import { TelegramWallet, TelegramWalletImpl } from './wallet';

export class TelegramWalletAdapter extends BaseMessageSignerWalletAdapter {
  name: WalletName<string>;
  url: string; // Your app's URL
  icon: string; // Your app's icon URL
  supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(['legacy', 0]);
  readyState: WalletReadyState = WalletReadyState.NotDetected;

  private _connecting: boolean;
  private _publicKey: PublicKey | null;
  private _wallet: TelegramWallet | null;
  private _config: ITelegramConfig;
  private _simulationCallback: (
    transaction: Transaction | VersionedTransaction,
  ) => Promise<{ result: boolean; onCompletion?: () => void; onError?: (error: string) => void }>;

  constructor(
    config: ITelegramConfig,
    simulationCallback: (
      transaction: Transaction | VersionedTransaction,
    ) => Promise<{ result: boolean; onCompletion?: () => void; onError?: (error: string) => void }>,
  ) {
    super();
    this._connecting = false;
    this._publicKey = null;
    this._wallet = null;
    this._config = config;
    this.url = config.botDirectLink;
    this.icon = config.botDisplayPic;
    this.name = config.botUsername as WalletName;
    this._simulationCallback = simulationCallback;
    if (this.readyState !== WalletReadyState.Unsupported) {
      try {
        retrieveLaunchParams();
        this.readyState = WalletReadyState.Installed;
      } catch (e) {
        this.readyState = WalletReadyState.NotDetected;
      }
      this.emit('readyStateChange', this.readyState);
    }
  }

  get publicKey() {
    return this._publicKey;
  }

  get connecting() {
    return this._connecting;
  }

  async autoConnect(): Promise<void> {
    // Skip autoconnect in the Loadable state
    // We can't redirect to a universal link without user input
    if (this.readyState === WalletReadyState.Installed) {
      await this.connect();
    }
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;

      if (this.readyState !== WalletReadyState.Installed) throw new WalletNotReadyError();

      this._connecting = true;

      const wallet = new TelegramWalletImpl(this._config, this._simulationCallback);

      if (!wallet.isConnected) {
        try {
          await wallet.connect();
        } catch (error: any) {
          throw new WalletConnectionError(error?.message, error);
        }
      }

      if (!wallet.publicKey) throw new WalletAccountError();

      let publicKey: PublicKey;
      try {
        publicKey = new PublicKey(wallet.publicKey.toBytes());
      } catch (error: any) {
        throw new WalletPublicKeyError(error?.message, error);
      }

      wallet.on('disconnect', this._disconnected);
      wallet.on('accountChanged', this._accountChanged);

      this._wallet = wallet;
      this._publicKey = new PublicKey(publicKey); // Set the public key

      this.emit('connect', this._publicKey); // Emit connect event with public key
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this._wallet;
    if (wallet) {
      wallet.off('disconnect', this._disconnected);
      wallet.off('accountChanged', this._accountChanged);

      this._wallet = null;
      this._publicKey = null;

      try {
        await wallet.disconnect();
      } catch (error: any) {
        this.emit('error', new WalletDisconnectionError(error?.message, error));
      }
    }

    this.emit('disconnect');
  }

  async sendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    connection: Connection,
    options: SendTransactionOptions = {},
  ): Promise<TransactionSignature> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        const { signers, ...sendOptions } = options;

        if (isVersionedTransaction(transaction)) {
          signers?.length && transaction.sign(signers);
        } else {
          transaction = (await this.prepareTransaction(transaction, connection, sendOptions)) as T;
          signers?.length && (transaction as Transaction).partialSign(...signers);
        }

        sendOptions.preflightCommitment = sendOptions.preflightCommitment || connection.commitment;

        const { signature } = await wallet.signAndSendTransaction(transaction, sendOptions);
        return signature;
      } catch (error: any) {
        if (error instanceof WalletError) throw error;
        throw new WalletSendTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return (await wallet.signTransaction(transaction)) || transaction;
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return (await wallet.signAllTransactions(transactions)) || transactions;
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        const { signature } = await wallet.signMessage(message);
        return signature;
      } catch (error: any) {
        throw new WalletSignMessageError(error?.message, error);
      }
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  private _disconnected = () => {
    const wallet = this._wallet;
    if (wallet) {
      wallet.off('disconnect', this._disconnected);
      wallet.off('accountChanged', this._accountChanged);

      this._wallet = null;
      this._publicKey = null;

      this.emit('error', new WalletDisconnectedError());
      this.emit('disconnect');
    }
  };

  private _accountChanged = (newPublicKey: PublicKey) => {
    const publicKey = this._publicKey;
    if (!publicKey) return;

    try {
      newPublicKey = new PublicKey(newPublicKey.toBytes());
    } catch (error: any) {
      this.emit('error', new WalletPublicKeyError(error?.message, error));
      return;
    }

    if (publicKey.equals(newPublicKey)) return;

    this._publicKey = newPublicKey;
    this.emit('connect', newPublicKey);
  };
}
