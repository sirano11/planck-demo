import styled from '@emotion/styled';

const TOTAL_STAKED = 1_420_00.8324673;

export default function GovernanceDetailPage() {
  return (
    <div className="mt-[100px] mb-[80px] w-full max-w-[600px] mx-auto gap-[10px] flex flex-col">
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

      <Article>
        <p>
          This proposal aims to increase <code>BasePool</code>,{' '}
          <code>PoolRecoveryPeriod</code>, and <code>BitcoinPool</code>{' '}
          liquidity parameters, and decrease the{' '}
          <code>PilgrimLiquidityWeight</code> parameter under Mint's market
          module by <code>30%.</code>
        </p>
        <p>
          As the Mint ecosystem expanded, there has been increased liquidity and
          demand for the <code>MINT</code> token outside of the virtual{' '}
          <code>{`BTC <> MINT`}</code> Pilgrim curve pool. With this change, we
          are proposing to:
        </p>
        <ul className="list-disc pl-[24px]">
          <li>
            Reduce <code>MINT</code> inflation from Bitcoin
          </li>
          <li>
            Increase direct <code>MINT</code> supply from the market
          </li>
          <li>
            Improve soft peg range by encouraging additional
            overcollateralization
          </li>
        </ul>
      </Article>

      <VoteTallyList>
        <VoteTallyCard className="yes">
          <h2 className="title">Yes 80.62%</h2>
          <span className="stake">
            {((TOTAL_STAKED * 80.62) / 100).toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}{' '}
            MINT
          </span>
        </VoteTallyCard>

        <VoteTallyCard className="no">
          <h2 className="title">No 7.91%</h2>
          <span className="stake">
            {((TOTAL_STAKED * 7.91) / 100).toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}{' '}
            MINT
          </span>
        </VoteTallyCard>

        <VoteTallyCard className="veto">
          <h2 className="title">Veto 0.3%</h2>
          <span className="stake">
            {((TOTAL_STAKED * 0.3) / 100).toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}{' '}
            MINT
          </span>
        </VoteTallyCard>

        <VoteTallyCard className="abstain">
          <h2 className="title">Abstain 27.59%</h2>
          <span className="stake">
            {((TOTAL_STAKED * 27.59) / 100).toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}{' '}
            MINT
          </span>
        </VoteTallyCard>
      </VoteTallyList>
    </div>
  );
}

const PeriodName = styled.span`
  color: #94a3b8;
  font-size: 16px;
  font-weight: 700;
  line-height: 92%; /* 11.04px */
  letter-spacing: -0.6px;
`;

const Title = styled.h2`
  color: #000;
  font-size: 24px;
  font-weight: 700;
  line-height: 120%; /* 24px */
  letter-spacing: -1px;

  .dark & {
    color: #fff;
  }
`;

const RemainingTime = styled.span`
  color: #94a3b8;
  font-size: 16px;
  font-weight: 700;
  line-height: 92%; /* 11.04px */
  letter-spacing: -0.6px;
`;
const TotalVoted = styled.span`
  color: #808a98;
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
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

const Article = styled.article`
  margin-top: 24px;
  padding: 20px;

  font-size: 16px;
  background: rgba(239, 243, 248, 0.45);
  color: #1e293b;

  border-radius: 12px;

  display: flex;
  flex-direction: column;
  gap: 20px;

  p {
    line-height: 140%;
  }

  code {
    border-radius: 3px;
    background-color: rgba(170, 226, 200, 0.4);
    color: #077148;
    font-size: 12.5px;
    padding: 2px 4px;
  }

  .dark & {
    background-color: #1e293b;
    color: rgba(255, 255, 255, 0.85);

    code {
      background-color: rgba(43, 206, 144, 0.2);
      color: rgb(120, 255, 192);
    }
  }
`;

const VoteTallyList = styled.ul`
  width: 100%;
  display: flex;
  gap: 4px;
`;
const VoteTallyCard = styled.li`
  flex: 1;
  padding: 14px 12px 12px;
  border-radius: 12px;
  border: 1px solid transparent;

  display: flex;
  flex-direction: column;
  gap: 2px;

  .title {
    font-size: 14.5px;
    font-weight: 600;
    letter-spacing: -3%;
  }

  .stake {
    font-size: 12px;
    color: #808a98;
  }

  &.yes .title {
    color: #36d394;
  }

  &.no .title,
  &.veto .title {
    color: #e76373;
  }

  &.abstain .title {
    color: rgba(0, 0, 0, 0.7);
  }

  background:
    linear-gradient(180deg, #f5faff 0%, #fff 100%) padding-box,
    linear-gradient(180deg, #dde6f0 0%, rgba(0, 0, 0, 0.05) 100%) border-box;

  .dark & {
    background:
      radial-gradient(100% 100% at 50% 0%, #1a2435 0%, #020617 100%) padding-box,
      linear-gradient(
          to bottom,
          rgba(255, 255, 255, 0.15),
          rgba(255, 255, 255, 0.1)
        )
        border-box;
    color: rgba(255, 255, 255, 0.85);

    &.yes .title {
      color: #43ffb4;
    }

    &.no .title,
    &.veto .title {
      color: #ff6b7d;
    }

    &.abstain .title {
      color: rgba(255, 255, 255, 0.8);
    }
  }
`;
