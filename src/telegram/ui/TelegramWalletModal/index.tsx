import { useRef, useState } from 'react';
import { IStandardStyle, useUnifiedWallet, useUnifiedWalletContext } from 'src/contexts/UnifiedWalletContext';
import { useOutsideClick } from 'src/misc/utils';
import tw from 'twin.macro';
import { TelegramOnboardingFlow } from '../TelegramOnboarding';
import { Header } from './components/Header';
import { DepositPage } from './DepositPage';
import { MainPage } from './MainPage';
import { TokenListPage } from './TokenListPage';
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
  const { theme, telegramConfig, simulatedTransaction } = useUnifiedWalletContext();
  const { publicKey } = useUnifiedWallet();
  const contentRef = useRef<HTMLDivElement>(null);
  const [flow, setFlow] = useState<ITelegramWalletFlow>('Main');
  useOutsideClick(contentRef, onClose);
  const [selectedToken, setSelectedToken] = useState<any>();

  if (simulatedTransaction) {
    return (
      <div
        ref={contentRef}
        css={[
          tw`max-w-md p-4 w-full relative flex flex-col overflow-hidden rounded-xl max-h-[90vh] lg:max-h-[576px] transition-height duration-500 ease-in-out `,
          styles.container[theme],
        ]}
      >
        <TransactionSimulationPage />
      </div>
    );
  }

  if (!publicKey && telegramConfig) {
    return (
      <div
        ref={contentRef}
        css={[
          tw`max-w-md p-4 w-full relative flex flex-col overflow-hidden rounded-xl max-h-[90vh] lg:max-h-[576px] transition-height duration-500 ease-in-out `,
          styles.container[theme],
        ]}
      >
        <TelegramOnboardingFlow botUsername={telegramConfig.botUsername} onClose={onClose} />
      </div>
    );
  }

  return (
    <div
      ref={contentRef}
      css={[
        tw`max-w-md p-4 w-full relative flex flex-col overflow-hidden rounded-xl max-h-[90vh] lg:max-h-[576px] transition-height duration-500 ease-in-out `,
        styles.container[theme],
      ]}
    >
      <Header onClose={onClose} />
      <div tw="border-t-[1px] border-white/10" />
      {flow === 'Main' && <MainPage setFlow={setFlow} setSelectedToken={setSelectedToken} />}
      {flow === 'Deposit' && <DepositPage setFlow={setFlow} />}
      {flow === 'Withdrawal' && selectedToken && <WithdrawalPage setFlow={setFlow} token={selectedToken} />}
      {flow === 'TokenList' && <TokenListPage setFlow={setFlow} setSelectedToken={setSelectedToken} />}
    </div>
  );
};
