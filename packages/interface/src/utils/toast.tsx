import { CheckCircle2, Loader, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { TransactionReceipt } from 'viem';

import { Button } from '@/components/ui/button';
import { EthereumExplorer } from '@/helper/explorer';

export const toastTransaction = async (promise: Promise<TransactionReceipt>) =>
  toast
    .promise(promise, {
      pending: {
        render: () => `Sending Transaction...`,
        icon: <Loader className="animate-spin" />,
      },
      success: {
        render: ({ data }) => {
          return (
            <div className="flex flex-col gap-1.5">
              <span className="inline-block">Transaction submitted!</span>
              <Button
                size="sm"
                className="text-xs !w-fit py-[5px] px-2 !h-fit tracking-tighter"
                onClick={() => {
                  const win = window.open(
                    EthereumExplorer.getTxLink(data.transactionHash),
                    '_blank',
                  );
                  win?.focus();
                }}
              >
                View in Explorer
              </Button>
            </div>
          );
        },
        icon: <CheckCircle2 />,
      },
      error: {
        render: ({ data, props }: any) => {
          console.log([data.message], props);
          if (data?.message?.includes('User rejected the request')) {
            return 'Transaction rejected by user.';
          }
          const message = (data?.message || 'No message')
            .split('Contract Call:\n  address')[0]
            .trim();
          return `Transaction failed! ${message}`;
        },
        icon: <XCircle />,
      },
    })
    .catch(() => {});
