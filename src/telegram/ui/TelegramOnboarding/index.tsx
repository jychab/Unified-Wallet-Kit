import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPublicKey, verifyAndGetPublicKey } from 'src/telegram/backend';
import { getOrCreateTelegramAdapter } from 'src/telegram/helpers';
import tw from 'twin.macro';
import { useTranslation } from '../../../contexts/TranslationProvider';
import { IStandardStyle, useUnifiedWalletContext } from '../../../contexts/UnifiedWalletContext';
import { Header } from '../TelegramWalletModal/components/Header';

const styles: IStandardStyle = {
  subtitle: {
    light: [tw`text-black/70`],
    dark: [tw`text-white/50`],
    jupiter: [tw`text-white/50`],
  },
  button: {
    light: [tw`bg-[#31333B] text-white hover:bg-black`],
    dark: [tw`bg-[#31333B] hover:bg-black/30`],
    jupiter: [tw`bg-black hover:bg-black/50`],
  },
  walletButton: {
    light: [tw`bg-[#F9FAFB] hover:bg-black/5`],
    dark: [tw`bg-white/10 hover:bg-white/20 border border-white/10 shadow-lg`],
    jupiter: [tw`bg-white/5 hover:bg-white/20 border border-white/10 shadow-lg`],
  },
  externalIcon: {
    light: [tw`text-black/30`],
    dark: [tw`text-white/30`],
    jupiter: [tw`text-white/30`],
  },
};

