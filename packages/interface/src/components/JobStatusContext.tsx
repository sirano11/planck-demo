import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { toast } from 'react-toastify';
import { Hash } from 'viem';

import { ChainIdentifier } from '@/helper/eth/config';
import { SolanaExplorer, SuiExplorer } from '@/helper/explorer';
import { socket } from '@/utils/socket';

import { Button } from './ui/button';

type SuccessStatusType =
  | 'event-received'
  | 'mint-asset-to-actor'
  | 'send-tx-to-dest'
  | 'mint-asset-to-sender'
  | 'give-asset-back-to-sender'
  | 'completed';
type FailureStatusType =
  | 'actor-not-found'
  | 'mint-asset-to-actor'
  | 'send-tx-to-dest'
  | 'tx-not-found'
  | 'mint-asset-to-sender'
  | 'give-asset-back-to-sender';
type JobStatusType = SuccessStatusType | FailureStatusType;

interface JobStatus {
  jobHash?: Hash;
  jobStatus?: JobStatusType;
}

type JobStatusEvent =
  | {
      error: true;
      chain: ChainIdentifier;
      status: FailureStatusType;
    }
  | {
      error: false;
      chain: ChainIdentifier;
      status: SuccessStatusType;
      txHash?: Hash | string;
    };

type JobStatusAction =
  | {
      type: 'SET_JOB_HASH';
      payload: Hash;
    }
  | {
      type: 'SET_JOB_STATUS';
      payload: JobStatusType;
    };

const initialState: JobStatus = {
  jobHash: undefined,
  jobStatus: undefined,
};

const reducer = (state: JobStatus, action: JobStatusAction) => {
  switch (action.type) {
    case 'SET_JOB_HASH':
      return { ...state, jobHash: action.payload };
    case 'SET_JOB_STATUS':
      return { ...state, jobStatus: action.payload };
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

const successMessages: Record<SuccessStatusType, string> = {
  'event-received': 'Event received (1/4)',
  'mint-asset-to-actor':
    'Input assets have been minted in the destination chain (2/4)',
  'send-tx-to-dest': 'Transaction confirmed in the destination chain (3/4)',
  'mint-asset-to-sender': 'Output assets have been minted to the sender (4/4)',
  'give-asset-back-to-sender': 'Assets returned to sender (due to tx failure)',
  completed: 'Transaction completed',
};

const failureMessages: Record<FailureStatusType, string> = {
  'actor-not-found': 'Invalid authority',
  'mint-asset-to-actor': 'Failed to mint input assets in the destination chain',
  'send-tx-to-dest': 'Failed to send transaction to destination',
  'tx-not-found': 'Transaction not found',
  'mint-asset-to-sender': 'Failed to mint output assets to sender',
  'give-asset-back-to-sender':
    "Transaction failed and assets couldn't be returned to sender",
};

export const JobStatusProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!state.jobHash) return;

    const { jobHash } = state;

    function onJobEvent(event: JobStatusEvent) {
      dispatch({
        type: 'SET_JOB_STATUS',
        payload: event.status,
      });

      if (event.error) {
        toast.error(`${failureMessages[event.status] ?? event.status}`);
      } else {
        if (event.txHash) {
          toast.success(
            <div className="flex flex-col gap-1.5">
              <span className="inline-block">
                {successMessages[event.status]}
              </span>
              <Button
                size="sm"
                className="text-xs !w-fit py-[5px] px-2 !h-fit tracking-tighter"
                onClick={() => {
                  if (!event.txHash) return;
                  const win = window.open(
                    (event.chain === ChainIdentifier.Sui
                      ? SuiExplorer
                      : SolanaExplorer
                    ).getTxLink(event.txHash),
                    // txHash could be Sui Digest or Solana Signature
                    '_blank',
                  );
                  win?.focus();
                }}
              >
                View in Explorer
              </Button>
            </div>,
          );
        } else {
          toast.success(successMessages[event.status] ?? event.status);
        }
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
