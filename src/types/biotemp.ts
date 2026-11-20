export type AgeCategory = 'newborn' | 'infant' | 'child' | 'adult';

export type TemperatureStatus = 'normal' | 'elevated' | 'high_fever';

export type ThermalAlertPhase =
  | 'stabilizing'
  | 'normal'
  | 'monitoring_mild'
  | 'confirming_persistence'
  | 'confirmed_alert';

export type PersistenceDurationMinutes = 5 | 8 | 10;

export type SignalContactStatus = 'stable' | 'stabilizing' | 'oscillating' | 'no_contact';

export type ConnectionMode =
  | 'ble_connected'
  | 'out_of_range'
  | 'home_hub_relayed'
  | 'standby_removed';

export type ReadingSource = 'live' | 'buffered_sync' | 'home_hub' | 'simulated';

export interface TemperatureReading {
  id: string;
  timestamp: number;
  value: number;
  source: ReadingSource;
}

export type NotePresetCategory =
  | 'Antipyrétique administré'
  | 'Compresses tièdes'
  | 'Vêtements / couverture allégés'
  | 'Fatigue / léthargie'
  | "Reprise d'activité / appétit"
  | 'Mesure de référence'
  | 'Vomissements'
  | 'Douleur / pleurs'
  | 'Hydratation / boisson'
  | 'Observation'
  | 'Changement de module'
  | 'Session clôturée';

export interface MedicalNote {
  id: string;
  timestamp: number;
  category: NotePresetCategory;
  text: string;
  temperatureAtTime: number;
  referenceTemp?: number;
}

export type HealthReminderCategory =
  | 'Pédiatre / Médecin'
  | 'Bilan / Analyses'
  | 'Traitement / Vitamines'
  | 'Dentaire / Ophtalmo'
  | 'Autre';

export interface VaccinationRecord {
  id: string;
  vaccineName: string;
  administeredDate: string;
  nextDueDate?: string;
  lotOrNote?: string;
}

export interface HealthReminder {
  id: string;
  title: string;
  dueDate: string;
  time?: string;
  category: HealthReminderCategory;
  notes?: string;
  completed: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  initials: string;
  ageLabel: string;
  ageCategory: AgeCategory;
  birthDate?: string;
  patchLabel: string;
  patchAppliedAt: number;
  deviceId: string;
  deviceName: string;
  battery: number;
  batteryHistory?: number[];
  threshold: number;
  connectionMode: ConnectionMode;
  homeHubEnabled: boolean;
  homeHubDeviceName: string;
  lastConnectedAt: number;
  readings: TemperatureReading[];
  bufferedReadings: TemperatureReading[];
  notes: MedicalNote[];
  vaccinations: VaccinationRecord[];
  healthReminders: HealthReminder[];
  sleepSchedule: {
    bedTime: string;
    wakeTime: string;
  };
  stabilizingUntil?: number;
  lastSyncNotice: string | null;
}

export type TimeWindowHours = 1 | 6 | 12 | 24;

export type AppLanguage = 'fr' | 'ar';

export type TemperatureUnit = 'C' | 'F';

export type SamplingIntervalMs = 60000 | 180000 | 300000;

export type PatchReminderHours = 12 | 18 | 24;

