'use client';

import { useEffect } from 'react';
import { initializeDatabase } from '@/lib/database';

export default function DatabaseInitializer() {
  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('Client: Initializing database...');
        await initializeDatabase();
        console.log('Client: Database initialized successfully');
      } catch (error) {
        console.error('Client: Database initialization failed:', error);
        // Try via API as fallback
        try {
          const response = await fetch('/api/init-db', { method: 'POST' });
          const result = await response.json();
          if (result.success) {
            console.log('Client: Database initialized successfully via API');
          } else {
            console.error('Client: Database initialization failed via API:', result.error);
          }
        } catch (apiError) {
          console.error('Client: API fallback also failed:', apiError);
        }
      }
    };

    initDB();
  }, []);

  return null; // This component renders nothing
}