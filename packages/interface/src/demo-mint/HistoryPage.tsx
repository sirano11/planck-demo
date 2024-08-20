import styled from '@emotion/styled';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
// import { useWallet } from '@suiet/wallet-kit';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRightLeftIcon,
  ArrowUpRightIcon,
  HistoryIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import colors from 'tailwindcss/colors';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';

import { FeatureHeader } from '@/components/FeatureHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TOKENS } from '@/constants';
import { Token, lMINT, wBTC } from '@/constants/tokens';
import { ChainIdentifier } from '@/helper/eth/config';
import { SuiExplorer } from '@/helper/explorer';
import { PROTOCOL_PACKAGE_ID, ProtocolPackageId } from '@/helper/sui/config';
import { useActorAddress } from '@/hooks/useActorAddress';
import { cn } from '@/utils/cn';

export const queryPastEvents = async (client: SuiClient, address?: string) => {
  // Since Testnet RPC does not support `queryEvents`
  const { data } = await client.queryTransactionBlocks({
    limit: 50,
    order: 'descending',
    filter: {
      MoveFunction: {
        package: PROTOCOL_PACKAGE_ID,
        module: 'market',
      },
    },
  });

  const blocks = await client.multiGetTransactionBlocks({
    digests: data.map((v) => v.digest),
    options: { showEvents: true },
  });

  let events = blocks
    .map((v) =>
      (v.events || []).map((e) => ({
        ...e,
        timestampMs: v.timestampMs || null,
      })),
    )
    .flat() as MarketEvent[];

  // sort events by timestamp
  events = events.sort((a, b) => {
    if (!a.timestampMs || !b.timestampMs) return 0;
    return parseInt(b.timestampMs) - parseInt(a.timestampMs);
  });

  // filter events by address using `requester` field
  // TODO: Move this to filter in the query
  if (address) {
    events = events.filter((v) => v.parsedJson.requester === address);
  }

  return events;
};

export default function HistoryPage() {
  const { address } = useAccount();
  const { actorAddress } = useActorAddress({
    address,
    chain: ChainIdentifier.Sui,
  });

  const [events, setEvents] = useState<MarketEvent[]>([]);
  useEffect(() => {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    queryPastEvents(client, actorAddress || undefined).then((_events) =>
      setEvents(_events),
    );
  }, [actorAddress]);

  return (
    <div className="my-[80px] w-full max-w-[600px] mx-auto gap-[10px] flex flex-col">
      <FeatureHeader icon={<HistoryIcon size={20} />}>
        {/* */}
        History
      </FeatureHeader>

      <div className="flex flex-col gap-2">
        {events.map((event, i) => {
          const functionName = ((type: string) => {
            const name = type.split('::').pop();
            if (name === 'CoinSwapped') return 'Coin Swapped';
            if (name === 'LMintToBtc') return 'Burn';
            if (name === 'BtcToLmint') return 'Mint';
          })(event.type);

          const distanceToNow = !event.timestampMs
            ? 'Invalid Date'
            : formatDistanceToNow(new Date(parseInt(event.timestampMs)), {
                addSuffix: true,
              });

          let fromCoin: Token;
          let toCoin: Token;

          let fromAmount: string;
          let toAmount: string;
          let returnedAmount: string | null = null;

          if (event.type === `${PROTOCOL_PACKAGE_ID}::market::BtcToLmint`) {
            fromCoin = wBTC;
            toCoin = lMINT;

            fromAmount = event.parsedJson.btc_amount;
            toAmount = event.parsedJson.returned_lmint;
            returnedAmount = event.parsedJson.returned_btc;
          } else if (
            event.type === `${PROTOCOL_PACKAGE_ID}::market::LMintToBtc`
          ) {
            fromCoin = lMINT;
            toCoin = wBTC;

            fromAmount = event.parsedJson.lmint_amount;
            toAmount = event.parsedJson.returned_btc;
            returnedAmount = event.parsedJson.returned_lmint;
          } else {
            // event.type === `${PROTOCOL_PACKAGE_ID}::market::CoinSwapped`
            fromCoin = TOKENS.find(
              (v) => v.typeArgument === '0x' + event.parsedJson.from_coin,
            )!;
            toCoin = TOKENS.find(
              (v) => v.typeArgument === '0x' + event.parsedJson.to_coin,
            )!;

            fromAmount = event.parsedJson.from_amount;
            toAmount = event.parsedJson.to_amount;
          }

          const id = `${event.id.txDigest}-${event.id.eventSeq}`;

          return (
            <StyledCard key={id} id={id}>
              <CardHeader className="pt-2 px-3 flex flex-row items-center gap-3">
                <div className="w-[32px] h-[32px] rounded-full border border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 flex items-center justify-center">
                  <ArrowRightLeftIcon size={18} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[15px] font-medium">
                    Swap{' '}
                    <span
                      className={cn(
                        'ml-0.5 rounded-[4px] p-[2px] text-[12px] leading-[92%] inline-flex items-center justify-center w-fit',
                        functionName === 'Mint' &&
                          'bg-green-100 text-[#00AA67] dark:bg-[rgba(110,231,183,0.40)] dark:text-[#43FFB4]',
                        functionName === 'Burn' &&
                          'bg-[rgba(255,107,125,0.30)] text-[#C6273A] dark:bg-[rgba(255,107,125,0.40)] dark:text-[#FFA2AD]',
                        functionName === 'Coin Swapped' &&
                          'bg-blue-100 text-blue-500 dark:bg-blue-500/30 dark:text-[#a5ccff]',
                      )}
                    >
                      {functionName}
                    </span>
                  </h3>

                  <div className="flex items-center">
                    {/* Timestamp */}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {distanceToNow} ·
                    </span>

                    {/* Explorer Link */}
                    <a
                      className="ml-1.5 text-xs hover:underline px-1 flex flex-items gap-1 rounded-sm bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                      href={SuiExplorer.getTxLink(event.id.txDigest)}
                      target="_blank"
                    >
                      {event.id.txDigest.slice(0, 8)}...
                      <ArrowUpRightIcon size={16} />
                    </a>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-3 pb-3 flex flex-row gap-3">
                <div className="flex flex-col bg-slate-100 dark:bg-slate-800 flex-1 h-fit px-2 py-2 pt-2.5 rounded-lg gap-1">
                  <h4 className="text-slate-700 dark:text-slate-300 text-xs mb-0.5 font-medium">
                    Sent
                  </h4>
                  <CoinBadge>
                    <TokenLogo alt={fromCoin.symbol} src={fromCoin.logo} />
                    <span>
                      {formatUnits(BigInt(fromAmount), 9)} {fromCoin.symbol}
                    </span>
                  </CoinBadge>
                </div>

                <div className="flex flex-col bg-slate-100 dark:bg-slate-800 flex-1 h-fit px-2 py-2 pt-2.5 rounded-lg gap-1">
                  <h4 className="text-slate-700 dark:text-slate-300 text-xs mb-0.5 font-medium">
                    Received
                  </h4>
                  <span className="inline-flex items-center">
                    <CoinBadge>
                      <TokenLogo alt={toCoin.symbol} src={toCoin.logo} />
                      <span>
                        {formatUnits(BigInt(toAmount), 9)} {toCoin.symbol}
                      </span>
                    </CoinBadge>
                  </span>
                  {returnedAmount && parseFloat(returnedAmount) > 0 && (
                    <CoinBadge>
                      <TokenLogo alt={fromCoin.symbol} src={fromCoin.logo} />
                      <span>
                        {formatUnits(BigInt(returnedAmount), 9)}{' '}
                        {fromCoin.symbol}
                      </span>
                    </CoinBadge>
                  )}
                </div>
              </CardContent>
            </StyledCard>
          );
        })}
      </div>
    </div>
  );
}

