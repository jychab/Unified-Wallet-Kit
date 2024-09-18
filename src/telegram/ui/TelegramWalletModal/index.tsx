import { useCallback, useRef, useState } from 'react';
import tw from 'twin.macro';
import { IStandardStyle, useUnifiedWalletContext } from '../../../contexts/UnifiedWalletContext';
import { useOutsideClick } from '../../../misc/utils';
import { useTelegramWalletContext } from '../../contexts/TelegramWalletContext';
import { Header } from './components/Header';
import { DepositPage } from './DepositPage';
import { MainPage } from './MainPage';
import { TokenListPage } from './TokenListPage';
import { TransactionConfirmationPage } from './TransactionConfirmationPage';
import { TransactionSimulationPage } from './TransactionSimulationPage';
import { WithdrawalPage } from './WithdrawalPage';

const styles: IStandardStyle = {
  container: {
    light: [tw`text-black !bg-white shadow-xl`],
    dark: [tw`text-white !bg-[#3A3B43] border border-white/10`],
    jupiter: [tw`text-white bg-[rgb(49, 62, 76)]`],
  },
};

interface ITelegramWalletModal {
  onClose: () => void;
}

export type ITelegramWalletFlow = 'Main' | 'Deposit' | 'TokenList' | 'Withdrawal';

export const TelegramWalletModal: React.FC<ITelegramWalletModal> = ({ onClose }) => {
  const { theme } = useUnifiedWalletContext();
  const { simulatedTransaction, txSig } = useTelegramWalletContext();
  const [flow, setFlow] = useState<ITelegramWalletFlow>('Main');
  const [animateIn, setAnimateIn] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>();
  const contentRef = useRef<HTMLDivElement>(null);
  useOutsideClick(contentRef, () => {
    if (simulatedTransaction?.onCancel) {
      simulatedTransaction.onCancel();
    }
    onClose();
  });

  const setFlowAnimated = useCallback((flow: ITelegramWalletFlow) => {
    setFlow(flow);
    contentRef.current?.scrollTo(0, 0); // Scroll to top when flow changes
    setAnimateIn(true);
  }, []);

  const handleAnimationEnd = () => {
    setAnimateIn(false); // Stop animation when it completes
  };

  const flowComponents = {
    Main: <MainPage setFlow={setFlowAnimated} setSelectedToken={setSelectedToken} />,
    Deposit: <DepositPage setFlow={setFlowAnimated} />,
    Withdrawal: selectedToken && <WithdrawalPage setFlow={setFlowAnimated} token={selectedToken} />,
    TokenList: <TokenListPage setFlow={setFlowAnimated} setSelectedToken={setSelectedToken} />,
  };

  return (
    <div
      id="telegram_wallet_modal"
      ref={contentRef}
      css={[
        tw`p-4 w-full flex flex-col rounded-xl max-h-[90vh] lg:max-h-[576px] max-w-md items-center justify-center`,
        styles.container[theme],
      ]}
      onAnimationEnd={handleAnimationEnd}
      className="hideScrollbar"
    >
      {txSig ? (
        <TransactionConfirmationPage setFlow={setFlowAnimated} />
      ) : simulatedTransaction ? (
        <TransactionSimulationPage />
      ) : (
        <div tw="w-full">
          <Header onClose={onClose} />
          <div tw="border-t-[1px] border-white/10" />
          <div css={[tw`w-full overflow-y-scroll`, animateIn && tw`animate-fade-right duration-500`]}>
            {flowComponents[flow]}
          </div>
        </div>
      )}
    </div>
  );
};
