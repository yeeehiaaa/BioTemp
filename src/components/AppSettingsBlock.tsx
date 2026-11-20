import React, { useState } from 'react';
import {
  Activity,
  Baby,
  Bell,
  BellRing,
  Check,
  ChevronDown,
  Clock,
  Globe,
  HardDriveDownload,
  Moon,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AppLanguage,
  ChildProfile,
  PatchReminderHours,
  PersistenceDurationMinutes,
  SamplingIntervalMs,
  TemperatureUnit,
} from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import { NightModePolicy, SleepSchedule } from '../utils/nightMode';
import { NotificationPermissionState } from '../utils/notifications';

interface AppSettingsBlockProps {
  language: AppLanguage;
  tempUnit: TemperatureUnit;
  isDarkMode: boolean;
  nightModePolicy: NightModePolicy;
  sunSchedule: { sunrise: string; sunset: string };
  currentTimeLabel: string;
  simulateNightTime: boolean;
  profiles: ChildProfile[];
  activeProfile: ChildProfile;
  alertsEnabled: boolean;
  soundEnabled: boolean;
  smartPersistenceEnabled: boolean;
  persistenceDurationMinutes: PersistenceDurationMinutes;
  overrideSilentMode: boolean;
  notificationPermission: NotificationPermissionState;
  samplingIntervalMs: SamplingIntervalMs;
  patchReminderHours: PatchReminderHours;
  reduceMotion: boolean;
  autoConfirmIdentity: boolean;
  onChangeLanguage: (lang: AppLanguage) => void;
  onChangeTempUnit: (unit: TemperatureUnit) => void;
  onToggleDarkMode: () => void;
  onChangeNightPolicy: (policy: NightModePolicy) => void;
  onUpdateSleepSchedule: (profileId: string, schedule: SleepSchedule) => void;
  onToggleSimulateNightTime: () => void;
  onToggleAlerts: () => void;
  onToggleSound: () => void;
  onToggleSmartPersistence: () => void;
  onChangePersistenceDuration: (minutes: PersistenceDurationMinutes) => void;
  onToggleOverrideSilentMode: () => void;
  onRequestNotificationPermission: () => void;
  onTestAlert: () => void;
  onChangeSamplingInterval: (ms: SamplingIntervalMs) => void;
  onChangePatchReminderHours: (hours: PatchReminderHours) => void;
  onToggleReduceMotion: () => void;
  onToggleAutoConfirmIdentity: () => void;
  onResetDefaults: () => void;
}

