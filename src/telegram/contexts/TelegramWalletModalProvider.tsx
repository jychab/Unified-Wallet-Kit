import { createContext, ReactNode, useEffect, useState } from 'react';
import ModalDialog from 'src/components/ModalDialog';
import { IUnifiedWalletConfig } from 'src/contexts/WalletConnectionProvider';
import { TelegramOnboardingFlow } from '../ui/TelegramOnboarding';
import { TelegramWalletModal } from '../ui/TelegramWalletModal';
import { useTelegramWalletContext } from './TelegramWalletContext';

const TelegramWalletModalContext = createContext(null);

export const TelegramWalletModalProvider: React.FC<{
  config: IUnifiedWalletConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  const { setShowWalletModal, showWalletModal, showOnboardingModal, setShowOnboardingModal, setTransactionSimulation } =
    useTelegramWalletContext();

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
    <TelegramWalletModalContext.Provider value={null}>
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
    </TelegramWalletModalContext.Provider>
  );
};
