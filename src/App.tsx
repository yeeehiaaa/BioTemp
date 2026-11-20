import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, Thermometer, X } from 'lucide-react';
import { AppPage, BottomBar } from './components/BottomBar';
import { ConnectionAndSyncCard } from './components/ConnectionAndSyncCard';
import { DoctorSummaryModal } from './components/DoctorSummaryModal';
import { HardwareSpecsSection } from './components/HardwareSpecsSection';
import { MedicalNotesPanel } from './components/MedicalNotesPanel';
import { PlacementGuideModal } from './components/PlacementGuideModal';
import { PrimaryTempCard } from './components/PrimaryTempCard';
import { ProfileBar } from './components/ProfileBar';
import { ProfilePage } from './components/ProfilePage';
import { buildContextualProTips, ProTipsOverlay } from './components/ProTipsOverlay';
import { ReplaceDeviceModal } from './components/ReplaceDeviceModal';
import { ThermalChart } from './components/ThermalChart';
import { TopBar } from './components/TopBar';
import { createInitialProfiles } from './data/initialProfiles';
import {
  AgeCategory,
  AppLanguage,
  ChildProfile,
  HealthReminderCategory,
  NotePresetCategory,
  PatchReminderHours,
  PersistenceDurationMinutes,
  SamplingIntervalMs,
  TemperatureReading,
  TemperatureUnit,
  TimeWindowHours,
} from './types/biotemp';
import { getStrings } from './utils/i18n';
import {
  formatCurrentTimeHHMM,
  getLocalSunSchedule,
  isTimeInNightWindow,
  NightModePolicy,
  SleepSchedule,
} from './utils/nightMode';
import {
  getNotificationPermissionState,
  NotificationPermissionState,
  playGentleAlertChime,
  requestSystemNotificationPermission,
  sendFeverSystemNotification,
  sendRecoverySystemNotification,
} from './utils/notifications';
import {
  convertTemp,
  evaluateThermalPersistence,
  formatTempFr,
  formatTimeFr,
  inputTempToCelsius,
  tempUnitLabel,
} from './utils/temperature';

const SETTINGS_STORAGE_KEY = 'biotemp_app_settings_v1';

interface StoredAppSettings {
  language: AppLanguage;
  tempUnit: TemperatureUnit;
  manualDarkMode: boolean;
  nightModePolicy: NightModePolicy;
  alertsEnabled: boolean;
  soundEnabled: boolean;
  smartPersistenceEnabled: boolean;
  persistenceDurationMinutes: PersistenceDurationMinutes;
  overrideSilentMode: boolean;
  samplingIntervalMs: SamplingIntervalMs;
  patchReminderHours: PatchReminderHours;
  reduceMotion: boolean;
  autoConfirmIdentity: boolean;
}

const DEFAULT_APP_SETTINGS: StoredAppSettings = {
  language: 'fr',
  tempUnit: 'C',
  manualDarkMode: false,
  nightModePolicy: 'manual',
  alertsEnabled: true,
  soundEnabled: true,
  smartPersistenceEnabled: true,
  persistenceDurationMinutes: 5,
  overrideSilentMode: false,
  samplingIntervalMs: 60000,
  patchReminderHours: 12,
  reduceMotion: false,
  autoConfirmIdentity: false,
};

