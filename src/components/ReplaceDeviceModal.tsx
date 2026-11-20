import React, { useEffect, useState } from 'react';
import { Check, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { AppLanguage, ChildProfile } from '../types/biotemp';

interface ReplaceDeviceModalProps {
  isOpen: boolean;
  language?: AppLanguage;
  profile: ChildProfile;
  onClose: () => void;
  onConfirmReplace: (
    newDeviceId: string,
    newDeviceName: string,
    newPatchLabel: string
  ) => void;
}

const SUGGESTED_MODULES = ['BT-CORE-04', 'BT-CORE-07', 'BT-CORE-09'];

const PATCH_OPTIONS: Array<{ value: string; labelAr: string }> = [
  { value: 'Patch Nourrisson (0–24 mois)', labelAr: 'لاصقة الرضّع (0–24 شهراً)' },
  { value: 'Patch Enfant (2–5 ans)', labelAr: 'لاصقة الأطفال (2–5 سنوات)' },
  { value: 'Patch Confort (+5 ans)', labelAr: 'لاصقة مريحة (+5 سنوات)' },
];

export const ReplaceDeviceModal: React.FC<ReplaceDeviceModalProps> = ({
  isOpen,
  language = 'fr',
  profile,
  onClose,
  onConfirmReplace,
}) => {
  const isAr = language === 'ar';
  const [deviceId, setDeviceId] = useState('BT-CORE-04');
  const [deviceName, setDeviceName] = useState(profile.deviceName);
  const [patchLabel, setPatchLabel] = useState(profile.patchLabel);

  useEffect(() => {
    if (isOpen) {
      setPatchLabel(profile.patchLabel);
      setDeviceName(
        profile.deviceName || (isAr ? `وحدة ${profile.name}` : `Cœur de ${profile.name}`)
      );
      const nextSuggested =
        SUGGESTED_MODULES.find((id) => id !== profile.deviceId) ?? 'BT-CORE-08';
      setDeviceId(nextSuggested);
    }
  }, [isOpen, profile.deviceId, profile.deviceName, profile.name, profile.patchLabel, isAr]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = deviceId.trim().toUpperCase();
    if (!cleaned) return;
    const cleanedName =
      deviceName.trim() || (isAr ? `وحدة ${profile.name}` : `Cœur de ${profile.name}`);
    onConfirmReplace(cleaned, cleanedName, patchLabel);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1D32]/45 dark:bg-[#030712]/75 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-[#0D1626] border border-[#E1E8EE] dark:border-[#1B2A42] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="replace-modal-title"
              className="text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9]"
            >
              {isAr ? 'استبدال أو ربط وحدة جديدة' : 'Remplacer ou associer un nouveau module'}
            </h2>
            <p className="mt-1 text-xs text-[#64798F] dark:text-[#7B91A8]">
              {isAr ? 'الملف المحدد:' : 'Profil sélectionné :'}{' '}
              <span className="font-semibold text-[#0F1D32] dark:text-[#F1F5F9]">
                {profile.name}
              </span>{' '}
              ({profile.ageLabel})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق النافذة' : 'Fermer la fenêtre'}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#475B70] hover:bg-[#F4F7F9] hover:text-[#0F1D32] dark:text-[#9DB0C6] dark:hover:bg-[#122038] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A] flex items-start gap-2.5 text-xs text-[#087066] dark:text-[#5EEAD4]">
          <ShieldCheck
            className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="leading-relaxed">
            {isAr ? (
              <>
                <strong>استمرارية مضمونة :</strong> يتم الاحتفاظ بملف {profile.name}، وجميع
                القراءات التاريخية ({profile.readings.length})، والملاحظات الطبية (
                {profile.notes.length}) وعتبة التنبيه دون أي فقدان عند الربط بالوحدة الجديدة.
              </>
            ) : (
              <>
                <strong>Continuité garantie :</strong> le profil de {profile.name}, ses{' '}
                {profile.readings.length} mesures historiques, ses {profile.notes.length} notes
                médicales et son seuil d&apos;alerte sont conservés et rattachés sans aucune perte au
                nouveau module.
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-device-id"
              className="block text-xs font-semibold text-[#475B70] dark:text-[#9DB0C6] mb-1.5"
            >
              {isAr
                ? `معرّف وحدة BioTemp Core الجديدة (الحالي: ${profile.deviceId})`
                : `Identifiant du nouveau module BioTemp Core (actuel : ${profile.deviceId})`}
            </label>
            <input
              id="new-device-id"
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="BT-CORE-04"
              className="w-full min-h-[42px] px-3.5 py-2 font-mono text-sm font-semibold text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E]"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#64798F] dark:text-[#7B91A8]">
                {isAr ? 'وحدات مرصودة قريباً:' : 'Détectés à proximité :'}
              </span>
              {SUGGESTED_MODULES.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDeviceId(id)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-colors cursor-pointer ${
                    deviceId.toUpperCase() === id
                      ? 'bg-[#0B8A7E] text-white border-[#0B8A7E]'
                      : 'bg-[#F8FAFC] text-[#475B70] border-[#E1E8EE] hover:bg-[#EDF3F7] dark:bg-[#09111E] dark:text-[#9DB0C6] dark:border-[#1B2A42] dark:hover:bg-[#122038]'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="device-custom-name"
              className="block text-xs font-semibold text-[#475B70] dark:text-[#9DB0C6] mb-1.5"
            >
              {isAr
                ? 'اسم الوحدة في المنزل (لتفادي الخلط)'
                : 'Nom du module dans le foyer (pour éviter toute confusion)'}
            </label>
            <input
              id="device-custom-name"
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder={isAr ? `مثال: وحدة ${profile.name}` : `Ex. : Cœur de ${profile.name}`}
              className="w-full min-h-[42px] px-3.5 py-2 text-sm text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E]"
            />
          </div>

          <div>
            <label
              htmlFor="patch-select"
              className="block text-xs font-semibold text-[#475B70] dark:text-[#9DB0C6] mb-1.5"
            >
              {isAr ? 'مقاس اللاصقة الطبية المستخدمة' : 'Format de patch médical utilisé'}
            </label>
            <select
              id="patch-select"
              value={patchLabel}
              onChange={(e) => setPatchLabel(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 text-sm text-[#0F1D32] bg-[#F8FAFC] border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B8A7E]"
            >
              {PATCH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isAr ? opt.labelAr : opt.value}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-sm font-medium text-[#64798F] hover:text-[#0F1D32] dark:text-[#7B91A8] dark:hover:text-[#F1F5F9] rounded-lg cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={!deviceId.trim()}
              className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0B8A7E] hover:bg-[#087066] disabled:opacity-45 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? `ربط بـ ${profile.name}` : `Associer à ${profile.name}`}</span>
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
