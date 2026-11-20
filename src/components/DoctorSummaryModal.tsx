import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Check,
  Copy,
  Download,
  FileDown,
  FileText,
  Printer,
  Share2,
  X,
} from 'lucide-react';
import { AppLanguage, ChildProfile, TemperatureUnit } from '../types/biotemp';
import {
  computeStats,
  formatDateTimeFr,
  formatTempFr,
  formatTimeFr,
  getTemperatureStatus,
  tempUnitLabel,
} from '../utils/temperature';
import { exportFullHistoryPdf } from '../utils/pdfExport';

interface DoctorSummaryModalProps {
  isOpen: boolean;
  profile: ChildProfile;
  language?: AppLanguage;
  tempUnit?: TemperatureUnit;
  onClose: () => void;
}

export const DoctorSummaryModal: React.FC<DoctorSummaryModalProps> = ({
  isOpen,
  profile,
  language = 'fr',
  tempUnit = 'C',
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharedStatus, setSharedStatus] = useState(false);
  const [pdfExported, setPdfExported] = useState(false);
  const unitSuffix = tempUnitLabel(tempUnit);

  const readings = profile.readings;
  const stats = useMemo(
    () => computeStats(readings, profile.threshold),
    [readings, profile.threshold]
  );

  const chartData = useMemo(() => {
    const width = 620;
    const height = 180;
    const padLeft = 44;
    const padRight = 16;
    const padTop = 18;
    const padBottom = 26;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    if (readings.length === 0) {
      return {
        width,
        height,
        padLeft,
        padRight,
        padTop,
        padBottom,
        plotW,
        plotH,
        points: [] as Array<{ x: number; y: number; value: number; isSynced: boolean; isAbove: boolean }>,
        linePath: '',
        areaPath: '',
        thresholdY: padTop + plotH / 2,
        yTicks: [] as Array<{ label: string; y: number }>,
        xTicks: [] as Array<{ label: string; x: number }>,
        notePins: [] as Array<{ id: string; x: number; y: number; refY: number | null; label: string }>,
      };
    }

    const values = readings.map((r) => r.value);
    const refValues = profile.notes
      .map((n) => n.referenceTemp)
      .filter((v): v is number => typeof v === 'number');
    const minY = Math.floor((Math.min(...values, ...refValues, profile.threshold - 0.8, 36.0) - 0.2) * 2) / 2;
    const maxY = Math.ceil((Math.max(...values, ...refValues, profile.threshold + 0.6, 39.2) + 0.2) * 2) / 2;
    const minTs = readings[0].timestamp;
    const maxTs = readings[readings.length - 1].timestamp;
    const tsSpan = Math.max(maxTs - minTs, 1);

    const xForTs = (ts: number) => padLeft + ((ts - minTs) / tsSpan) * plotW;
    const yForTemp = (temp: number) =>
      padTop + plotH - ((temp - minY) / Math.max(maxY - minY, 0.5)) * plotH;

    const points = readings.map((r) => ({
      x: xForTs(r.timestamp),
      y: yForTemp(r.value),
      value: r.value,
      isSynced: r.source === 'buffered_sync',
      isAbove: r.value >= profile.threshold,
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
        : '';

    const yTicks: Array<{ label: string; y: number }> = [];
    for (let t = minY; t <= maxY + 0.01; t += 0.5) {
      const val = Number(t.toFixed(1));
      if (Math.round(val * 10) % 10 === 0 || val === profile.threshold) {
        yTicks.push({ label: formatTempFr(val, tempUnit, language), y: yForTemp(val) });
      }
    }

    const xTicks: Array<{ label: string; x: number }> = [];
    const tickCount = Math.min(5, Math.max(2, readings.length));
    for (let i = 0; i < tickCount; i++) {
      const ratio = i / (tickCount - 1);
      const ts = minTs + ratio * tsSpan;
      xTicks.push({ label: formatTimeFr(ts, language), x: padLeft + ratio * plotW });
    }

    const notePins = profile.notes
      .filter((n) => n.timestamp >= minTs - 15 * 60 * 1000 && n.timestamp <= maxTs + 15 * 60 * 1000)
      .map((n, idx) => {
        const clamped = Math.min(Math.max(n.timestamp, minTs), maxTs);
        return {
          id: n.id,
          x: xForTs(clamped),
          y: yForTemp(n.temperatureAtTime),
          refY: typeof n.referenceTemp === 'number' ? yForTemp(n.referenceTemp) : null,
          label: typeof n.referenceTemp === 'number' ? `R${idx + 1}` : `N${idx + 1}`,
        };
      });

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotW,
      plotH,
      points,
      linePath,
      areaPath,
      thresholdY: yForTemp(profile.threshold),
      yTicks,
      xTicks,
      notePins,
    };
  }, [readings, profile.notes, profile.threshold, tempUnit, language]);

  const distribution = useMemo(() => {
    const total = Math.max(readings.length, 1);
    let normal = 0;
    let elevated = 0;
    let fever = 0;
    for (const r of readings) {
      const st = getTemperatureStatus(r.value, profile.threshold);
      if (st === 'high_fever') fever++;
      else if (st === 'elevated') elevated++;
      else normal++;
    }

    const bucketCount = Math.min(8, Math.max(1, readings.length));
    const step = readings.length / bucketCount;
    const buckets: Array<{ label: string; avg: number; status: ReturnType<typeof getTemperatureStatus> }> = [];
    for (let i = 0; i < bucketCount; i++) {
      const start = Math.floor(i * step);
      const end = Math.max(start + 1, Math.floor((i + 1) * step));
      const slice = readings.slice(start, end);
      if (slice.length > 0) {
        const avg = Number(
          (slice.reduce((sum, r) => sum + r.value, 0) / slice.length).toFixed(1)
        );
        buckets.push({
          label: formatTimeFr(slice[0].timestamp, language),
          avg,
          status: getTemperatureStatus(avg, profile.threshold),
        });
      }
    }

    return {
      total,
      normal,
      elevated,
      fever,
      normalPct: Math.round((normal / total) * 100),
      elevatedPct: Math.round((elevated / total) * 100),
      feverPct: Math.round((fever / total) * 100),
      buckets,
    };
  }, [readings, profile.threshold, language]);

  if (!isOpen) return null;

  const latest = readings[readings.length - 1];
  const sortedNotes = profile.notes.slice().sort((a, b) => b.timestamp - a.timestamp);

  const buildPlainTextSummary = () => {
    const isAr = language === 'ar';
    const refLabel = isAr ? 'المرجعي' : 'Réf.';
    const lines = [
      isAr
        ? `الملخص الحراري BIOTEMP — ${profile.name} (${profile.ageLabel})`
        : `RÉSUMÉ THERMIQUE BIOTEMP — ${profile.name} (${profile.ageLabel})`,
      isAr
        ? `الوحدة: ${profile.deviceName} (${profile.deviceId}) | اللاصقة: ${profile.patchLabel}`
        : `Module : ${profile.deviceName} (${profile.deviceId}) | Patch : ${profile.patchLabel}`,
      isAr
        ? `عتبة التنبيه المضبوطة: ${formatTempFr(profile.threshold, tempUnit, language)} ${unitSuffix}`
        : `Seuil d'alerte configuré : ${formatTempFr(profile.threshold, tempUnit, language)} ${unitSuffix}`,
      isAr
        ? `آخر قياس: ${
            latest
              ? `${formatTempFr(latest.value, tempUnit, language)} ${unitSuffix} (${formatDateTimeFr(
                  latest.timestamp,
                  language
                )})`
              : '—'
          }`
        : `Dernière mesure : ${
            latest
              ? `${formatTempFr(latest.value, tempUnit, language)} ${unitSuffix} (${formatDateTimeFr(
                  latest.timestamp,
                  language
                )})`
              : '—'
          }`,
      isAr
        ? `الإحصائيات (السجل الكامل): الأدنى ${formatTempFr(
            stats.min,
            tempUnit,
            language
          )} ${unitSuffix} | المتوسط ${formatTempFr(
            stats.avg,
            tempUnit,
            language
          )} ${unitSuffix} | الأعلى ${formatTempFr(stats.max, tempUnit, language)} ${unitSuffix}`
        : `Statistiques (historique complet) : Min ${formatTempFr(
            stats.min,
            tempUnit,
            language
          )} ${unitSuffix} | Moy ${formatTempFr(
            stats.avg,
            tempUnit,
            language
          )} ${unitSuffix} | Max ${formatTempFr(stats.max, tempUnit, language)} ${unitSuffix}`,
      '',
      isAr ? 'السجل الطبي :' : 'JOURNAL MÉDICAL :',
      ...sortedNotes.map((n) => {
        const refPart =
          typeof n.referenceTemp === 'number'
            ? ` (${refLabel} ${formatTempFr(n.referenceTemp, tempUnit, language)} ${unitSuffix})`
            : '';
        return `- ${formatDateTimeFr(n.timestamp, language)} | ${formatTempFr(
          n.temperatureAtTime,
          tempUnit,
          language
        )} ${unitSuffix}${refPart} | ${n.category} : ${n.text}`;
      }),
      '',
      isAr
        ? 'ملاحظة: قياس جلدي معاير تحت الإبط (أداة متابعة منزلية لا تغني عن الفحص الطبي).'
        : 'Note : Mesure cutanée calibrée sous l’aisselle (outil de suivi domestique ne remplaçant pas un avis médical).',
    ];
    return lines.join('\n');
  };

  const copySummaryToClipboard = async (): Promise<boolean> => {
    const text = buildPlainTextSummary();
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const handleCopyText = async () => {
    const ok = await copySummaryToClipboard();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareSummary = async () => {
    const summaryText = buildPlainTextSummary();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `BioTemp — ${profile.name}`,
          text: summaryText,
        });
        setSharedStatus(true);
        setTimeout(() => setSharedStatus(false), 2500);
        return;
      } catch {
        // User cancelled or share unsupported in iframe -> fall back to download + copy
      }
    }
    await copySummaryToClipboard();
    handleDownloadTxt();
    setSharedStatus(true);
    setTimeout(() => setSharedStatus(false), 2500);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([buildPlainTextSummary()], {
      type: 'text/plain;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `biotemp-resume-${profile.name.toLowerCase()}-${profile.deviceId.toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const header = `Horodatage;Temperature_${tempUnit};Source;Note_Medicale\n`;
    const rows = readings.map((r) => {
      const matchingNote = profile.notes.find(
        (n) => Math.abs(n.timestamp - r.timestamp) < 10 * 60 * 1000
      );
      const noteCell = matchingNote
        ? `"${matchingNote.category} - ${matchingNote.text.replace(/"/g, '""')}"`
        : '';
      return `${formatDateTimeFr(r.timestamp, language)};${formatTempFr(
        r.value,
        tempUnit,
        language
      )};${r.source};${noteCell}`;
    });
    const blob = new Blob([header + rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `biotemp-${profile.name.toLowerCase()}-${profile.deviceId.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    exportFullHistoryPdf(profile, tempUnit, language);
    setPdfExported(true);
    setTimeout(() => setPdfExported(false), 2800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-summary-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1D32]/45 dark:bg-[#030712]/75 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-[#0D1626] border border-[#E1E8EE] dark:border-[#1B2A42] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-[#E1E8EE] dark:border-[#1B2A42] flex items-center justify-between gap-4">
          <div>
            <h2 id="doctor-summary-title" className="text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
              {language === 'ar'
                ? `ملخص المتابعة الطبية — ${profile.name}`
                : `Aperçu du résumé médical — ${profile.name}`}
            </h2>
            <p className="text-xs text-[#64798F] dark:text-[#7B91A8] tabular-nums">
              {profile.ageLabel} · {profile.deviceName} ({profile.deviceId}) · {readings.length}{' '}
              {language === 'ar' ? 'قراءة' : 'relevés'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'ar' ? 'إغلاق الملخص الطبي' : "Fermer l'aperçu médical"}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#475B70] hover:bg-[#F4F7F9] hover:text-[#0F1D32] dark:text-[#9DB0C6] dark:hover:bg-[#122038] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* 4-column unified telemetry bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] divide-y sm:divide-y-0 sm:divide-x divide-[#E1E8EE] dark:divide-[#1B2A42]">
            <div className="p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64798F] dark:text-[#7B91A8]">
                {language === 'ar' ? 'الحالية' : 'Actuelle'}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums">
                {latest ? `${formatTempFr(latest.value, tempUnit, language)} ${unitSuffix}` : '—'}
              </p>
            </div>
            <div className="p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64798F] dark:text-[#7B91A8]">
                {language === 'ar' ? 'الأدنى' : 'Minimum'}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-[#0B8A7E] dark:text-[#2DD4BF] tabular-nums">
                {formatTempFr(stats.min, tempUnit, language)} {unitSuffix}
              </p>
            </div>
            <div className="p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64798F] dark:text-[#7B91A8]">
                {language === 'ar' ? 'الأعلى' : 'Maximum'}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-[#D91E43] dark:text-[#FB7185] tabular-nums">
                {formatTempFr(stats.max, tempUnit, language)} {unitSuffix}
              </p>
            </div>
            <div className="p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64798F] dark:text-[#7B91A8]">
                {language === 'ar' ? 'تجاوز العتبة' : 'Relevés ≥ seuil'}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums">
                {stats.aboveThresholdCount}
              </p>
            </div>
          </div>

          {/* Graphique 1 : Courbe complète incluse dans le PDF */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>
                  {language === 'ar'
                    ? 'المنحنى الحراري الكامل (مرفق في PDF)'
                    : 'Courbe thermique complète (incluse dans le PDF)'}
                </span>
              </h3>
              <span className="text-[11px] font-mono text-[#64798F] dark:text-[#7B91A8] tabular-nums">
                {language === 'ar' ? 'المتوسط' : 'Moy'}{' '}
                {formatTempFr(stats.avg, tempUnit, language)} {unitSuffix} ·{' '}
                {language === 'ar' ? 'العتبة' : 'Seuil'}{' '}
                {formatTempFr(profile.threshold, tempUnit, language)} {unitSuffix}
              </span>
            </div>

            <div dir="ltr" className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full h-auto min-w-[440px]"
                role="img"
                aria-label="Aperçu de la courbe thermique complète"
              >
                <defs>
                  <linearGradient id="modalCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B8A7E" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#0B8A7E" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {chartData.thresholdY > chartData.padTop && (
                  <rect
                    x={chartData.padLeft}
                    y={chartData.padTop}
                    width={chartData.plotW}
                    height={Math.max(0, chartData.thresholdY - chartData.padTop)}
                    className="fill-[#FEF1F3] dark:fill-[#4C0519]/35"
                    opacity="0.7"
                  />
                )}

                {chartData.yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={chartData.padLeft}
                      y1={tick.y}
                      x2={chartData.width - chartData.padRight}
                      y2={tick.y}
                      className="stroke-[#E1E8EE] dark:stroke-[#1B2A42]"
                      strokeWidth="1"
                    />
                    <text
                      x={chartData.padLeft - 6}
                      y={tick.y + 3.5}
                      textAnchor="end"
                      className="fill-[#64798F] dark:fill-[#7B91A8] text-[10px] font-mono"
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}

                {chartData.xTicks.map((tick, i) => (
                  <text
                    key={i}
                    x={tick.x}
                    y={chartData.height - 6}
                    textAnchor="middle"
                    className="fill-[#64798F] dark:fill-[#7B91A8] text-[10px] font-mono"
                  >
                    {tick.label}
                  </text>
                ))}

                <line
                  x1={chartData.padLeft}
                  y1={chartData.thresholdY}
                  x2={chartData.width - chartData.padRight}
                  y2={chartData.thresholdY}
                  className="stroke-[#D91E43] dark:stroke-[#FB7185]"
                  strokeWidth="1.4"
                  strokeDasharray="5 4"
                />

                {chartData.areaPath && <path d={chartData.areaPath} fill="url(#modalCurveGrad)" />}
                {chartData.linePath && (
                  <path
                    d={chartData.linePath}
                    fill="none"
                    className="stroke-[#0B8A7E] dark:stroke-[#2DD4BF]"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {chartData.points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.isAbove || pt.isSynced ? 3.5 : 2.5}
                    fill={pt.isAbove ? '#D91E43' : pt.isSynced ? '#2563EB' : '#0B8A7E'}
                  />
                ))}

                {chartData.notePins.map((pin) => (
                  <g key={pin.id}>
                    <line
                      x1={pin.x}
                      y1={pin.y}
                      x2={pin.x}
                      y2={chartData.padTop + 10}
                      className={
                        pin.refY !== null
                          ? 'stroke-[#4F46E5] dark:stroke-[#818CF8]'
                          : 'stroke-[#0F1D32] dark:stroke-[#5EEAD4]'
                      }
                      strokeWidth="1"
                      strokeOpacity="0.45"
                    />
                    {pin.refY !== null && (
                      <rect
                        x={pin.x - 4.5}
                        y={pin.refY - 4.5}
                        width={9}
                        height={9}
                        transform={`rotate(45 ${pin.x} ${pin.refY})`}
                        className="fill-[#4F46E5] dark:fill-[#818CF8] stroke-white dark:stroke-[#0D1626]"
                        strokeWidth="1.4"
                      />
                    )}
                    <circle
                      cx={pin.x}
                      cy={chartData.padTop + 6}
                      r="7"
                      className="fill-white dark:fill-[#0D1626]"
                      stroke={pin.refY !== null ? '#4F46E5' : '#0B8A7E'}
                      strokeWidth="1.5"
                    />
                    <text
                      x={pin.x}
                      y={chartData.padTop + 9}
                      textAnchor="middle"
                      className={`text-[8px] font-bold ${
                        pin.refY !== null
                          ? 'fill-[#4338CA] dark:fill-[#A5B4FC]'
                          : 'fill-[#0B8A7E] dark:fill-[#5EEAD4]'
                      }`}
                    >
                      {pin.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Graphique 2 : Répartition des états et profil horaire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-2.5">
              <h3 className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
                <span>
                  {language === 'ar' ? 'التوزيع حسب النطاق الحراري' : 'Répartition par zone thermique'}
                </span>
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[#475B70] dark:text-[#9DB0C6] mb-1 tabular-nums">
                    <span>{language === 'ar' ? 'طبيعية' : 'Normale'}</span>
                    <span className="font-mono font-semibold">{distribution.normal} ({distribution.normalPct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E1E8EE] dark:bg-[#1B2A42] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0B8A7E]"
                      style={{ width: `${distribution.normalPct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[#475B70] dark:text-[#9DB0C6] mb-1 tabular-nums">
                    <span>{language === 'ar' ? 'ارتفاع طفيف' : 'Légère hausse'}</span>
                    <span className="font-mono font-semibold">{distribution.elevated} ({distribution.elevatedPct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E1E8EE] dark:bg-[#1B2A42] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#D97706]"
                      style={{ width: `${distribution.elevatedPct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[#475B70] dark:text-[#9DB0C6] mb-1 tabular-nums">
                    <span>
                      {language === 'ar' ? 'ارتفاع' : 'Fièvre'} ≥{' '}
                      {formatTempFr(profile.threshold, tempUnit, language)} {unitSuffix}
                    </span>
                    <span className="font-mono font-semibold">{distribution.fever} ({distribution.feverPct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E1E8EE] dark:bg-[#1B2A42] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#D91E43]"
                      style={{ width: `${distribution.feverPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] flex flex-col justify-between gap-2">
              <h3 className="text-xs font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                {language === 'ar' ? 'المتوسط حسب الفترة الزمنية' : 'Moyenne par tranche chronologique'}
              </h3>
              <div dir="ltr" className="flex items-end justify-between gap-1.5 h-24 pt-2">
                {distribution.buckets.map((b, idx) => {
                  const pct = Math.min(100, Math.max(18, ((b.avg - 35.5) / 4.5) * 100));
                  const barColor =
                    b.status === 'high_fever'
                      ? 'bg-[#D91E43]'
                      : b.status === 'elevated'
                      ? 'bg-[#D97706]'
                      : 'bg-[#0B8A7E]';
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[9px] font-mono text-[#475B70] dark:text-[#9DB0C6] tabular-nums">
                        {formatTempFr(b.avg, tempUnit, language)}
                      </span>
                      <div className="w-full max-w-[22px] flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-md ${barColor}`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-[#64798F] dark:text-[#7B91A8] tabular-nums">
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#0F1D32] dark:text-[#F1F5F9] mb-2">
              {language === 'ar'
                ? `الأحداث والملاحظات السريرية (${sortedNotes.length})`
                : `Événements et notes cliniques horodatées (${sortedNotes.length})`}
            </h3>
            <div className="divide-y divide-[#E1E8EE] dark:divide-[#1B2A42] border border-[#E1E8EE] dark:border-[#1B2A42] rounded-xl px-4">
              {sortedNotes.length === 0 ? (
                <p className="py-4 text-xs text-[#64798F] dark:text-[#7B91A8]">
                  {language === 'ar'
                    ? 'لا توجد ملاحظات سريرية مسجلة.'
                    : 'Aucune note clinique enregistrée.'}
                </p>
              ) : (
                sortedNotes.map((n) => (
                  <div
                    key={n.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#087066] dark:text-[#5EEAD4]">
                        {n.category}
                      </span>
                      <span className="text-[#475B70] dark:text-[#9DB0C6]"> — {n.text}</span>
                    </div>
                    <div className="font-mono text-[#475B70] dark:text-[#9DB0C6] tabular-nums whitespace-nowrap shrink-0">
                      {formatDateTimeFr(n.timestamp, language)} ·{' '}
                      {formatTempFr(n.temperatureAtTime, tempUnit, language)} {unitSuffix}
                      {typeof n.referenceTemp === 'number' && (
                        <span className="ms-1.5 text-[#4338CA] dark:text-[#A5B4FC]">
                          ({language === 'ar' ? 'المرجعي' : 'Réf.'}{' '}
                          {formatTempFr(n.referenceTemp, tempUnit, language)} {unitSuffix})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-xs text-[#64798F] dark:text-[#7B91A8] leading-relaxed">
            {language === 'ar'
              ? 'قياس جلدي معاير تحت الإبط • أداة متابعة منزلية مساعدة لا تغني عن ميزان مرجعي أو الفحص الطبي.'
              : "Mesure cutanée calibrée sous l'aisselle • Outil de suivi domestique ne remplaçant pas un thermomètre de référence ni l'avis médical."}
          </p>
        </div>

        <div className="px-6 py-4 bg-[#F8FAFC] dark:bg-[#09111E] border-t border-[#E1E8EE] dark:border-[#1B2A42] flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShareSummary}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F1D32] hover:bg-[#1B2F4D] dark:bg-[#1B2A42] dark:hover:bg-[#243958] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {sharedStatus ? (
                <>
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{language === 'ar' ? 'تمت المشاركة / الحفظ' : 'Prêt à partager'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{language === 'ar' ? 'مشاركة' : 'Partager'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#087066] bg-[#EDF9F7] hover:bg-[#D8F2EE] border border-[#BEEAE4] dark:text-[#5EEAD4] dark:bg-[#0A2624] dark:hover:bg-[#103835] dark:border-[#134E4A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{language === 'ar' ? 'تم النسخ' : 'Résumé copié'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{language === 'ar' ? 'نسخ الملخص' : 'Copier'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F1D32] bg-white hover:bg-[#F4F7F9] border border-[#E1E8EE] dark:text-[#E2E8F0] dark:bg-[#0D1626] dark:hover:bg-[#122038] dark:border-[#1E304D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>TXT</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F1D32] bg-white hover:bg-[#F4F7F9] border border-[#E1E8EE] dark:text-[#E2E8F0] dark:bg-[#0D1626] dark:hover:bg-[#122038] dark:border-[#1E304D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F1D32] bg-white hover:bg-[#F4F7F9] border border-[#E1E8EE] dark:text-[#E2E8F0] dark:bg-[#0D1626] dark:hover:bg-[#122038] dark:border-[#1E304D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{language === 'ar' ? 'طباعة' : 'Imprimer'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPdf}
            className="min-h-[38px] inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0B8A7E] hover:bg-[#087066] rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {pdfExported ? (
              <>
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{language === 'ar' ? 'تم تصدير PDF' : 'PDF exporté'}</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{language === 'ar' ? 'تصدير PDF كامل' : 'Exporter PDF complet'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
