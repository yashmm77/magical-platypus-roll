import { createClient } from '@supabase/supabase-js';

// Use provided credentials as primary values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oeptrkzeixrkvmfygdwj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcHRya3plaXhya3ZtZnlnZHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTk1NDAsImV4cCI6MjA4ODc5NTU0MH0.ig-rGHCGFPExIGS0BKk2iz1uCb1Mctk-RV38LUhFC_U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});