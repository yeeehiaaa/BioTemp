import React, { useState } from 'react';
import {
  BatteryMedium,
  BellRing,
  Bluetooth,
  BluetoothOff,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  HardDrive,
  Loader2,
  PauseCircle,
  Plus,
  Power,
  RefreshCw,
  Router,
  ShieldCheck,
  SignalMedium,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react';
import { AppLanguage, ChildProfile } from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import { NotificationPermissionState } from '../utils/notifications';
import { evaluateSignalContactQuality, formatTimeFr } from '../utils/temperature';

interface ConnectionAndSyncCardProps {
  language?: AppLanguage;
  profile: ChildProfile;
  alertsEnabled: boolean;
  soundEnabled: boolean;
  smartPersistenceEnabled: boolean;
  isSyncingBuffer: boolean;
  notificationPermission: NotificationPermissionState;
  onToggleAlerts: () => void;
  onToggleSound: () => void;
  onToggleSmartPersistence: () => void;
  onTestAlert: () => void;
  onSimulateOutOfRange: () => void;
  onSimulateSkinRemoval: () => void;
  onResumeSession: () => void;
  onReconnectAndSync: () => void;
  onAddManualBufferedPoint: () => void;
  onToggleHomeHub: () => void;
  onChangeHomeHubDevice: (deviceName: string) => void;
  onDismissSyncNotice: () => void;
  onEndSession?: () => void;
  onOpenReplaceDevice?: () => void;
}

const HUB_DEVICES = ['iPad Chambre', 'Ancien smartphone chevet', 'Tablette Salon'];

export const ConnectionAndSyncCard: React.FC<ConnectionAndSyncCardProps> = ({
  language = 'fr',
  profile,
  alertsEnabled,
  soundEnabled,
  smartPersistenceEnabled,
  isSyncingBuffer,
  notificationPermission,
  onToggleAlerts,
  onToggleSound,
  onToggleSmartPersistence,
  onTestAlert,
  onSimulateOutOfRange,
  onSimulateSkinRemoval,
  onResumeSession,
  onReconnectAndSync,
  onAddManualBufferedPoint,
  onToggleHomeHub,
  onChangeHomeHubDevice,
  onDismissSyncNotice,
  onEndSession,
  onOpenReplaceDevice,
}) => {
  const dc = getStrings(language).deviceCopy;
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showSimTools, setShowSimTools] = useState(false);

  const isOutOfRange = profile.connectionMode === 'out_of_range';
  const isRelayed = profile.connectionMode === 'home_hub_relayed';
  const isStandby = profile.connectionMode === 'standby_removed';
  const signalQuality = evaluateSignalContactQuality(profile, language);

  const permissionStatusText =
    notificationPermission === 'granted'
      ? 'Notifications système autorisées'
      : notificationPermission === 'denied'
      ? 'Notifications OS bloquées (alerte onglet & sonore actives)'
      : notificationPermission === 'unsupported'
      ? 'Notifications OS indisponibles (alerte onglet & sonore actives)'
      : 'Autoriser les notifications bureau en arrière-plan';

  return (
    <aside
      id="relais-domestique"
      aria-label="Connexion, mémoire tampon, alertes et relais domestique"
      className="biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors"
    >
      {/* Top Status & Centered Concentric Emblem */}
      <div className="flex flex-col items-center text-center">
        <div className="w-full flex items-center justify-between text-xs text-[#647B8C] dark:text-[#8BA3BC] tabular-nums">
          <span className="font-mono font-semibold text-[#162642] dark:text-[#F1F6FA]">
            {profile.deviceName} · {profile.deviceId}
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <BatteryMedium className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
            {profile.battery} %
          </span>
        </div>

        {/* Concentric Soft Halo Emblem */}
        <div className="my-4 relative flex items-center justify-center">
          <div
            className={`w-26 h-26 rounded-full flex items-center justify-center transition-colors ${
              isStandby
                ? 'bg-[#F3F7F9] dark:bg-[#162947]'
                : isOutOfRange
                ? 'bg-[#FFF7ED] dark:bg-[#2C1C12]'
                : isRelayed
                ? 'bg-[#EFF6FF] dark:bg-[#132544]'
                : 'bg-[#F0FDFA] dark:bg-[#0D2B2C]'
            }`}
          >
            <div
              className={`w-18 h-18 rounded-full bg-white dark:bg-[#132544] shadow-[0_10px_28px_-10px_rgba(22,38,66,0.16)] dark:shadow-[0_10px_28px_-10px_rgba(2,8,20,0.6)] flex items-center justify-center border ${
                isStandby
                  ? 'border-[#DCE7EC] dark:border-[#243E63]'
                  : isOutOfRange
                  ? 'border-[#FED7AA] dark:border-[#7C2D12]'
                  : isRelayed
                  ? 'border-[#BFDBFE] dark:border-[#1E40AF]'
                  : 'border-[#CCFBF1] dark:border-[#115E59]'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${
                  isStandby
                    ? 'bg-[#647B8C]'
                    : isOutOfRange
                    ? 'bg-[#F97316]'
                    : isRelayed
                    ? 'bg-[#2563EB]'
                    : 'bg-[#0D9488]'
                }`}
              >
                {isStandby ? (
                  <PauseCircle className="w-5 h-5" aria-hidden="true" />
                ) : isOutOfRange ? (
                  <BluetoothOff className="w-5 h-5" aria-hidden="true" />
                ) : isRelayed ? (
                  <Router className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Bluetooth className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-base font-bold text-[#162642] dark:text-[#F1F6FA]">
          {isStandby
            ? dc.standbyPromptTitle
            : isOutOfRange
            ? dc.outOfRangeTitle
            : isRelayed
            ? language === 'ar'
              ? 'متصل عبر الموزع المنزلي'
              : 'Connecté via Relais Domestique'
            : language === 'ar'
            ? 'متصل عبر البلوتوث BLE'
            : 'Connecté en BLE'}
        </h2>

        <p className="mt-1 text-xs text-[#647B8C] dark:text-[#94ACC4] leading-relaxed max-w-[300px]">
          {isStandby
            ? dc.standbyPromptDesc
            : isOutOfRange
            ? dc.outOfRangeDesc
            : isRelayed
            ? language === 'ar'
              ? `يصل البث مباشرة عبر ${profile.homeHubDeviceName}.`
              : `Flux transmis en direct via ${profile.homeHubDeviceName}.`
            : language === 'ar'
            ? 'اتصال BLE منخفض الطاقة لا يزعج نوم الطفل.'
            : 'BLE très basse puissance, émission brève sans réveiller l’enfant.'}
        </p>

        {!isOutOfRange && !isStandby && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF]">
            <span
              className="w-2 h-2 rounded-full bg-[#0D9488] dark:bg-[#2DD4BF] animate-pulse"
              aria-hidden="true"
            />
            <span>
              {language === 'ar' ? 'الاستقبال المستمر نشط' : 'Réception continue active'}
            </span>
          </div>
        )}

        {/* Signal & Contact Quality Indicator */}
        <div
          className={`mt-3 w-full px-3.5 py-2.5 rounded-2xl border text-start flex items-start gap-2.5 text-xs ${
            signalQuality.status === 'oscillating'
              ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] dark:bg-[#2C1F12] dark:border-[#78350F] dark:text-[#FCD34D]'
              : signalQuality.status === 'stabilizing'
              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF] dark:bg-[#132544] dark:border-[#1E40AF] dark:text-[#93C5FD]'
              : signalQuality.status === 'no_contact'
              ? 'bg-[#F3F7F9] border-[#DCE7EC] text-[#526675] dark:bg-[#162947] dark:border-[#243E63] dark:text-[#94ACC4]'
              : 'bg-[#F7FAFB] border-[#E6EFF2] text-[#334E68] dark:bg-[#0B172B] dark:border-[#1E3354] dark:text-[#B0C4D8]'
          }`}
        >
          <SignalMedium
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              signalQuality.status === 'oscillating'
                ? 'text-[#D97706] dark:text-[#FBBF24]'
                : signalQuality.status === 'stabilizing'
                ? 'text-[#2563EB] dark:text-[#60A5FA]'
                : signalQuality.status === 'no_contact'
                ? 'text-[#647B8C]'
                : 'text-[#0D9488] dark:text-[#2DD4BF]'
            }`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-bold leading-snug">
              {dc.signalQualityHeading} · {signalQuality.label}
            </p>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
              {signalQuality.detail}
            </p>
          </div>
        </div>
      </div>

      {/* Connection Simulation & Syncing */}
      <div className="space-y-3">
        {isSyncingBuffer ? (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] dark:bg-[#0D2B2C] dark:border-[#115E59] flex items-center justify-center gap-2.5 text-xs font-semibold text-[#0F766E] dark:text-[#5EEAD4]"
          >
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>
              {language === 'ar'
                ? 'جاري مزامنة القراءات المحفوظة...'
                : 'Synchronisation des mesures enregistrées en cours...'}
            </span>
          </div>
        ) : isStandby ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onResumeSession}
              className="min-h-[44px] w-full px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-full transition-colors cursor-pointer"
            >
              {dc.resumeSessionBtn}
            </button>
            {onEndSession && (
              <button
                type="button"
                onClick={onEndSession}
                className="min-h-[44px] w-full px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#162642] bg-[#F3F7F9] hover:bg-[#E4EDF2] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] rounded-full transition-colors cursor-pointer"
              >
                {dc.endSessionBtn}
              </button>
            )}
          </div>
        ) : isOutOfRange ? (
          <div className="p-3.5 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] dark:bg-[#2C1C12] dark:border-[#7C2D12] space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#9A3412] dark:text-[#FDBA74]">
              <span className="inline-flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Mémoire interne</span>
              </span>
              <span className="font-mono text-sm font-bold tabular-nums">
                {profile.bufferedReadings.length} mesure
                {profile.bufferedReadings.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onReconnectAndSync}
                className="min-h-[44px] w-full px-5 py-2.5 text-sm font-semibold text-white bg-[#162642] hover:bg-[#0F1C33] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] rounded-full transition-colors cursor-pointer"
              >
                Reconnecter et synchroniser ({profile.bufferedReadings.length})
              </button>
              <button
                type="button"
                onClick={onAddManualBufferedPoint}
                className="min-h-[38px] w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9A3412] bg-white hover:bg-[#FFEDD5] border border-[#FED7AA] dark:text-[#FDBA74] dark:bg-[#1B120C] dark:hover:bg-[#3A2416] dark:border-[#7C2D12] rounded-full transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>+1 mesure en mémoire interne</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(onOpenReplaceDevice || onEndSession) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onOpenReplaceDevice && (
                  <button
                    type="button"
                    onClick={onOpenReplaceDevice}
                    className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#162642] bg-[#F3F7F9] hover:bg-[#E4EDF2] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] rounded-full transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Changer de module</span>
                  </button>
                )}
                {onEndSession && (
                  <button
                    type="button"
                    onClick={onEndSession}
                    className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] dark:text-[#5EEAD4] dark:bg-[#0D2B2C] dark:hover:bg-[#12383A] dark:border-[#115E59] rounded-full transition-colors cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Clôturer la session</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSimTools((v) => !v)}
              aria-expanded={showSimTools}
              className="w-full inline-flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-[#647B8C] hover:text-[#162642] dark:text-[#8BA3BC] dark:hover:text-[#F1F6FA] cursor-pointer"
            >
              <span>Outils de test / simulation</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showSimTools ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {showSimTools && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onSimulateOutOfRange}
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#162642] hover:bg-[#1E3356] dark:bg-[#1B3358] dark:hover:bg-[#23406E] rounded-full transition-colors cursor-pointer"
                >
                  Simuler l&apos;éloignement
                </button>
                <button
                  type="button"
                  onClick={onSimulateSkinRemoval}
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#162642] bg-[#F3F7F9] hover:bg-[#E4EDF2] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] rounded-full transition-colors cursor-pointer"
                >
                  Simuler retrait (Standby)
                </button>
              </div>
            )}
          </div>
        )}

        {profile.lastSyncNotice && !isSyncingBuffer && (
          <div
            role="status"
            className="p-3 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] dark:bg-[#0D2B2C] dark:border-[#115E59] flex items-start justify-between gap-2 text-xs text-[#115E59] dark:text-[#5EEAD4]"
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
              <span className="font-medium leading-relaxed">{profile.lastSyncNotice}</span>
            </div>
            <button
              type="button"
              onClick={onDismissSyncNotice}
              className="font-bold text-[#0F766E] dark:text-[#2DD4BF] px-1.5 py-0.5 cursor-pointer"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* System / Background Fever Notifications + Anti-False-Alarm Persistence */}
      <div className="pt-3.5 border-t border-[#EDF3F5] dark:border-[#1E3354] space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellRing
              className={`w-4 h-4 shrink-0 ${
                alertsEnabled
                  ? 'text-[#0D9488] dark:text-[#2DD4BF]'
                  : 'text-[#7B8FA1] dark:text-[#8BA3BC]'
              }`}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-[#162642] dark:text-[#F1F6FA]">
              Alertes bureau / arrière-plan
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={alertsEnabled}
            aria-label="Activer les notifications système de fièvre"
            onClick={onToggleAlerts}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
              alertsEnabled ? 'bg-[#0D9488]' : 'bg-[#CBD8E0] dark:bg-[#243E63]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-xs transition-transform ${
                alertsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-xs text-[#647B8C] dark:text-[#94ACC4] leading-relaxed">
          {permissionStatusText}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#115E59]'
                : 'bg-[#FFF7ED] text-[#9A3412] border-[#FED7AA] dark:bg-[#2C1C12] dark:text-[#FDBA74] dark:border-[#7C2D12]'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{soundEnabled ? 'Son actif' : 'Son coupé'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSmartPersistence}
            title="Évite les fausses alertes nocturnes en confirmant la persistance sur 5–10 min"
            className={`min-h-[34px] px-3 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
              smartPersistenceEnabled
                ? 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4] dark:bg-[#0D2B2C] dark:text-[#5EEAD4] dark:border-[#115E59]'
                : 'bg-[#F3F7F9] text-[#647B8C] border-[#DCE7EC] dark:bg-[#162947] dark:text-[#8BA3BC] dark:border-[#243E63]'
            }`}
          >
            {smartPersistenceEnabled ? 'Filtre 5–10 min actif' : 'Alerte immédiate'}
          </button>

          <button
            type="button"
            onClick={onTestAlert}
            className="min-h-[34px] px-3 py-1 text-xs font-semibold text-[#162642] bg-[#F3F7F9] hover:bg-[#E4EDF2] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] rounded-full transition-colors cursor-pointer"
          >
            Tester l&apos;alerte
          </button>
        </div>
      </div>

      {/* Mode Relais Domestique */}
      <div className="pt-3.5 border-t border-[#EDF3F5] dark:border-[#1E3354]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wifi
              className={`w-4 h-4 shrink-0 ${
                profile.homeHubEnabled
                  ? 'text-[#0D9488] dark:text-[#2DD4BF]'
                  : 'text-[#7B8FA1] dark:text-[#8BA3BC]'
              }`}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-[#162642] dark:text-[#F1F6FA]">
              Mode Relais Domestique
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={profile.homeHubEnabled}
            aria-label="Activer ou désactiver le Mode Relais Domestique"
            onClick={onToggleHomeHub}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
              profile.homeHubEnabled ? 'bg-[#0D9488]' : 'bg-[#CBD8E0] dark:bg-[#243E63]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-xs transition-transform ${
                profile.homeHubEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="mt-1.5 text-xs text-[#647B8C] dark:text-[#94ACC4] leading-relaxed">
          Utilisez un ancien téléphone ou une tablette comme passerelle fixe pour suivre la température depuis une autre pièce.
        </p>

        {profile.homeHubEnabled && (
          <div className="mt-2.5 flex items-center justify-between gap-2 text-xs bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] rounded-xl px-3 py-2">
            <label
              htmlFor="hub-select"
              className="font-medium text-[#476074] dark:text-[#94ACC4] whitespace-nowrap"
            >
              Passerelle :
            </label>
            <select
              id="hub-select"
              value={profile.homeHubDeviceName}
              onChange={(e) => onChangeHomeHubDevice(e.target.value)}
              className="text-xs font-semibold text-[#162642] dark:text-[#F1F6FA] dark:bg-[#0B172B] bg-transparent focus:outline-none cursor-pointer"
            >
              {HUB_DEVICES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Connection & Permissions Check */}
      <div className="pt-3 border-t border-[#EDF3F5] dark:border-[#1E3354]">
        <button
          type="button"
          onClick={() => setShowDiagnostic((v) => !v)}
          className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F766E] dark:text-[#5EEAD4] hover:bg-[#F0FDFA] dark:hover:bg-[#0D2B2C] rounded-xl transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Vérification rapide : connexion &amp; autorisations</span>
        </button>

        {showDiagnostic && (
          <div className="mt-2.5 p-3 rounded-2xl bg-[#F7FAFB] border border-[#E6EFF2] dark:bg-[#0B172B] dark:border-[#1E3354] space-y-1.5 text-[11px] text-[#476074] dark:text-[#B0C4D8]">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" aria-hidden="true" />
                Liaison Bluetooth BLE ({profile.deviceId})
              </span>
              <span className="font-mono font-semibold">
                {isOutOfRange ? 'Tampon actif' : isStandby ? 'Veille' : 'OK'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" aria-hidden="true" />
                Dernière connexion connue
              </span>
              <span className="font-mono">{formatTimeFr(profile.lastConnectedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" aria-hidden="true" />
                Optimisation batterie (arrière-plan)
              </span>
              <span className="font-semibold text-[#0F766E] dark:text-[#5EEAD4]">
                Exclue recommandée
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
