import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Baby,
  ChevronDown,
  Clock,
  Moon,
  SlidersHorizontal,
  Sun,
  Sunrise,
  Sunset,
  X,
} from 'lucide-react';
import { AppLanguage, ChildProfile } from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import { NightModePolicy, SleepSchedule } from '../utils/nightMode';

interface TopBarSettingsPopoverProps {
  language: AppLanguage;
  isOpen: boolean;
  isDarkMode: boolean;
  nightModePolicy: NightModePolicy;
  profiles: ChildProfile[];
  activeProfile: ChildProfile;
  sunSchedule: { sunrise: string; sunset: string };
  currentTimeLabel: string;
  simulateNightTime: boolean;
  onClose: () => void;
  onChangePolicy: (policy: NightModePolicy) => void;
  onUpdateSleepSchedule: (profileId: string, schedule: SleepSchedule) => void;
  onToggleSimulateNightTime: () => void;
}

export const TopBarSettingsPopover: React.FC<TopBarSettingsPopoverProps> = ({
  language,
  isOpen,
  isDarkMode,
  nightModePolicy,
  profiles,
  activeProfile,
  sunSchedule,
  currentTimeLabel,
  simulateNightTime,
  onClose,
  onChangePolicy,
  onUpdateSleepSchedule,
  onToggleSimulateNightTime,
}) => {
  const s = getStrings(language).settings;
  const demoLabel = getStrings(language).primaryCard.demoToolsToggle;
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const [editingProfileId, setEditingProfileId] = useState(activeProfile.id);
  const [showDemoNightToggle, setShowDemoNightToggle] = useState(false);

  useEffect(() => {
    setEditingProfileId(activeProfile.id);
  }, [activeProfile.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const editingProfile =
    profiles.find((p) => p.id === editingProfileId) ?? activeProfile;

  const policies: Array<{
    id: NightModePolicy;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'manual',
      title: s.policyManual,
      subtitle: s.policyManualDesc,
      icon: SlidersHorizontal,
    },
    {
      id: 'sun_schedule',
      title: s.policySun,
      subtitle:
        language === 'ar'
          ? `يعمل تلقائياً من الغروب (${sunSchedule.sunset}) إلى الشروق (${sunSchedule.sunrise}).`
          : `Actif automatiquement du coucher (${sunSchedule.sunset}) au lever (${sunSchedule.sunrise}).`,
      icon: Sunset,
    },
    {
      id: 'child_sleep',
      title: language === 'ar' ? `نوم ${activeProfile.name}` : `Sommeil de ${activeProfile.name}`,
      subtitle:
        language === 'ar'
          ? `يعمل من ${activeProfile.sleepSchedule.bedTime} إلى ${activeProfile.sleepSchedule.wakeTime} حسب جدوله.`
          : `Actif de ${activeProfile.sleepSchedule.bedTime} à ${activeProfile.sleepSchedule.wakeTime} selon son rythme.`,
      icon: Baby,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label={s.appearanceTitle}
            initial={shouldReduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.16, ease: 'easeOut' }}
            className="fixed top-16 sm:top-[70px] end-3 sm:end-6 z-50 w-[calc(100vw-24px)] sm:w-[390px] max-h-[82vh] overflow-y-auto bg-white dark:bg-[#0D1626] border border-[#E1E8EE] dark:border-[#1B2A42] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A] flex items-center justify-center text-[#0B8A7E] dark:text-[#2DD4BF]">
                  {isDarkMode ? (
                    <Moon className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Sun className="w-4 h-4" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                    {s.appearanceTitle}
                  </h2>
                  <p className="text-[11px] text-[#64798F] dark:text-[#8DA2B9] tabular-nums">
                    {simulateNightTime
                      ? language === 'ar'
                        ? 'توقيت محاكى'
                        : 'Heure simulée'
                      : language === 'ar'
                      ? 'التوقيت المحلي'
                      : 'Heure locale'}{' '}
                    · <span className="font-mono font-semibold">{currentTimeLabel}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={language === 'ar' ? 'إغلاق الإعدادات' : 'Fermer les paramètres'}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64798F] hover:bg-[#F4F7F9] dark:text-[#8DA2B9] dark:hover:bg-[#132036] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2" role="radiogroup" aria-label={s.appearanceTitle}>
              {policies.map((p) => {
                const Icon = p.icon;
                const active = nightModePolicy === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChangePolicy(p.id)}
                    className={`w-full text-start p-3 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                      active
                        ? 'bg-[#EDF9F7] border-[#0B8A7E]/40 dark:bg-[#0A2624] dark:border-[#14B8A6]/50'
                        : 'bg-[#F8FAFC] border-[#E1E8EE] hover:bg-[#EFF4F8] dark:bg-[#09111E] dark:border-[#1B2A42] dark:hover:bg-[#111D33]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        active
                          ? 'bg-[#0B8A7E] text-white'
                          : 'bg-white text-[#64798F] border border-[#E1E8EE] dark:bg-[#132036] dark:text-[#8DA2B9] dark:border-[#1E304D]'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5 leading-relaxed">
                        {p.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] flex items-center justify-between text-[11px] text-[#475B70] dark:text-[#9DB0C6] tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <Sunrise className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                {s.sunriseLabel} <strong className="font-mono">{sunSchedule.sunrise}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sunset className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                {s.sunsetLabel} <strong className="font-mono">{sunSchedule.sunset}</strong>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                  <span>{s.sleepScheduleTitle}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {profiles.map((prof) => {
                  const selected = prof.id === editingProfile.id;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => setEditingProfileId(prof.id)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                          : 'bg-white text-[#475B70] border-[#E1E8EE] dark:bg-[#0D1626] dark:text-[#9DB0C6] dark:border-[#1B2A42]'
                      }`}
                    >
                      {prof.name}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="sleep-bedtime"
                    className="block text-[11px] font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {s.bedTimeLabel} ({editingProfile.name})
                  </label>
                  <input
                    id="sleep-bedtime"
                    type="time"
                    value={editingProfile.sleepSchedule.bedTime}
                    onChange={(e) =>
                      onUpdateSleepSchedule(editingProfile.id, {
                        ...editingProfile.sleepSchedule,
                        bedTime: e.target.value,
                      })
                    }
                    className="w-full min-h-[38px] px-2.5 py-1.5 font-mono text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sleep-waketime"
                    className="block text-[11px] font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {s.wakeTimeLabel} ({editingProfile.name})
                  </label>
                  <input
                    id="sleep-waketime"
                    type="time"
                    value={editingProfile.sleepSchedule.wakeTime}
                    onChange={(e) =>
                      onUpdateSleepSchedule(editingProfile.id, {
                        ...editingProfile.sleepSchedule,
                        wakeTime: e.target.value,
                      })
                    }
                    className="w-full min-h-[38px] px-2.5 py-1.5 font-mono text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] rounded-lg"
                  />
                </div>
              </div>
            </div>

            {nightModePolicy !== 'manual' && (
              <div className="pt-1 border-t border-[#E1E8EE] dark:border-[#1B2A42] space-y-2">
                <button
                  type="button"
                  onClick={() => setShowDemoNightToggle((v) => !v)}
                  aria-expanded={showDemoNightToggle}
                  className="w-full inline-flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-[#64798F] hover:text-[#0F1D32] dark:text-[#8DA2B9] dark:hover:text-[#F1F5F9] cursor-pointer"
                >
                  <span>{demoLabel}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showDemoNightToggle ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {showDemoNightToggle && (
                  <button
                    type="button"
                    onClick={onToggleSimulateNightTime}
                    aria-pressed={simulateNightTime}
                    className={`w-full min-h-[38px] px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      simulateNightTime
                        ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                        : 'bg-[#F8FAFC] text-[#0F1D32] border-[#E1E8EE] hover:bg-[#EFF4F8] dark:bg-[#132036] dark:text-[#E2ECF5] dark:border-[#1E304D]'
                    }`}
                  >
                    <span>{s.simulateNightBtn}</span>
                    <span className="font-mono text-[11px]">
                      {simulateNightTime ? s.activeLabel : s.inactiveLabel}
                    </span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
