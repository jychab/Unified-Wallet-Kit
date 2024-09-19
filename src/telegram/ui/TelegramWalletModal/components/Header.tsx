import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { FC, useEffect, useState } from 'react';
import { IStandardStyle, useUnifiedWallet, useUnifiedWalletContext } from '../../../../contexts/UnifiedWalletContext';

import { memo } from 'react';
import tw from 'twin.macro';
import CloseIcon from '../../icons/CloseIcon';

const styles: IStandardStyle = {
  header: {
    light: [tw`border-b`],
    dark: [],
    jupiter: [],
  },
};

export const Header: FC<{ onClose: () => void; showProfilePic?: boolean }> = memo(
  ({ onClose, showProfilePic = true }) => {
    const { theme, telegramConfig } = useUnifiedWalletContext();
    const { publicKey } = useUnifiedWallet();
    const [userName, setUsername] = useState('');
    const [profilePic, setProfilePic] = useState('');
    useEffect(() => {
      try {
        if (telegramConfig && publicKey) {
          const { initData } = retrieveLaunchParams();
          setUsername(initData?.user?.username || publicKey?.toBase58());
          setProfilePic(initData?.user?.photoUrl || '');
        }
      } catch (e) {
        setUsername('');
      }
    }, [telegramConfig, publicKey]);
    return (
      <div css={[tw`pb-4 flex w-full items-center justify-between leading-none`, styles.header[theme]]}>
        {showProfilePic ? (
          <div tw="flex items-center gap-2">
            <div tw="w-8 h-8 relative overflow-hidden rounded-full">
              {profilePic ? (
                <img
                  tw="object-cover w-full h-full"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  alt={'Profile Image'}
                  src={profilePic}
                />
              ) : (
                <div tw="w-full h-full bg-gray-300" />
              )}
            </div>
            <span tw="font-semibold truncate max-w-[300px]">{userName}</span>
          </div>
        ) : (
          <div />
        )}
        <button css={[tw`focus-within:outline-none`]} onClick={onClose}>
          <CloseIcon width={14} height={14} />
        </button>
      </div>
    );
  },
);
