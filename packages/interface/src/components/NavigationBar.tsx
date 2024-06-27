import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAccount, useBalance, useDisconnect } from 'wagmi';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';

const NavigationBar: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const {
    data: balanceData,
    isError,
    isLoading,
  } = useBalance({
    address,
  });

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <nav className="fixed top-0 w-full bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <span className="font-bold text-xl">Planck Demo</span>
          <NavigationMenu className="hidden md:flex space-x-4">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/mint"
                  className="text-foreground hover:text-primary"
                >
                  Mint
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/solana"
                  className="text-foreground hover:text-primary"
                >
                  Solana
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenu>
          <div>
            {!isConnected ? (
              <ConnectButton />
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                {isLoading && (
                  <Button variant="ghost" size="sm" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </Button>
                )}
                {isError && (
                  <Button variant="ghost" size="sm" disabled>
                    Error loading balance
                  </Button>
                )}
                {balanceData && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white text-black border-gray-300 hover:bg-gray-100"
                    onClick={handleDisconnect}
                  >
                    {ethers.utils.formatUnits(
                      balanceData.value,
                      balanceData.decimals,
                    )}{' '}
                    {balanceData.symbol}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
