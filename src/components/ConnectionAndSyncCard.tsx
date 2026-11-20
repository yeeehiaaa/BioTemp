import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BatteryMedium,
  BatteryWarning,
  BellRing,
  Bluetooth,
  BluetoothOff,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  HardDrive,
  Loader2,
  PauseCircle,
  Plus,
  Power,
  RefreshCw,
  Router,
  ShieldCheck,
  SignalMedium,
  TrendingDown,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react';
import { AppLanguage, ChildProfile, PatchReminderHours } from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import {
  NotificationPermissionState,
  playGentleAlertChime,
  sendLowBatterySystemNotification,
} from '../utils/notifications';
import { evaluateSignalContactQuality, formatTimeFr } from '../utils/temperature';
import { BatteryHistoryChart } from './BatteryHistoryChart';

interface ConnectionAndSyncCardProps {
  language?: AppLanguage;
  profile: ChildProfile;
  patchReminderHours?: PatchReminderHours;
  alertsEnabled: boolean;
  soundEnabled: boolean;
  smartPersistenceEnabled: boolean;
  isSyncingBuffer: boolean;
  notificationPermission: NotificationPermissionState;
  onToggleAlerts: () => void;
  onToggleSound: () => void;
  onToggleSmartPersistence: () => void;
  onTestAlert: () => void;
  onSimulateOutOfRange: () => void;
  onSimulateSkinRemoval: () => void;
  onResumeSession: () => void;
  onReconnectAndSync: () => void;
  onAddManualBufferedPoint: () => void;
  onToggleHomeHub: () => void;
  onChangeHomeHubDevice: (deviceName: string) => void;
  onDismissSyncNotice: () => void;
  onEndSession?: () => void;
  onOpenReplaceDevice?: () => void;
}

const HUB_DEVICES = ['iPad Chambre', 'Ancien smartphone chevet', 'Tablette Salon'];
const STANDARD_HOURLY_DRAIN_RATE = 0.5; // %/h -> 12%/jour (~200 h pour 100 %, ~30 h sous 15 %)
const STANDARD_DAILY_DRAIN_RATE = STANDARD_HOURLY_DRAIN_RATE * 24;

