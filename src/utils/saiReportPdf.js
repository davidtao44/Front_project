/**
 * Generación del reporte PDF de las gráficas SAI/MAI.
 *
 * Se ejecuta 100% en el cliente: recibe las imágenes PNG ya capturadas de
 * cada instancia de ECharts (vía getDataURL) y arma un PDF A4 horizontal
 * con banda de título, línea de metadatos, tabla resumen y las 4 gráficas
 * en cuadrícula 2x2.
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

/** Construye las filas de la tabla resumen a partir de las campañas. */
export const buildSAISummary = (campaigns) => [
  { label: 'SAI', ...statOf(campaigns, 'sai') },
  { label: 'MAI_misc', ...statOf(campaigns, 'mai_misc') },
  { label: 'F_prop (stuck_at_0)', ...statOf(campaigns, 'f_prop_s0') },
  { label: 'F_prop (stuck_at_1)', ...statOf(campaigns, 'f_prop_s1') },
  { label: 'F_misc (stuck_at_0)', ...statOf(campaigns, 'f_misc_s0') },
  { label: 'F_misc (stuck_at_1)', ...statOf(campaigns, 'f_misc_s1') },
];

// Las leyendas usan solo ASCII/Latin-1: la fuente estándar de jsPDF no
// soporta flechas Unicode (↑↓), así que se evitan a propósito.
const CHARTS = [
  { key: 'sai', caption: 'SAI - Stuck-at Asymmetry Index' },
  { key: 'mai', caption: 'MAI - Misclassification Asymmetry Index' },
  { key: 'fProp', caption: 'F_prop - Factor de propagacion (s@1 / s@0)' },
  { key: 'fMisc', caption: 'F_misc - Factor de misclasificacion (s@1 / s@0)' },
];

const safe = (s) => String(s).replace(/[^a-zA-Z0-9_-]+/g, '_');

/**
 * Genera y descarga el PDF.
 * @param {Object}   p
 * @param {Object}   p.images   - { sai, mai, fProp, fMisc } data-URLs PNG (o null)
 * @param {Array}    p.summary  - filas de buildSAISummary()
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
  doc.text('SAI / MAI  -  Reporte de campanas', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(170, 180, 195);
  doc.text(
    `Generado: ${meta.generatedAt.toLocaleString()}     HURA Fault Injection Platform`,
    margin,
    17.5
  );

  // --- Línea de metadatos ---
  let y = 30;
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Capa: ${meta.layer}      Target: ${meta.targetType}      ` +
      `Modelo: ${meta.model}      Campanas: ${meta.campaignCount}      ` +
      `Posiciones de kernel: ${meta.positionCount}`,
    margin,
    y
  );

  // --- Tabla resumen ---
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Resumen numerico', margin, y);
  y += 3;

  const cols = [
    { title: 'Metrica', w: 56, align: 'left' },
    { title: 'Puntos', w: 28, align: 'right' },
    { title: 'Minimo', w: 32, align: 'right' },
    { title: 'Maximo', w: 32, align: 'right' },
    { title: 'Promedio', w: 34, align: 'right' },
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

  // encabezado
  doc.setFillColor(33, 150, 243);
  doc.rect(margin, y, tableW, rowH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  drawRow(cols.map((c) => c.title), rowH);
  y += rowH;

  // filas de datos
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

  // borde exterior de la tabla
  doc.setDrawColor(200, 205, 212);
  doc.rect(margin, tableTop, tableW, y - tableTop);

  // --- Cuadrícula 2x2 de gráficas ---
  const gridTop = y + 6;
  const gridBottom = pageH - 10;
  const colGap = 8;
  const rowGap = 7;
  const cellW = (contentW - colGap) / 2;
  const cellH = (gridBottom - gridTop - rowGap) / 2;

  CHARTS.forEach((chart, idx) => {
    const cellX = margin + (idx % 2) * (cellW + colGap);
    const cellY = gridTop + Math.floor(idx / 2) * (cellH + rowGap);

    // leyenda de la gráfica
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
      doc.text('(grafica no disponible)', cellX + 2, imgTop + 7);
      return;
    }

    // ajustar la imagen al recuadro conservando la proporción
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

  // --- Pie de página ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('HURA - SAI/MAI Historic Report', margin, pageH - 5);
  doc.text('Pagina 1 de 1', pageW - margin, pageH - 5, { align: 'right' });

  // --- Descargar ---
  const stamp = meta.generatedAt.toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`SAI_report_${safe(meta.layer)}_${safe(meta.targetType)}_${stamp}.pdf`);
};
