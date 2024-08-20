import { VoteIcon } from 'lucide-react';

import { FeatureHeader } from '@/components/FeatureHeader';

import { ProposalItem } from './components/ProposalItem';

export default function GovernanceListPage() {
  return (
    <div className="my-[80px] w-full max-w-[600px] mx-auto gap-[10px] flex flex-col">
      <FeatureHeader icon={<VoteIcon size={20} />}>
        {/* */}
        Governance
      </FeatureHeader>

      <ul className="flex flex-col gap-2">
        <ProposalItem />
      </ul>
    </div>
  );
}
