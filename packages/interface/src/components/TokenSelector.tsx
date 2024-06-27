import styled from '@emotion/styled';
import { useEffect, useState } from 'react';

import { fixedWidth } from '@/styles/helpers';

import { Token, TokenSelectionItem } from './TokenSelectionItem';

type TokenSelectorProps = {
  id: string;
  selectedToken: Token;
  tokens: Token[];
  onChange: (value: string) => void;
  tokenBalancesByDenom?: Record<string, bigint>;
};

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  id,
  selectedToken,
  tokens,
  onChange,
  tokenBalancesByDenom,
}) => {
  const [isOpen, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const element = event.target;

      if (element instanceof HTMLElement) {
        const draft = element.closest(`#${id}.token-selector`);
        if (!!draft) {
          return;
        }

        setOpen(false);
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [id, isOpen]);

  return (
    <Wrapper>
      <Container
        id={id}
        className="token-selector bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
        onClick={() => setOpen((prev) => !prev)}
      >
        <TokenInfo>
          <TokenLogo src={selectedToken.logo} />
          <TokenSymbol>{selectedToken.symbol}</TokenSymbol>
        </TokenInfo>
        <CaretWrapper>
          <Caret
            style={{
              transform: `rotate(${isOpen ? 180 : 0}deg)`,
              transition: 'transform 0.2s',
            }}
          />
        </CaretWrapper>
      </Container>

      {isOpen && (
        <SelectCard className="bg-white dark:bg-slate-800 shadow-lg">
          {tokens.map((token) => {
            const balance = tokenBalancesByDenom?.[token.type];
            return (
              <TokenSelectionItem
                key={token.type}
                {...token}
                balance={balance}
                selected={token.type === selectedToken.type}
                onClick={() => {
                  onChange(token.type);
                  setOpen(false);
                }}
              />
            );
          })}
        </SelectCard>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 360px;
  height: 52px;
  position: relative;
`;

const Container = styled.div`
  padding: 0 16px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
`;

const TokenInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
`;

const TokenLogo = styled.img`
  margin-right: 12px;
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
`;

const TokenSymbol = styled.span`
  font-weight: 600;
  font-size: 18px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  .dark & {
    color: #f3f4f6;
  }
`;

const CaretWrapper = styled.div`
  margin-left: 8px;
  flex-shrink: 0;
`;

const SelectCard = styled.ul`
  padding: 8px;
  width: 100%;
  position: absolute;
  top: 60px;
  left: 0;
  z-index: 10;
  border-radius: 12px;
  max-height: 300px;
  overflow-y: auto;

  /* Chrome, Safari, etc */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 20px;
    border: 3px solid transparent;
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;

  /* IE & edge */
  -ms-overflow-style: none;

  /* dark mode */
  .dark & {
    &::-webkit-scrollbar-thumb {
      background-color: rgba(209, 213, 219, 0.5);
    }
    scrollbar-color: rgba(209, 213, 219, 0.5) transparent;
  }
`;

const Caret: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="11"
    height="8"
    viewBox="0 0 11 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.88477 1.5L5.88477 5.5L9.88477 1.5"
      stroke="#93A4BF"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
