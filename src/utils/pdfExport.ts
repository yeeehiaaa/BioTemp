import { jsPDF } from 'jspdf';
import {
  AppLanguage,
  ChildProfile,
  MedicalNote,
  TemperatureReading,
  TemperatureUnit,
} from '../types/biotemp';
import {
  computeStats,
  formatDateTimeFr,
  formatTempFr,
  formatTimeFr,
  getTemperatureStatus,
  tempUnitLabel,
} from './temperature';

function pdfSafeText(input: string): string {
  return input
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/[\u2022\u00B7]/g, '|')
    .replace(/\u2026/g, '...')
    .replace(/\u0153/g, 'oe')
    .replace(/\u0152/g, 'OE')
    .replace(/\u20AC/g, 'EUR')
    .replace(/\u00A0/g, ' ');
}

function sourceLabelFr(source: TemperatureReading['source']): string {
  switch (source) {
    case 'buffered_sync':
      return 'Tampon sync';
    case 'home_hub':
      return 'Relais dom.';
    case 'simulated':
      return 'Simulation';
    default:
      return 'BLE direct';
  }
}

function renderFullCurveCanvas(
  readings: TemperatureReading[],
  notes: MedicalNote[],
  threshold: number,
  tempUnit: TemperatureUnit
): string {
  const unitLabel = tempUnitLabel(tempUnit);
  const width = 1400;
  const height = 460;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // White paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const padLeft = 86;
  const padRight = 36;
  const padTop = 42;
  const padBottom = 58;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  if (readings.length === 0) {
    ctx.fillStyle = '#647B8C';
    ctx.font = '600 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Aucune mesure disponible', width / 2, height / 2);
    return canvas.toDataURL('image/png');
  }

  const values = readings.map((r) => r.value);
  const refValues = notes
    .map((n) => n.referenceTemp)
    .filter((v): v is number => typeof v === 'number');
  const lowest = Math.min(...values, ...refValues, threshold - 0.8, 36.0);
  const highest = Math.max(...values, ...refValues, threshold + 0.6, 39.2);
  const minY = Math.floor((lowest - 0.2) * 2) / 2;
  const maxY = Math.ceil((highest + 0.2) * 2) / 2;

  const minTs = readings[0].timestamp;
  const maxTs = readings[readings.length - 1].timestamp;
  const tsSpan = Math.max(maxTs - minTs, 1);

  const xForTs = (ts: number) => padLeft + ((ts - minTs) / tsSpan) * plotW;
  const yForTemp = (temp: number) =>
    padTop + plotH - ((temp - minY) / Math.max(maxY - minY, 0.5)) * plotH;

  const thresholdY = yForTemp(threshold);

  // Fever shaded band
  if (thresholdY > padTop) {
    ctx.fillStyle = 'rgba(255, 241, 242, 0.85)';
    ctx.fillRect(padLeft, padTop, plotW, Math.max(0, thresholdY - padTop));
  }

  // Horizontal grid lines & Y axis labels
  ctx.font = '500 18px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let t = minY; t <= maxY + 0.01; t += 0.5) {
    const val = Number(t.toFixed(1));
    const y = yForTemp(val);
    ctx.strokeStyle = '#E8F0F2';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();

    ctx.fillStyle = '#647B8C';
    ctx.fillText(`${formatTempFr(val, tempUnit)}`, padLeft - 14, y);
  }

  // X axis ticks
  const tickCount = Math.min(6, Math.max(2, readings.length));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '500 17px monospace';
  for (let i = 0; i < tickCount; i++) {
    const ratio = i / (tickCount - 1);
    const ts = minTs + ratio * tsSpan;
    const x = padLeft + ratio * plotW;
    ctx.strokeStyle = '#F0F5F7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, padTop);
    ctx.lineTo(x, padTop + plotH);
    ctx.stroke();

    ctx.fillStyle = '#647B8C';
    ctx.fillText(formatTimeFr(ts), x, padTop + plotH + 14);
  }

  // Threshold dashed line
  ctx.save();
  ctx.strokeStyle = '#E11D48';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.moveTo(padLeft, thresholdY);
  ctx.lineTo(width - padRight, thresholdY);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#E11D48';
  ctx.font = '700 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`Seuil ${formatTempFr(threshold, tempUnit)} ${unitLabel}`, width - padRight - 6, thresholdY - 8);

  // Area fill under curve
  const points = readings.map((r) => ({
    ...r,
    x: xForTs(r.timestamp),
    y: yForTemp(r.value),
  }));

  const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
  grad.addColorStop(0, 'rgba(20, 184, 166, 0.25)');
  grad.addColorStop(1, 'rgba(20, 184, 166, 0.02)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(points[0].x, padTop + plotH);
  for (const pt of points) {
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.lineTo(points[points.length - 1].x, padTop + plotH);
  ctx.closePath();
  ctx.fill();

  // Curve line
  ctx.strokeStyle = '#0D9488';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Data points
  for (const pt of points) {
    const isAbove = pt.value >= threshold;
    const isSynced = pt.source === 'buffered_sync';
    ctx.fillStyle = isAbove ? '#E11D48' : isSynced ? '#2563EB' : '#0D9488';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, isAbove || isSynced ? 5.5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Timestamped note markers
  const visibleNotes = notes.filter(
    (n) => n.timestamp >= minTs - 15 * 60 * 1000 && n.timestamp <= maxTs + 15 * 60 * 1000
  );
  visibleNotes.forEach((note, idx) => {
    const clampedTs = Math.min(Math.max(note.timestamp, minTs), maxTs);
    const nx = xForTs(clampedTs);
    const ny = yForTemp(note.temperatureAtTime);
    const hasRef = typeof note.referenceTemp === 'number';

    ctx.strokeStyle = hasRef ? 'rgba(79, 70, 229, 0.55)' : 'rgba(22, 38, 66, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(nx, padTop + 18);
    ctx.stroke();

    if (hasRef) {
      const refY = yForTemp(note.referenceTemp!);
      ctx.save();
      ctx.translate(nx, refY);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#4F46E5';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.fillRect(-7, -7, 14, 14);
      ctx.strokeRect(-7, -7, 14, 14);
      ctx.restore();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = hasRef ? '#4F46E5' : '#0D9488';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(nx, padTop + 14, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hasRef ? '#4338CA' : '#162642';
    ctx.font = '700 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${hasRef ? 'R' : 'N'}${idx + 1}`, nx, padTop + 14);
  });

  // Outer border
  ctx.strokeStyle = '#DCE6E5';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(padLeft, padTop, plotW, plotH);

  return canvas.toDataURL('image/png');
}

function renderSummaryChartsCanvas(
  readings: TemperatureReading[],
  threshold: number,
  tempUnit: TemperatureUnit
): string {
  const unitLabel = tempUnitLabel(tempUnit);
  const width = 1400;
  const height = 340;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Left section: Status Distribution Bars
  const total = Math.max(readings.length, 1);
  let normalCount = 0;
  let elevatedCount = 0;
  let feverCount = 0;
  for (const r of readings) {
    const st = getTemperatureStatus(r.value, threshold);
    if (st === 'high_fever') feverCount++;
    else if (st === 'elevated') elevatedCount++;
    else normalCount++;
  }

  ctx.fillStyle = '#162642';
  ctx.font = '700 21px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Répartition par zone thermique', 24, 20);

  const distItems = [
    { label: 'Normale', count: normalCount, color: '#0D9488', bg: '#E6F7F5' },
    { label: 'Légère hausse', count: elevatedCount, color: '#EA580C', bg: '#FFF3E6' },
    {
      label: `Fièvre >= ${formatTempFr(threshold, tempUnit)} ${unitLabel}`,
      count: feverCount,
      color: '#E11D48',
      bg: '#FFE8EE',
    },
  ];

  distItems.forEach((item, idx) => {
    const y = 76 + idx * 78;
    const pct = Math.round((item.count / total) * 100);
    const barW = 540;
    const fillW = Math.max(pct > 0 ? 10 : 0, (item.count / total) * barW);

    ctx.fillStyle = '#162642';
    ctx.font = '600 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, 24, y);

    ctx.fillStyle = '#52666A';
    ctx.font = '600 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.count} (${pct}%)`, 24 + barW, y);

    ctx.fillStyle = item.bg;
    ctx.fillRect(24, y + 30, barW, 22);
    ctx.fillStyle = item.color;
    ctx.fillRect(24, y + 30, fillW, 22);
  });

  // Vertical divider
  ctx.strokeStyle = '#E6EFF2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(620, 20);
  ctx.lineTo(620, height - 20);
  ctx.stroke();

  // Right section: Hourly / Time-Bucket Peak & Avg Bars
  ctx.fillStyle = '#162642';
  ctx.font = '700 21px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Moyenne par tranche chronologique', 660, 20);

  const bucketCount = Math.min(8, Math.max(1, readings.length));
  const chartX = 710;
  const chartY = 72;
  const chartW = 650;
  const chartH = 205;

  const buckets: Array<{ label: string; avg: number; max: number }> = [];
  const step = readings.length / bucketCount;
  for (let i = 0; i < bucketCount; i++) {
    const start = Math.floor(i * step);
    const end = Math.max(start + 1, Math.floor((i + 1) * step));
    const slice = readings.slice(start, end);
    if (slice.length > 0) {
      const avg = slice.reduce((acc, r) => acc + r.value, 0) / slice.length;
      const max = Math.max(...slice.map((r) => r.value));
      buckets.push({
        label: formatTimeFr(slice[0].timestamp),
        avg: Number(avg.toFixed(1)),
        max: Number(max.toFixed(1)),
      });
    }
  }

  const minBarY = 35.5;
  const maxBarY = Math.max(40.0, threshold + 1.0);
  const yBar = (v: number) =>
    chartY + chartH - ((Math.min(Math.max(v, minBarY), maxBarY) - minBarY) / (maxBarY - minBarY)) * chartH;

  // Threshold line on bar chart
  const thY = yBar(threshold);
  ctx.save();
  ctx.strokeStyle = '#E11D48';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(chartX, thY);
  ctx.lineTo(chartX + chartW, thY);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#647B8C';
  ctx.font = '500 15px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${formatTempFr(maxBarY, tempUnit)}`, chartX - 10, chartY);
  ctx.fillText(`${formatTempFr(threshold, tempUnit)}`, chartX - 10, thY);
  ctx.fillText(`${formatTempFr(minBarY, tempUnit)}`, chartX - 10, chartY + chartH);

  const slotW = chartW / Math.max(buckets.length, 1);
  const barWidth = Math.min(48, slotW * 0.56);

  buckets.forEach((b, idx) => {
    const bx = chartX + idx * slotW + (slotW - barWidth) / 2;
    const topY = yBar(b.avg);
    const barHeight = Math.max(6, chartY + chartH - topY);
    const st = getTemperatureStatus(b.avg, threshold);
    ctx.fillStyle =
      st === 'high_fever' ? '#E11D48' : st === 'elevated' ? '#EA580C' : '#0D9488';

    ctx.fillRect(bx, topY, barWidth, barHeight);

    ctx.fillStyle = '#162642';
    ctx.font = '600 15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatTempFr(b.avg, tempUnit), bx + barWidth / 2, topY - 4);

    ctx.fillStyle = '#647B8C';
    ctx.font = '500 15px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(b.label, bx + barWidth / 2, chartY + chartH + 10);
  });

  return canvas.toDataURL('image/png');
}

export function exportFullHistoryPdf(
  profile: ChildProfile,
  tempUnit: TemperatureUnit = 'C',
  _language: AppLanguage = 'fr'
): void {
  const unitLabel = tempUnitLabel(tempUnit);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const footerReserved = 14;

  const stats = computeStats(profile.readings, profile.threshold);
  const latest = profile.readings[profile.readings.length - 1];
  const sortedNotes = profile.notes.slice().sort((a, b) => b.timestamp - a.timestamp);
  const sortedReadingsDesc = profile.readings.slice().sort((a, b) => b.timestamp - a.timestamp);

  let y = margin;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageH - footerReserved) {
      doc.addPage();
      y = margin;
    }
  };

  // Top medical banner
  doc.setFillColor(22, 38, 66);
  doc.roundedRect(margin, y, contentW, 24, 3, 3, 'F');
  doc.setFillColor(13, 148, 136);
  doc.rect(margin, y, 4, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(pdfSafeText(`BioTemp - Historique Thermique Complet`), margin + 9, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 224, 232);
  doc.text(
    pdfSafeText(
      `Patient : ${profile.name} (${profile.ageLabel})  |  Généré le ${formatDateTimeFr(Date.now())}`
    ),
    margin + 9,
    y + 17.5
  );

  y += 30;

  // Patient & Module Metadata strip
  doc.setFillColor(246, 250, 251);
  doc.setDrawColor(220, 230, 229);
  doc.roundedRect(margin, y, contentW, 18, 2.5, 2.5, 'FD');

  doc.setTextColor(22, 38, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    pdfSafeText(
      `Module : ${profile.deviceName} (${profile.deviceId})   |   Format : ${profile.patchLabel}`
    ),
    margin + 4,
    y + 6.5
  );
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(82, 102, 106);
  doc.text(
    pdfSafeText(
      `Seuil d'alerte : ${formatTempFr(profile.threshold, tempUnit)} ${unitLabel}   |   Relevés enregistrés : ${profile.readings.length}   |   Dernière synchro : ${formatDateTimeFr(profile.lastConnectedAt)}`
    ),
    margin + 4,
    y + 13
  );

  y += 23;

  // 4 KPI Cards
  const kpiW = (contentW - 9) / 4;
  const kpis = [
    {
      label: 'Actuelle',
      value: latest ? `${formatTempFr(latest.value, tempUnit)} ${unitLabel}` : '-',
      color: [22, 38, 66] as const,
    },
    {
      label: 'Minimum',
      value: `${formatTempFr(stats.min, tempUnit)} ${unitLabel}`,
      color: [13, 148, 136] as const,
    },
    {
      label: 'Moyenne',
      value: `${formatTempFr(stats.avg, tempUnit)} ${unitLabel}`,
      color: [22, 38, 66] as const,
    },
    {
      label: `Max (${stats.aboveThresholdCount} >= seuil)`,
      value: `${formatTempFr(stats.max, tempUnit)} ${unitLabel}`,
      color: [225, 29, 72] as const,
    },
  ];

  kpis.forEach((k, idx) => {
    const kx = margin + idx * (kpiW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 235, 236);
    doc.roundedRect(kx, y, kpiW, 16, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 123, 140);
    doc.text(pdfSafeText(k.label), kx + 3.5, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(k.color[0], k.color[1], k.color[2]);
    doc.text(pdfSafeText(k.value), kx + 3.5, y + 12.5);
  });

  y += 22;

  // Graphique 1: Full Thermal Curve
  const curveImg = renderFullCurveCanvas(
    profile.readings,
    profile.notes,
    profile.threshold,
    tempUnit
  );
  if (curveImg) {
    ensureSpace(72);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 38, 66);
    doc.text(pdfSafeText('1. Courbe thermique complète et repères de notes'), margin, y + 4);
    y += 7;
    const curveH = (contentW * 460) / 1400;
    doc.setDrawColor(225, 235, 236);
    doc.addImage(curveImg, 'PNG', margin, y, contentW, curveH);
    doc.rect(margin, y, contentW, curveH);
    y += curveH + 6;
  }

  // Graphique 2: Distribution & Hourly Trend
  const summaryImg = renderSummaryChartsCanvas(profile.readings, profile.threshold, tempUnit);
  if (summaryImg) {
    ensureSpace(58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 38, 66);
    doc.text(pdfSafeText('2. Synthèse graphique et répartition thermique'), margin, y + 4);
    y += 7;
    const sumH = (contentW * 340) / 1400;
    doc.setDrawColor(225, 235, 236);
    doc.addImage(summaryImg, 'PNG', margin, y, contentW, sumH);
    doc.rect(margin, y, contentW, sumH);
    y += sumH + 8;
  }

  // Section 3: Timestamped Medical Notes List
  ensureSpace(24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(22, 38, 66);
  doc.text(
    pdfSafeText(`3. Liste des notes médicales horodatées (${sortedNotes.length})`),
    margin,
    y + 4
  );
  y += 8;

  const drawNotesHeader = () => {
    doc.setFillColor(238, 245, 246);
    doc.rect(margin, y, contentW, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 38, 66);
    doc.text('Horodatage', margin + 2.5, y + 5.2);
    doc.text('Temp.', margin + 35, y + 5.2);
    doc.text(pdfSafeText('Catégorie'), margin + 52, y + 5.2);
    doc.text('Observation', margin + 96, y + 5.2);
    y += 8;
  };

  if (sortedNotes.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 123, 140);
    doc.text('Aucune note clinique enregistrée pour ce profil.', margin + 2, y + 5);
    y += 10;
  } else {
    drawNotesHeader();
    sortedNotes.forEach((note, idx) => {
      const obsLines = doc.splitTextToSize(pdfSafeText(note.text || '-'), contentW - 99);
      const rowH = Math.max(7.5, obsLines.length * 4.2 + 3.5);
      if (y + rowH > pageH - footerReserved) {
        doc.addPage();
        y = margin;
        drawNotesHeader();
      }
      if (idx % 2 === 1) {
        doc.setFillColor(250, 252, 253);
        doc.rect(margin, y, contentW, rowH, 'F');
      }
      doc.setDrawColor(232, 240, 242);
      doc.line(margin, y + rowH, margin + contentW, y + rowH);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.3);
      doc.setTextColor(53, 78, 82);
      doc.text(pdfSafeText(formatDateTimeFr(note.timestamp)), margin + 2.5, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 38, 66);
      doc.text(
        pdfSafeText(`${formatTempFr(note.temperatureAtTime, tempUnit)} ${unitLabel}`),
        margin + 35,
        y + 5
      );

      doc.setTextColor(13, 148, 136);
      const catLines = doc.splitTextToSize(pdfSafeText(note.category), 42);
      doc.text(catLines[0] ?? '', margin + 52, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(53, 78, 82);
      doc.text(obsLines, margin + 96, y + 5);
      y += rowH;
    });
    y += 7;
  }

  // Section 4: Full Readings Log (complete history)
  ensureSpace(22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(22, 38, 66);
  doc.text(
    pdfSafeText(`4. Historique complet des relevés horodatés (${sortedReadingsDesc.length})`),
    margin,
    y + 4
  );
  y += 8;

  const drawReadingsHeader = () => {
    doc.setFillColor(238, 245, 246);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(22, 38, 66);
    doc.text('Horodatage', margin + 2.5, y + 4.8);
    doc.text(pdfSafeText('Température'), margin + 48, y + 4.8);
    doc.text(pdfSafeText('État'), margin + 84, y + 4.8);
    doc.text('Source', margin + 132, y + 4.8);
    y += 7.5;
  };

  drawReadingsHeader();
  sortedReadingsDesc.forEach((r, idx) => {
    const rowH = 6.2;
    if (y + rowH > pageH - footerReserved) {
      doc.addPage();
      y = margin;
      drawReadingsHeader();
    }
    if (idx % 2 === 1) {
      doc.setFillColor(250, 252, 253);
      doc.rect(margin, y, contentW, rowH, 'F');
    }
    doc.setDrawColor(236, 242, 244);
    doc.line(margin, y + rowH, margin + contentW, y + rowH);

    const status = getTemperatureStatus(r.value, profile.threshold);
    const statusLabel =
      status === 'high_fever'
        ? 'Fièvre élevée'
        : status === 'elevated'
        ? 'Légère hausse'
        : 'Normale';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(53, 78, 82);
    doc.text(pdfSafeText(formatDateTimeFr(r.timestamp)), margin + 2.5, y + 4.4);

    doc.setFont('helvetica', 'bold');
    if (status === 'high_fever') doc.setTextColor(225, 29, 72);
    else if (status === 'elevated') doc.setTextColor(234, 88, 12);
    else doc.setTextColor(13, 148, 136);
    doc.text(pdfSafeText(`${formatTempFr(r.value, tempUnit)} ${unitLabel}`), margin + 48, y + 4.4);

    doc.setFont('helvetica', 'normal');
    doc.text(pdfSafeText(statusLabel), margin + 84, y + 4.4);

    doc.setTextColor(100, 123, 140);
    doc.text(pdfSafeText(sourceLabelFr(r.source)), margin + 132, y + 4.4);

    y += rowH;
  });

  // Footer with page count on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(225, 235, 236);
    doc.line(margin, pageH - 11, pageW - margin, pageH - 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 123, 140);
    doc.text(
      pdfSafeText(
        "BioTemp | Mesure cutanée calibrée sous l'aisselle - Outil de suivi domestique ne remplaçant pas un avis médical."
      ),
      margin,
      pageH - 6.5
    );
    doc.text(`Page ${p} / ${pageCount}`, pageW - margin, pageH - 6.5, {
      align: 'right',
    });
  }

  const safeFileName = profile.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
  doc.save(`biotemp-historique-${safeFileName}-${profile.deviceId.toLowerCase()}.pdf`);
}
