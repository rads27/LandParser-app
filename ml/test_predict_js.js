const fs = require('fs');
const path = require('path');

const modelPath = path.join(process.cwd(), 'ml', 'models', 'js_price_model.json');
if (!fs.existsSync(modelPath)) { console.error('model not found'); process.exit(2); }
const m = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
const { featureNames, coef, encoders, areaCol } = m;
function toNumber(v){ if (v==null) return NaN; if (typeof v==='number') return v; const s=String(v).replace(/[₹,\s]/g,'').replace(/[^0-9.\-]/g,''); const n=Number(s); return Number.isFinite(n)?n:NaN; }
const body = { area_m2: 8.45, Land_Type: 'Agricultural', Soil_Type: 'Black Cotton' };
const vec = [];
for (const fname of featureNames) {
  if (fname==='bias') { vec.push(1); continue; }
  if (fname===areaCol) { vec.push(toNumber(body.area_m2 || body.area || body.areaSize)); continue; }
  const parts = fname.split('_');
  if (parts.length>=2) {
    const colName = parts[0]; const val = parts.slice(1).join('_'); const inputVal = (body[colName]||body[colName.toLowerCase()])||''; vec.push(String(inputVal)===val?1:0); continue;
  }
  vec.push(0);
}
let pred=0; for (let i=0;i<coef.length && i<vec.length;i++) pred+=coef[i]*vec[i];
console.log('prediction', pred);
