import styled from '@emotion/styled';
import Image from 'next/image';

type StakingProductItemProps = {
  name: React.ReactNode;
  apr: number;
  src: string;
  provider?: React.ReactNode;
};

export const StakingProductItem: React.FC<StakingProductItemProps> = ({
  name,
  apr,
  src,
  provider,
}) => {
  return (
    <Container>
      <Image
        className="w-[56px] h-[56px]"
        src={src}
        width={512}
        height={512}
        alt="logo"
      />
      <div className="flex flex-col w-full gap-2 items-center">
        <ProductName>{name}</ProductName>
        <APRRow>
          <APRField>APR</APRField>
          <APRValue>
            {`${apr.toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}%`}
          </APRValue>
        </APRRow>
      </div>
      {provider && <Provider>{provider}</Provider>}
    </Container>
  );
};

const Container = styled.li`
  display: flex;
  height: 200px;
  padding: 24px 16px;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 1 0 0;

  border-radius: 12px;
  background:
    radial-gradient(97.99% 97.99% at 50% 0%, #d9e4f2 0%, #fff 36%) padding-box,
    linear-gradient(180deg, #dee5ee 0%, #fff 100%) border-box;
  border: 1px solid transparent;
  box-shadow: 0px 4px 38.6px 0px #fff;

  position: relative;
  overflow: hidden;
  z-index: 0;

  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0px 8px 38.6px 0px rgba(193, 193, 193, 0.25);
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 74px;

    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0) 0%,
      #88ffd1 100%
    );
    z-index: -1;
  }

  .dark & {
    border-radius: 12px;
    background:
      radial-gradient(97.99% 97.99% at 50% 0%, #273248 0%, #020617 36%)
        padding-box,
      linear-gradient(
          180deg,
          rgba(222, 229, 238, 0.35) 0%,
          rgba(148, 163, 184, 0.13) 100%
        )
        border-box;
    box-shadow: 0px 4px 38.6px 0px rgba(0, 0, 0, 0.25);

    &::before {
      background: linear-gradient(
        to bottom,
        rgba(5, 25, 34, 0) 0%,
        #0a7051 100%
      );
    }
  }
`;
const ProductName = styled.h3`
  color: #2a2a2a;
  font-size: 20px;
  font-weight: 700;
  line-height: 120%; /* 24px */
  letter-spacing: -1px;

  .dark & {
    color: #fff;
  }
`;
const APRRow = styled.div`
  color: #0dc67f;
  gap: 8px;
  display: flex;
  align-items: baseline;
`;
const APRField = styled.span`
  font-size: 20px;
  font-weight: 700;
  line-height: 92%; /* 18.4px */
  letter-spacing: -1px;
  text-shadow: 0px 8px 24px rgba(13, 198, 127, 0.66);
`;
const APRValue = styled.span`
  font-size: 36px;
  font-weight: 700;
  line-height: 92%; /* 33.12px */
  letter-spacing: -1.8px;
  text-shadow: 0px 8px 24px rgba(13, 198, 127, 0.66);
`;
const Provider = styled.span`
  color: #4f766e;
  font-size: 13px;
  font-weight: 500;
  line-height: 92%; /* 12.88px */
  letter-spacing: -0.7px;

  .dark & {
    color: #94a3b8;
  }
`;
