export type NightModePolicy = 'manual' | 'sun_schedule' | 'child_sleep';

export interface SleepSchedule {
  bedTime: string; // HH:mm
  wakeTime: string; // HH:mm
}

export function parseHHMMToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return Math.max(0, Math.min(23, h)) * 60 + Math.max(0, Math.min(59, m));
}

function minutesToHHMM(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Estimates local sunrise and sunset based on day of year (seasonal mid-latitude curve).
 */
export function getLocalSunSchedule(date: Date): { sunrise: string; sunset: string } {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Peak summer ~day 172 (June 21), trough winter ~day 355 (Dec 21)
  const seasonalCos = Math.cos(((dayOfYear - 172) / 365) * 2 * Math.PI);

  // Sunrise shifts between ~05:50 (350m) in summer and ~08:30 (510m) in winter
  const sunriseMins = 430 - seasonalCos * 80;
  // Sunset shifts between ~21:45 (1305m) in summer and ~16:55 (1015m) in winter
  const sunsetMins = 1160 + seasonalCos * 145;

  return {
    sunrise: minutesToHHMM(sunriseMins),
    sunset: minutesToHHMM(sunsetMins),
  };
}

/**
 * Checks whether `currentMinutes` falls inside an overnight window [startHHMM, endHHMM).
 */
export function isTimeInNightWindow(
  currentMinutes: number,
  startHHMM: string,
  endHHMM: string
): boolean {
  const start = parseHHMMToMinutes(startHHMM);
  const end = parseHHMMToMinutes(endHHMM);
  if (start === end) return false;
  if (start > end) {
    // Overnight range (e.g. 19:30 -> 07:00)
    return currentMinutes >= start || currentMinutes < end;
  }
  return currentMinutes >= start && currentMinutes < end;
}

export function formatCurrentTimeHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
