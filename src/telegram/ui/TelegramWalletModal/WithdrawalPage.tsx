import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { FC, FormEvent, useState } from 'react';
import { IStandardStyle, useUnifiedWallet, useUnifiedWalletContext } from 'src/contexts/UnifiedWalletContext';
import { buildAndSendTransaction } from 'src/telegram/helpers';
import tw from 'twin.macro';
import { ITelegramWalletFlow } from '.';
import LeftArrowIcon from '../icons/LeftArrowIcon';
import SpinnerIcon from '../icons/SpinnerIcon';

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

export const WithdrawalPage: FC<{ token: any; setFlow: (flow: ITelegramWalletFlow) => void }> = ({
  token,
  setFlow,
}) => {
  const { publicKey, signTransaction } = useUnifiedWallet();
  const [loading, setLoading] = useState(false);
  const { theme, telegramConfig } = useUnifiedWalletContext();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (!/^\d*$/.test(value)) {
      e.currentTarget.value = value.replace(/\D/g, ''); // Replace non-numeric characters
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !telegramConfig ||
      !publicKey ||
      !token.token_info?.token_program ||
      !token.token_info.decimals ||
      !signTransaction
    )
      return;
    try {
      setLoading(true);
      const tokenProgram = new PublicKey(token.token_info.token_program);
      const source = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram,
        new PublicKey(token.id),
        publicKey,
        false,
      );
      const destination = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram,
        new PublicKey(token.id),
        new PublicKey(recipient),
        true,
      );
      const transferIx = Token.createTransferCheckedInstruction(
        tokenProgram,
        source,
        new PublicKey(token.id),
        destination,
        publicKey,
        [],
        parseInt(amount),
        token.token_info.decimals,
      );
      await buildAndSendTransaction(
        [transferIx],
        publicKey,
        signTransaction,
        new Connection(telegramConfig.rpcEndpoint),
      );
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => {}} tw="flex flex-col items-center justify-center gap-4 pt-4">
      <div tw="flex w-full justify-between items-center">
        <button
          type="button"
          css={[tw`text-white/50 font-semibold`, styles.subtitle[theme]]}
          onClick={() => setFlow('Main')}
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
          type="text"
          value={amount}
          inputMode="numeric"
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
          onClick={() => setFlow('Main')}
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
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-4 leading-none`,
            (!amount || !recipient) && tw`opacity-50 cursor-not-allowed`,
            styles.walletButton[theme],
          ]}
        >
          {loading ? <SpinnerIcon /> : 'Confirm'}
        </button>
      </div>
    </form>
  );
};
