import styled from '@emotion/styled';
import { formatUnits } from 'viem';

import { Token } from '@/constants/tokens';
import { cn } from '@/utils/cn';

export type TokenSelectionItemProps = Token & {
  balance?: bigint;
  selected: boolean;
  onClick?: () => void;
};

export const TokenSelectionItem: React.FC<TokenSelectionItemProps> = ({
  balance,
  selected,
  onClick,
  ...token
}) => {
  return (
    <Container
      className={cn(
        'hover:bg-emerald-100/80 dark:hover:bg-emerald-300/10',
        selected
          ? 'selected bg-emerald-200 dark:bg-emerald-200/20'
          : 'bg-white dark:bg-slate-800',
      )}
      onClick={onClick}
    >
      <TokenLogo alt={token.symbol} src={token.logo} />

      <Info>
        <span className="symbol">{token.symbol}</span>
        <span className="balance">
          {typeof balance === 'undefined'
            ? '-'
            : formatUnits(balance, token.decimals)}
        </span>
      </Info>
    </Container>
  );
};

const Container = styled.li`
  padding: 12px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;

  span.symbol {
    font-size: 16px;
    font-weight: 500;
    line-height: 130%;
    color: #1f2937;

    .dark & {
      color: #f3f4f6;
    }
  }

  span.balance {
    font-size: 14px;
    font-weight: 500;
    line-height: 130%;
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .dark & {
      color: #9ca3af;
    }
  }
`;

const TokenLogo = styled.img`
  margin-right: 12px;
  width: 32px;
  height: 32px;
  object-fit: contain;
`;

const Info = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
