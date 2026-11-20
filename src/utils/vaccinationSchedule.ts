import { AppLanguage, ChildProfile, VaccinationRecord } from '../types/biotemp';

export type MilestoneGroup = 'infant' | 'childhood' | 'adult';

export type MilestoneStatus =
  | 'completed'
  | 'due_soon'
  | 'overdue'
  | 'upcoming'
  | 'archived';

export interface VaccineMilestoneTemplate {
  id: string;
  group: MilestoneGroup;
  ageMonths: number;
  ageBadgeFr: string;
  ageBadgeAr: string;
  vaccineFr: string;
  vaccineAr: string;
  doseFr: string;
  doseAr: string;
  noteFr: string;
  noteAr: string;
  mandatory: boolean;
  seriesKey: string;
  doseOrder: number;
  matchKeywords: string[];
}

export interface EvaluatedVaccineMilestone extends VaccineMilestoneTemplate {
  dueDateIso: string;
  daysUntilDue: number;
  status: MilestoneStatus;
  matchedRecord?: VaccinationRecord;
  alreadyInReminders: boolean;
}

export interface ProfileVaccinationCalendar {
  effectiveBirthDate: string;
  isEstimatedBirthDate: boolean;
  ageMonthsExact: number;
  ageDisplay: string;
  milestones: EvaluatedVaccineMilestone[];
  autoReminders: EvaluatedVaccineMilestone[];
  completedCount: number;
  dueSoonCount: number;
  overdueCount: number;
}

