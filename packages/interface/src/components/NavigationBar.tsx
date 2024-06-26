import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { NextPage } from 'next';
import Link from 'next/link';
import { useAccount, useBalance } from 'wagmi';

const NavigationBar: React.FC = () => {
  const { address, isConnected } = useAccount();
  const {
    data: balanceData,
    isError,
    isLoading,
  } = useBalance({
    address,
  });

  return (
    // FIXME: Replace with shadcn-ui components
    <div className="fixed top-0 w-full left-0 right-0 bg-white flex items-center gap-4">
      <span className="text-black">Planck Demo</span>
      <ul className="flex gap-4">
        <li className="text-black">
          <Link href="/mint">Mint</Link>
        </li>
        <li className="text-black">
          <Link href="/solana">Solana</Link>
        </li>
      </ul>
      {!isConnected ? (
        <ConnectButton />
      ) : (
        <div>
          <p>지갑 주소: {address}</p>
          {isLoading && <p>잔액 불러오는 중...</p>}
          {isError && <p>잔액 불러오기 실패</p>}
          {balanceData && (
            <div>
              <p>
                잔액:{' '}
                {ethers.utils.formatUnits(
                  balanceData.value,
                  balanceData.decimals,
                )}{' '}
                {balanceData.symbol}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavigationBar;
