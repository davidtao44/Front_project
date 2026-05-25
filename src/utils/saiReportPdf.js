/**
 * Generates the SAI/MAI charts PDF report.
 *
 * Runs 100% on the client: receives PNG images already captured from each
 * ECharts instance (via getDataURL) and creates a landscape A4 PDF with a
 * title header, metadata line, summary table, and 4 charts in a 2x2 grid.
 */
import { jsPDF } from 'jspdf';

const fmt = (v) =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(4);

const statOf = (campaigns, key) => {
  const vals = [];
  for (const c of campaigns) {
    const v = c[key];
    if (v !== null && v !== undefined && !Number.isNaN(v)) vals.push(v);
  }
  if (vals.length === 0) return { count: 0, min: null, max: null, avg: null };
  let min = vals[0];
  let max = vals[0];
  let sum = 0;
  for (const v of vals) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { count: vals.length, min, max, avg: sum / vals.length };
};

/** Builds summary table rows from the campaigns. */
export const buildSAISummary = (campaigns) => [
  { label: 'SAI', ...statOf(campaigns, 'sai') },
  { label: 'MAI_misc', ...statOf(campaigns, 'mai_misc') },
  { label: 'F_prop (stuck_at_0)', ...statOf(campaigns, 'f_prop_s0') },
  { label: 'F_prop (stuck_at_1)', ...statOf(campaigns, 'f_prop_s1') },
  { label: 'F_misc (stuck_at_0)', ...statOf(campaigns, 'f_misc_s0') },
  { label: 'F_misc (stuck_at_1)', ...statOf(campaigns, 'f_misc_s1') },
];

// Captions use only ASCII/Latin-1: jsPDF's standard font does not support
// Unicode arrows (↑↓), so they are intentionally avoided.
const CHARTS = [
  { key: 'sai', caption: 'SAI - Stuck-at Asymmetry Index' },
  { key: 'mai', caption: 'MAI - Misclassification Asymmetry Index' },
  { key: 'fProp', caption: 'F_prop - Propagation factor (s@1 / s@0)' },
  { key: 'fMisc', caption: 'F_misc - Misclassification factor (s@1 / s@0)' },
];

const safe = (s) => String(s).replace(/[^a-zA-Z0-9_-]+/g, '_');

/**
 * Generates and downloads the PDF.
 * @param {Object}   p
 * @param {Object}   p.images   - { sai, mai, fProp, fMisc } PNG data-URLs (or null)
 * @param {Array}    p.summary  - rows from buildSAISummary()
 * @param {Object}   p.meta     - { layer, targetType, model, campaignCount,
 *                                  positionCount, generatedAt: Date }
 */
