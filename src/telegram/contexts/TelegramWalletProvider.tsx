import { PropsWithChildren, useState } from 'react';

import { Transaction, VersionedTransaction } from '@solana/web3.js';

import { TelegramWalletContext } from './TelegramWalletContext';

const TelegramWalletContextProvider: React.FC<{} & PropsWithChildren> = ({ children }) => {
  const [txSig, setTxSig] = useState<string>();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [simulatedTransaction, setTransactionSimulation] = useState<
    | {
      transaction?: Transaction | VersionedTransaction;
        error?: string;
        message?:string;
        onApproval: () => void;
        onCancel: () => void;
      }
    | undefined
  >(undefined);

  return (
    <TelegramWalletContext.Provider
      value={{
        txSig,
        setTxSig,
        showWalletModal,
        setShowWalletModal,
        showOnboardingModal,
        setShowOnboardingModal,
        simulatedTransaction,
        setTransactionSimulation,
      }}
    >
      {children}
    </TelegramWalletContext.Provider>
  );
};

const TelegramWalletProvider = ({ children }: { children: React.ReactNode }) => {
  return <TelegramWalletContextProvider>{children}</TelegramWalletContextProvider>;
};

export { TelegramWalletProvider };
