import styled from '@emotion/styled';

import { cn } from '@/utils/cn';

export type Token = {
  type: string;
  symbol: string;
  coinGeckoId?: string;
  logo?: string;
};

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
      className={cn('hover:bg-slate-100', selected && 'selected bg-[#9febd5]')}
      onClick={onClick}
    >
      <TokenLogo alt={token.symbol} src={token.logo} />

      <Info>
        <span className="symbol">{token.symbol}</span>
        <span className="balance">
          {/* TODO: Format balances */}
          {!balance ? '-' : balance}
        </span>
      </Info>
    </Container>
  );
};

const Container = styled.li`
  padding: 10px;

  display: flex;
  align-items: center;

  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;

  span.symbol {
    font-family: var(--HafferFontStack);
    font-weight: 600;
    font-size: 16px;
    line-height: 130%;
  }

  span.balance {
    font-weight: 500;
    font-size: 14px;
    line-height: 130%;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.selected {
    span.symbol {
      /* color:  */
    }

    span.balance {
      /* color:  */
    }
  }
`;

const TokenLogo = styled.img`
  margin-right: 9.75px;

  width: 40px;
  height: 40px;
  object-fit: contain;
`;
const Info = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
