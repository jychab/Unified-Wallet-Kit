import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPublicKey, sendEmailOTP, verifyAndGetPublicKey, verifyEmailOTP } from 'src/telegram/backend';
import tw from 'twin.macro';
import { useTranslation } from '../../../contexts/TranslationProvider';
import { IStandardStyle, useUnifiedWallet, useUnifiedWalletContext } from '../../../contexts/UnifiedWalletContext';
import { Header } from '../TelegramWalletModal/components/Header';
import SpinnerIcon from '../icons/SpinnerIcon';

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
        setIsUserLoggedInToTelegram(false);
      }
    }
  }, [telegramConfig]);

  return (
    <div tw="flex flex-col justify-center items-center p-10">
      <img src={'https://unified.jup.ag/new_user_onboarding.png'} width={160} height={160} />

      <div tw="mt-4 flex flex-col justify-center items-center text-center">
        <span tw="text-lg font-semibold">{t(`Create a custodial wallet on ${botUsername}`)}</span>
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
              styles.button[theme],
            ]}
            onClick={async () => {
              const { initDataRaw } = retrieveLaunchParams();
              if (!telegramConfig || !initDataRaw) return;
              try {
                setLoading(true);
                await createPublicKey(telegramConfig.backendEndpoint, initDataRaw);
              } catch (e) {
                console.log('Already created');
                await verifyAndGetPublicKey(telegramConfig.backendEndpoint, initDataRaw);
              } finally {
                setLoading(false);
                setFlow('Add Email');
              }
            }}
          >
            {loading ? <SpinnerIcon /> : t(`Create Wallet`)}
          </button>
        )}
      </div>
    </div>
  );
};

