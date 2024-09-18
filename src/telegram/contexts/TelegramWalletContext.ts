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

  simulatedTransaction:
    | {
        transaction: Transaction | VersionedTransaction;
        error?: string;
        onApproval: () => void;
        onCancel: () => void;
      }
    | undefined;
  setTransactionSimulation: Dispatch<
    SetStateAction<
      | {
          transaction: Transaction | VersionedTransaction;
          error?: string;
          onApproval: () => void;
          onCancel: () => void;
        }
      | undefined
    >
  >;
  showWalletModal: boolean;
  setShowWalletModal: (showWalletModal: boolean) => void;

  showOnboardingModal: boolean;
  setShowOnboardingModal: (showOnboardingtModal: boolean) => void;
}

export const TelegramWalletContext = createContext<ITelegramWalletContext>({
  telegramConfig: undefined,
  txSig: undefined,
  setTxSig: () => {},
  simulatedTransaction: undefined,
  setTransactionSimulation: () => {},
  showWalletModal: false,
  setShowWalletModal: (showWalletModal: boolean) => {},
  showOnboardingModal: false,
  setShowOnboardingModal: (showWalletModal: boolean) => {},
});

// Interal context for use within the library
export const useTelegramWalletContext = (): ITelegramWalletContext => {
  return useContext(TelegramWalletContext);
};
