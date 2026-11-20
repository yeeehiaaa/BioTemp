import React, { useState } from 'react';
import {
  BatteryCharging,
  BookOpen,
  Clock,
  Droplets,
  Lock,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { PatchReminderHours } from '../types/biotemp';
import { formatTimeFr } from '../utils/temperature';

interface HardwareSpecsSectionProps {
  activeDeviceId: string;
  activeDeviceName: string;
  activePatchLabel: string;
  patchAppliedAt: number;
  lastConnectedAt: number;
  patchReminderHours: PatchReminderHours;
  onResetPatchTimer: () => void;
  onOpenPlacementGuide: () => void;
  onOpenReplaceDevice: () => void;
}

export const HardwareSpecsSection: React.FC<HardwareSpecsSectionProps> = ({
  activeDeviceId,
  activeDeviceName,
  activePatchLabel,
  patchAppliedAt,
  lastConnectedAt,
  patchReminderHours,
  onResetPatchTimer,
  onOpenPlacementGuide,
  onOpenReplaceDevice,
}) => {
  const [imageError, setImageError] = useState(false);

  const hoursWorn = Math.max(
    0,
    Math.floor((Date.now() - patchAppliedAt) / (60 * 60 * 1000))
  );
  const patchNeedsChange = hoursWorn >= patchReminderHours;

  return (
    <section
      id="materiel"
      aria-label="Matériel BioTemp Core et patchs médicaux"
      className="biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors"
    >
      <div className="rounded-2xl overflow-hidden bg-[#EFF4F6] border border-[#E2ECF0] dark:bg-[#0B172B] dark:border-[#1E3354] h-44 flex items-center justify-center">
        {!imageError ? (
          <img
            src="/src/assets/images/biotemp_core_sensor_1795105770698.jpg"
            alt="Module électronique réutilisable BioTemp Core avec recharge magnétique Pogo Pins et patch médical jetable"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover dark:brightness-90"
          />
        ) : (
          <div className="p-4 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-white border border-[#DCE7EC] dark:bg-[#132544] dark:border-[#243E63] mx-auto flex items-center justify-center text-[#0D9488] dark:text-[#2DD4BF]">
              <Shield className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA]">
              Module BioTemp Core IP67
            </p>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-mono font-semibold text-[#0D9488] dark:text-[#5EEAD4]">
          {activeDeviceName} · {activeDeviceId}
        </p>
        <h2 className="mt-0.5 text-base font-bold text-[#162642] dark:text-[#F1F6FA]">
          BioTemp Core &amp; Patchs médicaux
        </h2>
        <p className="mt-1.5 text-xs text-[#526675] dark:text-[#94ACC4] leading-relaxed">
          Fixation axillaire confortable avec {activePatchLabel}. Dernière connexion enregistrée à{' '}
          <span className="font-mono font-semibold text-[#162642] dark:text-[#F1F6FA]">
            {formatTimeFr(lastConnectedAt)}
          </span>
          .
        </p>
      </div>

      {/* Patch Wear Timer */}
      <div
        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
          patchNeedsChange
            ? 'bg-[#FFF7ED] border-[#FED7AA] text-[#9A3412] dark:bg-[#2C1C12] dark:border-[#7C2D12] dark:text-[#FDBA74]'
            : 'bg-[#F7FAFB] border-[#E6EFF2] text-[#476074] dark:bg-[#0B172B] dark:border-[#1E3354] dark:text-[#B0C4D8]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">
              Patch posé depuis {hoursWorn} h (limite : {patchReminderHours} h)
            </p>
            <p className="text-[11px] opacity-85">
              {patchNeedsChange
                ? 'Pensez à remplacer le patch pour préserver la peau.'
                : 'Adhésif hypoallergénique à usage unique.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetPatchTimer}
          className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-[#162947] border border-[#DCE7EC] dark:border-[#243E63] rounded-full text-[#162642] dark:text-[#F1F6FA] whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" aria-hidden="true" />
          <span>Nouveau patch</span>
        </button>
      </div>

      <div className="space-y-2 pt-2 border-t border-[#EDF3F5] dark:border-[#1E3354] text-xs">
        <div className="flex items-center gap-2.5 text-[#162642] dark:text-[#E2ECF5]">
          <Droplets className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span>
            <strong>Étanche IP67</strong> · Boîtier fermé sans petite pièce détachable
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-[#162642] dark:text-[#E2ECF5]">
          <BatteryCharging className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span>
            <strong>Pogo Pins plaqués or</strong> · Essuyer/sécher avant charge (compatible Power Bank)
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-[#162642] dark:text-[#E2ECF5]">
          <Lock className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span>
            <strong>Local-First</strong> · Données enregistrées localement sans compte obligatoire
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenPlacementGuide}
          className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] dark:text-[#5EEAD4] dark:bg-[#0D2B2C] dark:hover:bg-[#12383A] dark:border-[#134E4A] rounded-full transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Guide de pose &amp; sécurité</span>
        </button>

        <button
          type="button"
          onClick={onOpenReplaceDevice}
          className="min-h-[42px] px-4 py-2 text-xs font-semibold text-[#162642] bg-[#F3F7F9] hover:bg-[#E4EDF2] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] rounded-full transition-colors cursor-pointer"
        >
          Associer un autre module
        </button>
      </div>
    </section>
  );
};
