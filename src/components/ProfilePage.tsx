import React, { useState } from 'react';
import {
  ArrowRightLeft,
  CalendarCheck2,
  CalendarClock,
  Check,
  CheckCircle2,
  FileText,
  HeartPulse,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Syringe,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  AgeCategory,
  AppLanguage,
  ChildProfile,
  HealthReminderCategory,
  PatchReminderHours,
  PersistenceDurationMinutes,
  SamplingIntervalMs,
  TemperatureUnit,
} from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import { NightModePolicy, SleepSchedule } from '../utils/nightMode';
import { NotificationPermissionState } from '../utils/notifications';
import {
  formatTempFr,
  getRecommendedThresholdForAge,
  tempUnitLabel,
} from '../utils/temperature';
import { buildProfileVaccinationCalendar } from '../utils/vaccinationSchedule';
import { AppSettingsBlock } from './AppSettingsBlock';
import { VaccinationCalendarModal } from './VaccinationCalendarModal';

interface ProfilePageProps {
  profiles: ChildProfile[];
  activeProfile: ChildProfile;
  identityConfirmedIds: Record<string, boolean>;
  onSelectProfile: (profileId: string) => void;
  onConfirmIdentity: (profileId: string) => void;
  onOpenReplaceDevice: () => void;
  onOpenReport: () => void;
  onReassignRecentSegment: (fromProfileId: string, toProfileId: string) => void;
  onCreateProfile: (payload: {
    name: string;
    ageCategory: AgeCategory;
    birthDate?: string;
    deviceId: string;
    deviceName: string;
    threshold: number;
  }) => void;
  onUpdateBirthDate: (profileId: string, birthDate: string) => void;
  onAddVaccination: (
    profileId: string,
    payload: {
      vaccineName: string;
      administeredDate: string;
      nextDueDate?: string;
      lotOrNote?: string;
    }
  ) => void;
  onDeleteVaccination: (profileId: string, vaccinationId: string) => void;
  onAddHealthReminder: (
    profileId: string,
    payload: {
      title: string;
      dueDate: string;
      time?: string;
      category: HealthReminderCategory;
      notes?: string;
    }
  ) => void;
  onToggleHealthReminder: (profileId: string, reminderId: string) => void;
  onDeleteHealthReminder: (profileId: string, reminderId: string) => void;
  // App settings props
  language: AppLanguage;
  tempUnit: TemperatureUnit;
  isDarkMode: boolean;
  nightModePolicy: NightModePolicy;
  sunSchedule: { sunrise: string; sunset: string };
  currentTimeLabel: string;
  simulateNightTime: boolean;
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
  onResetSettings: () => void;
}

type ProfileSectionTab = 'profiles' | 'global_health' | 'settings';

const VACCINE_PRESETS: Array<{ value: string; labelAr: string }> = [
  { value: 'Hexavalent (DTP-Coq-Hib-HepB)', labelAr: 'اللقاح السداسي (DTP-Coq-Hib-HepB)' },
  { value: 'Pneumocoque (PCV)', labelAr: 'المكورات الرئوية (PCV)' },
  { value: 'ROR (Rougeole-Oreillons-Rubéole)', labelAr: 'الحصبة والنكاف والحصبة الألمانية (ROR)' },
  { value: 'Méningocoque', labelAr: 'المكورات السحائية' },
  { value: 'Grippe saisonnière', labelAr: 'الإنفلونزا الموسمية' },
];

const REMINDER_CATEGORIES: Array<{ value: HealthReminderCategory; labelAr: string }> = [
  { value: 'Pédiatre / Médecin', labelAr: 'طبيب الأطفال / الطبيب' },
  { value: 'Bilan / Analyses', labelAr: 'فحوصات / تحاليل' },
  { value: 'Traitement / Vitamines', labelAr: 'علاج / فيتامينات' },
  { value: 'Dentaire / Ophtalmo', labelAr: 'أسنان / عيون' },
  { value: 'Autre', labelAr: 'أخرى' },
];

const REMINDER_PRESETS: Array<{
  title: string;
  titleAr: string;
  category: HealthReminderCategory;
}> = [
  {
    title: 'Visite pédiatre de contrôle',
    titleAr: 'زيارة متابعة لدى طبيب الأطفال',
    category: 'Pédiatre / Médecin',
  },
  {
    title: 'Vitamine D quotidienne',
    titleAr: 'فيتامين D اليومي',
    category: 'Traitement / Vitamines',
  },
  {
    title: 'Contrôle dentaire annuel',
    titleAr: 'فحص الأسنان السنوي',
    category: 'Dentaire / Ophtalmo',
  },
  {
    title: 'Bilan sanguin / analyses',
    titleAr: 'تحاليل الدم / الفحوصات',
    category: 'Bilan / Analyses',
  },
];

