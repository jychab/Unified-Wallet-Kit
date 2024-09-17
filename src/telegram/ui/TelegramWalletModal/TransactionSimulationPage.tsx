import { FC } from 'react';
import { IStandardStyle, useUnifiedWalletContext } from 'src/contexts/UnifiedWalletContext';
import tw from 'twin.macro';

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
  const { simulatedTransaction, theme } = useUnifiedWalletContext();

  return (
    <div tw="flex flex-col items-center justify-center gap-4 pt-4">
      <div tw="flex justify-between gap-4 mt-8 items-center w-full">
        <button
          type="button"
          onClick={simulatedTransaction && simulatedTransaction.onCancel}
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-4 leading-none`,
            styles.walletButton[theme],
          ]}
        >
          {`Cancel`}
        </button>
        <button
          type="button"
          onClick={simulatedTransaction && simulatedTransaction.onApproval}
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-4 leading-none`,
            styles.walletButton[theme],
          ]}
        >
          {'Approve'}
        </button>
      </div>
    </div>
  );
};
