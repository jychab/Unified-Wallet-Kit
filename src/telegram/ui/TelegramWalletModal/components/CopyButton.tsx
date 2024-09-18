import { FC, useState } from 'react';
import tw from 'twin.macro';
import { IStandardStyle, useUnifiedWalletContext } from '../../../../contexts/UnifiedWalletContext';
import SuccessIcon from '../../../../icons/SuccessIcon';
import CopyIcon from '../../icons/CopyIcon';

const styles: IStandardStyle = {
  walletButton: {
    light: [tw`bg-[#F9FAFB] hover:bg-black/5`],
    dark: [tw`bg-white/10 hover:bg-white/20 border border-white/10 shadow-lg`],
    jupiter: [tw`bg-white/5 hover:bg-white/20 border border-white/10 shadow-lg`],
  },
};
const CopyButton: FC<{ text: string }> = ({ text }) => {
  const [isCopied, setIsCopied] = useState(false);

  const { theme } = useUnifiedWalletContext();
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);

      // Revert back to "Copy" after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button onClick={handleCopy} css={styles.walletButton[theme]} tw="px-2 py-1 text-sm w-fit font-semibold rounded-lg">
      {isCopied ? (
        <span id="success-message" css={tw`inline-flex  gap-2 items-center`}>
          <SuccessIcon width={14} height={14} />
          <span css={tw`font-semibold `}>Copied</span>
        </span>
      ) : (
        <span id="default-message" css={tw`inline-flex  gap-2 items-center`}>
          <CopyIcon width={14} height={14} />
          <span css={tw`font-semibold `}>Copy</span>
        </span>
      )}
    </button>
  );
};

export default CopyButton;
