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
  Check,
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
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);

  const isStandby = profile.connectionMode === 'standby_removed';
  const isOutOfRange = profile.connectionMode === 'out_of_range';
  const isRelayed = profile.connectionMode === 'home_hub_relayed';
  const latestReading = profile.readings[profile.readings.length - 1];
  const currentTemp = latestReading ? latestReading.value : 37.0;
  const signalQuality = evaluateSignalContactQuality(profile, language);

  const logQuickAction = (category: NotePresetCategory, text: string, feedbackLabel: string) => {
    onQuickNote(category, text);
    setQuickFeedback(feedbackLabel);
    setTimeout(() => setQuickFeedback(null), 2200);
  };

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
    setQuickFeedback(language === 'ar' ? 'تم الحفظ' : 'Mesure enregistrée');
    setTimeout(() => setQuickFeedback(null), 2200);
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
      className="biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors duration-200"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#64798F] dark:text-[#8DA2B9]">
            {!isStandby && (
              <span
                className="w-2 h-2 rounded-full bg-[#0B8A7E] dark:bg-[#2DD4BF] animate-pulse shrink-0"
                aria-hidden="true"
              />
            )}
            <span>{isStandby ? t.standbySession : t.liveMonitoring}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-semibold text-[#0B8A7E] dark:text-[#2DD4BF]">
              {profile.deviceId}
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-[#0F1D32] dark:text-[#F1F5F9] tracking-tight">
              {profile.name}
            </h2>
            <span className="text-xs font-mono text-[#64798F] dark:text-[#8DA2B9] tabular-nums">
              {latestReading ? formatTimeFr(latestReading.timestamp, language) : '—'} ·{' '}
              {trend.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleAlerts}
          title={
            notificationPermission === 'granted' && alertsEnabled
              ? 'Notifications système actives'
              : 'Activer les notifications système'
          }
          className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors duration-200 cursor-pointer shrink-0 ${
            alertsEnabled
              ? 'bg-[#EDF9F7] text-[#087066] border-[#BEEAE4] hover:bg-[#DFF3F0] dark:bg-[#0A2624] dark:text-[#5EEAD4] dark:border-[#134E4A]'
              : 'bg-[#F8FAFC] text-[#64798F] border-[#E1E8EE] hover:bg-[#EFF4F8] dark:bg-[#132036] dark:text-[#8DA2B9] dark:border-[#1E304D]'
          }`}
        >
          {alertsEnabled ? (
            <Bell className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <BellOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>{alertsEnabled ? t.alertsOn : t.alertsOff}</span>
        </button>
      </div>

      {/* Silent volume note */}
      <AnimatePresence initial={false}>
        {!isStandby && !soundEnabled && !overrideSilentMode && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] flex items-center gap-2 text-[11px] text-[#475B70] dark:text-[#9DB0C6]"
          >
            <VolumeX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t.soundOffBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Newborn (< 3 months) calm guidance notice */}
      {profile.ageCategory === 'newborn' && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[#EEF5FF] border border-[#C7DDFF] dark:bg-[#0F203B] dark:border-[#1E3A6E] flex items-start gap-2.5 text-xs text-[#1E3A8A] dark:text-[#BFDBFE]">
          <Baby className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
          <div>
            <p className="font-bold">
              {t.newbornAdvisoryTitle} ·{' '}
              <span className="font-mono">
                {formatTempFr(37.8, tempUnit, language)} {unitLabel}
              </span>
            </p>
            <p className="text-[11px] leading-relaxed mt-0.5 opacity-95">
              {t.newbornAdvisoryBody}
            </p>
          </div>
        </div>
      )}

      {/* Calm Status-First Clinical Banner */}
      <div
        className={`px-3.5 py-2.5 rounded-xl border text-center transition-colors duration-300 ${
          isStandby
            ? 'bg-[#F8FAFC] border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42]'
            : `${statusMeta.surfaceClass} ${statusMeta.borderClass}`
        }`}
      >
        <div
          className={`inline-flex items-center justify-center gap-1.5 text-sm font-bold transition-colors duration-300 ${
            isStandby ? 'text-[#64798F] dark:text-[#8DA2B9]' : statusMeta.textClass
          }`}
        >
          <StatusIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{isStandby ? t.standbyTitle : statusMeta.label}</span>
        </div>
        <p className="text-xs text-[#475B70] dark:text-[#9DB0C6] mt-0.5">
          {isStandby ? t.standbyDesc : statusMeta.description}
        </p>
      </div>

      {/* Precision Circular Radial Gauge */}
      <div
        dir="ltr"
        className="relative mx-auto w-[264px] h-[246px] flex items-center justify-center"
      >
        <svg
          viewBox="0 0 280 264"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`gaugeGrad-${profile.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor={isStandby ? '#94A3B8' : statusMeta.accentHex}
                style={{ transition: 'stop-color 400ms ease' }}
              />
              <stop
                offset="100%"
                stopColor={isStandby ? '#64748B' : statusMeta.ringEndHex}
                style={{ transition: 'stop-color 400ms ease' }}
              />
            </linearGradient>
          </defs>

          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.inner.x}
              y1={tick.inner.y}
              x2={tick.outer.x}
              y2={tick.outer.y}
              className={
                tick.major
                  ? 'stroke-[#B8C7D4] dark:stroke-[#365078]'
                  : 'stroke-[#DCE5EC] dark:stroke-[#1E304D]'
              }
              strokeWidth={tick.major ? '1.6' : '1'}
              strokeLinecap="round"
            />
          ))}

          <path
            d={trackArc}
            fill="none"
            className="stroke-[#E8EFF4] dark:stroke-[#162338]"
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
            className="fill-white dark:fill-[#0D1626]"
            stroke="#D91E43"
            strokeWidth="2.2"
          />

          <circle
            cx={valueTipPos.x}
            cy={valueTipPos.y}
            r="6.5"
            className="fill-white dark:fill-[#0D1626]"
            stroke={isStandby ? '#64748B' : statusMeta.ringEndHex}
            strokeWidth="3"
            style={{ transition: 'stroke 400ms ease' }}
          />

          <text x="42" y="242" className="fill-[#7B8FA1] dark:fill-[#7B91A8] text-[10px] font-mono">
            {formatTempFr(35.5, tempUnit, language)}°
          </text>
          <text
            x="140"
            y="18"
            textAnchor="middle"
            className="fill-[#7B8FA1] dark:fill-[#7B91A8] text-[10px] font-mono"
          >
            {formatTempFr(38.0, tempUnit, language)}°
          </text>
          <text
            x="236"
            y="242"
            textAnchor="end"
            className="fill-[#7B8FA1] dark:fill-[#7B91A8] text-[10px] font-mono"
          >
            {formatTempFr(40.5, tempUnit, language)}°
          </text>
        </svg>

        {/* Inner Instrument Dial */}
        <motion.div
          key={latestReading?.id ?? 'empty'}
          animate={
            shouldReduceMotion || isStandby
              ? undefined
              : { scale: [1, 1.015, 1] }
          }
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="biotemp-dial-disc absolute w-[158px] h-[158px] rounded-full flex flex-col items-center justify-center text-center border border-[#E8EFF4] dark:border-[#1E304D] transition-colors duration-300"
        >
          <span className="text-[11px] font-medium text-[#64798F] dark:text-[#8DA2B9]">
            {isStandby
              ? language === 'ar'
                ? 'آخر قياس'
                : 'Dernier relevé'
              : language === 'ar'
              ? 'الحرارة'
              : 'Température'}
          </span>
          <div className="mt-0.5 flex items-start justify-center">
            <span className="font-mono text-[2.35rem] font-bold tracking-tight text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums leading-none">
              {isStandby
                ? language === 'ar'
                  ? 'سكون'
                  : 'Veille'
                : formatTempFr(displayTemp, tempUnit, language)}
            </span>
            {!isStandby && (
              <span className="text-sm font-bold text-[#475B70] dark:text-[#9DB0C6] ms-0.5 mt-1">
                {unitLabel}
              </span>
            )}
          </div>
          <span className="mt-1.5 text-[11px] font-mono text-[#64798F] dark:text-[#8DA2B9] tabular-nums">
            {t.alertThreshold} · {formatTempFr(profile.threshold, tempUnit, language)} {unitLabel}
          </span>
        </motion.div>
      </div>

      {isStandby ? (
        <button
          type="button"
          onClick={onResumeSession}
          className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0B8A7E] hover:bg-[#087066] rounded-xl transition-colors cursor-pointer"
        >
          <Play className="w-4 h-4" aria-hidden="true" />
          <span>
            {t.resumeSession} ({profile.name})
          </span>
        </button>
      ) : (
        <>
          {/* Fast 1-Tap Care Actions & Threshold Stepper */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                logQuickAction(
                  'Compresses tièdes',
                  language === 'ar'
                    ? 'تم وضع كمادات ماء فاتر لتخفيف الانزعاج.'
                    : 'Compresses tièdes appliquées pour apaiser l’inconfort.',
                  t.compressTag
                )
              }
              className="min-h-[60px] px-2 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF6FB] border border-[#E1E8EE] hover:border-[#BAE6FD] dark:bg-[#09111E] dark:hover:bg-[#112238] dark:border-[#1B2A42] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Snowflake className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-[#0F1D32] dark:text-[#E2ECF5] text-center leading-tight">
                {t.compressTag}
              </span>
            </button>

            <div
              title={`${formatTempFr(37.2, tempUnit, language)} – ${formatTempFr(40.0, tempUnit, language)} ${unitLabel}`}
              className="min-h-[60px] px-2 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] flex flex-col items-center justify-center gap-1"
            >
              <span className="text-[10px] font-medium text-[#64798F] dark:text-[#8DA2B9] text-center leading-tight">
                {t.alertThreshold}
              </span>
              <div dir="ltr" className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onAdjustThreshold(-0.1)}
                  disabled={profile.threshold <= 37.2}
                  aria-label={
                    language === 'ar'
                      ? 'خفض عتبة التنبيه'
                      : `Diminuer le seuil d'alerte (${unitLabel})`
                  }
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-[#132036] border border-[#E1E8EE] dark:border-[#1E304D] text-[#0F1D32] dark:text-[#F1F5F9] hover:border-[#0B8A7E] disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span className="px-1 font-mono text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums">
                  {formatTempFr(profile.threshold, tempUnit, language)}°
                </span>
                <button
                  type="button"
                  onClick={() => onAdjustThreshold(0.1)}
                  disabled={profile.threshold >= 40.0}
                  aria-label={
                    language === 'ar'
                      ? 'رفع عتبة التنبيه'
                      : `Augmenter le seuil d'alerte (${unitLabel})`
                  }
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-[#132036] border border-[#E1E8EE] dark:border-[#1E304D] text-[#0F1D32] dark:text-[#F1F5F9] hover:border-[#0B8A7E] disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                logQuickAction(
                  'Antipyrétique administré',
                  language === 'ar'
                    ? 'أُعطي خافض حرارة وفق الجرعة المناسبة.'
                    : 'Antipyrétique administré selon la posologie adaptée.',
                  t.antipyreticTag
                )
              }
              className="min-h-[60px] px-2 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#FFF5F2] border border-[#E1E8EE] hover:border-[#FED7AA] dark:bg-[#09111E] dark:hover:bg-[#241612] dark:border-[#1B2A42] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Pill className="w-4 h-4 text-[#D97706] dark:text-[#FB923C]" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-[#0F1D32] dark:text-[#E2ECF5] text-center leading-tight">
                {t.antipyreticTag}
              </span>
            </button>
          </div>

          {/* Instant Action Feedback */}
          <AnimatePresence initial={false}>
            {quickFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="px-3 py-1.5 rounded-lg bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A] text-xs font-semibold text-[#087066] dark:text-[#5EEAD4] flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {quickFeedback} · {language === 'ar' ? 'أُضيف إلى السجل' : 'ajouté au journal'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {persistence.phase === 'confirmed_alert' && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="px-3.5 py-2.5 rounded-xl bg-[#FEF1F3] border border-[#FCCAD3] dark:bg-[#2A0E17] dark:border-[#881337] text-xs text-[#9F1239] dark:text-[#FDA4AF] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{statusMeta.label}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={openReferenceInput}
                      className="min-h-[32px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[#0F1D32] border border-[#FCCAD3] hover:bg-[#FFF5F6] dark:bg-[#190910] dark:text-[#FDE68A] dark:border-[#881337] text-[11px] font-semibold cursor-pointer"
                    >
                      <Thermometer className="w-3 h-3" aria-hidden="true" />
                      <span>
                        {t.refTempBtn} ({unitLabel})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        logQuickAction(
                          'Antipyrétique administré',
                          language === 'ar'
                            ? 'أُعطي خافض حرارة وفق الجرعة المناسبة.'
                            : 'Note rapide suite à une hausse continue.',
                          t.oneStepNoteBtn
                        )
                      }
                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white text-[#9F1239] border border-[#FCCAD3] hover:bg-[#FDE2E7] dark:bg-[#190910] dark:text-[#FDA4AF] dark:border-[#881337] text-[11px] font-semibold cursor-pointer"
                    >
                      {t.oneStepNoteBtn}
                    </button>
                    {onOpenHistoryPage && (
                      <button
                        type="button"
                        onClick={onOpenHistoryPage}
                        className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#D91E43] text-white hover:bg-[#BE123C] text-[11px] font-semibold cursor-pointer"
                      >
                        {t.oneStepChartBtn}
                      </button>
                    )}
                  </div>
                </div>

                {showRefInput && (
                  <form
                    onSubmit={handleSaveReferenceReading}
                    className="pt-2 border-t border-[#FCCAD3] dark:border-[#881337] flex flex-wrap items-center gap-2"
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
                      className="w-24 min-h-[34px] px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-white text-[#0F1D32] border border-[#FCCAD3] dark:bg-[#0D1626] dark:text-[#F1F5F9] dark:border-[#881337]"
                      required
                    />
                    <button
                      type="submit"
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-[#0F1D32] text-white dark:bg-[#0B8A7E] text-[11px] font-semibold cursor-pointer"
                    >
                      {t.refTempSaveBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRefInput(false)}
                      className="min-h-[34px] px-2 text-[11px] font-medium text-[#881337] dark:text-[#FDA4AF] cursor-pointer"
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
              className="w-full px-3 py-2 rounded-xl bg-[#FEF7EC] border border-[#FCDCA8] dark:bg-[#261909] dark:border-[#78350F] text-start text-[11px] text-[#92400E] dark:text-[#FCD34D] cursor-pointer"
            >
              <strong>{signalQuality.label} :</strong> {signalQuality.detail}
            </button>
          )}

          {/* Compact Sensor Link + Collapsible Demo Controls */}
          <div className="pt-3 border-t border-[#E1E8EE] dark:border-[#1B2A42] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={onOpenDevicePage}
                className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  isOutOfRange
                    ? 'text-[#C26B08] dark:text-[#FCD34D]'
                    : 'text-[#475B70] hover:text-[#0B8A7E] dark:text-[#9DB0C6] dark:hover:text-[#2DD4BF]'
                }`}
              >
                {isOutOfRange ? (
                  <BluetoothOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : isRelayed ? (
                  <Router className="w-3.5 h-3.5 shrink-0 text-[#2563EB]" aria-hidden="true" />
                ) : (
                  <Bluetooth className="w-3.5 h-3.5 shrink-0 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
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
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64798F] hover:text-[#0F1D32] dark:text-[#8DA2B9] dark:hover:text-[#F1F5F9] cursor-pointer"
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
                  className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#087066] bg-[#EDF9F7] hover:bg-[#DFF3F0] border border-[#BEEAE4] dark:text-[#5EEAD4] dark:bg-[#0A2624] dark:border-[#134E4A] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Thermometer className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.instantReading}</span>
                </button>
                <button
                  type="button"
                  onClick={onSimulateFeverSpike}
                  className="min-h-[34px] px-3 py-1.5 text-xs font-semibold text-[#BE123C] bg-[#FEF1F3] hover:bg-[#FDE2E7] border border-[#FCCAD3] dark:text-[#FDA4AF] dark:bg-[#2A0E17] dark:border-[#881337] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.simulateFever}
                </button>
                <button
                  type="button"
                  onClick={onSimulateNormalReturn}
                  className="min-h-[34px] px-3 py-1.5 text-xs font-semibold text-[#475B70] bg-[#F8FAFC] hover:bg-[#EFF4F8] border border-[#E1E8EE] dark:text-[#E2ECF5] dark:bg-[#132036] dark:border-[#1E304D] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.normalReturn}
                </button>
              </div>
            )}

            <p className="text-[11px] text-[#64798F] dark:text-[#7B91A8] text-center leading-relaxed">
              {t.calibrationNote}
            </p>
          </div>
        </>
      )}
    </section>
  );
};
