import { ChildProfile, TemperatureReading } from '../types/biotemp';

const NOW = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

function isoDateOffset(daysOffset: number): string {
  const d = new Date(NOW + daysOffset * 24 * HOUR);
  return d.toISOString().slice(0, 10);
}

function generateTimeline(
  baseNow: number,
  points: Array<{ minutesAgo: number; value: number; source?: TemperatureReading['source'] }>,
  prefix: string
): TemperatureReading[] {
  return points
    .slice()
    .sort((a, b) => b.minutesAgo - a.minutesAgo)
    .map((pt, index) => ({
      id: `${prefix}-r-${index}`,
      timestamp: baseNow - pt.minutesAgo * MIN,
      value: Number(pt.value.toFixed(1)),
      source: pt.source ?? 'live',
    }));
}

export function createInitialProfiles(): ChildProfile[] {
  const now = NOW;

  const yacineReadings = generateTimeline(
    now,
    [
      { minutesAgo: 1380, value: 36.8 },
      { minutesAgo: 1260, value: 36.9 },
      { minutesAgo: 1140, value: 37.0 },
      { minutesAgo: 1020, value: 37.1 },
      { minutesAgo: 900, value: 37.0 },
      { minutesAgo: 780, value: 37.2 },
      { minutesAgo: 660, value: 37.3 },
      { minutesAgo: 540, value: 37.6 },
      { minutesAgo: 480, value: 37.9 },
      { minutesAgo: 420, value: 38.1 },
      { minutesAgo: 360, value: 37.8 },
      { minutesAgo: 300, value: 37.6 },
      { minutesAgo: 240, value: 37.5 },
      { minutesAgo: 180, value: 37.4 },
      { minutesAgo: 120, value: 37.3 },
      { minutesAgo: 60, value: 37.3 },
      { minutesAgo: 30, value: 37.4 },
      { minutesAgo: 15, value: 37.4 },
      { minutesAgo: 5, value: 37.3 },
      { minutesAgo: 0, value: 37.4 },
    ],
    'yacine'
  );

  const linaReadings = generateTimeline(
    now,
    [
      { minutesAgo: 1380, value: 37.1 },
      { minutesAgo: 1260, value: 37.2 },
      { minutesAgo: 1140, value: 37.4 },
      { minutesAgo: 1020, value: 37.6 },
      { minutesAgo: 900, value: 37.9 },
      { minutesAgo: 780, value: 38.2 },
      { minutesAgo: 660, value: 38.5 },
      { minutesAgo: 540, value: 38.8 },
      { minutesAgo: 450, value: 38.9 },
      { minutesAgo: 380, value: 38.6 },
      { minutesAgo: 300, value: 38.3 },
      { minutesAgo: 240, value: 38.1 },
      { minutesAgo: 180, value: 38.2 },
      { minutesAgo: 120, value: 38.3 },
      { minutesAgo: 60, value: 38.2 },
      { minutesAgo: 35, value: 38.1 },
      { minutesAgo: 15, value: 38.2 },
      { minutesAgo: 5, value: 38.1 },
      { minutesAgo: 0, value: 38.2 },
    ],
    'lina'
  );

  const karimReadings = generateTimeline(
    now,
    [
      { minutesAgo: 1380, value: 36.6 },
      { minutesAgo: 1200, value: 36.7 },
      { minutesAgo: 1020, value: 36.8 },
      { minutesAgo: 840, value: 36.7 },
      { minutesAgo: 660, value: 36.9 },
      { minutesAgo: 480, value: 37.0 },
      { minutesAgo: 300, value: 36.8 },
      { minutesAgo: 180, value: 36.9 },
      { minutesAgo: 90, value: 36.8 },
      { minutesAgo: 30, value: 36.7 },
      { minutesAgo: 10, value: 36.8 },
      { minutesAgo: 0, value: 36.8 },
    ],
    'karim'
  );

  return [
    {
      id: 'yacine',
      name: 'Yacine',
      initials: 'YA',
      ageLabel: 'Nourrisson 0–24 mois',
      ageCategory: 'infant',
      patchLabel: 'Patch Nourrisson (0–24 mois)',
      patchAppliedAt: now - 5 * HOUR,
      deviceId: 'BT-CORE-01',
      deviceName: 'Cœur de Yacine',
      battery: 88,
      threshold: 38.0,
      connectionMode: 'ble_connected',
      homeHubEnabled: false,
      homeHubDeviceName: 'iPad Chambre',
      lastConnectedAt: now,
      readings: yacineReadings,
      bufferedReadings: [],
      lastSyncNotice: null,
      notes: [
        {
          id: 'y-n-1',
          timestamp: now - 420 * MIN,
          category: 'Antipyrétique administré',
          text: 'Paracétamol pédiatrique administré selon le poids (pipette).',
          temperatureAtTime: 38.1,
        },
        {
          id: 'y-n-2',
          timestamp: now - 360 * MIN,
          category: 'Hydratation / boisson',
          text: 'Biberon pris calmement, sommeil apaisé.',
          temperatureAtTime: 37.8,
        },
      ],
      vaccinations: [
        {
          id: 'y-vac-1',
          vaccineName: 'Hexavalent (DTP-Coq-Hib-HepB) — Dose 2',
          administeredDate: isoDateOffset(-95),
          nextDueDate: isoDateOffset(42),
          lotOrNote: 'Lot HX-4092 · Rappel prévu à 11 mois',
        },
        {
          id: 'y-vac-2',
          vaccineName: 'Pneumocoque conjugué (PCV) — Dose 2',
          administeredDate: isoDateOffset(-95),
          nextDueDate: isoDateOffset(42),
          lotOrNote: 'Tolérance parfaite',
        },
      ],
      healthReminders: [
        {
          id: 'y-rem-1',
          title: 'Visite pédiatre du 9e mois (courbe poids/taille)',
          dueDate: isoDateOffset(6),
          time: '10:30',
          category: 'Pédiatre / Médecin',
          notes: 'Apporter le carnet de santé et le résumé PDF BioTemp.',
          completed: false,
        },
        {
          id: 'y-rem-2',
          title: 'Supplément Vitamine D (2 gouttes le matin)',
          dueDate: isoDateOffset(0),
          time: '08:30',
          category: 'Traitement / Vitamines',
          notes: 'Prise quotidienne recommandée par le pédiatre.',
          completed: true,
        },
      ],
      sleepSchedule: {
        bedTime: '19:30',
        wakeTime: '07:00',
      },
    },
    {
      id: 'lina',
      name: 'Lina',
      initials: 'LI',
      ageLabel: 'Enfant 2–5 ans',
      ageCategory: 'child',
      patchLabel: 'Patch Enfant (2–5 ans)',
      patchAppliedAt: now - 13 * HOUR,
      deviceId: 'BT-CORE-02',
      deviceName: 'Cœur de Lina',
      battery: 74,
      threshold: 38.5,
      connectionMode: 'ble_connected',
      homeHubEnabled: true,
      homeHubDeviceName: 'iPad Chambre',
      lastConnectedAt: now,
      readings: linaReadings,
      bufferedReadings: [],
      lastSyncNotice: null,
      notes: [
        {
          id: 'l-n-1',
          timestamp: now - 450 * MIN,
          category: 'Fatigue / léthargie',
          text: 'Joue moins que d’habitude, frissons légers en début d’après-midi.',
          temperatureAtTime: 38.9,
        },
        {
          id: 'l-n-2',
          timestamp: now - 440 * MIN,
          category: 'Antipyrétique administré',
          text: 'Antipyrétique administré avec grand verre d’eau.',
          temperatureAtTime: 38.8,
        },
        {
          id: 'l-n-3',
          timestamp: now - 240 * MIN,
          category: 'Compresses tièdes',
          text: 'Compresses tièdes sur le front, pièce aérée à 19 °C.',
          temperatureAtTime: 38.1,
        },
      ],
      vaccinations: [
        {
          id: 'l-vac-1',
          vaccineName: 'ROR (Rougeole-Oreillons-Rubéole) — Dose 2',
          administeredDate: isoDateOffset(-210),
          lotOrNote: 'Schéma complet validé par le pédiatre',
        },
      ],
      healthReminders: [
        {
          id: 'l-rem-1',
          title: 'Contrôle dentaire annuel (M’T Dents)',
          dueDate: isoDateOffset(14),
          time: '14:15',
          category: 'Dentaire / Ophtalmo',
          notes: 'Cabinet Dr Mansouri · Brossage biquotidien.',
          completed: false,
        },
        {
          id: 'l-rem-2',
          title: 'Bilan visuel pré-scolaire',
          dueDate: isoDateOffset(28),
          time: '09:45',
          category: 'Dentaire / Ophtalmo',
          completed: false,
        },
      ],
      sleepSchedule: {
        bedTime: '20:30',
        wakeTime: '07:30',
      },
    },
    {
      id: 'karim',
      name: 'Karim',
      initials: 'KA',
      ageLabel: 'Adulte +5 ans',
      ageCategory: 'adult',
      patchLabel: 'Patch Confort (+5 ans)',
      patchAppliedAt: now - 2 * HOUR,
      deviceId: 'BT-CORE-03',
      deviceName: 'Cœur de Karim',
      battery: 94,
      threshold: 38.5,
      connectionMode: 'ble_connected',
      homeHubEnabled: false,
      homeHubDeviceName: 'Tablette Salon',
      lastConnectedAt: now,
      readings: karimReadings,
      bufferedReadings: [],
      lastSyncNotice: null,
      notes: [
        {
          id: 'k-n-1',
          timestamp: now - 480 * MIN,
          category: 'Observation',
          text: 'Suivi post-vaccination préventif, aucune gêne signalée.',
          temperatureAtTime: 37.0,
        },
      ],
      vaccinations: [
        {
          id: 'k-vac-1',
          vaccineName: 'Vaccin Grippe saisonnière',
          administeredDate: isoDateOffset(-2),
          nextDueDate: isoDateOffset(363),
          lotOrNote: 'Bras gauche · Suivi post-injection calme',
        },
      ],
      healthReminders: [
        {
          id: 'k-rem-1',
          title: 'Bilan sanguin annuel à jeun',
          dueDate: isoDateOffset(19),
          time: '08:00',
          category: 'Bilan / Analyses',
          notes: 'Ordonnance préparée · Laboratoire du centre.',
          completed: false,
        },
      ],
      sleepSchedule: {
        bedTime: '22:30',
        wakeTime: '07:00',
      },
    },
  ];
}
