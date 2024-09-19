import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, unpackAccount } from '@solana/spl-token';
import {
  AccountInfo,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
} from '@solana/web3.js';
import { FC, useEffect, useState } from 'react';
import tw from 'twin.macro';
import { IStandardStyle, useUnifiedWalletContext } from '../../../contexts/UnifiedWalletContext';
import { useTelegramWalletContext } from '../../contexts/TelegramWalletContext';
import { LoadingSpinner } from './components/LoadingSpinner';

const styles: IStandardStyle = {
  container: {
    light: [tw`text-black !bg-white border border-black/10`],
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
    light: [tw`bg-black text-white hover:bg-black/80`],
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
  const [simulationResult, setSimulationResult] = useState<string>();

  useEffect(() => {
    if (loading && !simulatedTransaction) {
      setLoading(false);
    } else if (loading && simulatedTransaction?.error) {
      setLoading(false);
      setError(simulatedTransaction?.error);
    }
  }, [simulatedTransaction]);

  useEffect(() => {
    if (telegramConfig && simulatedTransaction?.transaction) {
      getSimulationResults(
        new Connection(telegramConfig?.rpcEndpoint),
        simulatedTransaction.transaction as VersionedTransaction,
      ).then((x) => {
        setSimulationResult(JSON.stringify(x, null, 2));
      });
    }
  }, [telegramConfig, simulatedTransaction?.transaction]);

  return (
    <div tw="flex flex-col w-full items-center justify-center gap-4 py-4">
      <span css={[tw`text-white/50 text-center text-xl`, styles.text[theme]]}>
        {error ? 'Unexpected Error' : simulatedTransaction?.message ? `Approve Message` : 'Approve Transaction'}
      </span>
      <span
        css={[
          tw`break-words flex-wrap w-full text-left p-4 border rounded-lg overflow-y-scroll max-h-[270px]`,
          styles.subtitle[theme],
          styles.container[theme],
          error ? tw`text-error` : tw`text-white/50`,
        ]}
        className="hideScrollbar"
      >
        {error || simulatedTransaction?.message || simulationResult}
      </span>
      <div tw="flex justify-between gap-4 mt-4 items-center w-full">
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

export async function getSimulationResults(connection: Connection, transaction: VersionedTransaction) {
  const accountKeys = transaction.message.staticAccountKeys.filter(
    (x) =>
      x.toBase58() != TOKEN_2022_PROGRAM_ID.toBase58() &&
      x.toBase58() !== TOKEN_PROGRAM_ID.toBase58() &&
      x.toBase58() !== ComputeBudgetProgram.programId.toBase58() &&
      x.toBase58() !== SystemProgram.programId.toBase58(),
  );
  const simulationResults = (
    await connection.simulateTransaction(transaction, {
      sigVerify: false,
      replaceRecentBlockhash: true,
      commitment: 'confirmed',
      accounts: {
        encoding: 'base64',
        addresses: accountKeys.map((x) => x.toBase58()),
      },
    })
  ).value;

  const simulatedAccounts = simulationResults.accounts || [];
  const preAccountInfo = await connection.getMultipleAccountsInfo(accountKeys);
  // Reassemble results in the original order
  const tokenBalances = accountKeys.map((x, index) => {
    const preAccount = preAccountInfo[index];
    const postAccount = simulatedAccounts[index];
    if (!postAccount) return;
    if (preAccount?.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58()) {
      try {
        const preAccountAmount = unpackAccount(x, preAccount, TOKEN_2022_PROGRAM_ID).amount;
        const postAccountAmount = unpackAccount(
          x,
          {
            data: Buffer.from(postAccount.data[0], 'base64'),
            executable: postAccount.executable,
            owner: new PublicKey(postAccount.owner),
            lamports: postAccount.lamports,
            rentEpoch: postAccount.rentEpoch,
          } as AccountInfo<Buffer>,
          TOKEN_2022_PROGRAM_ID,
        ).amount;
        // Handle TOKEN_PROGRAM_ID accounts

        return {
          pre: Number(preAccountAmount),
          post: Number(postAccountAmount),
          x,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        };
      } catch (e) {
        return;
      }
    } else if (preAccount?.owner.toBase58() === TOKEN_PROGRAM_ID.toBase58()) {
      try {
        const preAccountAmount = unpackAccount(x, preAccount, TOKEN_PROGRAM_ID).amount;
        const postAccountAmount = unpackAccount(
          x,
          {
            data: Buffer.from(postAccount.data[0], 'base64'),
            executable: postAccount.executable,
            owner: new PublicKey(postAccount.owner),
            lamports: postAccount.lamports,
            rentEpoch: postAccount.rentEpoch,
          } as AccountInfo<Buffer>,
          TOKEN_PROGRAM_ID,
        ).amount;
        return {
          pre: Number(preAccountAmount),
          post: Number(postAccountAmount),
          x,
          tokenProgram: TOKEN_PROGRAM_ID,
        };
      } catch (e) {
        return;
      }
    } else {
      return {
        preLamport: preAccount?.lamports || 0,
        postLamport: postAccount?.lamports || preAccount?.lamports || 0,
      };
    }
  });

  return tokenBalances;
}
