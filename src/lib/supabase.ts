import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
export async function initializeSupabaseSchema() {
  try {
    console.log('Checking Supabase schema...');
    
    // Check if tables exist by trying to fetch from them
    const { data, error } = await supabase
      .from('encroachment_requests')
      .select('count')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('Tables do not exist. Please run the SQL schema in Supabase dashboard.');
      return { success: false, message: 'Please create tables in Supabase dashboard' };
    }
    
    console.log('Supabase schema is ready');
    return { success: true };
  } catch (error) {
    console.error('Supabase initialization error:', error);
    return { success: false, error };
  }
}