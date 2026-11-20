import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  MessageSquare,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  AppLanguage,
  MedicalNote,
  TemperatureReading,
  TemperatureUnit,
  TimeWindowHours,
} from '../types/biotemp';
import { getStrings } from '../utils/i18n';
import {
  computeStats,
  formatTempDelta,
  formatTempFr,
  formatTimeFr,
  tempUnitLabel,
} from '../utils/temperature';

interface ThermalChartProps {
  language: AppLanguage;
  tempUnit: TemperatureUnit;
  profileName: string;
  readings: TemperatureReading[];
  notes: MedicalNote[];
  threshold: number;
  timeWindow: TimeWindowHours;
  onChangeTimeWindow: (hours: TimeWindowHours) => void;
}

const TIME_WINDOWS: TimeWindowHours[] = [1, 6, 12, 24];

function formatDurationLabel(ms: number, language: AppLanguage): string {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  if (totalMinutes < 60) {
    return language === 'ar' ? `${totalMinutes} د` : `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hUnit = language === 'ar' ? 'س' : 'h';
  return mins > 0 ? `${hours} ${hUnit} ${String(mins).padStart(2, '0')}` : `${hours} ${hUnit}`;
}

export const ThermalChart: React.FC<ThermalChartProps> = ({
  language,
  tempUnit,
  profileName,
  readings,
  notes,
  threshold,
  timeWindow,
  onChangeTimeWindow,
}) => {
  const t = getStrings(language).chart;
  const unitSuffix = tempUnitLabel(tempUnit);
  const shouldReduceMotion = useReducedMotion();
  const clipId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const touchPanStartRef = useRef<{ x: number; panRatio: number } | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cursorModeActive, setCursorModeActive] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panRatio, setPanRatio] = useState<number>(1);

  useEffect(() => {
    setZoomLevel(1);
    setPanRatio(1);
    setHoveredId(null);
    setCursorModeActive(false);
  }, [profileName, timeWindow]);

  const rawLatestValue = readings[readings.length - 1]?.value ?? 37.0;
  const latestSpring = useSpring(rawLatestValue, {
    stiffness: shouldReduceMotion ? 1000 : 90,
    damping: shouldReduceMotion ? 100 : 20,
    mass: 0.85,
  });
  const [animatedLatestValue, setAnimatedLatestValue] = useState(rawLatestValue);

  useEffect(() => {
    if (shouldReduceMotion) {
      latestSpring.jump(rawLatestValue);
      setAnimatedLatestValue(rawLatestValue);
    } else {
      latestSpring.set(rawLatestValue);
    }
  }, [rawLatestValue, shouldReduceMotion, latestSpring]);

  useMotionValueEvent(latestSpring, 'change', (latest) => {
    setAnimatedLatestValue(latest);
  });

  const windowReadings = useMemo(() => {
    if (readings.length === 0) return [];
    const latestTs = readings[readings.length - 1].timestamp;
    const cutoff = latestTs - timeWindow * 60 * 60 * 1000;
    const subset = readings.filter((r) => r.timestamp >= cutoff);
    return subset.length >= 2 ? subset : readings.slice(-2);
  }, [readings, timeWindow]);

  const baseMinTs = windowReadings[0]?.timestamp ?? 0;
  const baseMaxTs = windowReadings[windowReadings.length - 1]?.timestamp ?? 1;
  const baseSpan = Math.max(baseMaxTs - baseMinTs, 1);

  const viewSpan = Math.max(baseSpan / zoomLevel, 5 * 60 * 1000);
  const maxOffsetSpan = Math.max(0, baseSpan - viewSpan);
  const viewMinTs = baseMinTs + panRatio * maxOffsetSpan;
  const viewMaxTs = viewMinTs + viewSpan;

  const visibleReadings = useMemo(() => {
    if (windowReadings.length === 0) return [];
    const inside: TemperatureReading[] = [];
    for (let i = 0; i < windowReadings.length; i++) {
      const r = windowReadings[i];
      if (r.timestamp >= viewMinTs && r.timestamp <= viewMaxTs) {
        inside.push(r);
      }
    }
    if (inside.length >= 2) return inside;
    const sortedByDist = windowReadings
      .slice()
      .sort(
        (a, b) =>
          Math.abs(a.timestamp - (viewMinTs + viewSpan / 2)) -
          Math.abs(b.timestamp - (viewMinTs + viewSpan / 2))
      );
    return sortedByDist.slice(0, 2).sort((a, b) => a.timestamp - b.timestamp);
  }, [windowReadings, viewMinTs, viewMaxTs, viewSpan]);

  const curveReadings = useMemo(() => {
    if (windowReadings.length === 0) return [];
    let firstIdx = windowReadings.findIndex((r) => r.timestamp >= viewMinTs);
    if (firstIdx === -1) firstIdx = windowReadings.length - 1;
    let lastIdx = windowReadings.length - 1;
    for (let i = windowReadings.length - 1; i >= 0; i--) {
      if (windowReadings[i].timestamp <= viewMaxTs) {
        lastIdx = i;
        break;
      }
    }
    const startIdx = Math.max(0, firstIdx - 1);
    const endIdx = Math.min(windowReadings.length - 1, lastIdx + 1);
    return windowReadings.slice(startIdx, endIdx + 1);
  }, [windowReadings, viewMinTs, viewMaxTs]);

  const filteredNotes = useMemo(() => {
    if (windowReadings.length === 0) return [];
    return notes.filter(
      (n) =>
        n.timestamp >= viewMinTs - 10 * 60 * 1000 &&
        n.timestamp <= viewMaxTs + 10 * 60 * 1000
    );
  }, [notes, windowReadings.length, viewMinTs, viewMaxTs]);

  const stats = useMemo(
    () => computeStats(visibleReadings, threshold),
    [visibleReadings, threshold]
  );

  const width = 760;
  const height = 256;
  const padLeft = 48;
  const padRight = 22;
  const padTop = 24;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const { minY, maxY } = useMemo(() => {
    const vals = (visibleReadings.length > 0 ? visibleReadings : windowReadings).map(
      (r) => r.value
    );
    const refVals = filteredNotes
      .map((n) => n.referenceTemp)
      .filter((v): v is number => typeof v === 'number');
    const lowest = Math.min(...vals, ...refVals, threshold - 0.8, 36.0);
    const highest = Math.max(...vals, ...refVals, threshold + 0.6, 39.2);
    return {
      minY: Math.floor((lowest - 0.2) * 2) / 2,
      maxY: Math.ceil((highest + 0.2) * 2) / 2,
    };
  }, [visibleReadings, windowReadings, filteredNotes, threshold]);

  const xForTs = (ts: number) => padLeft + ((ts - viewMinTs) / viewSpan) * plotW;
  const yForTemp = (temp: number) =>
    padTop + plotH - ((temp - minY) / Math.max(maxY - minY, 0.5)) * plotH;

  const latestWindowId = windowReadings[windowReadings.length - 1]?.id;

  const points = curveReadings.map((r) => {
    const isLast = r.id === latestWindowId;
    const effectiveValue = isLast ? animatedLatestValue : r.value;
    return {
      ...r,
      x: xForTs(r.timestamp),
      y: yForTemp(effectiveValue),
      isLast,
    };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const thresholdY = yForTemp(threshold);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let t = minY; t <= maxY + 0.01; t += 0.5) {
      ticks.push(Number(t.toFixed(1)));
    }
    return ticks;
  }, [minY, maxY]);

  const xTicks = useMemo(() => {
    if (points.length < 2) return [];
    const count = 5;
    const arr: Array<{ x: number; label: string }> = [];
    for (let i = 0; i < count; i++) {
      const ratio = i / (count - 1);
      const ts = viewMinTs + ratio * viewSpan;
      arr.push({
        x: padLeft + ratio * plotW,
        label: formatTimeFr(ts, language),
      });
    }
    return arr;
  }, [viewMinTs, viewSpan, points.length, plotW, language]);

  const inspectablePoints = points.filter(
    (p) => p.timestamp >= viewMinTs && p.timestamp <= viewMaxTs
  );
  const activePool = inspectablePoints.length > 0 ? inspectablePoints : points;
  const activeIndex = activePool.findIndex((p) => p.id === hoveredId);
  const resolvedIndex =
    activeIndex >= 0 ? activeIndex : Math.max(0, activePool.length - 1);
  const activePoint = activePool[resolvedIndex] ?? null;
  const previousPoint = resolvedIndex > 0 ? activePool[resolvedIndex - 1] : null;
  const stepDelta =
    activePoint && previousPoint
      ? Number((activePoint.value - previousPoint.value).toFixed(1))
      : null;

  const activeNote = filteredNotes.find((n) => n.id === selectedNoteId) ?? null;

  const sourceLabel = (source: TemperatureReading['source']) => {
    switch (source) {
      case 'buffered_sync':
        return language === 'ar' ? 'مزامنة الذاكرة الداخلية' : 'Mémoire interne synchronisée';
      case 'home_hub':
        return language === 'ar' ? 'مرحل منزلي' : 'Relais domestique';
      case 'simulated':
        return language === 'ar' ? 'اختبار تجريبي' : 'Test prototype';
      default:
        return language === 'ar' ? 'اتصال مباشر BLE' : 'BLE en direct';
    }
  };

  const snapCursorToClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || activePool.length === 0) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0) return;
    const svgX = ((clientX - rect.left) / rect.width) * width;
    let nearest = activePool[0];
    let bestDist = Math.abs(nearest.x - svgX);
    for (let i = 1; i < activePool.length; i++) {
      const dist = Math.abs(activePool[i].x - svgX);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = activePool[i];
      }
    }
    setHoveredId(nearest.id);
    setCursorModeActive(true);
  };

  const handleAdjustZoom = (factor: number) => {
    setZoomLevel((prev) => {
      const next = Number(Math.min(8, Math.max(1, prev * factor)).toFixed(2));
      return next < 1.05 ? 1 : next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanRatio(1);
    setHoveredId(null);
    setCursorModeActive(false);
  };

  const handleTouchStart: React.TouchEventHandler<SVGSVGElement> = (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartRef.current = { distance: Math.max(dist, 1), zoom: zoomLevel };
      touchPanStartRef.current = null;
    } else if (e.touches.length === 1) {
      pinchStartRef.current = null;
      touchPanStartRef.current = { x: e.touches[0].clientX, panRatio };
      snapCursorToClientX(e.touches[0].clientX);
    }
  };

  const handleTouchMove: React.TouchEventHandler<SVGSVGElement> = (e) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / pinchStartRef.current.distance;
      const nextZoom = Number(
        Math.min(8, Math.max(1, pinchStartRef.current.zoom * ratio)).toFixed(2)
      );
      setZoomLevel(nextZoom < 1.05 ? 1 : nextZoom);
    } else if (e.touches.length === 1) {
      snapCursorToClientX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd: React.TouchEventHandler<SVGSVGElement> = () => {
    pinchStartRef.current = null;
    touchPanStartRef.current = null;
  };

  const handleWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    if (e.ctrlKey || e.metaKey || zoomLevel > 1) {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 0) {
        const factor = e.deltaY < 0 ? 1.18 : 0.85;
        handleAdjustZoom(factor);
      }
      if (zoomLevel > 1 && Math.abs(e.deltaX) > 2) {
        setPanRatio((r) => Math.min(1, Math.max(0, r + e.deltaX / 600)));
      }
    }
  };

  const isZoomed = zoomLevel > 1.02;

  return (
    <section
      id="courbe-notes"
      aria-label="Courbe thermique interactive"
      className="biotemp-card p-5 sm:p-6 flex flex-col justify-between gap-4 min-w-0 overflow-hidden transition-colors duration-200"
    >
      {/* Header + Segmented Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#64798F] dark:text-[#8DA2B9]">
            {t.eyebrow}
            {isZoomed && (
              <span className="ms-2 font-mono font-semibold text-[#0B8A7E] dark:text-[#2DD4BF]">
                · {language === 'ar' ? 'تكبير' : 'Zoom'}{' '}
                {zoomLevel.toFixed(1).replace('.', language === 'ar' ? '.' : ',')}× (
                {formatDurationLabel(viewSpan, language)})
              </span>
            )}
          </p>
          <h2 className="text-lg font-bold text-[#0F1D32] dark:text-[#F1F5F9] flex items-center gap-2 mt-0.5">
            <Activity className="w-5 h-5 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
            <span>
              {t.title} — {profileName}
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Zoom Controls */}
          <div
            role="group"
            aria-label={language === 'ar' ? 'أدوات التكبير' : 'Contrôles de zoom'}
            className="inline-flex items-center gap-0.5 p-0.5 bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-lg"
          >
            <button
              type="button"
              onClick={() => handleAdjustZoom(0.7)}
              disabled={!isZoomed}
              aria-label={language === 'ar' ? 'تصغير المنحنى' : 'Dézoomer la courbe'}
              title={language === 'ar' ? 'تصغير' : 'Dézoomer'}
              className="w-8 h-8 flex items-center justify-center rounded-md text-[#0F1D32] dark:text-[#F1F5F9] hover:bg-white dark:hover:bg-[#132036] disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-bold text-[#0B8A7E] dark:text-[#5EEAD4] tabular-nums min-w-[36px] text-center">
              {zoomLevel.toFixed(1).replace('.', language === 'ar' ? '.' : ',')}×
            </span>
            <button
              type="button"
              onClick={() => handleAdjustZoom(1.45)}
              disabled={zoomLevel >= 8}
              aria-label="Zoomer sur une courte période"
              title="Zoomer"
              className="w-8 h-8 flex items-center justify-center rounded-md text-[#0F1D32] dark:text-[#F1F5F9] hover:bg-white dark:hover:bg-[#132036] disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            {isZoomed && (
              <button
                type="button"
                onClick={handleResetZoom}
                aria-label="Réinitialiser le zoom"
                title="Réinitialiser la vue"
                className="w-8 h-8 flex items-center justify-center rounded-md text-[#64798F] hover:text-[#0F1D32] hover:bg-white dark:text-[#8DA2B9] dark:hover:text-[#F1F5F9] dark:hover:bg-[#132036] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setCursorModeActive((prev) => {
                if (prev) setHoveredId(null);
                return !prev;
              });
            }}
            aria-pressed={cursorModeActive}
            className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              cursorModeActive
                ? 'bg-[#0F1D32] text-white border-[#0F1D32] dark:bg-[#0B8A7E] dark:border-[#0B8A7E]'
                : 'bg-[#F8FAFC] text-[#475B70] border-[#E1E8EE] hover:text-[#0F1D32] dark:bg-[#09111E] dark:text-[#9DB0C6] dark:border-[#1B2A42]'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.cursor}</span>
          </button>

          {/* Time Window Selector */}
          <div
            role="group"
            aria-label="Période d'affichage"
            className="inline-flex items-center gap-0.5 p-0.5 bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] rounded-lg"
          >
            {TIME_WINDOWS.map((h) => {
              const active = timeWindow === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChangeTimeWindow(h)}
                  className={`min-h-[32px] px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#0F1D32] text-white dark:bg-[#0B8A7E]'
                      : 'text-[#64798F] dark:text-[#8DA2B9] hover:text-[#0F1D32] dark:hover:text-[#F1F5F9]'
                  }`}
                >
                  {language === 'ar' ? `${h} س` : `${h} h`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4-Column Telemetry Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 sm:gap-y-0 sm:divide-x divide-[#E1E8EE] dark:divide-[#1B2A42] bg-[#F8FAFC] dark:bg-[#09111E] border border-[#E1E8EE] dark:border-[#1B2A42] rounded-xl py-2.5">
        <div className="px-3 text-center sm:text-start">
          <p className="text-[11px] font-medium text-[#64798F] dark:text-[#8DA2B9]">{t.min}</p>
          <p className="font-mono text-sm font-bold text-[#0B8A7E] dark:text-[#5EEAD4] tabular-nums">
            {formatTempFr(stats.min, tempUnit, language)} {unitSuffix}
          </p>
        </div>
        <div className="px-3 text-center sm:text-start">
          <p className="text-[11px] font-medium text-[#64798F] dark:text-[#8DA2B9]">{t.avg}</p>
          <p className="font-mono text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums">
            {formatTempFr(stats.avg, tempUnit, language)} {unitSuffix}
          </p>
        </div>
        <div className="px-3 text-center sm:text-start">
          <p className="text-[11px] font-medium text-[#64798F] dark:text-[#8DA2B9]">{t.max}</p>
          <p className="font-mono text-sm font-bold text-[#D91E43] dark:text-[#FDA4AF] tabular-nums">
            {formatTempFr(stats.max, tempUnit, language)} {unitSuffix}
          </p>
        </div>
        <div className="px-3 text-center sm:text-start">
          <p className="text-[11px] font-medium text-[#64798F] dark:text-[#8DA2B9] truncate">
            {t.thresholdLabel} ·{' '}
            <span
              className={`font-mono font-semibold ${
                stats.aboveThresholdCount > 0
                  ? 'text-[#D91E43] dark:text-[#FDA4AF]'
                  : 'text-[#087066] dark:text-[#5EEAD4]'
              }`}
            >
              {stats.aboveThresholdCount} {t.alerts.toLowerCase()}
            </span>
          </p>
          <p className="font-mono text-sm font-bold text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums">
            {formatTempFr(threshold, tempUnit, language)} {unitSuffix}
          </p>
        </div>
      </div>

      {/* Interactive readout strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] text-xs transition-colors">
        {activePoint ? (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[#475B70] dark:text-[#9DB0C6] tabular-nums">
            <span className="font-semibold text-[#0F1D32] dark:text-[#F1F5F9] inline-flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
              {hoveredId || cursorModeActive
                ? `${t.cursor} :`
                : language === 'ar'
                ? 'آخر قياس :'
                : 'Dernier relevé :'}
            </span>
            <span className="font-mono font-bold text-[#0B8A7E] dark:text-[#2DD4BF]">
              {formatTempFr(
                activePoint.isLast && !hoveredId && !cursorModeActive
                  ? animatedLatestValue
                  : activePoint.value,
                tempUnit,
                language
              )}{' '}
              {unitSuffix}
            </span>
            {stepDelta !== null && Math.abs(stepDelta) >= 0.1 && (
              <span
                className={`font-mono text-[11px] font-semibold ${
                  stepDelta > 0
                    ? 'text-[#C26B08] dark:text-[#FCD34D]'
                    : 'text-[#0B8A7E] dark:text-[#5EEAD4]'
                }`}
              >
                ({stepDelta > 0 ? '+' : ''}
                {formatTempDelta(stepDelta, tempUnit, language)} {unitSuffix})
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-mono">{formatTimeFr(activePoint.timestamp, language)}</span>
            <span aria-hidden="true">·</span>
            <span>{sourceLabel(activePoint.source)}</span>
            {(hoveredId || cursorModeActive) && (
              <button
                type="button"
                onClick={() => {
                  setHoveredId(null);
                  setCursorModeActive(false);
                }}
                className="ms-1 px-2 py-0.5 rounded-md bg-[#EDF9F7] text-[#087066] dark:bg-[#0A2624] dark:text-[#5EEAD4] text-[11px] font-semibold cursor-pointer"
              >
                {t.live}
              </button>
            )}
          </div>
        ) : (
          <span className="text-[#64798F] dark:text-[#8DA2B9]">
            {language === 'ar' ? 'لا توجد قياسات في هذه الفترة' : 'Aucune mesure sur cette plage'}
          </span>
        )}

        <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-[#64798F] dark:text-[#8DA2B9]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#0B8A7E] dark:bg-[#2DD4BF] inline-block" aria-hidden="true" />
            {t.live}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#60A5FA] inline-block" aria-hidden="true" />
            {language === 'ar' ? 'مزامنة الذاكرة' : 'Sync tampon'}
          </span>
          {filteredNotes.some((n) => typeof n.referenceTemp === 'number') && (
            <span className="inline-flex items-center gap-1.5 text-[#4338CA] dark:text-[#A5B4FC] font-medium">
              <span className="w-2 h-2 rotate-45 bg-[#4F46E5] dark:bg-[#818CF8] inline-block" aria-hidden="true" />
              {language === 'ar' ? 'قياس مرجعي' : 'Réf.'}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#D91E43] dark:border-[#FB7185] inline-block" aria-hidden="true" />
            {t.thresholdLabel}
          </span>
        </div>
      </div>

      {/* Main SVG Plot (forced LTR so chronological X-axis & coordinates stay consistent in AR RTL) */}
      <div dir="ltr" className="w-full relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none touch-pan-y cursor-crosshair"
          style={isZoomed ? { touchAction: 'none' } : undefined}
          role="img"
          aria-label={`Évolution de la température pour ${profileName} sur ${timeWindow} heures`}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse') {
              snapCursorToClientX(e.clientX);
            }
          }}
          onMouseLeave={() => {
            if (!cursorModeActive) {
              setHoveredId(null);
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <defs>
            <linearGradient id="biotempAreaClean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B8A7E" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0B8A7E" stopOpacity="0.01" />
            </linearGradient>
            <clipPath id={clipId}>
              <rect x={padLeft} y={padTop - 8} width={plotW} height={plotH + 16} />
            </clipPath>
          </defs>

          {thresholdY > padTop && (
            <motion.rect
              x={padLeft}
              y={padTop}
              width={plotW}
              animate={{ height: Math.max(0, thresholdY - padTop) }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 160, damping: 26 }
              }
              className="fill-[#FEF1F3] dark:fill-[#4C0519]/30"
              opacity="0.7"
            />
          )}

          {yTicks.map((tickVal) => {
            const y = yForTemp(tickVal);
            return (
              <g key={tickVal}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  className="stroke-[#E8EFF4] dark:stroke-[#1B2A42]"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#64798F] dark:fill-[#7B91A8] text-[11px] font-mono"
                >
                  {formatTempFr(tickVal, tempUnit, language)}
                </text>
              </g>
            );
          })}

          {xTicks.map((tick, idx) => (
            <text
              key={idx}
              x={tick.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-[#64798F] dark:fill-[#7B91A8] text-[11px] font-mono"
            >
              {tick.label}
            </text>
          ))}

          <motion.line
            x1={padLeft}
            x2={width - padRight}
            animate={{ y1: thresholdY, y2: thresholdY }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 160, damping: 26 }
            }
            className="stroke-[#D91E43] dark:stroke-[#FB7185]"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <motion.text
            x={width - padRight - 4}
            animate={{ y: thresholdY - 6 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 160, damping: 26 }
            }
            textAnchor="end"
            className="fill-[#D91E43] dark:fill-[#FDA4AF] text-[11px] font-semibold"
          >
            {t.thresholdLabel} {formatTempFr(threshold, tempUnit, language)} {unitSuffix}
          </motion.text>

          <g clipPath={`url(#${clipId})`}>
            {areaPath && (
              <motion.path
                key={`area-${profileName}-${timeWindow}`}
                d={areaPath}
                fill="url(#biotempAreaClean)"
                initial={shouldReduceMotion ? false : { opacity: 0.45 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            )}
            {linePath && (
              <motion.path
                key={`line-${profileName}-${timeWindow}`}
                d={linePath}
                fill="none"
                className="stroke-[#0B8A7E] dark:stroke-[#2DD4BF]"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={shouldReduceMotion ? false : { pathLength: 0.88, opacity: 0.55 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            )}

            {activePoint && (hoveredId || cursorModeActive) && (
              <g>
                <motion.line
                  animate={{ x1: activePoint.x, x2: activePoint.x }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 280, damping: 30 }
                  }
                  y1={padTop}
                  y2={padTop + plotH}
                  className="stroke-[#0F1D32] dark:stroke-[#5EEAD4]"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <motion.circle
                  animate={{ cx: activePoint.x, cy: activePoint.y }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 280, damping: 30 }
                  }
                  r="10"
                  fill="none"
                  className="stroke-[#0B8A7E] dark:stroke-[#2DD4BF]"
                  strokeWidth="1.8"
                  strokeOpacity="0.65"
                />
              </g>
            )}

            {points.map((pt) => {
              const isHovered = pt.id === activePoint?.id && (Boolean(hoveredId) || cursorModeActive);
              const isAbove = pt.value >= threshold;
              const isSynced = pt.source === 'buffered_sync';
              const fill = isAbove ? '#D91E43' : isSynced ? '#2563EB' : '#0B8A7E';
              const rSize = isHovered ? 6.5 : pt.isLast || isSynced || isAbove ? 4.5 : 3.5;

              return (
                <g key={pt.id}>
                  {pt.isLast && !shouldReduceMotion && (
                    <motion.circle
                      cx={pt.x}
                      cy={pt.y}
                      fill="none"
                      stroke={fill}
                      strokeWidth="1.5"
                      initial={{ r: 5, opacity: 0.7 }}
                      animate={{ r: [5, 13, 5], opacity: [0.65, 0, 0.65] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <motion.circle
                    initial={
                      shouldReduceMotion ? false : { r: 0, opacity: 0, cx: pt.x, cy: pt.y }
                    }
                    animate={{ cx: pt.x, cy: pt.y, r: rSize, opacity: 1 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                    }
                    fill={fill}
                    className="stroke-white dark:stroke-[#0D1626]"
                    strokeWidth="1.8"
                    style={{ transition: 'fill 300ms ease' }}
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={14}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => {
                      setHoveredId(pt.id);
                      setCursorModeActive(true);
                    }}
                  />
                </g>
              );
            })}

            {filteredNotes.map((note) => {
              const clampedTs = Math.min(Math.max(note.timestamp, viewMinTs), viewMaxTs);
              const nx = xForTs(clampedTs);
              const ny = yForTemp(note.temperatureAtTime);
              const isSelected = selectedNoteId === note.id;
              const hasRef = typeof note.referenceTemp === 'number';
              const refY = hasRef ? yForTemp(note.referenceTemp!) : null;

              return (
                <motion.g
                  key={note.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="cursor-pointer"
                  onClick={() => setSelectedNoteId(isSelected ? null : note.id)}
                >
                  <line
                    x1={nx}
                    y1={ny}
                    x2={nx}
                    y2={padTop + 14}
                    className={
                      hasRef
                        ? 'stroke-[#4F46E5] dark:stroke-[#818CF8]'
                        : 'stroke-[#0F1D32] dark:stroke-[#5EEAD4]'
                    }
                    strokeWidth={hasRef ? '1.3' : '1'}
                    strokeDasharray={hasRef ? '3 2' : undefined}
                    strokeOpacity={hasRef ? '0.65' : '0.4'}
                  />
                  {hasRef && refY !== null && (
                    <g>
                      <line
                        x1={nx}
                        y1={ny}
                        x2={nx}
                        y2={refY}
                        className="stroke-[#4F46E5] dark:stroke-[#818CF8]"
                        strokeWidth="1.6"
                        strokeDasharray="2 2"
                      />
                      <rect
                        x={nx - 5}
                        y={refY - 5}
                        width={10}
                        height={10}
                        transform={`rotate(45 ${nx} ${refY})`}
                        className="fill-[#4F46E5] dark:fill-[#818CF8] stroke-white dark:stroke-[#0D1626]"
                        strokeWidth="1.6"
                      />
                    </g>
                  )}
                  <circle
                    cx={nx}
                    cy={padTop + 7}
                    r="9"
                    className={`transition-colors duration-200 ${
                      isSelected
                        ? hasRef
                          ? 'fill-[#4338CA] dark:fill-[#818CF8]'
                          : 'fill-[#0F1D32] dark:fill-[#2DD4BF]'
                        : 'fill-white dark:fill-[#132036]'
                    }`}
                    stroke={hasRef ? '#4F46E5' : '#0B8A7E'}
                    strokeWidth="1.6"
                  />
                  <text
                    x={nx}
                    y={padTop + 10.5}
                    textAnchor="middle"
                    className={`text-[9.5px] font-bold transition-colors duration-200 ${
                      isSelected
                        ? 'fill-white dark:fill-[#070D19]'
                        : hasRef
                        ? 'fill-[#4338CA] dark:fill-[#A5B4FC]'
                        : 'fill-[#0B8A7E] dark:fill-[#5EEAD4]'
                    }`}
                  >
                    {hasRef ? 'R' : 'N'}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Tactile Time Scrubber & Zoomed Pan Navigator */}
      {(cursorModeActive || isZoomed) && (
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label
              htmlFor={`scrubber-${profileName}`}
              className="text-[11px] font-semibold text-[#475B70] dark:text-[#9DB0C6] whitespace-nowrap flex items-center gap-1.5"
            >
              <Crosshair className="w-3.5 h-3.5 text-[#0B8A7E] dark:text-[#2DD4BF]" aria-hidden="true" />
              <span>{t.cursor}</span>
            </label>

            <input
              id={`scrubber-${profileName}`}
              type="range"
              min={0}
              max={Math.max(0, activePool.length - 1)}
              step={1}
              value={resolvedIndex}
              onChange={(e) => {
                const idx = Number(e.target.value);
                const pt = activePool[idx];
                if (pt) {
                  setHoveredId(pt.id);
                  setCursorModeActive(true);
                }
              }}
              aria-label="Déplacer le curseur temporel sur les relevés"
              className="flex-1 accent-[#0B8A7E] h-2 rounded-lg cursor-pointer"
            />

            <span className="font-mono text-[11px] font-semibold text-[#0F1D32] dark:text-[#E2ECF5] tabular-nums whitespace-nowrap">
              {activePoint
                ? `${formatTimeFr(activePoint.timestamp, language)} · ${formatTempFr(
                    activePoint.value,
                    tempUnit,
                    language
                  )} ${unitSuffix}`
                : '—'}
            </span>
          </div>

          {isZoomed && (
            <div className="pt-2 border-t border-[#E1E8EE] dark:border-[#1B2A42] flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#64798F] dark:text-[#8DA2B9] whitespace-nowrap">
                {t.panWindow}
              </span>
              <div dir="ltr" className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPanRatio((r) => Math.max(0, Number((r - 0.15).toFixed(2))))}
                  disabled={panRatio <= 0}
                  aria-label={language === 'ar' ? 'الرجوع في الفترة' : 'Reculer dans la période'}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-[#132036] border border-[#E1E8EE] dark:border-[#1E304D] flex items-center justify-center text-[#0F1D32] dark:text-[#F1F5F9] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={panRatio}
                  onChange={(e) => setPanRatio(Number(e.target.value))}
                  aria-label={
                    language === 'ar'
                      ? 'الموضع الأفقي للنافذة الزمنية'
                      : 'Position horizontale du zoom dans la plage horaire'
                  }
                  className="flex-1 accent-[#0F1D32] dark:accent-[#2DD4BF] h-1.5 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setPanRatio((r) => Math.min(1, Number((r + 0.15).toFixed(2))))}
                  disabled={panRatio >= 1}
                  aria-label={
                    language === 'ar' ? 'التقدم نحو القياسات الأحدث' : 'Avancer vers les relevés récents'
                  }
                  className="w-7 h-7 rounded-lg bg-white dark:bg-[#132036] border border-[#E1E8EE] dark:border-[#1E304D] flex items-center justify-center text-[#0F1D32] dark:text-[#F1F5F9] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {activeNote && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E1E8EE] dark:bg-[#09111E] dark:border-[#1B2A42] flex items-start justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-[#0B8A7E] dark:text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold text-[#0F1D32] dark:text-[#F1F5F9]">
                  {activeNote.category} · {formatTimeFr(activeNote.timestamp, language)} ·{' '}
                  <span className="font-mono">
                    {formatTempFr(activeNote.temperatureAtTime, tempUnit, language)} {unitSuffix}
                  </span>
                  {typeof activeNote.referenceTemp === 'number' && (
                    <span className="ms-2 font-mono text-[#4338CA] dark:text-[#A5B4FC]">
                      ({language === 'ar' ? 'المرجعي:' : 'Réf.'}{' '}
                      {formatTempFr(activeNote.referenceTemp, tempUnit, language)} {unitSuffix})
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[#475B70] dark:text-[#9DB0C6]">{activeNote.text}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNoteId(null)}
              className="text-[#64798F] hover:text-[#0F1D32] dark:text-[#8DA2B9] dark:hover:text-[#F1F5F9] font-semibold px-2 py-0.5 cursor-pointer"
            >
              {language === 'ar' ? 'إغلاق' : 'Fermer'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
