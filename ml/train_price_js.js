#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function toNumber(val) {
  if (val === null || val === undefined) return NaN;
  // strip currency symbols and commas
  const s = String(val).replace(/[₹,\s]/g, '').replace(/[^0-9.\-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function oneHotEncode(values) {
  const uniq = Array.from(new Set(values.filter(v => v != null)));
  return { uniq, map: (v) => uniq.map(u => (v === u ? 1 : 0)) };
}

function trainLinear(X, y, lambda = 1e-6) {
  // X: n x m, y: n
  const XT = numericTranspose(X);
  const XTX = numericMatMul(XT, X);
  for (let i = 0; i < XTX.length; i++) XTX[i][i] += lambda;
  const XTy = numericMatVecMul(XT, y);
  const coef = solveLinearSystem(XTX, XTy);
  return coef; // length m
}

function numericTranspose(A) { return A[0].map((_, i) => A.map(r => r[i])); }
function numericMatMul(A, B) {
  const m = A.length, p = B[0].length, n = B.length;
  const C = Array.from({ length: m }, () => Array(p).fill(0));
  for (let i = 0; i < m; i++) for (let k = 0; k < n; k++) for (let j = 0; j < p; j++) C[i][j] += A[i][k] * B[k][j];
  return C;
}
function numericMatVecMul(A, v) { return A.map(row => row.reduce((s, val, i) => s + val * v[i], 0)); }

function solveLinearSystem(A, b) {
  // Gaussian elimination with partial pivot
  const n = A.length;
  const M = A.map((r, i) => r.slice());
  const B = b.slice();
  for (let k = 0; k < n; k++) {
    // pivot
    let iMax = k; let maxVal = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > maxVal) { maxVal = Math.abs(M[i][k]); iMax = i; }
    if (iMax !== k) { [M[k], M[iMax]] = [M[iMax], M[k]]; [B[k], B[iMax]] = [B[iMax], B[k]]; }
    const pivot = M[k][k];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / pivot;
      for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
      B[i] -= f * B[k];
    }
  }
  // back substitution
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = B[i];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = Math.abs(M[i][i]) < 1e-12 ? 0 : s / M[i][i];
  }
  return x;
}

async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), 'land_parser_dummy_data.csv');
  if (!fs.existsSync(csvPath)) { console.error('CSV not found:', csvPath); process.exit(2); }
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true });

  // target detection: prefer Market_Value, Purchase_Value, or Market Value
  const targetCols = ['Market_Value','MarketValue','Market Value','Purchase_Value','PurchaseValue','Purchase Value','price','Price'];
  let targetCol = null;
  for (const c of targetCols) if (rows[0][c] !== undefined) { targetCol = c; break; }
  if (!targetCol) { console.error('No target column found in CSV'); process.exit(2); }

  // area detection
  const areaCandidates = ['area_m2','Area','area','Area_m2','areaSize','AreaSize'];
  let areaCol = null; for (const c of areaCandidates) if (rows[0][c] !== undefined) { areaCol = c; break; }
  if (!areaCol) { console.error('No area column found'); process.exit(2); }

  // choose categorical columns if present
  const catCols = [];
  if (rows[0]['Land_Type'] !== undefined) catCols.push('Land_Type');
  if (rows[0]['Soil_Type'] !== undefined) catCols.push('Soil_Type');

  // build dataset
  const areaVals = rows.map(r => toNumber(r[areaCol]));
  const y = rows.map(r => toNumber(r[targetCol]));

  const catVals = {};
  for (const c of catCols) catVals[c] = rows.map(r => r[c] == null ? '' : String(r[c]));

  const encoders = {};
  for (const c of catCols) encoders[c] = Array.from(new Set(catVals[c]));

  // build feature matrix X with bias term
  const X = [];
  const featureNames = ['bias', areaCol];
  for (const c of catCols) for (const val of encoders[c]) featureNames.push(`${c}_${val}`);

  for (let i = 0; i < rows.length; i++) {
    const row = [];
    row.push(1);
    row.push(areaVals[i] || 0);
    for (const c of catCols) {
      for (const val of encoders[c]) row.push(catVals[c][i] === val ? 1 : 0);
    }
    X.push(row);
  }

  // train linear regression
  const coef = trainLinear(X, y);

  // save model
  const outDir = path.join(process.cwd(), 'ml', 'models');
  fs.mkdirSync(outDir, { recursive: true });
  const model = { featureNames, coef, targetCol, areaCol, encoders };
  fs.writeFileSync(path.join(outDir, 'js_price_model.json'), JSON.stringify(model, null, 2));
  console.log('Saved JS linear model to', path.join(outDir, 'js_price_model.json'));
}

main().catch(err => { console.error(err); process.exit(2); });
