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

// Load .env.local or .env if present
const envPathLocal = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
const envVars = Object.assign({}, loadEnv(envPath), loadEnv(envPathLocal));

let pool = new Pool({
  user: process.env.DB_USER || envVars.DB_USER || 'postgres',
  host: process.env.DB_HOST || envVars.DB_HOST || 'localhost',
  database: process.env.DB_NAME || envVars.DB_NAME || 'landparser_db',
  password: process.env.DB_PASSWORD || envVars.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || envVars.DB_PORT || '5432', 10),
});

const DB_CONFIG = {
  user: process.env.DB_USER || envVars.DB_USER || 'postgres',
  host: process.env.DB_HOST || envVars.DB_HOST || 'localhost',
  database: process.env.DB_NAME || envVars.DB_NAME || 'landparser_db',
  password: process.env.DB_PASSWORD || envVars.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || envVars.DB_PORT || '5432', 10),
};

async function run() {
  let client;
  try {
    client = await pool.connect();
  } catch (connectErr) {
    // If the database does not exist (Postgres error code 3D000), try creating it
    if (connectErr && (connectErr.code === '3D000' || /does not exist/.test(connectErr.message || ''))) {
      console.log(`Database "${DB_CONFIG.database}" does not exist. Attempting to create it...`);
      // Connect to default 'postgres' database to create the target database
      const adminDb = Object.assign({}, DB_CONFIG, { database: 'postgres' });
      const adminPool = new Pool(adminDb);
      try {
        const adminClient = await adminPool.connect();
        try {
          await adminClient.query(`CREATE DATABASE "${DB_CONFIG.database}"`);
          console.log(`Created database ${DB_CONFIG.database}`);
        } finally {
          adminClient.release();
        }
      } catch (adminErr) {
        console.error('Failed to create database:', adminErr.message || adminErr);
        process.exit(1);
      } finally {
        await adminPool.end();
      }

      // Recreate pool connected to the newly created database
      pool = new Pool(DB_CONFIG);
      client = await pool.connect();
    } else {
      console.error('Failed to connect to database:', connectErr.message || connectErr);
      process.exit(1);
    }
  }
  try {
    const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('database/schema.sql not found');
      process.exit(1);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema from database/schema.sql...');
    // Attempt to run the full SQL; pg supports multiple statements
    await client.query(sql);
    console.log('Schema applied.');

    // Migration: if old table encroachment_requests exists, migrate rows
    const checkRes = await client.query("SELECT to_regclass('public.encroachment_requests') as name");
    if (checkRes.rows[0] && checkRes.rows[0].name) {
      console.log('Found legacy table encroachment_requests — migrating rows into encroachment_submissions');
      const migrateSql = `
        INSERT INTO encroachment_submissions (user_email, file_name, file_data, status, admin_notes, created_at, updated_at)
        SELECT user_email, file_name, COALESCE(file_path, '') as file_data, status, admin_notes, created_at, updated_at
        FROM encroachment_requests
        RETURNING id`;
      const res = await client.query(migrateSql);
      console.log(`Migrated ${res.rowCount} rows from encroachment_requests -> encroachment_submissions`);
    } else {
      console.log('No legacy encroachment_requests table found.');
    }

    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Error initializing database:', err.message || err);
    process.exitCode = 2;
  } finally {
    try { if (client) client.release(); } catch (_) {}
    try { await pool.end(); } catch (_) {}
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
