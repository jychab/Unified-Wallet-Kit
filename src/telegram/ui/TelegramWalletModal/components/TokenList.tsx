import { PublicKey } from '@solana/web3.js';
import { FC, useEffect, useState } from 'react';
import tw from 'twin.macro';
import { ITelegramWalletFlow } from '..';
import { IStandardStyle, useUnifiedWallet, useUnifiedWalletContext } from '../../../../contexts/UnifiedWalletContext';
import { cache, getAssetsByOwner } from '../../../helpers';

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
    dark: [tw`hover:shadow-lg hover:bg-white/10`],
    jupiter: [tw`hover:shadow-lg hover:bg-white/10`],
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
export const NATIVE_SOL = 'native_sol';
const nativeToken = (result: any) => ({
  id: NATIVE_SOL,
  token_info: {
    balance: result.nativeBalance?.lamports || 0,
    decimals: 9,
    price_info: {
      price_per_token: result.nativeBalance?.price_per_sol,
    },
  },
  content: {
    metadata: {
      name: 'Solana',
      symbol: 'SOL',
    },
    links: {
      image: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Solana_logo.png/252px-Solana_logo.png',
    },
  },
});

function getTokenPrice(token: any) {
  const balance = token.token_info?.balance || 0;
  const price = token.token_info?.price_info?.price_per_token || 0;
  return (balance * price) / 10 ** (token.token_info?.decimals || 0);
}

const TokenCard: FC<{
  showPrices?: boolean;
  token: any;
  setSelectedToken: (selectedToken: any | undefined) => void;
  setFlow: (flow: ITelegramWalletFlow) => void;
}> = ({ token, showPrices = true, setSelectedToken, setFlow }) => {
  const { theme } = useUnifiedWalletContext();
  const tokenPrice = getTokenPrice(token);
  const price = tokenPrice > 0 ? (tokenPrice < 0.01 ? `<$0.01` : `$${tokenPrice.toFixed(2)}`) : '-';
  return (
    <button
      onClick={() => {
        setSelectedToken(token);
        setFlow('Withdrawal');
      }}
      css={[tw`flex w-full gap-4 h-full p-4 rounded-lg justify-between`, styles.walletItem[theme]]}
    >
      <div tw="flex items-center gap-4">
        <div tw="w-10 h-10 relative overflow-hidden rounded-full">
          {token.content?.links?.image ? (
            <img
              tw="object-cover w-full h-full"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt={token.content?.metadata.name || 'Token Image'}
              src={token.content?.links?.image}
            />
          ) : (
            <div tw="w-full h-full bg-gray-300" />
          )}
        </div>
        <div tw="flex flex-col items-start">
          <span css={styles.text[theme]} tw="text-base font-bold">
            {token.content?.metadata.name || 'Unknown Token'}
          </span>
          <span css={styles.subtitle[theme]} tw="text-sm text-left truncate w-full max-w-[180px]">
            {`${(token.token_info?.balance || 0) / 10 ** (token.token_info?.decimals || 0)} ${token.content?.metadata.symbol}`}
          </span>
        </div>
      </div>
      <span css={styles.text[theme]} tw="text-base font-bold truncate max-w-[80px]">
        {showPrices ? price : ''}
      </span>
    </button>
  );
};

const Summary: FC<{ total: number; setFlow: (flow: ITelegramWalletFlow) => void }> = ({ total, setFlow }) => {
  const { theme } = useUnifiedWalletContext();

  return (
    <div tw="w-full px-4 py-8 flex flex-col items-center gap-4">
      <div tw="text-5xl font-bold text-center">{`$${total.toFixed(2)}`}</div>
      <div tw="flex justify-center gap-2">
        <button
          onClick={() => setFlow('TokenList')}
          css={styles.walletButton[theme]}
          tw="px-4 py-2 text-sm font-semibold rounded-lg"
        >
          Withdraw
        </button>
        <button
          css={styles.walletButton[theme]}
          onClick={() => setFlow('Deposit')}
          tw="px-4 py-2 text-sm font-semibold rounded-lg"
        >
          Deposit
        </button>
      </div>
    </div>
  );
};

export const cacheKey = (publicKey: PublicKey) => `assets-${publicKey?.toBase58()}`;

export const TokenList: FC<{
  showSummary?: boolean;
  showSearchBar?: boolean;
  showPrices?: boolean;
  setSelectedToken: (selectedToken: any | undefined) => void;
  setFlow: (flow: ITelegramWalletFlow) => void;
}> = ({ setFlow, setSelectedToken, showSummary = true, showPrices = true, showSearchBar = false }) => {
  const { theme, telegramConfig } = useUnifiedWalletContext();
  const [tokens, setTokens] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const { publicKey } = useUnifiedWallet();
  const [search, setSearch] = useState('');
  // Fetch tokens and cache them

  useEffect(() => {
    if (!publicKey) return;

    const cachedTokens = cache.get(cacheKey(publicKey));

    if (cachedTokens) {
      setTokens(cachedTokens as any[]);
    } else if (telegramConfig?.rpcEndpoint) {
      getAssetsByOwner(telegramConfig.rpcEndpoint, publicKey?.toBase58())
        .then((result) => {
          const fetchedTokens = result.items
            .filter((x) => x.interface === 'FungibleToken')
            .concat([nativeToken(result)]);
          setTokens(fetchedTokens);
          cache.set(cacheKey(publicKey), fetchedTokens, 5 * 60 * 1000); //5min ttl
        })
        .catch((error) => {
          console.error('Error fetching assets:', error);
        });
    }
  }, [telegramConfig, publicKey]);

  useEffect(() => {
    if (tokens) {
      setFiltered(
        tokens.filter(
          (x) =>
            search == '' ||
            (x.content?.metadata.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (x.content?.metadata.symbol || '').toLowerCase().includes(search.toLowerCase()),
        ),
      );
    }
  }, [search, tokens]);
  return (
    <div tw="flex flex-col justify-center items-center w-full py-4 gap-2">
      {showSummary && <Summary total={tokens.reduce((sum, x) => sum + getTokenPrice(x), 0)} setFlow={setFlow} />}
      {showSearchBar && (
        <input
          type="text"
          placeholder="Search"
          css={[
            tw`flex w-full border p-4 border-white/50 leading-none rounded-lg focus-within:outline-none`,
            styles.container[theme],
          ]}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}
      <div tw="overflow-scroll w-full max-h-[28vh]" className="hideScrollbar">
        {filtered
          .sort((a, b) => getTokenPrice(b) - getTokenPrice(a))
          .map((x) => (
            <TokenCard
              key={x.id}
              token={x}
              showPrices={showPrices}
              setSelectedToken={setSelectedToken}
              setFlow={setFlow}
            />
          ))}
      </div>
    </div>
  );
};
