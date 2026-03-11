import { createClient } from '@supabase/supabase-js';

// These variables are automatically injected by the Supabase integration
// If you see an error about supabaseUrl being required, please ensure:
// 1. You have completed the Supabase integration setup
// 2. You have restarted the application using the "Restart" button
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please check your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseAnonKey || 'your-anon-key'
);
