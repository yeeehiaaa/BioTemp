import { AppLanguage } from '../types/biotemp';

export interface AppStrings {
  nav: {
    home: string;
    history: string;
    device: string;
    profile: string;
    proTips: string;
    nightMode: string;
    dayMode: string;
    autoBadge: string;
    doctorPreview: string;
    doctorShort: string;
  };
  footer: {
    left: string;
    right: string;
  };
  profilePage: {
    subtitle: string;
    titleProfiles: string;
    titleGlobalHealth: string;
    localFirstPrefix: string;
    localFirstBody: string;
    newProfile: string;
    doctorSummary: string;
    tabProfiles: string;
    tabGlobalHealth: string;
    tabSettings: string;
    tabSettingsShortcut: string;
    journalFor: string;
    namedModule: string;
    hardwareId: string;
    medicalPatch: string;
    alertThreshold: string;
    recordedHistory: string;
    readingsWord: string;
    notesWord: string;
    globalHealthLabel: string;
    vaccineWord: string;
    vaccinesWord: string;
    reminderWord: string;
    remindersWord: string;
    confirmIdentity: string;
    identityVerified: string;
    activeProfileBtn: string;
    activateBtn: string;
    moduleBtn: string;
    reassignTitle: string;
    reassignDesc: string;
    transferBtn: string;
    vaccinationsTitle: string;
    vaccinationsSubtitle: string;
    remindersTitle: string;
    remindersSubtitle: string;
  };
  settings: {
    eyebrow: string;
    title: string;
    subtitle: string;
    savedLocally: string;
    resetBtn: string;
    resetSuccess: string;
    // Section 1: Appearance & Night Mode
    appearanceTitle: string;
    appearanceDesc: string;
    nightActiveLabel: string;
    dayActiveLabel: string;
    toggleNightBtn: string;
    toggleDayBtn: string;
    policyManual: string;
    policyManualDesc: string;
    policySun: string;
    policySunDesc: string;
    policyChild: string;
    policyChildDesc: string;
    sunriseLabel: string;
    sunsetLabel: string;
    sleepScheduleTitle: string;
    bedTimeLabel: string;
    wakeTimeLabel: string;
    simulateNightBtn: string;
    activeLabel: string;
    inactiveLabel: string;
    // Section 2: Language & Units
    languageTitle: string;
    languageDesc: string;
    langFrLabel: string;
    langFrSub: string;
    langArLabel: string;
    langArSub: string;
    unitTitle: string;
    unitDesc: string;
    unitC: string;
    unitF: string;
    // Section 3: Alerts & Notifications
    alertsTitle: string;
    alertsDesc: string;
    feverAlertsLabel: string;
    feverAlertsSub: string;
    alertSoundLabel: string;
    alertSoundSub: string;
    antiSpikeLabel: string;
    antiSpikeSub: string;
    persistenceDurationLabel: string;
    persistenceMinUnit: string;
    overrideSilentLabel: string;
    overrideSilentSub: string;
    desktopNotifLabel: string;
    notifGranted: string;
    notifDenied: string;
    notifUnsupported: string;
    notifDefault: string;
    notifEnableBtn: string;
    notifTestBtn: string;
    // Section 4: Sensor & Comfort
    sensorTitle: string;
    sensorDesc: string;
    cadenceLabel: string;
    cadenceFast: string;
    cadenceStandard: string;
    cadenceEco: string;
    patchLimitLabel: string;
    patchLimitHours: string;
    reduceMotionLabel: string;
    reduceMotionSub: string;
    autoConfirmIdentityLabel: string;
    autoConfirmIdentitySub: string;
  };
  primaryCard: {
    liveMonitoring: string;
    standbySession: string;
    alertsOn: string;
    alertsOff: string;
    soundOffBanner: string;
    standbyTitle: string;
    standbyDesc: string;
    alertThreshold: string;
    resumeSession: string;
    simulateFever: string;
    normalReturn: string;
    instantReading: string;
    demoToolsToggle: string;
    sensorConnected: string;
    sensorOutOfRange: string;
    sensorRelayed: string;
    sensorStandby: string;
    newbornAdvisoryTitle: string;
    newbornAdvisoryBody: string;
    calibrationNote: string;
    compressTag: string;
    antipyreticTag: string;
    oneStepNoteBtn: string;
    oneStepChartBtn: string;
    refTempBtn: string;
    refTempInputLabel: string;
    refTempSaveBtn: string;
    refTempCancelBtn: string;
  };
  chart: {
    eyebrow: string;
    title: string;
    thresholdLabel: string;
    min: string;
    avg: string;
    max: string;
    alerts: string;
    cursor: string;
    live: string;
    panWindow: string;
  };
  profileBar: {
    endSession: string;
    replaceOrPair: string;
    identityConfirmed: string;
    verificationRecommended: string;
    confirmPrefix: string;
    dissociatedNote: string;
  };
  alertsBanner: {
    titlePrefix: string;
    sustainedFor: string;
    thresholdWord: string;
    sustainedPrefix: string;
    sustainedBody: string;
    recoveryTitle: string;
    recoveryBody: string;
    viewProfile: string;
    quickActionNote: string;
    quickActionChart: string;
    quickActionRef: string;
    acknowledge: string;
  };
  deviceCopy: {
    outOfRangeTitle: string;
    outOfRangeDesc: string;
    standbyPromptTitle: string;
    standbyPromptDesc: string;
    endSessionBtn: string;
    resumeSessionBtn: string;
    sessionSavedCharge: string;
    signalQualityHeading: string;
  };
  medicalNotes: {
    subtitle: string;
    title: string;
    summaryBtn: string;
    tabNotes: string;
    tabHourly: string;
    addCustom: string;
    cancel: string;
    save: string;
    empty: string;
    quickTags: Array<{
      category: import('../types/biotemp').NotePresetCategory;
      label: string;
      defaultText: string;
    }>;
  };
}

