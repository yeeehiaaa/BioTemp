import React from 'react';
import { Bluetooth, CalendarClock, Home, UserRound } from 'lucide-react';
import { AppLanguage } from '../types/biotemp';
import { getStrings } from '../utils/i18n';

export type AppPage = 'home' | 'history' | 'device' | 'profile';

interface BottomBarProps {
  language: AppLanguage;
  activePage: AppPage;
  onSelectPage: (page: AppPage) => void;
  bufferedCount: number;
  isOutOfRange: boolean;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  language,
  activePage,
  onSelectPage,
  bufferedCount,
  isOutOfRange,
}) => {
  const t = getStrings(language).nav;
  const navItems: Array<{
    id: AppPage;
    label: string;
    Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  }> = [
    { id: 'home', label: t.home, Icon: Home },
    { id: 'history', label: t.history, Icon: CalendarClock },
    { id: 'device', label: t.device, Icon: Bluetooth },
    { id: 'profile', label: t.profile, Icon: UserRound },
  ];

  return (
    <nav
      aria-label="Barre de navigation inférieure"
      className="shrink-0 relative z-40 w-full bg-white/95 dark:bg-[#0B1322]/95 backdrop-blur-md border-t border-[#E1E8EE] dark:border-[#1B2A42] transition-colors no-print md:hidden"
    >
      <div className="max-w-xl mx-auto grid grid-cols-4 h-15 px-2">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = activePage === id;
          const showBufferCount = id === 'device' && isOutOfRange && bufferedCount > 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectPage(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B8A7E] rounded-lg ${
                isActive
                  ? 'text-[#0B8A7E] dark:text-[#2DD4BF]'
                  : 'text-[#64798F] dark:text-[#8DA2B9] hover:text-[#0F1D32] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <span className="relative inline-flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden={true} />
                {showBufferCount && (
                  <span className="absolute -top-1.5 -end-3 min-w-[16px] h-4 px-1 rounded-md bg-[#D97706] text-white font-mono text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {bufferedCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] leading-none tracking-tight whitespace-nowrap ${
                  isActive ? 'font-bold text-[#0F1D32] dark:text-[#F1F5F9]' : 'font-medium'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 w-8 h-[2px] bg-[#0B8A7E] dark:bg-[#2DD4BF]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
