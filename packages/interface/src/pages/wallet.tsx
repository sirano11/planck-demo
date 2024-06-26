import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { useAccount, useBalance } from 'wagmi';

export default function WalletPage() {
  const { address, isConnected } = useAccount();
  const {
    data: balanceData,
    isError,
    isLoading,
  } = useBalance({
    address,
  });

  return (
    <div>
      <h1>지갑 연동</h1>
      <ConnectButton />
      {isConnected && (
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
}
