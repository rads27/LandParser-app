const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  });
  return env;
}

const envPathLocal = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
const envVars = Object.assign({}, loadEnv(envPath), loadEnv(envPathLocal));

const pool = new Pool({
  user: process.env.DB_USER || envVars.DB_USER || 'postgres',
  host: process.env.DB_HOST || envVars.DB_HOST || 'localhost',
  database: process.env.DB_NAME || envVars.DB_NAME || 'landparser_db',
  password: process.env.DB_PASSWORD || envVars.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || envVars.DB_PORT || '5432', 10),
});

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i]);
    if (fields.length === 0) continue;
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = fields[j] !== undefined ? fields[j] : '';
    }
    rows.push(obj);
  }
  return rows;
}

function parseLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result.map(s => s.trim());
}

async function run() {
  const fileArg = process.argv.find(a => a.startsWith('--file='));
  const csvFile = fileArg ? fileArg.split('=')[1] : 'land_parser_full_500_records.csv';
  const csvPath = path.resolve(process.cwd(), csvFile);
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found at', csvPath);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);
  if (rows.length === 0) {
    console.log('No rows found in CSV.');
    return;
  }

  const client = await pool.connect();
  try {
    console.log(`Importing ${rows.length} rows from ${csvFile}...`);
    for (const r of rows) {
      // Normalize keys (case-insensitive)
      const keys = Object.keys(r);
      const mapKey = name => keys.find(k => k.toLowerCase() === name.toLowerCase());
      const plotNoKey = mapKey('plot_no') || mapKey('Plot_ID') || mapKey('Plot_ID') || mapKey('PlotId') || mapKey('Plot No') || mapKey('plot');
      const latKey = mapKey('latitude') || mapKey('lat');
      const lonKey = mapKey('longitude') || mapKey('lon') || mapKey('lng');
      const ownerKey = mapKey('owner_name') || mapKey('owner');
      const purchaseKey = mapKey('purchase_value') || mapKey('purchasevalue') || mapKey('purchase_value_inr');
      const marketKey = mapKey('market_value') || mapKey('marketvalue');
      const soilKey = mapKey('soil_type') || mapKey('soil');
      const areaKey = mapKey('area');

      const plotNo = plotNoKey ? r[plotNoKey] : '';
      const lat = latKey ? parseFloat(r[latKey]) : null;
      const lon = lonKey ? parseFloat(r[lonKey]) : null;
      const owner = ownerKey ? r[ownerKey] : null;
      const purchase = purchaseKey ? (r[purchaseKey] ? parseFloat(r[purchaseKey]) : null) : null;
      const market = marketKey ? (r[marketKey] ? parseFloat(r[marketKey]) : null) : null;
      const soil = soilKey ? r[soilKey] : null;
      const area = areaKey ? (r[areaKey] ? parseFloat(r[areaKey]) : null) : null;

      const coordinates = (lat !== null && !Number.isNaN(lat) && lon !== null && !Number.isNaN(lon))
        ? { type: 'Point', coordinates: [lon, lat] }
        : null;

      // Upsert by plot_no (requires unique index on plot_no)
      const q = `
        INSERT INTO land_plots (plot_no, coordinates, predicted_price, owner_name, soil_type, area)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (plot_no) DO UPDATE
        SET coordinates = EXCLUDED.coordinates,
            predicted_price = COALESCE(EXCLUDED.predicted_price, land_plots.predicted_price),
            owner_name = COALESCE(EXCLUDED.owner_name, land_plots.owner_name),
            soil_type = COALESCE(EXCLUDED.soil_type, land_plots.soil_type),
            area = COALESCE(EXCLUDED.area, land_plots.area)
        RETURNING id`;

      const params = [plotNo || null, coordinates ? JSON.stringify(coordinates) : null, market || purchase || null, owner, soil, area];
      try {
        await client.query(q, params);
      } catch (err) {
        console.warn('Import row failed for plot_no=', plotNo, err.message || err);
      }
    }

    console.log('Import finished.');
  } catch (err) {
    console.error('Error importing CSV:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
