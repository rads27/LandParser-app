// Application-wide constants and configuration

/**
 * File upload configuration
 */
export const FILE_UPLOAD_CONFIG = {
  // Maximum file size in bytes (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  
  // Maximum file size in MB for display
  MAX_FILE_SIZE_MB: 5,
  
  // Allowed file types
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  
  // Allowed file extensions
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

/**
 * Polling intervals in milliseconds
 */
export const POLLING_INTERVALS = {
  USER_SUBMISSIONS: 10000,      // 10 seconds
  ADMIN_REQUESTS: 10000,        // 10 seconds
  ADMIN_STATS: 30000,           // 30 seconds
  ADMIN_NOTIFICATIONS: 30000,   // 30 seconds
};

/**
 * Notification configuration
 */
export const NOTIFICATION_CONFIG = {
  MAX_NOTIFICATIONS: 50,        // Maximum notifications to keep in store
};

/**
 * Authentication configuration
 */
export const AUTH_CONFIG = {
  TOKEN_EXPIRY: '24h',
  JWT_SECRET_FALLBACK: 'fallback-secret', // Should be replaced with env var
};
