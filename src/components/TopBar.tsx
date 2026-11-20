import React, { useState } from 'react';
import { Lightbulb, Moon, Settings2, Sun } from 'lucide-react';
import { AppLanguage, ChildProfile } from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import { NightModePolicy, SleepSchedule } from '../utils/nightMode';
import { AppPage } from './BottomBar';
import { TopBarSettingsPopover } from './TopBarSettingsPopover';

interface TopBarProps {
  language: AppLanguage;
  activePage: AppPage;
  isDarkMode: boolean;
  nightModePolicy: NightModePolicy;
  profiles: ChildProfile[];
  activeProfile: ChildProfile;
  sunSchedule: { sunrise: string; sunset: string };
  currentTimeLabel: string;
  simulateNightTime: boolean;
  proTipsCount: number;
  hasUrgentTip: boolean;
  onToggleDarkMode: () => void;
  onChangeNightPolicy: (policy: NightModePolicy) => void;
  onUpdateSleepSchedule: (profileId: string, schedule: SleepSchedule) => void;
  onToggleSimulateNightTime: () => void;
  onSelectPage: (page: AppPage) => void;
  onOpenProTips: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  language,
  activePage,
  isDarkMode,
  nightModePolicy,
  profiles,
  activeProfile,
  sunSchedule,
  currentTimeLabel,
  simulateNightTime,
  proTipsCount,
  hasUrgentTip,
  onToggleDarkMode,
  onChangeNightPolicy,
  onUpdateSleepSchedule,
  onToggleSimulateNightTime,
  onSelectPage,
  onOpenProTips,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = getStrings(language).nav;
  const topLinks: Array<{ id: AppPage; label: string }> = [
    { id: 'home', label: t.home },
    { id: 'history', label: t.history },
    { id: 'device', label: t.device },
    { id: 'profile', label: t.profile },
  ];

  return (
    <header className="shrink-0 relative z-30 w-full bg-white/95 dark:bg-[#0B1322]/95 backdrop-blur-md border-b border-[#E1E8EE] dark:border-[#1B2A42] transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Mark + Wordmark */}
        <button
          type="button"
          onClick={() => onSelectPage('home')}
          className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E] rounded-xl py-1 pe-2 transition-opacity hover:opacity-85"
        >
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-lg bg-[#0B8A7E] dark:bg-[#14B8A6] flex items-center justify-center shadow-xs"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4.5 h-4.5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z" />
              <circle cx="11.5" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="text-[1.125rem] font-bold tracking-tight text-[#0F1D32] dark:text-[#F1F5F9]">
            BioTemp
          </span>
        </button>

        {/* Zone 2: Clean Typographic Navigation */}
        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-7 h-full"
        >
          {topLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onSelectPage(link.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative h-full inline-flex items-center text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-[#0B8A7E] ${
                  isActive
                    ? 'font-semibold text-[#0F1D32] dark:text-[#F1F5F9]'
                    : 'font-medium text-[#64798F] dark:text-[#8DA2B9] hover:text-[#0F1D32] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0B8A7E] dark:bg-[#2DD4BF]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick-Guide Pro-Tips & Night Mode */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenProTips}
            aria-label={
              language === 'ar'
                ? `فتح الدليل السريع والنصائح (${proTipsCount})`
                : `Ouvrir le guide rapide et les conseils (${proTipsCount} suggestions)`
            }
            className={`relative inline-flex items-center gap-1.5 min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E] ${
              hasUrgentTip
                ? 'bg-[#FEF1F3] text-[#BE123C] border-[#FCCAD3] hover:bg-[#FDE2E7] dark:bg-[#2A0E17] dark:text-[#FDA4AF] dark:border-[#881337] dark:hover:bg-[#3A1420]'
                : 'bg-[#F8FAFC] text-[#0F1D32] border-[#E1E8EE] hover:bg-[#EEF3F6] dark:bg-[#132036] dark:text-[#E2ECF5] dark:border-[#1E304D] dark:hover:bg-[#192A46]'
            }`}
          >
            <Lightbulb
              className={`w-4 h-4 shrink-0 ${
                hasUrgentTip ? 'text-[#D91E43] dark:text-[#FDA4AF]' : 'text-[#0B8A7E] dark:text-[#2DD4BF]'
              }`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t.proTips}</span>
            {proTipsCount > 0 && (
              <span
                className={`font-mono text-[11px] font-bold tabular-nums ${
                  hasUrgentTip
                    ? 'text-[#D91E43] dark:text-[#FDA4AF]'
                    : 'text-[#0B8A7E] dark:text-[#2DD4BF]'
                }`}
              >
                ({proTipsCount})
              </span>
            )}
          </button>

          {/* Night Mode Toggle + Auto Schedule Trigger */}
          <div className="inline-flex items-center rounded-lg border border-[#E1E8EE] dark:border-[#1E304D] overflow-hidden shrink-0 bg-[#F8FAFC] dark:bg-[#132036]">
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-pressed={isDarkMode}
              aria-label={isDarkMode ? t.dayMode : t.nightMode}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E] ${
                isDarkMode
                  ? 'text-[#E2ECF5] hover:bg-[#192A46]'
                  : 'text-[#0F1D32] hover:bg-[#EEF3F6]'
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 shrink-0 text-[#FBBF24]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 shrink-0 text-[#475B70]" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {isDarkMode ? t.dayMode : t.nightMode}
              </span>
              {nightModePolicy !== 'manual' && (
                <span className="hidden md:inline font-mono text-[10px] font-bold text-[#0B8A7E] dark:text-[#2DD4BF]">
                  · {t.autoBadge}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen((v) => !v)}
              aria-expanded={isSettingsOpen}
              aria-label={
                language === 'ar'
                  ? 'إعدادات الوضع الليلي التلقائي'
                  : 'Paramètres automatiques du Mode Nuit'
              }
              title={
                language === 'ar'
                  ? 'إعدادات الوضع الليلي التلقائي'
                  : 'Paramètres Mode Nuit automatique (soleil ou horaire enfant)'
              }
              className={`min-h-[36px] px-2 sm:px-2.5 flex items-center justify-center border-s border-[#E1E8EE] dark:border-[#1E304D] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E] ${
                isSettingsOpen
                  ? 'bg-[#0B8A7E] text-white'
                  : isDarkMode
                  ? 'text-[#8DA2B9] hover:text-[#F1F5F9] hover:bg-[#192A46]'
                  : 'text-[#64798F] hover:text-[#0F1D32] hover:bg-[#EEF3F6]'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <TopBarSettingsPopover
        language={language}
        isOpen={isSettingsOpen}
        isDarkMode={isDarkMode}
        nightModePolicy={nightModePolicy}
        profiles={profiles}
        activeProfile={activeProfile}
        sunSchedule={sunSchedule}
        currentTimeLabel={currentTimeLabel}
        simulateNightTime={simulateNightTime}
        onClose={() => setIsSettingsOpen(false)}
        onChangePolicy={onChangeNightPolicy}
        onUpdateSleepSchedule={onUpdateSleepSchedule}
        onToggleSimulateNightTime={onToggleSimulateNightTime}
      />
    </header>
  );
};
