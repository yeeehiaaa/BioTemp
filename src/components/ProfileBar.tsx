import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { AppLanguage, ChildProfile } from '../types/biotemp';
import { getStrings } from '../utils/i18n';

interface ProfileBarProps {
  language: AppLanguage;
  profiles: ChildProfile[];
  activeProfile: ChildProfile;
  identityConfirmed: boolean;
  onSelectProfile: (profileId: string) => void;
  onConfirmIdentity: () => void;
}

export const ProfileBar: React.FC<ProfileBarProps> = ({
  language,
  profiles,
  activeProfile,
  identityConfirmed,
  onSelectProfile,
  onConfirmIdentity,
}) => {
  const t = getStrings(language).profileBar;

  return (
    <section
      aria-label="Sélecteur de profil"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0"
        role="tablist"
        aria-label="Profils suivis"
      >
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfile.id;
          return (
            <button
              key={profile.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectProfile(profile.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-left transition-all flex items-center gap-2.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                isActive
                  ? 'bg-[#162642] text-white dark:bg-[#0D9488] dark:text-white shadow-[0_8px_18px_-10px_rgba(22,38,66,0.45)]'
                  : 'bg-white/90 text-[#162642] border border-[#E2ECF0] hover:bg-[#F3F7F9] dark:bg-[#0F1E36] dark:text-[#E2ECF5] dark:border-[#1E3354] dark:hover:bg-[#162947]'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isActive
                    ? 'bg-[#0D9488] dark:bg-[#0B172B] text-white'
                    : 'bg-[#F0FDFA] text-[#0D9488] dark:bg-[#162947] dark:text-[#5EEAD4]'
                }`}
              >
                {profile.initials}
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">
                {profile.name}
              </span>
            </button>
          );
        })}
      </div>

      {!identityConfirmed ? (
        <button
          type="button"
          onClick={onConfirmIdentity}
          className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#9A3412] bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FED7AA] dark:text-[#FDBA74] dark:bg-[#2C1C12] dark:hover:bg-[#3A2416] dark:border-[#7C2D12] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {t.confirmPrefix} {activeProfile.name}
          </span>
        </button>
      ) : (
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#647B8C] dark:text-[#8BA3BC] whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
          <span>
            {activeProfile.name} · {activeProfile.deviceName}
          </span>
        </div>
      )}
    </section>
  );
};

