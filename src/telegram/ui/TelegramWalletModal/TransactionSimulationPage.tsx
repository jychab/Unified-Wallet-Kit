import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, unpackAccount } from '@solana/spl-token';
import {
  AccountInfo,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { FC, useEffect, useState } from 'react';
import tw from 'twin.macro';
import {
  IStandardStyle,
  IUnifiedTheme,
  useUnifiedWallet,
  useUnifiedWalletContext,
} from '../../../contexts/UnifiedWalletContext';
import { getAssetsBatch } from '../../../telegram/helpers';
import { ITelegramConfig, useTelegramWalletContext } from '../../contexts/TelegramWalletContext';
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

async function fetchSimulationResults(
  telegramConfig: ITelegramConfig,
  simulatedTransaction: {
    transaction?: Transaction | VersionedTransaction;
    error?: string;
    message?: string;
    onApproval: () => void;
    onCancel: () => void;
  },
  publicKey: PublicKey,
  setNativeChanges: (arg0: any) => void,
  setTokenChanges: (arg0: any) => void,
  setError: (arg0: any) => void,
  setSimulationLoading: (arg0: any) => void,
) {
  try {
    const connection = new Connection(telegramConfig.rpcEndpoint);
    const simulationResult = await getSimulationResults(
      connection,
      simulatedTransaction.transaction as VersionedTransaction,
    );

    const ownBalanceChanges = filterAndProcessAssets(simulationResult, publicKey);
    if (ownBalanceChanges.length === 0) {
      throw new Error('No Changes in Token Balances Found.');
    }

    // Handling for Native changes (SOL)
    const nativeChanges = ownBalanceChanges
      .filter((x) => x.isNativeAsset)
      .map((x) => ({
        ...x,
        amount: x.amount / 10 ** 9,
        symbol: 'SOL',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Solana_logo.png/252px-Solana_logo.png',
      }));

    setNativeChanges(nativeChanges);

    // Handling for Token changes
    const tokenChanges = ownBalanceChanges.filter((x) => !x.isNativeAsset && x.mint);
    if (tokenChanges.length > 0) {
      const mintAddresses = tokenChanges.map((x) => x.mint!.toBase58());
      const assets = await getAssetsBatch(telegramConfig.rpcEndpoint, mintAddresses);
      if (assets && assets.length > 0) {
        const changes = assets
          .map((asset: any) => {
            const token = tokenChanges.find((y) => y.mint?.toBase58() === asset.id);
            if (!token) return null;
            return {
              ...token,
              amount: token.amount / 10 ** asset.token_info.decimals,
              symbol: asset.content?.metadata?.symbol,
              imageUrl: asset.content?.links?.image,
            };
          })
          .filter((x: any) => !!x);

        setTokenChanges(changes);
      } else {
        throw new Error('Error occurred while fetching assets metadata');
      }
    }
  } catch (e) {
    setError(`${e}`);
  } finally {
    setSimulationLoading(false);
  }
}

export const TransactionSimulationPage: FC = () => {
  const { theme, telegramConfig } = useUnifiedWalletContext();
  const { simulatedTransaction } = useTelegramWalletContext();
  const { publicKey } = useUnifiedWallet();
  const [loading, setLoading] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [nativeChanges, setNativeChanges] = useState<FilteredResult[]>([]);
  const [tokenChanges, setTokenChanges] = useState<FilteredResult[]>([]);

  useEffect(() => {
    if (loading && simulatedTransaction?.error) {
      setLoading(false);
      setError(simulatedTransaction?.error);
    }
  }, [simulatedTransaction?.error, loading]);

  useEffect(() => {
    if (telegramConfig?.rpcEndpoint && simulatedTransaction?.transaction && publicKey) {
      setSimulationLoading(true);
      fetchSimulationResults(
        telegramConfig,
        simulatedTransaction,
        publicKey,
        setNativeChanges,
        setTokenChanges,
        setError,
        setSimulationLoading,
      );
    }
  }, [telegramConfig, simulatedTransaction?.transaction, publicKey]);

  return (
    <div tw="flex flex-col w-full items-center justify-center gap-4 py-4">
      <span css={[tw`text-white/50 text-center text-xl`, styles.text[theme]]}>
        {error ? 'Unexpected Error' : simulatedTransaction?.message ? `Approve Message` : 'Approve Transaction'}
      </span>
      <div
        css={[tw`w-full p-4 border rounded-lg overflow-y-scroll max-h-[270px]`, styles.container[theme]]}
        className="hideScrollbar"
      >
        {error || simulatedTransaction?.message || simulationLoading ? (
          <span
            css={[
              tw`break-words flex-wrap w-full text-left`,
              styles.subtitle[theme],
              error ? tw`text-error` : tw`text-white/50`,
            ]}
          >
            {error || simulatedTransaction?.message || (simulationLoading && 'Transaction Simulation is loading...')}
          </span>
        ) : (
          <div tw="flex flex-col gap-2">
            {nativeChanges?.map((x, index) => <SimulationResult key={'native' + index} result={x} theme={theme} />)}
            {tokenChanges?.map((x, index) => <SimulationResult key={'spl-token' + index} result={x} theme={theme} />)}
          </div>
        )}
      </div>
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

const SimulationResult: FC<{ result: FilteredResult; theme: IUnifiedTheme }> = ({ result, theme }) => {
  return (
    <div tw="flex items-center w-full justify-start gap-2">
      <span css={[styles.subtitle[theme], result.amount > 0 ? tw`text-success` : tw`text-error`]}>
        {result.amount > 0 ? '+' : '-'}
        {Math.abs(result.amount)}
      </span>
      {result.imageUrl && (
        <div tw="w-8 h-8 relative overflow-hidden rounded-full">
          <img
            tw="object-cover w-full h-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={result.symbol || 'Token Image'}
            src={result.imageUrl}
          />
        </div>
      )}
      <span css={[styles.subtitle[theme]]}>{result.symbol}</span>
    </div>
  );
};

export async function getSimulationResults(connection: Connection, transaction: VersionedTransaction) {
  const accountKeys = transaction.message.staticAccountKeys.filter(
    (x) =>
      x.toBase58() !== TOKEN_2022_PROGRAM_ID.toBase58() &&
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
  if (simulationResults.err) {
    throw new Error(JSON.stringify(simulationResults.err));
  }
  const simulatedAccounts = simulationResults.accounts || [];
  const preAccountInfo = await connection.getMultipleAccountsInfo(accountKeys);
  // Reassemble results in the original order
  const tokenBalances = accountKeys.map((x, index) => {
    const preAccount = preAccountInfo[index];
    const postAccount = simulatedAccounts[index];
    if (!postAccount) return;
    if (preAccount?.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58()) {
      try {
        const preAccountUnpacked = unpackAccount(x, preAccount, TOKEN_2022_PROGRAM_ID);
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
          pre: Number(preAccountUnpacked.amount),
          post: Number(postAccountAmount),
          mint: preAccountUnpacked.mint,
          owner: preAccountUnpacked.owner,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        } as Asset;
      } catch (e) {
        return;
      }
    } else if (preAccount?.owner.toBase58() === TOKEN_PROGRAM_ID.toBase58()) {
      try {
        const preAccountUnpacked = unpackAccount(x, preAccount, TOKEN_PROGRAM_ID);
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
          pre: Number(preAccountUnpacked.amount),
          post: Number(postAccountAmount),
          mint: preAccountUnpacked.mint,
          owner: preAccountUnpacked.owner,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as Asset;
      } catch (e) {
        return;
      }
    } else {
      return {
        preLamports: preAccount?.lamports || 0,
        postLamports: postAccount?.lamports || preAccount?.lamports || 0,
        owner: x,
        decimals: 9,
      } as Asset;
    }
  });

  return tokenBalances.filter((x) => !!x);
}

interface Asset {
  pre?: number;
  post?: number;
  preLamports?: number;
  postLamports?: number;
  mint?: PublicKey;
  owner: PublicKey;
  tokenProgram?: PublicKey;
}

interface FilteredResult {
  symbol?: string;
  imageUrl?: string;
  mint: PublicKey | undefined;
  isNativeAsset: boolean;
  amount: number;
}

function filterAndProcessAssets(assets: Asset[], ownerPublicKey: PublicKey): FilteredResult[] {
  return assets
    .filter((asset) => asset.owner.equals(ownerPublicKey)) // Filter by owner
    .map((asset) => {
      const isNativeAsset = !asset.tokenProgram; // Check if it's a native asset
      let amount = 0;

      if (isNativeAsset) {
        // Native asset: use preLamports and postLamports
        if (asset.preLamports !== undefined && asset.postLamports !== undefined) {
          amount = asset.postLamports - asset.preLamports;
        }
      } else {
        // Token asset: use pre and post fields
        if (asset.pre !== undefined && asset.post !== undefined) {
          amount = asset.post - asset.pre;
        }
      }

      return {
        mint: asset.mint,
        isNativeAsset,
        amount: amount, // Return the absolute value of the amount
      };
    });
}
