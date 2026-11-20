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
import { ChildProfile, NotePresetCategory } from '../types/biotemp';
import { NotificationPermissionState } from '../utils/notifications';
import { formatTempFr, getTemperatureStatus } from '../utils/temperature';
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
    tips.push({
      id: 'out-of-range',
      priority: 'urgent',
      title: 'Vérifier la connexion Bluetooth',
      description: `Le module ${profile.deviceName} est hors de portée. Rapprochez le smartphone ou activez le Relais Domestique (${profile.bufferedReadings.length} mesure${profile.bufferedReadings.length > 1 ? 's' : ''} en mémoire tampon).`,
      icon: WifiOff,
      primaryAction: {
        label: 'Reconnecter & synchroniser',
        onClick: () => {
          onReconnectAndSync();
          onClose();
        },
      },
      secondaryAction: {
        label: 'Paramètres Appareil',
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
      title: 'Module en veille (retrait détecté)',
      description:
        'Vérifiez que le patch adhère bien sous l’aisselle pour reprendre le suivi, ou essuyez les plots Pogo Pins dorés avant de le recharger.',
      icon: PauseCircle,
      primaryAction: {
        label: 'Reprendre la surveillance',
        onClick: () => {
          onResumeSession();
          onClose();
        },
      },
      secondaryAction: {
        label: 'Schéma de pose',
        onClick: () => {
          onClose();
          onOpenPlacementGuide();
        },
      },
    });
  }

  // 3. Sustained rise state
  if (profile.connectionMode !== 'standby_removed' && status === 'high_fever') {
    tips.push({
      id: 'high-fever',
      priority: 'urgent',
      title: `Hausse notable (${formatTempFr(currentTemp)} °C)`,
      description: `Observez calmement l'état général de ${profile.name}, allégez si besoin la couverture, vérifiez avec un thermomètre de référence et notez toute mesure prise.`,
      icon: AlertTriangle,
      primaryAction: {
        label: 'Noter antipyrétique',
        onClick: () => {
          onQuickNote(
            'Antipyrétique administré',
            'Antipyrétique administré suite à une hausse continue.'
          );
          onClose();
        },
      },
      secondaryAction: {
        label: 'Aperçu médecin',
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
      title: 'Attention particulière (< 3 mois)',
      description:
        'Chez le nourrisson de moins de 3 mois, toute hausse de température demande une vigilance rapide auprès de votre médecin. BioTemp complète mais ne remplace pas le thermomètre de référence.',
      icon: ShieldCheck,
    });
  }

  // 4. Patch renewal >= 12h
  if (patchHours >= 12) {
    tips.push({
      id: 'patch-renew',
      priority: patchHours >= 20 ? 'urgent' : 'recommended',
      title: `Reposer un nouveau patch (${patchHours} h)`,
      description: `Le patch actuel de ${profile.name} approche la durée conseillée (12–24 h max). Retirez-le en douceur et changez légèrement de zone cutanée.`,
      icon: Clock,
      primaryAction: {
        label: 'Nouveau patch posé',
        onClick: () => {
          onResetPatchTimer();
          onClose();
        },
      },
      secondaryAction: {
        label: 'Règles d’hygiène',
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
      title: `Confirmer le profil ${profile.name}`,
      description: `Assurez-vous que le module ${profile.deviceName} (${profile.deviceId}) est bien posé sur ${profile.name} afin d'éviter toute confusion entre enfants.`,
      icon: ShieldCheck,
      primaryAction: {
        label: `Confirmer ${profile.name}`,
        onClick: () => {
          onConfirmIdentity();
        },
      },
      secondaryAction: {
        label: 'Transférer 30 min',
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
      title: 'Légère hausse thermique',
      description: `Pensez à proposer régulièrement à boire à ${profile.name} et vérifiez que la pièce n'est pas surchauffée.`,
      icon: Droplets,
      primaryAction: {
        label: 'Noter hydratation',
        onClick: () => {
          onQuickNote('Hydratation / boisson', 'Eau proposée et bien acceptée.');
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
      title: 'Réactiver l’avertisseur sonore',
      description:
        'Le son des alertes est actuellement coupé. Réactivez-le avant la nuit pour être prévenu immédiatement en cas de pic de fièvre.',
      icon: Volume2,
      primaryAction: {
        label: 'Réactiver le son',
        onClick: onToggleSound,
      },
    });
  }

  // 8. Low battery
  if (profile.battery <= 25) {
    tips.push({
      id: 'low-battery',
      priority: 'recommended',
      title: `Batterie faible (${profile.battery} %)`,
      description:
        'Nettoyez les plots dorés avant la charge magnétique. Une batterie externe classique (Power Bank) peut être utilisée.',
      icon: BatteryLow,
      primaryAction: {
        label: 'Vérifier l’appareil',
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
      title: 'Activer les alertes en arrière-plan',
      description:
        'Autorisez les notifications système pour recevoir une alerte même si votre écran est verrouillé ou sur un autre onglet.',
      icon: BellRing,
      primaryAction: {
        label: 'Autoriser & tester',
        onClick: onTestAlert,
      },
    });
  }

  // 10. Always-available baseline quick-guide tips
  tips.push({
    id: 'axillary-reminder',
    priority: 'info',
    title: 'Guide rapide de pose & sécurité',
    description: `Mesure calibrée sous l'aisselle uniquement (peau sèche, sans crème). Format actif : ${profile.patchLabel}.`,
    icon: BookOpen,
    primaryAction: {
      label: 'Ouvrir le guide illustré',
      onClick: () => {
        onClose();
        onOpenPlacementGuide();
      },
    },
    secondaryAction: {
      label: 'Exporter PDF médecin',
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
      title: 'Mesures en attente de synchronisation',
      description: `${profile.bufferedReadings.length} mesure(s) enregistrée(s) en mémoire interne sont prêtes à rejoindre la courbe.`,
      icon: RefreshCw,
      primaryAction: {
        label: 'Synchroniser maintenant',
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
      title: 'Suivi calme & notes rapides',
      description:
        'Tout est stable. Consignez si besoin la prise de médicament ou l’évolution de l’état général pour le pédiatre.',
      icon: Pill,
      secondaryAction: {
        label: 'Voir le journal',
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
  const { isOpen, profile, onClose } = props;
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
            'bg-[#FFF1F2]/75 border-[#FECDD3] dark:bg-[#2A111D]/85 dark:border-[#881337]',
          iconWrap:
            'bg-[#FFE4E6] text-[#E11D48] dark:bg-[#4C0519] dark:text-[#FDA4AF]',
          tag: 'Action prioritaire',
          tagClass: 'text-[#BE123C] dark:text-[#FDA4AF]',
          primaryBtn:
            'bg-[#E11D48] hover:bg-[#BE123C] text-white',
        };
      case 'recommended':
        return {
          container:
            'bg-[#FFF7ED]/75 border-[#FED7AA] dark:bg-[#261910]/85 dark:border-[#7C2D12]',
          iconWrap:
            'bg-[#FFEDD5] text-[#EA580C] dark:bg-[#431407] dark:text-[#FDBA74]',
          tag: 'Conseillé',
          tagClass: 'text-[#C2410C] dark:text-[#FDBA74]',
          primaryBtn:
            'bg-[#0D9488] hover:bg-[#0F766E] text-white',
        };
      case 'info':
      default:
        return {
          container:
            'bg-[#F7FAFB] border-[#E4EEF1] dark:bg-[#0B172B] dark:border-[#1E3354]',
          iconWrap:
            'bg-[#E6F7F5] text-[#0D9488] dark:bg-[#0D2B2C] dark:text-[#5EEAD4]',
          tag: 'Guide rapide',
          tagClass: 'text-[#0F766E] dark:text-[#5EEAD4]',
          primaryBtn:
            'bg-[#162642] hover:bg-[#1E3356] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white',
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:justify-end p-0 sm:p-5 sm:pt-20"
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
            className="fixed inset-0 bg-[#162642]/35 dark:bg-[#030711]/65 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Overlay Card / Slide-over Panel */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full sm:w-[430px] max-h-[86vh] flex flex-col bg-white dark:bg-[#0F1E36] border border-[#DCE6E5] dark:border-[#1E3354] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E8EFEF] dark:border-[#1E3354] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-[#F0FDFA] border border-[#CCFBF1] dark:bg-[#0D2B2C] dark:border-[#115E59] flex items-center justify-center text-[#0D9488] dark:text-[#2DD4BF] shrink-0">
                  <Lightbulb className="w-5 h-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="protips-overlay-title"
                    className="text-base font-bold text-[#162642] dark:text-[#F1F6FA]"
                  >
                    Guide rapide &amp; Pro-Tips
                  </h2>
                  <p className="text-xs text-[#647B8C] dark:text-[#8BA3BC]">
                    Adapté en direct à {profile.name} ({profile.deviceId})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer les conseils rapides"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[#647B8C] hover:bg-[#F3F7F9] hover:text-[#162642] dark:text-[#8BA3BC] dark:hover:bg-[#162947] dark:hover:text-[#F1F6FA] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Contextual Status Summary Strip */}
            <div className="px-5 py-2.5 bg-[#F7FAFB] dark:bg-[#0B172B] border-b border-[#E8EFEF] dark:border-[#1E3354] flex items-center justify-between gap-2 text-xs">
              {urgentCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#BE123C] dark:text-[#FDA4AF]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {urgentCount} action{urgentCount > 1 ? 's' : ''} prioritaire
                  {urgentCount > 1 ? 's' : ''} détectée{urgentCount > 1 ? 's' : ''}
                </span>
              ) : recommendedCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#C2410C] dark:text-[#FDBA74]">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {recommendedCount} conseil{recommendedCount > 1 ? 's' : ''} de suivi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F766E] dark:text-[#5EEAD4]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Surveillance nominale · Tout est conforme
                </span>
              )}
              <span className="text-[11px] text-[#647B8C] dark:text-[#8BA3BC] tabular-nums">
                {tips.length} fiche{tips.length > 1 ? 's' : ''}
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
                    className={`p-3.5 rounded-2xl border transition-colors ${styles.container}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${styles.iconWrap}`}
                      >
                        <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${styles.tagClass}`}>
                            {styles.tag}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#162642] dark:text-[#F1F6FA] mt-0.5">
                          {tip.title}
                        </h3>
                        <p className="text-xs text-[#476074] dark:text-[#B0C4D8] mt-1 leading-relaxed">
                          {tip.description}
                        </p>

                        {(tip.primaryAction || tip.secondaryAction) && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {tip.primaryAction && (
                              <button
                                type="button"
                                onClick={tip.primaryAction.onClick}
                                className={`min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${styles.primaryBtn}`}
                              >
                                <span>{tip.primaryAction.label}</span>
                                <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              </button>
                            )}
                            {tip.secondaryAction && (
                              <button
                                type="button"
                                onClick={tip.secondaryAction.onClick}
                                className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#162642] bg-white hover:bg-[#F3F7F9] border border-[#DCE6E5] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] dark:border-[#243E63] rounded-xl transition-colors cursor-pointer"
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
            <div className="px-5 py-3 bg-[#F7FAFB] dark:bg-[#0B172B] border-t border-[#E8EFEF] dark:border-[#1E3354] flex items-center justify-between gap-2 text-[11px] text-[#647B8C] dark:text-[#8BA3BC]">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
                Suggestions calculées localement
              </span>
              <button
                type="button"
                onClick={onClose}
                className="font-semibold text-[#162642] dark:text-[#F1F6FA] hover:underline cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
