import React, { useEffect, useState } from 'react';
import { Check, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { ChildProfile } from '../types/biotemp';

interface ReplaceDeviceModalProps {
  isOpen: boolean;
  profile: ChildProfile;
  onClose: () => void;
  onConfirmReplace: (
    newDeviceId: string,
    newDeviceName: string,
    newPatchLabel: string
  ) => void;
}

const SUGGESTED_MODULES = ['BT-CORE-04', 'BT-CORE-07', 'BT-CORE-09'];

const PATCH_OPTIONS = [
  'Patch Nourrisson (0–24 mois)',
  'Patch Enfant (2–5 ans)',
  'Patch Confort (+5 ans)',
];

export const ReplaceDeviceModal: React.FC<ReplaceDeviceModalProps> = ({
  isOpen,
  profile,
  onClose,
  onConfirmReplace,
}) => {
  const [deviceId, setDeviceId] = useState('BT-CORE-04');
  const [deviceName, setDeviceName] = useState(profile.deviceName);
  const [patchLabel, setPatchLabel] = useState(profile.patchLabel);

  useEffect(() => {
    if (isOpen) {
      setPatchLabel(profile.patchLabel);
      setDeviceName(profile.deviceName || `Cœur de ${profile.name}`);
      const nextSuggested =
        SUGGESTED_MODULES.find((id) => id !== profile.deviceId) ?? 'BT-CORE-08';
      setDeviceId(nextSuggested);
    }
  }, [isOpen, profile.deviceId, profile.deviceName, profile.name, profile.patchLabel]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = deviceId.trim().toUpperCase();
    if (!cleaned) return;
    const cleanedName = deviceName.trim() || `Cœur de ${profile.name}`;
    onConfirmReplace(cleaned, cleanedName, patchLabel);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2928]/45 dark:bg-[#040914]/70 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-[#0F1E36] border border-[#DCE6E5] dark:border-[#1E3354] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="replace-modal-title"
              className="text-lg font-bold text-[#0F2928] dark:text-[#F1F6FA]"
            >
              Remplacer ou associer un nouveau module
            </h2>
            <p className="mt-1 text-xs text-[#52666A] dark:text-[#8BA3BC]">
              Profil sélectionné :{' '}
              <span className="font-semibold text-[#0F2928] dark:text-[#F1F6FA]">
                {profile.name}
              </span>{' '}
              ({profile.ageLabel})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#52666A] hover:bg-[#F3F7F7] hover:text-[#0F2928] dark:text-[#8BA3BC] dark:hover:bg-[#162947] dark:hover:text-[#F1F6FA] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] dark:bg-[#0D2B2C] dark:border-[#115E59] flex items-start gap-2.5 text-xs text-[#065F46] dark:text-[#5EEAD4]">
          <ShieldCheck
            className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="leading-relaxed">
            <strong>Continuité garantie :</strong> le profil de {profile.name}, ses{' '}
            {profile.readings.length} mesures historiques, ses {profile.notes.length} notes
            médicales et son seuil d&apos;alerte sont conservés et rattachés sans aucune perte au
            nouveau module.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-device-id"
              className="block text-xs font-semibold text-[#354E52] dark:text-[#B0C4D8] mb-1.5"
            >
              Identifiant du nouveau module BioTemp Core (actuel : {profile.deviceId})
            </label>
            <input
              id="new-device-id"
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Ex. : BT-CORE-04"
              className="w-full min-h-[44px] px-3.5 py-2 font-mono text-sm font-semibold text-[#0F2928] bg-[#F8FAFA] border border-[#DCE6E5] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#52666A] dark:text-[#8BA3BC]">
                Détectés à proximité :
              </span>
              {SUGGESTED_MODULES.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDeviceId(id)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-colors cursor-pointer ${
                    deviceId.toUpperCase() === id
                      ? 'bg-[#0F766E] text-white border-[#0F766E] dark:bg-[#0D9488] dark:border-[#0D9488]'
                      : 'bg-[#F3F7F7] text-[#354E52] border-[#DCE6E5] hover:bg-[#E5EFEF] dark:bg-[#162947] dark:text-[#E2ECF5] dark:border-[#243E63] dark:hover:bg-[#1D355B]'
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
              className="block text-xs font-semibold text-[#354E52] dark:text-[#B0C4D8] mb-1.5"
            >
              Nom du module dans le foyer (pour éviter toute confusion)
            </label>
            <input
              id="device-custom-name"
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder={`Ex. : Cœur de ${profile.name}`}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#0F2928] bg-[#F8FAFA] border border-[#DCE6E5] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            />
          </div>

          <div>
            <label
              htmlFor="patch-select"
              className="block text-xs font-semibold text-[#354E52] dark:text-[#B0C4D8] mb-1.5"
            >
              Format de patch médical utilisé
            </label>
            <select
              id="patch-select"
              value={patchLabel}
              onChange={(e) => setPatchLabel(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#0F2928] bg-[#F8FAFA] border border-[#DCE6E5] dark:text-[#F1F6FA] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            >
              {PATCH_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 text-sm font-medium text-[#52666A] hover:text-[#0F2928] dark:text-[#8BA3BC] dark:hover:text-[#F1F6FA] rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!deviceId.trim()}
              className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] disabled:opacity-45 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Associer à {profile.name}</span>
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
