import React, { useState } from 'react';
import {
  ArrowRightLeft,
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
import { AppSettingsBlock } from './AppSettingsBlock';

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
    deviceId: string;
    deviceName: string;
    threshold: number;
  }) => void;
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

const VACCINE_PRESETS = [
  'Hexavalent (DTP-Coq-Hib-HepB)',
  'Pneumocoque (PCV)',
  'ROR (Rougeole-Oreillons-Rubéole)',
  'Méningocoque',
  'Grippe saisonnière',
];

const REMINDER_CATEGORIES: HealthReminderCategory[] = [
  'Pédiatre / Médecin',
  'Bilan / Analyses',
  'Traitement / Vitamines',
  'Dentaire / Ophtalmo',
  'Autre',
];

const REMINDER_PRESETS: Array<{ title: string; category: HealthReminderCategory }> = [
  { title: 'Visite pédiatre de contrôle', category: 'Pédiatre / Médecin' },
  { title: 'Vitamine D quotidienne', category: 'Traitement / Vitamines' },
  { title: 'Contrôle dentaire annuel', category: 'Dentaire / Ophtalmo' },
  { title: 'Bilan sanguin / analyses', category: 'Bilan / Analyses' },
];

function formatIsoDateFr(isoDate: string): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
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
  const t = getStrings(language).profilePage;
  const unitSuffix = tempUnitLabel(tempUnit);
  const [sectionTab, setSectionTab] = useState<ProfileSectionTab>('profiles');
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [ageCategory, setAgeCategory] = useState<AgeCategory>('infant');
  const [deviceId, setDeviceId] = useState('BT-CORE-05');
  const [deviceName, setDeviceName] = useState('');
  const [threshold, setThreshold] = useState('38.0');

  const todayIso = new Date().toISOString().slice(0, 10);

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
      deviceId: cleanedDevice,
      deviceName: deviceName.trim() || `Cœur de ${cleanedName}`,
      threshold: Number(threshold) || 38.0,
    });
    setName('');
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
        `Les mesures des 30 dernières minutes ont été transférées de ${activeProfile.name} vers ${targetProfile.name}.`
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
    <div className="space-y-6">
      {/* Header + Sub-tabs */}
      <section className="biotemp-card p-5 sm:p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#647B8C] dark:text-[#8BA3BC]">
              {t.subtitle}
            </p>
            <h1 className="text-xl font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-2 mt-0.5">
              {sectionTab === 'profiles' ? (
                <Users className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
              ) : sectionTab === 'global_health' ? (
                <HeartPulse className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
              ) : (
                <SlidersHorizontal
                  className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF]"
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
            <p className="mt-1 text-xs text-[#526675] dark:text-[#94ACC4] leading-relaxed flex flex-wrap items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
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
                className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#162642] hover:bg-[#1E3356] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] rounded-full transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{t.newProfile}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReport}
              className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] dark:text-[#5EEAD4] dark:bg-[#0D2B2C] dark:hover:bg-[#12383A] dark:border-[#134E4A] rounded-full transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>{t.doctorSummary}</span>
            </button>
          </div>
        </div>

        {/* Section Tabs: Profils & Modules | Santé Globale | Paramètres */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#EDF3F5] dark:border-[#1E3354]">
          <div
            role="tablist"
            aria-label="Sous-sections du profil"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F3F7F9] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-2xl self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={sectionTab === 'profiles'}
              onClick={() => setSectionTab('profiles')}
              className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                sectionTab === 'profiles'
                  ? 'bg-[#162642] text-white dark:bg-[#0D9488]'
                  : 'text-[#647B8C] dark:text-[#8BA3BC] hover:text-[#162642] dark:hover:text-[#F1F6FA]'
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
              className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                sectionTab === 'global_health'
                  ? 'bg-[#162642] text-white dark:bg-[#0D9488]'
                  : 'text-[#647B8C] dark:text-[#8BA3BC] hover:text-[#162642] dark:hover:text-[#F1F6FA]'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.tabGlobalHealth}</span>
              {pendingRemindersCount > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                    sectionTab === 'global_health'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#0D9488] text-white'
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
              className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                sectionTab === 'settings'
                  ? 'bg-[#162642] text-white dark:bg-[#0D9488]'
                  : 'text-[#647B8C] dark:text-[#8BA3BC] hover:text-[#162642] dark:hover:text-[#F1F6FA]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.tabSettings}</span>
            </button>
          </div>

          {sectionTab === 'global_health' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#647B8C] dark:text-[#8BA3BC] mr-1">
                {t.journalFor}
              </span>
              {profiles.map((p) => {
                const isSelected = p.id === activeProfile.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectProfile(p.id)}
                    className={`min-h-[32px] px-3 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#115E59]'
                        : 'bg-white text-[#476074] border-[#DCE6EA] hover:bg-[#F3F7F9] dark:bg-[#0B172B] dark:text-[#94ACC4] dark:border-[#1E3354]'
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
              aria-label="Créer un nouveau profil"
            >
              <h2 className="text-base font-bold text-[#162642] dark:text-[#F1F6FA]">
                Ajouter un profil enfant ou adulte
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label
                    htmlFor="new-prof-name"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Prénom
                  </label>
                  <input
                    id="new-prof-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex. : Adam"
                    required
                    className="w-full min-h-[42px] px-3 py-2 text-sm text-[#162642] bg-[#F7FAFB] border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] dark:placeholder:text-[#6B849E] rounded-xl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-prof-age"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Tranche d&apos;âge &amp; Patch
                  </label>
                  <select
                    id="new-prof-age"
                    value={ageCategory}
                    onChange={(e) => {
                      const nextAge = e.target.value as AgeCategory;
                      setAgeCategory(nextAge);
                      setThreshold(String(getRecommendedThresholdForAge(nextAge)));
                    }}
                    className="w-full min-h-[42px] px-3 py-2 text-sm text-[#162642] bg-[#F7FAFB] border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-xl"
                  >
                    <option value="newborn">Nouveau-né (&lt; 3 mois)</option>
                    <option value="infant">Nourrisson (3–24 mois)</option>
                    <option value="child">Enfant (2–5 ans)</option>
                    <option value="adult">Adulte (+5 ans)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-prof-device"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Module BioTemp Core
                  </label>
                  <input
                    id="new-prof-device"
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="BT-CORE-05"
                    required
                    className="w-full min-h-[42px] px-3 py-2 font-mono text-sm text-[#162642] bg-[#F7FAFB] border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-xl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-prof-devname"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Nom du module
                  </label>
                  <input
                    id="new-prof-devname"
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Ex. : Cœur d'Adam"
                    className="w-full min-h-[42px] px-3 py-2 text-sm text-[#162642] bg-[#F7FAFB] border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] dark:placeholder:text-[#6B849E] rounded-xl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-prof-thresh"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    {t.alertThreshold} ({unitSuffix})
                  </label>
                  <select
                    id="new-prof-thresh"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 font-mono text-sm text-[#162642] bg-[#F7FAFB] border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-xl"
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
                  className="min-h-[40px] px-4 py-2 text-xs font-medium text-[#647B8C] dark:text-[#94ACC4] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-full cursor-pointer"
                >
                  Créer le profil
                </button>
              </div>
            </form>
          )}

          {/* Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfile.id;
              const isVerified = Boolean(identityConfirmedIds[profile.id]);
              const latest = profile.readings[profile.readings.length - 1];

              return (
                <article
                  key={profile.id}
                  className={`biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all ${
                    isActive ? 'ring-2 ring-[#0D9488] dark:ring-[#2DD4BF]' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isActive
                              ? 'bg-[#162642] text-white dark:bg-[#0D9488]'
                              : 'bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#115E59]'
                          }`}
                        >
                          {profile.initials}
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[#162642] dark:text-[#F1F6FA]">
                            {profile.name}
                          </h2>
                          <p className="text-xs text-[#647B8C] dark:text-[#8BA3BC]">
                            {profile.ageLabel}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-base font-bold text-[#162642] dark:text-[#F1F6FA] tabular-nums">
                        {latest
                          ? `${formatTempFr(latest.value, tempUnit, language)} ${unitSuffix}`
                          : '—'}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#EDF3F5] dark:border-[#1E3354] space-y-2 text-xs text-[#476074] dark:text-[#94ACC4] tabular-nums">
                      <div className="flex justify-between">
                        <span>{t.namedModule}</span>
                        <span className="font-semibold text-[#162642] dark:text-[#E2ECF5]">
                          {profile.deviceName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.hardwareId}</span>
                        <span className="font-mono font-bold text-[#0D9488] dark:text-[#5EEAD4]">
                          {profile.deviceId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.medicalPatch}</span>
                        <span className="font-medium text-[#162642] dark:text-[#E2ECF5]">
                          {profile.patchLabel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.alertThreshold}</span>
                        <span className="font-mono font-semibold text-[#162642] dark:text-[#E2ECF5]">
                          {formatTempFr(profile.threshold, tempUnit, language)} {unitSuffix}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.recordedHistory}</span>
                        <span className="font-mono text-[#162642] dark:text-[#E2ECF5]">
                          {profile.readings.length} {t.readingsWord} · {profile.notes.length}{' '}
                          {t.notesWord}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.globalHealthLabel}</span>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProfile(profile.id);
                            setSectionTab('global_health');
                          }}
                          className="font-semibold text-[#0D9488] dark:text-[#2DD4BF] hover:underline cursor-pointer"
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
                        className="min-h-[40px] w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#9A3412] bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FED7AA] dark:text-[#FDBA74] dark:bg-[#2C1C12] dark:hover:bg-[#3A2416] dark:border-[#7C2D12] rounded-full transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {t.confirmIdentity} {profile.name}
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#0D9488] dark:text-[#2DD4BF] py-1">
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        <span>{t.identityVerified}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectProfile(profile.id)}
                        className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#0D9488] text-white'
                            : 'bg-[#162642] text-white hover:bg-[#1E3356] dark:bg-[#1B3358] dark:hover:bg-[#23406E]'
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
                        className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#162642] bg-[#F3F7F9] hover:bg-[#E4EDF2] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] rounded-full transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.moduleBtn}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Segment Reassignment Safety Tool */}
          {otherProfiles.length > 0 && (
            <section className="biotemp-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
              <div>
                <h2 className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                  <span>{t.reassignTitle}</span>
                </h2>
                <p className="mt-1 text-xs text-[#526675] dark:text-[#94ACC4]">
                  {t.reassignDesc} ({activeProfile.name})
                </p>
                {reassignNotice && (
                  <p className="mt-1.5 text-xs font-semibold text-[#0F766E] dark:text-[#5EEAD4]">
                    {reassignNotice}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  aria-label="Profil destinataire"
                  value={reassignTargetId || otherProfiles[0]?.id}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-[#162642] bg-[#F3F7F9] border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-full"
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
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#162642] hover:bg-[#1E3356] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] rounded-full transition-colors cursor-pointer"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Carnet de vaccinations */}
          <section
            aria-label="Carnet de vaccinations"
            className="lg:col-span-6 biotemp-card p-5 sm:p-6 space-y-5 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#647B8C] dark:text-[#8BA3BC]">
                  Suivi vaccinal
                </p>
                <h2 className="text-lg font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
                  <span>Vaccinations — {activeProfile.name}</span>
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#115E59] text-xs font-semibold tabular-nums">
                {sortedVaccinations.length} vaccin{sortedVaccinations.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Quick Vaccine Presets */}
            <div className="flex flex-wrap gap-1.5">
              {VACCINE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setVaccineName(preset)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#F3F7F9] hover:bg-[#E4EDF2] text-[#476074] dark:bg-[#0B172B] dark:hover:bg-[#162947] dark:text-[#94ACC4] border border-[#E2ECF0] dark:border-[#1E3354] transition-colors cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleAddVaccineSubmit}
              className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] space-y-3"
            >
              <div>
                <label
                  htmlFor="vac-name"
                  className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                >
                  Nom du vaccin
                </label>
                <input
                  id="vac-name"
                  type="text"
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  placeholder="Ex. : Hexavalent — Dose 3"
                  required
                  className="w-full min-h-[40px] px-3 py-2 text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] dark:placeholder:text-[#6B849E] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="vac-date"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Date d&apos;administration
                  </label>
                  <input
                    id="vac-date"
                    type="date"
                    value={administeredDate}
                    onChange={(e) => setAdministeredDate(e.target.value)}
                    required
                    className="w-full min-h-[40px] px-3 py-2 font-mono text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="vac-next"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Prochain rappel (optionnel)
                  </label>
                  <input
                    id="vac-next"
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 font-mono text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  aria-label="Numéro de lot ou remarque"
                  value={lotOrNote}
                  onChange={(e) => setLotOrNote(e.target.value)}
                  placeholder="Lot, bras ou remarque (optionnel)"
                  className="flex-1 min-h-[40px] px-3 py-2 text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] dark:placeholder:text-[#6B849E] rounded-xl"
                />
                <button
                  type="submit"
                  className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>

            <div className="space-y-2.5">
              {sortedVaccinations.length === 0 ? (
                <p className="text-xs text-[#647B8C] dark:text-[#8BA3BC] py-4 text-center">
                  Aucune vaccination enregistrée pour {activeProfile.name}.
                </p>
              ) : (
                sortedVaccinations.map((vac) => (
                  <div
                    key={vac.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA]">
                        {vac.vaccineName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
                        <span className="font-mono text-[#0F766E] dark:text-[#5EEAD4] font-semibold">
                          Fait le {formatIsoDateFr(vac.administeredDate)}
                        </span>
                        {vac.nextDueDate && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] dark:bg-[#2C1C12] dark:text-[#FDBA74] dark:border-[#7C2D12] text-[11px] font-medium">
                            Rappel : {formatIsoDateFr(vac.nextDueDate)}
                          </span>
                        )}
                      </div>
                      {vac.lotOrNote && (
                        <p className="text-xs text-[#526675] dark:text-[#94ACC4]">
                          {vac.lotOrNote}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteVaccination(activeProfile.id, vac.id)}
                      aria-label={`Supprimer ${vac.vaccineName}`}
                      className="p-1.5 rounded-lg text-[#647B8C] hover:text-[#E11D48] hover:bg-[#FFF1F2] dark:text-[#8BA3BC] dark:hover:text-[#FDA4AF] dark:hover:bg-[#2F1320] transition-colors cursor-pointer shrink-0"
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
            aria-label="Rappels médicaux hors température"
            className="lg:col-span-6 biotemp-card p-5 sm:p-6 space-y-5 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#647B8C] dark:text-[#8BA3BC]">
                  Rendez-vous &amp; traitements hors température
                </p>
                <h2 className="text-lg font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
                  <span>Rappels médicaux — {activeProfile.name}</span>
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F3F7F9] text-[#162642] border border-[#DCE6EA] dark:bg-[#162947] dark:text-[#E2ECF5] dark:border-[#243E63] text-xs font-semibold tabular-nums">
                {pendingRemindersCount} à venir
              </span>
            </div>

            {/* Quick Reminder Presets */}
            <div className="flex flex-wrap gap-1.5">
              {REMINDER_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    setReminderTitle(preset.title);
                    setReminderCategory(preset.category);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#F3F7F9] hover:bg-[#E4EDF2] text-[#476074] dark:bg-[#0B172B] dark:hover:bg-[#162947] dark:text-[#94ACC4] border border-[#E2ECF0] dark:border-[#1E3354] transition-colors cursor-pointer"
                >
                  + {preset.title}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleAddReminderSubmit}
              className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rem-title"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Objet du rappel
                  </label>
                  <input
                    id="rem-title"
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="Ex. : Visite pédiatre 12e mois"
                    required
                    className="w-full min-h-[40px] px-3 py-2 text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] dark:placeholder:text-[#6B849E] rounded-xl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rem-cat"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Catégorie
                  </label>
                  <select
                    id="rem-cat"
                    value={reminderCategory}
                    onChange={(e) =>
                      setReminderCategory(e.target.value as HealthReminderCategory)
                    }
                    className="w-full min-h-[40px] px-3 py-2 text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] rounded-xl"
                  >
                    {REMINDER_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rem-date"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Date prévue
                  </label>
                  <input
                    id="rem-date"
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    required
                    className="w-full min-h-[40px] px-3 py-2 font-mono text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rem-time"
                    className="block text-xs font-medium text-[#476074] dark:text-[#94ACC4] mb-1"
                  >
                    Heure (optionnelle)
                  </label>
                  <input
                    id="rem-time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 font-mono text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  aria-label="Note pour le rappel médical"
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  placeholder="Précision, médecin ou ordonnance (optionnel)"
                  className="flex-1 min-h-[40px] px-3 py-2 text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#0F1E36] dark:border-[#1E3354] dark:placeholder:text-[#6B849E] rounded-xl"
                />
                <button
                  type="submit"
                  className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#162642] hover:bg-[#1E3356] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Ajouter rappel</span>
                </button>
              </div>
            </form>

            <div className="space-y-2.5">
              {sortedReminders.length === 0 ? (
                <p className="text-xs text-[#647B8C] dark:text-[#8BA3BC] py-4 text-center">
                  Aucun rappel médical enregistré pour {activeProfile.name}.
                </p>
              ) : (
                sortedReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 transition-colors ${
                      rem.completed
                        ? 'bg-[#F8FAFA] border-[#E6EFF2] opacity-70 dark:bg-[#0A1424] dark:border-[#1A2D4A]'
                        : 'bg-white border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleHealthReminder(activeProfile.id, rem.id)}
                        aria-label={
                          rem.completed
                            ? `Marquer ${rem.title} comme à faire`
                            : `Marquer ${rem.title} comme effectué`
                        }
                        className={`mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          rem.completed
                            ? 'bg-[#0D9488] border-[#0D9488] text-white'
                            : 'bg-white border-[#C5D5DD] hover:border-[#0D9488] dark:bg-[#0F1E36] dark:border-[#2E4B73]'
                        }`}
                      >
                        {rem.completed && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            rem.completed
                              ? 'line-through text-[#647B8C] dark:text-[#8BA3BC]'
                              : 'text-[#162642] dark:text-[#F1F6FA]'
                          }`}
                        >
                          {rem.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
                          <span className="px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#115E59] text-[11px] font-semibold">
                            {rem.category}
                          </span>
                          <span className="font-mono text-[#354E52] dark:text-[#B0C4D8]">
                            {formatIsoDateFr(rem.dueDate)}
                            {rem.time ? ` · ${rem.time}` : ''}
                          </span>
                        </div>
                        {rem.notes && (
                          <p className="text-xs text-[#526675] dark:text-[#94ACC4]">
                            {rem.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteHealthReminder(activeProfile.id, rem.id)}
                      aria-label={`Supprimer ${rem.title}`}
                      className="p-1.5 rounded-lg text-[#647B8C] hover:text-[#E11D48] hover:bg-[#FFF1F2] dark:text-[#8BA3BC] dark:hover:text-[#FDA4AF] dark:hover:bg-[#2F1320] transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
