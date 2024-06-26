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
        className="token-selector"
        onClick={() => setOpen((prev) => !prev)}
      >
        <TokenInfo>
          <TokenLogo src={selectedToken.logo} />
          <TokenSymbol>{selectedToken.symbol}</TokenSymbol>
        </TokenInfo>
        <Caret
          style={{
            transform: `rotate(${isOpen ? 180 : 0}deg)`,
            transition: 'transform 0.2s',
          }}
        />
      </Container>

      {isOpen && (
        <SelectCard className="bg-white">
          {tokens.map((token) => {
            const balance = tokenBalancesByDenom?.[token.type];
            return (
              <TokenSelectionItem
                key={token.type}
                {...token}
                balance={balance}
                selected={token.type === selectedToken.type}
                onClick={() => onChange(token.type)}
              />
            );
          })}
        </SelectCard>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${fixedWidth(190)}
  height: 52px;

  position: relative;
`;
const Container = styled.div`
  padding: 0 12px;
  width: 100%;
  height: 100%;
  gap: 8px;

  display: flex;
  align-items: center;

  border-radius: 12px;
  transition: all 0.2s ease;

  background-color: white;
  box-shadow: 0px 4px 16px 0px rgba(222, 225, 240, 0.48);

  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: #f9fafc;
  }
`;
const TokenInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const TokenLogo = styled.img`
  margin-right: 9.75px;
  width: 36px;
  height: 36px;
  object-fit: contain;
`;
const TokenSymbol = styled.span`
  font-family: var(--HafferFontStack);
  font-weight: 600;
  font-size: 24px;
  line-height: 140%;

  font-size: 23.031px;
  font-weight: 700;
  letter-spacing: -0.921px;
  color: #2b3b38;
`;

const SelectCard = styled.ul`
  padding: 8px;
  ${fixedWidth(200)}

  position: absolute;
  top: 52px;
  left: 0;
  z-index: 10;

  box-shadow:
    0px 20px 24px -4px rgba(16, 24, 40, 0.08),
    0px 8px 8px -4px rgba(16, 24, 40, 0.03);
  border-radius: 4px;
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