export const TelegramOnboardingIntro: React.FC<{
  botUsername: string;
  flow: ITelegramOnboardingFlow;
  setFlow: (flow: ITelegramOnboardingFlow) => void;
}> = ({ flow, setFlow, botUsername }) => {
  const { theme, telegramConfig } = useUnifiedWalletContext();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [isUserLoggedInToTelegram, setIsUserLoggedInToTelegram] = useState(false);
  useEffect(() => {
    if (telegramConfig) {
      try {
        retrieveLaunchParams();
        setIsUserLoggedInToTelegram(true);
      } catch (e) {
        setIsUserLoggedInToTelegram(true);
      }
    }
  }, [telegramConfig]);

  return (
    <div tw="flex flex-col justify-center items-center">
      <img src={'https://unified.jup.ag/new_user_onboarding.png'} width={160} height={160} />
      <div tw="mt-4 flex flex-col justify-center items-center text-center">
        <span tw="text-lg font-semibold">{t(`Create a custodial wallet for @${botUsername}`)}</span>
        <span tw="mt-3 text-sm " css={[styles.subtitle[theme]]}>
          {t(isUserLoggedInToTelegram == false ? `Login with telegram to get started` : ``)}
        </span>
      </div>
      <div tw="mt-6 w-full justify-center flex">
        {!isUserLoggedInToTelegram ? (
          <div css={[tw` font-semibold border px-4 py-2 rounded`, styles.button[theme]]}>
            <a href={telegramConfig?.botDirectLink} target="_blank" rel="noopener noreferrer">
              <span>{t(`Log In With Telegram`)}</span>
            </a>
          </div>
        ) : (
          <button
            type="button"
            disabled={loading}
            css={[
              tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-5 flex items-center justify-center leading-none`,
              loading && tw`opacity-50 cursor-not-allowed`,
              styles.button[theme],
            ]}
            onClick={async () => {
              try {
                const { initDataRaw } = retrieveLaunchParams();
                if (!telegramConfig || !initDataRaw) return;
                setLoading(true);
                if (await createPublicKey(telegramConfig.backendEndpoint, initDataRaw)) {
                  setFlow('Created');
                } else if (await verifyAndGetPublicKey(telegramConfig.backendEndpoint, initDataRaw)) {
                  setFlow('Already Created');
                } else {
                  setFlow('Error');
                }
              } catch (e) {
                setFlow('Error');
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? t(`Creating Wallet...`) : t(`Create Wallet`)}
          </button>
        )}
      </div>
    </div>
  );
};

export const TelegramOnboardingCompletion: React.FC<{
  title: string;
  subtitle: string;
  btnText: string;
  image: string;
  btnOnClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ title, subtitle, image, btnText, btnOnClick }) => {
  const { theme } = useUnifiedWalletContext();
  const { t } = useTranslation();

  return (
    <div tw="flex flex-col justify-center items-center">
      <img src={image} width={160} height={160} alt="" />
      <div tw="mt-4 flex flex-col justify-center items-center text-center">
        <span tw="text-lg font-semibold">{t(`${title}`)}</span>
        <span tw="mt-3 text-sm " css={[styles.subtitle[theme]]}>
          {subtitle}
        </span>
      </div>
      <div tw="mt-6 w-full justify-center flex">
        <button
          type="button"
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-5 px-4 flex items-center justify-center leading-none`,
            styles.button[theme],
          ]}
          onClick={btnOnClick}
        >
          {t(`${btnText}`)}
        </button>
      </div>
    </div>
  );
};

export type ITelegramOnboardingFlow = 'Onboarding' | 'Created' | 'Already Created' | 'Error';
export const TelegramOnboardingFlow = ({
  botUsername,
  onClose,
}: {
  botUsername: string | undefined;
  onClose: () => void;
}) => {
  const { handleConnectClick, telegramConfig, setShowWalletModal, setTransactionSimulation } =
    useUnifiedWalletContext();
  const [flow, setFlow] = useState<ITelegramOnboardingFlow>('Onboarding');
  const [animateOut, setAnimateOut] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const setFlowAnimated = (flow: ITelegramOnboardingFlow) => {
    setAnimateOut(true);

    setTimeout(() => {
      contentRef.current?.scrollTo(0, 0);
      setAnimateOut(false);
      setFlow(flow);
    }, 200);
  };

  return (
    <div
      ref={contentRef}
      css={[tw`duration-500 animate-fade-in overflow-y-scroll`, animateOut ? tw`animate-fade-out opacity-0` : '']}
      className="hideScrollbar"
    >
      <div tw="flex flex-col justify-center items-center p-10">
        <Header showProfilePic={false} onClose={onClose} />
        {flow === 'Onboarding' ? (
          <TelegramOnboardingIntro flow={flow} setFlow={setFlowAnimated} botUsername={botUsername || ''} />
        ) : null}
        {flow === 'Created' ? (
          <TelegramOnboardingCompletion
            title={'Wallet Successfully Created'}
            subtitle={`You are all set!`}
            btnText={`Explore @${botUsername}`}
            image="https://buckets.blinksfeed.com/success.gif"
            btnOnClick={(e) => {
              if (telegramConfig) {
                handleConnectClick(
                  e,
                  getOrCreateTelegramAdapter(telegramConfig, setTransactionSimulation, setShowWalletModal),
                );
                onClose();
              }
            }}
          />
        ) : null}
        {flow === 'Already Created' ? (
          <TelegramOnboardingCompletion
            title={`Wallet Already Created`}
            subtitle={'You are all set!'}
            btnText={`Explore @${botUsername}`}
            image="https://buckets.blinksfeed.com/success.gif"
            btnOnClick={(e) => {
              if (telegramConfig) {
                handleConnectClick(
                  e,
                  getOrCreateTelegramAdapter(telegramConfig, setTransactionSimulation, setShowWalletModal),
                );
                onClose();
              }
            }}
          />
        ) : null}
        {flow === 'Error' ? (
          <TelegramOnboardingCompletion
            title={'An error occurred while attempting to create your wallet.'}
            subtitle={`Contact @${botUsername}`}
            btnText={'Try Again'}
            image="https://buckets.blinksfeed.com/error.png"
            btnOnClick={() => setFlow('Onboarding')}
          />
        ) : null}
      </div>
    </div>
  );
};