export const TelegramEmailInput: React.FC<{
  flow: ITelegramOnboardingFlow;
  setFlow: (flow: ITelegramOnboardingFlow) => void;
  email: string;
  setEmail: (email: string) => void;
  onClose: () => void;
}> = ({ flow, setFlow, email, setEmail, onClose }) => {
  const { theme, telegramConfig } = useUnifiedWalletContext();
  const { t } = useTranslation();
  const [error, setError] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const { initDataRaw } = retrieveLaunchParams();
          if (!telegramConfig || !initDataRaw) return;
          sendEmailOTP(telegramConfig.backendEndpoint, initDataRaw, email);
          setFlow('Verify Email');
        } catch (e) {
          setError('User not found. Please log in to telegram and try again.');
        }
      }}
      tw="flex flex-col gap-4 justify-center "
    >
      <span tw="text-base font-semibold">
        {t(`Successfully created your wallet. Add an email to recover your wallet in case of emergencies. (Optional)`)}
      </span>
      <div tw="mt-4 w-full space-y-2">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          css={[
            tw`flex w-full text-base p-4 border border-white/50 leading-none rounded-lg focus-within:outline-none font-semibold`,
            styles.button[theme],
          ]}
        />
      </div>
      <button
        type="submit"
        css={[
          tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-5 leading-none`,
          styles.button[theme],
        ]}
      >
        {t(`Verify`)}
      </button>
      {error && <span tw="text-warning text-sm">{error}</span>}
      <button
        type="button"
        css={[tw`mt-3 text-xs text-white/50 font-semibold`, styles.subtitle[theme]]}
        onClick={() => onClose()}
      >
        {t(`Skip`)}
      </button>
    </form>
  );
};

export const TelegramEmailVerification: React.FC<{
  flow: ITelegramOnboardingFlow;
  setFlow: (flow: ITelegramOnboardingFlow) => void;
  email: string;
  onClose: () => void;
}> = ({ flow, setFlow, email, onClose }) => {
  const { theme, telegramConfig } = useUnifiedWalletContext();
  const { connect } = useUnifiedWallet();
  const [error, setError] = useState('');
  const { t } = useTranslation();

  // Create refs for the 6 input fields
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // State to keep track of the countdown time in seconds (2 minutes = 120 seconds)
  const [countdown, setCountdown] = useState(120);

  // Handle the change event
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    // If the input has a value, move focus to the next input
    if (value.length === 1 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle the key down event to detect backspace
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      // If the input is empty and the user presses backspace, move focus to the previous input
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle input to ensure only numbers are entered
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (!/^\d*$/.test(value)) {
      e.currentTarget.value = value.replace(/\D/g, ''); // Replace non-numeric characters
    }
  };

  // Countdown effect that runs every second
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [countdown]);

  // Format the countdown as mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle resend OTP
  const handleResendOtp = () => {
    try {
      const { initDataRaw } = retrieveLaunchParams();
      if (!telegramConfig || !initDataRaw) return;
      // Reset countdown and mark OTP as resent
      sendEmailOTP(telegramConfig.backendEndpoint, initDataRaw, email);
      setCountdown(120);
    } catch (e) {
      setError('User not found. Please log in to telegram and try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    try {
      const { initDataRaw } = retrieveLaunchParams();
      if (!telegramConfig || !initDataRaw) return;
      // Reset countdown and mark OTP as resent
      verifyEmailOTP(
        telegramConfig.backendEndpoint,
        initDataRaw,
        parseInt(inputRefs.current.map((x) => x && x.value).join('')),
      ).then(() => {
        connect();
      });
    } catch (e) {
      setError('User not found. Please log in to telegram and try again.');
    }
  };
  return (
    <form onSubmit={handleSubmit} tw="flex flex-col gap-8 justify-center">
      <span tw="text-base font-semibold">{t(`Please enter the One Time Password (OTP) sent to your email.`)}</span>
      <div tw="w-full space-y-2">
        <div tw="flex items-center gap-x-4">
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <input
                required
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                css={[
                  tw`flex w-10 h-10 text-xl p-2 border text-center border-white/50 leading-none rounded-lg focus-within:outline-none font-semibold`,
                  styles.button[theme],
                ]}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }} // Assign ref to each input
                onChange={(e) => handleInputChange(e, index)} // Handle input change
                onKeyDown={(e) => handleKeyDown(e, index)} // Handle backspace key press
                onInput={handleInput} // Ensure only numeric input is allowed
              />
            ))}
        </div>
        <p css={[tw`text-sm text-white/50`, styles.subtitle[theme]]}>
          {countdown > 0 ? (
            <>
              This passcode will only be valid for the next <span tw="font-bold">{formatTime(countdown)}</span>.
            </>
          ) : (
            <span tw="font-bold text-red-500">Passcode expired</span>
          )}
        </p>
      </div>

      {countdown > 0 ? (
        <button
          type="submit"
          disabled={countdown <= 0} // Disable button if countdown has expired
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-5 leading-none`,
            countdown <= 0 && tw`opacity-50 cursor-not-allowed`, // Style for disabled button
            styles.button[theme],
          ]}
        >
          {t(`Confirm`)}
        </button>
      ) : (
        <button
          type="button"
          css={[
            tw`text-white font-semibold text-base w-full rounded-lg border border-white/10 py-5 leading-none`,
            styles.button[theme],
          ]}
          onClick={handleResendOtp}
        >
          {t(`Resend OTP`)}
        </button>
      )}
      {error && <span tw="text-warning text-sm">{error}</span>}
      <button
        type="button"
        css={[tw`mt-3 text-xs text-white/50 font-semibold`, styles.subtitle[theme]]}
        onClick={() => onClose()}
      >
        {t(`Skip`)}
      </button>
    </form>
  );
};

export type ITelegramOnboardingFlow = 'Onboarding' | 'Add Email' | 'Verify Email';
export const TelegramOnboardingFlow = ({
  botUsername,
  onClose,
}: {
  botUsername: string | undefined;
  onClose: () => void;
}) => {
  const [flow, setFlow] = useState<ITelegramOnboardingFlow>('Onboarding');
  const [animateOut, setAnimateOut] = useState(false);
  const [email, setEmail] = useState('');

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
      <Header showProfilePic={false} onClose={onClose} />
      {flow === 'Onboarding' ? (
        <TelegramOnboardingIntro flow={flow} setFlow={setFlowAnimated} botUsername={botUsername || ''} />
      ) : null}
      {flow === 'Add Email' ? (
        <TelegramEmailInput flow={flow} setFlow={setFlowAnimated} onClose={onClose} email={email} setEmail={setEmail} />
      ) : null}
      {flow === 'Verify Email' ? (
        <TelegramEmailVerification flow={flow} setFlow={setFlowAnimated} onClose={onClose} email={email} />
      ) : null}
    </div>
  );
};