export const exportSAIReportPdf = ({ images, summary, meta }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth(); // 297
  const pageH = doc.internal.pageSize.getHeight(); // 210
  const margin = 12;
  const contentW = pageW - margin * 2;

  // --- Banda de título ---
  doc.setFillColor(14, 18, 24);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SAI / MAI  -  Campaign Report', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(170, 180, 195);
  doc.text(
    `Generated: ${meta.generatedAt.toLocaleString()}     HURA Fault Injection Platform`,
    margin,
    17.5
  );

  // --- Metadata line ---
  let y = 30;
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Layer: ${meta.layer}      Target: ${meta.targetType}      ` +
      `Model: ${meta.model}      Campaigns: ${meta.campaignCount}      ` +
      `Kernel Positions: ${meta.positionCount}`,
    margin,
    y
  );

  // --- Summary table ---
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Numerical Summary', margin, y);
  y += 3;

  const cols = [
    { title: 'Metric', w: 56, align: 'left' },
    { title: 'Count', w: 28, align: 'right' },
    { title: 'Minimum', w: 32, align: 'right' },
    { title: 'Maximum', w: 32, align: 'right' },
    { title: 'Average', w: 34, align: 'right' },
  ];
  const tableW = cols.reduce((a, c) => a + c.w, 0);
  const rowH = 6.2;
  const tableTop = y;

  const drawRow = (cells, rh) => {
    let cx = margin;
    cols.forEach((col, ci) => {
      const tx = col.align === 'right' ? cx + col.w - 2.5 : cx + 2.5;
      doc.text(String(cells[ci]), tx, y + rh - 2, { align: col.align });
      cx += col.w;
    });
  };

  // header row
  doc.setFillColor(33, 150, 243);
  doc.rect(margin, y, tableW, rowH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  drawRow(cols.map((c) => c.title), rowH);
  y += rowH;

  // data rows
  doc.setFont('helvetica', 'normal');
  summary.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(238, 241, 245);
      doc.rect(margin, y, tableW, rowH, 'F');
    }
    doc.setTextColor(35, 35, 35);
    drawRow(
      [row.label, row.count, fmt(row.min), fmt(row.max), fmt(row.avg)],
      rowH
    );
    y += rowH;
  });

  // table border
  doc.setDrawColor(200, 205, 212);
  doc.rect(margin, tableTop, tableW, y - tableTop);

  // --- 2x2 grid of charts ---
  const gridTop = y + 6;
  const gridBottom = pageH - 10;
  const colGap = 8;
  const rowGap = 7;
  const cellW = (contentW - colGap) / 2;
  const cellH = (gridBottom - gridTop - rowGap) / 2;

  CHARTS.forEach((chart, idx) => {
    const cellX = margin + (idx % 2) * (cellW + colGap);
    const cellY = gridTop + Math.floor(idx / 2) * (cellH + rowGap);

    // chart legend
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(45, 45, 45);
    doc.text(chart.caption, cellX, cellY + 3.5);

    const imgTop = cellY + 5.5;
    const imgBoxH = cellH - 5.5;
    const imgData = images[chart.key];

    if (!imgData) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('(chart not available)', cellX + 2, imgTop + 7);
      return;
    }

    // fit image to box preserving aspect ratio
    const props = doc.getImageProperties(imgData);
    const ratio = props.width / props.height;
    let drawW = cellW;
    let drawH = drawW / ratio;
    if (drawH > imgBoxH) {
      drawH = imgBoxH;
      drawW = drawH * ratio;
    }
    const drawX = cellX + (cellW - drawW) / 2;
    const drawY = imgTop + (imgBoxH - drawH) / 2;
    doc.addImage(imgData, 'PNG', drawX, drawY, drawW, drawH);
  });

  // --- Footer ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('HURA - SAI/MAI Historic Report', margin, pageH - 5);
  doc.text('Page 1 of 1', pageW - margin, pageH - 5, { align: 'right' });

  // --- Download ---
  const stamp = meta.generatedAt.toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`SAI_report_${safe(meta.layer)}_${safe(meta.targetType)}_${stamp}.pdf`);
};

/**
 * Generates and downloads a single-chart full-page PDF.
 * @param {Object} p
 * @param {string} p.image   - PNG data-URL of the chart (or null)
 * @param {string} p.caption - legend/title of the chart (ASCII only)
 * @param {Object} p.meta    - { layer, targetType, model, campaignCount,
 *                               positionCount, generatedAt: Date }
 */
export const exportSingleChartPdf = ({ image, caption, meta }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth(); // 297
  const pageH = doc.internal.pageSize.getHeight(); // 210
  const margin = 12;
  const contentW = pageW - margin * 2;

  // --- Title header ---
  doc.setFillColor(14, 18, 24);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`SAI / MAI  -  ${caption}`, margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(170, 180, 195);
  doc.text(
    `Generated: ${meta.generatedAt.toLocaleString()}     HURA Fault Injection Platform`,
    margin,
    17.5
  );

  // --- Metadata line ---
  const y = 30;
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Layer: ${meta.layer}      Target: ${meta.targetType}      ` +
      `Model: ${meta.model}      Campaigns: ${meta.campaignCount}      ` +
      `Kernel Positions: ${meta.positionCount}`,
    margin,
    y
  );

  // --- Full-page chart ---
  const imgTop = y + 6;
  const imgBoxH = pageH - imgTop - 12;

  if (!image) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('(chart not available)', margin + 2, imgTop + 7);
  } else {
    const props = doc.getImageProperties(image);
    const ratio = props.width / props.height;
    let drawW = contentW;
    let drawH = drawW / ratio;
    if (drawH > imgBoxH) {
      drawH = imgBoxH;
      drawW = drawH * ratio;
    }
    const drawX = margin + (contentW - drawW) / 2;
    const drawY = imgTop + (imgBoxH - drawH) / 2;
    doc.addImage(image, 'PNG', drawX, drawY, drawW, drawH);
  }

  // --- Footer ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('HURA - SAI/MAI Historic Report', margin, pageH - 5);
  doc.text('Page 1 of 1', pageW - margin, pageH - 5, { align: 'right' });

  // --- Download ---
  const stamp = meta.generatedAt.toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`SAI_chart_${safe(caption)}_${stamp}.pdf`);
};
