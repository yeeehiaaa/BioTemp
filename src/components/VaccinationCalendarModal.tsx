import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BellPlus,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Syringe,
  X,
} from 'lucide-react';
import { AppLanguage, ChildProfile, HealthReminderCategory } from '../types/biotemp';
import {
  buildProfileVaccinationCalendar,
  EvaluatedVaccineMilestone,
  MilestoneGroup,
} from '../utils/vaccinationSchedule';

interface VaccinationCalendarModalProps {
  isOpen: boolean;
  language: AppLanguage;
  profiles: ChildProfile[];
  initialProfileId: string;
  onClose: () => void;
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
}

type CalendarFilter = 'all' | 'actionable' | 'completed';

function formatIsoDateLocalized(isoDate: string, lang: AppLanguage): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const VaccinationCalendarModal: React.FC<VaccinationCalendarModalProps> = ({
  isOpen,
  language,
  profiles,
  initialProfileId,
  onClose,
  onUpdateBirthDate,
  onAddVaccination,
  onAddHealthReminder,
}) => {
  const isAr = language === 'ar';
  const [selectedProfileId, setSelectedProfileId] = useState(initialProfileId);
  const [filter, setFilter] = useState<CalendarFilter>('all');

  useEffect(() => {
    if (isOpen) {
      setSelectedProfileId(initialProfileId);
      setFilter('all');
    }
  }, [isOpen, initialProfileId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) ?? profiles[0],
    [profiles, selectedProfileId]
  );

  const calendar = useMemo(
    () => buildProfileVaccinationCalendar(selectedProfile, language),
    [selectedProfile, language]
  );

  const perProfileAlertCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of profiles) {
      const cal = buildProfileVaccinationCalendar(p, language);
      map[p.id] = cal.autoReminders.length;
    }
    return map;
  }, [profiles, language]);

  if (!isOpen || !selectedProfile) return null;

  const todayIso = new Date().toISOString().slice(0, 10);

  const handleMarkCompleted = (ms: EvaluatedVaccineMilestone) => {
    const label = isAr
      ? `${ms.vaccineAr} — ${ms.doseAr}`
      : `${ms.vaccineFr} — ${ms.doseFr}`;
    onAddVaccination(selectedProfile.id, {
      vaccineName: label,
      administeredDate: todayIso,
      lotOrNote: isAr
        ? `مسجل من جدول التطعيمات التلقائي (${ms.ageBadgeAr})`
        : `Validé depuis le calendrier vaccinal (${ms.ageBadgeFr})`,
    });
  };

  const handleScheduleReminder = (ms: EvaluatedVaccineMilestone) => {
    const title = isAr
      ? `${ms.vaccineAr} — ${ms.doseAr}`
      : `${ms.vaccineFr} — ${ms.doseFr}`;
    const note = isAr
      ? `تذكير تلقائي حسب العمر (${ms.ageBadgeAr}) · ${ms.noteAr}`
      : `Rappel automatique basé sur l'âge (${ms.ageBadgeFr}) · ${ms.noteFr}`;
    onAddHealthReminder(selectedProfile.id, {
      title,
      dueDate: ms.dueDateIso < todayIso ? todayIso : ms.dueDateIso,
      category: 'Pédiatre / Médecin',
      notes: note,
    });
  };

  const filteredMilestones = calendar.milestones.filter((m) => {
    if (filter === 'actionable') {
      return m.status === 'overdue' || m.status === 'due_soon' || m.status === 'upcoming';
    }
    if (filter === 'completed') {
      return m.status === 'completed';
    }
    return true;
  });

  const groups: Array<{ key: MilestoneGroup; titleFr: string; titleAr: string }> = [
    { key: 'infant', titleFr: 'Nourrisson (0 – 18 mois)', titleAr: 'الرضّع (0 – 18 شهراً)' },
    { key: 'childhood', titleFr: 'Enfance & Adolescence (6 – 14 ans)', titleAr: 'الطفولة والمراهقة (6 – 14 سنة)' },
    { key: 'adult', titleFr: 'Âge adulte & Rappels saisonniers', titleAr: 'البالغون والتذكيرات الموسمية' },
  ];

  const statusMeta = (ms: EvaluatedVaccineMilestone) => {
    switch (ms.status) {
      case 'completed':
        return {
          label: isAr ? 'مكتمل' : 'Effectué',
          badgeClass:
            'bg-[#EDF9F7] text-[#087066] border-[#BEEAE4] dark:bg-[#0A2624] dark:text-[#5EEAD4] dark:border-[#134E4A]',
          cardClass:
            'bg-white border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42]',
        };
      case 'overdue':
        return {
          label: isAr ? 'متأخر · للمراجعة' : 'À rattraper / vérifier',
          badgeClass:
            'bg-[#FEF1F3] text-[#BE123C] border-[#FCCAD3] dark:bg-[#2A0E17] dark:text-[#FDA4AF] dark:border-[#881337]',
          cardClass:
            'bg-[#FEF1F3]/45 border-[#FCCAD3] dark:bg-[#2A0E17]/40 dark:border-[#881337]',
        };
      case 'due_soon':
        return {
          label: isAr ? 'موعد قريب (تلقائي)' : 'Rappel imminent',
          badgeClass:
            'bg-[#FEF7EC] text-[#B45309] border-[#FCDCA8] dark:bg-[#261909] dark:text-[#FDE68A] dark:border-[#78350F]',
          cardClass:
            'bg-[#FEF7EC]/60 border-[#FCDCA8] dark:bg-[#261909]/40 dark:border-[#78350F]',
        };
      case 'archived':
        return {
          label: isAr ? 'مرحلة سابقة' : 'Tranche antérieure',
          badgeClass:
            'bg-[#F8FAFC] text-[#64798F] border-[#E1E8EE] dark:bg-[#0D1626] dark:text-[#7B91A8] dark:border-[#1B2A42]',
          cardClass:
            'bg-[#F8FAFC]/70 border-[#E1E8EE] opacity-75 dark:bg-[#09111E]/60 dark:border-[#1B2A42]',
        };
      case 'upcoming':
      default:
        return {
          label: isAr ? 'قادم حسب العمر' : 'À venir selon l’âge',
          badgeClass:
            'bg-[#EEF5FF] text-[#1D4ED8] border-[#C7DDFF] dark:bg-[#0F203B] dark:text-[#93C5FD] dark:border-[#1E3A6E]',
          cardClass:
            'bg-white border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42]',
        };
    }
  };

  const formatCountdown = (days: number) => {
    if (days === 0) return isAr ? 'اليوم' : "Aujourd'hui";
    if (days > 0) {
      if (days >= 365) {
        const yrs = Math.round(days / 365);
        return isAr ? `بعد ~${yrs} سنة` : `Dans ~${yrs} an${yrs > 1 ? 's' : ''}`;
      }
      return isAr ? `بعد ${days} يوماً` : `Dans ${days} j`;
    }
    const ago = Math.abs(days);
    return isAr ? `منذ ${ago} يوماً` : `Il y a ${ago} j`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vax-calendar-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0F1D32]/50 dark:bg-[#030712]/80 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#0D1626] border border-[#E1E8EE] dark:border-[#1B2A42] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E1E8EE] dark:border-[#1B2A42] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A] flex items-center justify-center text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0">
              <CalendarCheck2 className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="vax-calendar-modal-title"
                className="text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9]"
              >
                {isAr
                  ? `الجدول التلقيحي الكامل — ${selectedProfile.name}`
                  : `Calendrier vaccinal complet — ${selectedProfile.name}`}
              </h2>
              <p className="text-xs text-[#64798F] dark:text-[#7B91A8] mt-0.5">
                {isAr
                  ? 'جدول التطعيمات الموصى به مع تذكيرات تلقائية محسوبة حسب العمر الفعلي للملف.'
                  : 'Suivi vaccinal complet avec rappels automatiques calculés selon l’âge du profil.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق الجدول التلقيحي' : 'Fermer le calendrier vaccinal'}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#475B70] hover:bg-[#F4F7F9] hover:text-[#0F1D32] dark:text-[#9DB0C6] dark:hover:bg-[#122038] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Profile Switcher Bar + Birthdate Calibration */}
        <div className="px-5 sm:px-6 py-3 bg-[#F8FAFC] dark:bg-[#09111E] border-b border-[#E1E8EE] dark:border-[#1B2A42] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {profiles.map((p) => {
              const active = p.id === selectedProfile.id;
              const autoCount = perProfileAlertCounts[p.id] ?? 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`min-h-[34px] inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                      : 'bg-white text-[#475B70] border-[#E1E8EE] hover:bg-[#EDF3F7] dark:bg-[#0D1626] dark:text-[#9DB0C6] dark:border-[#1B2A42] dark:hover:bg-[#122038]'
                  }`}
                >
                  <span>{p.name}</span>
                  {autoCount > 0 && (
                    <span
                      className={`min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded text-[10px] font-mono font-bold tabular-nums ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-[#FEF7EC] text-[#B45309] dark:bg-[#451A03] dark:text-[#FDE68A]'
                      }`}
                    >
                      {autoCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#475B70] dark:text-[#9DB0C6] font-medium">
              {isAr ? 'العمر المحسوب:' : 'Âge calculé :'}{' '}
              <strong className="font-mono text-[#0F1D32] dark:text-[#F1F5F9]">
                {calendar.ageDisplay}
              </strong>
              {calendar.isEstimatedBirthDate && (
                <span className="text-[11px] text-[#64798F] dark:text-[#7B91A8] ms-1">
                  ({isAr ? 'تقديري' : 'estimé'})
                </span>
              )}
            </span>

            <label
              htmlFor="vax-birthdate-input"
              className="text-[11px] text-[#64798F] dark:text-[#7B91A8] ms-1"
            >
              {isAr ? 'تاريخ الميلاد:' : 'Né(e) le :'}
            </label>
            <input
              id="vax-birthdate-input"
              type="date"
              max={todayIso}
              value={calendar.effectiveBirthDate}
              onChange={(e) => {
                if (e.target.value) {
                  onUpdateBirthDate(selectedProfile.id, e.target.value);
                }
              }}
              className="min-h-[32px] px-2.5 py-1 font-mono text-xs bg-white text-[#0F1D32] border border-[#E1E8EE] dark:bg-[#0D1626] dark:text-[#F1F5F9] dark:border-[#1B2A42] rounded-lg"
            />
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A]">
              <p className="text-[11px] font-semibold text-[#087066] dark:text-[#5EEAD4]">
                {isAr ? 'تطعيمات مكتملة' : 'Vaccins validés'}
              </p>
              <p className="font-mono text-xl font-bold text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums mt-0.5">
                {calendar.completedCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#FEF7EC] border border-[#FCDCA8] dark:bg-[#261909] dark:border-[#78350F]">
              <p className="text-[11px] font-semibold text-[#B45309] dark:text-[#FDE68A]">
                {isAr ? 'تذكيرات تلقائية قريبة' : 'Rappels imminents'}
              </p>
              <p className="font-mono text-xl font-bold text-[#B45309] dark:text-[#FDE68A] tabular-nums mt-0.5">
                {calendar.dueSoonCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#FEF1F3] border border-[#FCCAD3] dark:bg-[#2A0E17] dark:border-[#881337]">
              <p className="text-[11px] font-semibold text-[#BE123C] dark:text-[#FDA4AF]">
                {isAr ? 'للمراجعة / الاستدراك' : 'À vérifier / rattraper'}
              </p>
              <p className="font-mono text-xl font-bold text-[#BE123C] dark:text-[#FDA4AF] tabular-nums mt-0.5">
                {calendar.overdueCount}
              </p>
            </div>
          </div>

          {/* Automatic Age-Based Reminders Section */}
          <section
            aria-label={
              isAr ? 'التذكيرات التلقائية حسب العمر' : "Rappels automatiques basés sur l'âge"
            }
            className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2">
                <CalendarClock
                  className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? `تذكيرات تلقائية حسب عمر ${selectedProfile.name} (${calendar.ageDisplay})`
                    : `Rappels automatiques selon l’âge de ${selectedProfile.name} (${calendar.ageDisplay})`}
                </span>
              </h3>
              <span className="text-[11px] font-mono font-semibold text-[#64798F] dark:text-[#7B91A8] tabular-nums">
                {calendar.autoReminders.length}{' '}
                {isAr ? 'توصية' : calendar.autoReminders.length > 1 ? 'rappels' : 'rappel'}
              </span>
            </div>

            {calendar.autoReminders.length === 0 ? (
              <div className="flex items-center gap-2 text-xs font-medium text-[#087066] dark:text-[#5EEAD4] py-1">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'جميع التطعيمات الموصى بها لهذه المرحلة العمرية مكتملة أو مجدولة.'
                    : 'Aucun rappel vaccinal imminent ou en retard pour cette tranche d’âge.'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {calendar.autoReminders.map((ms) => {
                  const isOverdue = ms.status === 'overdue';
                  return (
                    <div
                      key={`auto-${ms.id}`}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                        isOverdue
                          ? 'bg-[#FEF1F3] border-[#FCCAD3] dark:bg-[#2A0E17]/70 dark:border-[#881337]'
                          : 'bg-[#FEF7EC] border-[#FCDCA8] dark:bg-[#261909]/70 dark:border-[#78350F]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {isOverdue ? (
                          <AlertCircle
                            className="w-4 h-4 text-[#D91E43] dark:text-[#FDA4AF] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <Clock
                            className="w-4 h-4 text-[#D97706] dark:text-[#FDE68A] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                            {isAr
                              ? `${ms.vaccineAr} · ${ms.doseAr}`
                              : `${ms.vaccineFr} · ${ms.doseFr}`}
                          </p>
                          <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] mt-0.5 tabular-nums">
                            {isAr ? 'العمر المستهدف:' : 'Âge cible :'}{' '}
                            <strong>{isAr ? ms.ageBadgeAr : ms.ageBadgeFr}</strong> ·{' '}
                            <span className="font-mono">
                              {formatIsoDateLocalized(ms.dueDateIso, language)}
                            </span>{' '}
                            ({formatCountdown(ms.daysUntilDue)})
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {ms.alreadyInReminders ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#087066] dark:text-[#5EEAD4]">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isAr ? 'مضاف للتذكيرات' : 'Dans vos rappels'}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleScheduleReminder(ms)}
                            className="min-h-[32px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-[#EDF3F7] text-[#0F1D32] border border-[#E1E8EE] dark:bg-[#0D1626] dark:hover:bg-[#132036] dark:text-[#F1F5F9] dark:border-[#1E304D] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <BellPlus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isAr ? 'جدولة تذكير' : 'Ajouter aux rappels'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(ms)}
                          className="min-h-[32px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#0B8A7E] hover:bg-[#087066] text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{isAr ? 'تحديد كمكتمل' : 'Marquer fait'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Filter Tabs for Full Calendar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2">
              <Syringe
                className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]"
                aria-hidden="true"
              />
              <span>
                {isAr ? 'الجدول التلقيحي حسب المرحلة العمرية' : 'Calendrier par étape d’âge'}
              </span>
            </h3>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42]">
              {(
                [
                  { id: 'all', fr: 'Tout voir', ar: 'الكل' },
                  { id: 'actionable', fr: 'À prévoir', ar: 'المطلوبة' },
                  { id: 'completed', fr: 'Effectués', ar: 'المكتملة' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                    filter === tab.id
                      ? 'bg-[#0F1D32] text-white dark:bg-[#0B8A7E]'
                      : 'text-[#64798F] hover:text-[#0F1D32] dark:text-[#7B91A8] dark:hover:text-[#F1F5F9]'
                  }`}
                >
                  {isAr ? tab.ar : tab.fr}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Timeline */}
          <div className="space-y-5">
            {groups.map((grp) => {
              const items = filteredMilestones.filter((m) => m.group === grp.key);
              if (items.length === 0) return null;

              return (
                <div key={grp.key} className="space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64798F] dark:text-[#7B91A8]">
                    {isAr ? grp.titleAr : grp.titleFr}
                  </h4>

                  <div className="space-y-2">
                    {items.map((ms) => {
                      const st = statusMeta(ms);
                      return (
                        <div
                          key={ms.id}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${st.cardClass}`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="min-w-[74px] px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#0D1626] dark:border-[#1B2A42] text-center font-mono text-[11px] font-bold text-[#0F1D32] dark:text-[#F1F5F9] shrink-0">
                              {isAr ? ms.ageBadgeAr : ms.ageBadgeFr}
                            </span>

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs sm:text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                                  {isAr ? ms.vaccineAr : ms.vaccineFr}
                                </p>
                                <span className="text-[11px] font-semibold text-[#087066] dark:text-[#5EEAD4]">
                                  · {isAr ? ms.doseAr : ms.doseFr}
                                </span>
                                {ms.mandatory && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EEF5FF] text-[#1D4ED8] dark:bg-[#0F203B] dark:text-[#93C5FD]">
                                    {isAr ? 'أساسي' : 'Requis'}
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-[#475B70] dark:text-[#9DB0C6] leading-relaxed">
                                {isAr ? ms.noteAr : ms.noteFr}
                              </p>

                              {ms.matchedRecord ? (
                                <p className="text-[11px] font-mono font-semibold text-[#087066] dark:text-[#5EEAD4] tabular-nums">
                                  {isAr ? 'تم التلقي في' : 'Administré le'}{' '}
                                  {formatIsoDateLocalized(ms.matchedRecord.administeredDate, language)}
                                  {ms.matchedRecord.lotOrNote ? ` · ${ms.matchedRecord.lotOrNote}` : ''}
                                </p>
                              ) : (
                                <p className="text-[11px] font-mono text-[#64798F] dark:text-[#7B91A8] tabular-nums">
                                  {isAr ? 'الموعد المستهدف:' : 'Date théorique :'}{' '}
                                  {formatIsoDateLocalized(ms.dueDateIso, language)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                            <span
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border whitespace-nowrap ${st.badgeClass}`}
                            >
                              {st.label}
                            </span>

                            {ms.status !== 'completed' && ms.status !== 'archived' && (
                              <>
                                {!ms.alreadyInReminders && (
                                  <button
                                    type="button"
                                    onClick={() => handleScheduleReminder(ms)}
                                    title={isAr ? 'إضافة إلى التذكيرات الطبية' : 'Ajouter aux rappels médicaux'}
                                    className="min-h-[30px] px-2 py-1 text-[11px] font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EDF3F7] border border-[#E1E8EE] dark:text-[#E2E8F0] dark:bg-[#0D1626] dark:hover:bg-[#132036] dark:border-[#1B2A42] rounded-lg transition-colors cursor-pointer"
                                  >
                                    {isAr ? '+ تذكير' : '+ Rappel'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleMarkCompleted(ms)}
                                  className="min-h-[30px] px-2.5 py-1 text-[11px] font-semibold text-white bg-[#0B8A7E] hover:bg-[#087066] rounded-lg transition-colors cursor-pointer"
                                >
                                  {isAr ? 'تم' : 'Fait'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#F8FAFC] dark:bg-[#09111E] border-t border-[#E1E8EE] dark:border-[#1B2A42] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-[#64798F] dark:text-[#7B91A8]">
          <span>
            {isAr
              ? 'مرجع استرشادي يعتمد على العمر؛ يُرجى التأكيد دائماً مع طبيب الأطفال أو الطبيب المعالج.'
              : 'Calendrier indicatif basé sur l’âge ; à valider avec votre pédiatre ou médecin traitant.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] px-4 py-1.5 text-xs font-semibold text-white bg-[#0F1D32] hover:bg-[#1B2F4D] dark:bg-[#0B8A7E] dark:hover:bg-[#087066] rounded-lg transition-colors cursor-pointer self-end sm:self-auto"
          >
            {isAr ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
