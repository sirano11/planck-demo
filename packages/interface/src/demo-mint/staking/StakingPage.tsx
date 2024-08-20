import styled from '@emotion/styled';
import { HandCoinsIcon, SailboatIcon } from 'lucide-react';

import { FeatureHeader } from '@/components/FeatureHeader';
import { LIVRE, lMINT } from '@/constants/tokens';

import { StakingProductItem } from './components/StakingProductItem';

export default function StakingPage() {
  return (
    <div className="my-[80px] w-full max-w-[600px] mx-auto gap-[10px] flex flex-col">
      <FeatureHeader icon={<HandCoinsIcon size={20} />}>
        {/* */}
        Stake
      </FeatureHeader>
      <div className="flex flex-col w-full">
        <StakingProductList>
          <StakingProductItem name="Stake Mint" apr={27.05} src={lMINT.logo} />
          <StakingProductItem
            name={
              <>
                Deposit cash<span className="text-[#0DC67F]">LIVRE</span>
              </>
            }
            apr={5.5}
            src={LIVRE.logo}
            provider={
              <>
                Powered by{' '}
                <SailboatIcon
                  className="ml-1 mr-0.5 inline-block align-baseline"
                  size={13}
                  strokeWidth={2.2}
                />
                Sail Protocol
              </>
            }
          />
        </StakingProductList>
        <Description>
          {`*These APRs are illustrative examples only, not based on actual simulations or verified data.`}
        </Description>
      </div>
    </div>
  );
}

const StakingProductList = styled.ul`
  width: 100%;
  display: flex;
  gap: 8px;
`;

const Description = styled.p`
  margin-top: 24px;

  color: #94a3b8;
  font-size: 14px;
  font-weight: 400;
  line-height: 120%; /* 19.2px */
  letter-spacing: -0.8px;
`;
