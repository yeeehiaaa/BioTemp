import React, { useEffect, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import {
  Activity,
  Baby,
  Bell,
  BellOff,
  Bluetooth,
  BluetoothOff,
  CheckCircle2,
  ChevronDown,
  Clock,
  Minus,
  PauseCircle,
  Pill,
  Play,
  Plus,
  Router,
  Snowflake,
  Thermometer,
  VolumeX,
} from 'lucide-react';
import {
  AppLanguage,
  ChildProfile,
  NotePresetCategory,
  PersistenceDurationMinutes,
  TemperatureUnit,
} from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import { NotificationPermissionState } from '../utils/notifications';
import {
  computeTrendDelta,
  convertTemp,
  evaluateSignalContactQuality,
  evaluateThermalPersistence,
  formatTempFr,
  formatTimeFr,
  getStatusMeta,
  getTemperatureStatus,
  inputTempToCelsius,
  tempUnitLabel,
} from '../utils/temperature';

interface PrimaryTempCardProps {
  language: AppLanguage;
  tempUnit: TemperatureUnit;
  profile: ChildProfile;
  alertsEnabled: boolean;
  soundEnabled: boolean;
  smartPersistenceEnabled: boolean;
  persistenceDurationMinutes: PersistenceDurationMinutes;
  overrideSilentMode: boolean;
  notificationPermission: NotificationPermissionState;
  onToggleAlerts: () => void;
  onResumeSession: () => void;
  onAdjustThreshold: (delta: number) => void;
  onSimulateFeverSpike: () => void;
  onSimulateNormalReturn: () => void;
  onTriggerInstantReading: () => void;
  onQuickNote: (category: NotePresetCategory, text: string, referenceTempC?: number) => void;
  onOpenDevicePage?: () => void;
  onOpenHistoryPage?: () => void;
}

const MIN_SCALE = 35.5;
const MAX_SCALE = 40.5;
const START_ANGLE = 135;
const SWEEP_ANGLE = 270;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export const PrimaryTempCard: React.FC<PrimaryTempCardProps> = ({
  language,
  tempUnit,
  profile,
  alertsEnabled,
  soundEnabled,
  smartPersistenceEnabled,
  persistenceDurationMinutes,
  overrideSilentMode,
  notificationPermission,
  onToggleAlerts,
  onResumeSession,
  onAdjustThreshold,
  onSimulateFeverSpike,
  onSimulateNormalReturn,
  onTriggerInstantReading,
  onQuickNote,
  onOpenDevicePage,
  onOpenHistoryPage,
}) => {
  const t = getStrings(language).primaryCard;
  const unitLabel = tempUnitLabel(tempUnit);
  const shouldReduceMotion = useReducedMotion();
  const [showDemoTools, setShowDemoTools] = useState(false);
  const [showRefInput, setShowRefInput] = useState(false);
  const [refInputValue, setRefInputValue] = useState('');
  const isStandby = profile.connectionMode === 'standby_removed';
  const isOutOfRange = profile.connectionMode === 'out_of_range';
  const isRelayed = profile.connectionMode === 'home_hub_relayed';
  const latestReading = profile.readings[profile.readings.length - 1];
  const currentTemp = latestReading ? latestReading.value : 37.0;
  const signalQuality = evaluateSignalContactQuality(profile, language);

  const openReferenceInput = () => {
    setRefInputValue(String(convertTemp(currentTemp, tempUnit)));
    setShowRefInput(true);
  };

  const handleSaveReferenceReading = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(refInputValue.replace(',', '.'));
    if (!Number.isFinite(parsed)) return;
    const minValid = tempUnit === 'F' ? 93 : 34;
    const maxValid = tempUnit === 'F' ? 110 : 43;
    if (parsed < minValid || parsed > maxValid) return;
    const refC = inputTempToCelsius(parsed, tempUnit);
    const formattedRef = `${formatTempFr(refC, tempUnit, language)} ${unitLabel}`;
    const formattedSensor = `${formatTempFr(currentTemp, tempUnit, language)} ${unitLabel}`;
    onQuickNote(
      'Mesure de référence',
      language === 'ar'
        ? `القياس المرجعي: ${formattedRef} (مقابل ${formattedSensor} على المستشعر)`
        : `Thermomètre de référence : ${formattedRef} (vs capteur ${formattedSensor})`,
      refC
    );
    setShowRefInput(false);
  };

  const tempSpring = useSpring(currentTemp, {
    stiffness: shouldReduceMotion ? 1000 : 85,
    damping: shouldReduceMotion ? 100 : 20,
    mass: 0.9,
  });
  const [displayTemp, setDisplayTemp] = useState(currentTemp);

  useEffect(() => {
    if (shouldReduceMotion) {
      tempSpring.jump(currentTemp);
      setDisplayTemp(currentTemp);
    } else {
      tempSpring.set(currentTemp);
    }
  }, [currentTemp, shouldReduceMotion, tempSpring]);

  useMotionValueEvent(tempSpring, 'change', (latest) => {
    setDisplayTemp(latest);
  });

  const status = getTemperatureStatus(currentTemp, profile.threshold);
  const persistence = evaluateThermalPersistence(
    profile.readings,
    profile.threshold,
    persistenceDurationMinutes,
    smartPersistenceEnabled,
    profile.stabilizingUntil
  );
  const statusMeta = getStatusMeta(status, language, persistence);
  const trend = computeTrendDelta(profile.readings, tempUnit, language);

  const StatusIcon = isStandby
    ? PauseCircle
    : persistence.phase === 'confirmed_alert'
    ? Thermometer
    : persistence.phase === 'confirming_persistence'
    ? Clock
    : status === 'elevated'
    ? Activity
    : CheckCircle2;

  const clampedValue = Math.min(MAX_SCALE, Math.max(MIN_SCALE, displayTemp));
  const valueRatio = (clampedValue - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);
  const valueAngle = START_ANGLE + valueRatio * SWEEP_ANGLE;

  const clampedThreshold = Math.min(MAX_SCALE, Math.max(MIN_SCALE, profile.threshold));
  const thresholdRatio = (clampedThreshold - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);
  const thresholdAngle = START_ANGLE + thresholdRatio * SWEEP_ANGLE;

  const cx = 140;
  const cy = 140;
  const radius = 104;

  const trackArc = describeArc(cx, cy, radius, START_ANGLE, START_ANGLE + SWEEP_ANGLE);
  const valueArc = describeArc(
    cx,
    cy,
    radius,
    START_ANGLE,
    Math.max(START_ANGLE + 2, valueAngle)
  );
  const thresholdPos = polarToCartesian(cx, cy, radius, thresholdAngle);
  const valueTipPos = polarToCartesian(cx, cy, radius, valueAngle);

  const ticks = Array.from({ length: 21 }, (_, idx) => {
    const ratio = idx / 20;
    const angle = START_ANGLE + ratio * SWEEP_ANGLE;
    const inner = polarToCartesian(cx, cy, radius + 12, angle);
    const outer = polarToCartesian(cx, cy, radius + (idx % 5 === 0 ? 19 : 16), angle);
    return { inner, outer, major: idx % 5 === 0 };
  });

  return (
    <section
      id="surveillance"
      aria-label="Moniteur thermique principal"
      className="biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors duration-300"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#647B8C] dark:text-[#8BA3BC] flex items-center gap-1.5">
            {!isStandby && (
              <span
                className="w-2 h-2 rounded-full bg-[#0D9488] dark:bg-[#2DD4BF] animate-pulse"
                aria-hidden="true"
              />
            )}
            <span>{isStandby ? t.standbySession : t.liveMonitoring}</span>
          </p>
          <h2 className="text-lg font-bold text-[#162642] dark:text-[#F1F6FA]">
            {profile.name}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleAlerts}
            title={
              notificationPermission === 'granted' && alertsEnabled
                ? 'Notifications système actives'
                : 'Activer les notifications système'
            }
            className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors duration-300 cursor-pointer ${
              alertsEnabled
                ? 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#115E59]'
                : 'bg-[#F3F7F9] text-[#647B8C] border-[#DCE7EC] dark:bg-[#162947] dark:text-[#8BA3BC] dark:border-[#243E63]'
            }`}
          >
            {alertsEnabled ? (
              <Bell className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <BellOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{alertsEnabled ? t.alertsOn : t.alertsOff}</span>
          </button>

          <div className="text-right tabular-nums">
            <p className="font-mono text-xs font-semibold text-[#0D9488] dark:text-[#5EEAD4]">
              {profile.deviceId}
            </p>
            <p className="text-xs text-[#647B8C] dark:text-[#8BA3BC] transition-opacity duration-300">
              {latestReading ? formatTimeFr(latestReading.timestamp, language) : '—'} ·{' '}
              {trend.label}
            </p>
          </div>
        </div>
      </div>

      {/* Silent volume note (only when sound off AND priority override off) */}
      <AnimatePresence initial={false}>
        {!isStandby && !soundEnabled && !overrideSilentMode && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            className="px-3 py-2 rounded-2xl bg-[#F3F7F9] border border-[#DCE7EC] dark:bg-[#132544] dark:border-[#243E63] flex items-center gap-2 text-[11px] text-[#476074] dark:text-[#94ACC4]"
          >
            <VolumeX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t.soundOffBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Newborn (< 3 months) calm guidance notice */}
      {profile.ageCategory === 'newborn' && (
        <div className="px-3.5 py-2.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] dark:bg-[#132544] dark:border-[#1E40AF] flex items-start gap-2.5 text-xs text-[#1E3A8A] dark:text-[#BFDBFE]">
          <Baby className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
          <div>
            <p className="font-bold">{t.newbornAdvisoryTitle}</p>
            <p className="text-[11px] leading-relaxed mt-0.5 opacity-95">
              {t.newbornAdvisoryBody}
            </p>
          </div>
        </div>
      )}

      {/* Calm Status-First Banner above the Gauge */}
      <div
        className={`px-3.5 py-2.5 rounded-2xl border text-center transition-colors duration-500 ${
          isStandby
            ? 'bg-[#F3F7F9] border-[#DCE7EC] dark:bg-[#132544] dark:border-[#243E63]'
            : `${statusMeta.surfaceClass} ${statusMeta.borderClass}`
        }`}
      >
        <div
          className={`inline-flex items-center justify-center gap-1.5 text-sm font-bold transition-colors duration-500 ${
            isStandby ? 'text-[#647B8C] dark:text-[#8BA3BC]' : statusMeta.textClass
          }`}
        >
          <StatusIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{isStandby ? t.standbyTitle : statusMeta.label}</span>
        </div>
        <p className="text-xs text-[#476074] dark:text-[#B0C4D8] mt-0.5 transition-colors duration-300">
          {isStandby ? t.standbyDesc : statusMeta.description}
        </p>
      </div>

      {/* Circular Radial Gauge */}
      <div className="relative mx-auto w-[268px] h-[252px] flex items-center justify-center">
        <svg
          viewBox="0 0 280 264"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`gaugeGrad-${profile.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor={isStandby ? '#94A7B6' : statusMeta.accentHex}
                style={{ transition: 'stop-color 500ms ease' }}
              />
              <stop
                offset="100%"
                stopColor={isStandby ? '#647B8C' : statusMeta.ringEndHex}
                style={{ transition: 'stop-color 500ms ease' }}
              />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.inner.x}
              y1={t.inner.y}
              x2={t.outer.x}
              y2={t.outer.y}
              className={
                t.major
                  ? 'stroke-[#B6C8D4] dark:stroke-[#3A5680]'
                  : 'stroke-[#DCE7EC] dark:stroke-[#233B61]'
              }
              strokeWidth={t.major ? '1.6' : '1'}
              strokeLinecap="round"
            />
          ))}

          <path
            d={trackArc}
            fill="none"
            className="stroke-[#E9F0F3] dark:stroke-[#1B3050]"
            strokeWidth="12"
            strokeLinecap="round"
          />

          <path
            d={valueArc}
            fill="none"
            stroke={`url(#gaugeGrad-${profile.id})`}
            strokeWidth="12"
            strokeLinecap="round"
          />

          <motion.circle
            animate={{ cx: thresholdPos.x, cy: thresholdPos.y }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 180, damping: 24 }
            }
            r="4.5"
            className="fill-white dark:fill-[#0F1E36]"
            stroke="#E11D48"
            strokeWidth="2"
          />

          <circle
            cx={valueTipPos.x}
            cy={valueTipPos.y}
            r="6.5"
            className="fill-white dark:fill-[#0F1E36]"
            stroke={isStandby ? '#647B8C' : statusMeta.ringEndHex}
            strokeWidth="3"
            style={{ transition: 'stroke 450ms ease' }}
          />

          <text x="42" y="242" className="fill-[#7B8FA1] dark:fill-[#8BA3BC] text-[10px] font-mono">
            {formatTempFr(35.5, tempUnit, language)}°
          </text>
          <text
            x="140"
            y="18"
            textAnchor="middle"
            className="fill-[#7B8FA1] dark:fill-[#8BA3BC] text-[10px] font-mono"
          >
            {formatTempFr(38.0, tempUnit, language)}°
          </text>
          <text
            x="236"
            y="242"
            textAnchor="end"
            className="fill-[#7B8FA1] dark:fill-[#8BA3BC] text-[10px] font-mono"
          >
            {formatTempFr(40.5, tempUnit, language)}°
          </text>
        </svg>

        {/* Raised Inner Dial Disc */}
        <motion.div
          key={latestReading?.id ?? 'empty'}
          animate={
            shouldReduceMotion || isStandby
              ? undefined
              : { scale: [1, 1.018, 1] }
          }
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="biotemp-dial-disc absolute w-[158px] h-[158px] rounded-full flex flex-col items-center justify-center text-center border border-white dark:border-[#233B61] transition-colors duration-500"
        >
          <span className="text-[11px] font-medium text-[#647B8C] dark:text-[#8BA3BC]">
            {isStandby ? (language === 'ar' ? 'آخر قياس' : 'Dernier relevé') : language === 'ar' ? 'الحرارة' : 'Température'}
          </span>
          <div className="mt-0.5 flex items-start justify-center">
            <span className="font-mono text-[2.35rem] font-bold tracking-tight text-[#162642] dark:text-[#F1F6FA] tabular-nums leading-none transition-colors duration-300">
              {isStandby
                ? language === 'ar'
                  ? 'سكون'
                  : 'Veille'
                : formatTempFr(displayTemp, tempUnit, language)}
            </span>
            {!isStandby && (
              <span className="text-base font-bold text-[#162642] dark:text-[#94ACC4] ml-0.5 mt-0.5">
                {unitLabel}
              </span>
            )}
          </div>
          <span className="mt-1.5 text-[11px] font-mono text-[#647B8C] dark:text-[#8BA3BC] tabular-nums">
            {t.alertThreshold}: {formatTempFr(profile.threshold, tempUnit, language)} {unitLabel}
          </span>
        </motion.div>
      </div>

      {isStandby ? (
        <button
          type="button"
          onClick={onResumeSession}
          className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-full transition-colors cursor-pointer"
        >
          <Play className="w-4 h-4" aria-hidden="true" />
          <span>
            {t.resumeSession} ({profile.name})
          </span>
        </button>
      ) : (
        <>
          {/* Flanking Circular Quick Actions */}
          <div className="flex items-center justify-between gap-2 px-2">
            <button
              type="button"
              onClick={() =>
                onQuickNote(
                  'Compresses tièdes',
                  'Compresses tièdes appliquées pour apaiser l’inconfort.'
                )
              }
              className="group flex flex-col items-center gap-1.5 cursor-pointer focus-visible:outline-none"
            >
              <span className="w-12 h-12 rounded-full bg-[#EFF8FB] group-hover:bg-[#DFF1F7] border border-[#D4EBF2] dark:bg-[#132C46] dark:group-hover:bg-[#1A3B5E] dark:border-[#23486E] flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] transition-colors shadow-xs">
                <Snowflake className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium text-[#476074] dark:text-[#B0C4D8] whitespace-nowrap">
                {t.compressTag}
              </span>
            </button>

            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-medium text-[#647B8C] dark:text-[#8BA3BC]">
                {t.alertThreshold}
              </span>
              <div className="inline-flex items-center bg-[#F3F7F9] border border-[#E2ECF0] dark:bg-[#162947] dark:border-[#243E63] rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => onAdjustThreshold(-0.1)}
                  aria-label={
                    language === 'ar'
                      ? 'خفض عتبة التنبيه'
                      : `Diminuer le seuil d'alerte (${unitLabel})`
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#162642] dark:text-[#F1F6FA] hover:bg-white dark:hover:bg-[#1F375E] transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span className="px-2 font-mono text-xs font-bold text-[#162642] dark:text-[#F1F6FA] tabular-nums">
                  {formatTempFr(profile.threshold, tempUnit, language)}°
                </span>
                <button
                  type="button"
                  onClick={() => onAdjustThreshold(0.1)}
                  aria-label={
                    language === 'ar'
                      ? 'رفع عتبة التنبيه'
                      : `Augmenter le seuil d'alerte (${unitLabel})`
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#162642] dark:text-[#F1F6FA] hover:bg-white dark:hover:bg-[#1F375E] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onQuickNote(
                  'Antipyrétique administré',
                  language === 'ar'
                    ? 'أُعطي خافض حرارة وفق الجرعة المناسبة.'
                    : 'Antipyrétique administré selon la posologie adaptée.'
                )
              }
              className="group flex flex-col items-center gap-1.5 cursor-pointer focus-visible:outline-none"
            >
              <span className="w-12 h-12 rounded-full bg-[#FFF3F0] group-hover:bg-[#FFE6E0] border border-[#FCD9D0] dark:bg-[#311E1B] dark:group-hover:bg-[#3E2521] dark:border-[#6B332A] flex items-center justify-center text-[#EA580C] dark:text-[#FB923C] transition-colors shadow-xs">
                <Pill className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium text-[#476074] dark:text-[#B0C4D8] whitespace-nowrap">
                {t.antipyreticTag}
              </span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {persistence.phase === 'confirmed_alert' && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                className="px-3.5 py-2.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] dark:bg-[#2F1320] dark:border-[#881337] text-xs text-[#9F1239] dark:text-[#FDA4AF] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{statusMeta.label}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={openReferenceInput}
                      className="min-h-[30px] inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#162642] border border-[#FECDD3] hover:bg-[#FFF5F6] dark:bg-[#1E0D15] dark:text-[#FDE68A] dark:border-[#881337] text-[11px] font-semibold cursor-pointer"
                    >
                      <Thermometer className="w-3 h-3" aria-hidden="true" />
                      <span>
                        {t.refTempBtn} ({unitLabel})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onQuickNote(
                          'Antipyrétique administré',
                          language === 'ar'
                            ? 'أُعطي خافض حرارة وفق الجرعة المناسبة.'
                            : 'Note rapide suite à une hausse continue.'
                        )
                      }
                      className="min-h-[30px] px-2.5 py-1 rounded-full bg-white text-[#9F1239] border border-[#FECDD3] hover:bg-[#FFE4E6] dark:bg-[#1E0D15] dark:text-[#FDA4AF] dark:border-[#881337] text-[11px] font-semibold cursor-pointer"
                    >
                      {t.oneStepNoteBtn}
                    </button>
                    {onOpenHistoryPage && (
                      <button
                        type="button"
                        onClick={onOpenHistoryPage}
                        className="min-h-[30px] px-2.5 py-1 rounded-full bg-[#E11D48] text-white hover:bg-[#BE123C] text-[11px] font-semibold cursor-pointer"
                      >
                        {t.oneStepChartBtn}
                      </button>
                    )}
                  </div>
                </div>

                {showRefInput && (
                  <form
                    onSubmit={handleSaveReferenceReading}
                    className="pt-2 border-t border-[#FECDD3] dark:border-[#881337] flex flex-wrap items-center gap-2"
                  >
                    <label
                      htmlFor={`ref-temp-${profile.id}`}
                      className="text-[11px] font-semibold text-[#881337] dark:text-[#FECDD3]"
                    >
                      {t.refTempInputLabel} ({unitLabel}) :
                    </label>
                    <input
                      id={`ref-temp-${profile.id}`}
                      type="number"
                      step="0.1"
                      min={tempUnit === 'F' ? 93 : 34}
                      max={tempUnit === 'F' ? 110 : 43}
                      value={refInputValue}
                      onChange={(e) => setRefInputValue(e.target.value)}
                      className="w-24 min-h-[32px] px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-white text-[#162642] border border-[#FECDD3] dark:bg-[#132544] dark:text-[#F1F6FA] dark:border-[#881337]"
                      required
                    />
                    <button
                      type="submit"
                      className="min-h-[32px] px-3 py-1 rounded-full bg-[#162642] text-white dark:bg-[#0D9488] text-[11px] font-semibold cursor-pointer"
                    >
                      {t.refTempSaveBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRefInput(false)}
                      className="min-h-[32px] px-2 text-[11px] font-medium text-[#881337] dark:text-[#FDA4AF] cursor-pointer"
                    >
                      {t.refTempCancelBtn}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {signalQuality.status === 'oscillating' && (
            <button
              type="button"
              onClick={onOpenDevicePage}
              className="w-full px-3 py-2 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] dark:bg-[#2C1F12] dark:border-[#78350F] text-start text-[11px] text-[#92400E] dark:text-[#FCD34D] cursor-pointer"
            >
              <strong>{signalQuality.label} :</strong> {signalQuality.detail}
            </button>
          )}

          {/* Compact Sensor Link + Collapsible Demo Controls */}
          <div className="pt-3 border-t border-[#EDF3F5] dark:border-[#1E3354] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={onOpenDevicePage}
                className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  isOutOfRange
                    ? 'text-[#EA580C] dark:text-[#FDBA74]'
                    : 'text-[#526675] hover:text-[#0D9488] dark:text-[#94ACC4] dark:hover:text-[#5EEAD4]'
                }`}
              >
                {isOutOfRange ? (
                  <BluetoothOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : isRelayed ? (
                  <Router className="w-3.5 h-3.5 shrink-0 text-[#2563EB]" aria-hidden="true" />
                ) : (
                  <Bluetooth className="w-3.5 h-3.5 shrink-0 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                )}
                <span>
                  {isOutOfRange
                    ? `${t.sensorOutOfRange} (${profile.bufferedReadings.length})`
                    : isRelayed
                    ? t.sensorRelayed
                    : t.sensorConnected}{' '}
                  · {profile.battery} %
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowDemoTools((v) => !v)}
                aria-expanded={showDemoTools}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#647B8C] hover:text-[#162642] dark:text-[#8BA3BC] dark:hover:text-[#F1F6FA] cursor-pointer"
              >
                <span>{t.demoToolsToggle}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showDemoTools ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {showDemoTools && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onTriggerInstantReading}
                  className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] dark:text-[#5EEAD4] dark:bg-[#0D2B2C] dark:hover:bg-[#12383A] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Thermometer className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.instantReading}</span>
                </button>
                <button
                  type="button"
                  onClick={onSimulateFeverSpike}
                  className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#E11D48] bg-[#FFF1F2] hover:bg-[#FFE4E6] dark:text-[#FDA4AF] dark:bg-[#2F1320] dark:hover:bg-[#3F1A2B] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.simulateFever}
                </button>
                <button
                  type="button"
                  onClick={onSimulateNormalReturn}
                  className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#334E68] bg-[#F3F7F9] hover:bg-[#E4EDF2] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.normalReturn}
                </button>
              </div>
            )}

            <p className="text-[11px] text-[#647B8C] dark:text-[#8BA3BC] text-center leading-relaxed pt-1">
              {t.calibrationNote}
            </p>
          </div>
        </>
      )}
    </section>
  );
};
