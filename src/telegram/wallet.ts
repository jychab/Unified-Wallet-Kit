import { EventEmitter } from '@solana/wallet-adapter-base';
import { PublicKey, SendOptions, Transaction, TransactionSignature, VersionedTransaction } from '@solana/web3.js';
import { signMessageOnBackend, signTransactionOnBackend, verifyAndGetPublicKey } from './backend';
import { ITelegramConfig } from './contexts/TelegramWalletContext';
import { getInitData, sendTransactionToBlockchain } from './helpers';

interface TelegramWalletEvents {
  connect(...args: unknown[]): unknown;
  disconnect(...args: unknown[]): unknown;
  accountChanged(newPublicKey: PublicKey): unknown;
}

export interface TelegramWallet extends EventEmitter<TelegramWalletEvents> {
  isTelegram?: boolean;
  publicKey?: { toBytes(): Uint8Array };
  isConnected: boolean;
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions,
  ): Promise<{ signature: TransactionSignature }>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class TelegramWalletImpl extends EventEmitter<TelegramWalletEvents> implements TelegramWallet {
  publicKey?: PublicKey;
  isTelegram = true;
  isConnected = false;
  config: ITelegramConfig;
  simulationCallback: (
    transaction?: Transaction | VersionedTransaction,
    message?: string,
  ) => Promise<{ result: boolean; onCompletion?: () => void; onError?: (error: string) => void }>;
  constructor(
    config: ITelegramConfig,
    simulationCallback: (
      transaction?: Transaction | VersionedTransaction,
      message?: string,
    ) => Promise<{ result: boolean; onCompletion?: () => void; onError?: (error: string) => void }>,
  ) {
    super();
    this.config = config;
    this.isConnected = false;
    this.simulationCallback = simulationCallback;
  }

  async connect(): Promise<void> {
    // Your logic for connecting the wallet, e.g., retrieving the user's public key from Telegram
    try {
      const initDataRaw = getInitData();
      const publicKey = await verifyAndGetPublicKey(this.config.backendEndpoint, initDataRaw);
      if (publicKey) {
        this.publicKey = new PublicKey(publicKey);
        this.isConnected = true;
        this.emit('connect');
      } else {
        throw Error('Unable to retrieve PublicKey');
      }
    } catch (e) {
      throw Error(JSON.stringify(e));
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.publicKey = undefined;
    this.emit('disconnect');
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    let result;
    try {
      const initDataRaw = getInitData();
      result = await this.simulationCallback(transaction);
      if (!result.result) throw new Error('User Rejected the Signing Request');
      // Sign the transaction using Telegram's authentication or your own signing mechanism
      const [signedTransaction] = await signTransactionOnBackend(
        this.config.backendEndpoint,
        [transaction],
        initDataRaw,
      );
      if (result.onCompletion) {
        result.onCompletion();
      }
      return signedTransaction;
    } catch (e) {
      if (result.onError) {
        result.onError(JSON.stringify(e));
      }
      throw Error(JSON.stringify(e));
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    let result;
    try {
      const initDataRaw = getInitData();
      result = await Promise.all(transactions.map((transaction) => this.simulationCallback(transaction)));
      if (result.some((x) => !x.result)) throw new Error('User Rejected the Signing Request');
      // Sign all transactions
      const signedTransactions = signTransactionOnBackend(this.config.backendEndpoint, transactions, initDataRaw);
      if (result[0].onCompletion) {
        result[0].onCompletion();
      }
      return signedTransactions;
    } catch (e) {
      if (result.onError) {
        result.onError(JSON.stringify(e));
      }
      throw Error(JSON.stringify(e));
    }
  }

  async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions,
  ): Promise<{ signature: TransactionSignature }> {
    let result;
    try {
      const initDataRaw = getInitData();
      result = await this.simulationCallback(transaction);
      if (!result.result) throw new Error('User Rejected the Signing Request');
      const [signedTransaction] = await signTransactionOnBackend(
        this.config.backendEndpoint,
        [transaction],
        initDataRaw,
      );
      if (result.onCompletion) {
        result.onCompletion();
      }
      const signature = await sendTransactionToBlockchain(this.config.rpcEndpoint, signedTransaction, options);
      return { signature };
    } catch (e) {
      if (result.onError) {
        result.onError(JSON.stringify(e));
      }
      throw Error(JSON.stringify(e));
    }
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    let result;
    try {
      // Sign the message using the user's Telegram wallet
      const initDataRaw = getInitData();
      const text = new TextDecoder().decode(message);
      result = await this.simulationCallback(undefined, text);
      if (!result.result) throw new Error('User Rejected the Signing Request');
      const signature = await signMessageOnBackend(this.config.backendEndpoint, text, initDataRaw);
      if (result.onCompletion) {
        result.onCompletion();
      }
      return { signature };
    } catch (e) {
      if (result.onError) {
        result.onError(JSON.stringify(e));
      }
      throw Error(JSON.stringify(e));
    }
  }
}
