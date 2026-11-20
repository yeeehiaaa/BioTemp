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
import { ChildProfile } from '../types/biotemp';
import { NightModePolicy, SleepSchedule } from '../utils/nightMode';

interface TopBarSettingsPopoverProps {
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
      title: 'Manuel',
      subtitle: 'Bascule directe Jour / Nuit depuis la barre supérieure.',
      icon: SlidersHorizontal,
    },
    {
      id: 'sun_schedule',
      title: 'Heure locale (Soleil)',
      subtitle: `Actif automatiquement du coucher (${sunSchedule.sunset}) au lever (${sunSchedule.sunrise}).`,
      icon: Sunset,
    },
    {
      id: 'child_sleep',
      title: `Sommeil de ${activeProfile.name}`,
      subtitle: `Actif de ${activeProfile.sleepSchedule.bedTime} à ${activeProfile.sleepSchedule.wakeTime} selon son rythme.`,
      icon: Baby,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Click-outside backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label="Paramètres automatiques du Mode Nuit"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="fixed top-16 sm:top-[72px] right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[390px] max-h-[82vh] overflow-y-auto bg-white dark:bg-[#0F1E36] border border-[#DCE6EA] dark:border-[#1E3354] rounded-3xl shadow-2xl p-4 sm:p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] dark:bg-[#0D2B2C] dark:border-[#115E59] flex items-center justify-center text-[#0D9488] dark:text-[#2DD4BF]">
                  {isDarkMode ? (
                    <Moon className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Sun className="w-4 h-4" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA]">
                    Paramètres Mode Nuit
                  </h2>
                  <p className="text-[11px] text-[#647B8C] dark:text-[#8BA3BC] tabular-nums">
                    {simulateNightTime ? 'Heure simulée' : 'Heure locale'} :{' '}
                    <span className="font-mono font-semibold">{currentTimeLabel}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer les paramètres"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#647B8C] hover:bg-[#F3F7F9] dark:text-[#8BA3BC] dark:hover:bg-[#162947] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Policy Radio Options */}
            <div className="space-y-2" role="radiogroup" aria-label="Déclenchement du Mode Nuit">
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
                    className={`w-full text-left p-3 rounded-2xl border transition-colors flex items-start gap-3 cursor-pointer ${
                      active
                        ? 'bg-[#F0FDFA] border-[#5EEAD4] dark:bg-[#0D2B2C] dark:border-[#0D9488]'
                        : 'bg-[#F8FAFA] border-[#E6EFF2] hover:bg-[#F1F6F8] dark:bg-[#0B172B] dark:border-[#1E3354] dark:hover:bg-[#132542]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        active
                          ? 'bg-[#0D9488] text-white'
                          : 'bg-white text-[#647B8C] border border-[#DCE6EA] dark:bg-[#162947] dark:text-[#8BA3BC] dark:border-[#243E63]'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] mt-0.5 leading-relaxed">
                        {p.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Local Sunrise / Sunset Preview Strip */}
            <div className="px-3 py-2.5 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] flex items-center justify-between text-[11px] text-[#476074] dark:text-[#94ACC4] tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <Sunrise className="w-3.5 h-3.5 text-[#EA580C]" aria-hidden="true" />
                Lever <strong className="font-mono">{sunSchedule.sunrise}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sunset className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                Coucher <strong className="font-mono">{sunSchedule.sunset}</strong>
              </span>
            </div>

            {/* Per-Child Sleep Schedule Editor */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                  <span>Horaire de sommeil par enfant</span>
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
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#162642] text-white border-[#162642] dark:bg-[#0D9488] dark:border-[#0D9488]'
                          : 'bg-white text-[#476074] border-[#DCE6EA] dark:bg-[#0F1E36] dark:text-[#94ACC4] dark:border-[#1E3354]'
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
                    className="block text-[11px] font-medium text-[#526675] dark:text-[#94ACC4] mb-1"
                  >
                    Coucher ({editingProfile.name})
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
                    className="w-full min-h-[38px] px-2.5 py-1.5 font-mono text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sleep-waketime"
                    className="block text-[11px] font-medium text-[#526675] dark:text-[#94ACC4] mb-1"
                  >
                    Réveil ({editingProfile.name})
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
                    className="w-full min-h-[38px] px-2.5 py-1.5 font-mono text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Test / Preview Simulated Night Time (collapsed by default) */}
            {nightModePolicy !== 'manual' && (
              <div className="pt-1 border-t border-[#EDF3F5] dark:border-[#1E3354] space-y-2">
                <button
                  type="button"
                  onClick={() => setShowDemoNightToggle((v) => !v)}
                  aria-expanded={showDemoNightToggle}
                  className="w-full inline-flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-[#647B8C] hover:text-[#162642] dark:text-[#8BA3BC] dark:hover:text-[#F1F6FA] cursor-pointer"
                >
                  <span>Mode test / simulation</span>
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
                    className={`w-full min-h-[38px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      simulateNightTime
                        ? 'bg-[#162642] text-white border-[#162642] dark:bg-[#0D9488] dark:border-[#0D9488]'
                        : 'bg-[#F3F7F9] text-[#162642] border-[#DCE6EA] hover:bg-[#E4EDF2] dark:bg-[#162947] dark:text-[#E2ECF5] dark:border-[#243E63]'
                    }`}
                  >
                    <span>Tester avec heure nocturne simulée (22:30)</span>
                    <span className="font-mono text-[11px]">
                      {simulateNightTime ? 'Actif' : 'Inactif'}
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
