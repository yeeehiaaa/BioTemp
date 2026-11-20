import React, { useEffect, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  BatteryLow,
  BellRing,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplets,
  FileText,
  Lightbulb,
  PauseCircle,
  Pill,
  RefreshCw,
  ShieldCheck,
  Volume2,
  WifiOff,
  X,
} from 'lucide-react';
import { AppLanguage, ChildProfile, NotePresetCategory, TemperatureUnit } from '../types/biotemp';
import { NotificationPermissionState } from '../utils/notifications';
import { formatTempFr, getTemperatureStatus, tempUnitLabel } from '../utils/temperature';
import { AppPage } from './BottomBar';

export interface ProTipItem {
  id: string;
  priority: 'urgent' | 'recommended' | 'info';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

interface ProTipsOverlayProps {
  isOpen: boolean;
  profile: ChildProfile;
  language?: AppLanguage;
  tempUnit?: TemperatureUnit;
  identityConfirmed: boolean;
  soundEnabled: boolean;
  alertsEnabled: boolean;
  notificationPermission: NotificationPermissionState;
  onClose: () => void;
  onNavigate: (page: AppPage) => void;
  onReconnectAndSync: () => void;
  onResumeSession: () => void;
  onResetPatchTimer: () => void;
  onConfirmIdentity: () => void;
  onToggleSound: () => void;
  onTestAlert: () => void;
  onQuickNote: (category: NotePresetCategory, text: string) => void;
  onOpenPlacementGuide: () => void;
  onOpenReport: () => void;
}

export function buildContextualProTips({
  profile,
  language = 'fr',
  tempUnit = 'C',
  identityConfirmed,
  soundEnabled,
  alertsEnabled,
  notificationPermission,
  onClose,
  onNavigate,
  onReconnectAndSync,
  onResumeSession,
  onResetPatchTimer,
  onConfirmIdentity,
  onToggleSound,
  onTestAlert,
  onQuickNote,
  onOpenPlacementGuide,
  onOpenReport,
}: Omit<ProTipsOverlayProps, 'isOpen'>): ProTipItem[] {
  const isAr = language === 'ar';
  const unitSuffix = tempUnitLabel(tempUnit);
  const tips: ProTipItem[] = [];
  const latest = profile.readings[profile.readings.length - 1];
  const currentTemp = latest ? latest.value : 37.0;
  const status = getTemperatureStatus(currentTemp, profile.threshold);
  const patchHours = Math.max(
    1,
    Math.round((Date.now() - profile.patchAppliedAt) / (60 * 60 * 1000))
  );

  // 1. Out of range BLE
  if (profile.connectionMode === 'out_of_range') {
    const count = profile.bufferedReadings.length;
    tips.push({
      id: 'out-of-range',
      priority: 'urgent',
      title: isAr ? 'التحقق من اتصال البلوتوث' : 'Vérifier la connexion Bluetooth',
      description: isAr
        ? `الوحدة ${profile.deviceName} خارج النطاق حالياً. قرّب الهاتف أو فعّل الربط المنزلي (${count} قراءة في الذاكرة المؤقتة).`
        : `Le module ${profile.deviceName} est hors de portée. Rapprochez le smartphone ou activez le Relais Domestique (${count} mesure${count > 1 ? 's' : ''} en mémoire tampon).`,
      icon: WifiOff,
      primaryAction: {
        label: isAr ? 'إعادة الاتصال والمزامنة' : 'Reconnecter & synchroniser',
        onClick: () => {
          onReconnectAndSync();
          onClose();
        },
      },
      secondaryAction: {
        label: isAr ? 'إعدادات الجهاز' : 'Paramètres Appareil',
        onClick: () => {
          onNavigate('device');
          onClose();
        },
      },
    });
  }

  // 2. Standby / Skin removal
  if (profile.connectionMode === 'standby_removed') {
    tips.push({
      id: 'standby-removed',
      priority: 'urgent',
      title: isAr ? 'الوحدة في وضع الاستعداد (تم رصد الإزالة)' : 'Module en veille (retrait détecté)',
      description: isAr
        ? 'تأكد من التصاق اللاصقة جيداً تحت الإبط لاستئناف القياس، أو جفّف نقاط التلامس الذهبية قبل الشحن.'
        : 'Vérifiez que le patch adhère bien sous l’aisselle pour reprendre le suivi, ou essuyez les plots Pogo Pins dorés avant de le recharger.',
      icon: PauseCircle,
      primaryAction: {
        label: isAr ? 'استئناف المراقبة' : 'Reprendre la surveillance',
        onClick: () => {
          onResumeSession();
          onClose();
        },
      },
      secondaryAction: {
        label: isAr ? 'مخطط التثبيت' : 'Schéma de pose',
        onClick: () => {
          onClose();
          onOpenPlacementGuide();
        },
      },
    });
  }

  // 3. Sustained rise state
  if (profile.connectionMode !== 'standby_removed' && status === 'high_fever') {
    const tempFormatted = `${formatTempFr(currentTemp, tempUnit, language)} ${unitSuffix}`;
    tips.push({
      id: 'high-fever',
      priority: 'urgent',
      title: isAr ? `ارتفاع ملحوظ (${tempFormatted})` : `Hausse notable (${tempFormatted})`,
      description: isAr
        ? `راقب الحالة العامة لـ ${profile.name} بهدوء، خفّف الغطاء عند الحاجة، تحقق بميزان مرجعي ودوّن أي إجراء متخذ.`
        : `Observez calmement l'état général de ${profile.name}, allégez si besoin la couverture, vérifiez avec un thermomètre de référence et notez toute mesure prise.`,
      icon: AlertTriangle,
      primaryAction: {
        label: isAr ? 'تدوين خافض حرارة' : 'Noter antipyrétique',
        onClick: () => {
          onQuickNote(
            'Antipyrétique administré',
            isAr
              ? 'أُعطي خافض حرارة بعد استمرار ارتفاع الحرارة.'
              : 'Antipyrétique administré suite à une hausse continue.'
          );
          onClose();
        },
      },
      secondaryAction: {
        label: isAr ? 'ملخص الطبيب' : 'Aperçu médecin',
        onClick: () => {
          onClose();
          onOpenReport();
        },
      },
    });
  }

  // 3b. Newborn (< 3 months) gentle medical reminder
  if (profile.ageCategory === 'newborn') {
    tips.push({
      id: 'newborn-advisory',
      priority: 'recommended',
      title: isAr ? 'عناية خاصة للرضيع (< 3 أشهر)' : 'Attention particulière (< 3 mois)',
      description: isAr
        ? 'لدى الرضيع دون 3 أشهر، أي ارتفاع في الحرارة يتطلب استشارة طبية سريعة. BioTemp أداة مساعدة ولا يغني عن ميزان الحرارة المرجعي.'
        : 'Chez le nourrisson de moins de 3 mois, toute hausse de température demande une vigilance rapide auprès de votre médecin. BioTemp complète mais ne remplace pas le thermomètre de référence.',
      icon: ShieldCheck,
    });
  }

  // 4. Patch renewal >= 12h
  if (patchHours >= 12) {
    tips.push({
      id: 'patch-renew',
      priority: patchHours >= 20 ? 'urgent' : 'recommended',
      title: isAr ? `تجديد اللاصقة (${patchHours} س)` : `Reposer un nouveau patch (${patchHours} h)`,
      description: isAr
        ? `لاصقة ${profile.name} الحالية تقترب من المدة الموصى بها (12–24 ساعة كحد أقصى). انزعها بلطف وغيّر موضع التثبيت قليلاً.`
        : `Le patch actuel de ${profile.name} approche la durée conseillée (12–24 h max). Retirez-le en douceur et changez légèrement de zone cutanée.`,
      icon: Clock,
      primaryAction: {
        label: isAr ? 'تم وضع لاصقة جديدة' : 'Nouveau patch posé',
        onClick: () => {
          onResetPatchTimer();
          onClose();
        },
      },
      secondaryAction: {
        label: isAr ? 'إرشادات النظافة' : 'Règles d’hygiène',
        onClick: () => {
          onClose();
          onOpenPlacementGuide();
        },
      },
    });
  }

  // 5. Identity unconfirmed after switch
  if (!identityConfirmed) {
    tips.push({
      id: 'confirm-identity',
      priority: 'recommended',
      title: isAr ? `تأكيد ملف ${profile.name}` : `Confirmer le profil ${profile.name}`,
      description: isAr
        ? `تأكد أن الوحدة ${profile.deviceName} (${profile.deviceId}) موضوعة فعلاً على ${profile.name} لتفادي الخلط بين الأطفال.`
        : `Assurez-vous que le module ${profile.deviceName} (${profile.deviceId}) est bien posé sur ${profile.name} afin d'éviter toute confusion entre enfants.`,
      icon: ShieldCheck,
      primaryAction: {
        label: isAr ? `تأكيد ${profile.name}` : `Confirmer ${profile.name}`,
        onClick: () => {
          onConfirmIdentity();
        },
      },
      secondaryAction: {
        label: isAr ? 'نقل 30 د' : 'Transférer 30 min',
        onClick: () => {
          onNavigate('profile');
          onClose();
        },
      },
    });
  }

  // 6. Elevated temperature
  if (profile.connectionMode !== 'standby_removed' && status === 'elevated') {
    tips.push({
      id: 'elevated-temp',
      priority: 'recommended',
      title: isAr ? 'ارتفاع حراري طفيف' : 'Légère hausse thermique',
      description: isAr
        ? `فكّر في تقديم الماء بانتظام لـ ${profile.name} وتأكد من اعتدال حرارة الغرفة.`
        : `Pensez à proposer régulièrement à boire à ${profile.name} et vérifiez que la pièce n'est pas surchauffée.`,
      icon: Droplets,
      primaryAction: {
        label: isAr ? 'تدوين شرب الماء' : 'Noter hydratation',
        onClick: () => {
          onQuickNote(
            'Hydratation / boisson',
            isAr ? 'تم تقديم الماء وقبوله بشكل جيد.' : 'Eau proposée et bien acceptée.'
          );
          onClose();
        },
      },
    });
  }

  // 7. Muted alert sound during active monitoring
  if (profile.connectionMode !== 'standby_removed' && !soundEnabled) {
    tips.push({
      id: 'sound-muted',
      priority: 'recommended',
      title: isAr ? 'إعادة تفعيل صوت التنبيه' : 'Réactiver l’avertisseur sonore',
      description: isAr
        ? 'صوت التنبيهات متوقف حالياً. أعد تفعيله قبل النوم لتلقي إشعار فوري عند أي ارتفاع.'
        : 'Le son des alertes est actuellement coupé. Réactivez-le avant la nuit pour être prévenu immédiatement en cas de pic de fièvre.',
      icon: Volume2,
      primaryAction: {
        label: isAr ? 'تفعيل الصوت' : 'Réactiver le son',
        onClick: onToggleSound,
      },
    });
  }

  // 8. Low battery
  if (profile.battery <= 25) {
    tips.push({
      id: 'low-battery',
      priority: profile.battery < 15 ? 'urgent' : 'recommended',
      title: isAr ? `بطارية منخفضة (${profile.battery} %)` : `Batterie faible (${profile.battery} %)`,
      description: isAr
        ? 'نظّف نقاط التلامس الذهبية قبل الشحن المغناطيسي. يمكن استخدام بطارية خارجية (Power Bank).'
        : 'Nettoyez les plots dorés avant la charge magnétique. Une batterie externe classique (Power Bank) peut être utilisée.',
      icon: BatteryLow,
      primaryAction: {
        label: isAr ? 'فحص الجهاز' : 'Vérifier l’appareil',
        onClick: () => {
          onNavigate('device');
          onClose();
        },
      },
    });
  }

  // 9. System notifications not yet granted
  if (alertsEnabled && notificationPermission === 'default') {
    tips.push({
      id: 'desktop-notifications',
      priority: 'info',
      title: isAr ? 'تفعيل تنبيهات الخلفية' : 'Activer les alertes en arrière-plan',
      description: isAr
        ? 'اسمح بإشعارات النظام لتصلك التنبيهات حتى عندما يكون الهاتف مقفلاً أو في تبويب آخر.'
        : 'Autorisez les notifications système pour recevoir une alerte même si votre écran est verrouillé ou sur un autre onglet.',
      icon: BellRing,
      primaryAction: {
        label: isAr ? 'سماح واختبار' : 'Autoriser & tester',
        onClick: onTestAlert,
      },
    });
  }

  // 10. Always-available baseline quick-guide tips
  tips.push({
    id: 'axillary-reminder',
    priority: 'info',
    title: isAr ? 'دليل التثبيت السريع والسلامة' : 'Guide rapide de pose & sécurité',
    description: isAr
      ? `القياس معاير تحت الإبط فقط (بشرة جافة ودون كريمات). اللاصقة النشطة: ${profile.patchLabel}.`
      : `Mesure calibrée sous l'aisselle uniquement (peau sèche, sans crème). Format actif : ${profile.patchLabel}.`,
    icon: BookOpen,
    primaryAction: {
      label: isAr ? 'فتح الدليل المصوّر' : 'Ouvrir le guide illustré',
      onClick: () => {
        onClose();
        onOpenPlacementGuide();
      },
    },
    secondaryAction: {
      label: isAr ? 'تصدير PDF للطبيب' : 'Exporter PDF médecin',
      onClick: () => {
        onClose();
        onOpenReport();
      },
    },
  });

  if (profile.bufferedReadings.length > 0 && profile.connectionMode !== 'out_of_range') {
    tips.push({
      id: 'sync-buffer',
      priority: 'recommended',
      title: isAr ? 'قراءات بانتظار المزامنة' : 'Mesures en attente de synchronisation',
      description: isAr
        ? `${profile.bufferedReadings.length} قراءة محفوظة في الذاكرة الداخلية جاهزة للإضافة إلى المنحنى.`
        : `${profile.bufferedReadings.length} mesure(s) enregistrée(s) en mémoire interne sont prêtes à rejoindre la courbe.`,
      icon: RefreshCw,
      primaryAction: {
        label: isAr ? 'مزامنة الآن' : 'Synchroniser maintenant',
        onClick: () => {
          onReconnectAndSync();
          onClose();
        },
      },
    });
  }

  if (tips.filter((t) => t.priority === 'urgent').length === 0 && status === 'normal') {
    tips.push({
      id: 'nominal-note',
      priority: 'info',
      title: isAr ? 'متابعة مستقرة وملاحظات سريعة' : 'Suivi calme & notes rapides',
      description: isAr
        ? 'المؤشرات مستقرة. يمكنك تدوين أي دواء أو ملاحظة لحالة الطفل لمشاركتها مع الطبيب.'
        : 'Tout est stable. Consignez si besoin la prise de médicament ou l’évolution de l’état général pour le pédiatre.',
      icon: Pill,
      secondaryAction: {
        label: isAr ? 'عرض السجل' : 'Voir le journal',
        onClick: () => {
          onNavigate('history');
          onClose();
        },
      },
    });
  }

  return tips;
}

export const ProTipsOverlay: React.FC<ProTipsOverlayProps> = (props) => {
  const { isOpen, profile, language = 'fr', onClose } = props;
  const isAr = language === 'ar';
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const tips = useMemo(() => buildContextualProTips(props), [props]);

  const urgentCount = tips.filter((t) => t.priority === 'urgent').length;
  const recommendedCount = tips.filter((t) => t.priority === 'recommended').length;

  const badgeStyle = (priority: ProTipItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return {
          container:
            'bg-[#FEF1F3]/85 border-[#FCCAD3] dark:bg-[#2A0E17]/85 dark:border-[#881337]',
          iconWrap:
            'bg-[#FFE4E6] text-[#D91E43] dark:bg-[#4C0519] dark:text-[#FDA4AF]',
          tag: isAr ? 'إجراء ذو أولوية' : 'Action prioritaire',
          tagClass: 'text-[#BE123C] dark:text-[#FDA4AF]',
          primaryBtn:
            'bg-[#D91E43] hover:bg-[#B91737] text-white',
        };
      case 'recommended':
        return {
          container:
            'bg-[#FEF7EC]/85 border-[#FCDCA8] dark:bg-[#261909]/85 dark:border-[#78350F]',
          iconWrap:
            'bg-[#FEF0C7] text-[#D97706] dark:bg-[#451A03] dark:text-[#FDE68A]',
          tag: isAr ? 'موصى به' : 'Conseillé',
          tagClass: 'text-[#B45309] dark:text-[#FDE68A]',
          primaryBtn:
            'bg-[#0B8A7E] hover:bg-[#087066] text-white',
        };
      case 'info':
      default:
        return {
          container:
            'bg-[#F8FAFC] border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42]',
          iconWrap:
            'bg-[#EDF9F7] text-[#0B8A7E] dark:bg-[#0A2624] dark:text-[#5EEAD4]',
          tag: isAr ? 'دليل سريع' : 'Guide rapide',
          tagClass: 'text-[#087066] dark:text-[#5EEAD4]',
          primaryBtn:
            'bg-[#0F1D32] hover:bg-[#1B2F4D] dark:bg-[#0B8A7E] dark:hover:bg-[#087066] text-white',
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:justify-end p-0 sm:p-5 sm:pt-18"
          role="dialog"
          aria-modal="true"
          aria-labelledby="protips-overlay-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F1D32]/40 dark:bg-[#030712]/70 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Overlay Card / Slide-over Panel */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full sm:w-[430px] max-h-[86vh] flex flex-col bg-white dark:bg-[#0D1626] border border-[#E1E8EE] dark:border-[#1B2A42] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E1E8EE] dark:border-[#1B2A42] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A] flex items-center justify-center text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0">
                  <Lightbulb className="w-4.5 h-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="protips-overlay-title"
                    className="text-base font-bold text-[#0F1D32] dark:text-[#F1F5F9]"
                  >
                    {isAr ? 'دليل سريع ونصائح ذكية' : 'Guide rapide & Pro-Tips'}
                  </h2>
                  <p className="text-xs text-[#64798F] dark:text-[#7B91A8]">
                    {isAr
                      ? `مخصص مباشرة لملف ${profile.name} (${profile.deviceId})`
                      : `Adapté en direct à ${profile.name} (${profile.deviceId})`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={isAr ? 'إغلاق النصائح السريعة' : 'Fermer les conseils rapides'}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#64798F] hover:bg-[#F4F7F9] hover:text-[#0F1D32] dark:text-[#7B91A8] dark:hover:bg-[#122038] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Contextual Status Summary Strip */}
            <div className="px-5 py-2.5 bg-[#F8FAFC] dark:bg-[#09111E] border-b border-[#E1E8EE] dark:border-[#1B2A42] flex items-center justify-between gap-2 text-xs">
              {urgentCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#BE123C] dark:text-[#FDA4AF]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {isAr
                    ? `${urgentCount} إجراء عاجل مرصود`
                    : `${urgentCount} action${urgentCount > 1 ? 's' : ''} prioritaire${urgentCount > 1 ? 's' : ''} détectée${urgentCount > 1 ? 's' : ''}`}
                </span>
              ) : recommendedCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#B45309] dark:text-[#FDE68A]">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {isAr
                    ? `${recommendedCount} نصيحة للمتابعة`
                    : `${recommendedCount} conseil${recommendedCount > 1 ? 's' : ''} de suivi`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#087066] dark:text-[#5EEAD4]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {isAr ? 'مراقبة منتظمة · كل المؤشرات طبيعية' : 'Surveillance nominale · Tout est conforme'}
                </span>
              )}
              <span className="text-[11px] font-mono text-[#64798F] dark:text-[#7B91A8] tabular-nums">
                {isAr
                  ? `${tips.length} بطاقة`
                  : `${tips.length} fiche${tips.length > 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Contextual Tips List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
              {tips.map((tip) => {
                const Icon = tip.icon;
                const styles = badgeStyle(tip.priority);

                return (
                  <div
                    key={tip.id}
                    className={`p-3.5 rounded-xl border transition-colors ${styles.container}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${styles.iconWrap}`}
                      >
                        <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.tagClass}`}>
                            {styles.tag}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] mt-0.5">
                          {tip.title}
                        </h3>
                        <p className="text-xs text-[#475B70] dark:text-[#9DB0C6] mt-1 leading-relaxed">
                          {tip.description}
                        </p>

                        {(tip.primaryAction || tip.secondaryAction) && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {tip.primaryAction && (
                              <button
                                type="button"
                                onClick={tip.primaryAction.onClick}
                                className={`min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${styles.primaryBtn}`}
                              >
                                <span>{tip.primaryAction.label}</span>
                                <ChevronRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" aria-hidden="true" />
                              </button>
                            )}
                            {tip.secondaryAction && (
                              <button
                                type="button"
                                onClick={tip.secondaryAction.onClick}
                                className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0F1D32] bg-white hover:bg-[#F4F7F9] border border-[#E1E8EE] dark:text-[#E2E8F0] dark:bg-[#0D1626] dark:hover:bg-[#122038] dark:border-[#1E304D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <span>{tip.secondaryAction.label}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-[#F8FAFC] dark:bg-[#09111E] border-t border-[#E1E8EE] dark:border-[#1B2A42] flex items-center justify-between gap-2 text-[11px] text-[#64798F] dark:text-[#7B91A8]">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                {isAr ? 'اقتراحات محسوبة محلياً' : 'Suggestions calculées localement'}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="font-semibold text-[#0F1D32] dark:text-[#F1F5F9] hover:underline cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
