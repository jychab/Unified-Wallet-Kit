import { createTransferCheckedInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { FC, FormEvent, useState } from 'react';
import tw from 'twin.macro';
import { ITelegramWalletFlow } from '.';
import { IStandardStyle, useUnifiedWallet, useUnifiedWalletContext } from '../../../contexts/UnifiedWalletContext';
import { useTelegramWalletContext } from '../../contexts/TelegramWalletContext';
import { buildAndSignTransaction, sendAndConfirmTransaction } from '../../helpers';
import LeftArrowIcon from '../icons/LeftArrowIcon';
import { LoadingSpinner } from './components/LoadingSpinner';
import { NATIVE_SOL } from './components/TokenList';

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

export const WithdrawalPage: FC<{
  token: any;
  setFlow: (flow: ITelegramWalletFlow) => void;
}> = ({ token, setFlow }) => {
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { setShowWalletModal, setTxSig } = useTelegramWalletContext();
  const { theme, telegramConfig } = useUnifiedWalletContext();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    let value = e.currentTarget.value;

    // Allow only digits and one decimal point
    if (!/^\d*\.?\d*$/.test(value)) {
      e.currentTarget.value = value.replace(/[^0-9.]/g, ''); // Replace non-numeric characters except for the decimal point

      // Ensure only one decimal point is allowed
      const parts = e.currentTarget.value.split('.');
      if (parts.length > 2) {
        e.currentTarget.value = parts[0] + '.' + parts.slice(1).join('');
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!telegramConfig || !publicKey || !signTransaction) {
      return;
    }
    try {
      setLoading(true);
      let tx;
      const connection = new Connection(telegramConfig.rpcEndpoint);
      if (token.id == NATIVE_SOL) {
        const transferIx = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: parseFloat(amount) * 10 ** token.token_info.decimals,
        });
        tx = await buildAndSignTransaction([transferIx], publicKey, signTransaction, connection);
      } else {
        const tokenProgram = new PublicKey(token.token_info.token_program);
        const source = await getAssociatedTokenAddress(
          new PublicKey(token.id),
          publicKey,
          false,
          tokenProgram,
        );
        const destination = await getAssociatedTokenAddress(
          new PublicKey(token.id),
          new PublicKey(recipient),
          true,
          tokenProgram,
        );
        const transferIx = createTransferCheckedInstruction(
          source,
          new PublicKey(token.id),
          destination,
          publicKey,
          parseFloat(amount) * 10 ** token.token_info.decimals,
          token.token_info.decimals,
          undefined,
          tokenProgram,
        );
        tx = await buildAndSignTransaction([transferIx], publicKey, signTransaction, connection);
      }
      console.log('Signed Tx:', tx);
      // show modal
      setShowWalletModal(true);
      setTxSig('loading');
      const txSig = await sendAndConfirmTransaction(tx.serialize(), connection);
      console.log('Tx Sig:', txSig);
      setTxSig(txSig);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} tw="flex flex-col items-center justify-center gap-4 pt-4">
      <div tw="flex w-full justify-between items-center">
        <button
          type="button"
          disabled={loading}
          css={[tw`text-white/50 font-semibold`, styles.subtitle[theme]]}
          onClick={() => {
            setFlow('Main');
          }}
        >
          <LeftArrowIcon width={20} height={20} />
        </button>
        <span
          css={[tw`text-white/50 text-center text-2xl`, styles.text[theme]]}
        >{`Send ${token.content?.metadata.symbol}`}</span>
        <div tw="w-6" />
      </div>
      <div tw="w-20 h-20 my-4 relative overflow-hidden rounded-full">
        {token.content?.links?.image ? (
          <img
            tw="object-cover w-full h-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={'Profile Image'}
            src={token.content?.links?.image}
          />
        ) : (
          <div tw="w-full h-full bg-gray-300" />
        )}
      </div>
      <input
        required
        type="text"
        value={recipient}
        pattern="[1-9A-HJ-NP-Za-km-z]{32,44}"
        placeholder="Recipient's Solana address"
        onChange={(e) => setRecipient(e.target.value)}
        css={[
          tw`flex w-full text-base p-4 border border-white/50 leading-none rounded focus-within:outline-none`,
          styles.container[theme],
        ]}
      />
      <label
        css={[
          tw`flex gap-2 items-center w-full text-base p-2 border border-white/50 leading-none rounded focus-within:outline-none`,
          styles.container[theme],
        ]}
      >
        <input
          required
          css={[tw`text-base w-full p-2 focus-within:outline-none border-none`, styles.container[theme]]}
          type="number"
          value={amount}
          placeholder="Amount"
          onChange={(e) => setAmount(e.target.value)} // Handle input change
          onInput={handleInput} // Ensure only numeric input is allowed
        />
        <span css={[tw`text-white/50`, styles.subtitle[theme]]}>{token.content?.metadata.symbol}</span>
        <button
          type="button"
          onClick={() =>
            setAmount(((token.token_info?.balance || 0) / 10 ** (token.token_info?.decimals || 0)).toString())
          }
          css={[tw`px-2 py-1 rounded-full text-sm`, styles.walletButton[theme]]}
        >
          Max
        </button>
      </label>
      <div tw="flex justify-end items-center w-full">
        <span
          css={[tw`text-xs text-white/50`, styles.subtitle[theme]]}
        >{`Available Balance: ${(token.token_info?.balance || 0) / 10 ** (token.token_info?.decimals || 0)} ${token.content?.metadata.symbol}`}</span>
      </div>
      <div tw="flex justify-between gap-4 mt-8 items-center w-full">
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setFlow('Main');
          }}
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-4 leading-none`,

            styles.walletButton[theme],
          ]}
        >
          {`Back`}
        </button>
        <button
          disabled={!amount || !recipient || loading}
          type="submit"
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 justify-center items-center flex leading-none`,
            (!amount || !recipient) && tw`opacity-50 cursor-not-allowed`,
            loading ? tw`py-2` : tw`py-4`,
            styles.walletButton[theme],
          ]}
        >
          {loading ? <LoadingSpinner twStyle={tw`w-8 h-8 animate-spin text-gray-600 fill-blue-600`} /> : 'Next'}
        </button>
      </div>
    </form>
  );
};
