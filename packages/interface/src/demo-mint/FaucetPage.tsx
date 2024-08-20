import styled from '@emotion/styled';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { waitForTransactionReceipt } from '@wagmi/core';
import { GiftIcon } from 'lucide-react';
import Image from 'next/image';
import { Faucet__factory } from 'planck-demo-contracts/typechain/factories/Faucet__factory';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { parseUnits } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';

import bitcoinFaucetBg from '@/assets/bitcoin-faucet-bg.jpg';
import { FeatureHeader } from '@/components/FeatureHeader';
import { wBTC } from '@/constants/tokens';
import { config } from '@/constants/wagmi';
import { wBTC_FAUCET_ADDRESS } from '@/helper/eth/config';
import { CUSTODY } from '@/helper/sui/config';
import { toastTransaction } from '@/utils/toast';

export const shortenAddress = (address: string): string => {
  if (address.length <= 6) {
    return address;
  }
  return address.slice(0, 6) + '...' + address.slice(-4);
};

const formatCoinType = (value: string) => {
  const addressMatch = value.match(/^(0x[a-fA-F0-9]{1,64})(?:::.*)?$/);
  return (
    shortenAddress(addressMatch ? addressMatch[1] : value) +
    value.replace(addressMatch?.[1] || '', '')
  );
};

export default function FaucetPage() {
  const { address, isConnected } = useAccount();

  const rpcUrl = getFullnodeUrl('testnet');
  const client = new SuiClient({ url: rpcUrl });

  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  useEffect(() => {
    const fetchTotalSupply = async () => {
      const treasury = await client.getObject({
        id: CUSTODY.OBJECT_ID.BTC_TREASURY,
        options: { showContent: true },
      });
      const totalSupply =
        // @ts-ignore
        treasury.data?.content?.fields?.cap?.fields?.total_supply.fields;
      setTotalSupply(parseFloat(totalSupply.value) / 10 ** 9);
    };

    fetchTotalSupply();
  }, []);

  const { writeContractAsync } = useWriteContract();

  const [isTxInFlight, setTxInFlight] = useState<boolean>(false);
  const onClickFaucet = useCallback(async () => {
    if (isTxInFlight) {
      return;
    }
    if (!isConnected) {
      toast.error('Wallet not connected');
      return;
    }
    if (!address) {
      toast.error('No address found');
      return;
    }

    setTxInFlight(true);

    const promise = (async () => {
      const amount = parseUnits('1', wBTC.decimals);

      const hash = await writeContractAsync({
        address: wBTC_FAUCET_ADDRESS,
        abi: Faucet__factory.abi,
        functionName: 'requestFaucet',
        args: [amount],
      });

      return waitForTransactionReceipt(config, { hash });
    })();

    toastTransaction(promise).finally(() => {
      setTxInFlight(false);
    });
  }, [address, isConnected, isTxInFlight, writeContractAsync]);

  return (
    <div className="my-[80px] w-full max-w-[600px] mx-auto gap-[10px] flex flex-col">
      <FeatureHeader icon={<GiftIcon size={20} />}>
        {/* */}
        Faucet
      </FeatureHeader>

      <div className="flex flex-col gap-2 items-center w-full">
        <ButtonWrapper className="w-fit" onClick={onClickFaucet}>
          <Background alt="" src={bitcoinFaucetBg} width={486} height={620} />
          <Title>
            Request <br />
            Bitcoin
          </Title>
        </ButtonWrapper>
        <Circle />
        <div className="flex flex-col items-center">
          <Name>wBTC</Name>
          <Badge>{formatCoinType(wBTC.typeArgument)}</Badge>

          <TotalSupply>
            {!totalSupply
              ? '-'
              : totalSupply?.toLocaleString(undefined, {
                  maximumFractionDigits: 9,
                })}{' '}
            Minted
          </TotalSupply>
        </div>
      </div>
    </div>
  );
}

const ButtonWrapper = styled.div`
  margin-top: 16px;

  width: 240px;
  height: 310px;
  position: relative;
  z-index: 0;

  display: flex;
  padding: 20px;

  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);

    & > div {
      box-shadow: 0px 8px 38.6px 0px rgba(193, 193, 193, 0.85);
    }
  }
`;
const Background = styled(Image)`
  width: 100%;
  height: 100%;

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  filter: saturate(105%);

  border-radius: 12.8px;
  border: 1px solid #ffbfcb;

  background:
    linear-gradient(to bottom, #ffbfcb, #a6fffc) padding-box,
    linear-gradient(155deg, #ffbfcb 5.24%, #ffd89c 47.83%, #a6fffc 92.16%)
      border-box;
  border: 1px solid transparent;

  box-shadow:
    0px -8px 32px 0px rgba(255, 107, 125, 0.45),
    0px 8px 32px 0px rgba(93, 224, 239, 0.66);

  .dark & {
    box-shadow:
      0px -9px 36px 0px rgba(255, 107, 125, 0.22),
      0px 12px 32px 0px rgba(93, 224, 239, 0.22);
  }
`;
const Title = styled.h2`
  color: #fff;
  text-shadow: 0px 6.915px 17.289px rgba(138, 0, 0, 0.25);
  font-size: 36px;
  font-weight: 700;
  line-height: 92%; /* 33.12px */
  letter-spacing: -1.8px;
`;

const Circle = styled.div`
  margin-top: -264px;
  margin-bottom: -250px;

  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: linear-gradient(180deg, #d1d9e6 0%, rgba(209, 217, 230, 0) 60.7%);

  .dark & {
    background: linear-gradient(
      180deg,
      #1e293b 0%,
      rgba(82, 112, 161, 0) 62.5%
    );
  }
`;
const Name = styled.h3`
  margin-top: 22px;

  color: #0f2447;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  line-height: 92%; /* 18.4px */
  letter-spacing: -1px;

  z-index: 1;

  .dark & {
    color: white;
  }
`;
const Badge = styled.div`
  margin-top: 12px;
  padding: 4px;

  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #e7effc;

  color: #2d4362;
  font-size: 14px;
  font-weight: 500;
  line-height: 92%; /* 12.88px */
  letter-spacing: -0.7px;

  .dark & {
    background: #1e293b;
    color: #94a3b8;
  }
`;
const TotalSupply = styled.span`
  margin-top: 8px;

  color: #2d4362;
  font-size: 14px;
  font-weight: 500;
  line-height: 92%; /* 12.88px */
  letter-spacing: -0.7px;

  z-index: 1;

  .dark & {
    color: #94a3b8;
  }
`;