export type EventId = {
  txDigest: string;
  eventSeq: string;
};

export type DefaultEvent = {
  id: EventId;
  packageId: string;
  transactionModule: string;
  sender: string;
  bcs: string;
};

export type CoinSwapped = DefaultEvent & {
  type: `${ProtocolPackageId}::market::CoinSwapped`;
  parsedJson: {
    requester: string;
    from_amount: string;
    from_coin: string;
    to_amount: string;
    to_coin: string;
  };
};
export type LMintToBTC = DefaultEvent & {
  type: `${ProtocolPackageId}::market::LMintToBtc`;
  parsedJson: {
    requester: string;
    lmint_amount: string;
    returned_lmint: string;
    returned_btc: string;
  };
};
export type BTCToLMint = DefaultEvent & {
  type: `${ProtocolPackageId}::market::BtcToLmint`;
  parsedJson: {
    requester: string;
    btc_amount: string;
    returned_lmint: string;
    returned_btc: string;
  };
};

type BlockInfo = {
  timestampMs: string | null;
};

// TODO: Recategorize events into (CoinSwapped + CoinReturned)
// Backlog: https://www.notion.so/aleph-research/Event-81abd01cc9c442a5aad1f34c40845d30?pvs=4
export type MarketEvent = (CoinSwapped | LMintToBTC | BTCToLMint) & BlockInfo;

const StyledCard = styled(Card)`
  border-radius: 12px;

  box-shadow: 0px 6px 18px 0px rgba(222, 225, 240, 0.48);

  .dark & {
    box-shadow: 0px 6px 18px 0px rgba(30, 41, 59, 0.48);
  }
`;
const TokenLogo = styled.img`
  object-fit: contain;
  flex-shrink: 0;
`;

const CoinBadge = styled.span`
  display: inline-flex;
  align-items: center;

  gap: 6px;

  span {
    font-weight: 500;
    font-size: 13px;
    line-height: 100%;
    color: ${colors.slate[600]};

    .dark & {
      color: ${colors.slate[400]};
    }
  }

  ${TokenLogo} {
    width: 16px;
    height: 16px;
  }
`;
