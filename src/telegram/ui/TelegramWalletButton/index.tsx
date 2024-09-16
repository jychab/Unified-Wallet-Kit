import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import tw from 'twin.macro';

import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { IStandardStyle, useUnifiedWallet, useUnifiedWalletContext } from 'src/contexts/UnifiedWalletContext';
import WalletIcon from '../icons/WalletIcon';

const styles: IStandardStyle = {
  container: {
    light: [tw`bg-white text-black`],
    dark: [tw`bg-[#31333B] text-white`],
    jupiter: [tw`bg-v3-bg text-white`],
  },
};

export const TelegramWalletButton: React.FC<{
  overrideContent?: ReactNode;
  buttonClassName?: string;
  currentUserClassName?: string;
}> = ({ overrideContent, buttonClassName: className, currentUserClassName }) => {
  const { setShowWalletModal, theme, telegramConfig } = useUnifiedWalletContext();
  const { wallet, publicKey } = useUnifiedWallet();
  const [userName, setUsername] = useState('');
  useEffect(() => {
    try {
      if (telegramConfig && publicKey) {
        const { initData } = retrieveLaunchParams();
        setUsername(initData?.user?.username || publicKey?.toBase58());
      }
    } catch (e) {
      setUsername('');
    }
  }, [telegramConfig, publicKey]);
  const handleClick = useCallback(async () => {
    // if (wallet?.adapter.name == 'TelegramWallet' && publicKey && telegramConfig) {
    setShowWalletModal(true);
    // }
  }, [wallet]);

  return overrideContent ? (
    // To prevent react render error where <button> is nested
    <button css={styles.container[theme]} className={className} onClick={handleClick}>
      {overrideContent}
    </button>
  ) : (
    <button
      css={[tw`rounded-lg px-4 font-semibold w-auto items-center flex gap-2`, styles.container[theme]]}
      onClick={handleClick}
    >
      <WalletIcon width={14} height={14} />
      <span tw="truncate max-w-[100px] font-semibold">{userName}</span>
    </button>
  );
};
