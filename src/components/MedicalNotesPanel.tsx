import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Check,
  ClipboardPlus,
  FileText,
  Moon,
  Pill,
  Power,
  Snowflake,
  Thermometer,
  Trash2,
} from 'lucide-react';
import {
  AppLanguage,
  MedicalNote,
  NotePresetCategory,
  TemperatureReading,
  TemperatureUnit,
} from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import {
  convertTemp,
  formatTempFr,
  formatTimeFr,
  getStatusMeta,
  getTemperatureStatus,
  inputTempToCelsius,
  tempUnitLabel,
} from '../utils/temperature';

interface MedicalNotesPanelProps {
  language?: AppLanguage;
  tempUnit?: TemperatureUnit;
  profileName: string;
  currentTemp: number;
  threshold: number;
  readings: TemperatureReading[];
  notes: MedicalNote[];
  onAddNote: (category: NotePresetCategory, text: string, referenceTempC?: number) => void;
  onDeleteNote: (noteId: string) => void;
  onOpenReport: () => void;
}

function getNoteIcon(category: NotePresetCategory) {
  switch (category) {
    case 'Antipyrétique administré':
      return {
        Icon: Pill,
        bg: 'bg-[#FEF7EC] dark:bg-[#261909]',
        text: 'text-[#D97706] dark:text-[#FB923C]',
      };
    case 'Compresses tièdes':
      return {
        Icon: Snowflake,
        bg: 'bg-[#EEF6FB] dark:bg-[#112238]',
        text: 'text-[#0284C7] dark:text-[#38BDF8]',
      };
    case 'Fatigue / léthargie':
      return {
        Icon: Moon,
        bg: 'bg-[#F3F0FF] dark:bg-[#1F1638]',
        text: 'text-[#6D28D9] dark:text-[#C4B5FD]',
      };
    case 'Vomissements':
    case 'Douleur / pleurs':
      return {
        Icon: AlertCircle,
        bg: 'bg-[#FEF1F3] dark:bg-[#2A0E17]',
        text: 'text-[#D91E43] dark:text-[#FDA4AF]',
      };
    case 'Mesure de référence':
      return {
        Icon: Thermometer,
        bg: 'bg-[#EEF2FF] dark:bg-[#1B1842]',
        text: 'text-[#4338CA] dark:text-[#A5B4FC]',
      };
    case 'Session clôturée':
      return {
        Icon: Power,
        bg: 'bg-[#F8FAFC] dark:bg-[#132036]',
        text: 'text-[#64798F] dark:text-[#8DA2B9]',
      };
    default:
      return {
        Icon: Activity,
        bg: 'bg-[#EDF9F7] dark:bg-[#0A2624]',
        text: 'text-[#0B8A7E] dark:text-[#5EEAD4]',
      };
  }
}

