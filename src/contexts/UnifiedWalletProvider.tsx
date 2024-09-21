import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { useWallet, Wallet, WalletContextState } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { Adapter, WalletReadyState } from '@solana/wallet-adapter-base';
import { usePrevious } from 'react-use';
import WalletConnectionProvider, { IUnifiedWalletConfig } from './WalletConnectionProvider';

import ModalDialog from '../components/ModalDialog';
import UnifiedWalletModal from '../components/UnifiedWalletModal';
import { shortenAddress } from '../misc/utils';
import { useTelegramWalletContext } from '../telegram/contexts/TelegramWalletContext';
import { TelegramWalletProvider } from '../telegram/contexts/TelegramWalletProvider';
import { TelegramOnboardingFlow } from '../telegram/ui/TelegramOnboarding';
import { TelegramWalletModal } from '../telegram/ui/TelegramWalletModal';
import { TranslationProvider } from './TranslationProvider';
import {
  UnifiedWalletContext,
  UnifiedWalletValueContext,
  useUnifiedWallet,
  useUnifiedWalletContext,
} from './UnifiedWalletContext';

export type IWalletProps = Omit<
  WalletContextState,
  'autoConnect' | 'disconnecting' | 'sendTransaction' | 'signTransaction' | 'signAllTransactions' | 'signMessage'
>;

const UnifiedWalletValueProvider = ({ children }: { children: React.ReactNode }) => {
  const defaultWalletContext = useWallet();

  const value = useMemo(() => {
    return {
      ...defaultWalletContext,
      connect: async () => {
        try {
          return await defaultWalletContext.connect();
        } catch (error) {
          // when wallet is not installed
        }
      },
    };
  }, [defaultWalletContext]);

  return <UnifiedWalletValueContext.Provider value={value}>{children}</UnifiedWalletValueContext.Provider>;
};

const UnifiedWalletContextProvider: React.FC<
  {
    config: IUnifiedWalletConfig;
  } & PropsWithChildren
