import { EventEmitter } from '@solana/wallet-adapter-base';
import { PublicKey, SendOptions, Transaction, TransactionSignature, VersionedTransaction } from '@solana/web3.js';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { TelegramConfig } from 'src/contexts/WalletConnectionProvider';
import { signMessageOnBackend, signTransactionOnBackend, verifyAndGetPublicKey } from './backend';
import { sendTransactionToBlockchain } from './helpers';

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
  config: TelegramConfig;
  constructor(config: TelegramConfig) {
    super();
    this.config = config;
    this.isConnected = false;
  }

  async connect(): Promise<void> {
    // Your logic for connecting the wallet, e.g., retrieving the user's public key from Telegram
    try {
      const { initDataRaw } = retrieveLaunchParams();
      if (!initDataRaw) {
        throw Error('Telegram User not found.');
      }
      const publicKey = await verifyAndGetPublicKey(this.config.backendEndpoint, initDataRaw);
      if (publicKey) {
        this.publicKey = new PublicKey(publicKey);
        this.isConnected = true;
        this.emit('connect');
      }
    } catch (e) {
      throw Error('Telegram User not found.');
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.publicKey = undefined;
    this.emit('disconnect');
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    try {
      const { initDataRaw } = retrieveLaunchParams();
      if (!initDataRaw) throw Error('Telegram User not found.');
      // Sign the transaction using Telegram's authentication or your own signing mechanism
      const [signedTransaction] = await signTransactionOnBackend(
        this.config.backendEndpoint,
        [transaction],
        initDataRaw,
      );
      return signedTransaction;
    } catch (e) {
      throw Error('Telegram User not found.');
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    try {
      const { initDataRaw } = retrieveLaunchParams();
      if (!initDataRaw) throw Error('Telegram User not found.');
      // Sign all transactions
      const signedTransactions = signTransactionOnBackend(this.config.backendEndpoint, transactions, initDataRaw);
      return signedTransactions;
    } catch (e) {
      throw Error('Telegram User not found.');
    }
  }

  async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions,
  ): Promise<{ signature: TransactionSignature }> {
    try {
      const { initDataRaw } = retrieveLaunchParams();
      if (!initDataRaw) throw Error('Telegram User not found.');
      const [signedTransaction] = await signTransactionOnBackend(
        this.config.backendEndpoint,
        [transaction],
        initDataRaw,
      );
      const signature = await sendTransactionToBlockchain(this.config.rpcEndpoint, signedTransaction, options);
      return { signature };
    } catch (e) {
      throw Error('Telegram User not found.');
    }
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    try {
      // Sign the message using the user's Telegram wallet
      const { initDataRaw } = retrieveLaunchParams();
      if (!initDataRaw) {
        throw Error('Telegram User not found.');
      }
      const signature = await signMessageOnBackend(this.config.backendEndpoint, message, initDataRaw);
      return { signature };
    } catch (e) {
      throw Error('Telegram User not found.');
    }
  }
}
