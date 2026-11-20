import { AppLanguage, TemperatureUnit } from '../types/biotemp';
import { formatTempFr, tempUnitLabel } from './temperature';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestSystemNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission ?? 'denied';
  }
}

export function playGentleAlertChime(priorityOverride = false): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const peakGain = priorityOverride ? 0.2 : 0.11;

    const playTone = (startTime: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    };

    playTone(now, 660, 0.22);
    playTone(now + 0.26, 880, 0.3);
    if (priorityOverride) {
      playTone(now + 0.62, 880, 0.32);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1100);
  } catch {
    // Ignore autoplay restriction errors
  }
}

export function sendFeverSystemNotification(params: {
  profileId: string;
  profileName: string;
  temperature: number;
  threshold: number;
  deviceId: string;
  language?: AppLanguage;
  tempUnit?: TemperatureUnit;
  durationMinutes?: number;
  onSelectProfile?: () => void;
}): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const lang = params.language ?? 'fr';
  const unit = params.tempUnit ?? 'C';
  const formattedTemp = `${formatTempFr(params.temperature, unit, lang)} ${tempUnitLabel(unit)}`;

  const title =
    lang === 'ar'
      ? `متابعة حرارة ${params.profileName} (${formattedTemp})`
      : `Suivi de ${params.profileName} (${formattedTemp})`;
  const body =
    lang === 'ar'
      ? `القراءة مستمرة فوق العتبة المحددة (${formattedTemp}). يُرجى تفقد حالة الطفل وتدوين أي ملاحظة.`
      : `La température reste au-dessus du seuil (${formattedTemp}). Vérifiez l'état de l'enfant et notez vos observations.`;

  try {
    const options: NotificationOptions & { renotify?: boolean } = {
      body,
      tag: `biotemp-fever-${params.profileId}`,
      requireInteraction: true,
      renotify: true,
    };
    const notification = new Notification(title, options);
    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore
      }
      params.onSelectProfile?.();
      notification.close();
    };
    return true;
  } catch {
    try {
      const fallback = new Notification(title, {
        body,
        tag: `biotemp-fever-${params.profileId}`,
      });
      fallback.onclick = () => {
        params.onSelectProfile?.();
        fallback.close();
      };
      return true;
    } catch {
      return false;
    }
  }
}

export function sendRecoverySystemNotification(params: {
  profileId: string;
  profileName: string;
  language?: AppLanguage;
  onSelectProfile?: () => void;
}): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const lang = params.language ?? 'fr';
  const title =
    lang === 'ar'
      ? `تحسن في المؤشر — ${params.profileName}`
      : `Évolution favorable — ${params.profileName}`;
  const body =
    lang === 'ar'
      ? `بدأت حرارة ${params.profileName} بالانخفاض تدريجياً نحو النطاق المعتاد.`
      : `La température de ${params.profileName} redescend progressivement vers la normale.`;

  try {
    const notification = new Notification(title, {
      body,
      tag: `biotemp-recovery-${params.profileId}`,
    });
    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore
      }
      params.onSelectProfile?.();
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}

export function sendLowBatterySystemNotification(params: {
  profileId: string;
  profileName: string;
  deviceName: string;
  deviceId: string;
  battery: number;
  remainingHours: number;
  language?: AppLanguage;
  onSelectProfile?: () => void;
}): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const lang = params.language ?? 'fr';
  const title =
    lang === 'ar'
      ? `بطارية منخفضة (${params.battery} %) — ${params.deviceName}`
      : `Batterie faible (${params.battery} %) — ${params.deviceName}`;
  const body =
    lang === 'ar'
      ? `مستشعر ${params.profileName} (${params.deviceId}) لم يتبقَّ له سوى ~${params.remainingHours} ساعة. يُرجى شحن الجهاز أو استبدال الوحدة قريباً.`
      : `Le capteur de ${params.profileName} (${params.deviceId}) n'a plus que ~${params.remainingHours} h d'autonomie. Pensez à le recharger ou à changer de module prochainement.`;

  try {
    const options: NotificationOptions & { renotify?: boolean } = {
      body,
      tag: `biotemp-low-battery-${params.profileId}-${params.deviceId}`,
      requireInteraction: true,
      renotify: true,
    };
    const notification = new Notification(title, options);
    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore
      }
      params.onSelectProfile?.();
      notification.close();
    };
    return true;
  } catch {
    try {
      const fallback = new Notification(title, {
        body,
        tag: `biotemp-low-battery-${params.profileId}-${params.deviceId}`,
      });
      fallback.onclick = () => {
        params.onSelectProfile?.();
        fallback.close();
      };
      return true;
    } catch {
      return false;
    }
  }
}
