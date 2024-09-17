import { PropsWithChildren, useState } from 'react';

import { WalletContextState } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

import { ITelegramConfig, TelegramWalletContext } from './TelegramWalletContext';

export type IWalletProps = Omit<
  WalletContextState,
  'autoConnect' | 'disconnecting' | 'sendTransaction' | 'signTransaction' | 'signAllTransactions' | 'signMessage'
>;

const TelegramWalletContextProvider: React.FC<
  {
    config?: ITelegramConfig;
  } & PropsWithChildren
> = ({ config, children }) => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [simulatedTransaction, setTransactionSimulation] = useState<
    { transaction: Transaction | VersionedTransaction; onApproval: () => void; onCancel: () => void } | undefined
  >(undefined);

  return (
    <TelegramWalletContext.Provider
      value={{
        telegramConfig: config,
        showWalletModal,
        setShowWalletModal,
        simulatedTransaction,
        setTransactionSimulation,
      }}
    >
      {children}
    </TelegramWalletContext.Provider>
  );
};

const TelegramWalletProvider = ({
  config,
  children,
}: {
  config: ITelegramConfig | undefined;
  children: React.ReactNode;
}) => {
  return <TelegramWalletContextProvider config={config}>{children}</TelegramWalletContextProvider>;
};

export { TelegramWalletProvider };
