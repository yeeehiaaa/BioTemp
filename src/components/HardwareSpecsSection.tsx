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
import { AppLanguage, PatchReminderHours } from '../types/biotemp';
import { formatTimeFr } from '../utils/temperature';

interface HardwareSpecsSectionProps {
  language?: AppLanguage;
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
  language = 'fr',
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
  const isAr = language === 'ar';
  const [imageError, setImageError] = useState(false);

  const hoursWorn = Math.max(
    0,
    Math.floor((Date.now() - patchAppliedAt) / (60 * 60 * 1000))
  );
  const patchNeedsChange = hoursWorn >= patchReminderHours;
  const wearPercent = Math.min(100, Math.round((hoursWorn / Math.max(patchReminderHours, 1)) * 100));

  return (
    <section
      id="materiel"
      aria-label={isAr ? 'وحدة BioTemp Core واللاصقات الطبية' : 'Matériel BioTemp Core et patchs médicaux'}
      className="biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors"
    >
      <div className="rounded-xl overflow-hidden bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] h-44 flex items-center justify-center">
        {!imageError ? (
          <img
            src="/src/assets/images/biotemp_core_sensor_1795105770698.jpg"
            alt={
              isAr
                ? 'وحدة BioTemp Core القابلة لإعادة الاستخدام مع الشحن المغناطيسي Pogo Pins واللاصقة الطبية'
                : 'Module électronique réutilisable BioTemp Core avec recharge magnétique Pogo Pins et patch médical jetable'
            }
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover dark:brightness-90"
          />
        ) : (
          <div className="p-4 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E1E8EE] dark:bg-[#132036] dark:border-[#1E304D] mx-auto flex items-center justify-center text-[#0B8A7E] dark:text-[#2DD4BF]">
              <Shield className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
              {isAr ? 'وحدة BioTemp Core مقاومة للماء IP67' : 'Module BioTemp Core IP67'}
            </p>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-mono font-semibold text-[#0B8A7E] dark:text-[#2DD4BF]">
          {activeDeviceName} · {activeDeviceId}
        </p>
        <h2 className="mt-0.5 text-base font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
          {isAr ? 'وحدة BioTemp Core واللاصقات الطبية' : 'BioTemp Core & Patchs médicaux'}
        </h2>
        <p className="mt-1.5 text-xs text-[#475B70] dark:text-[#9DB0C6] leading-relaxed">
          {isAr ? (
            <>
              تثبيت مريح تحت الإبط باستخدام {activePatchLabel}. آخر اتصال مسجل في{' '}
              <span className="font-mono font-semibold text-[#0F1D32] dark:text-[#F1F5F9]">
                {formatTimeFr(lastConnectedAt, language)}
              </span>
              .
            </>
          ) : (
            <>
              Fixation axillaire confortable avec {activePatchLabel}. Dernière connexion enregistrée à{' '}
              <span className="font-mono font-semibold text-[#0F1D32] dark:text-[#F1F5F9]">
                {formatTimeFr(lastConnectedAt, language)}
              </span>
              .
            </>
          )}
        </p>
      </div>

      {/* Patch Wear Timer with Visual Progress Bar */}
      <div
        className={`p-3.5 rounded-xl border space-y-2.5 text-xs ${
          patchNeedsChange
            ? 'bg-[#FEF7EC] border-[#FCDCA8] text-[#9A3412] dark:bg-[#261909] dark:border-[#78350F] dark:text-[#FCD34D]'
            : 'bg-[#F8FAFC] border-[#E1E8EE] text-[#475B70] dark:bg-[#09111E] dark:border-[#1B2A42] dark:text-[#9DB0C6]'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-bold truncate tabular-nums">
                {isAr
                  ? `اللاصقة موضوعة منذ ${hoursWorn} س / ${patchReminderHours} س`
                  : `Patch posé depuis ${hoursWorn} h / ${patchReminderHours} h`}
              </p>
              <p className="text-[11px] opacity-85">
                {patchNeedsChange
                  ? isAr
                    ? 'يُفضل استبدال اللاصقة للحفاظ على راحة الجلد.'
                    : 'Pensez à remplacer le patch pour préserver la peau.'
                  : isAr
                  ? 'لاصقة مضادة للحساسية للاستعمال الواحد.'
                  : 'Adhésif hypoallergénique à usage unique.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResetPatchTimer}
            className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-[#132036] border border-[#E1E8EE] dark:border-[#1E304D] rounded-lg text-[#0F1D32] dark:text-[#F1F5F9] whitespace-nowrap cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>{isAr ? 'لاصقة جديدة' : 'Nouveau patch'}</span>
          </button>
        </div>

        <div className="h-1.5 w-full rounded-full bg-[#E1E8EE] dark:bg-[#1B2A42] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              patchNeedsChange ? 'bg-[#D97706]' : 'bg-[#0B8A7E] dark:bg-[#2DD4BF]'
            }`}
            style={{ width: `${wearPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-[#E1E8EE] dark:border-[#1B2A42] text-xs">
        <div className="flex items-center gap-2.5 text-[#0F1D32] dark:text-[#E2ECF5]">
          <Droplets className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span>
            {isAr ? (
              <>
                <strong>مقاوم للماء IP67</strong> · هيكل محكم بدون قطع صغيرة قابلة للفصل
              </>
            ) : (
              <>
                <strong>Étanche IP67</strong> · Boîtier fermé sans petite pièce détachable
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-[#0F1D32] dark:text-[#E2ECF5]">
          <BatteryCharging className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span>
            {isAr ? (
              <>
                <strong>نقاط ذهبية Pogo Pins</strong> · تُجفف قبل الشحن (متوافق مع Power Bank)
              </>
            ) : (
              <>
                <strong>Pogo Pins plaqués or</strong> · Essuyer/sécher avant charge (compatible Power Bank)
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-[#0F1D32] dark:text-[#E2ECF5]">
          <Lock className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span>
            {isAr ? (
              <>
                <strong>محلي أولاً (Local-First)</strong> · حفظ البيانات محلياً دون حساب إجباري
              </>
            ) : (
              <>
                <strong>Local-First</strong> · Données enregistrées localement sans compte obligatoire
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenPlacementGuide}
          className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#087066] bg-[#EDF9F7] hover:bg-[#DFF3F0] border border-[#BEEAE4] dark:text-[#5EEAD4] dark:bg-[#0A2624] dark:hover:bg-[#113936] dark:border-[#134E4A] rounded-xl transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{isAr ? 'دليل التثبيت والسلامة' : 'Guide de pose & sécurité'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenReplaceDevice}
          className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EFF4F8] border border-[#E1E8EE] dark:text-[#E2ECF5] dark:bg-[#132036] dark:hover:bg-[#192A46] dark:border-[#1E304D] rounded-xl transition-colors cursor-pointer"
        >
          {isAr ? 'ربط وحدة أخرى' : 'Associer un autre module'}
        </button>
      </div>
    </section>
  );
};
