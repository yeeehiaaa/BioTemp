import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { AppLanguage, ChildProfile, TemperatureUnit } from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import { formatTempFr, getTemperatureStatus, tempUnitLabel } from '../utils/temperature';

interface ProfileBarProps {
  language: AppLanguage;
  tempUnit?: TemperatureUnit;
  profiles: ChildProfile[];
  activeProfile: ChildProfile;
  identityConfirmed: boolean;
  onSelectProfile: (profileId: string) => void;
  onConfirmIdentity: () => void;
}

export const ProfileBar: React.FC<ProfileBarProps> = ({
  language,
  tempUnit = 'C',
  profiles,
  activeProfile,
  identityConfirmed,
  onSelectProfile,
  onConfirmIdentity,
}) => {
  const t = getStrings(language).profileBar;
  const unitLabel = tempUnitLabel(tempUnit);

  return (
    <section
      aria-label="Sélecteur de profil"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div
        className="inline-flex items-center gap-1.5 p-1 bg-white dark:bg-[#0D1626] border border-[#E1E8EE] dark:border-[#1B2A42] rounded-xl overflow-x-auto max-w-full shadow-[0_1px_2px_rgba(15,29,50,0.03)]"
        role="tablist"
        aria-label="Profils suivis"
      >
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfile.id;
          const latest = profile.readings[profile.readings.length - 1];
          const isStandby = profile.connectionMode === 'standby_removed';
          const status = latest
            ? getTemperatureStatus(latest.value, profile.threshold)
            : 'normal';

          const tempToneClass = isActive
            ? status === 'high_fever'
              ? 'text-[#FCA5A5] dark:text-[#FECDD3]'
              : status === 'elevated'
              ? 'text-[#FDE68A]'
              : 'text-[#5EEAD4] dark:text-[#CCFBF1]'
            : status === 'high_fever'
            ? 'text-[#D91E43] dark:text-[#FDA4AF]'
            : status === 'elevated'
            ? 'text-[#C26B08] dark:text-[#FCD34D]'
            : 'text-[#0B8A7E] dark:text-[#2DD4BF]';

          return (
            <button
              key={profile.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectProfile(profile.id)}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-start transition-all flex items-center gap-2.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E] ${
                isActive
                  ? 'bg-[#0F1D32] text-white dark:bg-[#0B8A7E] dark:text-white shadow-xs'
                  : 'text-[#0F1D32] hover:bg-[#F4F7F9] dark:text-[#E2ECF5] dark:hover:bg-[#132036]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-[#EDF9F7] text-[#0B8A7E] dark:bg-[#132036] dark:text-[#2DD4BF]'
                }`}
              >
                {profile.initials}
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">
                {profile.name}
              </span>
              <span
                className={`font-mono text-xs font-bold tabular-nums whitespace-nowrap ${tempToneClass}`}
              >
                {isStandby
                  ? language === 'ar'
                    ? 'سكون'
                    : 'Veille'
                  : latest
                  ? `${formatTempFr(latest.value, tempUnit, language)}${unitLabel}`
                  : '—'}
              </span>
            </button>
          );
        })}
      </div>

      {!identityConfirmed ? (
        <button
          type="button"
          onClick={onConfirmIdentity}
          className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#9A3412] bg-[#FEF7EC] hover:bg-[#FDECD2] border border-[#FCDCA8] dark:text-[#FCD34D] dark:bg-[#261909] dark:hover:bg-[#33210C] dark:border-[#78350F] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {t.confirmPrefix} {activeProfile.name}
          </span>
        </button>
      ) : (
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#64798F] dark:text-[#8DA2B9] whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
          <span>
            {activeProfile.name} · {activeProfile.deviceName} ·{' '}
            <span className="font-mono">{activeProfile.deviceId}</span>
          </span>
        </div>
      )}
    </section>
  );
};
