import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
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
        bg: 'bg-[#FFF3F0] dark:bg-[#311E1B]',
        text: 'text-[#EA580C] dark:text-[#FB923C]',
      };
    case 'Compresses tièdes':
      return {
        Icon: Snowflake,
        bg: 'bg-[#EFF8FB] dark:bg-[#132C46]',
        text: 'text-[#0284C7] dark:text-[#38BDF8]',
      };
    case 'Fatigue / léthargie':
      return {
        Icon: Moon,
        bg: 'bg-[#F5F3FF] dark:bg-[#241B40]',
        text: 'text-[#6D28D9] dark:text-[#C4B5FD]',
      };
    case 'Vomissements':
    case 'Douleur / pleurs':
      return {
        Icon: AlertCircle,
        bg: 'bg-[#FFF1F2] dark:bg-[#2F1320]',
        text: 'text-[#E11D48] dark:text-[#FDA4AF]',
      };
    case 'Mesure de référence':
      return {
        Icon: Thermometer,
        bg: 'bg-[#EEF2FF] dark:bg-[#1E1B4B]',
        text: 'text-[#4338CA] dark:text-[#A5B4FC]',
      };
    case 'Session clôturée':
      return {
        Icon: Power,
        bg: 'bg-[#F3F7F9] dark:bg-[#162947]',
        text: 'text-[#647B8C] dark:text-[#8BA3BC]',
      };
    default:
      return {
        Icon: Activity,
        bg: 'bg-[#F0FDFA] dark:bg-[#0D2B2C]',
        text: 'text-[#0D9488] dark:text-[#5EEAD4]',
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
            <p className="text-xs font-medium text-[#647B8C] dark:text-[#8BA3BC]">
              {m.subtitle}
            </p>
            <h2 className="text-lg font-bold text-[#162642] dark:text-[#F1F6FA]">
              {m.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenReport}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#162642] bg-[#F3F7F9] hover:bg-[#E4EDF2] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] rounded-full transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" aria-hidden="true" />
            <span>{m.summaryBtn}</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 p-1 bg-[#F3F7F9] dark:bg-[#0B172B] rounded-full border border-[#E6EFF2] dark:border-[#1E3354]">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`min-h-[36px] text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[#162642] text-white dark:bg-[#0D9488]'
                : 'text-[#647B8C] dark:text-[#8BA3BC] hover:text-[#162642] dark:hover:text-[#F1F6FA]'
            }`}
          >
            {m.tabNotes} ({sortedNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('horaires')}
            className={`min-h-[36px] text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              activeTab === 'horaires'
                ? 'bg-[#162642] text-white dark:bg-[#0D9488]'
                : 'text-[#647B8C] dark:text-[#8BA3BC] hover:text-[#162642] dark:hover:text-[#F1F6FA]'
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
                onClick={() => onAddNote(preset.category, preset.defaultText)}
                className="min-h-[34px] px-2.5 py-1 text-[11px] font-semibold text-[#162642] bg-[#F3F7F9] hover:bg-[#E2EDF2] dark:text-[#E2ECF5] dark:bg-[#162947] dark:hover:bg-[#1D355B] rounded-full transition-colors whitespace-nowrap cursor-pointer"
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
              className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] dark:text-[#A5B4FC] dark:bg-[#1E1B4B] dark:hover:bg-[#272361] dark:border-[#3730A3] rounded-full transition-colors whitespace-nowrap cursor-pointer"
            >
              <Thermometer className="w-3 h-3" aria-hidden="true" />
              <span>
                + {pCopy.refTempBtn} ({unitSuffix})
              </span>
            </button>
          </div>

          {showRefQuick && (
            <form
              onSubmit={handleSaveQuickReference}
              className="p-3 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] dark:bg-[#1E1B4B] dark:border-[#3730A3] flex flex-wrap items-center gap-2"
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
                className="w-24 min-h-[34px] px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-white text-[#162642] border border-[#C7D2FE] dark:bg-[#132544] dark:text-[#F1F6FA] dark:border-[#4338CA]"
              />
              <button
                type="submit"
                className="min-h-[34px] px-3 py-1 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold cursor-pointer"
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
              className="p-3 rounded-2xl bg-[#F7FAFB] border border-[#E2ECF0] dark:bg-[#0B172B] dark:border-[#1E3354] space-y-2.5"
            >
              <select
                aria-label="Catégorie clinique"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as NotePresetCategory)}
                className="w-full min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#132544] dark:border-[#243E63] rounded-xl"
              >
                {m.quickTags.map((tag) => (
                  <option key={tag.label} value={tag.category}>
                    {tag.label}
                  </option>
                ))}
                <option value="Mesure de référence">{pCopy.refTempInputLabel}</option>
                <option value="Vomissements">Vomissements</option>
                <option value="Douleur / pleurs">Douleur / pleurs</option>
                <option value="Hydratation / boisson">Hydratation / boisson</option>
                <option value="Observation">Observation</option>
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
                  className="w-full min-h-[38px] px-3 py-1.5 font-mono text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#132544] dark:border-[#243E63] rounded-xl"
                />
              )}
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={`${profileName} (${formatTempFr(currentTemp, tempUnit, language)} °${tempUnit})...`}
                className="w-full min-h-[38px] px-3 py-1.5 text-xs text-[#162642] bg-white border border-[#DCE6EA] dark:text-[#F1F6FA] dark:bg-[#132544] dark:border-[#243E63] dark:placeholder:text-[#7B95AF] rounded-xl"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="px-3 py-1 text-xs text-[#647B8C] dark:text-[#94ACC4] cursor-pointer"
                >
                  {m.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!customText.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0D9488] rounded-full disabled:opacity-45 cursor-pointer"
                >
                  {m.save}
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#EFF4F6] dark:divide-[#1E3354] max-h-[260px] overflow-y-auto pr-1">
            {sortedNotes.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#647B8C] dark:text-[#8BA3BC]">
                {m.empty}
              </p>
            ) : (
              sortedNotes.map((note) => {
                const { Icon, bg, text } = getNoteIcon(note.category);
                return (
                  <div key={note.id} className="py-3 flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${bg} ${text} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#647B8C] dark:text-[#8BA3BC] tabular-nums">
                        <span className="font-mono">{formatTimeFr(note.timestamp)}</span>
                        <span className="font-mono font-bold text-[#162642] dark:text-[#F1F6FA]">
                          {formatTempFr(note.temperatureAtTime, tempUnit, language)} °{tempUnit}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#162642] dark:text-[#F1F6FA] mt-0.5 truncate">
                        {note.category}
                      </p>
                      <p className="text-xs text-[#526675] dark:text-[#94ACC4] leading-relaxed mt-0.5">
                        {note.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      aria-label={`Supprimer ${note.category}`}
                      className="text-[#94A7B6] hover:text-[#E11D48] dark:text-[#6B849E] dark:hover:text-[#FDA4AF] p-1 cursor-pointer shrink-0"
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
        <div className="flex-1 divide-y divide-[#EFF4F6] dark:divide-[#1E3354] max-h-[300px] overflow-y-auto pr-1">
          {recentReadings.map((reading) => {
            const st = getTemperatureStatus(reading.value, threshold);
            const meta = getStatusMeta(st, language);
            return (
              <div key={reading.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-[#647B8C] dark:text-[#8BA3BC] tabular-nums w-12">
                    {formatTimeFr(reading.timestamp)}
                  </span>
                  <div>
                    <p className={`text-xs font-bold ${meta.textClass}`}>{meta.label}</p>
                    <p className="text-[11px] text-[#647B8C] dark:text-[#8BA3BC]">
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
                <span className="font-mono text-sm font-bold text-[#162642] dark:text-[#F1F6FA] tabular-nums">
                  {formatTempFr(reading.value, tempUnit, language)} °{tempUnit}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2.5">
        <p className="text-[11px] text-[#647B8C] dark:text-[#8BA3BC] leading-relaxed">
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
          className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] dark:text-[#5EEAD4] dark:bg-[#0D2B2C] dark:hover:bg-[#12383A] dark:border-[#134E4A] rounded-full transition-colors cursor-pointer"
        >
          <ClipboardPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{m.addCustom}</span>
        </button>
      </div>
    </section>
  );
};
