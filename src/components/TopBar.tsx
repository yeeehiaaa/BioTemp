import React, { useState } from 'react';
import { FileText, Lightbulb, Moon, Settings2, Sun } from 'lucide-react';
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
  onOpenReport: () => void;
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
  onOpenReport,
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
    <header className="shrink-0 relative z-30 w-full bg-white/92 dark:bg-[#0B172B]/92 backdrop-blur-md border-b border-[#E2ECF0] dark:border-[#1E3354] shadow-[0_1px_14px_-6px_rgba(22,38,66,0.08)] dark:shadow-[0_2px_18px_-6px_rgba(2,8,20,0.6)] transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Brand Mark + Wordmark */}
        <button
          type="button"
          onClick={() => onSelectPage('home')}
          className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded-xl py-1 pr-2 transition-opacity hover:opacity-90"
        >
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#0F766E] flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(13,148,136,0.55)]"
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
          <span className="text-[1.15rem] font-bold tracking-tight text-[#162642] dark:text-[#F1F6FA]">
            BioTemp
          </span>
        </button>

        {/* Zone 2: Clean Typographic Navigation */}
        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-8 h-full"
        >
          {topLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onSelectPage(link.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative h-full inline-flex items-center text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-[#0D9488] ${
                  isActive
                    ? 'font-semibold text-[#162642] dark:text-[#F1F6FA]'
                    : 'font-medium text-[#647B8C] dark:text-[#8BA3BC] hover:text-[#162642] dark:hover:text-[#F1F6FA]'
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full bg-[#0D9488] dark:bg-[#2DD4BF]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick-Guide Pro-Tips, Mode Nuit + Settings & Primary Clinical Action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenProTips}
            aria-label={`Ouvrir le guide rapide et les conseils (${proTipsCount} suggestions)`}
            className={`relative inline-flex items-center gap-1.5 min-h-[40px] px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
              hasUrgentTip
                ? 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3] hover:bg-[#FFE4E6] dark:bg-[#2F1320] dark:text-[#FDA4AF] dark:border-[#881337] dark:hover:bg-[#3F1A2B]'
                : 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1] hover:bg-[#DDF7F3] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#115E59] dark:hover:bg-[#133A3B]'
            }`}
          >
            <Lightbulb className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{t.proTips}</span>
            {proTipsCount > 0 && (
              <span
                className={`min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                  hasUrgentTip
                    ? 'bg-[#E11D48] text-white'
                    : 'bg-[#0D9488] text-white'
                }`}
              >
                {proTipsCount}
              </span>
            )}
          </button>

          {/* Mode Nuit Toggle + Auto Settings Trigger */}
          <div className="inline-flex items-center rounded-xl border border-[#DCE7EC] dark:border-[#26426E] overflow-hidden shrink-0">
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-pressed={isDarkMode}
              aria-label={isDarkMode ? t.dayMode : t.nightMode}
              className={`inline-flex items-center gap-1.5 min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                isDarkMode
                  ? 'bg-[#162A4B] text-[#5EEAD4] hover:bg-[#1C355E]'
                  : 'bg-[#F3F7F9] text-[#162642] hover:bg-[#E4EDF2]'
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 shrink-0 text-[#FCD34D]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 shrink-0 text-[#162642]" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {isDarkMode ? t.dayMode : t.nightMode}
              </span>
              {nightModePolicy !== 'manual' && (
                <span className="hidden md:inline px-1.5 py-0.5 rounded-md bg-[#0D9488]/15 text-[#0F766E] dark:bg-[#2DD4BF]/20 dark:text-[#5EEAD4] text-[10px] font-bold">
                  {t.autoBadge}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen((v) => !v)}
              aria-expanded={isSettingsOpen}
              aria-label="Paramètres automatiques du Mode Nuit"
              title="Paramètres Mode Nuit automatique (soleil ou horaire enfant)"
              className={`min-h-[38px] px-2 sm:px-2.5 flex items-center justify-center border-l border-[#DCE7EC] dark:border-[#26426E] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                isSettingsOpen
                  ? 'bg-[#0D9488] text-white'
                  : isDarkMode
                  ? 'bg-[#132542] text-[#8BA3BC] hover:text-[#F1F6FA] hover:bg-[#1C355E]'
                  : 'bg-white text-[#647B8C] hover:text-[#162642] hover:bg-[#E4EDF2]'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex items-center gap-2 min-h-[40px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#162642] hover:bg-[#1E3356] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] active:scale-[0.99] rounded-xl shadow-[0_6px_16px_-6px_rgba(22,38,66,0.45)] dark:shadow-[0_6px_18px_-6px_rgba(13,148,136,0.45)] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B172B]"
          >
            <FileText
              className="w-4 h-4 shrink-0 text-[#5EEAD4] dark:text-white"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t.doctorPreview}</span>
            <span className="sm:hidden">{t.doctorShort}</span>
          </button>
        </div>
      </div>

      <TopBarSettingsPopover
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
