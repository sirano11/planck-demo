import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

import { ColorModeToggle } from './ColorModeToggle';

const NavigationBar: React.FC = () => {
  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-background border-b border-b-slate-200 dark:border-b-slate-800 z-[100]">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex-[1_0_0]">
            <Link href="/">
              <span className="font-bold text-xl">Planck Demo</span>
            </Link>
          </div>

          <NavigationMenu className="hidden md:flex space-x-4 flex-[1_0_0]">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/mint" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Mint
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/solana" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Solana
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex gap-1.5 flex-[1_0_0] justify-end">
            <ColorModeToggle />
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
