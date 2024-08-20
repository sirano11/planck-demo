import styled from '@emotion/styled';
import {
  ArrowLeftRightIcon,
  GiftIcon,
  HandCoinsIcon,
  HistoryIcon,
  VoteIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { cn } from '@/utils/cn';

const MENU_ITEMS = [
  {
    icon: <ArrowLeftRightIcon size={18} />,
    title: 'Swap',
    href: '/swap',
    exact: true,
  },
  {
    icon: <HistoryIcon size={18} />,
    title: 'History',
    href: '/history',
    exact: true,
  },
  {
    icon: <HandCoinsIcon size={18} />,
    title: 'Stake',
    href: '/stake',
    exact: true,
  },
  {
    icon: <VoteIcon size={18} />,
    title: 'Governance',
    href: '/gov',
    exact: false,
  },
  {
    icon: <GiftIcon size={18} />,
    title: 'Faucet',
    href: '/faucet',
    exact: true,
  },
];

export const SideBar: React.FC = () => {
  const router = useRouter();

  return (
    <Container>
      <div className="rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B] flex flex-col mt-4 p-2 overflow-hidden">
        {MENU_ITEMS.map((item) => {
          const isActive = item.exact
            ? router.pathname === item.href
            : router.pathname.startsWith(item.href);
          return (
            <Link key={item.title} href={item.href}>
              <div
                className={cn(
                  'flex-1 flex py-2 px-3.5 items-center gap-1.5 w-full rounded-xl transition-colors',
                  isActive
                    ? 'bg-emerald-300/70 text-slate-800 dark:bg-emerald-300 dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400',
                )}
                style={
                  isActive
                    ? { boxShadow: '0px 4px 12px rgba(110, 231, 183, 0.45)' }
                    : undefined
                }
              >
                <span>{item.icon}</span>
                <span className="font-medium tracking-tight">{item.title}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </Container>
  );
};

// TODO: Better mobile responsiveness

const Container = styled.div`
  width: 100%;
  padding-left: 20px;
  max-width: 300px;
  height: 100%;
  min-height: 100vh;

  position: sticky;
  top: 0;
  padding-top: 64px;

  @media screen and (max-width: 960px) {
    max-width: 220px;
  }

  @media screen and (max-width: 700px) {
    min-height: unset;
    position: static;
  }
`;
