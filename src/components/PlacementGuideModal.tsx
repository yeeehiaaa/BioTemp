import React from 'react';
import { AlertCircle, CheckCircle2, Shield, X } from 'lucide-react';

interface PlacementGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlacementGuideModal: React.FC<PlacementGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="placement-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2928]/45 dark:bg-[#040914]/70 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-[#0F1E36] border border-[#DCE6E5] dark:border-[#1E3354] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-[#E8EFEF] dark:border-[#1E3354] flex items-center justify-between gap-4">
          <div>
            <h2
              id="placement-guide-title"
              className="text-lg font-bold text-[#162642] dark:text-[#F1F6FA]"
            >
              Guide de pose axillaire &amp; sécurité
            </h2>
            <p className="text-xs text-[#647B8C] dark:text-[#8BA3BC]">
              Zone de référence étalonnée, préparation cutanée et précautions d&apos;usage
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le guide de pose"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#52666A] hover:bg-[#F3F7F7] dark:text-[#8BA3BC] dark:hover:bg-[#162947] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Anatomical Placement Illustration */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354]">
            <div className="sm:col-span-5 flex items-center justify-center">
              <svg
                viewBox="0 0 180 180"
                className="w-40 h-40"
                role="img"
                aria-label="Schéma de pose du module BioTemp Core sous l'aisselle"
              >
                {/* Torso & Arm Silhouette */}
                <circle
                  cx="90"
                  cy="34"
                  r="18"
                  className="fill-[#DCE7EC] dark:fill-[#1D355B]"
                />
                <path
                  d="M60 62 C52 64 42 78 36 112 L52 116 L60 88 L60 158 L120 158 L120 88 L128 116 L144 112 C138 78 128 64 120 62 Z"
                  className="fill-[#E6EFF2] stroke-[#B6C8D4] dark:fill-[#162947] dark:stroke-[#2D4A78]"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Forbidden Forehead / Wrist markers */}
                <circle
                  cx="90"
                  cy="30"
                  r="4"
                  className="fill-none stroke-[#E11D48] dark:stroke-[#FB7185]"
                  strokeWidth="1.8"
                  strokeDasharray="2 2"
                />
                <circle
                  cx="42"
                  cy="112"
                  r="4"
                  className="fill-none stroke-[#E11D48] dark:stroke-[#FB7185]"
                  strokeWidth="1.8"
                  strokeDasharray="2 2"
                />

                {/* Correct Axillary Placement Highlight */}
                <circle
                  cx="118"
                  cy="86"
                  r="15"
                  className="fill-[#0D9488]/20 stroke-[#0D9488] dark:fill-[#2DD4BF]/20 dark:stroke-[#2DD4BF]"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                <rect
                  x="111"
                  y="79"
                  width="14"
                  height="14"
                  rx="4"
                  className="fill-[#0D9488] dark:fill-[#2DD4BF]"
                />
                <text
                  x="138"
                  y="89"
                  className="fill-[#0F766E] dark:fill-[#5EEAD4] text-[10px] font-bold"
                >
                  Sous l&apos;aisselle
                </text>
              </svg>
            </div>

            <div className="sm:col-span-7 space-y-2 text-xs text-[#476074] dark:text-[#B0C4D8]">
              <p className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA]">
                Zone de référence : creux de l&apos;aisselle
              </p>
              <p className="leading-relaxed">
                L&apos;algorithme d&apos;étalonnage BioTemp est calibré exclusivement pour la zone axillaire. Une pose sur le front ou le poignet fausserait l&apos;estimation thermique.
              </p>
              <p className="text-[#0F766E] dark:text-[#5EEAD4] font-medium">
                Un court temps de stabilisation de 2 à 3 minutes est normal au début de la pose.
              </p>
            </div>
          </div>

          {/* Pre-pose & Removal Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl border border-[#E6EFF2] dark:border-[#1E3354] space-y-2">
              <h3 className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>Pose &amp; hygiène du patch</span>
              </h3>
              <ul className="space-y-1.5 text-[#476074] dark:text-[#94ACC4] leading-relaxed">
                <li>• Nettoyer et sécher doucement l&apos;aisselle (sans crème, huile ni talc).</li>
                <li>• Utiliser un patch jetable neuf adapté à l&apos;âge, sans jamais le réutiliser.</li>
                <li>• Remplacer le patch toutes les <strong>12 à 24 heures</strong> maximum.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-[#E6EFF2] dark:border-[#1E3354] space-y-2">
              <h3 className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>Retrait doux &amp; sécurité ondes</span>
              </h3>
              <ul className="space-y-1.5 text-[#476074] dark:text-[#94ACC4] leading-relaxed">
                <li>• Retirer le patch lentement dans le sens de la peau, avec de l&apos;eau tiède si besoin.</li>
                <li>• <strong>BLE très basse puissance</strong> : émission intermittente brève, sûre près du nourrisson.</li>
                <li>• Essuyer et sécher les plots magnétiques dorés (Pogo Pins) avant chaque charge.</li>
              </ul>
            </div>
          </div>

          {/* Important Medical Scope Warning */}
          <div className="p-3.5 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] dark:bg-[#2C1C12] dark:border-[#7C2D12] flex items-start gap-2.5 text-xs text-[#9A3412] dark:text-[#FDBA74]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong>Précaution importante :</strong> BioTemp est conçu pour le suivi domestique courant des enfants et adultes. Il n&apos;est pas destiné aux nouveau-nés prématurés ni aux soins critiques hospitaliers, et ne remplace pas un avis médical ou un thermomètre de référence en cas de doute.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#F8FAFA] dark:bg-[#0B172B] border-t border-[#E8EFEF] dark:border-[#1E3354] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-[#162642] hover:bg-[#1E3356] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] rounded-full cursor-pointer"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};
