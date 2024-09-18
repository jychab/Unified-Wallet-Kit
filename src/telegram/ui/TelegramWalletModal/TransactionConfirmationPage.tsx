import { FC, useEffect } from 'react';
import tw from 'twin.macro';
import { ITelegramWalletFlow } from '.';
import { IStandardStyle, useUnifiedWallet, useUnifiedWalletContext } from '../../../contexts/UnifiedWalletContext';
import { useTelegramWalletContext } from '../../contexts/TelegramWalletContext';
import { cache } from '../../helpers';
import { LoadingSpinner } from './components/LoadingSpinner';
import { cacheKey } from './components/TokenList';

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

export const TransactionConfirmationPage: FC<{ setFlow: (flow: ITelegramWalletFlow) => void }> = ({ setFlow }) => {
  const { theme } = useUnifiedWalletContext();
  const { publicKey } = useUnifiedWallet();
  const { txSig, setTxSig } = useTelegramWalletContext();
  useEffect(() => {
    if (txSig && txSig !== 'loading' && publicKey) {
      cache.clear(cacheKey(publicKey)); // invalidate cache when there is a change in txs
    }
  }, [txSig, publicKey]);

  if (!txSig) {
    return null;
  }

  return (
    <div tw="flex flex-col items-center justify-center w-full gap-4 pt-4">
      {txSig === 'loading' ? (
        <LoadingSpinner twStyle={tw`w-20 h-20 animate-spin text-gray-600 fill-blue-600`} />
      ) : (
        <img src={'https://buckets.blinksfeed.com/success.gif'} width={160} height={160} alt="" />
      )}
      <div tw="mt-4 flex flex-col justify-center items-center text-center">
        <span tw="text-lg font-semibold">
          {txSig === 'loading' ? 'Sending Transaction...' : 'Transaction Successful'}
        </span>
        {txSig !== 'loading' && (
          <a target="_blank" rel="noopener noreferrer" tw="underline font-bold" href={`https://solscan.io/tx/${txSig}`}>
            {`View Transaction`}
          </a>
        )}
      </div>
      <div tw="flex justify-between gap-4 mt-8 items-center w-full">
        <button
          type="button"
          onClick={async (e) => {
            setTxSig(undefined);
            setFlow('Main');
          }}
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-4 leading-none`,
            styles.walletButton[theme],
          ]}
        >
          {'Back To Home'}
        </button>
      </div>
    </div>
  );
};