function formatIsoDateFr(isoDate: string, lang: AppLanguage = 'fr'): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profiles,
  activeProfile,
  identityConfirmedIds,
  onSelectProfile,
  onConfirmIdentity,
  onOpenReplaceDevice,
  onOpenReport,
  onReassignRecentSegment,
  onCreateProfile,
  onUpdateBirthDate,
  onAddVaccination,
  onDeleteVaccination,
  onAddHealthReminder,
  onToggleHealthReminder,
  onDeleteHealthReminder,
  language,
  tempUnit,
  isDarkMode,
  nightModePolicy,
  sunSchedule,
  currentTimeLabel,
  simulateNightTime,
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
  onResetSettings,
}) => {
  const isAr = language === 'ar';
  const t = getStrings(language).profilePage;
  const unitSuffix = tempUnitLabel(tempUnit);
  const [sectionTab, setSectionTab] = useState<ProfileSectionTab>('profiles');
  const [calendarProfileId, setCalendarProfileId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [ageCategory, setAgeCategory] = useState<AgeCategory>('infant');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [deviceId, setDeviceId] = useState('BT-CORE-05');
  const [deviceName, setDeviceName] = useState('');
  const [threshold, setThreshold] = useState('38.0');

  const todayIso = new Date().toISOString().slice(0, 10);

  const activeCalendarSummary = buildProfileVaccinationCalendar(activeProfile, language);

  // Vaccination form state
  const [vaccineName, setVaccineName] = useState('');
  const [administeredDate, setAdministeredDate] = useState(todayIso);
  const [nextDueDate, setNextDueDate] = useState('');
  const [lotOrNote, setLotOrNote] = useState('');

  // Non-temperature health reminder form state
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderCategory, setReminderCategory] =
    useState<HealthReminderCategory>('Pédiatre / Médecin');
  const [reminderDate, setReminderDate] = useState(todayIso);
  const [reminderTime, setReminderTime] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');

  const otherProfiles = profiles.filter((p) => p.id !== activeProfile.id);
  const [reassignTargetId, setReassignTargetId] = useState<string>(
    otherProfiles[0]?.id ?? ''
  );
  const [reassignNotice, setReassignNotice] = useState<string | null>(null);

  const pendingRemindersCount = activeProfile.healthReminders.filter(
    (r) => !r.completed
  ).length;

  const sortedVaccinations = activeProfile.vaccinations
    .slice()
    .sort((a, b) => b.administeredDate.localeCompare(a.administeredDate));

  const sortedReminders = activeProfile.healthReminders
    .slice()
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = name.trim();
    const cleanedDevice = deviceId.trim().toUpperCase();
    if (!cleanedName || !cleanedDevice) return;
    onCreateProfile({
      name: cleanedName,
      ageCategory,
      birthDate: birthDateInput || undefined,
      deviceId: cleanedDevice,
      deviceName:
        deviceName.trim() || (isAr ? `وحدة ${cleanedName}` : `Cœur de ${cleanedName}`),
      threshold: Number(threshold) || 38.0,
    });
    setName('');
    setBirthDateInput('');
    setDeviceName('');
    setShowAddForm(false);
  };

  const handleReassign = () => {
    const targetId = reassignTargetId || otherProfiles[0]?.id;
    if (!targetId) return;
    const targetProfile = profiles.find((p) => p.id === targetId);
    onReassignRecentSegment(activeProfile.id, targetId);
    if (targetProfile) {
      setReassignNotice(
        isAr
          ? `تم نقل قياسات آخر 30 دقيقة من ${activeProfile.name} إلى ${targetProfile.name}.`
          : `Les mesures des 30 dernières minutes ont été transférées de ${activeProfile.name} vers ${targetProfile.name}.`
      );
    }
  };

  const handleAddVaccineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = vaccineName.trim();
    if (!cleaned || !administeredDate) return;
    onAddVaccination(activeProfile.id, {
      vaccineName: cleaned,
      administeredDate,
      nextDueDate: nextDueDate || undefined,
      lotOrNote: lotOrNote.trim() || undefined,
    });
    setVaccineName('');
    setNextDueDate('');
    setLotOrNote('');
  };

  const handleAddReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = reminderTitle.trim();
    if (!cleaned || !reminderDate) return;
    onAddHealthReminder(activeProfile.id, {
      title: cleaned,
      dueDate: reminderDate,
      time: reminderTime || undefined,
      category: reminderCategory,
      notes: reminderNotes.trim() || undefined,
    });
    setReminderTitle('');
    setReminderTime('');
    setReminderNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Header + Sub-tabs */}
      <section className="biotemp-card p-5 sm:p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64798F] dark:text-[#7B91A8]">
              {t.subtitle}
            </p>
            <h1 className="text-xl font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2 mt-0.5">
              {sectionTab === 'profiles' ? (
                <Users className="w-5 h-5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
              ) : sectionTab === 'global_health' ? (
                <HeartPulse className="w-5 h-5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
              ) : (
                <SlidersHorizontal
                  className="w-5 h-5 text-[#0B8A7E] dark:text-[#2DD4BF]"
                  aria-hidden="true"
                />
              )}
              <span>
                {sectionTab === 'profiles'
                  ? `${t.titleProfiles} (${profiles.length})`
                  : sectionTab === 'global_health'
                  ? `${t.titleGlobalHealth} — ${activeProfile.name}`
                  : t.tabSettingsShortcut}
              </span>
            </h1>
            <p className="mt-1 text-xs text-[#475B70] dark:text-[#9DB0C6] leading-relaxed flex flex-wrap items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
              <span>
                <strong>{t.localFirstPrefix}</strong> {t.localFirstBody}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {sectionTab === 'profiles' && (
              <button
                type="button"
                onClick={() => setShowAddForm((v) => !v)}
                className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F1D32] hover:bg-[#1B2F4D] dark:bg-[#0B8A7E] dark:hover:bg-[#087066] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{t.newProfile}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setCalendarProfileId(activeProfile.id)}
              className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EDF3F7] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:hover:bg-[#122038] dark:border-[#1B2A42] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CalendarCheck2 className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
              <span>{t.vaccinationCalendarBtn}</span>
              {activeCalendarSummary.autoReminders.length > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-md text-[10px] font-mono font-bold tabular-nums bg-[#FEF7EC] text-[#B45309] border border-[#FCDCA8] dark:bg-[#451A03] dark:text-[#FDE68A] dark:border-[#78350F]">
                  {activeCalendarSummary.autoReminders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenReport}
              className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#087066] bg-[#EDF9F7] hover:bg-[#D8F2EE] border border-[#BEEAE4] dark:text-[#5EEAD4] dark:bg-[#0A2624] dark:hover:bg-[#103835] dark:border-[#134E4A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>{t.doctorSummary}</span>
            </button>
          </div>
        </div>

        {/* Section Tabs: Profils & Modules | Santé Globale | Paramètres */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#E1E8EE] dark:border-[#1B2A42]">
          <div
            role="tablist"
            aria-label={isAr ? 'أقسام الملف الشخصي' : 'Sous-sections du profil'}
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-xl self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={sectionTab === 'profiles'}
              onClick={() => setSectionTab('profiles')}
              className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sectionTab === 'profiles'
                  ? 'bg-[#0F1D32] text-white dark:bg-[#0B8A7E]'
                  : 'text-[#64798F] dark:text-[#7B91A8] hover:text-[#0F1D32] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.tabProfiles}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={sectionTab === 'global_health'}
              onClick={() => setSectionTab('global_health')}
              className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sectionTab === 'global_health'
                  ? 'bg-[#0F1D32] text-white dark:bg-[#0B8A7E]'
                  : 'text-[#64798F] dark:text-[#7B91A8] hover:text-[#0F1D32] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.tabGlobalHealth}</span>
              {pendingRemindersCount > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-md text-[10px] font-mono font-bold tabular-nums ${
                    sectionTab === 'global_health'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#0B8A7E] text-white'
                  }`}
                >
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={sectionTab === 'settings'}
              onClick={() => setSectionTab('settings')}
              className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sectionTab === 'settings'
                  ? 'bg-[#0F1D32] text-white dark:bg-[#0B8A7E]'
                  : 'text-[#64798F] dark:text-[#7B91A8] hover:text-[#0F1D32] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.tabSettings}</span>
            </button>
          </div>

          {sectionTab === 'global_health' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#64798F] dark:text-[#7B91A8] me-1">
                {t.journalFor}
              </span>
              {profiles.map((p) => {
                const isSelected = p.id === activeProfile.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectProfile(p.id)}
                    className={`min-h-[32px] px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EDF9F7] text-[#087066] border-[#BEEAE4] dark:bg-[#0A2624] dark:text-[#5EEAD4] dark:border-[#134E4A]'
                        : 'bg-white text-[#475B70] border-[#E1E8EE] hover:bg-[#F4F7F9] dark:bg-[#09111E] dark:text-[#9DB0C6] dark:border-[#1B2A42]'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {sectionTab === 'profiles' ? (
        <>
          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="biotemp-card p-5 sm:p-6 space-y-4 transition-colors"
              aria-label={isAr ? 'إنشاء ملف جديد' : 'Créer un nouveau profil'}
            >
              <h2 className="text-base font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                {isAr ? 'إضافة ملف طفل أو بالغ' : 'Ajouter un profil enfant ou adulte'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="new-prof-name"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'الاسم' : 'Prénom'}
                  </label>
                  <input
                    id="new-prof-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAr ? 'مثال: آدم' : 'Ex. : Adam'}
                    required
                    className="w-full min-h-[40px] px-3 py-2 text-sm text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] dark:placeholder:text-[#64798F] rounded-lg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-prof-age"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'الفئة العمرية واللاصقة' : "Tranche d'âge & Patch"}
                  </label>
                  <select
                    id="new-prof-age"
                    value={ageCategory}
                    onChange={(e) => {
                      const nextAge = e.target.value as AgeCategory;
                      setAgeCategory(nextAge);
                      setThreshold(String(getRecommendedThresholdForAge(nextAge)));
                    }}
                    className="w-full min-h-[40px] px-3 py-2 text-sm text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-lg"
                  >
                    <option value="newborn">
                      {isAr ? 'حديث الولادة (< 3 أشهر)' : 'Nouveau-né (< 3 mois)'}
                    </option>
                    <option value="infant">
                      {isAr ? 'رضيع (3–24 شهراً)' : 'Nourrisson (3–24 mois)'}
                    </option>
                    <option value="child">
                      {isAr ? 'طفل (2–5 سنوات)' : 'Enfant (2–5 ans)'}
                    </option>
                    <option value="adult">
                      {isAr ? 'بالغ (+5 سنوات)' : 'Adulte (+5 ans)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-prof-birthdate"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'تاريخ الميلاد (اختياري للتذكيرات)' : 'Date de naissance (optionnel)'}
                  </label>
                  <input
                    id="new-prof-birthdate"
                    type="date"
                    max={todayIso}
                    value={birthDateInput}
                    onChange={(e) => setBirthDateInput(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 font-mono text-sm text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-lg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-prof-device"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'معرّف وحدة BioTemp Core' : 'Module BioTemp Core'}
                  </label>
                  <input
                    id="new-prof-device"
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="BT-CORE-05"
                    required
                    className="w-full min-h-[40px] px-3 py-2 font-mono text-sm text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-lg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-prof-devname"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'اسم الوحدة' : 'Nom du module'}
                  </label>
                  <input
                    id="new-prof-devname"
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder={isAr ? 'مثال: وحدة آدم' : "Ex. : Cœur d'Adam"}
                    className="w-full min-h-[40px] px-3 py-2 text-sm text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] dark:placeholder:text-[#64798F] rounded-lg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-prof-thresh"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {t.alertThreshold} ({unitSuffix})
                  </label>
                  <select
                    id="new-prof-thresh"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 font-mono text-sm text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-lg"
                  >
                    <option value="37.8">
                      {formatTempFr(37.8, tempUnit, language)} {unitSuffix}
                    </option>
                    <option value="38.0">
                      {formatTempFr(38.0, tempUnit, language)} {unitSuffix}
                    </option>
                    <option value="38.2">
                      {formatTempFr(38.2, tempUnit, language)} {unitSuffix}
                    </option>
                    <option value="38.5">
                      {formatTempFr(38.5, tempUnit, language)} {unitSuffix}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="min-h-[38px] px-4 py-2 text-xs font-medium text-[#64798F] dark:text-[#7B91A8] cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="min-h-[38px] px-5 py-2 text-xs font-semibold text-white bg-[#0B8A7E] hover:bg-[#087066] rounded-lg transition-colors cursor-pointer"
                >
                  {isAr ? 'إنشاء الملف' : 'Créer le profil'}
                </button>
              </div>
            </form>
          )}

          {/* Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfile.id;
              const isVerified = Boolean(identityConfirmedIds[profile.id]);
              const latest = profile.readings[profile.readings.length - 1];
              const profileVaxCal = buildProfileVaccinationCalendar(profile, language);

              return (
                <article
                  key={profile.id}
                  className={`biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all ${
                    isActive ? 'ring-2 ring-[#0B8A7E] dark:ring-[#2DD4BF]' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                            isActive
                              ? 'bg-[#0F1D32] text-white dark:bg-[#0B8A7E]'
                              : 'bg-[#EDF9F7] text-[#0B8A7E] border border-[#BEEAE4] dark:bg-[#0A2624] dark:text-[#5EEAD4] dark:border-[#134E4A]'
                          }`}
                        >
                          {profile.initials}
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                            {profile.name}
                          </h2>
                          <p className="text-xs text-[#64798F] dark:text-[#7B91A8]">
                            {profile.ageLabel}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-base font-bold text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums">
                        {latest
                          ? `${formatTempFr(latest.value, tempUnit, language)} ${unitSuffix}`
                          : '—'}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E1E8EE] dark:border-[#1B2A42] space-y-2 text-xs text-[#475B70] dark:text-[#9DB0C6] tabular-nums">
                      <div className="flex justify-between gap-2">
                        <span>{t.namedModule}</span>
                        <span className="font-semibold text-[#0F1D32] dark:text-[#E2E8F0]">
                          {profile.deviceName}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>{t.hardwareId}</span>
                        <span className="font-mono font-bold text-[#0B8A7E] dark:text-[#5EEAD4]">
                          {profile.deviceId}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>{t.medicalPatch}</span>
                        <span className="font-medium text-[#0F1D32] dark:text-[#E2E8F0]">
                          {profile.patchLabel}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>{t.alertThreshold}</span>
                        <span className="font-mono font-semibold text-[#0F1D32] dark:text-[#E2E8F0]">
                          {formatTempFr(profile.threshold, tempUnit, language)} {unitSuffix}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>{t.recordedHistory}</span>
                        <span className="font-mono text-[#0F1D32] dark:text-[#E2E8F0]">
                          {profile.readings.length} {t.readingsWord} · {profile.notes.length}{' '}
                          {t.notesWord}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>{t.globalHealthLabel}</span>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProfile(profile.id);
                            setSectionTab('global_health');
                          }}
                          className="font-semibold text-[#0B8A7E] dark:text-[#2DD4BF] hover:underline cursor-pointer"
                        >
                          {profile.vaccinations.length}{' '}
                          {profile.vaccinations.length > 1 ? t.vaccinesWord : t.vaccineWord} ·{' '}
                          {profile.healthReminders.filter((r) => !r.completed).length}{' '}
                          {profile.healthReminders.filter((r) => !r.completed).length > 1
                            ? t.remindersWord
                            : t.reminderWord}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    {!isVerified ? (
                      <button
                        type="button"
                        onClick={() => onConfirmIdentity(profile.id)}
                        className="min-h-[38px] w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#B45309] bg-[#FEF7EC] hover:bg-[#FDECD2] border border-[#FCDCA8] dark:text-[#FDE68A] dark:bg-[#261909] dark:hover:bg-[#36230D] dark:border-[#78350F] rounded-lg transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {t.confirmIdentity} {profile.name}
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#0B8A7E] dark:text-[#2DD4BF] py-1">
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        <span>{t.identityVerified}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectProfile(profile.id)}
                        className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#0B8A7E] text-white'
                            : 'bg-[#0F1D32] text-white hover:bg-[#1B2F4D] dark:bg-[#1B2A42] dark:hover:bg-[#243958]'
                        }`}
                      >
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                        <span>{isActive ? t.activeProfileBtn : t.activateBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfile(profile.id);
                          onOpenReplaceDevice();
                        }}
                        className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EDF3F7] border border-[#E1E8EE] dark:text-[#E2E8F0] dark:bg-[#09111E] dark:hover:bg-[#122038] dark:border-[#1B2A42] rounded-lg transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.moduleBtn}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCalendarProfileId(profile.id)}
                      className="min-h-[36px] w-full inline-flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-semibold text-[#087066] bg-[#EDF9F7] hover:bg-[#D8F2EE] border border-[#BEEAE4] dark:text-[#5EEAD4] dark:bg-[#0A2624] dark:hover:bg-[#103835] dark:border-[#134E4A] rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarCheck2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{t.vaccinationCalendarBtn}</span>
                      </span>
                      {profileVaxCal.autoReminders.length > 0 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FEF7EC] text-[#B45309] border border-[#FCDCA8] dark:bg-[#451A03] dark:text-[#FDE68A] dark:border-[#78350F] tabular-nums">
                          {profileVaxCal.autoReminders.length}{' '}
                          {isAr
                            ? 'تذكير'
                            : profileVaxCal.autoReminders.length > 1
                            ? 'rappels'
                            : 'rappel'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium opacity-80">
                          {isAr ? 'مكتمل' : 'À jour'}
                        </span>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Segment Reassignment Safety Tool */}
          {otherProfiles.length > 0 && (
            <section className="biotemp-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
              <div>
                <h2 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                  <span>{t.reassignTitle}</span>
                </h2>
                <p className="mt-1 text-xs text-[#475B70] dark:text-[#9DB0C6]">
                  {t.reassignDesc} ({activeProfile.name})
                </p>
                {reassignNotice && (
                  <p className="mt-1.5 text-xs font-semibold text-[#087066] dark:text-[#5EEAD4]">
                    {reassignNotice}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  aria-label={isAr ? 'الملف المستلم' : 'Profil destinataire'}
                  value={reassignTargetId || otherProfiles[0]?.id}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-lg"
                >
                  {otherProfiles.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleReassign}
                  className="min-h-[38px] px-4 py-2 text-xs font-semibold text-white bg-[#0F1D32] hover:bg-[#1B2F4D] dark:bg-[#0B8A7E] dark:hover:bg-[#087066] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.transferBtn}
                </button>
              </div>
            </section>
          )}
        </>
      ) : sectionTab === 'settings' ? (
        /* TAB: PARAMÈTRES DE L'APPLICATION */
        <AppSettingsBlock
          language={language}
          tempUnit={tempUnit}
          isDarkMode={isDarkMode}
          nightModePolicy={nightModePolicy}
          sunSchedule={sunSchedule}
          currentTimeLabel={currentTimeLabel}
          simulateNightTime={simulateNightTime}
          profiles={profiles}
          activeProfile={activeProfile}
          alertsEnabled={alertsEnabled}
          soundEnabled={soundEnabled}
          smartPersistenceEnabled={smartPersistenceEnabled}
          persistenceDurationMinutes={persistenceDurationMinutes}
          overrideSilentMode={overrideSilentMode}
          notificationPermission={notificationPermission}
          samplingIntervalMs={samplingIntervalMs}
          patchReminderHours={patchReminderHours}
          reduceMotion={reduceMotion}
          autoConfirmIdentity={autoConfirmIdentity}
          onChangeLanguage={onChangeLanguage}
          onChangeTempUnit={onChangeTempUnit}
          onToggleDarkMode={onToggleDarkMode}
          onChangeNightPolicy={onChangeNightPolicy}
          onUpdateSleepSchedule={onUpdateSleepSchedule}
          onToggleSimulateNightTime={onToggleSimulateNightTime}
          onToggleAlerts={onToggleAlerts}
          onToggleSound={onToggleSound}
          onToggleSmartPersistence={onToggleSmartPersistence}
          onChangePersistenceDuration={onChangePersistenceDuration}
          onToggleOverrideSilentMode={onToggleOverrideSilentMode}
          onRequestNotificationPermission={onRequestNotificationPermission}
          onTestAlert={onTestAlert}
          onChangeSamplingInterval={onChangeSamplingInterval}
          onChangePatchReminderHours={onChangePatchReminderHours}
          onToggleReduceMotion={onToggleReduceMotion}
          onToggleAutoConfirmIdentity={onToggleAutoConfirmIdentity}
          onResetDefaults={onResetSettings}
        />
      ) : (
        /* TAB: SANTÉ GLOBALE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Carnet de vaccinations */}
          <section
            aria-label={isAr ? 'دفتر التطعيمات' : 'Carnet de vaccinations'}
            className="lg:col-span-6 biotemp-card p-5 sm:p-6 space-y-5 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64798F] dark:text-[#7B91A8]">
                  {t.vaccinationsSubtitle}
                </p>
                <h2 className="text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2 mt-0.5">
                  <Syringe className="w-5 h-5 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
                  <span>
                    {t.vaccinationsTitle} — {activeProfile.name}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarProfileId(activeProfile.id)}
                  className="min-h-[32px] inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#087066] bg-[#EDF9F7] hover:bg-[#D8F2EE] border border-[#BEEAE4] dark:text-[#5EEAD4] dark:bg-[#0A2624] dark:hover:bg-[#103835] dark:border-[#134E4A] rounded-lg transition-colors cursor-pointer"
                >
                  <CalendarCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.vaccinationCalendarBtn}</span>
                </button>
                <span className="font-mono text-xs font-semibold text-[#087066] dark:text-[#5EEAD4] tabular-nums">
                  {sortedVaccinations.length}{' '}
                  {sortedVaccinations.length > 1 ? t.vaccinesWord : t.vaccineWord}
                </span>
              </div>
            </div>

            {/* Quick Vaccine Presets */}
            <div className="flex flex-wrap gap-1.5">
              {VACCINE_PRESETS.map((preset) => {
                const label = isAr ? preset.labelAr : preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setVaccineName(label)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#F8FAFC] hover:bg-[#EDF3F7] text-[#475B70] dark:bg-[#09111E] dark:hover:bg-[#122038] dark:text-[#9DB0C6] border border-[#E1E8EE] dark:border-[#1B2A42] transition-colors cursor-pointer"
                  >
                    + {label}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={handleAddVaccineSubmit}
              className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-3"
            >
              <div>
                <label
                  htmlFor="vac-name"
                  className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                >
                  {isAr ? 'اسم اللقاح' : 'Nom du vaccin'}
                </label>
                <input
                  id="vac-name"
                  type="text"
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  placeholder={isAr ? 'مثال: اللقاح السداسي — الجرعة 3' : 'Ex. : Hexavalent — Dose 3'}
                  required
                  className="w-full min-h-[38px] px-3 py-1.5 text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] dark:placeholder:text-[#64798F] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="vac-date"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'تاريخ التطعيم' : "Date d'administration"}
                  </label>
                  <input
                    id="vac-date"
                    type="date"
                    value={administeredDate}
                    onChange={(e) => setAdministeredDate(e.target.value)}
                    required
                    className="w-full min-h-[38px] px-3 py-1.5 font-mono text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="vac-next"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'الجرعة التذكيرية القادمة (اختياري)' : 'Prochain rappel (optionnel)'}
                  </label>
                  <input
                    id="vac-next"
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full min-h-[38px] px-3 py-1.5 font-mono text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  aria-label={isAr ? 'رقم الدفعة أو ملاحظة' : 'Numéro de lot ou remarque'}
                  value={lotOrNote}
                  onChange={(e) => setLotOrNote(e.target.value)}
                  placeholder={isAr ? 'الدفعة، الذراع أو ملاحظة (اختياري)' : 'Lot, bras ou remarque (optionnel)'}
                  className="flex-1 min-h-[38px] px-3 py-1.5 text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] dark:placeholder:text-[#64798F] rounded-lg"
                />
                <button
                  type="submit"
                  className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0B8A7E] hover:bg-[#087066] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>{isAr ? 'حفظ' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>

            <div className="space-y-2.5">
              {sortedVaccinations.length === 0 ? (
                <p className="text-xs text-[#64798F] dark:text-[#7B91A8] py-4 text-center">
                  {isAr
                    ? `لا توجد تطعيمات مسجلة لـ ${activeProfile.name}.`
                    : `Aucune vaccination enregistrée pour ${activeProfile.name}.`}
                </p>
              ) : (
                sortedVaccinations.map((vac) => (
                  <div
                    key={vac.id}
                    className="p-3.5 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                        {vac.vaccineName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
                        <span className="font-mono text-[#087066] dark:text-[#5EEAD4] font-semibold">
                          {isAr ? 'تاريخ التلقي:' : 'Fait le'}{' '}
                          {formatIsoDateFr(vac.administeredDate, language)}
                        </span>
                        {vac.nextDueDate && (
                          <>
                            <span className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                            <span className="font-mono text-[#B45309] dark:text-[#FDE68A] text-[11px] font-semibold">
                              {isAr ? 'التذكير:' : 'Rappel :'}{' '}
                              {formatIsoDateFr(vac.nextDueDate, language)}
                            </span>
                          </>
                        )}
                      </div>
                      {vac.lotOrNote && (
                        <p className="text-xs text-[#475B70] dark:text-[#9DB0C6]">
                          {vac.lotOrNote}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteVaccination(activeProfile.id, vac.id)}
                      aria-label={`${isAr ? 'حذف' : 'Supprimer'} ${vac.vaccineName}`}
                      className="p-1.5 rounded-lg text-[#64798F] hover:text-[#D91E43] hover:bg-[#FEF1F3] dark:text-[#7B91A8] dark:hover:text-[#FDA4AF] dark:hover:bg-[#2A0E17] transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Rappels médicaux non liés à la température */}
          <section
            aria-label={isAr ? 'التذكيرات الطبية غير المرتبطة بالحرارة' : 'Rappels médicaux hors température'}
            className="lg:col-span-6 biotemp-card p-5 sm:p-6 space-y-5 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64798F] dark:text-[#7B91A8]">
                  {t.remindersSubtitle}
                </p>
                <h2 className="text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2 mt-0.5">
                  <CalendarClock className="w-5 h-5 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
                  <span>
                    {t.remindersTitle} — {activeProfile.name}
                  </span>
                </h2>
              </div>
              <span className="font-mono text-xs font-semibold text-[#475B70] dark:text-[#9DB0C6] tabular-nums">
                {pendingRemindersCount} {isAr ? 'قادمة' : 'à venir'}
              </span>
            </div>

            {/* Quick Reminder Presets */}
            <div className="flex flex-wrap gap-1.5">
              {REMINDER_PRESETS.map((preset) => {
                const label = isAr ? preset.titleAr : preset.title;
                return (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => {
                      setReminderTitle(label);
                      setReminderCategory(preset.category);
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#F8FAFC] hover:bg-[#EDF3F7] text-[#475B70] dark:bg-[#09111E] dark:hover:bg-[#122038] dark:text-[#9DB0C6] border border-[#E1E8EE] dark:border-[#1B2A42] transition-colors cursor-pointer"
                  >
                    + {label}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={handleAddReminderSubmit}
              className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rem-title"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'موضوع التذكير' : 'Objet du rappel'}
                  </label>
                  <input
                    id="rem-title"
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: زيارة طبيب الأطفال الشهر 12' : 'Ex. : Visite pédiatre 12e mois'}
                    required
                    className="w-full min-h-[38px] px-3 py-1.5 text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] dark:placeholder:text-[#64798F] rounded-lg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rem-cat"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'الفئة' : 'Catégorie'}
                  </label>
                  <select
                    id="rem-cat"
                    value={reminderCategory}
                    onChange={(e) =>
                      setReminderCategory(e.target.value as HealthReminderCategory)
                    }
                    className="w-full min-h-[38px] px-3 py-1.5 text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] rounded-lg"
                  >
                    {REMINDER_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {isAr ? cat.labelAr : cat.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rem-date"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'التاريخ المحدد' : 'Date prévue'}
                  </label>
                  <input
                    id="rem-date"
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    required
                    className="w-full min-h-[38px] px-3 py-1.5 font-mono text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rem-time"
                    className="block text-xs font-medium text-[#475B70] dark:text-[#9DB0C6] mb-1"
                  >
                    {isAr ? 'الساعة (اختياري)' : 'Heure (optionnelle)'}
                  </label>
                  <input
                    id="rem-time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full min-h-[38px] px-3 py-1.5 font-mono text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  aria-label={isAr ? 'ملاحظة للتذكير الطبي' : 'Note pour le rappel médical'}
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  placeholder={
                    isAr
                      ? 'تفاصيل، اسم الطبيب أو الوصفة (اختياري)'
                      : 'Précision, médecin ou ordonnance (optionnel)'
                  }
                  className="flex-1 min-h-[38px] px-3 py-1.5 text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] dark:placeholder:text-[#64798F] rounded-lg"
                />
                <button
                  type="submit"
                  className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0F1D32] hover:bg-[#1B2F4D] dark:bg-[#0B8A7E] dark:hover:bg-[#087066] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>{isAr ? 'إضافة تذكير' : 'Ajouter rappel'}</span>
                </button>
              </div>
            </form>

            <div className="space-y-2.5">
              {sortedReminders.length === 0 ? (
                <p className="text-xs text-[#64798F] dark:text-[#7B91A8] py-4 text-center">
                  {isAr
                    ? `لا توجد تذكيرات طبية مسجلة لـ ${activeProfile.name}.`
                    : `Aucun rappel médical enregistré pour ${activeProfile.name}.`}
                </p>
              ) : (
                sortedReminders.map((rem) => {
                  const catObj = REMINDER_CATEGORIES.find((c) => c.value === rem.category);
                  const catLabel = isAr && catObj ? catObj.labelAr : rem.category;
                  return (
                    <div
                      key={rem.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                        rem.completed
                          ? 'bg-[#F8FAFC] border-[#E1E8EE] opacity-65 dark:bg-[#09111E] dark:border-[#1B2A42]'
                          : 'bg-white border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleHealthReminder(activeProfile.id, rem.id)}
                          aria-label={
                            rem.completed
                              ? isAr
                                ? `تعيين ${rem.title} كغير مكتمل`
                                : `Marquer ${rem.title} comme à faire`
                              : isAr
                              ? `تعيين ${rem.title} كمكتمل`
                              : `Marquer ${rem.title} comme effectué`
                          }
                          className={`mt-0.5 w-5.5 h-5.5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            rem.completed
                              ? 'bg-[#0B8A7E] border-[#0B8A7E] text-white'
                              : 'bg-white border-[#C2D0DC] hover:border-[#0B8A7E] dark:bg-[#0D1626] dark:border-[#2C456E]'
                          }`}
                        >
                          {rem.completed && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                        </button>

                        <div className="space-y-1 min-w-0">
                          <p
                            className={`text-sm font-bold ${
                              rem.completed
                                ? 'line-through text-[#64798F] dark:text-[#7B91A8]'
                                : 'text-[#0F1D32] dark:text-[#F1F5F9]'
                            }`}
                          >
                            {rem.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
                            <span className="text-[11px] font-semibold text-[#087066] dark:text-[#5EEAD4]">
                              {catLabel}
                            </span>
                            <span className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                            <span className="font-mono text-[#475B70] dark:text-[#9DB0C6]">
                              {formatIsoDateFr(rem.dueDate, language)}
                              {rem.time ? ` · ${rem.time}` : ''}
                            </span>
                          </div>
                          {rem.notes && (
                            <p className="text-xs text-[#475B70] dark:text-[#9DB0C6]">
                              {rem.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteHealthReminder(activeProfile.id, rem.id)}
                        aria-label={`${isAr ? 'حذف' : 'Supprimer'} ${rem.title}`}
                        className="p-1.5 rounded-lg text-[#64798F] hover:text-[#D91E43] hover:bg-[#FEF1F3] dark:text-[#7B91A8] dark:hover:text-[#FDA4AF] dark:hover:bg-[#2A0E17] transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      <VaccinationCalendarModal
        isOpen={calendarProfileId !== null}
        language={language}
        profiles={profiles}
        initialProfileId={calendarProfileId ?? activeProfile.id}
        onClose={() => setCalendarProfileId(null)}
        onUpdateBirthDate={onUpdateBirthDate}
        onAddVaccination={onAddVaccination}
        onAddHealthReminder={onAddHealthReminder}
      />
    </div>
  );
};
