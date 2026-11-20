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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E1E8EE] dark:border-[#1B2A42]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64798F] dark:text-[#7B91A8]">
            {s.eyebrow}
          </p>
          <h2 className="text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2 mt-0.5">
            <SlidersHorizontal
              className="w-5 h-5 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0"
              aria-hidden="true"
            />
            <span>{s.title}</span>
          </h2>
          <p className="mt-1 text-xs text-[#475B70] dark:text-[#9DB0C6] leading-relaxed">
            {s.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087066] dark:text-[#5EEAD4]">
            <HardDriveDownload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{s.savedLocally}</span>
          </span>

          <button
            type="button"
            onClick={handleReset}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#475B70] bg-[#F8FAFC] hover:bg-[#EDF3F7] border border-[#E1E8EE] dark:text-[#9DB0C6] dark:bg-[#09111E] dark:hover:bg-[#122038] dark:border-[#1B2A42] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{s.resetBtn}</span>
          </button>
        </div>
      </div>

      {resetNotice && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-xl bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A] text-xs font-semibold text-[#087066] dark:text-[#5EEAD4] flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{s.resetSuccess}</span>
        </div>
      )}

      {/* 2-Column Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* BLOCK 1: Apparence & Mode Nuit */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2">
                {isDarkMode ? (
                  <Moon className="w-4 h-4 text-[#2DD4BF]" aria-hidden="true" />
                ) : (
                  <Sun className="w-4 h-4 text-[#0B8A7E]" aria-hidden="true" />
                )}
                <span>{s.appearanceTitle}</span>
              </h3>
              <p className="text-xs text-[#475B70] dark:text-[#9DB0C6] mt-1 leading-relaxed">
                {s.appearanceDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-pressed={isDarkMode}
              className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDarkMode
                  ? 'bg-[#122038] text-[#5EEAD4] border-[#1E304D] hover:bg-[#192D4E]'
                  : 'bg-white text-[#0F1D32] border-[#E1E8EE] hover:bg-[#EDF3F7]'
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-[#FCD34D]" aria-hidden="true" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#0F1D32]" aria-hidden="true" />
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
                      ? 'bg-[#EDF9F7] border-[#99E0D7] dark:bg-[#0A2624] dark:border-[#0B8A7E]'
                      : 'bg-white border-[#E1E8EE] hover:bg-[#F4F7F9] dark:bg-[#0D1626] dark:border-[#1B2A42] dark:hover:bg-[#122038]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active
                          ? 'text-[#0B8A7E] dark:text-[#2DD4BF]'
                          : 'text-[#64798F] dark:text-[#7B91A8]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex-1">
                      {title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] leading-snug">
                    {desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Sunrise/Sunset & Current Time */}
          <div className="px-3 py-2 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475B70] dark:text-[#9DB0C6] tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <Sunrise className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
              {s.sunriseLabel} <strong className="font-mono">{sunSchedule.sunrise}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sunset className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
              {s.sunsetLabel} <strong className="font-mono">{sunSchedule.sunset}</strong>
            </span>
            <span className="font-mono font-semibold text-[#0F1D32] dark:text-[#F1F5F9]">
              {currentTimeLabel} · {isDarkMode ? s.nightActiveLabel : s.dayActiveLabel}
            </span>
          </div>

          {/* Sleep Schedule Editor */}
          <div className="p-3 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
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
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                          : 'bg-[#F8FAFC] text-[#475B70] border-[#E1E8EE] dark:bg-[#09111E] dark:text-[#9DB0C6] dark:border-[#1B2A42]'
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
                  className="block text-[11px] font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
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
                  className="w-full min-h-[36px] px-2.5 py-1 font-mono text-xs text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-settings-wake"
                  className="block text-[11px] font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
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
                  className="w-full min-h-[36px] px-2.5 py-1 font-mono text-xs text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-lg"
                />
              </div>
            </div>

            {nightModePolicy !== 'manual' && (
              <div className="pt-1 border-t border-[#E1E8EE] dark:border-[#1B2A42] space-y-2">
                <button
                  type="button"
                  onClick={() => setShowDemoNight((v) => !v)}
                  aria-expanded={showDemoNight}
                  className="w-full inline-flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-[#64798F] hover:text-[#0F1D32] dark:text-[#7B91A8] dark:hover:text-[#F1F5F9] cursor-pointer"
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
                        ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                        : 'bg-[#F8FAFC] text-[#0F1D32] border-[#E1E8EE] hover:bg-[#EDF3F7] dark:bg-[#09111E] dark:text-[#E2E8F0] dark:border-[#1B2A42]'
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
        <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>{s.languageTitle}</span>
              </h3>
              <p className="text-xs text-[#475B70] dark:text-[#9DB0C6] mt-1 leading-relaxed">
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
                    ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                    : 'bg-white text-[#0F1D32] border-[#E1E8EE] hover:bg-[#F4F7F9] dark:bg-[#0D1626] dark:text-[#F1F5F9] dark:border-[#1B2A42]'
                }`}
              >
                <div>
                  <p className="text-sm font-bold">{s.langFrLabel}</p>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      language === 'fr'
                        ? 'text-white/80'
                        : 'text-[#64798F] dark:text-[#7B91A8]'
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
                    ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                    : 'bg-white text-[#0F1D32] border-[#E1E8EE] hover:bg-[#F4F7F9] dark:bg-[#0D1626] dark:text-[#F1F5F9] dark:border-[#1B2A42]'
                }`}
              >
                <div>
                  <p className="text-sm font-bold">{s.langArLabel}</p>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      language === 'ar'
                        ? 'text-white/80'
                        : 'text-[#64798F] dark:text-[#7B91A8]'
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
          <div className="pt-4 border-t border-[#E1E8EE] dark:border-[#1B2A42] space-y-2.5">
            <div>
              <h4 className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>{s.unitTitle}</span>
              </h4>
              <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5">
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
                    className={`min-h-[40px] px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      active
                        ? 'bg-[#EDF9F7] text-[#087066] border-[#BEEAE4] dark:bg-[#0A2624] dark:text-[#5EEAD4] dark:border-[#0B8A7E]'
                        : 'bg-white text-[#475B70] border-[#E1E8EE] hover:bg-[#F4F7F9] dark:bg-[#0D1626] dark:text-[#9DB0C6] dark:border-[#1B2A42]'
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
        <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
              <span>{s.alertsTitle}</span>
            </h3>
            <p className="text-xs text-[#475B70] dark:text-[#9DB0C6] mt-1">
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
              className="w-full p-3 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#C2D0DC] dark:hover:border-[#2C456E] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                  {s.feverAlertsLabel}
                </p>
                <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5">
                  {s.feverAlertsSub}
                </p>
              </div>
              <span
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                  alertsEnabled ? 'bg-[#0B8A7E] justify-end' : 'bg-[#CBD8E0] dark:bg-[#1E304D] justify-start'
                }`}
              >
                <span className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
              </span>
            </button>

            {/* Toggle 2: Sound */}
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={onToggleSound}
              className="w-full p-3 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#C2D0DC] dark:hover:border-[#2C456E] transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                    {s.alertSoundLabel}
                  </p>
                  <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5">
                    {s.alertSoundSub}
                  </p>
                </div>
              </div>
              <span
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                  soundEnabled ? 'bg-[#0B8A7E] justify-end' : 'bg-[#CBD8E0] dark:bg-[#1E304D] justify-start'
                }`}
              >
                <span className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
              </span>
            </button>

            {/* Toggle 3: Smart Persistence */}
            <button
              type="button"
              role="switch"
              aria-checked={smartPersistenceEnabled}
              onClick={onToggleSmartPersistence}
              className="w-full p-3 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#C2D0DC] dark:hover:border-[#2C456E] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                  {s.antiSpikeLabel}
                </p>
                <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5">
                  {s.antiSpikeSub}
                </p>
              </div>
              <span
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                  smartPersistenceEnabled
                    ? 'bg-[#0B8A7E] justify-end'
                    : 'bg-[#CBD8E0] dark:bg-[#1E304D] justify-start'
                }`}
              >
                <span className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
              </span>
            </button>

            {smartPersistenceEnabled && (
              <div className="p-3 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] space-y-1.5">
                <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
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
                        className={`min-h-[36px] px-2 py-1.5 rounded-lg border font-mono text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                            : 'bg-[#F8FAFC] text-[#475B70] border-[#E1E8EE] hover:bg-[#EDF3F7] dark:bg-[#09111E] dark:text-[#9DB0C6] dark:border-[#1B2A42]'
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
              className="w-full p-3 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#C2D0DC] dark:hover:border-[#2C456E] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                  {s.overrideSilentLabel}
                </p>
                <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5">
                  {s.overrideSilentSub}
                </p>
              </div>
              <span
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                  overrideSilentMode
                    ? 'bg-[#0B8A7E] justify-end'
                    : 'bg-[#CBD8E0] dark:bg-[#1E304D] justify-start'
                }`}
              >
                <span className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
              </span>
            </button>

            {/* Desktop Notification Status + Actions */}
            <div className="p-3 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                  <span>{s.desktopNotifLabel}</span>
                </p>
                <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5">
                  {notifStatusLabel}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {notificationPermission === 'default' && (
                  <button
                    type="button"
                    onClick={onRequestNotificationPermission}
                    className="min-h-[34px] px-3 py-1 text-[11px] font-semibold text-white bg-[#0F1D32] hover:bg-[#1B2F4D] dark:bg-[#0B8A7E] dark:hover:bg-[#087066] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {s.notifEnableBtn}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onTestAlert}
                  className="min-h-[34px] px-3 py-1 text-[11px] font-semibold text-[#087066] bg-[#EDF9F7] hover:bg-[#D8F2EE] border border-[#BEEAE4] dark:text-[#5EEAD4] dark:bg-[#0A2624] dark:border-[#134E4A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {s.notifTestBtn}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 4: Capteur BLE, Patch & Confort */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-3.5">
          <div>
            <h3 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
              <span>{s.sensorTitle}</span>
            </h3>
            <p className="text-xs text-[#475B70] dark:text-[#9DB0C6] mt-1">
              {s.sensorDesc}
            </p>
          </div>

          {/* BLE Cadence */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
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
                    className={`min-h-[38px] px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer text-center ${
                      active
                        ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                        : 'bg-white text-[#475B70] border-[#E1E8EE] hover:bg-[#F4F7F9] dark:bg-[#0D1626] dark:text-[#9DB0C6] dark:border-[#1B2A42]'
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
            <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
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
                    className={`min-h-[36px] px-2 py-1.5 rounded-lg border font-mono text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#EDF9F7] text-[#087066] border-[#BEEAE4] dark:bg-[#0A2624] dark:text-[#5EEAD4] dark:border-[#0B8A7E]'
                        : 'bg-white text-[#475B70] border-[#E1E8EE] hover:bg-[#F4F7F9] dark:bg-[#0D1626] dark:text-[#9DB0C6] dark:border-[#1B2A42]'
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
            className="w-full p-3 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#C2D0DC] dark:hover:border-[#2C456E] transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <Sparkles
                className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                  {s.reduceMotionLabel}
                </p>
                <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5">
                  {s.reduceMotionSub}
                </p>
              </div>
            </div>
            <span
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                reduceMotion
                  ? 'bg-[#0B8A7E] justify-end'
                  : 'bg-[#CBD8E0] dark:bg-[#1E304D] justify-start'
              }`}
            >
              <span className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
            </span>
          </button>

          {/* Auto-confirm identity on profile switch */}
          <button
            type="button"
            role="switch"
            aria-checked={autoConfirmIdentity}
            onClick={onToggleAutoConfirmIdentity}
            className="w-full p-3 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] flex items-center justify-between gap-3 text-start cursor-pointer hover:border-[#C2D0DC] dark:hover:border-[#2C456E] transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <ShieldCheck
                className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                  {s.autoConfirmIdentityLabel}
                </p>
                <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5">
                  {s.autoConfirmIdentitySub}
                </p>
              </div>
            </div>
            <span
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                autoConfirmIdentity
                  ? 'bg-[#0B8A7E] justify-end'
                  : 'bg-[#CBD8E0] dark:bg-[#1E304D] justify-start'
              }`}
            >
              <span className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