> = ({ config, children }) => {
  const { setShowWalletModal, showWalletModal, showOnboardingModal, setShowOnboardingModal, setTransactionSimulation } =
    useTelegramWalletContext();
  const { publicKey, wallet, select, connect } = useUnifiedWallet();
  const previousPublicKey = usePrevious<PublicKey | null>(publicKey);
  const previousWallet = usePrevious<Wallet | null>(wallet);

  // Weird quirks for autoConnect to require select and connect
  const [nonAutoConnectAttempt, setNonAutoConnectAttempt] = useState(false);

  useEffect(() => {
    if (nonAutoConnectAttempt && !config.autoConnect && wallet?.adapter.name) {
      try {
        connect();
      } catch (error) {
        // when wallet is not installed
      }
      setNonAutoConnectAttempt(false);
    }
  }, [nonAutoConnectAttempt, wallet?.adapter.name]);

  const [showModal, setShowModal] = useState(false);

  const handleConnectClick = useCallback(
    async (event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>, adapter: Adapter) => {
      event.preventDefault();

      try {
        setShowModal(false);

        // Connecting
        config.notificationCallback?.onConnecting({
          publicKey: '',
          shortAddress: '',
          walletName: adapter.name,
          metadata: {
            name: adapter.name,
            url: adapter.url,
            icon: adapter.icon,
            supportedTransactionVersions: adapter.supportedTransactionVersions,
          },
        });

        // Might throw WalletReadyState.WalletNotReady
        select(adapter.name);

        // Weird quirks for autoConnect to require select and connect
        if (!config.autoConnect) {
          setNonAutoConnectAttempt(true);
        }

        if (adapter.readyState === WalletReadyState.NotDetected) {
          throw WalletReadyState.NotDetected;
        }
      } catch (error) {
        console.log(error);

        // Not Installed
        config.notificationCallback?.onNotInstalled({
          publicKey: '',
          shortAddress: '',
          walletName: adapter.name,
          metadata: {
            name: adapter.name,
            url: adapter.url,
            icon: adapter.icon,
            supportedTransactionVersions: adapter.supportedTransactionVersions,
          },
        });
      }
    },
    [select, connect, wallet?.adapter.name],
  );

  useEffect(() => {
    // Disconnected
    if (previousWallet && !wallet) {
      config.notificationCallback?.onDisconnect({
        publicKey: previousPublicKey?.toString() || '',
        shortAddress: shortenAddress(previousPublicKey?.toString() || ''),
        walletName: previousWallet?.adapter.name || '',
        metadata: {
          name: previousWallet?.adapter.name,
          url: previousWallet?.adapter.url,
          icon: previousWallet?.adapter.icon,
          supportedTransactionVersions: previousWallet?.adapter.supportedTransactionVersions,
        },
      });
      return;
    }

    // Connected
    if (publicKey && wallet) {
      config.notificationCallback?.onConnect({
        publicKey: publicKey.toString(),
        shortAddress: shortenAddress(publicKey.toString()),
        walletName: wallet.adapter.name,
        metadata: {
          name: wallet.adapter.name,
          url: wallet.adapter.url,
          icon: wallet.adapter.icon,
          supportedTransactionVersions: wallet.adapter.supportedTransactionVersions,
        },
      });
      return;
    }
  }, [wallet, publicKey, previousWallet]);

  // we use another variable here because we want the exit animation to trigger first before closingt he modal
  const [showWallet, setShowWallet] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  useEffect(() => {
    if (showWalletModal) {
      setShowWallet(true);
    } else {
      onCloseAnimated();
    }
  }, [showWalletModal]);

  const onCloseAnimated = () => {
    setShowWallet(false);
    setAnimateOut(true);
  };

  useEffect(() => {
    if (!showWallet) {
      const resetAnimation = setTimeout(() => {
        setTransactionSimulation(undefined);
        setAnimateOut(false);
      }, 500);

      return () => clearTimeout(resetAnimation);
    }
  }, [showWallet]);

  return (
    <UnifiedWalletContext.Provider
      value={{
        telegramConfig: config.telegramConfig,
        walletPrecedence: config.walletPrecedence || [],
        handleConnectClick,
        showModal,
        setShowModal,
        walletlistExplanation: config.walletlistExplanation,
        theme: config.theme || 'light',
        walletAttachments: config.walletAttachments || {},
        walletModalAttachments: config.walletModalAttachments || {},
      }}
    >
      <ModalDialog open={showModal} onClose={() => setShowModal(false)}>
        <UnifiedWalletModal onClose={() => setShowModal(false)} />
      </ModalDialog>
      {config.telegramConfig && (
        <ModalDialog open={showWallet} onClose={() => setShowWalletModal(false)}>
          {showWallet && <TelegramWalletModal onClose={() => setShowWalletModal(false)} animateOut={animateOut} />}
        </ModalDialog>
      )}
      {config.telegramConfig && (
        <ModalDialog open={showOnboardingModal && !showWallet} onClose={() => setShowOnboardingModal(false)}>
          <TelegramOnboardingFlow onClose={() => setShowOnboardingModal(false)} />
        </ModalDialog>
      )}
      {children}
    </UnifiedWalletContext.Provider>
  );
};

const UnifiedWalletProvider = ({
  wallets,
  config,
  children,
}: {
  wallets: Adapter[];
  config: IUnifiedWalletConfig;
  children: React.ReactNode;
}) => {
  return (
    <TranslationProvider lang={config.lang}>
      <TelegramWalletProvider>
        <WalletConnectionProvider config={config} wallets={wallets}>
          <UnifiedWalletValueProvider>
            <UnifiedWalletContextProvider config={config}>{children}</UnifiedWalletContextProvider>
          </UnifiedWalletValueProvider>
        </WalletConnectionProvider>
      </TelegramWalletProvider>
    </TranslationProvider>
  );
};

export { UnifiedWalletProvider, useUnifiedWallet, useUnifiedWalletContext };
