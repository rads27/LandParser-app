import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

function toNumber(v: any) {
  if (v === undefined || v === null) return NaN;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[₹,\s]/g, '').replace(/[^0-9.\-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const repoRoot = process.cwd();
    const jsModelPath = path.join(repoRoot, 'ml', 'models', 'js_price_model.json');

    // If JS model exists, use it (fast, no Python dependency)
    if (fs.existsSync(jsModelPath)) {
      try {
        const m = JSON.parse(fs.readFileSync(jsModelPath, 'utf8'));
        const { featureNames, coef, encoders, areaCol } = m as any;

        // build feature vector according to featureNames
        const vec: number[] = [];
        for (const fname of featureNames) {
          if (fname === 'bias') { vec.push(1); continue; }
          if (fname === areaCol) {
            // Model was trained on dataset `Area` column (units = acres in our CSV).
            // If frontend supplies `area_m2`, convert to acres to match training units.
            let areaValue = toNumber(body.area || body.areaSize || body.area_m2);
            if (body.area_m2 && (!body.area || Number.isNaN(toNumber(body.area)))) {
              // convert sqm -> acres
              areaValue = toNumber(body.area_m2) / 4046.85642;
            }
            vec.push(areaValue);
            continue;
          }
          // categorical encoded as NAME_VALUE
          const parts = fname.split('_');
          if (parts.length >= 2) {
            const colName = parts[0];
            const val = parts.slice(1).join('_');
            const inputVal = (body[colName] ?? body[colName.toLowerCase()]) || '';
            vec.push(String(inputVal) === val ? 1 : 0);
            continue;
          }
          // fallback
          vec.push(0);
        }

        // dot product
        let pred = 0;
        for (let i = 0; i < coef.length && i < vec.length; i++) pred += coef[i] * vec[i];
        return NextResponse.json({ success: true, data: { prediction: pred } });
      } catch (e) {
        console.error('JS model prediction failed', e);
        // fallthrough to python attempt
      }
    }

    // fallback: spawn python predictor if available
    const scriptPath = path.join(repoRoot, 'ml', 'predict_price.py');
    const pythonCmd = process.env.PYTHON || 'python';

    return await new Promise((resolve) => {
      const py = spawn(pythonCmd, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      py.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

      py.on('close', (code) => {
        if (code !== 0) {
          console.error('Python predictor stderr:', stderr);
          resolve(NextResponse.json({ success: false, error: stderr || 'predictor error' }, { status: 500 }));
          return;
        }
        try {
          const parsed = JSON.parse(stdout);
          resolve(NextResponse.json({ success: true, data: parsed }));
        } catch (err) {
          console.error('Failed to parse predictor output', err, stdout);
          resolve(NextResponse.json({ success: false, error: 'invalid predictor output' }, { status: 500 }));
        }
      });

      // send input JSON via stdin
      try {
        py.stdin.write(JSON.stringify(body));
        py.stdin.end();
      } catch (e) {
        console.error('Error writing to python stdin', e);
      }
    });
  } catch (err) {
    console.error('Price predict API error', err);
    return NextResponse.json({ success: false, error: 'server error' }, { status: 500 });
  }
}
