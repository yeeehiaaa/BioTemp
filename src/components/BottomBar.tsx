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
      className="shrink-0 relative z-40 w-full bg-white dark:bg-[#0B172B] border-t border-[#E3EDF0] dark:border-[#1E3354] shadow-[0_-8px_24px_-14px_rgba(22,38,66,0.14)] dark:shadow-[0_-10px_28px_-14px_rgba(2,8,20,0.7)] transition-colors no-print"
    >
      <div className="max-w-xl mx-auto grid grid-cols-4 h-16 px-2">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = activePage === id;
          const showBufferCount = id === 'device' && isOutOfRange && bufferedCount > 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectPage(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D9488] rounded-xl ${
                isActive
                  ? 'text-[#0D9488] dark:text-[#2DD4BF]'
                  : 'text-[#647B8C] dark:text-[#8BA3BC] hover:text-[#162642] dark:hover:text-[#F1F6FA]'
              }`}
            >
              <span className="relative inline-flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden={true} />
                {showBufferCount && (
                  <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-[#EA580C] text-white font-mono text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {bufferedCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] leading-none tracking-tight whitespace-nowrap ${
                  isActive ? 'font-bold text-[#162642] dark:text-[#F1F6FA]' : 'font-medium'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 w-6 h-0.5 rounded-full bg-[#0D9488] dark:bg-[#2DD4BF]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
