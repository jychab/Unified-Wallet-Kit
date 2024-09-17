import { useMemo } from 'react';
import 'twin.macro';

export const MWA_NOT_FOUND_ERROR = 'MWA_NOT_FOUND_ERROR';

import { Cluster } from '@solana/web3.js';
import { IUnifiedWalletConfig } from 'src/contexts/WalletConnectionProvider';
import { TelegramWalletButton, UnifiedWalletButton } from '..';
import { AllLanguage } from '../../contexts/TranslationProvider/i18n';
import { IUnifiedTheme } from '../../contexts/UnifiedWalletContext';
import { UnifiedWalletProvider } from '../../contexts/UnifiedWalletProvider';
import { HARDCODED_WALLET_STANDARDS } from '../../misc/constants';
import CodeBlocks from '../CodeBlocks/CodeBlocks';
import { HARDCODED_DECLARTION_BLOCK, HARDCODED_WALLET_CODEBLOCK } from './snippets/ExampleAllWalletsSnippet';
import WalletNotification from './WalletNotification';

const ExampleAllWallets: React.FC<{ theme: IUnifiedTheme; lang: AllLanguage }> = ({ theme, lang }) => {
  const config: IUnifiedWalletConfig = {
    autoConnect: false,
    env: 'mainnet-beta' as Cluster,
    metadata: {
      name: 'UnifiedWallet',
      description: 'UnifiedWallet',
      url: 'https://jup.ag',
      iconUrls: ['https://jup.ag/favicon.ico'],
    },
    notificationCallback: WalletNotification,
    walletPrecedence: [],
    hardcodedWallets: HARDCODED_WALLET_STANDARDS,
    walletlistExplanation: {
      href: 'https://station.jup.ag/docs/additional-topics/wallet-list',
    },
    theme,
    lang,
    telegramConfig: {
      botDisplayPic: 'https://buckets.blinksfeed.com/blinksfeed/logo.png',
      botDirectLink: 'https://t.me/blinksfeedbot/blinksfeed',
      rpcEndpoint: 'https://rpc.blinksfeed.com',
      backendEndpoint: 'https://us-central1-token-60450.cloudfunctions.net/api',
      botUsername: 'blinksfeedbot',
    },
  };
  const params: Omit<Parameters<typeof UnifiedWalletProvider>[0], 'children'> = useMemo(
    () => ({
      wallets: [],
      config: config,
    }),
    [config, theme, lang],
  );

  return (
    <div tw="flex flex-col items-start">
      <UnifiedWalletProvider {...params}>
        <div tw="flex gap-4">
          <UnifiedWalletButton />
          <TelegramWalletButton />
        </div>
      </UnifiedWalletProvider>

      <div tw="w-full overflow-x-auto">
        <CodeBlocks
          params={params}
          unparsedWalletDeclarationString={HARDCODED_DECLARTION_BLOCK}
          unparsedWalletPropsString={HARDCODED_WALLET_CODEBLOCK}
        />
      </div>
    </div>
  );
};

export default ExampleAllWallets;