export const MedicalNotesPanel: React.FC<MedicalNotesPanelProps> = ({
  language = 'fr',
  tempUnit = 'C',
  profileName,
  currentTemp,
  threshold,
  readings,
  notes,
  onAddNote,
  onDeleteNote,
  onOpenReport,
}) => {
  const m = getStrings(language).medicalNotes;
  const pCopy = getStrings(language).primaryCard;
  const unitSuffix = tempUnitLabel(tempUnit);
  const [selectedCategory, setSelectedCategory] = useState<NotePresetCategory>(
    'Antipyrétique administré'
  );
  const [customText, setCustomText] = useState('');
  const [refTempInput, setRefTempInput] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [showRefQuick, setShowRefQuick] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'horaires'>('notes');
  const [recentAddedLabel, setRecentAddedLabel] = useState<string | null>(null);

  const handleQuickPreset = (category: NotePresetCategory, text: string, label: string) => {
    onAddNote(category, text);
    setRecentAddedLabel(label);
    setTimeout(() => setRecentAddedLabel(null), 1800);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customText.trim();
    if (!trimmed) return;
    let refC: number | undefined;
    if (selectedCategory === 'Mesure de référence' && refTempInput.trim()) {
      const parsed = Number(refTempInput.replace(',', '.'));
      if (Number.isFinite(parsed)) {
        refC = inputTempToCelsius(parsed, tempUnit);
      }
    }
    onAddNote(selectedCategory, trimmed, refC);
    setCustomText('');
    setRefTempInput('');
    setShowComposer(false);
  };

  const handleSaveQuickReference = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(refTempInput.replace(',', '.'));
    if (!Number.isFinite(parsed)) return;
    const minValid = tempUnit === 'F' ? 93 : 34;
    const maxValid = tempUnit === 'F' ? 110 : 43;
    if (parsed < minValid || parsed > maxValid) return;
    const refC = inputTempToCelsius(parsed, tempUnit);
    const formattedRef = `${formatTempFr(refC, tempUnit, language)} ${unitSuffix}`;
    const formattedSensor = `${formatTempFr(currentTemp, tempUnit, language)} ${unitSuffix}`;
    onAddNote(
      'Mesure de référence',
      language === 'ar'
        ? `القياس المرجعي: ${formattedRef} (مقابل ${formattedSensor} على المستشعر)`
        : `Thermomètre de référence : ${formattedRef} (vs capteur ${formattedSensor})`,
      refC
    );
    setRefTempInput('');
    setShowRefQuick(false);
  };

  const sortedNotes = notes.slice().sort((a, b) => b.timestamp - a.timestamp);
  const recentReadings = readings.slice(-6).reverse();

  return (
    <section
      aria-label="Historique et notes médicales"
      className="biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-[#64798F] dark:text-[#8DA2B9]">
              {m.subtitle}
            </p>
            <h2 className="text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
              {m.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenReport}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EFF4F8] border border-[#E1E8EE] dark:text-[#E2ECF5] dark:bg-[#132036] dark:hover:bg-[#192A46] dark:border-[#1E304D] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
            <span>{m.summaryBtn}</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 p-1 bg-[#F8FAFC] dark:bg-[#09111E] rounded-xl border border-[#E1E8EE] dark:border-[#1B2A42]">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`min-h-[34px] text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[#0F1D32] text-white dark:bg-[#0B8A7E]'
                : 'text-[#64798F] dark:text-[#8DA2B9] hover:text-[#0F1D32] dark:hover:text-[#F1F5F9]'
            }`}
          >
            {m.tabNotes} ({sortedNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('horaires')}
            className={`min-h-[34px] text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'horaires'
                ? 'bg-[#0F1D32] text-white dark:bg-[#0B8A7E]'
                : 'text-[#64798F] dark:text-[#8DA2B9] hover:text-[#0F1D32] dark:hover:text-[#F1F5F9]'
            }`}
          >
            {m.tabHourly}
          </button>
        </div>
      </div>

      {activeTab === 'notes' ? (
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {m.quickTags.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  handleQuickPreset(preset.category, preset.defaultText, preset.label)
                }
                className="min-h-[32px] px-2.5 py-1 text-[11px] font-semibold text-[#0F1D32] bg-[#F8FAFC] hover:bg-[#EDF9F7] hover:text-[#087066] border border-[#E1E8EE] hover:border-[#BEEAE4] dark:text-[#E2ECF5] dark:bg-[#09111E] dark:hover:bg-[#0A2624] dark:border-[#1B2A42] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                + {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setRefTempInput(String(convertTemp(currentTemp, tempUnit)));
                setShowRefQuick((v) => !v);
              }}
              className="min-h-[32px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] dark:text-[#A5B4FC] dark:bg-[#1B1842] dark:hover:bg-[#242058] dark:border-[#3730A3] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Thermometer className="w-3 h-3" aria-hidden="true" />
              <span>
                + {pCopy.refTempBtn} ({unitSuffix})
              </span>
            </button>
          </div>

          {recentAddedLabel && (
            <div className="px-3 py-1.5 rounded-lg bg-[#EDF9F7] border border-[#BEEAE4] dark:bg-[#0A2624] dark:border-[#134E4A] text-[11px] font-semibold text-[#087066] dark:text-[#5EEAD4] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{recentAddedLabel} ✓</span>
            </div>
          )}

          {showRefQuick && (
            <form
              onSubmit={handleSaveQuickReference}
              className="p-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] dark:bg-[#1B1842] dark:border-[#3730A3] flex flex-wrap items-center gap-2"
            >
              <label
                htmlFor="quick-ref-temp"
                className="text-xs font-semibold text-[#312E81] dark:text-[#C7D2FE]"
              >
                {pCopy.refTempInputLabel} ({unitSuffix}) :
              </label>
              <input
                id="quick-ref-temp"
                type="number"
                step="0.1"
                min={tempUnit === 'F' ? 93 : 34}
                max={tempUnit === 'F' ? 110 : 43}
                value={refTempInput}
                onChange={(e) => setRefTempInput(e.target.value)}
                required
                className="w-24 min-h-[34px] px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-white text-[#0F1D32] border border-[#C7D2FE] dark:bg-[#0D1626] dark:text-[#F1F5F9] dark:border-[#4338CA]"
              />
              <button
                type="submit"
                className="min-h-[34px] px-3 py-1 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold cursor-pointer"
              >
                {pCopy.refTempSaveBtn}
              </button>
              <button
                type="button"
                onClick={() => setShowRefQuick(false)}
                className="min-h-[34px] px-2 text-xs font-medium text-[#4338CA] dark:text-[#A5B4FC] cursor-pointer"
              >
                {pCopy.refTempCancelBtn}
              </button>
            </form>
          )}

          {showComposer && (
            <form
              onSubmit={handleSubmitCustom}
              className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-2.5"
            >
              <select
                aria-label="Catégorie clinique"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as NotePresetCategory)}
                className="w-full min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] rounded-lg"
              >
                {m.quickTags.map((tag) => (
                  <option key={tag.label} value={tag.category}>
                    {tag.label}
                  </option>
                ))}
                <option value="Mesure de référence">{pCopy.refTempInputLabel}</option>
                <option value="Vomissements">
                  {language === 'ar' ? 'قيء أو غثيان' : 'Vomissements'}
                </option>
                <option value="Douleur / pleurs">
                  {language === 'ar' ? 'ألم أو بكاء مستمر' : 'Douleur / pleurs'}
                </option>
                <option value="Hydratation / boisson">
                  {language === 'ar' ? 'ترطيب / شرب سوائل' : 'Hydratation / boisson'}
                </option>
                <option value="Observation">
                  {language === 'ar' ? 'ملاحظة سريرية' : 'Observation'}
                </option>
              </select>
              {selectedCategory === 'Mesure de référence' && (
                <input
                  type="number"
                  step="0.1"
                  min={tempUnit === 'F' ? 93 : 34}
                  max={tempUnit === 'F' ? 110 : 43}
                  value={refTempInput}
                  onChange={(e) => setRefTempInput(e.target.value)}
                  placeholder={`${pCopy.refTempInputLabel} (${unitSuffix})`}
                  className="w-full min-h-[38px] px-3 py-1.5 font-mono text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] rounded-lg"
                />
              )}
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={`${profileName} (${formatTempFr(currentTemp, tempUnit, language)} °${tempUnit})...`}
                className="w-full min-h-[38px] px-3 py-1.5 text-xs text-[#0F1D32] bg-white border border-[#E1E8EE] dark:text-[#F1F5F9] dark:bg-[#0D1626] dark:border-[#1B2A42] dark:placeholder:text-[#6B849E] rounded-lg"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="px-3 py-1 text-xs text-[#64798F] dark:text-[#9DB0C6] cursor-pointer"
                >
                  {m.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!customText.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B8A7E] hover:bg-[#087066] rounded-lg disabled:opacity-45 cursor-pointer"
                >
                  {m.save}
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#E1E8EE] dark:divide-[#1B2A42] max-h-[260px] overflow-y-auto pe-1">
            {sortedNotes.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#64798F] dark:text-[#8DA2B9]">
                {m.empty}
              </p>
            ) : (
              sortedNotes.map((note) => {
                const { Icon, bg, text } = getNoteIcon(note.category);
                return (
                  <div key={note.id} className="py-3 flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${bg} ${text} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#64798F] dark:text-[#8DA2B9] tabular-nums">
                        <span className="font-mono">{formatTimeFr(note.timestamp, language)}</span>
                        <span className="font-mono font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                          {formatTempFr(note.temperatureAtTime, tempUnit, language)} °{tempUnit}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9] mt-0.5 truncate">
                        {note.category}
                      </p>
                      <p className="text-xs text-[#475B70] dark:text-[#9DB0C6] leading-relaxed mt-0.5">
                        {note.text}
                      </p>
                      {typeof note.referenceTemp === 'number' && (
                        <p className="text-[11px] font-mono font-semibold text-[#4338CA] dark:text-[#A5B4FC] mt-0.5">
                          {language === 'ar' ? 'القياس المرجعي:' : 'Réf. :'}{' '}
                          {formatTempFr(note.referenceTemp, tempUnit, language)} {unitSuffix}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      aria-label={
                        language === 'ar'
                          ? `حذف ${note.category}`
                          : `Supprimer ${note.category}`
                      }
                      className="text-[#8DA2B9] hover:text-[#D91E43] dark:text-[#6B849E] dark:hover:text-[#FDA4AF] p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-[#E1E8EE] dark:divide-[#1B2A42] max-h-[300px] overflow-y-auto pe-1">
          {recentReadings.map((reading) => {
            const st = getTemperatureStatus(reading.value, threshold);
            const meta = getStatusMeta(st, language);
            return (
              <div key={reading.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-[#64798F] dark:text-[#8DA2B9] tabular-nums w-12">
                    {formatTimeFr(reading.timestamp, language)}
                  </span>
                  <div>
                    <p className={`text-xs font-bold ${meta.textClass}`}>{meta.label}</p>
                    <p className="text-[11px] text-[#64798F] dark:text-[#8DA2B9]">
                      {reading.source === 'buffered_sync'
                        ? language === 'ar'
                          ? 'مزامنة من الذاكرة الداخلية'
                          : 'Synchronisé mémoire interne'
                        : reading.source === 'home_hub'
                        ? language === 'ar'
                          ? 'مرحل منزلي'
                          : 'Relais domestique'
                        : language === 'ar'
                        ? 'اتصال مباشر BLE'
                        : 'BLE en direct'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums">
                  {formatTempFr(reading.value, tempUnit, language)} °{tempUnit}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2.5">
        <p className="text-[11px] text-[#64798F] dark:text-[#7B91A8] leading-relaxed">
          {language === 'ar'
            ? 'الحالة العامة للطفل وتوجيه الطبيب أهم دائماً من رقم منفرد.'
            : "L'état général de l'enfant et l'avis médical priment toujours sur un chiffre isolé."}
        </p>

        <button
          type="button"
          onClick={() => {
            setActiveTab('notes');
            setShowComposer((v) => !v);
          }}
          className="min-h-[42px] w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#087066] bg-[#EDF9F7] hover:bg-[#DFF3F0] border border-[#BEEAE4] dark:text-[#5EEAD4] dark:bg-[#0A2624] dark:hover:bg-[#113936] dark:border-[#134E4A] rounded-xl transition-colors cursor-pointer"
        >
          <ClipboardPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{m.addCustom}</span>
        </button>
      </div>
    </section>
  );
};