function loadSavedAppSettings(): StoredAppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<StoredAppSettings>;
    return {
      language: parsed.language === 'ar' ? 'ar' : 'fr',
      tempUnit: parsed.tempUnit === 'F' ? 'F' : 'C',
      manualDarkMode: Boolean(parsed.manualDarkMode),
      nightModePolicy:
        parsed.nightModePolicy === 'sun_schedule' || parsed.nightModePolicy === 'child_sleep'
          ? parsed.nightModePolicy
          : 'manual',
      alertsEnabled: parsed.alertsEnabled !== undefined ? Boolean(parsed.alertsEnabled) : true,
      soundEnabled: parsed.soundEnabled !== undefined ? Boolean(parsed.soundEnabled) : true,
      smartPersistenceEnabled:
        parsed.smartPersistenceEnabled !== undefined
          ? Boolean(parsed.smartPersistenceEnabled)
          : true,
      persistenceDurationMinutes:
        parsed.persistenceDurationMinutes === 8 || parsed.persistenceDurationMinutes === 10
          ? parsed.persistenceDurationMinutes
          : 5,
      overrideSilentMode: Boolean(parsed.overrideSilentMode),
      samplingIntervalMs:
        parsed.samplingIntervalMs === 180000 || parsed.samplingIntervalMs === 300000
          ? parsed.samplingIntervalMs
          : 60000,
      patchReminderHours:
        parsed.patchReminderHours === 18 || parsed.patchReminderHours === 24
          ? parsed.patchReminderHours
          : 12,
      reduceMotion: Boolean(parsed.reduceMotion),
      autoConfirmIdentity: Boolean(parsed.autoConfirmIdentity),
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function nextPhysiologicalTemp(current: number): number {
  const step = (Math.random() - 0.5) * 0.2;
  const next = Math.min(40.2, Math.max(35.8, current + step));
  return Number(next.toFixed(1));
}

const HISTORY_DAYS = [
  { id: 'd-3', dayLabel: 'Lun', dateNum: '16', window: 24 as TimeWindowHours },
  { id: 'd-2', dayLabel: 'Mar', dateNum: '17', window: 24 as TimeWindowHours },
  { id: 'd-1', dayLabel: 'Mer', dateNum: '18', window: 12 as TimeWindowHours },
  { id: 'today', dayLabel: 'Jeu', dateNum: '19', window: 6 as TimeWindowHours },
];

export default function App() {
  const [profiles, setProfiles] = useState<ChildProfile[]>(() => createInitialProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string>('yacine');
  const [activePage, setActivePage] = useState<AppPage>('home');
  const [selectedHistoryDay, setSelectedHistoryDay] = useState<string>('today');
  const [identityConfirmedIds, setIdentityConfirmedIds] = useState<Record<string, boolean>>({
    yacine: true,
    lina: false,
    karim: false,
  });
  const [timeWindow, setTimeWindow] = useState<TimeWindowHours>(12);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPlacementGuideOpen, setIsPlacementGuideOpen] = useState(false);
  const [isProTipsOpen, setIsProTipsOpen] = useState(false);
  const [initialSettings] = useState<StoredAppSettings>(() => loadSavedAppSettings());
  const [language, setLanguage] = useState<AppLanguage>(initialSettings.language);
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>(initialSettings.tempUnit);
  const [manualDarkMode, setManualDarkMode] = useState(initialSettings.manualDarkMode);
  const [nightModePolicy, setNightModePolicy] = useState<NightModePolicy>(
    initialSettings.nightModePolicy
  );
  const [simulateNightTime, setSimulateNightTime] = useState(false);
  const [nowDate, setNowDate] = useState<Date>(() => new Date());
  const [alertsEnabled, setAlertsEnabled] = useState(initialSettings.alertsEnabled);
  const [soundEnabled, setSoundEnabled] = useState(initialSettings.soundEnabled);
  const [smartPersistenceEnabled, setSmartPersistenceEnabled] = useState(
    initialSettings.smartPersistenceEnabled
  );
  const [persistenceDurationMinutes, setPersistenceDurationMinutes] =
    useState<PersistenceDurationMinutes>(initialSettings.persistenceDurationMinutes);
  const [overrideSilentMode, setOverrideSilentMode] = useState(
    initialSettings.overrideSilentMode
  );
  const [samplingIntervalMs, setSamplingIntervalMs] = useState<SamplingIntervalMs>(
    initialSettings.samplingIntervalMs
  );
  const [patchReminderHours, setPatchReminderHours] = useState<PatchReminderHours>(
    initialSettings.patchReminderHours
  );
  const [reduceMotion, setReduceMotion] = useState(initialSettings.reduceMotion);
  const [autoConfirmIdentity, setAutoConfirmIdentity] = useState(
    initialSettings.autoConfirmIdentity
  );
  const [isSyncingBuffer, setIsSyncingBuffer] = useState(false);
  const [sessionEndReminder, setSessionEndReminder] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>(() => getNotificationPermissionState());
  const [activeFeverAlert, setActiveFeverAlert] = useState<{
    profileId: string;
    profileName: string;
    value: number;
    threshold: number;
    deviceId: string;
    durationMinutes: number;
    timestamp: number;
    systemDispatched: boolean;
  } | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<{
    profileId: string;
    profileName: string;
    timestamp: number;
  } | null>(null);
  const [showBannerRefInput, setShowBannerRefInput] = useState(false);
  const [bannerRefValue, setBannerRefValue] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastNotifiedTempRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? profiles[0],
    [profiles, activeProfileId]
  );

  const sunSchedule = useMemo(() => getLocalSunSchedule(nowDate), [nowDate]);
  const effectiveMinutes = simulateNightTime
    ? 22 * 60 + 30
    : nowDate.getHours() * 60 + nowDate.getMinutes();
  const currentTimeLabel = simulateNightTime ? '22:30' : formatCurrentTimeHHMM(nowDate);

  const isDarkMode = useMemo(() => {
    if (nightModePolicy === 'sun_schedule') {
      return isTimeInNightWindow(effectiveMinutes, sunSchedule.sunset, sunSchedule.sunrise);
    }
    if (nightModePolicy === 'child_sleep') {
      return isTimeInNightWindow(
        effectiveMinutes,
        activeProfile.sleepSchedule.bedTime,
        activeProfile.sleepSchedule.wakeTime
      );
    }
    return manualDarkMode;
  }, [
    nightModePolicy,
    effectiveMinutes,
    sunSchedule.sunset,
    sunSchedule.sunrise,
    activeProfile.sleepSchedule.bedTime,
    activeProfile.sleepSchedule.wakeTime,
    manualDarkMode,
  ]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    try {
      const payload: StoredAppSettings = {
        language,
        tempUnit,
        manualDarkMode,
        nightModePolicy,
        alertsEnabled,
        soundEnabled,
        smartPersistenceEnabled,
        persistenceDurationMinutes,
        overrideSilentMode,
        samplingIntervalMs,
        patchReminderHours,
        reduceMotion,
        autoConfirmIdentity,
      };
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    language,
    tempUnit,
    manualDarkMode,
    nightModePolicy,
    alertsEnabled,
    soundEnabled,
    smartPersistenceEnabled,
    persistenceDurationMinutes,
    overrideSilentMode,
    samplingIntervalMs,
    patchReminderHours,
    reduceMotion,
    autoConfirmIdentity,
  ]);

  useEffect(() => {
    if (activeFeverAlert) {
      document.title = `⚠ ${formatTempFr(activeFeverAlert.value, tempUnit, language)} ${tempUnitLabel(
        tempUnit
      )} — ${activeFeverAlert.profileName} | BioTemp`;
    } else {
      document.title = 'BioTemp — Surveillance Thermique Continue';
    }
  }, [activeFeverAlert, tempUnit, language]);

  const updateActiveProfile = (updater: (profile: ChildProfile) => ChildProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfile.id ? updater(p) : p))
    );
  };

  const triggerFeverAlert = useCallback(
    (
      profile: ChildProfile,
      temperature: number,
      durationMinutes: number,
      force = false
    ) => {
      if (!alertsEnabled && !force) return;

      const systemDispatched = sendFeverSystemNotification({
        profileId: profile.id,
        profileName: profile.name,
        temperature,
        threshold: profile.threshold,
        deviceId: profile.deviceId,
        language,
        tempUnit,
        durationMinutes,
        onSelectProfile: () => {
          setActiveProfileId(profile.id);
          setActivePage('home');
        },
      });

      if (soundEnabled || overrideSilentMode) {
        playGentleAlertChime(overrideSilentMode);
      }

      lastNotifiedTempRef.current[profile.id] = temperature;
      setRecoveryNotice(null);
      setActiveFeverAlert({
        profileId: profile.id,
        profileName: profile.name,
        value: temperature,
        threshold: profile.threshold,
        deviceId: profile.deviceId,
        durationMinutes,
        timestamp: Date.now(),
        systemDispatched,
      });
    },
    [alertsEnabled, soundEnabled, overrideSilentMode, language, tempUnit]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== activeProfileId) return p;
          if (p.connectionMode === 'standby_removed') return p;

          if (p.connectionMode === 'out_of_range') {
            const lastBuffered =
              p.bufferedReadings[p.bufferedReadings.length - 1] ??
              p.readings[p.readings.length - 1];
            const baseVal = lastBuffered ? lastBuffered.value : 37.2;
            const newBuffered: TemperatureReading = {
              id: `${p.id}-buf-${Date.now()}`,
              timestamp: Date.now(),
              value: nextPhysiologicalTemp(baseVal),
              source: 'buffered_sync',
            };
            return {
              ...p,
              bufferedReadings: [...p.bufferedReadings, newBuffered],
            };
          }

          const latest = p.readings[p.readings.length - 1];
          const baseVal = latest ? latest.value : 37.0;
          const nextVal = nextPhysiologicalTemp(baseVal);
          const nowTs = Date.now();
          const newPoint: TemperatureReading = {
            id: `${p.id}-live-${nowTs}`,
            timestamp: nowTs,
            value: nextVal,
            source: p.connectionMode === 'home_hub_relayed' ? 'home_hub' : 'live',
          };

          const updatedReadings = [...p.readings, newPoint];
          const persistenceEval = evaluateThermalPersistence(
            updatedReadings,
            p.threshold,
            persistenceDurationMinutes,
            smartPersistenceEnabled,
            p.stabilizingUntil
          );

          if (persistenceEval.phase === 'confirmed_alert') {
            const lastNotified = lastNotifiedTempRef.current[p.id];
            const shouldFire =
              lastNotified === undefined || nextVal >= lastNotified + 0.2;

            if (shouldFire) {
              triggerFeverAlert(p, nextVal, persistenceEval.elapsedMinutes);
            }
          } else if (nextVal < Number((p.threshold - 0.3).toFixed(1))) {
            if (lastNotifiedTempRef.current[p.id] !== undefined) {
              delete lastNotifiedTempRef.current[p.id];
              setActiveFeverAlert((curr) => (curr?.profileId === p.id ? null : curr));
              setRecoveryNotice({
                profileId: p.id,
                profileName: p.name,
                timestamp: nowTs,
              });
              if (alertsEnabled) {
                sendRecoverySystemNotification({
                  profileId: p.id,
                  profileName: p.name,
                  language,
                  onSelectProfile: () => {
                    setActiveProfileId(p.id);
                    setActivePage('home');
                  },
                });
              }
            }
          }

          return {
            ...p,
            lastConnectedAt: nowTs,
            readings: updatedReadings,
          };
        })
      );
    }, samplingIntervalMs);

    return () => clearInterval(interval);
  }, [
    activeProfileId,
    alertsEnabled,
    language,
    smartPersistenceEnabled,
    persistenceDurationMinutes,
    samplingIntervalMs,
    triggerFeverAlert,
  ]);

  const handleSelectPage = (page: AppPage) => {
    setActivePage(page);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    if (autoConfirmIdentity) {
      setIdentityConfirmedIds((prev) => ({ ...prev, [id]: true }));
    }
  };

  const handleConfirmIdentity = (profileId: string = activeProfile.id) => {
    setIdentityConfirmedIds((prev) => ({ ...prev, [profileId]: true }));
  };

  const handleAdjustThreshold = (delta: number) => {
    updateActiveProfile((p) => ({
      ...p,
      threshold: Number(Math.min(40.0, Math.max(37.2, p.threshold + delta)).toFixed(1)),
    }));
  };

  const pushImmediateReading = (value: number, source: TemperatureReading['source']) => {
    updateActiveProfile((p) => {
      const nowTs = Date.now();
      const point: TemperatureReading = {
        id: `${p.id}-sim-${nowTs}`,
        timestamp: nowTs,
        value: Number(value.toFixed(1)),
        source: p.connectionMode === 'out_of_range' ? 'buffered_sync' : source,
      };
      if (p.connectionMode === 'out_of_range') {
        return {
          ...p,
          bufferedReadings: [...p.bufferedReadings, point],
        };
      }
      return {
        ...p,
        lastConnectedAt: nowTs,
        readings: [...p.readings, point],
      };
    });
  };

  const handleRequestNotificationPermission = async () => {
    const res = await requestSystemNotificationPermission();
    setNotificationPermission(res);
  };

  const handleResetAppSettings = () => {
    setLanguage(DEFAULT_APP_SETTINGS.language);
    setTempUnit(DEFAULT_APP_SETTINGS.tempUnit);
    setManualDarkMode(DEFAULT_APP_SETTINGS.manualDarkMode);
    setNightModePolicy(DEFAULT_APP_SETTINGS.nightModePolicy);
    setSimulateNightTime(false);
    setAlertsEnabled(DEFAULT_APP_SETTINGS.alertsEnabled);
    setSoundEnabled(DEFAULT_APP_SETTINGS.soundEnabled);
    setSmartPersistenceEnabled(DEFAULT_APP_SETTINGS.smartPersistenceEnabled);
    setPersistenceDurationMinutes(DEFAULT_APP_SETTINGS.persistenceDurationMinutes);
    setOverrideSilentMode(DEFAULT_APP_SETTINGS.overrideSilentMode);
    setSamplingIntervalMs(DEFAULT_APP_SETTINGS.samplingIntervalMs);
    setPatchReminderHours(DEFAULT_APP_SETTINGS.patchReminderHours);
    setReduceMotion(DEFAULT_APP_SETTINGS.reduceMotion);
    setAutoConfirmIdentity(DEFAULT_APP_SETTINGS.autoConfirmIdentity);
    try {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleToggleAlerts = async () => {
    if (!alertsEnabled) {
      setAlertsEnabled(true);
      if (notificationPermission === 'default') {
        const res = await requestSystemNotificationPermission();
        setNotificationPermission(res);
      }
      return;
    }

    if (notificationPermission === 'default') {
      const res = await requestSystemNotificationPermission();
      setNotificationPermission(res);
      return;
    }

    setAlertsEnabled(false);
    setActiveFeverAlert(null);
  };

  const handleTestAlert = async () => {
    let currentPerm = notificationPermission;
    if (currentPerm === 'default') {
      currentPerm = await requestSystemNotificationPermission();
      setNotificationPermission(currentPerm);
    }
    setAlertsEnabled(true);
    const sampleTemp = Number((activeProfile.threshold + 0.3).toFixed(1));
    triggerFeverAlert(activeProfile, sampleTemp, persistenceDurationMinutes, true);
  };

  const handleSimulateFeverSpike = () => {
    const spikeValue = Number((activeProfile.threshold + 0.5).toFixed(1));
    const currentLatest = activeProfile.readings[activeProfile.readings.length - 1];
    const alreadyAbove = Boolean(currentLatest && currentLatest.value >= activeProfile.threshold);

    if (!smartPersistenceEnabled || alreadyAbove) {
      const startTs = Date.now() - persistenceDurationMinutes * 60 * 1000;
      const nowTs = Date.now();
      updateActiveProfile((p) => {
        const streakStart: TemperatureReading = {
          id: `${p.id}-sim-start-${nowTs}`,
          timestamp: startTs,
          value: Number((p.threshold + 0.2).toFixed(1)),
          source: 'simulated',
        };
        const streakEnd: TemperatureReading = {
          id: `${p.id}-sim-${nowTs}`,
          timestamp: nowTs,
          value: spikeValue,
          source: 'simulated',
        };
        return {
          ...p,
          lastConnectedAt: nowTs,
          readings: [...p.readings, streakStart, streakEnd].sort(
            (a, b) => a.timestamp - b.timestamp
          ),
        };
      });
      if (
        activeProfile.connectionMode !== 'out_of_range' &&
        activeProfile.connectionMode !== 'standby_removed'
      ) {
        triggerFeverAlert(activeProfile, spikeValue, persistenceDurationMinutes);
      }
    } else {
      // First spike reading enters calm persistence verification without sudden alarm
      pushImmediateReading(spikeValue, 'simulated');
    }
  };

  const handleSimulateNormalReturn = () => {
    const hadAlert =
      lastNotifiedTempRef.current[activeProfile.id] !== undefined ||
      activeFeverAlert?.profileId === activeProfile.id;
    updateActiveProfile((p) => ({
      ...p,
      stabilizingUntil: undefined,
      lastConnectedAt: Date.now(),
      readings: [
        ...p.readings,
        {
          id: `${p.id}-sim-${Date.now()}`,
          timestamp: Date.now(),
          value: 37.1,
          source: 'simulated',
        },
      ],
    }));
    delete lastNotifiedTempRef.current[activeProfile.id];
    if (activeFeverAlert?.profileId === activeProfile.id) {
      setActiveFeverAlert(null);
    }
    if (hadAlert) {
      setRecoveryNotice({
        profileId: activeProfile.id,
        profileName: activeProfile.name,
        timestamp: Date.now(),
      });
      if (alertsEnabled) {
        sendRecoverySystemNotification({
          profileId: activeProfile.id,
          profileName: activeProfile.name,
          language,
        });
      }
    }
  };

  const handleTriggerInstantReading = () => {
    const latest =
      activeProfile.bufferedReadings[activeProfile.bufferedReadings.length - 1] ??
      activeProfile.readings[activeProfile.readings.length - 1];
    const base = latest ? latest.value : 37.2;
    const nextVal = nextPhysiologicalTemp(base);
    updateActiveProfile((p) => {
      const nowTs = Date.now();
      const point: TemperatureReading = {
        id: `${p.id}-sim-${nowTs}`,
        timestamp: nowTs,
        value: nextVal,
        source: p.connectionMode === 'out_of_range' ? 'buffered_sync' : 'live',
      };
      if (p.connectionMode === 'out_of_range') {
        return {
          ...p,
          bufferedReadings: [...p.bufferedReadings, point],
        };
      }
      return {
        ...p,
        stabilizingUntil: undefined,
        lastConnectedAt: nowTs,
        readings: [...p.readings, point],
      };
    });
    if (
      activeProfile.connectionMode !== 'out_of_range' &&
      activeProfile.connectionMode !== 'standby_removed'
    ) {
      const simulatedList: TemperatureReading[] = [
        ...activeProfile.readings,
        {
          id: 'check',
          timestamp: Date.now(),
          value: nextVal,
          source: 'live',
        },
      ];
      const evalRes = evaluateThermalPersistence(
        simulatedList,
        activeProfile.threshold,
        persistenceDurationMinutes,
        smartPersistenceEnabled
      );
      if (evalRes.phase === 'confirmed_alert') {
        triggerFeverAlert(activeProfile, nextVal, evalRes.elapsedMinutes);
      }
    }
  };

  const handleSimulateOutOfRange = () => {
    updateActiveProfile((p) => {
      const latest = p.readings[p.readings.length - 1];
      const initialBuffered: TemperatureReading = {
        id: `${p.id}-buf-${Date.now()}`,
        timestamp: Date.now(),
        value: nextPhysiologicalTemp(latest ? latest.value : 37.3),
        source: 'buffered_sync',
      };
      return {
        ...p,
        connectionMode: 'out_of_range',
        lastSyncNotice: null,
        bufferedReadings: [...p.bufferedReadings, initialBuffered],
      };
    });
  };

  const handleSimulateSkinRemoval = () => {
    updateActiveProfile((p) => ({
      ...p,
      connectionMode: 'standby_removed',
      stabilizingUntil: undefined,
      lastSyncNotice:
        language === 'ar'
          ? 'هل انتهت جلسة المراقبة؟ يبدو أن القطعة غير مثبتة على الجلد حالياً. اضغط لإنهاء الجلسة وتوفير البطارية.'
          : 'Session terminée ? Le module ne semble plus posé sur la peau. Appuyez pour clôturer la session et économiser la batterie.',
    }));
    if (activeFeverAlert?.profileId === activeProfile.id) {
      setActiveFeverAlert(null);
    }
  };

  const handleEndSession = () => {
    const latest = activeProfile.readings[activeProfile.readings.length - 1];
    updateActiveProfile((p) => ({
      ...p,
      connectionMode: 'standby_removed',
      stabilizingUntil: undefined,
      notes: [
        ...p.notes,
        {
          id: `${p.id}-end-${Date.now()}`,
          timestamp: Date.now(),
          category: 'Session clôturée',
          text:
            language === 'ar'
              ? `تم إنهاء الجلسة. البطارية المتبقية: ${p.battery} %.`
              : `Session clôturée. Batterie restante : ${p.battery} %.`,
          temperatureAtTime: latest ? latest.value : 37.0,
        },
      ],
    }));
    setSessionEndReminder(getStrings(language).deviceCopy.sessionSavedCharge);
    if (activeFeverAlert?.profileId === activeProfile.id) {
      setActiveFeverAlert(null);
    }
  };

  const handleResumeSession = () => {
    setSessionEndReminder(null);
    updateActiveProfile((p) => ({
      ...p,
      connectionMode: p.homeHubEnabled ? 'home_hub_relayed' : 'ble_connected',
      lastConnectedAt: Date.now(),
      stabilizingUntil: Date.now() + 2 * 60 * 1000,
      lastSyncNotice:
        language === 'ar'
          ? 'جاري تثبيت القراءة... يرجى الانتظار دقيقتين لاستقرار المستشعر.'
          : 'Stabilisation de la mesure... Veuillez patienter 2 minutes.',
    }));
  };

  const handleAddManualBufferedPoint = () => {
    updateActiveProfile((p) => {
      const last =
        p.bufferedReadings[p.bufferedReadings.length - 1] ??
        p.readings[p.readings.length - 1];
      const pt: TemperatureReading = {
        id: `${p.id}-buf-${Date.now()}`,
        timestamp: Date.now(),
        value: nextPhysiologicalTemp(last ? last.value : 37.4),
        source: 'buffered_sync',
      };
      return {
        ...p,
        bufferedReadings: [...p.bufferedReadings, pt],
      };
    });
  };

  const handleReconnectAndSync = () => {
    const targetId = activeProfile.id;
    const maxBuffered = activeProfile.bufferedReadings.reduce(
      (max, r) => Math.max(max, r.value),
      0
    );

    setIsSyncingBuffer(true);

    setTimeout(() => {
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== targetId) return p;
          const count = p.bufferedReadings.length;
          const merged = [...p.readings, ...p.bufferedReadings].sort(
            (a, b) => a.timestamp - b.timestamp
          );
          const nextMode = p.homeHubEnabled ? 'home_hub_relayed' : 'ble_connected';
          const notice =
            count > 0
              ? language === 'ar'
                ? `تمت المزامنة بنجاح ✓ : أُضيفت ${count} قراءات محفوظة من ذاكرة الجهاز إلى منحنى ${p.name}.`
                : `Synchronisation réussie ✓ : ${count} mesures enregistrées ont été ajoutées à la courbe de ${p.name}.`
              : language === 'ar'
              ? 'تمت استعادة الاتصال : البث المستمر نشط.'
              : 'Connexion rétablie : flux continu actif.';

          return {
            ...p,
            connectionMode: nextMode,
            lastConnectedAt: Date.now(),
            readings: merged,
            bufferedReadings: [],
            lastSyncNotice: notice,
          };
        })
      );

      setIsSyncingBuffer(false);
      if (maxBuffered >= activeProfile.threshold) {
        triggerFeverAlert(
          activeProfile,
          maxBuffered,
          persistenceDurationMinutes
        );
      }
    }, 800);
  };

  const handleToggleHomeHub = () => {
    updateActiveProfile((p) => {
      const nextEnabled = !p.homeHubEnabled;
      const nextMode =
        p.connectionMode === 'out_of_range' || p.connectionMode === 'standby_removed'
          ? p.connectionMode
          : nextEnabled
          ? 'home_hub_relayed'
          : 'ble_connected';
      return {
        ...p,
        homeHubEnabled: nextEnabled,
        connectionMode: nextMode,
      };
    });
  };

  const handleChangeHomeHubDevice = (deviceName: string) => {
    updateActiveProfile((p) => ({
      ...p,
      homeHubDeviceName: deviceName,
    }));
  };

  const handleDismissSyncNotice = () => {
    updateActiveProfile((p) => ({
      ...p,
      lastSyncNotice: null,
    }));
  };

  const handleAddNote = (
    category: NotePresetCategory,
    text: string,
    referenceTempC?: number
  ) => {
    updateActiveProfile((p) => {
      const latest = p.readings[p.readings.length - 1];
      const temp = latest ? latest.value : 37.0;
      return {
        ...p,
        notes: [
          ...p.notes,
          {
            id: `${p.id}-note-${Date.now()}`,
            timestamp: Date.now(),
            category,
            text,
            temperatureAtTime: temp,
            ...(typeof referenceTempC === 'number' ? { referenceTemp: referenceTempC } : {}),
          },
        ],
      };
    });
  };

  const handleDeleteNote = (noteId: string) => {
    updateActiveProfile((p) => ({
      ...p,
      notes: p.notes.filter((n) => n.id !== noteId),
    }));
  };

  const handleConfirmReplaceDevice = (
    newDeviceId: string,
    newDeviceName: string,
    newPatchLabel: string
  ) => {
    updateActiveProfile((p) => {
      const oldId = p.deviceId;
      const latest = p.readings[p.readings.length - 1];
      return {
        ...p,
        deviceId: newDeviceId,
        deviceName: newDeviceName,
        patchLabel: newPatchLabel,
        battery: 96,
        lastConnectedAt: Date.now(),
        notes: [
          ...p.notes,
          {
            id: `${p.id}-swap-${Date.now()}`,
            timestamp: Date.now(),
            category: 'Changement de module',
            text: `Module remplacé : ${oldId} → ${newDeviceName} (${newDeviceId}, ${newPatchLabel}). Historique complet conservé.`,
            temperatureAtTime: latest ? latest.value : 37.0,
          },
        ],
      };
    });
    setIdentityConfirmedIds((prev) => ({ ...prev, [activeProfile.id]: true }));
  };

  const handleResetPatchTimer = () => {
    updateActiveProfile((p) => ({
      ...p,
      patchAppliedAt: Date.now(),
      lastSyncNotice: `Nouveau patch posé pour ${p.name} (rappel de changement dans 12–24 h).`,
    }));
  };

  const handleReassignRecentSegment = (fromProfileId: string, toProfileId: string) => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    setProfiles((prev) => {
      const source = prev.find((p) => p.id === fromProfileId);
      if (!source) return prev;
      const moved = source.readings.filter((r) => r.timestamp >= cutoff);
      const kept = source.readings.filter((r) => r.timestamp < cutoff);
      if (moved.length === 0) return prev;

      return prev.map((p) => {
        if (p.id === fromProfileId) {
          return {
            ...p,
            readings: kept.length > 0 ? kept : source.readings.slice(0, 1),
          };
        }
        if (p.id === toProfileId) {
          return {
            ...p,
            readings: [...p.readings, ...moved].sort((a, b) => a.timestamp - b.timestamp),
          };
        }
        return p;
      });
    });
  };

  const handleCreateProfile = (payload: {
    name: string;
    ageCategory: AgeCategory;
    deviceId: string;
    deviceName: string;
    threshold: number;
  }) => {
    const id = `${payload.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    const ageLabel =
      payload.ageCategory === 'newborn'
        ? 'Nouveau-né (< 3 mois)'
        : payload.ageCategory === 'infant'
        ? 'Nourrisson 3–24 mois'
        : payload.ageCategory === 'child'
        ? 'Enfant 2–5 ans'
        : 'Adulte +5 ans';
    const patchLabel =
      payload.ageCategory === 'newborn' || payload.ageCategory === 'infant'
        ? 'Patch Nourrisson (0–24 mois)'
        : payload.ageCategory === 'child'
        ? 'Patch Enfant (2–5 ans)'
        : 'Patch Confort (+5 ans)';

    const now = Date.now();
    const newProfile: ChildProfile = {
      id,
      name: payload.name,
      initials: payload.name.slice(0, 2).toUpperCase(),
      ageLabel,
      ageCategory: payload.ageCategory,
      patchLabel,
      patchAppliedAt: now,
      deviceId: payload.deviceId,
      deviceName: payload.deviceName,
      battery: 100,
      threshold: payload.threshold,
      connectionMode: 'ble_connected',
      homeHubEnabled: false,
      homeHubDeviceName: 'iPad Chambre',
      lastConnectedAt: now,
      bufferedReadings: [],
      lastSyncNotice: null,
      readings: [
        { id: `${id}-r-1`, timestamp: now - 60 * 60 * 1000, value: 36.9, source: 'live' },
        { id: `${id}-r-2`, timestamp: now - 30 * 60 * 1000, value: 37.0, source: 'live' },
        { id: `${id}-r-3`, timestamp: now, value: 37.0, source: 'live' },
      ],
      notes: [],
      vaccinations: [],
      healthReminders: [],
      sleepSchedule: {
        bedTime:
          payload.ageCategory === 'newborn' || payload.ageCategory === 'infant'
            ? '19:30'
            : payload.ageCategory === 'child'
            ? '20:30'
            : '22:30',
        wakeTime: '07:15',
      },
    };

    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(id);
    setIdentityConfirmedIds((prev) => ({ ...prev, [id]: true }));
  };

  const handleUpdateSleepSchedule = (profileId: string, schedule: SleepSchedule) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, sleepSchedule: schedule } : p))
    );
  };

  const handleToggleDarkMode = () => {
    setNightModePolicy('manual');
    setSimulateNightTime(false);
    setManualDarkMode(!isDarkMode);
  };

  const handleAddVaccination = (
    profileId: string,
    payload: {
      vaccineName: string;
      administeredDate: string;
      nextDueDate?: string;
      lotOrNote?: string;
    }
  ) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? {
              ...p,
              vaccinations: [
                ...p.vaccinations,
                {
                  id: `${profileId}-vac-${Date.now()}`,
                  ...payload,
                },
              ],
            }
          : p
      )
    );
  };

  const handleDeleteVaccination = (profileId: string, vaccinationId: string) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? {
              ...p,
              vaccinations: p.vaccinations.filter((v) => v.id !== vaccinationId),
            }
          : p
      )
    );
  };

  const handleAddHealthReminder = (
    profileId: string,
    payload: {
      title: string;
      dueDate: string;
      time?: string;
      category: HealthReminderCategory;
      notes?: string;
    }
  ) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? {
              ...p,
              healthReminders: [
                ...p.healthReminders,
                {
                  id: `${profileId}-rem-${Date.now()}`,
                  ...payload,
                  completed: false,
                },
              ],
            }
          : p
      )
    );
  };

  const handleToggleHealthReminder = (profileId: string, reminderId: string) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? {
              ...p,
              healthReminders: p.healthReminders.map((r) =>
                r.id === reminderId ? { ...r, completed: !r.completed } : r
              ),
            }
          : p
      )
    );
  };

  const handleDeleteHealthReminder = (profileId: string, reminderId: string) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? {
              ...p,
              healthReminders: p.healthReminders.filter((r) => r.id !== reminderId),
            }
          : p
      )
    );
  };

  const latestReading = activeProfile.readings[activeProfile.readings.length - 1];
  const currentTemp = latestReading ? latestReading.value : 37.0;

  const contextualTipsMeta = useMemo(() => {
    const noop = () => {};
    const list = buildContextualProTips({
      profile: activeProfile,
      identityConfirmed: Boolean(identityConfirmedIds[activeProfile.id]),
      soundEnabled,
      alertsEnabled,
      notificationPermission,
      onClose: noop,
      onNavigate: noop,
      onReconnectAndSync: noop,
      onResumeSession: noop,
      onResetPatchTimer: noop,
      onConfirmIdentity: noop,
      onToggleSound: noop,
      onTestAlert: noop,
      onQuickNote: noop,
      onOpenPlacementGuide: noop,
      onOpenReport: noop,
    });
    const urgentCount = list.filter((t) => t.priority === 'urgent').length;
    const actionableCount = list.filter((t) => t.priority !== 'info').length;
    return {
      actionableCount,
      hasUrgent: urgentCount > 0,
    };
  }, [
    activeProfile,
    identityConfirmedIds,
    soundEnabled,
    alertsEnabled,
    notificationPermission,
  ]);

  const strings = getStrings(language);

  return (
    <div className="h-dvh w-full overflow-hidden flex flex-col bg-gradient-to-br from-[#ECF4F6] via-[#F5F9FA] to-[#EDF4F4] dark:from-[#07101F] dark:via-[#0A1628] dark:to-[#081322] text-[#162642] dark:text-[#F1F6FA] transition-colors print:h-auto print:overflow-visible">
      <TopBar
        language={language}
        activePage={activePage}
        isDarkMode={isDarkMode}
        nightModePolicy={nightModePolicy}
        profiles={profiles}
        activeProfile={activeProfile}
        sunSchedule={sunSchedule}
        currentTimeLabel={currentTimeLabel}
        simulateNightTime={simulateNightTime}
        proTipsCount={contextualTipsMeta.actionableCount}
        hasUrgentTip={contextualTipsMeta.hasUrgent}
        onToggleDarkMode={handleToggleDarkMode}
        onChangeNightPolicy={(policy) => {
          setNightModePolicy(policy);
          if (policy === 'manual') setSimulateNightTime(false);
        }}
        onUpdateSleepSchedule={handleUpdateSleepSchedule}
        onToggleSimulateNightTime={() => setSimulateNightTime((v) => !v)}
        onSelectPage={handleSelectPage}
        onOpenProTips={() => setIsProTipsOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden print:overflow-visible"
      >
        <main className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
          {activeFeverAlert && (
            <div
              role="status"
              className="rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] dark:bg-[#2F1320] dark:border-[#881337] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E11D48] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <BellRing className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#9F1239] dark:text-[#FDA4AF]">
                    {strings.alertsBanner.sustainedPrefix} {activeFeverAlert.profileName} ·{' '}
                    <span className="font-mono">
                      {formatTempFr(activeFeverAlert.value, tempUnit, language)}{' '}
                      {tempUnitLabel(tempUnit)}
                    </span>
                  </p>
                  <p className="text-xs text-[#881337] dark:text-[#FECDD3] mt-0.5 leading-relaxed">
                    {strings.alertsBanner.sustainedBody.replace(
                      '{temp}',
                      `${formatTempFr(activeFeverAlert.threshold, tempUnit, language)} ${tempUnitLabel(tempUnit)}`
                    )}{' '}
                    <span className="font-mono opacity-80">
                      ({formatTimeFr(activeFeverAlert.timestamp, language)})
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                {activeFeverAlert.profileId !== activeProfile.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProfileId(activeFeverAlert.profileId);
                      setActivePage('home');
                    }}
                    className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-full cursor-pointer"
                  >
                    {strings.alertsBanner.viewProfile} {activeFeverAlert.profileName}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setBannerRefValue(String(convertTemp(activeFeverAlert.value, tempUnit)));
                    setShowBannerRefInput((v) => !v);
                  }}
                  className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#162642] bg-white hover:bg-[#FFE4E6] border border-[#FECDD3] dark:text-[#FDE68A] dark:bg-[#1E0D15] dark:hover:bg-[#3B1828] dark:border-[#881337] rounded-full cursor-pointer"
                >
                  <Thermometer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {strings.alertsBanner.quickActionRef} ({tempUnitLabel(tempUnit)})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddNote(
                      'Antipyrétique administré',
                      language === 'ar'
                        ? 'أُعطي خافض حرارة وفق الجرعة المناسبة.'
                        : 'Antipyrétique administré selon la posologie adaptée.'
                    );
                    setActiveFeverAlert(null);
                    setShowBannerRefInput(false);
                  }}
                  className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-white bg-[#162642] hover:bg-[#1E3356] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] rounded-full cursor-pointer"
                >
                  {strings.alertsBanner.quickActionNote}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFeverAlert(null);
                    setShowBannerRefInput(false);
                  }}
                  className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#9F1239] bg-white hover:bg-[#FFE4E6] border border-[#FECDD3] dark:text-[#FDA4AF] dark:bg-[#1E0D15] dark:hover:bg-[#3B1828] dark:border-[#881337] rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{strings.alertsBanner.acknowledge}</span>
                </button>
              </div>
            </div>
          )}

          {activeFeverAlert && showBannerRefInput && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsed = Number(bannerRefValue.replace(',', '.'));
                if (!Number.isFinite(parsed)) return;
                const refC = inputTempToCelsius(parsed, tempUnit);
                const unitLbl = tempUnitLabel(tempUnit);
                const formattedRef = `${formatTempFr(refC, tempUnit, language)} ${unitLbl}`;
                const formattedSensor = `${formatTempFr(
                  activeFeverAlert.value,
                  tempUnit,
                  language
                )} ${unitLbl}`;
                handleAddNote(
                  'Mesure de référence',
                  language === 'ar'
                    ? `القياس المرجعي: ${formattedRef} (مقابل ${formattedSensor} على المستشعر)`
                    : `Thermomètre de référence : ${formattedRef} (vs capteur ${formattedSensor})`,
                  refC
                );
                setShowBannerRefInput(false);
              }}
              className="rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] dark:bg-[#1E1B4B] dark:border-[#3730A3] px-4 py-2.5 flex flex-wrap items-center gap-2.5 text-xs"
            >
              <label
                htmlFor="banner-ref-input"
                className="font-semibold text-[#312E81] dark:text-[#C7D2FE]"
              >
                {strings.primaryCard.refTempInputLabel} ({tempUnitLabel(tempUnit)}) :
              </label>
              <input
                id="banner-ref-input"
                type="number"
                step="0.1"
                min={tempUnit === 'F' ? 93 : 34}
                max={tempUnit === 'F' ? 110 : 43}
                value={bannerRefValue}
                onChange={(e) => setBannerRefValue(e.target.value)}
                required
                className="w-24 min-h-[34px] px-2.5 py-1 rounded-lg font-mono font-bold bg-white text-[#162642] border border-[#C7D2FE] dark:bg-[#132544] dark:text-[#F1F6FA] dark:border-[#4338CA]"
              />
              <button
                type="submit"
                className="min-h-[34px] px-3.5 py-1 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-semibold cursor-pointer"
              >
                {strings.primaryCard.refTempSaveBtn}
              </button>
              <button
                type="button"
                onClick={() => setShowBannerRefInput(false)}
                className="min-h-[34px] px-2 font-medium text-[#4338CA] dark:text-[#A5B4FC] cursor-pointer"
              >
                {strings.primaryCard.refTempCancelBtn}
              </button>
            </form>
          )}

          {recoveryNotice && !activeFeverAlert && (
            <div
              role="status"
              className="rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] dark:bg-[#0D2B2C] dark:border-[#115E59] px-4 py-3 flex items-center justify-between gap-3 text-xs text-[#0F766E] dark:text-[#5EEAD4]"
            >
              <span className="font-medium leading-relaxed">
                <strong>{strings.alertsBanner.recoveryTitle}</strong>{' '}
                {strings.alertsBanner.recoveryBody.replace('{name}', recoveryNotice.profileName)}
              </span>
              <button
                type="button"
                onClick={() => setRecoveryNotice(null)}
                className="font-bold px-2 py-1 rounded cursor-pointer shrink-0"
              >
                {strings.alertsBanner.acknowledge}
              </button>
            </div>
          )}

          {sessionEndReminder && (
            <div
              role="status"
              className="rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] dark:bg-[#0D2B2C] dark:border-[#115E59] px-4 py-3 flex items-center justify-between gap-3 text-xs text-[#0F766E] dark:text-[#5EEAD4]"
            >
              <span className="font-medium leading-relaxed">{sessionEndReminder}</span>
              <button
                type="button"
                onClick={() => setSessionEndReminder(null)}
                className="font-bold px-2 py-1 rounded cursor-pointer shrink-0"
              >
                OK
              </button>
            </div>
          )}

          {/* Shared Quick Profile Switcher on Home, History & Device pages */}
          {activePage !== 'profile' && (
            <ProfileBar
              language={language}
              profiles={profiles}
              activeProfile={activeProfile}
              identityConfirmed={Boolean(identityConfirmedIds[activeProfile.id])}
              onSelectProfile={handleSelectProfile}
              onConfirmIdentity={() => handleConfirmIdentity(activeProfile.id)}
            />
          )}

          {/* PAGE 1: HOME (Accueil) — Focused 2-card view */}
          {activePage === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 flex flex-col [&>*]:flex-1">
                <PrimaryTempCard
                  language={language}
                  tempUnit={tempUnit}
                  profile={activeProfile}
                  alertsEnabled={alertsEnabled}
                  soundEnabled={soundEnabled}
                  smartPersistenceEnabled={smartPersistenceEnabled}
                  persistenceDurationMinutes={persistenceDurationMinutes}
                  overrideSilentMode={overrideSilentMode}
                  notificationPermission={notificationPermission}
                  onToggleAlerts={handleToggleAlerts}
                  onResumeSession={handleResumeSession}
                  onAdjustThreshold={handleAdjustThreshold}
                  onSimulateFeverSpike={handleSimulateFeverSpike}
                  onSimulateNormalReturn={handleSimulateNormalReturn}
                  onTriggerInstantReading={handleTriggerInstantReading}
                  onQuickNote={handleAddNote}
                  onOpenDevicePage={() => handleSelectPage('device')}
                  onOpenHistoryPage={() => handleSelectPage('history')}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col [&>*]:flex-1">
                <ThermalChart
                  language={language}
                  tempUnit={tempUnit}
                  profileName={activeProfile.name}
                  readings={activeProfile.readings}
                  notes={activeProfile.notes}
                  threshold={activeProfile.threshold}
                  timeWindow={timeWindow}
                  onChangeTimeWindow={setTimeWindow}
                />
              </div>
            </div>
          )}

          {/* PAGE 2: HISTORY (Historique) */}
          {activePage === 'history' && (
            <div className="space-y-6">
              <section
                aria-label="Sélecteur de journée"
                className="biotemp-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-[#647B8C] dark:text-[#8BA3BC]">
                    Calendrier de suivi
                  </p>
                  <h1 className="text-lg font-bold text-[#162642] dark:text-[#F1F6FA]">
                    Historique thermique — {activeProfile.name}
                  </h1>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {HISTORY_DAYS.map((d) => {
                    const active = selectedHistoryDay === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedHistoryDay(d.id);
                          setTimeWindow(d.window);
                        }}
                        className={`min-w-[54px] min-h-[58px] px-3 py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#162642] text-white dark:bg-[#0D9488]'
                            : 'bg-[#F3F7F9] text-[#476074] hover:bg-[#E4EDF2] dark:bg-[#162947] dark:text-[#B0C4D8] dark:hover:bg-[#1D355B]'
                        }`}
                      >
                        <span className="text-[11px] font-medium opacity-80">{d.dayLabel}</span>
                        <span className="font-mono text-sm font-bold tabular-nums">{d.dateNum}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 flex flex-col [&>*]:flex-1">
                  <ThermalChart
                    language={language}
                    tempUnit={tempUnit}
                    profileName={activeProfile.name}
                    readings={activeProfile.readings}
                    notes={activeProfile.notes}
                    threshold={activeProfile.threshold}
                    timeWindow={timeWindow}
                    onChangeTimeWindow={setTimeWindow}
                  />
                </div>

                <div className="lg:col-span-5 flex flex-col [&>*]:flex-1">
                  <MedicalNotesPanel
                    language={language}
                    tempUnit={tempUnit}
                    profileName={activeProfile.name}
                    currentTemp={currentTemp}
                    threshold={activeProfile.threshold}
                    readings={activeProfile.readings}
                    notes={activeProfile.notes}
                    onAddNote={handleAddNote}
                    onDeleteNote={handleDeleteNote}
                    onOpenReport={() => setIsReportModalOpen(true)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PAGE 3: DEVICE (Appareil) */}
          {activePage === 'device' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-6 flex flex-col [&>*]:flex-1">
                <ConnectionAndSyncCard
                  language={language}
                  profile={activeProfile}
                  alertsEnabled={alertsEnabled}
                  soundEnabled={soundEnabled}
                  smartPersistenceEnabled={smartPersistenceEnabled}
                  isSyncingBuffer={isSyncingBuffer}
                  notificationPermission={notificationPermission}
                  onToggleAlerts={handleToggleAlerts}
                  onToggleSound={() => setSoundEnabled((s) => !s)}
                  onToggleSmartPersistence={() => setSmartPersistenceEnabled((v) => !v)}
                  onTestAlert={handleTestAlert}
                  onSimulateOutOfRange={handleSimulateOutOfRange}
                  onSimulateSkinRemoval={handleSimulateSkinRemoval}
                  onResumeSession={handleResumeSession}
                  onReconnectAndSync={handleReconnectAndSync}
                  onAddManualBufferedPoint={handleAddManualBufferedPoint}
                  onToggleHomeHub={handleToggleHomeHub}
                  onChangeHomeHubDevice={handleChangeHomeHubDevice}
                  onDismissSyncNotice={handleDismissSyncNotice}
                  onEndSession={handleEndSession}
                  onOpenReplaceDevice={() => setIsReplaceModalOpen(true)}
                />
              </div>

              <div className="lg:col-span-6 flex flex-col [&>*]:flex-1">
                <HardwareSpecsSection
                  activeDeviceId={activeProfile.deviceId}
                  activeDeviceName={activeProfile.deviceName}
                  activePatchLabel={activeProfile.patchLabel}
                  patchAppliedAt={activeProfile.patchAppliedAt}
                  lastConnectedAt={activeProfile.lastConnectedAt}
                  patchReminderHours={patchReminderHours}
                  onResetPatchTimer={handleResetPatchTimer}
                  onOpenPlacementGuide={() => setIsPlacementGuideOpen(true)}
                  onOpenReplaceDevice={() => setIsReplaceModalOpen(true)}
                />
              </div>
            </div>
          )}

          {/* PAGE 4: PROFILE (Profil) */}
          {activePage === 'profile' && (
            <ProfilePage
              profiles={profiles}
              activeProfile={activeProfile}
              identityConfirmedIds={identityConfirmedIds}
              onSelectProfile={handleSelectProfile}
              onConfirmIdentity={handleConfirmIdentity}
              onOpenReplaceDevice={() => setIsReplaceModalOpen(true)}
              onOpenReport={() => setIsReportModalOpen(true)}
              onReassignRecentSegment={handleReassignRecentSegment}
              onCreateProfile={handleCreateProfile}
              onAddVaccination={handleAddVaccination}
              onDeleteVaccination={handleDeleteVaccination}
              onAddHealthReminder={handleAddHealthReminder}
              onToggleHealthReminder={handleToggleHealthReminder}
              onDeleteHealthReminder={handleDeleteHealthReminder}
              language={language}
              tempUnit={tempUnit}
              isDarkMode={isDarkMode}
              nightModePolicy={nightModePolicy}
              sunSchedule={sunSchedule}
              currentTimeLabel={currentTimeLabel}
              simulateNightTime={simulateNightTime}
              alertsEnabled={alertsEnabled}
              soundEnabled={soundEnabled}
              smartPersistenceEnabled={smartPersistenceEnabled}
              persistenceDurationMinutes={persistenceDurationMinutes}
              overrideSilentMode={overrideSilentMode}
              notificationPermission={notificationPermission}
              samplingIntervalMs={samplingIntervalMs}
              patchReminderHours={patchReminderHours}
              reduceMotion={reduceMotion}
              autoConfirmIdentity={autoConfirmIdentity}
              onChangeLanguage={setLanguage}
              onChangeTempUnit={setTempUnit}
              onToggleDarkMode={handleToggleDarkMode}
              onChangeNightPolicy={(policy) => {
                setNightModePolicy(policy);
                if (policy === 'manual') setSimulateNightTime(false);
              }}
              onUpdateSleepSchedule={handleUpdateSleepSchedule}
              onToggleSimulateNightTime={() => setSimulateNightTime((v) => !v)}
              onToggleAlerts={handleToggleAlerts}
              onToggleSound={() => setSoundEnabled((s) => !s)}
              onToggleSmartPersistence={() => setSmartPersistenceEnabled((v) => !v)}
              onChangePersistenceDuration={setPersistenceDurationMinutes}
              onToggleOverrideSilentMode={() => setOverrideSilentMode((v) => !v)}
              onRequestNotificationPermission={handleRequestNotificationPermission}
              onTestAlert={handleTestAlert}
              onChangeSamplingInterval={setSamplingIntervalMs}
              onChangePatchReminderHours={setPatchReminderHours}
              onToggleReduceMotion={() => setReduceMotion((v) => !v)}
              onToggleAutoConfirmIdentity={() => setAutoConfirmIdentity((v) => !v)}
              onResetSettings={handleResetAppSettings}
            />
          )}
        </main>

        <footer className="border-t border-[#E3EDF0] dark:border-[#1E3354] bg-white/65 dark:bg-[#0B172B]/70 py-4 mt-4 transition-colors no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#647B8C] dark:text-[#8BA3BC]">
            <span>{strings.footer.left}</span>
            <span>{strings.footer.right}</span>
          </div>
        </footer>
      </div>

      <BottomBar
        language={language}
        activePage={activePage}
        onSelectPage={handleSelectPage}
        bufferedCount={activeProfile.bufferedReadings.length}
        isOutOfRange={activeProfile.connectionMode === 'out_of_range'}
      />

      <ReplaceDeviceModal
        isOpen={isReplaceModalOpen}
        profile={activeProfile}
        onClose={() => setIsReplaceModalOpen(false)}
        onConfirmReplace={handleConfirmReplaceDevice}
      />

      <DoctorSummaryModal
        isOpen={isReportModalOpen}
        profile={activeProfile}
        language={language}
        tempUnit={tempUnit}
        onClose={() => setIsReportModalOpen(false)}
      />

      <PlacementGuideModal
        isOpen={isPlacementGuideOpen}
        onClose={() => setIsPlacementGuideOpen(false)}
      />

      <ProTipsOverlay
        isOpen={isProTipsOpen}
        profile={activeProfile}
        identityConfirmed={Boolean(identityConfirmedIds[activeProfile.id])}
        soundEnabled={soundEnabled}
        alertsEnabled={alertsEnabled}
        notificationPermission={notificationPermission}
        onClose={() => setIsProTipsOpen(false)}
        onNavigate={handleSelectPage}
        onReconnectAndSync={handleReconnectAndSync}
        onResumeSession={handleResumeSession}
        onResetPatchTimer={handleResetPatchTimer}
        onConfirmIdentity={() => handleConfirmIdentity(activeProfile.id)}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onTestAlert={handleTestAlert}
        onQuickNote={handleAddNote}
        onOpenPlacementGuide={() => setIsPlacementGuideOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
      />
    </div>
  );
}