const FR_STRINGS: AppStrings = {
  nav: {
    home: 'Accueil',
    history: 'Historique',
    device: 'Appareil',
    profile: 'Profil',
    proTips: 'Pro-Tips',
    nightMode: 'Mode Nuit',
    dayMode: 'Mode Jour',
    autoBadge: 'Auto',
    doctorPreview: 'Aperçu médecin',
    doctorShort: 'Médecin',
  },
  footer: {
    left: 'BioTemp — Surveillance thermique continue · Données Local-First',
    right:
      "Mesure cutanée calibrée sous l'aisselle • Outil de suivi domestique ne remplaçant pas un avis médical.",
  },
  profilePage: {
    subtitle: 'Gestion multi-profils & carnet de suivi',
    titleProfiles: 'Profils suivis',
    titleGlobalHealth: 'Santé Globale',
    localFirstPrefix: 'Approche Local-First :',
    localFirstBody:
      'profils, vaccinations, rappels et préférences enregistrés localement sur votre appareil.',
    newProfile: 'Nouveau profil',
    doctorSummary: 'Résumé médecin',
    tabProfiles: 'Profils & Modules',
    tabGlobalHealth: 'Santé Globale',
    tabSettings: 'Paramètres',
    tabSettingsShortcut: "Paramètres de l'app",
    journalFor: 'Carnet de :',
    namedModule: 'Module nommé',
    hardwareId: 'Identifiant matériel',
    medicalPatch: 'Patch médical',
    alertThreshold: "Seuil d'alerte",
    recordedHistory: 'Historique enregistré',
    readingsWord: 'relevés',
    notesWord: 'notes',
    globalHealthLabel: 'Santé Globale',
    vaccineWord: 'vaccin',
    vaccinesWord: 'vaccins',
    reminderWord: 'rappel',
    remindersWord: 'rappels',
    confirmIdentity: "Confirmer l'identité de",
    identityVerified: 'Identité vérifiée',
    activeProfileBtn: 'Profil actif',
    activateBtn: 'Activer',
    moduleBtn: 'Module',
    reassignTitle: "Correction d'attribution de session",
    reassignDesc:
      'Si le capteur a été posé sur un autre enfant par erreur, transférez les 30 dernières minutes de mesures sans perte.',
    transferBtn: 'Transférer 30 min',
    vaccinationsTitle: 'Vaccinations',
    vaccinationsSubtitle: 'Suivi vaccinal',
    remindersTitle: 'Rappels médicaux',
    remindersSubtitle: 'Rendez-vous & traitements hors température',
  },
  settings: {
    eyebrow: 'Préférences globales',
    title: "Paramètres de l'application",
    subtitle:
      "Personnalisez le Mode Nuit, la langue (Français / العربية), les unités et les alertes de surveillance.",
    savedLocally: 'Sauvegarde locale active',
    resetBtn: 'Réinitialiser',
    resetSuccess: 'Paramètres par défaut restaurés.',
    appearanceTitle: 'Apparence & Mode Nuit',
    appearanceDesc:
      'Fond bleu nuit profond pour préserver le sommeil nocturne sans éblouissement.',
    nightActiveLabel: 'Thème Nuit actif',
    dayActiveLabel: 'Thème Jour actif',
    toggleNightBtn: 'Passer en Mode Nuit',
    toggleDayBtn: 'Passer en Mode Jour',
    policyManual: 'Manuel',
    policyManualDesc: 'Basculer manuellement entre Mode Jour et Mode Nuit.',
    policySun: 'Lever / Coucher du soleil',
    policySunDesc: 'Activation automatique selon l’heure locale du soleil.',
    policyChild: 'Horaire de sommeil enfant',
    policyChildDesc: 'Suit les heures de coucher et réveil du profil actif.',
    sunriseLabel: 'Lever',
    sunsetLabel: 'Coucher',
    sleepScheduleTitle: 'Horaire de sommeil par enfant',
    bedTimeLabel: 'Coucher',
    wakeTimeLabel: 'Réveil',
    simulateNightBtn: 'Tester avec heure nocturne simulée (22:30)',
    activeLabel: 'Actif',
    inactiveLabel: 'Inactif',
    languageTitle: 'Langue & Unités',
    languageDesc: 'Basculez instantanément entre le français (LTR) et l’arabe (RTL).',
    langFrLabel: 'Français',
    langFrSub: 'Interface LTR',
    langArLabel: 'العربية',
    langArSub: 'واجهة من اليمين لليسار',
    unitTitle: 'Unité thermique',
    unitDesc: 'Format d’affichage des températures et seuils.',
    unitC: 'Celsius (°C)',
    unitF: 'Fahrenheit (°F)',
    alertsTitle: 'Alertes & Notifications',
    alertsDesc: 'Contrôle des seuils de fièvre, de la sonnerie et du filtrage intelligent.',
    feverAlertsLabel: 'Alertes de dépassement de seuil',
    feverAlertsSub: 'Avertit immédiatement si la température atteint le seuil configuré.',
    alertSoundLabel: 'Sonnerie progressive d’alerte',
    alertSoundSub: 'Signal sonore doux à la détection d’une fièvre.',
    antiSpikeLabel: 'Continuité avant alerte (Anti-faux pics)',
    antiSpikeSub: 'Attend une hausse continue pour éviter les fausses alertes nocturnes.',
    persistenceDurationLabel: 'Durée de confirmation continue',
    persistenceMinUnit: 'min',
    overrideSilentLabel: 'Alertes prioritaires (mode silencieux la nuit)',
    overrideSilentSub:
      'Permet d’entendre les notifications la nuit une fois la durée continue confirmée.',
    desktopNotifLabel: 'Notifications bureau / arrière-plan',
    notifGranted: 'Autorisées par le navigateur',
    notifDenied: 'Bloquées dans le navigateur (alerte onglet active)',
    notifUnsupported: 'Non supportées ici (alerte intégrée active)',
    notifDefault: 'Autorisation non encore accordée',
    notifEnableBtn: 'Autoriser',
    notifTestBtn: 'Tester une alerte',
    sensorTitle: 'Capteur BLE, Patch & Confort',
    sensorDesc: 'Cadence de lecture, hygiène du patch et sobriété visuelle.',
    cadenceLabel: 'Fréquence de relevé BLE',
    cadenceFast: 'Standard (1 min)',
    cadenceStandard: 'Modéré (3 min)',
    cadenceEco: 'Éco batterie (5 min)',
    patchLimitLabel: 'Rappel de changement de patch',
    patchLimitHours: 'h max',
    reduceMotionLabel: 'Réduire les animations',
    reduceMotionSub: 'Transitions minimales pour économiser la batterie.',
    autoConfirmIdentityLabel: 'Confirmation rapide au changement de profil',
    autoConfirmIdentitySub: 'Considère l’identité validée lors du basculement de profil.',
  },
  primaryCard: {
    liveMonitoring: 'Surveillance continue',
    standbySession: 'Session en veille',
    alertsOn: 'Alertes actives',
    alertsOff: 'Alertes coupées',
    soundOffBanner:
      'Téléphone en mode silencieux — Activez les « Alertes prioritaires » pour entendre les notifications la nuit.',
    standbyTitle: 'Session terminée ?',
    standbyDesc:
      'Le module ne semble plus posé sur la peau. Reprenez la mesure ou clôturez la session.',
    alertThreshold: "Seuil d'alerte",
    resumeSession: 'Reprendre la session',
    simulateFever: 'Simuler pic',
    normalReturn: 'Retour normal',
    instantReading: 'Mesurer',
    demoToolsToggle: 'Mode test / simulation',
    sensorConnected: 'Capteur BLE connecté',
    sensorOutOfRange: 'Hors portée · Mémoire interne',
    sensorRelayed: 'Relais domestique actif',
    sensorStandby: 'Capteur en veille',
    newbornAdvisoryTitle: 'Information nourrisson (< 3 mois)',
    newbornAdvisoryBody:
      'Toute hausse de température chez un bébé de moins de 3 mois nécessite un avis médical rapide.',
    calibrationNote:
      "Mesure cutanée calibrée sous l'aisselle • Outil de suivi domestique ne remplaçant pas un avis médical.",
    compressTag: "Compresses d'eau tiède",
    antipyreticTag: 'Antipyrétique administré',
    oneStepNoteBtn: 'Antipyrétique administré',
    oneStepChartBtn: 'Voir la courbe',
    refTempBtn: 'Noter une mesure de référence',
    refTempInputLabel: 'Thermomètre de référence',
    refTempSaveBtn: 'Enregistrer',
    refTempCancelBtn: 'Annuler',
  },
  chart: {
    eyebrow: 'Évolution continue',
    title: 'Courbe thermique',
    thresholdLabel: 'Seuil',
    min: 'Min',
    avg: 'Moy',
    max: 'Max',
    alerts: 'Alertes',
    cursor: 'Curseur',
    live: 'Direct',
    panWindow: 'Déplacer la fenêtre :',
  },
  profileBar: {
    endSession: 'Clore la session',
    replaceOrPair: 'Remplacer ou associer un module',
    identityConfirmed: 'Identité confirmée :',
    verificationRecommended: 'Vérification recommandée :',
    confirmPrefix: "Confirmer qu'il s'agit de",
    dissociatedNote: 'Profil et historique dissociés du capteur physique',
  },
  alertsBanner: {
    titlePrefix: 'Suivi de',
    sustainedFor: 'continue depuis',
    thresholdWord: 'seuil',
    sustainedPrefix: 'Suivi de',
    sustainedBody:
      "La température reste au-dessus du seuil ({temp}). Vérifiez l'état de l'enfant et notez vos observations.",
    recoveryTitle: 'Évolution favorable :',
    recoveryBody:
      'La température de {name} redescend progressivement vers la normale.',
    viewProfile: 'Voir',
    quickActionNote: 'Antipyrétique administré',
    quickActionChart: 'Voir la courbe',
    quickActionRef: 'Mesure de référence',
    acknowledge: 'Compris',
  },
  deviceCopy: {
    outOfRangeTitle: 'Téléphone hors de portée',
    outOfRangeDesc:
      "Connexion directe interrompue. Le module continue d'enregistrer en mémoire interne.",
    standbyPromptTitle: 'Session terminée ?',
    standbyPromptDesc:
      'Le module ne semble plus posé sur la peau. Appuyez pour clôturer la session et économiser la batterie.',
    endSessionBtn: 'Clôturer la session',
    resumeSessionBtn: 'Reprendre la session de mesure',
    sessionSavedCharge:
      "Session enregistrée : Pensez à recharger BioTemp Core afin qu'il soit prêt pour la prochaine utilisation.",
    signalQualityHeading: 'Qualité du signal & de la pose',
  },
  medicalNotes: {
    subtitle: 'Suivi clinique',
    title: 'Historique & Notes',
    summaryBtn: 'Résumé',
    tabNotes: 'Notes médecin',
    tabHourly: 'Relevés horaires',
    addCustom: 'Note personnalisée',
    cancel: 'Annuler',
    save: 'Enregistrer',
    empty: 'Aucune note médicale consignée.',
    quickTags: [
      {
        category: 'Antipyrétique administré',
        label: 'Antipyrétique administré',
        defaultText: 'Antipyrétique administré selon la posologie adaptée.',
      },
      {
        category: 'Compresses tièdes',
        label: "Compresses d'eau tiède",
        defaultText: "Compresses d'eau tiède appliquées pour apaiser l'enfant.",
      },
      {
        category: 'Vêtements / couverture allégés',
        label: 'Vêtements / couverture allégés',
        defaultText: 'Vêtements et couverture allégés pour éviter la surchauffe.',
      },
      {
        category: 'Fatigue / léthargie',
        label: 'Fatigue ou léthargie',
        defaultText: 'Fatigue ou léthargie inhabituelle observée.',
      },
      {
        category: "Reprise d'activité / appétit",
        label: "Reprise d'activité / appétit",
        defaultText: "Amélioration notable de l'activité et de l'appétit.",
      },
    ],
  },
};

