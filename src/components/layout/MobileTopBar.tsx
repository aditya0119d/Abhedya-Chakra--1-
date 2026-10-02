import React from 'react';
import { Menu } from 'lucide-react';
import { siteConfig } from '../../config/site';

interface MobileTopBarProps {
  onOpenMobileMenu: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ onOpenMobileMenu }) => {
  return (
    <header className="no-print sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-[#e4e4e0] bg-[#fbfbfa] px-3 md:hidden dark:border-[#27272a] dark:bg-[#121214]">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="flex h-8 w-8 items-center justify-center rounded text-[#18181b] hover:bg-[#f4f4f2] dark:text-[#f4f4f5] dark:hover:bg-[#1e1e22]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-mono text-sm font-bold tracking-tight text-[#18181b] dark:text-[#f4f4f5]">
          {siteConfig.shortName}
        </span>
      </div>
    </header>
  );
};
