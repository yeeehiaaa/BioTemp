import {
  AgeCategory,
  AppLanguage,
  ChildProfile,
  SignalContactStatus,
  TemperatureReading,
  TemperatureStatus,
  TemperatureUnit,
  ThermalAlertPhase,
} from '../types/biotemp';

export function getRecommendedThresholdForAge(ageCategory: AgeCategory): number {
  switch (ageCategory) {
    case 'newborn':
      return 37.8;
    case 'infant':
      return 38.0;
    case 'child':
      return 38.5;
    case 'adult':
    default:
      return 38.5;
  }
}

export interface PersistenceEvaluation {
  phase: ThermalAlertPhase;
  elapsedMinutes: number;
  requiredMinutes: number;
  streakCount: number;
}

export function evaluateThermalPersistence(
  readings: TemperatureReading[],
  threshold: number,
  requiredMinutes: number,
  persistenceEnabled: boolean,
  stabilizingUntil?: number
): PersistenceEvaluation {
  if (stabilizingUntil && Date.now() < stabilizingUntil) {
    return { phase: 'stabilizing', elapsedMinutes: 0, requiredMinutes, streakCount: 0 };
  }

  if (readings.length === 0) {
    return { phase: 'normal', elapsedMinutes: 0, requiredMinutes, streakCount: 0 };
  }

  const latest = readings[readings.length - 1];
  const watchFloor = Number((threshold - 0.5).toFixed(1));

  if (latest.value < watchFloor) {
    return { phase: 'normal', elapsedMinutes: 0, requiredMinutes, streakCount: 0 };
  }

  if (latest.value < threshold) {
    return { phase: 'monitoring_mild', elapsedMinutes: 0, requiredMinutes, streakCount: 0 };
  }

  // Walk backwards through contiguous readings >= threshold
  let streakStart = latest;
  let streakCount = 1;
  for (let i = readings.length - 2; i >= 0; i--) {
    if (readings[i].value >= threshold) {
      streakStart = readings[i];
      streakCount++;
    } else {
      break;
    }
  }

  const rawElapsed = Math.round((latest.timestamp - streakStart.timestamp) / 60000);
  const elapsedMinutes = Math.max(1, rawElapsed);

  if (!persistenceEnabled || elapsedMinutes >= requiredMinutes) {
    return {
      phase: 'confirmed_alert',
      elapsedMinutes,
      requiredMinutes,
      streakCount,
    };
  }

  return {
    phase: 'confirming_persistence',
    elapsedMinutes,
    requiredMinutes,
    streakCount,
  };
}

export function convertTemp(valueC: number, unit: TemperatureUnit = 'C'): number {
  if (unit === 'F') {
    return Number(((valueC * 9) / 5 + 32).toFixed(1));
  }
  return valueC;
}

export function inputTempToCelsius(value: number, unit: TemperatureUnit = 'C'): number {
  if (unit === 'F') {
    return Number((((value - 32) * 5) / 9).toFixed(1));
  }
  return Number(value.toFixed(1));
}

export function formatTempFr(
  valueC: number,
  unit: TemperatureUnit = 'C',
  lang: AppLanguage = 'fr'
): string {
  const converted = convertTemp(valueC, unit);
  const fixed = converted.toFixed(1);
  return lang === 'ar' ? fixed : fixed.replace('.', ',');
}

export function formatTempDelta(
  deltaC: number,
  unit: TemperatureUnit = 'C',
  lang: AppLanguage = 'fr'
): string {
  const scaled = unit === 'F' ? Number(((deltaC * 9) / 5).toFixed(1)) : deltaC;
  const fixed = scaled.toFixed(1);
  return lang === 'ar' ? fixed : fixed.replace('.', ',');
}

export function tempUnitLabel(unit: TemperatureUnit = 'C'): string {
  return unit === 'F' ? '°F' : '°C';
}