const AR_STRINGS: AppStrings = {
  nav: {
    home: 'الرئيسية',
    history: 'السجل',
    device: 'الجهاز',
    profile: 'الملف الشخصي',
    proTips: 'نصائح سريعة',
    nightMode: 'الوضع الليلي',
    dayMode: 'الوضع النهاري',
    autoBadge: 'تلقائي',
    doctorPreview: 'ملخص الطبيب',
    doctorShort: 'الطبيب',
  },
  footer: {
    left: 'BioTemp — مراقبة حرارية مستمرة · بيانات محلية أولاً',
    right: 'قياس جلدي معاير تحت الإبط • أداة متابعة منزلية مساعدة لا تغني عن الفحص الطبي.',
  },
  profilePage: {
    subtitle: 'إدارة الملفات المتعددة والدفتر الصحي',
    titleProfiles: 'الملفات المتابعة',
    titleGlobalHealth: 'الصحة العامة',
    localFirstPrefix: 'نهج الحفظ المحلي :',
    localFirstBody:
      'يتم حفظ الملفات والتطعيمات والتذكيرات والإعدادات محلياً على جهازك.',
    newProfile: 'ملف جديد',
    doctorSummary: 'ملخص الطبيب',
    tabProfiles: 'الملفات والأجهزة',
    tabGlobalHealth: 'الصحة العامة',
    tabSettings: 'الإعدادات',
    tabSettingsShortcut: 'إعدادات التطبيق',
    journalFor: 'دفتر :',
    namedModule: 'اسم الوحدة',
    hardwareId: 'معرف الجهاز',
    medicalPatch: 'اللاصقة الطبية',
    alertThreshold: 'عتبة التنبيه',
    recordedHistory: 'السجل المحفوظ',
    readingsWord: 'قراءة',
    notesWord: 'ملاحظة',
    globalHealthLabel: 'الصحة العامة',
    vaccineWord: 'لقاح',
    vaccinesWord: 'لقاحات',
    reminderWord: 'تذكير',
    remindersWord: 'تذكيرات',
    confirmIdentity: 'تأكيد هوية',
    identityVerified: 'تم التحقق من الهوية',
    activeProfileBtn: 'الملف النشط',
    activateBtn: 'تفعيل',
    moduleBtn: 'الوحدة',
    reassignTitle: 'تصحيح ربط جلسة القياس',
    reassignDesc:
      'إذا تم وضع المستشعر على طفل آخر بالخطأ، يمكنك نقل آخر 30 دقيقة من القياسات دون فقدان البيانات.',
    transferBtn: 'نقل آخر 30 د',
    vaccinationsTitle: 'التطعيمات',
    vaccinationsSubtitle: 'متابعة اللقاحات',
    remindersTitle: 'التذكيرات الطبية',
    remindersSubtitle: 'المواعيد والعلاجات غير المرتبطة بالحرارة',
  },
  settings: {
    eyebrow: 'التفضيلات العامة',
    title: 'إعدادات التطبيق',
    subtitle:
      'خصص الوضع الليلي، اللغة (الفرنسية / العربية)، وحدة الحرارة وخيارات المراقبة.',
    savedLocally: 'الحفظ المحلي نشط',
    resetBtn: 'استعادة الافتراضي',
    resetSuccess: 'تمت استعادة الإعدادات الافتراضية.',
    appearanceTitle: 'المظهر والوضع الليلي',
    appearanceDesc:
      'خلفية زرقاء داكنة لراحة العين أثناء المراقبة الليلية دون إبهار.',
    nightActiveLabel: 'الوضع الليلي نشط',
    dayActiveLabel: 'الوضع النهاري نشط',
    toggleNightBtn: 'تفعيل الوضع الليلي',
    toggleDayBtn: 'العودة للوضع النهاري',
    policyManual: 'يدوي',
    policyManualDesc: 'التبديل اليدوي المباشر بين الوضع النهاري والليلي.',
    policySun: 'شروق / غروب الشمس',
    policySunDesc: 'تفعيل تلقائي حسب التوقيت المحلي لغروب الشمس وشروقها.',
    policyChild: 'جدول نوم الطفل',
    policyChildDesc: 'يتبع مواعيد النوم والاستيقاظ الخاصة بالملف النشط.',
    sunriseLabel: 'الشروق',
    sunsetLabel: 'الغروب',
    sleepScheduleTitle: 'جدول النوم لكل طفل',
    bedTimeLabel: 'النوم',
    wakeTimeLabel: 'الاستيقاظ',
    simulateNightBtn: 'تجربة التوقيت الليلي المحاكى (22:30)',
    activeLabel: 'نشط',
    inactiveLabel: 'غير نشط',
    languageTitle: 'اللغة والوحدات',
    languageDesc: 'تبديل فوري بين العربية (من اليمين لليسار) والفرنسية.',
    langFrLabel: 'Français',
    langFrSub: 'واجهة من اليسار لليمين',
    langArLabel: 'العربية',
    langArSub: 'واجهة عربية كاملة RTL',
    unitTitle: 'وحدة قياس الحرارة',
    unitDesc: 'صيغة عرض درجات الحرارة والعتبات.',
    unitC: 'مئوية (°C)',
    unitF: 'فهرنهايت (°F)',
    alertsTitle: 'التنبيهات والإشعارات',
    alertsDesc: 'التحكم في عتبة الحمى، صوت التنبيه وتصفية القمم المؤقتة.',
    feverAlertsLabel: 'تنبيهات تجاوز العتبة',
    feverAlertsSub: 'إشعار فوري عند بلوغ الحرارة العتبة المحددة.',
    alertSoundLabel: 'نغمة تنبيه تدريجية',
    alertSoundSub: 'صوت تنبيه لطيف عند رصد ارتفاع الحرارة.',
    antiSpikeLabel: 'الاستمرارية قبل التنبيه (منع الإنذار الكاذب)',
    antiSpikeSub: 'يتأكد من بقاء الحرارة فوق العتبة قبل إطلاق التنبيه ليلاً.',
    persistenceDurationLabel: 'مدة التأكيد المتصلة قبل التنبيه',
    persistenceMinUnit: 'دقائق',
    overrideSilentLabel: 'تنبيهات الطوارئ (تجاوز الوضع الصامت ليلاً)',
    overrideSilentSub: 'لضمان سماع الإشعارات ليلاً عند استمرار الارتفاع فوق العتبة.',
    desktopNotifLabel: 'إشعارات النظام / الخلفية',
    notifGranted: 'مفعّلة في المتصفح',
    notifDenied: 'محظورة في المتصفح (تنبيه التبويب نشط)',
    notifUnsupported: 'غير مدعومة هنا (التنبيه الداخلي نشط)',
    notifDefault: 'لم يتم منح الإذن بعد',
    notifEnableBtn: 'تفعيل الإذن',
    notifTestBtn: 'اختبار التنبيه',
    sensorTitle: 'المستشعر BLE واللاصقة والراحة',
    sensorDesc: 'وتيرة القراءة، تذكير تغيير اللاصقة وتقليل الحركة.',
    cadenceLabel: 'وتيرة أخذ القياسات BLE',
    cadenceFast: 'كل دقيقة (1 د)',
    cadenceStandard: 'كل 3 دقائق (3 د)',
    cadenceEco: 'توفير البطارية (5 د)',
    patchLimitLabel: 'تذكير استبدال اللاصقة',
    patchLimitHours: 'ساعة كحد أقصى',
    reduceMotionLabel: 'تقليل الحركات والانتقالات',
    reduceMotionSub: 'تبسيط التأثيرات البصرية للحفاظ على البطارية.',
    autoConfirmIdentityLabel: 'تأكيد تلقائي عند تبديل الملف',
    autoConfirmIdentitySub: 'اعتماد الهوية مباشرة عند اختيار ملف طفل آخر.',
  },
  primaryCard: {
    liveMonitoring: 'متابعة مستمرة',
    standbySession: 'وضع الاستعداد',
    alertsOn: 'التنبيهات نشطة',
    alertsOff: 'التنبيهات متوقفة',
    soundOffBanner:
      'صوت الهاتف مكتوم حالياً — فعّل «تنبيهات الطوارئ» لضمان سماع الإشعارات ليلاً.',
    standbyTitle: 'هل انتهت جلسة المراقبة؟',
    standbyDesc:
      'يبدو أن القطعة غير مثبتة على الجلد حالياً. يمكنك استئناف القياس أو إنهاء الجلسة.',
    alertThreshold: 'عتبة التنبيه',
    resumeSession: 'استئناف الجلسة',
    simulateFever: 'محاكاة ارتفاع',
    normalReturn: 'عودة للطبيعي',
    instantReading: 'قياس فوري',
    demoToolsToggle: 'أدوات المحاكاة والاختبار',
    sensorConnected: 'المستشعر متصل عبر BLE',
    sensorOutOfRange: 'خارج النطاق · ذاكرة داخلية',
    sensorRelayed: 'الربط المنزلي نشط',
    sensorStandby: 'المستشعر في وضع السكون',
    newbornAdvisoryTitle: 'تنبيه للرضع الصغار (أقل من 3 أشهر)',
    newbornAdvisoryBody:
      'أي ارتفاع في حرارة الرضيع دون 3 أشهر يستدعي تقييماً طبياً سريعاً.',
    calibrationNote:
      'قياس جلدي معاير تحت الإبط • أداة متابعة منزلية مساعدة لا تغني عن الفحص الطبي.',
    compressTag: 'كمادات ماء فاتر',
    antipyreticTag: 'أُعطي خافض حرارة',
    oneStepNoteBtn: 'أُعطي خافض حرارة',
    oneStepChartBtn: 'مراجعة المنحنى',
    refTempBtn: 'تسجيل قياس مرجعي',
    refTempInputLabel: 'ميزان الحرارة المرجعي',
    refTempSaveBtn: 'حفظ',
    refTempCancelBtn: 'إلغاء',
  },
  chart: {
    eyebrow: 'التطور المستمر',
    title: 'منحنى الحرارة',
    thresholdLabel: 'العتبة',
    min: 'الأدنى',
    avg: 'المتوسط',
    max: 'الأعلى',
    alerts: 'التنبيهات',
    cursor: 'المؤشر',
    live: 'مباشر',
    panWindow: 'تحريك نافذة العرض:',
  },
  profileBar: {
    endSession: 'إنهاء الجلسة',
    replaceOrPair: 'استبدال أو ربط وحدة',
    identityConfirmed: 'تم تأكيد الهوية :',
    verificationRecommended: 'يوصى بالتحقق :',
    confirmPrefix: 'تأكيد أن القياس يخص',
    dissociatedNote: 'الملف والسجل مفصولان عن الوحدة الفيزيائية',
  },
  alertsBanner: {
    titlePrefix: 'متابعة حرارة',
    sustainedFor: 'مستمرة منذ',
    thresholdWord: 'العتبة',
    sustainedPrefix: 'متابعة حرارة',
    sustainedBody:
      'القراءة مستمرة فوق العتبة المحددة ({temp}). يُرجى تفقد حالة الطفل وتدوين أي ملاحظة.',
    recoveryTitle: 'تحسن في المؤشر :',
    recoveryBody: 'بدأت حرارة {name} بالانخفاض تدريجياً نحو النطاق المعتاد.',
    viewProfile: 'عرض',
    quickActionNote: 'أُعطي خافض حرارة',
    quickActionChart: 'مراجعة المنحنى',
    quickActionRef: 'قياس مرجعي',
    acknowledge: 'تم الفهم',
  },
  deviceCopy: {
    outOfRangeTitle: 'الهاتف خارج النطاق',
    outOfRangeDesc:
      'انقطع الاتصال المباشر بقطعة الطفل. الجهاز يواصل التسجيل في ذاكرته الداخلية بأمان.',
    standbyPromptTitle: 'هل انتهت جلسة المراقبة؟',
    standbyPromptDesc:
      'يبدو أن القطعة غير مثبتة على الجلد حالياً. اضغط لإنهاء الجلسة وتوفير البطارية.',
    endSessionBtn: 'إنهاء الجلسة وتوفير البطارية',
    resumeSessionBtn: 'استئناف جلسة القياس',
    sessionSavedCharge:
      'تم حفظ الجلسة : يُفضّل شحن BioTemp Core الآن ليكون جاهزاً عند الحاجة القادمة.',
    signalQualityHeading: 'جودة الإشارة والتثبيت',
  },
  medicalNotes: {
    subtitle: 'المتابعة السريرية',
    title: 'السجل والملاحظات',
    summaryBtn: 'الملخص',
    tabNotes: 'ملاحظات الطبيب',
    tabHourly: 'القراءات الدورية',
    addCustom: 'ملاحظة مخصصة',
    cancel: 'إلغاء',
    save: 'حفظ',
    empty: 'لا توجد ملاحظات طبية مسجلة حالياً.',
    quickTags: [
      {
        category: 'Antipyrétique administré',
        label: 'أُعطي خافض حرارة',
        defaultText: 'أُعطي خافض حرارة وفق الجرعة المناسبة للوزن.',
      },
      {
        category: 'Compresses tièdes',
        label: 'كمادات ماء فاتر',
        defaultText: 'تم وضع كمادات ماء فاتر لتخفيف الانزعاج.',
      },
      {
        category: 'Vêtements / couverture allégés',
        label: 'تخفيف الملابس / الغطاء',
        defaultText: 'تم تخفيف الملابس والغطاء لتفادي الاحتباس الحراري.',
      },
      {
        category: 'Fatigue / léthargie',
        label: 'خمول أو تعب ملحوظ',
        defaultText: 'لوحظ خمول أو تعب غير معتاد لدى الطفل.',
      },
      {
        category: "Reprise d'activité / appétit",
        label: 'تحسن النشاط والشهية',
        defaultText: 'تحسن ملحوظ في النشاط العام والشهية.',
      },
    ],
  },
};

export function getStrings(lang: AppLanguage): AppStrings {
  return lang === 'ar' ? AR_STRINGS : FR_STRINGS;
}
