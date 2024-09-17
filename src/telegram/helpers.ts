import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SendOptions,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { Dispatch, SetStateAction } from 'react';
import { TelegramConfig } from 'src/contexts/WalletConnectionProvider';
import { TelegramWalletAdapter } from './adapter';
import { PersistentCache } from './cache';
import { TelegramWallet, TelegramWalletImpl } from './wallet';

export const cache = new PersistentCache(60 * 60 * 1000); // 1hr TTL

// Factory function to create a wallet object
export function getOrCreateTelegramWallet(
  config: TelegramConfig,
  simulationCallback: (transaction: Transaction | VersionedTransaction) => Promise<boolean>,
): TelegramWallet {
  const key = config.botUsername + '/wallet';
  const cachedWallet = cache.get(key) ? JSON.parse(cache.get(key)!) : null;
  if (cachedWallet) {
    // Use saved public key to initialize wallet (this will depend on your wallet implementation)
    return cachedWallet; // Modify as needed
  }
  return new TelegramWalletImpl(config, simulationCallback);
}

export function getOrCreateTelegramAdapter(
  config: TelegramConfig,
  setTransactionSimulation: Dispatch<
    SetStateAction<
      { transaction: Transaction | VersionedTransaction; onApproval: () => void; onCancel: () => void } | undefined
    >
  >,
  setShowWalletModal: (showWalletModal: boolean) => void,
) {
  const key = config.botUsername + '/adapter';
  const cachedAdapter = cache.get(key) ? JSON.parse(cache.get(key)!) : null;
  if (cachedAdapter) {
    // Use saved public key to initialize wallet (this will depend on your wallet implementation)
    return cachedAdapter; // Modify as needed
  }
  return new TelegramWalletAdapter(config, (x: Transaction | VersionedTransaction) => {
    return new Promise((resolve) => {
      const approveTransaction = () => {
        resolve(true); // User approved
        setShowWalletModal(false); // Close modal
      };
      const cancelTransaction = () => {
        resolve(false); // User canceled
        setShowWalletModal(false); // Close modal
      };
      setShowWalletModal(true);
      setTransactionSimulation({ transaction: x, onApproval: approveTransaction, onCancel: cancelTransaction });
    });
  });
}
// Utility function to save wallet state to local storage

export function saveWalletState(config: TelegramConfig, wallet: TelegramWallet | null) {
  const key = config.botUsername + '/wallet';
  return wallet ? cache.set(key, JSON.stringify(wallet)) : cache.clear(key);
}

export async function sendTransactionToBlockchain<T extends Transaction | VersionedTransaction>(
  rpcEndpoint: string,
  transaction: T,
  options?: SendOptions,
): Promise<TransactionSignature> {
  // Implement logic to send the transaction to the blockchain and get the signature
  const connection = new Connection(rpcEndpoint);
  const txSig = await connection.sendTransaction(transaction as VersionedTransaction, options);
  return txSig;
}

export async function getAssetsByOwner(rpcEndpoint: string, publicKey: string): Promise<any> {
  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: publicKey,
        page: 1, // Starts at 1
        limit: 1000,
        displayOptions: {
          showFungible: true, //return both fungible and non-fungible tokens
          showNativeBalance: true,
        },
      },
    }),
  });
  const { result } = await response.json();
  return result;
}

export async function confirmTransaction(txSig: string, connection: Connection) {
  const getBlockHash = await connection.getLatestBlockhash();
  const result = await connection.confirmTransaction({
    signature: txSig,
    blockhash: getBlockHash.blockhash,
    lastValidBlockHeight: getBlockHash.lastValidBlockHeight,
  });
  if (result.value.err) {
    throw new Error(JSON.stringify(result.value));
  }
}

export async function buildAndSendTransaction(
  ixs: TransactionInstruction[],
  payer: PublicKey,
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>,
  connection: Connection,
  addressLookupTableAccounts?: AddressLookupTableAccount[],
) {
  let lookupTables = addressLookupTableAccounts || [];
  const recentBlockhash = await connection.getLatestBlockhash();
  if (ixs.length > 0) {
    const [microLamports, units] = await Promise.all([
      getPriorityFeeEstimate(ixs, payer, connection, lookupTables),
      getSimulationUnits(connection, ixs, payer, lookupTables),
    ]);
    ixs.unshift(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: microLamports,
      }),
    );
    if (units) {
      ixs.unshift(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: Math.ceil(units),
        }),
      );
    }
  }
  let tx = new VersionedTransaction(
    new TransactionMessage({
      instructions: ixs,
      recentBlockhash: recentBlockhash.blockhash,
      payerKey: payer,
    }).compileToV0Message(lookupTables),
  );
  tx = await signTransaction(tx);

  try {
    const timeout = 60000;
    const startTime = Date.now();
    let txSig;

    while (Date.now() - startTime < timeout) {
      try {
        txSig = await connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: true,
        });

        return await pollTransactionConfirmation(connection, txSig);
      } catch (error) {
        continue;
      }
    }
    return txSig;
  } catch (e) {
    throw e;
  }
}

async function pollTransactionConfirmation(
  connection: Connection,
  txSig: TransactionSignature,
): Promise<TransactionSignature> {
  // 15 second timeout
  const timeout = 15000;
  // 5 second retry interval
  const interval = 5000;
  let elapsed = 0;

  return new Promise<TransactionSignature>((resolve, reject) => {
    const intervalId = setInterval(async () => {
      elapsed += interval;

      if (elapsed >= timeout) {
        clearInterval(intervalId);
        reject(new Error(`Transaction ${txSig}'s confirmation timed out`));
      }

      const status = await connection.getSignatureStatus(txSig);

      if (status?.value?.confirmationStatus === 'confirmed') {
        clearInterval(intervalId);
        resolve(txSig);
      }
    }, interval);
  });
}

async function getPriorityFeeEstimate(
  testInstructions: TransactionInstruction[],
  payer: PublicKey,
  connection: Connection,
  lookupTables: AddressLookupTableAccount[],
) {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables),
  );
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'getPriorityFeeEstimate',
      params: [
        {
          transaction: Buffer.from(testVersionedTxn.serialize()).toString('base64'),
          options: { recommended: true, transactionEncoding: 'base64' },
        },
      ],
    }),
  });
  const data = await response.json();
  return data.result.priorityFeeEstimate;
}

export async function getSimulationUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[],
): Promise<number | undefined> {
  const testInstructions = [ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }), ...instructions];

  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables),
  );

  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });
  if (simulation.value.err) {
    return undefined;
  }
  return simulation.value.unitsConsumed;
}