export const VACCINE_SCHEDULE_TEMPLATES: VaccineMilestoneTemplate[] = [
  {
    id: 'ms-0m-bcg',
    group: 'infant',
    ageMonths: 0,
    ageBadgeFr: 'Naissance',
    ageBadgeAr: 'عند الولادة',
    vaccineFr: 'BCG (Tuberculose)',
    vaccineAr: 'لقاح السل (BCG)',
    doseFr: 'Dose unique',
    doseAr: 'جرعة وحيدة',
    noteFr: 'Recommandé dès la maternité ou au 1er mois selon indication.',
    noteAr: 'موصى به عند الولادة أو خلال الشهر الأول حسب التوجيه الطبي.',
    mandatory: false,
    seriesKey: 'bcg',
    doseOrder: 1,
    matchKeywords: ['bcg', 'tuberculose', 'السل'],
  },
  {
    id: 'ms-2m-hexa1',
    group: 'infant',
    ageMonths: 2,
    ageBadgeFr: '2 mois',
    ageBadgeAr: 'شهران',
    vaccineFr: 'Hexavalent (DTCaP-Hib-HepB)',
    vaccineAr: 'اللقاح السداسي (DTCaP-Hib-HepB)',
    doseFr: 'Dose 1',
    doseAr: 'الجرعة 1',
    noteFr: 'Diphtérie, Tétanos, Coqueluche, Polio, Hib et Hépatite B.',
    noteAr: 'الخناق، الكزاز، السعال الديكي، شلل الأطفال، المستدمية النزلية والتهاب الكبد B.',
    mandatory: true,
    seriesKey: 'hexavalent',
    doseOrder: 1,
    matchKeywords: ['hexavalent', 'dtp', 'dtcap', 'السداسي'],
  },
  {
    id: 'ms-2m-pcv1',
    group: 'infant',
    ageMonths: 2,
    ageBadgeFr: '2 mois',
    ageBadgeAr: 'شهران',
    vaccineFr: 'Pneumocoque conjugué (PCV)',
    vaccineAr: 'المكورات الرئوية (PCV)',
    doseFr: 'Dose 1',
    doseAr: 'الجرعة 1',
    noteFr: 'Protection contre les infections invasives à pneumocoque.',
    noteAr: 'حماية من التهابات المكورات الرئوية الغازية.',
    mandatory: true,
    seriesKey: 'pcv',
    doseOrder: 1,
    matchKeywords: ['pneumocoque', 'pcv', 'المكورات الرئوية'],
  },
  {
    id: 'ms-4m-hexa2',
    group: 'infant',
    ageMonths: 4,
    ageBadgeFr: '4 mois',
    ageBadgeAr: '4 أشهر',
    vaccineFr: 'Hexavalent (DTCaP-Hib-HepB)',
    vaccineAr: 'اللقاح السداسي (DTCaP-Hib-HepB)',
    doseFr: 'Dose 2',
    doseAr: 'الجرعة 2',
    noteFr: '2e injection de primovaccination (2 mois après la dose 1).',
    noteAr: 'الجرعة الثانية من التلقيح الأساسي (بعد شهرين من الجرعة الأولى).',
    mandatory: true,
    seriesKey: 'hexavalent',
    doseOrder: 2,
    matchKeywords: ['hexavalent', 'dtp', 'dtcap', 'السداسي'],
  },
  {
    id: 'ms-4m-pcv2',
    group: 'infant',
    ageMonths: 4,
    ageBadgeFr: '4 mois',
    ageBadgeAr: '4 أشهر',
    vaccineFr: 'Pneumocoque conjugué (PCV)',
    vaccineAr: 'المكورات الرئوية (PCV)',
    doseFr: 'Dose 2',
    doseAr: 'الجرعة 2',
    noteFr: 'Consolidation de l’immunité antipneumococcique.',
    noteAr: 'تعزيز المناعة ضد المكورات الرئوية.',
    mandatory: true,
    seriesKey: 'pcv',
    doseOrder: 2,
    matchKeywords: ['pneumocoque', 'pcv', 'المكورات الرئوية'],
  },
  {
    id: 'ms-5m-men',
    group: 'infant',
    ageMonths: 5,
    ageBadgeFr: '5 mois',
    ageBadgeAr: '5 أشهر',
    vaccineFr: 'Méningocoque C / ACWY',
    vaccineAr: 'المكورات السحائية (C / ACWY)',
    doseFr: 'Dose 1',
    doseAr: 'الجرعة 1',
    noteFr: 'Prévention des méningites à méningocoque du nourrisson.',
    noteAr: 'الوقاية من التهاب السحايا بالمكورات السحائية لدى الرضع.',
    mandatory: true,
    seriesKey: 'meningocoque',
    doseOrder: 1,
    matchKeywords: ['méningocoque', 'meningocoque', 'acwy', 'السحائية'],
  },
  {
    id: 'ms-11m-hexa3',
    group: 'infant',
    ageMonths: 11,
    ageBadgeFr: '11 mois',
    ageBadgeAr: '11 شهراً',
    vaccineFr: 'Hexavalent (DTCaP-Hib-HepB)',
    vaccineAr: 'اللقاح السداسي (DTCaP-Hib-HepB)',
    doseFr: 'Rappel (Dose 3)',
    doseAr: 'الجرعة التذكيرية (3)',
    noteFr: 'Rappel indispensable de fin de 1re année.',
    noteAr: 'جرعة تذكيرية أساسية قبل إتمام السنة الأولى.',
    mandatory: true,
    seriesKey: 'hexavalent',
    doseOrder: 3,
    matchKeywords: ['hexavalent', 'dtp', 'dtcap', 'السداسي'],
  },
  {
    id: 'ms-11m-pcv3',
    group: 'infant',
    ageMonths: 11,
    ageBadgeFr: '11 mois',
    ageBadgeAr: '11 شهراً',
    vaccineFr: 'Pneumocoque conjugué (PCV)',
    vaccineAr: 'المكورات الرئوية (PCV)',
    doseFr: 'Rappel (Dose 3)',
    doseAr: 'الجرعة التذكيرية (3)',
    noteFr: 'Administré le même jour que le rappel Hexavalent.',
    noteAr: 'يُعطى في نفس الموعد مع تذكير اللقاح السداسي.',
    mandatory: true,
    seriesKey: 'pcv',
    doseOrder: 3,
    matchKeywords: ['pneumocoque', 'pcv', 'المكورات الرئوية'],
  },
  {
    id: 'ms-12m-ror1',
    group: 'infant',
    ageMonths: 12,
    ageBadgeFr: '12 mois',
    ageBadgeAr: '12 شهراً',
    vaccineFr: 'ROR (Rougeole-Oreillons-Rubéole)',
    vaccineAr: 'الحصبة والنكاف والحصبة الألمانية (ROR)',
    doseFr: 'Dose 1',
    doseAr: 'الجرعة 1',
    noteFr: 'Première dose du vaccin ROR à 1 an révolu.',
    noteAr: 'الجرعة الأولى من لقاح ROR عند إتمام السنة الأولى.',
    mandatory: true,
    seriesKey: 'ror',
    doseOrder: 1,
    matchKeywords: ['ror', 'rougeole', 'الحصبة'],
  },
  {
    id: 'ms-12m-men2',
    group: 'infant',
    ageMonths: 12,
    ageBadgeFr: '12 mois',
    ageBadgeAr: '12 شهراً',
    vaccineFr: 'Méningocoque C / ACWY',
    vaccineAr: 'المكورات السحائية (C / ACWY)',
    doseFr: 'Rappel (Dose 2)',
    doseAr: 'الجرعة التذكيرية (2)',
    noteFr: 'Rappel du 12e mois assurant une protection durable.',
    noteAr: 'تذكير الشهر الثاني عشر لضمان حماية مستمرة.',
    mandatory: true,
    seriesKey: 'meningocoque',
    doseOrder: 2,
    matchKeywords: ['méningocoque', 'meningocoque', 'acwy', 'السحائية'],
  },
  {
    id: 'ms-16m-ror2',
    group: 'infant',
    ageMonths: 16,
    ageBadgeFr: '16–18 mois',
    ageBadgeAr: '16–18 شهراً',
    vaccineFr: 'ROR (Rougeole-Oreillons-Rubéole)',
    vaccineAr: 'الحصبة والنكاف والحصبة الألمانية (ROR)',
    doseFr: 'Dose 2',
    doseAr: 'الجرعة 2',
    noteFr: 'Complète l’immunité ROR pour l’entrée en collectivité.',
    noteAr: 'يكمل المناعة ضد الحصبة والنكاف والحصبة الألمانية.',
    mandatory: true,
    seriesKey: 'ror',
    doseOrder: 2,
    matchKeywords: ['ror', 'rougeole', 'الحصبة'],
  },
  {
    id: 'ms-6y-dtp',
    group: 'childhood',
    ageMonths: 72,
    ageBadgeFr: '6 ans',
    ageBadgeAr: '6 سنوات',
    vaccineFr: 'dTPcaP (Diphtérie-Tétanos-Coqueluche-Polio)',
    vaccineAr: 'تذكير 6 سنوات (dTPcaP)',
    doseFr: 'Rappel 6 ans',
    doseAr: 'تذكير 6 سنوات',
    noteFr: 'Rappel scolaire obligatoire avant l’entrée au primaire.',
    noteAr: 'جرعة تذكيرية مهمة عند سن دخول المدرسة الابتدائية.',
    mandatory: true,
    seriesKey: 'dtpcap_child',
    doseOrder: 1,
    matchKeywords: ['dtpcap', 'dtp', '6 ans', 'dTP'],
  },
  {
    id: 'ms-11y-hpv',
    group: 'childhood',
    ageMonths: 132,
    ageBadgeFr: '11–14 ans',
    ageBadgeAr: '11–14 سنة',
    vaccineFr: 'HPV & Rappel dTPcaP',
    vaccineAr: 'لقاح HPV وتذكير dTPcaP',
    doseFr: 'Schéma adolescent',
    doseAr: 'جرعات المراهقة',
    noteFr: 'Vaccination HPV (2 doses) + rappel dTPcaP entre 11 et 13 ans.',
    noteAr: 'تطعيم HPV وتذكير dTPcaP بين سن 11 و14 سنة.',
    mandatory: false,
    seriesKey: 'adolescent',
    doseOrder: 1,
    matchKeywords: ['hpv', 'papillomavirus', '11 ans', '11-13'],
  },
  {
    id: 'ms-25y-dtp',
    group: 'adult',
    ageMonths: 300,
    ageBadgeFr: '25 ans',
    ageBadgeAr: '25 سنة',
    vaccineFr: 'dTPca (Rappel jeune adulte)',
    vaccineAr: 'تذكير البالغين dTPca (25 سنة)',
    doseFr: 'Rappel 25 ans',
    doseAr: 'تذكير 25 سنة',
    noteFr: 'Rappel diphtérie-tétanos-coqueluche-polio à 25 ans.',
    noteAr: 'تذكير الخناق والكزاز والسعال الديكي وشلل الأطفال.',
    mandatory: false,
    seriesKey: 'adult_dtp_25',
    doseOrder: 1,
    matchKeywords: ['25 ans', 'dtpca'],
  },
  {
    id: 'ms-45y-dtp',
    group: 'adult',
    ageMonths: 540,
    ageBadgeFr: '45 ans',
    ageBadgeAr: '45 سنة',
    vaccineFr: 'dTP (Rappel adulte tous les 20 ans)',
    vaccineAr: 'تذكير البالغين dTP (45 سنة)',
    doseFr: 'Rappel 45 ans',
    doseAr: 'تذكير 45 سنة',
    noteFr: 'Maintien de la protection diphtérie-tétanos-polio chez l’adulte.',
    noteAr: 'تجديد الوقاية ضد الخناق والكزاز وشلل الأطفال كل 20 سنة.',
    mandatory: false,
    seriesKey: 'adult_dtp_45',
    doseOrder: 1,
    matchKeywords: ['45 ans', 'dtp adulte'],
  },
  {
    id: 'ms-annual-flu',
    group: 'adult',
    ageMonths: 0,
    ageBadgeFr: 'Annuel',
    ageBadgeAr: 'سنوياً',
    vaccineFr: 'Grippe saisonnière',
    vaccineAr: 'الإنفلونزا الموسمية',
    doseFr: '1 dose / an',
    doseAr: 'جرعة سنوية',
    noteFr: 'Renouvellement annuel recommandé à l’automne pour l’adulte et les foyers avec nourrisson.',
    noteAr: 'يوصى به سنوياً في الخريف للبالغين وللأسر التي تضم رضعاً.',
    mandatory: false,
    seriesKey: 'flu',
    doseOrder: 1,
    matchKeywords: ['grippe', 'influenza', 'الإنفلونزا'],
  },
];

