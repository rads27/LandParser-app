/**
 * Environment configuration helper
 * Validates and provides type-safe access to environment variables
 */

export const config = {
  database: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    name: process.env.DB_NAME || 'landparser_db',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
  },
  
  auth: {
    jwtSecret: process.env.JWT_SECRET || '',
  },
  
  node: {
    env: process.env.NODE_ENV || 'development',
  },
};

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return !!(
    config.database.user &&
    config.database.host &&
    config.database.name &&
    config.database.password
  );
}

/**
 * Check if we should use database (vs in-memory storage)
 */
export function shouldUseDatabase(): boolean {
  // Use database if DB_PASSWORD is set (indicates intentional configuration)
  return !!process.env.DB_PASSWORD;
}

/**
 * Get warnings for missing configuration
 */
export function getConfigWarnings(): string[] {
  const warnings: string[] = [];

  if (!process.env.JWT_SECRET) {
    warnings.push('JWT_SECRET not set - using fallback (insecure for production)');
  }

  if (!isDatabaseConfigured()) {
    warnings.push('Database not configured - using in-memory storage (data will not persist)');
  }

  return warnings;
}
