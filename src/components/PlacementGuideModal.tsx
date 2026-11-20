import React from 'react';
import { AlertCircle, CheckCircle2, Shield, X } from 'lucide-react';
import { AppLanguage } from '../types/biotemp';

interface PlacementGuideModalProps {
  isOpen: boolean;
  language?: AppLanguage;
  onClose: () => void;
}

export const PlacementGuideModal: React.FC<PlacementGuideModalProps> = ({
  isOpen,
  language = 'fr',
  onClose,
}) => {
  if (!isOpen) return null;
  const isAr = language === 'ar';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="placement-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1D32]/45 dark:bg-[#030712]/75 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-[#0D1626] border border-[#E1E8EE] dark:border-[#1B2A42] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-[#E1E8EE] dark:border-[#1B2A42] flex items-center justify-between gap-4">
          <div>
            <h2
              id="placement-guide-title"
              className="text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9]"
            >
              {isAr ? 'دليل التثبيت الإبطي والسلامة' : 'Guide de pose axillaire & sécurité'}
            </h2>
            <p className="text-xs text-[#64798F] dark:text-[#7B91A8]">
              {isAr
                ? 'منطقة القياس المعايرة، تحضير البشرة وإرشادات الاستخدام'
                : "Zone de référence étalonnée, préparation cutanée et précautions d'usage"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق دليل التثبيت' : 'Fermer le guide de pose'}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#475B70] hover:bg-[#F4F7F9] dark:text-[#9DB0C6] dark:hover:bg-[#122038] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Anatomical Placement Illustration */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42]">
            <div className="sm:col-span-5 flex items-center justify-center" dir="ltr">
              <svg
                viewBox="0 0 180 180"
                className="w-40 h-40"
                role="img"
                aria-label={
                  isAr
                    ? 'مخطط وضع وحدة BioTemp Core تحت الإبط'
                    : "Schéma de pose du module BioTemp Core sous l'aisselle"
                }
              >
                {/* Torso & Arm Silhouette */}
                <circle
                  cx="90"
                  cy="34"
                  r="18"
                  className="fill-[#DCE6EE] dark:fill-[#1B2A42]"
                />
                <path
                  d="M60 62 C52 64 42 78 36 112 L52 116 L60 88 L60 158 L120 158 L120 88 L128 116 L144 112 C138 78 128 64 120 62 Z"
                  className="fill-[#E6EFF4] stroke-[#B6C8D4] dark:fill-[#122038] dark:stroke-[#2D4A78]"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Forbidden Forehead / Wrist markers */}
                <circle
                  cx="90"
                  cy="30"
                  r="4"
                  className="fill-none stroke-[#D91E43] dark:stroke-[#FB7185]"
                  strokeWidth="1.8"
                  strokeDasharray="2 2"
                />
                <circle
                  cx="42"
                  cy="112"
                  r="4"
                  className="fill-none stroke-[#D91E43] dark:stroke-[#FB7185]"
                  strokeWidth="1.8"
                  strokeDasharray="2 2"
                />

                {/* Correct Axillary Placement Highlight */}
                <circle
                  cx="118"
                  cy="86"
                  r="15"
                  className="fill-[#0B8A7E]/20 stroke-[#0B8A7E] dark:fill-[#2DD4BF]/20 dark:stroke-[#2DD4BF]"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                <rect
                  x="111"
                  y="79"
                  width="14"
                  height="14"
                  rx="4"
                  className="fill-[#0B8A7E] dark:fill-[#2DD4BF]"
                />
                <text
                  x="138"
                  y="89"
                  className="fill-[#087066] dark:fill-[#5EEAD4] text-[10px] font-bold"
                >
                  {isAr ? 'تحت الإبط' : "Sous l'aisselle"}
                </text>
              </svg>
            </div>

            <div className="sm:col-span-7 space-y-2 text-xs text-[#475B70] dark:text-[#9DB0C6]">
              <p className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                {isAr ? 'منطقة المرجع: تجويف الإبط' : "Zone de référence : creux de l'aisselle"}
              </p>
              <p className="leading-relaxed">
                {isAr
                  ? 'خوارزمية المعايرة في BioTemp مضبوطة حصرياً لمنطقة الإبط. وضعه على الجبين أو المعصم يؤدي إلى قراءة غير دقيقة.'
                  : "L'algorithme d'étalonnage BioTemp est calibré exclusivement pour la zone axillaire. Une pose sur le front ou le poignet fausserait l'estimation thermique."}
              </p>
              <p className="text-[#087066] dark:text-[#5EEAD4] font-medium">
                {isAr
                  ? 'فترة استقرار قصيرة بين دقيقتين و3 دقائق طبيعية في بداية التثبيت.'
                  : 'Un court temps de stabilisation de 2 à 3 minutes est normal au début de la pose.'}
              </p>
            </div>
          </div>

          {/* Pre-pose & Removal Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#E1E8EE] dark:border-[#1B2A42] space-y-2">
              <h3 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>{isAr ? 'التثبيت ونظافة اللاصقة' : 'Pose & hygiène du patch'}</span>
              </h3>
              <ul className="space-y-1.5 text-[#475B70] dark:text-[#9DB0C6] leading-relaxed">
                {isAr ? (
                  <>
                    <li>• نظّف وجفّف الإبط بلطف (دون كريم أو زيت أو بودرة).</li>
                    <li>• استعمل لاصقة جديدة مناسبة للعمر دون إعادة استخدامها أبداً.</li>
                    <li>
                      • استبدل اللاصقة كل <strong>12 إلى 24 ساعة</strong> كحد أقصى.
                    </li>
                  </>
                ) : (
                  <>
                    <li>• Nettoyer et sécher doucement l&apos;aisselle (sans crème, huile ni talc).</li>
                    <li>• Utiliser un patch jetable neuf adapté à l&apos;âge, sans jamais le réutiliser.</li>
                    <li>
                      • Remplacer le patch toutes les <strong>12 à 24 heures</strong> maximum.
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-[#E1E8EE] dark:border-[#1B2A42] space-y-2">
              <h3 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>{isAr ? 'النزع اللطيف وسلامة الموجات' : 'Retrait doux & sécurité ondes'}</span>
              </h3>
              <ul className="space-y-1.5 text-[#475B70] dark:text-[#9DB0C6] leading-relaxed">
                {isAr ? (
                  <>
                    <li>• انزع اللاصقة ببطء في اتجاه الجلد مع ماء فاتر عند اللزوم.</li>
                    <li>
                      • <strong>بلوتوث منخفض الطاقة (BLE)</strong>: إرسال وجيز متقطع وآمن قرب الرضيع.
                    </li>
                    <li>• امسح وجفّف نقاط التلامس الذهبية (Pogo Pins) قبل كل شحن.</li>
                  </>
                ) : (
                  <>
                    <li>• Retirer le patch lentement dans le sens de la peau, avec de l&apos;eau tiède si besoin.</li>
                    <li>
                      • <strong>BLE très basse puissance</strong> : émission intermittente brève, sûre près du nourrisson.
                    </li>
                    <li>• Essuyer et sécher les plots magnétiques dorés (Pogo Pins) avant chaque charge.</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Important Medical Scope Warning */}
          <div className="p-3.5 rounded-xl bg-[#FEF7EC] border border-[#FCDCA8] dark:bg-[#261909] dark:border-[#78350F] flex items-start gap-2.5 text-xs text-[#B45309] dark:text-[#FDE68A]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              {isAr ? (
                <>
                  <strong>تنبيه هام :</strong> صُمم BioTemp للمتابعة المنزلية اليومية للأطفال والبالغين. لا يُخصص للخدّج أو الرعاية المركزة بالمستشفيات، ولا يغني عن الاستشارة الطبية أو ميزان الحرارة المرجعي عند الشك.
                </>
              ) : (
                <>
                  <strong>Précaution importante :</strong> BioTemp est conçu pour le suivi domestique courant des enfants et adultes. Il n&apos;est pas destiné aux nouveau-nés prématurés ni aux soins critiques hospitaliers, et ne remplace pas un avis médical ou un thermomètre de référence en cas de doute.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#F8FAFC] dark:bg-[#09111E] border-t border-[#E1E8EE] dark:border-[#1B2A42] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-[#0F1D32] hover:bg-[#1B2F4D] dark:bg-[#0B8A7E] dark:hover:bg-[#087066] rounded-lg transition-colors cursor-pointer"
          >
            {isAr ? 'تم الفهم' : 'Compris'}
          </button>
        </div>
      </div>
    </div>
  );
};