export const AppSettingsBlock: React.FC<AppSettingsBlockProps> = ({
  language,
  tempUnit,
  isDarkMode,
  nightModePolicy,
  sunSchedule,
  currentTimeLabel,
  simulateNightTime,
  profiles,
  activeProfile,
  alertsEnabled,
  soundEnabled,
  smartPersistenceEnabled,
  persistenceDurationMinutes,
  overrideSilentMode,
  notificationPermission,
  samplingIntervalMs,
  patchReminderHours,
  reduceMotion,
  autoConfirmIdentity,
  onChangeLanguage,
  onChangeTempUnit,
  onToggleDarkMode,
  onChangeNightPolicy,
  onUpdateSleepSchedule,
  onToggleSimulateNightTime,
  onToggleAlerts,
  onToggleSound,
  onToggleSmartPersistence,
  onChangePersistenceDuration,
  onToggleOverrideSilentMode,
  onRequestNotificationPermission,
  onTestAlert,
  onChangeSamplingInterval,
  onChangePatchReminderHours,
  onToggleReduceMotion,
  onToggleAutoConfirmIdentity,
  onResetDefaults,
}) => {
  const s = getStrings(language).settings;
  const demoToggleLabel = getStrings(language).primaryCard.demoToolsToggle;
  const [editingSleepProfileId, setEditingSleepProfileId] = useState(activeProfile.id);
  const [showDemoNight, setShowDemoNight] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  const editingProfile =
    profiles.find((p) => p.id === editingSleepProfileId) ?? activeProfile;

  const notifStatusLabel =
    notificationPermission === 'granted'
      ? s.notifGranted
      : notificationPermission === 'denied'
      ? s.notifDenied
      : notificationPermission === 'unsupported'
      ? s.notifUnsupported
      : s.notifDefault;

  const handleReset = () => {
    onResetDefaults();
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 3000);
  };

  return (
    <section
      id="app-settings-block"
      aria-label={s.title}
      className="biotemp-card p-5 sm:p-6 space-y-6 transition-colors"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#EDF3F5] dark:border-[#1E3354]">
        <div>
          <p className="text-xs font-medium text-[#647B8C] dark:text-[#8BA3BC]">
            {s.eyebrow}
          </p>
          <h2 className="text-lg font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-2 mt-0.5">
            <SlidersHorizontal
              className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF] shrink-0"
              aria-hidden="true"
            />
            <span>{s.title}</span>
          </h2>
          <p className="mt-1 text-xs text-[#526675] dark:text-[#94ACC4] leading-relaxed">
            {s.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] dark:bg-[#0D2B2C] dark:border-[#115E59] text-[11px] font-semibold text-[#0F766E] dark:text-[#5EEAD4]">
            <HardDriveDownload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{s.savedLocally}</span>
          </span>

          <button
            type="button"
            onClick={handleReset}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#476074] bg-[#F3F7F9] hover:bg-[#E4EDF2] border border-[#DCE6EA] dark:text-[#B0C4D8] dark:bg-[#162947] dark:hover:bg-[#1D355B] dark:border-[#243E63] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{s.resetBtn}</span>
          </button>
        </div>
      </div>

      {resetNotice && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] dark:bg-[#0D2B2C] dark:border-[#115E59] text-xs font-semibold text-[#0F766E] dark:text-[#5EEAD4] flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{s.resetSuccess}</span>
        </div>
      )}

      {/* 2-Column Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* BLOCK 1: Apparence & Mode Nuit */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-2">
                {isDarkMode ? (
                  <Moon className="w-4 h-4 text-[#2DD4BF]" aria-hidden="true" />
                ) : (
                  <Sun className="w-4 h-4 text-[#0D9488]" aria-hidden="true" />
                )}
                <span>{s.appearanceTitle}</span>
              </h3>
              <p className="text-xs text-[#526675] dark:text-[#94ACC4] mt-1 leading-relaxed">
                {s.appearanceDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-pressed={isDarkMode}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
                isDarkMode
                  ? 'bg-[#162A4B] text-[#5EEAD4] border-[#26426E] hover:bg-[#1C355E]'
                  : 'bg-white text-[#162642] border-[#DCE6EA] hover:bg-[#EDF3F6]'
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-[#FCD34D]" aria-hidden="true" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#162642]" aria-hidden="true" />
              )}
              <span>{isDarkMode ? s.toggleDayBtn : s.toggleNightBtn}</span>
            </button>
          </div>

          {/* Policy Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'manual' as NightModePolicy,
                  title: s.policyManual,
                  desc: s.policyManualDesc,
                  Icon: SlidersHorizontal,
                },
                {
                  id: 'sun_schedule' as NightModePolicy,
                  title: s.policySun,
                  desc: s.policySunDesc,
                  Icon: Sunset,
                },
                {
                  id: 'child_sleep' as NightModePolicy,
                  title: s.policyChild,
                  desc: s.policyChildDesc,
                  Icon: Baby,
                },
              ] as const
            ).map(({ id, title, desc, Icon }) => {
              const active = nightModePolicy === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChangeNightPolicy(id)}
                  aria-pressed={active}
                  className={`p-3 rounded-xl border text-start transition-colors cursor-pointer flex flex-col gap-1.5 ${
                    active
                      ? 'bg-[#F0FDFA] border-[#5EEAD4] dark:bg-[#0D2B2C] dark:border-[#0D9488]'
                      : 'bg-white border-[#E2ECF0] hover:bg-[#F3F7F9] dark:bg-[#0F1E36] dark:border-[#1E3354] dark:hover:bg-[#152845]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active
                          ? 'text-[#0D9488] dark:text-[#2DD4BF]'
                          : 'text-[#647B8C] dark:text-[#8BA3BC]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-bold text-[#162642] dark:text-[#F1F6FA] flex-1">
                      {title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] leading-snug">
                    {desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Sunrise/Sunset & Current Time */}
          <div className="px-3 py-2 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#476074] dark:text-[#94ACC4] tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <Sunrise className="w-3.5 h-3.5 text-[#EA580C]" aria-hidden="true" />
              {s.sunriseLabel} <strong className="font-mono">{sunSchedule.sunrise}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sunset className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
              {s.sunsetLabel} <strong className="font-mono">{sunSchedule.sunset}</strong>
            </span>
            <span className="font-mono font-semibold text-[#162642] dark:text-[#F1F6FA]">
              {currentTimeLabel} · {isDarkMode ? s.nightActiveLabel : s.dayActiveLabel}
            </span>
          </div>

          {/* Sleep Schedule Editor */}
          <div className="p-3 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>{s.sleepScheduleTitle}</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {profiles.map((prof) => {
                  const selected = prof.id === editingProfile.id;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => setEditingSleepProfileId(prof.id)}
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#162642] text-white border-[#162642] dark:bg-[#0D9488] dark:border-[#0D9488]'
                          : 'bg-[#F7FAFB] text-[#476074] border-[#DCE6EA] dark:bg-[#0B172B] dark:text-[#94ACC4] dark:border-[#1E3354]'
                      }`}
                    >
                      {prof.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="profile-settings-bed"
                  className="block text-[11px] font-medium text-[#526675] dark:text-[#94ACC4] mb-1"
                >
                  {s.bedTimeLabel} ({editingProfile.name})
                </label>
                <input
                  id="profile-settings-bed"
                  type="time"
                  value={editingProfile.sleepSchedule.bedTime}
                  onChange={(e) =>
                    onUpdateSleepSchedule(editingProfile.id, {
                      ...editingProfile.sleepSchedule,
                      bedTime: e.target.value,
                    })
                  }
                  className="w-full min-h-[36px] px-2.5 py-1 font-mono text-xs text-[#162642] bg-[#F7FAFB] border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-settings-wake"
                  className="block text-[11px] font-medium text-[#526675] dark:text-[#94ACC4] mb-1"
                >
                  {s.wakeTimeLabel} ({editingProfile.name})
                </label>
                <input
                  id="profile-settings-wake"
                  type="time"
                  value={editingProfile.sleepSchedule.wakeTime}
                  onChange={(e) =>
                    onUpdateSleepSchedule(editingProfile.id, {
                      ...editingProfile.sleepSchedule,
                      wakeTime: e.target.value,
                    })
                  }
                  className="w-full min-h-[36px] px-2.5 py-1 font-mono text-xs text-[#162642] bg-[#F7FAFB] border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-lg"
                />
              </div>
            </div>

            {nightModePolicy !== 'manual' && (
              <div className="pt-1 border-t border-[#E6EFF2] dark:border-[#1E3354] space-y-2">
                <button
                  type="button"
                  onClick={() => setShowDemoNight((v) => !v)}
                  aria-expanded={showDemoNight}
                  className="w-full inline-flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-[#647B8C] hover:text-[#162642] dark:text-[#8BA3BC] dark:hover:text-[#F1F6FA] cursor-pointer"
                >
                  <span>{demoToggleLabel}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showDemoNight ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {showDemoNight && (
                  <button
                    type="button"
                    onClick={onToggleSimulateNightTime}
                    aria-pressed={simulateNightTime}
                    className={`w-full min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      simulateNightTime
                        ? 'bg-[#162642] text-white border-[#162642] dark:bg-[#0D9488] dark:border-[#0D9488]'
                        : 'bg-[#F3F7F9] text-[#162642] border-[#DCE6EA] hover:bg-[#E4EDF2] dark:bg-[#162947] dark:text-[#E2ECF5] dark:border-[#243E63]'
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
          </div>
        </div>

        {/* BLOCK 2: Langue FR / العربية & Unité thermique */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>{s.languageTitle}</span>
              </h3>
              <p className="text-xs text-[#526675] dark:text-[#94ACC4] mt-1 leading-relaxed">
                {s.languageDesc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={s.languageTitle}>
              <button
                type="button"
                role="radio"
                aria-checked={language === 'fr'}
                onClick={() => onChangeLanguage('fr')}
                className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  language === 'fr'
                    ? 'bg-[#162642] text-white border-[#162642] dark:bg-[#0D9488] dark:border-[#0D9488]'
                    : 'bg-white text-[#162642] border-[#DCE6EA] hover:bg-[#EDF3F6] dark:bg-[#0F1E36] dark:text-[#F1F6FA] dark:border-[#1E3354]'
                }`}
              >
                <div>
                  <p className="text-sm font-bold">{s.langFrLabel}</p>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      language === 'fr'
                        ? 'text-white/80'
                        : 'text-[#647B8C] dark:text-[#8BA3BC]'
                    }`}
                  >
                    {s.langFrSub}
                  </p>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/15 border border-current/15">
                  FR
                </span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={language === 'ar'}
                onClick={() => onChangeLanguage('ar')}
                className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  language === 'ar'
                    ? 'bg-[#162642] text-white border-[#162642] dark:bg-[#0D9488] dark:border-[#0D9488]'
                    : 'bg-white text-[#162642] border-[#DCE6EA] hover:bg-[#EDF3F6] dark:bg-[#0F1E36] dark:text-[#F1F6FA] dark:border-[#1E3354]'
                }`}
              >
                <div>
                  <p className="text-sm font-bold">{s.langArLabel}</p>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      language === 'ar'
                        ? 'text-white/80'
                        : 'text-[#647B8C] dark:text-[#8BA3BC]'
                    }`}
                  >
                    {s.langArSub}
                  </p>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/15 border border-current/15">
                  AR
                </span>
              </button>
            </div>
          </div>

          {/* Temperature Unit */}
          <div className="pt-4 border-t border-[#E6EFF2] dark:border-[#1E3354] space-y-2.5">
            <div>
              <h4 className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>{s.unitTitle}</span>
              </h4>
              <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] mt-0.5">
                {s.unitDesc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['C', 'F'] as TemperatureUnit[]).map((unit) => {
                const active = tempUnit === unit;
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => onChangeTempUnit(unit)}
                    aria-pressed={active}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      active
                        ? 'bg-[#F0FDFA] text-[#0F766E] border-[#5EEAD4] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#0D9488]'
                        : 'bg-white text-[#476074] border-[#DCE6EA] hover:bg-[#F3F7F9] dark:bg-[#0F1E36] dark:text-[#94ACC4] dark:border-[#1E3354]'
                    }`}
                  >
                    <span className="font-mono font-bold">°{unit}</span>
                    <span>{unit === 'C' ? s.unitC : s.unitF}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BLOCK 3: Alertes & Notifications */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
              <span>{s.alertsTitle}</span>
            </h3>
            <p className="text-xs text-[#526675] dark:text-[#94ACC4] mt-1">
              {s.alertsDesc}
            </p>
          </div>

          <div className="space-y-2">
            {/* Toggle 1: Fever Alerts */}
            <button
              type="button"
              role="switch"
              aria-checked={alertsEnabled}
              onClick={onToggleAlerts}
              className="w-full p-3 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#B6CED6] dark:hover:border-[#2C4A76] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
                  {s.feverAlertsLabel}
                </p>
                <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] mt-0.5">
                  {s.feverAlertsSub}
                </p>
              </div>
              <span
                className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                  alertsEnabled ? 'bg-[#0D9488] justify-end' : 'bg-[#CBD8E0] dark:bg-[#233B61] justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            {/* Toggle 2: Sound */}
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={onToggleSound}
              className="w-full p-3 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#B6CED6] dark:hover:border-[#2C4A76] transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
                    {s.alertSoundLabel}
                  </p>
                  <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] mt-0.5">
                    {s.alertSoundSub}
                  </p>
                </div>
              </div>
              <span
                className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                  soundEnabled ? 'bg-[#0D9488] justify-end' : 'bg-[#CBD8E0] dark:bg-[#233B61] justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            {/* Toggle 3: Smart Persistence */}
            <button
              type="button"
              role="switch"
              aria-checked={smartPersistenceEnabled}
              onClick={onToggleSmartPersistence}
              className="w-full p-3 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#B6CED6] dark:hover:border-[#2C4A76] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
                  {s.antiSpikeLabel}
                </p>
                <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] mt-0.5">
                  {s.antiSpikeSub}
                </p>
              </div>
              <span
                className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                  smartPersistenceEnabled
                    ? 'bg-[#0D9488] justify-end'
                    : 'bg-[#CBD8E0] dark:bg-[#233B61] justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            {smartPersistenceEnabled && (
              <div className="p-3 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] space-y-1.5">
                <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
                  {s.persistenceDurationLabel}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {([5, 8, 10] as PersistenceDurationMinutes[]).map((mins) => {
                    const active = persistenceDurationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => onChangePersistenceDuration(mins)}
                        aria-pressed={active}
                        className={`min-h-[36px] px-2 py-1.5 rounded-xl border font-mono text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#162642] text-white border-[#162642] dark:bg-[#0D9488] dark:border-[#0D9488]'
                            : 'bg-[#F7FAFB] text-[#476074] border-[#DCE6EA] hover:bg-[#EDF3F6] dark:bg-[#0B172B] dark:text-[#94ACC4] dark:border-[#1E3354]'
                        }`}
                      >
                        {mins} {s.persistenceMinUnit}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Toggle 4: Priority Override Silent Mode */}
            <button
              type="button"
              role="switch"
              aria-checked={overrideSilentMode}
              onClick={onToggleOverrideSilentMode}
              className="w-full p-3 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#B6CED6] dark:hover:border-[#2C4A76] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
                  {s.overrideSilentLabel}
                </p>
                <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] mt-0.5">
                  {s.overrideSilentSub}
                </p>
              </div>
              <span
                className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                  overrideSilentMode
                    ? 'bg-[#0D9488] justify-end'
                    : 'bg-[#CBD8E0] dark:bg-[#233B61] justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            {/* Desktop Notification Status + Actions */}
            <div className="p-3 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                  <span>{s.desktopNotifLabel}</span>
                </p>
                <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] mt-0.5">
                  {notifStatusLabel}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {notificationPermission === 'default' && (
                  <button
                    type="button"
                    onClick={onRequestNotificationPermission}
                    className="min-h-[34px] px-3 py-1 text-[11px] font-semibold text-white bg-[#162642] hover:bg-[#1E3356] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] rounded-full cursor-pointer"
                  >
                    {s.notifEnableBtn}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onTestAlert}
                  className="min-h-[34px] px-3 py-1 text-[11px] font-semibold text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] dark:text-[#5EEAD4] dark:bg-[#0D2B2C] dark:border-[#115E59] rounded-full cursor-pointer"
                >
                  {s.notifTestBtn}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 4: Capteur BLE, Patch & Confort */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] space-y-3.5">
          <div>
            <h3 className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
              <span>{s.sensorTitle}</span>
            </h3>
            <p className="text-xs text-[#526675] dark:text-[#94ACC4] mt-1">
              {s.sensorDesc}
            </p>
          </div>

          {/* BLE Cadence */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
              {s.cadenceLabel}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { ms: 60000 as SamplingIntervalMs, label: s.cadenceFast },
                  { ms: 180000 as SamplingIntervalMs, label: s.cadenceStandard },
                  { ms: 300000 as SamplingIntervalMs, label: s.cadenceEco },
                ] as const
              ).map(({ ms, label }) => {
                const active = samplingIntervalMs === ms;
                return (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => onChangeSamplingInterval(ms)}
                    aria-pressed={active}
                    className={`min-h-[38px] px-2 py-1.5 rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer text-center ${
                      active
                        ? 'bg-[#162642] text-white border-[#162642] dark:bg-[#0D9488] dark:border-[#0D9488]'
                        : 'bg-white text-[#476074] border-[#DCE6EA] hover:bg-[#EDF3F6] dark:bg-[#0F1E36] dark:text-[#94ACC4] dark:border-[#1E3354]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patch Reminder Hours */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
              {s.patchLimitLabel}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {([12, 18, 24] as PatchReminderHours[]).map((hrs) => {
                const active = patchReminderHours === hrs;
                return (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => onChangePatchReminderHours(hrs)}
                    aria-pressed={active}
                    className={`min-h-[36px] px-2 py-1.5 rounded-xl border font-mono text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F0FDFA] text-[#0F766E] border-[#5EEAD4] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#0D9488]'
                        : 'bg-white text-[#476074] border-[#DCE6EA] hover:bg-[#EDF3F6] dark:bg-[#0F1E36] dark:text-[#94ACC4] dark:border-[#1E3354]'
                    }`}
                  >
                    {hrs} {s.patchLimitHours}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reduced Motion Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={reduceMotion}
            onClick={onToggleReduceMotion}
            className="w-full p-3 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#B6CED6] dark:hover:border-[#2C4A76] transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <Sparkles
                className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
                  {s.reduceMotionLabel}
                </p>
                <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] mt-0.5">
                  {s.reduceMotionSub}
                </p>
              </div>
            </div>
            <span
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                reduceMotion
                  ? 'bg-[#0D9488] justify-end'
                  : 'bg-[#CBD8E0] dark:bg-[#233B61] justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </span>
          </button>

          {/* Auto-confirm identity on profile switch */}
          <button
            type="button"
            role="switch"
            aria-checked={autoConfirmIdentity}
            onClick={onToggleAutoConfirmIdentity}
            className="w-full p-3 rounded-xl bg-white border border-[#E2ECF0] dark:bg-[#0F1E36] dark:border-[#1E3354] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#B6CED6] dark:hover:border-[#2C4A76] transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <ShieldCheck
                className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
                  {s.autoConfirmIdentityLabel}
                </p>
                <p className="text-[11px] text-[#526675] dark:text-[#94ACC4] mt-0.5">
                  {s.autoConfirmIdentitySub}
                </p>
              </div>
            </div>
            <span
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                autoConfirmIdentity
                  ? 'bg-[#0D9488] justify-end'
                  : 'bg-[#CBD8E0] dark:bg-[#233B61] justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
