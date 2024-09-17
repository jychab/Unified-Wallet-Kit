import type { Transaction, VersionedTransaction } from '@solana/web3.js';
import { createContext, Dispatch, SetStateAction, useContext } from 'react';

export interface ITelegramConfig {
  rpcEndpoint: string;
  backendEndpoint: string;
  botUsername: string;
  botDirectLink: string;
  botDisplayPic: string;
}

export interface ITelegramWalletContext {
  telegramConfig: ITelegramConfig | undefined;
  txSig: string | undefined;
  setTxSig: (tx: string | undefined) => void;
  showWalletModal: boolean;
  simulatedTransaction:
    | {
        transaction: Transaction | VersionedTransaction;
        onApproval: () => void;
        onCancel: () => void;
      }
    | undefined;
  setTransactionSimulation: Dispatch<
    SetStateAction<
      | {
          transaction: Transaction | VersionedTransaction;
          onApproval: () => void;
          onCancel: () => void;
        }
      | undefined
    >
  >;
  setShowWalletModal: (showWalletModal: boolean) => void;
}

export const TelegramWalletContext = createContext<ITelegramWalletContext>({
  telegramConfig: undefined,
  txSig: undefined,
  setTxSig: () => {},
  showWalletModal: false,
  simulatedTransaction: undefined,
  setTransactionSimulation: () => {},
  setShowWalletModal: (showWalletModal: boolean) => {},
});

// Interal context for use within the library
export const useTelegramWalletContext = (): ITelegramWalletContext => {
  return useContext(TelegramWalletContext);
};
