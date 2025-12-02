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

async function run() {
  const client = await pool.connect();
  try {
    const countRes = await client.query('SELECT COUNT(*)::int as cnt FROM land_plots');
    console.log('land_plots count:', countRes.rows[0].cnt);

    const sampleRes = await client.query('SELECT plot_no, coordinates FROM land_plots LIMIT 5');
    console.log('sample rows:');
    sampleRes.rows.forEach(r => console.log(JSON.stringify(r)));
  } catch (err) {
    console.error('Error running verification queries:', err.message || err);
    process.exitCode = 2;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
