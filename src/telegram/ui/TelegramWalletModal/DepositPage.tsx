import { FC } from 'react';
import { IStandardStyle, useUnifiedWallet, useUnifiedWalletContext } from 'src/contexts/UnifiedWalletContext';
import tw from 'twin.macro';
import { ITelegramWalletFlow } from '.';
import LeftArrowIcon from '../icons/LeftArrowIcon';
import CopyButton from './components/CopyButton';

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

export const DepositPage: FC<{
  setFlow: (flow: ITelegramWalletFlow) => void;
}> = ({ setFlow }) => {
  const { theme } = useUnifiedWalletContext();
  const { publicKey } = useUnifiedWallet();
  return (
    <div tw="flex flex-col gap-4 pt-4">
      <div tw="flex justify-between items-center">
        <button
          type="button"
          css={[tw`text-white/50 font-semibold`, styles.subtitle[theme]]}
          onClick={() => {
            setFlow('Main');
          }}
        >
          <LeftArrowIcon width={20} height={20} />
        </button>
        <span css={[tw`text-white/50 text-center text-xl`, styles.text[theme]]}>Receive Address</span>
        <div tw="w-6" />
      </div>
      <span css={[tw`text-white/50 text-center font-bold`, styles.text[theme]]}>Your Solana Address</span>
      <div css={[tw`p-4 flex flex-col gap-2 items-center justify-center rounded-lg`, styles.container[theme]]}>
        <p css={[tw`text-white/50 text-center flex-wrap break-words max-w-xs`, styles.text[theme]]}>
          {publicKey?.toBase58() || 'Wallet Address Not Found.'}
        </p>
        {publicKey && <CopyButton text={publicKey.toBase58()} />}
      </div>
    </div>
  );
};
