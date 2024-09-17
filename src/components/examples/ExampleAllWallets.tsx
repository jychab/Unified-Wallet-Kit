import { useMemo } from 'react';
import 'twin.macro';

export const MWA_NOT_FOUND_ERROR = 'MWA_NOT_FOUND_ERROR';

import { Cluster } from '@solana/web3.js';
import { IUnifiedWalletConfig } from 'src/contexts/WalletConnectionProvider';
import { useTelegramWalletContext } from 'src/telegram/contexts/TelegramWalletContext';
import { getOrCreateTelegramAdapter } from 'src/telegram/helpers';
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
  };
  const { telegramConfig, setShowWalletModal, setTransactionSimulation } = useTelegramWalletContext();

  const params: Omit<Parameters<typeof UnifiedWalletProvider>[0], 'children'> = useMemo(
    () => ({
      wallets: telegramConfig
        ? [getOrCreateTelegramAdapter(telegramConfig, setTransactionSimulation, setShowWalletModal)]
        : [],
      config: config,
    }),
    [config, theme, lang, setTransactionSimulation, setShowWalletModal],
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