export function formatTimeFr(timestamp: number, lang: AppLanguage = 'fr'): string {
  return new Date(timestamp).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTimeFr(timestamp: number, lang: AppLanguage = 'fr'): string {
  return new Date(timestamp).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTemperatureStatus(value: number, threshold: number): TemperatureStatus {
  if (value >= threshold) {
    return 'high_fever';
  }
  if (value >= Number((threshold - 0.5).toFixed(1))) {
    return 'elevated';
  }
  return 'normal';
}

export function getStatusMeta(
  status: TemperatureStatus,
  lang: AppLanguage = 'fr',
  persistence?: PersistenceEvaluation
): {
  label: string;
  description: string;
  surfaceClass: string;
  textClass: string;
  borderClass: string;
  accentHex: string;
  ringEndHex: string;
} {
  if (persistence?.phase === 'stabilizing') {
    return {
      label: lang === 'ar' ? 'جاري تثبيت القراءة...' : 'Stabilisation de la mesure...',
      description:
        lang === 'ar'
          ? 'يرجى الانتظار دقيقتين لاستقرار المستشعر'
          : 'Veuillez patienter 2 minutes',
      surfaceClass: 'bg-[#EEF5FF] dark:bg-[#0F203B]',
      textClass: 'text-[#1D4ED8] dark:text-[#93C5FD]',
      borderClass: 'border-[#C7DDFF] dark:border-[#1E3A6E]',
      accentHex: '#60A5FA',
      ringEndHex: '#2563EB',
    };
  }

  if (persistence?.phase === 'confirming_persistence') {
    const elapsed = persistence.elapsedMinutes;
    const req = persistence.requiredMinutes;
    return {
      label: lang === 'ar' ? 'ارتفاع عابر قيد التحقق' : 'Hausse en cours de vérification',
      description:
        lang === 'ar'
          ? `فوق العتبة منذ ${elapsed} د (يُؤكَّد التنبيه عند ${req} د لتفادي الإنذار الكاذب)`
          : `Au-dessus du seuil depuis ${elapsed} min (confirmation à ${req} min)`,
      surfaceClass: 'bg-[#FEF7EC] dark:bg-[#261909]',
      textClass: 'text-[#B45309] dark:text-[#FCD34D]',
      borderClass: 'border-[#FCDCA8] dark:border-[#78350F]',
      accentHex: '#FBBF24',
      ringEndHex: '#D97706',
    };
  }

  switch (status) {
    case 'high_fever': {
      return {
        label: lang === 'ar' ? 'ارتفاع ملحوظ مستمر' : 'Hausse notable persistante',
        description:
          lang === 'ar'
            ? 'يُنصح بالتحقق بميزان مرجعي ومراجعة الطبيب عند الحاجة'
            : 'Vérifier avec un thermomètre de référence et consulter si nécessaire',
        surfaceClass: 'bg-[#FEF1F3] dark:bg-[#2A0E17]',
        textClass: 'text-[#BE123C] dark:text-[#FDA4AF]',
        borderClass: 'border-[#FCCAD3] dark:border-[#881337]',
        accentHex: '#FB7185',
        ringEndHex: '#D91E43',
      };
    }
    case 'elevated':
      return {
        label: lang === 'ar' ? 'ارتفاع طفيف' : 'Légère hausse',
        description:
          lang === 'ar'
            ? 'يُنصح بالمراقبة وتخفيف الغطاء إن لزم'
            : 'Surveillance recommandée, alléger la couverture si besoin',
        surfaceClass: 'bg-[#FEF7EC] dark:bg-[#261909]',
        textClass: 'text-[#B45309] dark:text-[#FCD34D]',
        borderClass: 'border-[#FCDCA8] dark:border-[#78350F]',
        accentHex: '#FBBF24',
        ringEndHex: '#D97706',
      };
    case 'normal':
    default:
      return {
        label: lang === 'ar' ? 'الحرارة مستقرة' : 'Température stable',
        description:
          lang === 'ar'
            ? 'ضمن النطاق المعتاد'
            : 'Dans la plage habituelle',
        surfaceClass: 'bg-[#EDF9F7] dark:bg-[#0A2624]',
        textClass: 'text-[#087066] dark:text-[#5EEAD4]',
        borderClass: 'border-[#BEEAE4] dark:border-[#134E4A]',
        accentHex: '#2DD4BF',
        ringEndHex: '#0B8A7E',
      };
  }
}

export function computeStats(readings: TemperatureReading[], threshold: number) {
  if (readings.length === 0) {
    return { min: 0, max: 0, avg: 0, aboveThresholdCount: 0 };
  }
  let min = readings[0].value;
  let max = readings[0].value;
  let sum = 0;
  let aboveThresholdCount = 0;

  for (const r of readings) {
    if (r.value < min) min = r.value;
    if (r.value > max) max = r.value;
    sum += r.value;
    if (r.value >= threshold) aboveThresholdCount++;
  }

  return {
    min: Number(min.toFixed(1)),
    max: Number(max.toFixed(1)),
    avg: Number((sum / readings.length).toFixed(1)),
    aboveThresholdCount,
  };
}

export function computeTrendDelta(
  readings: TemperatureReading[],
  unit: TemperatureUnit = 'C',
  lang: AppLanguage = 'fr'
): {
  delta: number;
  label: string;
} {
  if (readings.length < 2) {
    return { delta: 0, label: lang === 'ar' ? 'مستقر' : 'Stable' };
  }
  const latest = readings[readings.length - 1];
  const compareIdx = Math.max(0, readings.length - 4);
  const previous = readings[compareIdx];
  const delta = Number((latest.value - previous.value).toFixed(1));

  if (Math.abs(delta) < 0.1) {
    return { delta: 0, label: lang === 'ar' ? 'مستقر' : 'Stable' };
  }
  const sign = delta > 0 ? '+' : '';
  return {
    delta,
    label: `${sign}${formatTempDelta(delta, unit, lang)} ${tempUnitLabel(unit)}`,
  };
}

export interface SignalContactQuality {
  status: SignalContactStatus;
  label: string;
  detail: string;
  maxSwingC: number;
}

export function evaluateSignalContactQuality(
  profile: ChildProfile,
  lang: AppLanguage = 'fr'
): SignalContactQuality {
  if (profile.connectionMode === 'standby_removed') {
    return {
      status: 'no_contact',
      label: lang === 'ar' ? 'انقطاع التلامس · اللاصقة منزوعة' : 'Contact interrompu · patch retiré',
      detail:
        lang === 'ar'
          ? 'ضع المستشعر تحت الإبط لاستئناف المراقبة المستقرة.'
          : "Reposez le module sous l'aisselle pour retrouver une mesure fiable.",
      maxSwingC: 0,
    };
  }

  if (profile.stabilizingUntil && Date.now() < profile.stabilizingUntil) {
    return {
      status: 'stabilizing',
      label: lang === 'ar' ? 'تثبيت أولي بعد الوضع' : 'Capteur fraîchement posé · stabilisation',
      detail:
        lang === 'ar'
          ? 'جاري استقرار التلامس الحراري تحت الإبط (دقيقتان).'
          : "Équilibrage thermique sous l'aisselle en cours (2 min).",
      maxSwingC: 0,
    };
  }

  const recent = profile.readings.slice(-6);
  if (recent.length < 3) {
    return {
      status: 'stable',
      label: lang === 'ar' ? 'جودة الإشارة والتثبيت مستقرة' : 'Signal & pose stables',
      detail:
        lang === 'ar'
          ? 'تلامس جلدي منتظم وقراءة موثوقة.'
          : 'Contact cutané régulier, courbe fiable.',
      maxSwingC: 0,
    };
  }

  let maxStep = 0;
  let jumpCount = 0;
  let minVal = recent[0].value;
  let maxVal = recent[0].value;
  for (let i = 0; i < recent.length; i++) {
    if (recent[i].value < minVal) minVal = recent[i].value;
    if (recent[i].value > maxVal) maxVal = recent[i].value;
    if (i > 0) {
      const step = Math.abs(recent[i].value - recent[i - 1].value);
      if (step > maxStep) maxStep = step;
      if (step >= 0.25) jumpCount++;
    }
  }
  const maxSwingC = Number((maxVal - minVal).toFixed(1));

  if (maxStep >= 0.5 || (maxSwingC >= 0.7 && jumpCount >= 2)) {
    return {
      status: 'oscillating',
      label:
        lang === 'ar'
          ? 'تذبذب غير معتاد في القراءة'
          : 'Oscillation inhabituelle du signal',
      detail:
        lang === 'ar'
          ? 'تأكد من تثبيت اللاصقة جيداً أو من حركة الطفل — التغيّر السريع قد ينتج عن ضعف التلامس لا عن حمى حقيقية.'
          : 'Vérifiez le plaquage du patch ou les mouvements importants (variation brusque liée au contact, non à une fièvre réelle).',
      maxSwingC,
    };
  }

  return {
    status: 'stable',
    label: lang === 'ar' ? 'جودة الإشارة والتثبيت مستقرة' : 'Signal & pose stables',
    detail:
      lang === 'ar'
        ? 'تلامس جلدي منتظم تحت الإبط، القراءة موثوقة.'
        : "Contact cutané régulier sous l'aisselle, lecture fiable.",
    maxSwingC,
  };
}
