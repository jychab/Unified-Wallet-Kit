import { FC } from 'react';
import { ITelegramWalletFlow } from '.';
import { TokenList } from './components/TokenList';

export const MainPage: FC<{
  setSelectedToken: (selectedToken: any | undefined) => void;
  setFlow: (flow: ITelegramWalletFlow) => void;
}> = ({ setFlow, setSelectedToken }) => {
  return <TokenList setFlow={setFlow} setSelectedToken={setSelectedToken} />;
};