export const ConnectionAndSyncCard: React.FC<ConnectionAndSyncCardProps> = ({
  language = 'fr',
  profile,
  patchReminderHours = 12,
  alertsEnabled,
  soundEnabled,
  smartPersistenceEnabled,
  isSyncingBuffer,
  notificationPermission,
  onToggleAlerts,
  onToggleSound,
  onToggleSmartPersistence,
  onTestAlert,
  onSimulateOutOfRange,
  onSimulateSkinRemoval,
  onResumeSession,
  onReconnectAndSync,
  onAddManualBufferedPoint,
  onToggleHomeHub,
  onChangeHomeHubDevice,
  onDismissSyncNotice,
  onEndSession,
  onOpenReplaceDevice,
}) => {
  const dc = getStrings(language).deviceCopy;
  const settingsCopy = getStrings(language).settings;
  const demoToggleLabel = getStrings(language).primaryCard.demoToolsToggle;
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showSimTools, setShowSimTools] = useState(false);
  const lowBatteryNotifiedRef = useRef<Set<string>>(new Set());

  const isOutOfRange = profile.connectionMode === 'out_of_range';
  const isRelayed = profile.connectionMode === 'home_hub_relayed';
  const isStandby = profile.connectionMode === 'standby_removed';
  const signalQuality = evaluateSignalContactQuality(profile, language);

  const batteryTrend = useMemo(() => {
    const series =
      profile.batteryHistory && profile.batteryHistory.length === 7
        ? [...profile.batteryHistory.slice(0, 6), profile.battery]
        : Array.from({ length: 7 }, (_, i) => {
            return Math.min(100, Math.round(profile.battery + (6 - i) * STANDARD_DAILY_DRAIN_RATE));
          });

    let totalDrop = 0;
    let dropDays = 0;
    for (let i = 1; i < series.length; i++) {
      const diff = series[i - 1] - series[i];
      if (diff > 0) {
        totalDrop += diff;
        dropDays += 1;
      }
    }
    const avgDailyDrain = dropDays > 0 ? totalDrop / dropDays : STANDARD_DAILY_DRAIN_RATE;
    const usableBattery = Math.max(0, profile.battery - 15);
    const hoursAboveThreshold = Math.round(usableBattery / STANDARD_HOURLY_DRAIN_RATE);
    const daysRemaining =
      usableBattery === 0 ? 0 : Math.floor(hoursAboveThreshold / 24);

    return {
      series,
      avgDailyDrain,
      hoursAboveThreshold,
      daysRemaining,
    };
  }, [profile.battery, profile.batteryHistory]);

  const isLowBatteryAlert = profile.battery < 15;
  const isBatteryCritical = isLowBatteryAlert || batteryTrend.hoursAboveThreshold <= 24;
  const isBatteryLow =
    !isBatteryCritical && (profile.battery <= 40 || batteryTrend.daysRemaining <= 2);

  const estimatedRemainingHours = Math.max(
    0,
    Math.round(profile.battery / STANDARD_HOURLY_DRAIN_RATE)
  );
  const batteryHoursText = dc.batteryRemainingHours.replace(
    '{hours}',
    String(estimatedRemainingHours)
  );

  useEffect(() => {
    const notifyKey = `${profile.id}:${profile.deviceId}`;
    if (!isLowBatteryAlert) {
      lowBatteryNotifiedRef.current.delete(notifyKey);
      return;
    }
    if (!alertsEnabled || lowBatteryNotifiedRef.current.has(notifyKey)) {
      return;
    }
    lowBatteryNotifiedRef.current.add(notifyKey);
    sendLowBatterySystemNotification({
      profileId: profile.id,
      profileName: profile.name,
      deviceName: profile.deviceName,
      deviceId: profile.deviceId,
      battery: profile.battery,
      remainingHours: estimatedRemainingHours,
      language,
    });
    if (soundEnabled) {
      playGentleAlertChime(false);
    }
  }, [
    isLowBatteryAlert,
    alertsEnabled,
    soundEnabled,
    profile.id,
    profile.name,
    profile.deviceName,
    profile.deviceId,
    profile.battery,
    estimatedRemainingHours,
    language,
  ]);

  const batteryForecastText =
    profile.battery < 15 || batteryTrend.hoursAboveThreshold === 0
      ? dc.batteryForecastNow
      : batteryTrend.daysRemaining < 1
      ? language === 'ar'
        ? `خلال ~${batteryTrend.hoursAboveThreshold} س`
        : `Dans ~${batteryTrend.hoursAboveThreshold} h`
      : batteryTrend.daysRemaining > 30
      ? dc.batteryForecastMoreThan30
      : dc.batteryForecastDays.replace('{days}', String(batteryTrend.daysRemaining));

  const hoursWorn = Math.max(
    0,
    Math.floor((Date.now() - profile.patchAppliedAt) / (60 * 60 * 1000))
  );
  const patchHoursLeft = Math.max(0, patchReminderHours - hoursWorn);
  const patchNeedsChange = hoursWorn >= patchReminderHours;
  const patchForecastText = patchNeedsChange
    ? dc.patchForecastNow
    : dc.patchForecastHours.replace('{hours}', String(patchHoursLeft));

  const sparkStrokeColor = isBatteryCritical
    ? '#D91E43'
    : isBatteryLow
    ? '#D97706'
    : '#0B8A7E';

  const permissionStatusText =
    notificationPermission === 'granted'
      ? settingsCopy.notifGranted
      : notificationPermission === 'denied'
      ? settingsCopy.notifDenied
      : notificationPermission === 'unsupported'
      ? settingsCopy.notifUnsupported
      : settingsCopy.notifDefault;

  return (
    <aside
      id="relais-domestique"
      aria-label="Connexion, mémoire tampon, alertes et relais domestique"
      className="biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors"
    >
      {/* Top Status & Centered Concentric Emblem */}
      <div className="flex flex-col items-center text-center">
        <div className="w-full flex items-center justify-between text-xs text-[#64798F] dark:text-[#8DA2B9] tabular-nums">
          <span className="font-mono font-semibold text-[#0F1D32] dark:text-[#F1F5F9]">
            {profile.deviceName} · {profile.deviceId}
          </span>
          <span
            className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#0F1D32] dark:text-[#F1F5F9]"
            title={`${dc.batteryRemainingLabel} (${dc.batteryStandardRateNote})`}
          >
            <BatteryMedium
              className={`w-4 h-4 ${
                isBatteryCritical
                  ? 'text-[#D91E43] dark:text-[#FDA4AF]'
                  : isBatteryLow
                  ? 'text-[#D97706] dark:text-[#FBBF24]'
                  : 'text-[#0B8A7E] dark:text-[#2DD4BF]'
              }`}
              aria-hidden="true"
            />
            <span>{profile.battery} %</span>
            <span className="text-[#64798F] dark:text-[#8DA2B9] font-normal">
              · {batteryHoursText}
            </span>
          </span>
        </div>

        {/* Concentric Instrument Emblem */}
        <div className="my-4 relative flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
              isStandby
                ? 'bg-[#F8FAFC] dark:bg-[#132036]'
                : isOutOfRange
                ? 'bg-[#FEF7EC] dark:bg-[#261909]'
                : isRelayed
                ? 'bg-[#EEF5FF] dark:bg-[#0F203B]'
                : 'bg-[#EDF9F7] dark:bg-[#0A2624]'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full bg-white dark:bg-[#0D1626] shadow-sm flex items-center justify-center border ${
                isStandby
                  ? 'border-[#E1E8EE] dark:border-[#1B2A42]'
                  : isOutOfRange
                  ? 'border-[#FCDCA8] dark:border-[#78350F]'
                  : isRelayed
                  ? 'border-[#C7DDFF] dark:border-[#1E3A6E]'
                  : 'border-[#BEEAE4] dark:border-[#134E4A]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                  isStandby
                    ? 'bg-[#64798F]'
                    : isOutOfRange
                    ? 'bg-[#D97706]'
                    : isRelayed
                    ? 'bg-[#2563EB]'
                    : 'bg-[#0B8A7E]'
                }`}
              >
                {isStandby ? (
                  <PauseCircle className="w-5 h-5" aria-hidden="true" />
                ) : isOutOfRange ? (
                  <BluetoothOff className="w-5 h-5" aria-hidden="true" />
                ) : isRelayed ? (
                  <Router className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Bluetooth className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-base font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
          {isStandby
            ? dc.standbyPromptTitle
            : isOutOfRange
            ? dc.outOfRangeTitle
            : isRelayed
            ? language === 'ar'
              ? 'متصل عبر الموزع المنزلي'
              : 'Connecté via Relais Domestique'
            : language === 'ar'
            ? 'متصل عبر البلوتوث BLE'
            : 'Connecté en BLE'}
        </h2>

        <p className="mt-1 text-xs text-[#64798F] dark:text-[#9DB0C6] leading-relaxed max-w-[320px]">
          {isStandby
            ? dc.standbyPromptDesc
            : isOutOfRange
            ? dc.outOfRangeDesc
            : isRelayed
            ? language === 'ar'
              ? `يصل البث مباشرة عبر ${profile.homeHubDeviceName}.`
              : `Flux transmis en direct via ${profile.homeHubDeviceName}.`
            : language === 'ar'
            ? 'اتصال BLE منخفض الطاقة لا يزعج نوم الطفل.'
            : 'BLE très basse puissance, émission brève sans réveiller l’enfant.'}
        </p>

        {!isOutOfRange && !isStandby && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B8A7E] dark:text-[#2DD4BF]">
            <span
              className="w-2 h-2 rounded-full bg-[#0B8A7E] dark:bg-[#2DD4BF] animate-pulse"
              aria-hidden="true"
            />
            <span>
              {language === 'ar' ? 'الاستقبال المستمر نشط' : 'Réception continue active'}
            </span>
          </div>
        )}

        {/* Signal & Contact Quality Indicator */}
        <div
          className={`mt-3 w-full px-3.5 py-2.5 rounded-xl border text-start flex items-start gap-2.5 text-xs ${
            signalQuality.status === 'oscillating'
              ? 'bg-[#FEF7EC] border-[#FCDCA8] text-[#92400E] dark:bg-[#261909] dark:border-[#78350F] dark:text-[#FCD34D]'
              : signalQuality.status === 'stabilizing'
              ? 'bg-[#EEF5FF] border-[#C7DDFF] text-[#1E40AF] dark:bg-[#0F203B] dark:border-[#1E3A6E] dark:text-[#93C5FD]'
              : signalQuality.status === 'no_contact'
              ? 'bg-[#F8FAFC] border-[#E1E8EE] text-[#475B70] dark:bg-[#09111E] dark:border-[#1B2A42] dark:text-[#9DB0C6]'
              : 'bg-[#F8FAFC] border-[#E1E8EE] text-[#0F1D32] dark:bg-[#09111E] dark:border-[#1B2A42] dark:text-[#E2ECF5]'
          }`}
        >
          <SignalMedium
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              signalQuality.status === 'oscillating'
                ? 'text-[#D97706] dark:text-[#FBBF24]'
                : signalQuality.status === 'stabilizing'
                ? 'text-[#2563EB] dark:text-[#60A5FA]'
                : signalQuality.status === 'no_contact'
                ? 'text-[#64798F]'
                : 'text-[#0B8A7E] dark:text-[#2DD4BF]'
            }`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-bold leading-snug">
              {dc.signalQualityHeading} · {signalQuality.label}
            </p>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
              {signalQuality.detail}
            </p>
          </div>
        </div>

        {/* 7-Day Battery Usage Trend Sparkline & Replacement Forecast */}
        <div
          aria-label={dc.batteryTrendTitle}
          className="mt-2.5 w-full px-3.5 py-3 rounded-xl border border-[#E1E8EE] bg-[#F8FAFC] dark:bg-[#09111E] dark:border-[#1B2A42] text-start space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 min-w-0">
              <TrendingDown
                className={`w-3.5 h-3.5 shrink-0 ${
                  isBatteryCritical
                    ? 'text-[#D91E43] dark:text-[#FDA4AF]'
                    : isBatteryLow
                    ? 'text-[#D97706] dark:text-[#FBBF24]'
                    : 'text-[#0B8A7E] dark:text-[#2DD4BF]'
                }`}
                aria-hidden="true"
              />
              <span className="font-bold text-[#0F1D32] dark:text-[#F1F5F9] truncate">
                {dc.batteryTrendTitle}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] tabular-nums">
              <span className="text-[#64798F] dark:text-[#8DA2B9]">
                −{batteryTrend.avgDailyDrain.toFixed(1).replace('.', language === 'fr' ? ',' : '.')}{' '}
                {dc.batteryPerDayUnit}
              </span>
              <span className="font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                {dc.todayLabel} · {profile.battery}%
              </span>
            </div>
          </div>

          <BatteryHistoryChart
            batteryHistory={batteryTrend.series}
            language={language}
            todayLabel={dc.todayLabel}
            strokeColor={sparkStrokeColor}
          />

          <div className="pt-2.5 border-t border-[#E1E8EE] dark:border-[#1B2A42] grid grid-cols-3 gap-2.5 text-start">
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[10px] text-[#64798F] dark:text-[#8DA2B9] leading-tight">
                <BatteryMedium
                  className={`w-3 h-3 shrink-0 ${
                    isBatteryCritical
                      ? 'text-[#D91E43] dark:text-[#FDA4AF]'
                      : isBatteryLow
                      ? 'text-[#D97706] dark:text-[#FBBF24]'
                      : 'text-[#0B8A7E] dark:text-[#2DD4BF]'
                  }`}
                  aria-hidden="true"
                />
                <span>{dc.batteryRemainingLabel}</span>
              </div>
              <p
                className={`mt-0.5 text-xs font-mono font-bold tabular-nums ${
                  isBatteryCritical
                    ? 'text-[#D91E43] dark:text-[#FDA4AF]'
                    : isBatteryLow
                    ? 'text-[#D97706] dark:text-[#FBBF24]'
                    : 'text-[#0F1D32] dark:text-[#F1F5F9]'
                }`}
              >
                {batteryHoursText}
              </p>
              <p className="text-[10px] font-mono text-[#64798F] dark:text-[#7B91A8] leading-tight">
                {dc.batteryStandardRateNote}
              </p>
            </div>

            <div className="min-w-0 text-center">
              <p className="text-[10px] text-[#64798F] dark:text-[#8DA2B9] leading-tight">
                {dc.batteryForecastLabel}
              </p>
              <p
                className={`mt-0.5 text-xs font-bold tabular-nums ${
                  isBatteryCritical
                    ? 'text-[#D91E43] dark:text-[#FDA4AF]'
                    : isBatteryLow
                    ? 'text-[#D97706] dark:text-[#FBBF24]'
                    : 'text-[#0F1D32] dark:text-[#F1F5F9]'
                }`}
              >
                {batteryForecastText}
              </p>
            </div>

            <div className="min-w-0 text-end">
              <div className="inline-flex items-center justify-end gap-1 text-[10px] text-[#64798F] dark:text-[#8DA2B9] leading-tight">
                <Clock
                  className={`w-3 h-3 shrink-0 ${
                    patchNeedsChange
                      ? 'text-[#D97706] dark:text-[#FBBF24]'
                      : 'text-[#0B8A7E] dark:text-[#2DD4BF]'
                  }`}
                  aria-hidden="true"
                />
                <span>{dc.patchForecastLabel}</span>
              </div>
              <p
                className={`mt-0.5 text-xs font-bold tabular-nums ${
                  patchNeedsChange
                    ? 'text-[#D97706] dark:text-[#FBBF24]'
                    : 'text-[#0F1D32] dark:text-[#F1F5F9]'
                }`}
              >
                {patchForecastText}
              </p>
            </div>
          </div>
        </div>

        {/* Specific Low-Battery Warning Banner (< 15%) */}
        {isLowBatteryAlert && (
          <div
            role="alert"
            className="mt-2.5 w-full px-3.5 py-3 rounded-xl border bg-[#FEF1F3] border-[#FCCAD3] text-[#9F1239] dark:bg-[#2A0E17] dark:border-[#881337] dark:text-[#FECDD3] text-start flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#D91E43] text-white flex items-center justify-center shrink-0 mt-0.5">
                <BatteryWarning className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-bold leading-snug text-[#9F1239] dark:text-[#FDA4AF]">
                  {dc.lowBatteryWarningTitle} · {profile.battery} %
                </p>
                <p className="text-[11px] opacity-95 mt-0.5 leading-relaxed">
                  {dc.lowBatteryWarningDesc.replace('{hours}', String(estimatedRemainingHours))}
                </p>
              </div>
            </div>

            {onOpenReplaceDevice && (
              <button
                type="button"
                onClick={onOpenReplaceDevice}
                className="min-h-[34px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#D91E43] hover:bg-[#B91737] rounded-lg transition-colors whitespace-nowrap shrink-0 self-end sm:self-center cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{dc.lowBatteryReplaceAction}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Connection Simulation & Syncing */}
      <div className="space-y-3">
        {isSyncingBuffer ? (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A] flex items-center justify-center gap-2.5 text-xs font-semibold text-[#087066] dark:text-[#5EEAD4]"
          >
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>
              {language === 'ar'
                ? 'جاري مزامنة القراءات المحفوظة...'
                : 'Synchronisation des mesures enregistrées en cours...'}
            </span>
          </div>
        ) : isStandby ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onResumeSession}
              className="min-h-[42px] w-full px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0B8A7E] hover:bg-[#087066] rounded-xl transition-colors cursor-pointer"
            >
              {dc.resumeSessionBtn}
            </button>
            {onEndSession && (
              <button
                type="button"
                onClick={onEndSession}
                className="min-h-[42px] w-full px-4 py-2 text-xs sm:text-sm font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EFF4F8] border border-[#E1E8EE] dark:text-[#E2ECF5] dark:bg-[#132036] dark:hover:bg-[#192A46] dark:border-[#1E304D] rounded-xl transition-colors cursor-pointer"
              >
                {dc.endSessionBtn}
              </button>
            )}
          </div>
        ) : isOutOfRange ? (
          <div className="p-3.5 rounded-xl bg-[#FEF7EC] border border-[#FCDCA8] dark:bg-[#261909] dark:border-[#78350F] space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#9A3412] dark:text-[#FCD34D]">
              <span className="inline-flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{language === 'ar' ? 'الذاكرة الداخلية' : 'Mémoire interne'}</span>
              </span>
              <span className="font-mono text-sm font-bold tabular-nums">
                {profile.bufferedReadings.length}{' '}
                {language === 'ar'
                  ? 'قراءة'
                  : `mesure${profile.bufferedReadings.length > 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onReconnectAndSync}
                className="min-h-[42px] w-full px-5 py-2 text-sm font-semibold text-white bg-[#0F1D32] hover:bg-[#1A2D4A] dark:bg-[#0B8A7E] dark:hover:bg-[#087066] rounded-xl transition-colors cursor-pointer"
              >
                {language === 'ar'
                  ? `إعادة الاتصال والمزامنة (${profile.bufferedReadings.length})`
                  : `Reconnecter et synchroniser (${profile.bufferedReadings.length})`}
              </button>
              <button
                type="button"
                onClick={onAddManualBufferedPoint}
                className="min-h-[38px] w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9A3412] bg-white hover:bg-[#FEF1DB] border border-[#FCDCA8] dark:text-[#FCD34D] dark:bg-[#1A1106] dark:hover:bg-[#33210C] dark:border-[#78350F] rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {language === 'ar'
                    ? '+1 قراءة في الذاكرة الداخلية'
                    : '+1 mesure en mémoire interne'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(onOpenReplaceDevice || onEndSession) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onOpenReplaceDevice && (
                  <button
                    type="button"
                    onClick={onOpenReplaceDevice}
                    className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EFF4F8] border border-[#E1E8EE] dark:text-[#E2ECF5] dark:bg-[#132036] dark:hover:bg-[#192A46] dark:border-[#1E304D] rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{language === 'ar' ? 'تبديل الوحدة' : 'Changer de module'}</span>
                  </button>
                )}
                {onEndSession && (
                  <button
                    type="button"
                    onClick={onEndSession}
                    className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#087066] bg-[#EDF9F7] hover:bg-[#DFF3F0] border border-[#BEEAE4] dark:text-[#5EEAD4] dark:bg-[#0A2624] dark:hover:bg-[#113936] dark:border-[#134E4A] rounded-xl transition-colors cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{dc.endSessionBtn}</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSimTools((v) => !v)}
              aria-expanded={showSimTools}
              className="w-full inline-flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-[#64798F] hover:text-[#0F1D32] dark:text-[#8DA2B9] dark:hover:text-[#F1F5F9] cursor-pointer"
            >
              <span>{demoToggleLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showSimTools ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {showSimTools && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onSimulateOutOfRange}
                  className="min-h-[38px] px-4 py-2 text-xs font-semibold text-white bg-[#0F1D32] hover:bg-[#1A2D4A] dark:bg-[#132036] dark:hover:bg-[#192A46] rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'محاكاة الخروج عن النطاق' : "Simuler l'éloignement"}
                </button>
                <button
                  type="button"
                  onClick={onSimulateSkinRemoval}
                  className="min-h-[38px] px-4 py-2 text-xs font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EFF4F8] border border-[#E1E8EE] dark:text-[#E2ECF5] dark:bg-[#09111E] dark:hover:bg-[#132036] dark:border-[#1B2A42] rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'محاكاة نزع اللاصقة (سكون)' : 'Simuler retrait (Standby)'}
                </button>
              </div>
            )}
          </div>
        )}

        {profile.lastSyncNotice && !isSyncingBuffer && (
          <div
            role="status"
            className="p-3 rounded-xl bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A] flex items-start justify-between gap-2 text-xs text-[#087066] dark:text-[#5EEAD4]"
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
              <span className="font-medium leading-relaxed">{profile.lastSyncNotice}</span>
            </div>
            <button
              type="button"
              onClick={onDismissSyncNotice}
              className="font-bold text-[#087066] dark:text-[#2DD4BF] px-1.5 py-0.5 cursor-pointer"
            >
              {language === 'ar' ? 'حسناً' : 'OK'}
            </button>
          </div>
        )}
      </div>

      {/* System / Background Fever Notifications + Anti-False-Alarm Persistence */}
      <div className="pt-3.5 border-t border-[#E1E8EE] dark:border-[#1B2A42] space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellRing
              className={`w-4 h-4 shrink-0 ${
                alertsEnabled
                  ? 'text-[#0B8A7E] dark:text-[#2DD4BF]'
                  : 'text-[#64798F] dark:text-[#8DA2B9]'
              }`}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-[#0F1D32] dark:text-[#F1F5F9]">
              {settingsCopy.desktopNotifLabel}
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={alertsEnabled}
            aria-label={settingsCopy.feverAlertsLabel}
            onClick={onToggleAlerts}
            className={`w-11 h-6 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E] ${
              alertsEnabled ? 'bg-[#0B8A7E] justify-end' : 'bg-[#CBD5E1] dark:bg-[#1E304D] justify-start'
            }`}
          >
            <span className="inline-block h-5 w-5 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        <p className="text-xs text-[#64798F] dark:text-[#9DB0C6] leading-relaxed">
          {permissionStatusText}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-[#EDF9F7] text-[#087066] border-[#BEEAE4] dark:bg-[#0A2624] dark:text-[#5EEAD4] dark:border-[#134E4A]'
                : 'bg-[#FEF7EC] text-[#9A3412] border-[#FCDCA8] dark:bg-[#261909] dark:text-[#FCD34D] dark:border-[#78350F]'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>
              {soundEnabled
                ? language === 'ar'
                  ? 'الصوت مفعل'
                  : 'Son actif'
                : language === 'ar'
                ? 'الصوت مكتوم'
                : 'Son coupé'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleSmartPersistence}
            title={settingsCopy.antiSpikeSub}
            className={`min-h-[34px] px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              smartPersistenceEnabled
                ? 'bg-[#EDF9F7] text-[#087066] border-[#BEEAE4] dark:bg-[#0A2624] dark:text-[#5EEAD4] dark:border-[#134E4A]'
                : 'bg-[#F8FAFC] text-[#64798F] border-[#E1E8EE] dark:bg-[#132036] dark:text-[#8DA2B9] dark:border-[#1E304D]'
            }`}
          >
            {smartPersistenceEnabled
              ? language === 'ar'
                ? 'مرشح 5–10 د نشط'
                : 'Filtre 5–10 min actif'
              : language === 'ar'
              ? 'تنبيه فوري'
              : 'Alerte immédiate'}
          </button>

          <button
            type="button"
            onClick={onTestAlert}
            className="min-h-[34px] px-3 py-1 text-xs font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EFF4F8] border border-[#E1E8EE] dark:text-[#E2ECF5] dark:bg-[#132036] dark:hover:bg-[#192A46] dark:border-[#1E304D] rounded-lg transition-colors cursor-pointer"
          >
            {settingsCopy.notifTestBtn}
          </button>
        </div>
      </div>

      {/* Mode Relais Domestique */}
      <div className="pt-3.5 border-t border-[#E1E8EE] dark:border-[#1B2A42]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wifi
              className={`w-4 h-4 shrink-0 ${
                profile.homeHubEnabled
                  ? 'text-[#0B8A7E] dark:text-[#2DD4BF]'
                  : 'text-[#64798F] dark:text-[#8DA2B9]'
              }`}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-[#0F1D32] dark:text-[#F1F5F9]">
              {language === 'ar' ? 'وضع المرحّل المنزلي' : 'Mode Relais Domestique'}
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={profile.homeHubEnabled}
            aria-label={
              language === 'ar'
                ? 'تفعيل أو إيقاف وضع المرحّل المنزلي'
                : 'Activer ou désactiver le Mode Relais Domestique'
            }
            onClick={onToggleHomeHub}
            className={`w-11 h-6 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E] ${
              profile.homeHubEnabled
                ? 'bg-[#0B8A7E] justify-end'
                : 'bg-[#CBD5E1] dark:bg-[#1E304D] justify-start'
            }`}
          >
            <span className="inline-block h-5 w-5 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        <p className="mt-1.5 text-xs text-[#64798F] dark:text-[#9DB0C6] leading-relaxed">
          {language === 'ar'
            ? 'استخدم هاتفاً قديماً أو جهازاً لوحياً كبوابة ثابتة لمتابعة الحرارة من غرفة أخرى.'
            : 'Utilisez un ancien téléphone ou une tablette comme passerelle fixe pour suivre la température depuis une autre pièce.'}
        </p>

        {profile.homeHubEnabled && (
          <div className="mt-2.5 flex items-center justify-between gap-2 text-xs bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-xl px-3 py-2">
            <label
              htmlFor="hub-select"
              className="font-medium text-[#475B70] dark:text-[#9DB0C6] whitespace-nowrap"
            >
              {language === 'ar' ? 'جهاز البوابة :' : 'Passerelle :'}
            </label>
            <select
              id="hub-select"
              value={profile.homeHubDeviceName}
              onChange={(e) => onChangeHomeHubDevice(e.target.value)}
              className="text-xs font-semibold text-[#0F1D32] dark:text-[#F1F5F9] dark:bg-[#09111E] bg-transparent focus:outline-none cursor-pointer"
            >
              {HUB_DEVICES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Connection & Permissions Check */}
      <div className="pt-3 border-t border-[#E1E8EE] dark:border-[#1B2A42]">
        <button
          type="button"
          onClick={() => setShowDiagnostic((v) => !v)}
          className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B8A7E] dark:text-[#5EEAD4] hover:bg-[#EDF9F7] dark:hover:bg-[#0A2624] rounded-xl transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {language === 'ar'
              ? 'فحص سريع : الاتصال والأذونات'
              : 'Vérification rapide : connexion & autorisations'}
          </span>
        </button>

        {showDiagnostic && (
          <div className="mt-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-1.5 text-[11px] text-[#475B70] dark:text-[#9DB0C6]">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0B8A7E]" aria-hidden="true" />
                {language === 'ar'
                  ? `الربط عبر البلوتوث BLE (${profile.deviceId})`
                  : `Liaison Bluetooth BLE (${profile.deviceId})`}
              </span>
              <span className="font-mono font-semibold text-[#0F1D32] dark:text-[#F1F5F9]">
                {isOutOfRange
                  ? language === 'ar'
                    ? 'ذاكرة مؤقتة'
                    : 'Tampon actif'
                  : isStandby
                  ? language === 'ar'
                    ? 'سكون'
                    : 'Veille'
                  : 'OK'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0B8A7E]" aria-hidden="true" />
                {language === 'ar' ? 'آخر اتصال معروف' : 'Dernière connexion connue'}
              </span>
              <span className="font-mono">{formatTimeFr(profile.lastConnectedAt, language)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0B8A7E]" aria-hidden="true" />
                {language === 'ar'
                  ? 'تحسين البطارية (في الخلفية)'
                  : 'Optimisation batterie (arrière-plan)'}
              </span>
              <span className="font-semibold text-[#0B8A7E] dark:text-[#5EEAD4]">
                {language === 'ar' ? 'يوصى بالاستثناء' : 'Exclue recommandée'}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
