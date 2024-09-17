import type { Transaction, VersionedTransaction } from '@solana/web3.js';
import { createContext, Dispatch, SetStateAction, useContext } from 'react';
import { ITelegramConfig } from 'src/contexts/WalletConnectionProvider';

export interface ITelegramWalletContext {
  telegramConfig: ITelegramConfig | undefined;
  showWalletModal: boolean;
  simulatedTransaction:
    | { transaction: Transaction | VersionedTransaction; onApproval: () => void; onCancel: () => void }
    | undefined;
  setTransactionSimulation: Dispatch<
    SetStateAction<
      { transaction: Transaction | VersionedTransaction; onApproval: () => void; onCancel: () => void } | undefined
    >
  >;
  setShowWalletModal: (showWalletModal: boolean) => void;
}

export const TelegramWalletContext = createContext<ITelegramWalletContext>({
  telegramConfig: undefined,
  showWalletModal: false,
  simulatedTransaction: undefined,
  setTransactionSimulation: () => {},
  setShowWalletModal: (showWalletModal: boolean) => {},
});

// Interal context for use within the library
export const useTelegramWalletContext = (): ITelegramWalletContext => {
  return useContext(TelegramWalletContext);
};