function addMonthsToIso(birthIso: string, months: number): string {
  const [y, m, d] = birthIso.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setMonth(date.getMonth() + months);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function isoOffsetFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function inferBirthDateFromCategory(ageCategory: ChildProfile['ageCategory']): string {
  switch (ageCategory) {
    case 'newborn':
      return isoOffsetFromToday(-30);
    case 'infant':
      return isoOffsetFromToday(-275);
    case 'child':
      return isoOffsetFromToday(-1155);
    case 'adult':
    default:
      return isoOffsetFromToday(-12410);
  }
}

function parseDoseOrder(vaccineName: string): number | null {
  const lower = vaccineName.toLowerCase();
  if (lower.includes('dose 3') || lower.includes('rappel') || lower.includes('(3)') || lower.includes('الجرعة 3')) {
    return 3;
  }
  if (lower.includes('dose 2') || lower.includes('(2)') || lower.includes('الجرعة 2')) {
    return 2;
  }
  if (lower.includes('dose 1') || lower.includes('(1)') || lower.includes('الجرعة 1')) {
    return 1;
  }
  return null;
}

function findMatchingVaccination(
  template: VaccineMilestoneTemplate,
  vaccinations: VaccinationRecord[]
): VaccinationRecord | undefined {
  const seriesMatches = vaccinations.filter((v) => {
    const lower = v.vaccineName.toLowerCase();
    return template.matchKeywords.some((kw) => lower.includes(kw.toLowerCase()));
  });

  if (seriesMatches.length === 0) return undefined;

  // Direct dose match or series implies earlier dose completed
  let highestRecordedOrder = 0;
  let exactMatch: VaccinationRecord | undefined;

  for (const rec of seriesMatches) {
    const order = parseDoseOrder(rec.vaccineName);
    if (order !== null) {
      if (order > highestRecordedOrder) highestRecordedOrder = order;
      if (order === template.doseOrder) exactMatch = rec;
    } else if (template.doseOrder === 1) {
      exactMatch = rec;
    }
  }

  if (exactMatch) return exactMatch;
  if (highestRecordedOrder >= template.doseOrder) {
    return seriesMatches[0];
  }
  return undefined;
}

export function formatAgeFromMonths(ageMonths: number, lang: AppLanguage): string {
  const isAr = lang === 'ar';
  if (ageMonths < 1) {
    return isAr ? 'أقل من شهر' : '< 1 mois';
  }
  if (ageMonths < 24) {
    return isAr ? `${ageMonths} شهراً` : `${ageMonths} mois`;
  }
  const years = Math.floor(ageMonths / 12);
  const remMonths = ageMonths % 12;
  if (years >= 6 || remMonths === 0) {
    return isAr ? `${years} سنة` : `${years} ans`;
  }
  return isAr
    ? `${years} سنوات و${remMonths} أشهر`
    : `${years} ans ${remMonths} mois`;
}

export function buildProfileVaccinationCalendar(
  profile: ChildProfile,
  lang: AppLanguage
): ProfileVaccinationCalendar {
  const isEstimatedBirthDate = !profile.birthDate;
  const effectiveBirthDate = profile.birthDate || inferBirthDateFromCategory(profile.ageCategory);

  const [by, bm, bd] = effectiveBirthDate.split('-').map(Number);
  const birthDateObj = new Date(by, (bm || 1) - 1, bd || 1);
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const ageMonthsExact = Math.max(
    0,
    (todayMid.getFullYear() - birthDateObj.getFullYear()) * 12 +
      (todayMid.getMonth() - birthDateObj.getMonth()) -
      (todayMid.getDate() < birthDateObj.getDate() ? 1 : 0)
  );

  const milestones: EvaluatedVaccineMilestone[] = VACCINE_SCHEDULE_TEMPLATES.map((tpl) => {
    const matchedRecord = findMatchingVaccination(tpl, profile.vaccinations);

    let dueDateIso: string;
    if (tpl.id === 'ms-annual-flu') {
      if (matchedRecord?.nextDueDate) {
        dueDateIso = matchedRecord.nextDueDate;
      } else {
        const nextAutumnYear = todayMid.getMonth() >= 10 ? todayMid.getFullYear() + 1 : todayMid.getFullYear();
        dueDateIso = `${nextAutumnYear}-10-15`;
      }
    } else {
      dueDateIso = addMonthsToIso(effectiveBirthDate, tpl.ageMonths);
    }

    const [dy, dm, dd] = dueDateIso.split('-').map(Number);
    const dueObj = new Date(dy, (dm || 1) - 1, dd || 1);
    const daysUntilDue = Math.round((dueObj.getTime() - todayMid.getTime()) / 86400000);

    let status: MilestoneStatus;
    if (matchedRecord) {
      status = 'completed';
    } else if (tpl.id === 'ms-annual-flu') {
      if (ageMonthsExact < 18) {
        status = 'upcoming';
      } else if (daysUntilDue <= 60 && daysUntilDue >= -30) {
        status = 'due_soon';
      } else {
        status = 'upcoming';
      }
    } else if (ageMonthsExact >= 216 && tpl.group !== 'adult') {
      // Adult profiles don't get infant/childhood overdue noise
      status = 'archived';
    } else if (ageMonthsExact >= 24 && tpl.group === 'infant' && daysUntilDue < -365) {
      // Older children (>2 yrs) whose early infant doses aren't manually logged
      status = 'archived';
    } else if (daysUntilDue < -14) {
      status = 'overdue';
    } else if (daysUntilDue <= 90) {
      status = 'due_soon';
    } else {
      status = 'upcoming';
    }

    const targetLabelFr = `${tpl.vaccineFr} — ${tpl.doseFr}`.toLowerCase();
    const targetLabelAr = `${tpl.vaccineAr} — ${tpl.doseAr}`.toLowerCase();
    const alreadyInReminders = profile.healthReminders.some((r) => {
      const titleLower = r.title.toLowerCase();
      return (
        titleLower === targetLabelFr ||
        titleLower === targetLabelAr ||
        (tpl.matchKeywords.some((kw) => titleLower.includes(kw.toLowerCase())) &&
          r.dueDate === dueDateIso)
      );
    });

    return {
      ...tpl,
      dueDateIso,
      daysUntilDue,
      status,
      matchedRecord,
      alreadyInReminders,
    };
  });

  const autoReminders = milestones.filter(
    (m) => m.status === 'overdue' || m.status === 'due_soon'
  );

  return {
    effectiveBirthDate,
    isEstimatedBirthDate,
    ageMonthsExact,
    ageDisplay: formatAgeFromMonths(ageMonthsExact, lang),
    milestones,
    autoReminders,
    completedCount: milestones.filter((m) => m.status === 'completed').length,
    dueSoonCount: milestones.filter((m) => m.status === 'due_soon').length,
    overdueCount: milestones.filter((m) => m.status === 'overdue').length,
  };
}
