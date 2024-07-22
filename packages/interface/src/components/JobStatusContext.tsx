import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { toast } from 'react-toastify';
import { Hash } from 'viem';

import { socket } from '@/utils/socket';

interface JobStatus {
  jobHash?: Hash;
}

type JobStatusAction = {
  type: 'SET_JOB_HASH';
  payload: Hash;
};

const initialState: JobStatus = {
  jobHash: undefined,
};

const reducer = (state: JobStatus, action: JobStatusAction) => {
  switch (action.type) {
    case 'SET_JOB_HASH':
      return { ...state, jobHash: action.payload };
    default:
      return state;
  }
};

const JobStatusContext = createContext<{
  state: JobStatus;
  dispatch: React.Dispatch<JobStatusAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const useJobStatus = () => {
  const context = useContext(JobStatusContext);
  if (context === undefined) {
    throw new Error('useJobStatus must be used within a JobStatusProvider');
  }
  return context;
};

const successMessages: Record<string, string> = {
  'event-received': 'Event received (1/4)',
  'mint-asset-to-actor':
    'Input assets have been minted in the destination chain (2/4)',
  'send-tx-to-dest': 'Transaction confirmed in the destination chain (3/4)',
  'mint-asset-to-sender': 'Output assets have been minted to the sender (4/4)',
};

const failureMessages: Record<string, string> = {
  'actor-not-found': 'Invalid authority',
  'mint-asset-to-actor': 'Failed to mint input assets in the destination chain',
  'send-tx-to-dest': 'Failed to send transaction to destination',
  'tx-not-found': 'Transaction not found',
  'mint-asset-to-sender': 'Failed to mint output assets to sender',
};

export const JobStatusProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!state.jobHash) return;

    const { jobHash } = state;

    function onJobEvent({ error, status }: { error: boolean; status: string }) {
      if (error) {
        toast.error(`${jobHash} : ${failureMessages[status] ?? status}`);
      } else {
        toast.success(`${jobHash} : ${successMessages[status] ?? status}`);
      }
    }

    socket.on(`job-${jobHash}`, onJobEvent);

    return () => {
      socket.off(`job-${jobHash}`, onJobEvent);
    };
  }, [state.jobHash]);

  return (
    <JobStatusContext.Provider value={{ state, dispatch }}>
      {children}
    </JobStatusContext.Provider>
  );
};
