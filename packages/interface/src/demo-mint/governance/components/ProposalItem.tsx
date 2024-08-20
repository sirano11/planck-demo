import styled from '@emotion/styled';
import { useRouter } from 'next/router';

// FIXME: Replace hardcoded values
export const ProposalItem: React.FC = () => {
  const router = useRouter();

  return (
    <Container onClick={() => router.push(`/gov/1`)}>
      <PeriodName>Voting Period</PeriodName>
      <div className="flex flex-col gap-2 w-full">
        <Title>
          #1 Update virtual liquidity parameters and reduce Pilgrim liquidity
        </Title>
        <RemainingTime>7 days left</RemainingTime>
      </div>

      <div className="flex flex-col w-full">
        <ProgressBarContainer>
          <ProgressBar className="yes" />
          <ProgressBar className="no" />
        </ProgressBarContainer>

        <div className="mt-2 flex items-center w-full">
          <TotalVoted>42.69% voted</TotalVoted>

          <div className="gap-1 flex items-center ml-auto">
            <YesVoted>Yes 80.62%</YesVoted>
            <NoVoted>No 7.94%</NoVoted>
          </div>
        </div>
      </div>
    </Container>
  );
};

const Container = styled.li`
  display: flex;
  width: 324px;
  padding: 24px 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;

  border-radius: 12px;
  background:
    radial-gradient(97.99% 97.99% at 50% 0%, #d9e4f2 0%, #fff 36%) padding-box,
    linear-gradient(180deg, #dee5ee 0%, #fff 100%) border-box;
  border: 1px solid transparent;
  box-shadow: 0px 4px 38.6px 0px rgba(193, 193, 193, 0.25);

  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0px 8px 38.6px 0px rgba(193, 193, 193, 0.25);
  }

  .dark & {
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
  }
`;

const PeriodName = styled.span`
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  line-height: 92%; /* 11.04px */
  letter-spacing: -0.6px;
`;

const Title = styled.h2`
  color: #000;
  font-size: 20px;
  font-weight: 700;
  line-height: 120%; /* 24px */
  letter-spacing: -1px;

  .dark & {
    color: #fff;
  }
`;

const RemainingTime = styled.span`
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  line-height: 92%; /* 11.04px */
  letter-spacing: -0.6px;
`;
const TotalVoted = styled.span`
  color: #808a98;
  font-size: 12px;
  font-weight: 500;
  line-height: 92%; /* 11.04px */
  letter-spacing: -0.6px;
`;
const YesVoted = styled.span`
  display: flex;
  padding: 2px;
  justify-content: center;
  align-items: center;
  width: fit-content;

  border-radius: 4px;
  background: rgba(110, 231, 183, 0.4);

  color: #00aa67;
  font-size: 12px;
  font-weight: 500;
  line-height: 92%; /* 11.04px */
  letter-spacing: -0.6px;

  .dark & {
    color: #43ffb4;
    background: rgba(110, 231, 183, 0.4);
  }
`;
const NoVoted = styled.span`
  display: flex;
  padding: 2px;
  justify-content: center;
  align-items: center;
  width: fit-content;

  border-radius: 4px;
  background: rgba(255, 107, 125, 0.4);

  color: #c6273a;
  font-size: 12px;
  font-weight: 500;
  line-height: 92%; /* 11.04px */
  letter-spacing: -0.6px;

  .dark & {
    color: #ffa2ad;
    background: rgba(255, 107, 125, 0.4);
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  border-radius: 8px;
  background: #eaebee;
  overflow: hidden;

  display: flex;
  height: 4px;

  .dark & {
    background: rgba(148, 163, 184, 0.24);
  }
`;
const ProgressBar = styled.div`
  &.yes {
    background: #6ee7b7;
    width: 80.62%;
    height: 4px;
  }

  &.no {
    background: #ff6b7d;
    width: 7.94%;
    height: 4px;
  }
`;
