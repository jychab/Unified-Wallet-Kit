import { FC, useEffect, useState } from 'react';
import tw from 'twin.macro';
import { IStandardStyle, useUnifiedWalletContext } from '../../../contexts/UnifiedWalletContext';
import { useTelegramWalletContext } from '../../contexts/TelegramWalletContext';
import { LoadingSpinner } from './components/LoadingSpinner';

const styles: IStandardStyle = {
  container: {
    light: [tw`text-black !bg-white shadow-xl`],
    dark: [tw`text-white !bg-[#3A3B43] border border-white/10`],
    jupiter: [tw`text-white bg-[rgb(49, 62, 76)]`],
  },
  shades: {
    light: [tw`bg-gradient-to-t from-[#ffffff] to-transparent pointer-events-none`],
    dark: [tw`bg-gradient-to-t from-[#3A3B43] to-transparent pointer-events-none`],
    jupiter: [tw`bg-gradient-to-t from-[rgb(49, 62, 76)] to-transparent pointer-events-none`],
  },
  walletItem: {
    light: [tw`bg-gray-50 hover:shadow-lg hover:border-black/10`],
    dark: [tw`hover:shadow-2xl hover:bg-white/10`],
    jupiter: [tw`hover:shadow-2xl hover:bg-white/10`],
  },
  walletButton: {
    light: [tw`bg-[#F9FAFB] hover:bg-black/5`],
    dark: [tw`bg-white/10 hover:bg-white/20 border border-white/10 shadow-lg`],
    jupiter: [tw`bg-white/5 hover:bg-white/20 border border-white/10 shadow-lg`],
  },
  subtitle: {
    light: [tw`text-black/50`],
    dark: [tw`text-white/50`],
    jupiter: [tw`text-white/50`],
  },
  header: {
    light: [tw`border-b`],
    dark: [],
    jupiter: [],
  },
  text: {
    light: [tw`text-black`],
    dark: [tw`text-white`],
    jupiter: [tw`text-white`],
  },
};

export const TransactionSimulationPage: FC = () => {
  const { theme, telegramConfig } = useUnifiedWalletContext();
  const { simulatedTransaction } = useTelegramWalletContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (loading && !simulatedTransaction) {
      setLoading(false);
    } else if (loading && simulatedTransaction?.error) {
      setLoading(false);
      setError(simulatedTransaction?.error);
    }
  }, [simulatedTransaction]);

  return (
    <div tw="flex flex-col w-full items-center justify-center gap-4 pt-4">
      <span css={[tw`text-white/50 text-center text-xl`, styles.text[theme]]}>
        {simulatedTransaction?.message
          ? `@${telegramConfig?.botUsername} is requesting for you to sign a message`
          : 'Review Transaction'}
      </span>
      <span
        css={[
          tw`text-white/50 text-center text-sm line-clamp-4 break-words flex-wrap text-left`,
          styles.subtitle[theme],
        ]}
      >
        {simulatedTransaction?.message || 'Simulation...'}
      </span>

      {error && <span>{error}</span>}
      <div tw="flex justify-between gap-4 mt-8 items-center w-full">
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (simulatedTransaction) {
              simulatedTransaction.onCancel();
            }
          }}
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-4 leading-none focus-within:outline-none`,
            styles.walletButton[theme],
          ]}
        >
          {`Cancel`}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            if (simulatedTransaction && telegramConfig) {
              setLoading(true);
              simulatedTransaction.onApproval();
            }
          }}
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-4 leading-none justify-center items-center flex focus-within:outline-none`,
            loading ? tw`py-2` : tw`py-4`,
            styles.walletButton[theme],
          ]}
        >
          {loading ? <LoadingSpinner twStyle={tw`w-8 h-8 animate-spin text-gray-600 fill-blue-600`} /> : 'Approve'}
        </button>
      </div>
    </div>
  );
};
